# SOP — Roadmap Kanban drag-and-drop (task status)

**What shipped:** the roadmap Kanban board's Status view now lets you **drag a task
card between To Do / In Progress / Done to change its status**, persisted to the real
API. Closes checklist §6b (Kanban was static columns with no DnD).

## Why

The board already rendered real tasks (`useRoadmapApi`) grouped by status, but had
**no drag-and-drop** — the one interaction a kanban exists for. Sales, Funding, and
Validation boards already had DnD; the roadmap board was the odd one out (audit B5).

## How

`app/(dashboard)/roadmap/kanban/page.tsx`, Status view only:
- **Native HTML5 DnD**, matching the existing board pattern (`dataTransfer` +
  `onDragStart`/`onDragOver`/`onDrop`) — no new dependency.
- Cards are `draggable`; `handleDragStart` puts the task id on the drag. A column's
  drop zone calls `handleDrop(colId)` → `updateTask(taskId, { status: colId })`
  (the already-integrated `PATCH /roadmap/tasks/{id}` from module-18).
- **Optimistic move**: a `pending` map (`taskId → status`) overrides the card's
  column immediately; `updateTask` re-fetches the tree (source of truth) and the
  override clears in `finally`. On failure (e.g. a mentor's `403`) the override
  clears → the card snaps back, and a small banner explains why.
- Drop-target highlight via `dragOverCol`; an overdue card (a past-due To Do) still
  lives under To Do and a drop back onto To Do is treated as a real move.
- **Phase view is unchanged** (click-to-open): moving a milestone between phases has
  no API (`updateMilestone` takes no `phase_id`), so DnD there would be dead UI.

## Verification

| Check | Result |
|---|---|
| typecheck / lint / unit | 0 / 0 / 188 |
| build / e2e | clean / 153 |
| **Live (staging)** | Board rendered the test account's real tasks. Dispatched a real drag of "Describe the problem…" from **To Do → In Progress**; the card moved, `PATCH …/{id} {status:"in_progress"}` fired, the server refetch showed it in In Progress (**persisted**), then reverted to `todo` to restore the account. |

> Note on the live drag: the automated mouse-drag can't trigger native HTML5 DnD
> (mouse events don't raise `dragstart`/`drop`), so the gesture was exercised by
> dispatching real `DragEvent`s with a shared `DataTransfer` — which runs the exact
> `handleDragStart` → `handleDrop` → `updateTask` path a user's drag does.

## Follow-ups

- Intra-column **reorder** (drag to reposition within a column via `order`) — not
  done; only cross-column status change.
- Pre-disable dragging for mentors/viewers (today the `403` is caught after the drop
  and reverted) once role is on `/auth/me`.
- Optional: DnD in the Phase view once a "move milestone to phase" endpoint exists.
