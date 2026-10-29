# Team: PRD and UI gap list (2026-10-29)

Source of truth: `Cofoundaz_Technical_PRD.md` Module 23 (23.1 to 23.5), **overridden on purpose** (see D-TEAM-1). Designed UI:
`# Cofoundaz Web App UI Build/Team Collaboration.dc.html` (tabs Members, Roles, Activity, Comments, Audit log; Invite and Manage modals). Built page:
`app/(dashboard)/team/page.tsx` (913 lines), `lib/api/team.ts` (invitations only), `lib/api/members.ts` (member picker list).

**How this was walked:** page source read end to end against the designed HTML; every control mapped to the API source and, where it exists, to the live
shared stack (`GET /team/members`, `GET /dashboard/activity`, comments). The built-in browser was used on the Journal page earlier; Team is 100% mock, so no
live click-through adds information beyond the source. The hand re-walk at 1440 + 375 per role is the FE developer's acceptance (`docs/fe-handoff/team.md`).

## What the page is today

**Entirely mock.** `INITIAL_TEAM_MEMBERS`, `INITIAL_THREADS`, the activity list, the audit rows and the capability matrix are hardcoded arrays; the Invite modal pushes
into local state and never calls `POST /team/invitations` (the API client in `lib/api/team.ts` is used only by the top bar's "+ Invite"). Manage / Remove / role
Save are toasts. Reply and Resolve change local state. The default tab is "Audit log" ("as per current task view"). Roles use made-up labels (Owner, Advisor,
"Accountant or Legal advisor") that do not match the API roles.

## Product calls (D-TEAM-n)

| # | Question | Decision |
|---|---|---|
| **D-TEAM-1** | PRD Module 23 includes Team Tasks (with Roadmap sync and AI triage), a Directory and a per-module permission grants matrix. The design shows none of them. | **Adebayo, 2026-10-29: "as simple and light as it can be; override the PRD."** Not built: Tasks, Directory, grants matrix. The page is the five designed tabs plus management actions. |
| **D-TEAM-2** | Roles tab "capability matrix". | **Read-only and derived from real access.** Rows are the app's modules, columns the real roles, cells Access / No access taken from `lib/nav-access.ts` (the same table that hides sidebar links). No "View only" level (the API cannot prove it). No editing; "Manage roles" scrolls to Members. |
| **D-TEAM-3** | Role labels. | Use the API roles: Founder (shown "Co-Founder" only in the invite modal as today), Team Member, Mentor, Business Consultant, Accountant, Legal Advisor, Investor. Drop "Owner" and "Advisor". |
| **D-TEAM-4** | Removing someone: what about their stuff? | They lose access at once and their **Documents grants are revoked**; past activity and comments stay attributed. Nothing else is deleted or reassigned (roadmap owner ids stay). |
| **D-TEAM-5** | Last founder. | Cannot leave or be demoted (a founder cannot change their own role at all; a co-founder can be removed or demoted by the other). |
| **D-TEAM-6** | Seat line ("4 of 5 seats used", design). | **Dropped** until Billing is live: no seat limit exists yet. Show "{n} members" only. |

## Gaps

| # | Gap | Evidence | Sev | Plan |
|---|---|---|---|---|
| T1 | **Members tab is hardcoded**; Invite modal does not call the API. | `INITIAL_TEAM_MEMBERS`, `handleSendInvite` | High | FE: `GET /team/members` (now with `joined_at`, `last_active_at`), pending rows from `GET /team/invitations`, Invite modal via `sendInvitations`. |
| T2 | **No way to change a role** (Manage modal is a toast). | no route | High | API: `PATCH /team/members/{user_id}`. |
| T3 | **No way to remove a member**; a removed person must lose Documents grants (handoff 0b-41). | no route; grants outlive membership | High (Sec) | API: `DELETE /team/members/{user_id}` locks out at once and revokes grants. |
| T4 | **No leaving a workspace.** | no route | Med | API: `POST /team/leave` with a last-founder guard. |
| T5 | **No invitation list, resend or revoke** ("invite pending" rows are fake). | no route | High | API: `GET /team/invitations`, `POST .../{id}/resend`, `DELETE .../{id}`. |
| T6 | **A removed person could never be invited back**: accepting succeeded but the membership stayed removed. | `accept_invitation` | High (bug) | API fix: reopen the removed membership with the invited role. |
| T7 | **Audit log tab is hardcoded**; no API; the design has "Export log". | page source | High | API: `GET /team/audit`, `GET /team/audit/export` (CSV), allow-listed `team.*` / `workspace.*` actions only; new audit rows for every team change. |
| T8 | **Comments tab is hardcoded**; threads are not read from the API; no index of "threads involving me". | `INITIAL_THREADS` | High | API: `GET /team/comments/threads`; FE uses the existing comment endpoints to read, reply and resolve. |
| T9 | **Activity tab is hardcoded.** | page source | Med | FE: reuse `useActivityFeed` (already powers the dashboard widget). |
| T10 | **Roles tab is a hardcoded matrix with invented roles.** | `CAPABILITIES_DATA` | Med | FE: D-TEAM-2/3. |
| T11 | **Default tab is Audit log; toast on every click.** | page source | Low | FE. |
| T12 | **Role-gated UI missing**: non-founders must not see Invite / Manage / Remove / Audit. | page source | High | FE: founder-only controls; the API enforces 403 anyway. |

## Not built, by decision

Team Tasks (PRD 23.1), Directory (23.5), per-module grants matrix (23.4), seat counting, notifications to the removed or re-roled member,
revoking share links and signature requests a removed member created.

## Ledger (2026-10-29)

| Item | State |
|---|---|
| API PR | [Cofoundaz-api#200](https://github.com/innocent98/Cofoundaz-api/pull/200), branch `feature/team-be-gaps`, **no migration**. Closes T2 to T8. |
| FE hand-off | `docs/fe-handoff/team.md` (this PR). FE-only gaps T1, T9 to T12 are in its scope and acceptance rows. |
