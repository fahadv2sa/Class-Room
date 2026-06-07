'use client'

import { useEffect, useMemo, useState } from 'react'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { StatCard } from '@/components/stat-card'
import { AIInsights } from '@/components/ai-insights'
import { ClassroomCard, type ClassroomCardData } from '@/components/classroom-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  NoiseAreaChart,
  AttendanceBarChart,
  NoiseRankBarChart,
  MovementLineChart,
} from '@/components/charts'
import { useLevel } from '@/components/level-provider'
import { useLanguage } from '@/components/language-provider'
import { percent, withLevel } from '@/lib/i18n/ui'
import { levelType } from '@/lib/levels'
import {
  Users,
  School,
  ClipboardCheck,
  Volume2,
  LogOut,
  Bell,
} from 'lucide-react'

type PresenceClassroom = {
  classroomId: string
  classroomCode: string
  classroomName: string
  attendanceSessionId: string | null
  totalStudents: number
  presentStudents: number
  absentStudents: number
  lateStudents: number
  studentsOutside: number
}

type NoiseClassroom = {
  classroomId: string
  classroomCode: string
  classroomName: string
  device: { connectionStatus: 'ONLINE' | 'OFFLINE' | 'MAINTENANCE' } | null
  state: {
    currentDb: number
    updatedAt: string
    activeNoiseEvent?: {
      teacher?: { fullNameAr: string } | null
    } | null
  } | null
}

type NoiseEvent = {
  id: string
  startedAt: string
  averageDb?: number | null
  peakDb?: number | null
}

type StudentMovement = {
  id: string
  exitedAt: string
  returnedAt?: string | null
}

type AIRecommendation = {
  id: string
  recommendationType: string
  priority: string
  title: string
  recommendation: string
  explanation: string
}

