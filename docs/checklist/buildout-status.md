# Build-out status: Dashboard → Marketing (as of 2026-10-22)

Page-by-page PRD completion. FE = innocent98/cofoundaz, BE = innocent98/Cofoundaz-api. Evidence: `*-prd-gaps.md` and
`*-rewalk.md` in this folder. "Re-walk" = every control clicked and checked against the raw API.

| Page | Gaps closed | BE PRs | FE PRs | Re-walk on merged develop | Honest caveats |
|---|---|---|---|---|---|
| Dashboard | 20/20 + gaps 11, 12 | #129-#134, #153, #155, #160 | #101, #104, #123, #130 | ✅ 2026-10-21: all 4 roles re-walked on merged develop (#120, #128; 1440 + 375, every control vs the API, live-stream isolation proven); gap 11 load-more (#130, code on develop identical to the live-verified head) and gap 12 legacy notification rows hidden on read (#160, re-checked live via the API for mentor + consultant + founder) | `business.*` notifications stay open to every role by decision #24 |
| Today's Mission | 15/15 | #135, #143, #144 | #105, #110 | ✅ 2026-10-19, founder + TM (1440 + 375), mentor | No real-model mission output recorded (budget was paused that walk) |
| Health Score | 10/10 | #136 | #106, #110 | ✅ 2026-10-19, founder 1440 (+375 width checks), mentor, consultant, TM (Recommendations) | Benchmarks with a real cohort can't be produced locally (unit-tested) |
| Roadmap | 11/11 | #137, #145 | #107, #110 | ✅ 2026-10-19, founder 1440 + 375, consultant, TM; real-model breakdown | Mentor not separately recorded |
| Business Builder | 21/21 | #139-#141, #146-#148 | #108, #110, #112 | ✅ 2026-10-19, founder 1440 + 375 (all routes), consultant / mentor / TM on SWOT; real-model AI incl. full plan | Other roles walked on one artifact only |
| Validation | 14/14 | #149, #150, #151 | #114, #115, #117 | ✅ (a) 2026-10-19, (b)+(c) 2026-10-20: founder 1440 + 375, TM, mentor, public page, real model incl. Apply | 3 minor FE items (notification tab context, 2 accessible names) |
| Assessment | 13/13 + A1-A6 | #152 | #121, #126 | ✅ 2026-10-20: re-walked founder + TM + mentor (1440 + 375, every control vs the API, `assessment-rewalk.md`); quarterly banner + bell deep link live after a 100-day backdate (restored); fixes re-checked on merged develop `97a65f3` (A2, A3, A4 live; A1 + A6 live on the PR head, app code identical on develop) | A5 (pre-#152 mentor bell rows, info); A6 day count unit-tested, live only with the old "90 days" copy |
| Marketing | gap list ✅ 35/35 (minus account-blocked data) | #156, #157, #161, #162 | #129, #133, #135, #138 | ✅ **Done 2026-10-21.** Re-check on merged develop: 15/15 rows pass. The last one ("Plan another week" never proposes a past slot) was fixed in #138, verified live on the fix branch (founder 1440 + 375); develop `1b0d9c1` app code is byte-identical to that branch (only docs merged since). Founder + team member at 1440 and 375, mentor + consultant denied everywhere (`marketing-rewalk.md`) | Open: 2 medium (Overview "AI content ideas" counts every content-gap run, 14 vs 7 shown; CSV export prints spend in minor units) and 7 low (week view anchor, plan proposes a past time, search hits link to list pages, CAC decimals, preview unavailable, segment error text, stale content gaps), plus the BE integrations now in PR `fix/marketing-be-integrations` (readout figures, stale content gaps, search hrefs, media preview). Publishing is a status only, metrics are typed in, SEO numbers are estimates, and the UI says so. Image preview, readout figures, stale content gaps and item search hrefs are wired in `fix/marketing-be-integrations` (awaiting merge and the lead's re-walk). Not live: 5 MB / 200-image caps. Touch drag is not offered; phones use the drawer date
| Sales | Pipeline, Leads, Accounts (FE-A rows 2, 3, 4, 6-14, 16-18) and AI Coach + Analytics (FE-C rows 25-30) closed (`sales-prd-gaps.md`); Sequences FE walked live (`sales-sequences-fe-walk.md`, PR `feature/sales-sequences-fe`), lead re-walks on develop after merge | #165 (slice A: CRM core), #166 (slice C: coach + analytics), #168 (strict-schema fix); B (sequences) #172 open (cPanel SMTP + IMAP; Opus review must-fixes in progress 2026-10-22) | #136 (design), #142 (FE-A), FE-C PR (`feature/sales-fe-c`) | ⏳ FE-C walked live on the FE branch against develop + #165/#166/#168, real model: founder and team member at 1440 and 375, mentor + consultant denied (`sales-prd-gaps.md`); re-walked on merged develop `946eade` 2026-10-21 (`sales-rewalk.md`): 173 control rows, 626 role x width checks, 0 failures; Sequences FE ready 2026-10-24: all controls pass live with no real send (a real send is still to be done by the lead) | Stall badge shown from the API flags but never seen live; stall-days setting has no control yet; Deal "Follow-up email" and Sequences shipped in the Sequences PR; budget-exhausted state proven by unit + mocked e2e only; a failed buyer turn leaves the seller's line so sending again repeats it |
| Finance | (a) payments + (b) invoice automation merged; (c) ledger correctness rows 2, 3, 15, 17-19, 28-30 in #171 (reviewed OK); (d) model rows 11-13 + Mono adapter next (`finance-prd-gaps.md`) | #167 (a), #170 (b), #171 (c, open) | none yet | ⏳ after the Finance FE session | Live Paystack/Flutterwave sync needs Adebayo's test keys in the UI; real Cloudinary private signing not verified live |
| Academy | all BE rows in #173 (reviewed OK): draft content (8 courses, 6 paths, 10 articles), YouTube embeds, certificate PDF + public verify + LinkedIn URL, notes (`academy-prd-gaps.md`) | #173 (open) | none yet | ⏳ after the Academy FE session | Content is `draft` until Adebayo reviews it; no videos recorded yet |

