'use client'

import { useEffect, useMemo, useState } from 'react'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { StatCard } from '@/components/stat-card'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Segmented } from '@/components/ui/segmented'
import { useLevel } from '@/components/level-provider'
import { levelMap } from '@/lib/levels'
import { useLanguage } from '@/components/language-provider'
import { withLevel } from '@/lib/i18n/ui'
import {
  Cpu,
  Wifi,
  WifiOff,
  Volume2,
  ScanLine,
  CircleCheck,
  CircleAlert,
  CircleX,
} from 'lucide-react'

type ClassroomDevice = {
  id: string
  deviceCode: string
  serialNumber: string
  firmwareVersion: string
  hardwareVersion: string
  status: 'ACTIVE' | 'MAINTENANCE' | 'RETIRED'
  connectionStatus: 'ONLINE' | 'OFFLINE' | 'UNKNOWN'
  capabilities: string[]
  lastSeenAt: string | null
  classroom: {
    id: string
    classroomCode: string
    classroomName: string
  }
}

const connectionMeta: Record<
  ClassroomDevice['connectionStatus'],
  { icon: typeof Wifi; badge: 'success' | 'danger' | 'outline'; labelKey: string; color: string }
> = {
  ONLINE: { icon: Wifi, badge: 'success', labelKey: 'classrooms.online', color: '#22c55e' },
  OFFLINE: { icon: WifiOff, badge: 'danger', labelKey: 'classrooms.offline', color: '#ef4444' },
  UNKNOWN: { icon: CircleAlert, badge: 'outline', labelKey: 'devices.unknown', color: '#f59e0b' },
}

const statusMeta: Record<
  ClassroomDevice['status'],
  { icon: typeof CircleCheck; tone: string; labelKey: string }
> = {
  ACTIVE: { icon: CircleCheck, tone: 'text-success', labelKey: 'devices.active' },
  MAINTENANCE: { icon: CircleAlert, tone: 'text-[#b45309]', labelKey: 'devices.maintenance' },
  RETIRED: { icon: CircleX, tone: 'text-muted-foreground', labelKey: 'devices.retired' },
}

const filters = [
  { value: 'all', labelKey: 'common.all' },
  { value: 'ONLINE', labelKey: 'classrooms.online' },
  { value: 'OFFLINE', labelKey: 'classrooms.offline' },
  { value: 'UNKNOWN', labelKey: 'devices.unknown' },
]

export default function DevicesPage() {
  const { level } = useLevel()
  const [filter, setFilter] = useState('all')
  const [devices, setDevices] = useState<ClassroomDevice[]>([])
  const [loading, setLoading] = useState(true)
  const { t } = useLanguage()

  const lvl = level ? levelMap[level] : null

  useEffect(() => {
    let active = true

    async function loadDevices() {
      try {
        setLoading(true)
        const res = await fetch('/api/classroom-devices?pageSize=100', { cache: 'no-store' })
        if (!res.ok) throw new Error('Could not load devices')
        const data = await res.json()
        if (active) setDevices(data.devices ?? [])
      } catch {
        if (active) setDevices([])
      } finally {
        if (active) setLoading(false)
      }
    }

    loadDevices()
    return () => {
      active = false
    }
  }, [])

  const scopedDevices = useMemo(() => {
    if (!level || !lvl) return []
    return devices.filter((device) => device.classroom.classroomCode.startsWith(lvl.code))
  }, [devices, level, lvl])

  const list = scopedDevices.filter((d) =>
    filter === 'all' ? true : d.connectionStatus === filter,
  )
  const online = scopedDevices.filter((d) => d.connectionStatus === 'ONLINE').length
  const offline = scopedDevices.filter((d) => d.connectionStatus === 'OFFLINE').length
  const maintenance = scopedDevices.filter((d) => d.status === 'MAINTENANCE').length

  if (!level || !lvl) return null

  return (
    <DashboardShell
      title={t('devices.title')}
      subtitle={withLevel('devices.subtitle', level, t)}
    >
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label={t('devices.total')} value={scopedDevices.length} icon={Cpu} tone="accent" />
          <StatCard label={t('devices.onlineNow')} value={online} unit={`/ ${scopedDevices.length}`} icon={Wifi} tone="success" />
          <StatCard label={t('devices.offlineNow')} value={offline} icon={WifiOff} tone="danger" />
          <StatCard label={t('devices.needsMaintenance')} value={maintenance} icon={CircleAlert} tone="warning" />
        </div>

        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold tracking-tight">{t('devices.list')}</h2>
          <Segmented options={filters.map((f) => ({ value: f.value, label: t(f.labelKey) }))} value={filter} onChange={setFilter} />
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {loading && (
            <Card className="p-5 text-sm font-semibold text-muted-foreground">
              {t('common.loading')}
            </Card>
          )}
          {!loading && list.length === 0 && (
            <Card className="p-5 text-sm font-semibold text-muted-foreground">
              {t('devices.empty')}
            </Card>
          )}
          {list.map((d) => {
            const connection = connectionMeta[d.connectionStatus]
            const status = statusMeta[d.status]
            const ConnectionIcon = connection.icon
            const StatusIcon = status.icon
            return (
              <Card
                key={d.id}
                className="p-5"
                style={{
                  boxShadow: `inset 4px 0 0 ${connection.color}`,
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex size-11 items-center justify-center rounded-xl bg-muted">
                      <Cpu className="size-5 text-foreground" />
                    </div>
                    <div className="leading-tight">
                      <p className="font-extrabold">{d.classroom.classroomCode}</p>
                      <p className="font-mono text-[11px] text-muted-foreground" dir="ltr">
                        {d.deviceCode}
                      </p>
                    </div>
                  </div>
                  <Badge variant={connection.badge}>
                    <ConnectionIcon className="size-3" /> {t(connection.labelKey)}
                  </Badge>
                </div>

                <div className="mt-4 space-y-2.5 text-sm">
                  <Row
                    icon={StatusIcon}
                    iconTone={status.tone}
                    label={t('common.status')}
                  >
                    <span className={`flex items-center gap-1 font-semibold ${status.tone}`}>
                      {t(status.labelKey)}
                    </span>
                  </Row>
                  <Row icon={ScanLine} iconTone="text-muted-foreground" label={t('devices.serialNumber')}>
                    <span className="font-mono text-xs font-semibold" dir="ltr">{d.serialNumber}</span>
                  </Row>
                  <Row icon={Volume2} iconTone="text-muted-foreground" label={t('devices.capabilities')}>
                    <span className="max-w-[9rem] truncate text-end font-semibold">
                      {d.capabilities.map((capability) => t(`devices.capability.${capability}`)).join(' / ')}
                    </span>
                  </Row>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3 text-xs text-muted-foreground">
                  <span>{t('devices.lastSeen')}: {formatDate(d.lastSeenAt, t('devices.notSeen'))}</span>
                  <span className="font-mono" dir="ltr">{d.firmwareVersion} / {d.hardwareVersion}</span>
                </div>
              </Card>
            )
          })}
        </div>
      </div>
    </DashboardShell>
  )
}

function formatDate(value: string | null, fallback: string) {
  if (!value) return fallback
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
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
