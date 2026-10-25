import { Button, Container } from '@/ui/primitives'
import { cn } from '../../lib/cn'

export function CtaBand({
  title,
  ctaLabel,
  ctaHref,
  subtitle,
  tone = 'dark',
}: {
  title: string
  ctaLabel: string
  ctaHref: string
  subtitle?: string
  tone?: 'dark' | 'light'
}) {
  const isDark = tone === 'dark'
  return (
    <section className={isDark ? 'bg-brand-900' : 'bg-brand-50'}>
      <Container className="py-20 text-center md:py-24">
        <h2
          className={cn(
            'font-display text-[32px] font-semibold tracking-[-0.02em] text-balance md:text-[42px] lg:text-[46px]',
            isDark ? 'text-white' : 'text-brand-900'
          )}
        >
          {title}
        </h2>
        <div className="mt-8">
          <Button href={ctaHref} variant="accent" size="lg">
            {ctaLabel}
          </Button>
        </div>
        {subtitle ? (
          <p className={cn('mt-4.5 text-sm italic', isDark ? 'text-brand-300' : 'text-neutral-500')}>
            {subtitle}
          </p>
        ) : null}
      </Container>
    </section>
  )
}
