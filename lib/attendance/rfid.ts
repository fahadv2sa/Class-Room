import type {
  AuthContext,
} from '@/lib/auth/session'
import type {
  RFIDScanDirection,
  RFIDScanStatus,
  StudentAttendanceStatus,
} from '@prisma/client'
import { assertSameSchool } from '@/lib/academic/access'
import { runOperationalIntelligenceForSchool } from '@/lib/intelligence/rules'
import { prisma } from '@/lib/prisma'

const DUPLICATE_WINDOW_MS = 10_000

export type ProcessRFIDScanInput = {
  auth: AuthContext
  classroomDeviceId?: string | null
  deviceCode?: string | null
  cardCode: string
  scanDirection?: string | null
  scannedAt?: string | Date | null
  sourceEventId?: string | null
  notes?: string | null
}

export function normalizeCardCode(value: unknown) {
  const code = String(value ?? '').trim().toUpperCase()
  if (!/^(STD|TCH)-\d{8}$/.test(code)) {
    throw new Response('cardCode must use STD-######## or TCH-######## format', { status: 400 })
  }
  return code
}

export function normalizeScanDirection(value: unknown): RFIDScanDirection {
  const direction = String(value ?? 'UNKNOWN').trim().toUpperCase()
  if (direction === 'ENTRY' || direction === 'EXIT' || direction === 'UNKNOWN') return direction
  throw new Response('scanDirection must be ENTRY, EXIT, or UNKNOWN', { status: 400 })
}

export function dateFromInput(value: unknown) {
  if (value === undefined || value === null || value === '') return new Date()
  const date = new Date(String(value))
  if (Number.isNaN(date.getTime())) throw new Response('Invalid scannedAt value', { status: 400 })
  return date
}

export function sessionDate(value: Date) {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()))
}

async function closeStaleOpenSessions(schoolId: string, classroomId: string, currentSessionDate: Date, closedAt: Date) {
  await prisma.classroomAttendanceSession.updateMany({
    where: {
      schoolId,
      classroomId,
      status: 'OPEN',
      sessionDate: { not: currentSessionDate },
    },
    data: {
      status: 'CLOSED',
      closedAt,
    },
  })
}

export async function ensureAttendanceRecords(sessionId: string, schoolId: string, classroomId: string) {
  const students = await prisma.student.findMany({
    where: {
      schoolId,
      classroomId,
      status: 'ACTIVE',
    },
    select: { id: true },
  })

  if (!students.length) return

  await prisma.studentAttendanceRecord.createMany({
    data: students.map((student) => ({
      schoolId,
      attendanceSessionId: sessionId,
      classroomId,
      studentId: student.id,
      status: 'ABSENT',
    })),
    skipDuplicates: true,
  })
}

export async function findOrCreateOpenSession({
  schoolId,
  classroomId,
  classroomDeviceId,
  teacherId,
  at,
}: {
  schoolId: string
  classroomId: string
  classroomDeviceId: string
  teacherId?: string | null
  at: Date
}) {
  const currentSessionDate = sessionDate(at)
  await closeStaleOpenSessions(schoolId, classroomId, currentSessionDate, at)

  const existing = await prisma.classroomAttendanceSession.findFirst({
    where: { schoolId, classroomId, status: 'OPEN', sessionDate: currentSessionDate },
  })

  if (existing) {
    await ensureAttendanceRecords(existing.id, schoolId, classroomId)
    return existing
  }

  const academicYear = await prisma.academicYear.findFirst({
    where: { schoolId, isActive: true },
    orderBy: { startDate: 'desc' },
  })
  if (!academicYear) throw new Response('No active academic year found for school', { status: 400 })

  const created = await prisma.classroomAttendanceSession.create({
    data: {
      schoolId,
      academicYearId: academicYear.id,
      classroomId,
      classroomDeviceId,
      teacherId: teacherId ?? null,
      sessionDate: currentSessionDate,
      status: 'OPEN',
      openedAt: at,
    },
  })

  await ensureAttendanceRecords(created.id, schoolId, classroomId)
  return created
}

