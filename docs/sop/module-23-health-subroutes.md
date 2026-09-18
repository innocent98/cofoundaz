# SOP — Module 23: Health Score sub-routes (dimensions / history / benchmarks / recommendations)

## What shipped

The four Health Score sub-pages now render real data from their own endpoints:
**Dimension drill-down**, **Trend history**, **Benchmarks**, and **Recommendations**
(list + accept/dismiss). Branch `feat/api-health-subroutes` → PR into `develop`.
Completes the Module 3 Health Score follow-up.

## Why

Module 3 wired the `/health` overview; the four sub-routes were mock (hardcoded
percentile bars, a fake SVG trend with invented event markers, mock dimension
signals, and a fake `dismiss`).

## How

- **`hooks/useHealthDetails.ts`** (new) — four hooks:
  - `useHealthDimension(feDim)` → `GET /health-score/dimensions/{dim}`. Maps the
    FE key **`financial` → the API's `money`** (the one key that differs); 404 →
    not-found state.
  - `useHealthHistory(range)` → `GET /health-score/history?range=7d|30d|90d|all`.
  - `useHealthBenchmarks()` → `GET /health-score/benchmarks`.
  - `useHealthRecommendations(status)` → `GET /health-score/recommendations?status=…`
    + `accept`/`dismiss` (`POST …/{id}/accept|dismiss`), with **`409
    RECOMMENDATION_RESOLVED`** → "already actioned" and **`403`** → "founder only"
    surfaced per the guide.
- **Pages**
  - `dimensions/[dim]` — real score/band + a signals table (`signal / value /
    contribution / source`) + the dimension's own recommendations; nav-chip scores
    from the overview.
  - `history` — a real trend line from the history points (single-point → a dot),
    real range tabs, latest score + hedged delta.
  - `benchmarks` — honest `insufficient_data` empty state ("not enough startups
    like yours yet") with the real cohort + `min_cohort_size`; **no fabricated
    percentiles** (the future populated path is coded but gated on real data).
  - `recommendations` — the full list with a pending/accepted/dismissed filter,
    **hedged `est. +N`** (never a bare "+N"), Accept/Dismiss with per-row errors.

## What's involved

| Path | Change |
| --- | --- |
| `hooks/useHealthDetails.ts` | new: dimension / history / benchmarks / recommendations hooks |
| `app/(dashboard)/health/dimensions/[dim]/page.tsx` | real signals + recs (money→financial) |
| `app/(dashboard)/health/history/page.tsx` | real trend from history points |
| `app/(dashboard)/health/benchmarks/page.tsx` | honest insufficient-data state |
| `app/(dashboard)/health/recommendations/page.tsx` | real list + accept/dismiss + filter |

Contract: `cofoundaz-api/docs/fe-integration-guide-health-score.md` §2–§5.

## Verification (live, staging via dev proxy)

Against the (thriving, score 90) test account:

- **Dimension** (`/dimensions/financial`) — `GET /dimensions/money` → "What's
  driving Financial · 86", signal "Money · 86 · +17.2 pts · Assessment"; nav chips
  show all 5 real scores (Product 89 / Market 88 / Financial 86 / Legal 100 / Team 88).
- **History** — real single point rendered (Sep 17 · 90); range tabs (7d/30d/90d/all).
- **Benchmarks** — honest empty state with the real cohort (Fintech · validation,
  min 5); no fabricated bars.
- **Recommendations** — `GET ?status=pending` **200** → "all caught up" (0 pending,
  correct for a thriving account); switching to Accepted refetched `?status=accepted`
  **200**.
- Gates: `typecheck` 0 · `lint` 0 errors · **188** unit · clean `build` · e2e ✓.

### Honestly-labelled gap

**Accept/Dismiss writes were NOT exercised live**: the test account is thriving and
has **zero recommendations in any status**, so there was no pending row to action
(and generating one means deliberately tanking the assessment, which would destroy
the well-onboarded fixture). The read path (`GET /recommendations`) is verified;
the accept/dismiss `POST` + `409`/`403` handling follows the guide's captured
contract but is derived-from-doc, not run live. Re-verify on a workspace that has
pending recommendations.

## Follow-ups

- Benchmarks populated path (percentile bars) once real cohort aggregation ships a
  `status` other than `insufficient_data`.
- Role-gate the Accept/Dismiss buttons on `founder` membership (today a `403` is
  surfaced after the click rather than pre-disabling).
- `mockDimensionSignals` in `useHealthScore` is now unused — safe to delete in a
  cleanup pass.
