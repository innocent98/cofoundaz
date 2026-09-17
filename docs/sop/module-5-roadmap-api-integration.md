# SOP — Module 5: Roadmap (real API integration — tree read)

## What shipped

The Roadmap tree now loads from the live `cofoundaz-api` (`GET /api/v1/roadmap`)
instead of mock data. That single change feeds real phase → milestone → task
data to **five** views — the Timeline (`/roadmap`), Kanban (`/roadmap/kanban`),
Milestones (`/roadmap/milestones`), the milestone drawer, and the flattened
task list used by the Dependencies/Re-plan pages. Branch `feat/api-roadmap` →
PR into `develop`.

## Why

`useRoadmapApi` was pure mock — a hardcoded two-phase tree and client-only
dependency editing. Every roadmap screen rendered fake milestones/tasks and a
fabricated stage.

## How — key decisions

- **One read powers many pages.** `useRoadmapApi` fetches `GET /roadmap` and maps
  the API tree onto the hook's existing `phases` shape, so every consumer
  (`page`, `kanban`, `milestones`, `RoadmapDrawer`, `getAllTasks`) renders real
  data with no page-shape churn. `GET /roadmap` **lazy-generates** the tree from
  the startup's stage template if none exists (guide §1), so a fresh workspace
  still gets a real roadmap.
- **API → FE mapping** (guide §1 field-nesting notes):
  - `roadmap.stage` / `current_stage` → the FE `Stage` label (`idea` → `Idea`,
    …); `current_stage` falls back to `roadmap.stage` when null.
  - milestone `status`: `overdue` flag wins → `overdue`; else `done` →
    `completed`; else `pending`. task `status`: `overdue` flag wins, else the API
    status (`todo`/`in_progress`/`done`).
  - `owner`/`assignee` are `{id, name}` objects or `null` — mapped to the **name**
    (the FE renders `ownerId` as the Owner label; a raw UUID would be wrong),
    `Unassigned`/`Member` fallbacks.
  - `progress`/`overdue` are backend-derived and never written (guide §1);
    `due_on` `null` → `''`; `depends_on` populated on the tree (Slice 2).
  - `roadmap.drift.slipped_count` and per-milestone `replanned` are read for the
    re-plan marker (`isReplanned`/`replannedReason`).
- **Loading & empty states** added to the Timeline (skeleton while fetching, an
  honest "No roadmap yet" if the tree is empty).
- **Health pill de-hardcoded** on the `/roadmap` shell (real score or hidden).

## What's involved

- `hooks/useRoadmapApi.ts` — real fetch + `RawTree`→`phases` mappers; `loading`/
  `error`/`refetch` added; `getAllTasks`/`wouldCreateCycle`/`addDependency`
  retained (now operate on the real tree).
- `app/(dashboard)/roadmap/page.tsx` — loading/empty states.
- `app/(dashboard)/roadmap/layout.tsx` — Health pill gated on real state.

## Verification (live, staging)

- `GET /roadmap` → **200**, lazy-generated tree: stage `idea`, 2 phases
  ("Shape the idea", "First signals"), real milestones with real `due_on` and
  `progress`, tasks with `effort`/`status`/`depends_on`.
- Rendered live and confirmed: **Timeline** shows stage "1. Idea" active + the
  real phases/milestones/dates; the **milestone drawer** lists the real tasks
  ("Describe the problem in one paragraph", effort Small); **Kanban** and
  **Milestones** render the real tasks. Health pill hidden (assessment pending).
- Gates: `typecheck` 0 · `lint` 0 errors · **188** unit · clean `build` ✓.

## Follow-ups (this module wired the READ; the writes are next)

- **Phase/Milestone/Task CRUD** — `POST`/`PATCH /roadmap/{phases,milestones,tasks}`
  (create, rename, status, assignee, due dates). The drawer's "Mark Milestone
  Complete" and task toggles are not yet wired.
- **Dependencies** — `POST`/`DELETE /roadmap/tasks/{id}/dependencies` +
  `GET /roadmap/dependencies`. `addDependency` currently applies the edge
  **optimistically to the fetched tree but does not persist** (documented in the
  hook) — wire the real endpoint + the `409 DEPENDENCY_CYCLE` handling.
- **Templates** — `GET /roadmap/templates`, `…/{id}` preview, `…/{id}/apply`
  (`201` fresh vs `200` already-applied).
- **AI Re-plan** — `POST /replan/preview`, `POST /replan/apply`,
  `GET /replan/history` (human-gated two-step; never auto-apply — guide §9).
- **`POST /roadmap/generate`** explicit regenerate.
- **Mentor role-gating** — reads are open to all members; writes are
  founder/team_member-only (mentor → 403). Gate write affordances on role.
- Other route shells still hardcode a `72` Health pill (cross-cutting).
