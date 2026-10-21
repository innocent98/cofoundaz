# Sales Hub: PRD + UI gap list (2026-10-21)

Source of truth: `Cofoundaz_Technical_PRD.md` Module 11 (§11.1 to §11.6, API, entities, events, notifications, access row
"validation / marketing / sales") and the designed UI in `app/(dashboard)/sales/*`. Design and decisions:
`docs/superpowers/specs/2026-10-21-sales-design.md` (D-SAL-1..10, plus §11 lead calls).

**How it was checked:** a read-only code inventory of both repos (FE `develop` `4b2ae01`, API `17510c8`). No live walk
was needed: there is no Sales API, and every sub-page reads seeded `useState` from `hooks/useSalesApi.ts`, so every
data-backed row below is a gap by construction. The Dashboard `pipeline` KPI returns `status: "not_built"`.

Legend: ❌ gap · Slice: A (CRM core BE) · B (sequences + sending BE) · C (coach + analytics BE) · FE-A · FE-BC ·
Severity: **Sec** > **High** > **Med** > **Low**

## FE-A status (2026-10-21): Pipeline, Leads, Accounts on the real API

Branch `feature/sales-fe-a`. Walked against the shared API `:8000` (develop with #165, migration 0063) from a worktree dev
server, founder (`localhost`) and team member (`tm.localhost`) at 1440 and 375, mentor (`m.localhost`) and consultant
(`bc.localhost`) at 1440 and 375. A scripted browser walk drove every control (43 steps per role and width, all pass; re-run
after the last code change); test data is labelled "Walk test". Contract: API repo `docs/fe-integration-guide-sales-crm.md`.
Mocked-API Playwright (`e2e/sales.spec.ts`, 23 tests incl. axe on 5 routes and 375 overflow) covers the same controls plus
what cannot be produced live. SOP: `docs/sop/sales-crm-fe.md`.

| # | Status | Evidence |
|---|---|---|
| 2 | ✅ | Founder + TM open all three pages and call the API (200). Mentor and consultant: `/sales`, `/sales/leads`, `/sales/accounts`, `/sales/accounts/<id>` show "You don't have access to this page.", no Sales Hub in the sidebar, and `/sales`, `/stages`, `/deals`, `/leads`, `/accounts` all 403 |
| 3 | ✅ | Dashboard Pipeline Value tile read `₦250.0K` live (not "Coming Soon"), with the trend sparkline wired (`kpis.metrics.pipeline.trend`); no_data / restricted / ok covered in `useDashboardApi.test.ts` |
| 4 | ✅ | ⌘K hits for an account, a contact, a lead and a deal each landed on the right place (account page; account page with the contact drawer open; `/sales/leads?lead=` card; `/sales?deal=` drawer). A contact with no account opens its drawer at `/sales/contacts?contact=`. **Not exercised:** the Sales page hits (Sales Hub, Leads, Accounts) |
| 6 | ✅ | Edit stages: rename, reorder (up/down), add (blocked at 10), win %, delete an empty stage; Won/Lost and a stage with deals have Delete disabled; the API's own message is shown if it refuses; columns and forecast follow the saved stages |
| 7 | ✅ | + Add deal (account, contact, ₦ value as kobo, stage, next step, due, owner); card opens the deal drawer: edit + save persists, stage select, activity timeline, notes, stage history, delete with confirm |
| 8 | ✅ | Drag (native mouse drag and the keyboard/touch stage select) persists via `POST /deals/{id}/stage`; optimistic move rolls back and shows the API message when refused (unit + mocked e2e). Found and fixed a rollback race in the hook while writing its test |
| 9 | ✅ | `canvas-confetti` burst (no ConfettiBurst component existed; `lib/confetti.ts`, skipped under reduced motion) plus an announced "Closed won: ..." line on the won move (canvas attached live). Lost opens the reason modal; the reason and note are sent in the same call and read back from the API ("Lost: Price", note) |
| 10 | ◐ | Badge renders from the API's `is_stalled` / `days_inactive` and the drawer says "No activity for N days". **Not seen live**: no endpoint can age a deal, so it is proven by the mocked e2e and unit tests only. The stall-days setting (`PATCH /sales/settings`) has no control yet |
| 11 | ✅ | Card shows account and contact names; avatar initial comes from the contact |
| 12 | ✅ | Leads table: Name, Company, Source, Status, Owner, Created; quick-add takes name, company and email; status is changeable inline (persists after reload) |
| 13 | ✅ | Real CSV: choose file, mapping step pre-filled from the API's suggestion, commit; toast "2 added, 1 duplicate skipped, 2 invalid", invalid rows listed (row + reason), re-import skipped all 3 duplicates. Source is not offered in the mapping (the API sets `csv` on every row) |
| 14 | ✅ | "Make it a deal" creates the deal (first stage), account (when there is a company) and contact; banner links to the deal; lead shows Converted + View deal |
| 16 | ✅ | `/sales/accounts/[id]` (list rows link to it; unknown id shows "Account not found") |
| 17 | ✅ | Account page: editable info panel (name, website, industry, notes, owner), contacts list + add, open deals with stage and stall badge, lifetime won, activity log and notes. Delete is refused by the API while the account has deals (message shown) and works when empty |
| 18 | ✅ | Contact drawer: edit fields, "Log activity" (call, email, meeting, note) timeline, delete; a contact activity also appears on its account's log |
| 15, 19 | – | Enroll in a sequence: slice B / FE-BC |

## FE-C status (2026-10-21): AI Coach and Analytics on the real API

Branch `feature/sales-fe-c`. Walked against the shared API `:8000` (develop with #165, #166 and the strict-schema fix #168)
from a worktree dev server on :3100: founder (`localhost`) and team member (`tm.localhost`) at 1440 and 375, mentor
(`m.localhost`) and consultant (`bc.localhost`) denied at 1440 and 375, plus API 403s for both on every coach, call prep
and analytics route and a 404 for a teammate's session id. Real model throughout (not the stub). Test data: a "Kolo rider
savings pilot" deal plus the "Walk test" deals (two closed lost, one won) for the analytics widgets. Contract: API repo
`docs/fe-integration-guide-sales-coach-analytics.md`. Mocked-API Playwright (`e2e/sales-coach.spec.ts`, 22 tests incl. axe on
3 routes and 375 overflow) covers the same controls plus what cannot be produced live. SOP: `docs/sop/sales-coach-analytics-fe.md`.

| # | Status | Evidence |
|---|---|---|
| 25 | ✅ | Setup validates ("Pick a deal or describe a scenario."), deal picker lists the real deals, persona text with presets, Friendly / Neutral / Tough. Real role-play on the Kolo deal (Skeptical HR lead, tough): 4 seller turns, 3 real buyer replies in character, grounded in the deal (cash savings, withdrawal trust, 50 rider pilot). Reply latency was roughly 10 to 30 s; the input and End session stay locked while the buyer is "replying". Reload loses the in-memory call, so the setup lists recent calls and reopens one (resumed a live call as the team member). Team member ran a scenario role-play at 1440 and 375 |
| 26 | ✅ | End session on the real call gave a real scorecard: discovery 4, objection handling 3, next-step close 3 (overall 3.3/10) with four feedback lines that quote what the seller said (it repeated the same claims and asked for a start date too early), so calibration is believable on a weak call. "Practice this again" started a new session with the same deal, persona and difficulty. The scorecard failure path was seen live before #168 (OpenAI 400 on the schema): "We couldn't score this call", reason, "Try again", and Try again produced the scorecard once #168 was live |
| 27 | ✅ | Call prep: deal picker, Generate, Regenerate (replaced the brief), deep link `?tab=prep&deal=` and a "Prep for a call" link in the deal drawer. Real brief for the Kolo deal: where it stands (names the account, contact and value correctly), 3 objections with responses, a goal, exactly 3 discovery questions; no dashes. Copy "Rehearse here, win out there." is under the page title |
| 28 | ✅ | Funnel lists every stage incl. Contacted (16 created, 3 contacted, 2 qualified, 2 proposal, 1 negotiation, 1 won, each with the share of the stage before). Avg cycle length and win rate tiles read the API |
| 29 | ✅ | Win/loss reasons is a recharts donut (Won, Lost: Price, Lost: Timing, with counts, percent and lost value; win rate in the centre). Activity leaderboard lists every founder and team member, zeros included. Monthly closed-won revenue is a recharts bar chart for the last 12 months (₦ from kobo; a ₦8,500,000.00 deal showed in October), labelled as not following the range |
| 30 | ✅ | Date range select (7, 30, 90 days, 12 months, custom). Custom over 366 days shows the API's own message and sends nothing; a valid custom range reloaded the widgets |

**Honest notes.** Two buyer turns got an upstream model 500 (worker log: "The server had an error while processing
your request"); the page said "The buyer couldn't reply. Try sending again." and the retry worked, so that path was seen
live. The budget-exhausted state is proven by unit and mocked e2e only (the shared workspace had budget left; not exhausted
on purpose). A failed buyer turn leaves the seller's line in the thread, so sending again repeats it (the API has no retry).
The 100k daily budget used for this walk: about 7k tokens (workspace counter 37.8k to 44.3k).

## Cross-cutting
| # | Gap | Sev | Slice |
|---|---|---|---|
| 1 | No Sales API, entities or migrations; all six sub-pages are mock and nothing persists | High | A, B, C |
| 2 | No role gating: Sales must be F + TM only, 403 + hidden for every other role (D-SAL-2) | Sec | A, FE-A |
| 3 | Dashboard `pipeline` KPI is "Coming Soon" (`kpis.py::_pipeline` stub) | High | A |
| 4 | No ⌘K search for deals/accounts/contacts/leads; no activity-feed visibility rule for `sales` | Med | A |
| 5 | Events `sales.deal.stage_changed|won|lost|stalled` and both PRD notifications missing | High | A |

## 11.1 Pipeline
| # | Gap | Sev | Slice |
|---|---|---|---|
| 6 | Stages hardcoded, not editable; no win probability per stage (weighted forecast uses fixed weights) | High | A, FE-A |
| 7 | No + Add deal; card click only toasts "Opened deal" (no deal drawer, D-SAL-5) | High | A, FE-A |
| 8 | Drag doesn't persist; stage moves not recorded (no history for funnel/cycle) | High | A, FE-A |
| 9 | Closed Won shows an emoji overlay, not `ConfettiBurst`; lost reason not saved | Med | FE-A |
| 10 | Stall badge from a mock `daysInactive`; threshold not configurable (D-SAL-7) | Med | A, FE-A |
| 11 | Contact shown only as an avatar initial | Low | FE-A |

## 11.2 Leads
| # | Gap | Sev | Slice |
|---|---|---|---|
| 12 | Owner and Created columns missing; no email field on quick-add | Med | A, FE-A |
| 13 | CSV import is a static mock (no file, no mapping, fixed "2 added, 1 duplicate skipped"); dedupe by email missing | High | A, FE-A |
| 14 | "Make deal" deletes the lead and creates nothing; copy should be "Make it a deal" (D-SAL-6) | High | A, FE-A |
| 15 | No enroll-in-sequence from a lead row | Med | B, FE-BC |

## 11.3 Accounts & Contacts
| # | Gap | Sev | Slice |
|---|---|---|---|
| 16 | No account page (`/sales/accounts/[id]`); single master/detail view only | High | FE-A |
| 17 | Contacts list, open-deals list and notes missing on the account | High | A, FE-A |
| 18 | No contact drawer; "Log activity" only toasts; timeline static | High | A, FE-A |
| 19 | No enroll-in-sequence from a contact row | Med | B, FE-BC |

## 11.4 Email Sequences
| # | Gap | Sev | Slice |
|---|---|---|---|
| 20 | "+ New sequence" does nothing; one hardcoded sequence; list columns are one string | High | B, FE-BC |
| 21 | Builder can't add/remove steps or save; delay is free text; merge chips don't insert | High | B, FE-BC |
| 22 | "Write with AI" has no handler | Med | B, FE-BC |
| 23 | Nothing sends; no unsubscribe link, page or suppression; no enrollments, Mark replied or Stop (D-SAL-1, D-SAL-8) | High | B, FE-BC |
| 24 | Provider bounce/complaint handling and auto-pause missing | Sec | B |

## 11.5 AI Sales Coach
| # | Gap | Sev | Slice |
|---|---|---|---|
| 25 | Role-play has no deal/scenario picker and no LLM; chat is mock | High | C, FE-BC |
| 26 | Scorecard hardcoded (7/9/4); "Practice this again" just resets | High | C, FE-BC |
| 27 | Call prep is a fixed "GigPay HR" brief, no deal picker; copy "Rehearse here, win out there." missing | High | C, FE-BC |

## 11.6 Sales Analytics
| # | Gap | Sev | Slice |
|---|---|---|---|
| 28 | All widgets static; funnel skips Contacted | High | C, FE-BC |
| 29 | Activity leaderboard and monthly closed revenue trend missing; win/loss donut is fake CSS | High | C, FE-BC |
| 30 | No date range | Med | C, FE-BC |

## Blocked (on Adebayo, not code)
- Slice B's provider adapter + webhook signature: needs the outreach email provider's name, domain and webhook (spec §9).
  Everything else in B is built against the normalized interface; until the env is set the Sequences page says
  "Sending isn't set up yet".

## Deferred follow-ups
- Health Score live signals from sales (D-SAL-10).
- Inbound reply detection (automatic "Stop when they reply"), mailbox connect, open/click tracking.
