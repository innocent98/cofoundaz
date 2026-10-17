# SOP — Startup Assessment (Module 07) real-API integration

**What shipped:** the Startup Assessment (`/assessment/*`) moved from 100% mock to the real
adaptive `cofoundaz-api` `/assessments*` endpoints. Guide:
`cofoundaz-api/docs/fe-integration-guide-assessment.md`. PR: see the FE PR titled
"Wire Startup Assessment to the real adaptive API".

## Why
`hooks/useAssessmentApi.ts` returned `MOCK_QUESTIONS` / `MOCK_HISTORY` and a fake
`localStorage` session. The runner indexed a fixed 9-question array and ended on a
hardcoded "↑85 / ↑80". The BE could not be wired earlier because question objects carried
no text; BE PR #127 added `prompt` and `helper`, which unblocked it.

## How
- **`lib/api/assessment.ts`** (new): typed SDK over `apiClient` (Bearer + `X-Workspace-Id`
  auto-injected): `startAssessment`, `getNextQuestion`, `submitAnswer`, `completeAssessment`,
  `listAssessments`, `getAssessment`, `compareAssessments`. Also `DIMENSION_ORDER` /
  `DIMENSION_LABEL` / `sectionProgress` / `formatAssessmentDate`.
- **`hooks/useAssessmentApi.ts`** (rewritten, mock deleted): `useAssessmentRunner(id)` is
  server-driven. It holds the server's `next_question`, `answer()` posts and adopts the
  server's next question, and on `null` it calls `complete` and exposes the real result.
  Loading an already finished assessment lands on its result (complete is idempotent).
  Also `useAssessmentHistory`, `useAssessmentDetails` (lazy per-row detail), `useAssessmentComparison`,
  `useStartAssessment`, `useInProgressAssessment`.
- **Runner** `run/[id]/page.tsx`: renders by `qtype` (`single_choice` → option cards,
  `scale_1_5` → 1 to 5 buttons, `numeric_currency` → ₦ input, `multi_choice` / `short_text`
  kept). Uses the real `prompt` and `helper`. Result screen shows `overall_provisional`,
  `narrative` and the five `dimension_scores`.
- **Other pages:** overview (start / continue / "Start a check-in"), in-progress (real resume),
  results (history + expandable scores with deltas vs the previous completed one), compare
  (radar from `GET /assessments/compare`, up to 3; strength / focus / biggest-improvement
  cards derived from the real scores).

## Decisions and tradeoffs
| Decision | Why |
|---|---|
| Progress is **per section (N of 5)**, not a percentage of questions | The bank is adaptive (`show_if`); the server gives no total. A fake percentage would be fabricated. |
| Single-choice and scale answers **submit on click** | Matches the old auto-advance; the options disable while the request is in flight. |
| Result headline is "Your assessment score is N", not "Your Health Score is N" | `overall_provisional` is the assessment's own score; the Health Score is recomputed server-side from more than this. |
| "Save & exit" only toasts and navigates | Every answer is already persisted server-side. |
| Stage label and "driven by incorporation" copy dropped | The API has no such field; nothing is invented. |

## What's involved
`lib/api/assessment.ts`, `lib/api/assessment.test.ts`, `hooks/useAssessmentApi.ts`,
`app/(dashboard)/assessment/{layout,page}.tsx`, `.../run/[id]/page.tsx`,
`.../in-progress/page.tsx`, `.../results/page.tsx`, `.../compare/page.tsx`.
No BE changes, no new dependencies.

## Verification
Live on the local full stack (API :8000 + worker, FE :3001), account NovaPay:
- Start → 9 questions (no-revenue branch), then a second run of the full **11 questions**
  including the numeric MRR and the IP-assignment `show_if` branches; every prompt and
  `helper` came from the server.
- Save & exit → `/assessment/in-progress` → Resume landed on the right question.
- Result screens: 62 (first run) and 93 (second) with real dimension scores and narrative.
- Dashboard Health card read 90 before, **62** after the first completion and **93** after the
  second, matching `GET /health-score`.
- Past results: real rows, AI narrative and dimension scores on expand. Compare: three real
  radar polygons and derived cards. Unknown id → honest "We could not find that assessment."
- Gates: `npm run typecheck`, `lint`, `test` (236, incl. 7 new SDK tests), `build` all green.

## Operate / roll back
Pure FE change; revert the PR. Needs BE with PR #127 (question `prompt`).

## Follow-ups
- `GET /assessments/{id}` `answers_by_dimension` is typed but unused.
- The non-founder (403) path and `INVALID_ANSWER` display were not exercised live.
- The richer AI narrative replaces the templated one on a later read; the result screen shows
  the one returned at completion (past results shows the latest).
- Several assessments completed on the same day look identical in the Compare legend except
  for the Kickoff / Quarterly label and score.
