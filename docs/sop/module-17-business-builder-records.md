# SOP — Module 17: Business Builder · record CRUD

## What shipped

The four Business Builder **record** artifacts — **Customer Personas**,
**Competitive Analysis**, **Pricing Strategy**, and **Revenue Model** — are now
fully wired to the real API. Each page lists live records and supports
create / edit / delete against `cofoundaz-api`, replacing the hardcoded mock
arrays. Branch `feat/api-bb-records` → PR into `develop`.

## Why

Modules 6/16 wired the Business Builder overview and canvas writes, but the four
record pages still rendered static sample data (mock personas, competitors,
pricing tiers, revenue streams) with no persistence. This slice makes them real.

## How

- **SDK (`lib/api/business-builder.ts`)** — replaced the loose, unused
  `getEntities/createEntity/…` helpers (which returned the wrong shape and didn't
  wrap the body) with typed record methods that match the real contract:
  - `listRecords(kind)` → `GET /business-builder/{kind}` → `{ records, fields }`.
  - `createRecord(kind, data)` / `updateRecord(kind, id, data)` → `POST`/`PUT`
    with the body wrapped as **`{ data }`** (the API's `RecordCreate`).
  - `deleteRecord(kind, id)` → `DELETE` (`{ deleted: true }`).
  - `kind` is the **plural, hyphenated URL segment** the API routes on:
    `personas`, `competitors`, `pricing`, `revenue-streams` — **not** the enum
    value (`revenue_stream`). This mismatch is the main integration trap.
- **Hook (`hooks/useBusinessRecords.ts`)** — one generic hook per kind:
  `{ records, fields, loading, error, refetch, create, update, remove }`. Every
  mutation **re-lists** so the UI reflects exactly what the server persisted
  (it owns `id`/`position` and normalizes `data`). Shared `errMessage()` surfaces
  the API's `field_errors`/`message` (the record schemas are `extra="forbid"` and
  require some fields, so a bad payload → a readable message, not a silent fail).
- **Reusable form (`components/business-builder/record-form-modal.tsx`)** — a
  descriptor-driven modal (`text`/`textarea`/`number`/`list`/`select`). Lists edit
  as one-item-per-line and convert to/from `string[]`; numbers parse to floats.
  Covers personas, competitors, and revenue streams.
- **Pricing form (`components/business-builder/pricing-form-modal.tsx`)** —
  pricing's `tiers` is a **nested repeatable** list (`{name, price, features[]}`),
  which the generic modal can't express, so it has a tailored editor (add/remove
  tiers, per-tier feature lists).
- **Enum selects are server-driven** — `threat_level` (competitors) and
  `model_type` (pricing) options come from the served `fields[].choices`, not
  hardcoded, so they can't drift from the backend enums.
- **No fabricated data** — the old mock pages showed invented figures (a fake
  12-month projection bar chart, invented positioning-map dots). Those are gone;
  the revenue page now shows a **real** total-estimated-monthly derived from the
  records, and the positioning map only plots competitors whose `map_x`/`map_y`
  are actually set.

## What's involved

| Path | Change |
| --- | --- |
| `lib/api/business-builder.ts` | typed `BusinessRecord`/`RecordField`/`RecordListResponse` + `listRecords`/`createRecord`/`updateRecord`/`deleteRecord` |
| `hooks/useBusinessRecords.ts` | generic list+CRUD hook, `errMessage()` |
| `components/business-builder/record-form-modal.tsx` | descriptor-driven form modal |
| `components/business-builder/pricing-form-modal.tsx` | nested-tier pricing form |
| `app/(dashboard)/business-builder/personas/page.tsx` | real persona cards + CRUD |
| `app/(dashboard)/business-builder/revenue-model/page.tsx` | real stream table + total + CRUD |
| `app/(dashboard)/business-builder/competitive-analysis/page.tsx` | real competitor table + positioning map + CRUD |
| `app/(dashboard)/business-builder/pricing/page.tsx` | real pricing models + tier tables + CRUD |

Backend (referenced): `app/api/v1/endpoints/business.py` (`_KIND_PATHS`, record
routes), `app/services/business/record_defs.py` (`RECORD_SCHEMAS`, `fields()`),
`app/services/business/records.py` (`serialize_record`).

## Verification (live, staging via dev proxy)

Each page driven end-to-end in the browser; network confirmed and the workspace
restored to its pre-test state (personas back to the 1 pre-existing record):

- **Personas** — created "Chidi Okada" (`POST 201`) with goals/frustrations/
  watering-holes lists → rendered as cards; edited the quote (`PUT 200`); deleted
  (`DELETE 200`).
- **Revenue** — created "Core Subscription" `est_monthly 2,500,000`
  (`POST 201`) → table shows `₦2,500,000` and the **total** row; deleted (`200`).
- **Competitors** — created "Cowrywise", `threat_level=high`, `map_x=0.45`,
  `map_y=0.75` (`POST 201`) → red **High** badge in the table and a dot plotted
  upper-left on the positioning map; deleted (`200`).
- **Pricing** — created a `freemium` model with **two nested tiers**
  (Basic/Free, Pro/₦500/mo, each with feature lists) (`POST 201`) → rendered as a
  tier table; edited model → `tiered` and Basic → ₦0 (`PUT 200`, tiers
  re-hydrated into the form correctly); deleted (`200`).
- Gates: `typecheck` 0 · `lint` 0 errors · **188** unit · clean `build` · e2e ✓.

## Follow-ups

- **AI-fill** for each kind (`POST /business-builder/{kind}/ai-fill`, 202 → job
  polling) — the "Generate from…" affordance is not yet wired.
- **Positioning map** as an editable artifact (`GET`/`PUT /positioning-map` axes)
  — currently the competitor map is read-only from each record's `map_x`/`map_y`.
- **Suggestions** approve/reject (its own guide) and **mentor role-gating**
  (writes are editor-only).
- Reordering records (the API stores `position`; the UI doesn't expose drag yet).
