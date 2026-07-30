# SOP — Marketing website (Cofoundaz)

## What shipped

The public marketing site: 11 routes plus a branded 404, built as static pages on Next.js 16
App Router. Branch `feat/marketing-website`, commits `48df11d..165e31e`, plus `83193a9` (Task 14's
e2e sweep) and its post-review fix round (see `git log` on that branch for the full, task-by-task
history — the SDD ledger for this build lives at `.superpowers/sdd/2026-07-30-marketing-website/`).

| Route | Purpose |
|---|---|
| `/` | Home |
| `/product` | Product tour (scroll-spy sub-nav over hub sections) |
| `/pricing` | Plans, comparison matrix, FAQ |
| `/about` | Story, values, team, backers |
| `/contact` | Stubbed contact form (no backend yet) |
| `/terms`, `/privacy`, `/security`, `/cookies` | Legal documents |
| `/login`, `/signup` | Unwired auth page shells (excluded from sitemap/robots) |
| `/_not-found` | Branded 404 |

Plus generated `/sitemap.xml`, `/robots.txt`, `/opengraph-image`.

Final gate (this task, Task 14):

```
npm run typecheck   → clean
npm run lint        → clean
npx vitest run       → 166 tests / 19 files passing
npm run build        → 15 static routes (all ○, none ƒ)
npm run test:e2e     → 99 Playwright tests passing (accessibility + responsive)
```

Lighthouse (`seo,accessibility` categories, production build, `/`, `/product`, `/pricing`):
**100 / 100 on all three**, after the fixes below.

## Why

PRD "Marketing Website" spec, Part 3 Phase 1 (`docs/superpowers/specs/2026-07-30-marketing-website-design.md`
and the implementation plan at `docs/superpowers/plans/2026-07-30-marketing-website.md`). Goal:
ship the public-facing site — brand, product story, pricing, legal, and unwired auth shells —
ahead of the authenticated app, on a design-token system strict enough that PRD usage rules
(color budget, one accent CTA per screen, WCAG AA) are enforceable by tooling rather than by
eyeballing a comp.

## How

- **Route groups.** `app/(marketing)/` (shared header/footer/skip-link chrome, `SiteHeader` +
  `<main id="main">` + `SiteFooter`) and `app/(auth)/` (a two-pane brand-panel layout, no shared
  marketing chrome) so auth pages don't inherit nav/footer they don't need. `(legal)` is a nested
  group under `(marketing)` purely for directory organization — same layout as its siblings.
- **Token layer.** Tailwind v4 `@theme` in `app/globals.css` clears the default palette,
  breakpoints, radii, shadows, and font families, and replaces them with the PRD's named ramp
  (`green-{50..950}`, `brass-{100,200,500,600,700}`, `sage-{100,300,500,700,900}`,
  `red-{100,600}`) plus `--breakpoint-md/lg/xl` (**no `sm:`** — base styles are the small-screen
  design). This makes the token name part of the class name (`bg-green-700`, not an arbitrary
  hex), so PRD rules like "one brass CTA per screen" become greppable/testable instead of a
  matter of taste.
- **Content modules.** Every page's copy lives in a typed `content/*.ts` module (`content/types.ts`
  defines the shapes: `Plan`, `MatrixCell` as a discriminated union on `kind`, `HubGroup`,
  `LegalDocument`, etc.), imported by the page component. Components render structure; content
  files own words. `content/content.test.ts` guards house style (no em-dashes) across all 8
  modules.
- **Component layers.** `ui/primitives/` (Button, Card, Badge, Container, SectionHeading, Field —
  shadcn-style, hand-built, no Radix this phase since the only interactive widgets — FAQ
  accordion, testimonial carousel, mobile nav, product scroll-spy — are small enough to hand-build
  with correct ARIA and keep the marketing bundle near-zero JS). `ui/marketing/` (page sections,
  one subfolder per route). `ui/mocks/` (the two illustrated "product screenshot" mockups —
  `ProductShot`, `AppFrame` — ported from the comp as React/Tailwind, not images).
- **SEO (Task 13).** Per-route `metadata` exports, `alternates.canonical`, a generated
  `sitemap.ts`/`robots.ts` (marketing + legal routes only — auth is deliberately excluded), a
  branded `opengraph-image.tsx`, and JSON-LD (`lib/seo.tsx`) for Organization/SoftwareApplication/
  FAQPage schema.
