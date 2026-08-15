# Cofoundaz — Web Frontend

> **The co-founder who never sleeps.** Cofoundaz is an AI operating system for
> founders — one connected workspace that takes a startup from idea to
> profitability with a bench of AI advisors, a living roadmap, a Health Score,
> and a clear next step every single day.

This repository is the **Next.js frontend**. The API lives in a separate repo
(`cofoundaz-api`) and is **not** wired up yet — see [Status](#status) and
[Roadmap](#roadmap).

---

## What's in this repo

Phase 1 is the **public marketing website** plus unwired auth page shells. It
also establishes the design-token layer and the shared UI primitives that the
product app (26 modules, still to come) will reuse — so it's as much a
foundation as a website.

| Area | State |
|---|---|
| Marketing site (11 routes + branded 404) | ✅ Shipped, statically rendered |
| Design tokens + shared primitives | ✅ Shipped (`app/globals.css`, `ui/primitives/`) |
| Auth pages (`/login`, `/signup`) | 🟡 Presentational shells only — no submit wiring |
| Contact form | 🟡 Client-side stub — no backend |
| Real authentication, dashboard, product modules | ⛔ Not started (separate phase) |

---

## Tech stack

- **[Next.js 16](https://nextjs.org)** (App Router, React 19) — statically rendered pages
- **TypeScript 5** (strict)
- **[Tailwind CSS v4](https://tailwindcss.com)** — tokens defined in-CSS via `@theme` (no `tailwind.config.js`)
- **Fonts:** Spectral (display) + Hanken Grotesk (body), via `next/font/google`
- **Testing:** [Vitest](https://vitest.dev) + Testing Library (unit) · [Playwright](https://playwright.dev) + [axe-core](https://github.com/dequelabs/axe-core) (e2e, accessibility, responsive)
- **Lint:** ESLint 9 (`eslint-config-next`)
- **Package manager:** npm

> ⚠️ **Read [`AGENTS.md`](./AGENTS.md) first.** This is Next.js **16**, which has
> breaking changes from older versions you may know. When in doubt, consult the
> bundled docs at `node_modules/next/dist/docs/` before writing code.

---

## Getting started

**Prerequisites:** Node.js **20+** and npm.

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local
#   then edit .env.local — set NEXT_PUBLIC_SITE_URL (used for metadata,
#   canonicals, sitemap, and OG image URLs)

# 3. Run the dev server
npm run dev
```

Open **http://localhost:3000**.

First time running e2e tests? Install the Playwright browsers once:

```bash
npx playwright install
```

---

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server (http://localhost:3000) |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` (strict type check) |
| `npm test` | Unit tests (Vitest, single run) |
| `npm run test:watch` | Unit tests in watch mode |
| `npm run test:e2e` | Playwright e2e + accessibility + responsive suites |

**Before opening a PR, all of these must pass:** `typecheck`, `lint`, `test`, `test:e2e`.

---

## Project structure

```
app/                         # Next.js App Router
  layout.tsx                 # Root layout — fonts, <html lang>, metadataBase
  globals.css                # ★ Design tokens (Tailwind v4 @theme) live here
  not-found.tsx              # Branded 404
  sitemap.ts robots.ts       # SEO route handlers
  opengraph-image.tsx        # Default OG card (ImageResponse)
  (marketing)/               # Route group WITH site header/footer
    layout.tsx               #   skip-link + SiteHeader + <main> + SiteFooter
    page.tsx                 #   Home
    product/ pricing/ about/ contact/
    (legal)/                 #   terms · privacy · security · cookies (shared template)
  (auth)/                    # Route group WITHOUT chrome (login/signup shells)

ui/                          # All React components (portable — no app-specific imports)
  primitives/                #   Button, Card, Badge, Field, Container, SectionHeading
  marketing/                 #   SiteHeader, MobileNav, Hero, PricingCard, ... (page sections)
  mocks/                     #   AppFrame, ProductShot (marketing illustration of the app)

content/                     # ★ All copy lives here as typed modules (home.ts, pricing.ts, ...)
                             #   Components render structure; content modules own the words.
lib/                         # cn() class-merge, seo builders, typed analytics no-op
e2e/                         # Playwright specs (accessibility.spec.ts, responsive.spec.ts)
docs/                        # ★ SOPs (docs/sop/) and design spec/plan (docs/superpowers/)
public/                      # Static assets
```

---

## Architecture & conventions

Read these before making changes — they're what keep the codebase consistent.

- **Two brand colors, enforced by the tokens.** `app/globals.css` clears
  Tailwind's default palette and defines exactly the PRD ramp: **Evergreen**
  (primary green) and **Copper** (accent — `copper-600 #9C5B34`) plus a neutral
  "Sage" ramp. This makes rules like *"one accent CTA per screen"* greppable and
  testable rather than a matter of taste. Don't reintroduce arbitrary hex values
  or off-ramp colors — `bg-blue-500` won't even compile.

- **Content is separate from components.** Every page's copy is a typed module
  in `content/` (shapes in `content/types.ts`). Components import content and
  render structure. To change wording, edit `content/`, not the component.

- **Primitives first.** Buttons, cards, badges, headings, and layout come from
  `ui/primitives/`. Compose these instead of hand-rolling styled elements, so
  spacing, focus rings, and variants stay uniform. `ui/` and `content/` must not
  import anything app-specific (they're built to be promoted to a shared package
  later).

- **Accessibility is a requirement, not a nicety.** The site targets WCAG 2.1
  AA. There's an axe-core e2e sweep, plus invariant tests (e.g. exactly one
  accent CTA visible per viewport, one `<h1>` per route, working skip link,
  reduced-motion respected). New UI is expected to hold the line.

- **Responsive from `sm` up.** Base styles are the small-screen design; only
  `md:` / `lg:` / `xl:` prefixes exist (no `sm:`).

- **Every substantive change gets an SOP.** After shipping a feature/fix/refactor,
  add or update a doc in `docs/sop/` (see existing examples). A teammate should
  understand the change from the SOP alone. The pre-work design spec and plan
  live under `docs/superpowers/`.

---

## Testing

- **Unit** (`npm test`) — Vitest + Testing Library over `ui/`, `content/`, and
  `app/`. Covers primitives, page sections, content integrity, and component
  behavior (188 tests at last run).
- **E2E / a11y / responsive** (`npm run test:e2e`) — Playwright drives every
  route across breakpoints: axe accessibility scans, the design-system
  invariants above, focus management, and the responsive layout checks.

Write tests alongside changes; both suites must be green before merge.

---

## Status

**Phase 1 (marketing website) is shipped and verified** — 11 routes plus a
branded 404, the design-token layer, the shared primitives, SEO
(metadata/sitemap/robots/OG/JSON-LD), and WCAG AA accessibility. The most recent
work refreshed the brand accent from brass to **Copper** and fixed a couple of
mobile-nav issues (see `docs/sop/`).

**What is intentionally not here yet:** any real authentication, a contact/
newsletter backend, the dashboard, the 26 product modules, and the admin
consoles.

---

## Roadmap

Roughly in order:

1. **Wire auth** — connect the `/login` and `/signup` shells to `cofoundaz-api`
   (plus the missing flows: forgot/reset password, email verify, invites).
2. **Contact + newsletter backend** — replace the client-side stub.
3. **The product app** — the authenticated experience: onboarding assessment →
   Health Score → roadmap → AI advisors, built as the 26 product modules on top
   of the primitives established here.
4. **Admin / super-admin consoles.**
5. **Blog + Help Center** (nav/footer links are already stubbed in `content/nav.ts`).

---

## Handoff guide — starting fresh

If you're picking this up cold, do this in order:

1. **Skim the design source of truth:** `docs/superpowers/specs/` (the spec) and
   `docs/sop/` (what's actually shipped and why). These explain the *why* behind
   the structure.
2. **Read [`AGENTS.md`](./AGENTS.md)** — the Next.js 16 caveat is real.
3. `npm install`, set up `.env.local`, `npm run dev`, and click through all 11
   routes at desktop and mobile widths to build a mental map.
4. Run the full gate once so you know what green looks like:
   `npm run typecheck && npm run lint && npm test && npm run test:e2e`.
5. **Trace one page end-to-end** — e.g. `app/(marketing)/pricing/page.tsx` →
   the `ui/marketing/pricing/*` sections it composes → `content/pricing.ts`.
   That triangle (route → components → content) is the pattern everywhere.
6. Then start on the [Roadmap](#roadmap).

### Git workflow

- `develop` is the integration branch and the default branch. `main` currently
  holds the initial scaffold; releases will flow `develop → main` later.
- Branch off `develop`, open a PR **into `develop`**, keep all four gates green.
- One logical change per commit; write clear commit messages.

---

## Deployment

Static Next.js build (`npm run build`). Set `NEXT_PUBLIC_SITE_URL` to the real
origin (no trailing slash) in the deploy environment so metadata, canonicals,
the sitemap, and OG images resolve correctly.
