'use client'

import { useEffect, useMemo, useState } from 'react'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { StatCard } from '@/components/stat-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Table, THead, TR, TH, TD } from '@/components/ui/table'
import { AttendanceBarChart } from '@/components/charts'
import { useLevel } from '@/components/level-provider'
import { levelMap } from '@/lib/mock-data'
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
  id: string
  student: string
  classroom: string
  firstIn: string
  lastOut: string
  status: 'present' | 'absent' | 'late' | 'noScan'
  absenceInSession: string
  scanCount: number
  updated: string
}

type AttendanceRecord = {
  id: string
  status: 'ABSENT' | 'PRESENT' | 'LATE' | 'EXCUSED'
  firstEntryAt: string | null
  lastExitAt: string | null
  scanCount: number
  updatedAt: string
  student: {
    fullNameAr: string
    fullNameEn: string
    cardCode: string
  }
  classroom: {
    classroomCode: string
  }
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

const levelTypeByLevel = {
  primary: 'PRIMARY',
  middle: 'MIDDLE',
  high: 'HIGH',
}

export default function AttendancePage() {
  const { level } = useLevel()
  const { language, t } = useLanguage()
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<'all' | Row['status']>('all')
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)

  const lvl = level ? levelMap[level] : null

  useEffect(() => {
    let active = true

    async function loadAttendance() {
      if (!level) return
      try {
        setLoading(true)
        const res = await fetch(`/api/attendance-records?level=${levelTypeByLevel[level]}&pageSize=100`, {
          cache: 'no-store',
        })
        if (!res.ok) throw new Error('Could not load attendance records')
        const data = await res.json()
        if (active) setRecords(data.records ?? [])
      } catch {
        if (active) setRecords([])
      } finally {
        if (active) setLoading(false)
      }
    }

    loadAttendance()
    return () => {
      active = false
    }
  }, [level])

  const rows = useMemo<Row[]>(() => {
    return records.map((record) => {
      const status: Row['status'] =
        record.status === 'PRESENT'
          ? 'present'
          : record.status === 'LATE'
            ? 'late'
            : record.scanCount === 0 && record.status !== 'ABSENT'
              ? 'noScan'
              : 'absent'

      return {
        id: record.id,
        student: language === 'EN' ? record.student.fullNameEn : record.student.fullNameAr,
        classroom: record.classroom.classroomCode,
        firstIn: formatTime(record.firstEntryAt),
        lastOut: formatTime(record.lastExitAt),
        status,
        absenceInSession: minutes(0, t),
        scanCount: record.scanCount,
        updated: formatTime(record.updatedAt),
      }
    })
  }, [records, language, t])

  const attendanceByClass = useMemo(() => {
    const grouped = new Map<string, { total: number; present: number }>()

    rows.forEach((row) => {
      const current = grouped.get(row.classroom) ?? { total: 0, present: 0 }
      current.total += 1
      if (row.status === 'present' || row.status === 'late') current.present += 1
      grouped.set(row.classroom, current)
    })

    return Array.from(grouped.entries()).map(([name, value]) => ({
      name,
      حضور: value.total ? Math.round((value.present / value.total) * 100) : 0,
    }))
  }, [rows])

  const filtered = useMemo(
    () =>
      rows.filter(
        (r) =>
          (filter === 'all' || r.status === filter) &&
          (!q || r.student.includes(q) || r.classroom.includes(q)),
      ),
    [rows, q, filter],
  )

  if (!level || !lvl) return null

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
                <TH>{t('attendance.scanCount')}</TH>
                <TH>{t('common.lastUpdate')}</TH>
              </TR>
            </THead>
            <tbody>
              {loading && (
                <TR>
                  <TD colSpan={8} className="text-center text-sm text-muted-foreground">
                    {t('common.loading')}
                  </TD>
                </TR>
              )}
              {!loading && filtered.length === 0 && (
                <TR>
                  <TD colSpan={8} className="text-center text-sm text-muted-foreground">
                    {t('attendance.empty')}
                  </TD>
                </TR>
              )}
              {!loading && filtered.map((r) => (
                <TR key={r.id}>
                  <TD className="font-bold">{r.student}</TD>
                  <TD className="text-muted-foreground">{r.classroom}</TD>
                  <TD className="tabular-nums">{r.firstIn}</TD>
                  <TD className="tabular-nums">{r.lastOut}</TD>
                  <TD><Badge variant={statusBadge[r.status]}>{t(statusLabelKey[r.status])}</Badge></TD>
                  <TD className="tabular-nums">{r.absenceInSession}</TD>
                  <TD className="tabular-nums">{r.scanCount}</TD>
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

function formatTime(value: string | null) {
  if (!value) return '-'
  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}
