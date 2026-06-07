'use client'

import { noiseStatus, noiseStatusMeta } from '@/lib/levels'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/components/language-provider'
import { noiseStatusKey } from '@/lib/i18n/ui'

export function NoiseMeter({
  value,
  size = 'md',
}: {
  value: number
  size?: 'sm' | 'md' | 'lg'
}) {
  const status = noiseStatus(value)
  const meta = noiseStatusMeta[status]
  const { t } = useLanguage()
  const pct = Math.min(value, 100)

  const dims = {
    sm: { box: 'size-20', stroke: 6, font: 'text-lg' },
    md: { box: 'size-28', stroke: 8, font: 'text-2xl' },
    lg: { box: 'size-40', stroke: 10, font: 'text-4xl' },
  }[size]

  const r = 50 - dims.stroke
  const circ = 2 * Math.PI * r
  const offset = circ - (pct / 100) * circ

  return (
    <div className={cn('relative', dims.box)}>
      <svg viewBox="0 0 100 100" className="size-full -rotate-90">
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke="var(--border)"
          strokeWidth={dims.stroke}
        />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke={meta.color}
          strokeWidth={dims.stroke}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn('font-extrabold tabular-nums', dims.font)}>
          {value}
        </span>
        <span
          className="text-[11px] font-bold"
          style={{ color: meta.color }}
        >
          {t(noiseStatusKey[status])}
        </span>
      </div>
    </div>
  )
}

export function NoiseDot({ value }: { value: number }) {
  const status = noiseStatus(value)
  const meta = noiseStatusMeta[status]
  const { t } = useLanguage()
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="size-2.5 rounded-full"
        style={{ backgroundColor: meta.color }}
      />
      <span className="text-xs font-semibold" style={{ color: meta.color }}>
        {t(noiseStatusKey[status])}
      </span>
    </span>
  )
}
