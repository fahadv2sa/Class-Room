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
  levelMap,
} from '@/lib/mock-data'
import { LogOut, Timer, Repeat, Clock, LogIn, Undo2 } from 'lucide-react'

const typeMeta: Record<string, { badge: 'success' | 'danger' | 'accent'; icon: typeof LogIn }> = {
  دخول: { badge: 'success', icon: LogIn },
  خروج: { badge: 'danger', icon: LogOut },
  عودة: { badge: 'accent', icon: Undo2 },
}

const statusBadge: Record<string, 'success' | 'warning' | 'danger'> = {
  بإذن: 'success',
  متأخر: 'warning',
  'لم يعد بعد': 'danger',
}

export default function MovementPage() {
  const { level } = useLevel()
  if (!level) return null

  const lvl = levelMap[level]
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
      title="حركة الطلاب"
      subtitle={`تتبع لحظي لحركة الفصول · ${lvl.ar}`}
    >
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="أكثر الطلاب خروجاً اليوم" value={topStudent?.name ?? '—'} icon={Repeat} tone="warning" />
          <StatCard label="أكثر الفصول خروجاً" value={topClass?.code ?? '—'} icon={LogOut} tone="danger" />
          <StatCard label="متوسط مدة الخروج" value="8" unit="دقائق" icon={Timer} tone="accent" />
          <StatCard label="أوقات الذروة للخروج" value="12:00" unit="ظهراً" icon={Clock} tone="accent" />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Live feed */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>سجل الحركة المباشر</CardTitle>
              <Badge variant="accent">
                <span className="size-1.5 rounded-full bg-accent live-dot" /> مباشر
              </Badge>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <THead>
                  <TR className="hover:bg-transparent">
                    <TH>الطالب</TH>
                    <TH>الفصل</TH>
                    <TH>المعلم</TH>
                    <TH>الحركة</TH>
                    <TH>الوقت</TH>
                    <TH>المدة خارج الفصل</TH>
                    <TH>الحالة</TH>
                  </TR>
                </THead>
                <tbody>
                  {movements.map((m) => {
                    const t = typeMeta[m.type]
                    const Icon = t.icon
                    return (
                      <TR key={m.id}>
                        <TD className="font-bold">{m.student}</TD>
                        <TD className="text-muted-foreground">{m.classroom}</TD>
                        <TD className="text-muted-foreground">{m.teacher}</TD>
                        <TD>
                          <Badge variant={t.badge}>
                            <Icon className="size-3" /> {m.type}
                          </Badge>
                        </TD>
                        <TD className="tabular-nums">{m.time}</TD>
                        <TD className="tabular-nums">{m.duration}</TD>
                        <TD>
                          <Badge variant={statusBadge[m.status]}>{m.status}</Badge>
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
              <CardTitle>الخروج والعودة حسب الساعة</CardTitle>
            </CardHeader>
            <CardContent>
              <MovementLineChart data={movementByHour} />
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>أكثر الطلاب خروجاً اليوم</CardTitle>
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
                  <Badge variant="warning">{s.exits} مرات</Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>أكثر الفصول خروجاً</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-2">
              {topExitClasses.map((c, i) => (
                <div key={c.id} className="flex items-center justify-between rounded-xl bg-muted/50 px-3.5 py-2.5">
                  <div className="flex items-center gap-3">
                    <span className="flex size-7 items-center justify-center rounded-lg bg-card text-xs font-bold text-muted-foreground">{i + 1}</span>
                    <span className="text-sm font-semibold">{c.name}</span>
                  </div>
                  <Badge variant="danger">{c.outside} خارج الفصل</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  )
}
