import { notFound } from 'next/navigation'
import Link from 'next/link'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { NoiseMeter } from '@/components/noise-meter'
import { NoiseAreaChart } from '@/components/charts'
import {
  classrooms,
  students,
  getEntryExitTimeline,
  getNoiseHistory,
  teachers,
} from '@/lib/mock-data'
import {
  ChevronRight,
  Wifi,
  WifiOff,
  UserCheck,
  UserX,
  LogOut,
  LogIn,
  Undo2,
  BookOpen,
  StickyNote,
} from 'lucide-react'

export function generateStaticParams() {
  return classrooms.map((c) => ({ id: c.id }))
}

export default async function ClassroomDetail({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const c = classrooms.find((x) => x.id === id)
  if (!c) notFound()

  const inside = students.filter((s) => s.classroom === c.name && s.status === 'inside')
  const outside = students.filter((s) => s.classroom === c.name && s.status === 'outside')
  const teacher = teachers.find((t) => t.name === c.teacher)
  const entryExitTimeline = getEntryExitTimeline(c.code)
  const noiseHistory = getNoiseHistory(c.code)

  const notes = [
    'تم تنبيه الفصل بخصوص ارتفاع الصوت أثناء النشاط الجماعي.',
    'الحصة الثالثة سجلت أفضل مستوى هدوء خلال اليوم.',
    'طالبان بحاجة لمتابعة بسبب تكرار الخروج.',
  ]

  return (
    <DashboardShell title={c.name} subtitle={`${c.stage} · ${c.subject}`}>
      <div className="space-y-6">
        <Link
          href="/classrooms"
          className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground"
        >
          <ChevronRight className="size-4" /> العودة إلى الفصول
        </Link>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Live noise */}
          <Card className="flex flex-col items-center justify-center gap-4 p-6 text-center">
            <div className="flex items-center gap-2 self-start">
              <span className="size-2.5 rounded-full bg-success live-dot" />
              <CardTitle>المراقبة المباشرة للضوضاء</CardTitle>
            </div>
            <NoiseMeter value={c.noise} size="lg" />
            <p className="text-sm text-muted-foreground">
              يتم تحديث القراءة كل عدة ثوانٍ من جهاز الفصل
            </p>
          </Card>

          {/* Attendance summary */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>ملخص الحضور</CardTitle>
              {c.deviceStatus === 'online' ? (
                <Badge variant="success"><Wifi className="size-3" /> الجهاز متصل</Badge>
              ) : (
                <Badge variant="danger"><WifiOff className="size-3" /> الجهاز غير متصل</Badge>
              )}
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Metric icon={UserCheck} tone="success" label="الحاضرون" value={c.present} />
              <Metric icon={UserX} tone="danger" label="الغائبون" value={c.absent} />
              <Metric icon={LogOut} tone="warning" label="خارج الفصل" value={c.outside} />
              <Metric icon={BookOpen} tone="accent" label="إجمالي الطلاب" value={c.totalStudents} />

              {teacher && (
                <div className="col-span-2 mt-1 rounded-xl border border-border/60 bg-muted/40 p-4 sm:col-span-4">
                  <p className="mb-3 text-sm font-bold">أداء المعلم — {teacher.name}</p>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <MiniStat label="هدوء الفصل" value={`${teacher.avgQuiet}٪`} />
                    <MiniStat label="حضور الطلاب" value={`${teacher.attendanceRate}٪`} />
                    <MiniStat label="متوسط الخروج" value={teacher.avgExits.toFixed(1)} />
                    <MiniStat label="مؤشر الانضباط" value={`${teacher.discipline}٪`} />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Students inside */}
          <Card>
            <CardHeader>
              <CardTitle>الطلاب داخل الفصل ({inside.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-2">
              {inside.length === 0 && (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  لا يوجد طلاب مسجلون داخل هذا الفصل حالياً.
                </p>
              )}
              {inside.map((s) => (
                <StudentRow key={s.id} name={s.name} card={s.cardId} tone="success" label="بالداخل" />
              ))}
            </CardContent>
          </Card>

          {/* Students outside */}
          <Card>
            <CardHeader>
              <CardTitle>الطلاب خارج الفصل ({outside.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-2">
              {outside.length === 0 && (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  جميع الطلاب داخل الفصل حالياً.
                </p>
              )}
              {outside.map((s) => (
                <StudentRow key={s.id} name={s.name} card={s.cardId} tone="warning" label={s.lastMovement} />
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>سجل الدخول والخروج</CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <ol className="relative space-y-4 border-r border-border pr-4">
                {entryExitTimeline.map((e, i) => {
                  const map = {
                    دخول: { icon: LogIn, color: 'text-success', bg: 'bg-success' },
                    خروج: { icon: LogOut, color: 'text-destructive', bg: 'bg-destructive' },
                    عودة: { icon: Undo2, color: 'text-accent', bg: 'bg-accent' },
                  }[e.type]!
                  const Icon = map.icon
                  return (
                    <li key={i} className="relative">
                      <span
                        className={`absolute -right-[22px] top-1 size-3 rounded-full ring-4 ring-card ${map.bg}`}
                      />
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2 text-sm font-semibold">
                          <Icon className={`size-4 ${map.color}`} />
                          {e.student}
                        </span>
                        <span className="text-xs text-muted-foreground">{e.time}</span>
                      </div>
                      <span className={`text-xs ${map.color}`}>{e.type}</span>
                    </li>
                  )
                })}
              </ol>
            </CardContent>
          </Card>

          {/* Noise history */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>سجل الضوضاء خلال اليوم</CardTitle>
            </CardHeader>
            <CardContent>
              <NoiseAreaChart data={noiseHistory} />
            </CardContent>
          </Card>
        </div>

        {/* Daily notes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <StickyNote className="size-4 text-accent" /> الملاحظات اليومية
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-2">
            {notes.map((n, i) => (
              <div
                key={i}
                className="flex items-start gap-3 rounded-xl bg-muted/50 px-4 py-3 text-sm"
              >
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent" />
                <span>{n}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  )
}

function Metric({
  icon: Icon,
  tone,
  label,
  value,
}: {
  icon: typeof UserCheck
  tone: 'success' | 'danger' | 'warning' | 'accent'
  label: string
  value: number
}) {
  const map = {
    success: 'bg-success/10 text-success',
    danger: 'bg-destructive/10 text-destructive',
    warning: 'bg-warning/10 text-[#b45309]',
    accent: 'bg-accent/10 text-accent',
  }[tone]
  return (
    <div className="rounded-xl border border-border/60 p-4">
      <div className={`flex size-9 items-center justify-center rounded-lg ${map}`}>
        <Icon className="size-[18px]" />
      </div>
      <p className="mt-3 text-2xl font-extrabold tabular-nums">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-card px-3 py-2.5 text-center">
      <p className="text-lg font-extrabold tabular-nums">{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  )
}

function StudentRow({
  name,
  card,
  tone,
  label,
}: {
  name: string
  card: string
  tone: 'success' | 'warning'
  label: string
}) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-muted/40 px-3.5 py-2.5">
      <div className="flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-full bg-card text-sm font-bold">
          {name.charAt(0)}
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold">{name}</p>
          <p className="font-mono text-[11px] text-muted-foreground" dir="ltr">
            {card}
          </p>
        </div>
      </div>
      <Badge variant={tone === 'success' ? 'success' : 'warning'}>{label}</Badge>
    </div>
  )
}
