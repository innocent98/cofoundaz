import { Button } from '@/ui/primitives'
import { SiteChrome } from '@/ui/marketing/site-chrome'

export default function NotFound() {
  return (
    // Root `not-found.tsx` renders under `app/layout.tsx` only, so the
    // `(marketing)` layout never applies. Without this the 404 shipped with no
    // header, no footer and no skip link — a mistyped URL left the user with a
    // single "Back home" button as their only route anywhere.
    <SiteChrome>
      <div className="mx-auto flex max-w-[620px] flex-col items-center px-4 py-28 text-center">
        {/* Decorative background numeral. green-100 measured 1.18:1 on white
            (large bold text needs 3:1) — axe checks visual contrast regardless
            of aria-hidden, so this needs a real fix, not just the ARIA
            exemption. green-400 is the lightest token on our ramp that clears
            3:1 here (3.82:1). */}
        <div aria-hidden="true" className="font-display text-[88px] font-bold leading-none text-green-400">
          404
        </div>
        <h1 className="mt-2 font-display text-[28px] font-semibold text-balance text-green-900 md:text-[34px]">
          Well, this page didn’t survive product-market fit.
        </h1>
        <div className="mt-7">
          <Button href="/" variant="accent" size="lg">
            Back home
          </Button>
        </div>
      </div>
    </SiteChrome>
  )
}
