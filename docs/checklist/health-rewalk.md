# Health Score: full click-through re-walk (develop)

Walked on merged `develop` (FE `5127a6b`; API develop plus the re-walk fix branches #142 to #144, none of which touch
Health), local stack, 2026-10-19, workspace NovaPay (score 89).
Each row: control → action → result checked against the raw API → ✅/❌ → fix.

## Overview (`/health`), founder, 1440
| Control | Action | Result (API) | | Fix |
|---|---|---|---|---|
| Gauge | load | `aria-label` "Health score 89" = `GET /health-score` `score` 89; "-1 this week". (The number counts up with `requestAnimationFrame`, so it reads low while the pane is hidden: not a bug) | ✅ | |
| AI summary | load | "You're thriving for idea stage. Product is carrying you; Legal is holding you back." = API `summary` verbatim | ✅ | |
| 5 dimension cards | click each | links to `/health/dimensions/{product,market,financial,legal,team}`; scores 100/82/93/70/99 = API; sparklines from `trend` (8 points each) | ✅ | |
| "How is this calculated?" | open, Escape | modal with the blend explanation; "Close modal" button; Escape closes | ✅ | |
| Modal "See the signals →" | click | `/health/dimensions/product` | ✅ | |
| Top 3 "Do it" | each | `/documents/signatures`, `/validation/interviews`, `/mission/streaks`, all load; est. +10/+5/+2 pts match the recommendations | ✅ | |
| Sub-tabs | Overview / Dimensions / Trend history / Benchmarks / Recommendations | each route loads | ✅ | |

## Dimension drill-down (`/health/dimensions/{dim}`), founder, 1440
| Control | Action | Result (API) | | Fix |
|---|---|---|---|---|
| Signal table | Product | Kickoff assessment 100/100 +18.6 pts; Mission completion (7 days) 67%/70% +0.7; Roadmap tasks done 13.6%/10% +0.7 = `GET /health-score/dimensions/product` (`contribution` 0.67 shown as +0.7) | ✅ | |
| Source links | Assessment / Missions / Roadmap | `/assessment`, `/mission`, `/roadmap` | ✅ | |
| Financial | open | FE maps `financial` → API key `money` (`/dimensions/money` 200); table shows Transactions tracked 0/3 | ✅ | |
| Other dims | Market, Legal, Team | API 200 each, UI matches | ✅ | |
| "How to improve" → Do it / See all recommendations → | click | `/mission`, `/health/recommendations` | ✅ | |
| Over-time chart axis | Product | tick labels repeat "Oct 19" three times (three same-day recomputes on a time axis) | ❌ | FE: dedupe same-day ticks or show the time (`components/health` chart) |

## Trend history (`/health/history`), founder, 1440
| Control | Action | Result (API) | | Fix |
|---|---|---|---|---|
| Range 30 / 90 / 365 days | click each | `aria-pressed` moves; requests `range=30d`, `range=365d` (default 90d); 365d API has 12 points | ✅ | |
| Markers + "What moved your score" | load | Assessment completed ×3 (Oct 17), Roadmap re-planned (Oct 18) = `/health-score/history/markers` | ✅ | |
| Error state + Retry | history request forced to 500 | "Couldn't load your score history" + Retry; Retry recovered the chart | ✅ | |
| Same repeated "Oct 19" ticks | | as the drill-down chart | ❌ | same FE fix |

## Benchmarks (`/health/benchmarks`), founder, 1440
| Control | Action | Result (API) | | Fix |
|---|---|---|---|---|
| Thin cohort | load | "Not enough startups like yours yet" + 10-startup anonymity rule + disclosure; no controls | ✅ | A populated cohort can't be produced locally (needs 10 Fintech idea-stage workspaces): unit-tested in the API only |

## Recommendations (`/health/recommendations`), founder, 1440 and 375
| Control | Action | Result (API) | | Fix |
|---|---|---|---|---|
| Pending list | load | 4 cards, ranked, "Effort: … · {dimension}", Start / Dismiss = `?status=pending` | ✅ | |
| Dismiss | "Build a mission streak" | gone from Pending; `?status=dismissed` now lists it; toast "Dismissed" | ✅ | |
| Dismissed tab | click | lists Test your riskiest assumption + Build a mission streak, no actions (dismissed stays dismissed, D-HEA-4) | ✅ | |
| Start | "Complete your daily missions" | navigates to `/mission`; `?status=accepted` lists it | ✅ | |
| Accepted tab (375) | tap | Track your money in and out + Complete your daily missions, each with "Open" | ✅ | |
| Copy | cards | dimension shown as "Money" (the rest of Health says "Financial"); "est. +1 pts" | ❌ | FE: map `money` → "Financial" on cards; "+1 pt" singular |

## 375, founder
| Page | Result | | |
|---|---|---|---|
| All 5 sub-pages | `scrollWidth` 375, no unclipped overflow (tables/strips scroll inside their containers) | ✅ | |

## Other roles (PRD access F, TM, M, BC; accept/dismiss are founder-only in the API)
| Role | Control | Result (API) | | Fix |
|---|---|---|---|---|
| Mentor | Nav | Health, Roadmap, Business Builder shown; Mission hidden | ✅ | |
| Mentor, 375 | Recommendations | Start / Dismiss offered; Dismiss → `POST …/dismiss` 403, inline "Only a founder can action recommendations." | ❌ | FE: hide Start/Dismiss for non-founders (keep a plain "Open" link) |
| Mentor | Overview "Do it" | links to `/validation/interviews` and `/mission`, which a mentor can't open | ❌ | FE: hide or swap deep links the role can't see (`canSee`) |
| Consultant | Login + nav | lands on the NovaPay dashboard (after #144); Health/Roadmap/BB shown, Mission hidden | ✅ | |
| Team member | Recommendations | same founder-only rule as the mentor rows | ❌ | same FE fix |

## Close-out on merged develop (2026-10-19 evening, API ea7fe95 + #147, FE 3c89d16)
Every ❌ row above was re-checked live after API #142-#147 and FE #110 merged.
| Row | Re-check | |
|---|---|---|
| Repeated "Oct 19" ticks | history + drill-down axes: Oct 17, Oct 18, Oct 19 | ✅ |
| "Money" / "+1 pts" | Accepted tab: "Effort: Low · Financial", "est. +1 pt" | ✅ |
| Non-founder Start/Dismiss | mentor recommendations: only "Open", no Start/Dismiss | ✅ |
| Links a role can't open | mentor overview: only "Do it → /documents/signatures" | ✅ |
