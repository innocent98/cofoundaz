# Funding Hub: PRD + UI gap list (2026-11-05)

Source of truth: `Cofoundaz_Technical_PRD.md` Module 14 (§14.1 to §14.6, API, entities, events, notifications), the access row
`funding (shared scopes) / investor-readiness | ✓ | ▢ | — | R(shared)` and the Module 15 hand-off. Designed UI: `app/(dashboard)/funding/*`
(6 pages on `hooks/useFundingApi.ts`). Design: `docs/superpowers/specs/2026-11-05-funding-hub-design.md`.

**How it was checked:** read-only inventory of both repos (FE `develop` `e4a4ba9`, API develop, last migration 0088). There is **no Funding API**
(no model, route, event or notification kind), every sub-page is static or seeded `useState`, so every data-backed row below is a gap by
construction. The only API touches are `FUNDING_CATEGORY` in Finance (D-FIN-11), the `funding` Scale module key, and `MembershipRole.investor`.

Legend: ❌ gap · Layer: BE / FE / both · Slice: A Round+Pipeline · B Data room · C Cap table · D Term sheets · E Grants · F Copilot+Analytics+glue
· Severity: **Sec** > **High** > **Med** > **Low** · "Default" = lead default, built unless Adebayo objects.

## Decisions needed from Adebayo (D-FUND-1..8)

| ID | Question | Options (cost) | Recommendation |
|---|---|---|---|
| **D-FUND-1** | Investor database: do we seed one? | (a) None: the pipeline is the founder's own CRM, empty state "Add your first investor". Cost: 0. (b) **Curated firm-level directory** of about 50 Africa-focused funds (name, stage, sectors, geography, cheque range, website, source link; no personal emails or phones), reviewed by you like the Academy content. Cost: about 1 day of your review, ongoing upkeep, +1 table and a "Find investors" filter. (c) AI-suggested investors. Cost: low to build, but invents funds and cheque sizes; unsafe. | **(b)**, ship A without it and add the directory right after if you approve the list. Never (c). |
| **D-FUND-2** | Grants data source | (a) **Curated catalogue** we maintain (30-40 Nigeria/Africa/global grants, each with source link and `verified_on`), AI scores fit per workspace. Cost: your content review; staleness needs a monthly check, editable later from Admin. (b) Live web search per workspace. Cost: dearer per run, dead and wrong deadlines shown as fact. (c) Founder-entered only (tracker + Draft with AI, no matches). Cost: smallest, but loses "I scan for grants" and the grant notification. | **(a) plus manual add from (c)**. A grant past its deadline or unverified for 90 days is marked stale and never shown as a match. |
| **D-FUND-3** | How do investors get into the data room? (the open "no investor invite path", Documents re-walk D5) | (a) **Email-verified link**: invite email, investor opens `/dr/{token}`, proves the address with a 6-digit code, no account. Cost: lowest friction for them; needs rate limits and an OTP table. (b) **Investor account** (`MembershipRole.investor`, read-only "Shared with me" data room, binds on verified email like `document_grants`). Cost: +1 slice (B2), investors must sign up; gives a stable identity and a place for the readiness score. (c) Both. | **(a) in slice B now, (b) as B2 later** if investors ask for it. The access log identifies viewers by the verified email either way. |
| **D-FUND-4** | Cap table scope | (a) Share ledger only (Common, Preferred, Options), SAFEs/notes listed as amounts, no conversion. Cost: smallest, but "model a round" would ignore SAFEs, the thing every early founder has. (b) **Ledger + SAFEs/notes with caps and discounts, round model converts them (post-money SAFE maths), option-pool top-up in the pre-money, fully-diluted toggle, vesting.** Cost: a deterministic engine with worked-example tests; no AI. (c) Full waterfall/exit modelling, pro-rata and multiple series. Cost: a product on its own; out. | **(b)**. (c) waits for demand; the disclaimer says estimates, not legal advice. |
| **D-FUND-5** | Who sees the cap table and term sheets? | (a) **Founder only** for both; team members see Pipeline, Data room, Grants, Analytics. Cost: a second guard, TM cannot help with those two pages. (b) Founder + team members everywhere (F+TM, as Sales/Finance). Cost: none, but a TM with the Funding module sees every holder, price and offer. Investors see a cap table only as a frozen snapshot inside a data room share, never live. | **(a)**: equity and offers are the most sensitive data in the product. Flip to (b) with one constant if you prefer. |
| **D-FUND-6** | Term sheet flags and the AI disclaimer | (a) AI reads the sheet and flags what it finds. Cost: cheapest to build; unpredictable, can miss or invent. (b) **Deterministic rules table** for the flags (liquidation preference above 1x, participating, pool above 15% pre-money, exclusivity above 45 days, board seats, super pro-rata, full ratchet), AI only extracts values (founder confirms them) and words each flag in plain language. Cost: a rules file you can review; ~14k tokens per sheet. (c) No AI, manual entry only. Cost: loses the upload step. | **(b)**, with the §1.4 disclaimer on the page and every notification, plus a "Ask a Legal Advisor to review" shortcut to Documents e-review. Never a verdict, always "unusual for this stage". |
| **D-FUND-7** | Currency | (a) **One currency per round** (NGN default, USD selectable), all amounts in that currency, no conversion; Finance Funding inflows convert only when you record the money. Cost: none; mixed-currency investors need a note. (b) Per-investor currency with FX totals. Cost: an FX feed, rounding questions, a daily rate table. | **(a)**. The mock's "$100k - $250k" cards then show in the round currency. |
| **D-FUND-8** | Data room download and watermark policy | (a) **Per-share "Allow downloads" (default off). PDFs are stamped with the viewer's email at serve time; other types (XLSX models) are view-only unless downloads are on, then unwatermarked and the UI says so.** Cost: PDF stamping with the existing `pypdf`/`reportlab`. (b) Everything view-only forever. Cost: investors cannot take the financial model; they will ask. (c) Watermark every type (images, Office). Cost: conversion pipeline, fragile. | **(a)**. |