async function findOpenSessionForDate(schoolId: string, classroomId: string, at: Date) {
  const currentSessionDate = sessionDate(at)
  await closeStaleOpenSessions(schoolId, classroomId, currentSessionDate, at)

  return prisma.classroomAttendanceSession.findFirst({
    where: {
      schoolId,
      classroomId,
      status: 'OPEN',
      sessionDate: currentSessionDate,
    },
  })
}

async function attendanceStatusForEntry(schoolId: string, openedAt: Date, scannedAt: Date): Promise<StudentAttendanceStatus> {
  const settings = await prisma.schoolSettings.findUnique({
    where: { schoolId },
    select: { lateThresholdMinutes: true },
  })
  const threshold = settings?.lateThresholdMinutes ?? 10
  const lateAt = openedAt.getTime() + threshold * 60_000
  return scannedAt.getTime() > lateAt ? 'LATE' : 'PRESENT'
}

async function updateStudentPresenceFromScan({
  eventId,
  schoolId,
  classroomId,
  studentId,
  attendanceSessionId,
  scanDirection,
  scannedAt,
}: {
  eventId: string
  schoolId: string
  classroomId: string
  studentId: string
  attendanceSessionId: string
  scanDirection: RFIDScanDirection
  scannedAt: Date
}) {
  if (scanDirection === 'ENTRY') {
    const openMovement = await prisma.studentMovementRecord.findFirst({
      where: {
        schoolId,
        classroomId,
        studentId,
        attendanceSessionId,
        status: 'OPEN',
      },
      orderBy: { exitedAt: 'desc' },
    })

    if (openMovement) {
      await prisma.studentMovementRecord.update({
        where: { id: openMovement.id },
        data: {
          returnScanEventId: eventId,
          returnedAt: scannedAt,
          durationMinutes: Math.max(0, Math.round((scannedAt.getTime() - openMovement.exitedAt.getTime()) / 60_000)),
          status: 'CLOSED',
        },
      })
    }

    await prisma.studentPresenceState.upsert({
      where: {
        attendanceSessionId_studentId: {
          attendanceSessionId,
          studentId,
        },
      },
      update: {
        currentState: 'INSIDE_CLASSROOM',
        enteredAt: scannedAt,
        lastScanEventId: eventId,
      },
      create: {
        schoolId,
        classroomId,
        studentId,
        attendanceSessionId,
        currentState: 'INSIDE_CLASSROOM',
        enteredAt: scannedAt,
        totalExits: 0,
        lastScanEventId: eventId,
      },
    })
  } else if (scanDirection === 'EXIT') {
    await prisma.studentMovementRecord.create({
      data: {
        schoolId,
        classroomId,
        studentId,
        attendanceSessionId,
        exitScanEventId: eventId,
        exitedAt: scannedAt,
        status: 'OPEN',
      },
    })

    await prisma.studentPresenceState.upsert({
      where: {
        attendanceSessionId_studentId: {
          attendanceSessionId,
          studentId,
        },
      },
      update: {
        currentState: 'OUTSIDE_CLASSROOM',
        exitedAt: scannedAt,
        totalExits: { increment: 1 },
        lastScanEventId: eventId,
      },
      create: {
        schoolId,
        classroomId,
        studentId,
        attendanceSessionId,
        currentState: 'OUTSIDE_CLASSROOM',
        exitedAt: scannedAt,
        totalExits: 1,
        lastScanEventId: eventId,
      },
    })
  }
}

async function deriveStudentScanDirection(attendanceSessionId: string, studentId: string): Promise<RFIDScanDirection> {
  const presenceState = await prisma.studentPresenceState.findUnique({
    where: {
      attendanceSessionId_studentId: {
        attendanceSessionId,
        studentId,
      },
    },
    select: { currentState: true },
  })

  return presenceState?.currentState === 'INSIDE_CLASSROOM' ? 'EXIT' : 'ENTRY'
}

