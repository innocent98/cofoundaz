# SOP — Business Builder canvas item drag-to-reorder

**What shipped:** canvas list items can now be **dragged to reorder** within their block
(by a grip handle), persisted via the existing autosave. Completes checklist §6c C3
(edit-in-place shipped in Module 30; this is the reorder half).

## Why

After edit-in-place (Module 30), items could be added / edited / removed but not
reordered — the order was fixed by insertion. The API stores the block as an ordered
array, so reordering is just a different array, saved the same way.

## How

- **`hooks/useCanvasEditor.ts`** — added `moveItem(key, from, to)`: splices the item out
  and reinserts it, then commits through the same debounced full-blocks autosave.
- **`components/business-builder/use-chip-reorder.ts`** (new) — a small reusable hook
  wrapping native HTML5 DnD:
  - `handleProps(key, idx)` → goes on a **grip handle** (the draggable element), so the
    chip's click-to-edit text and remove button stay clickable — no gesture conflict.
  - `dropProps(key, idx)` → goes on the chip (the drop target); `isOver(key, idx)` drives
    a ring highlight.
  - Reorder is **confined to one block**: the drop only fires when the dragged item and
    the target share the same block `key`.
- Wired into **business-model-canvas**, **swot**, **value-proposition** — each chip gains
  a hover-revealed `GripVertical` handle and drop handling.

## Verification

| Check | Result |
|---|---|
| typecheck / lint / unit | 0 / 0 / 188 |
| build / e2e | clean / 153 |
| **Live (staging)** | Seeded `[AAA, BBB, CCC]` into a BMC block, dragged **AAA (index 0) onto CCC (index 2)**; the UI reordered to `[BBB, CCC, AAA]` and the autosave persisted that exact order server-side (version bumped). Block then cleared to restore the account. |

> As with the Kanban and canvas-edit verifications, the drag was exercised by
> dispatching real `DragEvent`s with a shared `DataTransfer` (native HTML5 DnD doesn't
> respond to synthesized mouse-drags), which runs the exact handle→drop→`moveItem` path
> a user's drag does.

## Follow-ups

- `lean-canvas` still uses the older hook (no `useCanvasEditor`) — migrating it would
  give it edit-in-place + reorder too (tracked from Module 30).
- Records (personas / competitors / pricing / revenue) reorder via their own `position`
  field is a separate, still-open item.
