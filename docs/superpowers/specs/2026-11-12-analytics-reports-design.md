# Analytics & Reports: design

Date: 2026-11-12. Status: **design pass only. D-ANA-1..9 are PROPOSED and unanswered; nothing is built until Adebayo answers.** Every
recommendation below is the proposed answer (questions, options and costs in `docs/checklist/analytics-reports-prd-gaps.md`).
PRD Module 22 (`Cofoundaz_Technical_PRD.md:715-731`), access row `analytics | ✓ | ▢ | R(shared) | — | — | R(fin) | R(shared)` (`:904`),
events (`:912`), `report_exported` (`:933`), Growth plan (`:227`), cross-refs §10.8 (`:495`), §11.6, §14.6.
Mock: `app/(dashboard)/analytics-reports/page.tsx` (714 lines, local state only). Hidden from the sidebar. **The API has no Analytics code.**
(`app/api/v1/endpoints/reports.py` is Admin's "Reported issues"; every new name is prefixed `analytics`.)

## 1. What this is, in the founder's terms

"Show me how the business is doing, let me make a report of it, send it to my investors, and put it in a board deck." Six surfaces:

| Surface | Route (FE) | The founder's question | Built from |
|---|---|---|---|
| Overview + By hub | `/analytics-reports` | "How are we doing, in numbers I can trust?" | Live reads of every hub through one metric catalog; no new tables beyond snapshots |
| Report builder | `/analytics-reports/builder/[id]` | "Let me assemble the numbers I care about" | New: report definitions made of blocks over the catalog |
| Saved reports | `/analytics-reports/saved` | "Where are my reports, who has them, when do they run?" | New: reports, shares, schedules |
| Investor updates | `/analytics-reports/investor-updates` | "Write my monthly update with real numbers" | New: updates + recipients; Funding Hub investors; AI prose over code numbers |
| Board decks | `/analytics-reports/board-decks` | "Make me a deck for the board" | New: deck jobs; reportlab slides; Documents |
| Export history | `/analytics-reports/exports` | "Where's that PDF I made last week?" | New: export rows with a 30-day expiry |

## 2. What already exists, and what we reuse (do not duplicate)

| Need | Existing piece | How Analytics uses it |
|---|---|---|
| Finance numbers | `services/finance/runway.py::runway_payload`, `cashflow.py::cash_flow_summary`, `expenses` summary, budgets | Catalog resolvers for revenue, expenses, net burn, runway, cash, invoices, budget variance |
| Sales numbers | `services/sales/analytics.py` (`funnel`, `won_and_cycle`, `win_loss`, `leaderboard`, `monthly_revenue`, `analytics`) | Resolvers for pipeline, win rate, cycle, closed revenue |
| Marketing numbers | `services/marketing/analytics.py` (`get_analytics`, `_cac_by_channel`, `campaign_performance`, `channel_stats`, `export_csv`) | Resolvers for reach, clicks, conversions, CTR, CAC by channel |
| Validation, Mission, Roadmap, Health, Readiness, Funding | validation survey analytics; mission history; roadmap milestones; `health_score` service; `readiness` score; `funding/overview.py` | One resolver per metric, same pattern |
| Headline KPIs + history | `services/dashboard/kpis.py`, `kpi_snapshots` table (metric String(40), daily, unique per metric/day), `scheduled.kpi.snapshot` | Snapshot the whole catalog into the same table; trends and comparison periods read it |
| Benchmarks | `health_score/service.py::get_benchmarks` (same stage + industry, min cohort, bucketed, own rank only) | Benchmarks view (D-ANA-8) |
| XLSX | `services/finance/xlsx.py` (dependency-free, text never a formula) | Report/table XLSX |
| PDF | `reportlab`, `pypdf`; `finance/invoice_pdf.py`, `documents/export.py` | Report PDF and deck pages |
| Files | `platform/storage.py` (`Storage` protocol, Local / Cloudinary), `platform/signed_urls.py` | Export files, authorised download |
| Email | `platform/email.py` (`EmailSender`, Console / SMTP / Resend / File) | Investor update send; schedule link email |
| Jobs and schedule | `platform/jobs.py` `job_dispatcher`, `worker/scheduler.py` + `ScheduledRun` | Run / deck / send jobs; schedule tick, snapshot, purge |
| Notifications and events | `notifications/registry.py` (kinds + audience), `platform/events.py` | New kinds and events |
| Documents | `services/documents/*` (folders, files, scan) | Deck and update PDFs stored in Documents |
| AI | `platform/llm.py`, `llm_budget.py` (100k/day), agent entries | "Report Narrator", insight card |
| Plan gate | `billing/catalog.py` (`analytics` in `GROWTH_MODULES`), `PLAN_ENFORCEMENT` | Module guard |

New dependencies: **none** (PDF/XLSX/email/storage all exist). PPTX would be a dependency-free writer later (D-ANA-5).

## 3. Roles (per-metric authorisation, the one rule)

Guard: `require_module("analytics")` + role set `{founder, team_member(grant), mentor, business_consultant, accountant}`; every other role 403/404.
**Every metric belongs to a hub module; a viewer receives a metric only if their role could open that hub** (the numbers are never sent, a
locked block carries only `{locked: true, needs: "finance"}`).

| Role | Overview / catalog | Reports | Investor updates | Decks | Exports |
|---|---|---|---|---|---|
| Founder | all metrics | create, edit, share, schedule, run | compose, **send** | generate | own + all |
| Team member | metrics of hubs they hold a grant for; needs the Analytics grant | create, edit own; finance/funding blocks locked without those grants | **draft only**, cannot send | generate (locked blocks omitted) | own |
| Mentor, Business consultant | none (no Overview) | **read reports shared with them**, non-financial metrics only (M/BC never see Finance or Funding numbers) | none | none | none |
| Accountant | finance metrics only (Overview shows the finance cards) | read reports shared with them, finance blocks only | none | none | own |
| Investor, legal advisor, admins | 403 | 403 | 403 | 403 | 403 |

A report's owner losing a grant makes the locked blocks locked for **their** runs too; a schedule whose owner lost Analytics access is paused.
Investors outside the workspace receive investor updates only (an email the Founder sent), never an account or a link to live data.

## 4. Data model sketch

```
kpi_snapshots           (existing) startup_id, metric(String 40), period(date), value(numeric 20,4)   -- widen metric to 64 if a key is longer

analytics_reports       id, startup_id, name, description, blocks_json(version, blocks[]), default_range_json, owner_id, template_key?,
                        version(int, optimistic lock), deleted_at?, created_at, updated_at
analytics_report_shares id, report_id, user_id, created_by, created_at                          -- Founder-granted read for M, BC, AC, TM
analytics_report_runs   id, report_id?, startup_id, period_from, period_to, tz, status(pending|ready|failed), snapshot_json,
                        access_json(metric keys the requester could see), triggered_by(manual|schedule|preview_export), run_by, as_of,
                        error?, created_at                                                       -- kept 90 days; preview is NOT stored
analytics_report_schedules id, report_id, frequency(weekly|monthly), weekday?, month_day?, hour, tz, format(pdf|xlsx),
                        recipient_user_ids[], enabled, next_run_at, last_run_at?, fail_count, created_by
analytics_exports       id, startup_id, run_id?, artifact_type(report|data_tables|investor_update|board_deck), format(pdf|xlsx|csv|pptx),
                        file_key, size_bytes, created_by, expires_at(+30d), purged_at?, document_id?, download_count

custom_metrics          id, startup_id, key, label, unit(count|money|percent), currency?, created_by          -- D-ANA-2 (b)
custom_metric_points    id, metric_id, period(month date), value, entered_by, entered_at     -- unique (metric_id, period)

investor_updates        id, startup_id, period(date), status(draft|sent), subject, sections_json(highlights, lowlights, metrics, asks, thanks),
                        metrics_json(selected keys + frozen values at send), created_by, sent_by?, sent_at?, narrative_run_id?
investor_update_recipients id, update_id, investor_id?, email, name, status(queued|sent|bounced|skipped_unsubscribed),
                        token_hash, sent_at?, first_opened_at?, open_count, unsubscribed_at?
investor_optouts        id, startup_id, email_hash, created_at                                  -- survives the update; checked at send
board_decks             id, startup_id, template(business_review|financials|product|asks), period_from, period_to, slides_json,
                        run_id, export_id?, document_id?, status(pending|ready|failed), created_by
```

Also **`investors.email`** (nullable, validated) in Funding (gap 30), and a Funding card chip "opted out of updates" (gap 37).
Migrations: one per slice, reversible, one head, round trip on a scratch DB.

## 5. Metric catalog (code registry, `GET /analytics/metrics-catalog`)

Each entry: `key, label, unit, hub, module, grain(day|month|point), group_by[], compare(bool), source_note, definition`. Resolver signature
`resolve(db, startup, key, from, to, group_by?, compare?) -> {value, series[], groups[], compare{value, delta}, as_of, status(ok|no_data|locked)}`.

| Hub (module) | Metrics (v1) | Source |
|---|---|---|
| Finance (`finance`) | revenue, expenses, net burn, runway months, cash balance, invoices outstanding, invoices overdue, budget variance | runway_payload, cash_flow_summary, expenses summary, budgets |
| Sales (`sales`) | pipeline value, deals won, win rate, avg cycle days, closed revenue (monthly) | sales analytics service |
| Marketing (`marketing`) | reach, clicks, conversions, CTR, conversion rate, CAC (overall, by channel) | marketing analytics service |
| Validation (`validation`) | assumptions validated %, interviews done, survey responses, smoke-test visits and signups | validation services |
| Health (`health`) | Health Score (total, by dimension) | health_score service |
| Mission and Roadmap | tasks done (week), mission streak, milestones done %, milestones overdue | mission, roadmap |
| Funding (`funding`, F + grant) | round committed vs target, investors by stage, data room views | funding overview |
| Readiness | readiness score | readiness |
| Custom (`analytics`) | any founder-entered metric (users, MRR, churn), labelled "Entered by you" | `custom_metrics` |

Unavailable data returns `no_data`, never 0.

## 6. Endpoints (the PRD list, made concrete)

All under `/api/v1/analytics`, JSON envelope, guarded as section 3. Downloads return the file, not the envelope.

| Area | Endpoints |
|---|---|
| Catalog and live | `GET /metrics-catalog`, `GET /overview?from=&to=&compare=`, `GET /by-hub?hub=`, `GET /metrics/resolve` (batch of metric specs), `GET /insights` (rule notes, cached) |
| Custom metrics | `GET/POST /custom-metrics`, `PUT /custom-metrics/{id}/points`, `DELETE /custom-metrics/{id}` |
| Reports | `GET/POST /reports`, `GET/PATCH/DELETE /reports/{id}` (409 on stale `version`), `POST /reports/{id}/duplicate`, `POST /reports/preview` (stateless), `POST /reports/{id}/run` (job), `GET /reports/{id}/runs`, `GET/PUT /reports/{id}/shares`, `GET /reports/templates` |
| Exports | `POST /reports/{id}/export` (`{format: pdf|xlsx}` → run + export job), `POST /exports/data-tables`, `GET /exports`, `GET /exports/{id}`, `GET /exports/{id}/download` (410 when expired) |
| Schedules | `GET /reports/{id}/schedule`, `PUT /reports/{id}/schedule`, `DELETE /reports/{id}/schedule`, `GET /schedules` |
| Investor updates | `GET/POST /investor-updates`, `GET/PATCH /investor-updates/{id}`, `POST /investor-updates/{id}/narrative` (job), `POST /investor-updates/{id}/preview`, `POST /investor-updates/{id}/send` (founder only), `GET /investor-updates/{id}/recipients`, public `GET /u/{token}/pixel.gif`, public `GET/POST /u/{token}/unsubscribe` |
| Board decks | `GET /board-decks/templates`, `POST /board-decks/generate` (job), `GET /board-decks`, `GET /board-decks/{id}` |
| Benchmarks | `GET /benchmarks` (wraps the Health benchmark service) |

Events: `analytics.report.generated`, `analytics.export.created`, `analytics.investor_update.sent`. Notifications (PRD copy): "Scheduled
report generated: {name}" CTA "Download" · "Your investor update is ready to send" CTA "Review & send". Audience: scheduled report →
recipients; update ready → Founder; export ready → the requester.

## 7. Per-surface behaviour

**Overview + By hub.** Range pills (7d / 30d / 90d / 12m / custom) drive every number. Four headline cards: revenue, net burn, runway, and
pipeline or the first custom metric; each shows value, delta vs previous period, sparkline from `kpi_snapshots`, and "No data yet" with a link
to the hub when empty. Chart: revenue against a chosen second metric with a keyboard-reachable data table alternative. Insight card: rule
notes ("Burn up 3% while revenue grew 18%") computed in code, optional AI wording (D-ANA-9). By hub: cards only for hubs the viewer may
see, three tiles each, "Open" goes to the hub, "Add to a report" once slice B ships. Benchmarks section: the Health cohort view, or "Not
enough peers yet". "Export report" creates a real run + PDF.

**Builder.** Left: searchable catalog grouped by hub (locked entries explain why). Centre: canvas of ≤30 blocks, reorder by drag or keyboard.
Right: block config (metric, range or "use report range", grouping, viz type, comparison). Header: inline name, Preview (stateless resolve),
Save (version check, 409 → "Someone else changed this, reload"), Export ▾ PDF / XLSX, Schedule. Empty canvas copy and three deterministic
template chips. At 375 the panes become three steps.

**Saved.** Table with search and sort: name, blocks, last run (with failure chip), schedule chip, owner; row actions open / duplicate / share
/ delete (soft, 30 days). Share dialog lists workspace members by role; M and BC see a "Shared with you" list, read only.

**Exports.** Table of artifact, format, generated, by, status, expiry; Download (authorised per request, audited), expired rows say "Expired.
Generate again". "Data tables" panel replaces the mock's Export tab: pick metrics and range, CSV (one table) or XLSX (sheets), optional
metadata sheet. No JSON.

**Schedules.** Weekly or monthly in the workspace timezone, PDF or XLSX, recipients from the member list (each must still hold access to
every metric in the report, otherwise they are listed as "will see locked blocks"). The tick creates a frozen run, files an export, notifies,
and emails a login-required link (D-ANA-6 b). Three failures disable it.

**Investor updates.** Period selector → metric grid (defaults MRR/monthly revenue, growth, runway, users, pipeline; add or remove) →
narrative sections drafted by "Report Narrator" over the grid's numbers, each editable → recipients (Funding investors with an email +
extras, deduped, ≤100) → Preview email, Save draft, Send (confirm modal listing recipients; Founder only). Sent view is a read-only
snapshot with per-recipient status; opens are labelled "approximate"; every email has a "stop these updates" link; opt-outs are honoured
across updates. Monthly auto-draft on the 1st (numbers only) with the PRD notification and cadence banner.