Lead defaults (built as written, reversible):

| ID | Default |
|---|---|
| D-FUND-L1 | One open round per workspace in v1 (`funding_rounds` allows history). Suggested target = 18 months of net burn from Finance runway, shown as a hint, never auto-applied. |
| D-FUND-L2 | Header bar counts Term Sheet + Committed investors that have an amount, in two tones (soft vs committed). The mock calls everything "soft-committed". |
| D-FUND-L3 | Committed with an amount asks "Record this in Finance and the cap table?"; creates a `Funding` ledger entry (cash, not revenue) and a SAFE draft only on confirm. Never automatic. |
| D-FUND-L4 | A data room holds **references** to Documents items, never copies; trashed or unscanned items vanish from the room immediately (checked per serve). |
| D-FUND-L5 | Data room invite and OTP go by the platform transactional email, not the Sales cPanel outreach mailbox. |
| D-FUND-L6 | Notification "{Investor} viewed your data room" is one per share per day, not per page. Audience = founder + team members, never all members. |
| D-FUND-L7 | Readiness interface assumed from `ir-design` (spec §9): Funding reads the score for one soft banner; nothing is gated; both pages unhide together. |
| D-FUND-L8 | Stage list is fixed to the PRD's seven (no custom stages, unlike Sales). Passed reasons: Valuation, Stage mismatch, Sector conflict, Ghosted, Other. |
| D-FUND-L9 | Health Score signals from Funding and investor updates (Module 22.3) are out of scope; the investor list is the hand-off point. |
| D-FUND-L10 | Scale plan only (`funding` module key); behind the existing `PLAN_ENFORCEMENT` flag. |

## Mock control inventory (every control on the six pages)

| Page | Control | Today | Row |
|---|---|---|---|
| Layout | 6 tab pills, `ShellTopBar` | route links only | 1 |
| Pipeline | "Soft-committed vs target round" bar | hard-coded ₦58M of ₦90M, 64% | 3 |
| Pipeline | 7 stage columns with counts | seeded 5 investors | 2 |
| Pipeline | Drag a card to a column | local state only | 4 |
| Pipeline | Card (name, firm, Warm/Cold chip, cheque range, next step) | seeded; no add/edit | 5, 6 |
| Pipeline | Card click → drawer; X; backdrop close | static fields | 7 |
| Pipeline | Drawer: Firm, Thesis notes, Last Touch | static | 7 |
| Pipeline | Drawer: Data room status chip | hard-coded "Shared - Viewed Pitch Deck" | 19 |
| Pipeline | "Prep me for this meeting" | toast only | 8 |
| Pipeline | Passed modal: 5 reasons + Cancel | local state; reason discarded | 9 |
| Pipeline | Footer tip | text | 38 |
| Data room | "Share data room" | opens modal | 15 |
| Data room | 6 folder rows (count, click) | toast "Opening folder" | 11, 12 |
| Data room | Access log (3 rows) | hard-coded | 17 |
| Data room | Modal: investor email, 6 folder chips, watermark checkbox, X, Cancel, Send invite | toast only, nothing sent | 15, 16 |
| Cap table | Table (stakeholder, security, vesting, ownership) | seeded 3 rows | 21, 22 |
| Cap table | Donut + legend | static SVG "70/18/12" | 23 |
| Cap table | New money, Pre-money inputs | free text, ₦M | 26 |
| Cap table | "You would go from 70% to x%" | founder fixed at 70, ignores pool and SAFE | 26 |
| Cap table | "Save as scenario" | toast only | 27 |
| Cap table | §1.4 disclaimer | present | keep |
| Term sheets | Comparison table (Sheet A / B, 7 terms) | hard-coded | 29, 30 |
| Term sheets | AI note | hard-coded sentence | 31 |
| Term sheets | Disclaimer, "Negotiate with clarity." | present | keep |
| Grants | Match cards (fit %, name, funder, amount, deadline, reason) | seeded 2 | 33, 34 |
| Grants | "Start application", "Not relevant" | toast / local remove | 35, 36 |
| Grants | Empty state | present | keep |
| Analytics | Funnel (4 bars) | hard-coded 24/11/5/2 | 39 |
| Analytics | Committed vs target | hard-coded 64% | 40 |
| Analytics | Average time in stage (4 bars, no values) | static | 41 |
| Analytics | Data room engagement (3 numbers) | hard-coded | 42 |

