'use client'

import { useEffect, useState } from 'react'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Segmented } from '@/components/ui/segmented'
import { cn } from '@/lib/utils'
import { useLevel } from '@/components/level-provider'
import { useLanguage } from '@/components/language-provider'
import type { Level } from '@/lib/mock-data'
import {
  School,
  SlidersHorizontal,
  BellRing,
  Users,
  ShieldCheck,
  Volume2,
  Save,
} from 'lucide-react'

type SettingsState = {
  language: 'AR' | 'EN'
  noiseThresholdDb: number
  studentExitLimitMinutes: number
  lateThresholdMinutes: number
  noiseAlertsEnabled: boolean
  movementAlertsEnabled: boolean
  attendanceAlertsEnabled: boolean
  deviceAlertsEnabled: boolean
  dailyReportEnabled: boolean
  schoolNameOverride: string
  contactPhone: string
}

const defaultSettings: SettingsState = {
  language: 'AR',
  noiseThresholdDb: 70,
  studentExitLimitMinutes: 10,
  lateThresholdMinutes: 10,
  noiseAlertsEnabled: true,
  movementAlertsEnabled: true,
  attendanceAlertsEnabled: true,
  deviceAlertsEnabled: true,
  dailyReportEnabled: false,
  schoolNameOverride: '',
  contactPhone: '0112345678',
}

const levelLabelKey: Record<Level, string> = {
  primary: 'level.primary',
  middle: 'level.middle',
  high: 'level.high',
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors',
        checked ? 'bg-accent' : 'bg-border',
      )}
    >
      <span
        className={cn(
          'inline-block size-5 transform rounded-full bg-white shadow transition-transform',
          checked ? 'translate-x-[-2px]' : 'translate-x-[-22px]',
        )}
      />
    </button>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-semibold">{label}</label>
      {children}
    </div>
  )
}

function ToggleRow({
  title,
  desc,
  value,
  onChange,
}: {
  title: string
  desc: string
  value: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border/60 py-3.5 last:border-0">
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      <Toggle checked={value} onChange={onChange} />
    </div>
  )
}

function SectionCard({
  icon: Icon,
  title,
  desc,
  children,
}: {
  icon: typeof School
  title: string
  desc: string
  children: React.ReactNode
}) {
  return (
    <Card className="p-6">
      <div className="mb-5 flex items-start gap-3">
        <div className="flex size-11 items-center justify-center rounded-xl bg-accent/10 text-accent">
          <Icon className="size-5" />
        </div>
        <div>
          <h3 className="text-base font-extrabold tracking-tight">{title}</h3>
          <p className="text-xs text-muted-foreground">{desc}</p>
        </div>
      </div>
      {children}
    </Card>
  )
}

