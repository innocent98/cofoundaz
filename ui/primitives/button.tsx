import Link from 'next/link'
import { cn } from '@/lib/cn'

type Variant = 'accent' | 'primary' | 'secondary' | 'ghost' | 'onDark'
type Size = 'sm' | 'md' | 'lg'

/**
 * PRD §1.1 rule 3: exactly one `accent` (brass) button per screen. All other
 * actions use `primary`, `secondary`, `ghost`, or `onDark`.
 */
const VARIANTS: Record<Variant, string> = {
  accent: 'bg-brass-600 text-green-900 font-bold hover:bg-brass-500 shadow-card',
  primary: 'bg-green-700 text-white font-semibold hover:bg-green-600',
  secondary:
    'bg-white text-green-700 font-semibold border border-sage-300 hover:bg-green-50',
  ghost: 'text-green-700 font-semibold hover:text-green-600',
  onDark:
    'bg-green-800 text-white font-semibold border border-green-700 hover:bg-green-700',
}

const SIZES: Record<Size, string> = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-[18px] py-2.5 text-[15px]',
  lg: 'px-6 py-4 text-base md:px-8 md:text-[17px]',
}

const BASE =
  'inline-flex items-center justify-center gap-2 rounded-input transition-colors ' +
  'disabled:opacity-60 disabled:pointer-events-none cursor-pointer'

export type ButtonProps = {
  variant?: Variant
  size?: Size
  href?: string
  className?: string
  children: React.ReactNode
} & React.ButtonHTMLAttributes<HTMLButtonElement>

export function Button({
  variant = 'secondary',
  size = 'md',
  href,
  className,
  children,
  ...rest
}: ButtonProps) {
  const classes = cn(BASE, VARIANTS[variant], SIZES[size], className)

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    )
  }

  return (
    <button className={classes} {...rest}>
      {children}
    </button>
  )
}
