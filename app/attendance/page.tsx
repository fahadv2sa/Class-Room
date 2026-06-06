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
  status: 'حاضر' | 'غائب' | 'متأخر' | 'لم يمرر البطاقة'
  absenceInSession: string
  exits: number
  updated: string
}

const statusBadge: Record<Row['status'], 'success' | 'danger' | 'warning' | 'accent'> = {
  حاضر: 'success',
  غائب: 'danger',
  متأخر: 'warning',
  'لم يمرر البطاقة': 'accent',
}

export default function AttendancePage() {
  const { level } = useLevel()
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<'all' | Row['status']>('all')

  const lvl = level ? levelMap[level] : null
  const rows = useMemo<Row[]>(() => {
    if (!level) return []
    return getStudents(level).map((s, i) => {
      const status: Row['status'] =
        s.status === 'absent'
          ? 'غائب'
          : i % 7 === 3
            ? 'متأخر'
            : i % 11 === 5
              ? 'لم يمرر البطاقة'
              : 'حاضر'
      return {
        student: s.name,
        classroom: s.classroom,
        firstIn: s.status === 'absent' ? '—' : ['07:18 ص', '07:22 ص', '07:25 ص', '07:31 ص'][i % 4],
        lastOut: s.status === 'outside' ? s.lastMovement.split('·')[1]?.trim() ?? '—' : '—',
        status,
        absenceInSession: status === 'حاضر' ? '0 د' : `${(i % 4) * 5 + 5} د`,
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

  const present = rows.filter((r) => r.status === 'حاضر').length
  const absent = rows.filter((r) => r.status === 'غائب').length
  const late = rows.filter((r) => r.status === 'متأخر').length
  const noScan = rows.filter((r) => r.status === 'لم يمرر البطاقة').length

  return (
    <DashboardShell
      title="الحضور والغياب"
      subtitle={`الحضور الإلكتروني · ${lvl.ar}`}
    >
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="حضور اليوم" value={present} icon={CheckCircle2} tone="success" />
          <StatCard label="غياب اليوم" value={absent} icon={XCircle} tone="danger" />
          <StatCard label="تأخر عن بداية الحصة" value={late} icon={Clock} tone="warning" />
          <StatCard label="لم يتم تمرير البطاقة" value={noScan} icon={CreditCard} tone="accent" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>نسبة الحضور لكل فصل</CardTitle>
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
                placeholder="ابحث عن طالب أو فصل..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="pr-9"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {(['all', 'حاضر', 'غائب', 'متأخر', 'لم يمرر البطاقة'] as const).map((f) => (
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
                  {f === 'all' ? 'الكل' : f}
                </button>
              ))}
            </div>
          </div>

          <Table>
            <THead>
              <TR className="hover:bg-transparent">
                <TH>الطالب</TH>
                <TH>الفصل</TH>
                <TH>أول دخول</TH>
                <TH>آخر خروج</TH>
                <TH>الحالة</TH>
                <TH>مدة الغياب داخل الحصص</TH>
                <TH>عدد مرات الخروج</TH>
                <TH>آخر تحديث</TH>
              </TR>
            </THead>
            <tbody>
              {filtered.map((r, i) => (
                <TR key={i}>
                  <TD className="font-bold">{r.student}</TD>
                  <TD className="text-muted-foreground">{r.classroom}</TD>
                  <TD className="tabular-nums">{r.firstIn}</TD>
                  <TD className="tabular-nums">{r.lastOut}</TD>
                  <TD><Badge variant={statusBadge[r.status]}>{r.status}</Badge></TD>
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
