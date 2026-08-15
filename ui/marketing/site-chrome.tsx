import { SiteFooter } from './site-footer'
import { SiteHeader } from './site-header'

/**
 * Skip link + header + `<main id="main">` + footer.
 *
 * Extracted from `app/(marketing)/layout.tsx` so `app/not-found.tsx` can render
 * the same chrome. A root-level `not-found.tsx` renders under `app/layout.tsx`
 * only — the `(marketing)` layout never applies to it — so a mistyped URL
 * previously landed the user on a page with no navigation at all and no skip
 * link. Sharing one component keeps the two from drifting.
 */
export function SiteChrome({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-input focus:bg-white focus:px-4 focus:py-2 focus:font-semibold focus:text-green-700"
      >
        Skip to content
      </a>
      <SiteHeader />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </div>
  )
}
