import { cn } from '../lib/cn'

export function Badge({
  tone = 'outline',
  className,
  children,
}: {
  tone?: 'accent' | 'outline'
  className?: string
  children: React.ReactNode
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-pill px-3 py-1.5 text-xs font-semibold',
        tone === 'accent'
          ? 'bg-accent-600 text-white'
          : 'border border-brand-200 bg-white text-brand-700',
        className
      )}
    >
      {children}
    </span>
  )
}
