import Link from 'next/link'
import { cn } from '../lib/cn'

type Variant = 'accent' | 'primary' | 'secondary' | 'ghost' | 'onDark'
type Size = 'sm' | 'md' | 'lg'

/**
 * PRD §1.1 rule 3: exactly one `accent` (copper) button per screen. All other
 * actions use `primary`, `secondary`, `ghost`, or `onDark`.
 */
const VARIANTS: Record<Variant, string> = {
  accent: 'bg-copper-600 text-white font-bold hover:bg-copper-700 shadow-card',
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

type CommonProps = {
  variant?: Variant
  size?: Size
  className?: string
  children: React.ReactNode
}

/**
 * When `href` is present, the rendered element is an anchor (via `next/link`)
 * and only anchor attributes are valid — button-only attributes like `type`
 * or `disabled` would be invalid DOM props on an `<a>`.
 */
type LinkButtonProps = CommonProps &
  { href: string } & Omit<
    React.AnchorHTMLAttributes<HTMLAnchorElement>,
    // 'type' is excluded even though AnchorHTMLAttributes declares it (the
    // anchor MIME-hint attribute) — without this, `type="submit"` alongside
    // `href` would typecheck as a valid string and silently no-op on the <a>.
    'href' | 'className' | 'children' | 'type'
  >

/**
 * Without `href`, the rendered element is a native `<button>` and the full
 * set of button attributes (`type`, `disabled`, `form`, ...) is valid.
 */
type NativeButtonProps = CommonProps &
  { href?: undefined } & Omit<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    'className' | 'children'
  >

export type ButtonProps = LinkButtonProps | NativeButtonProps

const COMMON_KEYS = ['variant', 'size', 'className', 'children', 'href'] as const

/** Strips the shared visual props, leaving only the native DOM attributes to forward. */
function pickRest<T extends object>(props: T): Omit<T, (typeof COMMON_KEYS)[number]> {
  const rest = { ...props }
  for (const key of COMMON_KEYS) {
    delete (rest as Record<string, unknown>)[key]
  }
  return rest as Omit<T, (typeof COMMON_KEYS)[number]>
}

/**
 * A plain `if (props.href)` truthiness check narrows the `href`-present branch
 * fine, but can't rule out `LinkButtonProps` in the `else` branch — `href` is
 * typed `string`, and TypeScript can't assume it's never an empty (falsy)
 * string. A named type guard makes the narrowing exact in both directions.
 */
function isLinkProps(props: ButtonProps): props is LinkButtonProps {
  return typeof props.href === 'string'
}

export function Button(props: ButtonProps) {
  const { variant = 'secondary', size = 'md', className, children } = props
  const classes = cn(BASE, VARIANTS[variant], SIZES[size], className)

  if (isLinkProps(props)) {
    return (
      <Link href={props.href} className={classes} {...pickRest(props)}>
        {children}
      </Link>
    )
  }

  return (
    <button className={classes} {...pickRest(props)}>
      {children}
    </button>
  )
}