**Board decks.** Template (Business review / Financials / Product / Asks) + period + block picks → job → landscape PDF slides (cover,
agenda, one slide per block group, asks) → "Download deck" + a copy in Documents ("Board decks"). PPTX later (D-ANA-5).

## 8. Jobs, scheduling, retention

| Job | When | Notes |
|---|---|---|
| `analytics.report.run` | on demand / schedule | resolves blocks into `snapshot_json` under the requester's access, then renders |
| `analytics.export.render` | after a run | PDF (reportlab) / XLSX (`xlsx.py`) / CSV from the run, never re-queried |
| `scheduled.analytics.snapshot` | nightly, extend `scheduled.kpi.snapshot` | writes every catalog metric with a daily/month point into `kpi_snapshots` |
| `scheduled.analytics.reports` | every 15 min | due schedules → runs; idempotent via `ScheduledRun`; catches up after downtime once |
| `scheduled.analytics.purge` | daily | exports older than 30 days (file + `purged_at`), runs older than 90 days |
| `scheduled.analytics.investor_draft` | 1st of month, workspace tz | creates the numbers-only draft, notifies |
| `analytics.investor_update.send` | per recipient | idempotent per recipient (unique `update_id`+`email`), skips opt-outs and bounces |
| `analytics.deck.generate` | on demand | render, store in Documents, notify |

