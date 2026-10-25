# SOP: Validation Hub PRD slice (a), overview, Design experiment, hosted smoke-test pages

## What shipped
FE half of Validation PRD slice (a), gap-list rows 1 to 6 and 14. Pairs with API PR #149 (`feat/validation-prd-a`).
PR: "feat(validation): overview, Design experiment, hosted smoke-test pages" (FE repo, branch `feat/validation-prd-a-fe`).
Contract: `cofoundaz-api/docs/fe-integration-guide-validation-prd-a.md` (live captures in `e2e/_captures/validation_prd_a/`).

## Why
The Validation Hub still showed mock numbers (overview strip and nudge), a hand-typed smoke-test funnel with an FE-side
verdict, no hosted page, no way to remove anything, and its own header with a dead "+ Invite".

## How
| Area | Change |
|---|---|
| Shell | `validation/layout.tsx` mounts the shared `ShellTopBar` (like Mission, Health, Roadmap, BB). The section header is gone. The layout also holds the toast and a `pendingDraft` slot. |
| Overview | `useValidationOverview` reads `GET /validation/overview`: five real stat tiles. Mock `useValidationApi` is no longer used by this page. |
| Nudge | `components/validation/RiskiestNudge.tsx`, on Overview and Assumptions. Hidden when `riskiest_untested` is null. "Design experiment" runs `useExperimentDraft` (POST experiment-draft, poll `/jobs/{id}` every 2 s, 60 s cap). `ready` puts the draft in the layout slot and routes to the builder; `gone`, `over_budget`, timeout and failure toast honest copy. Nothing is saved until Publish. |
| Builder | `SmokeBuilder.tsx`: adds a test-name field, sends the existing config keys plus `slug`, links `assumption_ids` from the draft, shows the AI rationale. Two exits: "Save as draft" and "Publish" (POST, then PATCH `status: live`). Slug 422 and 409 show under the slug field (`slugErrorFrom`). |
| Results | `SmokeResults.tsx`: public URL `{origin}/p/{slug}` with copy and open (live only), server `verdict` / `sample_needed` / `target_conversion` banner, funnel tiles, waitlist table plus CSV download, End/Resume/Publish, delete. The hand-entered numbers form stays only for tests with no slug. The FE verdict math is deleted. Stats refresh every 20 s while live. |
| Public page | `app/p/[slug]/page.tsx` plus `lib/api/validation-public.ts`. Plain `fetch` with no auth headers (not `apiClient`, which would send a stale token and redirect to login on 401). One random visitor id per browser per slug in localStorage. `visit` once on load, `cta_click`, `preorder_click` fire-and-forget. Signup posts `{email, visitor_id}` and shows `data.message`. Email validated client-side ("Enter a valid email address."), raw server text is never shown. 404 shows "This page isn't available". `noindex` via `app/p/[slug]/layout.tsx`. |
| Deletes | `ConfirmDelete` dialog on assumptions, experiments (warns the waitlist goes too, using real waitlist size only), interviews, surveys. |
| Notification | `notificationHref('validation.smoke_test.milestone')` goes to `/validation/smoke-tests?test={experiment_id}`; the smoke-tests page opens that test. |

Decisions and rejected alternatives:
- Draft handoff via a layout context slot, not a query string or storage: the draft is large and must not survive a reload.
- A `Publish` on the builder is create-then-patch; if the PATCH fails the draft is kept and the user is told.
- Fake-door pricing has no price field in the API, so the section is a neutral "I would pay for this" button rather than invented plans.
- Stats are fetched per test for the list (N small calls) so visits and conversion are real, not hand-entered.

## What's involved
`app/(dashboard)/validation/{layout,page}.tsx`, `.../{assumptions,interviews,surveys,smoke-tests}/page.tsx`,
`app/p/[slug]/{page,layout}.tsx`, `components/validation/*`, `hooks/{useValidationOverview,useExperimentDraft,useSmokeTests,useAssumptions,useInterviews,useSurveys,useNotifications}.ts`,
`lib/api/{validation,validation-public}.ts`, `lib/validation-format.ts`, `e2e/public-smoke-page.spec.ts`.

## Verification
Local CI reproduced: typecheck, lint, unit (vitest), build, e2e (Playwright, chromium). New unit tests cover the format helpers,
public client, draft job outcomes, nudge, builder, results, delete dialog, public page, and the notification link.
Live against the local API (real model) as founder, team member and mentor, at 1440 and 375: overview numbers, nudge text, Design experiment
to a pre-filled builder (real model), slug 422 and 409, publish, public page on a separate host with no login (visit, cta_click, signup, the unavailable page), waitlist and CSV, server verdict banner (hand-entered 120 visits), End test makes the page 404 and Resume restores it,
deletes of all four kinds, `?test=` deep link, mentor sees the no-access page.
Not verified live: `over_budget` and `gone` draft results (unit-tested), the real milestone notification (needs 10 signups; link unit-tested),
verdict `weak` from live traffic (needs 100 visits).

## Operate / roll back
No config. Revert the PR to roll back; the API keeps working. The public page needs the API reachable at `/api/v1` from the app origin.

## Follow-ups
Slice (b) interview scripts and Insight Synthesizer, slice (c) MVP feedback, then a live re-walk. Move pages to `{slug}.cofoundaz.site` once wildcard DNS exists (D-VAL-1).
Gap rows 8 to 10 (interview assumption links, survey QR, linked experiments on cards) are separate FE work.