## Cross-cutting fixes found along the way (all merged)
Worker never registered notification subscribers (#130) · invite emails had no link (#131) · weekends-off reset streaks /
rest days pinged "mission ready" (#135) · Health Score never moved with real work (#136) · em/en dashes stripped from every
LLM output centrally (#142) · invited mentors got a founder onboarding draft (#144) · AI budget 100k/day (#147) · AI fill
honest results (#148) · Validation notifications leaked to mentors (#150) · preorder smoke tests could never convert (#149)
· prompt-injection fence on public survey answers (#150/#151).

## Still open (none blocks a finished page)
| Item | Type |
|---|---|
| Validation: 3 minor FE items (see `validation-rewalk.md`) | follow-up |
| Consolidate the two comment-thread UIs + mention helpers | refactor follow-up |
| `ShellTopBar` on the remaining section layouts: Assessment, Marketing, sales, investor-readiness, marketplace, academy, legal, funding, documents, ai, notifications, analytics-reports done; Finance / Journal / Settings etc. not checked | per-page, as each page is walked |
| Invited team member loses the invite link after email verification | Team page walk |
| Per-workspace timezones for the mission scheduler | follow-up |
| Health benchmarks with real cohorts | needs usage data |

## Blocked on accounts / product calls (not code)
Mono production approval (sandbox keys now available) · Google calendar sync (OAuth values to re-encrypt; Outlook later) ·
Paystack billing keys (+ yes/no on per-founder keys) · smoke-test subdomains (parked) · feedback by email / in-app widget
(inbound-mail provider) · outreach DKIM record + dedicated mailbox, and a per-workspace outreach gate before production · Cofoundaz LinkedIn page id for certificates.
