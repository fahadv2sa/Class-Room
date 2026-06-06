'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { ClassroomCard } from '@/components/classroom-card'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Segmented } from '@/components/ui/segmented'
import { Table, THead, TR, TH, TD } from '@/components/ui/table'
import { NoiseDot } from '@/components/noise-meter'
import { useLevel } from '@/components/level-provider'
import { getClassrooms, levelMap, noiseStatus } from '@/lib/mock-data'
import { Search, List, Wifi, WifiOff } from 'lucide-react'
import { useLanguage } from '@/components/language-provider'
import { classroomCount, noiseStatusKey } from '@/lib/i18n/ui'

export default function ClassroomsPage() {
  const { level } = useLevel()
  const [view, setView] = useState<'grid' | 'table'>('grid')
  const [grade, setGrade] = useState<number | 'all'>('all')
  const [noise, setNoise] = useState('all')
  const [q, setQ] = useState('')
  const { t } = useLanguage()

  const lvl = level ? levelMap[level] : null
  const classrooms = useMemo(() => (level ? getClassrooms(level) : []), [level])

  const filtered = useMemo(() => {
    return classrooms.filter((c) => {
      if (grade !== 'all' && c.grade !== grade) return false
      if (noise !== 'all' && noiseStatus(c.noise) !== noise) return false
      if (q && !c.name.includes(q) && !c.teacher.includes(q)) return false
      return true
    })
  }, [classrooms, grade, noise, q])

  if (!level || !lvl) return null

  return (
    <DashboardShell
      title={t('classrooms.title')}
      subtitle={classroomCount(classrooms.length, level, t)}
    >
      <div className="space-y-5">
        <Card className="p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-xs">
              <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t('classrooms.search')}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="pr-9"
              />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Segmented
                options={[
                  { value: 'all', label: t('classrooms.allNoise') },
                  { value: 'quiet', label: t(noiseStatusKey.quiet) },
                  { value: 'medium', label: t(noiseStatusKey.medium) },
                  { value: 'loud', label: t(noiseStatusKey.loud) },
                ]}
                value={noise}
                onChange={setNoise}
              />
              <Segmented
                options={[
                  { value: 'grid', label: t('classrooms.grid') },
                  { value: 'table', label: t('classrooms.table') },
                ]}
                value={view}
                onChange={setView}
              />
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() => setGrade('all')}
              className={
                'rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ' +
                (grade === 'all'
                  ? 'bg-accent text-accent-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/70')
              }
            >
              {t('classrooms.allGrades')}
            </button>
            {lvl.grades.map((g) => (
              <button
                key={g}
                onClick={() => setGrade(g)}
                className={
                  'rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ' +
                  (grade === g
                    ? 'bg-accent text-accent-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/70')
                }
              >
                {g}
              </button>
            ))}
          </div>
        </Card>

        {filtered.length === 0 ? (
          <EmptyState t={t} />
        ) : view === 'grid' ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((c) => (
              <ClassroomCard key={c.id} c={c} />
            ))}
          </div>
        ) : (
          <Card className="p-0">
            <Table>
              <THead>
                <TR className="hover:bg-transparent">
                  <TH>{t('classrooms.classroom')}</TH>
                  <TH>{t('classrooms.gradeSection')}</TH>
                  <TH>{t('classrooms.currentTeacher')}</TH>
                  <TH>{t('level.students')}</TH>
                  <TH>{t('attendance.title')}</TH>
                  <TH>{t('attendance.todayAbsent')}</TH>
                  <TH>{t('classrooms.outside')}</TH>
                  <TH>{t('classrooms.noise')}</TH>
                  <TH>{t('classrooms.device')}</TH>
                  <TH>{t('common.lastUpdate')}</TH>
                </TR>
              </THead>
              <tbody>
                {filtered.map((c) => (
                  <TR key={c.id}>
                    <TD className="font-bold">
                      <Link href={`/classrooms/${c.id}`} className="hover:text-accent">
                        {c.name}
                      </Link>
                    </TD>
                    <TD className="text-muted-foreground">{c.adminLabel}</TD>
                    <TD>{c.teacher}</TD>
                    <TD className="tabular-nums">{c.totalStudents}</TD>
                    <TD className="font-semibold text-success tabular-nums">{c.present}</TD>
                    <TD className="font-semibold text-destructive tabular-nums">{c.absent}</TD>
                    <TD className="font-semibold text-[#b45309] tabular-nums">{c.outside}</TD>
                    <TD>
                      <span className="flex items-center gap-2">
                        <span className="tabular-nums font-bold">{c.noise}</span>
                        <NoiseDot value={c.noise} />
                      </span>
                    </TD>
                    <TD>
                      {c.deviceStatus === 'online' ? (
                        <Badge variant="success"><Wifi className="size-3" /> {t('classrooms.online')}</Badge>
                      ) : (
                        <Badge variant="danger"><WifiOff className="size-3" /> {t('classrooms.offline')}</Badge>
                      )}
                    </TD>
                    <TD className="text-xs text-muted-foreground">{c.lastUpdate}</TD>
                  </TR>
                ))}
              </tbody>
            </Table>
          </Card>
        )}
      </div>
    </DashboardShell>
  )
}

function EmptyState({ t }: { t: (key: string) => string }) {
  return (
    <Card className="flex flex-col items-center justify-center gap-3 p-16 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-muted">
        <List className="size-6 text-muted-foreground" />
      </div>
      <p className="font-bold">{t('classrooms.emptyTitle')}</p>
      <p className="text-sm text-muted-foreground">
        {t('classrooms.emptyText')}
      </p>
    </Card>
  )
}
