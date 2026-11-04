# FE hand-off: Tickets (Settings > Help + Admin Support tab)

**For:** the FE developer. **Scope:** exactly what is below; no backend work. **Backend:** API PR [Cofoundaz-api#211](https://github.com/innocent98/Cofoundaz-api/pull/211) (merge first; migration `0087_support_tickets`).
**Contract:** `cofoundaz-api/docs/fe-integration-guide-admin-tickets.md` (every body captured from a live run; capture names below match it). **Gap rows:** A16, A17, A18 (P4), A9, A3 in `docs/checklist/admin-prd-gaps.md`.
Read `AGENTS.md` first. Two surfaces: the founder app (Settings > Help) and the Admin console Support tab (`app/admin-portal/page.tsx`, today a mock with three hardcoded tickets).

## Part 1: Settings > Help (founder app)

Add a **Help** tab to `app/(dashboard)/settings/page.tsx` (new `components/settings/help-tab.tsx`, `lib/api/support.ts`). Every call sends `Authorization` and `X-Workspace-Id`. Any member of the workspace can use it.
Email links open **`/settings/help/{ticket_id}`**: add that route (it renders the same thread view, deep-linkable; the tab list is at `/settings?tab=help`).

- **List** (`GET /support/tickets`, optional `status=open|resolved`, cursor paging with `meta.next_cursor`): number (`T-1001`), subject, category label, status chip, "last reply" relative time (`last_message_at`), and "Waiting for you" when `last_author` is `staff` and status is `open`. Empty state: "No tickets yet" and the button below.
- **New ticket** (modal or page): category select (labels: billing "Billing", account "Account", bug "Something is broken", how_to "How do I...", feature_request "Feature request", other "Other"), subject (3-200), message (1-5000 with a counter). `POST /support/tickets`; on 201 go to the thread. Show 422 `field_errors` under the fields. **429 `RATE_LIMITED`**: show the API's `message` inline (limits are 5 per hour and 20 per day; not exercised live, see the guide).
- **Thread** (`GET /support/tickets/{id}`): messages oldest first. Founder messages right-aligned with `author_name`; staff messages left-aligned and labelled exactly as the API says ("Cofoundaz Support"). Never try to show staff names; the API sends none. Render message bodies as **plain text** with line breaks (never as HTML).
- **Reply box** (`POST /support/tickets/{id}/messages`), 1-5000 chars. On a resolved ticket the box stays enabled with the hint "Replying reopens this ticket"; after the 201 the status chip flips to Open. **409 `TICKET_CLOSED`**: replace the box with "This ticket was resolved more than 14 days ago" and a "Open a new ticket" button.
- A ticket id from another workspace (or one opened by a colleague, for non-founder roles) answers 404: show "Ticket not found" and a link back to the list.
- **Do not show** priority, SLA, assignee, notes or escalation anywhere in the founder app; the API does not send them.
- The sidebar and tab list need no role gating beyond the existing workspace membership.

## Part 2: Admin Support tab

Replace the mock (`supportTickets`, `activeTicket`, the "Send reply / Resolve / Escalate" toasts) with the API. Staff routes are under `/admin/support/...`, scope `support` (Super Admin passes). Non-support staff get 403: hide the tab for them using `GET /admin/me` scopes; a 404 means not staff at all (sign out of the console as for other tabs). **No TOTP prompt** on these actions.

1. **Tabs and badges:** Open / Mine / Resolved -> `GET /admin/support/tickets?tab=open|mine|resolved`. Badge numbers from `GET /admin/support/counts` (`open`, `mine`, `resolved`; also `breached`, `unassigned` for chips). Refetch counts after every action.
2. **Filters** in a row above the list: priority (P1-P4), category, SLA (all / breached / due soon), "Escalated", "Unassigned". Search box: `query` (debounced ~300 ms; matches subject, `T-1001`, person, workspace). This is the per-page search for P13; do not add a global search.
3. **List row** (from the list payload): number, subject, priority chip (P1 red .. P4 grey), "Escalated" tag, `founder.name`, `workspace.name` + `workspace.plan_key`, assignee name or "Unassigned", age from `created_at`, and an **SLA chip** from `sla.state`: `breached` red "Overdue", `due_soon` amber with a countdown to `sla.due_at`, `ok` shows the countdown in neutral, `met` green, `late` grey "Answered late". Paging via `meta.next_cursor` ("Load more").
4. **Thread pane** (`GET /admin/support/tickets/{id}`): header with number, subject, category, priority select, assignee select (options from `GET /admin/support/assignees`; "Assign to me" shortcut using your own id from `/admin/me`), founder name + email, workspace + plan. Two tabs: **Conversation** (`messages`) and **Internal notes** (`notes`, visually distinct, label "Only staff see this").
5. **Reply:** textarea plus a **canned responses** picker (`GET /admin/support/canned`; selecting one inserts its `body` into the box, editable). `POST .../reply`. Say under the button "Sends an email to {founder.email}". First reply assigns the ticket to you when it was unassigned.
6. **Internal note:** `POST .../notes`; never emailed.
7. **Priority:** `PATCH .../priority`. **Assign:** `POST .../assign` with `{"assignee_user_id": id|null}`.
8. **Escalate:** modal with a required reason (10-500 chars) -> `POST .../escalate`. Confirm copy: "Escalating sets the ticket to P1 and cannot be undone here." Then show the escalation reason in the header. A second try answers 409 `ALREADY_ESCALATED`.
9. **Resolve:** confirm dialog "This sends the founder a closing email." with an optional closing message field -> `POST .../resolve`. The ticket moves to the Resolved tab.
10. **Reopen** (Resolved tab only): optional reason (10-500) -> `POST .../reopen`. 409 `TICKET_NOT_RESOLVED` / `TICKET_RESOLVED` (acting on a resolved ticket): refetch and show the message.
11. **Canned responses manager** (a small "Manage replies" dialog): list, create, edit, delete with a confirm. Title 1-80, body 1-2000. Plain text only.
12. **Dashboard "Needs attention":** show "{open} support tickets open" (and "{breached} overdue" when > 0) from `GET /admin/dashboard/attention` -> `tickets.open` / `tickets.breached`, linking to the Support tab. Visible to every staff member. Keep the Expert applications row removed (D-ADM-5).

Remove from the mock: the AI triage banner, the "Urgent/High/Normal" labels (priorities are P1-P4), every "Switched to ..." toast, the hardcoded user/workspace names. Unhide the Support nav item only when this lands (it stays hidden until then, per P4).

## Rules for this page

- All text from users (subjects, messages, notes, canned bodies) is rendered as text, never HTML.
- Error codes to handle: `VALIDATION_ERROR` (field errors), `RATE_LIMITED`, `TICKET_CLOSED`, `TICKET_RESOLVED`, `TICKET_NOT_RESOLVED`, `ALREADY_ESCALATED`, `NO_CHANGE`, `ASSIGNEE_NOT_ALLOWED`, `NOT_FOUND`, `FORBIDDEN`. Show the API `message` unless this brief gives other copy.
- Re-walk (click every control, all roles that apply, 1440 and 375) is part of done; staff-side needs a support Admin and a Super Admin, founder side needs a founder and a team member.