## Gaps

### 14.1 Investor Pipeline
| # | Gap | Sev | Layer | Slice | Default / Q |
|---|---|---|---|---|---|
| 1 | No Funding API at all: no models, routes, events, notification kinds, row policy or role guard | High | BE | A | F+TM guard; Scale module |
| 2 | Board is seeded; no `investors` table, no persistence of stage | High | both | A | |
| 3 | Header bar is hard-coded; no round (`target_minor`) or committed amounts | High | both | A | L1, L2 |
| 4 | Drag moves local state only; no stage history, no `stage_entered_at` (needed for analytics) | High | both | A | |
| 5 | Cannot add, edit or delete an investor (name, firm, type, warm/cold, cheque range, next step and date) | High | both | A | |
| 6 | Cheque range is a string with `$`; needs min/max minor + round currency | Med | both | A | D-FUND-7 |
| 7 | Drawer lacks the interaction log (notes, calls, emails, meetings), last touch is a fixed string, no thesis editing; PRD "card drawer: profile, interaction log" | High | both | A | |
| 8 | "Prep me for this meeting" is a toast; PRD wants a Copilot brief (investor context, likely questions, your metrics, suggested ask) as a job | High | both | F | AI ~5k tokens, cached 24h |
| 9 | Passed reason is dropped; PRD "Passed modal reason Select" must persist (feeds analytics) | Med | both | A | L8 |
| 10 | No empty state, no investor search/filter; no investor database to research from | Med | both | A, later | **D-FUND-1** |
| 37 | No notification/event when committed changes (`funding.round.committed_changed`); no confirm to record money in Finance + cap table | Med | both | A, F | L3 |
| 38 | Footer tip tells users to click the card "to get a brief" (the brief is one button inside); copy to correct | Low | FE | A | |

### 14.2 Data Room
| # | Gap | Sev | Layer | Slice | Default / Q |
|---|---|---|---|---|---|
| 11 | Folders are 6 hard-coded names with fake counts; no `data_room_folders`, no "Set up standard structure", no empty state ("Your diligence, ready before they ask." / "Set up data room") | High | both | B | |
| 12 | No file rows: items must be picked from Documents (by reference) with permission/scan chips; folder rows only toast | High | both | B | L4 |
| 13 | Folder tree has no custom folders, rename, reorder or remove | Med | both | B | |
| 14 | Document chosen from the library but later trashed or unscanned must disappear from the room at once | Sec | BE | B | L4 |
| 15 | "Share data room" sends nothing: no `data_room_shares`, no invite email, no token, no revoke, no expiry date control, no "pick from pipeline" | High | both | B | L5 |
| 16 | Watermark is a checkbox with no effect; needs serve-time PDF stamping with the viewer's verified email; download policy | High | BE | B | **D-FUND-8** |
| 17 | Access log is hard-coded and has no viewer, doc, time, duration columns, no tab, no real tracking (Documents keeps only `last_viewed_at`) | High | both | B | heartbeat 15 s |
| 18 | No investor-facing viewer route, no email gate/OTP, no rate limits, no uniform 404 for dead links | Sec | both | B | **D-FUND-3** |
| 19 | Pipeline drawer's "Shared - Viewed Pitch Deck" chip is a constant; must come from the investor's share | Med | both | B | |
| 20 | `funding.dataroom.viewed` event and bell notification ("{Investor} viewed your data room, {doc}, {duration}") missing | Med | BE | B | L6 |
| 43 | Investor account invite path (the "no investor invite path" follow-up from Documents re-walk D5) | High | both | B2 | **D-FUND-3** |
| 44 | Readiness score as an optional share scope ("INV sees Readiness Score only if shared") | Low | both | B / IR | spec §9, L7 |

