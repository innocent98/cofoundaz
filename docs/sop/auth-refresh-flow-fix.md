# SOP — Auth: silent access-token refresh

## What shipped

Expired access tokens are now **silently refreshed** instead of hard-logging the
user out. On a `401` from any authenticated call, `apiClient` exchanges the
stored refresh token for a fresh access token (`POST /auth/refresh`) and retries
the original request once; only when refresh is impossible or fails does it fall
back to the clear-and-redirect path. Branch `fix/auth-refresh-flow` → PR into
`develop`.

## Why — the refresh token was set but never used

Login stored `cf_refresh_token`, but **no code ever called `/auth/refresh`**. The
access token is short-lived, so the moment it expired every authenticated call
`401`'d and the global handler (added in #38) cleared the session and bounced the
user to `/login?session=expired`. Users were being logged out mid-session on a
routine token expiry that should have been invisible — exactly the "refresh token
not properly set/used" symptom.

## How

- **`lib/api/client.ts` — `tryRefreshToken()`**: reads `cf_refresh_token`, calls
  `POST /auth/refresh` with `{ refresh_token }` in the body, stores the returned
  `access_token` **and the rotated `refresh_token`**, and returns the new access
  token (or `null` on any failure / no stored token).
- **Single-flight**: the refresh token is **single-use and rotates** — the server
  returns a new one and invalidates the old on every call (verified: reusing a
  rotated token → `401`). The dashboard fires ~8 authenticated calls at once, so a
  naive per-401 refresh would fire 8 rotations and invalidate 7 of them. A
  module-level `refreshPromise` guard makes all concurrent 401s **await one**
  refresh, then retry with the single new access token. The guard is cleared once
  settled so a later expiry can refresh again.
- **Retry flow in `apiClient`**: on `401` from a non-auth endpoint where a token
  was actually sent, `await tryRefreshToken()`; on success, swap the
  `Authorization` header and re-`fetch` once. On failure, the existing
  `handleSessionExpired` clear-and-redirect runs unchanged.
- Auth endpoints (`/auth/`, `/shared/`, `/sign/`) stay exempt — a `401` there is
  bad credentials, not an expired session — so the refresh call cannot recurse.

### Cookie vs body token

The backend `_read_refresh` prefers the **HttpOnly refresh cookie** (set at
login) over the body token. In local dev the cookie is same-origin (via the
`/api/v1` proxy) so it drives the refresh; in preview/production the client is
cross-origin, the cookie won't be sent, and the **body `refresh_token` we send is
the working path**. Sending both covers both environments.

## What's involved

- `lib/api/client.ts` — `refreshPromise` single-flight guard, `tryRefreshToken()`,
  and the 401 → refresh → retry-once branch ahead of the error handler.

Backend (unchanged, referenced): `POST /auth/refresh`
(`app/api/v1/endpoints/auth/sessions.py:26`) → `{data:{access_token,
refresh_token}}`, rotates on each call, `401` on missing/dead token.

## Verification (live, staging via dev proxy)

- **Success path** — stored a broken access token + valid refresh, loaded
  `/dashboard`: 6 parallel calls `401`'d → **exactly one** `POST /auth/refresh →
  200` → every call retried `200` → **stayed on `/dashboard`**, `cf_token` rotated.
- **Failure path** — broken access token + no refresh token, loaded `/health`:
  `tryRefreshToken` short-circuits to `null` → session cleared → redirected to
  `/login?session=expired&next=/health`.
- Refresh contract confirmed with `curl`: login → refresh returns rotated pair;
  reusing the old refresh token → `401`; empty token → `401`.
- Gates: `typecheck` 0 · `lint` 0 errors · **188** unit · clean `build` ✓.

## Follow-ups

- Consider a **proactive** refresh (decode `exp`, refresh just before expiry) to
  avoid the one-call `401` round-trip on each expiry — optional; the reactive path
  is already invisible to the user.
- `/auth/logout` (revoke session + clear cookie) is not yet wired to a FE sign-out
  action.
