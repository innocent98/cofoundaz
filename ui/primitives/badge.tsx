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
          ? 'bg-brass-600 text-green-900'
          : 'border border-green-200 bg-white text-green-700',
        className
      )}
    >
      {children}
    </span>
  )
}