- **This task (14).** Playwright against a **production build** (`npm run build && npm start`,
  per `playwright.config.ts`'s `webServer`) — the only way to verify what static rendering,
  real-browser layout, and real axe-core actually do, none of which jsdom unit tests exercise.

## What's involved

```
app/
  layout.tsx                       root layout — next/font (Spectral, Hanken Grotesk), metadata
  globals.css                      @theme tokens, base layer, D-2 reduced-motion
  not-found.tsx                    branded 404 (no shared header/footer)
  opengraph-image.tsx, robots.ts, sitemap.ts
  (marketing)/layout.tsx           skip link + SiteHeader + <main id="main"> + SiteFooter
  (marketing)/page.tsx             home
  (marketing)/product/page.tsx
  (marketing)/pricing/page.tsx
  (marketing)/about/page.tsx
  (marketing)/contact/page.tsx
  (marketing)/(legal)/{terms,privacy,security,cookies}/page.tsx
  (auth)/layout.tsx                two-pane brand panel, no shared marketing chrome
  (auth)/{login,signup}/page.tsx

content/                           types.ts + 8 typed copy modules (home, product, pricing, about,
                                    contact, legal, nav, auth) + content.test.ts house-style guard

ui/primitives/                     Button, Card, Badge, Container, Field, SectionHeading
ui/marketing/                      site-header, mobile-nav, site-footer, logo, legal-document,
                                    home/*, product/*, pricing/*, about/*, contact/*, auth/*
ui/mocks/                          product-shot.tsx, app-frame.tsx (illustrated mock screenshots)

lib/cn.ts, lib/seo.tsx, lib/analytics.ts

e2e/                                (this task)
  routes.ts                        MARKETING_ROUTES / AUTH_ROUTES / ALL_ROUTES
  accessibility.spec.ts            axe sweep, h1 sweep, skip-link sweep, mobile-menu focus trap,
                                    carousel reduced-motion, accent-CTA invariant sweep
  responsive.spec.ts               4-viewport overflow sweep, nav breakpoint sweep, matrix-scroll
                                    and Growth-first-card checks, scroll-time sticky-header and
                                    sticky-sub-nav checks (post-review addition)
playwright.config.ts                webServer runs `npm run build && npm start`
```

## Verification (Task 14 gate)

Ran in this order, all green on the final commit:

```
npm run typecheck    → clean
npm run lint         → clean
npx vitest run        → 166 tests / 19 files
npm run build         → 15 static routes (○), 0 dynamic (ƒ)
npm run test:e2e      → 99 Playwright tests (47 accessibility, 52 responsive)
```

Lighthouse, production build, `seo`+`accessibility` categories only:

| Route | SEO | Accessibility |
|---|---|---|
| `/` | 100 | 100 |
| `/product` | 100 | 100 |
| `/pricing` | 100 | 100 |

### Failures found by the sweeps, and how each was resolved

The first Playwright run surfaced eight distinct real issues (plus one test-authoring correction
found while investigating). Each is a `file:line`-traceable fix, not a loosened assertion:

1. **Footer copyright/tagline contrast** (`ui/marketing/site-footer.tsx`) — `text-green-400` on the
   footer's `bg-green-950` measured 4.499:1 (a hairline fail; normal text needs 4.5:1). Bumped to
   `text-green-300` (7.02:1).
2. **Auth brand-panel copyright contrast** (`ui/marketing/auth/auth-brand-panel.tsx`) —
   `text-green-400` on `bg-green-900` measured 4.03:1. Bumped to `text-green-300` (6.30:1).
3. **404 decorative numeral contrast** (`app/not-found.tsx`) — `text-green-100` on white measured
   1.18:1 (large bold text needs 3:1). `aria-hidden` does **not** exempt an element from axe's
   color-contrast rule — the check is about what a sighted user sees, not the accessibility tree —
   so this needed a real color change, not just the ARIA attribute already present. Bumped to
   `text-green-400` (3.82:1).
4. **`brass-700` text on `brass-100` backgrounds — three sites** (`ui/mocks/app-frame.tsx` ×2,
   `app/(marketing)/pricing/page.tsx` add-ons banner) — D-1 verified `brass-700` at 4.84:1 against
   **white**; nobody had checked it against the warmer `brass-100` surface, where it only measures
   4.16:1. Fixed to `text-green-900` (13.32:1), matching the pattern already used by `Badge`'s
   `tone="accent"` (`bg-brass-600 text-green-900`).
5. **Home page: a batch of contrast false-positives from a mid-animation scan.** Hero's content
   and image columns fade in via `animate-[fade-up_...]`; scanning immediately after `page.goto`
   caught several elements (the hero badge, both hero CTA buttons, the hero subtitle, and every
   text node inside the `ProductShot`/`AppFrame` mock illustration) at a partial opacity, which
   axe reported as unrelated, non-reproducible blended colors. Fixed by emulating
   `prefers-reduced-motion: reduce` before each axe scan (`e2e/accessibility.spec.ts`) — D-2
   already collapses all animation to 0.01ms under that media query, so the scan reads the
   settled, final state (the state every real user, including reduced-motion users, eventually
   sees) instead of a race with a 0.6–0.82s CSS transition.
6. **`/pricing` horizontal overflow at 375px — a real, user-reachable bug, fixed twice.** The
   comparison matrix's `min-w-[560px]` table is deliberately wider than a 375px viewport and
   scrolls inside its own `overflow-x-auto` region (`ui/marketing/pricing/comparison-matrix.tsx`)
   — that part is correct by design. But it also made the *whole page* horizontally draggable:
   every DOM ancestor between the matrix and `<body>` reported a correctly-clipped `scrollWidth`,
   yet `document.documentElement.scrollWidth` stayed inflated, and — confirmed empirically with
   `window.scrollTo(100, 0)` — the viewport actually shifted 100px, i.e. a real user could drag/
   swipe the entire page sideways to reveal blank space.
   - **First attempt (shipped in `83193a9`, reverted after review): `overflow-x: hidden` on `html`
     and `body`.** This stopped the drag, but per the CSS Overflow spec, declaring only
     `overflow-x` on an axis forces the *other* axis to compute to `auto` if it isn't already
     non-visible — so this silently set `overflow-y: auto` on `html`/`body` too, which changed the
     sticky containing-block chain in Chromium and disabled `position: sticky` sitewide. Confirmed
     with a scroll-time measurement: at `scrollY = 1200` on `/`, the header's
     `getBoundingClientRect().top` was `-1200` (scrolled away) instead of `0` (pinned); same on
     `/product` for both the header and the `top-[71px]` scroll-spy sub-nav. Nothing in the original
     sweep caught it because every visibility assertion checked state immediately after
     `page.goto`, before any scroll — this is now covered (see the scroll-time sticky tests below).
   - **Real fix: `contain-layout` on `[data-matrix-scroll]` itself**, not a page-level rule.
     Bisected on the live page by toggling one property at a time: neither the scroller's
     `tabIndex`, its `role`/`aria-label`, nor the global `:focus-visible` outline rule changed
     `document.documentElement.scrollWidth`; only removing the table's `min-width` did (536px →
     375px). Walking the DOM ancestor chain from the scroller up to `<html>` showed every
     intermediate box (the `Container`, `<main>`, the layout's flex wrapper, `<body>`) correctly
     reporting `scrollWidth === clientWidth` — only `<html>` itself stayed inflated, meaning
     `overflow-x: auto` was clipping and scrolling the table correctly (verified: the scroller's
     own `scrollWidth` > `clientWidth`, and the "comparison matrix scrolls" test passes) but wasn't
     fully isolating layout containment for the purposes of the *root's* scrollable-overflow
     computation. Adding `contain: layout` (Tailwind's `contain-layout` utility) to the scroller
     establishes that containment boundary explicitly; confirmed on the live page it drops
     `document.documentElement.scrollWidth` to exactly `375` (zero excess) while the scroller's own
     internal scroll is untouched (`scrollWidth` 560 > `clientWidth` 341, still scrolls). Because
     the real fix eliminates the leak entirely rather than just masking it, the sweep's overflow
     check (`e2e/responsive.spec.ts`) is the original, strict `scrollWidth`-vs-`clientWidth`
     comparison from the brief — no numeric exception needed, since containment (not a looser
     assertion) is what makes `/pricing` compatible with "zero page-level overflow, every route."
     Verified both fixes independently: removing `contain-layout` alone turns the overflow test
     red again; reintroducing `overflow-x: hidden` on `html`/`body` alone turns the two new
     scroll-time sticky tests red (`top: -1200` / `top: -1500`, matching the exact review findings)
     without affecting the overflow test.
7. **`/pricing` heading order (`h1` → `h3`), caught by Lighthouse.** The plan cards render their
   name as `h3` (required — `responsive.spec.ts`'s "Growth is the first pricing card" test locates
   them by `h3`), with nothing at `h2` in between the page's `h1` and the first card. Fixed by
   adding a visually-hidden `<h2 className="sr-only">Plans</h2>` immediately before the card grid
   (`app/(marketing)/pricing/page.tsx`) rather than changing the cards' heading level, which would
   have broken that Playwright test and the plan-card semantics it depends on.
8. **Carousel dot touch targets, caught by Lighthouse's `target-size` audit on `/`.** The
   testimonial carousel's dot indicators were 8×8px `<button>`s — Lighthouse (and this project's
   own 44px touch-target standard) flagged them. Restructured so the button is a 44×44px
   (`h-11 w-11`) touch target with the original 8px dot as a centered `aria-hidden` inner `<span>`
   (`ui/marketing/home/testimonial-carousel.tsx`) — same visual design, real hit target.

**One test-authoring correction, not a production bug:** the raw `.bg-brass-600` selector (as
literally specified for the cross-page accent-CTA invariant) also matched legitimate non-CTA uses
of the brass background token — the "Most popular" plan `Badge`, the hero badge's decorative
status dot, and the `AppFrame`/`ProductShot` mock-illustration icon accents — inflating Home and
Product to 4 and Pricing to 3 on the first run. The invariant is about CTA *buttons*, not the brass
token in general (brass is separately allowed as backgrounds/borders under the "≤10% of screen"
rule). Scoped the selector to real interactive controls (`:is(a, button).bg-brass-600`) and it
resolved cleanly for every route on the first re-run — see "accent-CTA invariant" below.

### The accent-CTA and h1 invariant sweep

Per-route `h1` and header-CTA counts, enforced by `e2e/accessibility.spec.ts`:

| Route | `h1` | header accent CTA | in-content accent CTAs |
|---|---|---|---|
| `/` | 1 | 1 | 2 (Hero primary + closing CtaBand) |
| `/product` | 1 | 1 | 2 (ProductHero primary + closing CtaBand) |
| `/pricing` | 1 | 1 | 2 (popular PricingCard + closing CtaBand) |
| `/about` | 1 | 1 | 1 (closing CTA) |
| `/contact` | 1 | 1 | 1 (form submit) |
| `/terms`, `/privacy`, `/security`, `/cookies` | 1 each | 1 each | 0 each |
| `/login`, `/signup` | 1 each | 0 (no shared header) | 1 each (form submit) |
| `/_not-found` | 1 | 0 (no shared header) | 1 ("Back home") |

`SiteHeader` renders its own `bg-brass-600` "Start free" CTA on every route in the `(marketing)`
layout — a fact the existing per-page unit tests never surfaced, since they render page components
in isolation (`render(<AboutPage />)`, no header). A literal "exactly one `.bg-brass-600` in the
whole document" is false for 5 of the 9 header-bearing routes, so this was flagged for design
sign-off rather than encoded on assumption.

**Design ruling: "one brass CTA per screen" means per viewport, not per document.** The header's
CTA is a separate, sanctioned, always-present exception (`ui/marketing/mobile-nav.tsx` already
documents this — the header's "Start free" stays visible at every width and must never be
duplicated). For in-content CTAs, PRD §1.1's restraint principle (≤10% brass per screen, one brass
CTA per screen) is about what a reader sees at any one moment on a long scrolling page, not a
document-wide tally. Home, Product, and Pricing's hero-CTA-plus-closing-band bracket is correct
*because* the two never appear on screen together — confirmed, not assumed (see below).

