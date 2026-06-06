'use client'

import { DashboardShell } from '@/components/layout/dashboard-shell'
import { StatCard } from '@/components/stat-card'
import { AIInsights } from '@/components/ai-insights'
import { ClassroomCard } from '@/components/classroom-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  NoiseAreaChart,
  AttendanceBarChart,
  NoiseRankBarChart,
  MovementLineChart,
} from '@/components/charts'
import { useLevel } from '@/components/level-provider'
import {
  getClassrooms,
  getKpis,
  getNoiseByHour,
  getAttendanceByClass,
  getNoiseByClass,
  getMovementByHour,
} from '@/lib/mock-data'
import { useLanguage } from '@/components/language-provider'
import { percent, withLevel } from '@/lib/i18n/ui'
import {
  Users,
  School,
  ClipboardCheck,
  Volume2,
  LogOut,
  Bell,
} from 'lucide-react'

export default function DashboardPage() {
  const { level } = useLevel()
  const { t } = useLanguage()
  if (!level) return null

  const classrooms = getClassrooms(level)
  const kpis = getKpis(level)
  const noiseByHour = getNoiseByHour(level)
  const attendanceByClass = getAttendanceByClass(level)
  const noiseByClass = getNoiseByClass(level)
  const movementByHour = getMovementByHour(level)
  const loudestClass = noiseByClass[0]
  const quietClass = [...noiseByClass].reverse()[0]
  const insights = [
    {
      id: 'ai1',
      type: 'trend',
      title: t('noise.highest'),
      text: `${t('classrooms.classroom')} ${loudestClass?.name}: ${loudestClass?.noise} dB`,
    },
    {
      id: 'ai2',
      type: 'opportunity',
      title: t('dashboard.quietestClasses'),
      text: `${t('classrooms.classroom')} ${quietClass?.name}: ${quietClass?.noise} dB`,
    },
  ]

  const quietest = [...noiseByClass].reverse().slice(0, 3)
  const loudest = noiseByClass.slice(0, 3)

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
