# SOP — Module 4: Mission history (completed / streaks / upcoming)

## What shipped

The three Today's-Mission sub-pages — **Completed**, **Streaks**, **Upcoming** —
now render real data instead of mock. Completed and Streaks read
`GET /missions/history`; Upcoming reads the roadmap. Branch
`feat/api-mission-history` → PR into `develop`. Closes the last Module 4 follow-up.

## Why

`/mission/completed`, `/mission/streaks`, and `/mission/upcoming` were hardcoded
(fake completed tasks, a fabricated activity grid, invented "Tomorrow/Wed/Thu"
task buckets). The history endpoint has existed since Module 4; the roadmap read
since Module 5.

## How

- **`hooks/useMissionHistory.ts`** (new) — `GET /missions/history` →
  `{ missions:[{mission_date, completed, total, status}], weekly_completion_pct }`
  (newest-first, read-only).
- **Completed** — a real per-mission history list (day label via relative date,
  "X of Y done", status pill). **Honors the guide §6 trap**: `status` is the
  completion source of truth, and `completed/total` is shown as informational
  progress only — a `complete` mission with `completed < total` is never rendered
  as a contradiction. The weekly-% chip is real.
- **Streaks** — three real stats: **Current streak** (from `/today` via
  `useMissionApi`), **This week** (`weekly_completion_pct`), **Missions completed**
  (count of `status === "complete"`). The activity grid is built from the real
  `missions` list, mapping each `mission_date` to a level (complete=3, partial=2,
  started=1, none=0) on a calendar-aligned 13-week grid; future days render blank.
  (The mock's fabricated "Best streak / 90-day" stats are gone — the API doesn't
  expose those.)
- **Upcoming** — drawn from the **roadmap** (`useRoadmapApi`): every not-yet-done
  task, **grouped by milestone**. The roadmap has no per-day schedule, so the old
  invented day buckets are replaced with real milestone grouping — no fabricated
  dates.

## What's involved

| Path | Change |
| --- | --- |
| `hooks/useMissionHistory.ts` | new: `GET /missions/history` |
| `app/(dashboard)/mission/completed/page.tsx` | real past-missions list (status-vs-count trap honored) |
| `app/(dashboard)/mission/streaks/page.tsx` | real streak/weekly%/count + activity grid from real dates |
| `app/(dashboard)/mission/upcoming/page.tsx` | real roadmap tasks grouped by milestone |

Contract: `cofoundaz-api/docs/fe-integration-guide-mission.md` §6 (history) + §1
(`/today` streak).

## Verification (live, staging via dev proxy)

All read-only — no mutations, nothing to restore. Against a workspace with two
materialised missions (today 1/4, yesterday 2/3, both `pending`, weekly 0%):

- **Completed** — renders "Today · 1 of 4 done · In progress" and "Yesterday · 2
  of 3 done · In progress" with a real "This week: 0% complete" chip.
- **Streaks** — Current streak **0**, This week **0%**, Missions completed **0**;
  the activity grid colours the two recent mission days (level 2) against an
  otherwise-empty real history.
- **Upcoming** — real incomplete roadmap tasks grouped under their milestones
  ("Write your problem statement", "Sketch the solution", "Talk to 5 potential
  users") — no invented day labels.
- Gates: `typecheck` 0 · `lint` 0 errors · **188** unit · clean `build` · e2e ✓.

## Follow-ups

- **Best streak / longer-window completion** — not exposed by the API; would need
  a backend field (or client derivation once the history window is large enough
  to be reliable).
- Upcoming could group by task `due_on` into real day buckets once roadmap tasks
  carry due dates consistently; drag-to-reorder from Upcoming.
