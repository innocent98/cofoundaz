# SOP — Document editor: section add / remove / reorder / heading

**What shipped:** the document editor now supports full **section structure editing** —
add a section, remove one, reorder (move up/down), and edit section **headings** — not
just the section bodies. Closes the structural part of checklist §6b (document editor).

## Why

The editor let you edit the title and each section's **body**, but headings were
read-only and there was no way to add, remove, or reorder sections. The API already
accepts the whole `sections` array on save, so this was purely a FE gap.

## How

`app/(dashboard)/documents/[id]/page.tsx` (local editable state → explicit Save):
- **Editable heading** — the read-only `<h2>` became an input (`setSectionHeading`).
- **Add section** — a dashed "Add section" button appends `{heading:'New section',
  body:''}` (no `id`; the server assigns one on save).
- **Remove section** — a trash control per section.
- **Reorder** — ChevronUp/Down per section swap it with its neighbour (ends disabled).
  Move buttons rather than drag: sections are full-width vertical blocks, so up/down
  is clearer and more robust than vertical DnD.
- Controls sit inline with the heading and reveal on row hover / focus to keep the
  page calm. Every edit marks the doc dirty; the existing **Save** persists the whole
  array via `useDocumentEditor.save(title, sections)`.

### Why explicit Save, not autosave
Documents use **optimistic concurrency** (`version` + `409 DOCUMENT_VERSION_CONFLICT`)
and, unlike canvases, **must not auto-retry** — that would clobber a co-editor. The
editor keeps the explicit Save + dirty indicator + conflict banner ("reload latest").
Autosave would fight that model, so it's intentionally left out (noted as a follow-up
only if the product wants per-keystroke saves with conflict surfacing).

## Verification

| Check | Result |
|---|---|
| typecheck / lint / unit | 0 / 0 / 188 |
| build / e2e | clean / 153 |
| **Live (staging)** | On the real "Business Plan" doc (9 sections): **added** a "TEMP verify" section, **edited its heading**, **moved it up**, **Saved** → server showed 10 sections with "TEMP verify" persisted at position 8 (version 1→2). Then **removed** it + Saved → server back to the original 9 sections in order (version →3). Add / heading-edit / reorder / remove / save all confirmed end-to-end, then restored. |

## Follow-ups

- Drag-reorder (currently up/down buttons).
- Optional debounced autosave that surfaces (never auto-resolves) the 409 conflict.
- Inline file preview on `/sign` (separate, tracked elsewhere).
