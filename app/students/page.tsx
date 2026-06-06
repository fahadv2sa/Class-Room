'use client'

import { useEffect, useMemo, useState } from 'react'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Table, THead, TR, TH, TD } from '@/components/ui/table'
import { useLevel } from '@/components/level-provider'
import { levelMap, type Level } from '@/lib/mock-data'
import { Search, X, LogIn, LogOut, Undo2 } from 'lucide-react'
import { useLanguage } from '@/components/language-provider'
import { levelNameKey, minutes, percent } from '@/lib/i18n/ui'

type ApiStudent = {
  id: string
  fullNameAr: string
  cardCode: string
  status: 'ACTIVE' | 'INACTIVE' | 'GRADUATED' | 'TRANSFERRED'
  classroom: {
    classroomCode: string
  }
}

type Student = {
  id: string
  name: string
  cardId: string
  classroom: string
  level: Level
  attendanceRate: number
  exits: number
  avgExitDuration: number
  lastMovement: string
  status: 'inside' | 'outside' | 'absent'
}

const statusMeta: Record<Student['status'], { variant: 'success' | 'warning' | 'danger'; key: string }> = {
  inside: { variant: 'success', key: 'students.inside' },
  outside: { variant: 'warning', key: 'students.outside' },
  absent: { variant: 'danger', key: 'students.absent' },
}

const levelTypeParam: Record<Level, string> = {
  primary: 'PRIMARY',
  middle: 'MIDDLE',
  high: 'HIGH',
}

function projectStudent(student: ApiStudent, index: number, level: Level): Student {
  const seed = student.id.split('').reduce((sum, char) => sum + char.charCodeAt(0), index + 1)
  const exits = seed % 6
  const status: Student['status'] =
    student.status !== 'ACTIVE' ? 'absent' : seed % 17 === 0 ? 'absent' : seed % 11 === 0 ? 'outside' : 'inside'

  return {
    id: student.id,
    name: student.fullNameAr,
    cardId: student.cardCode,
    classroom: student.classroom.classroomCode,
    level,
    attendanceRate: 72 + ((seed * 5) % 28),
    exits,
    avgExitDuration: exits === 0 ? 0 : 3 + ((seed * 13) % 10),
    lastMovement:
      status === 'absent'
        ? 'غياب'
        : status === 'outside'
          ? `خروج · ${9 + (seed % 3)}:${String(10 + (seed % 50)).padStart(2, '0')} ص`
          : `دخول · 07:${String(15 + (seed % 25)).padStart(2, '0')} ص`,
    status,
  }
}

export default function StudentsPage() {
  const { level } = useLevel()
  const { t } = useLanguage()
  const [q, setQ] = useState('')
  const [selected, setSelected] = useState<Student | null>(null)
  const [apiStudents, setApiStudents] = useState<ApiStudent[]>([])

  const lvl = level ? levelMap[level] : null
  useEffect(() => {
    async function loadStudents() {
      if (!level) return

      const loaded: ApiStudent[] = []
      let page = 1
      let totalPages = 1

      do {
        const res = await fetch(`/api/students?page=${page}&pageSize=100&level=${levelTypeParam[level]}`, {
          cache: 'no-store',
        })
        if (!res.ok) return
        const data = await res.json()
        loaded.push(...(data.students ?? []))
        totalPages = data.meta?.totalPages ?? 1
        page += 1
      } while (page <= totalPages)

      setApiStudents(loaded)
    }

    loadStudents()
  }, [level])

  const students = useMemo(
    () => (level ? apiStudents.map((student, index) => projectStudent(student, index, level)) : []),
    [apiStudents, level],
  )

  const filtered = useMemo(
    () =>
      students.filter(
        (s) => !q || s.name.includes(q) || s.classroom.includes(q) || s.cardId.includes(q),
      ),
    [students, q],
  )

  if (!level || !lvl) return null

  return (
    <DashboardShell
      title={t('students.title')}
      subtitle={`${students.length} ${t('students.subtitleSuffix')} · ${t(levelNameKey[level])}`}
    >
      <Card className="p-0">
        <div className="p-4">
          <div className="relative w-full lg:max-w-sm">
            <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t('students.search')}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pr-9"
            />
          </div>
        </div>

        <Table>
          <THead>
            <TR className="hover:bg-transparent">
              <TH>{t('attendance.student')}</TH>
              <TH>{t('students.cardNumber')}</TH>
              <TH>{t('classrooms.classroom')}</TH>
              <TH>{t('teachers.attendanceRate')}</TH>
              <TH>{t('students.exitTimes')}</TH>
              <TH>{t('students.avgExitDuration')}</TH>
              <TH>{t('students.lastMovement')}</TH>
              <TH>{t('common.status')}</TH>
            </TR>
          </THead>
          <tbody>
            {filtered.map((s) => (
              <TR
                key={s.id}
                className="cursor-pointer"
                onClick={() => setSelected(s)}
              >
                <TD className="font-bold">{s.name}</TD>
                <TD className="font-mono text-xs text-muted-foreground" dir="ltr">{s.cardId}</TD>
                <TD className="text-muted-foreground">{s.classroom}</TD>
                <TD>
                  <span className="flex items-center gap-2">
                    <span className="tabular-nums font-semibold">{percent(s.attendanceRate, t)}</span>
                    <span className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                      <span
                        className="block h-full rounded-full"
                        style={{
                          width: `${s.attendanceRate}%`,
                          background: s.attendanceRate >= 90 ? '#22c55e' : s.attendanceRate >= 80 ? '#f59e0b' : '#ef4444',
                        }}
                      />
                    </span>
                  </span>
                </TD>
                <TD className="tabular-nums">{s.exits}</TD>
                <TD className="tabular-nums">{minutes(s.avgExitDuration, t)}</TD>
                <TD className="text-xs text-muted-foreground">{s.lastMovement}</TD>
                <TD><Badge variant={statusMeta[s.status].variant}>{t(statusMeta[s.status].key)}</Badge></TD>
              </TR>
            ))}
          </tbody>
        </Table>
      </Card>

      {selected && (
        <StudentModal student={selected} onClose={() => setSelected(null)} />
      )}
    </DashboardShell>
  )
}