async function deriveTeacherScanDirection(classroomId: string, teacherId: string): Promise<RFIDScanDirection> {
  const presenceState = await prisma.teacherPresenceState.findUnique({
    where: {
      classroomId_teacherId: {
        classroomId,
        teacherId,
      },
    },
    select: { currentState: true },
  })

  return presenceState?.currentState === 'INSIDE_CLASSROOM' ? 'EXIT' : 'ENTRY'
}

async function updateTeacherPresenceFromScan({
  eventId,
  schoolId,
  classroomId,
  teacherId,
  scanDirection,
  scannedAt,
}: {
  eventId: string
  schoolId: string
  classroomId: string
  teacherId: string
  scanDirection: RFIDScanDirection
  scannedAt: Date
}) {
  if (scanDirection === 'ENTRY') {
    await prisma.teacherMovementRecord.create({
      data: {
        schoolId,
        classroomId,
        teacherId,
        entryScanEventId: eventId,
        enteredAt: scannedAt,
        status: 'INSIDE',
      },
    })

    await prisma.teacherPresenceState.upsert({
      where: {
        classroomId_teacherId: {
          classroomId,
          teacherId,
        },
      },
      update: {
        currentState: 'INSIDE_CLASSROOM',
        enteredAt: scannedAt,
        lastScanEventId: eventId,
      },
      create: {
        schoolId,
        classroomId,
        teacherId,
        currentState: 'INSIDE_CLASSROOM',
        enteredAt: scannedAt,
        lastScanEventId: eventId,
      },
    })
  } else if (scanDirection === 'EXIT') {
    const openTeacherMovement = await prisma.teacherMovementRecord.findFirst({
      where: {
        schoolId,
        classroomId,
        teacherId,
        status: 'INSIDE',
      },
      orderBy: { enteredAt: 'desc' },
    })

    if (openTeacherMovement) {
      await prisma.teacherMovementRecord.update({
        where: { id: openTeacherMovement.id },
        data: {
          exitScanEventId: eventId,
          exitedAt: scannedAt,
          status: 'OUTSIDE',
        },
      })
    } else {
      await prisma.teacherMovementRecord.create({
        data: {
          schoolId,
          classroomId,
          teacherId,
          exitScanEventId: eventId,
          exitedAt: scannedAt,
          status: 'OUTSIDE',
        },
      })
    }

    await prisma.teacherPresenceState.upsert({
      where: {
        classroomId_teacherId: {
          classroomId,
          teacherId,
        },
      },
      update: {
        currentState: 'OUTSIDE_CLASSROOM',
        exitedAt: scannedAt,
        lastScanEventId: eventId,
      },
      create: {
        schoolId,
        classroomId,
        teacherId,
        currentState: 'OUTSIDE_CLASSROOM',
        exitedAt: scannedAt,
        lastScanEventId: eventId,
      },
    })
  }
}

async function createScanEvent({
  schoolId,
  classroomDeviceId,
  classroomId,
  cardCredentialId,
  cardCode,
  actorType,
  studentId,
  teacherId,
  scanDirection,
  scanStatus,
  scannedAt,
  sourceEventId,
  duplicateOfEventId,
  notes,
}: {
  schoolId: string
  classroomDeviceId: string
  classroomId: string
  cardCredentialId?: string | null
  cardCode: string
  actorType: 'STUDENT' | 'TEACHER' | 'UNKNOWN'
  studentId?: string | null
  teacherId?: string | null
  scanDirection: RFIDScanDirection
  scanStatus: RFIDScanStatus
  scannedAt: Date
  sourceEventId?: string | null
  duplicateOfEventId?: string | null
  notes?: string | null
}) {
  return prisma.rFIDScanEvent.create({
    data: {
      schoolId,
      classroomDeviceId,
      classroomId,
      cardCredentialId: cardCredentialId ?? null,
      cardCode,
      actorType,
      studentId: studentId ?? null,
      teacherId: teacherId ?? null,
      scanDirection,
      scanStatus,
      scannedAt,
      sourceEventId: sourceEventId || null,
      duplicateOfEventId: duplicateOfEventId ?? null,
      notes: notes || null,
    },
  })
}

