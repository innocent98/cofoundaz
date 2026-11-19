# Notifications: click-through re-walk on merged develop

**Verdict: DONE. 109 of 109 role × width checks pass, 0 fail** (31 control rows).

**What was walked (FE #247):** the Notifications page for the founder in depth (Inbox with filter chips, mark read, archive, restore, row click, Mark all read, live arrival over the stream, Preferences, Digest & quiet hours, Archived, the bell panel) and, for the other six roles, that the page opens, matches the API, marks read and saves preferences.

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


## Findings
None failed.

## NOT verified (labelled, not walked)
- Digest e-mails and quiet-hours behaviour at send time (only the saved settings are checked, not a real digest send).
- Observation: a `calendar.reminder` notification carries the other recipients' `user_ids` in its `data` payload; not shown in the UI.

## Rows

| Control | 1440 | 375 | Evidence / note |
|---|---|---|---|
| Inbox: header "N unread · M need you today" equals API counts | ✅ F | ✅ F | API unread 8, urgent_unread 0; UI: 8 unread · 0 need you today |
| Inbox: filter chips show the API counts (All/Unread/Urgent/Mentions/AI/Deadlines/Billing) | ✅ F | ✅ F | all equal |
| Inbox: one row per notification (All) | ✅ F | ✅ F | UI 8 / API 8 |
| Filter Mentions: shows only mention rows (count equals chip) | ✅ F | ✅ F | UI 1 / API 1 |
| Filter Unread: shows the unread rows | ✅ F | ✅ F | UI 8 / API 8 |
| Filter with zero matches (Billing) shows an empty state | ✅ F | ✅ F | Nothing here. |
| Row: Mark as read → POST 200, unread count drops by one (API + header) | ✅ F | ✅ F | status 200, unread 8→7 |
| Sidebar Notifications badge equals the unread count | ✅ F | ✅ F | badge "Notifications 7" unread 7 |
| Row: Archive → POST 200, row leaves the inbox, archived count +1 | ✅ F | ✅ F | status 200 archived 1 rows 7 |
| Archived tab lists the archived notification | ✅ F | ✅ F | / 7 / + Invite / ✓ / Archived / Undo / Inbox / Preferences / Digest & quiet hours / Archived / Archived notifications / Past notifications you dismissed from your inbox. / You were mentioned by A team |
| Archived: Restore → back in the inbox (archived count 0) | ✅ F | ✅ F | archived 0 |
| Row click: marks the row read and opens its related page (when it has one) | ✅ F | ✅ F | "•" → /notifications unread 9→8 |
| Mark all read → POST 200, unread = 0 (API), header "Nothing unread" | ✅ F | ✅ F | unread 0; header "undefined" |
| Mark all read: topbar bell badge clears | ✅ F | ✅ F | bell "" |
| Live: a mention made by a teammate appears in the open inbox without a reload (SSE stream) | ✅ F | ✅ F | rows 10→11; API unread 1 |
| Preferences: a row for each of the 13 categories with in-app and email toggles | ✅ F | ✅ F |  |
| Preferences: every toggle shows the value stored in the API | ✅ F | ✅ F | 13/13 equal |
| Preferences: toggling Finance in-app saves (PUT) and flips in the API | ✅ F | ✅ F | in_app.finance true→false |
| Preferences: toggling Marketing email saves | ✅ F | ✅ F | categories.marketing false→true |
| Preferences: master email switch saves | ✅ F | ✅ F | master_email true→false |
| Preferences: values persist after reload | ✅ F | ✅ F |  |
| Digest: choosing Daily saves digest=daily | ✅ F | ✅ F | {"master_email":false,"digest_mode":"daily","digest_time":"08:00","digest_day":0,"quiet_enabled":false,"quiet_from":"20:00","quiet_until":"06:00","timezone":"Africa/Lagos"} |
| Digest: choosing Weekly saves digest=weekly | ✅ F | ✅ F | {"master_email":false,"digest_mode":"weekly","digest_time":"08:00","digest_day":0,"quiet_enabled":false,"quiet_from":"20:00","quiet_until":"06:00","timezone":"Africa/Lagos"} |
| Digest: choosing Off saves digest=realtime | ✅ F | ✅ F | {"master_email":false,"digest_mode":"realtime","digest_time":"08:00","digest_day":0,"quiet_enabled":false,"quiet_from":"20:00","quiet_until":"06:00","timezone":"Africa/Lagos"} |
| Quiet hours: toggle saves | ✅ F | ✅ F | false → true |
| Topbar bell opens a panel with recent notifications and a link to the inbox | ✅ F | ✅ F |  |
| page renders for this role; one row per API notification | ✅ TM, M, BC, AC, INV, LA | ✅ TM, M, BC, AC, INV, LA | UI 6 / API 6 |
| tabs Inbox, Preferences, Digest & quiet hours, Archived all present | ✅ TM, M, BC, AC, INV, LA | ✅ TM, M, BC, AC, INV, LA |  |
| Mark as read works for this role | ✅ TM, M, BC, AC | ✅ TM, M, BC, AC, INV | unread 5→4 |
| Preferences lists the categories the API returns for this role | ✅ TM, M, BC, AC, INV, LA | ✅ TM, M, BC, AC, INV, LA | UI 13 / API 13: Documents, Business Builder, Roadmap & missions, Health & assessment, Team, Finance, Marketing, Sales, Validation, Academy, AI & insights, Billing, Calendar |
| Preferences toggle saves for this role | ✅ TM, M, BC, AC, INV, LA | ✅ TM, M, BC, AC, INV, LA |  |
