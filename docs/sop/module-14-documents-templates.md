# SOP — Module 14: Documents · Templates

## What shipped

The Documents **Templates** gallery (`/documents/templates`) now lists the real
template catalog (`GET /document-templates`) and **creates a document** from a
template (`POST /documents { template_key }`), then routes to the Library where
it appears. This completes the Documents area. Branch
`feat/api-documents-templates` → PR into `develop`.

## Why

The gallery was 12 hardcoded cards whose "Use template" button only fired a
toast; the real catalog has 5 templates and creation was never wired.

## How — key decisions

- **New `useDocumentTemplates` hook** — `GET /document-templates` (note: **not**
  under `/documents` — a sibling path) → the 5-entry catalog
  (`{key, name, description, kind, sections[]}`); `createFromTemplate(key)` →
  `POST /documents { template_key }`.
- **Category derived from `kind`** — the catalog has no category field, so the
  page groups the templates into BUSINESS / FUNDRAISING / FINANCE / OPERATIONS
  by keyword on `kind` (only non-empty groups render).
- **Create → navigate** — "Use template" creates the document and `router.push`
  es to `/documents`, where the Library (Module 12's `useDocuments`) shows the
  new rich document; each card shows its section count and a per-card "Creating…"
  state.

## What's involved

- `hooks/useDocumentTemplates.ts` (new) — catalog + create-from-template.
- `app/(dashboard)/documents/templates/page.tsx` — real catalog, loading/empty
  states, create + navigate.

## Verification (live, staging)

- `GET /document-templates` → **200**; the gallery renders the **5 real
  templates** (Business Plan · One-Pager · Pitch Deck · Financial Model · Meeting
  Notes) grouped by category, with section counts.
- **Use template verified live** — clicking "Use template" on **Pitch Deck**
  created a document (`POST /documents { template_key: 'pitch_deck' }`); the
  workspace document count went **1 → 2**, the app navigated to the Library, and
  the new **"Pitch Deck"** document rendered there alongside "Mutual NDA".
- Gates: `typecheck` 0 · `lint` 0 errors · **188** unit · clean `build` ✓.

## Follow-ups

- **Document open/edit** — open the created document and edit its sections
  (`GET`/`PUT /documents/{id}`, `409 DOCUMENT_VERSION_CONFLICT`); the "blank"
  create path (no `template_key`).
- **Template preview** (`GET /document-templates/{key}`) before creating.
- Mentor **role-gating** (create is editor-only).

## Documents area — complete

Files (M9), Sharing (M11), rich-documents list + Share UI (M12), E-signature
(M13), Templates (M14) are all wired to the real API and verified live. Remaining
within Documents are the deeper follow-ups above (document editing, public
`/sign` and `/shared/{token}` recipient pages).
