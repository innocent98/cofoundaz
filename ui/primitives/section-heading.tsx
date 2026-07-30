import { cn } from '../lib/cn'

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  tone = 'light',
  align = 'center',
  as: Tag = 'h2',
  className,
}: {
  eyebrow?: string
  title: string
  subtitle?: string
  tone?: 'light' | 'dark'
  align?: 'left' | 'center'
  as?: 'h1' | 'h2'
  className?: string
}) {
  const isDark = tone === 'dark'
  return (
    <div className={cn(align === 'center' && 'text-center', className)}>
      {eyebrow ? (
        <span
          className={cn(
            'text-xs font-semibold uppercase tracking-[0.08em]',
            // Deviation D-1: brass-600 on white is 3.31:1 and fails AA.
            isDark ? 'text-brass-500' : 'text-brass-700'
          )}
        >
          {eyebrow}
        </span>
      ) : null}
      <Tag
        className={cn(
          'font-display font-semibold tracking-[-0.02em] text-balance',
          Tag === 'h1'
            ? 'text-[34px] leading-[1.08] md:text-[44px] lg:text-[50px]'
            : 'text-[28px] leading-[1.1] md:text-[34px] lg:text-[38px]',
          isDark ? 'text-white' : 'text-green-900',
          eyebrow && 'mt-3'
        )}
      >
        {title}
      </Tag>
      {subtitle ? (
        <p
          className={cn(
            'mt-4 text-base leading-relaxed md:text-[19px]',
            align === 'center' && 'mx-auto',
            isDark ? 'text-green-200' : 'text-sage-700'
          )}
        >
          {subtitle}
        </p>
      ) : null}
    </div>
  )
}
