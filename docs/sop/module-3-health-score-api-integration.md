# SOP — Module 3: Health Score (real API integration)

## What shipped

The Health Score **overview** (`/health`) now reads the live `cofoundaz-api`
(`GET /api/v1/health-score`) instead of mock data, and correctly renders the
two-state machine: the `pending_assessment` empty-state (verified live) and the
`ok` scored state (coded to the committed capture). The Health pill in the
`/health` route shell and the `/dashboard` navbar no longer show a hardcoded
`72` — they show the real score, or nothing until an assessment exists. Branch
`feat/api-health-score` → PR into `develop`.

## Why

`useHealthScore` was a **pure mock** — it returned canned data and never
fetched. Every Health Score screen (and the Health pills in the app shell)
therefore displayed a fabricated `72` and fake dimensions/recommendations,
regardless of the workspace's real state.

## How — key decisions

- **Two-state machine, keyed off `data.status`.** `GET /health-score` returns
  either `pending_assessment` (score/band `null`, empty `dimensions` /
  `top_recommendations`, a `message`) or `ok` (score 0–100, band, exactly 5
  dimensions, top recommendations, `summary`, `delta_7d`). It is synchronous —
  no polling; the FE re-fetches once after the kickoff assessment completes.
  The hook exposes `status` and the page branches on it.
- **API shape → existing consumer shape.** The API returns `dimensions` as an
  **array of 5** keyed `product/market/money/legal/team`; the FE's three Health
  pages already consume a `Record<DimensionKey>` keyed `…/financial/…`. To ship
  the overview without breaking the two sub-routes, `useHealthScore` maps the
  array → the Record, translating the API key **`money` → FE `financial`** (the
  one key whose label ≠ key; guide §1b). Routing keys off the FE key; the guide's
  "key off `key`, not array position" rule is honored (we build a keyed map, not
  positional access).
- **Real values replace invented copy.** The AI-summary line uses the API's
  `summary`; the weekly pill uses `delta_7d`; per-dimension tiles derive colour +
  caption from each dimension's `band` (at_risk / needs_work / healthy /
  thriving) instead of hardcoded "+2 this week" strings. The old static
  "fastest points are in financials" paragraph was removed.
- **`estimated_lift` stays hedged.** Rendered as `est. +N pts` (guide §5 forbids
  presenting it as a committed outcome).
- **Empty-state CTA → `/assessment`.** Uses the API's own `message` as copy.
- **Health pills gated on real state.** The `/health` layout shell and the
  `DashboardNavbar` (used on `/dashboard`) now call `useHealthScore` and render
  the pill only when `status === 'ok'`, showing `score` + an up/down arrow from
  `delta_7d`. Pending/loading → the pill is hidden rather than faking a number.
- **Failure is safe.** On 401/error the hook falls back to the empty-state
  (CTA), never a crash; the hook initializes to an empty pending state so the
  three consumer pages read `data.dimensions.<key>.score` on first paint without
  null guards.

## What's involved

- `hooks/useHealthScore.ts` — real fetch + envelope unwrap + `RawOverview`→
  `HealthScoreData` mapper (`DIM_META`, `bandToStatus`, `emptyDimensions`),
  `status` exposed, `EMPTY_STATE` default.
- `app/(dashboard)/health/page.tsx` — `loading` / `pending_assessment` / `ok`
  branches; `PendingState` + `LoadingState`; `MetricCard` driven by `band`; real
  `summary`/`delta`.
- `app/(dashboard)/health/layout.tsx`, `components/dashboardnavbar.tsx` — Health
  pill wired to real score, hidden until `ok`.

## Verification

- **Live (staging, test account in `pending_assessment`):** `GET /health-score`
  → **200** `{status:"pending_assessment", …}`; `/health` renders "Your Health
  Score is waiting" + the API `message` + a "Take your assessment" CTA; both
  Health pills (route shell + navbar) are **hidden**. No crash, no fake `72`.
- **`ok` state:** mapping coded to the committed capture
  `cofoundaz-api/e2e/_captures/health_score/overview_ok.json` (score 31, band
  `at_risk`, 5 dims, 3 recs). **Not exercisable live on this account** (no
  assessment completed) — labelled here rather than silently assumed.
- Gates: `typecheck` 0 · `lint` 0 errors (pre-existing warnings only) · **188**
  unit · clean `build` ✓.

## Follow-ups

- **Verify the `ok` path** once the kickoff assessment is completed for a test
  account (re-fetch flips `pending_assessment` → `ok`).
- **Sub-routes still on mock data**, each has its own endpoint to wire:
  `/health/dimensions/{key}` (`GET /health-score/dimensions/{dim}` — signals +
  trend; note it takes `money`, not `financial`), `/health/recommendations`
  (`GET …/recommendations` + founder-only `accept`/`dismiss`),
  `/health/history` (`GET …/history?range=`), `/health/benchmarks`
  (`GET …/benchmarks` — usually `insufficient_data`).
- **Other route shells still hardcode `72`.** ~10 `app/(dashboard)/*/layout.tsx`
  files duplicate the navbar with a static Health pill (sales, roadmap,
  business-builder, mission, assessment, …). A shared-navbar refactor should
  wire them all off `useHealthScore`; out of scope for this module.
- `dismissRecommendation` remains client-only (overview has no dismiss control);
  the real founder-only endpoint is wired with the recommendations sub-route.
