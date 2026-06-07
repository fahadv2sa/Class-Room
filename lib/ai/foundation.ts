import type {
  AIRecommendationPriority,
  AIRecommendationStatus,
  AIRecommendationType,
  AISummaryType,
  AutomationActionType,
  AutomationTriggerType,
  ManagementSubjectType,
  Prisma,
  SummaryPeriod,
} from '@prisma/client'
import { scopedSchoolId } from '@/lib/academic/access'
import type { AuthContext } from '@/lib/auth/session'
import { prisma } from '@/lib/prisma'

export const aiRecommendationInclude = {
  school: { select: { name: true, schoolCode: true } },
} satisfies Prisma.AIRecommendationInclude

export const aiSummaryInclude = {
  school: { select: { name: true, schoolCode: true } },
} satisfies Prisma.AISummaryInclude

export function requireAISchoolId(auth: AuthContext, requestedSchoolId?: string | null) {
  const schoolId = scopedSchoolId(auth, requestedSchoolId)
  if (!schoolId) throw new Response('schoolId is required for AI foundation requests', { status: 400 })
  return schoolId
}

export function normalizeAIRecommendationType(value: unknown): AIRecommendationType | undefined {
  const type = String(value ?? '').trim().toUpperCase()
  if (
    type === 'CLASSROOM_PERFORMANCE_DECLINE' ||
    type === 'NOISE_INCREASE' ||
    type === 'MOVEMENT_INCREASE' ||
    type === 'ATTENDANCE_DROP' ||
    type === 'STUDENT_REQUIRES_ATTENTION' ||
    type === 'DEVICE_RELIABILITY'
  ) {
    return type
  }
  return undefined
}

export function normalizeAIRecommendationStatus(value: unknown): AIRecommendationStatus | undefined {
  const status = String(value ?? '').trim().toUpperCase()
  if (status === 'ACTIVE' || status === 'DISMISSED' || status === 'RESOLVED') return status
  return undefined
}

export function normalizeAIRecommendationPriority(value: unknown): AIRecommendationPriority | undefined {
  const priority = String(value ?? '').trim().toUpperCase()
  if (priority === 'LOW' || priority === 'MEDIUM' || priority === 'HIGH' || priority === 'CRITICAL') return priority
  return undefined
}

export function normalizeAISummaryType(value: unknown): AISummaryType | undefined {
  const type = String(value ?? '').trim().toUpperCase()
  if (
    type === 'DAILY' ||
    type === 'WEEKLY' ||
    type === 'MONTHLY' ||
    type === 'TERM' ||
    type === 'SCHOOL' ||
    type === 'CLASSROOM' ||
    type === 'TEACHER' ||
    type === 'STUDENT_ATTENTION'
  ) {
    return type
  }
  return undefined
}

export function normalizeAISummaryPeriod(value: unknown): SummaryPeriod {
  const period = String(value ?? 'DAILY').trim().toUpperCase()
  if (period === 'DAILY' || period === 'WEEKLY' || period === 'MONTHLY' || period === 'TERM' || period === 'YEARLY') return period
  return 'DAILY'
}

function dateOnlyUTC(value: Date) {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()))
}

export function aiPeriodRange(period: SummaryPeriod, value: string | null) {
  const base = value ? new Date(value) : new Date()
  if (Number.isNaN(base.getTime())) throw new Response('Invalid date value', { status: 400 })
  const start = dateOnlyUTC(base)
  if (period === 'WEEKLY') start.setUTCDate(start.getUTCDate() - start.getUTCDay())
  if (period === 'MONTHLY') start.setUTCDate(1)
  if (period === 'TERM') start.setUTCMonth(start.getUTCMonth() < 6 ? 0 : 6, 1)
  if (period === 'YEARLY') start.setUTCMonth(0, 1)

  const end = new Date(start)
  if (period === 'DAILY') end.setUTCDate(end.getUTCDate() + 1)
  if (period === 'WEEKLY') end.setUTCDate(end.getUTCDate() + 7)
  if (period === 'MONTHLY') end.setUTCMonth(end.getUTCMonth() + 1)
  if (period === 'TERM') end.setUTCMonth(end.getUTCMonth() + 6)
  if (period === 'YEARLY') end.setUTCFullYear(end.getUTCFullYear() + 1)
  return { periodStart: start, periodEnd: end }
}

function sourceDate(date: Date) {
  return date.toISOString().slice(0, 10)
}

function priorityFromSeverity(value: string): AIRecommendationPriority {
  if (value === 'CRITICAL' || value === 'HIGH') return 'CRITICAL'
  if (value === 'WARNING' || value === 'MEDIUM') return 'HIGH'
  return 'MEDIUM'
}

