# SOP: Analytics & Reports FE pass, wave 1 (Module 22, slices A-C)

**What shipped.** `app/(dashboard)/analytics-reports/**` moved from one 714-line mock (invented fintech numbers, tab toasts,
fake timers, JSON export) to the real API: Overview, report builder, saved reports with frozen runs and shares, Export ▾
PDF/XLSX, Export history and Data tables. PR: `feature/analytics-fe` to `develop` (see the PR for the number).
Commits: `c99dbce` client + helpers, `88358c2` overview + layout, `1888957` builder / reports / exports, `41803e1`,
`a6a6027`, `f583293` walk fixes and notification links, then the walk evidence and docs.

**Why.** API slices A (#238, 0105), B (#246, 0108) and C (#249, 0109) are merged on develop; D-ANA-1 wave 1 = Overview + builder +
saved reports + exports. Gap rows: `docs/checklist/analytics-reports-prd-gaps.md` (ticked ✅ FE / ◐ FE). Contract: the three
live-captured guides in `cofoundaz-api/docs/fe-integration-guide-analytics{,-reports,-exports}.md`.

## How

| Piece | File | Notes |
|---|---|---|
| API client | `lib/api/analytics.ts` | Types copied from the guides' captured bodies. `toAnalyticsError` keeps `code` (`VERSION_CONFLICT`, `EXPORT_EXPIRED`, `EXPORT_NOT_READY`, `RATE_LIMITED`) and swaps the generic "Please check the highlighted fields." for the field's own message. `blocksForApi` flattens a block's range and drops server fields and locked blocks. `downloadExport` = bearer fetch via `accessTokenForRequest()` → Blob, filename from `filename*` first. No token in localStorage. |
| Display rules | `lib/analytics-format.ts` | kobo → naira through the Finance formatter; `null` is never 0; `metricState` maps every status (`ok`, `no_data`, `not_burning`, `out_of_cash`, `locked`, `unknown`, `error`); a locked metric is never read for a value. Delta colour from `good` (burn down = good), `delta_pct: null` → absolute delta, zero → "No change". `linkableHubPath` never links into hidden modules (Funding, Investor Readiness, Marketplace) or off-site. `analyticsNotificationHref` deep-links the three notification kinds, UUID-checked. |
| Data hooks | `hooks/useAnalyticsResource.ts`, `hooks/useExportWatch.ts` | loading / ready / error / forbidden / **not_found** (a report you cannot see is a 404). One request per mount, also under StrictMode (the heavy reads share a 40-a-minute workspace limit). Export polling: 2 s, then 5 s, stop at 2 min with "Still working. Check Export history". |
| Notifications | `hooks/useNotifications.ts` | `analytics.report.shared` / `.report.generated` → the report; `analytics.export.created` → Export history with the row highlighted. |
| Layout + roles | `analytics-reports/layout.tsx`, `_components/access.ts`, `lib/nav-access.ts` | Tabs Overview / Reports / Exports, filtered by role. **Accountant added** to `/analytics-reports` (finance only, D-ANA-4). Investor and legal advisor get the RouteGuard denial page. Sidebar entry stays hidden (`components/sidebar.tsx` untouched). |
| Overview | `analytics-reports/page.tsx` | Range pills + custom dates (fetch only once both are set) + compare. Cards (value, delta, sparkline, "as of", source, definition tooltip), Revenue/Expenses chart with a real table alternative, rule notes ("not AI") with source links, By hub pills (only the hubs `overview.hubs` lists), "Entered by you" panel (add / enter monthly value / delete), Health cohort benchmark card. "Export data ▾" = data tables of the visible cards. Mentor and business consultant are sent to `/saved`. |
| Builder | `builder/[id]/page.tsx` (`new` = unsaved) | Catalog (search, grouped by hub, locked hubs say "{Hub} access needed"), canvas (≤30 blocks; drag, ↑/↓, duplicate, remove; moves announced in an `aria-live` region), block settings (metric, title, Number/Line/Bar, own period or the report's, compare). Header: inline name/description, report period, Preview (stateless), Save (POST, then PATCH with `version`; **409 → "Someone else changed this report. Reload it and apply your change again." + Reload**, never silently retried), Export ▾ (disabled until saved). Empty canvas: three template chips (not AI). Below `lg` the panes become 3 steps. |
| Saved | `saved/page.tsx`, `saved/[id]/page.tsx`, `_components/share-dialog.tsx`, `_components/run-view.tsx` | List with search + sort, last-run time or failure chip, phone cards / desktop table. Actions by `can_edit` / `can_share`. Detail: runs list, Run now (polls the run row, not the job), frozen snapshot, Export ▾. Share drawer (founder): members with "Will see locked blocks: …". Readers see "Reports shared with you". Accountant exports a finished run with `run_id` after the warning "Blocks outside your hubs (…) will be locked in the file." |
| Exports | `exports/page.tsx` | Data tables (catalog metrics, period, CSV/XLSX, metadata header) and history (filter, status chip, polling, size, expiry). Ready → Download; failed/expired → "Expired. Generate it again." + Generate again (re-export the report, or re-ask the same metrics and days); accountant gets "Open the report" instead. `?highlight=` scrolls to the row (notification target). |

**Decisions and tradeoffs.**
- Overview "Export" is data tables, not a PDF: the API has no Overview-as-report route, and creating a hidden saved report
  to fake one would litter Reports. Listed as a gap.
- Funding metrics still show in By hub (the API returns them), but no link goes to the hidden Funding pages.
- Shared UI comes from Legal's `_components/ui` (buttons, drawer, dialogs, states) so the app renders states one way.
- Chart: navy solid + amber dashed, so two series read apart without relying on hue.

## Verification
- Fast checks: `npm run typecheck`, `npm run lint` on the touched files, `npx vitest run` on the touched tests
  (`lib/analytics-format.test.ts`, `lib/api/analytics.test.ts`, `analytics-reports/_components/access.test.ts`,
  `lib/nav-access.test.ts`, `hooks/useNotifications.test.tsx`). Full suite, e2e and build left to CI.
- Render/flow tests fed with the guides' **captured bodies** (`analytics-reports/__fixtures__/captures.ts`,
  `analytics-reports/analytics-flows.test.tsx`): locked blocks render the "… access needed" tile and no number
  (`accountant_run`, `get_mentor` + `founder_run_as_mentor`); 409 `VERSION_CONFLICT` banner, no silent retry; a draft with
  locked blocks can't be saved; 410 `EXPORT_EXPIRED` turns the row into "Expired. Generate it again."; Load more uses `offset`;
  `useExportWatch` stops on ready / failed / expired, at 2 minutes (and never restarts that id), and on unmount mid-request;
  investor and legal advisor get the denial page with zero Analytics requests.
- Live walk: `docs/checklist/analytics-fe-walk.md` with screenshots in `docs/checklist/analytics-fe-walk-evidence/`,
  against a scratch API stack at develop `4d5d60d6` (0109), for founder, team member, accountant, mentor, business
  consultant and investor at 1440 and 375: **334/334 checks**, plus the 409 conflict and 429 rate-limit states by hand at both
  widths. Seven defects the walk found were fixed before the final pass (listed at the end of the walk doc).

## Operate / roll back
No env, no migration. Revert the PR to get the mock back. The sidebar stays hidden; Adebayo unhides it after the lead's re-walk.

## Review fixes (lead's Opus review of `075ac09`)
M1 render tests above. L1 polling stops on unmount even with a request in flight (`useExportWatch`, run polling on the report
page). L2 exports that hit the 2-minute cap stay stopped across list reloads. L3 a 410/409 on download reloads the row.
L4 Export history pages with "Load more" (`offset`, 50 a page). L5 the builder refuses to save while locked blocks are present
(they carry no metric, so saving would delete them) and says why.

## Re-walk on merged develop (2026-11-18, `fix/analytics-rewalk`)
Lead's every-control re-walk of FE `c4cde6e` against a scratch API at `3f3e8f12` (0109), seven roles (adds legal advisor)
x 1440/375: **420/420 automated rows** (370 browser, 8 hand-set, 16 file contents, 26 API probes). Record:
`docs/checklist/analytics-rewalk.md`. Shipped with it:

| Fix | File | Why |
|---|---|---|
| Same-unit series share one y-axis (`axisIds`) | `analytics-reports/_components/series-chart.tsx` | Revenue ₦7,777 and Expenses ₦1,234 drew at the same height on two independent axes, which misreads as "spending what I earn". A second axis is used only for a different unit. |
| Tick labels keep one decimal below ten of a unit (`compactTick`) | same | 1,050 and 1,400 both read "₦1k". |

Tests: `_components/series-chart.test.ts`. Verified live after the fix (`analytics-rewalk-evidence/founder-*-overview-chart-after-fix.jpg`).
Rollback: revert the commit; the chart returns to one axis per series.

Open from the re-walk: **D1 (API, High)** PDF exports print "?" for "₦" (ReportLab built-in Helvetica has no U+20A6;
`render.py`); D4 (API) unnamed member shown as "Member" not "A team member"; D5 `?highlight=` only searches page 1.

## Follow-ups (gaps)
1. **API:** an Overview PDF export (`POST /analytics/overview/export` or a template-backed run that is not listed in Reports).
2. **API:** report objects do not carry `locked_hubs` for the viewer (the exports guide says they do); the FE derives the
   accountant's warning from locked blocks instead, which is equivalent.
3. FE: the unsaved-changes guard covers reload and tab close, not in-app link clicks (App Router has no route-change event).
4. Waves 2-3 (schedules, investor updates, board decks) and G (AI insight wording, per-metric benchmarks, "Add to a report",
   sidebar unhide) are deferred; nothing renders for them.
5. Rate limit: the 40-a-minute heavy-read limit can be met by a person flicking range pills quickly (2 reads per change);
   the FE shows the API's "Too many report requests. Try again in a minute." with Retry.
