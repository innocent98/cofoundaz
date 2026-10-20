# Build-out status: Dashboard → Marketing (as of 2026-10-20)

Page-by-page PRD completion. FE = innocent98/cofoundaz, BE = innocent98/Cofoundaz-api. Evidence: `*-prd-gaps.md` and
`*-rewalk.md` in this folder. "Re-walk" = every control clicked and checked against the raw API.

| Page | Gaps closed | BE PRs | FE PRs | Re-walk on merged develop | Honest caveats |
|---|---|---|---|---|---|
| Dashboard | 20/20 | #129-#134 | #101, #104 | ✅ founder + team member on merged develop 2026-10-20 (1440 + 375, every control vs the API, see `dashboard-rewalk.md`); mentor + consultant walked, **not clean** | 3 permission leaks for mentor/consultant (mission in summary, mission search results, briefing/mission notifications) + 7 minor FE rows; some states not producible locally (KPI trends, calibration banner, mission empty reasons, card Retry) |
| Today's Mission | 15/15 | #135, #143, #144 | #105, #110 | ✅ 2026-10-19, founder + TM (1440 + 375), mentor | No real-model mission output recorded (budget was paused that walk) |
| Health Score | 10/10 | #136 | #106, #110 | ✅ 2026-10-19, founder 1440 (+375 width checks), mentor, consultant, TM (Recommendations) | Benchmarks with a real cohort can't be produced locally (unit-tested) |
| Roadmap | 11/11 | #137, #145 | #107, #110 | ✅ 2026-10-19, founder 1440 + 375, consultant, TM; real-model breakdown | Mentor not separately recorded |
| Business Builder | 21/21 | #139-#141, #146-#148 | #108, #110, #112 | ✅ 2026-10-19, founder 1440 + 375 (all routes), consultant / mentor / TM on SWOT; real-model AI incl. full plan | Other roles walked on one artifact only |
| Validation | 14/14 | #149, #150, #151 | #114, #115, #117 | ✅ (a) 2026-10-19, (b)+(c) 2026-10-20: founder 1440 + 375, TM, mentor, public page, real model incl. Apply | 3 minor FE items (notification tab context, 2 accessible names) |
| Assessment | 13/13 + A1-A6 | #152 | #121, #126 | 🟡 re-walked 2026-10-20, founder + TM + mentor (1440 + 375, every control vs the API, see `assessment-rewalk.md`); quarterly banner + bell deep link verified live by the lead after a 100-day backdate (restored). A1-A4 + A6 fixed in #126; **not done** until #126 merges and its rows are re-checked on develop | A5 (old pre-#152 mentor notifications, info) |
| Marketing | gap list ✅ 0/35 | — | — | Walked live 2026-10-20 (founder 1440 + 375, TM, mentor, consultant; real model ×3), see `marketing-prd-gaps.md` | No permission leaks found; 2 Sec rows are a permission-model decision (D-MKT-1) and a preventive media-storage rule. Real publishing, ad/SEO data and segment sizes are blocked on external accounts |

## Cross-cutting fixes found along the way (all merged)
Worker never registered notification subscribers (#130) · invite emails had no link (#131) · weekends-off reset streaks /
rest days pinged "mission ready" (#135) · Health Score never moved with real work (#136) · em/en dashes stripped from every
LLM output centrally (#142) · invited mentors got a founder onboarding draft (#144) · AI budget 100k/day (#147) · AI fill
honest results (#148) · Validation notifications leaked to mentors (#150) · preorder smoke tests could never convert (#149)
· prompt-injection fence on public survey answers (#150/#151).

## Still open (none blocks a finished page)
| Item | Type |
|---|---|
| Dashboard re-walk: BE gaps 1-3, 8, 9 merged (API #153); FE gaps 1, 4-7, 10 fixed in the `feat-dashboard-fe-rows` PR (`docs/sop/dashboard-rewalk-fe-rows.md`); mentor/consultant to be re-walked once it merges | follow-up |
| Validation: 3 minor FE items (see `validation-rewalk.md`) | follow-up |
| Consolidate the two comment-thread UIs + mention helpers | refactor follow-up |
| `ShellTopBar` on the remaining section layouts: Assessment done in the Assessment FE PR; sales, investor-readiness, marketplace, academy, legal, funding, documents, ai, notifications, analytics-reports done in the dashboard FE-rows PR (#123); Marketing / Finance / Journal / Settings etc. not checked | per-page, as each page is walked |
| Assessment re-walk gaps A1-A5 + reproduce the quarterly banner / bell deep link (backdate `completed_at` of all completed rows >90 days, restore), see `assessment-rewalk.md` | follow-up |
| Invited team member loses the invite link after email verification | Team page walk |
| Per-workspace timezones for the mission scheduler | follow-up |
| Health benchmarks with real cohorts | needs usage data |

## Blocked on accounts / product calls (not code)
Mono bank connection (registration + sandbox keys) · Google calendar sync (OAuth values to re-encrypt; Outlook later) ·
Paystack billing keys (+ yes/no on per-founder keys) · smoke-test subdomains (parked) · feedback by email / in-app widget
(inbound-mail provider) · Pipeline tile waits for the Sales page.
