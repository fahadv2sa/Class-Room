import {
  type AlertSeverity,
  type AlertSourceType,
  type AlertType,
  type InsightSeverity,
  type InsightType,
  Prisma,
} from '@prisma/client'
import { scopedSchoolId } from '@/lib/academic/access'
import type { AuthContext } from '@/lib/auth/session'
import { prisma } from '@/lib/prisma'
import { defaultSchoolSettings } from '@/lib/settings/defaults'

const LOOKBACK_DAYS = 30

type AlertInput = {
  schoolId: string
  classroomId?: string | null
  teacherId?: string | null
  studentId?: string | null
  deviceId?: string | null
  alertType: AlertType
  severity: AlertSeverity
  title: string
  description: string
  sourceType: AlertSourceType
  sourceKey: string
  createdAt?: Date
}

type InsightInput = {
  schoolId: string
  classroomId?: string | null
  teacherId?: string | null
  studentId?: string | null
  insightType: InsightType
  severity: InsightSeverity
  title: string
  description: string
  score?: number | null
  sourceKey: string
  detectedAt?: Date
}

function lookbackDate() {
  const date = new Date()
  date.setDate(date.getDate() - LOOKBACK_DAYS)
  return date
}

async function targetSchoolIds(auth: AuthContext, requestedSchoolId?: string | null) {
  const schoolId = scopedSchoolId(auth, requestedSchoolId)
  if (schoolId) return [schoolId]

  const schools = await prisma.school.findMany({
    where: { status: 'ACTIVE' },
    select: { id: true },
  })
  return schools.map((school) => school.id)
}

async function getSettings(schoolId: string) {
  const settings = await prisma.schoolSettings.findUnique({ where: { schoolId } })
  return settings ?? { ...defaultSchoolSettings, schoolId }
}

async function upsertAlert(input: AlertInput) {
  await prisma.alert.upsert({
    where: { sourceKey: input.sourceKey },
    create: {
      schoolId: input.schoolId,
      classroomId: input.classroomId,
      teacherId: input.teacherId,
      studentId: input.studentId,
      deviceId: input.deviceId,
      alertType: input.alertType,
      severity: input.severity,
      title: input.title,
      description: input.description,
      sourceType: input.sourceType,
      sourceKey: input.sourceKey,
      createdAt: input.createdAt,
    },
    update: {
      title: input.title,
      description: input.description,
      severity: input.severity,
    },
  })
}

async function upsertInsight(input: InsightInput) {
  const detectedAt = input.detectedAt ?? new Date()
  await prisma.insight.upsert({
    where: { sourceKey: input.sourceKey },
    create: {
      schoolId: input.schoolId,
      classroomId: input.classroomId,
      teacherId: input.teacherId,
      studentId: input.studentId,
      insightType: input.insightType,
      severity: input.severity,
      title: input.title,
      description: input.description,
      score: input.score,
      sourceKey: input.sourceKey,
      firstDetectedAt: detectedAt,
      lastDetectedAt: detectedAt,
    },
    update: {
      title: input.title,
      description: input.description,
      severity: input.severity,
      score: input.score,
      lastDetectedAt: detectedAt,
    },
  })
}

