# Analytics & Reports: PRD + UI gap list (2026-11-12)

Source of truth: `Cofoundaz_Technical_PRD.md` Module 22 (§22.1 to §22.5, API, entities, events, notifications, lines 715-731), the
cross-references (§10.8 Marketing analytics "export (→ Module 22 report)", §11.6 Sales analytics, §14.6 Fundraise analytics, §5.2 access row
`analytics | ✓ | ▢ | R(shared) | — | — | R(fin) | R(shared)`, §5.3 events, §5.6 `report_exported`, the Growth plan line at `:227`).
Designed UI: `app/(dashboard)/analytics-reports/page.tsx` (714 lines, one file, hidden from the sidebar since FE `feature/hide-unbuilt-nav`).
Design: `docs/superpowers/specs/2026-11-12-analytics-reports-design.md`.

**How it was checked:** read-only inventory of both repos (FE `develop` `2bd70d6`, API develop `f7073893`, last migration 0103).
**There is no Analytics API** (no router, model, service, event or notification kind). `app/api/v1/endpoints/reports.py` is **Admin's
"Reported issues"** (content reports), unrelated: every new name here uses an `analytics` prefix to avoid the clash. The mock does **not
match the PRD**: the PRD has five routes (Builder, Saved, Investor updates, Board decks, Exports); the mock has five *tabs* (Overview, By hub,
Benchmarks, Reports, Export), a 3-pane builder does not exist, and its numbers are fintech-specific inventions ("Active Savers", "Referral
brought 61% of new savers", "47 pre-seed fintech companies in West Africa"). Every data-backed row below is a gap by construction.

What the platform **already has** and Analytics reuses (not gaps, see spec §2): per-hub analytics reads (Marketing `GET /marketing/analytics`
+ CSV, Sales `GET /sales/analytics`, Finance runway/cash-flow/expenses summary + dependency-free XLSX writer, Validation survey analytics,
Health Score + anonymised benchmarks, Mission history, Roadmap, Funding overview, Readiness score), the nightly `kpi_snapshots` job (4 metrics),
reportlab/pypdf, the `job_dispatcher` + `ScheduledRun` scheduler, transactional email (`platform/email.py`), notification registry, Documents
storage, the LLM budget. What it **lacks**: any single metric abstraction across them, a PPTX writer, any report/export/schedule/update tables.

Legend: ❌ gap · Layer: BE / FE / both · Slice: A Catalog+Overview · B Reports+runs · C Exports · D Schedules · E Investor updates ·
F Board decks · G Benchmarks+insights+glue · Severity: **Sec** > **High** > **Med** > **Low** · "Default" = lead default, built unless Adebayo objects.

## Decisions for Adebayo: D-ANA-1..9 (PROPOSED, nothing is built until answered)

| ID | Question | Options (cost) | Recommendation |
|---|---|---|---|
| **D-ANA-1** | What ships first? The PRD is five sub-pages; the mock is five different tabs | (a) **All five PRD pages in one push**. Cost: about 6 slices at once, the decks and the 3-pane builder dominate. (b) **Waves**: Wave 1 = Overview (live, by hub) + Report builder + Saved + Exports (slices A-C), Wave 2 = Schedules + Investor updates (D, E), Wave 3 = Board decks (F). Cost: decks arrive later. (c) Overview + Exports only, no builder. Cost: smallest, but "Analytics" would be a dashboard, not the PRD's report builder. | **(b)**. Founders get a true dashboard and a usable report in wave 1; the investor update is the highest-value artifact after that; decks are the heaviest and least certain. The PRD route list stays (`Overview` is added as the landing page, replacing the mock's tab bar). |
| **D-ANA-2** | Where do MRR, users, growth come from? The investor-update grid names "MRR, growth, runway, users, pipeline"; the platform has no user/MRR source | (a) **Platform data only**: revenue = Finance ledger, no users metric, "MRR" shown as "Monthly revenue". Cost: 0, but an investor update with no user count looks thin. (b) **Platform data + founder-entered metrics**: a small "Custom metrics" list (name, unit, monthly value) for users, MRR, churn, anything; they appear in the picker beside the hub metrics, labelled "Entered by you". Cost: 2 tables, one drawer, about 1 day. (c) Integrations (Stripe, analytics tools). Cost: weeks, parked. | **(b)**. Honest labels: platform figures say where they come from, entered ones say "Entered by you" and carry the date. No integrations in v1. |
| **D-ANA-3** | Data freshness and caching | (a) Live compute on every view. Cost: simple, but 12 sources per Overview load and no trend history beyond 4 KPIs. (b) Nightly snapshots only. Cost: cheap, but a number is up to a day stale and a new workspace sees nothing until tomorrow. (c) **Hybrid**: live compute for the current period with a 5-minute per-workspace cache, nightly snapshot of every catalog metric into the existing `kpi_snapshots` (history for trends and comparison periods), and every **report run freezes its resolved numbers** (so the PDF, the XLSX and the screen agree, forever). Cost: a snapshot job and a run table. | **(c)**. Overview and Preview are live; exports and schedules are frozen runs, labelled "as of {time}". |
| **D-ANA-4** | Who sees which numbers? PRD: F full, TM per grant, M and BC "read shared reports", AC read finance. A report can mix hubs, so the report needs a rule | (a) **Per-metric authorisation**: every metric belongs to a hub module; a viewer sees a metric only if their role could open that hub. A TM with the Analytics grant but no Finance grant opens a report and sees locked finance blocks ("Finance access needed"), the numbers are never sent. M and BC see only reports the Founder explicitly shared with them, with the same per-metric filter (non-financial metrics only for M and BC). AC sees finance metrics only. Investor update **send** = Founder only; TM may draft. Cost: a filter on every read, tests per role. (b) The Analytics grant sees everything. Cost: none, but a TM could read Finance and Funding through a report, which D-FUND-5 and Finance refuse. | **(a)**. Security first: Analytics must never be the side door around a hub grant. |
| **D-ANA-5** | Export formats, and what a "deck" is | (a) **PDF + XLSX (+ CSV for table blocks)** for reports; decks as **PDF** (landscape slides, drawn with the existing reportlab). Cost: smallest; PPTX deferred. (b) As (a) plus a **dependency-free PPTX writer** (the `xlsx.py` pattern: a zip of XML, no new package). Cost: about 3 days, charts become picture slides or native chart XML. (c) Add `python-pptx`. Cost: a new dependency in the image (the house avoided that for XLSX and invoices). | **(a) in wave 3, (b) as a fast follow if founders ask for editable decks.** The PRD says "PPTX/PDF"; shipping PDF first is honest about it. A PDF cannot be edited, so the UI says so. |
| **D-ANA-6** | Scheduled reports: how are they delivered? | (a) **In-app only**: a run is generated on schedule, the bell says "Scheduled report generated: {name}" with Download. Cost: smallest, safest. (b) **In-app plus an email with a link** (login required to download), to workspace members only. Cost: one email template; nothing sensitive in the email. (c) Email with the PDF attached, any address. Cost: the same, but a finance report leaves the workspace in an inbox, forwardable and uncontrolled. | **(b)**. Recipients are workspace members (the mock's "to you and Daniel"); never an attachment, never an outside address. Outside readers get investor updates only (D-ANA-7). |
| **D-ANA-7** | Sharing outside the workspace | (a) Nothing leaves: members only. Cost: 0, but the investor update (22.3) is an email to investors by definition. (b) **Investor updates only**: a founder-composed update goes by the platform transactional email to investors from the Funding pipeline plus extra addresses; **no public link to a report, no data room style viewer**; recipients get a per-recipient "stop these updates" link; open tracking is a 1-pixel image labelled "approximate" (mail apps pre-fetch images). Cost: investor email column on Funding, one send job, an unsubscribe table. (c) Public read-only report links. Cost: a new public surface, expiry, revocation, and a leak risk for finance numbers. | **(b)**. The update contains only what the founder selected and edited (a frozen snapshot, never a live link). Public report links are out. |
| **D-ANA-8** | Benchmarks tab: the mock invents "47 pre-seed fintech companies in West Africa" | (a) **Reuse Health Score benchmarks** (peers with the same stage and industry, at least the minimum cohort, bucketed percentiles, rank only; privacy-reviewed in 06.4) as the Benchmarks view, shown for the health dimensions only, with a "Not enough peers yet" state. Cost: small. (b) Metric-level peer benchmarks (MoM growth, CAC, retention) from the snapshot table across workspaces. Cost: a privacy design, thresholds, and enough data that does not exist yet. (c) Hide the tab. Cost: the mock loses a view. | **(a)** for v1; (b) after wave 2 once snapshots hold real history and the privacy rules are signed off. The invented cohort copy goes. |
| **D-ANA-9** | Where does AI write, and how are its numbers checked? | (a) No AI: templates and rule-based "Working / Watch" notes only. Cost: 0, flat prose. (b) **AI writes prose over numbers the code computed**: the "What the data says" card (cached 24h, about 2k tokens), the investor update sections (Highlights / Lowlights / Asks / Thank yous, about 6k tokens, "Report Narrator"), and nothing else. The three quick chips ("Monthly business review / Marketing performance / Financial snapshot") are **deterministic templates, not AI**. Every figure in AI text must appear in the input numbers, otherwise the sentence is dropped. Cost: a number-grounding check and an agent entry. (c) AI also builds reports from a free-text request. Cost: a larger prompt, a tool schema, more failure modes. | **(b)**. (c) later if founders ask. |

Lead defaults (built as written, reversible):

| ID | Default |
|---|---|
| D-ANA-L1 | Landing route stays `/analytics-reports` (the FE nav already uses it, `lib/nav-access.ts:49`), not the PRD's `/app/analytics`. Sub-routes: `/analytics-reports/builder/[id]`, `/saved`, `/investor-updates`, `/board-decks`, `/exports`. The mock's 5 tabs become: Overview and By hub (one page, hub filter), Benchmarks (inside Overview, per D-ANA-8), the rest are the PRD routes. |
| D-ANA-L2 | The metric catalog is **code, not a table** (a versioned registry, one resolver per metric, each tagged with hub module, unit, grain, group-by options). `GET /analytics/metrics-catalog` serves it filtered by the viewer's access. A saved report stores metric keys, so a retired key renders "metric no longer available", never a crash. |
| D-ANA-L3 | Periods: presets 7d, 30d, 90d, 12 months, this month, last month, custom (max 24 months), in the **workspace timezone**; comparison = previous period or same period last year. Money is integer minor units + currency, formatted at the edge; one currency per workspace, no conversion. |
| D-ANA-L4 | A report holds at most 30 blocks, 4 block kinds (metric card, chart, table, text), chart types line / bar / donut. Text blocks are plain text with bold and lists, no HTML, escaped everywhere (PDF, XLSX, email). Preview and export are rate-limited per workspace (heavy reads). |
| D-ANA-L5 | Report runs: every export and every schedule creates an `analytics_report_runs` row holding the resolved numbers; the PDF/XLSX are rendered **from the run, never re-queried**. Runs are kept 90 days; the files (exports) expire at 30 days as the PRD says. |
| D-ANA-L6 | Schedules are structured, not raw cron: weekly (weekday + hour), monthly (day 1-28 + hour), in the workspace timezone, format PDF or XLSX. Three starter schedules are offered as one-click (the mock's weekly summary, monthly performance, monthly investor-update draft). Three failures in a row disable the schedule and notify the owner. Max 5 active schedules per workspace. |
| D-ANA-L7 | Board deck and investor-update PDFs are copied into **Documents** (folder "Board decks" / "Investor updates", virus-scan state respected); report PDFs and XLSX stay in Export history only (expiring). |
| D-ANA-L8 | The monthly investor-update draft is **created automatically on the 1st** (numbers filled, narrative empty until the founder clicks the ✨ button, so no AI spend nobody asked for), with the PRD notification "Your investor update is ready to send". The cadence banner shows from day 1 to day 10 until sent. |
| D-ANA-L9 | Investor updates: sending shows a confirm modal listing every recipient, one send job per recipient (idempotent per recipient, a retry never double-sends), subject default `{Startup} — {Month} investor update`, reply-to = the founder. A sent update is read-only (a snapshot). Unsubscribed or bounced addresses are skipped and shown as such. |
| D-ANA-L10 | Plan: Growth and Scale (`analytics` is in `GROWTH_MODULES`, `app/services/billing/catalog.py:13`), behind `PLAN_ENFORCEMENT`. Investor updates and decks need the same plan. |
| D-ANA-L11 | Events use the house naming: PRD `report.generated` → `analytics.report.generated`, `investor_update.sent` → `analytics.investor_update.sent`, plus `analytics.export.created`. Product event `report_exported` (§5.6) fires on every export with `format` and `artifact`. |
| D-ANA-L12 | Out of scope (deferred): Health Score signals from reporting (same call as D-FUND-L9), platform-wide analytics (that is Super Admin §26.5, a different module), public report links, native PPTX charts, metric-level peer benchmarks, integrations feeding custom metrics, the mock's JSON export format (not in the PRD). |

## Mock control inventory (every control on the page, `analytics-reports/page.tsx`)

| Tab | Control | Today | Row |
|---|---|---|---|
| Shell | `ShellTopBar` "Analytics & Reports" | present | keep |
| Shell | 5 tab pills (Overview, By hub, Benchmarks, Reports, Export), each toasts "Switched to X tab." | local state | 65, 64 |
| Shell | Range pills 30 days / 90 days / 12 months, toast | local state, changes only a label | 57, 64 |
| Overview | Heading "The numbers that matter" + "every figure traces back to its source" | copy | 74 |
| Overview | "Export report" button | toast "exported to PDF", nothing | 58 |
| Overview | 4 stat cards: Monthly Revenue ₦1.6M +18%, Active Savers 1,240 +164, Net Burn ₦4.9M +3%, Runway 8.4 mo -0.6, each with 8-bar sparkline | hard-coded | 54, 10, 4 |
| Overview | "Revenue and active savers growth" bar chart (Feb-Jul), "{range} view" label | hard-coded heights, no values or axis | 55 |
| Overview | "What the data says" Working / Watch card | 2 hard-coded sentences | 56 |
| By hub | Filter pills All / Marketing / Sales / Finance / Validation, toast | local filter | 59 |
| By hub | 4 hub cards, each with "Open →" (toast) and 3 tiles: Marketing Reach 4.2K / CAC ₦240 / Conv. 9.1%; Sales Pipeline ₦42M / Win rate 31% / third tile; Finance and Validation tiles | hard-coded | 59, 60, 61 |
| Benchmarks | Heading "How you compare", "47 companies in this cohort" | invented | 62 |
| Benchmarks | "Sort: Percentile / Name" toggle | local sort of a static list | 63 |
| Benchmarks | Table: MoM revenue growth 78th, 30-day retention 91st, CAC 74th, with a cohort-spread bar | hard-coded | 62, 63 |
| Reports | "Build a report" button + "Compiling your report..." state (timer) | fake 2.5 s | 17, 13 |
| Reports | 4 report rows (July monthly performance, Investor update pack July, Q2 board summary, Full metrics export H1), each "Download" | toast only | 23, 42 |
| Reports | "Scheduled delivery": 3 toggles (Weekly summary Mon 7:00 to you; Monthly performance 1st to "you and Daniel"; Investor update draft monthly) | local state, "Daniel" is fake | 50, 47 |
| Export | Dataset buttons: All Tables / Revenue & Burn / Savers & Growth / Hub Metrics | local state | 45 |
| Export | "Include workspace metadata header" toggle | local state | 45 |
| Export | Format: CSV / XLSX / JSON | local state | 45, L12 |
| Export | Export button + "Generating package..." (timer) | fake 2.5 s, toast | 45, 42 |

## Gaps

### Foundation and cross-cutting
| # | Gap | Sev | Layer | Slice | Default / Q |
|---|---|---|---|---|---|
| 1 | No Analytics API at all: no router, models, services, events, notification kinds, row policy, role guard. `reports.py` is Admin "Reported issues" (name clash, prefix everything `analytics`) | High | BE | A | L1 |
| 2 | No metric abstraction. Needs a catalog (key, label, unit, hub, grain, group-by, compare support, access module) served by `GET /analytics/metrics-catalog` | High | BE | A | L2 |
| 3 | Hub reads have incompatible range semantics (Marketing `range_key` "30d", Sales `from/to`, Finance as-of, Dashboard KPIs fixed). Needs one resolver `resolve(metric, from, to, group_by, compare)` that adapts each | High | BE | A | L3 |
| 4 | History: `kpi_snapshots` stores 4 metrics nightly; trends, comparison periods and schedule diffs need the whole catalog snapshotted (same table, new metric keys, widen `metric` String(40) if needed) | High | BE | A | **D-ANA-3** |
| 5 | Plan gating: `analytics` is a Growth module in the catalog; no `require_module("analytics")` on any route; FE `nav-access` lists F, TM, M, BC | Med | both | G | L10 |
| 6 | Sidebar item hidden; unhide only after the waves are re-walked; role denial page for investor, legal advisor, admin roles | Med | FE | G | |
| 7 | **Per-metric authorisation**: a TM with the Analytics grant but without the Finance (or Funding) grant must not receive those numbers through the catalog, a block, a run, an export or an email. The numbers must not be sent at all (not hidden by CSS) | Sec | BE | A, B | **D-ANA-4** |
| 8 | **M and BC read only reports shared with them**; AC reads finance metrics only; no other role has any access. Needs `analytics_report_shares` and the role matrix in tests | Sec | BE | B | **D-ANA-4** |
| 9 | **Workspace isolation**: report, run, export, schedule and update ids from another workspace return a uniform 404; export download URLs are authorised per request (no guessable path), audited | Sec | BE | B, C | |
| 10 | The mock's numbers and nouns are invented and fintech-specific ("Active Savers", "referral brought 61% of new savers"): no such data exists in the product. Replace by the real catalog; "users" only through custom metrics | High | both | A | **D-ANA-2** |
| 11 | Money shown as strings (₦1.6M); real values are integer minor units + currency, formatted at the edge, exports write numeric cells | Med | both | A, C | L3 |
| 12 | Period model missing (presets, custom, comparison previous period / last year, workspace timezone, month boundaries) | High | both | A | L3 |
| 64 | Every tab and range click fires a toast ("Switched to X tab."), which is noise and read aloud by screen readers; remove | Low | FE | A | |
| 65 | IA mismatch: mock has Overview / By hub / Benchmarks / Reports / Export tabs, PRD has Builder / Saved / Investor updates / Board decks / Exports routes. Becomes a section layout with a tab bar of the PRD routes plus an Overview landing | High | FE | A | **D-ANA-1**, L1 |
| 70 | Empty, loading, error and "no data yet" states for a new workspace (a block with no source data says "No data yet" and links to the hub, never a zero) | Med | both | A, B | |
| 71 | FE integration guide per slice, captured live; every-control re-walk for F, TM (with and without the Finance grant), M and BC (shared report only), AC (finance only), and a denial page for others, at 1440 + 375 | High | both | each | house rule |
| 72 | Timezone: the workspace timezone does not exist as a stored setting for all workspaces (mission scheduler follow-up "per-workspace timezones"); decide the source (settings, else UTC+1 default) | Med | BE | A | L3 |
| 74 | Provenance: every figure needs "where this comes from" (hub link + definition tooltip) and every PDF a footer with period, generated-at ("as of"), workspace; mock claims "every figure traces back to its source" with nothing behind it | Med | both | A, C | |

### 22.1 Report Builder
| # | Gap | Sev | Layer | Slice | Default / Q |
|---|---|---|---|---|---|
| 13 | 3-pane builder does not exist (data source picker, canvas, block config); mock "Build a report" is a 2.5 s timer | High | FE | B | |
| 14 | Searchable metric picker over the catalog, grouped by hub, locked entries for hubs the viewer lacks | High | both | A, B | **D-ANA-4** |
| 15 | Canvas of blocks (metric card, chart, table, text), drag and drop order, add/remove/duplicate; `blocks_json` schema with a version, validation, limits | High | both | B | L4 |
| 16 | Block config: metric, range, grouping, viz type, comparison period; invalid combinations rejected (metric that cannot group by X) | High | both | B | L2, L3 |
| 17 | Header: inline-edit name, **Preview**, **Save report**, **Export ▾** (PDF / XLSX), **Schedule**; unsaved-changes guard; optimistic concurrency (`updated_at` / `version`) so two tabs do not overwrite | High | both | B, C, D | |
| 18 | Empty canvas copy "Drag in a metric to start. Or let me draft it:" with three chips; chips = deterministic templates (no AI) | Med | both | B | **D-ANA-9** |
| 19 | Preview must resolve without saving: stateless `POST /analytics/reports/preview` with the draft blocks | High | BE | B | |
| 20 | Keyboard-accessible reordering (not drag only), focus management, announcements; at 375 the 3 panes become a stepped layout (Sources, Canvas, Config) | Med | FE | B | |
| 22 | Abuse and cost: max 30 blocks, max 24-month range, rate limit on preview/run/export per workspace, request timeout, no unbounded group-by | Sec | BE | B | L4 |

### 22.2 Saved Reports
| # | Gap | Sev | Layer | Slice | Default / Q |
|---|---|---|---|---|---|
| 23 | Table (name, blocks, last run, schedule chip, owner) with search and sort; mock shows 4 fake rows | High | both | B | |
| 24 | Open in builder, duplicate, rename, delete (soft, 30 days), owner or Founder only | High | both | B | |
| 25 | Share with internal roles: share dialog (Founder picks members: TM, M, BC, AC), revoke, "shared with you" list for M and BC; "or export" = the export menu | High | both | B | **D-ANA-4** |
| 26 | "Last run" semantics: latest ready run time, failure chip when the last scheduled run failed | Low | both | B, D | L5 |

### 22.3 Investor Updates
| # | Gap | Sev | Layer | Slice | Default / Q |
|---|---|---|---|---|---|
| 27 | Composer: period selector, auto-pulled metric grid (MRR, growth, runway, users, pipeline), editable selection (add/remove/reorder; frozen when sent) | High | both | E | |
| 28 | MRR and users have no source in the platform (revenue = ledger, no recurring flag, no product users). Needs custom metrics or a rename to "Monthly revenue" | High | both | A, E | **D-ANA-2** |
| 29 | ✨ narrative sections Highlights / Lowlights / Metrics / Asks / Thank yous by "Report Narrator": agent not registered in AI orchestration; each section editable; number-grounding check; cost control | High | both | E | **D-ANA-9** |
| 30 | Recipients from the Funding Hub investor list: **`investors` has no email column** (the model has only name, firm, type, notes); needs `email` (nullable, validated) on the investor drawer plus extra emails; deduplicate; maximum 100 per update | High | both | E | **D-ANA-7** |
| 31 | "Preview email" (rendered exactly as sent), "Send update" (confirm modal listing recipients, idempotent per recipient), "Save draft" (autosave) | High | both | E | L9 |
| 32 | Sent view: per-recipient status (sent, bounced, opened (approximate), unsubscribed). Open tracking by pixel is unreliable (mail-app prefetch); label it; add a footer "stop these updates" link and a privacy line; store IP never | Sec | both | E | **D-ANA-7** |
| 33 | Cadence banner "Investors fund founders they hear from. Your {Month} update is ready to draft." monthly, dismiss, copy as the PRD | Med | both | E | L8 |
| 34 | Subject default "{Startup} — {Month} investor update", reply-to = founder, from = the platform sender with the startup name (not spoofing the founder's domain: SPF/DKIM) | Med | BE | E | L9 |
| 35 | Notification "Your investor update is ready to send" CTA "Review & send" (monthly auto-draft on the 1st) | Med | BE | E | L8 |
| 36 | Send is Founder-only (TM drafts, cannot send); rate limit per workspace per day; audit row; no resend of a sent update (a new version instead) | Sec | BE | E | **D-ANA-4** |
| 37 | Funding Hub interface: the investor list is the hand-off point (D-FUND-L9). Unsubscribed investors must show on the Funding card ("opted out of updates") | Low | both | E | |

### 22.4 Board Decks
| # | Gap | Sev | Layer | Slice | Default / Q |
|---|---|---|---|---|---|
| 38 | Generator UI: pick template (Business review / Financials / Product / Asks), pick period, pick which saved blocks feed which slide, "Generate" | High | both | F | **D-ANA-1** |
| 39 | Charts on slides need server-side rendering (vector charts drawn in reportlab); no chart-to-image path exists | High | BE | F | |
| 40 | Output: PRD says PPTX/PDF; no PPTX writer and no `python-pptx` in the image | High | BE | F | **D-ANA-5** |
| 41 | "Download deck" plus **stored to Documents** (folder, scan state, share rights); generation is a job with progress, failure state, retry | High | both | F | L7 |
| 42 | Slide text is drawn from run numbers plus optional AI talking points (no free-form invention); the deck footer states period and as-of | Med | both | F | **D-ANA-9** |

### 22.5 Export History
| # | Gap | Sev | Layer | Slice | Default / Q |
|---|---|---|---|---|---|
| 43 | Log table: artifact, format, generated, by, download link, expiry (30 days), status; mock has 4 fake download rows | High | both | C | |
| 44 | Expiry: a purge job deletes the file at 30 days and marks the row Expired ("Generate again"); downloads after expiry are 410 | High | BE | C | L5 |
| 45 | Raw data export (the mock's Export tab: dataset × format × metadata header): redefine as "Data tables" export over catalog metrics (CSV for one table, XLSX for several sheets), metadata header sheet; the mock's "Savers & Growth" dataset is invalid; JSON dropped | Med | both | C | L12 |
| 46 | Existing interim exports (Marketing CSV D-MKT-6 "→ Module 22 report", Finance transactions/model XLSX) stay working; Marketing 10.8 gets an "Add to a report" action once B ships | Low | both | C, G | |
| 47 | Download authorisation: per-request check of workspace + role + metric access recorded on the run; audit row; `Content-Disposition` filename sanitised | Sec | BE | C | |
| 48 | XLSX/CSV formula injection (cells beginning `=`, `+`, `-`, `@` from user text such as custom metric names, text blocks): reuse the `xlsx.py` text-only writer and guard CSV | Sec | BE | C | |

### Scheduling
| # | Gap | Sev | Layer | Slice | Default / Q |
|---|---|---|---|---|---|
| 49 | `report_schedules` absent; PRD uses cron, use structured weekly / monthly in workspace tz | High | BE | D | L6 |
| 50 | Scheduler tick missing (add `scheduled.analytics.reports` to `app/worker/scheduler.py`, idempotent via `ScheduledRun`, catch-up after downtime without duplicates) | High | BE | D | |
| 51 | Delivery: notification "Scheduled report generated: {name}" CTA "Download" (PRD) plus email link (members only) | High | both | D | **D-ANA-6** |
| 52 | Mock "Scheduled delivery" toggles (weekly summary, monthly performance, investor draft) map to three starter schedules; the recipient "Daniel" is fake, recipients come from the member list | Med | both | D | L6 |
| 53 | Schedule dialog in the builder (frequency, day, time, format, recipients picker, next run preview) and chip in Saved | High | both | D | |
| 54 | Failure handling: three consecutive failures disable the schedule, notify the owner; a schedule whose owner lost access is paused (no data leak to ex-members) | Sec | BE | D | L6 |
| 55 | Max 5 active schedules per workspace; plan-gated | Low | BE | D | L6, L10 |

### Overview, By hub, Benchmarks (the mock's own tabs)
| # | Gap | Sev | Layer | Slice | Default / Q |
|---|---|---|---|---|---|
| 56 | Overview stat cards hard-coded; need 4 real KPIs with delta and sparkline (revenue, net burn, runway, plus pipeline or a custom metric), "No data yet" when empty | High | both | A | **D-ANA-2** |
| 57 | Range pills change a label only; must drive every number on the page | High | both | A | L3 |
| 58 | "Export report" button must create a real export of the Overview as a report run (PDF) and show it in Export history | Med | both | A, C | |
| 59 | "Revenue and active savers growth" chart: static heights, no axis, no values, no tooltip; needs a real series (revenue vs a second metric), accessible table alternative | High | both | A | |
| 60 | "What the data says" (Working / Watch): rule-based notes from numbers (e.g. burn up while revenue up) with optional AI wording; each note links to its source | Med | both | A, G | **D-ANA-9** |
| 61 | By hub: hub filter pills and four cards with three tiles each; Open → goes to the hub; hubs the viewer cannot access are not shown; add Roadmap, Mission, Health and Funding cards where the viewer has access | High | both | A | **D-ANA-4** |
| 62 | Benchmarks: invented cohort. Replace with Health Score benchmark cohort rules (same stage and industry, minimum size, bucketed percentiles, own rank only) and a "Not enough peers yet" state | High | both | G | **D-ANA-8** |
| 63 | Benchmarks sort toggle and cohort-spread bars need real p25/p50/p75 from the benchmark endpoint; MoM growth, retention and CAC have no cohort data yet | Med | both | G | **D-ANA-8** |

### Events, notifications, instrumentation
| # | Gap | Sev | Layer | Slice | Default / Q |
|---|---|---|---|---|---|
| 66 | Events `report.generated`, `investor_update.sent` (PRD) missing; house names `analytics.report.generated`, `analytics.investor_update.sent`, `analytics.export.created`; Analytics consumer | Med | BE | B, E | L11 |
| 67 | Notification kinds + audience in the registry: scheduled report (recipients only), investor update ready (Founder), export ready (requester) | Med | BE | B, D, E | |
| 68 | Product event `report_exported` (§5.6) with format and artifact; `artifact_generated` for decks | Low | both | C, F | L11 |
| 69 | Health Score signal for "sent an update this month" | Low | BE | later | L12 |
| 73 | Marketing/Sales/Funding in-hub analytics pages stay as they are (they are the source), with a link "Add to a report" once B ships | Low | FE | G | |

## Slice status
| Slice | Rows | State |
|---|---|---|
| A Catalog + snapshots + Overview | 1-4, 7, 10-12, 56-61, 64, 65, 70, 72, 74 | blocked on D-ANA-1..4 |
| B Reports + runs + shares | 8, 9, 13-26, 66, 67 | blocked on D-ANA-1, 4, 9 |
| C Exports | 43-48, 58, 68 | blocked on D-ANA-5 |
| D Schedules | 49-55 | blocked on D-ANA-6 |
| E Investor updates | 27-37 | blocked on D-ANA-2, 7, 9 |
| F Board decks | 38-42 | blocked on D-ANA-5, 9 |
| G Benchmarks + insights + glue | 5, 6, 60, 62, 63, 73 | blocked on D-ANA-8 |

## Deferred follow-ups
Native PPTX with editable charts · metric-level peer benchmarks · public report links · integrations feeding custom metrics (Stripe, analytics
tools) · AI report-from-a-sentence · Health Score signal from reporting · multi-currency totals · per-workspace timezone setting if not present.
