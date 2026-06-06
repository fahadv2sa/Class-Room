'use client'

import { DashboardShell } from '@/components/layout/dashboard-shell'
import { StatCard } from '@/components/stat-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  NoiseAreaChart,
  NoiseRankBarChart,
  TeacherQuietBarChart,
} from '@/components/charts'
import { useLevel } from '@/components/level-provider'
import {
  getNoiseByHour,
  getNoiseByClass,
  getNoiseByTeacher,
  getClassrooms,
  levelMap,
} from '@/lib/mock-data'
import { Volume2, ArrowUp, ArrowDown, AlertOctagon } from 'lucide-react'

const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس']
const hours = ['07', '08', '09', '10', '11', '12', '01', '02']

// deterministic heatmap values
function heat(d: number, h: number) {
  return ((d * 13 + h * 7) % 60) + 30
}
function heatColor(v: number) {
  if (v <= 45) return '#22c55e'
  if (v <= 70) return '#f59e0b'
  return '#ef4444'
}

export default function NoisePage() {
  const { level } = useLevel()
  if (!level) return null

  const lvl = levelMap[level]
  const noiseByHour = getNoiseByHour(level)
  const noiseByClass = getNoiseByClass(level)
  const noiseByTeacher = getNoiseByTeacher(level)
  const classrooms = getClassrooms(level)

  const quietest = [...noiseByClass].reverse().slice(0, 3)
  const loudest = noiseByClass.slice(0, 3)
  const redHits = classrooms.filter((c) => c.noise > 70).length
  const noiseValues = classrooms.map((c) => c.noise)
  const avg = Math.round(noiseValues.reduce((a, b) => a + b, 0) / noiseValues.length)
  const max = Math.max(...noiseValues)
  const min = Math.min(...noiseValues)

  return (
    <DashboardShell
      title="مستوى الضوضاء"
      subtitle={`تحليلات صوتية لحظية · ${lvl.ar}`}
    >
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          <StatCard label="متوسط الضوضاء اليوم" value={avg} unit="dB" icon={Volume2} tone="warning" />
          <StatCard label="أعلى قراءة" value={max} unit="dB" icon={ArrowUp} tone="danger" />
          <StatCard label="أقل قراءة" value={min} unit="dB" icon={ArrowDown} tone="success" />
          <StatCard label="مرات الوصول للأحمر" value={redHits} icon={AlertOctagon} tone="danger" />
          <StatCard label="الفصول الهادئة الآن" value={classrooms.filter((c) => c.noise <= 45).length} icon={Volume2} tone="success" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>مستوى الضوضاء حسب الساعة</CardTitle>
          </CardHeader>
          <CardContent>
            <NoiseAreaChart data={noiseByHour} />
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>الضوضاء حسب الفصل</CardTitle>
            </CardHeader>
            <CardContent>
              <NoiseRankBarChart data={noiseByClass.slice(0, 10)} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>الهدوء حسب المعلم</CardTitle>
            </CardHeader>
            <CardContent>
              <TeacherQuietBarChart data={noiseByTeacher} />
            </CardContent>
          </Card>
        </div>

        {/* Heatmap */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>خريطة حرارية للضوضاء حسب اليوم والوقت</CardTitle>
            <div className="hidden items-center gap-3 text-xs text-muted-foreground sm:flex">
              <span className="flex items-center gap-1"><span className="size-3 rounded bg-success" /> هادئ</span>
              <span className="flex items-center gap-1"><span className="size-3 rounded bg-warning" /> متوسط</span>
              <span className="flex items-center gap-1"><span className="size-3 rounded bg-destructive" /> مرتفع</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="scrollbar-thin overflow-x-auto">
              <div className="min-w-[560px]">
                <div className="mb-1 grid grid-cols-[80px_repeat(8,1fr)] gap-1.5 text-center text-[11px] font-semibold text-muted-foreground">
                  <span />
                  {hours.map((h) => (
                    <span key={h}>{h}</span>
                  ))}
                </div>
                {days.map((d, di) => (
                  <div
                    key={d}
                    className="mb-1.5 grid grid-cols-[80px_repeat(8,1fr)] items-center gap-1.5"
                  >
                    <span className="text-xs font-semibold text-muted-foreground">{d}</span>
                    {hours.map((_, hi) => {
                      const v = heat(di, hi)
                      return (
                        <div
                          key={hi}
                          className="flex h-9 items-center justify-center rounded-md text-[11px] font-bold text-white/90"
                          style={{ backgroundColor: heatColor(v) }}
                          title={`${d} ${hours[hi]} — ${v} dB`}
                        >
                          {v}
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          <RankList title="أكثر الفصول هدوءاً" items={quietest} tone="success" />
          <RankList title="أكثر الفصول إزعاجاً" items={loudest} tone="danger" />
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
        {items.map((it, i) => (
          <div
            key={it.name}
            className="flex items-center justify-between rounded-xl bg-muted/50 px-3.5 py-2.5"
          >
            <div className="flex items-center gap-3">
              <span className="flex size-7 items-center justify-center rounded-lg bg-card text-xs font-bold text-muted-foreground">
                {i + 1}
              </span>
              <span className="text-sm font-semibold">{it.name}</span>
            </div>
            <span className="text-sm font-extrabold tabular-nums" style={{ color }}>
              {it.noise} dB
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
