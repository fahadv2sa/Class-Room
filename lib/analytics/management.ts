import {
  type ManagementKpiType,
  type ManagementSubjectType,
  type Prisma,
  type SummaryPeriod,
} from '@prisma/client'
import { scopedSchoolId } from '@/lib/academic/access'
import type { AuthContext } from '@/lib/auth/session'
import { prisma } from '@/lib/prisma'

export const MANAGEMENT_SCORE_VERSION = 1

const kpiTypes = [
  'ATTENDANCE_RATE',
  'LATE_RATE',
  'NOISE_SCORE',
  'MOVEMENT_SCORE',
  'TEACHER_PUNCTUALITY',
  'CLASSROOM_PERFORMANCE_SCORE',
  'STUDENT_ATTENTION_SCORE',
] as const satisfies readonly ManagementKpiType[]

export function normalizeAnalyticsPeriod(value: unknown): SummaryPeriod {
  const period = String(value ?? 'DAILY').trim().toUpperCase()
  if (period === 'DAILY' || period === 'WEEKLY' || period === 'MONTHLY' || period === 'TERM' || period === 'YEARLY') {
    return period
  }
  return 'DAILY'
}

export function dateOnlyUTC(value: Date) {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()))
}

export function periodRange(period: SummaryPeriod, value: string | null) {
  const base = value ? new Date(value) : new Date()
  if (Number.isNaN(base.getTime())) throw new Response('Invalid date value', { status: 400 })
  const start = dateOnlyUTC(base)

  if (period === 'WEEKLY') {
    start.setUTCDate(start.getUTCDate() - start.getUTCDay())
  } else if (period === 'MONTHLY') {
    start.setUTCDate(1)
  } else if (period === 'YEARLY') {
    start.setUTCMonth(0, 1)
  } else if (period === 'TERM') {
    start.setUTCMonth(start.getUTCMonth() < 6 ? 0 : 6, 1)
  }

  const end = new Date(start)
  if (period === 'DAILY') end.setUTCDate(end.getUTCDate() + 1)
  if (period === 'WEEKLY') end.setUTCDate(end.getUTCDate() + 7)
  if (period === 'MONTHLY') end.setUTCMonth(end.getUTCMonth() + 1)
  if (period === 'TERM') end.setUTCMonth(end.getUTCMonth() + 6)
  if (period === 'YEARLY') end.setUTCFullYear(end.getUTCFullYear() + 1)

  return { periodStart: start, periodEnd: end }
}

export function requireAnalyticsSchoolId(auth: AuthContext, requestedSchoolId?: string | null) {
  const schoolId = scopedSchoolId(auth, requestedSchoolId)
  if (!schoolId) throw new Response('schoolId is required for analytics requests', { status: 400 })
  return schoolId
}

function pct(part: number, total: number) {
  if (!total) return 0
  return Math.round((part / total) * 1000) / 10
}

function boundedScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value * 10) / 10))
}

function sourceKey(input: {
  schoolId: string
  subjectType: ManagementSubjectType
  subjectId?: string | null
  kpiType: ManagementKpiType
  period: SummaryPeriod
  periodStart: Date
}) {
  return [
    'management',
    input.schoolId,
    input.subjectType,
    input.subjectId ?? 'school',
    input.kpiType,
    input.period,
    input.periodStart.toISOString().slice(0, 10),
    `v${MANAGEMENT_SCORE_VERSION}`,
  ].join(':')
}

async function upsertKpi(input: {
  schoolId: string
  subjectType: ManagementSubjectType
  subjectId?: string | null
  kpiType: ManagementKpiType
  period: SummaryPeriod
  periodStart: Date
  periodEnd: Date
  value: number
  metadata?: Prisma.InputJsonValue
}) {
  return prisma.managementKpiSnapshot.upsert({
    where: {
      sourceKey: sourceKey(input),
    },
    create: {
      schoolId: input.schoolId,
      subjectType: input.subjectType,
      subjectId: input.subjectId ?? null,
      kpiType: input.kpiType,
      period: input.period,
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      value: boundedScore(input.value),
      scoreVersion: MANAGEMENT_SCORE_VERSION,
      sourceKey: sourceKey(input),
      metadata: input.metadata,
    },
    update: {
      value: boundedScore(input.value),
      scoreVersion: MANAGEMENT_SCORE_VERSION,
      metadata: input.metadata,
      periodEnd: input.periodEnd,
    },
  })
}

