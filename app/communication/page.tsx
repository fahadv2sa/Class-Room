'use client'

import { useEffect, useState } from 'react'
import { Bell, CheckCircle2, FileText, Mail, MessageSquare, Save, Send } from 'lucide-react'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { useLanguage } from '@/components/language-provider'
import { useLevel } from '@/components/level-provider'
import { StatCard } from '@/components/stat-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { withLevel } from '@/lib/i18n/ui'

type NotificationRecord = {
  id: string
  notificationType: 'ALERT' | 'INSIGHT' | 'REPORT'
  notificationChannel: 'DASHBOARD' | 'EMAIL' | 'WHATSAPP'
  title: string
  message: string
  status: 'PENDING' | 'READY' | 'SENT' | 'FAILED' | 'CANCELLED'
  createdAt: string
}

type ReportDefinitionRecord = {
  id: string
  reportType: 'DAILY_SUMMARY' | 'WEEKLY_SUMMARY' | 'MONTHLY_SUMMARY'
  name: string
  description: string
  period: string
  dataSources: string[]
  exportDefinitions: Array<{ id: string; format: 'PDF' | 'EXCEL'; name: string; isActive: boolean }>
}

type DeliveryPreferences = {
  dashboardNotificationsEnabled: boolean
  emailNotificationsEnabled: boolean
  whatsappNotificationsEnabled: boolean
}

