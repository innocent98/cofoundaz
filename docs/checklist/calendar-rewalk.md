# Calendar re-walk (FE pass, 2026-10-30)

Branch `feature/calendar-fe` dev server on :3101, live API on :8000, seeded workspace with a founder, team member, mentor (invited to one meeting), accountant and legal advisor (not invited). Pass = works as the PRD/guide says. "Mock" = Google responses faked in the browser (no real OAuth client here).

| Control | Founder 1440 | Founder 375 | Team member 1440 | Mentor (invited) | Accountant / Legal (not invited) |
|---|---|---|---|---|---|
| Sub-nav (5 tabs; non-core roles see Meetings only, others redirect) | pass | pass | pass | pass (Meetings only, /sync redirects) | pass |
| Month grid, prev/next, Today, URL `?view=&date=` | pass | pass (dots + day list) | pass | n/a | n/a |
| Week / Agenda tabs, empty day "Nothing scheduled" | pass | pass (stacked days) | pass | n/a | n/a |
| Layer legend toggles + counts + persistence | pass | pass | pass | n/a | n/a |
| "+N more" / day list | pass | pass (tap day) | not walked | n/a | n/a |
| + New event: validation, create | pass | opens full-screen, no overflow | pass (button present) | button absent | absent |
| + New meeting: attendees, bad email, invite toast | pass | not submitted | not walked | absent | absent |
| Event drawer: edit, server 422 inline, delete confirm | pass | not walked | not walked | n/a | n/a |
| Meeting drawer: edit warns attendees, cancel confirm, summary from pasted notes (real model), Add all / per item | pass | drawer renders, no overflow | edit/cancel present | read-only, no notes box, no Add buttons | n/a |
| Private event hidden from teammates, lock for creator | pass | n/a | pass (hidden) | n/a | n/a |
| `?event=<id>` deep link opens drawer, clears URL on close | pass | not walked | not walked | n/a | n/a |
| Milestones: real list, days left, "N of M complete", Manage in Roadmap | pass | pass | not walked | n/a | n/a |
| Meetings list: upcoming/past, empty states | pass | pass | not walked | pass (only invited one) | pass (empty state) |
| Reminders: add, duplicate, out-of-range error, save, reset | pass | pass (no overflow) | read-only + note, no edit controls | n/a | n/a |
| Sync: Connect redirects to Google | pass (reached accounts.google.com) | not walked | not walked | n/a | n/a |
| Sync: `?error=invalid_state` toast, URL cleaned | pass | not walked | not walked | n/a | n/a |
| Sync: connected card, direction, calendar picker, Sync now, Disconnect confirm | pass (mock) | no overflow | not walked | n/a | n/a |
| Sync: needs-attention card + Reconnect | pass (mock) | not walked | not walked | n/a | n/a |
| Needs-attention banner on other pages | fixed to refetch per page; not re-verified after fix | | | | |
| Horizontal overflow at 375 on all 6 views | n/a | none (scrollWidth = 375) | | | |

## Gap list FE status
F1 to F12, F14, F15, F17, F18: built. F13: built except action-item assignee/title edit (deferred). F16: built (invited-only view; `nav-access` opens `/calendar`). F8: "+ Milestone" replaced by "Manage in Roadmap". F11: Outlook "Coming soon", Apple removed. F12: toggles removed.

## Not exercised
Real Google consent and tokens; calendar-invite email delivery from the UI (API shows `invite_state`); reminder notifications firing (clock); team member walk of most drawers (same code path as founder).
