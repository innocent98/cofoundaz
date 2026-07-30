import { cn } from '@/lib/cn'

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
        'rounded-card border border-green-100 bg-white shadow-card',
        className
      )}
    >
      {children}
    </div>
  )
}
