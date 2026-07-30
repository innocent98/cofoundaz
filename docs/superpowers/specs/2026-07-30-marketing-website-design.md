# Cofoundaz Marketing Website — Design Spec

**Date:** 2026-07-30 · **Status:** Approved · **Phase:** 1 of the Cofoundaz build
**Scope:** Public pre-auth marketing website (PRD Part 3) + unwired auth page shells
**Repo:** `cofoundaz/` (Next.js frontend). No changes to `cofoundaz-api/` this phase.

---

## 1. Summary

Build the public marketing website as statically-rendered Next.js App Router pages, at visual
parity with the UI team's comps and copy parity with the Technical PRD. This phase establishes
the design-token layer and the first shared primitives that all 26 product modules will reuse,
so it is as much a foundation exercise as a website.

Eleven routes ship. No backend work, no authentication, no dashboard.

---

## 2. Sources of truth and precedence

| Source | Path | Role |
|---|---|---|
| Technical PRD | `../Cofoundaz_Technical_PRD.md` | Richer and more detailed. Owns tokens, structure, API conventions, accessibility rules, build order. |
| UI comps | `../# Cofoundaz Web App UI Build/Marketing Site.dc.html` | Owns visual design and final copy. Also `ProductShot.dc.html`, `AppFrame.dc.html`. |

**Precedence rules (decided):**

1. **Copy** — the UI comp wins wherever both define a string; the PRD fills gaps. The comp reflects
   a later, deliberate house-style pass (em-dashes removed throughout: `"idea to profitability. One
   connected workspace"` not `"— one connected"`; `"1 to 3"` not `"1–3"`; `"Thanks, we'll"` not
   `"Thanks — we'll"`). Match the comp exactly, including that style.
2. **Typography** — the UI comp wins. PRD §1.1 hedged (`"e.g. Fraunces / Sora"`, `"e.g. Inter"`);
   the comp committed to **Spectral** + **Hanken Grotesk**.
3. **Accessibility** — the **PRD wins**. Where the comp violates WCAG, apply the PRD's own remedy.
   See §10. This is the only category where we knowingly diverge from the comps.
4. **Everything else** — PRD wins (breakpoints, spacing scale, radii, focus ring, motion rules).

### Reading the comps

The `.dc.html` files are a design-comp DSL, not shippable HTML:

- `<sc-if value="{{ x }}">` → conditional render
- `<sc-for list="{{ xs }}" as="x">` → `.map()`
- `<dc-import name="ProductShot">` → child component
- The trailing `<script type="text/x-dc">` holds a `DCLogic` class whose `renderVals()` returns
  every piece of page data as plain JS objects (`Marketing Site.dc.html:809-1069`).

`renderVals()` is effectively the content model already authored for us. Porting it is mechanical.

The comp is a **single-page hash-routed mock**: `state.route` drives `isHome` / `isProduct` / … flags,
and `showChrome: !isAuth` hides the header and footer on login/signup. In App Router this becomes
real routes plus a route-group boundary (§4).

---

## 3. Scope

### In scope — 11 routes

| Route | Source | Notes |
|---|---|---|
| `/` | comp `isHome` | 7 sections |
| `/product` | comp `isProduct` | 5 hub sections + sticky scroll-spy sub-nav |
| `/pricing` | comp `isPricing` | 3 cards, comparison matrix, FAQ accordion |
| `/about` | comp `isAbout` | story timeline, values, team, backers |
| `/contact` | comp `isContact` | form is client-side stub |
| `/terms` `/privacy` `/security` `/cookies` | comp `isLegal` + `legalMap` | shared template, `last-updated` stamp |
| `404` | comp `is404` | `not-found.tsx` |
| `/login` `/signup` | comp `isAuth` | presentational shells, no submit wiring |

Plus: responsive behaviour at all four PRD breakpoints, WCAG 2.1 AA, SEO metadata, and the
design-token foundation.

### Explicitly out of scope

