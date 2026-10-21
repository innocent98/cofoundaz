# Marketing: click-through re-walk (develop)

All eight `/marketing` pages walked on merged `develop`, local stack, 2026-10-21, workspace NovaPay. FE = `origin/develop`
`cbebd4a` (includes #129, `feature/marketing-prd-fe`) served on :3217. API = `18949a6` (#156 + #157), alembic
`0062_marketing_prd_b`, shared :8000 (checked read-only; `GET /marketing/media` without a token is 401, not 404). Real model
used 5 times (AI post copy, copy generate, refine, plan my first week, content ideas), well inside the 100k/day budget.
Each row: control → action → result checked against the raw API (`/marketing/*`, `/search`, `/notifications`, always with
`X-Workspace-Id`) → ✅/❌. Roles: founder (`localhost`), team member (`tm.`), mentor (`m.`), consultant (`bc.`), at 1440 and
375. Test accounts are local only and are not recorded here. Evidence captures (API bodies per role) live in the session
scratchpad, not in the repo.

State during the walk: 3 campaigns (2 active, 1 completed) + 1 created and launched during the walk, 8 channels all `testing`,
5 calendar entries, 1 segment (est. size 5,000), 1 tracked page (`/pricing`, 0/8), 22 recorded metric rows, funnel
5,800 impressions / 290 clicks / 31 conversions. The AI weekly readout for "FE walk push" is `ready`.
Test rows I created (posts, a campaign, a keyword, a segment, metric rows, a tracked page, a channel note) were deleted
or restored at the end, so the data looks as it did before the walk.

**Result: 75 control rows checked, 71 ✅, 3 ❌ (gap 1 and 2 medium, gap 3 low), 1 ⏳ pending the readout fix PR. Another five low notes (4, 5, 6, 8, 9) sit on rows that still pass. Marketing is not marked done, see the gaps table.** (Counted over every table row below, all roles and both widths; rows marked – were not run.)

Roles at a glance: founder and team member get identical data and identical controls on every page (all 11 marketing GETs return
the same 200 bodies); mentor and consultant get `403 FORBIDDEN` from every marketing endpoint and a clean "You don't have
access to this page." on every route and deep link, with no marketing data in search or notifications.

## Founder, 1440
| Control | Action | UI vs API | | Notes |
|---|---|---|---|---|
| Overview tiles | load `/marketing` | Scheduled this week 1, Active campaigns 3 (then 2 after the walk), Top channel Email, AI content ideas 14 = `GET /marketing` `{scheduled_this_week:1, active_campaigns:3, top_channel_by_conversions:"email", ai_content_ideas:14}` | ❌ | the 14 counts two content-gap runs (old 7 + new 7), the SEO page shows only the newest 7 (gap 1) |
| Overview "Draft it" idea | load | "Same-Day Settlement in Lagos…" = first gap of the newest ready run | ✅ | |
| Calendar month | load Oct 2026 | 5 entries on the right days, times in WAT (08:00Z shows 9:00 AM) = `calendar-entries` | ✅ | |
| Calendar Prev / Next / Today | click ×4 | Oct → Nov → Dec → Oct; Today returns to the current week | ✅ | |
| Calendar month → week | click Week | shows Sep 27 to Oct 3, not the week of today (Oct 18 to 24); Today fixes it | ❌ | gap 3 |
| Drag to reschedule | drag a scheduled post Fri 23 → Sat 24 | API `scheduled_at` 2026-10-23T13:30Z → 2026-10-24T13:30Z, time of day kept, UI moved | ✅ | |
| + New post, scheduled without a date | Add post | inline "A scheduled post needs a date and time.", no call | ✅ | |
| + New post, scheduled, date set | 10:15 WAT, Add post | API row `scheduled`, `scheduled_at` 2026-10-21T09:15:00Z, drawer closed, chip on the 21st | ✅ | |
| Edit drawer fields | open FE walk teaser | title, channel Email, Scheduled, 10/23/2026 02:30 PM, campaign "FE walk push", copy = API | ✅ | |
| Write with AI | open, Write options (real model) | 3 options in ~8 s; **Use this** fills the copy box; closing without saving changes nothing in the API | ✅ | |
| Media upload | choose `rewalk.png` in a new draft, Save | file appears in `GET /media` (70 B), entry `media_id` set | ✅ | file chosen by script, see "Not exercised" |
| Media remove | Remove from this post, Save | `media_id` null; library row stays | ✅ | |
| Media preview | open a post that has `hero.png` | tile says "Preview unavailable" | ✅ | honest: API `media.url` is a server path (`var/storage/…`), no served URL. Same as SOP caveat (gap 7) |
| Mark published | open a draft, Mark published | API `published`, `published_at` set, drawer closes | ✅ | |
| Delete post | Delete post → Keep it, then Yes, delete | Keep leaves it; Yes removes it from the API | ✅ | |
| Scheduler | post due 10:15:00 | API flipped to `published` at ~10:15:55 (`published_at` = scheduled time); notification `marketing.post.published` created 09:15:49Z | ✅ | ~50 s after due (worker tick) |
| Bell, live | no reload | "Scheduled post published: Rewalk scheduler probe, just now", count 9+ | ✅ | |
| Notification deep link | click it | drawer opens with the post, "Marked published at 10/21/2026, 10:15:00 AM" = `data.href` `/marketing/calendar?entry=<id>` | ✅ | |
| Plan my first week | click (real model) | 7 proposals, "Nothing is on your calendar until you add it" | ✅ | |
| Plan: Add one / Discard all | click | one draft created, rest dismissed, nothing else written | ✅ | the added draft got today 9:00 AM, already past (gap 4) |
| Campaigns list | load | name, objective, ₦ budget, period, CTR/CONV, channel mix, status = `campaigns` (5000000 minor → ₦50,000; 3.7% / 10.0%; "No data yet" where `metrics` all 0) | ✅ | |
| Wizard (5 steps) | name, referral 100%, budget ₦1,000, Create and launch | API: `active`, `budget` 100000, `channel_mix {referral:100}`; review page matched the inputs; segment list shows "~5,000" = `est_size` | ✅ | |
| Launch → channel auto-status | Referral was "Not started" | after launch Referral = `testing`; the other channels untouched | ✅ | |
| Campaign Edit drawer | open "FE walk wizard" | name, objective, ₦50,000, each slider and its ₦ amount (22% = ₦11,000) = API | ✅ | AI "Recommend a split" not run (budget) |
| Campaign detail totals | open "FE walk push" | Impressions 3,800, Clicks 140, Conversions 14, Spend ₦7,500, CTR 3.7%, Conv 10.0% = `/performance` | ✅ | |
| Campaign range select | Last 7 days | UI = `?range=7d` response | ✅ | all test data is inside 7 days |
| Campaign charts | per-day + estimated split by channel | dates Oct 17, 18, 20, 21 and Email/Search bars = `series` and `by_channel`; "Estimated" label with the 60/40 sentence shown | ✅ | |
| Readout card | load | headline, wins, watch, next step, "Written by AI…" label = `/readouts` | ✅ **FE integrated** (`fix/marketing-be-integrations`) | Was: text said "750000 spent" (minor units, unformatted) and "2,400 impressions" where the series sums to 2,500 |
| Campaign links | Posts on the calendar, AI copy written for it, audience, channels | lists = linked posts / copy generations / `segment_ids` / `channel_mix` | ✅ | |
| Copy form | load | channel + platform options = `/copy/platforms` (X 280, Instagram 2200, LinkedIn 3000, Facebook 500, WhatsApp 1024, Google Ads 30 / 90, email subject 60) | ✅ | |
| Copy generate | X, "Same-day settlement for Lagos merchants" (real model) | 3 variants; counters 189 / 167 / 175 of 280 = `output.lengths` = real string lengths | ✅ | |
| Copy Refine | variant 1, "Make it shorter, under 140 characters" (real model) | 3 new variants (83 / 83 / 95), "Back to the original set" link | ✅ | |
| Copy **Use** | variant 1 | API: new `draft` entry, `organic_social`, body = variant; opens `/marketing/calendar?entry=<id>` drawer | ✅ | |
| Copy History | open tab | newest two runs at the top with times (10:14:54, 10:14:16 AM = 09:14Z), earlier runs below | ✅ | |
| Channels | load | 8 cards: status, fit level + note, "as of 9:42:52 AM" (= 08:42:52Z), email "400 visits, 0 clicks, 5 conversions, ₦50 spent" (= `stats_30d`, 5000 minor) | ✅ | |
| Channel status | Referral → Not started | persisted in API | ✅ | |
| Channel notes | Edit notes, Save notes | `notes` saved in API; cleared afterwards | ✅ | |
| Fit notes (AI) | not run | n/a | – | budget; same job as before |
| SEO keywords | + Add keyword (typed) | API `volume "2.4K"`, `difficulty 35`, `source manual`; row says "Estimated by you, updated 10/21/2026" | ✅ | honesty label |
| SEO content gaps | Find content ideas (real model) | 7 new ideas about same-day settlement in Lagos; "Write it" = `/marketing/copy?message=…(keyword: …)` | ✅ | before the run the page still showed an old, off-brand set ("automated daily savings", FDIC), gap 9 |
| SEO tracked page | add `/rewalk-about`, tick Title tag, untick, Remove → Confirm | `checklist.title_tag` true → false, page created and removed, counter 1/8 | ✅ | |
| SEO positioning | load | five fields + statement = `/positioning` | ✅ | Save not re-run |
| Segments list | load | "Walk test merchants", Location Lagos, Retail shop, mobile first, Found via Email, "~5,000 (your estimate)", persona = API | ✅ | |
| Segment builder | empty Save | "Give the segment a name." (stays after typing, gap 8); filled Save created `{location: Abuja, behaviour_tags:[cash heavy]}`, `est_size` 1200 | ✅ | |
| Segment delete | Delete → Confirm delete / Keep | Keep leaves it; Confirm removes it from the API | ✅ | |
| Analytics KPIs | load | 5,800 / 290 / 31 / 5.0% / 10.7% = `funnel` | ✅ | |
| Analytics CAC cards | load | Organic social ₦15 (1500), Email ₦326.5 (32650), Referral "No conversions yet", "ESTIMATED" labels = `cac_by_channel`; leaderboard FE walk push ₦535.71 (53571) | ✅ | decimals differ (₦326.5 vs ₦535.71), gap 6 |
| Analytics traffic | load | one week 10-12 = 400 | ✅ | |
| Record metric | visits 77, whole business | row in API; traffic chart got a second week (10-19, 77) without reload | ✅ | |
| Delete metric | Delete → Delete entry | row gone, chart back to one week | ✅ | |
| Recorded entries list | load | 22 rows, scope text and ₦ amounts = `/metrics` (300000 → ₦3,000) | ✅ | |
| Export CSV | click | `marketing-metrics-30d.csv`, header `date,scope,channel,campaign,metric,value`, 23 rows = API; spend values are in minor units (30000) with no unit | ❌ | gap 2 |
| Honesty labels | read | "Status only, not posted to a platform…" (calendar), "These numbers are the ones recorded under Analytics. Nothing syncs from an ad platform." (campaign), "Every number here is one you recorded…" (analytics), "The AI's judgement, not data." (channels), "Estimated by you" (keywords), "(your estimate)" (segments), "Estimated" (channel split) | ✅ | |
| Search ⌘K (API) | `FE walk`, `Rewalk`, `Walk test`, `teaser` | campaigns, posts, segments found; links go to `/marketing/campaigns` or `/marketing/calendar`, not to the item | ✅ | low gap 5 |

## Founder, 375
| Control | Action | Result | | Notes |
|---|---|---|---|---|
| All 8 routes | load | `scrollWidth` 375 on every page, no sideways page scroll | ✅ | |
| Calendar | load | agenda list grouped by day, entries open the same drawer; no Month/Week toggle and no drag (touch drag not offered, the date field is the way to move a post) | ✅ | known, in the SOP |
| Post drawer | `?entry=<id>` | full width 375, Write with AI, library, Delete post, Mark published, Save all reachable | ✅ | |
| Campaigns | load | cards instead of a table, all four actions present | ✅ | |
| Campaign detail | load | charts 293 px wide, readout wraps | ✅ | |
| Analytics | load, + Record metric | tables scroll inside their card (542 / 341), drawer 375 wide with the button at the bottom | ✅ | |
| Copy, Channels, SEO, Segments | load | content = 1440 content, no overflow | ✅ | |

## Team member, 1440 (`tm.`) and 375
| Control | Action | Result (API) | | Notes |
|---|---|---|---|---|
| Same data | Overview, Calendar, Campaigns, Channels, Analytics, SEO | values and rows equal the founder's (also the raw 200 bodies) | ✅ | |
| Create / delete post | + New post "TM rewalk draft", then Delete post → Yes | `created_by` = the TM user; gone after delete | ✅ | |
| Drag reschedule | Sat 24 → Fri 23 | API 2026-10-23T13:30Z | ✅ | |
| Campaign Pause / Resume / Delete | on the launch test campaign | `paused` → `active` → confirm "Delete … cannot be undone" → gone | ✅ | channel stays `testing` |
| Record / delete metric | visits 33 | row, chart week 10-19 = 33, then removed | ✅ | |
| Keyword delete | Delete → Confirm | gone from the API | ✅ | |
| Bell: "Campaign performance summary ready: FE walk push" → See results | click | lands on `/marketing/campaigns/<id>`, detail loads | ✅ | |
| TM bell | open | `marketing.post.published`, `marketing.campaign.launched` rows | ✅ | the founder's own launch does not notify the founder |
| 375 | Analytics, Campaigns, Copy | no overflow, KPIs equal, Pause/Complete/Edit/Delete present | ✅ | |
| AI generation as TM | not re-run (budget) | same endpoints and permission as the founder | – | |

## Mentor and consultant, 1440 and 375
| Control | Action | Result | | Notes |
|---|---|---|---|---|
| Sidebar | load `/dashboard` | no Marketing link (mentor: Dashboard, Health, Roadmap, Business Builder, Documents, Analytics & Reports, Notifications, Settings; consultant: Dashboard, Notifications) | ✅ | |
| `/marketing`, `/calendar`, `/campaigns`, `/campaigns/<id>`, `/copy`, `/channels`, `/seo`, `/segments`, `/analytics` | type the URL | "You don't have access to this page. Your role in this workspace doesn't include…", URL kept, no flash of data, no redirect loop | ✅ | 4 routes at 375 too |
| Deep link `/marketing/calendar?entry=<real id>` | open | same denial, the post title never renders | ✅ | |
| Raw API, 11 GETs + `GET /marketing` | each role | 403 `FORBIDDEN` "You don't have permission to do that." on all | ✅ | |
| Search (API) | `teaser`, `Rewalk`, `FE walk`, `Walk test`, `settlement`, `campaign`, `probe` | 0 results for both roles (founder gets 1 to 5) | ✅ | no marketing and no validation leak |
| Notifications (API, 38 / 41 rows) | list | 0 `marketing.*` rows for both roles | ✅ | |

## Not exercised, said plainly
- Real file picker for media (the file was handed to the input by script, same upload path), the 5 MB and 200-image caps.
- Alt+Arrow keyboard reschedule, drag of an unscheduled draft onto a day, "Choose from library".
- AI: "Recommend a split", "Generate AI fit notes", and AI generation as team member (budget).
- Campaign **Complete** and the segment "Used in" list, positioning **Save**.
- In-app ⌘K UI as mentor/consultant (the API behind it was checked for all four roles).
- A readout generated by the weekly job on its own schedule (the card shown was generated earlier today).

## Gaps found
| # | Severity | Where | What I saw | Likely owner |
|---|---|---|---|---|
| R | Fixed (API #161 + FE `fix/marketing-be-integrations`) | Campaign readout | "750000 spent" in minor units, "2,400 impressions" vs the series' 2,500, "Last week had zero activity" | Card now renders every number from `figures[*].display` (This week / Last week / Change / All time table). Live: an old row with `figures: null` shows prose only; a row with figures was checked by replaying the BE's captured `campaign_readouts.json` through the real card at 1440 and 375 (the weekly job writes new rows, none exists yet on the local account). |
| 1 | Medium | Overview "AI content ideas" | Shows 14 (`ai_content_ideas`), but the SEO page lists the newest run only (7). The count adds every content-gap run | BE: count the newest ready run |
| 2 | Medium | Analytics Export CSV | `value` for `spend` is in minor units (30000) and the file has no unit note, while the page shows ₦300 | FE: export ₦ or add `spend_naira` / a unit column **Fixed in the `fix/marketing-rewalk-fe` PR.** |
| 3 | Low | Calendar week view | Month → Week jumps to the first week of the month (Sep 27 to Oct 3) instead of the week of today; the posts are off screen until Today is clicked | FE **Fixed in the `fix/marketing-rewalk-fe` PR.** |
| 4 | Low | Plan my first week | The first proposal is dated today 9:00 AM, which was already past at 10:17; the button still says "first week" once posts exist | BE prompt / FE label FE part (label) fixed in the `fix/marketing-rewalk-fe` PR: reads "Plan another week" once posts exist. Past-dated slot is still BE. |
| 5 | Low | ⌘K search | Campaign, post and segment hits link to the list page, not to the item (`?entry=<id>`, `/campaigns/<id>`) | BE hrefs **Fixed (API #162 + FE `fix/marketing-be-integrations`).** Live as founder: ⌘K `scheduled teaser` + Enter opens the post's drawer at `/marketing/calendar?entry=<id>`; the campaign hit opens `/marketing/campaigns/<id>`; segment hit goes to `/marketing/segments`. No FE route work was needed. |
| 6 | Low | Analytics CAC | `₦326.5` on the cards, `₦535.71` in the leaderboard (decimal places differ) | FE formatter **Fixed in the `fix/marketing-rewalk-fe` PR.** |
| 7 | Low, known | Media preview | Every image shows "Preview unavailable" because the API returns a server path; honest label, no fix until media is served | BE (Cloudinary/serve URL) **Fixed (API #162 + FE `fix/marketing-be-integrations`).** The drawer fetches `GET /marketing/media/{id}/file` as a blob with the bearer header; live at 1440 and 375 the `hero.png` thumbnail renders (a blob: URL, 40-byte PNG). Cloudinary 302 not exercised (BE guide §15 says the same). |
| 8 | Low | Segment builder | "Give the segment a name." stays on screen after a name is typed, until Save is pressed again | FE **Fixed in the `fix/marketing-rewalk-fe` PR.** |
| 9 | Low | SEO content gaps | The previous run's off-brand ideas ("automated daily savings", FDIC) stay listed until the founder regenerates | BE: stale-run hint, or regenerate on context change **Fixed (API #162 + FE `fix/marketing-be-integrations`).** Live: runs with `stale: true` show "Your brand details changed since these ideas were written" + Regenerate (1440 and 375); the old 7 ideas stayed visible while generating; after the new run was ready the notice was gone and the API read `[false, true, true]` (only the newest ready run counts). |

Browser note, not a product bug: the browser pane shares one cookie/localStorage profile across `localhost`, `tm.localhost`,
`m.localhost` and `bc.localhost`, so a later login on another host replaced the founder's session on `localhost`. I logged in
again; nothing else was affected.

## Fix status (`fix/marketing-rewalk-fe`)
Fixed in the FE PR and checked live on localhost:8000: 2 (CSV now in naira with a `unit` column, built client-side from the API file because the BE writes minor units), 3, 4 (label only), 6, 8.
Integrated in `fix/marketing-be-integrations`: #161 readout figures, gap 9 `stale` flag (Regenerate prompt), gap 5 item hrefs, gap 7 media file preview. Left for the lead's re-walk on develop.
