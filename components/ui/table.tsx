import { cn } from '@/lib/utils'

export function Table({ className, ...props }: React.ComponentProps<'table'>) {
  return (
    <div className="scrollbar-thin w-full overflow-x-auto">
      <table
        className={cn('w-full border-collapse text-right text-sm', className)}
        {...props}
      />
    </div>
  )
}

export function THead({ className, ...props }: React.ComponentProps<'thead'>) {
  return (
    <thead
      className={cn(
        'border-b border-border text-xs font-semibold text-muted-foreground',
        className,
      )}
      {...props}
    />
  )
}

export function TR({ className, ...props }: React.ComponentProps<'tr'>) {
  return (
    <tr
      className={cn(
        'border-b border-border/60 transition-colors last:border-0 hover:bg-muted/40',
        className,
      )}
      {...props}
    />
  )
}

export function TH({ className, ...props }: React.ComponentProps<'th'>) {
  return (
    <th
      className={cn('whitespace-nowrap px-4 py-3 font-semibold', className)}
      {...props}
    />
  )
}

export function TD({ className, ...props }: React.ComponentProps<'td'>) {
  return (
    <td className={cn('whitespace-nowrap px-4 py-3.5', className)} {...props} />
  )
}
