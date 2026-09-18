# SOP — Module 18: Roadmap writes (Slice 1 — phase/milestone/task CRUD)

## What shipped

The Roadmap is no longer read-only. Founders can now **add / edit / delete
phases, milestones, and tasks** and change milestone/task status, all persisted
to the real `cofoundaz-api`. Editing happens through the interactive
**RoadmapDrawer** (milestone + task management) plus per-phase controls on the
Timeline. Branch `feat/api-roadmap-writes` → PR into `develop`. First slice of
"Roadmap writes"; dependencies / templates / AI re-plan persistence remain
follow-up slices.

## Why

Module 5 wired the roadmap **tree read** (`GET /roadmap`), but every editing
affordance was dead: the drawer's status `<select>`, its per-task toggle, and the
"Mark Milestone Complete" button were static, and there was no way to add or
remove phases/milestones/tasks. The backend has had full CRUD since roadmap
Slices 1–2 (`fe-integration-guide-roadmap.md` §3–§5) — this wires the FE to it.

## How

- **Hook write layer (`hooks/useRoadmapApi.ts`)** — added `createPhase`/
  `updatePhase`/`deletePhase`, `createMilestone`/`updateMilestone`/
  `deleteMilestone`, `createTask`/`updateTask`/`deleteTask`. Each calls the real
  endpoint via `apiClient`, then **`refetch()`s the tree**. This matters: single
  create/patch responses are **flat** (no server-derived `progress`/`overdue`, no
  nested tasks — guide §4/§5), so only a re-read gives the UI correct derived
  state. `progress`/`overdue` are backend-owned and never sent.
- **Interactive drawer (`app/(dashboard)/roadmap/components/RoadmapDrawer.tsx`)** —
  now a client component with real actions: toggle a task done/undone
  (`PATCH task {status}`), add a task (inline form → `POST /tasks`), delete a task,
  change milestone status via the select or "Mark Milestone Complete"
  (`PATCH milestone {status}`), and delete the milestone (header trash,
  cascade-deletes its tasks). Guards each call with a `busy` state + inline error.
- **Stale-snapshot fix** — the Timeline and Kanban pages now track the open
  milestone **by id** and derive it from live `phases` (`find(id)`), instead of
  storing a snapshot object. After each mutation's `refetch()`, the drawer
  re-renders with fresh server state (e.g. progress → 100%).
- **Timeline phase/milestone controls (`app/(dashboard)/roadmap/page.tsx`)** —
  "Add phase" (top) → `POST /phases`; per-phase (on hover) "+ Milestone" →
  `POST /milestones` and a delete-phase trash → `DELETE /phases/{id}` (cascade).
- **The progress-vs-status trap is honored** — a milestone at `progress: 100`
  with `status: "todo"` renders a full bar **next to a "Pending" chip**; progress
  reaching 100% never auto-flips the status (guide §5). Verified live.

## What's involved

| Path | Change |
| --- | --- |
| `hooks/useRoadmapApi.ts` | 9 write methods (phase/milestone/task CRUD), each `apiClient` + `refetch()` |
| `app/(dashboard)/roadmap/components/RoadmapDrawer.tsx` | interactive: task toggle/add/delete, milestone status/complete/delete |
| `app/(dashboard)/roadmap/page.tsx` | id-based drawer selection; Add phase / per-phase add-milestone + delete-phase; full drawer props |
| `app/(dashboard)/roadmap/kanban/page.tsx` | id-based drawer selection; full drawer props; dropped 2 unused imports |

Contract source: `cofoundaz-api/docs/fe-integration-guide-roadmap.md` §3–§5
(verbatim-verified captures). Backend routes in
`cofoundaz-api/app/api/v1/endpoints/roadmap.py`.

## Verification (live, staging via dev proxy)

Exercised end-to-end in the browser against the seeded 2-phase roadmap, then
fully cleaned up (roadmap restored to its original 2 phases):

- `POST /roadmap/phases` **201** (Add phase → "QA Test Phase").
- `POST /roadmap/milestones` **201** (per-phase "+ Milestone" → "QA Milestone").
- `POST /roadmap/tasks` **201** (drawer add-task → "Draft QA checklist").
- `PATCH /roadmap/tasks/{id}` **200** (toggle done) → drawer **progress 100%**,
  task struck through, **milestone status still "Pending"** (trap confirmed).
- `PATCH /roadmap/milestones/{id}` **200** (Mark Milestone Complete → `done`).
- `DELETE /roadmap/tasks/{id}` **200**, `DELETE /roadmap/milestones/{id}` **200**
  (drawer closes), `DELETE /roadmap/phases/{id}` **200** (roadmap back to 2 phases).
- Gates: `typecheck` 0 · `lint` 0 errors · **188** unit · clean `build` · e2e ✓.

Note: `POST` on the drawer's add-task form submits via the **button** in the
automated run (synthetic Enter didn't trigger implicit form submit — an
automation quirk; the `<form onSubmit>` + submit button submits on Enter for real
users).

## Follow-ups (next roadmap-writes slices)

- **Phase rename** — `updatePhase` exists in the hook; no UI surfaces it yet.
- **Milestones list page** — still read-only; wire its rows to open the drawer.
- **Dependencies** — persist `POST`/`DELETE /roadmap/tasks/{id}/dependencies`
  (+ `409 DEPENDENCY_CYCLE`); the hook still applies edges optimistically only.
- **Templates** gallery apply, **AI re-plan** (preview/apply/history), **generate**.
- Task detail editing (description, effort, assignee, due date) + milestone
  due/owner; mentor role-gating (writes are `_editor`-only → 403).
