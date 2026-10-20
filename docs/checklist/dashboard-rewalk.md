# Dashboard: click-through re-walk (develop)

`/dashboard` walked on merged `develop`, local stack, 2026-10-20, workspace NovaPay. FE code = `5025154` (the `develop` checkout
serving :3000; `origin/develop` `2d034e6` differs only by docs, #118/#119). API `ed282f4` (#151) on :8000. Real model.
Each row: control → action → result checked against the raw API (`GET /dashboard/summary`, `/search`, `/notifications`,
`/missions/today`, with `X-Workspace-Id`) → ✅/❌. Roles: founder (`localhost:3000`), team member (`tm.`), consultant (`bc.`),
mentor (`m.`), at 1440 and 375. Test accounts are local only and are not recorded here.

State during the walk: Health 95 (+5), mission 3 tasks + one added by "Do it", KPI `revenue`/`runway`/`campaign_ctr` = `no_data`,
`pipeline` = `not_built`, assessment complete, briefing/risks/opportunities `ready` (2 risks, 2 opportunities, 3 actions).
Mentor and consultant: `briefing`/`risks`/`opportunities` = `restricted`, revenue/runway/CTR tiles `restricted`.

## Founder, 1440
| Control | Action | Result (API) | | Notes |
|---|---|---|---|---|
| Greeting | load | `Good afternoon, Victor.` = `greeting.first_name` "Victor" | ✅ | |
| Sidebar | load | all hubs incl. Journal; Today's Mission badge 3 | ✅ | |
| + Invite | open | "Invite to NovaPay", role list Co-Founder / Team Member / Mentor / Accountant / Legal Advisor / Business Consultant | ✅ | |
| + Invite bad email | `not-an-email` → Send | inline "Enter a valid email address.", no call | ✅ | |
| + Invite existing member | `rewalk-tm@…` → Send | "No new invitations were sent. Skipped 1 (already a member or already invited)." + Done closes | ✅ | the created path was not re-run: it sends a real email (covered 2026-10-18) |
| Briefing **Do it** (task) ×2 | "Start tracking runway…" | row becomes "Added to today's mission"; new task in the mission card; badge 3 → 4; API `accepted: true` + `mission_task_id` | ✅ | |
| Mission checkbox | tick the new task | task `done` in API; `tasks_done_this_week` 7 → 8; badge 4 → 3 | ✅ | a done task cannot be unticked from the dashboard (second click no-op), seems by design |
| ⌘K → "journal" → Enter | open, type, Enter | one Pages result "Journal" (`/search`), lands on `/journal` | ✅ | |
| Avatar menu / health chip / KPI tiles / risk + opportunity links / Tell me more / ⌘J / bell | clicked as team member and mentor (same components, same API) | see below | ✅ | not repeated as founder |

## Team member, 1440 (full dashboard, no + Invite, no Journal)
| Control | Action | Result (API) | | Notes |
|---|---|---|---|---|
| Greeting | load | `Good afternoon.` (`first_name` ""; account has no name) | ✅ | graceful, no stray comma |
| Health chip / "See what's driving it" | click | `/health` | ✅ | |
| Mission checkbox, **Go to mission →** | tick "Complete today's mission tasks" / link | `done` in API; `/mission` opens | ✅ | |
| KPI tiles | Monthly revenue, Runway, Pipeline value, Campaign CTR, Tasks this week | `/finance`, `/finance`, `/sales`, `/marketing`, `/mission`; tile values equal summary (`No data yet` ×3, `Coming Soon`, 6 → 7) | ✅ | |
| Briefing **Do it** (task) | "Complete today's mission tasks" | "Added to today's mission", mission list + badge 3 → 4, API `accepted` true | ✅ | |
| Briefing **Do it** (navigate) | "Review deadlines…" | lands on `/roadmap`; API `accepted` true | ✅ | |
| **Tell me more** | click | drawer opens with the briefing as the first user turn; real reply arrived (~15 s) | ✅ | reply repeats "health score of 88" (see gap 8) |
| AI dock + ⌘J | hover; ⌘J ×3 | tooltip "Ask your AI Co-Founder ⌘J"; ⌘J toggles open/closed/open | ✅ | Escape does not close the drawer (gap 5); the X does |
| Risks **Review** ×2 | click | `/finance`, `/mission` = API `risks.items[].href` | ✅ | |
| Opportunities **See fit** ×2 | click | `/mission`, `/finance` = API `opportunities.items[].href` | ✅ | |
| Team activity | tick a task | two rows ("A teammate added…", "A teammate completed…", "just now") arrived without reload | ✅ | realtime |
| Next 7 days | click row | `/roadmap/milestones`; 2 rows = API `upcoming` | ✅ | |
| Bell | open; click an insight notification, click "Your daily AI briefing is ready" | list = API; `/validation/interviews?insight={id}` and `/dashboard`; unread 24 → 22 | ✅ | |
| ⌘K | `a` | "Type at least 2 characters"; Escape closes | ✅ | |
| ⌘K | "assessment" | "No results" and `/search` empty, though Assessment is in this role's sidebar | ❌ minor | gap 9 |

## Consultant and mentor, 1440
Both see: Health card, Today's Mission, 1 KPI tile (Pipeline value) + Tasks this week, Team activity, Next 7 days. No briefing, risks,
opportunities, revenue/runway/CTR tiles, `+ Invite`, AI dock (all `restricted` in the API). Nav: Dashboard, Health, Roadmap, Business
Builder, Documents, Analytics. Mission checkboxes are not rendered as controls (read-only).
| Control | Action | Result (API) | | Notes |
|---|---|---|---|---|
| Health chip | click | `/health` | ✅ | |
| Next 7 days | click | `/roadmap/milestones` | ✅ | |
| **Go to mission →** | click | "You don't have access to this page." (`GET /missions/today` is 403 for both roles) | ❌ | gap 1 |
| Pipeline value tile | click | `/sales` → "You don't have access to this page." | ❌ minor | gap 4 |
| ⌘K "problem" | open, ArrowDown ×7, Enter | 10 results = `/search` (milestone, 5 roadmap tasks, **4 mission tasks**); a Mission result opens `/mission` → no-access page | ❌ | gap 2 |
| ⌘K | `zzqq`; Escape | "No results for ‘zzqq’."; Escape closes | ✅ | |
| Bell | open (mentor) | lists `healthscore.record`, `assessment.completed`, **"Your daily AI briefing is ready"**, **"Your mission for today is ready"**, business suggestion/artifact events | ❌ | gap 3 |
| Bell | click "mission for today is ready" (mentor) | stays on `/dashboard`, nothing visible happens | ❌ | gap 3 |
| Avatar menu | open; Profile / Preferences / Settings & billing | `/account` (honest "coming soon" copy), `/notifications?tab=preferences`, `/settings`; Sign out present | ✅ | footer subtitle reads "Founder" (gap 6) |
| `+ Invite` on `/notifications` (mentor) | click | button is shown on this page and toasts "Invite modal opened." with no modal | ❌ | gap 7; hidden on `/dashboard` |
| Consultant: Escape closes ⌘K | | | ✅ | |

## 375 (all four roles)
| Check | Result | |
|---|---|---|
| Founder | no horizontal scroll (`scrollWidth` 375, 0 overflowing nodes); header: avatar, search, bell, `+ Invite` fit; tab bar Home / Mission / AI / Notifications / More; all 12 cards stack | ✅ |
| Team member | same cards minus `+ Invite`; tabs Home / Mission / AI / Notifications; each tab opened (`/mission`, `/ai`, `/notifications`) | ✅ |
| Mentor, consultant | tabs Home / Notifications / More only; 4 cards (Health, Mission, Activity, Next 7 days); More opens the sidebar (6 nav items); bell panel opens; no overflow | ✅ |
| AI floating button | overlaps the Today's Mission text at the bottom right; the tab bar already has an AI tab | ❌ minor (gap 10) |

## Gap rows (FE rows 1 (FE half), 4, 5, 6, 7, 10 fixed in the `feat-dashboard-fe-rows` PR; BE rows 1-3, 8, 9 fixed by cofoundaz-api #153)
| # | Sev | Role | Gap | Where | Status |
|---|---|---|---|---|---|
| 1 | medium | mentor, consultant | `GET /dashboard/summary` returns `mission` (tasks, titles, reasons) to roles whose `GET /missions/today` is 403, so the card and "Go to mission →" lead to a no-access page. Either hide the card and `mission` for these roles or give them read access | BE `dashboard` summary; FE `mission-card.tsx` | **Fixed in PR** (`docs/sop/dashboard-rewalk-fe-rows.md`) |
| 2 | medium | mentor, consultant | `GET /search` returns `mission_task` rows to roles with no mission access; selecting one hits the no-access page. Pages are already role-filtered (mentor gets no Finance), mission tasks are not | BE search |
| 3 | medium | mentor, consultant | Notification audience: `dashboard.briefing.ready` (briefing is `restricted`), `mission.ready`, `mission.completed` reach roles that cannot open those features. Same class as #150 (Validation) and Assessment gap 6; clicking `mission.ready` as mentor silently stays on `/dashboard` | BE notification subscribers |
| 4 | minor | mentor, consultant | Pipeline value tile links to `/sales`, a no-access page for them; render the tile without a link | FE `kpi-strip.tsx` | **Fixed in PR** (`docs/sop/dashboard-rewalk-fe-rows.md`) |
| 5 | minor | all | Escape does not close the AI drawer (X and ⌘J do) | FE AI drawer | **Fixed in PR** (`docs/sop/dashboard-rewalk-fe-rows.md`) |
| 6 | minor | mentor, consultant, TM | Avatar footer shows `profile.role_title` ("Founder") instead of the workspace role | FE sidebar footer | **Fixed in PR** (`docs/sop/dashboard-rewalk-fe-rows.md`) |
| 7 | minor | non-founders | A second `+ Invite` in the older top bar (seen on `/notifications` as mentor, `/sales` as team member) shows to everyone and only toasts "Invite modal opened." Known item "ShellTopBar on the remaining section layouts"; here it is a visible fake control | FE section layouts | **Fixed in PR** (`docs/sop/dashboard-rewalk-fe-rows.md`) |
| 8 | minor | founder, TM | The day's briefing text quotes the health score at generation time ("88") while the card shows the live score (95); "Tell me more" repeats the 88 | BE briefing prompt |
| 9 | minor | team member | Search omits the Assessment page although it is in this role's sidebar (founder gets it) | BE search page list |
| 10 | minor | all, 375 | AI floating button overlaps card text and duplicates the AI tab | FE `MobileTabBar` / dock | **Fixed in PR** (`docs/sop/dashboard-rewalk-fe-rows.md`) |

## Not exercised live (honest list)
- Created-invite path (`POST /team/invitations` success + emailed link): sends a real email; walked 2026-10-18, not repeated.
- Card error + Retry states: needs the API down or a forced 500 on the shared stack; unit only this pass.
- KPI `ok` values, week-over-week chip and sparkline, red `is_low` border: the account has no finance/marketing data and no 7-day-old snapshot.
- Calibration banner (`assessment_complete` is true) and Today's Mission `empty_reason` copies (not a weekend, tasks exist).
- `BRIEFING_STALE` / `BRIEFING_NOT_READY` 409s, realtime `revoked`, investor / accountant roles (cannot be created from the UI).
- KPI tile, risk/opportunity, Tell me more, ⌘J, bell and avatar controls were clicked as team member / mentor; the founder shares the same components and API but only Invite, Do it, checkbox, search and 375 were repeated as founder.
- Real-model output was checked on **Tell me more**; the briefing itself was generated earlier today (12:28 UTC), not regenerated.

## Verdict
**Dashboard: DONE for founder and team member** (every control behaves and equals the API; 375 clean). **Mentor / consultant: not fully
clean**: gaps 1-3 (mission data, mission search results and mission/briefing notifications reach roles that cannot open them) are the
same permission-leak class found on Assessment and Validation and should be fixed on the BE before the page counts as closed for those
roles. Gaps 4-10 are minor FE items.