async function runAttendanceRules(schoolId: string) {
  const settings = await getSettings(schoolId)
  if (!settings.attendanceAlertsEnabled) return

  const since = lookbackDate()
  const records = await prisma.studentAttendanceRecord.findMany({
    where: {
      schoolId,
      status: { in: ['LATE', 'ABSENT'] },
      updatedAt: { gte: since },
    },
    include: {
      student: { select: { fullNameAr: true, fullNameEn: true, studentNumber: true } },
      classroom: { select: { classroomCode: true } },
      attendanceSession: { select: { sessionDate: true } },
    },
    take: 250,
    orderBy: { updatedAt: 'desc' },
  })

  await Promise.all(
    records.map((record) => {
      const isLate = record.status === 'LATE'
      const studentName = record.student.fullNameEn || record.student.fullNameAr || record.student.studentNumber
      return upsertAlert({
        schoolId,
        classroomId: record.classroomId,
        studentId: record.studentId,
        alertType: isLate ? 'STUDENT_LATE' : 'STUDENT_ABSENT',
        severity: isLate ? 'WARNING' : 'CRITICAL',
        title: isLate ? 'Student late' : 'Student absent',
        description: `${studentName} in ${record.classroom.classroomCode} was marked ${record.status.toLowerCase()}.`,
        sourceType: 'ATTENDANCE',
        sourceKey: `attendance:${record.status.toLowerCase()}:${record.id}`,
        createdAt: record.updatedAt,
      })
    }),
  )

  const lateGroups = await prisma.studentAttendanceRecord.groupBy({
    by: ['studentId'],
    where: {
      schoolId,
      status: 'LATE',
      updatedAt: { gte: since },
    },
    _count: { _all: true },
    having: { id: { _count: { gte: settings.lateStudentThreshold } } },
  })

  await Promise.all(
    lateGroups.map(async (group) => {
      const latest = await prisma.studentAttendanceRecord.findFirst({
        where: { schoolId, studentId: group.studentId, status: 'LATE' },
        include: {
          student: { select: { fullNameAr: true, fullNameEn: true, studentNumber: true } },
          classroom: { select: { classroomCode: true } },
        },
        orderBy: { updatedAt: 'desc' },
      })
      if (!latest) return
      const studentName = latest.student.fullNameEn || latest.student.fullNameAr || latest.student.studentNumber
      await upsertInsight({
        schoolId,
        classroomId: latest.classroomId,
        studentId: latest.studentId,
        insightType: 'RECURRING_STUDENT_LATENESS',
        severity: group._count._all >= settings.lateStudentThreshold * 2 ? 'HIGH' : 'MEDIUM',
        title: 'Recurring student lateness',
        description: `${studentName} has ${group._count._all} late attendance records in the last ${LOOKBACK_DAYS} days.`,
        score: group._count._all,
        sourceKey: `insight:attendance:late:${schoolId}:${group.studentId}`,
      })
    }),
  )
}

async function runMovementRules(schoolId: string) {
  const settings = await getSettings(schoolId)
  if (!settings.movementAlertsEnabled) return

  const since = lookbackDate()
  const sessionGroups = await prisma.studentMovementRecord.groupBy({
    by: ['attendanceSessionId', 'studentId', 'classroomId'],
    where: { schoolId, createdAt: { gte: since } },
    _count: { _all: true },
    having: { id: { _count: { gt: settings.movementThreshold } } },
  })

  await Promise.all(
    sessionGroups.map(async (group) => {
      const latest = await prisma.studentMovementRecord.findFirst({
        where: {
          schoolId,
          attendanceSessionId: group.attendanceSessionId,
          studentId: group.studentId,
          classroomId: group.classroomId,
        },
        include: {
          student: { select: { fullNameAr: true, fullNameEn: true, studentNumber: true } },
          classroom: { select: { classroomCode: true } },
        },
        orderBy: { createdAt: 'desc' },
      })
      if (!latest) return
      const studentName = latest.student.fullNameEn || latest.student.fullNameAr || latest.student.studentNumber
      await upsertAlert({
        schoolId,
        classroomId: group.classroomId,
        studentId: group.studentId,
        alertType: 'EXCESSIVE_STUDENT_EXITS',
        severity: 'WARNING',
        title: 'Excessive student exits',
        description: `${studentName} has ${group._count._all} exits from ${latest.classroom.classroomCode} in one attendance session.`,
        sourceType: 'MOVEMENT',
        sourceKey: `movement:excessive:${group.attendanceSessionId}:${group.studentId}`,
        createdAt: latest.createdAt,
      })
    }),
  )

  const movementGroups = await prisma.studentMovementRecord.groupBy({
    by: ['studentId', 'classroomId'],
    where: { schoolId, createdAt: { gte: since } },
    _count: { _all: true },
    having: { id: { _count: { gte: settings.movementThreshold * 3 } } },
  })

  await Promise.all(
    movementGroups.map(async (group) => {
      const latest = await prisma.studentMovementRecord.findFirst({
        where: { schoolId, studentId: group.studentId, classroomId: group.classroomId },
        include: {
          student: { select: { fullNameAr: true, fullNameEn: true, studentNumber: true } },
          classroom: { select: { classroomCode: true } },
        },
        orderBy: { createdAt: 'desc' },
      })
      if (!latest) return
      const studentName = latest.student.fullNameEn || latest.student.fullNameAr || latest.student.studentNumber
      await upsertInsight({
        schoolId,
        classroomId: group.classroomId,
        studentId: group.studentId,
        insightType: 'EXCESSIVE_STUDENT_MOVEMENT',
        severity: group._count._all >= settings.movementThreshold * 5 ? 'HIGH' : 'MEDIUM',
        title: 'Excessive student movement pattern',
        description: `${studentName} has ${group._count._all} movement records in the last ${LOOKBACK_DAYS} days.`,
        score: group._count._all,
        sourceKey: `insight:movement:student:${schoolId}:${group.studentId}:${group.classroomId}`,
      })
    }),
  )
}

