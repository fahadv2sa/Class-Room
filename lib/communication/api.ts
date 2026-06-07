import type {
  ExportFormat,
  NotificationChannel,
  NotificationStatus,
  NotificationType,
  Prisma,
  ReportDefinitionType,
  SummaryPeriod,
} from '@prisma/client'
import { scopedSchoolId } from '@/lib/academic/access'
import type { AuthContext } from '@/lib/auth/session'
import { prisma } from '@/lib/prisma'
import { defaultSchoolSettings, optionalBoolean } from '@/lib/settings/defaults'

export const notificationInclude = {
  alert: {
    select: {
      id: true,
      alertType: true,
      severity: true,
      status: true,
      createdAt: true,
    },
  },
  insight: {
    select: {
      id: true,
      insightType: true,
      severity: true,
      status: true,
      lastDetectedAt: true,
    },
  },
} satisfies Prisma.NotificationInclude

export const reportInclude = {
  exportDefinitions: {
    orderBy: { format: 'asc' },
  },
} satisfies Prisma.ReportDefinitionInclude

export function communicationSchoolId(auth: AuthContext, requestedSchoolId?: string | null) {
  return scopedSchoolId(auth, requestedSchoolId)
}

export function requireCommunicationSchoolId(auth: AuthContext, requestedSchoolId?: string | null) {
  const schoolId = communicationSchoolId(auth, requestedSchoolId)
  if (!schoolId) throw new Response('schoolId is required for this communication request', { status: 400 })
  return schoolId
}

export async function ensureCommunicationSettings(schoolId: string) {
  return prisma.schoolSettings.upsert({
    where: { schoolId },
    update: {},
    create: {
      schoolId,
      ...defaultSchoolSettings,
    },
  })
}

export function normalizeNotificationStatus(value: unknown): NotificationStatus | undefined {
  const status = String(value ?? '').trim().toUpperCase()
  if (status === 'PENDING' || status === 'READY' || status === 'SENT' || status === 'FAILED' || status === 'CANCELLED') {
    return status
  }
  return undefined
}

export function normalizeNotificationChannel(value: unknown): NotificationChannel | undefined {
  const channel = String(value ?? '').trim().toUpperCase()
  if (channel === 'DASHBOARD' || channel === 'EMAIL' || channel === 'WHATSAPP') return channel
  return undefined
}

export function normalizeNotificationType(value: unknown): NotificationType | undefined {
  const type = String(value ?? '').trim().toUpperCase()
  if (type === 'ALERT' || type === 'INSIGHT' || type === 'REPORT') return type
  return undefined
}

export function normalizeReportDefinitionType(value: unknown): ReportDefinitionType | undefined {
  const type = String(value ?? '').trim().toUpperCase()
  if (type === 'DAILY_SUMMARY' || type === 'WEEKLY_SUMMARY' || type === 'MONTHLY_SUMMARY') return type
  return undefined
}

export function normalizeSummaryPeriod(value: unknown): SummaryPeriod | undefined {
  const period = String(value ?? '').trim().toUpperCase()
  if (period === 'DAILY' || period === 'WEEKLY' || period === 'MONTHLY') return period
  return undefined
}

export function normalizeExportFormat(value: unknown): ExportFormat | undefined {
  const format = String(value ?? '').trim().toUpperCase()
  if (format === 'PDF' || format === 'EXCEL') return format
  return undefined
}

export function deliveryPreferenceUpdate(body: Record<string, unknown> | null | undefined) {
  return {
    dashboardNotificationsEnabled: optionalBoolean(
      body?.dashboardNotificationsEnabled ?? body?.dashboard_notifications_enabled,
    ),
    emailNotificationsEnabled: optionalBoolean(
      body?.emailNotificationsEnabled ?? body?.email_notifications_enabled,
    ),
    whatsappNotificationsEnabled: optionalBoolean(
      body?.whatsappNotificationsEnabled ?? body?.whatsapp_notifications_enabled,
    ),
  }
}

