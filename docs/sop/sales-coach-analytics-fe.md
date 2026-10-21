# SOP: Sales AI Coach and Analytics, front end

## What shipped
The AI Coach (Role-play, Call prep) and Analytics sub-pages of the Sales Hub now run on the real API (Sales slice C, API
#166). Branch `feature/sales-fe-c`, one PR to `develop`. Gap rows closed: 25-30 of `docs/checklist/sales-prd-gaps.md`.
**Sequences is not touched** (slice B waits on the outreach mail host); it still reads the seeded state left in
`hooks/useSalesApi.ts`. Contract: API repo `docs/fe-integration-guide-sales-coach-analytics.md` (live captures).

## Why
Both pages were static: the coach chat answered with a fixed line, the scorecard was a hardcoded 7/9/4, call prep was a
fixed "GigPay HR" brief, and Analytics was fixed widgets with a fake CSS donut, a funnel that skipped Contacted and no
date range. Design: `docs/superpowers/specs/2026-10-21-sales-design.md` §7, D-SAL-9.

## How
| Area | What changed | Decision or trade-off |
|---|---|---|
| Client | `lib/api/sales.ts` gains coach sessions, turns, end, call prep and analytics calls with the guide's shapes, plus pure helpers (`setupOf`, `pendingBuyerTurn`, `aiFailureMessage`, `presetRange`, `rangeError`, `formatCycle`) | "Practice this again" is a new session built by `setupOf`; there is no endpoint for it |
| Hooks | `hooks/useSalesCoach.ts`: `useRolePlay` (start, open, send, end, check again, reset), `useCallPrep`, `useRecentSessions`, `useDealOptions`, `useSalesAnalytics` | Same protocol as the co-founder chat (202, then poll the GET every 1.5 s). Polls are bounded (reply 90 s, scorecard 150 s, call prep 120 s); on timeout the page says it is slow and offers "Check again" instead of spinning or inventing a failure |
| Role-play | `components/sales/coach.tsx`: setup (deal picker or scenario, persona text plus presets, Friendly / Neutral / Tough, optional opening line), live chat, "End session", scorecard, "Practice this again", recent calls | The role-play hook lives on the page, so a call survives a switch to the Call prep tab. A reload loses the in-memory call, so the setup screen lists the member's recent calls (private, from `GET /coach/sessions`) and reopens one, resuming its poll |
| Honest states | A failed buyer turn keeps the session alive ("The buyer couldn't reply. Try sending again."); a failed scorecard shows why and "Try again" (calls `end` again); over budget is a named state with the reset time, from `GET /ai/status`, and disables Start / Generate | The input and End session are disabled while a buyer turn is `generating` (both would 409). The chat is labelled "Practice call" and the buyer "AI buyer" |
| Call prep | Deal picker, Generate / Regenerate, brief (where it stands, objections with responses, goal, 3 questions), `?tab=prep&deal=<id>` deep link, "Prep for a call" link in the deal drawer | Regenerate replaces the brief on screen with the new `generating` row (the API returns the latest of any status) |
| Analytics | `app/(dashboard)/sales/analytics/page.tsx`: date range (7 / 30 / 90 days, 12 months, custom with the API's two rules checked client side), tiles, funnel (every stage incl. Contacted), win/loss donut, activity leaderboard, 12-month closed-won chart | Donut and revenue chart are recharts like Marketing's campaign charts (`components/sales/analytics-charts.tsx`); the funnel is accessible text plus bars. Labels say what the API means: funnel = "deals created in this period", revenue chart "does not follow the date range" |
| Mock removed | `hooks/useSalesApi.ts` keeps only the sequences seed | Slice B |

## What's involved
- `lib/api/sales.ts`, `hooks/useSalesCoach.ts`, `hooks/useSalesApi.ts` (trimmed).
- `app/(dashboard)/sales/coach/page.tsx`, `app/(dashboard)/sales/analytics/page.tsx` rewritten.
- `components/sales/coach.tsx`, `components/sales/analytics-charts.tsx` (new); `components/sales/deal-drawer.tsx` (Call prep link).
- No API, migration or config changes. Product copy has no em or en dashes.

## Verification
- Local CI parity (the `ci.yml` jobs): typecheck, lint, `npm test`, `npm run build`, `npm run test:e2e`; counts are in the PR.
- Unit: `lib/api/sales-coach.test.ts`, `hooks/useSalesCoach.test.tsx` (fake-timer polling, 409, bounded wait, cancel), `components/sales/coach.test.tsx`.
- Playwright `e2e/sales-coach.spec.ts` (mocked with the guide's captured shapes): full role-play to scorecard and again, failed buyer turn, failed scorecard, over budget, call prep, deep link, analytics widgets, range and custom-range error, axe on 3 routes, 375 overflow, role denial.
- Live against `:8000` with the real model (founder and team member at 1440 and 375, mentor and consultant denied): see the FE-C status table in `docs/checklist/sales-prd-gaps.md`. A first live run found API bug: both strict JSON schemas lacked `additionalProperties: false` (OpenAI 400), so every scorecard and call prep failed; fixed in API #168 and re-verified. That run also showed the failed-scorecard and failed-prep states for real.

## Operate / roll back
No config. Revert the PR to return to the mock pages; nothing is stored FE side.

## Follow-ups
- Sequences (slice B) and the unsubscribe page.
- A failed buyer turn leaves the seller's line in the thread, so "send again" repeats it. The API has no retry endpoint; a "Retry reply" would need one.
