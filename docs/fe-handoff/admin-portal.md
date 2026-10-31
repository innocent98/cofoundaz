# FE hand-off: Admin Portal (`/admin-portal`)

**For:** the FE developer. **Scope:** exactly what is below. Tickets, content tools and expert vetting come in later briefs.
**Backend:** API #205 and #206, merged to `develop`. **Contract:** `cofoundaz-api/docs/fe-integration-guide-admin-users.md` (Users, Workspaces, KPIs) and `cofoundaz-api/docs/fe-integration-guide-admin-staff.md` (staff check, hidden 404, fresh code rules). Every body there was captured from a live run: trust its field names and nesting. **Gap list:** `docs/checklist/admin-prd-gaps.md` (rows A1 to A21, X1 to X4). **Design:** `# Cofoundaz Web App UI Build/Admin Portal.dc.html`.
Files: `app/admin-portal/page.tsx` (almost entirely replaced), new `lib/api/admin.ts`, new hooks and components as needed. Read `AGENTS.md` first. Delete all mock data and every "Switched to ..." toast.

## 1. Who gets in

- On entry call `GET /admin/me`. **200** = staff: show the console. **404** = not staff: send them to `/dashboard` with no message. Never show "access denied", because that reveals the console.
- The 404 body is `{"detail":"Not Found"}`, not the normal error envelope. Branch on the status, not on `error.code`.
- Any staff call can start returning 404 mid-session (revoked, or 2FA turned off): treat it the same way.
- `/admin/me` also gives `role` and `scopes`. A Super Admin has `scopes: []` and passes every scope check. **An empty list is not "no access" when `role` is `super_admin`.**
- Users and Workspaces need scope `support`. Hide those two nav items for staff without it (Super Admins always see them). If the API answers 403 `FORBIDDEN`, show "You don't have access to this section."
- Don't touch `lib/nav-access.ts`.

## 2. Layout

- Nav: **Dashboard, Workspaces, Users** only. Remove Expert vetting, Support and Content library from the nav and from the code path; no "coming soon".
- Top right: replace the "Read + support" pill with the real role, plus one chip per scope. It isn't clickable.
- Remove the global search box (P13). Users and Workspaces each have their own search.
- Default tab: **Dashboard**.

## 3. Dashboard

`GET /admin/dashboard/kpis` (guide "Dashboard KPIs").

| Tile | Value | Sub-line |
|---|---|---|
| Total workspaces | `total_workspaces.value` | "+{new_in_window} in 30 days" |
| Activation rate | `activation_rate.percent`% | Delta from `previous_percent`; **no delta when null** |
| Paid conversion | `paid_conversion.percent`% | **No delta for now** (always null) |
| MRR | `mrr.minor / 100` as ₦ | **No delta for now** (always null) |

- Each tile has a tooltip with the guide's definition.
- Chart "Signups and activations", last 30 days, from `signups_series`.
- Remove the "Needs attention" block.
- States: loading skeleton, error with Retry.

## 4. Workspaces (read-only)

- `GET /admin/workspaces`. Rows are in **`data.workspaces`**, the cursor in **`meta.next_cursor`** (never compute offsets). "Load more" uses the cursor.
- Search box (`query`), plus filters for `stage` and `billing_status`.
- Columns: Workspace + owner, Stage, Seats, Plan, Health, Last active. `health_score`, `stage`, `country`, `last_active_at` can be null: show "-".
- `seats` is paid seats and `members` is everyone. Show `seats` in the column.
- Clicking a row opens the detail from `GET /admin/workspaces/{id}`: members (each links to the user), subscription, usage meters, connected integrations. `seats_limit` null means "Unlimited". `integrations` empty shows "None connected".
- 404 `WORKSPACE_NOT_FOUND`: "No such workspace."
- No action buttons anywhere on this page.

## 5. Users

- `GET /admin/users`. Rows are in **`data.users`**, the cursor in **`meta.next_cursor`**.
- Search box (`query`) with filter chips: All, Active, Past due, Trialing, mapped to `billing_status`. Add a separate activity filter: `active`, `dormant`.
- Columns: name + email, Workspace, Plan, Billing, Activity, Account. Two separate status columns: billing is `primary_workspace.billing_status`, activity is `activity`.
- `primary_workspace` is **null** for someone with no workspace: show "-". When `workspace_count` > 1, show "+{n}" after the name.
- `status: disabled` shows as **Suspended**. Don't show the word "disabled".
- `full_name` null: fall back to email.
- **View** opens the profile.

### Profile (`GET /admin/users/{id}`)