## 9. AI touchpoints and cost (D-ANA-9 b)

| Touchpoint | Tokens | Rule |
|---|---|---|
| Insight card wording | about 2k, cached 24h per workspace + range | optional; the rule notes work without AI |
| Investor update narrative ("Report Narrator", new agent entry) | about 6k per draft | inputs are the selected numbers only; **grounding check**: any number in the output not present in the input is stripped with its sentence; founder edits everything |
| Deck talking points | about 4k | same grounding check |

Template chips are not AI. Budget stays inside the 100k/day workspace cap; failures degrade to an empty editable section.

## 10. Security review checklist (what the slices must prove with tests)

1. Per-metric authorisation on catalog, overview, preview, run, export, schedule and email, for TM with/without grants, M, BC, AC, others.
2. Cross-workspace ids: uniform 404 on reports, runs, exports, schedules, updates, decks.
3. Download authorisation per request; expired = 410; filenames sanitised; audit row.
4. Formula injection guard in XLSX/CSV; HTML escaping in PDF text, email, sections; no raw HTML accepted anywhere.
5. Investor update: founder-only send, idempotent per recipient, recipient cap, opt-out honoured, token hashes only, pixel and unsubscribe unauthenticated but token-scoped with uniform responses, no IP stored.
6. Rate limits and timeouts on preview/run/export/send; block and range caps.
7. Schedule owner loses access → paused; ex-member recipients dropped.

