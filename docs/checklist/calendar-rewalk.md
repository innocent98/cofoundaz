# Calendar re-walk on merged develop (2026-10-31)

Code: `origin/develop` at `c418f34` (includes FE #190 `93de1a1`), fresh worktree, dev server :3101, live API :8000 at 0082. Seeded workspace: founder, team member, mentor (invited to one meeting), accountant and legal advisor (not invited). Earlier branch walk and fixes: SOP `docs/sop/2026-10-30-calendar-fe.md`.
"Mock" = Google `/calendar/sync` responses faked in the browser (no real OAuth completion here). Pass = behaves as the guide says; every payload checked in the browser against the API.

| Control | Founder 1440 | Founder 375 | Team member 1440 | Team member 375 | Mentor (invited) | Accountant / Legal (not invited) |
|---|---|---|---|---|---|---|
| Sub-nav; non-core roles see Meetings only and `/calendar/sync`, `/reminders` redirect to it | pass | pass | pass (5 tabs; walked on branch, API matrix re-run now) | pass | pass 375; API: 403 on feed/sync/rules/milestones, 200 on meetings | pass 375 + 1440 (legal), API same |
| Month grid, prev/next, Today, `?view=&date=` URL | pass | pass | pass (branch walk; API 200) | pass | n/a | n/a |
| Week and Agenda, empty-day text | pass | pass (stacked days) | n/a | n/a | n/a | n/a |
| Layer legend toggles, counts | pass | pass | n/a | n/a | n/a | n/a |
| "+N more" / day list | pass | pass (tap day) | pass (branch walk) | n/a | n/a | n/a |
| New event: title error, create | pass | pass (full-screen, no overflow) | pass (branch walk) | pass | button absent | absent |
| Event drawer: edit, server 422 shown inline (`end_time may not be earlier than start_time`), delete confirm | pass | pass | pass (branch walk) | pass (create, delete) | n/a | n/a |
| New meeting: bad email error, attendees (teammate vs invite sent) | pass | pass | pass (branch walk) | n/a | absent | absent |
| Meeting drawer: summary from pasted notes (real model), Add all to tasks, edit warns attendees, cancel confirm mentions cancellation | pass | pass (create, drawer, cancel) | pass (branch walk) | n/a | read-only: no Edit, no notes box, "invited" note | n/a |
| Private event hidden from teammates (API: not in team member feed) | n/a | n/a | pass | pass | n/a | n/a |
| `?event=<id>` deep link (branch walk, code unchanged) | pass | pass | pass | n/a | n/a | n/a |
| Milestones: real list, days left, "N of M complete", Manage in Roadmap | pass | pass | pass | pass | n/a | n/a |
| Meetings list: upcoming/past, empty states | pass | pass | pass | pass | pass (only the invited one) | pass (empty state) |
| Reminders: add, out-of-range error, duplicate error, save, reset | pass | pass | read-only note, no edit controls | pass (read-only) | n/a | n/a |
| Sync: Connect redirects to Google | pass (real Google sign-in page for the configured client; sign-in not completed) | n/a | n/a | n/a | n/a | n/a |
| Sync: `?error=<code>` toast, URL cleaned (no_refresh_token, invalid_state) | pass | pass | n/a | n/a | n/a | n/a |
| Sync: connected card, direction, picker, Sync now, Disconnect confirm | pass (mock) | pass (mock) | n/a | n/a | n/a | n/a |
| Sync: needs-attention card + Reconnect, banner on other pages | pass (mock) | pass (mock) | n/a | n/a | n/a | n/a |
| No horizontal overflow at 375 on all pages and drawers | n/a | pass (scrollWidth 375) | n/a | pass | pass | pass |

Rows marked "branch walk" were walked on `feature/calendar-fe` and not repeated click-by-click on merged develop for the team member at 1440 (same code path as founder; the API access matrix for every role was re-run on develop).

## Not verified
Real Google consent, tokens and refresh; reminder notifications firing (needs clock); invite email delivery from the UI (the UI shows `invite_state: sent`).

## Result
No failures on merged develop. No BE bugs. Deferred: action-item assignee and title edit.
