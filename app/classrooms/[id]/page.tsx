'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { NoiseMeter } from '@/components/noise-meter'
import { NoiseAreaChart } from '@/components/charts'
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

type StudentInfo = {
  id: string
  fullNameAr: string
  fullNameEn?: string | null
  cardCode: string
}

type StudentState = {
  id: string
  currentState: 'INSIDE_CLASSROOM' | 'OUTSIDE_CLASSROOM' | 'ABSENT'
  enteredAt?: string | null
  exitedAt?: string | null
  student: StudentInfo
}

type PresenceClassroom = {
  classroomId: string
  classroomCode: string
  classroomName: string
  totalStudents: number
  presentStudents: number
  absentStudents: number
  lateStudents: number
  studentsInside: number
  studentsOutside: number
  teacherInside: boolean
  states: StudentState[]
  teachersInside: { teacher: StudentInfo }[]
}

type NoiseEvent = {
  id: string
  startedAt: string
  endedAt?: string | null
  averageDb?: number | null
  peakDb?: number | null
}

type NoiseClassroom = {
  classroomId: string
  classroomCode: string
  classroomName: string
  device: { connectionStatus: 'ONLINE' | 'OFFLINE' | 'MAINTENANCE' } | null
  state: { currentDb: number; updatedAt: string } | null
}

type MovementRecord = {
  id: string
  status: 'OPEN' | 'CLOSED'
  exitedAt: string
  returnedAt?: string | null
  student: StudentInfo
}

const notes = [
  'تظهر هذه الصفحة بيانات الفصل التشغيلية من سجلات الحضور والضوضاء الحالية.',
  'تظل أي ملاحظات إدارية مستقبلية منفصلة عن مصدر بيانات الحضور والضوضاء.',
  'تعتمد دقة الحالة اللحظية على آخر جلسة حضور مفتوحة لهذا الفصل.',
]

