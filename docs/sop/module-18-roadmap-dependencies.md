# SOP — Module 18: Roadmap writes (Slice 2 — task dependencies)

## What shipped

Task dependencies now **persist**. The `/roadmap/dependencies` page creates and
removes real dependency edges against `cofoundaz-api`, with the backend's cycle
guard surfaced to the founder. Branch `feat/api-roadmap-dependencies` → PR into
`develop`. Second slice of "Roadmap writes" (Slice 1 = phase/milestone/task CRUD).

## Why

Module 18 Slice 1 wired CRUD but the dependencies page still used the hook's
**local-only** `addDependency` — it mutated the in-memory tree optimistically and
never wrote back, so every edge vanished on the next refetch. This wires it to
the real endpoints (guide §6).

## How

- **`hooks/useRoadmapApi.ts`**
  - `addDependency(prereqId, dependentId)` is now **async + persisted**: the form
    reads "prereq *must finish before* dependent", i.e. **dependent depends on
    prereq**, so it `POST`s to `/roadmap/tasks/{dependentId}/dependencies` with
    `{depends_on_task_id: prereqId}`, then `refetch()`s. The tree carries
    `depends_on` since Slice 2, so the refetch reflects the new edge — no more
    optimistic-only state.
  - `removeDependency(dependentId, prereqId)` → `DELETE /roadmap/tasks/
    {dependentId}/dependencies/{prereqId}` + refetch.
  - **`wouldCreateCycle` direction fixed.** The old BFS walked from the wrong
    node for the edge's real semantics. Adding "dependent depends on prereq"
    loops iff `prereq` already depends — transitively — on `dependent`, so it now
    BFSes from `prereqId` along `dependsOn` and checks reaching `dependentId`.
    It's an instant pre-check; the server is the authority.
  - Both mutations return `{success, error?}`; on an `ApiError` they surface the
    server's `error.message` verbatim — the **409 names the two conflicting tasks
    by title**, which is better copy than anything client-side.
- **`app/(dashboard)/roadmap/dependencies/page.tsx`** — `handleAddDependency` is
  async and awaits the result (surfacing server/client errors); a `busy` state
  disables the button; each edge chip in "Active Links" gets a hover **×** to
  remove that edge.

The list view renders from the tree's `task.depends_on` (already fetched), so
`GET /roadmap/dependencies` (the `{nodes, edges, list}` graph payload) was not
needed here — it stays available for a future graph visualization.

## What's involved

| Path | Change |
| --- | --- |
| `hooks/useRoadmapApi.ts` | persisted `addDependency` (async), new `removeDependency`, corrected `wouldCreateCycle` |
| `app/(dashboard)/roadmap/dependencies/page.tsx` | async add + error surfacing + busy state; per-edge remove button |

Contract: `cofoundaz-api/docs/fe-integration-guide-roadmap.md` §6.

## Verification (live, staging via dev proxy)

Driven end-to-end, then fully cleaned up (roadmap back to 0 dependency edges):

- **Create** — "Describe the problem" *must finish before* "List who has this
  problem" → `POST /roadmap/tasks/{list}/dependencies {depends_on_task_id: describe}`
  **201**; Active Links renders "List who has this problem (blocked by) →
  Describe the problem". Correct direction confirmed by the request path.
- **Client cycle guard** — attempting the reverse edge is blocked instantly with
  "That would create a loop — List who has this problem already depends on
  Describe the problem in one paragraph." — no network call made.
- **Server contract** (direct fetch, for the record): reverse edge → **409
  DEPENDENCY_CYCLE** (message names both tasks, exact match to guide §6);
  self-dependency → **422**; idempotent re-add of an existing edge → **200**.
- **Remove** — edge chip × → `DELETE /roadmap/tasks/{list}/dependencies/{describe}`
  **200**; Active Links returns to the empty state; server shows 0 edges.
- Gates: `typecheck` 0 · `lint` 0 errors · **188** unit · clean `build` · e2e ✓.

## Follow-ups (remaining roadmap-writes slices)

- **Dependency graph view** — wire `GET /roadmap/dependencies` (`nodes`/`edges`/
  `list`) for a proper 2-D graph rather than the current blocked-by list.
- **Templates** gallery apply, **AI re-plan** (preview/apply/history), **generate**.
- Phase rename UI; Milestones-list drawer; task detail fields; mentor role-gating.
