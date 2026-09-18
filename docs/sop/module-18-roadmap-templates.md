# SOP — Module 18: Roadmap writes (Slice 3 — template gallery)

## What shipped

The Roadmap **Template Gallery** is now real. Founders browse the 6 catalog packs,
**preview** a pack's full phase/milestone/task breakdown, and **apply** it to layer
onto their existing roadmap. Branch `feat/api-roadmap-templates` → PR into
`develop`. Third slice of "Roadmap writes" (Slice 1 = CRUD, Slice 2 = dependencies).

## Why

The templates page was fully mocked — 4 hardcoded cards, a dead "Preview", and an
`alert()` on apply. The backend has had the gallery since roadmap Slice 2
(`fe-integration-guide-roadmap.md` §7).

## How

- **`hooks/useRoadmapTemplates.ts`** (new) — dedicated hook (kept separate from
  `useRoadmapApi` so the page doesn't trigger an unnecessary `GET /roadmap`):
  - `templates` from `GET /roadmap/templates` — the response `data` is a **flat
    array**, not `{templates:[…]}`.
  - `getTemplate(id)` → `GET /roadmap/templates/{id}` (read-only preview, no
    ids/dates).
  - `applyTemplate(id)` → `POST /roadmap/templates/{id}/apply`, then re-lists so
    the card's `applied` flag flips.
- **`app/(dashboard)/roadmap/templates/page.tsx`** — real cards (category badge,
  title, `applied` chip, milestone/task counts); a **Preview modal** rendering the
  phase → milestone → task tree with effort tags; an **Apply confirmation** modal
  whose result banner is driven by **`already_applied`**, not the HTTP status:
  "added N phases / M milestones / K tasks" on a fresh apply vs "already applied —
  nothing changed" on a repeat.
- **`stage` is nullable** — packs not tied to a stage (`pre-seed-raise`,
  `company-formation`) render **without** a stage badge, not a default.

## What's involved

| Path | Change |
| --- | --- |
| `hooks/useRoadmapTemplates.ts` | new hook: list / preview / apply |
| `app/(dashboard)/roadmap/templates/page.tsx` | real gallery + preview modal + apply-with-result (mock removed) |

Contract: `cofoundaz-api/docs/fe-integration-guide-roadmap.md` §7.

## Verification (live, staging via dev proxy)

- **List** — `GET /roadmap/templates` → all **6** real packs render with category
  badges; the two `stage: null` packs (Pre-seed raise, Company formation) render
  **without** a stage badge (null handled).
- **Preview** — `GET /roadmap/templates/mvp-build` **200** → modal shows phase
  "MVP" → milestone "Core flow shipped" → tasks "Build the core feature (large)",
  "Instrument analytics (small)" — exact match to guide §7.
- **Apply** — `POST /roadmap/templates/mvp-build/apply` **201** → banner "added 1
  phase, 1 milestone, 2 tasks"; the card's **Applied** chip appears (flag flipped
  via re-list).
- **Re-apply** — same call again → **200**, banner "'MVP build' is already applied
  — nothing changed" (copy driven by `already_applied`, not the status code).
- **Cleanup** — deleted the template-added "MVP" phase (`DELETE /roadmap/phases/{id}`
  **200**); roadmap restored to its original 2 phases.
- Gates: `typecheck` 0 · `lint` 0 errors · **188** unit · clean `build` · e2e ✓.

**State note:** apply records the pack id in the roadmap's `applied_template_keys`;
there is no un-apply endpoint, so after deleting the added phase the `mvp-build`
card still shows **Applied / Re-apply** on the staging test workspace. The roadmap
*content* is fully restored — only the applied-flag bookkeeping persists (by design).

## Follow-ups (remaining roadmap-writes slices)

- **AI Re-plan** (`/replan` — preview/apply/history, the two-step human-gated flow).
- Dependency **graph view** (`GET /roadmap/dependencies`), phase rename UI,
  Milestones-list drawer, task detail fields, mentor role-gating.
