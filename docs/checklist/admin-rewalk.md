# Admin Portal + Super Admin: every-control re-walk of the merged FE

**Date:** 2026-11-18. **Walked:** FE `develop` `821ddfa` (Samuel's #256 Portal, #263 Support Tickets, #264 User
Management + Reports + founder Report action, #266 Super Admin), against API `develop` `4d5d60d6` (head migration 0109).
**Branch for this doc:** `docs/admin-rewalk` (docs only, PR to `develop`).

**Verdict: FAIL. Not ready for `main`/www.** 114 rows: **85 pass, 25 fail, 3 blocked, 1 not run.** Four blockers
crash a page or stop a whole feature (the staff Support tab, the founder's ticket thread, founder ticket creation and the
Super Admin Billing overrides tab). One theme explains most failures: the FE types were written by guessing field names
instead of copying the API guides' captured bodies, and the unit tests mock the same guessed shapes, so CI was green
while the live pages break. The rest is one undefined colour token (`brand`) used 105 times, which makes primary buttons,
active nav items and the flag ON switch invisible.

| Role | Pass | Fail | Blocked | Not run |
|---|---|---|---|---|
| Signed out | 2 | 0 | 0 | 0 |
| Founder (F) | 13 | 4 | 1 | 0 |
| Team member (TM) | 2 (+2 shared with M) | 0 | 0 | 0 |
| Mentor (M) | 3 (+2 shared with TM) | 0 | 0 | 0 |
| Admin, support scope | 22 (+1 on /super-admin) | 9 | 1 | 1 |
| Admin, content scope | 1 | 0 | 0 | 0 |
| Admin, moderation scope | 10 | 1 | 0 | 0 |
| Super Admin (SA) | 29 | 11 | 1 | 0 |

## How it was walked

- **Stack (local only, nothing touched staging, www or the shared docker stack):** API `origin/develop` in its own
  worktree (`cofoundaz-api/wt/arw-api`), migrated from zero on a scratch Postgres + Redis (`arw-pg` :55501,
  `arw-redis` :56501), uvicorn on :8030 plus the worker, stub LLM, file email backend. Every key (SECRET_KEY, the Fernet
  keys) was generated for the run; no `.env` was read. FE: this worktree on `next dev` :3007 with
  `API_PROXY_TARGET=http://127.0.0.1:8030`.
- **Accounts (throwaway, `arw-…@example.com`, placeholders):** seeded through the real API (signup, email verify from
  the captured mail, onboarding, invitations). Staff enrolled TOTP through `/auth/mfa/totp/setup`; the first Super Admin
  came from `python -m app.scripts.create_super_admin` (the documented operator path), the four Admins (support,
  moderation, content, second support) were invited through `POST /super-admin/staff`. Authenticator codes came from a
  local script holding the generated secrets, which never reused a code.
- **A row passes** when the control, clicked in the browser pane, does what the brief says and the screen equals the raw
  API (same role, `GET` from a script) or the network log. 1440 × 900 and 375 × 812. Evidence: screenshots in
  `admin-rewalk-evidence/`, plus "network log" where the proof is the request list.
- Briefs walked against: `docs/fe-handoff/admin-portal.md`, `super-admin.md`, `super-admin-flags-billing.md`,
  `admin-support-tickets.md`, `admin-reported-issues.md`; contracts: `cofoundaz-api/docs/fe-integration-guide-admin-*.md`.

## Defects for Samuel

Each: page, steps, expected, actual, severity. File pointers are where the wrong shape lives; the fix is to match the
guide's captured body, then make the unit-test mocks use the guide's capture too.

### Blockers

**D1. Admin Portal › Support tab crashes on open (every staff member).**
Steps: sign in as any support Admin or the Super Admin, open `/admin-portal`, click Support (or "View Support").
Expected: ticket queue + thread pane (brief `admin-support-tickets.md` part 2).
Actual: the whole page crashes, `TypeError: Cannot read properties of undefined (reading 'number')` at
`components/admin/admin-support-view.tsx:793`. The FE types the thread as `{ticket: {...}, messages, notes}`
(`lib/api/admin-tickets.ts:72`), the API returns a flat ticket (guide capture `staff_detail_new`). The tab auto-opens the
first ticket, so nothing in Support can be used: filters, reply, canned responses, notes, assign, priority, escalate,
resolve, reopen and Manage replies are all unreachable (rows AP6, AP7). Evidence `ap-support-crash-1440.jpg`.

**D2. Settings › Help: opening any ticket crashes the founder's Settings page; the deep link crashes too.**
Steps: founder → Settings › Help → click T-1001; or open `/settings/help/{id}`.
Expected: the thread, messages oldest first, reply box.
Actual: `TypeError ... (reading 'status')` at `components/settings/help-tab.tsx:300`. Same nesting mistake in
`lib/api/support.ts:38` (`FounderTicketDetail.ticket`). Reply, reopen-by-reply, `TICKET_CLOSED` and "Ticket not found"
are unreachable (F11, F12, F15). Evidence `f-help-thread-crash-1440.jpg`, `f-help-deeplink-crash-1440.jpg`.

**D3. Settings › Help: a founder can never create a ticket.**
Steps: Help › New ticket, pick a category, subject "abc rewalk new ticket", any message, Submit.
Expected: 201, then the thread.
Actual: 422 every time, banner "Please check the highlighted fields." with nothing highlighted. The FE sends `message`
(`lib/api/support.ts:51` `CreateTicketPayload`); the API and guide want `body`. (The brief's wording "message (1-5000)"
describes the field's label; the guide's body is the contract.) Row F14, evidence `f-help-create-422-1440.jpg`.

**D4. Super Admin › Billing overrides crashes once a workspace has a subscription row.**
Steps: SA → Billing overrides → search "Other" → select → Grant credit 500 with a reason and code.
Expected: history row, "Credits granted in total: 500".
Actual: the credit is saved (200) and the reload `GET` succeeds, then the console crashes: "Objects are not valid as a
React child (found: object with keys {key, name})". `lib/api/admin-super.ts:92` types `subscription.plan` as a string;
the API (guide `admin-billing` capture) sends `{"key","name"}`. Every workspace that ever opened Billing has a
subscription row, and the first override creates one, so the tab is unusable for real data. Refund, mark-done, comp,
extend-trial and replay could not be walked (S34, S36). Evidence `sa-billing-crash-after-credit-1440.jpg`.

### High

**D5. Undefined colour token `brand`: primary buttons, the active nav item, the flag ON switch and chart bars are
invisible.** Steps: open any Admin, Super Admin or Help screen. Expected: visible primary actions and state.
Actual: `bg-brand`, `text-brand`, `ring-brand`, `border-brand` (105 uses in 12 files: `app/admin-portal/page.tsx` 29,
`super-admin-flags-view.tsx` 13, `super-admin-billing-view.tsx` 12, `help-tab.tsx` 11, `super-admin-audit-view.tsx` 10,
`admin-support-view.tsx` 9, …) resolve to nothing, because the theme defines only `brand-*` shades (`bg-brand-strong`,
`bg-brand-100`, …). Result: white text on a transparent background. Seen on: the active Admin/Super Admin nav item
(desktop and mobile menu), "View Support", "Search", "Apply filters", "Add staff member", "New feature flag",
"New ticket", every step-up dialog's submit button, the selected billing chip, the **flag ON switch and the selected
rollout %** (a Super Admin can't see whether a kill switch is on, S29), and the Signups bars on the dashboard chart
(13 signups drawn as nothing). Rows AP3, AP5, AP16, AP31, S1, S29, S43, F9, F17. Evidence
`ap-dashboard-admin-support-1440.jpg`, `sa-flag-on-invisible-switch-1440.jpg`.

**D6. Super Admin › Feature flags: the allow-list can never be saved, and an existing allow-list shows as empty.**
Steps: edit a flag → search "Rewalk" → add Rewalk Co → reason + code → Save.
Expected: saved; card "Affects 1".
Actual: 422 "Please check the highlighted fields." The FE sends `workspace_ids`
(`components/super-admin/super-admin-flags-view.tsx:197-202`); the API wants `workspace_allowlist` (guide
`admin-flags`). It also reads `editingFlag.workspace_ids`, so a list set elsewhere would display as "No workspaces
restricted". Row S32, evidence `sa-flag-allowlist-search-1440.jpg`.

**D7. Super Admin › Audit log: three of four filters do nothing, and the export ignores them too.**
Steps: Audit log → set Action "staff.revoke", or Actor = an email, or Start date 2030-01-01 → Apply.
Expected: rows filtered as the API does (guide: `actor_id` uuid, `action` exact or `prefix.`, `workspace_id`,
`date_from`, `date_to`).
Actual: the Action dropdown values are invented (`staff.invite`, `staff.edit`, `staff.revoke`, `user.suspend`,
`audit.export`, `flag.create`…) while the API writes `staff.invited`, `staff.updated`, `staff.revoked`,
`user.suspended`, `audit.exported`…, so every choice returns nothing. Actor is sent as `actor=<email>` and the dates as
`start_date`/`end_date`, which the API ignores, so the list stays unfiltered (`lib/api/admin-super.ts:189-195` and the
same at `:243-249` for the export). Only Workspace works. Rows S14, S15, S16, S23.

### Medium

**D8. Admin Portal › Workspaces: owner, plan, seats and subscription don't match the API.**
List: owner "-" on every row (API `owner_name`, `owner_email`), Plan "-" (API `plan_key: "starter"`). Detail: Owner "-";
Seats "/ Unlimited" while the API says `usage.seats_used: 2, seats_limit: 1`; Plan tier and Billing status blank (API
`subscription.plan_name`, `status`); usage meters not shown at all (API `usage{…}`); member rows show the email as the
name though `full_name: "Femi Founder"` is set. Cause: `lib/api/admin.ts:39-108` invents `owner{}`, `plan`,
`members_count`, `usage_meters`. Rows AP8, AP9; evidence `ap-workspaces-1440.jpg`, `ap-workspace-detail-1440.jpg`.

**D9. Admin Portal › Users: workspace, plan, IP and last-active are wrong.**
List: Workspace column "-" for everyone (API `primary_workspace.workspace_name`), Plan "-" (`plan_key`). Profile: every
session "Unknown IP" (API `ip: "127.0.0.1"`), Last active "-" (API `last_login_at`), workspace plan "Free Free", revoked
sessions not marked as ended (API `revoked_at`; FE reads `ended_at`). Status shows raw "Pending_verification". Rows AP11,
AP19; evidence `ap-user-profile-founder-1440.jpg`.

**D10. Feature flags: "Affects 0 of 0 workspaces".** The total comes from the list root `total_workspaces` (6 here),
not from each flag. Row S24.

**D11. AI Co-Founder chat forgets "Reported" after a reload.** The chat never calls `GET /reports/mine` (roadmap thread,
BB drawer and Team comments do), so the Report action comes back on a reported reply. Brief part 1 "Reported state".
Row F4.

**D12. Admin Portal: success toasts are hidden under the profile modal.** "{email} is suspended.", "Reset email sent."
etc. render (`role=status`, z-50) behind the modal overlay, so the staff member never sees them. Row AP17, evidence
`ap-reset-cooldown-toast-hidden-1440.jpg`.

**D13. Admin Portal header at 375:** "Admin Portal" wraps on top of the role pill and the scope chip is not visible.
Row AP29, evidence `ap-dashboard-375.jpg`.

### Low

- **D14. Reports detail keeps Dismiss / Escalate / Remove on a report you just closed** (until you switch tab); the API
  would answer `REPORT_CLOSED`. Row R8, `ap-reports-dismissed-stale-actions-1440.jpg`.
- **D15. Escape doesn't close the user profile modal,** and keystrokes meant for the search box are swallowed while it is
  open. Row AP26.
- **D16. Expanding an audit row widens the page to 1536 px at 1440** (Export and Reason pushed off screen). Row S19,
  `sa-audit-expanded-overflow-1440.jpg`.
- **D17. New flag key is silently rewritten** (`Bad-Key` → `badkey`) instead of showing the field error, and
  Description is required although the API defaults it to "". Row S25.
- **D18. Staff scope toggles expose no state** (no `aria-pressed`), colour only. Row S12.
- **D19. Copy:** Help "last reply" is an absolute date (brief: relative); workspace member role shows "Team_member".

## Security observations

| # | Severity | Owner | Observation |
|---|---|---|---|
| SO1 | Medium | API (lead call) | **Reports detail shows the comment author's email to moderators.** When the author has no full name, `GET /admin/reports/{id}` puts the email in `author.name` (`"name":"arw-tm-…@example.com"`). D-ADM-9 / the brief say "author name only". The FE renders what it gets, so this needs an API fallback (e.g. "A teammate", as `/team/comments` does). Evidence `ap-reports-open-mod-1440.jpg`. |
| SO2 | Medium | FE (D7) | **Audit export silently drops the actor and date filters.** A Super Admin who filters to one actor or one day and exports gets up to 5,000 rows of everyone (with emails) instead. It stays traceable (the `audit.exported` row records the real, empty filters) but it is more personal data leaving the system than the person chose. |
| SO3 | Low | FE | **Non-staff see the console exists for a moment.** Founder, TM, mentor and signed-out visits briefly render "Verifying console access..." (`/admin-portal`) or "Loading console..." then "404 - Not Found" (`/super-admin`) before the redirect. The brief says no flash. No staff data is requested (only `GET /admin/me`, which 404s), so nothing leaks beyond the console's existence. |
| SO4 | Low | API / product | **Every staff sign-in lands on `/onboarding`, which creates an empty workspace owned by the staff member.** At the end of this walk 5 of the 7 workspaces belonged to staff accounts (2 real founders); it inflates the KPIs (total workspaces, activation rate) and makes staff "founders" of ghost workspaces. Not Samuel's; worth a lead decision (send staff to the console, or don't create a workspace on `GET /onboarding/state`). |
| SO5 | Info | FE | **Held up under test:** no staff endpoint is called for anon, F, TM or M (only `/admin/me`); 403 `STEP_UP_INVALID` never signs anyone out and always clears the code; codes are single-use; 5 wrong codes → 429 with submit disabled; revoke takes effect on the next request and lands the person on `/dashboard`; a revoked person is reinstated into the same row; Admins can't act on Super Admin profiles; content-scope Admins see no Users/Workspaces/Support/Reports; moderators can't decide escalated reports; CSV formula cells are escaped (`'=HYPERLINK(...)`); report notes with `<b>` render as text. Ticket bodies (one seeded with `<script>`) could not be checked for plain-text rendering because of D1/D2. |
| SO6 | Info | FE | Team members see colleagues' emails on Team › Members and Comments (allowed: F + TM, decision 2026-11-12); mentors see no emails anywhere walked, and have no Team page. |

## Not covered, and why

- Every Support tab control and the founder ticket thread (blocked by D1, D2).
- Billing refund / mark done / comp / extend trial / replay / `PAID_SUBSCRIPTION` (blocked by D4; refunds also need a
  paid invoice, which a local stack without Paystack can't produce).
- Users and Workspaces "Load more": 13 users and 7 workspaces are under the page size of 20 (Audit Load more passed).
- Report and ticket rate limits (10/hour, 5/hour) and the 503 `EMAIL_DELIVERY_FAILED` path: not exercised.
- Founder Billing (part C of the flags-billing brief) was built by the lead's team in #226 and walked then; not repeated.

## Rows

| # | Control | Role | Width | Expected | Actual | Result | Evidence |
|---|---|---|---|---|---|---|---|
| G1 | /admin-portal signed out | anon | 1440 | /dashboard, no console, only /admin/me | /admin/me 404 → /dashboard → /login?next=/dashboard; no other staff call | PASS | network log |
| G2 | /super-admin signed out | anon | 1440 | same | same | PASS | network log |
| G3 | /admin-portal founder | F | 1440 | /dashboard, no message | /admin/me 404 → /dashboard | PASS | network log |
| G4 | /admin-portal TM, mentor | TM, M | 1440 | same | same | PASS | network log |
| G5 | /super-admin TM, mentor | TM, M | 1440 | same | same | PASS | network log |
| G6 | /super-admin as Admin (support) | Admin | 1440 | /dashboard | /admin/me 200 role admin → /dashboard → /onboarding (staff account has no workspace) | PASS | network log |
| AP1 | Dashboard tiles | Admin(support) | 1440 | equal /admin/dashboard/kpis, no delta when null | 3 / +3 in 30 days / 66.7% "No delta available" / 0% / ₦0 match API | PASS | ap-dashboard-admin-support-1440.jpg |
| AP2 | Role + scope chips | Admin(support) | 1440 | "Admin" + one chip per scope | "Admin" + "support" chip | PASS | read_page |
| AP3 | Active nav tab, View Support button, Signups bars | Admin(support) | 1440 | visible | invisible: `bg-brand` undefined token, transparent bg + white text | FAIL | ap-dashboard-admin-support-1440.jpg |
| AP4 | Dashboard Refresh button | Admin(support) | 1440 | refetch | refetches /admin/me, kpis, attention | PASS | network log |
| AP5 | Needs attention + View Support | Admin(support) | 1440 | "{open} support tickets open", links to Support | "5 support tickets open" (5 seeded); button invisible (bg-brand) but works | PASS (visual FAIL under AP3) | ap-dashboard-admin-support-1440.jpg |
| AP6 | Support tab opens | Admin(support) | 1440 | queue + thread | page crashes: TypeError reading `ticket.number`; FE expects `{ticket:{...}}`, API returns a flat ticket (guide `staff_detail_new`) | FAIL (blocker) | ap-support-crash-1440.jpg |
| AP7 | Every other Support control (filters, open, reply, canned, assign, priority, escalate, resolve, reopen, notes, Manage replies) | Admin(support) | 1440/375 | per brief | not reachable: the tab crashes on first load (auto-opens the first ticket) | BLOCKED by AP6 | - |
| AP8 | Workspaces list | Admin(support) | 1440 | rows equal API | name/stage/seats/last active match; owner "-" for all (API has owner_name/owner_email); Plan "-" for all (API plan_key "starter") | FAIL | ap-workspaces-1440.jpg |
| AP9 | Workspace detail | Admin(support) | 1440 | fields equal API, no actions | Owner "-"; Seats "/ Unlimited" (API seats_used 2, seats_limit 1); Plan tier + Billing status blank (API Starter/free); usage meters not shown; member names show email (API full_name "Femi Founder"); no action buttons (pass) | FAIL | ap-workspace-detail-1440.jpg |
| AP10 | Workspace member "View user" | Admin(support) | 1440 | opens user profile | switches to Users and opens profile | PASS | ap-user-profile-founder-1440.jpg |
| AP11 | User profile | Admin(support) | 1440 | fields equal API; buttons follow `can` | buttons match `can` exactly; IP "Unknown IP" (API `ip` 127.0.0.1); Last active "-" (API last_login_at set); workspace plan shows "Free Free"; revoked sessions not marked ended | FAIL (data) / PASS (can) | ap-user-profile-founder-1440.jpg |
| AP12 | Suspend, 9-char reason | Admin(support) | 1440 | blocked with counter | submit disabled, "9 / 500 chars (min 10)" | PASS | ap-stepup-suspend-open-1440.jpg |
| AP13 | Suspend, wrong code | Admin(support) | 1440 | message, still signed in, code cleared | 403 STEP_UP_INVALID → brief's copy shown, code field emptied, still on console | PASS | ap-stepup-wrong-code-1440.jpg |
| AP14 | Suspend, correct code | Admin(support) | 1440 | toast, Suspended, user locked out | 200; chip "Suspended"; buttons follow new `can`; founder login now INVALID_CREDENTIALS; all 3 sessions revoked in API | PASS | ap-suspended-profile-1440.jpg |
| AP15 | Reused code straight after an action | Admin(support) | 1440 | wait message, still signed in | 403, message shown, still signed in | PASS | network log |
| AP16 | Unsuspend | Admin(support) | 1440 | status back | 200, chip "Active"; Unsuspend submit button invisible (bg-brand) | PASS (visual FAIL under AP3) | - |
| AP17 | Success toasts | Admin(support) | 1440 | toast visible | toast is in the DOM ("Reset email sent.") but sits under the profile modal overlay; user never sees it | FAIL | ap-reset-cooldown-toast-hidden-1440.jpg |
| AP18 | Send password reset | Admin(support) | 1440 | email arrives; off 60 s | "Reset your password" mail to the founder; button "Reset password (59s)" disabled | PASS | ap-reset-cooldown-toast-hidden-1440.jpg |
| AP19 | Users list | Admin(support) | 1440 | rows equal API | names, billing, activity, account match; Workspace column "-" for every user (API primary_workspace.workspace_name set, FE reads `name`); Plan "-" (API plan_key); status shows raw "Pending_verification" | FAIL | read_page dump |
| AP20 | Users search by email ("founder2") | Admin(support) | 1440 | rows equal API | 1 row, Ola Other | PASS | network log |
| AP21 | Users search by workspace name ("Rewalk Co") | Admin(support) | 1440 | rows equal API | founder, TM, mentor (3 rows) | PASS | network log |
| AP22 | Billing chips (All, Active, Past due, Trialing) + activity filter | Admin(support) | 1440 | server filters applied | `billing_status=trialing` → "Nothing matches that search."; `activity=dormant` → 3 dormant users; All billing clears | PASS | network log |
| AP23 | User with no workspace | Admin(support) | 1440 | "-", no crash | "-" in list; profile "No workspaces joined." | PASS | ap-resend-verification-cooldown-1440.jpg |
| AP24 | Resend verification | Admin(support) | 1440 | email arrives; off 60 s | "Verify your email" mail to the unverified user; button "Resend email (51s)" disabled | PASS | ap-resend-verification-cooldown-1440.jpg |
| AP25 | Admin opens a Super Admin's profile | Admin(support) | 1440 | sessions hidden, all actions off | phone + sessions "Hidden for staff accounts"; all four actions disabled | PASS | ap-admin-views-superadmin-profile-1440.jpg |
| AP26 | Escape key on profile modal | Admin(support) | 1440 | closes | does not close; the next search keystrokes were swallowed | FAIL (low) | - |
| AP27 | Users Load more | Admin(support) | 1440 | uses meta.next_cursor | not exercisable: 13 users < page size 20 | NOT RUN | - |
| AP28 | Workspaces search + stage + billing filters | Admin(support) | 375 | server filters applied | `stage=idea` → 2 rows; `+billing_status=trialing` → "Nothing matches that search."; `query=Other` → Other Co | PASS | network log |
| AP29 | Header at 375 | Admin(support) | 375 | no overlap or clipping | "Admin Portal" wraps over the "Admin" pill; the scope chip is not visible | FAIL | ap-dashboard-375.jpg |
| AP30 | Tables at 375 (Users, Workspaces) | Admin(support) | 375 | scroll inside card, no page overflow | page 375 = viewport; tables 719 px scroll inside an overflow-x:auto card | PASS | ap-users-375.jpg, ap-workspaces-375.jpg |
| AP31 | Profile + step-up dialog at 375 | Admin(support) | 375 | every control reachable | both fit; Cancel and close work; active chip "All billing", Search button and primary submit invisible (AP3) | PASS (visual FAIL under AP3) | ap-profile-375.jpg, ap-stepup-375.jpg |
| F1 | AI chat: Report on assistant reply only | F | 1440 | flag on ready assistant messages, never on own prompt | one "Report reply" button, on the AI reply only | PASS | f-ai-report-dialog-1440.jpg |
| F2 | Report dialog: "Something else" needs a note | F | 1440 | note required | label switches to "Note *", Submit disabled until typed | PASS | f-roadmap-report-other-note-required-1440.jpg |
| F3 | Report AI reply (abusive + note) | F | 1440 | 201, toast, "Reported" | 201; toast "Thanks, we'll take a look"; label "Reported" | PASS | f-ai-reported-toast-1440.jpg |
| F4 | AI chat "Reported" survives a reload | F | 1440 | GET /reports/mine on load, label stays | /reports/mine never called on /ai; Report offered again after reload | FAIL | network log |
| F5 | Report the same reply again | F | 1440 | 409 ALREADY_REPORTED treated as success | 409 → dialog closes, toast, "Reported" | PASS | network log |
| F6 | Roadmap comment thread: Report on others' comments, not own | F | 1440 | per brief | Report on mentor + TM comments; own new comment shows Edit/Delete and no Report | PASS | f-roadmap-reported-1440.jpg |
| F7 | Roadmap: report with "Something else" + note | F | 1440 | 201, Reported, /reports/mine refetch | 201, "Reported", /reports/mine refetched | PASS | f-roadmap-reported-1440.jpg |
| F8 | Business Builder comment drawer: Report (privacy) | F | 1440 | 201, Reported | 201, toast, "Reported" | PASS | f-bb-reported-1440.jpg |
| F9 | Settings › Help list | F | 1440 | number, subject, category label, status, last reply | 5 rows T-1001..T-1005 match API; "last reply" is an absolute date, not relative; "New ticket" button invisible (bg-brand) | PASS (minor) | f-help-list-1440.jpg |
| F10 | Help status filter All / Open / Resolved | F | 1440 | `status=` sent | `status=resolved` → empty state, `status=open` → 5 | PASS | network log |
| F11 | Open a ticket thread | F | 1440 | thread view | Settings page crashes: TypeError reading `ticket.status`; FE expects `{ticket, messages}`, API returns a flat ticket | FAIL (blocker) | f-help-thread-crash-1440.jpg |
| F12 | Deep link /settings/help/{id} | F | 1440 | thread view | same crash | FAIL (blocker) | f-help-deeplink-crash-1440.jpg |
| F13 | New ticket: 2-char subject | F | 1440 | field error | "Subject must be between 3 and 200 characters." client-side | PASS | - |
| F14 | New ticket: valid submit | F | 1440 | 201, go to thread | 422 every time: FE sends `message`, API and guide want `body`; banner "Please check the highlighted fields." with nothing highlighted | FAIL (blocker) | f-help-create-422-1440.jpg |
| F15 | Thread reply, reopen-by-reply, TICKET_CLOSED, "Ticket not found" | F | 1440/375 | per brief | not reachable (F11) | BLOCKED by F11 | - |
| M1 | Roadmap thread as mentor | M | 1440 | Report on others' comments only; no member emails | Report on founder + 2 TM comments; own comment shows Edit, no Report; no email on the page | PASS | read_page |
| M2 | Team page as mentor | M | 1440 | no access | "You don't have access to this page." | PASS | - |
| M3 | Settings › Help as mentor | M | 1440 | only own tickets | empty state (no tickets of theirs) | PASS | - |
| T1 | Settings › Help as TM | TM | 1440 | only own tickets | only T-1005 (their own) | PASS | - |
| T2 | Team › Comments index as TM (changed in #264) | TM | 1440 | Report on others' comments, not own | Report on mentor + founder comments; none on own two; emails visible to TM (allowed, F+TM) | PASS | tm-team-comments-report-1440.jpg |
| R1 | Admin(content) nav | Admin(content) | 1440 | no Users/Workspaces/Support/Reports | nav = Dashboard only; no "View Support" link; header "Admin" + "Content" | PASS | read_page |
| R2 | Admin(moderation) nav | Admin(mod) | 1440 | Reports visible, no support tabs | nav = Dashboard, Reports | PASS | ap-reports-open-mod-1440.jpg |
| R3 | Reports tabs + badges | Admin(mod) | 1440 | equal /admin/reports/counts, refetch after actions | Open 6 / Escalated 0 / Closed 0 = API; refetched after each action (5/0/1 → 4/1/1 → 3/1/2) | PASS | ap-reports-open-mod-1440.jpg |
| R4 | Type filter, reason filter, search | Admin(mod) | 1440 | server params | `type=ai_message`, `type=comment`, `reason=spam`, `query=landing` all sent and applied | PASS | network log |
| R5 | Detail pane | Admin(mod) | 1440 | snippet as text, reporter name+email, author name only, "AI Co-Founder" for AI | snippet + note rendered as plain text (`<b>` shown literally); reporter name+email; AI author "AI Co-Founder"; comment author shown as an email (API sends the email in `author.name` when the author has no full name; see security notes) | PASS (FE) | ap-reports-open-mod-1440.jpg |
| R6 | Dismiss, 9-char reason | Admin(mod) | 1440 | blocked | submit disabled | PASS | - |
| R7 | Dismiss, valid reason | Admin(mod) | 1440 | 200, refetch list/counts/detail | 200; Open 6→5, Closed 1; audit history shows decision + reason | PASS | ap-reports-dismissed-stale-actions-1440.jpg |
| R8 | Actions on a just-decided report | Admin(mod) | 1440 | no Dismiss/Escalate/Remove on a closed report | detail pane keeps showing Dismiss, Escalate and Remove after Dismiss and after Remove until you switch tab (Closed tab itself shows only Restore) | FAIL (low) | ap-reports-dismissed-stale-actions-1440.jpg |
| R9 | Escalate | Admin(mod) | 1440 | moves to Escalated; moderator sees "Waiting for a Super Admin", no actions | as expected; escalation reason in audit history | PASS | ap-reports-escalated-waiting-1440.jpg |
| R10 | Remove, wrong code | Admin(mod) | 1440 | STEP_UP_INVALID message, code cleared, still signed in | 403 → brief copy, field cleared, still on console | PASS | network log |
| R11 | Remove, correct code | Admin(mod) | 1440 | 200; sibling reports leave Open | 200; status Removed; Open 4→3 | PASS | ap-reports-removed-1440.jpg |
| R12 | Closed tab | Admin(mod) | 1440 | status chips; Restore only on removed | "Dismissed"/"Removed" chips; Restore shown on the removed one only | PASS | ap-reports-closed-restore-1440.jpg |
| F16 | AI chat after removal | F | 1440 | muted "Removed by moderation" (API text), no copy/report/regenerate/feedback | as expected; no actions on the removed message | PASS | f-ai-removed-by-moderation-1440.jpg |
| F17 | Help list + Roadmap at 375 | F | 375 | no page overflow | page width 375 on both; "New ticket" button invisible (AP3) | PASS (visual FAIL under AP3) | f-help-list-375.jpg |
| S1 | Open /super-admin as Super Admin | SA | 1440 | banner on every tab, no mock data | banner "All actions on this console are permanently logged." on every tab; nav Overview, Feature flags, Billing overrides, Staff access, Audit log, Security (flags + billing per the flags-billing brief); active nav item invisible (AP3) | PASS (visual FAIL under AP3) | sa-overview-1440.jpg |
| S2 | Overview | SA | 1440 | Workspaces tile = kpis; last 5 audit rows = API | tile 6 / "+6 in 30 days"; 5 rows with action, actor email, reason ("-" when null), time | PASS | sa-overview-1440.jpg |
| S3 | Staff list | SA | 1440 | rows = API; no MFA column; no actions on own or revoked rows | as expected; email shown when full_name null | PASS | sa-staff-1440.jpg |
| S4 | Add: no account | SA | 1440 | API message, nothing added, code cleared | "No account with that email. They need to sign up first."; code cleared; stayed on console despite the 404 status | PASS | - |
| S5 | Add: no authenticator | SA | 1440 | API message | 422 "Staff must have an authenticator app turned on. Ask them to enable it first." | PASS | - |
| S6 | Add with no scope | SA | 1440 | blocked | submit disabled with all scopes off | PASS | sa-add-staff-dialog-1440.jpg |
| S7 | Add Admin with two scopes | SA | 1440 | toast, two chips | 201; toast "{email} added."; chips Moderation + Support | PASS | sa-staff-added-two-scopes-1440.jpg |
| S8 | Reuse a code straight after an action (Edit) | SA | 1440 | wait message, still signed in | 403 → brief copy, still signed in | PASS | network log |
| S9 | Edit scopes | SA | 1440 | saved, reload shows it | PATCH 200; after reload chip = Content | PASS | - |
| S10 | Revoke | SA | 1440 | toast; their next staff call 404 | toast "Access revoked."; row "Revoked", no actions; that account's GET /admin/me → 404 | PASS | sa-staff-revoked-1440.jpg |
| S11 | Add the revoked person again | SA | 1440 | same row returns active | 201; one row, active, Support | PASS | - |
| S12 | Scope toggle buttons | SA | 1440 | state exposed to assistive tech | selected state is colour only (no aria-pressed) | FAIL (low, a11y) | - |
| S13 | Audit list | SA | 1440 | columns When, Actor, Action, Target, Reason; "-" for nulls | as expected; target = entity_type:entity_id | PASS | sa-audit-1440.jpg |
| S14 | Audit: Action filter | SA | 1440 | rows = API for each action | dropdown values are invented (`staff.invite`, `staff.edit`, `staff.revoke`, `user.suspend`, `audit.export`, `flag.create`…); the API writes `staff.invited`, `staff.updated`, `staff.revoked`, `user.suspended`, `audit.exported`…; `action=staff.revoke` returns 0 rows while a `staff.revoked` row exists | FAIL | network log + DB action list |
| S15 | Audit: Actor filter | SA | 1440 | rows = API | FE sends `actor=<email>`; the API takes `actor_id` (uuid), so the filter is ignored and every actor is listed | FAIL | network log |
| S16 | Audit: Date range | SA | 1440 | rows = API | FE sends `start_date`/`end_date`; the API takes `date_from`/`date_to`; a 2030 start date still returns 25 rows | FAIL | network log |
| S17 | Audit: Workspace filter | SA | 1440 | rows = API | `workspace_id=` applied, 13 rows for Rewalk Co | PASS | - |
| S18 | Audit: Load more | SA | 1440 | cursor paging | `cursor=` sent, 25 → 50 rows | PASS | network log |
| S19 | Audit: row expand | SA | 1440 | details JSON readable | JSON shown; expanding widens the page to 1536 px at a 1440 viewport (Export button and Reason column pushed off screen) | FAIL (low) | sa-audit-expanded-overflow-1440.jpg |
| S20 | Export without a reason | SA | 1440 | blocked | "Download audit-log.csv" disabled at 0 chars; dialog says max 5,000 rows | PASS | - |
| S21 | Export with a reason | SA | 1440 | authenticated fetch, `audit-log.csv`, new `audit.exported` row, list refetched | file name `audit-log.csv`; 94 data rows + header = `details.rows: 94`; new `audit.exported` row on top | PASS | sa-audit-export-excerpt.csv |
| S22 | Export: formula cells escaped | SA | 1440 | `=…` cells prefixed so spreadsheets don't run them | reason `=HYPERLINK(...)` exported as `'=HYPERLINK(...)` | PASS | sa-audit-export-excerpt.csv |
| S23 | Export honours the on-screen filters | SA | 1440 | export uses current filters | export sends the same wrong param names as S15/S16, so actor and date filters are silently dropped from the export too (the audit row records them as null) | FAIL | code + S15/S16 |
| S24 | Flags list | SA | 1440 | cards = GET /super-admin/flags; affected counts | empty list correct; after create, card shows name, key, BETA, description, switch, rollout buttons; "Affects 0 of **0** workspaces" while the API says `total_workspaces: 6` | FAIL | sa-flag-created-1440.jpg |
| S25 | New flag, bad key | SA | 1440 | field error | the key box silently rewrites input (`Bad-Key` → `badkey`) and submits; no field error is ever shown | FAIL (low) | - |
| S26 | New flag, taken key | SA | 1440 | API message, code cleared | 409 "A flag with that key already exists."; code cleared | PASS | - |
| S27 | New flag | SA | 1440 | off at 0% | 201; card off at 0% | PASS | sa-flag-created-1440.jpg |
| S28 | Rollout 10% / turn on | SA | 1440 | impact check before confirm; card updates | `/impact?enabled=…&rollout_pct=10` called; dialog "This affects ~0 workspaces (now 0). Changes are live for real users at once."; PATCH 200; toast | PASS | sa-flag-impact-dialog-1440.jpg |
| S29 | Switch and selected rollout when ON | SA | 1440 | visibly on | the ON switch and the selected 10% button render invisible (AP3), so a Super Admin can't see whether a kill switch is on | FAIL | sa-flag-on-invisible-switch-1440.jpg |
| S30 | Turn off keeps rollout | SA | 1440 | rollout restored | off → card still 10%; API `rollout_pct: 10` | PASS | - |
| S31 | Save with nothing changed | SA | 1440 | NO_CHANGE message | 422 "Send at least one field to change." | PASS | - |
| S32 | Allow-list a workspace | SA | 1440 | "Affects 1", names not ids | search works (`/admin/workspaces?query=Rewalk&limit=5`), name shown; save always 422: FE sends `workspace_ids`, API wants `workspace_allowlist`; the FE also reads `workspace_ids` back, so an existing allow-list would show as empty | FAIL | sa-flag-allowlist-search-1440.jpg |
| S33 | Billing: find workspace, no subscription | SA | 1440 | "Starter, free" | search + select work; "Starter, free"; no invoices; credits total 0 | PASS | sa-billing-starter-free-1440.jpg |
| S34 | Billing: Credit 500 | SA | 1440 | 200, history row, reload | POST 200 and GET reload, then the whole console crashes: "Objects are not valid as a React child (found: object with keys {key, name})"; FE types `subscription.plan` as a string, API (and guide) send `{key, name}`; any workspace with a subscription row crashes this tab | FAIL (blocker) | sa-billing-crash-after-credit-1440.jpg |
| S35 | Billing: Extend trial on non-trial | SA | 1440 | disabled | disabled with tooltip "Only available when workspace is in trialing status" | PASS | sa-billing-starter-free-1440.jpg |
| S36 | Billing: refund, mark done, comp, extend trial, replay, history | SA | 1440/375 | per brief | not reachable after S34 (every override creates a subscription row; refunds also need a paid invoice, which a local stack without Paystack can't produce) | BLOCKED | - |
| S37 | Security tab | SA | 1440/375 | facts only, no toggles | two read-only cards; 0 inputs, switches or buttons | PASS | sa-security-1440.jpg |
| S38 | Super Admin in /admin-portal | SA | 1440 | all tabs; "Super admin" | nav Dashboard, Workspaces, Users, Support, Reports; header "Super admin" | PASS | ap-reports-restored-sa-1440.jpg |
| S39 | Escalated report: Super Admin decides | SA | 1440 | Dismiss/Remove offered; decision closes it | Dismiss + Remove offered; Dismiss 200; Escalated 1→0 | PASS | - |
| S40 | Restore removed content | SA | 1440 | step-up; status Restored | 200; "Restored" chip; audit history | PASS | ap-reports-restored-sa-1440.jpg |
| S41 | Step-up lockout | Admin(support) | 1440 | 429 TOO_MANY_ATTEMPTS: API message, submit disabled | 5×403 then 429; "Too many attempts. Try again in 15 minutes."; submit disabled; still signed in | PASS | ap-stepup-lockout-429-1440.jpg |
| S42 | Staff revoked mid-session | Admin(support) | 1440 | next call lands on /dashboard | Super Admin revoked in a second tab; Admin's next call (`/admin/workspaces`) 404 → /dashboard → /onboarding | PASS | network log |
| S43 | Super Admin at 375 | SA | 375 | every control reachable, no overflow | page width 375 on all six tabs; tables scroll in card; hamburger opens nav; the active item is invisible in the mobile menu (AP3) | PASS (visual FAIL under AP3) | sa-overview-375.jpg, sa-mobile-nav-375.jpg |