export async function refreshManagementKpis({
  schoolId,
  period,
  periodStart,
  periodEnd,
}: {
  schoolId: string
  period: SummaryPeriod
  periodStart: Date
  periodEnd: Date
}) {
  const [records, movements, classroomNoise, teacherNoise, alerts, insights, classrooms, students, teachers] = await Promise.all([
    prisma.studentAttendanceRecord.findMany({
      where: {
        schoolId,
        attendanceSession: { sessionDate: { gte: periodStart, lt: periodEnd } },
      },
      select: { status: true, classroomId: true, studentId: true },
    }),
    prisma.studentMovementRecord.findMany({
      where: { schoolId, createdAt: { gte: periodStart, lt: periodEnd } },
      select: { classroomId: true, studentId: true },
    }),
    prisma.classroomNoiseSummary.findMany({
      where: { schoolId, period: period === 'DAILY' ? 'DAILY' : undefined, periodStart: { gte: periodStart, lt: periodEnd } },
      select: { classroomId: true, quietScore: true },
    }),
    prisma.teacherNoiseSummary.findMany({
      where: { schoolId, period: period === 'DAILY' ? 'DAILY' : undefined, periodStart: { gte: periodStart, lt: periodEnd } },
      select: { teacherId: true, quietScore: true },
    }),
    prisma.alert.findMany({
      where: { schoolId, createdAt: { gte: periodStart, lt: periodEnd }, status: { not: 'RESOLVED' } },
      select: { studentId: true, classroomId: true, severity: true },
    }),
    prisma.insight.findMany({
      where: { schoolId, lastDetectedAt: { gte: periodStart, lt: periodEnd }, status: 'ACTIVE' },
      select: { studentId: true, classroomId: true, severity: true },
    }),
    prisma.classroom.findMany({ where: { schoolId, isActive: true }, select: { id: true, level: { select: { levelType: true } } } }),
    prisma.student.findMany({ where: { schoolId, status: 'ACTIVE' }, select: { id: true, classroomId: true } }),
    prisma.teacher.findMany({ where: { schoolId, status: 'ACTIVE' }, select: { id: true } }),
  ])

  const writes: Promise<unknown>[] = []
  const total = records.length
  const present = records.filter((record) => record.status === 'PRESENT' || record.status === 'LATE').length
  const late = records.filter((record) => record.status === 'LATE').length
  const avgNoise = classroomNoise.length
    ? classroomNoise.reduce((sum, item) => sum + item.quietScore, 0) / classroomNoise.length
    : 100
  const movementScore = 100 - Math.min(100, movements.length * 2)
  const attendanceRate = pct(present, total)
  const lateRate = pct(late, total)
  const performance = attendanceRate * 0.45 + avgNoise * 0.35 + movementScore * 0.2

  writes.push(
    upsertKpi({ schoolId, subjectType: 'SCHOOL', kpiType: 'ATTENDANCE_RATE', period, periodStart, periodEnd, value: attendanceRate }),
    upsertKpi({ schoolId, subjectType: 'SCHOOL', kpiType: 'LATE_RATE', period, periodStart, periodEnd, value: lateRate }),
    upsertKpi({ schoolId, subjectType: 'SCHOOL', kpiType: 'NOISE_SCORE', period, periodStart, periodEnd, value: avgNoise }),
    upsertKpi({ schoolId, subjectType: 'SCHOOL', kpiType: 'MOVEMENT_SCORE', period, periodStart, periodEnd, value: movementScore }),
    upsertKpi({ schoolId, subjectType: 'SCHOOL', kpiType: 'CLASSROOM_PERFORMANCE_SCORE', period, periodStart, periodEnd, value: performance }),
  )

  for (const classroom of classrooms) {
    const classroomRecords = records.filter((record) => record.classroomId === classroom.id)
    const classroomPresent = classroomRecords.filter((record) => record.status === 'PRESENT' || record.status === 'LATE').length
    const classroomLate = classroomRecords.filter((record) => record.status === 'LATE').length
    const noiseRows = classroomNoise.filter((row) => row.classroomId === classroom.id)
    const classroomNoiseScore = noiseRows.length ? noiseRows.reduce((sum, row) => sum + row.quietScore, 0) / noiseRows.length : 100
    const classroomMovementCount = movements.filter((movement) => movement.classroomId === classroom.id).length
    const classroomMovementScore = 100 - Math.min(100, classroomMovementCount * 3)
    const classroomAttendance = pct(classroomPresent, classroomRecords.length)
    const classroomLateRate = pct(classroomLate, classroomRecords.length)
    const classroomPerformance = classroomAttendance * 0.45 + classroomNoiseScore * 0.35 + classroomMovementScore * 0.2

    writes.push(
      upsertKpi({ schoolId, subjectType: 'CLASSROOM', subjectId: classroom.id, kpiType: 'ATTENDANCE_RATE', period, periodStart, periodEnd, value: classroomAttendance }),
      upsertKpi({ schoolId, subjectType: 'CLASSROOM', subjectId: classroom.id, kpiType: 'LATE_RATE', period, periodStart, periodEnd, value: classroomLateRate }),
      upsertKpi({ schoolId, subjectType: 'CLASSROOM', subjectId: classroom.id, kpiType: 'NOISE_SCORE', period, periodStart, periodEnd, value: classroomNoiseScore }),
      upsertKpi({ schoolId, subjectType: 'CLASSROOM', subjectId: classroom.id, kpiType: 'MOVEMENT_SCORE', period, periodStart, periodEnd, value: classroomMovementScore }),
      upsertKpi({ schoolId, subjectType: 'CLASSROOM', subjectId: classroom.id, kpiType: 'CLASSROOM_PERFORMANCE_SCORE', period, periodStart, periodEnd, value: classroomPerformance, metadata: { levelType: classroom.level.levelType } }),
    )
  }

  for (const student of students) {
    const studentRecords = records.filter((record) => record.studentId === student.id)
    const studentLate = studentRecords.filter((record) => record.status === 'LATE').length
    const studentAbsent = studentRecords.filter((record) => record.status === 'ABSENT').length
    const studentMovement = movements.filter((movement) => movement.studentId === student.id).length
    const studentAlerts = alerts.filter((alert) => alert.studentId === student.id).length
    const studentInsights = insights.filter((insight) => insight.studentId === student.id).length
    const attention = 100 - Math.min(100, studentLate * 8 + studentAbsent * 12 + studentMovement * 4 + studentAlerts * 5 + studentInsights * 10)
    writes.push(
      upsertKpi({ schoolId, subjectType: 'STUDENT', subjectId: student.id, kpiType: 'STUDENT_ATTENTION_SCORE', period, periodStart, periodEnd, value: attention, metadata: { classroomId: student.classroomId } }),
    )
  }

  for (const teacher of teachers) {
    const teacherNoiseRows = teacherNoise.filter((row) => row.teacherId === teacher.id)
    const teacherNoiseScore = teacherNoiseRows.length ? teacherNoiseRows.reduce((sum, row) => sum + row.quietScore, 0) / teacherNoiseRows.length : 100
    writes.push(
      upsertKpi({ schoolId, subjectType: 'TEACHER', subjectId: teacher.id, kpiType: 'TEACHER_PUNCTUALITY', period, periodStart, periodEnd, value: teacherNoiseScore }),
    )
  }

  await Promise.all(writes)
}

