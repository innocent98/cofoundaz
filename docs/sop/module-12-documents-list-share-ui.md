# SOP — Module 12: Documents · rich-documents list + per-document Share UI

## What shipped

The Documents **Library** (`/documents`) now lists **rich documents**
(`GET /documents`) alongside uploaded files, and each document has a **Share**
action that creates a real share (`POST /documents/{id}/shares`) and shows the
**one-time link**. This completes the create-share flow the Sharing overview
(Module 11) deferred. Branch `feat/api-documents-list-share` → PR into `develop`.

## Why

The Library showed only files (Module 9); the shareable/signable **documents**
entity wasn't listed, and there was no way to create a share from the UI (the
overview modal only pointed the user elsewhere).

## How — key decisions

- **New `useDocuments` hook** — `GET /documents` → rich-document list
  (`{id, title, kind, status, folder, updated_at, ai_generated}`) mapped to the
  library item shape.
- **Unified Library list** — the page merges rich documents (`source:
  'document'`, `DOC` badge) and files (`source: 'file'`, extension badge) into one
  list, keeping the real per-folder counts, search and grid/list views. Actions
  are source-aware: **documents → Share**, **files → Delete**.
- **Per-document Share modal** — email + access level (`view`/`comment`, no Edit
  in v1) + a "expires in 30 days" toggle → `useDocumentShares.createShare` →
  swaps to a **"Share link created"** panel showing the returned **one-time
  `link`** with a Copy button and the guide's warning ("shown once — can't be
  retrieved later", §1).

## What's involved

- `hooks/useDocuments.ts` (new) — rich-document list.
- `app/(dashboard)/documents/page.tsx` — unified list (docs + files), Share
  action + modal reusing `useDocumentShares.createShare`.

## Verification (live, staging) — full flow

- The Library shows the real rich document **"Mutual NDA"** (All documents **1**)
  with a Share button.
- Clicking Share → modal → `partner@example.com`, **comment** access → "Create
  link" → the modal showed the real **one-time link**
  (`https://staging-api.cofoundaz.com/shared/U0HutYZ63…`); the server then had
  **1 active share** (partner@example.com, comment). Copy + the "shown once"
  warning render.
- Gates: `typecheck` 0 · `lint` 0 errors · **188** unit · clean `build` ✓.

## Follow-ups

- **Document open/detail** — `GET /documents/{id}` (sections) + editing
  (`PUT /documents/{id}`, `409` version conflict); **delete** a document.
- **Public open** page `GET /shared/{token}` (no auth) for recipients.
- Files can't be shared (sharing is document-scoped) — a file→document
  conversion or upload-as-document flow, if the product wants it.
- Remaining Documents slices: **E-signature**, **Templates** (the "New document"
  button already routes to `/documents/templates`).
- Mentor **role-gating** (create/share/delete are editor-only).
