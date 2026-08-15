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
          ? 'bg-copper-600 text-white'
          : 'border border-green-200 bg-white text-green-700',
        className
      )}
    >
      {children}
    </span>
  )
}
