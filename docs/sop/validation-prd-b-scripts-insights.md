# SOP: Validation Hub PRD slice (b), interview scripts + Insight Synthesizer

## What shipped
FE half of Validation PRD slice (b), gap-list rows 7, 12 and 13. Pairs with API PR #150 (`feat/validation-prd-b`).
Stacked on slice (a) FE (`feat/validation-prd-a-fe`, PR #114), so it reuses `ShellTopBar`, `lib/api/validation.ts`,
`ConfirmDelete` and the layout toast. Contract: `cofoundaz-api/docs/fe-integration-guide-validation-prd-b.md`.

## Why
`/validation/scripts` flipped a flag and showed four hardcoded questions over a seed assumption list. The Insight
Synthesizer on Interviews and Surveys was a 2.5 s timeout over a hardcoded report whose "Apply" only toasted. There was
no deep link for the new "New pattern detected" notification.

## How
| Area | Change |
|---|---|
| API client | `lib/api/validation.ts` gains scripts (list, get, generate, PATCH, delete) and insights (synthesize, list, get, apply, delete) with the guide's types. |
| Scripts | `useScripts`: list, `generate` (POST, then `waitForJob` with a 90 s cap, because the worker retries a failed model call after 30 s), save, delete. `outcomeFromScriptResult` maps `ready / over_budget / gone / empty`; a timeout reads "Still working, check back in a minute." |
| Scripts page | Real assumptions via `useAssumptions` (no seed list), checkboxes capped at 5, "Generate script", static hint "Ask about the last time it happened, not hypotheticals.", saved list (newest first) with confirm delete. |
| Editor | `ScriptEditor`: title, questions with tips, up/down reorder buttons (keyboard friendly, no drag), add/remove. Save sends the whole ordered list and keeps existing question ids; new questions go without one. Client checks mirror the API's 422 copy, and a server 422 message shows inline. The editor scrolls into view on open (it sits above the fold on a phone). |
| Synthesizer | `InsightSynthesizer({source})` drawer on Interviews (`interviews`) and Surveys (`surveys`). `useInsights`: synthesize (same polling), history, read, apply, delete. `NOTHING_TO_SYNTHESIZE` (422) is an empty state, not a toast. Report in `InsightReport`: inputs line, patterns with quotes (quotes may be `[]`, then no quote block), contradictions and suggestions (hidden when empty), a per-suggestion Apply. |
| Apply | Replaces the report from `data.insight`, toasts the assumption's new status from `data.assumption`; 409 refetches the report (already applied); 404 shows "That assumption no longer exists." and disables the button. |
| Safety | Model text is rendered as React text nodes only, labelled AI-generated. `plainProse` swaps em/en dashes for commas in model prose (not in customer quotes), as a belt-and-braces to the API-side fix. |
| History | "Past reports" lists all reports newest first (source, date, inputs, pattern count) with confirm delete. |
| Notification | `validation.insight.detected` -> `/validation/interviews?insight={insight_id}`; the drawer opens that report (404 shows "That report no longer exists."). The CTA label comes from `body` ("See insight"). The inbox row used to only toast on click, so it now marks the row read and navigates when its type has a destination (this also fixes the existing smoke-test and roadmap links in the inbox). |

Decisions and rejected alternatives:
- Drawer (as designed) instead of a new route; deep link via a query param so one component serves both tabs.
- Up/down buttons instead of drag and drop: accessible by default and testable.
- The MVP tab keeps its mock synthesizer on purpose; it belongs to slice (c).
- Escape inside the delete confirm must not also close the drawer behind it, so the drawer ignores close while its confirm is open.

## What's involved
`lib/api/validation.ts`, `lib/validation-format.ts`, `hooks/useScripts.ts`, `hooks/useInsights.ts`,
`hooks/useNotifications.ts`, `components/validation/{ScriptEditor,InsightReport}.tsx`,
`app/(dashboard)/validation/{scripts/page.tsx,components/InsightSynthesizer.tsx,interviews/page.tsx,surveys/page.tsx}`,
`app/(dashboard)/notifications/page.tsx`. Tests: `components/validation/validation-slice-b.test.tsx`,
`hooks/useValidationSliceB.test.ts`. No migrations or config.

## Verification
- Local CI parity from the worktree: typecheck, lint, `npm test` (925 passed), `npm run build`, `npm run test:e2e` (156 passed).
- Live against the local API at :8000 with the real model, founder and team member, at 1440 and 375: ticked two assumptions, generated a 9-question script, edited it (reorder, add, blank-question error, save) and confirmed the ids and order in the API; synthesized Interviews, applied a suggestion (button became "Applied"), opened the report from the notification, deleted it from Past reports (Escape closes only the confirm), Surveys with no data showed the `NOTHING_TO_SYNTHESIZE` empty state, a deleted report's link showed the 404 message, the team member saw the notification and ran a synthesis.
- Not exercised live: `over_budget`, `gone`, `empty` job results, the 90 s "still working" cap, Apply 409 and 404, a surveys-source report with open answers, 422 messages other than the client-side ones. These are unit tested only.

## Operate / roll back
FE only. Revert the PR; the API endpoints stay and are harmless.

## Follow-ups
- Slice (c): MVP feedback tab (still mock) and `source=all`.
- The notifications page is otherwise still mock (announcements, preferences).
- Script editor has no dirty-state guard when closing with unsaved edits.
