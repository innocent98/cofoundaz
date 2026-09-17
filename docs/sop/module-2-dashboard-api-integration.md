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

## Update — widgets finished (real values + honest empty-states)

The Module 2 follow-up is now done. The dashboard home renders **real** summary
data instead of static sample numbers:

- **Hook now maps the real nested shape.** `useDashboardSummary` gained
  `mapSummary()` which transforms the live payload (`health`/`mission` objects,
  a `kpis` **object** of mostly-null metrics, `briefing`/`risks`/`opportunities`
  `{status,message}` empty-states, `greeting`) onto the flatter shape the widgets
  read: `health.deltaWeekly` ← `delta_7d`, `mission.streakDays` ← `streak`,
  `mission.tasks[].completed` ← `status === 'done'`, and a fixed 5-card `kpis[]`
  array from the metric object.
- **KPIs show "—" for untracked metrics** (revenue/runway/pipeline/CTR are `null`
  on this account) and the real integer for tasks-this-week — never a fabricated
  `₦1.6M`/`8.4 mo`. Decorative sparklines are hidden on no-data cards (`hasData`).
- **Page fallbacks that masked real zeros were removed** — the health weekly
  delta (`|| '+4'` → real `0`), mission streak (`|| 6` → real, pill hidden at 0),
  the health blurb (hardcoded → real `health.summary`), and the AI-briefing
  paragraph (fake → real `briefing.message`).
- **Verified live (account onboarded + assessed this session):** greeting "Good
  evening, Ade" / "Here's where Kolo stands", health summary "…is 90 (thriving).
  Your weakest area is Financial.", 3 real mission tasks (one already `done`),
  KPIs `— — — — 1`, real briefing empty-state. No fake numbers remain. Gates:
  typecheck 0 · lint 0 errors · 188 unit · build ✓.

Remaining follow-up: on a hard API error the hook still falls back to
`DEFAULT_SUMMARY` (sample numbers) rather than an empty state — acceptable
graceful-degradation, but could be made an explicit error state later. The
`risks`/`opportunities` AI panel is a later module (kept as `[]`).

## Follow-ups (original — plumbing)

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
