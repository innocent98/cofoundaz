# SOP — Module 6: Business Builder (real API integration — overview grid)

## What shipped

The Business Builder **overview grid** (`/business-builder`) now shows real
completion from the live `cofoundaz-api` (`GET /business-builder/overview`)
instead of hardcoded progress numbers. The route-shell Health pill is
de-hardcoded. Branch `feat/api-business-builder` → PR into `develop`.

## Why

The overview page was fully static — a hardcoded `modules` array with fake
progress (80/60/100/70/50/40/55/65/35). It never fetched anything.

## How — key decisions

- **Overview is an array of 9 rows** discriminated by `type`: 5 **canvases**
  (`business_model`, `lean`, `value_prop`, `mission_vision`, `swot`) that report
  `completion_pct`/`filled_blocks`/`total_blocks`, and 4 **record kinds**
  (`persona`, `revenue_stream`, `competitor`, `pricing`) that report a `count`.
  The page keeps the FE's nicer titles/descriptions/icons/paths and merges the
  API row (by `type`) for the real numbers.
- **Two metrics, one card.** Canvas cards show the real `completion_pct` in the
  progress ring; record cards show the item `count` (ring is a binary
  started/complete, footer reads "N items" / "Start"). Honest rather than
  forcing a fake % onto records that have none.
- **Path trap noted for the record follow-ups:** the overview `type` values are
  `persona`/`revenue_stream`/`competitor`, but the record **URL segments** are
  **plural/hyphenated** — `personas`, `revenue-streams`, `competitors`,
  `pricing` (`_KIND_PATHS` in the API). The overview endpoint itself is
  unaffected (it's a single `/overview` call); the record CRUD follow-ups must
  use the plural paths.
- **Health pill wired** on the `/business-builder` shell (real score or hidden).

## What's involved

- `app/(dashboard)/business-builder/page.tsx` — client fetch of
  `/business-builder/overview`, `MODULES` config keyed by API `type`, loading
  state, real ring/count/footer per card.
- `app/(dashboard)/business-builder/layout.tsx` — Health pill gated on real state.

## Verification (live, staging)

- `GET /business-builder/overview` → **200**, 9 rows. Created one **persona**
  live (`POST /business-builder/personas` → 201) and the overview flipped that
  row to `count:1, completion_pct:100, status:"complete"`.
- Rendered live: the grid shows canvases at real 0%, **Customer Personas "1
  item"** (the created record), other record kinds "Start", and the **Health
  pill "90"** (the test account's real score after completing the assessment
  this session). No more fake 80/60/100 progress.
- Gates: `typecheck` 0 · `lint` 0 errors · **188** unit · clean `build` ✓.

## Follow-ups (this wired the overview READ; the editors are next)

- **Canvas editor** — `GET`/`PUT /business-builder/canvases/{type}` rendered from
  the `block_defs` contract, with the `409 CANVAS_VERSION_CONFLICT` optimistic-
  concurrency handling (guide §3). `useBusinessBuilderApi` + the lean-canvas page
  still use the mock SDK (`lib/api/business-builder`).
- **Record CRUD** — list/create/update/delete for `personas` / `revenue-streams`
  / `competitors` / `pricing`, forms rendered from the `fields` descriptor
  (incl. `choices` for enums) — **use the plural URL segments**.
- **Positioning map** (`GET`/`PUT /positioning-map`), **AI-fill** (deferred/
  polling), and **Suggestions** (`/suggestions` approve/reject) per the second
  guide (`fe-integration-guide-business-builder-suggestions.md`).
- Mentor **role-gating**: reads open to all members; writes founder/team_member
  only (mentor → 403).
