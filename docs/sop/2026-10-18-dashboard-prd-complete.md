# SOP — Founder Dashboard brought fully to the PRD (all 20 gap rows)

## What shipped

The founder Dashboard and the global shell it renders now meet PRD §2.1 (App Shell), Module 02 §02.1,
§01.6 step 6 and §04.5, with no mock data, no dead clicks and no fake loading defaults. It wires the
five backend slices that landed for this page: KPI tiles + trends/alerts (BE #129, #134), briefing v2
(#130), team invitations (#131), global search (#132) and realtime activity (#133). One FE PR to
`develop`, built on FE PR #101 (KPI tile statuses). Checklist: `docs/checklist/dashboard-prd-gaps.md`.

## Why

A live walkthrough of the page against the PRD found 20 gaps: fake defaults on first paint, Risks and
Opportunities that always read "empty", no Do it, a Tell me more that opened an empty chat, a
"+ Invite" that said "coming soon", a ⌘K overlay that was a hardcoded list, no mobile tab bar, no
role-based hiding, and more. Decisions D-DASH-1..4 (Do it adds to today's mission, realtime reuses the
notifications stream, search covers everything that exists, KPI extras built now) are in the checklist.

## How

| Area | Approach |
|---|---|
| First paint | `useDashboardSummary` starts `loading`; every card renders a skeleton (`components/dashboard/card-states.tsx`). `DEFAULT_SUMMARY`, the `/auth/me` + `/onboarding/state` name hunt and the localStorage name cache are gone: the greeting reads `summary.greeting` only |
| Errors | Each card errors on its own with the PRD copy "Couldn't load this." + Retry. A failed summary errors every summary card, not one big banner |
| Briefing v2 | `mapSummary` maps `risks.items` / `opportunities.items` to rows (severity dot, text, Review/See fit to `href`, no CTA when `href` is null) and `briefing.actions` to Do it. Do it calls `POST /dashboard/briefing/{id}/actions/{n}/accept`, then refetches; `navigate` actions `router.push(href)`. Accepted tasks read "Added to today's mission" linking to `/mission`. 409 `BRIEFING_STALE` refetches instead of retrying. `restricted` hides all three cards |
| Tell me more | `openAiDrawer({ seed })`. The drawer starts a new conversation and sends the briefing as its first message (the BE chat has no "context" parameter, so the seed is a visible user message) |
| Mission card | Real completion (`PATCH /missions/tasks/{id}` `complete`, then refetch); it used to flip a local checkbox and show a "saved" toast with no request. `empty_reason` copy: `weekend_off` "Weekends off. Rest is a strategy too." (+ mission settings link), `all_caught_up`, `mission: null` asks for the assessment. Read-only ticks for roles without mission access |
| KPI extras | `trendFields` turns `trend` into a week-over-week chip ("+₦10.0K vs last week", "No change vs last week", none when `delta` is null) and a sparkline needing 2+ points. No `trend` on restricted tiles |
| Invite | `components/team/invite-modal.tsx` + `lib/api/team.ts`: repeatable rows, label to role value (Co-Founder to `founder`, hint "Co-Founders get full access."), shows created / skipped / undelivered separately, 422 per-row errors, 403/429 messages. "+ Invite" only for founders |
| Search | `SearchProvider` in the layout owns ⌘K and the overlay (works on every page). `useGlobalSearch`: 250 ms debounce, abort stale requests, 2-char minimum hint, grouped results, arrow keys + Enter, `router.push(href)`. Placeholder "Search anything, docs, tasks, conversations…" (no "contacts", comma not dash) |
| Realtime | `RealtimeProvider` holds one SSE connection (ticket per connect, backoff reconnect, `resync` on reconnect and tab focus). `activity.created` prepends (deduped by id); `revoked` closes and signs the user out; `notification.created` / `unread` drive the bell. One `NotificationsProvider` now feeds the bell, sidebar badge and tab bar (they each fetched before) |
| Shell | Mobile bottom tab bar at `sm` (`md:hidden`; the repo bans the `sm:` prefix), AI dock tooltip "Ask your AI Co-Founder" + ⌘J, sidebar Today's Mission badge, role-based hiding, avatar menu Profile / Preferences / Sign out, Next 7 days with due dates linking to `/roadmap/milestones` |

Decisions and rejected alternatives:

- **Role comes from the workspace in use, not `/auth/me`'s `active_workspace_id`.** Found live: signup auto-creates a draft workspace, so an invited mentor's `active_workspace_id` is their own founder workspace while the app (via `X-Workspace-Id`) acts in the shared one. Using it showed the mentor founder nav and "+ Invite". `effectiveWorkspaceId` prefers the stored id when the caller is a member.
- **Nav access follows the API where it disagrees with the PRD.** PRD says an accountant sees Calendar, but `GET /calendar/events` is 403 for non-core roles (mentor verified live), so Calendar is core-only. Hiding beats a 403 page. Matrix: `lib/nav-access.ts`.
- **Roles without AI access get no dock, drawer or ⌘J** (`/ai/conversations` is 403 for them).
- A custom role dropdown was replaced by a native `<select>` in the invite modal (keyboard and screen reader behaviour for free).
- Rejected: one big "Unable to load dashboard" banner (PRD wants per-card errors); a per-role "Not available" tile (reads as broken).

## What's involved

- New: `lib/nav-access.ts`, `lib/api/{search,team}.ts`, `lib/realtime/stream.ts`, `components/{workspace-context,realtime-context,mobile-tab-bar}.tsx`, `components/search/*`, `components/team/invite-modal.tsx`, `components/dashboard/{card-states,health-card,mission-card,briefing-card,risks-opportunities,activity-upcoming,calibration-banner,sparkline}.tsx`, `hooks/{useGlobalSearch,useMissionOpenCount}.ts`.
- Rewritten: `app/(dashboard)/dashboard/page.tsx` (1175 lines to ~190, composition only), `components/dashboardnavbar.tsx` (self-contained top bar), `app/(dashboard)/layout.tsx` (providers + tab bar), `hooks/useDashboardApi.ts`, `hooks/useNotifications.ts` (now a provider + `notificationHref`).
- Edited: `components/sidebar.tsx`, `components/ai-drawer*.tsx`, `components/dashboard/{kpi-strip,greeting-header}.tsx`, `lib/api/dashboard.ts`, `types/dashboard.ts`, `lib/api/client.ts` (exports `API_BASE`), `app/(dashboard)/notifications/page.tsx` (`?tab=preferences`), `next.config.ts`.
- Deleted (dead, unreferenced): `components/dashboard/{core-engine,intelligence-feeds,temporal-feeds}.tsx`.
- Config: `next.config.ts` sets `compress: false` in development only. gzip in Next's rewrite proxy buffers the SSE stream, so nothing live ever reached the browser through the dev proxy (found live: the connection opened, no frames). Production calls the API origin directly and is unaffected.
- No migrations, no env vars.

## Verification

See the checklist for the per-row live evidence. Summary:

- CI gates run locally (the exact set in `.github/workflows/ci.yml`): `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, `npm run test:e2e`: all green (typecheck, lint, 444 unit tests, production build, 153 e2e).
- Accessibility: not part of CI for the dashboard (the axe sweep is marketing-only), so a throwaway axe run (WCAG A/AA) against the live dashboard at 1440px and 375px, also with the search and invite dialogs open, found only colour-contrast failures, all fixed (sage-400 text and the white-on-copper Tell me more button). Zero violations after.
- Live on the local full stack (BE integration branch in docker, FE `:3004`, throwaway founder + a mentor invited from the UI and accepted via the emailed link) at desktop and 375px: every row of the gap list, every CTA clicked.
- Founder walk: skeleton then real data, ⌘K search to navigation by keyboard, invite (422 per row, created + skipped), mission tick (real PATCH, Tasks KPI 0 to 1, sidebar badge followed), Tell me more (seeded conversation), ⌘J, hover label, avatar menu Preferences, live activity (rows arrived without reload for adds and completes).
- Mentor walk: no "+ Invite", nav cut to Dashboard / Health / Roadmap / Business Builder / Documents / Analytics / bottom links, no AI dock, briefing/risks/opportunities cards hidden, restricted KPI tiles hidden, read-only mission, greeting "Good morning." (empty `first_name`), workspace name from memberships.
- Not exercisable live (stated, not guessed): KPI trend delta/sparkline from the nightly job (needs a 7-day-old snapshot; rendered live with the guide's captured payload injected), investor/accountant roles (no way to create them from the UI), BRIEFING_STALE/NOT_READY, per-tile `{error: true}`, INVITE_LIMIT_REACHED / rate limit, SSE `revoked`. Each is covered by a unit test.

## Operate / roll back

No deploy steps beyond the normal FE release. The SSE stream needs the API origin to be reachable from the browser (`NEXT_PUBLIC_API_BASE_URL`) and to stream, not buffer, `text/event-stream`. Revert the PR to restore the previous page; the BE slices are additive and independent.

## Follow-ups

- Other route shells (`/sales`, `/mission`, ...) still render their own headers: ⌘K now works everywhere, but the top bar search box and "+ Invite" only exist on the Dashboard. Making the top bar a layout region is the natural next step.
- PRD says an accountant sees Calendar; the API says no. Needs a product decision (change the API or the PRD).
- Finance/Marketing hub CTAs from `no_data` KPI tiles land on pages still being wired in parallel PRs.
- Search results mostly deep-link to a module's list page (only documents and conversations deep-link to the item): a BE improvement.
- A resend action for `undelivered` invitations arrives with the Team page.
- Leftovers on the local throwaway data: see the PR body.
