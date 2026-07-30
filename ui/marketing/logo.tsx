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
          'flex h-[30px] w-[30px] items-center justify-center rounded-[9px] shadow-card',
          isDark ? 'bg-white' : 'bg-green-700'
        )}
      >
        <span
          className={cn(
            'h-[13px] w-[13px] rounded-full border-[2.5px] border-r-transparent',
            isDark ? 'border-brass-600' : 'border-brass-500'
          )}
        />
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
