# SOP: Documents 375px layout fixes (D6 to D8)

**What shipped:** three phone-width layout fixes on the Documents page, found by the second Documents re-walk (`docs/checklist/documents-rewalk.md`). PR: fix/documents-375-layout (link added on the PR).

## Why

| # | Symptom at 375x812 | Root cause |
|---|---|---|
| D6 | The "…" menu on a file row (10 items) opened upward and its top sat at y=-70, so "Open" and "Rename" could not be tapped | `RowMenu` was `absolute` and picked up/down with a fixed 44px-per-item guess, with no clamp to the viewport |
| D7 | In "Send for signature" the signer email input shrank to 26px | Email, name (fixed `w-24`), order arrows and trash shared one non-wrapping flex row |
| D8 | No way to create a folder on a phone | The folder tree (and its "New folder" button) is `hidden lg:block`; the phone fallback was a bare `<select>` |

## How

- **D6** `components/documents/row-menu.tsx`: the menu is now `fixed`, positioned from the button's rect when it opens. It opens on the side with more room (below, minus an 80px reserve for the mobile tab bar), clamps `top` to an 8px margin, and gets a `maxHeight` with `overflow-y-auto`, so every item stays reachable even in a very short viewport. It closes on scroll and resize, because a fixed menu would otherwise detach from its row. Works for document and file rows (same component).
- **D7** `components/documents/send-dialog.tsx`: the signer row wraps below `md`. Email gets `flex-1 basis-40` and the name input drops to its own full-width line (`order-last`, `basis-full`); from `md` up it is the original single row.
- **D8** `app/(dashboard)/documents/page.tsx`: a "New folder" button (`btnSecondary`, `lg:hidden` through its wrapper) sits beside the folder select and opens the same `PromptDialog` as the desktop tree, including "New folder in <current>" nesting.

Rejected: a portal for the menu (more code, same result); keeping `absolute` with a flip only (cannot guarantee in-viewport on short screens).

## Verification

Local `typecheck`, `lint`, `npm test` and `build` (the same steps as `.github/workflows/ci.yml`). Live 375 and 1440 check of all three on merged `develop` is recorded in `docs/checklist/documents-rewalk.md`.

## Operate / roll back

FE only, no config or migration. Revert the PR.

## Follow-ups

Other `RowMenu`-like menus elsewhere still use absolute positioning; none were flagged by the walk.
