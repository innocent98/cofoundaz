# Dashboard: PRD gap list (live walkthrough, 2026-10-17)

Source of truth: `Cofoundaz_Technical_PRD.md` §2.1 (App Shell), Module 02 (§02.1 Dashboard), §01.6 (calibration
banner), §04.5 (weekend copy). Walked live in the browser pane (FE `develop` on :3000 → API :8000) as the local
test founder (NovaPay, Health 93, assessment done, finance/marketing data present), at 392px and 1440px.
Every row was checked live or confirmed in code, as marked.

Legend: ✅ meets PRD · ❌ gap · ⏳ fixed in an open PR

## Works (verified live)
- ✅ Greeting `Good evening, Victor.` / `Here's where NovaPay stands today.`
- ✅ Health card: 93 / of 100, `+3 this week`, summary line, `See what's driving it →` → /health
- ✅ AI Briefing card, `Co-Founder` badge, real AI text (status ready)
- ✅ Team activity rows `{actor} {verb} {entity} · {time}` (the 3 rows are 3 real assessment completions)
- ✅ Sidebar groups and order per §2.1. Workspace switcher. Avatar menu (account, settings, log out)
- ✅ Top bar: `Workspace / Dashboard` breadcrumb, Health chip (93 ↑ → /health), bell with unread count, `+ Invite`
- ✅ AI dock opens the chat drawer

## Gaps: all 20 closed (2026-10-18)

Legend: ✅ closed and verified live · "unit" = also covered by a unit/component test. Live = local full stack
(BE integration branch in docker, FE `:3004`), throwaway founder, plus a mentor invited from the UI and accepted via
the emailed link. Every row walked at desktop width and at 375px; every CTA clicked.

