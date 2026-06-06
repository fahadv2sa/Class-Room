'use client'

import { useState } from 'react'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { StatCard } from '@/components/stat-card'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Segmented } from '@/components/ui/segmented'
import { useLevel } from '@/components/level-provider'
import { getDevices, levelMap, type Device } from '@/lib/mock-data'
import {
  Cpu,
  Wifi,
  WifiOff,
  BatteryFull,
  BatteryLow,
  Volume2,
  ScanLine,
  CircleCheck,
  CircleAlert,
  CircleX,
} from 'lucide-react'

const sensorMeta: Record<
  Device['soundSensor'],
  { icon: typeof CircleCheck; tone: string; label: string }
> = {
  ok: { icon: CircleCheck, tone: 'text-success', label: 'يعمل' },
  warn: { icon: CircleAlert, tone: 'text-[#b45309]', label: 'تحذير' },
  fail: { icon: CircleX, tone: 'text-destructive', label: 'عطل' },
}

const filters = [
  { value: 'all', label: 'الكل' },
  { value: 'online', label: 'متصل' },
  { value: 'offline', label: 'غير متصل' },
]

export default function DevicesPage() {
  const { level } = useLevel()
  const [filter, setFilter] = useState('all')

  const lvl = level ? levelMap[level] : null
  const devices = level ? getDevices(level) : []

  const list = devices.filter((d) =>
    filter === 'all' ? true : d.status === filter,
  )
  const online = devices.filter((d) => d.status === 'online').length
  const lowBattery = devices.filter((d) => d.battery < 25).length
  const faulty = devices.filter(
    (d) => d.soundSensor !== 'ok' || d.cardReader !== 'ok',
  ).length

  if (!level || !lvl) return null

  return (
    <DashboardShell
      title="الأجهزة"
      subtitle={`حالة أجهزة الفصول الذكية · ${lvl.ar}`}
    >
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="إجمالي الأجهزة" value={devices.length} icon={Cpu} tone="accent" />
          <StatCard label="متصلة الآن" value={online} unit={`/ ${devices.length}`} icon={Wifi} tone="success" />
          <StatCard label="بطارية منخفضة" value={lowBattery} icon={BatteryLow} tone="warning" />
          <StatCard label="تحتاج صيانة" value={faulty} icon={CircleAlert} tone="danger" />
        </div>

        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold tracking-tight">قائمة الأجهزة</h2>
          <Segmented options={filters} value={filter} onChange={setFilter} />
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {list.map((d) => {
            const sound = sensorMeta[d.soundSensor]
            const reader = sensorMeta[d.cardReader]
            const SoundIcon = sound.icon
            const ReaderIcon = reader.icon
            const lowBat = d.battery < 25
            return (
              <Card
                key={d.id}
                className="p-5"
                style={{
                  boxShadow: `inset 4px 0 0 ${d.status === 'online' ? '#22c55e' : '#ef4444'}`,
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex size-11 items-center justify-center rounded-xl bg-muted">
                      <Cpu className="size-5 text-foreground" />
                    </div>
                    <div className="leading-tight">
                      <p className="font-extrabold">{d.classroom}</p>
                      <p className="font-mono text-[11px] text-muted-foreground" dir="ltr">
                        {d.serial}
                      </p>
                    </div>
                  </div>
                  {d.status === 'online' ? (
                    <Badge variant="success"><Wifi className="size-3" /> متصل</Badge>
                  ) : (
                    <Badge variant="danger"><WifiOff className="size-3" /> غير متصل</Badge>
                  )}
                </div>

                <div className="mt-4 space-y-2.5 text-sm">
                  <Row
                    icon={lowBat ? BatteryLow : BatteryFull}
                    iconTone={lowBat ? 'text-destructive' : 'text-success'}
                    label="البطارية"
                  >
                    <span className="flex items-center gap-2">
                      <span className="h-1.5 w-16 overflow-hidden rounded-full bg-border">
                        <span
                          className="block h-full rounded-full"
                          style={{
                            width: `${d.battery}%`,
                            backgroundColor: lowBat ? '#ef4444' : '#22c55e',
                          }}
                        />
                      </span>
                      <span className="font-bold tabular-nums">{d.battery}٪</span>
                    </span>
                  </Row>
                  <Row icon={Volume2} iconTone="text-muted-foreground" label="حساس الصوت">
                    <span className={`flex items-center gap-1 font-semibold ${sound.tone}`}>
                      <SoundIcon className="size-4" /> {sound.label}
                    </span>
                  </Row>
                  <Row icon={ScanLine} iconTone="text-muted-foreground" label="قارئ البطاقات">
                    <span className={`flex items-center gap-1 font-semibold ${reader.tone}`}>
                      <ReaderIcon className="size-4" /> {reader.label}
                    </span>
                  </Row>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3 text-xs text-muted-foreground">
                  <span>آخر بيانات: {d.lastData}</span>
                  <span className="font-mono" dir="ltr">{d.firmware}</span>
                </div>
              </Card>
            )
          })}
        </div>
      </div>
    </DashboardShell>
  )
}

function Row({
  icon: Icon,
  iconTone,
  label,
  children,
}: {
  icon: typeof Cpu
  iconTone: string
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-muted-foreground">
        <Icon className={`size-4 ${iconTone}`} />
        {label}
      </span>
      {children}
    </div>
  )
}