- Sections: details, workspaces with role and plan, recent sessions (ip, user agent, signed in, ended).
- Staff targets come back with `sessions: []` and `phone: null` for an Admin: show "Hidden for staff accounts".
- 404 `USER_NOT_FOUND`: "No such user."
- Never show or ask for a password. Show only fields the API returns.

### Actions

**The `can` object decides which buttons are enabled**: `can.suspend`, `can.unsuspend`, `can.reset_password`, `can.resend_verification`. Never work this out yourself.

Each opens the shared step-up dialog (section 6):

| Button | Route | Confirm copy | Success toast |
|---|---|---|---|
| Suspend | `POST /admin/users/{id}/suspend` | **"Suspend {email}? They're signed out everywhere immediately."** | "{email} is suspended." |
| Unsuspend | `.../unsuspend` | "Restore access for {email}?" | "{email} can sign in again." |
| Send password reset | `.../reset-password` | "Email {email} a password reset link?" | "Reset email sent." |
| Resend verification | `.../resend-verification` | "Resend the verification email to {email}?" | "Verification email sent." |

After a send, disable that button for 60 seconds. Refetch the profile after every success.

Show the API's `message` for these codes: 409 `ALREADY_SUSPENDED`, `NOT_SUSPENDED`, `RESET_NOT_ALLOWED`, `ALREADY_VERIFIED`; 403 `STAFF_TARGET`; 422 `CANNOT_ACT_ON_SELF`; 429 `TOO_SOON`; 503 `EMAIL_DELIVERY_FAILED`.

## 6. Shared step-up dialog

Build one component; the Super Admin brief reuses it. Fields:

- **Reason:** 10 to 500 characters after trimming, with a counter. Block submit under 10.
- **Authenticator code:** exactly 6 digits, always empty on open. Never cache or reuse it.
- Line: "This action is permanently logged."

Errors:
- 403 `STEP_UP_INVALID`: show "That code was already used or isn't right. Wait for the next code and try again." **Never sign the user out or refresh the token on it**; 403 here is deliberate.
- 429 `TOO_MANY_ATTEMPTS`: show the API's message and disable submit.
- A 409 also uses up the code, so clear the field after any failure.

## 7. Cross-cutting rules

- No em or en dashes in copy. Use `apiClient`. Amounts are kobo in the API, ₦ on screen.
- Loading, empty and error states on every table. Empty: "Nothing matches that search."
- 375 px: tables scroll inside their card, and nothing overflows the page.

## 8. Out of scope (do not build)

Support tickets, Content library, Expert vetting, listing moderation, reported issues, impersonation, any write action on a workspace, global search, a separate `/admin` deployment.

## 9. Acceptance = the re-walk rows

Done means every row passes on merged `develop`, at 1440 and 375, as a Super Admin (rows 1 to 16 and 20) and as an Admin with each scope (rows 17 to 19). Each result must match the raw API.

| # | Row | Pass when |
|---|---|---|
| 1 | Open `/admin-portal` as a founder who isn't staff | Lands on `/dashboard`, no message, no flash of the console |
| 2 | Open it as staff | Dashboard, real role and scopes, no mock data |
| 3 | Dashboard | Tiles and chart equal `GET /admin/dashboard/kpis`; no delta where it is null |
| 4 | Workspaces search and filters | Rows equal the API; Load more uses the cursor |
| 5 | Workspace detail | Fields equal the API; no action buttons; unknown id shows the message |
| 6 | Users search by email and by workspace name | Rows equal the API |
| 7 | Filter chips and activity filter | Server filters applied |
| 8 | User with no workspace | "-", no crash |
| 9 | Profile | Buttons match `can` exactly |
| 10 | Suspend with a 9-character reason | Blocked with the counter |
| 11 | Suspend with a wrong code | Message shown, still signed in |
| 12 | Suspend correctly | Toast; status shows Suspended; that user is signed out on their next call and can't sign in |
| 13 | Suspend again straight away | Unavailable from `can`; a reused code shows the wait message |
| 14 | Unsuspend | Status back; they can sign in |
| 15 | Password reset and resend verification | Email arrives at the user; button off for 60 seconds |
| 16 | Each action | Row appears in the Super Admin audit log with your reason |
| 17 | Admin opens a Super Admin's profile | Sessions hidden, all actions off |
| 18 | Admin with `content` only | No Users or Workspaces in the nav |
| 19 | Staff member revoked mid-session | Next call lands them on `/dashboard` |
| 20 | 375 px | Every control reachable, no overflow or clipped text |