export default function ClassroomDetail() {
  const params = useParams<{ id: string }>()
  const classroomId = params.id
  const [presence, setPresence] = useState<PresenceClassroom | null>(null)
  const [noise, setNoise] = useState<NoiseClassroom | null>(null)
  const [noiseEvents, setNoiseEvents] = useState<NoiseEvent[]>([])
  const [movements, setMovements] = useState<MovementRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true

    async function loadClassroom() {
      if (!classroomId) return
      setLoading(true)
      try {
        const [presenceResponse, noiseResponse, movementsResponse] = await Promise.all([
          fetch(`/api/presence/classrooms/${classroomId}`),
          fetch(`/api/noise/classrooms/${classroomId}`),
          fetch(`/api/movements/students?classroomId=${classroomId}&pageSize=10`),
        ])

        if (!alive) return

        if (presenceResponse.ok) {
          const data = await presenceResponse.json()
          setPresence(data.classroom ?? null)
        }

        if (noiseResponse.ok) {
          const data = await noiseResponse.json()
          setNoise(data.classroom ?? null)
          setNoiseEvents(data.events ?? [])
        }

        if (movementsResponse.ok) {
          const data = await movementsResponse.json()
          setMovements(data.movements ?? [])
        }
      } finally {
        if (alive) setLoading(false)
      }
    }

    loadClassroom()
    return () => {
      alive = false
    }
  }, [classroomId])

  const classroom = presence ?? noise
  const title = classroom?.classroomName || classroom?.classroomCode || 'الفصل'
  const subtitle = classroom?.classroomCode || 'بيانات الفصل'
  const inside = (presence?.states ?? []).filter((s) => s.currentState === 'INSIDE_CLASSROOM')
  const outside = (presence?.states ?? []).filter((s) => s.currentState === 'OUTSIDE_CLASSROOM')
  const teacher = presence?.teachersInside[0]?.teacher
  const deviceOnline = noise?.device?.connectionStatus === 'ONLINE'
  const currentNoise = noise?.state?.currentDb ?? 0
  const noiseHistory = useMemo(
    () =>
      noiseEvents
        .slice()
        .reverse()
        .map((event) => ({
          time: new Date(event.startedAt).toLocaleTimeString('ar-SA', {
            hour: '2-digit',
            minute: '2-digit',
          }),
          noise: Math.round(event.averageDb ?? event.peakDb ?? 0),
        })),
    [noiseEvents],
  )

  return (
    <DashboardShell title={title} subtitle={subtitle}>
      <div className="space-y-6">
        <Link
          href="/classrooms"
          className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground"
        >
          <ChevronRight className="size-4" /> العودة إلى الفصول
        </Link>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="flex flex-col items-center justify-center gap-4 p-6 text-center">
            <div className="flex items-center gap-2 self-start">
              <span className="size-2.5 rounded-full bg-success live-dot" />
              <CardTitle>المراقبة المباشرة للضوضاء</CardTitle>
            </div>
            <NoiseMeter value={currentNoise} size="lg" />
            <p className="text-sm text-muted-foreground">
              يتم تحديث القراءة من آخر حالة ضوضاء مسجلة لجهاز الفصل.
            </p>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>ملخص الحضور</CardTitle>
              {deviceOnline ? (
                <Badge variant="success"><Wifi className="size-3" /> الجهاز متصل</Badge>
              ) : (
                <Badge variant="danger"><WifiOff className="size-3" /> الجهاز غير متصل</Badge>
              )}
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Metric icon={UserCheck} tone="success" label="الحاضرون" value={(presence?.presentStudents ?? 0) + (presence?.lateStudents ?? 0)} />
              <Metric icon={UserX} tone="danger" label="الغائبون" value={presence?.absentStudents ?? 0} />
              <Metric icon={LogOut} tone="warning" label="خارج الفصل" value={presence?.studentsOutside ?? 0} />
              <Metric icon={BookOpen} tone="accent" label="إجمالي الطلاب" value={presence?.totalStudents ?? 0} />

              {teacher && (
                <div className="col-span-2 mt-1 rounded-xl border border-border/60 bg-muted/40 p-4 sm:col-span-4">
                  <p className="mb-3 text-sm font-bold">المعلم داخل الفصل - {teacher.fullNameAr}</p>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <MiniStat label="حالة الحضور" value="داخل الفصل" />
                    <MiniStat label="عدد الطلاب" value={`${presence?.totalStudents ?? 0}`} />
                    <MiniStat label="خارج الفصل" value={`${presence?.studentsOutside ?? 0}`} />
                    <MiniStat label="الضوضاء الحالية" value={`${Math.round(currentNoise)} dB`} />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>الطلاب داخل الفصل ({inside.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-2">
              {!loading && inside.length === 0 && (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  لا يوجد طلاب مسجلون داخل هذا الفصل حاليا.
                </p>
              )}
              {inside.map((state) => (
                <StudentRow key={state.id} name={state.student.fullNameAr} card={state.student.cardCode} tone="success" label="بالداخل" />
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>الطلاب خارج الفصل ({outside.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-2">
              {!loading && outside.length === 0 && (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  جميع الطلاب داخل الفصل حاليا.
                </p>
              )}
              {outside.map((state) => (
                <StudentRow key={state.id} name={state.student.fullNameAr} card={state.student.cardCode} tone="warning" label="خارج الفصل" />
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>سجل الدخول والخروج</CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <ol className="relative space-y-4 border-r border-border pr-4">
                {movements.map((movement) => (
                  <MovementItem key={`${movement.id}-exit`} student={movement.student.fullNameAr} time={movement.exitedAt} type="خروج" />
                ))}
                {movements.length === 0 && (
                  <p className="py-4 text-center text-sm text-muted-foreground">
                    لا توجد حركات مسجلة لهذا الفصل حاليا.
                  </p>
                )}
              </ol>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>سجل الضوضاء خلال اليوم</CardTitle>
            </CardHeader>
            <CardContent>
              <NoiseAreaChart data={noiseHistory.length > 0 ? noiseHistory : [{ time: 'الآن', noise: currentNoise }]} />
            </CardContent>
          </Card>
        </div>

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

function MovementItem({
  student,
  time,
  type,
}: {
  student: string
  time: string
  type: 'دخول' | 'خروج' | 'عودة'
}) {
  const map = {
    دخول: { icon: LogIn, color: 'text-success', bg: 'bg-success' },
    خروج: { icon: LogOut, color: 'text-destructive', bg: 'bg-destructive' },
    عودة: { icon: Undo2, color: 'text-accent', bg: 'bg-accent' },
  }[type]
  const Icon = map.icon
  return (
    <li className="relative">
      <span className={`absolute -right-[22px] top-1 size-3 rounded-full ring-4 ring-card ${map.bg}`} />
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm font-semibold">
          <Icon className={`size-4 ${map.color}`} />
          {student}
        </span>
        <span className="text-xs text-muted-foreground">
          {new Date(time).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
      <span className={`text-xs ${map.color}`}>{type}</span>
    </li>
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
