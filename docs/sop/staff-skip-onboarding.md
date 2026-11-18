# SOP: staff land on their console, never founder onboarding (SO4)

## What shipped
FE half of the Admin re-walk's SO4 (`docs/checklist/admin-rewalk.md`; Adebayo approved 2026-11-18). Branch
`fix/staff-skip-onboarding`. Pairs with API branch `fix/staff-report-author-and-onboarding` (cofoundaz-api), which adds
`staff_role` to `GET /auth/me` and answers `409 ONBOARDING_NOT_FOR_STAFF` on the onboarding routes. Contract:
`cofoundaz-api/docs/fe-integration-guide-auth-onboarding.md`, section "Platform staff skip the wizard" (live-captured).

## Why
Every staff sign-in fell through to `/onboarding`, whose first `GET /onboarding/state` created an empty founder workspace
owned by the staff member. In the re-walk 5 of 7 workspaces were staff ghosts, inflating total workspaces and activation.

## How
| Area | Change |
|---|---|
| `lib/auth/staff.ts` (new) | `staffHome(role)`: `admin` → `/admin-portal`, `super_admin` → `/super-admin`, else `null`; `isConsolePath()`; `fetchStaffHome()` reads `/auth/me` and answers null when it can't. |
| `lib/auth/post-login.ts` | After password, MFA and Google sign-in, staff go to their console before `/onboarding/state` is ever called. A console deep link in `next` is kept; a founder page in `next` is not. Invitation links still win (unchanged). The verify page's Continue (`resolveAfterVerify`) does the same. |
| `app/(auth)/onboarding/page.tsx` | Sends staff to their console before reading state; `ONBOARDING_NOT_FOR_STAFF` on a save is a redirect, never a form error (same as `ONBOARDING_NOT_FOR_INVITED`). |

Samuel's Admin pages (reverted pending his fixes) were not touched; `/admin-portal` and `/super-admin` are today's mocks.
An older API without `staff_role` reads as "not staff", so the FE and API PRs can merge in either order.

## Verification
- `lib/auth/staff.test.ts` (8 tests): role mapping, console paths, admin / super admin / founder landings, deep links,
  verify Continue, unreadable `/auth/me`.
- `npm run typecheck`, `eslint` on the touched files.
- Live on localhost (this branch on :3105 against the API branch on :8010, scratch DB): Admin sign-in with 2FA → `/admin-portal`;
  Admin visiting `/onboarding` → bounced to `/admin-portal`; Super Admin → `/super-admin`; workspace count unchanged (2 → 2);
  a founder → `/onboarding` step 1, and only the founder got a draft (2 → 3, no staff-owned rows).

## Operate / roll back
Revert the PR. No env change.

## Follow-ups
- Samuel's Admin FE should land on `staff_role` rather than probing `/admin/me` when it returns.
- `OnboardingGate` (dashboard pages) still lets a staff member with no workspace through to a blank dashboard if they type the URL; the console is where they belong, but nothing sends them there from `/dashboard`.
