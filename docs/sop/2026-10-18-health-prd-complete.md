# SOP — Health Score brought fully to the PRD (Module 06)

## What shipped

The five Health Score pages (`/health`, `/health/dimensions/{dim}`, `/health/history`, `/health/benchmarks`,
`/health/recommendations`) and their shell now meet PRD Module 06 (§06.1 to §06.5) and §2.1, with no mock data, no
decorative data and no dead controls. One FE PR, **stacked on #105** (Mission FE, provides `ShellTopBar`); retarget to
`develop` after it merges. **It needs API PR #136** (live signals, `trend`, `href`, signal labels/targets, `365d` + markers,
real benchmarks). Checklist: `docs/checklist/health-prd-gaps.md`. Contract: BE `docs/fe-integration-guide-health-live.md`.

## Why

The live walkthrough found 10 gaps. FE-side: sparklines were a fixed curve per band (not data), the Overview had no
"Top 3" section, the drill-down showed raw keys with no target or source link, History had no markers or 365d range, a
failed load told an assessed founder to take the assessment, the overview was fetched twice, and the header had a dead
bell badge ("5") and a dead + Invite.

## How

| Area | Approach |
|---|---|
| One fetch | `useHealthScore` shares one in-flight `GET /health-score` between all callers (the shell chip, layout and page mount together). `HealthScoreProvider` in `health/layout.tsx` holds it for the section, so tab switches never refetch. `useHealthOverview()` is what pages read |
| Errors | `useHealthScore` exposes `error`; the page shows `HealthError` ("Couldn't load your Health Score" + Retry). Only `status: "pending_assessment"` shows the assessment CTA. Every sub-hook (dimension, history, benchmarks, recommendations) got the same error + Retry |
| Overview | Per-dimension `Sparkline` from `dimensions[].trend` (oldest first; one point is a dot). Top 3 from `top_recommendations` with "est. +N pts" and **Do it** → `href`; an "all on target" card when there are none. Calculation modal is a real dialog (`aria-modal`, labelled, autofocus, Escape) with the new copy |
| Drill-down | Columns Signal (`label`), Current, Target for stage, Contribution, Source (link to `href`). `lib/health-format.ts` formats by `unit` (score, %, count, months, days, events); `status: "not_burning"` renders "Profitable", never 999. Recommendations get **Do it** |
| History | Ranges 30/90/365 days (PRD). `useHealthHistory` fetches `/history` and `/history/markers` together; a markers failure never blocks the chart. The chart moved to a numeric time axis (a category axis collided when several recomputes land on one day). Markers are copper dots with a hover title, and a text list "What moved your score" carries the same labels |
| Benchmarks | Empty state unchanged but quotes `min_cohort_size` (now 10). With `status: "ok"`: a bar per row (overall first, `money` shown as Financial) with the p25 to p75 band, the median tick, the founder's score and "Better than {your_percentile}% of similar startups" |
| Recommendations | **Start** = `POST …/accept`, then `router.push(href)` (only same-site paths); a failed accept stays put and shows the row error. Dismiss unchanged. Accepted items get **Open**. |
| Shell | `health/layout.tsx` mounts `ShellTopBar title="Health Score"` and a labelled `nav` with `aria-current`; the hand-rolled header (dead bell, dead + Invite) is gone. Shell files untouched |
| Notifications | `healthscore.record` deep-links to /health like `healthscore.dropped` |

Decisions and rejected alternatives:

- **Dedupe in the hook, not only in context.** The shell's own Health chip calls the hook too, so a provider alone would still make two requests. A shared in-flight promise fixes both without editing the shell.
- **Real time axis over a category axis** for both charts; chosen after the live data (five recomputes in two days, three on one date) rendered duplicate "Oct 17" categories.
- **Markers as SVG dots plus a text list**, not tooltip-only, so the information is not hover-only.
- Removed `mockDimensionSignals`, `dismissRecommendation` and the `HealthSignal` type: dead mock code with no callers.
- Rejected: keeping the 7d and all ranges. The PRD picker is 30/90/365, and the API still accepts the others if a need appears.

## What's involved

`app/(dashboard)/health/{layout,page}.tsx`, `health/{history,benchmarks,recommendations}/page.tsx`,
`health/dimensions/[dim]/page.tsx`, `hooks/useHealthScore.ts`, `hooks/useHealthDetails.ts`, `hooks/useNotifications.ts`,
`components/health/health-charts.tsx` (time axis, `Sparkline`, markers), `components/health/health-score-provider.tsx` (new),
`components/health/health-states.tsx` (new), `lib/health-format.ts` (new). No migrations, no config.

## Verification

- Unit: `health/health-pages.test.tsx` (all five pages, states and clicks, axe on Overview and drill-down),
  `hooks/useHealthScore.test.tsx` (trend/href mapping, one shared request, error vs pending), `lib/health-format.test.ts`,
  notification deep link. Full suite and CI gates: see the PR (typecheck, lint, test, build, e2e reproduced locally).
- Live, local full stack (API #136 in docker, FE on :3002, `API_PROXY_TARGET=http://localhost:8000`), local test founder:
  Overview (92, summary, real sparklines, top 3 with the right `href`s, one `/health-score` request), calculation dialog and
  Escape, drill-down on Financial and Team (units, targets, source links), History 90d and 365d with markers, empty
  Benchmarks, Recommendations Start (accepted and landed on /finance) and Dismiss (appeared under Dismissed), a forced 500
  on `/health-score` showing the error card and recovering on Retry, 375px with no horizontal overflow.
- **Not verifiable live:** benchmark percentile bars. The local cohort is below the minimum, so the populated state was
  rendered by stubbing the response in the browser with the guide's documented shape (labelled as a stub) and is
  unit-tested. The runway "Profitable" row needs a profitable workspace and is unit-tested only.

## Operate / roll back

Pure FE; revert the PR. Needs API #136 deployed first: without `trend`, `href` and the new signal fields the Overview shows
empty sparklines and the drill-down shows blank labels.

## Follow-ups

- Other section layouts still carry their own headers; adopt `ShellTopBar` as each page gets its PRD pass.
- Confirm the populated benchmarks response against a real cohort once staging has 10 peers.
