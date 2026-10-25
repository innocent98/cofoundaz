# SOP — Today's Mission brought fully to the PRD (Module 04)

## What shipped

The five Today's Mission pages (`/mission`, `/upcoming`, `/completed`, `/streaks`, `/settings`) and their shell now meet
PRD Module 04 (§04.1 to §04.5) and §2.1, with no mock data, no dead controls and no invented defaults. One FE PR to
`develop`. **It depends on BE PR innocent98/Cofoundaz-api#135** (milestone chips, `empty_reason`, `assigned_to_me`,
`/missions/upcoming`, `/missions/upcoming/order`, `/missions/completed`, streak fields, delivery time). Checklist:
`docs/checklist/mission-prd-gaps.md`. Contract: BE `docs/fe-integration-guide-mission-prd.md`.

## Why

The live walkthrough found 15 gaps: no why-line or milestone chip, no pending/generating state, a no-roadmap state with
its own copy, no reject/snooze confirmation, an unreachable "⋯" menu, an Upcoming that was not the next 7 days and could
not be reordered, a Completed with no task log and a stray "1/5", no best streak, non-radio size options, a top bar
without search/Invite, and no team-member view.

## How

| Area | Approach |
|---|---|
| Today | `useMissionApi` starts `loading` (page shows "Building today's mission from your roadmap…"), has an `error` state with Try again, never a fake empty mission. `MissionTaskCard` renders "Why: {reason}", a milestone chip and the "⋯" menu (Escape and outside click close it, focus returns to the trigger; always visible; named checkbox and button). `empty_reason` copy, "Assigned to you" from `assigned_to_me`, reject/snooze toasts, confetti only when the founder finishes in this visit |
| No roadmap | `RoadmapEmptyState`: "Your mission comes from your roadmap." + "Generate my roadmap" → `POST /roadmap/generate` (synchronous, no polling) → refetch. Shared by Today and Upcoming |
| Upcoming | `useMissionUpcoming` + page: 7 day list, "Tomorrow", rest days, "Nothing queued yet. Add tasks to your roadmap.", "Carried over". ↑/↓ and HTML5 drag both call `PUT /missions/upcoming/order` with the whole visible order; the response replaces the list. Reorder UI is hidden for roles other than founder and team member (they 403) |
| Completed | `useMissionCompleted`: cursor log grouped by `mission_date`, Load more while `next_cursor`; weekly % chip and per-day status kept; no `completed/total` badge |
| Streaks | `useMissionHistory` now returns `currentStreak` and `bestStreak`; "Best streak" stat added. Heatmap dates are built from local components (`toISOString` shifted them a day in UTC+ zones) |
| Settings | `settings` is `null` until the server answers (skeleton, then error + retry). Radio group for size, labelled select, `role="switch"` for weekends (labelled and described). Each change PATCHes, toasts "Settings saved." and reverts to server values on failure |
| Shell | `components/shell-top-bar.tsx` = `DashboardNavbar` (new `title` prop) + invite modal, mounted in `mission/layout.tsx`: ⌘K search, Health chip, bell, + Invite (founder only), same as the dashboard |

Decisions and rejected alternatives:

- **Open tasks never hide behind "Mission complete."** The server keeps `status: "complete"` when a task is added after a day was cleared. `allCompleted` is now "complete AND nothing pending". Found live: three added tasks were invisible while the sidebar badge said 3.
- **Whole-order PUT, no per-task endpoint**, as the BE contract defines; the list is replaced from the response rather than optimistically reshuffled, because the server redistributes tasks across days.
- **Shared top bar as a component, not a rewrite of every layout.** Other section layouts keep their headers until their own page pass; each adopts `ShellTopBar` in one line.
- Rejected: client-side defaults for settings (violates "no fake defaults"); a polling loop for roadmap generation (the endpoint is synchronous).

## What's involved

`app/(dashboard)/mission/{layout,page}.tsx`, `mission/{upcoming,completed,streaks,settings}/page.tsx`,
`hooks/useMissionApi.ts`, `hooks/useMissionUpcoming.ts` (new), `hooks/useMissionCompleted.ts` (new),
`hooks/useMissionHistory.ts`, `components/mission/*` (new: task card, milestone chip, empty state, loading, copy),
`components/shell-top-bar.tsx` (new), `components/dashboardnavbar.tsx` (`title` prop). No migrations, no config.

## Verification

- Unit: 4 new hook test files, `components/mission/*.test.tsx`, `shell-top-bar.test.tsx`, `mission/mission-pages.test.tsx` (page-level, incl. axe). Full suite: 72 files, 601 tests passing.
- CI gates reproduced locally: `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, `npm run test:e2e` (153 passed; the e2e suite covers marketing and auth only, not the dashboard).
- Live, local full stack (API #135/#136 in docker, FE on :3006), founder and a freshly invited team member, 1440px and 375px (no horizontal overflow on all five pages): loading state, why-line, milestone chip, snooze and reject toasts, menu Escape/outside click, reprioritize, reorder on Upcoming (next days changed and persisted), drag, complete-all with confetti, every settings change persisted across reload, best streak, Invite modal from the Mission top bar, "Assigned to you" for the team member, reorder as team member.
- **Not verifiable live:** the no-roadmap empty state (onboarding always creates a roadmap, so no workspace was roadmap-less). `POST /roadmap/generate` was called live (202, `succeeded`); the state itself is unit-tested. Cursor paging beyond one page is unit-tested only.

## Operate / roll back

Pure FE; revert the PR. Requires BE #135 deployed first, otherwise Upcoming, Completed and the new fields 404.

## Follow-ups

- **BE:** a snoozed task keeps the day `pending` forever, so after a snooze the day never completes and the streak never counts. Decide whether snoozed counts as resolved.
- Adopt `ShellTopBar` in the remaining section layouts.
- The completed-day view has no "+ Add a task" control (existing design).
