# Dashboard re-walk: FE rows (gaps 1 FE side, 4, 5, 6, 7, 10)

**What shipped:** the FE half of `docs/checklist/dashboard-rewalk.md`, branch `claude/feat-dashboard-fe-rows-602bb8` (PR to `develop`, linked from the checklist). No BE change.

**Why:** the API (cofoundaz-api #153, rule D-MIS-8) now returns `mission: null` + `mission_status: "restricted"` to every role except founder and team member. The FE rendered the "no roadmap" empty state there, and a handful of controls still led mentor and consultant to a no-access page or showed fake chrome.

| Gap | Fix | Where |
|---|---|---|
| 1 | `mission_status` is mapped to `missionStatus: 'ok' \| 'restricted'` (only the literal `restricted` restricts; `ok`, absent and unknown values are `ok`). Restricted: no Mission card, no "no roadmap" copy, no "Go to mission" link, and the Tasks This Week tile is dropped (it counts mission tasks). `ok` with `mission: null` is still the no-roadmap state. If an older API omits the key, the role (`canSee('/mission')`) decides. The top row reflows to 1, 2 or 3 columns by the cards actually shown. | `types/dashboard.ts`, `lib/api/dashboard.ts`, `hooks/useDashboardApi.ts` (`mapSummary`), `app/(dashboard)/dashboard/page.tsx`, `components/dashboard/kpi-strip.tsx` |
| 4 | A KPI tile whose target page the role cannot open renders as a plain tile, not a link (`KPIStrip` takes `role`; Pipeline value is `/sales`). | `components/dashboard/kpi-strip.tsx` |
| 5 | Escape closes the AI drawer (same global key handler as Cmd/Ctrl+J; ignored when closed or already handled). | `components/ai-drawer.tsx` |
| 6 | Avatar footer shows the workspace role (`roleLabel(role)`: Founder, Team Member, Mentor, Business Consultant, ...), not the profile's free-text `role_title`. Blank while the role loads. | `lib/nav-access.ts`, `components/sidebar.tsx` |
| 7 | The ten older headers with a fake `+ Invite` (toast "Invite modal opened.") are replaced by `ShellTopBar`, which already carries search, Health chip, bell and the real invite modal, founder only. Layouts: sales, investor-readiness, marketplace, academy, legal, funding, documents, ai; pages: notifications, analytics-reports (its fake bell with a hard-coded "5" went with it). | `app/(dashboard)/*/layout.tsx`, `notifications/page.tsx`, `analytics-reports/page.tsx` |
| 10 | The floating AI button is `hidden md:flex`: below `md` the tab bar already has an AI tab (founder, team member) and the button covered card text. Tooltip and Cmd/Ctrl+J unchanged. | `components/ai-drawer.tsx` |

**Key decisions:** hide, not disable (consistent with the sidebar); fail open on an unknown `mission_status` value but still honour the role gate; reuse `ShellTopBar` instead of deleting the buttons so every section gets the same shell; no new component for the role label.

## Verification
- Unit: `page.test` (restricted, ok+null, older API), `useDashboardApi.test` (`missionStatus`), `kpi-strip.test` (no link, Tasks tile), `ai-drawer.test` (Escape, dock classes), `sidebar.test`, `nav-access.test`. Full suite 984 tests.
- E2E (`e2e/dashboard.spec.ts`, mocked with the guide's captured shapes): mentor restricted dashboard, no fake Invite, founder Escape + real invite modal + 375.
- CI gates run locally: `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, `npm run test:e2e` (green; e2e served on :3217 because :3000 was in use).
- Live (FE dev server on :3217 against the shared API :8000, `mission_status` read from the real response):

| Role | 1440 | 375 |
|---|---|---|
| Founder | Mission card, Pipeline link `/sales`, footer "Founder", Escape (real key) closes the drawer, `+ Invite` on `/documents` opens "Invite to NovaPay" | no overflow, no floating AI button, tabs Home/Mission/AI/Notifications/More |
| Team member | full cards, footer "Team Member", Escape closes, no `+ Invite` on `/sales` | no overflow, no floating button, tabs incl. AI |
| Mentor | `restricted`: cards Health/Activity/Next 7 days only, no Tasks tile, Pipeline is a `div`, footer "Mentor", no `+ Invite` on `/notifications` or `/documents` | no overflow, tabs Home/Notifications/More |
| Business consultant | same as mentor, footer "Business Consultant", no `+ Invite` on `/notifications` | same as mentor |

Not verified live: the `ok` + `mission: null` empty state and an older-API (no key) response (unit only; the local account has a roadmap).

## Operate / roll back
Pure FE; revert the PR. The API keys it reads (`mission_status`) are additive.

## Follow-ups
- Gap 8 (briefing quotes a stale score) is BE-fixed in #153 for new briefings; still shows in ones generated before the deploy.
- `MissionCard`'s `readOnly` prop is now unused by the dashboard page (kept; tested).
- `kpis.tasks_done_this_week` and `calibration` are still returned to every role by the API (guide, "Not changed").
- Remaining legacy headers outside `ShellTopBar`: none of the pages above; other hubs (marketing onward) still need the per-page walk.
