# Team: click-through re-walk on merged develop

**Verdict: NOT DONE. 146 of 160 role × width checks pass, 14 fail, 2 not verified** (67 control rows).

**What was walked (FE #247, rebuilt from the FE dev's #240):** the Team page for the founder and the team member (Members, Roles, Activity, Comments, Audit log tabs; invite, resend, revoke, change role, remove, leave), and the five roles that must not reach it.

**Date:** 2026-11-12. **Code under test:** FE develop `130167d` (innocent98/cofoundaz) and API develop `e59e1d6f` (innocent98/Cofoundaz-api).
**Scratch stack, not the shared :8000 stack:** a fresh worktree of each repo; Postgres 16 and Redis 7 containers (`rewalk-pg`, `rewalk-redis`) with `alembic upgrade head`
on an empty database; the API on `:8100` with `LLM_PROVIDER=stub`, `EMAIL_BACKEND=file` (verification and invite mails are read from disk) and the per-IP sign-up, resend, forgot
and login limits raised so one machine can walk many accounts (the lockout limit itself, 5 failures per email+IP, is left at its default); the FE as `next dev -p 3102`
proxied to it. Roles: F founder, TM team member, M mentor, BC business consultant, AC accountant, INV investor, LA legal advisor. A cell lists the roles that passed at that
width; `❌ role` failed; `n/a` means the control does not exist for that role or width and the row says why.

**Method, honestly.** A scripted real browser (Chromium via Playwright) clicks and types into every control and compares the result with the raw API (`GET`s made with the same
account's token, the API log of the page's own calls, the mail files, and the database where stated). Screenshots were read by eye for the failure cases and a sample of the passes.
The scripts and raw per-run results are in the shared notes folder (`side-session-notes/.../rewalk-2026-11-12/`: `lib.mjs`, `auth*.mjs`, `team*.mjs`, `journal*.mjs`, `notif1.mjs`,
`side1.mjs`, `ai1.mjs`, `ir1.mjs`, `roles*.mjs`, `all-results.json`), not in the repo. Some rows took more than one run because the first script, not the page, was wrong; every row below is from the final run.


## Findings (❌), for the lead to route

1. **Audit log tab is always empty, and Export is disabled (high, FE).** Repro: founder → Team → Audit log in any workspace where a member was invited, revoked, re-roled or removed. The tab says "No team activity recorded yet." and the "Export log" button is greyed out.
   Raw API (same page load): `GET /team/audit?limit=30` → **200** `{"data":{"entries":[{"id":"6759c266-…","action":"team.member.removed","actor":"Fiona Founder tz2","target":"tz2la@rewalk-qa.com","created_at":"2026-11-12T19:53:26.136536+00:00"}, … 12 entries],"next_cursor":null}}`.
   Cause: `lib/api/team.ts` `getTeamAuditLogs` (lines ~176-183) reads `res.data.items` but the API returns `data.entries`. The button is `disabled={… || auditLogs.length === 0}` so the CSV can never be exported from the UI. Same at 1440 and 375.
   Screenshots: `rewalk-2026-11-12-evidence/team-f-audit-1440.png`, `team-f-audit-375.png`. The CSV endpoint itself is fine (200 `text/csv`, `attachment; filename="team-audit-log.csv"`, header `when,actor,action,target`, and a display name `=1+1` is exported as `'=1+1`, so the formula-injection guard works).
2. **Activity rows print the person's name twice (low, FE).** Repro: founder → Team → Activity. Each row reads "Invitee LA Invitee LA joined the workspace" (or "A teammate A teammate joined…" when the person has no profile name).
   `GET /dashboard/activity` already returns the actor inside `summary` ("Invitee LA joined the workspace"); the row prints the actor name in bold and then the summary. Screenshot: `rewalk-2026-11-12-evidence/team-activity.png`.
3. **`GET /team/members` answers 200 to every role (decision for the lead, API).** The five roles that cannot open the Team page (mentor, business consultant, accountant, investor, legal advisor) all get **200** with every member's name, **e-mail** and role:
   `{"data":[{"user_id":"…","name":"Fiona Founder","email":"tq9f@rewalk-qa.com","role":"founder","joined_at":"…","last_active_at":null}, …]}` (`last_active_at` is only filled for the founder). The code comment calls it a directory for assignee/owner pickers
   (`app/api/v1/endpoints/team.py:62-73`), so it may be intended, but the brief for this walk says denied roles must get a 403. An investor or legal advisor can read the whole team's e-mail addresses. `/team/audit`, `/team/invitations` and every write are 403 for them as required.


## NOT verified (labelled, not walked)
- **Audit export through the UI button** (blocked by finding 1; the API export is verified).
- Denied roles get an in-page "You don't have access to this page." screen from `RouteGuard` (no tabs, no data), not a 404 or a redirect. The row says so; treat that as the product's design unless the lead wants a hard redirect.
- Invite e-mails are read from the mail files; real delivery is not exercised.

## Rows

| Control | 1440 | 375 | Evidence / note |
|---|---|---|---|
| Members: heading count equals API member count | ✅ F | ✅ F | API 7 |
| Members: every API member listed with email + role label | ✅ F | ✅ F |  |
| Members: each member shows their role label and "Last active" | ✅ F | ✅ F |  |
| Members: own row tagged "you", no Manage on own row | ✅ F | ✅ F | Manage buttons 6 of 6 |
| Members: "Manage roles" opens the Roles tab | ✅ F | ✅ F |  |
| Invite: "+ Invite someone" opens the modal | ✅ F | ✅ F |  |
| Invite: role radios offer Co-Founder, Team Member, Mentor, Accountant, Legal Advisor, Business Consultant (no Investor) | ✅ F | ✅ F | Co-Founder, Team Member, Mentor, Accountant, Legal Advisor, Business Consultant |
| Invite: Send invite is disabled while the email is empty | ✅ F | ✅ F |  |
| Invite: malformed email blocked | ✅ F | ✅ F |  |
| Invite: inviting someone who is already a member is skipped with an explicit message ("Skipped 1 (already a member or already invited).") | ✅ F | ✅ F | status 200 · Skipped 1 (already a member or already invited). |
| Invite: valid invite → API 2xx, email written, modal closes, toast | ✅ F | ✅ F | status 200 toast "✓ Invited 1." |
| Pending invitations lists the new invite with its role | ✅ F | ✅ F |  |
| Invite: re-inviting a pending address is handled (refused or re-sent) with a message | ✅ F | ✅ F | status 200 · toast "✓ Skipped 1 (already a member or already invited)." |
| Invite modal closes on Escape | ✅ F | ✅ F |  |
| Invite modal closes with the X | ✅ F | ✅ F |  |
| Top-bar "Invite" button opens the same modal | ✅ F | ✅ F |  |
| Pending: Resend → API 2xx and a new email is written | ✅ F | ✅ F | status 200 toast "✓ Invitation sent" mails +1 |
| Pending: Revoke opens a confirm ("Revoke invitation?") | ✅ F | ✅ F |  |
| Revoke → Cancel keeps the invitation | ✅ F | ✅ F |  |
| Revoke → confirm removes the invitation (UI + API) | ✅ F | ✅ F | API: {"data":[],"meta":null} |
| A revoked invite link is dead (preview API) | ✅ F | ✅ F | {"code":"NOT_FOUND","message":"Not found.","field_errors":[]} |
| Manage opens the modal with the member's current role selected | ✅ F | ✅ F | accountant |
| Manage → Cancel changes nothing (API roles unchanged) | ✅ F | ✅ F |  |
| Manage → Save changes: role changes to Team Member (API) and the row updates | ✅ F | ✅ F | API role team_member toast "✓ tz2ac@rewalk-qa.com is now Team Member." |
| Remove asks for confirmation naming the member | ✅ F | ✅ F |  |
| Remove → Cancel returns to the role form | ✅ F | ✅ F |  |
| Remove → confirm removes the member (API + list) | ✅ F | ✅ F | API members 6 |
| A removed member can no longer read the workspace (explicit X-Workspace-Id of the old workspace is refused) | ✅ LA (removed) | ✅ LA (removed) | status 403 {"error":{"code":"FORBIDDEN","message":"You don't have permission to do that.","field_errors":[]}} · their memberships: [] |
| Leave workspace opens a confirm | ✅ F | ✅ F |  |
| Leave as the only founder is refused (workspace keeps its founder) | ✅ F | ✅ F | status 409 · Leave workspace? Leave Rewalk TZ2 Co? You lose access immediately. You are the only founder. Make someone else a founder before you leave. Cancel Leave |
| Tabs: Members, Roles, Activity, Comments, Audit log all present | ✅ F | ✅ F | Members,Roles,Activity,Comments,Audit log |
| Roles: permission matrix has 22 modules × 7 roles and equals the nav-access rules | ✅ F | ✅ F | rows 22 cols 7 mismatches: none |
| Comments › All: one row per API thread | ✅ F | ✅ F | UI 2 / API 2 |
| Comments › Mentions: only threads that mention me | ✅ F | ✅ F | UI 1 / API 1 |
| Comments › Unresolved: hides fully-resolved threads | ✅ F | ✅ F | UI 1 / API 1 of 2 |
| Comments: expanding a thread loads its comments, Resolve and a reply box | ✅ F | ✅ F |  |
| Comments: Reply with an empty box sends nothing | ✅ F | ✅ F |  |
| Comments: Reply → POST 201 and the reply shows in the thread | ✅ F | ✅ F | status 201 |
| Comments: Resolve → API 200 and the comment is marked resolved | ✅ F | ✅ F | status 200 |
| Activity: shows entries with relative times, grouped by day | ✅ F | ✅ F |  |
| Activity: All / Comments / Documents / Edits filter chips respond without error | ✅ F | ✅ F | rows after last click (All): 6 |
| Activity › Comments filter: joined-workspace rows are filtered out | ✅ F | ✅ F | Activity / All / Comments / Documents / Edits / Nothing yet. / Activity from your team shows up here. / Ask your AI Co-Founder / ⌘J |
| Audit log: lists the API audit entries (GET /team/audit returns data.entries; FE reads data.items) | ❌ F | ❌ F | UI rows 0 / API entries 12 · UI says: No team activity recorded yet. |
| Audit log: Export log is enabled when the API has entries | ❌ F | ❌ F | disabled=true |
| Audit log: "Export log" button downloads the CSV (through the UI) | not verified F | not verified F | NOT verified (blocked by the Audit-list defect: the button stays disabled). The API export itself is verified in the next row. |
| Audit CSV: a display name starting with "=" is neutralised (formula injection) | ✅ F | ✅ F | row: 2026-11-12T20:08:21.568001+00:00,'=1+1,team.invitation.created,tq9inj@rewalk-qa.com |
| Denied: Team is not in the sidebar | ✅ M, BC, AC, INV, LA | – |  |
| Denied: opening /team by URL shows the no-access screen (no members, no tabs) | ✅ M, BC, AC, INV, LA | ✅ M, BC, AC, INV, LA | (RouteGuard no-access screen, not a 404/redirect) You don't have access to this page. |
| Denied: API GET /team/members → 403 | ❌ M, BC, AC, INV, LA | – | status 200 undefined |
| Denied: API GET /team/audit → 403 | ✅ M, BC, AC, INV, LA | ✅ M, BC, AC, INV, LA | status 403 |
| TM: sees Members, Roles, Activity, Comments only (no Audit log) | ✅ TM | ✅ TM | Members,Roles,Activity,Comments |
| TM: no Manage buttons, no Invite button, no Pending invitations, no Last-active column | ✅ TM | ✅ TM |  |
| TM: Leave workspace is offered | ✅ TM | ✅ TM |  |
| TM: API GET /team/audit is refused | ✅ TM | ✅ TM | status 403 FORBIDDEN |
| TM: API GET /team/audit/export is refused | ✅ TM | ✅ TM | status 403 FORBIDDEN |
| TM: API GET /team/invitations is refused | ✅ TM | ✅ TM | status 403 FORBIDDEN |
| TM: API POST /team/invitations is refused | ✅ TM | ✅ TM | status 403 FORBIDDEN |
| TM: API member list works but carries no last-active (matches UI) | ✅ TM | ✅ TM | 7 members, keys: user_id,name,email,role,joined_at,last_active_at |
| TM: API PATCH /team/members/{id} (role change) is refused | ✅ TM | ✅ TM | status 403 |
| TM: can reply and resolve in Comments | ✅ TM | ✅ TM |  |
| TM: reply posts (201) | ✅ TM | ✅ TM | [{"m":"POST","s":200,"u":"/auth/refresh"},{"m":"POST","s":200,"u":"/notifications/stream-ticket"},{"m":"POST","s":201,"u":"/team/comments"}] ✓ Reply posted. |
| TM: Roles tab renders the matrix | ✅ TM | ✅ TM |  |
| TM: Activity tab renders | ✅ TM | ✅ TM |  |
| TM: Leave workspace → membership gone (API) and the app moves on | ✅ TM | ✅ TM | memberships [] url /login |
| Denied: Team is not in the mobile menu | – | ✅ M, BC, AC, INV, LA |  |
| Denied: API GET /team/members → 403 (it is a workspace directory open to every role; returns names, emails, roles) | – | ❌ M, BC, AC, INV, LA | status 200, 6 members returned incl. emails |
| Audit export API: GET /team/audit/export → 200 text/csv, attachment "team-audit-log.csv", header "when,actor,action,target", one row per entry | ✅ F | ✅ F | raw capture: 200 text/csv; charset=utf-8; filename="team-audit-log.csv"; first row 2026-11-12T19:53:26.136536+00:00,<actor>,team.member.removed,<target> |

## Re-check after the fix (2026-11-12, branch `fix/rewalk-2026-11-12`)

Scratch stack: API develop `e59e1d6f` on `:8100` with its own Postgres and Redis containers (removed afterwards), FE on `next dev -p 3102`. Founder with 3 audit entries and one joined teammate.

| Control | 1440 | 375 | Evidence / note |
|---|---|---|---|
| Audit log: lists the API audit entries (reads `data.entries`) | ✅ F | ✅ F | 4 rows (invited, invited, revoked, joined) match `GET /team/audit`; no "No team activity recorded yet." |
| Audit log: Export log is enabled when the API has entries | ✅ F | ✅ F | disabled=false |
| Activity: a row prints the actor once | ✅ F | ✅ F | "A teammate joined the workspace" appears once per row |

Still not verified: the Export log button's actual download through the UI (button now enabled; the API export was already verified).
