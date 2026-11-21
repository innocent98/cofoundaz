# Analytics & Reports FE walk, wave 1 (every control, live)

FE `feature/analytics-fe` at `f583293` (dev server) against a **scratch API stack** at API develop `4d5d60d6` (migration 0109, slices A-C), seeded workspace with one user per role. Driven by `analytics-fe-walk-evidence/walk.mjs` (Playwright with the installed Chrome, one fresh context per role and width, localhost only). Screenshots: `analytics-fe-walk-evidence/<role>-<width>-<page>.jpg (top 2,400 px of each page, JPEG)`. Raw results: `analytics-fe-walk-evidence/results-*.json`.

Walk-only aid, said plainly: the API limits heavy reads to 40 a minute per workspace; the script clicks far faster than a person, so a loop cleared the scratch Redis limiter keys during the run. The 429 state itself was checked by hand (below).

## Totals

| Role | 1440 | 375 |
|---|---|---|
| Founder | 62/62 ✅ | 62/62 ✅ |
| Team member | 63/63 ✅ | 63/63 ✅ |
| Accountant | 12/12 ✅ | 12/12 ✅ |
| Mentor | 12/12 ✅ | 12/12 ✅ |
| Business consultant | 12/12 ✅ | 12/12 ✅ |
| Investor (denied) | 6/6 ✅ | 6/6 ✅ |

**334/334 checks passed.**

## Founder

| Control / check | 1440 | 375 |
|---|---|---|
| login | ✅ | ✅ |
| overview loads with cards | ✅ | ✅ |
| no sideways scroll | ✅ | ✅ |
| range pill 7 days | ✅ | ✅ |
| range pill 90 days | ✅ | ✅ |
| range pill 12 months | ✅ | ✅ |
| range pill This month | ✅ | ✅ |
| range pill Last month | ✅ | ✅ |
| range pill 30 days | ✅ | ✅ |
| custom range needs both dates, then refetches | ✅ | ✅ |
| compare select (year, then previous) | ✅ | ✅ |
| definition tooltip button | ✅ | ✅ |
| chart "Show as a table" | ✅ | ✅ |
| insight source link goes to hub | ✅ | ✅ |
| card hub link targets hub | ✅ | ✅ |
| no link into hidden Funding | ✅ | ✅ |
| by-hub pill Finance | ✅ | ✅ |
| by-hub pill Marketing | ✅ | ✅ |
| by-hub pill All hubs | ✅ | ✅ |
| custom metric: add, enter value, delete | ✅ | ✅ |
| "Edit values" on a custom card jumps to the panel | ✅ | ✅ |
| benchmarks card (Health cohort) | ✅ | ✅ |
| Export data ▾ CSV → ready → download | ✅ | ✅ |
| reports list loads | ✅ | ✅ |
| no sideways scroll (list) | ✅ | ✅ |
| search filters | ✅ | ✅ |
| sort select | ✅ | ✅ |
| duplicate a report | ✅ | ✅ |
| delete: cancel, then delete the copy | ✅ | ✅ |
| share dialog: shows locked hubs, saves members | ✅ | ✅ |
| report detail loads | ✅ | ✅ |
| Run now → frozen run shown | ✅ | ✅ |
| no sideways scroll (detail) | ✅ | ✅ |
| pick an older run in the list | ✅ | ✅ |
| Export ▾ PDF → ready → download | ✅ | ✅ |
| Share button on detail opens dialog | ✅ | ✅ |
| Edit link opens builder | ✅ | ✅ |
| builder new: template chips + empty copy | ✅ | ✅ |
| save without a name is refused | ✅ | ✅ |
| template chip fills the canvas | ✅ | ✅ |
| name and description inputs | ✅ | ✅ |
| catalog: search and add a metric | ✅ | ✅ |
| catalog: add a text note → config opens | ✅ | ✅ |
| block config: title, viz, period, compare | ✅ | ✅ |
| canvas: move up/down, duplicate, remove | ✅ | ✅ |
| drag and drop reorders | ✅ | ✅ |
| Preview shows live numbers | ✅ | ✅ |
| close preview | ✅ | ✅ |
| Export disabled until saved | ✅ | ✅ |
| report period pills | ✅ | ✅ |
| Save creates the report | ✅ | ✅ |
| edit → unsaved hint → save again (PATCH) | ✅ | ✅ |
| Export ▾ XLSX from the builder | ✅ | ✅ |
| Back to the report link | ✅ | ✅ |
| exports page loads with history | ✅ | ✅ |
| no sideways scroll (exports) | ✅ | ✅ |
| filter select (reports, data tables, everything) | ✅ | ✅ |
| data tables: empty pick refused | ✅ | ✅ |
| data tables: pick, period, format, metadata → ready | ✅ | ✅ |
| history row Download (authorised fetch) | ✅ | ✅ |
| expired row says "Expired. Generate it again." and regenerates | ✅ | ✅ |
| console errors | ✅ | ✅ |