export async function getManagementKpis(input: {
  schoolId: string
  period: SummaryPeriod
  periodStart: Date
  periodEnd: Date
}) {
  await refreshManagementKpis(input)
  return prisma.managementKpiSnapshot.findMany({
    where: {
      schoolId: input.schoolId,
      subjectType: 'SCHOOL',
      period: input.period,
      periodStart: input.periodStart,
      kpiType: { in: [...kpiTypes] },
    },
    orderBy: { kpiType: 'asc' },
  })
}

export async function getManagementRankings(input: {
  schoolId: string
  period: SummaryPeriod
  periodStart: Date
  periodEnd: Date
  take: number
}) {
  await refreshManagementKpis(input)
  const classroomInclude = { subjectId: true, value: true, metadata: true }
  const [topClassrooms, bottomClassrooms, topTeachers, studentsRequiringAttention] = await Promise.all([
    prisma.managementKpiSnapshot.findMany({
      where: { schoolId: input.schoolId, subjectType: 'CLASSROOM', kpiType: 'CLASSROOM_PERFORMANCE_SCORE', period: input.period, periodStart: input.periodStart },
      select: classroomInclude,
      orderBy: { value: 'desc' },
      take: input.take,
    }),
    prisma.managementKpiSnapshot.findMany({
      where: { schoolId: input.schoolId, subjectType: 'CLASSROOM', kpiType: 'CLASSROOM_PERFORMANCE_SCORE', period: input.period, periodStart: input.periodStart },
      select: classroomInclude,
      orderBy: { value: 'asc' },
      take: input.take,
    }),
    prisma.managementKpiSnapshot.findMany({
      where: { schoolId: input.schoolId, subjectType: 'TEACHER', kpiType: 'TEACHER_PUNCTUALITY', period: input.period, periodStart: input.periodStart },
      select: { subjectId: true, value: true },
      orderBy: { value: 'desc' },
      take: input.take,
    }),
    prisma.managementKpiSnapshot.findMany({
      where: { schoolId: input.schoolId, subjectType: 'STUDENT', kpiType: 'STUDENT_ATTENTION_SCORE', period: input.period, periodStart: input.periodStart },
      select: { subjectId: true, value: true, metadata: true },
      orderBy: { value: 'asc' },
      take: input.take,
    }),
  ])

  const classroomIds = [...topClassrooms, ...bottomClassrooms].map((item) => item.subjectId).filter(Boolean) as string[]
  const teacherIds = topTeachers.map((item) => item.subjectId).filter(Boolean) as string[]
  const studentIds = studentsRequiringAttention.map((item) => item.subjectId).filter(Boolean) as string[]
  const [classrooms, teachers, students] = await Promise.all([
    prisma.classroom.findMany({ where: { id: { in: classroomIds }, schoolId: input.schoolId }, select: { id: true, classroomCode: true, classroomName: true } }),
    prisma.teacher.findMany({ where: { id: { in: teacherIds }, schoolId: input.schoolId }, select: { id: true, fullNameAr: true, fullNameEn: true } }),
    prisma.student.findMany({ where: { id: { in: studentIds }, schoolId: input.schoolId }, select: { id: true, fullNameAr: true, fullNameEn: true, studentNumber: true } }),
  ])
  const classroomName = new Map(classrooms.map((item) => [item.id, item.classroomCode]))
  const teacherName = new Map(teachers.map((item) => [item.id, item.fullNameEn || item.fullNameAr]))
  const studentName = new Map(students.map((item) => [item.id, item.fullNameEn || item.fullNameAr || item.studentNumber]))

  return {
    topClassrooms: topClassrooms.map((item) => ({ ...item, label: classroomName.get(item.subjectId ?? '') ?? item.subjectId })),
    bottomClassrooms: bottomClassrooms.map((item) => ({ ...item, label: classroomName.get(item.subjectId ?? '') ?? item.subjectId })),
    topTeachers: topTeachers.map((item) => ({ ...item, label: teacherName.get(item.subjectId ?? '') ?? item.subjectId })),
    studentsRequiringAttention: studentsRequiringAttention.map((item) => ({ ...item, label: studentName.get(item.subjectId ?? '') ?? item.subjectId })),
  }
}

