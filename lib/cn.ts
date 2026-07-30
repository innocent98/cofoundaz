/**
 * App-side alias for the `ui/` package's own class-merge helper.
 *
 * The implementation lives at `ui/lib/cn.ts` so nothing under `ui/` imports
 * from outside `ui/` (spec §5: promoting `ui/` must be a plain `git mv`).
 * This re-export keeps `@/lib/cn` working for app-side callers.
 */
export { cn } from '@/ui/lib/cn'
