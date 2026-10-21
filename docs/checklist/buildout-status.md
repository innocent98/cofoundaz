# Build-out status: Dashboard → Marketing (as of 2026-10-20)

Page-by-page PRD completion. FE = innocent98/cofoundaz, BE = innocent98/Cofoundaz-api. Evidence: `*-prd-gaps.md` and
`*-rewalk.md` in this folder. "Re-walk" = every control clicked and checked against the raw API.

| Page | Gaps closed | BE PRs | FE PRs | Re-walk on merged develop | Honest caveats |
|---|---|---|---|---|---|
| Dashboard | 20/20 | #129-#134, #153, #155 | #101, #104, #123 | ✅ founder + team member, **mentor + consultant re-walked on merged develop 2026-10-21** (1440 + 375, every control vs the API, live stream isolation proven): rows 1-10 verified, #155 feed and stream clean; **not marked done** | 2 low gaps: activity card shows only the first 20 rows (no load-more), and pre-#153 mission/briefing rows remain in mentor/consultant inboxes (see `dashboard-rewalk.md` gaps 11-12); some states not producible locally (KPI trends, calibration banner, mission empty reasons, card Retry) |
| Today's Mission | 15/15 | #135, #143, #144 | #105, #110 | ✅ 2026-10-19, founder + TM (1440 + 375), mentor | No real-model mission output recorded (budget was paused that walk) |
| Health Score | 10/10 | #136 | #106, #110 | ✅ 2026-10-19, founder 1440 (+375 width checks), mentor, consultant, TM (Recommendations) | Benchmarks with a real cohort can't be produced locally (unit-tested) |
| Roadmap | 11/11 | #137, #145 | #107, #110 | ✅ 2026-10-19, founder 1440 + 375, consultant, TM; real-model breakdown | Mentor not separately recorded |
| Business Builder | 21/21 | #139-#141, #146-#148 | #108, #110, #112 | ✅ 2026-10-19, founder 1440 + 375 (all routes), consultant / mentor / TM on SWOT; real-model AI incl. full plan | Other roles walked on one artifact only |
| Validation | 14/14 | #149, #150, #151 | #114, #115, #117 | ✅ (a) 2026-10-19, (b)+(c) 2026-10-20: founder 1440 + 375, TM, mentor, public page, real model incl. Apply | 3 minor FE items (notification tab context, 2 accessible names) |
| Assessment | 13/13 + A1-A6 | #152 | #121, #126 | ✅ 2026-10-20: re-walked founder + TM + mentor (1440 + 375, every control vs the API, `assessment-rewalk.md`); quarterly banner + bell deep link live after a 100-day backdate (restored); fixes re-checked on merged develop `97a65f3` (A2, A3, A4 live; A1 + A6 live on the PR head, app code identical on develop) | A5 (pre-#152 mentor bell rows, info); A6 day count unit-tested, live only with the old "90 days" copy |
| Marketing | gap list ✅ 35/35 (minus account-blocked data) | #156, #157 | `feature/marketing-prd-fe` (open, see the PR) | Walked live 2026-10-20 (gaps); FE rows built and live-checked 2026-10-21: founder 1440 + 375, TM (notification deep link), mentor (clean denial, 403 on every new route); real model ×6 (`docs/sop/marketing-prd-fe.md`) | Publishing is a status only, metrics are typed in, SEO numbers are estimates, and the UI says so. Not live: Cloudinary image preview, 5 MB and 200 image caps. Touch drag is not offered; phones use the drawer date. Full re-walk of merged develop still to do |

## Cross-cutting fixes found along the way (all merged)
Worker never registered notification subscribers (#130) · invite emails had no link (#131) · weekends-off reset streaks /
rest days pinged "mission ready" (#135) · Health Score never moved with real work (#136) · em/en dashes stripped from every
LLM output centrally (#142) · invited mentors got a founder onboarding draft (#144) · AI budget 100k/day (#147) · AI fill
honest results (#148) · Validation notifications leaked to mentors (#150) · preorder smoke tests could never convert (#149)
· prompt-injection fence on public survey answers (#150/#151).

## Still open (none blocks a finished page)
| Item | Type |
|---|---|
| Dashboard: gap 11 (activity card load-more) and gap 12 (legacy mission/briefing notification rows for mentor/consultant), both low (`dashboard-rewalk.md`) | follow-up |
| Validation: 3 minor FE items (see `validation-rewalk.md`) | follow-up |
| Consolidate the two comment-thread UIs + mention helpers | refactor follow-up |
| `ShellTopBar` on the remaining section layouts: Assessment, Marketing, sales, investor-readiness, marketplace, academy, legal, funding, documents, ai, notifications, analytics-reports done; Finance / Journal / Settings etc. not checked | per-page, as each page is walked |
| Invited team member loses the invite link after email verification | Team page walk |
| Per-workspace timezones for the mission scheduler | follow-up |
| Health benchmarks with real cohorts | needs usage data |

## Blocked on accounts / product calls (not code)
Mono bank connection (registration + sandbox keys) · Google calendar sync (OAuth values to re-encrypt; Outlook later) ·
Paystack billing keys (+ yes/no on per-founder keys) · smoke-test subdomains (parked) · feedback by email / in-app widget
(inbound-mail provider) · Pipeline tile waits for the Sales page.
