# Sales Hub: PRD + UI gap list (2026-10-21)

Source of truth: `Cofoundaz_Technical_PRD.md` Module 11 (§11.1 to §11.6, API, entities, events, notifications, access row
"validation / marketing / sales") and the designed UI in `app/(dashboard)/sales/*`. Design and decisions:
`docs/superpowers/specs/2026-10-21-sales-design.md` (D-SAL-1..10, plus §11 lead calls).

**How it was checked:** a read-only code inventory of both repos (FE `develop` `4b2ae01`, API `17510c8`). No live walk
was needed: there is no Sales API, and every sub-page reads seeded `useState` from `hooks/useSalesApi.ts`, so every
data-backed row below is a gap by construction. The Dashboard `pipeline` KPI returns `status: "not_built"`.

Legend: ❌ gap · Slice: A (CRM core BE) · B (sequences + sending BE) · C (coach + analytics BE) · FE-A · FE-BC ·
Severity: **Sec** > **High** > **Med** > **Low**

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