function StudentModal({
  student,
  onClose,
}: {
  student: Student
  onClose: () => void
}) {
  const { t } = useLanguage()
  const movement = [
    { typeKey: 'movement.entry', time: '07:22', icon: LogIn, color: 'text-success' },
    { typeKey: 'movement.exit', time: '10:05', icon: LogOut, color: 'text-destructive' },
    { typeKey: 'movement.return', time: '10:14', icon: Undo2, color: 'text-accent' },
    { typeKey: 'movement.exit', time: '11:40', icon: LogOut, color: 'text-destructive' },
  ]
  const attendance = [
    { dayKey: 'days.sunday', statusKey: 'classrooms.present', v: 'success' as const },
    { dayKey: 'days.monday', statusKey: 'classrooms.present', v: 'success' as const },
    { dayKey: 'days.tuesday', statusKey: 'movement.late', v: 'warning' as const },
    { dayKey: 'days.wednesday', statusKey: 'classrooms.present', v: 'success' as const },
    { dayKey: 'days.thursday', statusKey: 'classrooms.absent', v: 'danger' as const },
  ]

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="scrollbar-thin max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-card p-6 shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-accent/10 text-xl font-extrabold text-accent">
              {student.name.charAt(0)}
            </div>
            <div>
              <h3 className="text-lg font-extrabold">{student.name}</h3>
              <p className="text-sm text-muted-foreground">{student.classroom}</p>
              <p className="font-mono text-xs text-muted-foreground" dir="ltr">{student.cardId}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted" aria-label={t('common.close')}>
            <X className="size-5" />
          </button>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2">
          <Stat label={t('teachers.attendanceRate')} value={percent(student.attendanceRate, t)} />
          <Stat label={t('students.exitTimes')} value={String(student.exits)} />
          <Stat label={t('students.avgExitDuration')} value={minutes(student.avgExitDuration, t)} />
        </div>

        <Section title={t('students.weeklyAttendance')}>
          <div className="grid grid-cols-5 gap-2">
            {attendance.map((a) => (
              <div key={a.dayKey} className="rounded-xl bg-muted/50 p-2 text-center">
                <p className="text-[11px] text-muted-foreground">{t(a.dayKey)}</p>
                <Badge variant={a.v} className="mt-1.5">{t(a.statusKey)}</Badge>
              </div>
            ))}
          </div>
        </Section>

        <Section title={t('students.exitReturnLog')}>
          <div className="space-y-2">
            {movement.map((m, i) => {
              const Icon = m.icon
              return (
                <div key={i} className="flex items-center justify-between rounded-xl bg-muted/40 px-3.5 py-2.5">
                  <span className={`flex items-center gap-2 text-sm font-semibold ${m.color}`}>
                    <Icon className="size-4" /> {t(m.typeKey)}
                  </span>
                  <span className="text-xs text-muted-foreground tabular-nums">{m.time}</span>
                </div>
              )
            })}
          </div>
        </Section>

        <Section title={t('students.disciplineIndicators')}>
          <div className="space-y-2.5">
            <Indicator label={t('students.attendanceCommitment')} value={student.attendanceRate} />
            <Indicator label={t('students.classStability')} value={Math.max(40, 100 - student.exits * 10)} />
            <Indicator label={t('students.generalEngagement')} value={82} />
          </div>
        </Section>

        <Section title={t('students.adminNotes')}>
          <p className="rounded-xl bg-muted/50 px-4 py-3 text-sm leading-relaxed text-muted-foreground">
            {t('students.adminNoteText')}
          </p>
        </Section>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/60 p-3 text-center">
      <p className="text-xl font-extrabold tabular-nums">{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-5">
      <p className="mb-2.5 text-sm font-bold">{title}</p>
      {children}
    </div>
  )
}

function Indicator({ label, value }: { label: string; value: number }) {
  const color = value >= 85 ? '#22c55e' : value >= 70 ? '#f59e0b' : '#ef4444'
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-bold tabular-nums">{value}٪</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full" style={{ width: `${value}%`, background: color }} />
      </div>
    </div>
  )
}