## Team member

| Control / check | 1440 | 375 |
|---|---|---|
| login | ✅ | ✅ |
| overview loads with cards | ✅ | ✅ |
| no sideways scroll | ✅ | ✅ |
| range pill 7 days | ✅ | ✅ |
| range pill 90 days | ✅ | ✅ |
| range pill 12 months | ✅ | ✅ |
| range pill This month | ✅ | ✅ |
| range pill Last month | ✅ | ✅ |
| range pill 30 days | ✅ | ✅ |
| custom range needs both dates, then refetches | ✅ | ✅ |
| compare select (year, then previous) | ✅ | ✅ |
| definition tooltip button | ✅ | ✅ |
| chart "Show as a table" | ✅ | ✅ |
| insight source link goes to hub | ✅ | ✅ |
| card hub link targets hub | ✅ | ✅ |
| no link into hidden Funding | ✅ | ✅ |
| by-hub pill Finance | ✅ | ✅ |
| by-hub pill Marketing | ✅ | ✅ |
| by-hub pill All hubs | ✅ | ✅ |
| custom metric: add, enter value, delete | ✅ | ✅ |
| "Edit values" on a custom card jumps to the panel | ✅ | ✅ |
| benchmarks card (Health cohort) | ✅ | ✅ |
| Export data ▾ CSV → ready → download | ✅ | ✅ |
| reports list loads | ✅ | ✅ |
| no sideways scroll (list) | ✅ | ✅ |
| search filters | ✅ | ✅ |
| sort select | ✅ | ✅ |
| duplicate a report | ✅ | ✅ |
| delete: cancel, then delete the copy | ✅ | ✅ |
| no Share button for team member | ✅ | ✅ |
| report detail loads | ✅ | ✅ |
| Run now → frozen run shown | ✅ | ✅ |
| no sideways scroll (detail) | ✅ | ✅ |
| pick an older run in the list | ✅ | ✅ |
| Export ▾ PDF → ready → download | ✅ | ✅ |
| no Share button | ✅ | ✅ |
| no Edit on the founder's report (can_edit false) | ✅ | ✅ |
| builder URL of the founder's report is refused | ✅ | ✅ |
| builder new: template chips + empty copy | ✅ | ✅ |
| save without a name is refused | ✅ | ✅ |
| template chip fills the canvas | ✅ | ✅ |
| name and description inputs | ✅ | ✅ |
| catalog: search and add a metric | ✅ | ✅ |
| catalog: add a text note → config opens | ✅ | ✅ |
| block config: title, viz, period, compare | ✅ | ✅ |
| canvas: move up/down, duplicate, remove | ✅ | ✅ |
| drag and drop reorders | ✅ | ✅ |
| Preview shows live numbers | ✅ | ✅ |
| close preview | ✅ | ✅ |
| Export disabled until saved | ✅ | ✅ |
| report period pills | ✅ | ✅ |
| Save creates the report | ✅ | ✅ |
| edit → unsaved hint → save again (PATCH) | ✅ | ✅ |
| Export ▾ XLSX from the builder | ✅ | ✅ |
| Back to the report link | ✅ | ✅ |
| exports page loads with history | ✅ | ✅ |
| no sideways scroll (exports) | ✅ | ✅ |
| filter select (reports, data tables, everything) | ✅ | ✅ |
| data tables: empty pick refused | ✅ | ✅ |
| data tables: pick, period, format, metadata → ready | ✅ | ✅ |
| history row Download (authorised fetch) | ✅ | ✅ |
| expired row says "Expired. Generate it again." and regenerates | ✅ | ✅ |
| console errors | ✅ | ✅ |

