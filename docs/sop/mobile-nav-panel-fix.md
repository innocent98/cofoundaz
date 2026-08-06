# SOP — Mobile nav panel renders transparent / no background

## What shipped

The mobile hamburger menu's dropdown panel now renders as a solid, full-height
white overlay. Previously it appeared "transparent" — page content showed
through it. Fixed by portaling the panel to `document.body`.

File: `ui/marketing/mobile-nav.tsx`. Branch: `brass-to-copper-accent`.

## Why — root cause

The panel markup already had `bg-white` and `fixed inset-x-0 top-[72px] bottom-0`.
It was *not* actually transparent: its computed `background-color` was
`rgb(255,255,255)`, but its **height had collapsed to ~33px**, so the nav links
overflowed past the tiny white strip and painted directly over the page —
reading as "no background."

The height collapsed because the panel's `position: fixed` was **not resolving
against the viewport.** `SiteHeader` uses `backdrop-blur-[14px]`
(`backdrop-filter: blur(14px)`), and — like `transform`, `filter`, `perspective`,
`will-change`, and `contain` — a `backdrop-filter` makes that element the
**containing block for all `position: fixed` descendants.** The panel was
rendered inside the header (72px tall), so `top: 72px; bottom: 0` was measured
against the header's box, not the 812px viewport, collapsing it.

This is the same class of gotcha as the earlier sticky-nav `contain: layout`
regression: both create containing blocks that "capture" fixed positioning.

## How — the fix

Wrap the panel in `createPortal(panel, document.body)`. The panel stays in the
React tree (refs, `open` state, the Tab focus-trap, the Escape handler, and the
`body` scroll-lock all keep working), but the browser now positions it against
the viewport, so `top-[72px] bottom-0` fills the screen as intended.

- Portal, not "remove the header blur" — the glassy header is a deliberate design
  choice; the panel should escape the containing block, not force the header to
  drop its effect.
- Portal, not `h-screen` hacks — those would depend on the header staying pinned
  at `top: 0` and would overshoot the viewport; the portal is the robust fix.

## What's involved

- `ui/marketing/mobile-nav.tsx` — added `import { createPortal } from 'react-dom'`;
  wrapped the `role="dialog"` panel in `createPortal(…, document.body)`; added a
  comment explaining the containing-block trap. No API/prop changes; the trigger
  button stays in the header.

## Verification

Run from `cofoundaz/`:

- Live (dev server, mobile 375×812, menu open) — panel measured
  `parentElement === document.body`, `top: 72`, `height: 740`, `fillsToBottom:
  true`, `background rgb(255,255,255)`. Screenshot confirmed a solid white
  full-height overlay with the links and Log in button legible.
- `npm run typecheck` → 0 errors · `npm run lint` → clean.
- `npm test` → 188 passed (Testing Library's `screen` queries find portaled
  nodes, so the existing MobileNav/SiteHeader tests still pass unchanged).
- `npx playwright test e2e/accessibility.spec.ts` → 98 passed (focus trap +
  one-accent-CTA-per-viewport invariants intact; the panel's Log in is a
  `secondary`, not an accent CTA).

## Operate / roll back

Pure client-component render change; no config/runtime/DB impact. Roll back by
reverting the `createPortal` wrap (restores the inline render — and the bug).

## Follow-ups

- Any future `fixed` overlay rendered under `SiteHeader` (or any
  `backdrop-blur`/`transform` ancestor) must portal to `body` for the same
  reason — worth remembering when adding search or notification popovers to the
  header.
