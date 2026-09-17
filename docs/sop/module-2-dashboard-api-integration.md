# SOP — Module 2: Dashboard (real API integration)

## What shipped

The dashboard home screen now pulls from the live `cofoundaz-api` — greeting,
workspace, and the summary/activity feeds load real data — and the
**cross-cutting workspace-header** support that every product module needs is in
place. Branch `feat/api-dashboard` → PR into `develop`.

## Why

The dashboard aggregates the whole product (`GET /dashboard/summary`). It was
already wired to `useDashboardSummary`, but returned 422 and fell back to static
data because the required workspace header was missing — and two response-shape
mismatches crashed the page once real data flowed.

## How — key decisions & fixes

- **`X-Workspace-Id` header (cross-cutting).** Workspace-scoped endpoints
  (dashboard, roadmap, health, mission, …) require `X-Workspace-Id` sourced from
  `/auth/me` → `active_workspace_id`. Added it centrally in `lib/api/client.ts`
  (from `localStorage.cf_workspace_id`), and the login page now stores
  `cf_workspace_id` from `/me`. This unblocks **all** future workspace modules,
  not just the dashboard.
- **Briefing 404 handled.** `useAIBriefing` called `/dashboard/briefing/today`,
  which doesn't exist in v1 (the AI panel is Module 03; the briefing empty-state
  ships inside `/dashboard/summary`). A 401/403/**404** is now swallowed to the
  static `fallbackText` instead of crashing.
- **`risks`/`opportunities` normalized.** The summary returns these as
  `{status,message}` empty-state **objects** in v1, but the page does `.map()`.
  The hook now coerces non-arrays to `[]` (was `?? []`, which didn't catch a
  truthy object) — fixing a `map is not a function` crash.

## What's involved

- `lib/api/client.ts` (X-Workspace-Id), `app/(auth)/login/page.tsx` (store
  `cf_workspace_id`), `hooks/useDashboardApi.ts` (briefing 404 + risks/opps).

## Verification (live against staging)

- `GET /dashboard/summary` → **200** (with the header; was 422 without),
  `GET /dashboard/activity` → **200**.
- Dashboard renders: **"Good afternoon, Ade"**, **"Here's where Kolo stands"**,
  workspace "Kolo" in the sidebar — all real. No crashes.
- Gates: `typecheck` 0 · `lint` 0 errors · **188** unit · `build` ✓.

## Follow-ups (important — the plumbing works, the widgets need finishing)

- **Widgets still mask empty/pending state with static sample data.** For this
  fresh account the real values are empty (`health.status:"pending_assessment"`,
  `mission:null`, `kpis` null/0), but the page's `summaryData?.x || <static>`
  fallbacks show fake numbers (72 health, ₦1.6M revenue, a mock mission). Replace
  those with the real empty-states widget-by-widget (health → "complete your
  assessment", `mission===null` → empty, null KPIs → "—"). Honor the guide's
  traps: sections can be `{"error":true}`; `mission` can be `null`;
  `calibration.assessment_complete` is nested.
- **Verify the non-empty path:** complete onboarding + the kickoff assessment for
  the test account so `health`/`mission`/`kpis` return real values, then confirm
  the widgets render them.
- Backend: the standalone AI-briefing endpoint arrives in Module 03; the
  onboarding `country` 500 (from Module 1) still wants a backend `422`.
