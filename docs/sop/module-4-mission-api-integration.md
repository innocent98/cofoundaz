# SOP — Module 4: Today's Mission (real API integration)

## What shipped

The Today's Mission screen (`/mission`) and its Settings sub-page
(`/mission/settings`) now read and write the live `cofoundaz-api`
(`/api/v1/missions/*`) instead of local mock state. Real streak, the
`no_roadmap` empty-state, and a live settings read/write round-trip are verified
on staging. Branch `feat/api-mission` → PR into `develop`.

## Why

`useMissionApi` was pure local mock state — canned tasks, a hardcoded "6-day
streak", client-only toggle/add/snooze/reject/reorder, and settings that never
left the browser. Nothing hit the API.

## How — key decisions

- **`GET /missions/today` is a lazy-generated state machine.** It returns
  `{status:"no_roadmap"}` (no mission possible — no roadmap yet), a real mission
  (`pending`/`complete`) whose `tasks[]` can be empty on a weekend-off day, or a
  populated mission. The hook collapses these into a `state` enum
  (`no_roadmap` / `empty` / `pending` / `complete`) and the page branches on it.
- **`status` is the completion source of truth (guide §6).** `allCompleted` is
  derived from `state === 'complete'`, not from counting tasks — a `complete`
  mission can legitimately show `completed < total` when a custom task was added
  after the day was cleared. Every task action re-fetches `/today` because the
  single-task response doesn't carry the mission-level status.
- **API ↔ FE mapping in the hook** (keeps both consumer pages unchanged):
  - task `status` `todo/done` → `pending/completed`; `snoozed`/`rejected` kept.
  - `effort` enum `small/medium/large` → `Small/Medium/Large` label.
  - `reason` is `null` on custom tasks → mapped to `''` and the reason line is
    hidden; `roadmap_task_id`/`reason` presence drives the milestone chip
    (`Custom` vs the milestone name parsed from the reason string) — guide §1 traps.
  - settings: `weekend_missions` (API) is the **inverse** of `weekendsOff` (FE);
    `delivery_time` is a bare `"HH:MM:SS"` 24h string ↔ the select's
    `"HH:MM AM/PM"` (converters both ways).
- **Task actions → real endpoints, optimistic + reconcile.** `complete`
  (one-way — toggle no longer un-completes), `snooze`, `reject`
  (`reject_reason` constrained to the three allowed chips), reorder
  (two `reorder` PATCHes to swap neighbours' `order`), add
  (`POST /missions/tasks`). A `404` drops the task from local state (guide §7).
- **Health pill wired.** The `/mission` route shell no longer hardcodes `72` —
  it shows the real Health Score or hides until an assessment exists (same
  pattern as Module 3).

## What's involved

- `hooks/useMissionApi.ts` — full rewrite: real fetch/mutations, `RawTask`/
  `RawSettings` mappers, `state`/`streak`/`missionDate` exposed, time + weekend
  converters.
- `app/(dashboard)/mission/page.tsx` — real streak pill, `no_roadmap`
  empty-state, reason line hidden for custom tasks.
- `app/(dashboard)/mission/layout.tsx` — Health pill gated on real state.

## Verification

- **Live (staging, test account — onboarding not complete, so no roadmap):**
  - `GET /missions/today` → **200** `{status:"no_roadmap"}`; `/mission` renders
    "Your mission comes from your roadmap" + a roadmap CTA. Health pill hidden.
  - `GET /missions/settings` → **200** `{mission_size:3, delivery_time:"06:00:00",
    weekend_missions:false}`; the page renders size 3 selected, "06:00 AM", and
    weekends-off on.
  - **`PATCH /missions/settings` round-trip verified live:** clicking size 2
    persisted `mission_size:2` server-side; restoring to 3 persisted `3`. Account
    left in its original state.
  - `GET /missions/history` → **200** `{missions:[], weekly_completion_pct:0}`.
- Gates: `typecheck` 0 · `lint` 0 errors · **188** unit · clean `build` ✓.

## Follow-ups

- **Task-action flows are coded to the guide/captures but not exercisable live**
  on this account — there are no tasks without a roadmap. Once onboarding + a
  roadmap exist, verify `complete` (and the mission flip to `complete` + streak
  increment), `snooze`, `reject`, `reorder`, and custom-task add end-to-end.
- **Role-gating:** writes are `founder`/`team_member`-only (a mentor gets `403`).
  The current test account is the founder; the UI does not yet hide write
  affordances for a mentor — add role-based gating when membership role is
  surfaced to the FE.
- **Sub-pages still on their own data:** `/mission/completed`, `/mission/upcoming`,
  `/mission/streaks` (history/streak views) should consume `GET /missions/history`.
- Reorder uses two PATCHes to swap `order`; revisit if the API later exposes a
  bulk reorder.
