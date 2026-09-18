# SOP — Module 25: Documents · document editor (`GET`/`PUT /documents/{id}`)

## What shipped

A real **document editor** at `/documents/{id}`: open a rich document, edit its
title and section bodies, and save — with optimistic-concurrency conflict
handling. The Library now opens rich documents into it. Branch
`feat/api-document-editing` → PR into `develop`. Closes the Documents
"open/detail/edit" follow-up (Modules 12/14).

## Why

The Documents area could list, share, sign, and template documents, but there was
**no way to open or edit** one — clicking a document just fired a fake "Opened…"
toast. The backend has had `GET`/`PUT /documents/{id}` all along.

## How

- **`hooks/useDocumentEditor.ts`** (new) — `GET /documents/{id}` (title, status,
  version, `sections:[{id, heading, body}]`) and `save(title, sections)` →
  `PUT /documents/{id}` with `{title, sections, version}`. On success it stores the
  server's new version. **On `409 DOCUMENT_VERSION_CONFLICT` it does NOT auto-retry**
  (that would clobber whoever else edited the doc) — it returns a `conflict` flag;
  a `403` (mentor) is surfaced too.
- **`app/(dashboard)/documents/[id]/page.tsx`** (new) — editable title + one
  textarea per section, a dirty/`Saved`/`Saving…` indicator, an explicit **Save**
  (enabled only when dirty), and a **conflict banner** ("this document was changed
  somewhere else… Reload latest") that re-fetches the current version, discarding
  local edits, rather than silently overwriting.
- **`documents/page.tsx`** — the Library row/card click now routes rich documents
  (`source: 'document'`) to `/documents/{id}`; uploaded files (which aren't editable
  documents) show a "preview not available yet" toast instead.

## What's involved

| Path | Change |
| --- | --- |
| `hooks/useDocumentEditor.ts` | new: GET + PUT with version + 409/403 handling |
| `app/(dashboard)/documents/[id]/page.tsx` | new: document editor |
| `app/(dashboard)/documents/page.tsx` | Library rows open rich documents |

Contract: `PUT /documents/{id}` (`DocumentSave{title, sections, status, folder,
version}`); conflict is `DocumentVersionConflict` → `409 DOCUMENT_VERSION_CONFLICT`
(`app/services/documents/service.py`).

## Verification (live, staging via dev proxy)

Created a `business_plan` document (v1, 9 sections), then deleted it after:

- **Open** — `/documents/{id}` → `GET` **200**, editor renders "Business Plan",
  "Draft · v1", the 9 real sections as empty textareas.
- **Edit + Save** — typed an Executive Summary → **Save** → `PUT` **200**, status
  "Saved", version bumped to **v2**.
- **Conflict** — bumped the server to **v3** out-of-band (the editor still held v2),
  edited again, Save → `PUT` **409 DOCUMENT_VERSION_CONFLICT** → the conflict banner
  appeared (edits kept locally, not overwritten).
- **Reload latest** — re-fetched → editor now at **v3**, banner cleared, Save
  disabled.
- Gates: `typecheck` 0 · `lint` 0 errors · **188** unit · clean `build` · e2e ✓.

## Follow-ups

- **Autosave** (debounced) could replace explicit Save, but the 409 semantics
  (never silently overwrite) matter more for long-form docs — keep the explicit
  Save + conflict banner unless product wants otherwise.
- Section add/remove/reorder and heading edits (today only bodies + the title are
  editable); status/folder changes; a real diff/merge on conflict instead of
  reload-and-lose.
- Uploaded-file preview (the "not available yet" path).
