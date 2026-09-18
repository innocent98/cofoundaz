# SOP — Module 18: Roadmap writes (Slice 4 — AI Re-plan)

## What shipped

The **AI Re-plan** page is now real, completing the Roadmap writes work. When
milestones slip, a founder can **Generate** a re-plan proposal, **accept a subset**
of the proposed date shifts, **apply** them, and see the **history** of past
re-plans — all against `cofoundaz-api`. Branch `feat/api-roadmap-replan` → PR into
`develop`. Slice 4 (final) of "Roadmap writes".

## Why

The `/roadmap/replan` page was fully mocked (hardcoded diffs, a dead "Generate"
button, a fake history row). The backend has had the two-step, human-gated
re-plan flow since roadmap Slice 3 (`fe-integration-guide-roadmap.md` §9).

## How

- **`useRoadmapApi` now exposes `slippedCount`** — read from
  `data.roadmap.drift.slipped_count` (the drift lives **nested inside `roadmap`**,
  not at `data.drift` — guide §9 trap). Powers the "N milestones have slipped"
  banner.
- **`hooks/useRoadmapReplan.ts`** (new):
  - `previewReplan()` → `POST /roadmap/replan/preview` (read-only; returns
    `{drift_count, changes:[{change_id==milestone_id, title, old_due, new_due,
    reason}]}`; no drift → `changes:[]`).
  - `applyReplan(change_ids)` → `POST /roadmap/replan/apply` → `{applied[],
    skipped[], replan_id, summary}`. The server **recomputes from current state**,
    so stale change_ids come back in `skipped`, not `applied` — the UI surfaces
    both.
  - `loadHistory()` → `GET /roadmap/replan/history` (flat array, newest-first).
- **`app/(dashboard)/roadmap/replan/page.tsx`** — the real two-step flow:
  1. **Drift banner** (red when `slippedCount > 0`, offering "Generate Re-plan";
     green "on track" state otherwise — never auto-runs anything, per the PRD).
  2. **Proposed Adjustments** — one diff row per change (title, opaque `reason`,
     `old_due → new_due`), each with an accept/reject toggle (all accepted by
     default); "Apply N changes" commits the accepted `change_id`s.
  3. **Result banner** driven by the apply response (`summary` + applied/skipped
     counts).
  4. **Re-plan History** — real audit trail with `applied_by.name`, change titles,
     and count.
- `reason` is rendered as opaque prose (templated string, not an enum — never
  parsed).

## What's involved

| Path | Change |
| --- | --- |
| `hooks/useRoadmapApi.ts` | expose `slippedCount` from `roadmap.drift.slipped_count` |
| `hooks/useRoadmapReplan.ts` | new: preview / apply / history |
| `app/(dashboard)/roadmap/replan/page.tsx` | real two-step re-plan flow + history (mock removed) |

Contract: `cofoundaz-api/docs/fe-integration-guide-roadmap.md` §9.

## Verification (live, staging via dev proxy)

Forced a slip (`PATCH` one milestone's `due_on` 10 days into the past), ran the
flow, then restored the date:

- **Drift** — tree `slipped_count: 1` → banner "1 milestone has slipped. Want me
  to re-plan?" (correct singular grammar).
- **Preview** — `POST /roadmap/replan/preview` **200** → one adjustment: "Write
  your problem statement", reason "10 days overdue and not yet done.", **Sep 8 →
  Sep 25**.
- **Apply** — `POST /roadmap/replan/apply` **200** → banner "Re-planned 1
  milestone · 1 applied"; drift banner flips to "You're on track"
  (`slipped_count → 0`); history shows the entry ("By Ade — Write your problem
  statement · 1 change").
- **Skipped path** (direct fetch) — re-applying the now-stale `change_id` →
  `applied: []`, `skipped: [id]`, `replan_id: null`, `summary: null` (exact guide
  §9 behaviour; no history row written).
- **Cleanup** — restored the milestone's original `due_on` (`2026-09-24`);
  `slipped_count` back to 0.
- Gates: `typecheck` 0 · `lint` 0 errors · **188** unit · clean `build` · e2e ✓.

**State note:** the milestone's `replanned` marker (`{at, reason}`) and the one
`replan/history` row persist — both are never cleared automatically (guide §9,
by design; there is no un-replan endpoint). The milestone *date* is fully
restored; only that bookkeeping remains on the staging test workspace.

## Roadmap writes — now complete (Slices 1–4)

CRUD (S1) · dependencies (S2) · templates (S3) · AI re-plan (S4) are all wired
and verified live. Remaining roadmap **niceties** (non-blocking): dependency graph
view (`GET /roadmap/dependencies` → nodes/edges), phase rename UI, Milestones-list
drawer, task detail fields (description/effort/assignee/due), and mentor
role-gating on all roadmap writes.
