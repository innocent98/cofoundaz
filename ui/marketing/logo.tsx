import Link from 'next/link'
import BrandLogo from '@/components/brand/BrandLogo'
import { cn } from '../lib/cn'

export function Logo({
  tone = 'light',
  className,
}: {
  /** The surface it sits on: `dark` (footer) gets the white wordmark. */
  tone?: 'light' | 'dark'
  className?: string
}) {
  return (
    <Link href="/" className={cn('flex items-center', className)}>
      <BrandLogo tone={tone === 'dark' ? 'light' : 'dark'} height={28} eager={tone === 'light'} />
    </Link>
  )
}
