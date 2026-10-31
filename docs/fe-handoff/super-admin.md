# FE hand-off: Super Admin Portal (`/super-admin`)

**For:** the FE developer. **Scope:** exactly what is below. Feature flags, Billing overrides and Danger zone come in a later brief, when their API is merged.
**Build after** `docs/fe-handoff/admin-portal.md`: reuse its step-up dialog and staff check.
**Backend:** API #205 and #206, merged to `develop`. **Contract:** `cofoundaz-api/docs/fe-integration-guide-admin-staff.md`, plus `fe-integration-guide-admin-users.md` for KPIs. Every body was captured live. **Gap list:** `docs/checklist/admin-prd-gaps.md` (rows S1 to S30, X1 to X4). **Design:** `# Cofoundaz Web App UI Build/Super Admin Portal.dc.html`.
Files: `app/super-admin/page.tsx` (almost entirely replaced), `lib/api/admin.ts`, new components as needed. Read `AGENTS.md` first. Delete all mock data and every "Switched to ..." toast.

## 1. Who gets in

- On entry call `GET /admin/me`. 200 with `role: "super_admin"`: show the console.
- 200 with `role: "admin"`, or a 404: send them to `/dashboard` with no message. Never show "access denied".
- Any `/super-admin` call returning 404 mid-session (`{"detail":"Not Found"}`, not the error envelope) means the same thing.

## 2. Layout

- **Persistent banner on every tab:** "All actions on this console are permanently logged."
- Nav: **Overview, Staff access, Audit log, Security**.
- Remove from the nav and the code: Feature flags, AI configuration, Tenant operations, Danger zone. No "coming soon".

## 3. Overview

- Tiles: **Workspaces**, from `GET /admin/dashboard/kpis` `total_workspaces.value`. Drop "across 4 regions".
- Remove Uptime, AI spend, Open incidents and the Infrastructure block. The API doesn't provide them (D-ADM-12, P8, P10).
- "Recent privileged actions": `GET /super-admin/audit?limit=5`, showing action, `actor_email`, time.

## 4. Staff access

`GET /super-admin/staff`. **`id` is the staff row, used for revoke and edit. `user_id` is the account.**

- Columns: Staff member (name, email), Role, Last access, Actions. **Remove the MFA column**: every staff member has an authenticator by definition, and "Hardware key" isn't true yet.
- `full_name` null: show the email. `last_login_at` null: "Never". `invited_by_email` null is fine for the first Super Admin.
- Role: "Super admin", or one chip per scope for an Admin: Support, Content, Moderation.
- Revoked rows (`revoked_at` set) show as "Revoked" and offer no actions.
- **Hide Revoke and Edit on your own row.**

### Add staff member (`POST /super-admin/staff`)

Modal: email, role, scopes, then the shared step-up dialog fields.

- Admin needs at least one scope. For Super Admin, hide the scopes.
- Note in the modal: "They need a Cofoundaz account with an authenticator app turned on first. There's no emailed invite."
- Success is 201 and also covers reinstating a revoked person. Toast "{email} added."
- `USER_NOT_FOUND` and `STAFF_MFA_REQUIRED`: show the API's message; it says what the person must do. Other error codes are in the guide's table.

### Edit (`PATCH /super-admin/staff/{id}`)

Same fields without email. Toast "Access updated." 409 `ALREADY_REVOKED`: "That access was revoked. Add them again." then refetch.

### Revoke (`POST /super-admin/staff/{id}/revoke`)

Step-up dialog with confirm **"Revoke staff access for {email}? It stops on their next request."** Toast "Access revoked."

All three use the shared step-up dialog, so every error rule in the Admin brief section 6 applies, including `STEP_UP_INVALID`: never sign the user out on it.

## 5. Audit log

`GET /super-admin/audit` (guide "audit explorer").

- Filters: actor, action, workspace, date range. Paging by cursor with "Load more". A bad cursor (422) refetches from the start.
- Columns: When, Actor, Action, Target, Reason. There's no single target column: show `entity_type` and `entity_id`, plus `details` when present.
- `reason`, `details`, `actor_email` and others can be null on older rows: show "-".
- Row expand shows the `details` JSON readably. **No before and after view**: only hashes are stored.
- **Export:** a dialog asks for a reason (10 to 500 characters; no code needed), then an authenticated `fetch` to `/super-admin/audit/export` with the current filters and `reason`, saved as a Blob named `audit-log.csv`. Not an `<a href>`, because the token is a header. Max 5000 rows: say so in the dialog. The export writes its own audit row, so refetch afterwards.
- Field errors on this route are prefixed `query.`, for example `query.reason`.

## 6. Security

Read-only facts, no toggles (P7):

- "Authenticator app required for all staff."
- "A fresh code is required for every staff action."

Remove the five toggles and the penetration test line. The Global audit log moves to section 5.

## 7. Cross-cutting rules

Same as the Admin brief section 7.

## 8. Out of scope (do not build)

Feature flags, Billing overrides, Danger zone, maintenance mode, AI configuration, Tenant operations, System health, Platform analytics, incidents, impersonation, the Users page (Super Admins use `/admin-portal`), hardware keys, editing or deleting audit rows.

## 9. Acceptance = the re-walk rows

Done means every row passes on merged `develop`, at 1440 and 375, as a Super Admin, with row 1 also as a founder and an Admin. Each result must match the raw API.

| # | Row | Pass when |
|---|---|---|
| 1 | Open `/super-admin` as a founder, then as an Admin | Both land on `/dashboard`, no message, no flash |
| 2 | Open it as a Super Admin | Banner on every tab; four nav items; no mock data |
| 3 | Overview | Tile and rows equal the API |
| 4 | Staff list | Rows equal the API; no MFA column; no actions on your own row or on revoked rows |
| 5 | Add a person with no account, then one with no authenticator | API messages shown; nothing added |
| 6 | Add an Admin with two scopes | Toast; row shows two chips |
| 7 | Add with no scope | Blocked |
| 8 | Edit scopes | Saved; reload shows it |
| 9 | Revoke | Toast; that person's next staff call lands them on `/dashboard` |
| 10 | Add the revoked person again | Same row returns active |
| 11 | Reuse a code straight after an action | Wait message; still signed in |
| 12 | Audit list, each filter, Load more | Rows equal the API |
| 13 | Export without a reason | Blocked |
| 14 | Export with a reason | `audit-log.csv` downloads; a new `audit.exported` row appears |
| 15 | Older row with null reason | "-", no crash |
| 16 | Security tab | Facts only, no toggles |
| 17 | 375 px | Every control reachable, no overflow or clipped text |