## 11. Build slices (order, each ends with a live-captured FE guide)

| Slice | Contents | Migration | Depends on |
|---|---|---|---|
| **A Catalog + Overview** | registry + resolvers for Finance, Sales, Marketing, Validation, Health, Mission/Roadmap; `/metrics-catalog`, `/overview`, `/by-hub`, `/metrics/resolve`, insights (rules), snapshot job on `kpi_snapshots`, custom metrics (if D-ANA-2 b), role matrix tests | custom_metrics (+points) | D-ANA-1..4 |
| **B Reports + runs + shares** | `analytics_reports`, templates (3 chips), CRUD, optimistic lock, preview, run job, shares, notifications/events | reports, shares, runs | A |
| **C Exports** | PDF + XLSX + CSV renderers from runs, export rows, authorised download, purge job, data-tables export, `report_exported` | exports | B, D-ANA-5 |
| **D Schedules** | schedules, tick job, delivery per D-ANA-6, failure rules, starter schedules | schedules | C |
| **E Investor updates** | `investors.email` + Funding card chip, updates, recipients, narrative job, send job, pixel + unsubscribe, monthly draft, cadence banner | updates, recipients, optouts, investors.email | A, B, D-ANA-7, 9 |
| **F Board decks** | deck templates, vector charts, PDF slides, Documents copy | board_decks | C, E |
| **G Benchmarks + glue** | `/benchmarks` wrapper, insight AI wording, plan gate, "Add to a report" in Marketing/Sales, sidebar unhide | none | A-F |

