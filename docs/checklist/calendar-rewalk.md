# Calendar re-walk on merged develop (2026-10-30)

Code: `origin/develop` at `c418f34` (includes FE #190 `93de1a1`), fresh worktree, dev server :3101, live API :8000 at 0082. Seeded workspace: founder, team member, mentor (invited to one meeting), accountant and legal advisor (not invited). Earlier branch walk and fixes: SOP `docs/sop/2026-10-30-calendar-fe.md`.
"Mock" = Google `/calendar/sync` responses faked in the browser (no real OAuth completion here). Pass = behaves as the guide says; every payload checked in the browser against the API.

| Control | Founder 1440 | Founder 375 | Team member 1440 | Team member 375 |
|---|---|---|---|---|
| Sub-nav, 5 tabs | pass | pass | pass | pass |
| Month grid, prev/next, Today, `?view=&date=` URL | pass | pass | pass | pass |
| Week (grid at 1440, stacked days at 375), prev/next | pass | pass | pass | pass |
| Agenda, empty-day text | pass | pass | pass | pass |
| Layer legend toggles, counts | pass | pass | pass | pass |
| "+N more" and day list (tap a day at 375) | pass | pass | pass | pass |
| New event: title error, create | pass | pass (full-screen, no overflow) | pass | pass |
| Event drawer: edit, server 422 inline (`end_time may not be earlier than start_time`), delete confirm | pass | pass | pass | pass |
| Item drawer from the day list (multi-day "Launch sprint") | pass | pass | pass | pass |
| New meeting: bad-email error, create, attendees (teammate vs invite sent) | pass | pass | pass | pass |
| Meeting drawer: summary from pasted notes (real model), Add to tasks / Add all, edit warns attendees, cancel confirm mentions cancellation | pass | pass (create, drawer, cancel) | pass | pass |
| Private event hidden from teammates (team member feed has no "Private errand") | n/a | n/a | pass (API) | n/a (same request, viewport-independent) |
| `?event=<id>` deep link opens the drawer, clears the URL | pass | pass | pass | pass |
| Milestones: real list, days left, "N of M complete", Manage in Roadmap | pass | pass | pass | pass |
| Meetings list: upcoming/past, empty states | pass | pass | pass | pass |
| Reminders: add, out-of-range, duplicate, save, reset (founder); read-only note and no edit buttons (team member) | pass | pass | pass (read-only) | pass (read-only) |
| Sync: Connect redirects to Google's sign-in | pass | not repeated (same call) | pass | pass |
| Sync: `?error=<code>` toast, URL cleaned | pass (no_refresh_token, invalid_state) | pass (invalid_state) | pass (exchange_failed) | pass (access_denied) |
| Sync: connected card, direction, calendar picker, Sync now, Disconnect confirm | pass (mock) | pass (mock) | pass (mock) | pass (mock) |
| Sync: needs-attention card, Reconnect, banner on other pages | pass (mock) | pass (mock) | pass (mock) | pass (mock) |
| No horizontal overflow (scrollWidth = viewport) | pass | pass | pass | pass |

Roles with only the invited-meetings view (the layout shows them Meetings only and redirects `/calendar`, `/calendar/sync`, `/calendar/reminders` there):

| Role | Walked at 1440 | Walked at 375 | Result |
|---|---|---|---|
| Mentor (invited to "Seed round intro") | yes | yes | Sub-nav shows Meetings only; list shows only the invited meeting; no "New meeting"; drawer is read-only (no Edit, Cancel, notes box, Add to tasks; "invited" note); past tab empty; Calendar link stays in the sidebar; no overflow |
| Accountant (not invited) | yes | yes | Meetings only; empty state "No upcoming meetings"; no New button; sidebar Calendar link present |
| Legal advisor (not invited) | yes | yes | Same as accountant |

API access matrix re-run on develop: mentor, accountant and legal advisor get 403 on feed, milestones, reminder rules and sync, and 200 on `GET /calendar/meetings` (mentor sees only the invited meeting, `can_manage: false`, no `transcript` key); team member gets 200 on all.

## Not verified
Real Google consent, tokens and refresh (Connect reaches Google's real sign-in page; sign-in not completed; connected and needs-attention states used mocked `/calendar/sync` responses); reminder notifications firing (needs the clock); invite email delivery from the UI (the UI shows `invite_state: sent`).

## Result
No failures on merged develop, no BE bugs. Deferred: action-item assignee and title edit.
