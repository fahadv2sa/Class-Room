'use client'

import { useEffect, useMemo, useState } from 'react'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { StatCard } from '@/components/stat-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, THead, TR, TH, TD } from '@/components/ui/table'
import { MovementLineChart } from '@/components/charts'
import { useLevel } from '@/components/level-provider'
import { LogOut, Timer, Repeat, Clock, LogIn, Undo2 } from 'lucide-react'
import { useLanguage } from '@/components/language-provider'
import { withLevel } from '@/lib/i18n/ui'

type Movement = {
  id: string
  exitedAt: string
  returnedAt: string | null
  durationMinutes: number | null
  status: 'OPEN' | 'CLOSED'
  student: { fullNameAr: string; fullNameEn: string }
  classroom: { classroomCode: string }
}

type ClassroomPresence = {
  classroomId: string
  classroomCode: string
  studentsOutside: number
}

const levelTypeByLevel = {
  primary: 'PRIMARY',
  middle: 'MIDDLE',
  high: 'HIGH',
}

const typeMeta: Record<string, { badge: 'success' | 'danger' | 'accent'; icon: typeof LogIn }> = {
  entry: { badge: 'success', icon: LogIn },
  exit: { badge: 'danger', icon: LogOut },
  return: { badge: 'accent', icon: Undo2 },
}

const statusBadge: Record<string, 'success' | 'warning' | 'danger'> = {
  approved: 'success',
  late: 'warning',
  notReturned: 'danger',
}

const typeLabelKey: Record<string, string> = {
  entry: 'movement.entry',
  exit: 'movement.exit',
  return: 'movement.return',
}

const statusLabelKey: Record<string, string> = {
  approved: 'movement.approved',
  late: 'movement.late',
  notReturned: 'movement.notReturned',
}

