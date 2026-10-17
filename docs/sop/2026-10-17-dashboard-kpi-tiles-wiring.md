# SOP — Dashboard KPI tiles wired to `kpis.metrics`

## What shipped

The founder dashboard's Monthly Revenue, Runway and Campaign CTR tiles now show real data from
the backend `data.kpis.metrics` object, with an honest state for every `status`. Depends on BE PR
innocent98/Cofoundaz-api#129 (merge that first). FE PR: see the branch `claude/wire-dashboard-kpis-49bf0e`.

## Why

The tiles always said "Coming Soon" because `mapKpis` read the legacy scalar keys
(`kpis.revenue`, `runway`, `pipeline_value`, `campaign_performance`), which the BE still sends as
`null`. The BE now returns the figures, each with a status, under `kpis.metrics`.

## How

| Status | Render |
|---|---|
| `ok` | Value. Money is kobo, divided by 100 then `formatCurrency`; `0` shows ₦0; `ctr_percent` is already a percent |
| `no_data` | "No data yet" plus a CTA link into the module (`/finance`, `/marketing`). Never ₦0 or Coming Soon |
| `restricted` | Tile hidden (`hidden: true`); the strip grid reflows to the visible count |
| `not_built` | "Coming Soon" (pipeline only, the only remaining Coming Soon) |
| runway `not_burning` | "Not burning", no months, no alert |
| runway `out_of_cash` | "Out of cash", alert border |
| `{error: true}` tile | Existing per-card "Unavailable + Retry"; whole-section error unchanged |

Key decisions: the alert now comes from the backend `is_low` (the old label/`parseFloat < 6`
heuristic was removed); revenue carries the hint "Avg. monthly money in, last 3 months" because it
includes raises (guide §7); the legacy scalar keys are ignored; `DEFAULT_SUMMARY.kpis` is now `[]`
(it was unused, and fake "Coming Soon" tiles would be dishonest). `formatCurrency` now handles negatives.
Rejected: a per-role "Not available" tile (an investor seeing three would read as broken).

## What's involved

- `hooks/useDashboardApi.ts`: `mapKpis` plus per-metric tile builders, `formatMinor`.
- `lib/api/dashboard.ts`: `DashboardKpiMetrics` types and the per-metric `{error: true}` marker.
- `types/dashboard.ts`: `KPISnapshot` gains `status`, `hidden`, `cta`, `hint`.
- `components/dashboard/kpi-strip.tsx`: hidden filter, grid reflow, CTA, hint, `isAlert` only.
- Tests: `hooks/useDashboardApi.test.ts` (every status), `components/dashboard/kpi-strip.test.tsx`.

## Verification

- CI gates run locally: typecheck, lint, unit (268 pass), build, e2e/a11y/responsive (153 pass).
- Live on the local full stack (BE `feat/dashboard-kpis`, FE `:3011`, throwaway founder): `no_data` x3 + `not_built`;
  `ok` after seeding (revenue ₦10.0K, runway 27 mo, CTR 2.5%, matching the guide captures); `out_of_cash`
  ("Out of cash", red border); `not_burning` ("Not burning", revenue ₦676.7K). Revenue CTA navigated to `/finance`,
  pipeline tile to `/sales`.
- Not verified live: `restricted` (investor/accountant) and per-tile `{error: true}`; both unit-tested only.

## Operate / roll back

No config or migration. Revert the PR to restore the old (always "Coming Soon") tiles; the BE change is additive.

## Follow-ups

- Finance and Marketing hubs are still mock, so the `no_data` CTA lands on a mock page until those slices ship.
- Pipeline stays Coming Soon until Sales has a backend.
- Test marketing metrics (2000 impressions, 50 clicks, today) remain on the throwaway account (no delete API).
