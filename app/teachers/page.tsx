'use client'

import { DashboardShell } from '@/components/layout/dashboard-shell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useLevel } from '@/components/level-provider'
import { getTeachers, levelMap } from '@/lib/mock-data'
import { cn } from '@/lib/utils'
import { Award, Volume2, ClipboardCheck, LogOut, Star } from 'lucide-react'

function gradeBadge(v: number): { variant: 'success' | 'warning' | 'danger'; label: string } {
  if (v >= 85) return { variant: 'success', label: 'ممتاز' }
  if (v >= 70) return { variant: 'warning', label: 'جيد' }
  return { variant: 'danger', label: 'يحتاج متابعة' }
}

export default function TeachersPage() {
  const { level } = useLevel()
  if (!level) return null

  const lvl = levelMap[level]
  const teachers = getTeachers(level)
  const sorted = [...teachers].sort((a, b) => a.rank - b.rank)
  const rankings = {
    quietest: [...teachers].sort((a, b) => b.avgQuiet - a.avgQuiet).slice(0, 3),
    fewestExits: [...teachers].sort((a, b) => a.avgExits - b.avgExits).slice(0, 3),
    highestAttendance: [...teachers].sort((a, b) => b.attendanceRate - a.attendanceRate).slice(0, 3),
    needsFollowup: [...teachers].sort((a, b) => a.discipline - b.discipline).slice(0, 3),
  }

  return (
    <DashboardShell
      title="المعلمون"
      subtitle={`مؤشرات أداء الفصول · ${lvl.ar}`}
    >
      <div className="space-y-6">
        {/* Rankings */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <RankCard title="الأكثر هدوءاً" icon={Volume2} tone="success" items={rankings.quietest.map((t) => ({ name: t.name, val: `${t.avgQuiet}٪` }))} />
          <RankCard title="الأقل خروج طلاب" icon={LogOut} tone="accent" items={rankings.fewestExits.map((t) => ({ name: t.name, val: t.avgExits.toFixed(1) }))} />
          <RankCard title="الأعلى حضوراً" icon={ClipboardCheck} tone="success" items={rankings.highestAttendance.map((t) => ({ name: t.name, val: `${t.attendanceRate}٪` }))} />
          <RankCard title="يحتاج متابعة" icon={Star} tone="warning" items={rankings.needsFollowup.map((t) => ({ name: t.name, val: `${t.discipline}٪` }))} />
        </div>

        {/* Teacher cards */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sorted.map((t) => {
            const g = gradeBadge(t.discipline)
            return (
              <Card key={t.id} className="p-5 transition-all hover:shadow-md">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex size-12 items-center justify-center rounded-xl bg-accent/10 text-lg font-extrabold text-accent">
                      {t.name.charAt(0)}
                    </div>
                    <div className="leading-tight">
                      <p className="font-extrabold">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.subject}</p>
                    </div>
                  </div>
                  <span className="flex items-center gap-1 rounded-lg bg-muted px-2 py-1 text-xs font-bold">
                    <Award className="size-3.5 text-accent" /> #{t.rank}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Metric label="عدد الحصص" value={t.sessionsToday} />
                  <Metric label="هدوء الفصل" value={`${t.avgQuiet}٪`} />
                  <Metric label="نسبة الحضور" value={`${t.attendanceRate}٪`} />
                  <Metric label="متوسط الخروج" value={t.avgExits.toFixed(1)} />
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3">
                  <span className="text-xs text-muted-foreground">تقييم الانضباط</span>
                  <Badge variant={g.variant}>{g.label}</Badge>
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
