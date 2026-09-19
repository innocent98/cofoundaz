# SOP — Roadmap Re-plan DiffViewer (deltas + expandable history)

**What shipped:** a reusable before→after `DateDiff` component for AI Re-plan, adding
**day-delta magnitude** to every date shift, a computed **summary** on the proposal,
and **expandable history entries** that reveal their real before/after diffs (data the
UI previously discarded). Closes the re-plan slice of checklist §6c (DiffViewer).

## Why

The re-plan **preview** already showed a per-row `old_due → new_due`, so the core diff
existed — the audit's "DiffViewer missing" was a keyword false-positive. But two real
gaps remained on data that was already present:
- **No magnitude.** old→new dates didn't say *how far* a milestone moved.
- **History threw its diff away.** Each history entry carries `changes[]` with
  `old_due`/`new_due`/`reason` per milestone, but the UI only joined the titles into a
  sentence — the actual before/after was invisible.

## How

- **`components/roadmap/date-diff.tsx`** (new) — `DateDiff` renders old (struck) →
  arrow → new (green) + a signed **day-delta chip** (`+17 days` red for later, green
  for pulled-in). Exports `dayDelta`, `fmtDay`, `deltaLabel`. All computed from the
  real ISO dates — no invented numbers.
- **`app/(dashboard)/roadmap/replan/page.tsx`**
  - Preview rows now use `DateDiff`; the proposal header shows a computed summary
    (`"N milestones adjusting — up to +M days later"`).
  - **History entries are collapsible** (`expandedHistory` set + chevron); expanding
    one renders its `changes[]` as `DateDiff` rows with title + reason.
  - Removed the local `fmtDate`/inline diff (folded into the shared component).

## Verification

| Check | Result |
|---|---|
| typecheck / lint / unit | 0 / 0 / 188 |
| build / e2e | clean / 153 |
| **Live (staging)** | On the test account (on-track, 0 drift → correct "you're on track" state) the real **history entry expanded to show `Sep 8 → Sep 25` with a computed `+17 days` chip** and the reason — verifying the DiffViewer against real data the old UI hid. |

> The **preview-with-changes** path (a live proposal) couldn't be shown because the
> test account has no slipped milestones; it renders through the identical `DateDiff`
> component exercised by the history view, and `previewReplan`/`applyReplan` are
> already verified live (module-18-roadmap-replan).

## Follow-ups

- Reuse `DateDiff`/the diff pattern for the other DiffViewer sites the audit named
  (document versions, AI-config prompts, assessment answers) once those have data.