| # | Area | Status | How it was closed and verified |
|---|---|---|---|
| 1 | KPI strip | ✅ | FE #101 statuses + this PR's trends. Live: `no_data` ×3 + `not_built` (founder), `restricted` tiles hidden (mentor). `ok` values and trend chip + sparkline rendered live with the guide's captured payload injected (BE job needs a 7-day-old snapshot; not producible locally): `₦10.0K  +₦10.0K vs last week`, runway `1.5 mo`, red border from `is_low`, `-2.5 mo vs last week` red chip. Unit: `trendFields`, `mapKpis`, `KPIStrip` |
| 2 | Loading | ✅ | `DEFAULT_SUMMARY` and the name hunt removed; every card is a skeleton on first paint. Unit (page test asserts no "Founder", no Health 0, no default copy while loading). Live: skeletons then real data |
| 3 | Risks | ✅ | Rows: severity dot + text + **Review** → `href`; no link when `href` is null; empty copy only when `items` is empty. Live: see "Briefing v2 live" below. Unit: mapper + `RisksCard` |
| 4 | Opportunities | ✅ | Same, CTA **See fit**. Live: below. Unit |
| 5 | Briefing | ✅ | **Do it** → `POST …/accept`; task → "Added to today's mission" (links `/mission`), navigate → `router.push(href)`; 409 refetches. Live: below. Unit: `BriefingCard` (task, navigate, accepted, stale, 403) |
| 6 | Tell me more | ✅ | `openAiDrawer({ seed })` starts a new conversation and sends the briefing as the first message. Live: drawer opened with the seeded user turn and a "Thinking…" assistant turn, real reply polled. Unit: drawer + page tests |
| 7 | + Invite | ✅ | Modal wired to `POST /team/invitations`; labels → role values; created / skipped / undelivered; per-row 422; 403/429; hidden unless founder. Live (founder): bad email → inline `value is not a valid email address…` on row 1; mentor + own email → "Invited 1. Skipped 1 (already a member or already invited)." with both lists; mentor accepted the emailed link. Live (mentor): no button. Unit: modal, `lib/api/team`, navbar |
| 8 | ⌘K search | ✅ | `SearchProvider` + `SearchOverlay` on `GET /search`. Live: ⌘K opens it (also on `/roadmap`), "problem" → Roadmap group (milestone + 2 tasks), ArrowDown + Enter navigated to `/roadmap`; `a` → "Type at least 2 characters"; `zzqq` → "No results for ‘azzqq’."; placeholder has no "contacts" and no dash. Unit: hook (debounce/abort/retry), overlay (keyboard, groups, states), api |
| 9 | Mission widget | ✅ | `empty_reason`: `weekend_off` "Weekends off. Rest is a strategy too." + Mission settings link, `all_caught_up`, `mission: null`. Live via the real summary with `tasks`/`empty_reason` overridden in the response (the account has tasks, so the BE reason can't occur): both copies and links verified. Also fixed: the checkboxes never saved anything; now `PATCH /missions/tasks/{id}` then refetch (live: Tasks This Week 0 → 1, sidebar badge 5 → 4, activity row "completed 'Dash-live probe 3'" arrived live) |
| 10 | Next 7 days | ✅ | Real `due_on` → "Due Oct 24, 2026", row links to `/roadmap/milestones` (200). Live + unit |
| 11 | Calibration banner | ✅ | PRD copy + **Complete assessment** → `/assessment`, only when `assessment_complete === false`. Live: with the response overridden to `false` the banner showed and the link resolves; hidden for the real (complete) account. Unit |
| 12 | Card errors | ✅ | PRD "Couldn't load this." + Retry on every card, independently. Live: summary forced to 500 → 7 error cards (Health, Mission, Briefing, KPIs, Risks, Opportunities, Next 7 days) with 7 Retry buttons, Team activity (separate call) unaffected; Retry restored everything. Unit |
| 13 | Mobile (`sm`) | ✅ | `MobileTabBar` (Home, Mission, AI, Notifications, More) is `md:hidden` (the repo bans the `sm:` prefix, so the small-screen design is the base style). Live at 375px: five tabs, More opens the sidebar, Notifications badge, no horizontal overflow; mentor sees Home / Notifications / More only. Unit |
| 14 | AI dock | ✅ | Hover label "Ask your AI Co-Founder" + `⌘J`; ⌘J toggles (either letter case); the page's duplicate FAB removed. Live: tooltip visible on hover, ⌘J opened and closed the drawer. Roles without AI access (mentor) get no dock. Unit |
| 15 | Sidebar | ✅ | Today's Mission badge (open tasks, follows ticks and live activity); role-based hiding (hidden, not disabled); Journal founder-only. Live: founder badge 4 → 5 → 4; mentor nav is Dashboard / Health / Roadmap / Business Builder / Documents / Analytics + bottom links. Found and fixed live: role was read from `/auth/me` `active_workspace_id` (the mentor's own draft workspace) instead of the workspace in use. Unit: `nav-access`, sidebar, `effectiveWorkspaceId` |
| 16 | Avatar menu | ✅ | Profile, **Preferences** (→ `/notifications?tab=preferences`, tab now opens from the URL), Settings & billing, **Sign out**. Live: Preferences landed on the Preferences tab. Unit |
| 17 | Realtime | ✅ | One SSE connection (`RealtimeProvider`); `activity.created` prepends and dedupes by id, `revoked` signs out, `resync` on reconnect/refocus. Live: activity rows for adds and a completion appeared without reload; bell and sidebar badge follow. Found and fixed live: gzip in the dev rewrite proxy buffered the stream (`compress: false` in dev only). `revoked` unit only (can't revoke from the UI). Unit: stream client, provider |
| 18 | KPI extras | ✅ | Week-over-week chip + sparkline (see row 1); threshold notification `kpi.threshold.crossed` deep-links by metric. Live: the founder's real "Runway crossed 3 months: now 1.5 months" notification links to `/finance/runway` |
| 19 | Briefing notification | ✅ | "Your daily AI briefing is ready" arrives over the stream / feed and links to `/dashboard`. Live: the real notification in the bell links to `/dashboard`. Briefing v2 regeneration live: below |
| 20 | Role widget filtering | ✅ | Briefing, Risks, Opportunities hidden for `restricted`; restricted KPI tiles hidden; mission read-only without mission access; nav, tab bar, dock and "+ Invite" role-aware. Live as the mentor: all of the above. Investor / accountant roles can't be created from the UI: unit only |

### Briefing v2 live
Captured on 2026-10-18 00:00 UTC, when the BE rolled to a new day and the worker (real LLM) wrote a v2 briefing; the page polled while `generating` and filled in without a reload:
- Briefing card: text + three actions with **Do it**; Risks: 1 row with **Review** → `/finance`; Opportunities: 3 rows with **See fit** → `/roadmap`, `/finance`, `/validation`.
- **Do it** on a `task` action ("Define today's first customer-validation task"): button became "Added to today's mission" (link `/mission`), Today's Mission card showed the new task, sidebar badge "1 open task".
- **Do it** on a `navigate` action ("Review the upcoming deadline"): landed on `/roadmap`.
- Real weekend (Sunday UTC, `weekend_missions` off): Today's Mission said "Weekends off. Rest is a strategy too." with the Mission settings link, straight from the BE `empty_reason` (row 9, no override needed).
- 375px: no horizontal overflow; same cards stack.
- Not exercised live: `BRIEFING_STALE` / `BRIEFING_NOT_READY` (409), 403 for a non-core role: unit tests only.

## Cleanup (what the walkthrough left on the local stack)
No delete API exists for these, so they remain: mentor user `throwaway-mentor+dashfe1@…` (own draft workspace + membership in NovaPay + accepted invitation); mission tasks "Dash-live realtime probe", "Dash-live probe 2", "Dash-live probe 3" (done) and the Do it task on the founder's missions; one AI conversation ("Tell me more about today's briefing…"); the notifications those actions produced. Nothing was committed to the BE checkout.

## Decisions (user, 2026-10-17)
- **D-DASH-1 Do it:** the AI proposes 1 to 3 actions. **Do it** adds the action as a task to today's mission (or deep-links when the action is a navigation). Nothing happens without a click.
- **D-DASH-2 Realtime:** reuse the existing notifications realtime stream to push activity events (PRD `workspace.{id}.activity`).
- **D-DASH-3 Search:** v1 covers everything that exists: pages, roadmap milestones/tasks, mission tasks, documents, AI conversations, journal (founder only), finance/marketing records. Every result navigates. Contacts join when Sales ships.
- **D-DASH-4 KPI extras now:** nightly `kpi_snapshots` → week-over-week deltas + sparklines, plus "{Metric} crossed {threshold}" alerts.

## Build order
BE (lead): 1 briefing v2 (risks/opps items, actions + accept, ready notification, mission empty reason) → 2 workspace invite → 3 search → 4 realtime activity → 5 KPI snapshots/alerts. Then one FE sub-session wires every row above, followed by a full live re-walk.
