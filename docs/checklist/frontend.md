# Cofoundaz Frontend — Master Build Checklist

The single, always-current map of the FE build. Complements SOPs (`docs/sop/`)
and the design spec (`docs/superpowers/specs/`). Keep it honest — an item is
checked only when done **and** verified (gates green).

## Snapshot
- ✅ Done: Marketing site · Design-token system · CI + pre-commit hook · Product-app **UI scaffolding**
- 🟡 In progress: Product app (static mock UI, pending API wiring)
- ⛔ Not started: API integration · Auth wiring · Dashboard e2e/a11y coverage

Legend: `[x]` done+verified · `[ ]` not done · 🟡 partial

---

## 1. Marketing site — ✅ done
- [x] Home, Product, Pricing, About, Contact, 4 legal pages, 404
- [x] Auth shells (`/login`, `/signup`) — presentational only
- [x] Design-token system (`app/globals.css` @theme; Evergreen + Copper + Sage)
- [x] Brass → Copper brand migration (accent `#9C5B34`, WCAG AA)
- [x] Responsive (base = sm; `md/lg/xl`), a11y (axe e2e, WCAG AA)
- [x] SEO (metadata, sitemap, robots, OG), 188→ unit + e2e green

## 2. Design system + tooling — ✅ done
- [x] Token ramps (green/copper/sage/red) + radii/shadows/fonts, defaults cleared
- [x] `ui/tokens.test.ts` guards (no default palette / `sm:` / cleared utilities)
- [x] CI workflow (`typecheck · lint · test · build` + e2e) on `develop`/`main`
- [x] Pre-commit hook (`scripts/precommit-checks.mjs`) — token scan + ESLint on staged files
- [x] Hand-off + styling guides (`docs/frontend-handoff.md`, `docs/dashboard-styling.md`)

## 3. Product app (dashboard) — 🟡 UI built, not wired
UI scaffolding shipped and tokenized (PR #10, #14). **All pages are static mock data.**
- [x] App shell: centralized `Sidebar` (context) + `DashboardNavbar` + `(dashboard)/layout.tsx`
- [x] Core screens: Dashboard, Today's Mission, Health Score, Roadmap (+ sub-routes), AI Co-Founder, Assessment
- [x] Hubs: Business Builder, Validation, Marketing, Sales, Finance, Funding, Investor Readiness, Legal & Compliance
- [x] Ops screens: Settings, Team, Notifications, Calendar, Journal, Documents, Analytics/Reports, Marketplace, Learning Academy
- [x] Admin: Admin Portal, Super-Admin
- [ ] **Wire every screen to `cofoundaz-api`** (auth, Health Score, Assessment, Roadmap, …) ← next major body of work
- [ ] Replace mock data with real fetching + loading/empty/error states
- [ ] Add dashboard routes to the e2e + axe sweep (currently marketing-only)

## 4. Backlog / upcoming
- [ ] API integration guide consumption (per `cofoundaz-api` fe-integration guides)
- [ ] Real auth flow (login/signup → API; forgot/reset, verify, invites)
- [ ] Contact / newsletter backend (replace client stub)
- [ ] Blog + Help Center (nav/footer links already stubbed)

## 5. Deferred follow-ups (non-blocking)
- [ ] Sync `main` with `develop` (currently 18 commits behind)
- [ ] Clear 91 `no-unused-vars` warnings across dashboard pages
- [ ] Resolve the two homes (`app/home/page.tsx` vs `app/(marketing)/page.tsx`)
- [ ] Convert remaining hardcoded green/neutral hexes in dashboard to token classes