export async function getManagementTrends(input: {
  schoolId: string
  period: SummaryPeriod
  periodStart: Date
  periodEnd: Date
  kpiType: ManagementKpiType
}) {
  await refreshManagementKpis(input)
  return prisma.managementKpiSnapshot.findMany({
    where: {
      schoolId: input.schoolId,
      subjectType: 'SCHOOL',
      kpiType: input.kpiType,
      period: input.period,
      periodStart: { lte: input.periodStart },
    },
    orderBy: { periodStart: 'desc' },
    take: 12,
  })
}

export async function getManagementComparisons(input: {
  schoolId: string
  period: SummaryPeriod
  periodStart: Date
  periodEnd: Date
  subjectType: ManagementSubjectType
  subjectIds: string[]
  kpiType: ManagementKpiType
}) {
  await refreshManagementKpis(input)
  return prisma.managementKpiSnapshot.findMany({
    where: {
      schoolId: input.schoolId,
      subjectType: input.subjectType,
      subjectId: { in: input.subjectIds },
      kpiType: input.kpiType,
      period: input.period,
      periodStart: input.periodStart,
    },
    orderBy: { value: 'desc' },
  })
}

export function normalizeManagementKpi(value: unknown): ManagementKpiType {
  const type = String(value ?? 'CLASSROOM_PERFORMANCE_SCORE').trim().toUpperCase()
  return kpiTypes.includes(type as ManagementKpiType) ? (type as ManagementKpiType) : 'CLASSROOM_PERFORMANCE_SCORE'
}

export function normalizeManagementSubject(value: unknown): ManagementSubjectType {
  const type = String(value ?? 'CLASSROOM').trim().toUpperCase()
  if (type === 'SCHOOL' || type === 'LEVEL' || type === 'CLASSROOM' || type === 'TEACHER' || type === 'STUDENT') return type
  return 'CLASSROOM'
}
