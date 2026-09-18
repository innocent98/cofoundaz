# SOP — Module 4: Mission task actions (verify live + reject-reason fix)

## What shipped

All four **Today's Mission** task actions — add, complete, snooze, reject, and
reorder — are now **verified working live** against `cofoundaz-api`, and a latent
reject-reason bug is fixed. Branch `feat/api-mission-actions` → PR into `develop`.
Closes the Module 4 follow-up ("snooze/reject/reorder/add live").

## Why

Module 4 wired the mission read + settings + task-complete and left the other
task actions as "derived from code, not confirmed live." They were in fact
already wired in `useMissionApi` and the mission page — but one had a real bug:
`rejectTask`'s **default** `reject_reason` used a **curly apostrophe**
(`Doesn't apply`, U+2019), while the server's `VALID_REJECT_REASONS` requires the
exact string with a **straight apostrophe** (`Doesn't apply`, U+0027). Any reject
that fell back to the default would `422`.

## How

- **`hooks/useMissionApi.ts`** — one-line fix: `rejectTask`'s default reason is
  now `"Doesn't apply"` (straight apostrophe), matching the server enum exactly,
  with a comment flagging the trap.
- Everything else was already correct: the page's reject chips
  (`['Already done', 'Wrong priority', "Doesn't apply"]`) already use straight
  apostrophes, and `PATCH /missions/tasks/{id}` is driven with the right
  `{action, order?, reject_reason?}` bodies (`complete`/`snooze`/`reorder`/`reject`),
  `POST /missions/tasks` with `{title, effort}`. This pass confirms they work
  end-to-end.

## What's involved

| Path | Change |
| --- | --- |
| `hooks/useMissionApi.ts` | reject-reason default: curly → straight apostrophe |

Contract: `cofoundaz-api/docs/fe-integration-guide-mission.md` §4–§5.

## Verification (live, staging via dev proxy)

Exercised against today's 3-task mission (real roadmap tasks left untouched;
throwaway custom tasks used for mutations, which regenerate next day):

- **Add** — "+ Add a task" → `POST /missions/tasks` **200**; the custom task
  renders with a "Custom" tag.
- **Reorder** — "Reprioritize Up" → **two** `PATCH …{action:"reorder", order}` calls,
  both **200** (the engine sets one task's order per call, so the hook swaps both).
- **Reject** — task menu → "Not relevant" → "Doesn't apply" chip →
  `PATCH …{action:"reject", reject_reason:"Doesn't apply"}` **200**.
- **Snooze** — `PATCH …{action:"snooze"}` **200**.
- **Complete** — `PATCH …{action:"complete"}` **200**.
- **The bug, proven both ways**: `reject_reason` with a **curly** apostrophe →
  **422 VALIDATION_ERROR**; the **straight** apostrophe → **200**. Confirms the
  fix is load-bearing, not cosmetic.
- Gates: `typecheck` 0 · `lint` 0 errors · **188** unit · clean `build` · e2e ✓.

## Follow-ups

- **History-backed sub-pages** — `/mission/completed`, `/mission/upcoming`,
  `/mission/streaks` still render mock; wire them to `GET /missions/history`
  (weekly %, past missions) — this is the remaining Module 4 work.
- Drag-to-reorder (the hook has `reorderTasks`, but the UI only exposes
  up/down reprioritize today); mentor role-gating (task writes are `_editor`-only).