export default function MovementPage() {
  const { level } = useLevel()
  const { language, t } = useLanguage()
  const [movements, setMovements] = useState<Movement[]>([])
  const [classrooms, setClassrooms] = useState<ClassroomPresence[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function loadMovement() {
      if (!level) return
      try {
        setLoading(true)
        const levelType = levelTypeByLevel[level]
        const [movementRes, presenceRes] = await Promise.all([
          fetch(`/api/movements/students?level=${levelType}&pageSize=100`, { cache: 'no-store' }),
          fetch(`/api/presence/classrooms?level=${levelType}`, { cache: 'no-store' }),
        ])
        const movementData = movementRes.ok ? await movementRes.json() : { movements: [] }
        const presenceData = presenceRes.ok ? await presenceRes.json() : { classrooms: [] }
        if (active) {
          setMovements(movementData.movements ?? [])
          setClassrooms(presenceData.classrooms ?? [])
        }
      } catch {
        if (active) {
          setMovements([])
          setClassrooms([])
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    loadMovement()
    return () => {
      active = false
    }
  }, [level])

  if (!level) return null

  const topExitStudents = useMemo(() => {
    const counts = new Map<string, { name: string; classroom: string; exits: number }>()
    movements.forEach((movement) => {
      const name = language === 'EN' ? movement.student.fullNameEn : movement.student.fullNameAr
      const current = counts.get(name) ?? { name, classroom: movement.classroom.classroomCode, exits: 0 }
      current.exits += 1
      counts.set(name, current)
    })
    return Array.from(counts.values()).sort((a, b) => b.exits - a.exits).slice(0, 5)
  }, [movements, language])

  const topExitClasses = useMemo(
    () => [...classrooms].sort((a, b) => b.studentsOutside - a.studentsOutside).slice(0, 5),
    [classrooms],
  )

  const movementByHour = useMemo(() => {
    const buckets = new Map<string, { hour: string; خروج: number; عودة: number }>()
    movements.forEach((movement) => {
      const exitHour = hourLabel(movement.exitedAt)
      const exitBucket = buckets.get(exitHour) ?? { hour: exitHour, خروج: 0, عودة: 0 }
      exitBucket.خروج += 1
      buckets.set(exitHour, exitBucket)

      if (movement.returnedAt) {
        const returnHour = hourLabel(movement.returnedAt)
        const returnBucket = buckets.get(returnHour) ?? { hour: returnHour, خروج: 0, عودة: 0 }
        returnBucket.عودة += 1
        buckets.set(returnHour, returnBucket)
      }
    })
    return Array.from(buckets.values()).sort((a, b) => a.hour.localeCompare(b.hour))
  }, [movements])

  const topStudent = topExitStudents[0]
  const topClass = topExitClasses[0]
  const closedDurations = movements
    .map((movement) => movement.durationMinutes)
    .filter((duration): duration is number => typeof duration === 'number')
  const avgDuration = closedDurations.length
    ? Math.round(closedDurations.reduce((sum, duration) => sum + duration, 0) / closedDurations.length)
    : 0
  const peakHour = movementByHour.sort((a, b) => b.خروج + b.عودة - (a.خروج + a.عودة))[0]?.hour ?? '-'

  return (
    <DashboardShell
      title={t('movement.title')}
      subtitle={withLevel('movement.subtitle', level, t)}
    >
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label={t('movement.topStudent')} value={topStudent?.name ?? '-'} icon={Repeat} tone="warning" />
          <StatCard label={t('movement.topClass')} value={topClass?.classroomCode ?? '-'} icon={LogOut} tone="danger" />
          <StatCard label={t('movement.avgDuration')} value={avgDuration} unit={t('settings.minutes')} icon={Timer} tone="accent" />
          <StatCard label={t('movement.peakTime')} value={peakHour} icon={Clock} tone="accent" />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>{t('movement.liveLog')}</CardTitle>
              <Badge variant="accent">
                <span className="size-1.5 rounded-full bg-accent live-dot" /> {t('common.live')}
              </Badge>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <THead>
                  <TR className="hover:bg-transparent">
                    <TH>{t('attendance.student')}</TH>
                    <TH>{t('classrooms.classroom')}</TH>
                    <TH>{t('movement.teacher')}</TH>
                    <TH>{t('movement.type')}</TH>
                    <TH>{t('common.time')}</TH>
                    <TH>{t('movement.durationOutside')}</TH>
                    <TH>{t('common.status')}</TH>
                  </TR>
                </THead>
                <tbody>
                  {loading && (
                    <TR>
                      <TD colSpan={7} className="text-center text-sm text-muted-foreground">{t('common.loading')}</TD>
                    </TR>
                  )}
                  {!loading && movements.length === 0 && (
                    <TR>
                      <TD colSpan={7} className="text-center text-sm text-muted-foreground">{t('movement.empty')}</TD>
                    </TR>
                  )}
                  {!loading && movements.map((movement) => {
                    const type = movement.status === 'OPEN' ? 'exit' : 'return'
                    const status = movement.status === 'OPEN' ? 'notReturned' : 'approved'
                    const typeInfo = typeMeta[type]
                    const Icon = typeInfo.icon
                    return (
                      <TR key={movement.id}>
                        <TD className="font-bold">{language === 'EN' ? movement.student.fullNameEn : movement.student.fullNameAr}</TD>
                        <TD className="text-muted-foreground">{movement.classroom.classroomCode}</TD>
                        <TD className="text-muted-foreground">-</TD>
                        <TD>
                          <Badge variant={typeInfo.badge}>
                            <Icon className="size-3" /> {t(typeLabelKey[type])}
                          </Badge>
                        </TD>
                        <TD className="tabular-nums">{formatTime(movement.status === 'OPEN' ? movement.exitedAt : movement.returnedAt)}</TD>
                        <TD className="tabular-nums">{movement.durationMinutes ?? '-'}</TD>
                        <TD>
                          <Badge variant={statusBadge[status]}>{t(statusLabelKey[status])}</Badge>
                        </TD>
                      </TR>
                    )
                  })}
                </tbody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('dashboard.movementByHour')}</CardTitle>
            </CardHeader>
            <CardContent>
              <MovementLineChart data={movementByHour} />
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>{t('movement.topStudent')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-2">
              {topExitStudents.map((student, i) => (
                <div key={student.name} className="flex items-center justify-between rounded-xl bg-muted/50 px-3.5 py-2.5">
                  <div className="flex items-center gap-3">
                    <span className="flex size-7 items-center justify-center rounded-lg bg-card text-xs font-bold text-muted-foreground">{i + 1}</span>
                    <div className="leading-tight">
                      <p className="text-sm font-semibold">{student.name}</p>
                      <p className="text-[11px] text-muted-foreground">{student.classroom}</p>
                    </div>
                  </div>
                  <Badge variant="warning">{student.exits} {t('movement.times')}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('movement.topClass')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-2">
              {topExitClasses.map((classroom, i) => (
                <div key={classroom.classroomId} className="flex items-center justify-between rounded-xl bg-muted/50 px-3.5 py-2.5">
                  <div className="flex items-center gap-3">
                    <span className="flex size-7 items-center justify-center rounded-lg bg-card text-xs font-bold text-muted-foreground">{i + 1}</span>
                    <span className="text-sm font-semibold">{classroom.classroomCode}</span>
                  </div>
                  <Badge variant="danger">{classroom.studentsOutside} {t('classrooms.outside')}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
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

function hourLabel(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    hour12: false,
  }).format(new Date(value))
}
