import { cn } from '../lib/cn'

export const fieldControlClasses =
  'mt-1.5 w-full rounded-input border border-sage-300 bg-white px-3.5 py-3 text-[15px] text-sage-900 placeholder:text-sage-500'

/**
 * `children` is a render prop, not a node. The caller owns the control
 * element outright, so the type system forces them to receive
 * `describedById` and decide where it goes — there is no implicit cloning
 * that can silently drop the association on a wrapped control, a Fragment,
 * or a non-element child. When `help` is absent, `describedById` is
 * `undefined` and spreading it as `aria-describedby={describedById}` omits
 * the attribute entirely (React drops `undefined` DOM attributes).
 */
export function Field({
  label,
  htmlFor,
  help,
  className,
  children,
}: {
  label: string
  htmlFor: string
  help?: string | null
  className?: string
  children: (describedById: string | undefined) => React.ReactNode
}) {
  const helpId = help ? `${htmlFor}-help` : undefined

  return (
    <div className={cn('block', className)}>
      <label htmlFor={htmlFor} className="text-[13px] font-semibold text-sage-700">
        {label}
      </label>
      {children(helpId)}
      {help ? (
        <span id={helpId} className="mt-1.5 block text-xs text-sage-500">
          {help}
        </span>
      ) : null}
    </div>
  )
}