### 14.3 Cap Table
| # | Gap | Sev | Layer | Slice | Default / Q |
|---|---|---|---|---|---|
| 21 | No holders/entries tables; table is 3 seeded rows with no shares, price, issue date | High | both | C | |
| 22 | No add/edit/remove entry drawer with vesting fields (cliff, months, start); vesting is a string | High | both | C | |
| 23 | Donut is a static SVG, mislabels a SAFE as a percentage; no fully-diluted toggle | High | both | C | **D-FUND-4** |
| 24 | Security types limited to labels; SAFE/Note need amount, cap, discount; no conversion | High | BE | C | **D-FUND-4** |
| 25 | Roles: cap table readable by TM today by default pattern; investors only via snapshot | Sec | BE | C | **D-FUND-5** |
| 26 | "Model a round": founder % fixed at 70, ignores option pool top-up, SAFEs and existing holders; no dilution table | High | both | C | engine, no AI |
| 27 | "Save as scenario" is a toast; no scenarios list/open/delete | Med | both | C | |
| 28 | No way to put a cap table snapshot in the data room (frozen, dated) | Med | both | C, B | D-FUND-5 |
| 45 | "Draft SAFE" from the SAFE template (Documents) not linked | Low | FE | C | reuse template |

### 14.5 Term Sheets
| # | Gap | Sev | Layer | Slice | Default / Q |
|---|---|---|---|---|---|
| 29 | Columns fixed to Sheet A/B and values hard-coded; no add/upload/enter, no `term_sheets` table | High | both | D | |
| 30 | Comparison needs N columns, highlight best/worst per term, link to the investor | Med | both | D | |
| 31 | AI note is one hard-coded sentence; needs per-term flags, deterministic rules, plain-language wording | High | both | D | **D-FUND-6** |
| 32 | Upload (PDF) → extraction job → confirm values step missing; `funding.term_sheet.added` notification ("Term sheet added, comparison updated") | High | both | D | AI ~14k tokens |

### 14.4 Grants
| # | Gap | Sev | Layer | Slice | Default / Q |
|---|---|---|---|---|---|
| 33 | No grant source; matches are 2 seeded cards | High | BE | E | **D-FUND-2** |
| 34 | Fit score and "Why it fits" are static; needs AI scoring after a deterministic prefilter, expandable reason, amount/deadline typed (not strings) | High | both | E | AI ~8k per weekly run |
| 35 | "Start application" is a toast; no applications, editor, or "Draft with AI" over Business Builder + Finance (✨ chips, editable) | High | both | E | AI ~15k per application |
| 36 | "Not relevant" removes locally; must persist as dismissed so it never returns | Med | both | E | |
| 46 | Application tracker table (Draft/Submitted/Won/Lost, deadline, owner) and manual add missing | High | both | E | |
| 47 | `funding.grant.matched` notification with "See fit" CTA, stale/expired handling | Med | BE | E | D-FUND-2 |

### 14.6 Fundraise Analytics
| # | Gap | Sev | Layer | Slice | Default / Q |
|---|---|---|---|---|---|
| 39 | Funnel hard-coded (24/11/5/2); must count investors that reached each stage (Contacted = left Research) | High | both | F | derived |
| 40 | Committed vs target hard-coded | Med | both | F | L2 |
| 41 | Time in stage bars have no values/labels | Med | both | F | needs A's stage history |
| 42 | Data room engagement hard-coded; needs views per day, avg session, top documents; "no data yet" states | High | both | F | needs B's views |

### Cross-cutting
| # | Gap | Sev | Layer | Slice | Default / Q |
|---|---|---|---|---|---|
| 48 | Sidebar item hidden (FE #184) and Billing lists `funding` as Scale; unhide with IR once A-F are re-walked; role denial page for non-F/TM | Med | FE | after F | L7, L10 |
| 49 | Readiness banner on Pipeline (reads IR score, no gate) | Low | both | F | L7 |
| 50 | Calendar link: Meeting stage "Schedule" creating an event, event stored on the interaction | Low | both | F | |
| 51 | FE integration guide per slice, captured live; every control re-walk for F and TM (denied for others) at 1440 + 375 | High | both | each | house rule |

## Slice status
| Slice | Rows | State |
|---|---|---|
| A Round + Pipeline | 1-7, 9, 10, 37, 38 | not started (waits on D-FUND-1, 7) |
| B Data room | 11-20, 44; B2 row 43 | not started (waits on D-FUND-3, 8) |
| C Cap table | 21-28, 45 | not started (waits on D-FUND-4, 5) |
| D Term sheets | 29-32 | not started (waits on D-FUND-6) |
| E Grants | 33-36, 46, 47 | not started (waits on D-FUND-2) |
| F Copilot + Analytics + glue | 8, 39-42, 49, 50 | not started |

## Deferred follow-ups
Health Score signals from Funding · investor updates (Module 22.3) · exit/waterfall modelling · live grant scraping · multi-currency totals ·
investor accounts if D-FUND-3 = link only.
