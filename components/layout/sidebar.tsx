'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  School,
  ClipboardCheck,
  Footprints,
  Volume2,
  Users,
  GraduationCap,
  FileBarChart,
  Bell,
  Brain,
  MessageSquare,
  Cpu,
  Settings,
  Sparkles,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLevel } from '@/components/level-provider'
import { useLanguage } from '@/components/language-provider'
import { levelShortKey } from '@/lib/i18n/ui'

const nav = [
  { href: '/dashboard', labelKey: 'sidebar.dashboard', icon: LayoutDashboard },
  { href: '/classrooms', labelKey: 'sidebar.classrooms', icon: School },
  { href: '/attendance', labelKey: 'sidebar.attendance', icon: ClipboardCheck },
  { href: '/movement', labelKey: 'sidebar.movement', icon: Footprints },
  { href: '/noise', labelKey: 'sidebar.noise', icon: Volume2 },
  { href: '/teachers', labelKey: 'sidebar.teachers', icon: Users },
  { href: '/students', labelKey: 'sidebar.students', icon: GraduationCap },
  { href: '/reports', labelKey: 'sidebar.reports', icon: FileBarChart },
  { href: '/alerts', labelKey: 'sidebar.alerts', icon: Bell },
  { href: '/ai', labelKey: 'sidebar.ai', icon: Brain },
  { href: '/communication', labelKey: 'sidebar.communication', icon: MessageSquare },
  { href: '/devices', labelKey: 'sidebar.devices', icon: Cpu },
  { href: '/settings', labelKey: 'sidebar.settings', icon: Settings },
]

export function Sidebar({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const pathname = usePathname()
  const { level, school } = useLevel()
  const { t } = useLanguage()

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}
      <aside
        className={cn(
          'fixed inset-y-0 right-0 z-50 flex w-72 flex-col bg-sidebar text-sidebar-foreground transition-transform duration-300 lg:static lg:translate-x-0',
          open ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        <div className="flex items-center justify-between gap-3 px-5 py-5">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-accent text-accent-foreground shadow-lg shadow-accent/30">
              <Sparkles className="size-5" />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-extrabold text-white">{t('common.appName')}</p>
              <p className="text-[11px] text-sidebar-foreground/70">
                {t('common.tagline')}
              </p>
            </div>
          </Link>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-sidebar-foreground/70 hover:bg-sidebar-accent lg:hidden"
            aria-label={t('common.closeMenu')}
          >
            <X className="size-5" />
          </button>
        </div>

        <nav className="scrollbar-thin flex-1 space-y-1 overflow-y-auto px-3 py-2">
          {nav.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(item.href + '/')
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors',
                  active
                    ? 'bg-accent text-accent-foreground shadow-lg shadow-accent/25'
                    : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-white',
                )}
              >
                <Icon className="size-[18px] shrink-0" />
                <span>{t(item.labelKey)}</span>
              </Link>
            )
          })}
        </nav>

        <div className="m-3 rounded-2xl bg-sidebar-accent/60 p-4">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-full bg-accent/20 text-sm font-bold text-accent">
              م
            </div>
            <div className="leading-tight">
              <p className="text-sm font-bold text-white">{t('common.schoolPrincipal')}</p>
              <p className="text-[11px] text-sidebar-foreground/70">
                {school}
                {level ? ` · ${t(levelShortKey[level])}` : ''}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
