'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
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
        setError('تعذر تسجيل الدخول. تحقق من البريد وكلمة المرور.')
        return
      }

      router.push('/select-level')
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* Branding panel */}
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
            <p className="text-lg font-extrabold">ClassPulse AI</p>
            <p className="text-xs text-white/60">منصة إدارة الفصول الذكية</p>
          </div>
        </div>

        <div className="relative max-w-md">
          <h1 className="text-balance text-4xl font-extrabold leading-tight">
            منصة ذكية لإدارة الفصول والانضباط المدرسي
          </h1>
          <p className="mt-4 text-pretty leading-relaxed text-white/70">
            حضور إلكتروني، مراقبة لمستوى الضوضاء، وتتبّع دقيق لحركة الطلاب —
            كل ذلك في لوحة تحكم واحدة مصممة لقادة المدارس.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-3">
            <Feature icon={ClipboardCheck} title="حضور إلكتروني" />
            <Feature icon={Volume2} title="مراقبة الضوضاء" />
            <Feature icon={ScanLine} title="بطاقات RFID" />
            <Feature icon={ShieldCheck} title="انضباط وتقارير" />
          </div>
        </div>

        <p className="relative text-xs text-white/40">
          © 2026 ClassPulse AI — جميع الحقوق محفوظة
        </p>
      </div>

      {/* Form */}
      <div className="flex flex-1 items-center justify-center bg-background p-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex size-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
              <Sparkles className="size-5" />
            </div>
            <p className="text-lg font-extrabold">ClassPulse AI</p>
          </div>

          <h2 className="text-2xl font-extrabold tracking-tight">
            تسجيل الدخول
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            مرحباً بعودتك، الرجاء إدخال بياناتك للمتابعة.
          </p>

          <form
            className="mt-8 space-y-4"
            onSubmit={login}
          >
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-semibold">
                البريد الإلكتروني
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
                كلمة المرور
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
                  aria-label={show ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
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
                تذكرني
              </label>
              <button type="button" className="text-sm font-semibold text-accent hover:underline">
                نسيت كلمة المرور؟
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
              {loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            بالدخول فإنك توافق على سياسة الاستخدام الخاصة بالمدرسة.
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
