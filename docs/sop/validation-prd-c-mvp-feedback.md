# SOP: Validation Hub PRD slice (c), MVP feedback inbox, themes, survey answers

## What shipped
FE half of Validation PRD slice (c), gap-list rows 9, 10 and 11. Pairs with API PR #151 (`feat/validation-prd-c`).
Based on develop after slice (b) FE (#115) merged, so it reuses `lib/api/validation.ts`, `useInsights`,
`InsightSynthesizer`, `ConfirmDelete` and the layout toast. Contract:
`cofoundaz-api/docs/fe-integration-guide-validation-prd-c.md` (live-captured).

## Why
`/validation/mvp` was entirely mock (four seed quotes, a 1.8 s timeout, hardcoded themes, a toast for "Send to
roadmap"). Surveys could not show open-text answers or re-show a lost share link, and had no QR. Assumption cards did
not show the experiments testing them.

## How
| Area | Change |
|---|---|
| API client | `lib/api/validation.ts`: feedback CRUD + restore, cluster job, themes, send-to-roadmap, `listRoadmapMilestones` (from `GET /roadmap`), survey answers, share-link rotation; `linked_experiments` on assumptions; `InsightSource` gains `feedback`. |
| Inbox | `FeedbackInbox` + `useFeedback`. Source tabs (All, Interview, Survey, In-app, Email) with the server's `counts`; filtering is client-side over one list call. Imported items (`imported: true`) are read-only: an "Edit it in the interview/survey" link and **Dismiss** (no confirm, it is undoable). "Show dismissed" refetches with `include_dismissed=true` and offers **Restore**. Manual items: add / edit in a dialog (source limited to interview, in-app, email; date defaults to today), delete behind a confirm. The `DELETE` reply is branched on `deleted` vs `dismissed`. |
| Themes | `FeedbackThemes`. "Find themes" runs the cluster job through `waitForJob` (2 s poll, 90 s cap). `ready` refetches themes; `over_budget` shows the daily-limit copy; `empty` and 422 `NOTHING_TO_CLUSTER` show an empty state; a timeout says "Still working, check back in a minute.". Cards are titled with `label` (counts already in it), show the summary and sources, and drill into the quotes. |
| Send to roadmap | Inline milestone picker listing only milestones that are not done, defaulting to the first. 201 shows "On your roadmap: {milestone}" (also after a reload: the milestone is found by `roadmap_task_id` in the roadmap tree) and removes the button. 409 `ALREADY_SENT` refetches and shows the sent state; 422 `NO_OPEN_MILESTONE` shows the server copy inline; when the roadmap loads with no open milestone the button is disabled with a link to Roadmap. |
| Synthesizer | MVP tab uses `InsightSynthesizer source="all"`; the inputs line now includes feedback items. |
| Surveys | New "Answers" tab beside "Results" (`SurveyAnswersPanel`, plain text, "Showing the newest N of M" when truncated). "New share link" on open surveys opens a confirm ("Anyone with the old link won't be able to answer."), calls `POST /share-link`, then shows `ShareLinkCard`: link, copy, QR (`qrcode`, already a dependency). The first-open link uses the same card, so it gets a QR too. `ConfirmDelete` gained an optional `failureMessage` so a 409 `SURVEY_NOT_OPEN` shows its own copy. |
| Assumptions | Card lists `linked_experiments` as pills linking to `/validation/smoke-tests?test={id}` (the page already deep-links on `?test=`). |
| Cleanup | Deleted `hooks/useValidationApi.ts` (the last mock/seed data for Validation). |

Rules kept: model text (theme label, summary, insight report) is rendered as React text only, labelled
"AI-generated", with em/en dashes swapped for commas by `plainProse`. No dashes in new UI copy.

Decisions and rejected alternatives:
- One inbox fetch, filter client-side: counts stay the server's and tab switches are instant.
- Milestone picker shows open milestones only: a done milestone is not a sensible target and the server default skips them.
- Reused `ConfirmDelete` for the share-link confirm rather than a second dialog component.
- Looked up an already-sent theme's milestone from the roadmap tree because `GET /feedback/themes` only returns `roadmap_task_id`.

## What's involved
`app/(dashboard)/validation/{mvp,surveys,assumptions}/page.tsx`, `components/validation/{FeedbackInbox,FeedbackThemes,ShareLinkCard,SurveyAnswersPanel,ConfirmDelete}.tsx`,
`hooks/{useFeedback,useAssumptions,useInsights}.ts`, `lib/api/validation.ts`, `lib/validation-format.ts`.
No migrations, no config.

## Verification
- Unit: `hooks/useFeedback.test.ts`, `components/validation/validation-slice-c.test.tsx` (25 tests: tabs/counts, read-only imported items, confirm delete, restore, add/edit validation, picker default, 409/422, plain-text rendering, answers, QR + copy). Full suite 951 passing.
- CI parity locally: typecheck, lint, unit, build, e2e (results in the PR).
- Live, real model, local API :8000 (migration 0058), as founder and as team member (`rewalk-tm`), 1440 and 375 with no horizontal overflow:
  inbox mirrors interview quotes and open survey answers; add, edit, delete with confirm; dismiss and restore; Find themes
  (4 themes from 8 items); Send to roadmap into the default milestone, state persists on reload, and the theme count
  follows deletes; Synthesize insights with source=all ("Based on 2 interviews and 5 feedback items"); survey Answers tab;
  New share link with confirm, QR, and the new token serving the public survey; assumption pill deep-links to the smoke test.
- Not exercised live: 409 `ALREADY_SENT` and 422 `NO_OPEN_MILESTONE` from the server (unit-tested against the guide's bodies), `over_budget`, the 90 s timeout, 409 `SURVEY_NOT_OPEN`, the old share link returning 404 (API e2e captured it), mentor 403 screen.

## Operate / roll back
Pure FE; revert the PR. Needs API #151 (migration 0058) deployed first or the inbox shows its error banner.

## Follow-ups
- Mentor role sees the generic error banner on these pages; a dedicated no-access state is shared with the rest of the hub.
- Theme cards do not yet link a sent theme to its exact roadmap task.
