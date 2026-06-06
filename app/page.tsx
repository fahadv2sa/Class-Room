'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/components/language-provider'
import {
  Sparkles,
  Volume2,
  ScanLine,
  ClipboardCheck,
  ShieldCheck,
  Eye,
  EyeOff,
} from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const { refreshLanguage, t } = useLanguage()
  const [show, setShow] = useState(false)
  const [email, setEmail] = useState('admin@jubail-school.edu.sa')
  const [password, setPassword] = useState('Password123!')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function login(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (!res.ok) {
        setError(t('login.error'))
        return
      }

      await refreshLanguage()
      router.push('/select-level')
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <div className="relative hidden flex-1 flex-col justify-between overflow-hidden bg-sidebar p-12 text-white lg:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '28px 28px',
          }}
        />
        <div className="absolute -left-20 top-1/3 size-80 rounded-full bg-accent/20 blur-3xl" />

        <div className="relative flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-accent text-accent-foreground shadow-lg shadow-accent/40">
            <Sparkles className="size-6" />
          </div>
          <div>
            <p className="text-lg font-extrabold">{t('common.appName')}</p>
            <p className="text-xs text-white/60">{t('common.tagline')}</p>
          </div>
        </div>

        <div className="relative max-w-md">
          <h1 className="text-balance text-4xl font-extrabold leading-tight">
            {t('login.heroTitle')}
          </h1>
          <p className="mt-4 text-pretty leading-relaxed text-white/70">
            {t('login.heroCopy')}
          </p>
          <div className="mt-8 grid grid-cols-2 gap-3">
            <Feature icon={ClipboardCheck} title={t('login.featureAttendance')} />
            <Feature icon={Volume2} title={t('login.featureNoise')} />
            <Feature icon={ScanLine} title={t('login.featureRfid')} />
            <Feature icon={ShieldCheck} title={t('login.featureDiscipline')} />
          </div>
        </div>

        <p className="relative text-xs text-white/40">{t('login.rights')}</p>
      </div>

      <div className="flex flex-1 items-center justify-center bg-background p-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex size-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
              <Sparkles className="size-5" />
            </div>
            <p className="text-lg font-extrabold">{t('common.appName')}</p>
          </div>

          <h2 className="text-2xl font-extrabold tracking-tight">
            {t('login.title')}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('login.subtitle')}
          </p>

          <form className="mt-8 space-y-4" onSubmit={login}>
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-semibold">
                {t('login.email')}
              </label>
              <Input
                id="email"
                type="email"
                dir="ltr"
                placeholder="admin@school.edu.sa"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="text-right"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-sm font-semibold">
                {t('login.password')}
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={show ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={show ? t('login.hidePassword') : t('login.showPassword')}
                >
                  {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  className="size-4 rounded border-input accent-accent"
                  defaultChecked
                />
                {t('login.remember')}
              </label>
              <button type="button" className="text-sm font-semibold text-accent hover:underline">
                {t('login.forgot')}
              </button>
            </div>

            {error && (
              <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm font-semibold text-destructive">
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="h-11 w-full bg-accent text-accent-foreground hover:bg-accent/90"
            >
              {loading ? t('login.submitting') : t('login.submit')}
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            {t('login.terms')}
          </p>
        </div>
      </div>
    </div>
  )
}

function Feature({
  icon: Icon,
  title,
}: {
  icon: typeof Volume2
  title: string
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/5 px-3 py-3 backdrop-blur-sm">
      <Icon className="size-5 text-accent" />
      <span className="text-sm font-semibold">{title}</span>
    </div>
  )
}