function enabledChannels(settings: {
  dashboardNotificationsEnabled: boolean
  emailNotificationsEnabled: boolean
  whatsappNotificationsEnabled: boolean
}) {
  const channels: NotificationChannel[] = []
  if (settings.dashboardNotificationsEnabled) channels.push('DASHBOARD')
  if (settings.emailNotificationsEnabled) channels.push('EMAIL')
  if (settings.whatsappNotificationsEnabled) channels.push('WHATSAPP')
  return channels
}

export async function materializeCommunicationRecords(schoolId: string) {
  const settings = await ensureCommunicationSettings(schoolId)
  const channels = enabledChannels(settings)
  if (!channels.length) return

  const [alerts, insights] = await Promise.all([
    prisma.alert.findMany({
      where: { schoolId },
      select: { id: true, title: true, description: true },
      orderBy: { createdAt: 'desc' },
      take: 200,
    }),
    prisma.insight.findMany({
      where: { schoolId },
      select: { id: true, title: true, description: true },
      orderBy: { lastDetectedAt: 'desc' },
      take: 200,
    }),
  ])

  const data: Prisma.NotificationCreateManyInput[] = []
  for (const channel of channels) {
    for (const alert of alerts) {
      data.push({
        schoolId,
        alertId: alert.id,
        notificationType: 'ALERT',
        notificationChannel: channel,
        title: alert.title,
        message: alert.description,
        status: 'PENDING',
        sourceKey: `alert:${alert.id}:${channel}`,
      })
    }
    for (const insight of insights) {
      data.push({
        schoolId,
        insightId: insight.id,
        notificationType: 'INSIGHT',
        notificationChannel: channel,
        title: insight.title,
        message: insight.description,
        status: 'PENDING',
        sourceKey: `insight:${insight.id}:${channel}`,
      })
    }
  }

  if (data.length) {
    await prisma.notification.createMany({
      data,
      skipDuplicates: true,
    })
  }
}

const defaultReportDefinitions: Array<{
  reportType: ReportDefinitionType
  name: string
  description: string
  period: SummaryPeriod
  dataSources: string[]
}> = [
  {
    reportType: 'DAILY_SUMMARY',
    name: 'Daily Summary',
    description: 'Daily school operations summary definition using existing analytics, alerts, and insights.',
    period: 'DAILY',
    dataSources: ['ManagementKpiSnapshot', 'Alert', 'Insight'],
  },
  {
    reportType: 'WEEKLY_SUMMARY',
    name: 'Weekly Summary',
    description: 'Weekly school operations summary definition using existing analytics, rankings, and trends.',
    period: 'WEEKLY',
    dataSources: ['ManagementKpiSnapshot', 'AnalyticsRankings', 'AnalyticsTrends'],
  },
  {
    reportType: 'MONTHLY_SUMMARY',
    name: 'Monthly Summary',
    description: 'Monthly school operations summary definition using existing analytics comparisons and trends.',
    period: 'MONTHLY',
    dataSources: ['ManagementKpiSnapshot', 'AnalyticsComparisons', 'AnalyticsTrends'],
  },
]

export async function ensureReportDefinitions(schoolId: string) {
  const definitions = []
  for (const definition of defaultReportDefinitions) {
    const report = await prisma.reportDefinition.upsert({
      where: {
        schoolId_reportType: {
          schoolId,
          reportType: definition.reportType,
        },
      },
      update: {
        name: definition.name,
        description: definition.description,
        period: definition.period,
        dataSources: definition.dataSources,
        isActive: true,
      },
      create: {
        schoolId,
        ...definition,
      },
    })

    for (const format of ['PDF', 'EXCEL'] as const) {
      await prisma.exportDefinition.upsert({
        where: {
          schoolId_reportDefinitionId_format: {
            schoolId,
            reportDefinitionId: report.id,
            format,
          },
        },
        update: {
          name: `${report.name} ${format}`,
          isActive: true,
        },
        create: {
          schoolId,
          reportDefinitionId: report.id,
          format,
          name: `${report.name} ${format}`,
          isActive: true,
        },
      })
    }

    definitions.push(report)
  }
  return definitions
}
