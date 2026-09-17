# SOP — Module 9: Documents · Files (real API integration)

## What shipped

The Documents **Library** (`/documents`) now lists real files
(`GET /documents/files`), **uploads** real files
(`POST /documents/files`, multipart), and **deletes** them
(`DELETE /documents/files/{id}`) — with real per-folder counts and an empty
state. First slice of the Documents module (files); sharing / e-signature /
templates are separate follow-ups. Branch `feat/api-documents-files` → PR into
`develop`.

## Why

The Library was static — a hardcoded `libraryDocs` list, fake sidebar counts
(38/6/9/…), and an Upload button that only fired a toast.

## How — key decisions

- **New `useDocumentFiles` hook** (kept separate from the shared
  `useDocumentsApi`, which still feeds the signatures/shared/templates sub-pages)
  — `GET /documents/files` list, `uploadFile`, `deleteFile`, mapping the API file
  summary (`{id, filename, content_type, size_bytes, folder, url, uploaded_at}`)
  to the page's item shape.
- **Upload is multipart/form-data (guide §1)** — the one non-JSON endpoint. The
  hook builds a `FormData` (`file` + optional `folder`) and the central
  `apiClient` leaves `Content-Type` unset for a `FormData` body so the browser
  sets the multipart boundary. `folder` defaults to the selected sidebar folder.
- **Client-side allowlist + size gate (guide §5)** — the hook rejects
  non-allowlisted `content_type`s and files over **15 MB** *before* the request,
  with the guide's exact messages, so a bad pick fails instantly; the server's
  422 remains the backstop. The `<input accept>` is scoped to the allowed
  extensions.
- **Real sidebar counts** — computed per folder from the fetched files (was
  hardcoded), plus an **empty state** with an upload CTA and a per-row **delete**
  (optimistic, 404-tolerant).

## What's involved

- `hooks/useDocumentFiles.ts` (new) — list/upload/delete, allowlist + size
  constants, file→item mapping.
- `app/(dashboard)/documents/page.tsx` — consume the hook; real Upload (hidden
  file input), real counts, delete buttons, empty state.

## Verification (live, staging)

- `GET /documents/files` → **200**; empty state renders with a real **0** count.
- **Upload verified live end-to-end:** attaching a `text/plain` file through the
  FE input POSTed multipart and the server stored it
  (`investor-update.txt`, 53 bytes); the row rendered with a **TXT** badge,
  owner "You", the upload date, and "All documents **1**".
- **Delete verified live:** the row's trash button drove the server file count
  **1 → 0** and the UI returned to the empty state.
- Gates: `typecheck` 0 · `lint` 0 errors · **188** unit · clean `build` ✓.

## Follow-ups

- **Documents · Sharing** (`POST/GET /documents/{id}/shares`, revoke, open) —
  the "Shared" sub-page.
- **Documents · E-signature** (`signature.*` create/sign/cancel) — the
  "Signatures" sub-page.
- **Documents · Templates** (`GET /documents/templates`, apply) — the
  "Templates" sub-page.
- **Files:** open/preview a file via its `url` (LocalStorage path in dev,
  Cloudinary `https://` in prod — guide §1); `GET /documents/files/{id}` detail;
  folder move; grid-view delete (delete is list-view only today).
- Mentor **role-gating** — upload/delete are editor-only (mentor → 403).
- The `/documents` route shell still hardcodes the Health `72` pill (cross-cutting).
