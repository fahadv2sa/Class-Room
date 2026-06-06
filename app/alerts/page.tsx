'use client'

import { useEffect, useState } from 'react'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { StatCard } from '@/components/stat-card'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Segmented } from '@/components/ui/segmented'
import { useLevel } from '@/components/level-provider'
import { levelMap } from '@/lib/mock-data'
import { useLanguage } from '@/components/language-provider'
import { withLevel } from '@/lib/i18n/ui'
import {
  Volume2,
  Footprints,
  Cpu,
  ClipboardCheck,
  CheckCircle2,
  Bell,
  AlertTriangle,
  Clock,
} from 'lucide-react'

type AlertRecord = {
  id: string
  alertType: string
  severity: 'INFO' | 'WARNING' | 'CRITICAL'
  status: 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED'
  title: string
  sourceType: string
  createdAt: string
  classroom?: { classroomCode: string } | null
}

type InsightRecord = {
  id: string
  insightType: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH'
  status: 'ACTIVE' | 'DISMISSED' | 'RESOLVED'
  title: string
  lastDetectedAt: string
  classroom?: { classroomCode: string } | null
}

const typeIcon: Record<string, typeof Volume2> = {
  HIGH_NOISE_EVENT: Volume2,
  EXCESSIVE_STUDENT_EXITS: Footprints,
  DEVICE_OFFLINE: Cpu,
  STUDENT_LATE: ClipboardCheck,
  STUDENT_ABSENT: ClipboardCheck,
}

const filters = [
  { value: 'all', labelKey: 'common.all' },
  { value: 'active', labelKey: 'alerts.filterActive' },
  { value: 'resolved', labelKey: 'alerts.filterResolved' },
]

export default function AlertsPage() {
  const { level } = useLevel()
  const { t } = useLanguage()
  const [filter, setFilter] = useState('all')
  const [alerts, setAlerts] = useState<AlertRecord[]>([])
  const [insights, setInsights] = useState<InsightRecord[]>([])
  const [loading, setLoading] = useState(true)

  const lvl = level ? levelMap[level] : null

  useEffect(() => {
    let active = true

    async function loadOperationalSignals() {
      setLoading(true)
      const [alertsResponse, insightsResponse] = await Promise.all([
        fetch('/api/alerts?pageSize=100'),
        fetch('/api/insights?pageSize=100'),
      ])
      const [alertsData, insightsData] = await Promise.all([
        alertsResponse.ok ? alertsResponse.json() : Promise.resolve({ alerts: [] }),
        insightsResponse.ok ? insightsResponse.json() : Promise.resolve({ insights: [] }),
      ])
      if (!active) return
      setAlerts(alertsData.alerts ?? [])
      setInsights(insightsData.insights ?? [])
      setLoading(false)
    }

    loadOperationalSignals().catch(() => {
      if (!active) return
      setAlerts([])
      setInsights([])
      setLoading(false)
    })

    return () => {
      active = false
    }
  }, [])

  const filtered = alerts.filter((a) =>
    filter === 'all'
      ? true
      : filter === 'active'
        ? a.status !== 'RESOLVED'
        : a.status === 'RESOLVED',
  )

  const active = alerts.filter((a) => a.status !== 'RESOLVED')
  const urgent = active.filter((a) => a.severity === 'CRITICAL' || a.severity === 'WARNING')
  const activeInsights = insights.filter((insight) => insight.status === 'ACTIVE')

  async function markResolved(alertId: string) {
    const response = await fetch(`/api/alerts/${alertId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'RESOLVED' }),
    })
    if (!response.ok) return
    const data = await response.json()
    setAlerts((current) => current.map((alert) => (alert.id === alertId ? data.alert : alert)))
  }

  if (!level || !lvl) return null

  return (
    <DashboardShell
      title={t('alerts.title')}
      subtitle={withLevel('alerts.subtitle', level, t)}
    >
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label={t('alerts.active')} value={active.length} icon={Bell} tone="danger" />
          <StatCard label={t('alerts.urgentHigh')} value={urgent.length} icon={AlertTriangle} tone="warning" />
          <StatCard label={t('alerts.resolvedToday')} value={alerts.filter((a) => a.status === 'RESOLVED').length} icon={CheckCircle2} tone="success" />
          <StatCard label={t('alerts.avgResponse')} value="6" unit={t('settings.minutes')} icon={Clock} tone="accent" />
        </div>

        <Card className="p-0">
          <div className="flex flex-col gap-3 border-b border-border/60 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-base font-extrabold tracking-tight">{t('alerts.list')}</h3>
              <p className="text-xs text-muted-foreground">
                {filtered.length} {t('alerts.count')}
              </p>
            </div>
            <Segmented options={filters.map((f) => ({ value: f.value, label: t(f.labelKey) }))} value={filter} onChange={setFilter} />
          </div>

          <div className="divide-y divide-border/60">
            {loading && (
              <p className="py-14 text-center text-sm text-muted-foreground">
                {t('common.loading')}
              </p>
            )}
            {!loading && filtered.length === 0 && (
              <p className="py-14 text-center text-sm text-muted-foreground">
                {t('alerts.empty')}
              </p>
            )}
            {filtered.map((a) => {
              const Icon = typeIcon[a.alertType] ?? Bell
              const tone =
                a.severity === 'CRITICAL'
                  ? 'bg-destructive/10 text-destructive'
                  : a.severity === 'WARNING'
                    ? 'bg-warning/10 text-[#b45309]'
                    : 'bg-muted text-muted-foreground'
              return (
                <div
                  key={a.id}
                  className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center"
                >
                  <div className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${tone}`}>
                    <Icon className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-bold">{a.title}</p>
                      <Badge variant={a.severity === 'CRITICAL' ? 'danger' : a.severity === 'WARNING' ? 'warning' : 'default'}>
                        {t(`alerts.severity.${a.severity}`)}
                      </Badge>
                      {a.status === 'RESOLVED' && (
                        <Badge variant="success">
                          <CheckCircle2 className="size-3" /> {t('alerts.resolved')}
                        </Badge>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {a.classroom?.classroomCode ?? t('alerts.platform')} · {t(`alerts.type.${a.alertType}`)} · {new Date(a.createdAt).toLocaleString()}
                    </p>
                  </div>
                  {a.status !== 'RESOLVED' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => markResolved(a.id)}
                      className="shrink-0"
                    >
                      <CheckCircle2 className="size-4" /> {t('alerts.markResolved')}
                    </Button>
                  )}
                </div>
              )
            })}
          </div>
        </Card>

        <Card className="p-0">
          <div className="border-b border-border/60 p-5">
            <h3 className="text-base font-extrabold tracking-tight">{t('alerts.insights')}</h3>
            <p className="text-xs text-muted-foreground">
              {activeInsights.length} {t('alerts.insightCount')}
            </p>
          </div>

          <div className="divide-y divide-border/60">
            {activeInsights.length === 0 && (
              <p className="py-14 text-center text-sm text-muted-foreground">
                {t('alerts.insightsEmpty')}
              </p>
            )}
            {activeInsights.map((insight) => (
              <div key={insight.id} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
                  <AlertTriangle className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-bold">{insight.title}</p>
                    <Badge variant={insight.severity === 'HIGH' ? 'danger' : insight.severity === 'MEDIUM' ? 'warning' : 'default'}>
                      {t(`alerts.insightSeverity.${insight.severity}`)}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {insight.classroom?.classroomCode ?? t('alerts.platform')} · {t(`alerts.insightType.${insight.insightType}`)} · {new Date(insight.lastDetectedAt).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </DashboardShell>
  )
}