**Enforcement, two separate invariants:**

1. **Header:** `header :is(a,button).bg-brass-600` count is exactly 1 where a header exists, 0
   where it doesn't (auth routes, 404) — unchanged, still a simple per-page count.
2. **In-content co-visibility:** for every route, at each of the four breakpoint viewports (375,
   768, 1280×900, 1440×900 — matching `e2e/responsive.spec.ts`'s own `VIEWPORTS`), no two
   `main :is(a,button).bg-brass-600` elements may be simultaneously visible at *any* scroll
   position. Implemented as a closed-form check rather than sampling discrete scroll steps: for
   every pair of accent CTAs, compute the document-space span from the top of the earlier one to
   the bottom of the later one; two CTAs can be co-visible at some scroll offset if and only if
   that span fits inside one viewport-height window, so the assertion is `span > viewportHeight`
   for every pair. "Visible" is defined as any pixel overlap with the viewport (partial visibility
   counts) — a CTA half off the bottom edge still visually competes for attention, so this is the
   conservative reading.
   - Measured spans on `/`, `/product`, `/pricing` (the only routes with 2 in-content CTAs) ranged
     from 3327px (`/` at lg/xl) up to 7366px (`/product` at sm) — 3.7× to 8.9× the tallest viewport
     height (1024px) at the *closest* measured case. No route came anywhere near a violation at any
     of the four viewports, including `xl` (1440×900), which was checked specifically since more of
     a page's width fits on screen there (its height is unchanged from `lg`, so no more of the
     *vertical* scroll fits either).
   - Verified the check can genuinely fail: temporarily reduced Home to just `<Hero /><CtaBand />`
     (removing the five sections between them) — 3 of 4 viewports (`md`, `lg`, `xl`) immediately
     went red with spans of 857px/426px/423px, all comfortably under their viewport heights.
     Reverted immediately after confirming.