Blog · Help Center · `/forgot-password` · `/reset-password/[token]` · `/verify-email/[token]` ·
`/invite/[token]` · `/sign/[token]` · any real auth · any real contact/newsletter backend ·
the `/admin` and `/super-admin` consoles · all 26 product modules.

**Consequence — Resources dropdown removed for v1.** The comp's nav has a `Resources ▾` dropdown
linking Blog and Help Center, and the footer's Product column links both. With those pages out of
scope, shipping the dropdown means dead links. Both are removed from the rendered nav and footer,
and retained as commented-out entries in `content/nav.ts` so re-enabling is a one-line change.

---

## 4. Route architecture

**One root layout, two route groups.** Next.js docs warn that sibling *root* layouts force a full
page reload on cross-navigation — and `"Start free"` in the marketing nav navigates straight to
`/signup`. Two root layouts would make the site's primary conversion path hard-navigate. So:

```
app/layout.tsx              # THE root layout: <html>, <body>, font CSS vars, metadataBase
├─ (marketing)/layout.tsx   # skip-link + SiteHeader + <main> + SiteFooter
└─ (auth)/layout.tsx        # 45% brand panel / 55% form column, no header or footer
```

This reproduces the comp's `showChrome: !isAuth` as a structural boundary rather than a runtime flag.

The four legal pages share one template via a nested `(legal)` group, each page supplying a key into
`content/legal.ts`. Static routes rather than `[slug]` — four known documents, and static routes
give us per-page metadata for free without a `generateStaticParams` round-trip.

---

## 5. Directory layout

Both repos stay independent (`cofoundaz` = FE, `cofoundaz-api` = BE). All work is in `cofoundaz/`.

**Portability rule:** `ui/` and `content/` must not import anything app-specific. When PRD §5.0's
`packages/ui` becomes real (at the `apps/admin` build), promoting them is a `git mv`.

```
cofoundaz/
├─ app/
│  ├─ layout.tsx                    # root — fonts, metadataBase, <html lang="en">
│  ├─ globals.css                   # PRD §1.1 tokens via Tailwind v4 @theme
│  ├─ not-found.tsx                 # 404
│  ├─ sitemap.ts                    # MetadataRoute.Sitemap
│  ├─ robots.ts                     # MetadataRoute.Robots
│  ├─ opengraph-image.tsx           # default OG card via ImageResponse
│  ├─ (marketing)/
│  │  ├─ layout.tsx
│  │  ├─ page.tsx                   # Home
│  │  ├─ product/page.tsx
│  │  ├─ pricing/page.tsx
│  │  ├─ about/page.tsx
│  │  ├─ contact/page.tsx
│  │  └─ (legal)/
│  │     ├─ terms/page.tsx
│  │     ├─ privacy/page.tsx
│  │     ├─ security/page.tsx
│  │     └─ cookies/page.tsx
│  └─ (auth)/
│     ├─ layout.tsx
│     ├─ login/page.tsx
│     └─ signup/page.tsx
├─ ui/
│  ├─ primitives/                   # Button, Card, Badge, Input, Textarea, Select,
│  │                                #   Checkbox, Container, SectionHeading
│  ├─ marketing/                    # SiteHeader, SiteFooter, MobileNav, Hero, FeatureTile,
│  │                                #   StepCard, ProblemCard, TestimonialCarousel,
│  │                                #   SecurityStrip, CtaBand, HubSection, ScrollSpyNav,
│  │                                #   StatStrip, PricingCard, ComparisonMatrix,
│  │                                #   FaqAccordion, CreditPanel, WordmarkRow,
│  │                                #   StoryTimeline, ValueCard, TeamCard, LegalDocument,
│  │                                #   ContactForm, AuthBrandPanel, AuthForm
│  └─ mocks/                        # ProductShot, AppFrame (5 variants)
├─ content/
│  ├─ nav.ts home.ts product.ts pricing.ts about.ts legal.ts auth.ts contact.ts
│  └─ strings/common.ts             # PRD §1.4 shared strings
├─ lib/
│  ├─ cn.ts                         # class merge helper
│  ├─ seo.ts                        # metadata + JSON-LD builders
│  └─ analytics.ts                  # typed no-op track()
└─ docs/superpowers/specs/          # this document
```

