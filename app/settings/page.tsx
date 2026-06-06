'use client'

import { useState } from 'react'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Segmented } from '@/components/ui/segmented'
import { cn } from '@/lib/utils'
import { useLevel } from '@/components/level-provider'
import { levelMap } from '@/lib/mock-data'
import {
  School,
  SlidersHorizontal,
  BellRing,
  Users,
  ShieldCheck,
  Volume2,
  Save,
} from 'lucide-react'

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
  const [noiseThreshold, setNoiseThreshold] = useState(70)
  const [exitLimit, setExitLimit] = useState(10)
  const [notif, setNotif] = useState({
    noise: true,
    movement: true,
    attendance: true,
    devices: true,
    daily: false,
  })
  const [lang, setLang] = useState('ar')

  return (
    <DashboardShell
      title="الإعدادات"
      subtitle={`ضبط إعدادات المنصة${level ? ` · ${levelMap[level].ar}` : ''}`}
    >
      <div className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <SectionCard
            icon={School}
            title="معلومات المدرسة"
            desc="البيانات الأساسية للمنشأة التعليمية"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="اسم المدرسة">
                <Input defaultValue={school} />
              </Field>
              <Field label="إدارة التعليم">
                <Input defaultValue={district} />
              </Field>
              <Field label="رقم التواصل">
                <Input defaultValue="0112345678" dir="ltr" />
              </Field>
              <Field label="العام الدراسي">
                <Input defaultValue="1447 هـ" />
              </Field>
            </div>
          </SectionCard>

          <SectionCard
            icon={SlidersHorizontal}
            title="حدود التنبيهات الذكية"
            desc="ضبط العتبات التي تطلق التنبيهات تلقائياً"
          >
            <div className="space-y-6">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    <Volume2 className="size-4 text-muted-foreground" />
                    الحد الأقصى للضوضاء
                  </span>
                  <Badge variant="accent">{noiseThreshold} dB</Badge>
                </div>
                <input
                  type="range"
                  min={40}
                  max={100}
                  value={noiseThreshold}
                  onChange={(e) => setNoiseThreshold(Number(e.target.value))}
                  className="w-full accent-[var(--accent)]"
                />
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    <Users className="size-4 text-muted-foreground" />
                    أقصى مدة خروج للطالب
                  </span>
                  <Badge variant="accent">{exitLimit} دقيقة</Badge>
                </div>
                <input
                  type="range"
                  min={5}
                  max={30}
                  value={exitLimit}
                  onChange={(e) => setExitLimit(Number(e.target.value))}
                  className="w-full accent-[var(--accent)]"
                />
              </div>
            </div>
          </SectionCard>

          <SectionCard
            icon={BellRing}
            title="إعدادات الإشعارات"
            desc="تحكم بأنواع التنبيهات التي تصلك"
          >
            <div>
              <ToggleRow
                title="تنبيهات الضوضاء"
                desc="إشعار عند تجاوز الحد المسموح"
                value={notif.noise}
                onChange={(v) => setNotif((p) => ({ ...p, noise: v }))}
              />
              <ToggleRow
                title="تنبيهات حركة الطلاب"
                desc="إشعار عند الخروج الطويل أو المتكرر"
                value={notif.movement}
                onChange={(v) => setNotif((p) => ({ ...p, movement: v }))}
              />
              <ToggleRow
                title="تنبيهات الحضور"
                desc="إشعار عند الغياب أو التأخر"
                value={notif.attendance}
                onChange={(v) => setNotif((p) => ({ ...p, attendance: v }))}
              />
              <ToggleRow
                title="تنبيهات الأجهزة"
                desc="إشعار عند انقطاع الاتصال أو الأعطال"
                value={notif.devices}
                onChange={(v) => setNotif((p) => ({ ...p, devices: v }))}
              />
              <ToggleRow
                title="التقرير اليومي"
                desc="ملخص يومي عبر البريد الإلكتروني"
                value={notif.daily}
                onChange={(v) => setNotif((p) => ({ ...p, daily: v }))}
              />
            </div>
          </SectionCard>

          <SectionCard
            icon={ShieldCheck}
            title="الصلاحيات والتفضيلات"
            desc="إعدادات الحساب واللغة والصلاحيات"
          >
            <div className="space-y-5">
              <Field label="لغة الواجهة">
                <Segmented
                  options={[
                    { value: 'ar', label: 'العربية' },
                    { value: 'en', label: 'English' },
                  ]}
                  value={lang}
                  onChange={setLang}
                />
              </Field>
              <Field label="البريد الإلكتروني للمدير">
                <Input defaultValue="admin@kf-school.edu.sa" dir="ltr" />
              </Field>
              <div className="rounded-xl bg-muted/50 p-4">
                <p className="text-sm font-semibold">مستوى الصلاحية</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  لديك صلاحية مدير المدرسة — وصول كامل لجميع الفصول والتقارير.
                </p>
                <Badge variant="success" className="mt-2">
                  مدير المدرسة
                </Badge>
              </div>
            </div>
          </SectionCard>
        </div>

        <div className="flex justify-end">
          <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
            <Save className="size-4" /> حفظ التغييرات
          </Button>
        </div>
      </div>
    </DashboardShell>
  )
}