function recommendationTypeFromAlert(alertType: string): AIRecommendationType {
  if (alertType === 'HIGH_NOISE_EVENT') return 'NOISE_INCREASE'
  if (alertType === 'EXCESSIVE_STUDENT_EXITS') return 'MOVEMENT_INCREASE'
  if (alertType === 'DEVICE_OFFLINE') return 'DEVICE_RELIABILITY'
  return 'ATTENDANCE_DROP'
}

function recommendationTypeFromInsight(insightType: string): AIRecommendationType {
  if (insightType === 'CHRONIC_CLASSROOM_NOISE') return 'NOISE_INCREASE'
  if (insightType === 'EXCESSIVE_STUDENT_MOVEMENT') return 'MOVEMENT_INCREASE'
  if (insightType === 'DEVICE_RELIABILITY_ISSUE') return 'DEVICE_RELIABILITY'
  return 'STUDENT_REQUIRES_ATTENTION'
}

async function upsertRecommendation(input: {
  schoolId: string
  recommendationType: AIRecommendationType
  priority: AIRecommendationPriority
  subjectType?: ManagementSubjectType | null
  subjectId?: string | null
  title: string
  recommendation: string
  explanation: string
  evidence: Prisma.InputJsonValue
  dataSources: string[]
  sourceKey: string
}) {
  return prisma.aIRecommendation.upsert({
    where: { sourceKey: input.sourceKey },
    create: {
      schoolId: input.schoolId,
      recommendationType: input.recommendationType,
      priority: input.priority,
      subjectType: input.subjectType ?? null,
      subjectId: input.subjectId ?? null,
      title: input.title,
      recommendation: input.recommendation,
      explanation: input.explanation,
      evidence: input.evidence,
      dataSources: input.dataSources,
      sourceKey: input.sourceKey,
    },
    update: {
      priority: input.priority,
      title: input.title,
      recommendation: input.recommendation,
      explanation: input.explanation,
      evidence: input.evidence,
      dataSources: input.dataSources,
      generatedAt: new Date(),
    },
  })
}

