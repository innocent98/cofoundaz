import { cloneElement, isValidElement, type ReactElement } from 'react'
import { cn } from '@/lib/cn'

export const fieldControlClasses =
  'mt-1.5 w-full rounded-input border border-sage-300 bg-white px-3.5 py-3 text-[15px] text-sage-900 placeholder:text-sage-500'

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
  children: React.ReactNode
}) {
  const helpId = help ? `${htmlFor}-help` : undefined

  // Wire aria-describedby onto the actual control, not just declare an id
  // that nothing points at. The control is always a single input/select/
  // textarea element, so cloning is safe here.
  const control =
    helpId && isValidElement(children)
      ? cloneElement(children as ReactElement<{ 'aria-describedby'?: string }>, {
          'aria-describedby': helpId,
        })
      : children

  return (
    <div className={cn('block', className)}>
      <label htmlFor={htmlFor} className="text-[13px] font-semibold text-sage-700">
        {label}
      </label>
      {control}
      {help ? (
        <span id={helpId} className="mt-1.5 block text-xs text-sage-500">
          {help}
        </span>
      ) : null}
    </div>
  )
}
