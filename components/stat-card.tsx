import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'

export function StatCard({
  label,
  value,
  unit,
  icon: Icon,
  trend,
  tone = 'accent',
}: {
  label: string
  value: string | number
  unit?: string
  icon: LucideIcon
  trend?: { value: string; up: boolean; good?: boolean }
  tone?: 'accent' | 'success' | 'warning' | 'danger'
}) {
  const toneBg: Record<string, string> = {
    accent: 'bg-accent/10 text-accent',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-[#b45309]',
    danger: 'bg-destructive/10 text-destructive',
  }

  return (
    <Card className="p-5 transition-all hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold tracking-tight tabular-nums">
              {value}
            </span>
            {unit && (
              <span className="text-sm font-medium text-muted-foreground">
                {unit}
              </span>
            )}
          </div>
        </div>
        <div
          className={cn(
            'flex size-11 shrink-0 items-center justify-center rounded-xl',
            toneBg[tone],
          )}
        >
          <Icon className="size-5" />
        </div>
      </div>
      {trend && (
        <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold">
          <span
            className={cn(
              'inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5',
              trend.good ?? trend.up
                ? 'bg-success/10 text-success'
                : 'bg-destructive/10 text-destructive',
            )}
          >
            {trend.up ? (
              <ArrowUpRight className="size-3" />
            ) : (
              <ArrowDownRight className="size-3" />
            )}
            {trend.value}
          </span>
          <span className="text-muted-foreground">عن الأسبوع الماضي</span>
        </div>
      )}
    </Card>
  )
}