const defaultPreferences: DeliveryPreferences = {
  dashboardNotificationsEnabled: true,
  emailNotificationsEnabled: false,
  whatsappNotificationsEnabled: false,
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean
  onChange: (value: boolean) => void
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

function PreferenceRow({
  title,
  desc,
  checked,
  onChange,
}: {
  title: string
  desc: string
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border/60 py-3.5 last:border-0">
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  )
}

export default function CommunicationPage() {
  const { level } = useLevel()
  const { t } = useLanguage()
  const [notifications, setNotifications] = useState<NotificationRecord[]>([])
  const [reports, setReports] = useState<ReportDefinitionRecord[]>([])
  const [preferences, setPreferences] = useState(defaultPreferences)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    let active = true

    async function loadCommunication() {
      setLoading(true)
      const [notificationsResponse, preferencesResponse, reportsResponse] = await Promise.all([
        fetch('/api/notifications?pageSize=50', { cache: 'no-store' }),
        fetch('/api/delivery-preferences', { cache: 'no-store' }),
        fetch('/api/reports?pageSize=20', { cache: 'no-store' }),
      ])
      const [notificationsData, preferencesData, reportsData] = await Promise.all([
        notificationsResponse.ok ? notificationsResponse.json() : Promise.resolve({ notifications: [] }),
        preferencesResponse.ok ? preferencesResponse.json() : Promise.resolve({ preferences: defaultPreferences }),
        reportsResponse.ok ? reportsResponse.json() : Promise.resolve({ reports: [] }),
      ])
      if (!active) return
      setNotifications(notificationsData.notifications ?? [])
      setPreferences({
        dashboardNotificationsEnabled: preferencesData.preferences?.dashboardNotificationsEnabled ?? true,
        emailNotificationsEnabled: preferencesData.preferences?.emailNotificationsEnabled ?? false,
        whatsappNotificationsEnabled: preferencesData.preferences?.whatsappNotificationsEnabled ?? false,
      })
      setReports(reportsData.reports ?? [])
      setLoading(false)
    }

    loadCommunication().catch(() => {
      if (!active) return
      setNotifications([])
      setReports([])
      setPreferences(defaultPreferences)
      setLoading(false)
    })

    return () => {
      active = false
    }
  }, [])

  function updatePreference<K extends keyof DeliveryPreferences>(key: K, value: DeliveryPreferences[K]) {
    setPreferences((current) => ({ ...current, [key]: value }))
    setMessage('')
  }

  async function savePreferences() {
    setSaving(true)
    setMessage('')
    try {
      const response = await fetch('/api/delivery-preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences),
      })
      if (!response.ok) throw new Error('Unable to save delivery preferences')
      const data = await response.json()
      setPreferences({
        dashboardNotificationsEnabled: data.preferences?.dashboardNotificationsEnabled ?? true,
        emailNotificationsEnabled: data.preferences?.emailNotificationsEnabled ?? false,
        whatsappNotificationsEnabled: data.preferences?.whatsappNotificationsEnabled ?? false,
      })
      setMessage('common.saved')
    } catch {
      setMessage('common.saveError')
    } finally {
      setSaving(false)
    }
  }

  if (!level) return null

  const pending = notifications.filter((notification) => notification.status === 'PENDING')
  const history = notifications.filter((notification) => notification.status !== 'PENDING')
  const enabledChannels = [
    preferences.dashboardNotificationsEnabled,
    preferences.emailNotificationsEnabled,
    preferences.whatsappNotificationsEnabled,
  ].filter(Boolean).length

  return (
    <DashboardShell title={t('communication.title')} subtitle={withLevel('communication.subtitle', level, t)}>
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          <StatCard label={t('communication.pending')} value={pending.length} icon={Bell} tone="warning" />
          <StatCard label={t('communication.history')} value={history.length} icon={CheckCircle2} tone="success" />
          <StatCard label={t('communication.reports')} value={reports.length} icon={FileText} tone="accent" />
          <StatCard label={t('communication.channelsEnabled')} value={enabledChannels} icon={Send} tone="success" />
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-6">
            <NotificationList
              title={t('communication.pendingNotifications')}
              empty={t('communication.emptyPending')}
              notifications={pending}
              t={t}
            />
            <NotificationList
              title={t('communication.notificationHistory')}
              empty={t('communication.emptyHistory')}
              notifications={history}
              t={t}
            />
          </div>

          <div className="space-y-6">
            <Card className="p-5">
              <div className="mb-3 flex items-center gap-2">
                <MessageSquare className="size-4 text-muted-foreground" />
                <h3 className="text-sm font-extrabold tracking-tight">{t('communication.preferences')}</h3>
              </div>
              <PreferenceRow
                title={t('communication.dashboardNotifications')}
                desc={t('communication.dashboardNotificationsDesc')}
                checked={preferences.dashboardNotificationsEnabled}
                onChange={(value) => updatePreference('dashboardNotificationsEnabled', value)}
              />
              <PreferenceRow
                title={t('communication.emailNotifications')}
                desc={t('communication.emailNotificationsDesc')}
                checked={preferences.emailNotificationsEnabled}
                onChange={(value) => updatePreference('emailNotificationsEnabled', value)}
              />
              <PreferenceRow
                title={t('communication.whatsappNotifications')}
                desc={t('communication.whatsappNotificationsDesc')}
                checked={preferences.whatsappNotificationsEnabled}
                onChange={(value) => updatePreference('whatsappNotificationsEnabled', value)}
              />
              <div className="mt-4 flex items-center justify-between gap-3">
                <p className="text-xs font-semibold text-muted-foreground">
                  {message ? t(message) : t('communication.preferencesNote')}
                </p>
                <Button size="sm" onClick={savePreferences} disabled={saving || loading}>
                  <Save className="size-4" />
                  {saving ? t('common.saving') : t('common.save')}
                </Button>
              </div>
            </Card>

            <Card className="p-5">
              <div className="mb-4 flex items-center gap-2">
                <FileText className="size-4 text-muted-foreground" />
                <h3 className="text-sm font-extrabold tracking-tight">{t('communication.reportDefinitions')}</h3>
              </div>
              <div className="space-y-3">
                {reports.length === 0 && (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    {loading ? t('common.loading') : t('communication.emptyReports')}
                  </p>
                )}
                {reports.map((report) => (
                  <div key={report.id} className="rounded-lg border border-border/60 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold">{report.name}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{report.description}</p>
                      </div>
                      <Badge variant="accent">{t(`communication.period.${report.period}`)}</Badge>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {report.exportDefinitions.map((definition) => (
                        <Badge key={definition.id} variant="default">
                          {definition.format}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </DashboardShell>
  )
}

function NotificationList({
  title,
  empty,
  notifications,
  t,
}: {
  title: string
  empty: string
  notifications: NotificationRecord[]
  t: (key: string) => string
}) {
  return (
    <Card className="p-0">
      <div className="border-b border-border/60 p-5">
        <h3 className="text-base font-extrabold tracking-tight">{title}</h3>
      </div>
      <div className="divide-y divide-border/60">
        {notifications.length === 0 && (
          <p className="py-14 text-center text-sm text-muted-foreground">{empty}</p>
        )}
        {notifications.map((notification) => (
          <div key={notification.id} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
              {notification.notificationChannel === 'EMAIL' ? (
                <Mail className="size-5" />
              ) : notification.notificationChannel === 'WHATSAPP' ? (
                <MessageSquare className="size-5" />
              ) : (
                <Bell className="size-5" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-bold">{notification.title}</p>
                <Badge variant="default">{t(`communication.type.${notification.notificationType}`)}</Badge>
                <Badge variant={notification.status === 'FAILED' ? 'danger' : notification.status === 'SENT' ? 'success' : 'warning'}>
                  {t(`communication.status.${notification.status}`)}
                </Badge>
              </div>
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{notification.message}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {t(`communication.channel.${notification.notificationChannel}`)} · {new Date(notification.createdAt).toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