Waves per D-ANA-1 (b): wave 1 = A, B, C; wave 2 = D, E; wave 3 = F; G closes. FE passes follow each BE slice; the every-control re-walk
(F, TM with and without Finance, M/BC shared, AC, denied roles, 1440 + 375) runs on merged develop after wave 1, then after waves 2 and 3.

## 12. FE changes to the mock

Replace the single 714-line page with a section layout (`app/(dashboard)/analytics-reports/layout.tsx` + `ShellTopBar`) and these routes:
overview (landing), `builder/[id]`, `saved`, `investor-updates`, `board-decks`, `exports`. Hooks: `hooks/useAnalyticsApi.ts` (catalog, overview,
reports, exports, schedules, updates, decks). Delete all hard-coded numbers, the "Savers" vocabulary, JSON export, the invented benchmark
cohort, the tab-switch toasts and the fake timers. Add: money formatting from minor units, locked-block component, "as of" stamp, source link on
every card, accessible chart tables, 375 layouts, role denial page. Drag and drop with a keyboard alternative. No colour literals (tokens only).

## 13. Interfaces with other modules

Funding: `investors.email` + opt-out chip (write side in slice E). Documents: deck and update PDFs. Marketing 10.8 / Sales 11.6 / Funding 14.6:
stay as the hubs' own pages and gain "Add to a report"; the interim Marketing CSV and Finance XLSX keep working. Health: benchmarks reused, no
new Health signals (L12). Billing: `analytics` Growth module. Notifications: three new kinds. Admin: no change.

## 14. Known gaps against the PRD (deliberate, pending the calls)

PPTX (D-ANA-5), JSON export, public report links, free-text report building by AI, metric-level peer benchmarks, integrations for custom
metrics, Health signals from reporting, and the PRD's raw cron (replaced by structured schedules). The PRD route `/app/analytics` becomes
`/analytics-reports` (the FE's existing route).
