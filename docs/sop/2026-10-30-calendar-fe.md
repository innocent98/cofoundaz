# Calendar FE: wired to the real Calendar API

**What shipped.** `/calendar` (Month, Week, Agenda), `/calendar/milestones`, `/calendar/meetings`, `/calendar/reminders` and `/calendar/sync` now read and write the live Calendar API (API #194, migration 0079). No mock data is left. PR: feature/calendar-fe to `develop`.

## Why
The three pre-existing pages were a static mock (`CALENDAR_EVENTS_DATA`, hard-coded "July 2026", a toast stub, a fake "Connected as amara@kolo.africa"). Gap list `calendar-prd-gaps.md` F1 to F18.

## How
| Decision | Why |
|---|---|
| One `GET /calendar/feed` per visible range; layer toggles filter client-side | Legend counts stay whole and toggling is instant. Choice persisted in `localStorage` (`cf_calendar_layers`). |
| URL is the state: `?view=&date=`, `?event=<id>` deep link, `?meeting=<id>` | Back button, shareable links, reminder-notification CTA works. |
| Drawer per layer (`item-drawer.tsx`): meeting, event, info (milestone/marketing/Google) | PRD "click opens the type-appropriate drawer". Milestone and marketing items open in their own module, they are not editable here. |
| Month on phones = dots + tap-a-day list; Week on phones = stacked days | The 7x8 grid does not fit 375px (F18). |
| Role gate in `calendar/layout.tsx`: founder and team member get all five pages; every other role gets Meetings only (read-only, invited meetings) and is redirected there | API answers 403 elsewhere. |
| `lib/nav-access.ts`: `/calendar` opened to every role | Shared lib change (not sidebar/layout): needed so non-core roles see the link. Test updates in `nav-access.test.ts` and `sidebar.test.tsx`. |
| Own toast provider (`components/calendar/toast.tsx`) | Sales toast is coupled to Sales error text. |
| Needs-attention banner in the layout, re-fetched on each page change | UX note in the FE guide: keep it on every Calendar page, not only Sync. |

## What's involved
- `lib/api/calendar.ts` (typed client, `req` unwraps `{data}`; connect sends `credentials: "include"`), `lib/calendar-format.ts` (dates, layers, reminder wording, callback copy), `hooks/useCalendarApi.ts` (rewritten; assistant polling 2.5 s, gives up at 60 s).
- `components/calendar/*` (drawer, event-form for event and meeting, meeting-drawer, item-drawer, views, layer-meta, sub-nav, toast), pages under `app/(dashboard)/calendar/`.
- Tests: `lib/calendar-format.test.ts`, `lib/api/calendar.test.ts`, `components/calendar/event-form.test.tsx`.
- No migrations, no config.

## Verification
Live against the local API (:8000) on the branch dev server, as founder, team member, mentor (invited), accountant, legal advisor, at 1440 and 375. Full table: `docs/checklist/calendar-rewalk.md`. The assistant ran against the real model (summary, decision, 2 action items, Add all to tasks). **Google was not live**: Connect was verified up to the redirect to `accounts.google.com`; callback `?error=invalid_state` verified for real; the Connected, direction, calendar picker, Sync now, Disconnect and needs-attention states were verified against **mocked `/calendar/sync` responses** (fetch override), not a real Google round trip.

## Operate / roll back
Pure FE: revert the PR. Needs the API at 0079 and, for Connect, `GOOGLE_CLIENT_ID/SECRET` on the API.

## Follow-ups
- Action-item assignee and title editing (API supports `PATCH .../action-items/{id}`): not built.
- Drag-to-reschedule: not in the PRD slice.
- Compliance layer is empty until Legal ships (toggle exists).
- Dashboard "Upcoming" and global search still do not read the feed (BE gap B14).
- First real Google connect needs a Google test user (Adebayo).
- Accountant: the PRD matrix lists Calendar as full access, the API gives invited-only; FE follows the API. Lead to confirm.
