# SOP: Assessment PRD, FE half (rows 1-4, 7, 9-13)

## What shipped
FE wiring for the Assessment gap list (`docs/checklist/assessment-prd-gaps.md`), rows 1, 2, 3, 4, 7, 9, 10, 11, 12, 13.
Pairs with API PR #152 (`feat/assessment-prd`, merged; migration 0060). Contract:
`cofoundaz-api/docs/fe-integration-guide-assessment-prd.md` (live-captured). FE PR: see the PR for branch `feat/assessment-prd-fe`.

## Why
The page worked but missed the PRD: own header (no Cmd-K, dead "+ Invite"), "Let's calibrate Cofoundaz", team members
offered founder-only controls that 403'd, a section-based progress estimate, a completion screen that showed the
assessment's own score (and a duplicate strongest/focus line on ties), a header health pill that stayed stale until
reload, results without answers or stage, and no in-app quarterly prompt.

## How
| Row | Change |
|---|---|
| 1 | `layout.tsx` mounts `ShellTopBar` (as Validation). `canInvite` already hides "+ Invite" for non-founders. |
| 2, 3 | `page.tsx` heading uses `useWorkspace().workspaceName`; CTA "Begin" on first run, "Start a check-in" after, "Continue" if one is open, "Loading..." until history arrives (no flash of the wrong label). |
| 4 | New `canTakeAssessment(role)` in `lib/nav-access.ts` (founder only). Team members get a read-only start page (links to results and compare), no In progress tab, and a read-only in-progress route. Mentors and other roles are already blocked by `RouteGuard`; the API now 403s them too. |
| 7 | `progress {answered, remaining, pct}` is carried by `getNextStep` / `submitAnswerStep` and the list. Overview card and in-progress page read "You're {pct}% through. Pick up where you left off."; the runner bar uses `pct` (not monotonic, see guide section 2). The in-progress lookup calls `GET /assessments?status=in_progress` (the row 8 filter) instead of filtering client side. |
| 9 | `CompletionScreen`: "Done. Recalibrating your workspace…", then "Your Health Score is now {health.score}." / "Here's what changed.", total and per-dimension deltas (signed text, red for drops, never colour alone), "See my dashboard". The narrative line is dropped when all five scores tie. A replayed `/complete` (`health: null`) never overwrites the first response's `health` and falls back to "Your assessment is complete." |
| 10 | `refreshHealthScore()` in `hooks/useHealthScore.ts` re-fetches every mounted `useHealthScore` (the shell chip) quietly; called after a completion that carries `health`. |
| 11 | Results detail renders `answers[]` grouped by dimension; `changed` answers get a highlighted card and "Changed from: {label}"; a summary line counts changes (hidden for the first assessment). |
| 12 | "Stage at time: {Stage}" on each result row; null shows "not recorded" (`stageAtTimeLabel`). |
| 13 | `notificationHref('assessment.quarterly.due')` returns `/assessment`; when `meta.quarterly_due` and no check-in is open, founders see a banner with "Start re-assessment" (starts a quarterly). |

Rejected: a client-side stage lookup for old rows (D-ASM-3 says "not recorded", never a guess).

## What's involved
`lib/api/assessment.ts` (types, `fetchAssessmentList`, `getNextStep`, `submitAnswerStep`, `stageAtTimeLabel`;
`listAssessments`, `getNextQuestion`, `submitAnswer` kept as thin wrappers), `hooks/useAssessmentApi.ts`,
`hooks/useHealthScore.ts`, `hooks/useNotifications.ts`, `lib/nav-access.ts`,
`app/(dashboard)/assessment/{layout,page}.tsx`, `.../in-progress/page.tsx`, `.../run/[id]/page.tsx`, `.../results/page.tsx`.
No new dependencies, no BE changes.

## Verification
- Unit: `assessment-pages.test.tsx` (19: layout, start, in-progress, completion incl. drop / first run / tie / replay, runner bar, results), plus API client, `refreshHealthScore` and notification-href tests.
- E2E: `e2e/assessment.spec.ts` (6, API mocked with the guide's captured shapes): top bar, startup name, Begin, pct card, quarterly banner, completion and header pill refresh, results stage and changed_from, team member read-only.
- Local CI parity: typecheck, lint, `npm test` (974), `npm run build`, Playwright (162).
- Live (API :8000 on develop 5a25aae, alembic 0060; test accounts) at 1440 and 375, no horizontal overflow:
  - Founder: "Let's calibrate NovaPay"; full check-in, bar 0 to 88 then "Your Health Score is now 72." with "-23 from 95" and per-dimension deltas, header pill 95 to 72 with no reload (a second run showed 19 from 72); results show "Stage at time: Idea" and "not recorded" for older rows, answers grouped under five dimensions with 2 changed cards ("Changed from: Yes, we have revenue"); Save & exit then "You're 37% through." on overview and in-progress.
  - Team member: no Begin, Start, Resume, In progress tab or "+ Invite"; results with answers and changed_from load; `/assessment/in-progress` shows the read-only message.
  - Mentor: API list 403; `/assessment` shows "You don't have access to this page."; no sidebar entry.
  - `?status=bogus` returns 422; `?status=in_progress` is what the page calls.
- Not exercised live: the 90-day quarterly banner and the bell deep link (needs backdated data); both are covered by mocked unit and e2e tests only.

## Operate / roll back
Pure FE change, revert the PR. Needs API #152 (`progress`, `health`, `answers`, `stage_at_time`, `meta.quarterly_due`); against the older API the new fields are optional and the page degrades (no pct, no health block, no answers).

## Follow-ups
- Banner and deep link live check once a test workspace has a 90-day-old assessment.
- The completion screen shows the Health Score immediately; the AI narrative still arrives later in Results.
- The profile menu in the sidebar labels every role "Founder" (outside this scope).
- The local test account's Health Score is now low from the live runs (19).
