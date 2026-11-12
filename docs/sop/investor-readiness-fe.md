# Investor Readiness FE pass (all five pages on the real API, sidebar unhidden)

## What shipped
The five mock Investor Readiness pages (Score & Gaps, Deck Review, Mock Q&A, Narrative Check, History) now read and write the real API
(slices A score #216, B deck #219, D Q&A #221, C narrative #236). The sidebar entry is back under GROW. PR: see the Investor Readiness
row in `docs/checklist/buildout-status.md`. Walk: `docs/checklist/investor-readiness-fe-walk.md`.

## Why
The module was five hard-coded pages hidden from the sidebar (FE #184). Every BE slice is merged, and the bar is "no half-built pages".

## How
| Piece | Decision |
|---|---|
| Data layer | `lib/api/readiness.ts` holds every type and call, copied from the live-captured guide `cofoundaz-api/docs/fe-integration-guide-investor-readiness.md`. `hooks/useReadinessApi.ts` (mock) is deleted. |
| Loading | `hooks/useReadinessLoad.ts`: a failed load keeps old data and sets an error, so pages show "We could not load X" with Try again, never a zero score. |
| Deck | Upload goes through Documents (`uploadFile`), then `POST /readiness/deck-reviews`. The page polls the review every 2 s up to 90 s (the review, not the job, because a job can succeed with a failed review). A 200 `deduplicated` reply opens the existing review with a notice. Thumbnails use the signed links and refetch the review once if one fails (15 minute expiry). |
| Design tile | Labelled "Layout check, not a visual review" (D-IR-5). |
| Q&A | `hooks/useQaSession.ts`: resumes an open session, sends `expected_turn` with every answer, handles `TURN_MISMATCH` by reloading the session, offers "End and score" on `AI_BUDGET_LOW`, polls scoring, offers "Try scoring again" on a failed session whose transcript is kept. A team member gets a table of sessions with ratings only. |
| Narrative | `hooks/useNarrative.ts`: autosave 1 s after typing stops (whole text each time), flush before a check, poll `checks/latest` every 2 s up to 60 s. Findings are rendered from the API's `message` verbatim. |
| History | Step line on a real time axis (points are stored only on change), 70 line, markers, one log table for deck reviews, Q&A sessions and narrative checks. |
| Roles | `NAV_ROLES['/investor-readiness']` changed from founder, team member, investor to **founder, team member** (D-IR-4: investors only through a Funding share; advisors get 403). `RouteGuard` shows the access-denied page; the sidebar hides the entry. Team members see read-only pages: no Recalculate, no market form, no upload, no Start, read-only textarea, no Check button. |
| Rejected | Showing a team member the Q&A transcript (the API never returns it); polling the job instead of the review; a mock "Open Funding Hub" gate (it is a soft link shown only when `ready`). |

## What's involved
- New: `lib/api/readiness.ts`, `lib/readiness-format.ts`, `hooks/useReadinessLoad.ts`, `useReadinessScore.ts`, `useDeckReviews.ts`, `useQaSession.ts`, `useNarrative.ts`, `app/(dashboard)/investor-readiness/_components/states.tsx`.
- Rewritten: the five pages under `app/(dashboard)/investor-readiness/`.
- **Shared files touched (lead to note):** `components/sidebar.tsx` (new item + comment), `components/sidebar.test.tsx`, `lib/nav-access.ts` (+ test).
- No migration, no env var, no new dependency.

## Verification
Type-check, lint (React compiler rules), and the touched tests: `lib/readiness-format.test.ts`, `lib/api/readiness.test.ts`,
`lib/nav-access.test.ts`, `components/sidebar.test.tsx`. Live walk as founder, team member, mentor and accountant at 1440 and 375 against a
scratch API stack. **The real model could not be used (OpenAI `insufficient_quota`), so deck review, Q&A and narrative extraction ran on the stub
model: NOT verified on the real model.** Details and gaps in the walk file.

## Operate / roll back
Revert the PR: the sidebar entry disappears and the pages return to mock. Nothing to deploy beyond the FE.

## Follow-ups
- Re-run the real-model deck review, a full Q&A session and a narrative check once the model account has credits.
- Walk the unexercised states listed in the walk file (budget messages, failed reviews, capped and ready, 10-answer cap).
- "Open Funding Hub" links to `/funding`, which is still a hidden mock page: decide whether to hold that button until Funding is real.
- The investor share of the score belongs to Funding (D-IR-6), nothing built here.
