# Admin Portal + Super Admin Portal: design

Date: 2026-10-31. Status: **approved calls, ready to build**. PRD Modules 25 and 26 (`Cofoundaz_Technical_PRD.md:769-800`).
Mocks: `app/admin-portal/page.tsx`, `app/super-admin/page.tsx`. Both are unwired; the API has no platform roles or admin routes.

## 1. Decisions

D-ADM-1..7 are Adebayo's, accepted 2026-10-31 ("Accept all defaults").

| ID | Decision |
|---|---|
| D-ADM-1 | Staff are invite-only by a Super Admin; the first is created by command. Roles: Admin (scoped `support`, `content`, `moderation`) and Super Admin. |
| D-ADM-2 | Same API and database, staff-only routes, TOTP required. Hardware keys later (known gap against PRD 26). |
| D-ADM-3 | No impersonation in v1. `audit_log.on_behalf_of_user_id` already exists, so it can be added. |
| D-ADM-4 | Build maintenance mode and global sign-out, each with a second approver. Defer key rotation and purge. |
| D-ADM-5 | First release: Dashboard, Users, Workspaces, audit log, flags, billing overrides. Tickets and content next. Expert vetting waits for Marketplace. |
| D-ADM-6 | Overrides use Paystack, not the PRD's Stripe. Refunds and credits start as internal entries, each with a reason and an audit row. |
| D-ADM-7 | Workspaces is a read-only list. Region and residency are dropped. MFA is mandatory for staff. |

Lead defaults, reversible:

| ID | Default |
|---|---|
| D-ADM-8 | Both portals stay routes in the main Next app, not the PRD's separate deployment (D-ADM-2 keeps one API). Every staff check is server-side; hiding a page is not access control. |
| D-ADM-9 | Staff can never read documents, journal, or AI chats (PRD 25). There is no staff route to them. |
| D-ADM-10 | Staff can also be founders on their own accounts. Staff power comes only from staff routes, never from workspace routes. |
| D-ADM-11 | `audit_log` becomes append-only at DB level in this work (PRD:198), with CSV export. A separate immutable store comes later. |
| D-ADM-12 | Infrastructure health stays in external monitoring; only SQL-backed KPIs are built here. |
| D-ADM-13 | Flags use a small table with `hash(workspace_id)` bucketing, as the mock shows. AI prompt versioning, playground and evals wait until prompts leave code. |

## 2. Access model

- New `platform_staff` table: `user_id` (unique), `role` (`admin`, `super_admin`), `scopes[]`, `invited_by`, `revoked_at`. A separate table means no column on `users` that a mass-assignment bug could set.
- Roles are read from the DB on every request, not from JWT claims, so a revoke applies at once. Today's token carries only `sub` and `exp` (`app/core/security.py:68-76`) and stays that way.
- New dependencies `require_staff(scope)` and `require_super_admin`, on routers under `/admin` and `/super-admin`. They need a verified user, active staff row, and TOTP enrolled. An unknown caller gets 404, so the routes don't reveal themselves.
- Step-up: Super Admin mutations need a fresh TOTP code. Exact window to be set in the build.
- These routers are cross-tenant and don't use `tenant_scope`. Each query names its fields, so restricted content can't appear through a broad select.
- First Super Admin: `python -m app.scripts.create_super_admin <email>`, run by hand. The user must already exist and have TOTP on.

## 3. Audit

- Every staff mutation calls `write_audit` with a required reason (min 10 characters).
- `/super-admin/audit`: filter by actor, action, workspace, date; CSV export. Export is itself audited.
- A migration adds a DB trigger that rejects `UPDATE` and `DELETE` on `audit_log`. Check first that no retention job or test deletes rows.

## 4. Build slices

One API PR per slice, each with SOP, checklist and live-captured FE guide. FE follows on merged API.

| Slice | Content | Backing data |
|---|---|---|
| A | `platform_staff`, guards, create-super-admin command, staff invite and revoke, audit trigger and explorer | New table; `audit_log` |
| B | Users (search, profile, subscription, sessions, suspend, unsuspend, reset password, resend verification), Workspaces read-only, Dashboard KPIs | Existing tables. Suspend sets `disabled` and revokes `AuthSession` rows |
| C | Billing overrides: refund, credit, extend trial, comp | Billing tables; new internal entries |
| D | Feature flags | New table |
| E | Maintenance mode and global sign-out, with second approver | New approval table; session revoke-all |
| Next | Tickets (P1-P4, SLA, notes, canned replies), content CMS, reported issues | New tables |
| After Marketplace | Expert vetting, listing moderation | Marketplace not built |

Slices A and B come first; A blocks everything. Security-critical slices (A, C, E) get an Opus review per task.

## 5. FE changes to the mocks

- Admin: remove Expert vetting until Marketplace; hide Support and Content library until built. Add suspend, reset password and resend verification, which the mock lacks. Split the mock's Users status into billing and activity columns.
- Super Admin: remove Tenant operations (D-ADM-7), and key rotation and purge from Danger zone (D-ADM-4). Hide AI configuration. Add Audit explorer, Billing overrides, and the persistent "All actions on this console are permanently logged" banner (PRD 26).
- No "coming soon": sections not built are left out.

## 6. Known gaps against the PRD

Hardware-key MFA; impersonation; separate Admin deployment; 7-year immutable audit store; AI prompt versioning; System Health service grid. All are deliberate calls above.

## 7. Open for the build

- `learning.py` may already cover part of the course CMS: check when the Next slice starts.
- Paystack refund API call: internal entry first, then decide whether to call the provider (D-ADM-6).