## Deviations from the comps (carried forward from Task 1/2, restated here with the Task 14 evidence)

**D-1 — `brass-600` fails AA as text on light backgrounds; `brass-700` is the fix, with one gap.**
`brass-600` (`#A8894B`) as text on white measures **3.31:1** (fails; needs 4.5:1). `brass-700`
(`#8A6E33`) on white measures **4.84:1** (passes) and is what `SectionHeading`'s eyebrow and
similar "brass text on light" spots use. `green-900` on `brass-600` (buttons/badges) measures
**4.61:1** (passes) — brass *backgrounds* were never affected. This task found the one background
D-1 didn't cover: `brass-700` on `brass-100` (not white) only measures **4.16:1** — see finding #4
above. Fixed by using `green-900` text on brass backgrounds instead (13.32:1), matching the
existing `Badge` accent-tone pattern.

**D-2 — All motion disabled under `prefers-reduced-motion: reduce`; the carousel additionally
never auto-advances under it (WCAG 2.2.2).** Enforced in `app/globals.css` (global
`animation-duration`/`transition-duration` collapse to 0.01ms) and in
`ui/marketing/home/testimonial-carousel.tsx` (a `matchMedia` guard skips starting the rotation
timer). This task's carousel test (`e2e/accessibility.spec.ts`) confirms the quote text is
unchanged 7 seconds after load under emulated reduced motion. This task additionally leaned on D-2
for the axe sweep itself (finding #5 above) — emulating reduced motion before every accessibility
scan reads the settled, final page state rather than racing a fade-in transition.

## Operate / roll back

- **Run locally:** `npm run dev` (Turbopack). Production parity: `npm run build && npm start`,
  serves on `:3000`, healthcheck-able at any static route.
- **Run the full gate:** `npm run typecheck && npm run lint && npx vitest run && npm run build && npm run test:e2e`.
  `npm run test:e2e` alone builds and starts its own server per `playwright.config.ts`'s
  `webServer` (reuses one already running outside CI).
- **Env:** `NEXT_PUBLIC_SITE_URL` sets the canonical/OG base URL (`.env.example`); no other runtime
  config — no backend calls are wired yet (contact form and auth are presentational stubs, see
  Follow-ups).
- **Roll back:** the whole feature is isolated to `app/`, `content/`, `ui/`, `lib/`, `e2e/`, and
  the three config files (`playwright.config.ts`, `tailwind`/`postcss` configs, `package.json`).
  Reverting the branch (or `git revert` on the merge commit once merged) removes the marketing
  site cleanly — no migrations, no shared-package changes outside this repo.

## Follow-ups

- **Blog and Help Center** — designed in the comp, deliberately out of scope for v1
  (`content/nav.ts` keeps the links commented out, ready to re-enable in one line once the routes
  exist).
- **Contact form backend** — `ui/marketing/contact/contact-form.tsx` is presentational only;
  wire to the FastAPI marketing domain (`POST /api/v1/marketing/contact`) per its own `TODO`.
- **Auth wiring** — `/login` and `/signup` are unwired shells (`ui/marketing/auth/auth-form.tsx`);
  wire to PRD Module 01 (`POST /api/v1/auth/{signup,login}`, OAuth at
  `/api/v1/auth/oauth/{google,apple}`), and un-disable the currently-`disabled` submit/OAuth
  buttons once real endpoints exist.
- **`packages/ui` promotion** — if a second app (the authenticated product) needs these
  primitives, promote `ui/primitives/` out of this app into a shared package rather than
  duplicating Button/Card/Badge/Field.
- **`heading-order` is an axe best-practice rule, not WCAG-tagged** — it isn't caught by
  `e2e/accessibility.spec.ts`'s `withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa'])` axe sweep
  (that's how the `/pricing` h1→h3 skip shipped through Task 8 unnoticed until Lighthouse caught
  it here). Worth a follow-up: either add axe's `best-practice` tag to the sweep, or add an
  explicit Playwright heading-order assertion per route, so a future page can't reintroduce the
  same class of gap.
