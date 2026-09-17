# SOP — Module 11: Documents · Sharing (real API integration)

## What shipped

The Documents **"Shared with others"** page (`/documents/shared`) now lists the
real workspace share overview (`GET /documents/shares`), joins document titles,
and **revokes** a share (`DELETE /documents/{document_id}/shares/{share_id}`).
`useDocumentShares` also exposes `createShare`. Second Documents slice (after
files). Branch `feat/api-documents-sharing` → PR into `develop`.

## Why

The page was static (`sharedListItems` mock) and its share modal only fired a
toast; the access-level picker offered a non-existent "Edit" level.

## How — key decisions

- **New `useDocumentShares` hook**: `GET /documents/shares` (workspace overview,
  §4b) for the list, `GET /documents` (rich-documents list) to **join the title**
  — the overview row carries only `document_id`, no title (§4b trap), so the FE
  must join. `createShare` (`POST /documents/{id}/shares`, JSON — returns the
  one-time `link`), `revokeShare` (`DELETE …/{share_id}`).
- **Active-only list**: the overview returns revoked shares too; the hook filters
  to `status === 'active' && !revoked_at` so "Shared with others" shows only live
  shares.
- **Access levels corrected**: dropped the "Edit" option — v1 supports only
  `view` / `comment` (guide §2).
- **Revoke** wired per row (optimistic, 404-tolerant); **empty state** added.
- **Sharing targets rich documents, not the files library** — they're distinct
  entities in the Documents area. Sharing is naturally initiated per-document, so
  the overview page's create-modal is left as a follow-up (needs a per-document
  Share action / the rich-documents list UI); its submit now points the user to
  open a document.

## What's involved

- `hooks/useDocumentShares.ts` (new) — overview fetch + title join, create,
  revoke, active-only filter.
- `app/(dashboard)/documents/shared/page.tsx` — real list, empty state, per-row
  revoke, access-level fix.

## Verification (live, staging) — full flow

- Empty state renders ("Nothing shared yet").
- Created a rich document (`POST /documents` → "Mutual NDA") and shared it
  (`POST /documents/{id}/shares`, `access_level: comment` → 201 with a one-time
  `link`); the overview then rendered the real row: **title "Mutual NDA"
  (joined)**, `advisor@example.com`, **Comment**, "Never viewed".
- **Revoke verified live** via the row's trash button — the server's active
  share count went to **0**, the row disappeared, and after reload the revoked
  share is correctly filtered out.
- Gates: `typecheck` 0 · `lint` 0 errors · **188** unit · clean `build` ✓.

## Follow-ups

- **Create-share UI**: a per-document "Share" action (from a document's own view)
  wired to `createShare`, showing/copying the returned one-time `link` (guide §1
  — the link is never retrievable again). The overview modal is a placeholder.
- **Rich-documents** list/create/detail (`GET`/`POST /documents`,
  `GET /documents/{id}`) — the Documents "Library" currently shows files;
  documents are a separate entity that sharing/e-signature/templates build on.
- **Public open** page (`GET /shared/{token}`, no auth) for recipients.
- Remaining Documents slices: **E-signature**, **Templates**.
- Mentor **role-gating** (create/revoke are editor-only).
