import { cn } from '../lib/cn'

export function Card({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        'rounded-card border border-brand-100 bg-white shadow-card',
        className
      )}
    >
      {children}
    </div>
  )
}
