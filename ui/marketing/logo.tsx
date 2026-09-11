import Link from 'next/link'
import { cn } from '../lib/cn'

export function Logo({
  tone = 'light',
  className,
}: {
  tone?: 'light' | 'dark'
  className?: string
}) {
  const isDark = tone === 'dark'
  return (
    <Link href="/" className={cn('flex items-center gap-2.5', className)}>
      <span
        aria-hidden="true"
        className={cn(
          'flex h-[30px] w-[30px] items-center justify-center rounded-[9px] shadow-card font-display text-base font-bold',
          isDark ? 'bg-white text-copper-600' : 'bg-green-700 text-copper-500'
        )}
      >
        C
      </span>
      <span
        className={cn(
          'font-display text-xl font-semibold tracking-[-0.01em]',
          isDark ? 'text-white' : 'text-green-900'
        )}
      >
        Cofoundaz
      </span>
    </Link>
  )
}
