import { Prisma, type NoiseEventStatus, type NoiseSeverity, type NoiseState } from '@prisma/client'
import type { AuthContext } from '@/lib/auth/session'
import { assertSameSchool } from '@/lib/academic/access'
import { prisma } from '@/lib/prisma'

const FOUNDATION_SCORE_VERSION = 1

export const noiseEventInclude = {
  classroom: { select: { id: true, classroomCode: true, classroomName: true } },
  classroomDevice: { select: { id: true, deviceCode: true } },
  teacher: { select: { id: true, fullNameAr: true, fullNameEn: true } },
  attendanceSession: { select: { id: true, sessionDate: true, openedAt: true, status: true } },
} satisfies Prisma.NoiseEventInclude

export const classroomNoiseStateInclude = {
  classroom: { select: { id: true, classroomCode: true, classroomName: true } },
  classroomDevice: { select: { id: true, deviceCode: true } },
  activeNoiseEvent: { include: noiseEventInclude },
} satisfies Prisma.ClassroomNoiseStateInclude

export function normalizeNoiseSeverity(value: unknown): NoiseSeverity | undefined {
  const severity = String(value ?? '').trim().toUpperCase()
  if (severity === 'LOW' || severity === 'MEDIUM' || severity === 'HIGH') return severity
  return undefined
}

export function normalizeNoiseEventStatus(value: unknown): NoiseEventStatus | undefined {
  const status = String(value ?? '').trim().toUpperCase()
  if (status === 'ACTIVE' || status === 'CLOSED') return status
  return undefined
}

export function dateOnlyUTC(value: Date) {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()))
}

export function dateRangeForDay(value: Date) {
  const start = dateOnlyUTC(value)
  const end = new Date(start)
  end.setUTCDate(end.getUTCDate() + 1)
  return { start, end }
}

export function dateFromQuery(value: string | null) {
  if (!value) return dateOnlyUTC(new Date())
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) throw new Response('Invalid date value', { status: 400 })
  return dateOnlyUTC(date)
}

export function dateTimeFromInput(value: unknown) {
  if (value === undefined || value === null || value === '') return new Date()
  const date = new Date(String(value))
  if (Number.isNaN(date.getTime())) throw new Response('Invalid measuredAt value', { status: 400 })
  return date
}

export function clampNoiseDb(value: unknown) {
  const currentDb = Number(value)
  if (!Number.isFinite(currentDb)) throw new Response('currentDb is required', { status: 400 })
  return Math.min(130, Math.max(0, Math.round(currentDb)))
}

export function determineNoiseState(currentDb: number, thresholdDb: number): NoiseState {
  if (currentDb > thresholdDb) return 'LOUD'
  if (currentDb >= Math.round(thresholdDb * 0.75)) return 'MODERATE'
  return 'QUIET'
}

export function determineSeverity(peakDb: number, thresholdDb: number): NoiseSeverity {
  if (peakDb >= thresholdDb + 15) return 'HIGH'
  if (peakDb >= thresholdDb + 7) return 'MEDIUM'
  return 'LOW'
}

export function quietScore({
  totalNoiseSeconds,
  highEvents,
  peakDb,
}: {
  totalNoiseSeconds: number
  highEvents: number
  peakDb: number
}) {
  const durationPenalty = totalNoiseSeconds / 60
  const highEventPenalty = highEvents * 5
  const intensityPenalty = Math.max(0, peakDb - 70) * 0.5
  return Math.max(0, Math.min(100, Math.round(100 - durationPenalty - highEventPenalty - intensityPenalty)))
}

function aggregateNoiseEvents(events: { durationSeconds: number | null; averageDb: number; peakDb: number; severity: NoiseSeverity }[]) {
  const totalEvents = events.length
  const totalNoiseSeconds = events.reduce((sum, event) => sum + (event.durationSeconds ?? 0), 0)
  const averageEventDb = totalEvents
    ? Math.round(events.reduce((sum, event) => sum + event.averageDb, 0) / totalEvents)
    : 0
  const peakDb = events.reduce((peak, event) => Math.max(peak, event.peakDb), 0)
  const lowEvents = events.filter((event) => event.severity === 'LOW').length
  const mediumEvents = events.filter((event) => event.severity === 'MEDIUM').length
  const highEvents = events.filter((event) => event.severity === 'HIGH').length

  return {
    totalEvents,
    totalNoiseSeconds,
    averageEventDb,
    peakDb,
    lowEvents,
    mediumEvents,
    highEvents,
    quietScore: quietScore({ totalNoiseSeconds, highEvents, peakDb }),
    scoreVersion: FOUNDATION_SCORE_VERSION,
  }
}

