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

const noiseOptions = [
  { value: 'all', label: 'كل المستويات' },
  { value: 'quiet', label: 'هادئ' },
  { value: 'medium', label: 'متوسط' },
  { value: 'loud', label: 'مرتفع' },
]

export default function ClassroomsPage() {
  const { level } = useLevel()
  const [view, setView] = useState<'grid' | 'table'>('grid')
  const [grade, setGrade] = useState<number | 'all'>('all')
  const [noise, setNoise] = useState('all')
  const [q, setQ] = useState('')

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
      title="الفصول الدراسية"
      subtitle={`${classrooms.length} فصلاً في ${lvl.ar}`}
    >
      <div className="space-y-5">
        <Card className="p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-xs">
              <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="ابحث باسم الفصل أو المعلم..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="pr-9"
              />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Segmented options={noiseOptions} value={noise} onChange={setNoise} />
              <Segmented
                options={[
                  { value: 'grid', label: 'بطاقات' },
                  { value: 'table', label: 'جدول' },
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
              كل الصفوف
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
                الصف {lvl.gradeAr[g - 1]}
              </button>
            ))}
          </div>
        </Card>

        {filtered.length === 0 ? (
          <EmptyState />
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
                  <TH>الفصل</TH>
                  <TH>الصف والشعبة</TH>
                  <TH>المعلم الحالي</TH>
                  <TH>الطلاب</TH>
                  <TH>الحضور</TH>
                  <TH>الغياب</TH>
                  <TH>خارج الفصل</TH>
                  <TH>الضوضاء</TH>
                  <TH>الجهاز</TH>
                  <TH>آخر تحديث</TH>
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
                        <Badge variant="success"><Wifi className="size-3" /> متصل</Badge>
                      ) : (
                        <Badge variant="danger"><WifiOff className="size-3" /> غير متصل</Badge>
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

function EmptyState() {
  return (
    <Card className="flex flex-col items-center justify-center gap-3 p-16 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-muted">
        <List className="size-6 text-muted-foreground" />
      </div>
      <p className="font-bold">لا توجد فصول مطابقة</p>
      <p className="text-sm text-muted-foreground">
        جرّب تعديل عوامل التصفية أو البحث للعثور على الفصول.
      </p>
    </Card>
  )
}
