'use client'

import { useMemo, useState } from 'react'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { StatCard } from '@/components/stat-card'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Segmented } from '@/components/ui/segmented'
import { useLevel } from '@/components/level-provider'
import { getAlerts, severityMeta, levelMap } from '@/lib/mock-data'
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

const typeIcon: Record<string, typeof Volume2> = {
  ضوضاء: Volume2,
  'حركة طلاب': Footprints,
  جهاز: Cpu,
  حضور: ClipboardCheck,
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
  const [resolvedIds, setResolvedIds] = useState<string[]>([])

  const lvl = level ? levelMap[level] : null

  const data = useMemo(
    () =>
      (level ? getAlerts(level) : []).map((a) => ({
        ...a,
        resolved: a.resolved || resolvedIds.includes(a.id),
      })),
    [level, resolvedIds],
  )

  const filtered = data.filter((a) =>
    filter === 'all'
      ? true
      : filter === 'active'
        ? !a.resolved
        : a.resolved,
  )

  const active = data.filter((a) => !a.resolved)
  const urgent = active.filter((a) => a.severity === 'urgent' || a.severity === 'high')

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
          <StatCard label={t('alerts.resolvedToday')} value={data.filter((a) => a.resolved).length} icon={CheckCircle2} tone="success" />
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
            {filtered.length === 0 && (
              <p className="py-14 text-center text-sm text-muted-foreground">
                {t('alerts.empty')}
              </p>
            )}
            {filtered.map((a) => {
              const Icon = typeIcon[a.type] ?? Bell
              const sev = severityMeta[a.severity]
              const tone =
                a.severity === 'urgent'
                  ? 'bg-destructive/10 text-destructive'
                  : a.severity === 'high'
                    ? 'bg-destructive/10 text-destructive'
                    : a.severity === 'medium'
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
                      <Badge variant={sev.badge}>{sev.label}</Badge>
                      {a.resolved && (
                        <Badge variant="success">
                          <CheckCircle2 className="size-3" /> {t('alerts.resolved')}
                        </Badge>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {a.classroom} · {a.type} · {a.time}
                    </p>
                  </div>
                  {!a.resolved && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setResolvedIds((p) => [...p, a.id])}
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
      </div>
    </DashboardShell>
  )
}
