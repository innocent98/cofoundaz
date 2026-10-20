# SOP: Assessment re-walk fixes (A1-A4)

## What shipped
FE fixes for gaps A1-A4 from the live re-walk (`docs/checklist/assessment-rewalk.md`, branch `docs/assessment-rewalk`).
Branch `claude/fix-assessment-rewalk-c22ee7`; PR to `develop` (see the PR). A5 (old mentor bell rows) is BE data, untouched.

## Why
| Gap | Problem |
|---|---|
| A1 (medium) | Completion rows paired the assessment's own dimension score with the Health-score delta ("Product -38 · 25/100" while `health.dimensions[product]` was score 31, previous 69). Two scales in one row. |
| A2 (low) | Compare card titled "Biggest improvement" showed "-75 Product" when everything fell; strength/focus silently took the first dimension on a tie. |
| A3 (info) | Revisiting a finished `/assessment/run/{id}` replays `/complete` with `health: null` and showed a "complete" card with no Health data. |
| A4 (low) | A team member on `/assessment/run/{id}` got a 403 card with a useless "Try again". |

## How
- **A1**: `CompletionScreen` now takes the `CompletionHealth` and renders only Health numbers per row: `score/100`, `was {previous}`, signed delta, all from `health.dimensions[]`. The assessment's own scores are no longer shown here (they live on Past results). Rejected: labelling both scales in one row; too dense at 375.
- **A2**: pure helpers in `lib/assessment-insights.ts`. `changeInsight` returns `improvement` only when the best change is > 0, else `drop` (most negative), else `none` ("No dimension improved" / "No change"). Ties are deterministic: every tied dimension is named, "Product and Team (tied)", for strength, focus and change.
- **A3**: a done result without `health` is a replay. The page redirects with `router.replace('/assessment/results')` (shows a short "Opening your results..." status meanwhile; `refreshHealthScore` is not called). In-session completions always carry `health`, so they still show the completion screen.
- **A4**: `useAssessmentRunner` exposes `loadStatus`. A 403 renders "This check-in is read-only for you" with a single "Past results" button; other errors keep "Try again" and "Back to overview".

## What's involved
`app/(dashboard)/assessment/run/[id]/page.tsx`, `app/(dashboard)/assessment/compare/page.tsx`, `hooks/useAssessmentApi.ts` (`loadStatus`), new `lib/assessment-insights.ts` (+ test). Tests: `assessment-pages.test.tsx` (A1, A2 x4, A3, A4 x2), `e2e/assessment.spec.ts` (A1, A3). No API or config changes.

## Verification
Local CI parity: typecheck, lint, vitest (983), `next build`, Playwright (163), all green. Live on the shared API (:8000) from a worktree dev server:
A1 fresh founder check-in showed Health score/was/delta per row (e.g. Product was 55, -1, 54/100), no assessment score, fits at 375;
A2 live Compare: "Biggest drop -100 Legal", "Biggest improvement +75 Legal", "Product and Team (tied)", "No dimension improved / No change";
A3 finished run id redirected to `/assessment/results`;
A4 team member on a run id (375 and 1440) saw the read-only message, no Try again, button lands on Past results.

## Operate / roll back
FE only; revert the PR. No migrations.

## Follow-ups
A5 (stale pre-#152 `assessment.completed` rows in mentor feeds). Quarterly banner and `assessment.quarterly.due` deep link still need a live check.
