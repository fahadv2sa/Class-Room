'use client'

import { DashboardShell } from '@/components/layout/dashboard-shell'
import { StatCard } from '@/components/stat-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, THead, TR, TH, TD } from '@/components/ui/table'
import { MovementLineChart } from '@/components/charts'
import { useLevel } from '@/components/level-provider'
import {
  getMovements,
  getMovementByHour,
  getStudents,
  getClassrooms,
} from '@/lib/mock-data'
import { LogOut, Timer, Repeat, Clock, LogIn, Undo2 } from 'lucide-react'
import { useLanguage } from '@/components/language-provider'
import { withLevel } from '@/lib/i18n/ui'

const typeMeta: Record<string, { badge: 'success' | 'danger' | 'accent'; icon: typeof LogIn }> = {
  entry: { badge: 'success', icon: LogIn },
  exit: { badge: 'danger', icon: LogOut },
  return: { badge: 'accent', icon: Undo2 },
}

const statusBadge: Record<string, 'success' | 'warning' | 'danger'> = {
  approved: 'success',
  late: 'warning',
  notReturned: 'danger',
}

const movementTypeKey: Record<string, string> = {
  دخول: 'entry',
  خروج: 'exit',
  عودة: 'return',
}

const movementStatusKey: Record<string, string> = {
  بإذن: 'approved',
  متأخر: 'late',
  'لم يعد بعد': 'notReturned',
}

const typeLabelKey: Record<string, string> = {
  entry: 'movement.entry',
  exit: 'movement.exit',
  return: 'movement.return',
}

const statusLabelKey: Record<string, string> = {
  approved: 'movement.approved',
  late: 'movement.late',
  notReturned: 'movement.notReturned',
}

export default function MovementPage() {
  const { level } = useLevel()
  const { t } = useLanguage()
  if (!level) return null

  const movements = getMovements(level)
  const movementByHour = getMovementByHour(level)
  const students = getStudents(level)
  const classrooms = getClassrooms(level)

  const topExitStudents = [...students]
    .sort((a, b) => b.exits - a.exits)
    .slice(0, 5)
  const topExitClasses = [...classrooms]
    .sort((a, b) => b.outside - a.outside)
    .slice(0, 5)
  const topStudent = topExitStudents[0]
  const topClass = topExitClasses[0]

  return (
    <DashboardShell
      title={t('movement.title')}
      subtitle={withLevel('movement.subtitle', level, t)}
    >
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label={t('movement.topStudent')} value={topStudent?.name ?? '—'} icon={Repeat} tone="warning" />
          <StatCard label={t('movement.topClass')} value={topClass?.code ?? '—'} icon={LogOut} tone="danger" />
          <StatCard label={t('movement.avgDuration')} value="8" unit={t('settings.minutes')} icon={Timer} tone="accent" />
          <StatCard label={t('movement.peakTime')} value="12:00" unit={t('common.pm')} icon={Clock} tone="accent" />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Live feed */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>{t('movement.liveLog')}</CardTitle>
              <Badge variant="accent">
                <span className="size-1.5 rounded-full bg-accent live-dot" /> {t('common.live')}
              </Badge>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <THead>
                  <TR className="hover:bg-transparent">
                    <TH>{t('attendance.student')}</TH>
                    <TH>{t('classrooms.classroom')}</TH>
                    <TH>{t('movement.teacher')}</TH>
                    <TH>{t('movement.type')}</TH>
                    <TH>{t('common.time')}</TH>
                    <TH>{t('movement.durationOutside')}</TH>
                    <TH>{t('common.status')}</TH>
                  </TR>
                </THead>
                <tbody>
                  {movements.map((m) => {
                    const type = movementTypeKey[m.type] ?? 'entry'
                    const status = movementStatusKey[m.status] ?? 'approved'
                    const typeInfo = typeMeta[type]
                    const Icon = typeInfo.icon
                    return (
                      <TR key={m.id}>
                        <TD className="font-bold">{m.student}</TD>
                        <TD className="text-muted-foreground">{m.classroom}</TD>
                        <TD className="text-muted-foreground">{m.teacher}</TD>
                        <TD>
                          <Badge variant={typeInfo.badge}>
                            <Icon className="size-3" /> {t(typeLabelKey[type])}
                          </Badge>
                        </TD>
                        <TD className="tabular-nums">{m.time}</TD>
                        <TD className="tabular-nums">{m.duration}</TD>
                        <TD>
                          <Badge variant={statusBadge[status]}>{t(statusLabelKey[status])}</Badge>
                        </TD>
                      </TR>
                    )
                  })}
                </tbody>
              </Table>
            </CardContent>
          </Card>

          {/* Movement chart */}
          <Card>
            <CardHeader>
              <CardTitle>{t('dashboard.movementByHour')}</CardTitle>
            </CardHeader>
            <CardContent>
              <MovementLineChart data={movementByHour} />
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>{t('movement.topStudent')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-2">
              {topExitStudents.map((s, i) => (
                <div key={s.id} className="flex items-center justify-between rounded-xl bg-muted/50 px-3.5 py-2.5">
                  <div className="flex items-center gap-3">
                    <span className="flex size-7 items-center justify-center rounded-lg bg-card text-xs font-bold text-muted-foreground">{i + 1}</span>
                    <div className="leading-tight">
                      <p className="text-sm font-semibold">{s.name}</p>
                      <p className="text-[11px] text-muted-foreground">{s.classroom}</p>
                    </div>
                  </div>
                  <Badge variant="warning">{s.exits} {t('movement.times')}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('movement.topClass')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-2">
              {topExitClasses.map((c, i) => (
                <div key={c.id} className="flex items-center justify-between rounded-xl bg-muted/50 px-3.5 py-2.5">
                  <div className="flex items-center gap-3">
                    <span className="flex size-7 items-center justify-center rounded-lg bg-card text-xs font-bold text-muted-foreground">{i + 1}</span>
                    <span className="text-sm font-semibold">{c.name}</span>
                  </div>
                  <Badge variant="danger">{c.outside} {t('classrooms.outside')}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  )
}