async function runNoiseRules(schoolId: string) {
  const settings = await getSettings(schoolId)
  if (!settings.noiseAlertsEnabled) return

  const since = lookbackDate()
  const events = await prisma.noiseEvent.findMany({
    where: {
      schoolId,
      severity: 'HIGH',
      startedAt: { gte: since },
    },
    include: {
      classroom: { select: { classroomCode: true } },
      teacher: { select: { fullNameAr: true, fullNameEn: true } },
    },
    take: 250,
    orderBy: { startedAt: 'desc' },
  })

  await Promise.all(
    events.map((event) =>
      upsertAlert({
        schoolId,
        classroomId: event.classroomId,
        teacherId: event.teacherId,
        deviceId: event.classroomDeviceId,
        alertType: 'HIGH_NOISE_EVENT',
        severity: 'WARNING',
        title: 'High noise event',
        description: `${event.classroom.classroomCode} reached ${event.peakDb} dB.`,
        sourceType: 'NOISE',
        sourceKey: `noise:high:${event.id}`,
        createdAt: event.startedAt,
      }),
    ),
  )

  const noiseGroups = await prisma.noiseEvent.groupBy({
    by: ['classroomId'],
    where: {
      schoolId,
      severity: 'HIGH',
      startedAt: { gte: since },
    },
    _count: { _all: true },
    _max: { peakDb: true },
    having: { id: { _count: { gte: settings.noiseEventThreshold } } },
  })

  await Promise.all(
    noiseGroups.map(async (group) => {
      const classroom = await prisma.classroom.findUnique({
        where: { id: group.classroomId },
        select: { classroomCode: true },
      })
      await upsertInsight({
        schoolId,
        classroomId: group.classroomId,
        insightType: 'CHRONIC_CLASSROOM_NOISE',
        severity: group._count._all >= settings.noiseEventThreshold * 2 ? 'HIGH' : 'MEDIUM',
        title: 'Chronic classroom noise',
        description: `${classroom?.classroomCode ?? 'Classroom'} has ${group._count._all} high noise events in the last ${LOOKBACK_DAYS} days.`,
        score: group._max.peakDb,
        sourceKey: `insight:noise:classroom:${schoolId}:${group.classroomId}`,
      })
    }),
  )
}

async function runDeviceRules(schoolId: string) {
  const settings = await getSettings(schoolId)
  if (!settings.deviceAlertsEnabled) return

  const devices = await prisma.classroomDevice.findMany({
    where: {
      schoolId,
      connectionStatus: 'OFFLINE',
      status: 'ACTIVE',
    },
    include: { classroom: { select: { classroomCode: true } } },
  })

  await Promise.all(
    devices.map(async (device) => {
      await upsertAlert({
        schoolId,
        classroomId: device.classroomId,
        deviceId: device.id,
        alertType: 'DEVICE_OFFLINE',
        severity: 'CRITICAL',
        title: 'Device offline',
        description: `${device.deviceCode} in ${device.classroom.classroomCode} is offline.`,
        sourceType: 'DEVICE',
        sourceKey: `device:offline:${device.id}`,
        createdAt: device.lastSeenAt ?? device.updatedAt,
      })

      const offlineDays = device.lastSeenAt
        ? Math.floor((Date.now() - device.lastSeenAt.getTime()) / (24 * 60 * 60 * 1000))
        : settings.deviceOfflineThreshold
      if (offlineDays < settings.deviceOfflineThreshold) return

      await upsertInsight({
        schoolId,
        classroomId: device.classroomId,
        insightType: 'DEVICE_RELIABILITY_ISSUE',
        severity: offlineDays >= settings.deviceOfflineThreshold * 2 ? 'HIGH' : 'MEDIUM',
        title: 'Device reliability issue',
        description: `${device.deviceCode} has remained offline beyond the school threshold.`,
        score: offlineDays,
        sourceKey: `insight:device:reliability:${schoolId}:${device.id}`,
      })
    }),
  )
}