export default function DashboardPage() {
  const { level } = useLevel()
  const { t } = useLanguage()
  const [presenceClassrooms, setPresenceClassrooms] = useState<PresenceClassroom[]>([])
  const [noiseClassrooms, setNoiseClassrooms] = useState<NoiseClassroom[]>([])
  const [noiseEvents, setNoiseEvents] = useState<NoiseEvent[]>([])
  const [movements, setMovements] = useState<StudentMovement[]>([])
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([])
  const [activeAlerts, setActiveAlerts] = useState(0)

  useEffect(() => {
    let alive = true

    async function loadDashboard() {
      if (!level) return
      const apiLevel = levelType(level)
      const today = new Date().toISOString().slice(0, 10)
      const [
        presenceResponse,
        noiseResponse,
        noiseEventsResponse,
        movementsResponse,
        alertsResponse,
        recommendationsResponse,
      ] = await Promise.all([
        fetch(`/api/presence/classrooms?level=${apiLevel}`, { cache: 'no-store' }),
        fetch(`/api/noise/classrooms?level=${apiLevel}`, { cache: 'no-store' }),
        fetch(`/api/noise/events?from=${today}&to=${today}&pageSize=100`, { cache: 'no-store' }),
        fetch(`/api/movements/students?level=${apiLevel}&pageSize=100`, { cache: 'no-store' }),
        fetch('/api/alerts?status=OPEN&pageSize=1', { cache: 'no-store' }),
        fetch('/api/ai/recommendations?status=ACTIVE&pageSize=2', { cache: 'no-store' }),
      ])

      if (!alive) return

      if (presenceResponse.ok) {
        const data = await presenceResponse.json()
        setPresenceClassrooms(data.classrooms ?? [])
      }
      if (noiseResponse.ok) {
        const data = await noiseResponse.json()
        setNoiseClassrooms(data.classrooms ?? [])
      }
      if (noiseEventsResponse.ok) {
        const data = await noiseEventsResponse.json()
        setNoiseEvents(data.events ?? [])
      }
      if (movementsResponse.ok) {
        const data = await movementsResponse.json()
        setMovements(data.movements ?? [])
      }
      if (alertsResponse.ok) {
        const data = await alertsResponse.json()
        setActiveAlerts(Number(data.meta?.total ?? 0))
      }
      if (recommendationsResponse.ok) {
        const data = await recommendationsResponse.json()
        setRecommendations(data.recommendations ?? [])
      }
    }

    loadDashboard().catch(() => undefined)
    return () => {
      alive = false
    }
  }, [level])

  const noiseById = useMemo(
    () => new Map(noiseClassrooms.map((classroom) => [classroom.classroomId, classroom])),
    [noiseClassrooms],
  )
  const classrooms: ClassroomCardData[] = useMemo(
    () =>
      presenceClassrooms.map((classroom) => {
        const noise = noiseById.get(classroom.classroomId)
        return {
          id: classroom.classroomId,
          name: classroom.classroomName || classroom.classroomCode,
          subject: classroom.classroomCode,
          teacher: noise?.state?.activeNoiseEvent?.teacher?.fullNameAr ?? '-',
          noise: noise?.state?.currentDb ?? 0,
          present: classroom.presentStudents + classroom.lateStudents,
          absent: classroom.absentStudents,
          outside: classroom.studentsOutside,
          deviceStatus: noise?.device?.connectionStatus === 'ONLINE' ? 'online' : 'offline',
          lastUpdate: noise?.state?.updatedAt
            ? new Date(noise.state.updatedAt).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })
            : '-',
        }
      }),
    [noiseById, presenceClassrooms],
  )
  const totalStudents = presenceClassrooms.reduce((sum, classroom) => sum + classroom.totalStudents, 0)
  const presentStudents = presenceClassrooms.reduce(
    (sum, classroom) => sum + classroom.presentStudents + classroom.lateStudents,
    0,
  )
  const kpis = {
    totalStudents,
    totalClasses: presenceClassrooms.length,
    activeClasses: presenceClassrooms.filter((classroom) => classroom.attendanceSessionId).length,
    avgAttendance: totalStudents ? Math.round((presentStudents / totalStudents) * 100) : 0,
    avgNoise: noiseClassrooms.length
      ? Math.round(noiseClassrooms.reduce((sum, classroom) => sum + (classroom.state?.currentDb ?? 0), 0) / noiseClassrooms.length)
      : 0,
    currentlyOutside: presenceClassrooms.reduce((sum, classroom) => sum + classroom.studentsOutside, 0),
    activeAlerts,
  }
  const noiseByHour = useMemo(() => groupNoiseByHour(noiseEvents), [noiseEvents])
  const attendanceByClass = presenceClassrooms.map((classroom) => ({
    name: classroom.classroomCode,
    'حضور': classroom.totalStudents
      ? Math.round(((classroom.presentStudents + classroom.lateStudents) / classroom.totalStudents) * 100)
      : 0,
  }))
  const noiseByClass = noiseClassrooms
    .map((classroom) => ({
      name: classroom.classroomCode,
      noise: Math.round(classroom.state?.currentDb ?? 0),
    }))
    .sort((a, b) => b.noise - a.noise)
  const movementByHour = useMemo(() => groupMovementByHour(movements), [movements])
  const insights = recommendations.map((recommendation) => ({
    id: recommendation.id,
    type: insightType(recommendation.priority),
    title: recommendation.title,
    text: recommendation.recommendation || recommendation.explanation,
  }))

  const quietest = [...noiseByClass].reverse().slice(0, 3)
  const loudest = noiseByClass.slice(0, 3)
  if (!level) return null

  return (
    <DashboardShell
      title={t('dashboard.title')}
      subtitle={withLevel('dashboard.subtitle', level, t)}
    >
      <div className="space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
          <StatCard label={t('dashboard.totalStudents')} value={kpis.totalStudents} icon={Users} tone="accent" trend={{ value: percent(3, t), up: true, good: true }} />
          <StatCard label={t('dashboard.activeClasses')} value={kpis.activeClasses} unit={`/ ${kpis.totalClasses}`} icon={School} tone="success" />
          <StatCard label={t('dashboard.avgAttendance')} value={percent(kpis.avgAttendance, t)} icon={ClipboardCheck} tone="success" trend={{ value: percent(2, t), up: true, good: true }} />
          <StatCard label={t('dashboard.avgNoise')} value={kpis.avgNoise} unit="dB" icon={Volume2} tone="warning" trend={{ value: percent(5, t), up: true, good: false }} />
          <StatCard label={t('dashboard.currentExits')} value={kpis.currentlyOutside} icon={LogOut} tone="warning" />
          <StatCard label={t('dashboard.activeAlerts')} value={kpis.activeAlerts} icon={Bell} tone="danger" />
        </div>

        {/* AI Insights */}
        <AIInsights insights={insights} />

        {/* Charts row */}
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader className="flex-row items-center justify-between">
              <div>
                <CardTitle>{t('dashboard.noiseDuringDay')}</CardTitle>
              </div>
              <Badge variant="accent">
                <span className="size-1.5 rounded-full bg-accent live-dot" /> {t('common.live')}
              </Badge>
            </CardHeader>
            <CardContent>
              <NoiseAreaChart data={noiseByHour} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('dashboard.attendanceByClass')}</CardTitle>
            </CardHeader>
            <CardContent>
              <AttendanceBarChart data={attendanceByClass} />
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>{t('dashboard.noiseRank')}</CardTitle>
            </CardHeader>
            <CardContent>
              <NoiseRankBarChart data={noiseByClass.slice(0, 8)} />
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>{t('dashboard.movementByHour')}</CardTitle>
            </CardHeader>
            <CardContent>
              <MovementLineChart data={movementByHour} />
            </CardContent>
          </Card>
        </div>

        {/* Quietest / loudest */}
        <div className="grid gap-6 md:grid-cols-2">
          <RankList title={t('dashboard.quietestClasses')} items={quietest} tone="success" />
          <RankList title={t('dashboard.loudestClasses')} items={loudest} tone="danger" />
        </div>

        {/* Live classroom grid */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-extrabold tracking-tight">
              {t('dashboard.liveClassrooms')}
            </h2>
            <Badge variant="accent">
              <span className="size-1.5 rounded-full bg-accent live-dot" />
              {t('common.liveUpdate')}
            </Badge>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {classrooms.map((c) => (
              <ClassroomCard key={c.id} c={c} />
            ))}
          </div>
        </div>
      </div>
    </DashboardShell>
  )
}

