# FE hand-off: Team (`/team`)

**For:** the FE developer. **Scope:** exactly what is below. **A light page by decision** (Adebayo, 2026-10-29): no Tasks, no Directory, no grants matrix, no seat counts.
**Backend:** API PR [Cofoundaz-api#200](https://github.com/innocent98/Cofoundaz-api/pull/200) (merge first; no migration). **Contract:** `cofoundaz-api/docs/fe-integration-guide-team.md`
(every body captured from a live run; section numbers below refer to it). **Gap list:** `docs/checklist/team-prd-gaps.md`. **Design:** `# Cofoundaz Web App UI Build/Team Collaboration.dc.html`.
Files: `app/(dashboard)/team/page.tsx` (almost entirely replaced), `lib/api/team.ts`, `lib/api/members.ts`, new hooks and components as needed. Read `AGENTS.md` first.
The whole current page is mock data: delete `INITIAL_TEAM_MEMBERS`, `INITIAL_THREADS`, the hardcoded activity, audit and capability arrays.

## 1. Who sees what

| | Founder | Team Member / others |
|---|---|---|
| Members, Roles, Activity, Comments tabs | yes | yes (read-only; Comments only shows their own threads) |
| Invite, Manage, Remove, pending invitations, Audit log tab | yes | **hidden** (the API answers 403) |
| "Leave workspace" | yes (not the last founder) | yes |

Take the viewer's role from the existing auth context (`/auth/me` memberships). Investors and other roles reach this page today only if the sidebar allows it; do not change
`lib/nav-access.ts`. Default tab: **Members**. Remove every "Switched to ..." toast and every toast on navigation.

## 2. Members tab

- Heading: "Your team", line "{n} members" (no seat counts: D-TEAM-6). Buttons: "+ Invite someone" (founder only), "Manage roles" (scrolls to / switches to the Roles tab).
- Rows from `GET /team/members` (guide 1): avatar initials, name (**fall back to email when `name` is null**), email, role chip (labels in 8), "you" tag on your own `user_id`, last active
  (relative time of `last_active_at`, "never" when null). Founders also see **"Manage"** on every row except their own.
- Below the members, a founder sees pending invitations from `GET /team/invitations` (guide 3): email, role chip, "invite pending" (or "invite expired" when `expired`), and two actions:
  **Resend** (`POST /team/invitations/{id}/resend`; toast "Invitation sent" or, when `delivered` is false, an error toast "Couldn't send the email. Try again.") and **Revoke**
  (confirm "Revoke the invitation for {email}?", then `DELETE`; row disappears). A 409 `INVITATION_NOT_PENDING` means someone already accepted or revoked it: refetch and show "That invitation is no longer pending."
- Footer note from the design stays: "Professional collaborators, your lawyer and accountant, are free on every plan and do not use a seat." Keep it only if it still reads true to Adebayo; if in doubt leave it out (ask the lead).
- Everyone (not founders) also sees a small "Leave workspace" text button at the bottom: confirm "Leave {workspace}? You lose access immediately.", `POST /team/leave`. On success clear the active workspace
  and go to the next workspace or `/login`. A 409 `LAST_FOUNDER` shows the API's message inline ("You are the only founder. Make someone else a founder before you leave.").

### Invite modal (founder only)

The design's modal (email, role cards) calling the existing `sendInvitations` in `lib/api/team.ts` (keep its error handling: 422 per-row field errors, 429 daily cap, 403). Roles offered: the existing
`INVITE_ROLE_OPTIONS` (no Investor). After success show the existing summary text and refetch members and invitations.

### Manage modal (founder only, "Manage {name}")

- **Role** select with the invite roles (guide 2) preselected to the current one. "Save changes" -> `PATCH /team/members/{user_id}` `{role}`; toast **"{name} is now {role}."**; refetch. Errors: 409 `CANNOT_CHANGE_SELF` cannot occur (no Manage on your own row), 404 -> "That person is no longer on the team." and refetch.
- **Remove from workspace** (red, in the modal): confirm text exactly **"Remove {name}? They lose access immediately. Their past activity stays attributed."**, then `DELETE /team/members/{user_id}`; toast "{name} was removed." and, when `document_grants_revoked` > 0,
  append " Their document access was revoked."; refetch. Cancel and Save are disabled while a request runs.

States: loading = skeleton rows; error = message with Retry; empty cannot happen (you are always a member).

## 3. Roles tab (read-only, D-TEAM-2/3)

A table: rows = the app's modules, columns = the real roles (Founder, Team Member, Mentor, Business Consultant, Accountant, Legal Advisor, Investor), cell = a check (Access) or a dot (No access).
**Derive every cell from `lib/nav-access.ts`** (the same map that hides sidebar links); do not hardcode access. Legend: Access / No access (drop "View only"). Heading "Roles and permissions"; sub-line "Everyone sees only what their work needs. Your journal is invisible to all of them." stays
(it is true). No editing here. 375 px: horizontal scroll inside the table card with the first column sticky.

## 4. Activity tab

Use the existing `useActivityFeed` (it is the dashboard widget's source; `GET /dashboard/activity`, items have `action`, `entity_type`, `summary`, `actor`, `created_at`, `next_cursor`). Group by Today / Yesterday / Earlier from `created_at`.
Filter chips: **All, Comments, Documents, Edits**: Documents = `entity_type` starts with `document` or `action` starts with `document.`; Comments = `action` contains `comment`; Edits = everything else. Verify the three mappings against live rows during the re-walk and
adjust the string tests (not the chips). "Load more" with `next_cursor`. Empty: "Nothing yet. Activity from your team shows up here." A null `actor.name` shows "A teammate".

## 5. Comments tab

- List from `GET /team/comments/threads?filter=` (guide 6) with chips **All, Mentions, Unresolved** (server filter). Each thread card: `context` (what it is about) + entity type chip, `last_comment.snippet`, author and time, "{unresolved_count} open", a "mentions you" tag when `mentions_me`.
- Click a card -> expands inline: load the whole thread with the **existing** `GET /team/comments?entity_type=&entity_id=&anchor=` (see the roadmap and Business Builder comment components for the call and for `serialize_comment` fields), show each comment, a **Reply** box
  (`POST /team/comments` with the same `entity_type`, `entity_id`, `anchor`; `mention_user_ids` only if you reuse the existing mention picker; plain replies need none) and **Resolve** / **Reopen** (`POST /team/comments/{id}/resolve` `{"resolved": true|false}`; allowed for founders, team members and the comment's author).
  Do not rebuild the composer: reuse `components/roadmap/comment-thread.tsx` if it fits.
- Empty: "No threads yet. Comment on a milestone or a canvas and it shows up here." 403 never happens here.

## 6. Audit log tab (founder only)

Table: Actor, Action, Target, When from `GET /team/audit?limit=30` with a "Load more" button using `next_cursor` (guide 5; send it back unchanged). **Words for `action`** exactly as the table in guide 5. `actor` or `target` null -> "Someone". "Export log" downloads the CSV: a plain `fetch` to
`/api/v1/team/audit/export` with the three headers `apiClient` sets (bearer from `localStorage.cf_token`, `X-Workspace-Id` from `localStorage.cf_workspace_id`), save the blob as `team-audit-log.csv`. Keep the design's subtitle "Every sensitive action, immutable and timestamped." Empty: "No team activity recorded yet."

## 7. Role labels (D-TEAM-3)

Show **"Founder"** for `founder` everywhere on this page (a first and a second founder cannot be told apart); "Co-Founder" stays only on the invite modal card (existing). `team_member` Team Member, `mentor` Mentor,
`business_consultant` Business Consultant, `accountant` Accountant, `legal_advisor` Legal Advisor, `investor` Investor.

## 8. Cross-cutting rules

- Every API call through `apiClient`; keep `ApiError` handling; refetch after every write instead of editing local state by hand.
- No em or en dashes in rendered copy. 375 px: tabs scroll horizontally; member rows stack (avatar + name above, role and actions below); modals full width with 16 px gutters; tables scroll inside their card.
- Loading, empty and error state for every tab. A 403 on a founder-only call (a role changed under you) hides the founder controls and refetches `/auth/me`.

## 9. Out of scope (do not build)

Team Tasks / board, Directory, per-module permission editing, seat counts or limits, a "suspend" action, bulk actions, notifications about role changes, transfer of ownership, the top bar's "+ Invite" (already works; leave it).

## 10. Acceptance = the re-walk rows

Done means every row passes on merged `develop`, at 1440 and 375, as founder (rows 1 to 14), team member and mentor (rows 15 to 17), each result matching the raw API.

| # | Row | Pass when |
|---|---|---|
| 1 | Open `/team` | Members tab, real members, "you" on your row, no toast, no mock names |
| 2 | Invite two people (one valid, one already a member) | Summary text matches the API (`created` / `skipped`); pending rows appear |
| 3 | Resend a pending invitation | Toast; the old email link no longer works, the new one does |
| 4 | Revoke a pending invitation | Row gone; the link is dead (`/invite/{token}` fails) |
| 5 | Change a member's role | Toast "{name} is now {role}."; reload shows it; that person's sidebar changes on their next load |
| 6 | Remove a member who had a Documents grant | Confirm copy exact; toast mentions the revoked access; their `/documents/shared-with-me` is 403 |
| 7 | The removed person opens the app | Locked out of this workspace |
| 8 | Invite the removed person again and accept | They are back with the new role |
| 9 | Leave as a co-founder | Lands elsewhere; the old workspace is gone from the switcher |
| 10 | Leave as the only founder | Inline `LAST_FOUNDER` message; nothing changes |
| 11 | Roles tab | Cells equal `lib/nav-access.ts`; legend has two states |
| 12 | Activity tab | Rows equal `GET /dashboard/activity`; chips filter; Load more works |
| 13 | Comments tab: filters, open a thread, reply, resolve | Server filters; reply and resolve persist after reload |
| 14 | Audit tab, Load more, Export | Rows equal `GET /team/audit`; CSV downloads with the four columns |
| 15 | Team member opens `/team` | No Invite, Manage, pending invitations or Audit tab; Leave visible |
| 16 | Mentor (if the sidebar allows the page) | Same as 15; Comments shows only their own threads |
| 17 | 375 px | Every control reachable; no overflow or clipped text |
