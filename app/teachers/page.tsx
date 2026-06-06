'use client'

import { useEffect, useMemo, useState } from 'react'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useLevel } from '@/components/level-provider'
import { type Level } from '@/lib/mock-data'
import { cn } from '@/lib/utils'
import { Award, Volume2, ClipboardCheck, LogOut, Star } from 'lucide-react'
import { useLanguage } from '@/components/language-provider'
import { percent, withLevel } from '@/lib/i18n/ui'

type ApiTeacher = {
  id: string
  fullNameAr: string
}

type TeacherView = {
  id: string
  name: string
  subject: string
  level: Level
  sessionsToday: number
  avgQuiet: number
  attendanceRate: number
  avgExits: number
  discipline: number
  rank: number
}

const primarySubjects = ['القرآن الكريم', 'الرياضيات', 'العلوم', 'لغتي', 'الدراسات الاجتماعية', 'اللغة الإنجليزية', 'التربية الفنية']
const middleSubjects = ['الرياضيات', 'العلوم', 'اللغة العربية', 'الدراسات الاجتماعية', 'اللغة الإنجليزية', 'التربية الإسلامية']
const highSubjects = ['الرياضيات', 'الفيزياء', 'الكيمياء', 'الأحياء', 'اللغة العربية', 'اللغة الإنجليزية', 'الدراسات الإسلامية']

function subjectsFor(level: Level) {
  if (level === 'primary') return primarySubjects
  if (level === 'middle') return middleSubjects
  return highSubjects
}

function levelIndex(level: Level) {
  return level === 'primary' ? 1 : level === 'middle' ? 2 : 3
}

function projectTeacher(teacher: ApiTeacher, index: number, level: Level): TeacherView {
  const seed = levelIndex(level) * 100 + index + 1
  const subjects = subjectsFor(level)

  return {
    id: teacher.id,
    name: teacher.fullNameAr,
    subject: subjects[index % subjects.length],
    level,
    sessionsToday: 3 + (seed % 4),
    avgQuiet: 55 + ((seed * 7) % 41),
    attendanceRate: 82 + ((seed * 11) % 17),
    avgExits: Math.round((0.4 + ((seed * 13) % 20) / 10) * 10) / 10,
    discipline: 55 + ((seed * 17) % 42),
    rank: 0,
  }
}

function gradeBadge(v: number): { variant: 'success' | 'warning' | 'danger'; key: string } {
  if (v >= 85) return { variant: 'success', key: 'teachers.excellent' }
  if (v >= 70) return { variant: 'warning', key: 'teachers.good' }
  return { variant: 'danger', key: 'teachers.needsFollowup' }
}

export default function TeachersPage() {
  const { level } = useLevel()
  const { t } = useLanguage()
  const [apiTeachers, setApiTeachers] = useState<ApiTeacher[]>([])

  useEffect(() => {
    async function loadTeachers() {
      const res = await fetch('/api/teachers?pageSize=100&status=ACTIVE', { cache: 'no-store' })
      if (!res.ok) return
      const data = await res.json()
      setApiTeachers(data.teachers ?? [])
    }

    loadTeachers()
  }, [])

  const teachers = useMemo(() => {
    if (!level) return []
    const projected = apiTeachers.map((teacher, index) => projectTeacher(teacher, index, level))
    projected.sort(
      (a, b) =>
        b.avgQuiet + b.attendanceRate + b.discipline - b.avgExits * 10 -
        (a.avgQuiet + a.attendanceRate + a.discipline - a.avgExits * 10),
    )
    projected.forEach((teacher, index) => {
      teacher.rank = index + 1
    })
    return projected
  }, [apiTeachers, level])

  if (!level) return null

  const sorted = [...teachers].sort((a, b) => a.rank - b.rank)
  const rankings = {
    quietest: [...teachers].sort((a, b) => b.avgQuiet - a.avgQuiet).slice(0, 3),
    fewestExits: [...teachers].sort((a, b) => a.avgExits - b.avgExits).slice(0, 3),
    highestAttendance: [...teachers].sort((a, b) => b.attendanceRate - a.attendanceRate).slice(0, 3),
    needsFollowup: [...teachers].sort((a, b) => a.discipline - b.discipline).slice(0, 3),
  }

  return (
    <DashboardShell
      title={t('teachers.title')}
      subtitle={withLevel('teachers.subtitle', level, t)}
    >
      <div className="space-y-6">
        {/* Rankings */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <RankCard title={t('teachers.quietest')} icon={Volume2} tone="success" items={rankings.quietest.map((teacher) => ({ name: teacher.name, val: percent(teacher.avgQuiet, t) }))} />
          <RankCard title={t('teachers.fewestExits')} icon={LogOut} tone="accent" items={rankings.fewestExits.map((teacher) => ({ name: teacher.name, val: teacher.avgExits.toFixed(1) }))} />
          <RankCard title={t('teachers.highestAttendance')} icon={ClipboardCheck} tone="success" items={rankings.highestAttendance.map((teacher) => ({ name: teacher.name, val: percent(teacher.attendanceRate, t) }))} />
          <RankCard title={t('teachers.needsFollowup')} icon={Star} tone="warning" items={rankings.needsFollowup.map((teacher) => ({ name: teacher.name, val: percent(teacher.discipline, t) }))} />
        </div>

        {/* Teacher cards */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sorted.map((teacher) => {
            const g = gradeBadge(teacher.discipline)
            return (
              <Card key={teacher.id} className="p-5 transition-all hover:shadow-md">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex size-12 items-center justify-center rounded-xl bg-accent/10 text-lg font-extrabold text-accent">
                      {teacher.name.charAt(0)}
                    </div>
                    <div className="leading-tight">
                      <p className="font-extrabold">{teacher.name}</p>
                      <p className="text-xs text-muted-foreground">{teacher.subject}</p>
                    </div>
                  </div>
                  <span className="flex items-center gap-1 rounded-lg bg-muted px-2 py-1 text-xs font-bold">
                    <Award className="size-3.5 text-accent" /> #{teacher.rank}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Metric label={t('teachers.sessions')} value={teacher.sessionsToday} />
                  <Metric label={t('teachers.classQuiet')} value={percent(teacher.avgQuiet, t)} />
                  <Metric label={t('teachers.attendanceRate')} value={percent(teacher.attendanceRate, t)} />
                  <Metric label={t('teachers.avgExits')} value={teacher.avgExits.toFixed(1)} />
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3">
                  <span className="text-xs text-muted-foreground">{t('teachers.disciplineRating')}</span>
                  <Badge variant={g.variant}>{t(g.key)}</Badge>
                </div>
              </Card>
            )
          })}
        </div>
      </div>
    </DashboardShell>
  )
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-muted/50 px-3 py-2.5">
      <p className="text-lg font-extrabold tabular-nums">{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  )
}

function RankCard({
  title,
  icon: Icon,
  tone,
  items,
}: {
  title: string
  icon: typeof Award
  tone: 'success' | 'warning' | 'accent'
  items: { name: string; val: string }[]
}) {
  const toneClass = {
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-[#b45309]',
    accent: 'bg-accent/10 text-accent',
  }[tone]
  return (
    <Card>
      <CardHeader className="flex-row items-center gap-2.5">
        <div className={cn('flex size-9 items-center justify-center rounded-lg', toneClass)}>
          <Icon className="size-[18px]" />
        </div>
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1.5 pt-2">
        {items.map((it, i) => (
          <div key={it.name} className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <span className="text-xs font-bold text-muted-foreground">{i + 1}.</span>
              {it.name}
            </span>
            <span className="font-bold tabular-nums">{it.val}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