async function recalculateClassroomSummary(schoolId: string, classroomId: string, summaryDate: Date) {
  const { start, end } = dateRangeForDay(summaryDate)
  const events = await prisma.noiseEvent.findMany({
    where: {
      schoolId,
      classroomId,
      status: 'CLOSED',
      startedAt: { gte: start, lt: end },
    },
    select: { durationSeconds: true, averageDb: true, peakDb: true, severity: true },
  })
  const metrics = aggregateNoiseEvents(events)

  return prisma.classroomNoiseSummary.upsert({
    where: {
      schoolId_classroomId_period_periodStart: {
        schoolId,
        classroomId,
        period: 'DAILY',
        periodStart: start,
      },
    },
    update: metrics,
    create: {
      schoolId,
      classroomId,
      period: 'DAILY',
      periodStart: start,
      periodEnd: end,
      summaryDate: start,
      ...metrics,
    },
  })
}

async function recalculateTeacherSummary(schoolId: string, teacherId: string, summaryDate: Date) {
  const { start, end } = dateRangeForDay(summaryDate)
  const events = await prisma.noiseEvent.findMany({
    where: {
      schoolId,
      teacherId,
      status: 'CLOSED',
      startedAt: { gte: start, lt: end },
    },
    select: { durationSeconds: true, averageDb: true, peakDb: true, severity: true },
  })
  const metrics = aggregateNoiseEvents(events)

  return prisma.teacherNoiseSummary.upsert({
    where: {
      schoolId_teacherId_period_periodStart: {
        schoolId,
        teacherId,
        period: 'DAILY',
        periodStart: start,
      },
    },
    update: metrics,
    create: {
      schoolId,
      teacherId,
      period: 'DAILY',
      periodStart: start,
      periodEnd: end,
      summaryDate: start,
      ...metrics,
    },
  })
}

async function currentTeacherId(schoolId: string, classroomId: string) {
  const teacherPresence = await prisma.teacherPresenceState.findFirst({
    where: {
      schoolId,
      classroomId,
      currentState: 'INSIDE_CLASSROOM',
    },
    orderBy: { updatedAt: 'desc' },
    select: { teacherId: true },
  })
  return teacherPresence?.teacherId ?? null
}

async function currentAttendanceSessionId(schoolId: string, classroomId: string, measuredAt: Date) {
  const sessionDate = dateOnlyUTC(measuredAt)
  const session = await prisma.classroomAttendanceSession.findFirst({
    where: {
      schoolId,
      classroomId,
      status: 'OPEN',
      sessionDate,
    },
    orderBy: { openedAt: 'desc' },
    select: { id: true },
  })
  return session?.id ?? null
}

async function closeNoiseEvent(eventId: string, schoolId: string, measuredAt: Date, currentDb: number, thresholdDb: number) {
  const event = await prisma.noiseEvent.findFirstOrThrow({
    where: { id: eventId, schoolId, status: 'ACTIVE' },
  })
  const durationSeconds = Math.max(0, Math.round((measuredAt.getTime() - event.startedAt.getTime()) / 1000))
  const peakDb = Math.max(event.peakDb, currentDb)
  const averageDb = Math.round((event.averageDb * event.sampleCount + currentDb) / (event.sampleCount + 1))
  const closed = await prisma.noiseEvent.update({
    where: { id: event.id },
    data: {
      endedAt: measuredAt,
      durationSeconds,
      averageDb,
      peakDb,
      sampleCount: { increment: 1 },
      severity: determineSeverity(peakDb, thresholdDb),
      status: 'CLOSED',
    },
  })

  await recalculateClassroomSummary(closed.schoolId, closed.classroomId, closed.startedAt)
  if (closed.teacherId) await recalculateTeacherSummary(closed.schoolId, closed.teacherId, closed.startedAt)
  return closed
}

