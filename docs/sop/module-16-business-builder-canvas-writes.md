# SOP — Module 16: Business Builder · canvas writes (version + block keys)

## What shipped

The Business Builder **canvas editor** now saves correctly: autosave persists
across repeated edits (no `409` after the first save) and the Lean Canvas
round-trips against the real block keys. First slice of "Business Builder
writes". Branch `feat/api-bb-canvas-writes` → PR into `develop`.

## Why — two real bugs

The `lib/api/business-builder` SDK already hits the **real** `GET`/`PUT
/business-builder/canvases/{type}` (via the dev proxy), but:
1. **`useBusinessBuilderApi.saveCanvas` never tracked the version** and the Lean
   page hardcoded `version: 1` on every PUT. The canvas uses optimistic
   concurrency (guide §3) — the server bumps `version` on each save — so the
   **second autosave 409'd** and silently failed ("Failed to auto-save").
2. **The Lean page's section ids didn't match the API block keys**
   (`uvp`/`advantage`/`segments`/`metrics`/`costs`/`revenue` vs
   `unique_value_proposition`/`unfair_advantage`/`customer_segments`/
   `key_metrics`/`cost_structure`/`revenue_streams`), so those blocks never
   loaded from or saved to the server.

## How

- **Version tracking in the hook** — `useBusinessBuilderApi` keeps a
  `canvasVersions` ref keyed by canvas type: `loadCanvas` stores the version from
  `GET`, `saveCanvas` sends the tracked version and updates it from the `PUT`
  response, and on a **`409 CANVAS_VERSION_CONFLICT`** it re-reads the latest
  version and retries once. `saveCanvas` now takes just `{ blocks }`.
- **Lean page keys aligned** to the real block keys (from
  `canvas_defs.py::CANVAS_BLOCKS[lean]`); the hardcoded `version: 1` on save is
  gone.

## What's involved

- `hooks/useBusinessBuilderApi.ts` — `canvasVersions` ref + version-aware
  `loadCanvas`/`saveCanvas` with 409 retry.
- `app/(dashboard)/business-builder/lean-canvas/page.tsx` — section ids = real
  block keys; drop the hardcoded version.

## Verification (live, staging)

- Loaded the Lean Canvas (server `version 3`), added a **Problem** item → autosave
  → server `version 4`, `blocks.problem = ["Gig workers lack savings tools"]`.
- Added a **Solution** item → autosave → server **`version 5`, no 409**, both
  blocks correct (the old hardcoded `version:1` would have conflicted here).
- Reloaded → both items **persist** and render (round-trip through the real
  block keys).
- Gates: `typecheck` 0 · `lint` 0 errors · **188** unit · clean `build` ✓.

## Follow-ups (rest of Business Builder writes)

- **Other canvas pages** (`business-model-canvas`, `value-proposition`,
  `mission-vision`, `swot`) — align their section ids to each type's block keys
  and route saves through the same hook (ideally render from the served
  `block_defs` instead of hardcoded sections).
- **Record CRUD** — personas / revenue-streams / competitors / pricing
  (create/edit/delete from the `fields` descriptor, plural URL paths).
- **Positioning map** (`GET`/`PUT /positioning-map`), **AI-fill** (deferred
  job-polling), and **Suggestions** approve/reject (its own guide).
- Mentor **role-gating** (canvas writes are editor-only).
