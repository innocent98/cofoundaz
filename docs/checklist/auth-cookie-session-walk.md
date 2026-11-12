# D-AUTH-6 walk: tokens out of localStorage (2026-11-12)

Branch `feature/auth-cookie-session` (from `develop` `bc167e2`). Scratch stack: API from `develop` (migration 0103) on :8055 with its own Postgres + Redis
(removed afterwards), `EMAIL_BACKEND=file`, `GOOGLE_SIGNIN_STUB=true`, `BACKEND_CORS_ORIGINS` including the FE origin; FE `next dev` on :3055 proxying to it
(same origin, so the `/api/v1/auth` cookie path matches). The shared :8000 stack was not touched. In-app browser; forms submitted through the real handlers.
Test accounts are throwaway `@example.com`. Evidence images in `auth-onboarding-fe-walk-evidence/cookie-*`.

| # | Flow | 1440 | 375 | What was seen |
|---|---|---|---|---|
| 1 | Password login | ✅ | ➖ | lands on the dashboard; `localStorage` holds only `cf_user`, `cf_user_name`, `cf_workspace_id` and the non-secret hint `cf_session=1`; no token in local or session storage; `document.cookie` is empty (the refresh cookie is HttpOnly) |
| 2 | Reload (silent refresh) | ✅ | ✅ | full reload of `/dashboard` stays signed in: exactly one `POST /auth/refresh` per load although the page fires many calls (single flight) |
| 3 | Two tabs, simultaneous reload | ✅ | ➖ | both tabs reloaded within 50 ms; both stayed signed in (Web Locks serialise the rotation, no reuse revocation) |
| 4 | Logout in tab 1 | ✅ | ➖ | server revoked (`/auth/refresh` now 401); tab 2 was sent to `/login` by the BroadcastChannel, hint cleared |
| 5 | 2FA login | ✅ | ➖ | login → `/login/mfa` → TOTP code → dashboard; reload stays signed in; 2FA banner gone (`/auth/mfa` says enabled) |
| 6 | Google sign-in (stub) | ✅ | ➖ | start, stub consent redirect, callback, exchange in cookie mode; a new Google account lands on `/onboarding`; reload stays signed in; no token in storage. The real Google consent screen is not exercised |
| 7 | Invite accept after a reload | ✅ | ✅ | the invite page waits for the silent refresh, shows the signed-in account (name prompt), Accept lands on the dashboard of the inviter's workspace |
| 8 | Session dead server-side, then reload | ➖ | ✅ | `/auth/refresh` 401 → `/login?session=expired&next=/dashboard`, hint cleared |
| 9 | Layout | ➖ | ✅ | no horizontal overflow on the invite page and dashboard at 375 |

**Found by the walk (setup, not a code bug):** my first scratch API did not list the FE origin in `BACKEND_CORS_ORIGINS`, so `/auth/refresh` answered `403 CSRF_REJECTED` (the API checks `Origin` against that list, per the guide). Worth a line in the deploy notes: every FE origin must be in `BACKEND_CORS_ORIGINS`, or silent refresh fails and users are sent to login on every reload.

**Not exercised live:** the scheduled refresh one minute before expiry (tokens last 15 minutes; unit-tested with fake timers only through `setSession`, the retry-on-401 path is unit-tested in `client.test.ts`); the real Google consent screen; `Secure` cookies and a cross-origin API host (local is plain HTTP, same origin); a Safari/Firefox pass (Web Locks and BroadcastChannel are used when present, with in-tab single flight as the fallback).
