# Health Score: PRD + UI-handoff gap list (live walkthrough, 2026-10-18)

Source of truth: `Cofoundaz_Technical_PRD.md` Module 06 (§06.1 to §06.5), plus the existing designed pages (`/health`,
`/health/dimensions/{dim}`, `/health/history`, `/health/benchmarks`, `/health/recommendations`). Walked live on `develop` +
BE `feat/mission-prd` as the local test founder (score 93, assessed 3 times), at 1440px.

## Works (verified live)
- ✅ Overview gauge (93) + "+3 this week", AI summary line, 5 dimension cards linking to drill-downs, "How is this
  calculated?" button, dimension-balance radar.
- ✅ Drill-down header "What's driving {Dimension}", dimension-over-time chart, signal table.
- ✅ History chart + range buttons. Benchmarks thin-cohort empty state + anonymity disclosure. Recommendations tabs
  (Pending / Accepted / Dismissed).

## Gaps
| # | Area | Gap (observed) | PRD | Fix | Status |
|---|---|---|---|---|---|
| 1 | **Scoring (BE)** | **The score is assessment-only.** Nothing done in the app (missions, roadmap, validation, finance, e-signatures, team) ever moves it; signals are rebuilt only from assessment answers; recompute only on assessment completion | "weighs live signals from every hub… every point traces to something real"; event-driven recompute (min 15 min) + nightly pass | BE: live-signal engine (D-HEA-1..4) | **Done:** ✅ BE #136 live-signal engine; FE shows the blended score and the live rows (verified live: 14 signal rows, score 92). |
| 2 | Recommendations | Empty for a 93 with Legal 75 (catalog only fires on low *assessment* scores), so the Overview has **no "Top 3 fastest ways"** section at all | §06.1 top 3 with "+{n} pts est." + **Do it** deep link; §06.5 ranked list with Start/Dismiss | BE: live recommendations from weak signals with `href`; FE renders top 3 + Do it | **Done:** ✅ Overview "Top 3 fastest ways to raise your score" with "est. +N pts" and **Do it** → `href`; Recommendations **Start** (accept then go to `href`) / Dismiss, accepted items get **Open**. Verified live (Start landed on /finance, Dismiss moved a card to Dismissed). |
| 3 | Overview | Dimension "sparklines" are a **fixed decorative curve per band**, not data | trend sparkline per dimension | BE: per-dimension `trend`; FE draws it | **Done:** ✅ Per-dimension sparkline drawn from the API `trend` (fixed curve deleted); one point is a dot. Verified live. |
| 4 | Overview | Summary copy differs | *"You're {band} for {stage} stage. {strongest} is carrying you; {weakest} is holding you back."* | BE | **Done:** ✅ BE #136 copy; FE renders `summary` verbatim. Verified live ("You're thriving for idea stage. Team is carrying you; Legal is holding you back."). |
| 5 | Drill-down | One assessment row; no **target for stage**, no **source module link**, raw keys | columns: signal name, current value, target for stage, contribution, source link | BE: label/target/href per signal; FE columns | **Done:** ✅ Columns Signal · Current · Target for stage · Contribution · Source link, unit-aware formatting, `not_burning` shows "Profitable", never 999. Verified live on Financial and Team. |
| 6 | History | Range 7d/30d/90d/all; no **event markers**; every point is an assessment | range 30/90/365d; markers ("Business plan generated", …) | BE: `365d` range + `markers`; FE | **Done:** ✅ Range picker 30/90/365 days (365d verified live), markers on the chart (hover title) plus a text list "What moved your score". Real time axis, so same-day recomputes no longer collide. |
| 7 | Error state (FE) | On any failed load the page shows the **"pending assessment" CTA**, telling an assessed founder to take the assessment | honest error + retry | FE | **Done:** ✅ A failed load shows "Couldn't load your Health Score" + Retry (also on every sub-page); only the API's `pending_assessment` shows the assessment CTA. Verified live with a forced 500, then Retry recovered. |
| 8 | Overview (FE) | `/health-score` fetched twice (layout + page) | — | FE: one source | **Done:** ✅ One `HealthScoreProvider` in the Health layout plus a shared in-flight request in `useHealthScore`; one `GET /health-score` per page view, tab switches do not refetch. Verified live. |
| 9 | Notifications | "Your Startup Health Score dropped"; no personal-best notification | **"Your Health Score dropped {n} points, worth a look"** CTA "See why" · **"New personal best: {score}. Keep going."** | BE | **Done:** ✅ BE #136 sends the copy. FE side: `healthscore.record` deep-links to /health like `healthscore.dropped` (unit-tested). |
| 10 | Shell | Health section header lacks the global search/Health chip (same as Mission row 14) | §2.1 | FE (fixed once at layout level by the Mission FE session) | **Done:** ✅ Health layout mounts the shared `ShellTopBar` (⌘K search, Health chip, bell, + Invite); the dead bell "5" and + Invite are gone. Verified live. |

## Decisions (lead, 2026-10-18; delegated while the user sleeps)
- **D-HEA-1 Blend:** each dimension = **50% assessment baseline + 50% live signals** (average of that dimension's live
  signal scores). The assessment stays meaningful (it's the founder's self-report), and real work in the app moves the
  score from day one. Revisit the 50/50 once real usage data exists (written up for the user).
- **D-HEA-2 Live signals (v1),** each scored `min(value / target_for_stage, 1) × 100`, with targets scaled by stage
  (idea → scale):
  - Product: roadmap tasks done % (→ /roadmap); mission completion, last 7 days (→ /mission)
  - Market: assumptions tested, validated or invalidated (→ /validation/assumptions); interviews logged, last 30 days (→ /validation/interviews)
  - Financial: transactions recorded, last 30 days (→ /finance); runway months vs 12 (→ /finance/runway; profitable = full marks; no data = not counted)
  - Legal: completed e-signatures (→ /documents/signatures). More legal signals arrive with the Legal page (Module 13)
  - Team: active members (→ /team); workspace activity, last 7 days (→ /dashboard); mission streak (→ /mission/streaks)
- **D-HEA-3 Recompute:** on relevant events (mission/roadmap/validation/finance/document/member) at most once per 15
  minutes per workspace, on read when stale (>15 min), and nightly (scheduler). History gets a point on each recompute
  that changes the score.
- **D-HEA-4 Recommendations:** live recommendations come from the weakest signals, ranked by potential lift (points
  gained by hitting the target), each with a deep link (`href`). They're merged with the catalog ones. Dismissed stays dismissed.