export async function runOperationalIntelligenceRules(auth: AuthContext, requestedSchoolId?: string | null) {
  const schoolIds = await targetSchoolIds(auth, requestedSchoolId)
  for (const schoolId of schoolIds) {
    await runOperationalIntelligenceForSchool(schoolId)
  }
}

export async function runOperationalIntelligenceForSchool(schoolId: string) {
  await runAttendanceRules(schoolId)
  await runMovementRules(schoolId)
  await runNoiseRules(schoolId)
  await runDeviceRules(schoolId)
}

export function alertWhereFromUrl(url: URL, auth: AuthContext): Prisma.AlertWhereInput {
  const requestedSchoolId = url.searchParams.get('schoolId')
  const schoolId = scopedSchoolId(auth, requestedSchoolId)
  const status = normalizeEnum(url.searchParams.get('status'), ['OPEN', 'ACKNOWLEDGED', 'RESOLVED'])
  const severity = normalizeEnum(url.searchParams.get('severity'), ['INFO', 'WARNING', 'CRITICAL'])
  const alertType = normalizeEnum(url.searchParams.get('alertType'), [
    'STUDENT_LATE',
    'STUDENT_ABSENT',
    'EXCESSIVE_STUDENT_EXITS',
    'HIGH_NOISE_EVENT',
    'DEVICE_OFFLINE',
  ])
  const sourceType = normalizeEnum(url.searchParams.get('sourceType'), ['ATTENDANCE', 'MOVEMENT', 'NOISE', 'DEVICE'])

  return {
    ...(schoolId ? { schoolId } : {}),
    ...(status ? { status } : {}),
    ...(severity ? { severity } : {}),
    ...(alertType ? { alertType } : {}),
    ...(sourceType ? { sourceType } : {}),
    ...(url.searchParams.get('classroomId') ? { classroomId: url.searchParams.get('classroomId') } : {}),
    ...(url.searchParams.get('teacherId') ? { teacherId: url.searchParams.get('teacherId') } : {}),
    ...(url.searchParams.get('studentId') ? { studentId: url.searchParams.get('studentId') } : {}),
    ...(url.searchParams.get('deviceId') ? { deviceId: url.searchParams.get('deviceId') } : {}),
  }
}

export function insightWhereFromUrl(url: URL, auth: AuthContext): Prisma.InsightWhereInput {
  const requestedSchoolId = url.searchParams.get('schoolId')
  const schoolId = scopedSchoolId(auth, requestedSchoolId)
  const status = normalizeEnum(url.searchParams.get('status'), ['ACTIVE', 'DISMISSED', 'RESOLVED'])
  const severity = normalizeEnum(url.searchParams.get('severity'), ['LOW', 'MEDIUM', 'HIGH'])
  const insightType = normalizeEnum(url.searchParams.get('insightType'), [
    'RECURRING_STUDENT_LATENESS',
    'EXCESSIVE_STUDENT_MOVEMENT',
    'CHRONIC_CLASSROOM_NOISE',
    'DEVICE_RELIABILITY_ISSUE',
  ])

  return {
    ...(schoolId ? { schoolId } : {}),
    ...(status ? { status } : {}),
    ...(severity ? { severity } : {}),
    ...(insightType ? { insightType } : {}),
    ...(url.searchParams.get('classroomId') ? { classroomId: url.searchParams.get('classroomId') } : {}),
    ...(url.searchParams.get('teacherId') ? { teacherId: url.searchParams.get('teacherId') } : {}),
    ...(url.searchParams.get('studentId') ? { studentId: url.searchParams.get('studentId') } : {}),
  }
}

export function normalizeEnum<T extends string>(value: string | null, allowed: readonly T[]) {
  const normalized = String(value ?? '').trim().toUpperCase() as T
  return allowed.includes(normalized) ? normalized : undefined
}
