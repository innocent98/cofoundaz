# FE hand-off: Super Admin Danger zone, plus the app-wide maintenance banner

**For:** the FE developer. **Scope:** exactly what is below. **Build after** `docs/fe-handoff/super-admin-flags-billing.md`: reuse the staff check, the console banner and the shared step-up dialog (`docs/fe-handoff/admin-portal.md` section 6).
**Backend:** API #209, merged to `develop`. **Contract:** `cofoundaz-api/docs/fe-integration-guide-admin-danger-zone.md`, with every body captured live. **Gap list:** `docs/checklist/admin-prd-gaps.md` (S22, S23, S24, P6). **Design:** `# Cofoundaz Web App UI Build/Super Admin Portal.dc.html` (Danger zone tab).
Files: `app/super-admin/page.tsx`, `lib/api/admin.ts`, and, for part B, `lib/api/client.ts` plus a banner in the dashboard layout or `components/shell-top-bar.tsx`. Read `AGENTS.md` first.

Add **Danger zone** to the Super Admin nav, last. It has two actions: **maintenance mode** and **global sign-out**. **Remove** the mock's "Rotate all encryption keys" and "Purge deleted workspaces" (D-ADM-4).

## A. Danger zone tab

Load `GET /super-admin/danger-zone` and show:
- Maintenance: On or Off, plus `message` and `since` when on.
- "Last global sign-out": `last_global_signout_at`, or "Never".
- Requests waiting: `pending_count`.

### Requesting (needs a second Super Admin)

Two buttons, **Turn on maintenance mode** and **Sign everyone out**. Each opens the shared step-up dialog plus:

- **Approver** select from `eligible_approvers`, showing name or email, with "Any other Super Admin" as the first option (send no `approver_user_id`). **If `eligible_approvers` is empty, disable both buttons** and say "Another active Super Admin is needed to approve this."
- Maintenance only: an optional **message** (1 to 280 characters, with a counter), placeholder "Cofoundaz is being upgraded. Your work is safe." Send nothing when empty, and the API uses its default text.
- Confirm copy:
  - Maintenance: **"Every founder's saves are blocked until someone switches maintenance off. Reading still works."**
  - Sign-out: **"Everyone is signed out, every founder and every staff member, including you once it's approved."**
- `POST /super-admin/approvals` with `action` `maintenance_enable` or `global_signout`. Success is 201: toast "Request sent. It runs when another Super Admin approves it, and expires in 60 minutes."

### Requests list

`GET /super-admin/approvals`, with filter chips **Pending, Approved, Rejected, Expired, Cancelled, All** and "Load more" using `meta.next_cursor`.

Each row shows action, requester, designated approver (or "Any"), reason, message, status, and expiry or decision time with the decision reason. Actions, each through the step-up dialog:
- **Approve** and **Reject:** only on pending rows you didn't request. Calls `POST /super-admin/approvals/{id}/approve` or `/reject`.
- **Cancel:** only on your own pending rows. Calls `.../cancel`.

After any action, refetch the overview and the list.

**Approving a global sign-out signs you out too.** After a successful approve of `global_signout`, show "Everyone has been signed out, including you. Sign in again to continue." Then clear the session and go to `/login`, the same as the normal "session ended" path.

### Switching maintenance off (one person)

When maintenance is on, show **Turn maintenance off** with the step-up dialog and **no approver select**. It calls `POST /super-admin/maintenance/disable`. Toast "Maintenance is off." 409 `MAINTENANCE_NOT_ON`: refetch.

### Errors

Show the API's message for: 422 `CANNOT_DECIDE_OWN_REQUEST`, `NO_SECOND_APPROVER`, `APPROVER_INVALID`, `MESSAGE_NOT_ALLOWED`; 409 `APPROVAL_ALREADY_PENDING`, `APPROVAL_NOT_PENDING`, `APPROVAL_EXPIRED`, `MAINTENANCE_ALREADY_ON`, `REQUESTER_NOT_ACTIVE`; 403 `NOT_DESIGNATED_APPROVER`, `NOT_YOUR_REQUEST`; 404 `APPROVAL_NOT_FOUND`. Every 409 means "already settled": refetch the list after showing it. `STEP_UP_INVALID` follows the shared dialog's rules.

## B. App-wide maintenance banner (founder app)

This is what founders see while maintenance is on. It ships in the same PR.

- **Banner status.** `GET /platform/status` needs no login. Call it on app load and every 60 seconds while the tab is visible. When `maintenance.enabled` is true, show a full-width banner above the page with `maintenance.message`. Hide it when off.
- **On a 503 with `error.code == "MAINTENANCE_MODE"`** from any API call, in `lib/api/client.ts`:
  - Show the banner straight away with the response's `error.message`.
  - Reject the call with the API's message, so the page's own error state shows it.
  - **Never** sign the user out, refresh the token or retry automatically. Respect `Retry-After: 60` for the next status check.
- While the banner is on, reading still works. Pages stay usable apart from saving.
- Don't add special cases per page. Sign-in, refresh, logout, password reset and email verification keep working on the API side; signup, profile edits and 2FA setup get the 503 like any other save.

## C. Out of scope (do not build)

Key rotation, purging workspaces, scheduling maintenance in advance, editing a sent request, a maintenance allow-list editor, live push of status (polling only).

## D. Acceptance = the re-walk rows

Done means every row passes on merged `develop`, at 1440 and 375, with **two Super Admin accounts**, A and B, plus a founder. Each result must match the raw API.

| # | Row | Pass when |
|---|---|---|
| 1 | Danger zone as A | Overview equals the API; no key rotation or purge |
| 2 | Only one Super Admin exists | Both request buttons disabled with the explanation |
| 3 | A requests maintenance with a message, approver B | 201 toast; row pending in A's list |
| 4 | A tries to approve its own request | No Approve button; the API message if forced |
| 5 | A requests maintenance again | `APPROVAL_ALREADY_PENDING` message |
| 6 | B rejects it | Status rejected with B's reason; nothing changes |
| 7 | A requests again; A cancels | Status cancelled |
| 8 | A requests; B approves | Maintenance shows On with the message |
| 9 | Founder, while on | Banner with the message; a save shows the message; still signed in; pages readable |
| 10 | Founder, banner timing | Appears within 60 s without a reload |
| 11 | A turns maintenance off (no approver) | Off; founder banner gone within 60 s; saves work |
| 12 | Turn off again | 409 handled by refetch |
| 13 | A requests sign-out; B approves | B lands on `/login` with the message |
| 14 | A and the founder after sign-out | Both land on sign-in on their next action; both can sign in again |
| 15 | "Last global sign-out" | Shows the time |
| 16 | A request older than 60 minutes | Listed as Expired; no actions |
| 17 | Every action | Audit log shows it with the reason |
| 18 | Admin or founder opens the tab URL | Lands on `/dashboard` |
| 19 | 375 px | Every control reachable, no overflow; the banner wraps |
