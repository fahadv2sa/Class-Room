'use client'

import { useEffect, useMemo, useState } from 'react'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { StatCard } from '@/components/stat-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  NoiseAreaChart,
  NoiseRankBarChart,
  TeacherQuietBarChart,
} from '@/components/charts'
import { useLevel } from '@/components/level-provider'
import { Volume2, ArrowUp, ArrowDown, AlertOctagon } from 'lucide-react'
import { useLanguage } from '@/components/language-provider'
import { withLevel } from '@/lib/i18n/ui'

const dayKeys = ['days.sunday', 'days.monday', 'days.tuesday', 'days.wednesday', 'days.thursday']
const hours = ['07', '08', '09', '10', '11', '12', '01', '02']
const levelApiValue = { primary: 'PRIMARY', middle: 'MIDDLE', high: 'HIGH' } as const
const teacherQuietKey = 'هدوء' as const

type NoiseClassroom = {
  classroomId: string
  classroomCode: string
  classroomName: string
  state: {
    currentDb: number
    currentState: 'QUIET' | 'MODERATE' | 'LOUD'
    activeNoiseEventId: string | null
    updatedAt: string | null
  }
  summary: {
    totalEvents: number
    totalNoiseSeconds: number
    averageEventDb: number
    peakDb: number
    lowEvents: number
    mediumEvents: number
    highEvents: number
    quietScore: number
  }
}

type NoiseEvent = {
  id: string
  classroomId: string
  startedAt: string
  averageDb: number
  peakDb: number
  severity: 'LOW' | 'MEDIUM' | 'HIGH'
  status: 'ACTIVE' | 'CLOSED'
  classroom?: { classroomCode: string }
}

type TeacherNoiseSummary = {
  id: string
  totalEvents: number
  quietScore: number
  averageEventDb: number
  teacher: { fullNameAr: string; fullNameEn: string }
}

function heatColor(v: number) {
  if (v <= 45) return '#22c55e'
  if (v <= 70) return '#f59e0b'
  return '#ef4444'
}

function emptyHourData() {
  return hours.map((hour) => ({ hour, noise: 0 }))
}

