'use client'

import { useMemo, useState } from 'react'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { StatCard } from '@/components/stat-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Table, THead, TR, TH, TD } from '@/components/ui/table'
import { AttendanceBarChart } from '@/components/charts'
import { useLevel } from '@/components/level-provider'
import { getStudents, getAttendanceByClass, getKpis, levelMap } from '@/lib/mock-data'
import { useLanguage } from '@/components/language-provider'
import { minutes, withLevel } from '@/lib/i18n/ui'
import {
  CheckCircle2,
  XCircle,
  Clock,
  CreditCard,
  Search,
} from 'lucide-react'

type Row = {
  student: string
  classroom: string
  firstIn: string
  lastOut: string
  status: 'present' | 'absent' | 'late' | 'noScan'
  absenceInSession: string
  exits: number
  updated: string
}

const statusBadge: Record<Row['status'], 'success' | 'danger' | 'warning' | 'accent'> = {
  present: 'success',
  absent: 'danger',
  late: 'warning',
  noScan: 'accent',
}

const statusLabelKey: Record<Row['status'], string> = {
  present: 'classrooms.present',
  absent: 'classrooms.absent',
  late: 'attendance.lateStart',
  noScan: 'attendance.noCardScan',
}

export default function AttendancePage() {
  const { level } = useLevel()
  const { t } = useLanguage()
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<'all' | Row['status']>('all')

  const lvl = level ? levelMap[level] : null
  const rows = useMemo<Row[]>(() => {
    if (!level) return []
    return getStudents(level).map((s, i) => {
      const status: Row['status'] =
        s.status === 'absent'
          ? 'absent'
          : i % 7 === 3
            ? 'late'
            : i % 11 === 5
              ? 'noScan'
              : 'present'
      return {
        student: s.name,
        classroom: s.classroom,
        firstIn: s.status === 'absent' ? '—' : ['07:18', '07:22', '07:25', '07:31'][i % 4],
        lastOut: s.status === 'outside' ? s.lastMovement.split('·')[1]?.trim() ?? '—' : '—',
        status,
        absenceInSession: status === 'present' ? minutes(0, t) : minutes((i % 4) * 5 + 5, t),
        exits: s.exits,
        updated: ['قبل دقيقة', 'قبل 3 دقائق', 'قبل 6 دقائق'][i % 3],
      }
    })
  }, [level])

  const attendanceByClass = useMemo(
    () => (level ? getAttendanceByClass(level) : []),
    [level],
  )
  const kpis = level ? getKpis(level) : null

  const filtered = useMemo(
    () =>
      rows.filter(
        (r) =>
          (filter === 'all' || r.status === filter) &&
          (!q || r.student.includes(q) || r.classroom.includes(q)),
      ),
    [rows, q, filter],
  )

  if (!level || !lvl || !kpis) return null

  const present = rows.filter((r) => r.status === 'present').length
  const absent = rows.filter((r) => r.status === 'absent').length
  const late = rows.filter((r) => r.status === 'late').length
  const noScan = rows.filter((r) => r.status === 'noScan').length

  return (
    <DashboardShell
      title={t('attendance.title')}
      subtitle={withLevel('attendance.subtitle', level, t)}
    >
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label={t('attendance.todayPresent')} value={present} icon={CheckCircle2} tone="success" />
          <StatCard label={t('attendance.todayAbsent')} value={absent} icon={XCircle} tone="danger" />
          <StatCard label={t('attendance.lateStart')} value={late} icon={Clock} tone="warning" />
          <StatCard label={t('attendance.noCardScan')} value={noScan} icon={CreditCard} tone="accent" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('attendance.byClass')}</CardTitle>
          </CardHeader>
          <CardContent>
            <AttendanceBarChart data={attendanceByClass} />
          </CardContent>
        </Card>

        <Card className="p-0">
          <div className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-xs">
              <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t('attendance.search')}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="pr-9"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {(['all', 'present', 'absent', 'late', 'noScan'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={
                    'rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ' +
                    (filter === f
                      ? 'bg-accent text-accent-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/70')
                  }
                >
                  {f === 'all' ? t('common.all') : t(statusLabelKey[f])}
                </button>
              ))}
            </div>
          </div>

          <Table>
            <THead>
              <TR className="hover:bg-transparent">
                <TH>{t('attendance.student')}</TH>
                <TH>{t('classrooms.classroom')}</TH>
                <TH>{t('attendance.firstIn')}</TH>
                <TH>{t('attendance.lastOut')}</TH>
                <TH>{t('common.status')}</TH>
                <TH>{t('attendance.absenceDuration')}</TH>
                <TH>{t('attendance.exitCount')}</TH>
                <TH>{t('common.lastUpdate')}</TH>
              </TR>
            </THead>
            <tbody>
              {filtered.map((r, i) => (
                <TR key={i}>
                  <TD className="font-bold">{r.student}</TD>
                  <TD className="text-muted-foreground">{r.classroom}</TD>
                  <TD className="tabular-nums">{r.firstIn}</TD>
                  <TD className="tabular-nums">{r.lastOut}</TD>
                  <TD><Badge variant={statusBadge[r.status]}>{t(statusLabelKey[r.status])}</Badge></TD>
                  <TD className="tabular-nums">{r.absenceInSession}</TD>
                  <TD className="tabular-nums">{r.exits}</TD>
                  <TD className="text-xs text-muted-foreground">{r.updated}</TD>
                </TR>
              ))}
            </tbody>
          </Table>
        </Card>
      </div>
    </DashboardShell>
  )
}