export default function SettingsPage() {
  const { level, school, district } = useLevel()
  const { setLanguage, refreshLanguage, t } = useLanguage()
  const [settings, setSettings] = useState<SettingsState>(defaultSettings)
  const [schoolId, setSchoolId] = useState<string | null>(null)
  const [managerEmail, setManagerEmail] = useState('admin@kf-school.edu.sa')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadSettings() {
      setLoading(true)
      setError('')

      try {
        const schoolRes = await fetch('/api/school/current', { cache: 'no-store' })
        const schoolData = schoolRes.ok ? await schoolRes.json() : null
        const currentSchoolId = schoolData?.school?.id ?? null
        setSchoolId(currentSchoolId)

        const settingsUrl = currentSchoolId
          ? `/api/settings?schoolId=${encodeURIComponent(currentSchoolId)}`
          : '/api/settings'
        const settingsRes = await fetch(settingsUrl, { cache: 'no-store' })
        if (!settingsRes.ok) throw new Error('Unable to load settings')

        const data = await settingsRes.json()
        const loaded = data.settings
        setSettings({
          language: loaded.language === 'EN' ? 'EN' : 'AR',
          noiseThresholdDb: loaded.noiseThresholdDb,
          studentExitLimitMinutes: loaded.studentExitLimitMinutes,
          lateThresholdMinutes: loaded.lateThresholdMinutes ?? 10,
          noiseAlertsEnabled: loaded.noiseAlertsEnabled,
          movementAlertsEnabled: loaded.movementAlertsEnabled,
          attendanceAlertsEnabled: loaded.attendanceAlertsEnabled,
          deviceAlertsEnabled: loaded.deviceAlertsEnabled,
          dailyReportEnabled: loaded.dailyReportEnabled,
          schoolNameOverride: loaded.schoolNameOverride ?? '',
          contactPhone: loaded.contactPhone ?? '',
        })
        setLanguage(loaded.language === 'EN' ? 'EN' : 'AR')

        const meRes = await fetch('/api/auth/me', { cache: 'no-store' })
        if (meRes.ok) {
          const me = await meRes.json()
          if (me.user?.email) setManagerEmail(me.user.email)
        }
      } catch {
        setError('settings.loadError')
      } finally {
        setLoading(false)
      }
    }

    loadSettings()
  }, [setLanguage])

  function update<K extends keyof SettingsState>(key: K, value: SettingsState[K]) {
    setSettings((current) => ({ ...current, [key]: value }))
    setMessage('')
    setError('')
  }

  async function saveSettings() {
    setSaving(true)
    setMessage('')
    setError('')

    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schoolId,
          language: settings.language,
          noiseThresholdDb: settings.noiseThresholdDb,
          studentExitLimitMinutes: settings.studentExitLimitMinutes,
          lateThresholdMinutes: settings.lateThresholdMinutes,
          noiseAlertsEnabled: settings.noiseAlertsEnabled,
          movementAlertsEnabled: settings.movementAlertsEnabled,
          attendanceAlertsEnabled: settings.attendanceAlertsEnabled,
          deviceAlertsEnabled: settings.deviceAlertsEnabled,
          dailyReportEnabled: settings.dailyReportEnabled,
          schoolNameOverride: settings.schoolNameOverride,
          contactPhone: settings.contactPhone,
        }),
      })

      if (!res.ok) throw new Error('Unable to save settings')
      const data = await res.json()
      const savedLanguage = data.settings?.language === 'EN' ? 'EN' : 'AR'
      setLanguage(savedLanguage)
      await refreshLanguage()
      setMessage('common.saved')
    } catch {
      setError('common.saveError')
    } finally {
      setSaving(false)
    }
  }

  const title = t('settings.title')
  const subtitle = `${t('settings.subtitle')}${level ? ` · ${t(levelLabelKey[level])}` : ''}`

  return (
    <DashboardShell title={title} subtitle={subtitle}>
      <div className="space-y-6">
        {loading && (
          <Card className="p-4 text-sm font-semibold text-muted-foreground">
            {t('common.loading')}
          </Card>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <SectionCard
            icon={School}
            title={t('settings.schoolInfo')}
            desc={t('settings.schoolInfoDesc')}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t('settings.schoolName')}>
                <Input
                  value={settings.schoolNameOverride || school}
                  onChange={(e) => update('schoolNameOverride', e.target.value)}
                />
              </Field>
              <Field label={t('settings.educationOffice')}>
                <Input value={district} readOnly />
              </Field>
              <Field label={t('settings.contactPhone')}>
                <Input
                  value={settings.contactPhone}
                  onChange={(e) => update('contactPhone', e.target.value)}
                  dir="ltr"
                />
              </Field>
              <Field label={t('settings.academicYear')}>
                <Input defaultValue="1447 هـ" />
              </Field>
            </div>
          </SectionCard>

          <SectionCard
            icon={SlidersHorizontal}
            title={t('settings.thresholds')}
            desc={t('settings.thresholdsDesc')}
          >
            <div className="space-y-6">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    <Volume2 className="size-4 text-muted-foreground" />
                    {t('settings.noiseThreshold')}
                  </span>
                  <Badge variant="accent">{settings.noiseThresholdDb} dB</Badge>
                </div>
                <input
                  type="range"
                  min={40}
                  max={100}
                  value={settings.noiseThresholdDb}
                  onChange={(e) => update('noiseThresholdDb', Number(e.target.value))}
                  className="w-full accent-[var(--accent)]"
                />
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    <Users className="size-4 text-muted-foreground" />
                    {t('settings.exitLimit')}
                  </span>
                  <Badge variant="accent">
                    {settings.studentExitLimitMinutes} {t('settings.minutes')}
                  </Badge>
                </div>
                <input
                  type="range"
                  min={5}
                  max={30}
                  value={settings.studentExitLimitMinutes}
                  onChange={(e) => update('studentExitLimitMinutes', Number(e.target.value))}
                  className="w-full accent-[var(--accent)]"
                />
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    <Users className="size-4 text-muted-foreground" />
                    {t('settings.lateThreshold')}
                  </span>
                  <Badge variant="accent">
                    {settings.lateThresholdMinutes} {t('settings.minutes')}
                  </Badge>
                </div>
                <input
                  type="range"
                  min={0}
                  max={60}
                  value={settings.lateThresholdMinutes}
                  onChange={(e) => update('lateThresholdMinutes', Number(e.target.value))}
                  className="w-full accent-[var(--accent)]"
                />
              </div>
            </div>
          </SectionCard>

          <SectionCard
            icon={BellRing}
            title={t('settings.notifications')}
            desc={t('settings.notificationsDesc')}
          >
            <div>
              <ToggleRow
                title={t('settings.noiseAlerts')}
                desc={t('settings.noiseAlertsDesc')}
                value={settings.noiseAlertsEnabled}
                onChange={(v) => update('noiseAlertsEnabled', v)}
              />
              <ToggleRow
                title={t('settings.movementAlerts')}
                desc={t('settings.movementAlertsDesc')}
                value={settings.movementAlertsEnabled}
                onChange={(v) => update('movementAlertsEnabled', v)}
              />
              <ToggleRow
                title={t('settings.attendanceAlerts')}
                desc={t('settings.attendanceAlertsDesc')}
                value={settings.attendanceAlertsEnabled}
                onChange={(v) => update('attendanceAlertsEnabled', v)}
              />
              <ToggleRow
                title={t('settings.deviceAlerts')}
                desc={t('settings.deviceAlertsDesc')}
                value={settings.deviceAlertsEnabled}
                onChange={(v) => update('deviceAlertsEnabled', v)}
              />
              <ToggleRow
                title={t('settings.dailyReport')}
                desc={t('settings.dailyReportDesc')}
                value={settings.dailyReportEnabled}
                onChange={(v) => update('dailyReportEnabled', v)}
              />
            </div>
          </SectionCard>

          <SectionCard
            icon={ShieldCheck}
            title={t('settings.permissions')}
            desc={t('settings.permissionsDesc')}
          >
            <div className="space-y-5">
              <Field label={t('settings.interfaceLanguage')}>
                <Segmented
                  options={[
                    { value: 'AR', label: 'العربية' },
                    { value: 'EN', label: 'English' },
                  ]}
                  value={settings.language}
                  onChange={(value) => {
                    update('language', value)
                    setLanguage(value)
                  }}
                />
              </Field>
              <Field label={t('settings.managerEmail')}>
                <Input value={managerEmail} readOnly dir="ltr" />
              </Field>
              <div className="rounded-xl bg-muted/50 p-4">
                <p className="text-sm font-semibold">{t('settings.permissionLevel')}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t('settings.permissionCopy')}
                </p>
                <Badge variant="success" className="mt-2">
                  {t('settings.roleSchoolAdmin')}
                </Badge>
              </div>
            </div>
          </SectionCard>
        </div>

        {(message || error) && (
          <Card
            className={cn(
              'p-4 text-sm font-semibold',
              error ? 'text-destructive' : 'text-success',
            )}
          >
            {error ? t(error) : t(message)}
          </Card>
        )}

        <div className="flex justify-end">
          <Button
            onClick={saveSettings}
            disabled={saving || loading}
            className="bg-accent text-accent-foreground hover:bg-accent/90"
          >
            <Save className="size-4" />
            {saving ? t('common.saving') : t('common.save')}
          </Button>
        </div>
      </div>
    </DashboardShell>
  )
}
