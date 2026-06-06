import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import {
  TrendingUp,
  AlertTriangle,
  Clock,
  Award,
  Sparkles,
} from 'lucide-react'

type Insight = { id: string; type: string; title: string; text: string }

const meta: Record<
  string,
  { icon: typeof TrendingUp; chip: string; ring: string }
> = {
  trend: { icon: TrendingUp, chip: 'bg-warning/10 text-[#b45309]', ring: 'border-warning/30' },
  risk: { icon: AlertTriangle, chip: 'bg-destructive/10 text-destructive', ring: 'border-destructive/30' },
  pattern: { icon: Clock, chip: 'bg-accent/10 text-accent', ring: 'border-accent/30' },
  opportunity: { icon: Award, chip: 'bg-success/10 text-success', ring: 'border-success/30' },
}

export function AIInsights({ insights }: { insights: Insight[] }) {
  return (
    <Card className="overflow-hidden border-accent/20 bg-gradient-to-bl from-accent/[0.04] to-transparent">
      <div className="flex items-center gap-3 border-b border-border/60 p-5">
        <div className="flex size-10 items-center justify-center rounded-xl bg-accent text-accent-foreground shadow-lg shadow-accent/30">
          <Sparkles className="size-5" />
        </div>
        <div>
          <h3 className="text-base font-extrabold tracking-tight">
            مساعد المدير الذكي
          </h3>
          <p className="text-xs text-muted-foreground">
            رؤى وتوصيات مبنية على بيانات المدرسة
          </p>
        </div>
        <span className="me-auto inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-2.5 py-1 text-[11px] font-bold text-accent">
          <span className="size-1.5 rounded-full bg-accent live-dot" />
          مباشر
        </span>
      </div>
      <div className="grid gap-3 p-5 sm:grid-cols-2">
        {insights.map((ins) => {
          const m = meta[ins.type]
          const Icon = m.icon
          return (
            <div
              key={ins.id}
              className={cn(
                'flex gap-3 rounded-xl border bg-card/60 p-4 transition-shadow hover:shadow-sm',
                m.ring,
              )}
            >
              <div
                className={cn(
                  'flex size-9 shrink-0 items-center justify-center rounded-lg',
                  m.chip,
                )}
              >
                <Icon className="size-[18px]" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold">{ins.title}</p>
                <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                  {ins.text}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