export async function refreshAIRecommendations({
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
  const [alerts, insights, kpis] = await Promise.all([
    prisma.alert.findMany({
      where: { schoolId, status: { not: 'RESOLVED' }, createdAt: { gte: periodStart, lt: periodEnd } },
      include: {
        classroom: { select: { classroomCode: true } },
        student: { select: { fullNameAr: true, fullNameEn: true, studentNumber: true } },
        teacher: { select: { fullNameAr: true, fullNameEn: true } },
        device: { select: { deviceCode: true } },
      },
      take: 50,
      orderBy: [{ severity: 'desc' }, { createdAt: 'desc' }],
    }),
    prisma.insight.findMany({
      where: { schoolId, status: 'ACTIVE', lastDetectedAt: { gte: periodStart, lt: periodEnd } },
      include: {
        classroom: { select: { classroomCode: true } },
        student: { select: { fullNameAr: true, fullNameEn: true, studentNumber: true } },
        teacher: { select: { fullNameAr: true, fullNameEn: true } },
      },
      take: 50,
      orderBy: [{ severity: 'desc' }, { lastDetectedAt: 'desc' }],
    }),
    prisma.managementKpiSnapshot.findMany({
      where: {
        schoolId,
        period,
        periodStart,
        kpiType: { in: ['ATTENDANCE_RATE', 'NOISE_SCORE', 'MOVEMENT_SCORE', 'CLASSROOM_PERFORMANCE_SCORE', 'STUDENT_ATTENTION_SCORE'] },
      },
      take: 100,
      orderBy: { value: 'asc' },
    }),
  ])

  const writes: Promise<unknown>[] = []

  for (const alert of alerts) {
    const target = alert.classroom?.classroomCode ?? alert.student?.fullNameEn ?? alert.teacher?.fullNameEn ?? alert.device?.deviceCode ?? 'school operations'
    writes.push(
      upsertRecommendation({
        schoolId,
        recommendationType: recommendationTypeFromAlert(alert.alertType),
        priority: priorityFromSeverity(alert.severity),
        subjectType: alert.classroomId ? 'CLASSROOM' : alert.studentId ? 'STUDENT' : alert.teacherId ? 'TEACHER' : 'SCHOOL',
        subjectId: alert.classroomId ?? alert.studentId ?? alert.teacherId ?? null,
        title: `Review ${alert.title.toLowerCase()}`,
        recommendation: `Review ${target} and take an administrative follow-up action based on the active alert.`,
        explanation: `This recommendation exists because the platform has an active ${alert.severity.toLowerCase()} alert: ${alert.description}`,
        evidence: {
          alertId: alert.id,
          alertType: alert.alertType,
          severity: alert.severity,
          sourceType: alert.sourceType,
          sourceKey: alert.sourceKey,
          createdAt: alert.createdAt,
        },
        dataSources: ['Alert'],
        sourceKey: `ai:recommendation:alert:${alert.id}`,
      }),
    )
  }

  for (const insight of insights) {
    const target = insight.classroom?.classroomCode ?? insight.student?.fullNameEn ?? insight.teacher?.fullNameEn ?? 'school operations'
    writes.push(
      upsertRecommendation({
        schoolId,
        recommendationType: recommendationTypeFromInsight(insight.insightType),
        priority: priorityFromSeverity(insight.severity),
        subjectType: insight.classroomId ? 'CLASSROOM' : insight.studentId ? 'STUDENT' : insight.teacherId ? 'TEACHER' : 'SCHOOL',
        subjectId: insight.classroomId ?? insight.studentId ?? insight.teacherId ?? null,
        title: `Investigate ${insight.title.toLowerCase()}`,
        recommendation: `Investigate ${target} using the active operational insight and supporting records.`,
        explanation: `This recommendation exists because the platform detected an active ${insight.severity.toLowerCase()} insight: ${insight.description}`,
        evidence: {
          insightId: insight.id,
          insightType: insight.insightType,
          severity: insight.severity,
          score: insight.score,
          sourceKey: insight.sourceKey,
          firstDetectedAt: insight.firstDetectedAt,
          lastDetectedAt: insight.lastDetectedAt,
        },
        dataSources: ['Insight'],
        sourceKey: `ai:recommendation:insight:${insight.id}`,
      }),
    )
  }

  for (const kpi of kpis.filter((item) => item.value < 75)) {
    const type =
      kpi.kpiType === 'NOISE_SCORE'
        ? 'NOISE_INCREASE'
        : kpi.kpiType === 'MOVEMENT_SCORE'
          ? 'MOVEMENT_INCREASE'
          : kpi.kpiType === 'STUDENT_ATTENTION_SCORE'
            ? 'STUDENT_REQUIRES_ATTENTION'
            : kpi.kpiType === 'CLASSROOM_PERFORMANCE_SCORE'
              ? 'CLASSROOM_PERFORMANCE_DECLINE'
              : 'ATTENDANCE_DROP'
    writes.push(
      upsertRecommendation({
        schoolId,
        recommendationType: type,
        priority: kpi.value < 50 ? 'CRITICAL' : kpi.value < 65 ? 'HIGH' : 'MEDIUM',
        subjectType: kpi.subjectType,
        subjectId: kpi.subjectId,
        title: `Review low ${kpi.kpiType.toLowerCase().replaceAll('_', ' ')}`,
        recommendation: 'Review the underlying attendance, movement, noise, alert, and insight records connected to this KPI.',
        explanation: `This recommendation exists because ${kpi.kpiType} is ${Math.round(kpi.value)} for the selected ${period.toLowerCase()} period.`,
        evidence: {
          kpiSnapshotId: kpi.id,
          kpiType: kpi.kpiType,
          value: kpi.value,
          scoreVersion: kpi.scoreVersion,
          period: kpi.period,
          periodStart: kpi.periodStart,
          periodEnd: kpi.periodEnd,
          metadata: kpi.metadata,
        },
        dataSources: ['ManagementKpiSnapshot'],
        sourceKey: `ai:recommendation:kpi:${kpi.id}`,
      }),
    )
  }

  await Promise.all(writes)
}

function avg(values: number[]) {
  if (!values.length) return 0
  return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10
}

export async function refreshAISummaries({
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
  const [kpis, alerts, insights, notifications] = await Promise.all([
    prisma.managementKpiSnapshot.findMany({
      where: { schoolId, period, periodStart },
      select: { id: true, kpiType: true, value: true, subjectType: true, subjectId: true },
    }),
    prisma.alert.findMany({
      where: { schoolId, createdAt: { gte: periodStart, lt: periodEnd } },
      select: { id: true, alertType: true, severity: true, status: true },
    }),
    prisma.insight.findMany({
      where: { schoolId, lastDetectedAt: { gte: periodStart, lt: periodEnd } },
      select: { id: true, insightType: true, severity: true, status: true },
    }),
    prisma.notification.findMany({
      where: { schoolId, createdAt: { gte: periodStart, lt: periodEnd } },
      select: { id: true, notificationType: true, notificationChannel: true, status: true },
    }),
  ])

  const attendance = avg(kpis.filter((item) => item.kpiType === 'ATTENDANCE_RATE' && item.subjectType === 'SCHOOL').map((item) => item.value))
  const noise = avg(kpis.filter((item) => item.kpiType === 'NOISE_SCORE' && item.subjectType === 'SCHOOL').map((item) => item.value))
  const performance = avg(kpis.filter((item) => item.kpiType === 'CLASSROOM_PERFORMANCE_SCORE' && item.subjectType === 'SCHOOL').map((item) => item.value))
  const criticalAlerts = alerts.filter((alert) => alert.severity === 'CRITICAL').length
  const activeInsights = insights.filter((insight) => insight.status === 'ACTIVE').length
  const pendingNotifications = notifications.filter((notification) => notification.status === 'PENDING').length

  await prisma.aISummary.upsert({
    where: { sourceKey: `ai:summary:${schoolId}:${period}:${sourceDate(periodStart)}` },
    create: {
      schoolId,
      summaryType: period === 'DAILY' || period === 'WEEKLY' || period === 'MONTHLY' || period === 'TERM' ? period : 'SCHOOL',
      period,
      subjectType: 'SCHOOL',
      title: `${period.toLowerCase()} school summary`,
      summary: `Attendance ${attendance || 0}%, quiet score ${noise || 0}, performance ${performance || 0}, ${criticalAlerts} critical alerts, and ${activeInsights} active insights.`,
      explanation: 'This summary is generated from existing management KPI snapshots, alerts, insights, and notification records for the selected period.',
      evidence: {
        kpiSnapshotIds: kpis.map((item) => item.id),
        alertIds: alerts.map((item) => item.id),
        insightIds: insights.map((item) => item.id),
        notificationIds: notifications.map((item) => item.id),
        metrics: {
          attendance,
          noise,
          performance,
          criticalAlerts,
          activeInsights,
          pendingNotifications,
        },
      },
      dataSources: ['ManagementKpiSnapshot', 'Alert', 'Insight', 'Notification'],
      sourceKey: `ai:summary:${schoolId}:${period}:${sourceDate(periodStart)}`,
    },
    update: {
      summary: `Attendance ${attendance || 0}%, quiet score ${noise || 0}, performance ${performance || 0}, ${criticalAlerts} critical alerts, and ${activeInsights} active insights.`,
      explanation: 'This summary is generated from existing management KPI snapshots, alerts, insights, and notification records for the selected period.',
      evidence: {
        kpiSnapshotIds: kpis.map((item) => item.id),
        alertIds: alerts.map((item) => item.id),
        insightIds: insights.map((item) => item.id),
        notificationIds: notifications.map((item) => item.id),
        metrics: {
          attendance,
          noise,
          performance,
          criticalAlerts,
          activeInsights,
          pendingNotifications,
        },
      },
      dataSources: ['ManagementKpiSnapshot', 'Alert', 'Insight', 'Notification'],
      generatedAt: new Date(),
    },
  })
}

const defaultAutomationDefinitions: Array<{
  name: string
  triggerType: AutomationTriggerType
  condition: Prisma.InputJsonValue
  actionType: AutomationActionType
  actionConfig: Prisma.InputJsonValue
  source: string
}> = [
  {
    name: 'Create dashboard notification when critical alert exists',
    triggerType: 'ALERT_CREATED',
    condition: { severity: 'CRITICAL' },
    actionType: 'CREATE_NOTIFICATION',
    actionConfig: { channel: 'DASHBOARD' },
    source: 'critical-alert-dashboard-notification',
  },
  {
    name: 'Create recommendation when active insight exists',
    triggerType: 'INSIGHT_CREATED',
    condition: { status: 'ACTIVE' },
    actionType: 'CREATE_RECOMMENDATION',
    actionConfig: { source: 'Insight' },
    source: 'active-insight-recommendation',
  },
  {
    name: 'Create recommendation when KPI drops below threshold',
    triggerType: 'KPI_DROPS',
    condition: { threshold: 75 },
    actionType: 'CREATE_RECOMMENDATION',
    actionConfig: { source: 'ManagementKpiSnapshot' },
    source: 'kpi-drop-recommendation',
  },
  {
    name: 'Create recommendation when device is offline',
    triggerType: 'DEVICE_OFFLINE',
    condition: { connectionStatus: 'OFFLINE' },
    actionType: 'CREATE_RECOMMENDATION',
    actionConfig: { source: 'Alert.DEVICE_OFFLINE' },
    source: 'device-offline-recommendation',
  },
]

export async function ensureAutomationDefinitions(schoolId: string) {
  await Promise.all(
    defaultAutomationDefinitions.map((definition) =>
      prisma.automationDefinition.upsert({
        where: { sourceKey: `automation:${schoolId}:${definition.source}` },
        create: {
          schoolId,
          name: definition.name,
          triggerType: definition.triggerType,
          condition: definition.condition,
          actionType: definition.actionType,
          actionConfig: definition.actionConfig,
          sourceKey: `automation:${schoolId}:${definition.source}`,
        },
        update: {
          name: definition.name,
          triggerType: definition.triggerType,
          condition: definition.condition,
          actionType: definition.actionType,
          actionConfig: definition.actionConfig,
        },
      }),
    ),
  )
}