---

## 6. Platform constraints (Next.js 16.2.12)

`AGENTS.md` mandates reading `node_modules/next/dist/docs/` over training data. Verified facts that
change how we write code:

| Constraint | Detail |
|---|---|
| Turbopack default | `next dev` and `next build` both use it. No `--turbopack` flag. |
| Async request APIs | `params`, `searchParams`, `cookies`, `headers` are **fully** async; the v15 sync fallback is removed. |
| Typed routes | `next typegen` generates `PageProps<'/route'>` / `LayoutProps`. Use them. |
| `middleware` → `proxy` | The `middleware.ts` convention is deprecated in favour of `proxy`. Not needed this phase. |
| `revalidateTag` | Now requires a second `cacheLife` argument. Not needed this phase. |
| OG image params | `params` and `id` in `opengraph-image` / `icon` are now Promises — `await` them. |
| Sitemap `id` | `generateSitemaps` ids arrive as Promises. Not needed (single static sitemap). |
| Runtime floor | Node 20.9+, TypeScript 5.1+. Local is Node 24.13.0. |

All 11 routes are statically rendered (PRD §3 requires static for SEO). No route may call a
request-time API, or it silently opts into dynamic rendering.

Fonts confirmed present in `next/font/google`:
- `Spectral` — requires explicit `weight`; use `['400','500','600','700']` + `style: ['normal','italic']`
- `Hanken_Grotesk` — supports `weight: 'variable'`

Both are loaded in the **root layout** and exposed as CSS variables (`--font-display`,
`--font-body`), replacing the scaffold's Geist fonts and the comp's `<link>` to Google Fonts.
Self-hosting via `next/font` removes a render-blocking third-party request.

---

## 7. Design tokens

**Decision: Tailwind v4 CSS-first `@theme` in `app/globals.css`. No new dependencies.**

The PRD ships a named 11-stop ramp. Tailwind v4's `@theme` turns each token into a real utility, so
the comp's `background:#1E4D3B` becomes `bg-green-700` — the *token name survives into the markup*,
which is what makes PRD §1.1's usage rules reviewable by grep (60/30/10 balance, one brass CTA per
screen, charts monochrome-sequential).

**Rejected — shadcn/ui.** PRD §5.0 mentions a "shadcn/ui-style" library, but shadcn's semantic layer
(`--primary`, `--muted`, `--accent`) actively fights an explicitly-named 11-stop ramp; adopting it
means spending the phase re-theming away from its defaults. We build shadcn-*style* (copy-in,
composable, Tailwind-based) without the scaffold.

**Rejected — CSS Modules.** Closest 1:1 to the comps' inline styles, but does not scale to 26 modules.

**Consequence — no Radix this phase.** In-scope interactive widgets are the FAQ accordion,
testimonial carousel, mobile nav, and product scroll-spy sub-nav. Each is ~30 lines with correct
ARIA, and hand-building keeps the marketing bundle near-zero JS for LCP. Radix earns its place in
the app phase, where PRD §1.2 needs Combobox, Drawer, Popover, Modal, and Command Palette.

### Token set (PRD §1.1, verbatim)

```
Evergreen  --green-950 #0B1F17 · 900 #12291F · 800 #183B2C · 700 #1E4D3B · 600 #266049
           --green-500 #2E7256 · 400 #4E8F73 · 300 #7FB09A · 200 #B3D0C3 · 100 #E3EFE9 · 50 #F2F7F4
Brass      --brass-700 #8A6E33 · 600 #A8894B · 500 #BDA05F · 200 #E9DDBE · 100 #F5EEDC
Sage       --sage-900 #171C1A · 700 #3A423E · 500 #67716C · 300 #C3CCC7 · 100 #F4F6F5 · white #FFFFFF
Red        --red-600 #B0483B · --red-100 #F6E5E2      (functional only; absent from marketing)
```