function groupNoiseByHour(events: NoiseEvent[]) {
  const buckets = new Map<string, { total: number; count: number }>()
  events.forEach((event) => {
    const hour = new Date(event.startedAt).toLocaleTimeString('ar-SA', { hour: '2-digit' })
    const value = event.averageDb ?? event.peakDb ?? 0
    const bucket = buckets.get(hour) ?? { total: 0, count: 0 }
    bucket.total += value
    bucket.count += 1
    buckets.set(hour, bucket)
  })
  return Array.from(buckets.entries()).map(([hour, bucket]) => ({
    hour,
    noise: Math.round(bucket.total / bucket.count),
  }))
}

function groupMovementByHour(movements: StudentMovement[]) {
  const buckets = new Map<string, { exits: number; returns: number }>()
  movements.forEach((movement) => {
    const exitHour = new Date(movement.exitedAt).toLocaleTimeString('ar-SA', { hour: '2-digit' })
    const exitBucket = buckets.get(exitHour) ?? { exits: 0, returns: 0 }
    exitBucket.exits += 1
    buckets.set(exitHour, exitBucket)
    if (movement.returnedAt) {
      const returnHour = new Date(movement.returnedAt).toLocaleTimeString('ar-SA', { hour: '2-digit' })
      const returnBucket = buckets.get(returnHour) ?? { exits: 0, returns: 0 }
      returnBucket.returns += 1
      buckets.set(returnHour, returnBucket)
    }
  })
  return Array.from(buckets.entries()).map(([hour, bucket]) => ({
    hour,
    'خروج': bucket.exits,
    'عودة': bucket.returns,
  }))
}

function insightType(priority: string) {
  if (priority === 'CRITICAL' || priority === 'HIGH') return 'risk'
  if (priority === 'LOW') return 'opportunity'
  return 'trend'
}

function RankList({
  title,
  items,
  tone,
}: {
  title: string
  items: { name: string; noise: number }[]
  tone: 'success' | 'danger'
}) {
  const color = tone === 'success' ? '#22c55e' : '#ef4444'
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 pt-2">
        {items.map((it) => (
          <div
            key={it.name}
            className="flex items-center justify-between rounded-xl bg-muted/50 px-3.5 py-2.5"
          >
            <div className="flex items-center gap-3">
              <span className="flex size-7 items-center justify-center rounded-lg bg-card font-mono text-xs font-bold text-muted-foreground">
                {it.name}
              </span>
            </div>
            <span
              className="text-sm font-extrabold tabular-nums"
              style={{ color }}
            >
              {it.noise} dB
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
