import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merge conditional class names, with later Tailwind utilities winning conflicts.
 *
 * Lives inside `ui/` (not `lib/`) so the whole directory stays self-contained:
 * spec §5 requires that promoting it to a shared package is a plain `git mv`.
 * `lib/cn.ts` re-exports this for app-side callers.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