export async function processRFIDScan(input: ProcessRFIDScanInput) {
  const cardCode = normalizeCardCode(input.cardCode)
  normalizeScanDirection(input.scanDirection)
  const scannedAt = dateFromInput(input.scannedAt)
  const sourceEventId = String(input.sourceEventId ?? '').trim() || null

  const device = await prisma.classroomDevice.findFirstOrThrow({
    where: input.classroomDeviceId
      ? { id: input.classroomDeviceId }
      : { deviceCode: String(input.deviceCode ?? '').trim().toUpperCase() },
    include: { classroom: true },
  })
  assertSameSchool(input.auth, device.schoolId)

  if (sourceEventId) {
    const sourceDuplicate = await prisma.rFIDScanEvent.findFirst({
      where: {
        classroomDeviceId: device.id,
        sourceEventId,
      },
    })

    if (sourceDuplicate) {
      const event = await createScanEvent({
        schoolId: device.schoolId,
        classroomDeviceId: device.id,
        classroomId: device.classroomId,
        cardCode,
        actorType: 'UNKNOWN',
        scanDirection: sourceDuplicate.scanDirection,
        scanStatus: 'DUPLICATE_IGNORED',
        scannedAt,
        sourceEventId,
        duplicateOfEventId: sourceDuplicate.id,
        notes: input.notes,
      })
      return { event, scanStatus: event.scanStatus, duplicate: true, attendanceSession: null, attendanceRecord: null }
    }
  } else {
    const windowDuplicate = await prisma.rFIDScanEvent.findFirst({
      where: {
        classroomDeviceId: device.id,
        cardCode,
        scanStatus: { not: 'DUPLICATE_IGNORED' },
        scannedAt: {
          gte: new Date(scannedAt.getTime() - DUPLICATE_WINDOW_MS),
          lte: new Date(scannedAt.getTime() + DUPLICATE_WINDOW_MS),
        },
      },
      orderBy: { scannedAt: 'desc' },
    })

    if (windowDuplicate) {
      const event = await createScanEvent({
        schoolId: device.schoolId,
        classroomDeviceId: device.id,
        classroomId: device.classroomId,
        cardCode,
        actorType: 'UNKNOWN',
        scanDirection: windowDuplicate.scanDirection,
        scanStatus: 'DUPLICATE_IGNORED',
        scannedAt,
        duplicateOfEventId: windowDuplicate.id,
        notes: input.notes,
      })
      return { event, scanStatus: event.scanStatus, duplicate: true, attendanceSession: null, attendanceRecord: null }
    }
  }

  const credential = await prisma.cardCredential.findUnique({
    where: { cardCode },
    include: { student: true, teacher: true },
  })

  let scanStatus: RFIDScanStatus = 'ACCEPTED'
  let actorType: 'STUDENT' | 'TEACHER' | 'UNKNOWN' = 'UNKNOWN'
  let studentId: string | null = null
  let teacherId: string | null = null

  if (!credential) {
    scanStatus = 'UNKNOWN_CARD'
  } else if (credential.schoolId !== device.schoolId) {
    scanStatus = 'WRONG_SCHOOL'
  } else if (credential.status !== 'ACTIVE') {
    scanStatus = 'INACTIVE_CARD'
  } else if (credential.holderType === 'STUDENT') {
    actorType = 'STUDENT'
    studentId = credential.studentId
    if (credential.student?.classroomId !== device.classroomId) scanStatus = 'WRONG_CLASSROOM'
  } else if (credential.holderType === 'TEACHER') {
    actorType = 'TEACHER'
    teacherId = credential.teacherId
  }

  if (scanStatus !== 'ACCEPTED') {
    const event = await createScanEvent({
      schoolId: device.schoolId,
      classroomDeviceId: device.id,
      classroomId: device.classroomId,
      cardCredentialId: credential?.id,
      cardCode,
      actorType,
      studentId,
      teacherId,
      scanDirection: 'UNKNOWN',
      scanStatus,
      scannedAt,
      sourceEventId,
      notes: input.notes,
    })

    return { event, scanStatus, duplicate: false, attendanceSession: null, attendanceRecord: null }
  }

  if (actorType === 'TEACHER' && teacherId) {
    const attendanceSession = await findOpenSessionForDate(device.schoolId, device.classroomId, scannedAt)
    const scanDirection = await deriveTeacherScanDirection(device.classroomId, teacherId)

    const event = await createScanEvent({
      schoolId: device.schoolId,
      classroomDeviceId: device.id,
      classroomId: device.classroomId,
      cardCredentialId: credential?.id,
      cardCode,
      actorType,
      studentId,
      teacherId,
      scanDirection,
      scanStatus,
      scannedAt,
      sourceEventId,
      notes: input.notes,
    })

    await updateTeacherPresenceFromScan({
      eventId: event.id,
      schoolId: device.schoolId,
      classroomId: device.classroomId,
      teacherId,
      scanDirection,
      scannedAt,
    })

    if (scanDirection === 'ENTRY' && attendanceSession && !attendanceSession.teacherId) {
      const updatedSession = await prisma.classroomAttendanceSession.update({
        where: { id: attendanceSession.id },
        data: { teacherId },
      })
      return { event, scanStatus, duplicate: false, attendanceSession: updatedSession, attendanceRecord: null }
    }

    return { event, scanStatus, duplicate: false, attendanceSession, attendanceRecord: null }
  }

  if (actorType === 'STUDENT' && studentId) {
    const attendanceSession = await findOrCreateOpenSession({
      schoolId: device.schoolId,
      classroomId: device.classroomId,
      classroomDeviceId: device.id,
      at: scannedAt,
    })
    const scanDirection = await deriveStudentScanDirection(attendanceSession.id, studentId)

    const event = await createScanEvent({
      schoolId: device.schoolId,
      classroomDeviceId: device.id,
      classroomId: device.classroomId,
      cardCredentialId: credential?.id,
      cardCode,
      actorType,
      studentId,
      teacherId,
      scanDirection,
      scanStatus,
      scannedAt,
      sourceEventId,
      notes: input.notes,
    })

    const entryStatus = await attendanceStatusForEntry(device.schoolId, attendanceSession.openedAt, scannedAt)

    const attendanceRecord = await prisma.studentAttendanceRecord.upsert({
      where: {
        attendanceSessionId_studentId: {
          attendanceSessionId: attendanceSession.id,
          studentId,
        },
      },
      update: {
        status: scanDirection === 'ENTRY' ? entryStatus : undefined,
        firstEntryAt: scanDirection === 'ENTRY' ? scannedAt : undefined,
        lastExitAt: scanDirection === 'EXIT' ? scannedAt : undefined,
        scanCount: { increment: 1 },
      },
      create: {
        schoolId: device.schoolId,
        attendanceSessionId: attendanceSession.id,
        classroomId: device.classroomId,
        studentId,
        status: scanDirection === 'ENTRY' ? entryStatus : 'ABSENT',
        firstEntryAt: scanDirection === 'ENTRY' ? scannedAt : null,
        lastExitAt: scanDirection === 'EXIT' ? scannedAt : null,
        scanCount: 1,
      },
    })

    await updateStudentPresenceFromScan({
      eventId: event.id,
      schoolId: device.schoolId,
      classroomId: device.classroomId,
      studentId,
      attendanceSessionId: attendanceSession.id,
      scanDirection,
      scannedAt,
    })

    await runOperationalIntelligenceForSchool(device.schoolId)

    return { event, scanStatus, duplicate: false, attendanceSession, attendanceRecord }
  }

  const event = await createScanEvent({
    schoolId: device.schoolId,
    classroomDeviceId: device.id,
    classroomId: device.classroomId,
    cardCredentialId: credential?.id,
    cardCode,
    actorType,
    studentId,
    teacherId,
    scanDirection: 'UNKNOWN',
    scanStatus,
    scannedAt,
    sourceEventId,
    notes: input.notes,
  })
  return { event, scanStatus, duplicate: false, attendanceSession: null, attendanceRecord: null }
}
