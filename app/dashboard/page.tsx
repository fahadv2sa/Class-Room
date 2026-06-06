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
  levelMap,
  getClassrooms,
  getKpis,
  getNoiseByHour,
  getAttendanceByClass,
  getNoiseByClass,
  getMovementByHour,
  getAiInsights,
} from '@/lib/mock-data'
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
  if (!level) return null

  const lvl = levelMap[level]
  const classrooms = getClassrooms(level)
  const kpis = getKpis(level)
  const noiseByHour = getNoiseByHour(level)
  const attendanceByClass = getAttendanceByClass(level)
  const noiseByClass = getNoiseByClass(level)
  const movementByHour = getMovementByHour(level)
  const insights = getAiInsights(level)

  const quietest = [...noiseByClass].reverse().slice(0, 3)
  const loudest = noiseByClass.slice(0, 3)

  return (
    <DashboardShell
      title="لوحة التحكم"
      subtitle={`نظرة عامة مباشرة · ${lvl.ar}`}
    >
      <div className="space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
          <StatCard label="إجمالي الطلاب" value={kpis.totalStudents} icon={Users} tone="accent" trend={{ value: '3٪', up: true, good: true }} />
          <StatCard label="الفصول النشطة الآن" value={kpis.activeClasses} unit={`/ ${kpis.totalClasses}`} icon={School} tone="success" />
          <StatCard label="متوسط الحضور اليوم" value={`${kpis.avgAttendance}٪`} icon={ClipboardCheck} tone="success" trend={{ value: '2٪', up: true, good: true }} />
          <StatCard label="متوسط الضوضاء اليوم" value={kpis.avgNoise} unit="dB" icon={Volume2} tone="warning" trend={{ value: '5٪', up: true, good: false }} />
          <StatCard label="حالات الخروج الحالية" value={kpis.currentlyOutside} icon={LogOut} tone="warning" />
          <StatCard label="التنبيهات النشطة" value={kpis.activeAlerts} icon={Bell} tone="danger" />
        </div>

        {/* AI Insights */}
        <AIInsights insights={insights} />

        {/* Charts row */}
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader className="flex-row items-center justify-between">
              <div>
                <CardTitle>معدل الضوضاء خلال اليوم</CardTitle>
              </div>
              <Badge variant="accent">
                <span className="size-1.5 rounded-full bg-accent live-dot" /> مباشر
              </Badge>
            </CardHeader>
            <CardContent>
              <NoiseAreaChart data={noiseByHour} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>الحضور حسب الفصول</CardTitle>
            </CardHeader>
            <CardContent>
              <AttendanceBarChart data={attendanceByClass} />
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>ترتيب الفصول حسب الضوضاء</CardTitle>
            </CardHeader>
            <CardContent>
              <NoiseRankBarChart data={noiseByClass.slice(0, 8)} />
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>حركة الخروج والعودة حسب الساعة</CardTitle>
            </CardHeader>
            <CardContent>
              <MovementLineChart data={movementByHour} />
            </CardContent>
          </Card>
        </div>

        {/* Quietest / loudest */}
        <div className="grid gap-6 md:grid-cols-2">
          <RankList title="أكثر الفصول هدوءاً" items={quietest} tone="success" />
          <RankList title="أكثر الفصول إزعاجاً" items={loudest} tone="danger" />
        </div>

        {/* Live classroom grid */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-extrabold tracking-tight">
              الحالة المباشرة للفصول
            </h2>
            <Badge variant="accent">
              <span className="size-1.5 rounded-full bg-accent live-dot" />
              تحديث لحظي
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
