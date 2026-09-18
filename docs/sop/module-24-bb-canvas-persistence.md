# SOP — Module 24: Business Builder · canvas persistence (BMC / value-prop / SWOT / mission-vision)

## What shipped

The four remaining Business Builder canvases now **persist** to the real API,
matching what lean-canvas already did (Module 16): **Business Model Canvas**,
**Value Proposition**, **SWOT**, and **Mission & Vision**. Branch
`feat/api-bb-canvas-persistence` → PR into `develop`.

## Why

Only lean-canvas was wired to `GET`/`PUT /canvases/{type}`. The other four were
mock — hardcoded blocks with fake "Saved" toasts and `prompt()`-based edits that
never left the browser. So a founder's Business Model, SWOT, etc. vanished on
reload.

## How

- **`hooks/useCanvasEditor.ts`** (new) — a reusable editor driven by the API's
  served **`block_defs`** (guide §2/§3): loads `GET /canvases/{type}` (blocks +
  block_defs + version), holds the **full** blocks object in state, and
  **debounced-autosaves** the complete object via `useBusinessBuilderApi.saveCanvas`
  (which already tracks `version` and retries on `409`, Module 16). List blocks are
  `string[]` (`addItem`/`removeItem`); text blocks are plain strings (`setText`).
  Every `PUT` sends **all** keys — the API resets any omitted block, so partial
  saves are never sent.
- **Pages** — each keeps its distinct layout but is now data-driven off `block_defs`:
  - `business-model-canvas` — the 9-cell grid, add/remove chips, "Saved to cloud".
  - `value-proposition` — 2 columns (customer profile = first 3 defs, value map =
    last 3), add/remove.
  - `swot` — 4 colored quadrants keyed by block key (`strengths`/`weaknesses`/
    `opportunities`/`threats`), add/remove.
  - `mission-vision` — the two **text** blocks (mission, vision) as autosaving
    textareas (replacing the old fake "Saved" toast).
  - All keep the honest `AiDraftButton` from Module 20.

## What's involved

| Path | Change |
| --- | --- |
| `hooks/useCanvasEditor.ts` | new: block_defs-driven load + debounced autosave (version/409 via Module 16) |
| `…/business-model-canvas/page.tsx` | real 9-block grid |
| `…/value-proposition/page.tsx` | real 6-block 2-column |
| `…/swot/page.tsx` | real 4-quadrant |
| `…/mission-vision/page.tsx` | real 2 text blocks |

Contract: `cofoundaz-api/docs/fe-integration-guide-business-builder.md` §2–§3;
block defs in `app/services/business/canvas_defs.py`.

## Verification (live, staging via dev proxy)

Against fresh (empty, v1) canvases, then restored to empty afterward:

- **Business Model** — `GET` 200 (9 empty blocks); added "QA test partner" to Key
  Partners → debounced **`PUT` 200**, "Saved to cloud"; **reload persisted** the
  item.
- **Mission & Vision** — `GET` 200 (2 empty text blocks); typed a mission →
  **`PUT` 200** (text-block autosave).
- **SWOT** — renders the 4 real quadrants (Strengths/Weaknesses/Opportunities/
  Threats) from `block_defs`.
- **Value Proposition** — same `useCanvasEditor` path; renders the 6 blocks across
  the two columns.
- **Cleanup** — cleared the Business Model + Mission/Vision canvases back to empty
  (`PUT` 200).
- Gates: `typecheck` 0 · `lint` 0 errors · **188** unit · clean `build` · e2e ✓.

## Follow-ups

- **Item edit-in-place** — items are add/remove today; inline editing of an
  existing item (the old `prompt('Edit item')`) isn't reinstated. Add if desired.
- Consider migrating **lean-canvas** onto `useCanvasEditor` too, to retire its
  bespoke autosave code (it predates this hook).
- Mentor **role-gating** — canvas writes are editor-only (a mentor `PUT` 403s);
  the buttons aren't role-gated client-side yet.
