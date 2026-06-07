'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { levels, type Level, levelMap, levelType } from '@/lib/levels'
import { useLevel } from '@/components/level-provider'
import { useLanguage } from '@/components/language-provider'
import { Sparkles, GraduationCap, BookOpen, Microscope, ArrowLeft, Building2 } from 'lucide-react'

const levelIcon: Record<Level, typeof BookOpen> = {
  primary: BookOpen,
  middle: GraduationCap,
  high: Microscope,
}

const levelLabelKey: Record<Level, string> = {
  primary: 'level.primary',
  middle: 'level.middle',
  high: 'level.high',
}

export default function SelectLevelPage() {
  const router = useRouter()
  const { setLevel, district, school } = useLevel()
  const { t } = useLanguage()
  const [active, setActive] = useState<Level | null>(null)
  const [counts, setCounts] = useState<Record<Level, { totalClasses: number; totalStudents: number }>>({
    primary: { totalClasses: 0, totalStudents: 0 },
    middle: { totalClasses: 0, totalStudents: 0 },
    high: { totalClasses: 0, totalStudents: 0 },
  })

  useEffect(() => {
    let mounted = true

    async function loadCounts() {
      const studentRequests = levels.map((level) =>
        fetch(`/api/students?level=${levelType(level.id)}&pageSize=1`, { cache: 'no-store' }),
      )
      const [classroomResponse, ...studentResponses] = await Promise.all([
        fetch('/api/classrooms', { cache: 'no-store' }),
        ...studentRequests,
      ])
      const classroomData = classroomResponse.ok ? await classroomResponse.json() : { classrooms: [] }
      const studentTotals = await Promise.all(
        studentResponses.map(async (response) => {
          if (!response.ok) return 0
          const data = await response.json()
          return Number(data.meta?.total ?? 0)
        }),
      )
      if (!mounted) return
      const next = {
        primary: { totalClasses: 0, totalStudents: 0 },
        middle: { totalClasses: 0, totalStudents: 0 },
        high: { totalClasses: 0, totalStudents: 0 },
      }
      for (const classroom of classroomData.classrooms ?? []) {
        const level = levelFromClassroomCode(classroom.classroomCode)
        if (level) next[level].totalClasses += 1
      }
      levels.forEach((level, index) => {
        next[level.id].totalStudents = studentTotals[index] ?? 0
      })
      setCounts(next)
    }

    loadCounts().catch(() => undefined)
    return () => {
      mounted = false
    }
  }, [])

  function choose(l: Level) {
    setActive(l)
    setLevel(l)
    setTimeout(() => router.push('/dashboard'), 180)
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-sidebar p-6 text-white">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '28px 28px',
        }}
      />
      <div className="pointer-events-none absolute -left-24 top-1/4 size-96 rounded-full bg-accent/20 blur-3xl" />

      <div className="relative mb-10 flex flex-col items-center text-center">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-accent text-accent-foreground shadow-lg shadow-accent/40">
            <Sparkles className="size-6" />
          </div>
          <div className="text-right">
            <p className="text-lg font-extrabold leading-none">{t('common.appName')}</p>
            <p className="mt-1 text-xs text-white/60">{t('common.tagline')}</p>
          </div>
        </div>

        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs text-white/70 backdrop-blur-sm">
          <Building2 className="size-3.5 text-accent" />
          {district} · {school}
        </div>
        <h1 className="text-balance text-3xl font-extrabold">{t('level.title')}</h1>
        <p className="mt-2 max-w-md text-pretty leading-relaxed text-white/60">
          {t('level.subtitle')}
        </p>
      </div>

      <div className="relative grid w-full max-w-4xl gap-5 md:grid-cols-3">
        {levels.map((lvl) => {
          const Icon = levelIcon[lvl.id]
          const kpis = counts[lvl.id]
          const isActive = active === lvl.id
          return (
            <button
              key={lvl.id}
              onClick={() => choose(lvl.id)}
              className={`group relative flex flex-col rounded-2xl border p-6 text-right transition-all ${
                isActive
                  ? 'border-accent bg-accent/15 ring-2 ring-accent'
                  : 'border-white/10 bg-white/5 hover:border-accent/50 hover:bg-white/10'
              }`}
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="flex size-12 items-center justify-center rounded-xl bg-accent/15 text-accent transition-colors group-hover:bg-accent group-hover:text-accent-foreground">
                  <Icon className="size-6" />
                </div>
                <span className="rounded-lg bg-white/10 px-2.5 py-1 font-mono text-sm font-bold text-white/80">
                  {lvl.code}
                </span>
              </div>

              <h2 className="text-lg font-extrabold">{t(levelLabelKey[lvl.id])}</h2>
              <p className="mt-1 text-sm text-white/55" dir="ltr">
                {lvl.en}
              </p>

              <div className="mt-5 grid grid-cols-2 gap-3 border-t border-white/10 pt-4">
                <Stat label={t('level.classes')} value={kpis.totalClasses} />
                <Stat label={t('level.students')} value={kpis.totalStudents} />
              </div>

              <div className="mt-4 flex items-center justify-end gap-1.5 text-sm font-semibold text-accent opacity-0 transition-opacity group-hover:opacity-100">
                {t('level.enter')}
                <ArrowLeft className="size-4" />
              </div>
            </button>
          )
        })}
      </div>

      <p className="relative mt-10 text-xs text-white/40">
        {t('level.note')}
      </p>
    </div>
  )
}

function levelFromClassroomCode(code: unknown): Level | null {
  const prefix = String(code ?? '').charAt(0).toUpperCase()
  return Object.values(levelMap).find((level) => level.code === prefix)?.id ?? null
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-2xl font-extrabold tabular-nums">{value}</p>
      <p className="text-xs text-white/50">{label}</p>
    </div>
  )
}
