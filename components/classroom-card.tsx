'use client'

import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { NoiseDot } from '@/components/noise-meter'
import { noiseStatus, noiseStatusMeta } from '@/lib/levels'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/components/language-provider'
import {
  UserCheck,
  UserX,
  LogOut,
  Wifi,
  WifiOff,
  BookOpen,
  ChevronLeft,
} from 'lucide-react'

export type ClassroomCardData = {
  id: string
  name: string
  subject: string
  teacher: string
  noise: number
  present: number
  absent: number
  outside: number
  deviceStatus: 'online' | 'offline'
  lastUpdate: string
}

export function ClassroomCard({ c }: { c: ClassroomCardData }) {
  const meta = noiseStatusMeta[noiseStatus(c.noise)]
  const { t } = useLanguage()
  return (
    <Link href={`/classrooms/${c.id}`}>
      <Card className="group h-full p-5 transition-all hover:-translate-y-0.5 hover:shadow-md">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span
                className="size-2.5 shrink-0 rounded-full live-dot"
                style={{ backgroundColor: meta.color }}
              />
              <h3 className="truncate text-base font-extrabold tracking-tight">
                {c.name}
              </h3>
            </div>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <BookOpen className="size-3.5" />
              {c.subject} · {c.teacher}
            </p>
          </div>
          {c.deviceStatus === 'online' ? (
            <Badge variant="success">
              <Wifi className="size-3" /> {t('classrooms.online')}
            </Badge>
          ) : (
            <Badge variant="danger">
              <WifiOff className="size-3" /> {t('classrooms.offline')}
            </Badge>
          )}
        </div>

        <div
          className="mt-4 flex items-center justify-between rounded-xl border p-3"
          style={{ borderColor: `${meta.color}30`, background: `${meta.color}0c` }}
        >
          <div>
            <p className="text-[11px] font-medium text-muted-foreground">
              {t('classrooms.noiseLevel')}
            </p>
            <NoiseDot value={c.noise} />
          </div>
          <span
            className="text-2xl font-extrabold tabular-nums"
            style={{ color: meta.color }}
          >
            {c.noise}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <Stat icon={UserCheck} tone="success" label={t('classrooms.present')} value={c.present} />
          <Stat icon={UserX} tone="danger" label={t('classrooms.absent')} value={c.absent} />
          <Stat icon={LogOut} tone="warning" label={t('classrooms.outside')} value={c.outside} />
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3 text-xs text-muted-foreground">
          <span>{t('common.lastUpdatePrefix')} {c.lastUpdate}</span>
          <span className="flex items-center gap-0.5 font-semibold text-accent opacity-0 transition-opacity group-hover:opacity-100">
            {t('common.details')} <ChevronLeft className="size-3.5" />
          </span>
        </div>
      </Card>
    </Link>
  )
}

function Stat({
  icon: Icon,
  tone,
  label,
  value,
}: {
  icon: typeof UserCheck
  tone: 'success' | 'danger' | 'warning'
  label: string
  value: number
}) {
  const toneClass = {
    success: 'text-success',
    danger: 'text-destructive',
    warning: 'text-[#b45309]',
  }[tone]
  return (
    <div className="rounded-lg bg-muted/60 px-2 py-2.5">
      <Icon className={cn('mx-auto size-4', toneClass)} />
      <p className="mt-1 text-lg font-extrabold tabular-nums leading-none">
        {value}
      </p>
      <p className="mt-0.5 text-[10px] text-muted-foreground">{label}</p>
    </div>
  )
}