## Accountant

| Control / check | 1440 | 375 |
|---|---|---|
| login | ✅ | ✅ |
| Overview: finance only | ✅ | ✅ |
| no sideways scroll (landing) | ✅ | ✅ |
| tabs match role | ✅ | ✅ |
| shared list: read-only, no New report | ✅ | ✅ |
| open shared report: frozen run with locks, never numbers | ✅ | ✅ |
| no sideways scroll (report) | ✅ | ✅ |
| no Run, Edit or Share controls | ✅ | ✅ |
| Export ▾ warns about locked blocks, PDF of the run → download | ✅ | ✅ |
| builder is refused | ✅ | ✅ |
| exports page: own exports + finance-only data tables | ✅ | ✅ |
| console errors | ✅ | ✅ |

## Mentor

| Control / check | 1440 | 375 |
|---|---|---|
| login | ✅ | ✅ |
| Overview: redirects to shared reports | ✅ | ✅ |
| no sideways scroll (landing) | ✅ | ✅ |
| tabs match role | ✅ | ✅ |
| shared list: read-only, no New report | ✅ | ✅ |
| open shared report: frozen run with locks, never numbers | ✅ | ✅ |
| no sideways scroll (report) | ✅ | ✅ |
| no Run, Edit or Share controls | ✅ | ✅ |
| no Export menu | ✅ | ✅ |
| builder is refused | ✅ | ✅ |
| exports page refused | ✅ | ✅ |
| console errors | ✅ | ✅ |

## Business consultant

| Control / check | 1440 | 375 |
|---|---|---|
| login | ✅ | ✅ |
| Overview: redirects to shared reports | ✅ | ✅ |
| no sideways scroll (landing) | ✅ | ✅ |
| tabs match role | ✅ | ✅ |
| shared list: read-only, no New report | ✅ | ✅ |
| open shared report: frozen run with locks, never numbers | ✅ | ✅ |
| no sideways scroll (report) | ✅ | ✅ |
| no Run, Edit or Share controls | ✅ | ✅ |
| no Export menu | ✅ | ✅ |
| builder is refused | ✅ | ✅ |
| exports page refused | ✅ | ✅ |
| console errors | ✅ | ✅ |

## Investor (denied)

| Control / check | 1440 | 375 |
|---|---|---|
| login | ✅ | ✅ |
| denied / | ✅ | ✅ |
| denied /saved | ✅ | ✅ |
| denied /exports | ✅ | ✅ |
| denied /builder/new | ✅ | ✅ |
| console errors | ✅ | ✅ |

## Hand-set states (extras.mjs, founder)

| State | 1440 | 375 |
|---|---|---|
| 409: stale save shows "Someone else changed this report", Reload loads the new version | ✅ | ✅ |
| 429: heavy-read limit shows the API message with Retry | ✅ | ✅ |

Evidence: `founder-{1440,375}-builder-409.jpg`, `founder-{1440,375}-overview-429.jpg`. The 409 was made by a PATCH through the API between load and save; the 429 by filling the scratch Redis window key.

## What the walk changed (fixed in the PR before the final pass)
- Zero change rendered as "₦0": now "No change" with a neutral dash.
- Links into the hidden Funding hub ("Open Funding", "Add in Funding"): removed; custom-metric cards say "Edit values" and jump to the panel.
- Both chart series were near-identical blues: navy solid + amber dashed.
- Dev double-fetch under StrictMode spent the 40-a-minute heavy-read budget twice: one request per mount.
- 375: a new report opened on the Metrics step, hiding the template chips: it opens on the Canvas step.
- A mentor saw "Open Marketing" on a shared report (mentors can't open Marketing): hub links render only for hubs the viewer's role opens.
- 375: twenty runs pushed the frozen numbers off screen: the list shows 5 with "Show all N runs".

## Not covered live
- Plan gate (402): `PLAN_ENFORCEMENT` is off locally, as in the API guides.
- `failed` run and `EXPORT_FAILED` states: unit-tested in the API only; the FE renders the API's `error` text and "Generate again".
- Unsaved-changes guard: reload / tab close only (`beforeunload`), not in-app links.
- Staging: not walked here; the lead re-walks on merged develop.
