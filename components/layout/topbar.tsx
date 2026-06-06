'use client'

import { useState, useRef, useEffect } from 'react'
import { Menu, Search, Bell, ChevronDown, Check, Building2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { useLevel } from '@/components/level-provider'
import { levels, levelMap, getAlerts } from '@/lib/mock-data'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/components/language-provider'
import { levelNameKey, levelShortKey } from '@/lib/i18n/ui'

export function Topbar({
  title,
  subtitle,
  onMenu,
}: {
  title: string
  subtitle?: string
  onMenu: () => void
}) {
  const { level, setLevel, school } = useLevel()
  const { t } = useLanguage()
  const [menuOpen, setMenuOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const current = level ? levelMap[level] : null
  const activeAlerts = level ? getAlerts(level).filter((a) => !a.resolved).length : 0

  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border/70 bg-background/80 px-4 py-3 backdrop-blur-xl md:px-6">
      <button
        onClick={onMenu}
        className="rounded-xl p-2 text-muted-foreground hover:bg-muted lg:hidden"
        aria-label={t('common.openMenu')}
      >
        <Menu className="size-5" />
      </button>

      <div className="min-w-0 flex-1">
        <h1 className="truncate text-lg font-extrabold tracking-tight md:text-xl">
          {title}
        </h1>
        {subtitle && (
          <p className="truncate text-xs text-muted-foreground md:text-sm">
            {subtitle}
          </p>
        )}
      </div>

      <div className="relative hidden lg:block">
        <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder={t('common.quickSearch')} className="w-56 pr-9 xl:w-64" aria-label={t('common.search')} />
      </div>

      {/* Level switcher */}
      <div className="relative" ref={ref}>
        <button
          onClick={() => setMenuOpen((o) => !o)}
          className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm font-semibold transition-colors hover:bg-muted"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
        >
          <span className="flex size-6 items-center justify-center rounded-md bg-accent/15 font-mono text-xs font-bold text-accent">
            {current?.code}
          </span>
          <span className="hidden sm:inline">{level ? t(levelShortKey[level]) : current?.short}</span>
          <ChevronDown className="size-4 text-muted-foreground" />
        </button>

        {menuOpen && (
          <div
            role="menu"
            className="absolute left-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-border bg-card p-1.5 shadow-xl"
          >
            <div className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground">
              <Building2 className="size-3.5" />
              <span className="truncate">{school}</span>
            </div>
            <div className="my-1 h-px bg-border" />
            {levels.map((l) => {
              const isActive = l.id === level
              return (
                <button
                  key={l.id}
                  role="menuitemradio"
                  aria-checked={isActive}
                  onClick={() => {
                    setLevel(l.id)
                    setMenuOpen(false)
                  }}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-right text-sm transition-colors',
                    isActive ? 'bg-accent/10 text-foreground' : 'hover:bg-muted',
                  )}
                >
                  <span
                    className={cn(
                      'flex size-7 items-center justify-center rounded-lg font-mono text-xs font-bold',
                      isActive
                        ? 'bg-accent text-accent-foreground'
                        : 'bg-muted text-muted-foreground',
                    )}
                  >
                    {l.code}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold leading-tight">{t(levelNameKey[l.id])}</p>
                    <p className="text-[11px] text-muted-foreground" dir="ltr">
                      {l.en}
                    </p>
                  </div>
                  {isActive && <Check className="size-4 text-accent" />}
                </button>
              )
            })}
          </div>
        )}
      </div>

      <Link
        href="/alerts"
        className="relative rounded-xl border border-border bg-card p-2.5 text-muted-foreground transition-colors hover:text-foreground"
        aria-label={t('sidebar.alerts')}
      >
        <Bell className="size-5" />
        {activeAlerts > 0 && (
          <span className="absolute -left-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">
            {activeAlerts}
          </span>
        )}
      </Link>
    </header>
  )
}