export async function processNoiseReading({
  auth,
  classroomDeviceId,
  deviceCode,
  currentDb,
  measuredAt,
}: {
  auth: AuthContext
  classroomDeviceId?: string | null
  deviceCode?: string | null
  currentDb: unknown
  measuredAt?: unknown
}) {
  const measuredAtDate = dateTimeFromInput(measuredAt)
  const readingDb = clampNoiseDb(currentDb)
  const device = await prisma.classroomDevice.findFirstOrThrow({
    where: classroomDeviceId
      ? { id: classroomDeviceId }
      : { deviceCode: String(deviceCode ?? '').trim().toUpperCase() },
  })
  assertSameSchool(auth, device.schoolId)

  const settings = await prisma.schoolSettings.upsert({
    where: { schoolId: device.schoolId },
    update: {},
    create: { schoolId: device.schoolId },
    select: { noiseThresholdDb: true, noiseDurationSeconds: true },
  })
  const thresholdDb = settings.noiseThresholdDb ?? 70
  const durationSeconds = settings.noiseDurationSeconds ?? 10
  const currentState = determineNoiseState(readingDb, thresholdDb)
  const aboveThreshold = readingDb > thresholdDb

  const existingState = await prisma.classroomNoiseState.findUnique({
    where: {
      schoolId_classroomId: {
        schoolId: device.schoolId,
        classroomId: device.classroomId,
      },
    },
    include: { activeNoiseEvent: true },
  })

  if (!aboveThreshold) {
    const closedEvent = existingState?.activeNoiseEventId
      ? await closeNoiseEvent(existingState.activeNoiseEventId, device.schoolId, measuredAtDate, readingDb, thresholdDb)
      : null

    const state = await prisma.classroomNoiseState.upsert({
      where: {
        schoolId_classroomId: {
          schoolId: device.schoolId,
          classroomId: device.classroomId,
        },
      },
      update: {
        classroomDeviceId: device.id,
        currentDb: readingDb,
        currentState,
        activeNoiseEventId: null,
        thresholdExceededAt: null,
      },
      create: {
        schoolId: device.schoolId,
        classroomId: device.classroomId,
        classroomDeviceId: device.id,
        currentDb: readingDb,
        currentState,
      },
      include: classroomNoiseStateInclude,
    })

    return { state, event: closedEvent, action: closedEvent ? 'CLOSED_EVENT' : 'UPDATED_STATE' }
  }

  const thresholdExceededAt = existingState?.thresholdExceededAt ?? measuredAtDate
  const thresholdSeconds = Math.max(0, Math.round((measuredAtDate.getTime() - thresholdExceededAt.getTime()) / 1000))

  if (existingState?.activeNoiseEvent) {
    const event = await prisma.noiseEvent.update({
      where: { id: existingState.activeNoiseEvent.id },
      data: {
        averageDb: Math.round((existingState.activeNoiseEvent.averageDb * existingState.activeNoiseEvent.sampleCount + readingDb) / (existingState.activeNoiseEvent.sampleCount + 1)),
        peakDb: Math.max(existingState.activeNoiseEvent.peakDb, readingDb),
        sampleCount: { increment: 1 },
        severity: determineSeverity(Math.max(existingState.activeNoiseEvent.peakDb, readingDb), thresholdDb),
      },
      include: noiseEventInclude,
    })

    const state = await prisma.classroomNoiseState.upsert({
      where: {
        schoolId_classroomId: {
          schoolId: device.schoolId,
          classroomId: device.classroomId,
        },
      },
      update: {
        classroomDeviceId: device.id,
        currentDb: readingDb,
        currentState,
        thresholdExceededAt,
      },
      create: {
        schoolId: device.schoolId,
        classroomId: device.classroomId,
        classroomDeviceId: device.id,
        currentDb: readingDb,
        currentState,
        activeNoiseEventId: event.id,
        thresholdExceededAt,
      },
      include: classroomNoiseStateInclude,
    })

    return { state, event, action: 'UPDATED_EVENT' }
  }

  if (thresholdSeconds >= durationSeconds) {
    const teacherId = await currentTeacherId(device.schoolId, device.classroomId)
    const attendanceSessionId = await currentAttendanceSessionId(device.schoolId, device.classroomId, measuredAtDate)
    const event = await prisma.noiseEvent.create({
      data: {
        schoolId: device.schoolId,
        classroomId: device.classroomId,
        classroomDeviceId: device.id,
        teacherId,
        attendanceSessionId,
        startedAt: thresholdExceededAt,
        averageDb: readingDb,
        peakDb: readingDb,
        severity: determineSeverity(readingDb, thresholdDb),
        status: 'ACTIVE',
      },
      include: noiseEventInclude,
    })

    const state = await prisma.classroomNoiseState.upsert({
      where: {
        schoolId_classroomId: {
          schoolId: device.schoolId,
          classroomId: device.classroomId,
        },
      },
      update: {
        classroomDeviceId: device.id,
        currentDb: readingDb,
        currentState,
        activeNoiseEventId: event.id,
        thresholdExceededAt,
      },
      create: {
        schoolId: device.schoolId,
        classroomId: device.classroomId,
        classroomDeviceId: device.id,
        currentDb: readingDb,
        currentState,
        activeNoiseEventId: event.id,
        thresholdExceededAt,
      },
      include: classroomNoiseStateInclude,
    })

    return { state, event, action: 'CREATED_EVENT' }
  }

  const state = await prisma.classroomNoiseState.upsert({
    where: {
      schoolId_classroomId: {
        schoolId: device.schoolId,
        classroomId: device.classroomId,
      },
    },
    update: {
      classroomDeviceId: device.id,
      currentDb: readingDb,
      currentState,
      thresholdExceededAt,
    },
    create: {
      schoolId: device.schoolId,
      classroomId: device.classroomId,
      classroomDeviceId: device.id,
      currentDb: readingDb,
      currentState,
      thresholdExceededAt,
    },
    include: classroomNoiseStateInclude,
  })

  return { state, event: null, action: 'TRACKING_THRESHOLD' }
}
