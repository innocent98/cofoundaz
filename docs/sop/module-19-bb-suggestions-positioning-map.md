# SOP — Module 19: Business Builder · Suggestions + editable Positioning Map

## What shipped

Two Business Builder surfaces from the Suggestions guide (Slice 3) are now real:

1. **Suggestions review** — a "Suggestions to review" panel on the Business
   Builder overview lists pending teammate suggestions and lets a founder
   **approve** (applies the change) or **reject** them.
2. **Editable positioning-map axes** — the competitive-analysis map now shows the
   real axis labels from `GET /positioning-map` and lets the founder edit them via
   `PUT /positioning-map`.

Branch `feat/api-bb-suggestions-map` → PR into `develop`.

## Why

Neither existed as a real FE surface: BB suggestions had no page at all (the
`ai/suggestions` page is a *different* feature — AI Co-Founder action ideas), and
the positioning map used hardcoded "High trust / Low cost" axis labels. The
backend has had both since Business Builder Slice 3.

## How

### Suggestions
- **`hooks/useBusinessSuggestions.ts`** (new) — `GET /business-builder/suggestions?status=pending`
  (the list is under `data.suggestions`, **not** `data.items` — the old loose SDK
  helper read the wrong key), plus `approve`/`reject` (`POST …/{id}/approve|reject`).
  Approve returns `{success, error?, conflict?}`; a **`409 CANVAS_VERSION_CONFLICT`**
  is surfaced as "reject and ask for a fresh one" (never blind-retry — the
  suggestion stays pending), and `SUGGESTION_NOT_PENDING` is surfaced too.
- **`components/business-builder/suggestions-panel.tsx`** — renders each pending
  suggestion (op → human label, a payload summary, the note, the author name),
  with Approve/Reject and per-row error. Renders nothing when there are no
  pending suggestions. Added to the BB overview above the module grid.

### Positioning map
- **`hooks/useBusinessPositioningMap.ts`** (new) — `GET` (`{axes, competitors}`)
  and `PUT` (`{axes}` only). Competitor coords are a **projection** of the
  competitor records' `map_x`/`map_y`; the map row holds only the axes (the
  coordinate-on-competitor trap, §8).
- **`components/business-builder/axes-edit-modal.tsx`** — edits the six axis
  strings (x/y × label/low/high; all required or the server 422s).
- **`competitive-analysis/page.tsx`** — the map's axis labels now come from the
  API and are editable; the `map_x`/`map_y` form-field labels track the real axis
  labels so the founder knows which corner each coordinate maps to. Dots still
  come from the competitor records (same data the projection reflects).

## What's involved

| Path | Change |
| --- | --- |
| `hooks/useBusinessSuggestions.ts` | new: list/approve/reject (correct `suggestions` key, 409 handling) |
| `hooks/useBusinessPositioningMap.ts` | new: GET/PUT positioning map |
| `components/business-builder/suggestions-panel.tsx` | new: review panel |
| `components/business-builder/axes-edit-modal.tsx` | new: axis editor |
| `app/(dashboard)/business-builder/page.tsx` | mount the suggestions panel |
| `app/(dashboard)/business-builder/competitive-analysis/page.tsx` | real editable axes |

Contract: `cofoundaz-api/docs/fe-integration-guide-business-builder-suggestions.md`
§1–§8. **Role note:** create is open to any member (a founder can create *and*
resolve), which is how this was verifiable live with only the founder account.

## Verification (live, staging via dev proxy)

- **Positioning map** — `GET` returns default axes (Price/Quality); after creating
  a competitor `map_x:0.7, map_y:0.3` the map renders "High Price →" / "High
  Quality" with the dot lower-right. **Edit axes → `PUT` 200**: labels update live
  to "Fast Growth Rate →" / "Great Retention".
- **Suggestions** — created two `record_create` (persona) suggestions (`201`); the
  overview panel showed both ("Add a persona · <name> · <note> · Suggested by
  Ade", newest-first, count 2). **Approve → `200` and the persona was actually
  created** (personas list gained "Suggested Persona A"); panel dropped to 1.
  **Reject → `200`, no record created**; panel emptied (hidden). **Re-approving
  the resolved suggestion → `409 SUGGESTION_NOT_PENDING`.**
- **Cleanup** — deleted the approved persona + the test competitor and restored
  the axes to Price/Quality; personas back to just "Busy Founder Bea".
- Gates: `typecheck` 0 · `lint` 0 errors · **188** unit · clean `build` · e2e ✓.

**State note:** the two resolved suggestions remain in history (approved/rejected
are terminal; no delete/un-resolve endpoint). Records + axes are fully restored.

## Follow-ups

- Suggestions **diff view** — render `current` vs `payload` side-by-side (the
  guide's `current` is read live, not a snapshot); today the panel shows a compact
  summary. Also `canvas_update` block diffs and an approved/rejected history tab.
- Plot competitors straight from `GET /positioning-map`'s projection (incl. an
  "unplaced" tray for `x/y: null`) instead of the records, once we want the map to
  be the single source; drag-to-place competitors (writes `map_x`/`map_y`).
- Mentor role-gating (approve/reject + axes PUT are editor-only → 403).
