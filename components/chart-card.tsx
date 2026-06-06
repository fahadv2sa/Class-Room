import { Card } from '@/components/ui/card'

export function ChartCard({
  title,
  subtitle,
  action,
  children,
  className,
}: {
  title: string
  subtitle?: string
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <Card className={className}>
      <div className="flex items-start justify-between gap-3 p-5 pb-1">
        <div>
          <h3 className="text-base font-extrabold tracking-tight">{title}</h3>
          {subtitle && (
            <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {action}
      </div>
      <div className="p-5 pt-3">{children}</div>
    </Card>
  )
}
