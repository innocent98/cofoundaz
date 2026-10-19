# Re-walk fixes: Mission + shell

**What shipped:** six FE fixes found by the click-through re-walk of Today's Mission on `develop` (PR `fix/rewalk-mission-shell`). Health rows 7-10 are below; Roadmap and Business Builder rows are added to the same PR.

| # | Fix | Where |
|---|---|---|
| 1 | Authenticated `/auth/*` calls (`/auth/me`, sessions, MFA setup) now refresh and retry on 401. Only credential endpoints (login, signup, refresh, verify, password forgot/reset, MFA challenge, `/shared/`, `/sign/`) are exempt. Root cause: `isAuthEndpoint` exempted every `/auth/` path, so an expired token at load left `me=null` and role-gated UI (+ Invite) missing until reload. | `lib/api/client.ts` (`isCredentialEndpoint`), `lib/api/client.test.ts` |
| 2 | Mission toggle/snooze/reject/reorder return `Promise<boolean>`; success toasts only after the server confirms, "Couldn’t save that. Try again." otherwise (the optimistic update still reverts via refetch). | `hooks/useMissionApi.ts`, `app/(dashboard)/mission/page.tsx` |
| 3 | Invite modal validates each row client-side, ignores fully empty extra rows, and maps any server 422 to "Enter a valid email address." (raw validator text is never rendered). | `components/team/invite-modal.tsx` |
| 4 | Weekends switch and Delivery time select carry explicit `aria-label`s. | `app/(dashboard)/mission/settings/page.tsx` |
| 5 | "Assigned to you" rows have a `Complete task: {title}` checkbox for founder and team member: `PATCH /roadmap/tasks/{id}` `{"status":"done"}` (live response: `data.status = "done"`), then refetch `/missions/today`. | `hooks/useMissionApi.ts` (`completeAssigned`), mission page |
| 6 | One guard at the dashboard shell: a role the sidebar hides a section from sees "You don't have access to this page." with a Back to dashboard link. Gated sections render nothing while the profile loads; an unknown role after load shows everything (as `canSee`). | `components/route-guard.tsx`, `lib/nav-access.ts` (`canOpenPath`), `app/(dashboard)/layout.tsx` |

## Health (rows 7-10)

| # | Fix | Where |
|---|---|---|
| 7 | Over-time charts no longer repeat "Oct 19": one tick per calendar day (de-duplicated, max 6); readings from a single day are labelled by time. | `components/health/health-charts.tsx` (`timeAxisProps`) |
| 8 | Recommendation cards say "Financial" not the API key `money`; "est. +1 pt" singular everywhere (overview, drill-down, recommendations, contribution column). | `lib/health-format.ts` (`formatLift`, `dimensionLabel`) |
| 9 | Accept/dismiss are founder-only (API 403 otherwise): other roles see no Start/Dismiss, only an "Open" link. | `app/(dashboard)/health/recommendations/page.tsx` |
| 10 | "Do it" / "Open" links render only when `canOpenPath(href, role)` allows the route. | health overview, drill-down, recommendations |

**Why not touch `handleSessionExpired`:** its redirect-to-login still skips every `/auth/` path, so public pages calling `/auth/*` without a token are unaffected.

**Verification:** unit tests per row (826 unit tests pass), typecheck, lint, build and the 153 e2e tests green on a clean checkout; each row exercised live on the local stack (expired token reload shows + Invite; forced 500 on the PATCH gives the error toast and no success toast; invalid invite email sends no request; TM ticks an assigned task and the row drops; mentor on `/mission` and `/finance` blocked at 1440 and 375 with no page scroll).

**Roll back:** revert the PR; no API or migration changes.

**Follow-ups:** the API is separately tightening Mission reads to 403 for mentors/consultants.
