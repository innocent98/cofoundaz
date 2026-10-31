# Admin + Super Admin portals: PRD and UI gap list (2026-10-31)

Source of truth: `Cofoundaz_Technical_PRD.md` Module 25 (Admin Portal, 25.1 to 25.5) and Module 26 (Super Admin Portal, 26.1 to 26.7), and the approved design
`docs/superpowers/specs/2026-10-31-admin-portals-design.md` (D-ADM-1 to 13; 1 to 7 are Adebayo's, 8 to 13 lead defaults). The built UI is the two unwired mocks
`app/admin-portal/page.tsx` (975 lines) and `app/super-admin/page.tsx` (1118 lines): every number, table row and button is `useState` or a toast; no call to the API.

**How this was walked, honestly:** by source. Both pages were read end to end and every control was listed (nav, search, filters, table rows and row actions, reply box,
approve/reject, toggles, dropdowns, modal). The PRD sections were read row by row. I did **not** click through the mocks in a browser at 1440 or 375: the mocks do nothing,
so a click-through would only prove the toasts. The hand re-walk of every control at 1440 + 375 for every role stays with the FE dev once the API is wired. API facts come
from merged API #205 (slice A) and the spec, not from a live walk of the mocks.

**Status vocabulary.** BE: **Built** (merged, slice A, API #205) · **Slice B/C/D/E** (spec section 4) · **Next** (spec "Next" row: tickets, content, reports) · **Waits** (needs a module that is not built) ·
**Dropped** (a D-ADM call removed it) · **Open** (the spec does not cover it: a gap or a product call, listed in the calls table). FE: **Mock** (hardcoded) · **Remove** (spec section 5 says take it out) · **Missing** (not in the mock at all).

## What exists today

- API (slice A, merged): `platform_staff`, guards `require_staff(scope)` / `require_super_admin` (role from the DB per request, TOTP required, non-staff get the unknown-route 404), `GET /admin/me`,
  `GET/POST /super-admin/staff`, `POST /super-admin/staff/{id}/revoke` (fresh single-use TOTP code + reason, audited), `GET /super-admin/audit`, `GET /super-admin/audit/export`, append-only `audit_log`.
  FE guide: `cofoundaz-api/docs/fe-integration-guide-admin-staff.md`.
- Nothing else: no users, workspaces, KPIs, flags, billing overrides, tickets, content or approval routes yet.
- Both mocks sit at `/admin-portal` and `/super-admin` in the main Next app (D-ADM-8; the PRD says `/admin`, a separate deployment). Hiding a page is not access control; every check is the API's.

## Decisions already made (do not reopen)

| ID | Effect on these pages |
|---|---|
| D-ADM-1 | Staff invite-only by a Super Admin; Admin scopes `support`, `content`, `moderation`. The mock's role labels "Support admin" / "Content admin" are scopes. |
| D-ADM-2 | Same API, TOTP required. Hardware keys later: the mock's "Hardware key" MFA label cannot be true yet. |
| D-ADM-3 | No impersonation (PRD 26.1 impersonate is out). |
| D-ADM-4 | Maintenance mode + global sign-out built, each with a second approver. Key rotation and purge are **dropped**. |
| D-ADM-5 | First release: Dashboard, Users, Workspaces, audit log, flags, billing overrides. Tickets and content next. Expert vetting waits for Marketplace. |
| D-ADM-6 | Overrides use Paystack, not Stripe; refunds and credits start as internal entries. |
| D-ADM-7 | Workspaces is a read-only list; region and residency dropped; staff MFA mandatory. |
| D-ADM-9 | Staff never read documents, journal or AI chats (no route exists). |
| D-ADM-11 | `audit_log` append-only at DB level (done), CSV export (done). |
| D-ADM-12 | Infrastructure health stays in external monitoring; only SQL-backed KPIs are built. |
| D-ADM-13 | Flags: small table, `hash(workspace_id)` bucketing. AI prompt versioning, playground and evals wait. |

## Gaps: Admin portal (`app/admin-portal/page.tsx`)

| # | Control or PRD item | BE | FE | Owner / call |
|---|---|---|---|---|
| A1 | Left nav: Dashboard, Workspaces, Users, Support, Expert vetting, Content library. Each click also fires a "Switched to X" toast. | n/a | Mock; **Remove** Expert vetting; **hide** Support and Content library until built; drop the toasts | Spec section 5 |
| A2 | Role pill "Read + support" (top right, click toasts "Read & support actions loaded"). | **Built**: `GET /admin/me` returns `role` and `scopes` | Mock | Show the real role and scopes; also the staff probe (404 means not staff, send to the normal app) |
| A3 | Global search "Search users, workspaces, tickets...". | Slice B for users and workspaces; tickets Next; **no global endpoint** | Mock (does nothing) | **Open** P13: one search box or per-page search |
| A4 | Dashboard tile: Total workspaces (2,847, "+218 this month"). | Slice B | Mock | Dashboard KPIs |
| A5 | Dashboard tile: Activation rate (64%, "+3 pts"). | Slice B; definition needed | Mock | **Open** P3 |
| A6 | Dashboard tile: Paid conversion (18.4%, "-0.7 pts"). | Slice B; definition needed | Mock | **Open** P3 |
| A7 | Dashboard tile: MRR (₦18.2M, "+11%"). | Slice B from `billing_subscriptions` (kobo); definition needed | Mock | **Open** P3 |
| A8 | "Signups and activations" bar chart, "Last 30 days", 10 bars. | Slice B (daily or 3-day buckets over 30 days) | Mock | Dashboard KPIs |
| A9 | "Needs attention": "4 Support tickets open", "3 Expert applications waiting" (both link to their tabs). | Tickets Next; vetting Waits | Mock; **Remove** both rows until their modules exist | D-ADM-5 |
| A10 | Workspaces table: Workspace + owner, Stage, Seats, Health (score and colour), Last active. No search, no filter, no row action. | Slice B (read-only list, named fields only) | Mock | D-ADM-7; add search and paging (PRD 25.1 searches by startup and id) |
| A11 | PRD 25.1 "Startup page": members, plan, usage, health of integrations. The mock has no workspace detail. | **Open**: spec says "read-only list", not a detail page | Missing | **Open** P11 |
| A12 | Users filter tabs All / Active / Past due / Trialing. | Slice B | Mock; the mock also has a "Dormant" status that no tab reaches | Spec section 5: split Status into **billing** (active, past due, trialing, free) and **activity** (active, dormant) |
| A13 | Users table: name + email, Workspace, Plan chip, Status chip. A user can be in several workspaces; the mock shows one. | Slice B | Mock | Show the first plus "+n"; plan from the subscription of that workspace |
| A14 | Users "View" (toasts "Opened profile for X"). PRD 25.1 user page: profile, workspaces and role, subscription status, recent sessions (ip, user agent), flags. | Slice B (profile, subscription, sessions) | Missing: no profile page | Slice B. "Flags" on a user: **Open**, no per-user flags exist (feature flags are per workspace, D-ADM-13) |
| A15 | PRD 25.1 actions: **Send password reset**, **Resend verification**, **Suspend user** ("Suspend {email}? They're signed out everywhere immediately.", reason required), **Unsuspend**. | Slice B | Missing (the mock has none of the four) | Spec section 5 says add them. Each: reason, audit row, confirm copy from the PRD |
| A16 | Support: tabs Open / Mine / Resolved; ticket list (id, priority Urgent/High/Normal, title, user, workspace, plan, age); selected ticket thread. | **Next** | Mock; **hide** | Spec "Next". PRD has P1 to P4, categories, SLA chips, AI triage banner: mock has 3 priorities and none of the rest |
| A17 | Support reply box + "Send reply"; **Resolve**; **Escalate** (toasts only). PRD: canned responses, internal notes tab, escalate needs a reason, resolve sends the closing email. | **Next** | Mock; **hide** | Spec "Next" |
| A18 | Where do tickets come from? There is no founder-facing "Contact support" in the app. | **Open** | Missing | **Open** P4 |
| A19 | Expert vetting: Approve / Reject / Request more info on three applications. | **Waits** (Marketplace not built) | Mock; **Remove** | D-ADM-5 |
| A20 | Content library table (item, type Course/Template/Playbook, stage, status Published/In review/Draft) + "Edit". PRD 25.4: courses and lessons CRUD, publish toggle, templates CMS, version/publish. | **Next**; conflicts with D-ACA-1 (Academy content is repo markdown, baked into the image) | Mock; **hide** | **Open** P5 |
| A21 | PRD 25.3 marketplace moderation, 25.5 reported issues: not in the mock. | 25.3 Waits; 25.5 Next | Missing | Spec "Next" and "After Marketplace" |

## Gaps: Super Admin portal (`app/super-admin/page.tsx`)

| # | Control or PRD item | BE | FE | Owner / call |
|---|---|---|---|---|
| S1 | Persistent banner "All actions on this console are permanently logged." (PRD 26 header). Not in the mock. | n/a (the append-only trigger makes it true) | **Missing** | Spec section 5: add |
| S2 | Left nav: Overview, Feature flags, AI configuration, Staff access, Tenant operations, Security, Danger zone (+ "Switched to" toasts). | n/a | Mock | Spec section 5: remove Tenant operations; hide AI configuration; add Audit explorer and Billing overrides; Users is missing from this nav (PRD 26.1) |
| S3 | Overview tile: Workspaces "2,847 across 4 regions". | Slice B | Mock | Drop "across 4 regions" (D-ADM-7) |
| S4 | Overview tile: "Uptime, 30d 99.97% within SLA". | **Dropped** to external monitoring | Mock | D-ADM-12: remove or link out |
| S5 | Overview tile: "AI spend, MTD ... 74% of budget". | **Open**: `llm_usage_daily` counts tokens per workspace; there is no platform spend in money and no platform budget | Mock | **Open** P10 |
| S6 | Overview tile: "Open incidents 1, AI gateway degraded". PRD 26.4 incident banner composer. | **Open** (no incidents table; not in any slice) | Mock | **Open** P8 |
| S7 | Overview "Infrastructure": API cluster p95, AI gateway, primary DB capacity, document store size, background jobs queued. | **Dropped** (external monitoring) | Mock | D-ADM-12: remove, or show only queue depth if wanted |
| S8 | Overview "Recent privileged actions" (3 rows: action, actor, time). | **Built** for staff actions: `GET /super-admin/audit?limit=5` (rows carry `action`, `actor_email`, `reason`) | Mock | Choose which action prefixes count as privileged (default `staff.`, `audit.`, later `user.`, `flag.`, `billing.`) |
| S9 | Feature flags: six cards (name, Beta/GA/Internal badge, description, on/off toggle, rollout % buttons). | **Slice D** | Mock | D-ADM-13. The badge is a product label, not in the table design: add a `stage` field. PRD 26.3 targeting rules (plan, stage, workspace ids), blast radius ("This affects ~{n} workspaces."), kill switch: the spec's table has bucketing only, so rules are an **Open** gap (P7b) |
| S10 | AI configuration: surface table (model, credits/run, latency), model dropdown, Guardrails (4 toggles), "Spend this month". | **Deferred** (D-ADM-13: prompts are in code) | Mock; **hide** | Spec section 5 |
| S11 | Staff access table: Staff member (name, email), Role chip, MFA, Last access, Actions (Revoke). | **Built**: list, revoke | Mock | See S12 to S15 |
| S12 | Role chip: "Super admin", "Support admin", "Content admin". | Built: `role` plus `scopes[]` | Mock | An Admin can hold several scopes; show one chip per scope. The labels "Support/Content admin" are the scopes `support`/`content`; `moderation` has no mock label |
| S13 | MFA column: "Hardware key", "Authenticator", "Not enrolled". | Built: always TOTP (an invite requires it) | Mock | "Hardware key" Dropped until D-ADM-2's later phase; "Not enrolled" cannot occur (no TOTP, no access): drop the column or show "Authenticator" |
| S14 | Last access column. | **Gap**: the list has no last-seen value (`users.last_login_at` exists) | Mock | Small BE add in slice B: `last_login_at` on each staff row |
| S15 | "Add staff member" (toast). Needs a modal: email, role, scopes, reason, and the inviter's fresh authenticator code. | **Built**: `POST /super-admin/staff` | Mock | The invitee must already have an account with 2FA on (no emailed invite): modal must say so. See P9 for editing scopes |
| S16 | Revoke (toast). Confirm with reason + fresh code; hide on your own row. | **Built** | Mock | Step-up copy in the guide (UX consequences) |
| S17 | Edit a staff member's scopes or role without revoking. | **Open**: only revoke and re-invite exist | Missing | **Open** P9 |
| S18 | Tenant operations table (workspace, region, data residency, storage, status). | **Dropped** (D-ADM-7) | Mock; **Remove** | Spec section 5. Storage per workspace is not shown anywhere else |
| S19 | Security tab: 5 toggles (Require MFA for all staff, IP allowlist, Cap super admin sessions at 60 min, Alert on anomalous data access, Allow founder self-serve export) + "Last penetration test May 2026". | **Open**: none of this is in the spec | Mock | **Open** P7 |
| S20 | Security tab "Global audit log" (Actor, Action, Target, When). | **Built**: `GET /super-admin/audit` + `/audit/export` | Mock | Becomes the Audit explorer page. "Target" has no single column: use `entity_type`, `entity_id` and `details.email` (names exist only for staff actions today) |
| S21 | PRD 26.7: row expand with before/after; "impersonation-only" toggle; 7-year retention. | `audit_log` keeps only `before_hash` / `after_hash` (no readable diff) | Missing | Known gaps in spec section 6; before/after stays a hash. Impersonation toggle moot (D-ADM-3) |
| S22 | Danger zone: Enable maintenance mode, Force global sign-out (each opens a modal: reason + "Approver" select). | **Slice E** | Mock | D-ADM-4. Approver list = other active Super Admins from `GET /super-admin/staff`, never the requester (the mock lists a CEO and two leads) |
| S23 | Maintenance mode text: "Puts every workspace into read-only". | **Open**: needs a platform-wide write block across ~30 routers, the same cost that deferred read-only mode in D-SET-8 | Mock | **Open** P6 |
| S24 | Danger zone: Rotate all encryption keys, Purge deleted workspaces. | **Dropped** (D-ADM-4) | Mock; **Remove** | Spec section 5 |
| S25 | PRD 26.1 Users page (everything in 25.1 plus staff roles). The mock has no Users page. | Slice B (same routes: staff with the `support` scope or a Super Admin) | **Missing** | Super Admin reaches Users through the same `/admin` routes; one page, two entry points |
| S26 | PRD 26.6 Billing overrides: refund, apply credit, extend trial, change plan (no charge), comp. Not in the mock. | **Slice C** | Missing | Spec section 5: add |
| S27 | PRD 26.5 Platform analytics (funnel, WAU, mission completion, retention cohorts, Health Score uplift, conversion, plan mix, AI credit distribution). Not in the mock. | **Open**: not in any spec slice | Missing | **Open** P8 |
| S28 | PRD 26.4 System health (service grid, event-bus lag, AI gateway panel, incident composer). | **Dropped** (D-ADM-12) except the incident composer, which is **Open** | Missing | **Open** P8 |
| S29 | PRD 26.2 AI configuration (agent registry, versioned prompts, rollback, playground, evals). | **Deferred** (D-ADM-13) | Missing | Known gap |
| S30 | PRD 26.1 Impersonate user. | **Dropped** (D-ADM-3) | Missing | Known gap |

## Cross-cutting

| # | Item | BE | FE | Owner / call |
|---|---|---|---|---|
| X1 | Entering a console: call `GET /admin/me`; 404 means "not staff" (body `{"detail":"Not Found"}`, not the error envelope). Never show "access denied". | Built | Missing | Guide `fe-integration-guide-admin-staff.md` |
| X2 | Step-up dialog: reason (min 10 characters) + fresh authenticator code on every mutation; a code works once for about 90 s; the same code twice gives 403 `STEP_UP_INVALID` (not 401: do not sign out). | Built for staff mutations | Missing | Guide. **Open** P1: whether Admin (non-super) mutations also need a code |
| X3 | Denser tables at 375: both mocks use wide tables with no mobile treatment. | n/a | Mock | Re-walk at 1440 and 375 |
| X4 | "No coming soon": sections not built are left out, not stubbed. | n/a | Mock | Spec section 5 |

## Product calls and spec gaps (flagged, not decided)

Each has a **default** that slice B or the FE will follow unless Adebayo says otherwise; all are cheap to change.

| ID | Question | Default |
|---|---|---|
| P1 | Do **Admin** (support scope) mutations (suspend, reset password, resend verification) need a fresh authenticator code like Super Admin ones? The spec requires step-up only for Super Admin mutations. | **Yes**: reason, audit row and a fresh code on every staff mutation. Costs a code per support action; safest for suspend. If no: reason and audit only for Admin. |
| P2 | Staff acting on staff accounts: can an Admin suspend or reset a staff member, can anyone suspend themselves? | An Admin cannot act on any staff account (hidden 404); a Super Admin can act on Admins, not on themselves; nobody suspends themselves. Revoke staff access first, then suspend. |
| P3 | Definitions for the KPI tiles. | **Total workspaces** = non-deleted startups; **activation** = workspaces that finished onboarding within 14 days of signup, over signups, per 30-day window; **paid conversion** = workspaces on a paid, non-trial subscription over all active workspaces; **MRR** = sum of monthly-equivalent kobo of active paid subscriptions (annual / 12). Deltas compare to the previous 30 days. |
| P4 | Ticket intake: there is no founder-facing "Contact support" form, so the queue would be empty. | Build the intake (a Help entry in Settings that opens a ticket) as part of the Tickets slice; until then Support stays hidden. |
| P5 | Content CMS vs D-ACA-1 (Academy content is repo markdown, shipped in the image; a CMS needs it in the database). | Keep repo markdown for Academy in v1 and build the CMS only for Templates metadata first, or defer the whole CMS; decide when the Content slice starts. |
| P6 | Maintenance mode implies a platform-wide write block. | Build it as a single middleware check on non-GET requests behind a platform setting (allow-list: auth, staff routes, health), not per router. Show the status message to users via an existing banner call. |
| P7 | The Security tab's five toggles and the pen-test date. | Replace the tab with read-only facts: "MFA is required for all staff" (always true, D-ADM-7), session rule (step-up per action), no toggles. IP allowlist is an edge (nginx) setting, not an app switch; alert on anomalous access and founder-export toggle are not built and are removed. Drop the pen-test tile. P7b: flag targeting rules (plan, stage, workspace ids, PRD 26.3) are not in D-ADM-13; default is bucketing plus an explicit workspace allow-list only. |
| P8 | Not covered by any slice: Platform analytics (PRD 26.5), the incident banner composer (26.4), "Open incidents" tile. | Out of this build; add a "Platform analytics" slice after E if wanted. The Admin dashboard tiles (A4 to A8) cover the first KPIs. |
| P9 | Change a staff member's role or scopes without revoke and re-invite. | Add `PATCH /super-admin/staff/{id}` (role, scopes, reason, fresh code) as a small follow-up; until then the UI offers revoke then invite. |
| P10 | "AI spend, MTD, % of budget": only tokens per workspace exist. | Show platform tokens this month and credits used (1 credit = 50 tokens, D-SET-9); no money figure or budget line until a platform budget is set. |
| P11 | Workspace detail page (members, plan, usage, integration health, PRD 25.1 "Startup page"). | Slice B builds a read-only detail with member count and roles (no names beyond email), plan, usage meters and which integrations are connected, with no content. If you want only the list, say so. |
| P12 | Suspended users and login: does suspend block sign-in as well as end sessions? | Yes: status `disabled` already fails authentication on every request and at login; unsuspend sets `active`. A "locked" account (failed logins) is a different state and is left alone. |
| P13 | Global search box in the top bar. | Per-page search only (Users, Workspaces); remove the global box until Tickets exists. |

## Build order

1. **Slice A** (done, API #205): staff, guards, staff routes, audit explorer.
2. **Slice B** (next): Users (search, profile, subscription, sessions, suspend, unsuspend, reset password, resend verification), Workspaces list (and read-only detail per P11), Dashboard KPIs (A4 to A8), staff `last_login_at` (S14).
3. **Slice C** billing overrides, **D** flags, **E** maintenance mode and global sign-out.
4. FE (junior dev, exact-scope briefs from the guides): Admin and Super Admin consoles on merged API, then the 1440 + 375 re-walk of every control for every role.
5. Next: tickets (with intake, P4), content CMS (P5), reported issues. After Marketplace: expert vetting, listing moderation.

## Ledger

| Item | State |
|---|---|
| Slice A API #205 | Merged. |
| This list | Written 2026-10-31 on `docs/admin-prd-gaps`; docs PR open, not merged. |
| Left | Adebayo's answers to P1 to P13 (defaults stand until then); slices B to E; FE and re-walk by the FE dev. |
