# SOP — Business Builder canvas item edit-in-place

**What shipped:** canvas list items can now be **edited in place** (click the item →
inline input → Enter/blur to save), not just added and removed. Closes part of
checklist §6c (canvas edit-in-place; reorder still open).

## Why

`useCanvasEditor` exposed `addItem`/`removeItem` but no edit — so fixing a typo in a
Business Model / SWOT / Value Prop item meant deleting the chip and retyping it. The
audit (C3) flagged "add/remove only today".

## How

- **`hooks/useCanvasEditor.ts`** — added `editItem(key, idx, text)`: replaces the item
  at `idx`, or removes it when the text is emptied; no-op edits skip the save. Persists
  through the same debounced full-blocks autosave (version + 409 handled in
  `useBusinessBuilderApi.saveCanvas`, Module 16/24).
- **`components/business-builder/inline-editable.tsx`** (new) — `InlineEditable`: a
  headless click-to-edit text. Shows the value; click (or Enter/Space when focused)
  swaps to an input that inherits the chip's colour/size; **Enter or blur commits**,
  **Escape cancels**. It owns only the text↔input swap so each canvas keeps its own
  chip wrapper + remove button.
- Wired into the three list canvases — **business-model-canvas**, **swot**,
  **value-proposition** — by replacing the item's `{text}` with `<InlineEditable>`.
  `mission-vision` is text-blocks (already editable via its textarea), and
  `lean-canvas` uses the older hook (its migration remains a separate follow-up).

## Verification

| Check | Result |
|---|---|
| typecheck / lint / unit | 0 / 0 / 188 |
| build / e2e | clean / 153 |
| **Live (staging)** | Seeded one Key Partners item via API, opened the BMC page, **clicked the chip → edited it to "EDITED in place" → committed**; the autosave PUT persisted it server-side (`key_partners: ["EDITED in place"]`, version bumped), then the block was cleared to restore the account. |

> The commit path (Enter/blur → `editItem` → autosave) was confirmed by the server
> reflecting the new text. Enter and blur both commit; Escape reverts.

## Follow-ups

- **Reorder** items within a block (drag / `position`) — still open (audit C3).
- Migrate `lean-canvas` onto `useCanvasEditor` so it gets edit-in-place too.
- Multiline editing (the input is single-line; long items still edit fine but wrap
  as text when displayed).
