'use client'

import { DashboardShell } from '@/components/layout/dashboard-shell'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useLevel } from '@/components/level-provider'
import { getReports } from '@/lib/mock-data'
import { FileText, Eye, FileSpreadsheet, Clock } from 'lucide-react'
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

export default function ReportsPage() {
  const { level } = useLevel()
  const { t } = useLanguage()
  if (!level) return null

  const reports = getReports(level)

  return (
    <DashboardShell
      title={t('reports.title')}
      subtitle={withLevel('reports.subtitle', level, t)}
    >
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
    </DashboardShell>
  )
}
