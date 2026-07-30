import { cn } from '@/lib/cn'

const WIDTHS = {
  default: 'max-w-[1280px]',
  narrow: 'max-w-[1120px]',
  prose: 'max-w-[760px]',
} as const

export function Container({
  width = 'default',
  className,
  children,
}: {
  width?: keyof typeof WIDTHS
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={cn('mx-auto px-4 md:px-6', WIDTHS[width], className)}>
      {children}
    </div>
  )
}
