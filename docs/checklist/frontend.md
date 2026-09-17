# Cofoundaz Frontend — Master Build Checklist

The single, always-current map of the FE build. Complements SOPs (`docs/sop/`)
and the design spec (`docs/superpowers/specs/`). Keep it honest — an item is
checked only when done **and** verified (gates green).

## Snapshot
- ✅ Done: Marketing site · Design-token system · CI + pre-commit hook · Product-app UI scaffolding · Local mock API + typed client · **Real API — Auth/session (Module 0)** · **Onboarding (Module 1)**
- 🟡 In progress: Real `cofoundaz-api` integration, module by module (✅ auth → ✅ onboarding → ~ dashboard → ~ health score → …)
- ⛔ Not started: Dashboard e2e/a11y coverage

## Real API integration (replacing the mocks, module by module)
Client points at the real API (`NEXT_PUBLIC_API_BASE_URL`; local dev proxies `/api/v1` → staging same-origin via `next.config`). Each module: build to its `cofoundaz-api/docs/fe-integration-guide-*.md`, verify live, retire its mock.
- [x] **Module 0 — Auth & session** — login authenticates live; post-login routing (→ onboarding/dashboard) via `/onboarding/state` (envelope fix); `/verify-email/{token}` + `/reset-password/{token}` email-link routes; verified live on staging
- [x] **Module 1 — Onboarding** — wizard runs live: resume/autosave (`PATCH /onboarding/state`), envelope+nesting flattened, Country as ISO select (fixes a backend 500), complete-gate `field_errors` surfaced; verified on staging
- [x] **Module 2 — Dashboard** — `X-Workspace-Id` header (cross-cutting, in client), `summary`+`activity` live; **widgets finished**: hook `mapSummary()` maps the real nested shape (health/mission objects, kpis metric-object → 5 cards, briefing/risks/opps empty-states), page shows real values + honest "—" for untracked KPIs (no fabricated ₦1.6M/streak), sparklines hidden on no-data. **Verified live** (greeting "Ade", health 90/thriving summary, real tasks, KPIs `— — — — 1`). Follow-up: error path still falls back to sample `DEFAULT_SUMMARY`
- [~] **Module 3 — Health Score** — overview (`/health`) wired to real `GET /health-score`: two-state machine, array-of-5 dims → Record (`money`→`financial`), real `summary`/`delta_7d`/`band`, `est.`-hedged recs; Health pills (route shell + `/dashboard` navbar) show real score or hide (no more hardcoded `72`). **Both states verified live** — `pending_assessment` empty-state AND the `ok` state (score 90/thriving, 5 real dims). **Follow-up:** wire sub-routes (dimensions/recommendations/history/benchmarks); other route shells still hardcode `72`
- [~] **Module 4 — Today's Mission** — `/mission` + `/mission/settings` wired to real `/api/v1/missions/*`: `GET /today` state machine, real streak, task actions, settings GET + **PATCH round-trip verified live** (3→2→3), `weekend_missions`↔`weekendsOff` + `HH:MM:SS`↔12h conversions, Health pill de-hardcoded. **Verified live:** `no_roadmap` empty-state AND (post-roadmap) real roadmap-drawn tasks + a **task-complete round-trip** (checkbox → server `done`). **Follow-up:** snooze/reject/reorder/add live; mentor role-gating; wire completed/upcoming/streaks to `/history`
- [~] **Module 5 — Roadmap (tree read)** — `GET /roadmap` (lazy-generated tree) wired into `useRoadmapApi`, feeding real phase→milestone→task data to Timeline + Kanban + Milestones + drawer + `getAllTasks`; API→FE mapping, loading/empty states, Health pill de-hardcoded; **verified live** (real phases/milestones/tasks). **Follow-up (writes):** phase/milestone/task CRUD, dependencies persist + `409` cycle, templates, AI re-plan, generate, mentor role-gating
- [~] **Module 6 — Business Builder (overview)** — `/business-builder` grid wired to real `GET /business-builder/overview`: 9 rows (5 canvases `completion_pct` + 4 record kinds `count`), real ring/count per card, Health pill de-hardcoded; **verified live** (created a persona → card shows "1 item"; health pill "90"). **Follow-up (editors):** canvas GET/PUT via `block_defs` + `409` conflict, record CRUD (plural paths `personas`/`revenue-streams`/`competitors`/`pricing`) from `fields`, positioning map, AI-fill, suggestions approve/reject
- [ ] Journal · Notifications · Documents (all now unblocked by the `X-Workspace-Id` header)
- [ ] Backend/ops: confirm `APP_BASE_URL` = FE origin (email links); CORS for app origin (or keep dev proxy)

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
- [x] **Local mock API layer** (PR #17) — 78 `app/api/v1/*` handlers (canned JSON, OpenAPI-shaped) + typed client SDK (`lib/api/*`) + `useDashboardApi`/`useBusinessBuilderApi` hooks
- [x] Auth + onboarding pages consume the mock API (`/api/v1/auth/*`, onboarding)
- [ ] Consume the API from the **dashboard pages** (hooks exist; most pages still render static inline data)
- [ ] **Wire to the real `cofoundaz-api`** — flip `NEXT_PUBLIC_API_BASE_URL` off the mocks; replace canned data with real fetching + loading/empty/error states ← next major body of work
- [ ] Decide mock-handler fate in production (they currently ship as app routes)
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