export default function NoisePage() {
  const { level } = useLevel()
  const { language, t } = useLanguage()
  const [classrooms, setClassrooms] = useState<NoiseClassroom[]>([])
  const [events, setEvents] = useState<NoiseEvent[]>([])
  const [teachers, setTeachers] = useState<TeacherNoiseSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!level) return
    const selectedLevel = level

    async function loadNoiseData() {
      setLoading(true)
      setError('')
      try {
        const levelParam = levelApiValue[selectedLevel]
        const [classroomsRes, eventsRes, teachersRes] = await Promise.all([
          fetch(`/api/noise/classrooms?level=${levelParam}`, { cache: 'no-store' }),
          fetch('/api/noise/events?pageSize=100', { cache: 'no-store' }),
          fetch('/api/noise/teachers?pageSize=10', { cache: 'no-store' }),
        ])
        if (!classroomsRes.ok || !eventsRes.ok || !teachersRes.ok) throw new Error('Unable to load noise data')

        const classroomsData = await classroomsRes.json()
        const eventsData = await eventsRes.json()
        const teachersData = await teachersRes.json()
        setClassrooms(classroomsData.classrooms ?? [])
        setEvents(eventsData.events ?? [])
        setTeachers(teachersData.teachers ?? [])
      } catch {
        setError('settings.loadError')
      } finally {
        setLoading(false)
      }
    }

    loadNoiseData()
  }, [level])

  const derived = useMemo(() => {
    const currentValues = classrooms.map((classroom) => classroom.state.currentDb)
    const summaryValues = classrooms.map((classroom) => classroom.summary.averageEventDb).filter((value) => value > 0)
    const values = currentValues.length ? currentValues : summaryValues
    const avg = values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0
    const max = values.length ? Math.max(...values) : 0
    const min = values.length ? Math.min(...values) : 0
    const redHits = classrooms.reduce((sum, classroom) => sum + classroom.summary.highEvents, 0)
    const quietNow = classrooms.filter((classroom) => classroom.state.currentState === 'QUIET').length
    const noiseByClass = classrooms
      .map((classroom) => ({
        name: classroom.classroomCode,
        noise: classroom.state.currentDb || classroom.summary.averageEventDb,
      }))
      .sort((a, b) => b.noise - a.noise)

    const byHour = emptyHourData()
    for (const event of events) {
      const hour = new Date(event.startedAt).getHours().toString().padStart(2, '0')
      const bucket = byHour.find((item) => item.hour === hour)
      if (bucket) bucket.noise = Math.max(bucket.noise, event.peakDb || event.averageDb)
    }

    const teacherQuiet = teachers.map((summary) => ({
      name: language === 'EN' ? summary.teacher.fullNameEn : summary.teacher.fullNameAr,
      [teacherQuietKey]: summary.quietScore,
    }))

    return {
      avg,
      max,
      min,
      redHits,
      quietNow,
      noiseByClass,
      noiseByHour: byHour,
      teacherQuiet,
      quietest: [...noiseByClass].sort((a, b) => a.noise - b.noise).slice(0, 3),
      loudest: noiseByClass.slice(0, 3),
    }
  }, [classrooms, events, language, teachers])

  if (!level) return null

  return (
    <DashboardShell
      title={t('noise.title')}
      subtitle={withLevel('noise.subtitle', level, t)}
    >
      <div className="space-y-6">
        {loading && (
          <Card className="p-4 text-sm font-semibold text-muted-foreground">
            {t('common.loading')}
          </Card>
        )}
        {error && (
          <Card className="p-4 text-sm font-semibold text-destructive">
            {t(error)}
          </Card>
        )}

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          <StatCard label={t('noise.avgToday')} value={derived.avg} unit="dB" icon={Volume2} tone="warning" />
          <StatCard label={t('noise.highest')} value={derived.max} unit="dB" icon={ArrowUp} tone="danger" />
          <StatCard label={t('noise.lowest')} value={derived.min} unit="dB" icon={ArrowDown} tone="success" />
          <StatCard label={t('noise.redHits')} value={derived.redHits} icon={AlertOctagon} tone="danger" />
          <StatCard label={t('noise.quietNow')} value={derived.quietNow} icon={Volume2} tone="success" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('noise.byHour')}</CardTitle>
          </CardHeader>
          <CardContent>
            <NoiseAreaChart data={derived.noiseByHour} />
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>{t('noise.byClass')}</CardTitle>
            </CardHeader>
            <CardContent>
              <NoiseRankBarChart data={derived.noiseByClass.slice(0, 10)} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{t('noise.byTeacher')}</CardTitle>
            </CardHeader>
            <CardContent>
              <TeacherQuietBarChart data={derived.teacherQuiet} />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>{t('noise.heatmap')}</CardTitle>
            <div className="hidden items-center gap-3 text-xs text-muted-foreground sm:flex">
              <span className="flex items-center gap-1"><span className="size-3 rounded bg-success" /> {t('noise.quiet')}</span>
              <span className="flex items-center gap-1"><span className="size-3 rounded bg-warning" /> {t('noise.medium')}</span>
              <span className="flex items-center gap-1"><span className="size-3 rounded bg-destructive" /> {t('noise.loud')}</span>
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
                {dayKeys.map((dayKey, di) => (
                  <div
                    key={dayKey}
                    className="mb-1.5 grid grid-cols-[80px_repeat(8,1fr)] items-center gap-1.5"
                  >
                    <span className="text-xs font-semibold text-muted-foreground">{t(dayKey)}</span>
                    {hours.map((hour, hi) => {
                      const eventValue = events
                        .filter((event) => {
                          const date = new Date(event.startedAt)
                          return date.getDay() === di && date.getHours().toString().padStart(2, '0') === hour
                        })
                        .reduce((peak, event) => Math.max(peak, event.peakDb), 0)
                      const v = eventValue || 0
                      return (
                        <div
                          key={hi}
                          className="flex h-9 items-center justify-center rounded-md text-[11px] font-bold text-white/90"
                          style={{ backgroundColor: heatColor(v) }}
                          title={`${t(dayKey)} ${hour} - ${v} dB`}
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
          <RankList title={t('dashboard.quietestClasses')} items={derived.quietest} tone="success" />
          <RankList title={t('dashboard.loudestClasses')} items={derived.loudest} tone="danger" />
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
