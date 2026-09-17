# SOP — Fix: graceful session-expiry (global 401 → login redirect)

## What shipped

When the access token expires, the app now **redirects to `/login`** (with a
notice, and returns the user to where they were) instead of **hard-crashing to
"This page couldn't load"**. Branch `fix/global-401-redirect` → PR into
`develop`.

## Why — the bug

Access tokens are short-lived. When one expired, **every** authenticated call
(`/auth/me`, `/dashboard/summary`, `/health-score`, `/notifications`, …) returned
`401 UNAUTHORIZED "Not authenticated."` at once, an unhandled error bubbled to
the Next.js error boundary, and the user saw a dead **"This page couldn't load"**
screen with no way back — reported live from the app's network panel.

## How

- **Global 401 handling in the one client choke point** (`lib/api/client.ts`):
  on any `401` from an authenticated call, `handleSessionExpired()` clears the
  stale session (`cf_token`/`cf_refresh_token`/`cf_workspace_id`) and
  `window.location.assign('/login?session=expired&next=<current path>')`.
  - **Auth endpoints are exempt** (`/auth/*`, and the public `/shared/*` /
    `/sign/*` token pages) — a 401 there means "bad credentials", handled by
    those pages, not an expired session.
  - A module-level `sessionRedirectInFlight` guard means the dashboard's burst of
    parallel 401s triggers **one** redirect, not a storm; it also no-ops when
    already on `/login` / `/signup`.
  - The `ApiError` is still thrown so callers' `catch` blocks run normally.
- **Login honors the return path** (`app/(auth)/login/page.tsx`): a safe internal
  `?next=` is validated (`safeNextPath()` — internal, non-auth only) and the user
  is sent back there after signing in; `?session=expired` shows a friendly
  "Your session expired. Please sign in again." notice.

## What's involved

- `lib/api/client.ts` — `handleSessionExpired` + the 401 branch.
- `app/(auth)/login/page.tsx` — `safeNextPath()`, `next`-aware post-login routing,
  session-expired notice.

## Verification (live, staging)

- Set an invalid token and opened `/health` → the app **redirected to
  `/login?session=expired&next=%2Fhealth`** (no "couldn't load"), the stale token
  was **cleared**, and the **"Your session expired"** notice rendered.
- Signed back in → **returned to `/health`** (the `next` path).
- Gates: `typecheck` 0 · `lint` 0 errors · **188** unit · clean `build` ✓.

## Follow-ups

- Optional: a silent **refresh-token** exchange (`cf_refresh_token`) before
  falling back to the login redirect, so short expiries don't interrupt the user
  at all.
- Optional: a toast on redirect for extra clarity (the login notice already
  covers it).
