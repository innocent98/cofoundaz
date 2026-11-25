# Analytics & Reports wave 1: every-control re-walk on merged develop

**Verdict: PASS for the FE, with one High API defect to fix before files go to real users.** Every control does what
the brief says for all seven roles at 1440 and 375, and no role ever sees or downloads a number from a hub it can't
open. The re-walk found three defects. Two were in the Overview chart (FE, fixed in this PR with tests). One is in the
API's PDF renderer: every naira sign printed as "?". That is fixed in innocent98/Cofoundaz-api#252 (`fix/analytics-pdf-naira`).

**Update 2026-11-18: Analytics is shown in the sidebar** (Adebayo's call, after this re-walk). See "Sidebar unhide" below.

## Setup

- **Code walked:** FE `develop` @ `c4cde6e` (FE #268 merged as `54e6eca`), unmodified while the walk ran. API `develop`
  @ `3f3e8f12`, alembic head `0109`, in its own worktree (`cofoundaz-api/wt/anrw-api`).
- **Stack (local only).** Nothing touched staging, www or the shared docker stack. Scratch Postgres + Redis
  (`anrw-pg` :55521, `anrw-redis` :56521), migrated from zero. Uvicorn on :8031 plus the worker, stub LLM, file email
  backend. Every key was generated for the run; no `.env` was read. FE: `next dev` on :3011 with
  `API_PROXY_TARGET=http://127.0.0.1:8031`.
- **Accounts (throwaway placeholders, `anrw-<role>-<hex>@example.com`).** Seeded through the real API: signup, verify
  from the captured mail, onboarding, invitations. Seven roles: founder (F), team member (TM), accountant (AC), mentor
  (M), business consultant (BC), investor (INV), legal advisor (LA).
- **Data.** The values are distinctive so a leak can be grepped. Revenue 777,700 kobo (₦7,777). Expenses 123,400 kobo
  (₦1,234). Marketing clicks **4321**, impressions 98,765. One custom metric ("Active users", 120 then 180).
- **Reports.** "Board pack" (Revenue, Expenses, Clicks, Open pipeline, a note) is shared with TM, AC, M and BC and
  has a frozen run. Three more founder reports exist, plus a TM-owned report and a private founder report (for the
  404 probes).
- **Exports.** 57 founder exports, so **Load more** has a second page. Before each founder pass, the newest report
  export and the newest data-table export were back-dated to expired in the scratch DB. The 30-day timer can't be
  waited out; this is the same method the API guide uses.
- **How it ran.** `analytics-rewalk-evidence/rewalk.mjs` drove headless Chrome, one fresh context per role and width
  (1440×900, 375×812). It is forked from the builder's `walk.mjs`. It adds:
  - the legal advisor role;
  - a sidebar-hidden check for every role;
  - the network log of every `/api/v1/analytics` request (zero allowed for denied roles);
  - "the screen equals the API" (₦7,777 on the Revenue card, 4,321 for M/BC, never for AC);
  - export polling seen on the wire;
  - Load more (`offset=50`);
  - every download saved to disk.
- **Hand-set states.** `extras.mjs` covers the 409 conflict, the 429 limit, the locked-block save refusal and the
  accountant's XLSX. `files.py` checks the contents of every downloaded file. `probe.py` checks the API boundary per role.
- **Walk aid, said plainly.** The API allows 40 heavy reads a minute per workspace, and a script clicks far faster than
  a person. During `rewalk.mjs` a loop cleared the scratch Redis `analytics:rl:*` keys. The loop was stopped for
  `extras.mjs`, which checks the real 429.
- **A row passes** when the control, driven in the browser, does what the brief and the guides say, and the screen
  agrees with the raw API (the same role over HTTP) or the network log.

## Totals

| Role | 1440 | 375 | Hand-set / files / API probes | Result |
|---|---|---|---|---|
| Founder | 66/66 | 66/66 | 409, locked-save, 429 × 2 widths: 6/6 · 6 files ok · 1 probe | PASS (chart fixed, PDF ₦ open) |
| Team member | 64/64 | 64/64 | 6 files ok · 5 probes | PASS (same chart and PDF notes) |
| Accountant | 13/13 | 13/13 | XLSX × 2 widths: 2/2 · 4 files redacted · 7 probes | PASS (PDF ₦ open) |
| Mentor | 13/13 | 13/13 | 6 probes | PASS |
| Business consultant | 13/13 | 13/13 | 2 probes | PASS |
| Investor (denied) | 8/8 | 8/8 | 2 probes | PASS: 0 analytics requests |
| Legal advisor (denied) | 8/8 | 8/8 | 3 probes | PASS: 0 analytics requests |

**Automated rows:** 370/370 browser checks, 8/8 hand-set states, 16/16 file-content checks and 26/26 API boundary
probes. That is **420/420**. On top of those, the visual rows V1-V4 below were judged by eye from screenshots and
rendered files: **2 FAIL on develop (fixed here), 2 FAIL (API, open).**

## Visual rows (judged by eye; a script can't see these)

| # | Control | Role | Width | Expected | Actual | Result | Evidence |
|---|---|---|---|---|---|---|---|
| V1 | Overview "Revenue and Expenses" chart | F, TM, AC | 1440, 375 | heights compare honestly: ₦7,777 revenue stands well above ₦1,234 expenses | on develop each series had its **own** y-axis (left ₦0-₦8k, right ₦0-₦1.4k), so both peaked at the same height | FAIL → **fixed in this PR**, re-checked PASS | `founder-1440-overview.jpg` (before), `founder-{1440,375}-overview-chart-after-fix.jpg` (after) |
| V2 | Chart y-axis tick labels | F, TM, AC | 1440, 375 | every tick label different | right axis read "₦1k, ₦1k, ₦700, ₦350, ₦0" (1,050 and 1,400 both rounded to ₦1k) | FAIL → **fixed in this PR**, re-checked PASS | `accountant-375-landing.jpg` (before), after-fix shots |
| V3 | Downloaded PDF: money | F, TM, AC | both | "₦7,777.00" | every naira sign prints as **"?"**: "?7,777.00", "+?6,777.00 vs ?1,000.00" | FAIL (API) | `files/accountant-pdf-page1-naira-as-question-mark.png`, `files/*.pdf` |
| V4 | Run / export "by" name for a member with no name | F, TM, M, AC | both | the SO1 wording "A team member" | runs list says "Member"; PDF header says "generated by Member" | FAIL (API, cosmetic) | `mentor-375-shared-report.jpg`, PDF header |

## Defects

**High**
- **D1 (API): PDF exports print "?" instead of "₦". Fixed in innocent98/Cofoundaz-api#252 (`fix/analytics-pdf-naira`)**, verified live (`files/accountant-pdf-page1-after-api-fix.png`: "₦7,777.00", Marketing still locked).
  - Where: `cofoundaz-api/app/services/analytics/render.py`. It sets the symbol `_SYMBOL = {"NGN": "₦"}` (l.37), but
    renders with ReportLab's built-in Helvetica (l.267, 332-338). That font has WinAnsi encoding and no U+20A6 glyph,
    so the sign becomes "?".
  - Effect: every money value in every PDF (founder, TM and accountant) reads "?7,777.00". This is the file a founder
    sends to a board or a bank. XLSX and CSV carry plain numbers and are fine.
  - Fix: register a TTF with the naira glyph (e.g. bundle DejaVu Sans or Inter under `app/assets/fonts/`, then
    `pdfmetrics.registerFont`) and use it for every style. Add a test that extracts the PDF text and asserts `₦7,777.00`.
  - The API guide's verification row checks `%PDF` and the absence of `4321`, not the currency glyph, which is why it
    slipped through.

**Medium**
- **D2 (FE, fixed here): the Overview chart drew same-unit series on two independent axes.** Revenue ₦7,777 and
  Expenses ₦1,234 peaked at the same height, so the founder reads "spending as much as I earn".
  - Fix: `axisIds()` in `_components/series-chart.tsx` puts series with the same unit and currency on one axis. A
    second axis is drawn only when the units differ.
  - Test: `series-chart.test.ts`. Re-checked live: one axis, expenses visibly lower.

**Low**
- **D3 (FE, fixed here): repeated tick labels.** `compact()` rounded 1,050 and 1,400 both to "₦1k". `compactTick()` keeps
  one decimal below ten of a unit ("₦1.1k", "₦1.4k"). Tested.
- **D4 (API, cosmetic): an unnamed member is "Member". Fixed in innocent98/Cofoundaz-api#252 (`fix/analytics-pdf-naira`).** In the runs list and the PDF header
  (`exports.py:266`, `rep.names(...).get(..., "Member")`), where SO1 settled on "A team member" for report authors. Make
  the fallback match.
- **D5 (FE, observation): a notification link to an export older than the newest 50 can't find its row.**
  `/exports?highlight=<id>` reads page 1 only. Notifications are sent for fresh exports, so this only bites after 50
  newer exports. Fix later by fetching the highlighted row with `GET /exports/{id}` when it's not on the page.
- **D6 (observation): at 375 the period pills scroll inside their own row.** "This month", "Last month" and "Custom" start
  off-screen with no fade or arrow. They are reachable and clicked in the walk; the page itself doesn't scroll
  sideways.

## Security observations

- **S1. Per-metric authorisation holds on screen, in files and on the wire.**
  - On screen: AC sees Finance only. M and BC see locks ("Finance access needed … The numbers are not sent to you.")
    and never a ₦ value or 7,777.
  - In files: the AC's PDF and XLSX hold no `4321`; they have "Locked. Marketing access is needed to see this." /
    "Locked. Sales access…" and Revenue 7,777.
  - On the wire: M's `GET /reports/{id}` locked blocks carry only `{id,type,locked,needs,needs_label}`, and M's runs
    payload contains no `777700`.
- **S2. Investor and legal advisor make zero `/api/v1/analytics` requests** on `/`, `/saved`, `/exports` and
  `/builder/new` at both widths. The denial page is drawn client-side, and the API answers 403 to both roles if called
  directly.
- **S3. Existence is not leaked.**
  - A report you can't see is 404 for M, AC and TM (the private founder report).
  - Another member's export is 404 for AC and TM, including `/download`.
  - Visible-but-not-yours is 403: TM PATCH, DELETE and shares on the founder's report.
- **S4. Downloads are bearer fetches to a Blob.** No signed public URL is placed in the DOM. No token is in
  localStorage; this was checked in the SOP and not re-checked here.
- **S5. Mentor and business consultant can't export at all.** The API answers 403 to `POST /reports/{id}/export`,
  and the FE shows no Export menu.
- **S6. Accountant boundaries.**
  - A data-table request for a Marketing metric gets 422 "One or more metrics are not available to you.", the same
    answer as for an unknown key, so nothing is enumerable.
  - `POST /reports/{id}/export` without `run_id` gets 403.
  - `/custom-metrics` gets 403. Founder-entered numbers stay with F and TM; consistent with D-ANA-4.
- **S7. Funding metrics still show under By hub (F and TM).** This is known; there is no link into the hidden Funding
  pages ("no link into hidden Funding" passed for every pass).

## Not covered live

- **Plan gate (402):** `PLAN_ENFORCEMENT` is off locally, as in the API guides.
- **`failed` run and `EXPORT_FAILED` states:** API unit tests only.
- **The polling 2-minute cap:** unit-tested (`useExportWatch`). Live exports were ready in about 2 s, after 1 poll each.
- **Locked-block save refusal is a stubbed check.** Founders and TMs open every hub, so no live role can open the
  builder on a report holding a locked block. `extras.mjs` intercepts the report GET and appends one locked block, in
  the exact reader shape.
- **The role-change re-check on download:** API unit test only.
- **Staging:** not walked. This was a local scratch stack, by the brief.

## Recommendation to the lead

The FE was ready to show in the sidebar once D1 was fixed in the API; Adebayo said to show it on 2026-11-18, and D1 is fixed in innocent98/Cofoundaz-api#252. A board-facing PDF with "?" for every naira is the
one thing a founder will notice on day one. D2 and D3 ship in this PR. D4 and D5 can ride with the next Analytics
slice.

## Sidebar unhide (2026-11-18)

Adebayo said to show Analytics in the sidebar. The entry is "Analytics & Reports" in GROW, after Finance Hub
(`components/sidebar.tsx`). It uses the same `canSee` role map as the pages, so a role that can't open Analytics
doesn't get the entry, as for every other module.

Checked live with `analytics-rewalk-evidence/sidebar.mjs` (results `results-sidebar.json`, screenshots
`sidebar-<role>-<width>.jpg`). At 375 the check opens the "More" menu first. **14/14 pass.**

| Role | 1440 | 375 | Click lands on |
|---|---|---|---|
| Founder | shown ✅ | shown ✅ | `/analytics-reports` (Overview) |
| Team member | shown ✅ | shown ✅ | `/analytics-reports` |
| Accountant | shown ✅ | shown ✅ | `/analytics-reports` (Finance only) |
| Mentor | shown ✅ | shown ✅ | `/analytics-reports/saved` (shared reports) |
| Business consultant | shown ✅ | shown ✅ | `/analytics-reports/saved` |
| Investor | absent ✅ | absent ✅ | n/a |
| Legal advisor | absent ✅ | absent ✅ | n/a |

Unit: `components/sidebar.test.tsx`, a new per-role test plus the accountant test.

## Rows

Generated from the raw results in `analytics-rewalk-evidence/results-*.json`, `results-extras.json`,
`files-results.json` and `probe-results.json`. Roles: F, TM, AC, M, BC, INV, LA. "api" width = an HTTP probe, not a
screen. For browser rows the expected behaviour is the check named in the Control column, as the script asserts it.

| # | Control | Role | Width | Expected | Actual | Result | Evidence |
|---|---|---|---|---|---|---|---|
| R1 | login | F | 1440 | login | as expected | PASS | - |
| R2 | sidebar has no Analytics entry | F | 1440 | sidebar has no Analytics entry | as expected | PASS | - |
| R3 | overview loads with cards | F | 1440 | overview loads with cards | as expected | PASS | founder-1440-overview.jpg |
| R4 | Revenue card equals API (777,700 kobo = ₦7,777) | F | 1440 | Revenue card equals API (777,700 kobo = ₦7,777) | as expected | PASS | - |
| R5 | no sideways scroll | F | 1440 | no sideways scroll | as expected | PASS | - |
| R6 | range pill 7 days | F | 1440 | range pill 7 days | as expected | PASS | - |
| R7 | range pill 90 days | F | 1440 | range pill 90 days | as expected | PASS | - |
| R8 | range pill 12 months | F | 1440 | range pill 12 months | as expected | PASS | - |
| R9 | range pill This month | F | 1440 | range pill This month | as expected | PASS | - |
| R10 | range pill Last month | F | 1440 | range pill Last month | as expected | PASS | - |
| R11 | range pill 30 days | F | 1440 | range pill 30 days | as expected | PASS | - |
| R12 | custom range needs both dates, then refetches | F | 1440 | custom range needs both dates, then refetches | as expected | PASS | - |
| R13 | compare select (year, then previous) | F | 1440 | compare select (year, then previous) | as expected | PASS | - |
| R14 | definition tooltip button | F | 1440 | definition tooltip button | as expected | PASS | - |
| R15 | chart "Show as a table" | F | 1440 | chart "Show as a table" | as expected | PASS | - |
| R16 | insight source link goes to hub | F | 1440 | insight source link goes to hub | as expected | PASS | - |
| R17 | card hub link targets hub | F | 1440 | card hub link targets hub | as expected | PASS | - |
| R18 | no link into hidden Funding | F | 1440 | no link into hidden Funding | as expected | PASS | - |
| R19 | by-hub pill Finance | F | 1440 | by-hub pill Finance | as expected | PASS | - |
| R20 | by-hub pill Marketing | F | 1440 | by-hub pill Marketing | as expected | PASS | - |
| R21 | by-hub pill All hubs | F | 1440 | by-hub pill All hubs | as expected | PASS | - |
| R22 | custom metric: add, enter value, delete | F | 1440 | custom metric: add, enter value, delete | as expected | PASS | - |
| R23 | "Edit values" on a custom card jumps to the panel | F | 1440 | "Edit values" on a custom card jumps to the panel | as expected | PASS | - |
| R24 | benchmarks card (Health cohort) | F | 1440 | benchmarks card (Health cohort) | as expected | PASS | - |
| R25 | Export data ▾ CSV → ready → download | F | 1440 | Export data ▾ CSV → ready → download | as expected | PASS | network log + files/ |
| R26 | reports list loads | F | 1440 | reports list loads | as expected | PASS | founder-1440-saved.jpg |
| R27 | no sideways scroll (list) | F | 1440 | no sideways scroll (list) | as expected | PASS | - |
| R28 | search filters | F | 1440 | search filters | as expected | PASS | - |
| R29 | sort select | F | 1440 | sort select | as expected | PASS | - |
| R30 | duplicate a report | F | 1440 | duplicate a report | as expected | PASS | - |
| R31 | delete: cancel, then delete the copy | F | 1440 | delete: cancel, then delete the copy | as expected | PASS | - |
| R32 | share dialog: shows locked hubs, saves members | F | 1440 | share dialog: shows locked hubs, saves members | as expected | PASS | - |
| R33 | report detail loads | F | 1440 | report detail loads | as expected | PASS | founder-1440-report-run.jpg |
| R34 | Run now → frozen run shown | F | 1440 | Run now → frozen run shown | as expected | PASS | founder-1440-report-run.jpg |
| R35 | no sideways scroll (detail) | F | 1440 | no sideways scroll (detail) | as expected | PASS | - |
| R36 | pick an older run in the list | F | 1440 | pick an older run in the list | as expected | PASS | - |
| R37 | Export ▾ PDF → ready → download | F | 1440 | Export ▾ PDF → ready → download | as expected | PASS | network log + files/ |
| R38 | Share button on detail opens dialog | F | 1440 | Share button on detail opens dialog | as expected | PASS | - |
| R39 | Edit link opens builder | F | 1440 | Edit link opens builder | as expected | PASS | - |
| R40 | builder new: template chips + empty copy | F | 1440 | builder new: template chips + empty copy | as expected | PASS | founder-1440-builder-empty.jpg |
| R41 | save without a name is refused | F | 1440 | save without a name is refused | as expected | PASS | - |
| R42 | template chip fills the canvas | F | 1440 | template chip fills the canvas | as expected | PASS | - |
| R43 | name and description inputs | F | 1440 | name and description inputs | as expected | PASS | - |
| R44 | catalog: search and add a metric | F | 1440 | catalog: search and add a metric | as expected | PASS | - |
| R45 | catalog: add a text note → config opens | F | 1440 | catalog: add a text note → config opens | as expected | PASS | - |
| R46 | block config: title, viz, period, compare | F | 1440 | block config: title, viz, period, compare | as expected | PASS | - |
| R47 | canvas: move up/down, duplicate, remove | F | 1440 | canvas: move up/down, duplicate, remove | as expected | PASS | - |
| R48 | drag and drop reorders | F | 1440 | drag and drop reorders | as expected | PASS | - |
| R49 | Preview shows live numbers | F | 1440 | Preview shows live numbers | as expected | PASS | founder-1440-builder-preview.jpg |
| R50 | close preview | F | 1440 | close preview | as expected | PASS | founder-1440-builder-preview.jpg |
| R51 | Export disabled until saved | F | 1440 | Export disabled until saved | as expected | PASS | - |
| R52 | report period pills | F | 1440 | report period pills | as expected | PASS | - |
| R53 | Save creates the report | F | 1440 | Save creates the report | as expected | PASS | - |
| R54 | edit → unsaved hint → save again (PATCH) | F | 1440 | edit → unsaved hint → save again (PATCH) | as expected | PASS | - |
| R55 | Export ▾ XLSX from the builder | F | 1440 | Export ▾ XLSX from the builder | as expected | PASS | - |
| R56 | Back to the report link | F | 1440 | Back to the report link | as expected | PASS | - |
| R57 | exports page loads with history | F | 1440 | exports page loads with history | as expected | PASS | founder-1440-exports.jpg |
| R58 | no sideways scroll (exports) | F | 1440 | no sideways scroll (exports) | as expected | PASS | - |
| R59 | filter select (reports, data tables, everything) | F | 1440 | filter select (reports, data tables, everything) | as expected | PASS | - |
| R60 | data tables: empty pick refused | F | 1440 | data tables: empty pick refused | as expected | PASS | - |
| R61 | data tables: pick, period, format, metadata → ready | F | 1440 | data tables: pick, period, format, metadata → ready | as expected (polled 1x) | PASS | network log + files/ |
| R62 | history Load more fetches offset=50 and adds rows | F | 1440 | history Load more fetches offset=50 and adds rows | as expected | PASS | - |
| R63 | history row Download (authorised fetch) | F | 1440 | history row Download (authorised fetch) | as expected | PASS | network log + files/ |
| R64 | expired row (fa5aa997) says "Expired. Generate it again." and regenerates | F | 1440 | expired row (fa5aa997) says "Expired. Generate it again." and regenerates | as expected | PASS | - |
| R65 | expired row (7e9e2416) says "Expired. Generate it again." and regenerates | F | 1440 | expired row (7e9e2416) says "Expired. Generate it again." and regenerates | as expected | PASS | - |
| R66 | console errors | F | 1440 | console errors | as expected | PASS | - |
| R67 | login | F | 375 | login | as expected | PASS | - |
| R68 | sidebar has no Analytics entry | F | 375 | sidebar has no Analytics entry | as expected | PASS | - |
| R69 | overview loads with cards | F | 375 | overview loads with cards | as expected | PASS | founder-375-overview.jpg |
| R70 | Revenue card equals API (777,700 kobo = ₦7,777) | F | 375 | Revenue card equals API (777,700 kobo = ₦7,777) | as expected | PASS | - |
| R71 | no sideways scroll | F | 375 | no sideways scroll | as expected | PASS | - |
| R72 | range pill 7 days | F | 375 | range pill 7 days | as expected | PASS | - |
| R73 | range pill 90 days | F | 375 | range pill 90 days | as expected | PASS | - |
| R74 | range pill 12 months | F | 375 | range pill 12 months | as expected | PASS | - |
| R75 | range pill This month | F | 375 | range pill This month | as expected | PASS | - |
| R76 | range pill Last month | F | 375 | range pill Last month | as expected | PASS | - |
| R77 | range pill 30 days | F | 375 | range pill 30 days | as expected | PASS | - |
| R78 | custom range needs both dates, then refetches | F | 375 | custom range needs both dates, then refetches | as expected | PASS | - |
| R79 | compare select (year, then previous) | F | 375 | compare select (year, then previous) | as expected | PASS | - |
| R80 | definition tooltip button | F | 375 | definition tooltip button | as expected | PASS | - |
| R81 | chart "Show as a table" | F | 375 | chart "Show as a table" | as expected | PASS | - |
| R82 | insight source link goes to hub | F | 375 | insight source link goes to hub | as expected | PASS | - |
| R83 | card hub link targets hub | F | 375 | card hub link targets hub | as expected | PASS | - |
| R84 | no link into hidden Funding | F | 375 | no link into hidden Funding | as expected | PASS | - |
| R85 | by-hub pill Finance | F | 375 | by-hub pill Finance | as expected | PASS | - |
| R86 | by-hub pill Marketing | F | 375 | by-hub pill Marketing | as expected | PASS | - |
| R87 | by-hub pill All hubs | F | 375 | by-hub pill All hubs | as expected | PASS | - |
| R88 | custom metric: add, enter value, delete | F | 375 | custom metric: add, enter value, delete | as expected | PASS | - |
| R89 | "Edit values" on a custom card jumps to the panel | F | 375 | "Edit values" on a custom card jumps to the panel | as expected | PASS | - |
| R90 | benchmarks card (Health cohort) | F | 375 | benchmarks card (Health cohort) | as expected | PASS | - |
| R91 | Export data ▾ CSV → ready → download | F | 375 | Export data ▾ CSV → ready → download | as expected | PASS | network log + files/ |
| R92 | reports list loads | F | 375 | reports list loads | as expected | PASS | founder-375-saved.jpg |
| R93 | no sideways scroll (list) | F | 375 | no sideways scroll (list) | as expected | PASS | - |
| R94 | search filters | F | 375 | search filters | as expected | PASS | - |
| R95 | sort select | F | 375 | sort select | as expected | PASS | - |
| R96 | duplicate a report | F | 375 | duplicate a report | as expected | PASS | - |
| R97 | delete: cancel, then delete the copy | F | 375 | delete: cancel, then delete the copy | as expected | PASS | - |
| R98 | share dialog: shows locked hubs, saves members | F | 375 | share dialog: shows locked hubs, saves members | as expected | PASS | - |
| R99 | report detail loads | F | 375 | report detail loads | as expected | PASS | founder-375-report-run.jpg |
| R100 | Run now → frozen run shown | F | 375 | Run now → frozen run shown | as expected | PASS | founder-375-report-run.jpg |
| R101 | no sideways scroll (detail) | F | 375 | no sideways scroll (detail) | as expected | PASS | - |
| R102 | pick an older run in the list | F | 375 | pick an older run in the list | as expected | PASS | - |
| R103 | Export ▾ PDF → ready → download | F | 375 | Export ▾ PDF → ready → download | as expected | PASS | network log + files/ |
| R104 | Share button on detail opens dialog | F | 375 | Share button on detail opens dialog | as expected | PASS | - |
| R105 | Edit link opens builder | F | 375 | Edit link opens builder | as expected | PASS | - |
| R106 | builder new: template chips + empty copy | F | 375 | builder new: template chips + empty copy | as expected | PASS | founder-375-builder-empty.jpg |
| R107 | save without a name is refused | F | 375 | save without a name is refused | as expected | PASS | - |
| R108 | template chip fills the canvas | F | 375 | template chip fills the canvas | as expected | PASS | - |
| R109 | name and description inputs | F | 375 | name and description inputs | as expected | PASS | - |
| R110 | catalog: search and add a metric | F | 375 | catalog: search and add a metric | as expected | PASS | - |
| R111 | catalog: add a text note → config opens | F | 375 | catalog: add a text note → config opens | as expected | PASS | - |
| R112 | block config: title, viz, period, compare | F | 375 | block config: title, viz, period, compare | as expected | PASS | - |
| R113 | canvas: move up/down, duplicate, remove | F | 375 | canvas: move up/down, duplicate, remove | as expected | PASS | - |
| R114 | drag and drop reorders | F | 375 | drag and drop reorders | as expected | PASS | - |
| R115 | Preview shows live numbers | F | 375 | Preview shows live numbers | as expected | PASS | founder-375-builder-preview.jpg |
| R116 | close preview | F | 375 | close preview | as expected | PASS | founder-375-builder-preview.jpg |
| R117 | Export disabled until saved | F | 375 | Export disabled until saved | as expected | PASS | - |
| R118 | report period pills | F | 375 | report period pills | as expected | PASS | - |
| R119 | Save creates the report | F | 375 | Save creates the report | as expected | PASS | - |
| R120 | edit → unsaved hint → save again (PATCH) | F | 375 | edit → unsaved hint → save again (PATCH) | as expected | PASS | - |
| R121 | Export ▾ XLSX from the builder | F | 375 | Export ▾ XLSX from the builder | as expected | PASS | - |
| R122 | Back to the report link | F | 375 | Back to the report link | as expected | PASS | - |
| R123 | exports page loads with history | F | 375 | exports page loads with history | as expected | PASS | founder-375-exports.jpg |
| R124 | no sideways scroll (exports) | F | 375 | no sideways scroll (exports) | as expected | PASS | - |
| R125 | filter select (reports, data tables, everything) | F | 375 | filter select (reports, data tables, everything) | as expected | PASS | - |
| R126 | data tables: empty pick refused | F | 375 | data tables: empty pick refused | as expected | PASS | - |
| R127 | data tables: pick, period, format, metadata → ready | F | 375 | data tables: pick, period, format, metadata → ready | as expected (polled 1x) | PASS | network log + files/ |
| R128 | history Load more fetches offset=50 and adds rows | F | 375 | history Load more fetches offset=50 and adds rows | as expected | PASS | - |
| R129 | history row Download (authorised fetch) | F | 375 | history row Download (authorised fetch) | as expected | PASS | network log + files/ |
| R130 | expired row (fa5aa997) says "Expired. Generate it again." and regenerates | F | 375 | expired row (fa5aa997) says "Expired. Generate it again." and regenerates | as expected | PASS | - |
| R131 | expired row (7e9e2416) says "Expired. Generate it again." and regenerates | F | 375 | expired row (7e9e2416) says "Expired. Generate it again." and regenerates | as expected | PASS | - |
| R132 | console errors | F | 375 | console errors | as expected | PASS | - |
| R133 | login | TM | 1440 | login | as expected | PASS | - |
| R134 | sidebar has no Analytics entry | TM | 1440 | sidebar has no Analytics entry | as expected | PASS | - |
| R135 | overview loads with cards | TM | 1440 | overview loads with cards | as expected | PASS | team_member-1440-overview.jpg |
| R136 | Revenue card equals API (777,700 kobo = ₦7,777) | TM | 1440 | Revenue card equals API (777,700 kobo = ₦7,777) | as expected | PASS | - |
| R137 | no sideways scroll | TM | 1440 | no sideways scroll | as expected | PASS | - |
| R138 | range pill 7 days | TM | 1440 | range pill 7 days | as expected | PASS | - |
| R139 | range pill 90 days | TM | 1440 | range pill 90 days | as expected | PASS | - |
| R140 | range pill 12 months | TM | 1440 | range pill 12 months | as expected | PASS | - |
| R141 | range pill This month | TM | 1440 | range pill This month | as expected | PASS | - |
| R142 | range pill Last month | TM | 1440 | range pill Last month | as expected | PASS | - |
| R143 | range pill 30 days | TM | 1440 | range pill 30 days | as expected | PASS | - |
| R144 | custom range needs both dates, then refetches | TM | 1440 | custom range needs both dates, then refetches | as expected | PASS | - |
| R145 | compare select (year, then previous) | TM | 1440 | compare select (year, then previous) | as expected | PASS | - |
| R146 | definition tooltip button | TM | 1440 | definition tooltip button | as expected | PASS | - |
| R147 | chart "Show as a table" | TM | 1440 | chart "Show as a table" | as expected | PASS | - |
| R148 | insight source link goes to hub | TM | 1440 | insight source link goes to hub | as expected | PASS | - |
| R149 | card hub link targets hub | TM | 1440 | card hub link targets hub | as expected | PASS | - |
| R150 | no link into hidden Funding | TM | 1440 | no link into hidden Funding | as expected | PASS | - |
| R151 | by-hub pill Finance | TM | 1440 | by-hub pill Finance | as expected | PASS | - |
| R152 | by-hub pill Marketing | TM | 1440 | by-hub pill Marketing | as expected | PASS | - |
| R153 | by-hub pill All hubs | TM | 1440 | by-hub pill All hubs | as expected | PASS | - |
| R154 | custom metric: add, enter value, delete | TM | 1440 | custom metric: add, enter value, delete | as expected | PASS | - |
| R155 | "Edit values" on a custom card jumps to the panel | TM | 1440 | "Edit values" on a custom card jumps to the panel | as expected | PASS | - |
| R156 | benchmarks card (Health cohort) | TM | 1440 | benchmarks card (Health cohort) | as expected | PASS | - |
| R157 | Export data ▾ CSV → ready → download | TM | 1440 | Export data ▾ CSV → ready → download | as expected | PASS | network log + files/ |
| R158 | reports list loads | TM | 1440 | reports list loads | as expected | PASS | team_member-1440-saved.jpg |
| R159 | no sideways scroll (list) | TM | 1440 | no sideways scroll (list) | as expected | PASS | - |
| R160 | search filters | TM | 1440 | search filters | as expected | PASS | - |
| R161 | sort select | TM | 1440 | sort select | as expected | PASS | - |
| R162 | duplicate a report | TM | 1440 | duplicate a report | as expected | PASS | - |
| R163 | delete: cancel, then delete the copy | TM | 1440 | delete: cancel, then delete the copy | as expected | PASS | - |
| R164 | no Share button for team member | TM | 1440 | no Share button for team member | as expected | PASS | - |
| R165 | report detail loads | TM | 1440 | report detail loads | as expected | PASS | team_member-1440-report-run.jpg |
| R166 | Run now → frozen run shown | TM | 1440 | Run now → frozen run shown | as expected | PASS | team_member-1440-report-run.jpg |
| R167 | no sideways scroll (detail) | TM | 1440 | no sideways scroll (detail) | as expected | PASS | - |
| R168 | pick an older run in the list | TM | 1440 | pick an older run in the list | as expected | PASS | - |
| R169 | Export ▾ PDF → ready → download | TM | 1440 | Export ▾ PDF → ready → download | as expected | PASS | network log + files/ |
| R170 | no Share button | TM | 1440 | no Share button | as expected | PASS | - |
| R171 | no Edit on the founder's report (can_edit false) | TM | 1440 | no Edit on the founder's report (can_edit false) | as expected | PASS | - |
| R172 | builder URL of the founder's report is refused | TM | 1440 | builder URL of the founder's report is refused | as expected | PASS | - |
| R173 | builder new: template chips + empty copy | TM | 1440 | builder new: template chips + empty copy | as expected | PASS | team_member-1440-builder-empty.jpg |
| R174 | save without a name is refused | TM | 1440 | save without a name is refused | as expected | PASS | - |
| R175 | template chip fills the canvas | TM | 1440 | template chip fills the canvas | as expected | PASS | - |
| R176 | name and description inputs | TM | 1440 | name and description inputs | as expected | PASS | - |
| R177 | catalog: search and add a metric | TM | 1440 | catalog: search and add a metric | as expected | PASS | - |
| R178 | catalog: add a text note → config opens | TM | 1440 | catalog: add a text note → config opens | as expected | PASS | - |
| R179 | block config: title, viz, period, compare | TM | 1440 | block config: title, viz, period, compare | as expected | PASS | - |
| R180 | canvas: move up/down, duplicate, remove | TM | 1440 | canvas: move up/down, duplicate, remove | as expected | PASS | - |
| R181 | drag and drop reorders | TM | 1440 | drag and drop reorders | as expected | PASS | - |
| R182 | Preview shows live numbers | TM | 1440 | Preview shows live numbers | as expected | PASS | team_member-1440-builder-preview.jpg |
| R183 | close preview | TM | 1440 | close preview | as expected | PASS | team_member-1440-builder-preview.jpg |
| R184 | Export disabled until saved | TM | 1440 | Export disabled until saved | as expected | PASS | - |
| R185 | report period pills | TM | 1440 | report period pills | as expected | PASS | - |
| R186 | Save creates the report | TM | 1440 | Save creates the report | as expected | PASS | - |
| R187 | edit → unsaved hint → save again (PATCH) | TM | 1440 | edit → unsaved hint → save again (PATCH) | as expected | PASS | - |
| R188 | Export ▾ XLSX from the builder | TM | 1440 | Export ▾ XLSX from the builder | as expected | PASS | - |
| R189 | Back to the report link | TM | 1440 | Back to the report link | as expected | PASS | - |
| R190 | exports page loads with history | TM | 1440 | exports page loads with history | as expected | PASS | team_member-1440-exports.jpg |
| R191 | no sideways scroll (exports) | TM | 1440 | no sideways scroll (exports) | as expected | PASS | - |
| R192 | filter select (reports, data tables, everything) | TM | 1440 | filter select (reports, data tables, everything) | as expected | PASS | - |
| R193 | data tables: empty pick refused | TM | 1440 | data tables: empty pick refused | as expected | PASS | - |
| R194 | data tables: pick, period, format, metadata → ready | TM | 1440 | data tables: pick, period, format, metadata → ready | as expected (polled 1x) | PASS | network log + files/ |
| R195 | history row Download (authorised fetch) | TM | 1440 | history row Download (authorised fetch) | as expected | PASS | network log + files/ |
| R196 | console errors | TM | 1440 | console errors | as expected | PASS | - |
| R197 | login | TM | 375 | login | as expected | PASS | - |
| R198 | sidebar has no Analytics entry | TM | 375 | sidebar has no Analytics entry | as expected | PASS | - |
| R199 | overview loads with cards | TM | 375 | overview loads with cards | as expected | PASS | team_member-375-overview.jpg |
| R200 | Revenue card equals API (777,700 kobo = ₦7,777) | TM | 375 | Revenue card equals API (777,700 kobo = ₦7,777) | as expected | PASS | - |
| R201 | no sideways scroll | TM | 375 | no sideways scroll | as expected | PASS | - |
| R202 | range pill 7 days | TM | 375 | range pill 7 days | as expected | PASS | - |
| R203 | range pill 90 days | TM | 375 | range pill 90 days | as expected | PASS | - |
| R204 | range pill 12 months | TM | 375 | range pill 12 months | as expected | PASS | - |
| R205 | range pill This month | TM | 375 | range pill This month | as expected | PASS | - |
| R206 | range pill Last month | TM | 375 | range pill Last month | as expected | PASS | - |
| R207 | range pill 30 days | TM | 375 | range pill 30 days | as expected | PASS | - |
| R208 | custom range needs both dates, then refetches | TM | 375 | custom range needs both dates, then refetches | as expected | PASS | - |
| R209 | compare select (year, then previous) | TM | 375 | compare select (year, then previous) | as expected | PASS | - |
| R210 | definition tooltip button | TM | 375 | definition tooltip button | as expected | PASS | - |
| R211 | chart "Show as a table" | TM | 375 | chart "Show as a table" | as expected | PASS | - |
| R212 | insight source link goes to hub | TM | 375 | insight source link goes to hub | as expected | PASS | - |
| R213 | card hub link targets hub | TM | 375 | card hub link targets hub | as expected | PASS | - |
| R214 | no link into hidden Funding | TM | 375 | no link into hidden Funding | as expected | PASS | - |
| R215 | by-hub pill Finance | TM | 375 | by-hub pill Finance | as expected | PASS | - |
| R216 | by-hub pill Marketing | TM | 375 | by-hub pill Marketing | as expected | PASS | - |
| R217 | by-hub pill All hubs | TM | 375 | by-hub pill All hubs | as expected | PASS | - |
| R218 | custom metric: add, enter value, delete | TM | 375 | custom metric: add, enter value, delete | as expected | PASS | - |
| R219 | "Edit values" on a custom card jumps to the panel | TM | 375 | "Edit values" on a custom card jumps to the panel | as expected | PASS | - |
| R220 | benchmarks card (Health cohort) | TM | 375 | benchmarks card (Health cohort) | as expected | PASS | - |
| R221 | Export data ▾ CSV → ready → download | TM | 375 | Export data ▾ CSV → ready → download | as expected | PASS | network log + files/ |
| R222 | reports list loads | TM | 375 | reports list loads | as expected | PASS | team_member-375-saved.jpg |
| R223 | no sideways scroll (list) | TM | 375 | no sideways scroll (list) | as expected | PASS | - |
| R224 | search filters | TM | 375 | search filters | as expected | PASS | - |
| R225 | sort select | TM | 375 | sort select | as expected | PASS | - |
| R226 | duplicate a report | TM | 375 | duplicate a report | as expected | PASS | - |
| R227 | delete: cancel, then delete the copy | TM | 375 | delete: cancel, then delete the copy | as expected | PASS | - |
| R228 | no Share button for team member | TM | 375 | no Share button for team member | as expected | PASS | - |
| R229 | report detail loads | TM | 375 | report detail loads | as expected | PASS | team_member-375-report-run.jpg |
| R230 | Run now → frozen run shown | TM | 375 | Run now → frozen run shown | as expected | PASS | team_member-375-report-run.jpg |
| R231 | no sideways scroll (detail) | TM | 375 | no sideways scroll (detail) | as expected | PASS | - |
| R232 | pick an older run in the list | TM | 375 | pick an older run in the list | as expected | PASS | - |
| R233 | Export ▾ PDF → ready → download | TM | 375 | Export ▾ PDF → ready → download | as expected | PASS | network log + files/ |
| R234 | no Share button | TM | 375 | no Share button | as expected | PASS | - |
| R235 | no Edit on the founder's report (can_edit false) | TM | 375 | no Edit on the founder's report (can_edit false) | as expected | PASS | - |
| R236 | builder URL of the founder's report is refused | TM | 375 | builder URL of the founder's report is refused | as expected | PASS | - |
| R237 | builder new: template chips + empty copy | TM | 375 | builder new: template chips + empty copy | as expected | PASS | team_member-375-builder-empty.jpg |
| R238 | save without a name is refused | TM | 375 | save without a name is refused | as expected | PASS | - |
| R239 | template chip fills the canvas | TM | 375 | template chip fills the canvas | as expected | PASS | - |
| R240 | name and description inputs | TM | 375 | name and description inputs | as expected | PASS | - |
| R241 | catalog: search and add a metric | TM | 375 | catalog: search and add a metric | as expected | PASS | - |
| R242 | catalog: add a text note → config opens | TM | 375 | catalog: add a text note → config opens | as expected | PASS | - |
| R243 | block config: title, viz, period, compare | TM | 375 | block config: title, viz, period, compare | as expected | PASS | - |
| R244 | canvas: move up/down, duplicate, remove | TM | 375 | canvas: move up/down, duplicate, remove | as expected | PASS | - |
| R245 | drag and drop reorders | TM | 375 | drag and drop reorders | as expected | PASS | - |
| R246 | Preview shows live numbers | TM | 375 | Preview shows live numbers | as expected | PASS | team_member-375-builder-preview.jpg |
| R247 | close preview | TM | 375 | close preview | as expected | PASS | team_member-375-builder-preview.jpg |
| R248 | Export disabled until saved | TM | 375 | Export disabled until saved | as expected | PASS | - |
| R249 | report period pills | TM | 375 | report period pills | as expected | PASS | - |
| R250 | Save creates the report | TM | 375 | Save creates the report | as expected | PASS | - |
| R251 | edit → unsaved hint → save again (PATCH) | TM | 375 | edit → unsaved hint → save again (PATCH) | as expected | PASS | - |
| R252 | Export ▾ XLSX from the builder | TM | 375 | Export ▾ XLSX from the builder | as expected | PASS | - |
| R253 | Back to the report link | TM | 375 | Back to the report link | as expected | PASS | - |
| R254 | exports page loads with history | TM | 375 | exports page loads with history | as expected | PASS | team_member-375-exports.jpg |
| R255 | no sideways scroll (exports) | TM | 375 | no sideways scroll (exports) | as expected | PASS | - |
| R256 | filter select (reports, data tables, everything) | TM | 375 | filter select (reports, data tables, everything) | as expected | PASS | - |
| R257 | data tables: empty pick refused | TM | 375 | data tables: empty pick refused | as expected | PASS | - |
| R258 | data tables: pick, period, format, metadata → ready | TM | 375 | data tables: pick, period, format, metadata → ready | as expected (polled 1x) | PASS | network log + files/ |
| R259 | history row Download (authorised fetch) | TM | 375 | history row Download (authorised fetch) | as expected | PASS | network log + files/ |
| R260 | console errors | TM | 375 | console errors | as expected | PASS | - |
| R261 | login | AC | 1440 | login | as expected | PASS | - |
| R262 | sidebar has no Analytics entry | AC | 1440 | sidebar has no Analytics entry | as expected | PASS | - |
| R263 | Overview: finance only | AC | 1440 | Overview: finance only | as expected | PASS | accountant-1440-landing.jpg |
| R264 | no sideways scroll (landing) | AC | 1440 | no sideways scroll (landing) | as expected | PASS | accountant-1440-landing.jpg |
| R265 | tabs match role | AC | 1440 | tabs match role | as expected | PASS | - |
| R266 | shared list: read-only, no New report | AC | 1440 | shared list: read-only, no New report | as expected | PASS | accountant-1440-shared-list.jpg |
| R267 | open shared report: frozen run with locks, never numbers | AC | 1440 | open shared report: frozen run with locks, never numbers | as expected | PASS | accountant-1440-shared-report.jpg |
| R268 | no sideways scroll (report) | AC | 1440 | no sideways scroll (report) | as expected | PASS | - |
| R269 | no Run, Edit or Share controls | AC | 1440 | no Run, Edit or Share controls | as expected | PASS | - |
| R270 | Export ▾ warns about locked blocks, PDF of the run → download | AC | 1440 | Export ▾ warns about locked blocks, PDF of the run → download | as expected | PASS | network log + files/ |
| R271 | builder is refused | AC | 1440 | builder is refused | as expected | PASS | - |
| R272 | exports page: own exports + finance-only data tables | AC | 1440 | exports page: own exports + finance-only data tables | as expected | PASS | accountant-1440-exports.jpg |
| R273 | console errors | AC | 1440 | console errors | as expected | PASS | - |
| R274 | login | AC | 375 | login | as expected | PASS | - |
| R275 | sidebar has no Analytics entry | AC | 375 | sidebar has no Analytics entry | as expected | PASS | - |
| R276 | Overview: finance only | AC | 375 | Overview: finance only | as expected | PASS | accountant-375-landing.jpg |
| R277 | no sideways scroll (landing) | AC | 375 | no sideways scroll (landing) | as expected | PASS | accountant-375-landing.jpg |
| R278 | tabs match role | AC | 375 | tabs match role | as expected | PASS | - |
| R279 | shared list: read-only, no New report | AC | 375 | shared list: read-only, no New report | as expected | PASS | accountant-375-shared-list.jpg |
| R280 | open shared report: frozen run with locks, never numbers | AC | 375 | open shared report: frozen run with locks, never numbers | as expected | PASS | accountant-375-shared-report.jpg |
| R281 | no sideways scroll (report) | AC | 375 | no sideways scroll (report) | as expected | PASS | - |
| R282 | no Run, Edit or Share controls | AC | 375 | no Run, Edit or Share controls | as expected | PASS | - |
| R283 | Export ▾ warns about locked blocks, PDF of the run → download | AC | 375 | Export ▾ warns about locked blocks, PDF of the run → download | as expected | PASS | network log + files/ |
| R284 | builder is refused | AC | 375 | builder is refused | as expected | PASS | - |
| R285 | exports page: own exports + finance-only data tables | AC | 375 | exports page: own exports + finance-only data tables | as expected | PASS | accountant-375-exports.jpg |
| R286 | console errors | AC | 375 | console errors | as expected | PASS | - |
| R287 | login | M | 1440 | login | as expected | PASS | - |
| R288 | sidebar has no Analytics entry | M | 1440 | sidebar has no Analytics entry | as expected | PASS | - |
| R289 | Overview: redirects to shared reports | M | 1440 | Overview: redirects to shared reports | as expected | PASS | mentor-1440-landing.jpg |
| R290 | no sideways scroll (landing) | M | 1440 | no sideways scroll (landing) | as expected | PASS | mentor-1440-landing.jpg |
| R291 | tabs match role | M | 1440 | tabs match role | as expected | PASS | - |
| R292 | shared list: read-only, no New report | M | 1440 | shared list: read-only, no New report | as expected | PASS | mentor-1440-shared-list.jpg |
| R293 | open shared report: frozen run with locks, never numbers | M | 1440 | open shared report: frozen run with locks, never numbers | as expected | PASS | mentor-1440-shared-report.jpg |
| R294 | no sideways scroll (report) | M | 1440 | no sideways scroll (report) | as expected | PASS | - |
| R295 | no Run, Edit or Share controls | M | 1440 | no Run, Edit or Share controls | as expected | PASS | - |
| R296 | no Export menu | M | 1440 | no Export menu | as expected | PASS | - |
| R297 | builder is refused | M | 1440 | builder is refused | as expected | PASS | - |
| R298 | exports page refused | M | 1440 | exports page refused | as expected | PASS | mentor-1440-exports.jpg |
| R299 | console errors | M | 1440 | console errors | as expected | PASS | - |
| R300 | login | M | 375 | login | as expected | PASS | - |
| R301 | sidebar has no Analytics entry | M | 375 | sidebar has no Analytics entry | as expected | PASS | - |
| R302 | Overview: redirects to shared reports | M | 375 | Overview: redirects to shared reports | as expected | PASS | mentor-375-landing.jpg |
| R303 | no sideways scroll (landing) | M | 375 | no sideways scroll (landing) | as expected | PASS | mentor-375-landing.jpg |
| R304 | tabs match role | M | 375 | tabs match role | as expected | PASS | - |
| R305 | shared list: read-only, no New report | M | 375 | shared list: read-only, no New report | as expected | PASS | mentor-375-shared-list.jpg |
| R306 | open shared report: frozen run with locks, never numbers | M | 375 | open shared report: frozen run with locks, never numbers | as expected | PASS | mentor-375-shared-report.jpg |
| R307 | no sideways scroll (report) | M | 375 | no sideways scroll (report) | as expected | PASS | - |
| R308 | no Run, Edit or Share controls | M | 375 | no Run, Edit or Share controls | as expected | PASS | - |
| R309 | no Export menu | M | 375 | no Export menu | as expected | PASS | - |
| R310 | builder is refused | M | 375 | builder is refused | as expected | PASS | - |
| R311 | exports page refused | M | 375 | exports page refused | as expected | PASS | mentor-375-exports.jpg |
| R312 | console errors | M | 375 | console errors | as expected | PASS | - |
| R313 | login | BC | 1440 | login | as expected | PASS | - |
| R314 | sidebar has no Analytics entry | BC | 1440 | sidebar has no Analytics entry | as expected | PASS | - |
| R315 | Overview: redirects to shared reports | BC | 1440 | Overview: redirects to shared reports | as expected | PASS | business_consultant-1440-landing.jpg |
| R316 | no sideways scroll (landing) | BC | 1440 | no sideways scroll (landing) | as expected | PASS | business_consultant-1440-landing.jpg |
| R317 | tabs match role | BC | 1440 | tabs match role | as expected | PASS | - |
| R318 | shared list: read-only, no New report | BC | 1440 | shared list: read-only, no New report | as expected | PASS | business_consultant-1440-shared-list.jpg |
| R319 | open shared report: frozen run with locks, never numbers | BC | 1440 | open shared report: frozen run with locks, never numbers | as expected | PASS | business_consultant-1440-shared-report.jpg |
| R320 | no sideways scroll (report) | BC | 1440 | no sideways scroll (report) | as expected | PASS | - |
| R321 | no Run, Edit or Share controls | BC | 1440 | no Run, Edit or Share controls | as expected | PASS | - |
| R322 | no Export menu | BC | 1440 | no Export menu | as expected | PASS | - |
| R323 | builder is refused | BC | 1440 | builder is refused | as expected | PASS | - |
| R324 | exports page refused | BC | 1440 | exports page refused | as expected | PASS | business_consultant-1440-exports.jpg |
| R325 | console errors | BC | 1440 | console errors | as expected | PASS | - |
| R326 | login | BC | 375 | login | as expected | PASS | - |
| R327 | sidebar has no Analytics entry | BC | 375 | sidebar has no Analytics entry | as expected | PASS | - |
| R328 | Overview: redirects to shared reports | BC | 375 | Overview: redirects to shared reports | as expected | PASS | business_consultant-375-landing.jpg |
| R329 | no sideways scroll (landing) | BC | 375 | no sideways scroll (landing) | as expected | PASS | business_consultant-375-landing.jpg |
| R330 | tabs match role | BC | 375 | tabs match role | as expected | PASS | - |
| R331 | shared list: read-only, no New report | BC | 375 | shared list: read-only, no New report | as expected | PASS | business_consultant-375-shared-list.jpg |
| R332 | open shared report: frozen run with locks, never numbers | BC | 375 | open shared report: frozen run with locks, never numbers | as expected | PASS | business_consultant-375-shared-report.jpg |
| R333 | no sideways scroll (report) | BC | 375 | no sideways scroll (report) | as expected | PASS | - |
| R334 | no Run, Edit or Share controls | BC | 375 | no Run, Edit or Share controls | as expected | PASS | - |
| R335 | no Export menu | BC | 375 | no Export menu | as expected | PASS | - |
| R336 | builder is refused | BC | 375 | builder is refused | as expected | PASS | - |
| R337 | exports page refused | BC | 375 | exports page refused | as expected | PASS | business_consultant-375-exports.jpg |
| R338 | console errors | BC | 375 | console errors | as expected | PASS | - |
| R339 | login | INV | 1440 | login | as expected | PASS | - |
| R340 | sidebar has no Analytics entry | INV | 1440 | sidebar has no Analytics entry | as expected | PASS | - |
| R341 | denied / | INV | 1440 | denied / | as expected | PASS | investor-1440-denied.jpg |
| R342 | denied /saved | INV | 1440 | denied /saved | as expected | PASS | investor-1440-denied.jpg |
| R343 | denied /exports | INV | 1440 | denied /exports | as expected | PASS | investor-1440-denied.jpg |
| R344 | denied /builder/new | INV | 1440 | denied /builder/new | as expected | PASS | investor-1440-denied.jpg |
| R345 | zero /analytics requests in the network log | INV | 1440 | zero /analytics requests in the network log | as expected | PASS | network log |
| R346 | console errors | INV | 1440 | console errors | as expected | PASS | - |
| R347 | login | INV | 375 | login | as expected | PASS | - |
| R348 | sidebar has no Analytics entry | INV | 375 | sidebar has no Analytics entry | as expected | PASS | - |
| R349 | denied / | INV | 375 | denied / | as expected | PASS | investor-375-denied.jpg |
| R350 | denied /saved | INV | 375 | denied /saved | as expected | PASS | investor-375-denied.jpg |
| R351 | denied /exports | INV | 375 | denied /exports | as expected | PASS | investor-375-denied.jpg |
| R352 | denied /builder/new | INV | 375 | denied /builder/new | as expected | PASS | investor-375-denied.jpg |
| R353 | zero /analytics requests in the network log | INV | 375 | zero /analytics requests in the network log | as expected | PASS | network log |
| R354 | console errors | INV | 375 | console errors | as expected | PASS | - |
| R355 | login | LA | 1440 | login | as expected | PASS | - |
| R356 | sidebar has no Analytics entry | LA | 1440 | sidebar has no Analytics entry | as expected | PASS | - |
| R357 | denied / | LA | 1440 | denied / | as expected | PASS | legal_advisor-1440-denied.jpg |
| R358 | denied /saved | LA | 1440 | denied /saved | as expected | PASS | legal_advisor-1440-denied.jpg |
| R359 | denied /exports | LA | 1440 | denied /exports | as expected | PASS | legal_advisor-1440-denied.jpg |
| R360 | denied /builder/new | LA | 1440 | denied /builder/new | as expected | PASS | legal_advisor-1440-denied.jpg |
| R361 | zero /analytics requests in the network log | LA | 1440 | zero /analytics requests in the network log | as expected | PASS | network log |
| R362 | console errors | LA | 1440 | console errors | as expected | PASS | - |
| R363 | login | LA | 375 | login | as expected | PASS | - |
| R364 | sidebar has no Analytics entry | LA | 375 | sidebar has no Analytics entry | as expected | PASS | - |
| R365 | denied / | LA | 375 | denied / | as expected | PASS | legal_advisor-375-denied.jpg |
| R366 | denied /saved | LA | 375 | denied /saved | as expected | PASS | legal_advisor-375-denied.jpg |
| R367 | denied /exports | LA | 375 | denied /exports | as expected | PASS | legal_advisor-375-denied.jpg |
| R368 | denied /builder/new | LA | 375 | denied /builder/new | as expected | PASS | legal_advisor-375-denied.jpg |
| R369 | zero /analytics requests in the network log | LA | 375 | zero /analytics requests in the network log | as expected | PASS | network log |
| R370 | console errors | LA | 375 | console errors | as expected | PASS | - |
| R371 | 409: stale save shows "Someone else changed this report", no silent retry, Reload loads the new version | F | 1440 | 409: stale save shows "Someone else changed this report", no silent retry, Reload loads the new version | as expected | PASS | founder-1440-builder-409.jpg |
| R372 | locked-block save refusal (stubbed GET): Save disabled, message shown, no PATCH | F | 1440 | locked-block save refusal (stubbed GET): Save disabled, message shown, no PATCH | as expected | PASS | founder-1440-builder-locked-save.jpg |
| R373 | 429: heavy-read limit shows the API message with Retry; Retry recovers | F | 1440 | 429: heavy-read limit shows the API message with Retry; Retry recovers | as expected | PASS | founder-1440-overview-429.jpg |
| R374 | 409: stale save shows "Someone else changed this report", no silent retry, Reload loads the new version | F | 375 | 409: stale save shows "Someone else changed this report", no silent retry, Reload loads the new version | as expected | PASS | founder-375-builder-409.jpg |
| R375 | locked-block save refusal (stubbed GET): Save disabled, message shown, no PATCH | F | 375 | locked-block save refusal (stubbed GET): Save disabled, message shown, no PATCH | as expected | PASS | founder-375-builder-locked-save.jpg |
| R376 | 429: heavy-read limit shows the API message with Retry; Retry recovers | F | 375 | 429: heavy-read limit shows the API message with Retry; Retry recovers | as expected | PASS | founder-375-overview-429.jpg |
| R377 | accountant: Export ▾ XLSX of the selected run → download (contents: files.py) | AC | 1440 | accountant: Export ▾ XLSX of the selected run → download (contents: files.py) | as expected | PASS | accountant-1440-files/ |
| R378 | accountant: Export ▾ XLSX of the selected run → download (contents: files.py) | AC | 375 | accountant: Export ▾ XLSX of the selected run → download (contents: files.py) | as expected | PASS | accountant-375-files/ |
| R379 | file contents: 1-Board pack 2026-10-20 to 2026-11-18.pdf | AC | 1440 | no 4321 (Marketing), "Locked" text, Revenue 7,777 | 4321:no · Locked:yes · 7,777:yes · as of:yes · 2437 B | PASS | files-results.json |
| R380 | file contents: x-Board pack 2026-10-20 to 2026-11-18.xlsx | AC | 1440 | no 4321 (Marketing), "Locked" text, Revenue 7,777 | 4321:no · Locked:yes · 7,777:yes · as of:yes · 4198 B | PASS | files-results.json |
| R381 | file contents: 1-Board pack 2026-10-20 to 2026-11-18.pdf | AC | 375 | no 4321 (Marketing), "Locked" text, Revenue 7,777 | 4321:no · Locked:yes · 7,777:yes · as of:yes · 2437 B | PASS | files-results.json |
| R382 | file contents: x-Board pack 2026-10-20 to 2026-11-18.xlsx | AC | 375 | no 4321 (Marketing), "Locked" text, Revenue 7,777 | 4321:no · Locked:yes · 7,777:yes · as of:yes · 4198 B | PASS | files-results.json |
| R383 | file contents: 1-Data tables 2026-10-20 to 2026-11-18.csv | F | 1440 | file parses, has "as of" stamp | 4321:no · Locked:yes · 7,777:yes · as of:yes · 768 B | PASS | files-results.json |
| R384 | file contents: 2-Board pack 2026-10-20 to 2026-11-18.pdf | F | 1440 | file parses, has "as of" stamp | 4321:yes · Locked:no · 7,777:yes · as of:yes · 2347 B | PASS | files-results.json |
| R385 | file contents: 3-Walk report founder 1440 2026-08-21 to 2026-11-18.xlsx | F | 1440 | file parses, has "as of" stamp | 4321:yes · Locked:yes · 7,777:yes · as of:yes · 4830 B | PASS | files-results.json |
| R386 | file contents: 1-Data tables 2026-10-20 to 2026-11-18.csv | F | 375 | file parses, has "as of" stamp | 4321:no · Locked:yes · 7,777:yes · as of:yes · 768 B | PASS | files-results.json |
| R387 | file contents: 2-Board pack 2026-10-20 to 2026-11-18.pdf | F | 375 | file parses, has "as of" stamp | 4321:yes · Locked:no · 7,777:yes · as of:yes · 2347 B | PASS | files-results.json |
| R388 | file contents: 3-Walk report founder 375 2026-08-21 to 2026-11-18.xlsx | F | 375 | file parses, has "as of" stamp | 4321:yes · Locked:yes · 7,777:yes · as of:yes · 4791 B | PASS | files-results.json |
| R389 | file contents: 1-Data tables 2026-10-20 to 2026-11-18.csv | TM | 1440 | file parses, has "as of" stamp | 4321:no · Locked:yes · 7,777:yes · as of:yes · 763 B | PASS | files-results.json |
| R390 | file contents: 2-Board pack 2026-10-20 to 2026-11-18.pdf | TM | 1440 | file parses, has "as of" stamp | 4321:yes · Locked:no · 7,777:yes · as of:yes · 2340 B | PASS | files-results.json |
| R391 | file contents: 3-Walk report team_member 1440 2026-08-21 to 2026-11-18.xlsx | TM | 1440 | file parses, has "as of" stamp | 4321:yes · Locked:yes · 7,777:yes · as of:yes · 4829 B | PASS | files-results.json |
| R392 | file contents: 1-Data tables 2026-10-20 to 2026-11-18.csv | TM | 375 | file parses, has "as of" stamp | 4321:no · Locked:yes · 7,777:yes · as of:yes · 763 B | PASS | files-results.json |
| R393 | file contents: 2-Board pack 2026-10-20 to 2026-11-18.pdf | TM | 375 | file parses, has "as of" stamp | 4321:yes · Locked:no · 7,777:yes · as of:yes · 2340 B | PASS | files-results.json |
| R394 | file contents: 3-Walk report team_member 375 2026-08-21 to 2026-11-18.xlsx | TM | 375 | file parses, has "as of" stamp | 4321:yes · Locked:yes · 7,777:yes · as of:yes · 4790 B | PASS | files-results.json |
| R395 | API boundary: GET /analytics/overview | INV | api | 403 | 403 {"error":{"code":"FORBIDDEN","message":"You don't have permission to d | PASS | probe-results.json |
| R396 | API boundary: GET /analytics/overview | LA | api | 403 | 403 {"error":{"code":"FORBIDDEN","message":"You don't have permission to d | PASS | probe-results.json |
| R397 | API boundary: GET /analytics/reports | INV | api | 403 | 403 {"error":{"code":"FORBIDDEN","message":"You don't have permission to d | PASS | probe-results.json |
| R398 | API boundary: GET /analytics/reports/76d2502c-84e4-4f6d-96c6-7b92da664a35 | LA | api | 403 | 403 {"error":{"code":"FORBIDDEN","message":"You don't have permission to d | PASS | probe-results.json |
| R399 | API boundary: GET /analytics/exports | LA | api | 403 | 403 {"error":{"code":"FORBIDDEN","message":"You don't have permission to d | PASS | probe-results.json |
| R400 | API boundary: GET /analytics/overview | M | api | 403 | 403 {"error":{"code":"FORBIDDEN","message":"You don't have permission to d | PASS | probe-results.json |
| R401 | API boundary: GET /analytics/overview | BC | api | 403 | 403 {"error":{"code":"FORBIDDEN","message":"You don't have permission to d | PASS | probe-results.json |
| R402 | API boundary: GET /analytics/reports/0a9479b5-31e2-4eda-a729-10c21d0d691e | M | api | 404 | 404 {"error":{"code":"NOT_FOUND","message":"Report not found.","field_erro | PASS | probe-results.json |
| R403 | API boundary: GET /analytics/reports/0a9479b5-31e2-4eda-a729-10c21d0d691e | AC | api | 404 | 404 {"error":{"code":"NOT_FOUND","message":"Report not found.","field_erro | PASS | probe-results.json |
| R404 | API boundary: GET /analytics/reports/0a9479b5-31e2-4eda-a729-10c21d0d691e | TM | api | 404 | 404 {"error":{"code":"NOT_FOUND","message":"Report not found.","field_erro | PASS | probe-results.json |
| R405 | API boundary: POST /analytics/reports/76d2502c-84e4-4f6d-96c6-7b92da664a35/run | M | api | 403 | 403 {"error":{"code":"FORBIDDEN","message":"You don't have permission to d | PASS | probe-results.json |
| R406 | API boundary: POST /analytics/reports/76d2502c-84e4-4f6d-96c6-7b92da664a35/export | M | api | 403 | 403 {"error":{"code":"FORBIDDEN","message":"You don't have permission to d | PASS | probe-results.json |
| R407 | API boundary: GET /analytics/exports | BC | api | 403 | 403 {"error":{"code":"FORBIDDEN","message":"You don't have permission to d | PASS | probe-results.json |
| R408 | API boundary: POST /analytics/reports/76d2502c-84e4-4f6d-96c6-7b92da664a35/export | AC | api | recorded | 403 {"error":{"code":"FORBIDDEN","message":"Only the founder or a team mem | PASS | probe-results.json |
| R409 | API boundary: POST /analytics/exports/data-tables | AC | api | 422 | 422 {"error":{"code":"VALIDATION_ERROR","message":"One or more metrics are | PASS | probe-results.json |
| R410 | API boundary: GET /analytics/exports/d73cf137-c990-41e7-a0be-02e1a40cce2a | AC | api | 404 | 404 {"error":{"code":"NOT_FOUND","message":"Export not found.","field_erro | PASS | probe-results.json |
| R411 | API boundary: GET /analytics/exports/d73cf137-c990-41e7-a0be-02e1a40cce2a | TM | api | 404 | 404 {"error":{"code":"NOT_FOUND","message":"Export not found.","field_erro | PASS | probe-results.json |
| R412 | API boundary: GET /analytics/exports/d73cf137-c990-41e7-a0be-02e1a40cce2a/download | AC | api | 404 | 404 {"error":{"code":"NOT_FOUND","message":"Export not found.","field_erro | PASS | probe-results.json |
| R413 | API boundary: PATCH /analytics/reports/76d2502c-84e4-4f6d-96c6-7b92da664a35 | TM | api | 403 | 403 {"error":{"code":"FORBIDDEN","message":"You don't have permission to d | PASS | probe-results.json |
| R414 | API boundary: GET /analytics/reports/76d2502c-84e4-4f6d-96c6-7b92da664a35/shares | TM | api | 403 | 403 {"error":{"code":"FORBIDDEN","message":"You don't have permission to d | PASS | probe-results.json |
| R415 | API boundary: DELETE /analytics/reports/76d2502c-84e4-4f6d-96c6-7b92da664a35 | TM | api | 403 | 403 {"error":{"code":"FORBIDDEN","message":"You don't have permission to d | PASS | probe-results.json |
| R416 | API boundary: GET /analytics/reports/e5a3a2a5-54f9-44af-bd17-bc40eb45f431 | F | api | 200 | 200 {"data":{"id":"e5a3a2a5-54f9-44af-bd17-bc40eb45f431","name":"TM own re | PASS | probe-results.json |
| R417 | API boundary: GET /analytics/by-hub?hub=marketing | AC | api | 403 | 403 {"error":{"code":"FORBIDDEN","message":"You don't have permission to d | PASS | probe-results.json |
| R418 | API boundary: GET /analytics/custom-metrics | AC | api | recorded | 403 {"error":{"code":"FORBIDDEN","message":"You don't have permission to d | PASS | probe-results.json |
| R419 | API boundary: GET report blocks | M | api | recorded | {"locked": ["finance", "finance"]} | PASS | probe-results.json |
| R420 | API boundary: GET runs (frozen run payload) | M | api | recorded | {"has_7777": false} | PASS | probe-results.json |
