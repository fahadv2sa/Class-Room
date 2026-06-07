'use client'

import { useEffect, useState } from 'react'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatCard } from '@/components/stat-card'
import { useLevel } from '@/components/level-provider'
import { getReports } from '@/lib/mock-data'
import { FileText, Eye, FileSpreadsheet, Clock, ClipboardCheck, TrendingUp, Users, School } from 'lucide-react'
import { useLanguage } from '@/components/language-provider'
import { withLevel } from '@/lib/i18n/ui'

const reportTitleKey: Record<string, string> = {
  r1: 'reports.dailyAttendance',
  r2: 'reports.weeklyAbsence',
  r3: 'reports.studentMovement',
  r4: 'reports.noise',
  r5: 'reports.classPerformance',
  r6: 'reports.teacherPerformance',
  r7: 'reports.frequentExits',
}

type KpiRecord = {
  kpiType: string
  value: number
}

type RankingRecord = {
  subjectId: string | null
  label?: string | null
  value: number
}

export default function ReportsPage() {
  const { level } = useLevel()
  const { t } = useLanguage()
  const [kpis, setKpis] = useState<KpiRecord[]>([])
  const [rankings, setRankings] = useState<{
    topClassrooms: RankingRecord[]
    bottomClassrooms: RankingRecord[]
    topTeachers: RankingRecord[]
    studentsRequiringAttention: RankingRecord[]
  } | null>(null)

  useEffect(() => {
    let active = true

    async function loadAnalytics() {
      const [kpiResponse, rankingResponse] = await Promise.all([
        fetch('/api/analytics/kpis?period=DAILY', { cache: 'no-store' }),
        fetch('/api/analytics/rankings?period=DAILY&take=3', { cache: 'no-store' }),
      ])
      const [kpiData, rankingData] = await Promise.all([
        kpiResponse.ok ? kpiResponse.json() : Promise.resolve({ kpis: [] }),
        rankingResponse.ok ? rankingResponse.json() : Promise.resolve({ rankings: null }),
      ])
      if (!active) return
      setKpis(kpiData.kpis ?? [])
      setRankings(rankingData.rankings ?? null)
    }

    loadAnalytics().catch(() => {
      if (!active) return
      setKpis([])
      setRankings(null)
    })

    return () => {
      active = false
    }
  }, [])

  if (!level) return null

  const reports = getReports(level)
  const attendanceRate = findKpi(kpis, 'ATTENDANCE_RATE')
  const lateRate = findKpi(kpis, 'LATE_RATE')
  const performanceScore = findKpi(kpis, 'CLASSROOM_PERFORMANCE_SCORE')
  const noiseScore = findKpi(kpis, 'NOISE_SCORE')

  return (
    <DashboardShell
      title={t('reports.title')}
      subtitle={withLevel('reports.subtitle', level, t)}
    >
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          <StatCard label={t('analytics.attendanceRate')} value={`${attendanceRate}%`} icon={ClipboardCheck} tone="success" />
          <StatCard label={t('analytics.lateRate')} value={`${lateRate}%`} icon={Clock} tone="warning" />
          <StatCard label={t('analytics.performanceScore')} value={performanceScore} icon={TrendingUp} tone="accent" />
          <StatCard label={t('analytics.noiseScore')} value={noiseScore} icon={School} tone="success" />
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <AnalyticsRank title={t('analytics.topClassrooms')} items={rankings?.topClassrooms ?? []} />
          <AnalyticsRank title={t('analytics.bottomClassrooms')} items={rankings?.bottomClassrooms ?? []} />
          <AnalyticsRank title={t('analytics.topTeachers')} items={rankings?.topTeachers ?? []} />
          <AnalyticsRank title={t('analytics.studentsNeedAttention')} items={rankings?.studentsRequiringAttention ?? []} />
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {reports.map((r) => (
            <Card key={r.id} className="flex flex-col p-5 transition-all hover:shadow-md">
              <div className="flex items-start gap-3">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
                  <FileText className="size-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-extrabold tracking-tight">{t(reportTitleKey[r.id])}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {r.desc}
                  </p>
                </div>
              </div>

              <p className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="size-3.5" /> {t('common.lastUpdatePrefix')} {r.updated}
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border/60 pt-4">
                <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">
                  <Eye className="size-3.5" /> {t('common.viewReport')}
                </Button>
                <Button size="sm" variant="outline">
                  <FileText className="size-3.5" /> PDF
                </Button>
                <Button size="sm" variant="outline">
                  <FileSpreadsheet className="size-3.5" /> Excel
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </DashboardShell>
  )
}

function findKpi(kpis: KpiRecord[], type: string) {
  return Math.round(kpis.find((kpi) => kpi.kpiType === type)?.value ?? 0)
}

function AnalyticsRank({ title, items }: { title: string; items: RankingRecord[] }) {
  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center gap-2">
        <Users className="size-4 text-muted-foreground" />
        <h3 className="text-sm font-extrabold tracking-tight">{title}</h3>
      </div>
      <div className="space-y-2">
        {items.length === 0 && <p className="text-xs text-muted-foreground">-</p>}
        {items.map((item) => (
          <div key={`${item.subjectId}-${item.value}`} className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
            <span className="truncate text-xs font-semibold">{item.label ?? item.subjectId}</span>
            <span className="text-xs font-extrabold tabular-nums">{Math.round(item.value)}</span>
          </div>
        ))}
      </div>
    </Card>
  )
}
