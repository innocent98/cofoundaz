# SOP — Real charts on Health (recharts) + remove fabricated dashboard sparklines

**What shipped:** real, responsive **recharts** visualisations on the Health module —
a score-history area chart, a five-dimension radar, and a per-dimension trend line —
plus removal of the **fabricated** KPI sparkline on the dashboard. Addresses the audit's
chart gap (§6c C1).

## Why

- Health had genuine time-series and dimension data but drew it with hand-rolled
  `<svg>` paths — no axes, gridlines, tooltips, or empty-state handling.
- The **dashboard KPI cards drew a hardcoded polyline** (`points="0,20 10,15 …"`) that
  implied a trend. The real KPIs (revenue/runway/pipeline/CTR) carry `sparklineData: []`
  because the backend returns point-in-time values, not a series. Charting that is
  fabrication, so it was removed rather than dressed up.

## How

- Added **`recharts`** (the PRD §1.2 library) and a full clean lockfile regenerate so
  `npm ci` stays in sync (same care as the `qrcode` add).
- **`components/health/health-charts.tsx`** (new) — three token-themed charts, all fed
  **real API data**:
  - `ScoreHistoryChart` — `AreaChart` (0–100 Y, dated X, grid, tooltip) over
    `GET /health-score/history`.
  - `DimensionsRadar` — `RadarChart` of the five real dimension scores.
  - `DimensionTrendChart` — compact `LineChart` for a single dimension's `trend[]`.
- Wired in: `/health/history` (replaced the SVG path), `/health` overview (new
  "Dimension balance" radar card), `/health/dimensions/[dim]` (new trend card, shown
  only when `trend` has points).
- **`components/dashboard/kpi-strip.tsx`** — deleted the hardcoded sparkline (comment
  left explaining why there's no series to chart).

## Verification

| Check | Result |
|---|---|
| typecheck / lint / unit | 0 / 0 / 188 |
| build / e2e | clean (recharts bundles under Turbopack) / 153 |
| **Live (staging)** | **Radar** rendered the test account's five real scores (Product 89 / Market 88 / Financial 86 / Legal 100 / Team 88) as a pentagon. **History area chart** rendered with 0–100 axis + gridlines and the account's single real point (90 on Sep 17) plotted honestly (one assessment → one dot, no invented line). |

> The dimension-detail trend line couldn't be shown with a multi-point series (the
> thriving test account has a single assessment), but it's the same `LineChart` on the
> same data shape as the verified history chart, and only renders when `trend` is
> non-empty.

## Follow-ups

- As more assessments accrue, the history/trend charts fill into real lines (no code
  change needed).
- Consider recharts for other real-data surfaces later (e.g. finance once its API
  ships) — the hubs remain mock and were intentionally left alone.