Semantic aliases are also defined so product code targets meaning, not ramp position:
`--color-primary → green-700` · `--color-accent → brass-600` · `--color-success → green-600` ·
`--color-warning → brass-600` · `--color-danger → red-600`.

**Scale tokens:** spacing `4/8/12/16/24/32/48/64`; radius inputs+buttons `8px`, cards `12px`,
modals `16px`, pills `999px`; shadows `card 0 1px 3px rgba(18,41,31,.08)` and
`raised 0 8px 24px rgba(18,41,31,.12)`; focus ring `2px brass-600, offset 2px`.

**Type scale** (comp values, which are marketing-specific and larger than the PRD's app scale):
hero h1 60px/1.02, page h1 46–54px, section h2 38–42px, card h3 16–20px, body 15–19px.
The PRD's app-shell scale (h1 28/36 etc.) is *not* used on marketing pages — that scale is for
data-dense product screens and is explicitly separate.

Dark-mode blocks from the create-next-app scaffold are removed. The site is a single light theme
with dark *bands* (`green-900` / `green-950` sections), not a theme toggle.

---

## 8. Content architecture

Every object in the comp's `renderVals()` becomes a typed module under `content/`. JSX renders;
it never authors copy.

| Module | Contains |
|---|---|
| `nav.ts` | header links, footer columns, CTA labels |
| `home.ts` | hero, 3 problem cards, 3 steps, 8 feature tiles, 3 testimonials, 4 security items, final CTA |
| `product.ts` | hero + stat strip, 5 `hubGroups` (kicker, anchor, title, blurb, 3 items, metric, AppFrame variant), 3 score cards |
| `pricing.ts` | 3 plans, 6 `allPlans`, 4-section comparison matrix, 4 credit examples, 5 wordmarks, 6 FAQ items |
| `about.ts` | 3 stats, mission quote, 4 story entries, 4 values, 6 team members, 4 backers |
| `legal.ts` | 4 documents × { title, updated, intro, sections[] } |
| `contact.ts` · `auth.ts` | field labels, topic options, success copy; auth titles/subs/CTAs per mode |
| `strings/common.ts` | PRD §1.4 shared strings, for reuse by the app phase |

Two payoffs. Copy is still under review, and **prices are genuinely undecided** — PRD §3.3 says
*"tier names/prices TBD by business"* and the comp ships blank prices for Growth and Scale. So:

```ts
type Plan = { name: string; tagline: string; price: string | null; per: string | null; … }
```

Starter renders `"Free"`. Growth and Scale render the designed empty price slot — the honest v1
state, matching the comp. **No prices are invented.** When business decides, it is one file.

---

## 9. Page composition

Section order per page, from the comps. Background bands noted because the light/dark rhythm is
central to the design.

**`/` Home** — Hero (`green-50`, 2-col, ProductShot) → Problem strip (white, 3 cards) → How it works
(`green-900`, `id="how"`, 3 numbered cards) → Feature grid (white, 8 tiles) → Testimonials
(`green-950`, rotating carousel) → Security strip (white page, `green-50` card) → Final CTA
(`green-900`). The hero's `"See how it works"` smooth-scrolls to `#how`.

**`/product`** — Hero (`green-900`, stat strip 26/11/1) → sticky scroll-spy sub-nav (5 pills,
`top: 71px` under the 72px header) → 5 alternating hub sections (`p-overview`, `p-build`, `p-grow`,
`p-fund`, `p-resources`), each with an `AppFrame` variant → "One score" band (`green-950`, 3 cards)
→ CTA (`green-50`).

**`/pricing`** — Header + 3 trust ticks → 3 `PricingCard`s (Growth is dark + "Most popular") →
add-ons banner (`brass-100`) → "In every plan, from day one" (`green-900`, 6 items) → comparison
matrix → "What is an AI credit?" panel → wordmarks → FAQ accordion (6) → CTA card (`green-900`).

**`/about`** — Header → "Why we exist" 2-col + stats card → mission quote band (`green-950`) →
story timeline (4) → values (4) → team (`green-50`, 6 cards + hiring band) → backers → CTA.
Both `"See open roles"` CTAs route to `/contact`, matching the comp (`navContact`); there is no
careers page.

**`/contact`** — Centred 620px form: Name, Email, Topic (Sales/Support/Partnerships/Press), Message.
Submit swaps the form for the success panel. **Client-side stub** — validates, shows success, posts
nowhere. A `TODO` comment names the future endpoint (`POST /api/v1/marketing/contact`).

**Legal ×4** — "← Back home", H1, `Last updated: July 1, 2026`, rule, intro, then `sections[]`.
Each carries the comp's note that final language comes from counsel.

**404** — Large `404` numeral in `green-100`, H1 `"Well, this page didn't survive product-market
fit."`, CTA `"Back home"`. (This copy is identical in PRD §3.5 and the comp.)

**`/login` `/signup`** — Split screen. Left `green-900` panel: logo, italic Spectral quote
`"The co-founder who never sleeps."`, trust line, `© Cofoundaz`. Right `green-50` column, max-width
420px: title, sub, Google + Apple SSO, `"or"` divider, Work email, Password (signup adds help text
`"8+ characters, one number"` and the Terms checkbox; login adds `"Forgot password?"`), CTA, footer
switch link. **Forms do not submit.** Buttons are inert with a `TODO` naming PRD Module 01's
`POST /auth/signup` and `POST /auth/login`. The `"Forgot password?"` link is inert — that route is
out of scope.

**Mock components** — `ProductShot` and `AppFrame` are hand-built HTML/CSS in the comps, not images.
Porting them to React means no asset pipeline, crisp rendering at any DPI, and themeable output.
`ProductShot` includes an SVG `ScoreGauge` with a `ringIn` stroke-dashoffset animation (327→91,
900ms) — the first implementation of PRD §1.2's ScoreGauge, and directly reusable by Module 06.

---

## 10. Responsive design

The comps are **1280px-only** — zero `@media` queries in `Marketing Site.dc.html`, every grid a
hardcoded `repeat(3,1fr)`. Responsive behaviour is therefore *derived design work*, not porting,
and is the largest hidden chunk of this phase.

Breakpoints per PRD §1.1: `sm` <640 · `md` 640–1023 · `lg` 1024–1439 · `xl` ≥1440.
Content max-width 1280px; gutter 24px, 16px at `sm`.

| Element | lg / xl (as designed) | md | sm |
|---|---|---|---|
| Header nav | inline links + both CTAs | logo + "Start free" + hamburger | logo + hamburger |
| Mobile nav | — | slide-over panel, focus-trapped | same |
| Home hero | 2-col, ProductShot right | stacked, shot below copy | stacked, shot scaled, h1 → 38px |
| Problem / Steps | 3-col | 2-col (3rd wraps) | 1-col |
| Feature grid | 4-col | 2-col | 1-col |
| Testimonials | fixed 190px min-height | same | reduced, quote → 20px |
| Security strip | 2-col, 2×2 inner | stacked, 2×2 inner | stacked, 1-col inner |
| Product sub-nav | centred pills | pills wrap | horizontal scroll, no wrap |
| Hub sections | 2-col alternating | stacked, AppFrame below | stacked |
| Pricing cards | 3-col | 3-col, tighter padding | 1-col, **Growth first** |
| Comparison matrix | 4-col grid | 4-col | `overflow-x:auto`, sticky feature column |
| About story | 80px year rail + body | same | year above body |
| Team grid | 3-col | 2-col | 1-col |
| Footer | 4-col | 2-col | 1-col, stacked bottom bar |
| Auth split | 45% / 55% | 40% / 60% | brand panel → slim top bar, form full-width |

Two deliberate exceptions:

- **Comparison matrix scrolls rather than reflows.** A 4-column feature comparison loses its entire
  meaning when stacked; a pinned label column with horizontal scroll preserves it. The scroll
  container gets `tabindex="0"` and an accessible name so keyboard users can reach it.
- **Pricing reorders at `sm`.** Growth ("Most popular") moves first, since a stacked list buries the
  recommended plan below the fold.

---

## 11. Accessibility — WCAG 2.1 AA

PRD §5.5 requires AA. Baseline: semantic landmarks, one `h1` per route, logical heading order,
skip-to-content link, visible focus on every interactive element (`2px brass-600, offset 2px`), 44px
minimum touch targets at `sm`, `lang="en"`, and no keyboard traps.

The comp's own `*:focus-visible{outline:2px solid #A8894B;outline-offset:2px}` already matches the
PRD focus ring and is kept.

### Two deviations from the comps (PRD wins — §2 rule 3)

**D-1 · `brass-600` as text on light backgrounds fails AA.**

Measured contrast ratios:

| Foreground | Background | Ratio | AA normal text (4.5:1) |
|---|---|---|---|
| `brass-600 #A8894B` | white | **3.31:1** | ✗ fail |
| `brass-700 #8A6E33` | white | **4.84:1** | ✓ pass |
| `green-900 #12291F` | `brass-600 #A8894B` | **4.61:1** | ✓ pass |

The comp uses `#A8894B` for every eyebrow/kicker label on light backgrounds (`Pricing`,
`About Cofoundaz`, `The product` on light sections) and for the FAQ `+`/`−` signs. PRD §1.1
anticipates exactly this: `--brass-700` is annotated *"brass text on light bg (AA-safe)"*.

**Fix:** `brass-700` for brass **text on light surfaces**; `brass-600` retained for backgrounds,
borders, and the focus ring. Brass buttons are unaffected — dark text on brass already passes.
Brass text on dark bands (`brass-500 #BDA05F` on `green-900`) is unaffected and passes.

**D-2 · No `prefers-reduced-motion` guard.**

The comp ships a `fadeUp` entrance animation, the `ringIn` gauge sweep, and a 6-second `setInterval`
carousel with no motion guard. PRD §1.2 requires *"Respect `prefers-reduced-motion` (disable all)"*.
The auto-advancing carousel is additionally a WCAG 2.2.2 (Pause, Stop, Hide) issue.

**Fix:** a global `@media (prefers-reduced-motion: reduce)` block disabling all animation and
transition; the carousel does not auto-advance under that query, and gains visible
previous/next/dot controls with `aria-live="polite"` on the quote region regardless.

Both deviations are logged here as the PRD §0 "approved deviation" record.

### Component-level requirements

- **FAQ accordion** — `<button aria-expanded aria-controls>` per item, panel `role="region"` +
  `aria-labelledby`, full keyboard operation. Not a `<details>` element, because the comp's
  single-open behaviour and `+`/`−` affordance need controlled state.
- **Mobile nav** — focus trap, `Esc` closes, focus returns to the trigger, `aria-expanded` on it,
  background inert.
- **Scroll-spy sub-nav** — real anchor links (works without JS); JS only adds the active highlight.
  `scroll-margin-top: 140px` on targets, already present in the comp.
- **Forms** — every control has a real `<label>`, not a placeholder; the Topic `<select>` has an
  accessible name; success states use `role="status"`.
- **Icons** — the comp uses decorative glyphs (`◈ ✦ ⟶ ▤ ✓ ₦ ◆ ★ ⚄ §`) as text. These get
  `aria-hidden="true"` so screen readers do not announce them as content.
- **Status never colour-alone** (PRD §1.1 rule 5) — the "Most popular" badge is a text label, so
  this is already satisfied.

---

## 12. SEO

PRD §3 requires static rendering. Every route is statically generated.

- **Metadata** — `metadataBase` in the root layout; per-route `metadata` exports with unique title,
  description, canonical, and OpenGraph/Twitter cards. Title template `%s · Cofoundaz`.
- **OG images** — `opengraph-image.tsx` via `ImageResponse`, brand-styled (`green-900` ground, brass
  accent, Spectral wordmark). Root default plus per-route overrides for `/`, `/product`, `/pricing`.
  Note the Next 16 change: `params` and `id` arrive as Promises.
- **`app/sitemap.ts`** — typed `MetadataRoute.Sitemap`, all 9 indexable routes (the 11 shipped
  routes minus `/login` and `/signup`) with sensible `changeFrequency` and `priority`.
- **`app/robots.ts`** — typed `MetadataRoute.Robots`, allow all, `disallow: ['/login','/signup']`,
  sitemap reference.
- **JSON-LD** — `Organization` sitewide, `SoftwareApplication` on `/product`, `FAQPage` on `/pricing`
  (the 6-item accordion is genuine rich-result material).
- **Semantics** — one `h1` per page, descriptive link text, `alt` on any meaningful image.

---

## 13. Analytics

PRD §5.6 names the events (`signup_started`, `nav_item_clicked`) but **no provider**, and none is
chosen. `lib/analytics.ts` exports a typed no-op:

```ts
export function track<E extends keyof MarketingEvents>(event: E, props: MarketingEvents[E]): void
```

Call sites are correct from day one — every "Start free" fires `signup_started` with its source
section; nav clicks fire `nav_item_clicked`. Swapping in the real provider is one file.

**Open decision for the business: which analytics provider.** Flagged, not guessed.

---

## 14. Verification

Per PRD Part 6 "Definition of Done", adapted to a pre-auth site (no RBAC or four-state screens apply).

| Check | Command / method | Bar |
|---|---|---|
| Build | `npm run build` (Turbopack) | clean, all 11 routes marked static |
| Types | `npx tsc --noEmit` | zero errors |
| Lint | `npm run lint` | zero errors |
| Accessibility | axe on every route | zero violations |
| Keyboard | manual walkthrough per route | full operation, visible focus, no traps |
| Contrast | verify D-1 fix | all text ≥ 4.5:1 (≥ 3:1 for ≥24px) |
| Reduced motion | emulate `prefers-reduced-motion` | no animation, carousel paused |
| Responsive | 375 / 768 / 1280 / 1440 | no horizontal overflow, matches §10 |
| Lighthouse | `/`, `/product`, `/pricing` | SEO ≥ 95, a11y ≥ 95 |
| Copy parity | diff rendered strings vs comp | exact match incl. punctuation style |

---

## 15. Open decisions

| ID | Decision | Owner | Blocking? |
|---|---|---|---|
| D-01 | Plan prices for Growth and Scale (PRD §3.3 "TBD by business") | Business | No — empty slot ships, matching the comp |
| D-02 | Analytics provider | Business / Eng | No — no-op shim ships |
| D-03 | Legal copy from counsel; comp text is placeholder and says so | Legal | No — pages ship with the stamp |
| D-04 | Production domain for `metadataBase`, sitemap, canonicals | Business | No — env var with a sensible default |
| D-05 | Real testimonials, team, and backers (comp values are plausible placeholders) | Business | No |

---

## 16. Follow-ups (next phases)

1. Blog + Help Center (comps exist and are complete — a fast follow).
2. `POST /api/v1/marketing/contact` and `/newsletter` in `cofoundaz-api`, replacing the stub.
3. Wire the auth shells to PRD Module 01, plus the remaining auth routes.
4. Promote `ui/` to `packages/ui` when `apps/admin` is built.
5. Generate `packages/api-client` from the FastAPI OpenAPI schema (PRD §5.0) — the contract that
   makes frontend/backend drift impossible.
