# SOP: tokens out of localStorage (D-AUTH-6)

## What shipped
The access token now lives in memory only; the refresh token is the API's HttpOnly `cfz_refresh` cookie, renewed silently. No code reads or writes `cf_token` /
`cf_refresh_token` any more. Branch `feature/auth-cookie-session`, one PR to `develop`. API side: #227 (guide `cofoundaz-api/docs/fe-integration-guide-auth-onboarding.md` §1).
Closes gap 5 of `docs/checklist/auth-onboarding-prd-gaps.md`.

## Why
Any XSS could read both tokens from `localStorage`. With the cookie HttpOnly and the access token short-lived and in memory, a script can no longer lift a long-lived credential.

## How
| Piece | Decision |
|---|---|
| Seam | `lib/auth/session.ts` is the only place that touches tokens: `getAccessToken`, `setSession`, `clearSession`, `ensureSession`, `refreshSession`, `accessTokenForRequest`, `isLoggedIn`. Everything else calls it |
| Hint | `localStorage.cf_session = "1"` is a non-secret "a cookie may exist" flag. It only decides whether a page load tries a silent refresh (so anonymous visitors make no refresh call). It grants nothing |
| Page load | no token in memory + hint → `POST /auth/refresh` (cookie, `X-Auth-Mode: cookie`, no body) before the first API call; 401/403 → hint cleared, signed out; 5xx/network → hint kept, next call retries |
| Calls | `apiClient` sends `credentials: include` on `/auth/*` and `X-Auth-Mode: cookie` on login, MFA challenge, Google exchange, refresh, logout (not elsewhere: avoids CORS preflights). A 401 triggers one refresh and one retry |
| Refresh timing | `setSession` schedules a refresh a minute before `expires_in` |
| Many calls, many tabs | one in-flight refresh per tab; `navigator.locks` serialises it across tabs, because the cookie rotates on each refresh and replaying the old one revokes the sign-in. In-tab single flight is the fallback without Web Locks |
| Logout | `POST /auth/logout` (cookie), clears memory and hint, broadcasts on `BroadcastChannel('cf-auth')`; other tabs go to `/login` (`SessionSync` in the dashboard layout) |
| Raw `fetch` downloads | certificate, invoice, CSV, media and finance files call `accessTokenForRequest()` |
| Settings | password change and "sign out other devices" send the cookie, no body token |
| Page-load guards | invite page, `/setup/mfa`, realtime stream and post-login wait for `ensureSession()` instead of reading storage |
Rejected: keeping the access token in `sessionStorage` (still script-readable); a BroadcastChannel token hand-off between tabs (extra attack surface, the lock is enough).

## What's involved
`lib/auth/session.ts` (new), `lib/api/client.ts`, `lib/auth/post-login.ts`, `lib/api/{profile,settings,mfa,google-signin,learning,billing,marketing,finance}.ts`, login/signup/MFA/Google callback pages,
`app/invite/[token]/page.tsx`, `app/setup/mfa/page.tsx`, `components/{realtime-context,session-sync}.tsx`, `app/(dashboard)/layout.tsx`; tests: `lib/auth/session.test.ts`, `lib/api/client.test.ts` (+ five tests moved to the seam);
12 e2e specs now mock `POST /auth/refresh` and set the `cf_session` hint instead of a fake `cf_token`.

## Verification
Lint, type-check and the touched unit tests pass locally; four e2e specs (onboarding, dashboard, assessment, academy-name) run locally; CI runs the rest. Live walk: `docs/checklist/auth-cookie-session-walk.md`.

## Operate / roll back
**Deploy requirement:** the FE origin must be in the API's `BACKEND_CORS_ORIGINS` (the CSRF check compares `Origin` with it), and the FE and API must be same-site (the cookie is `SameSite=lax`, `Path=/api/v1/auth`, `Secure` in deployed envs). Otherwise silent refresh fails and every reload goes to login. `*.vercel.app` previews are not same-site.
People signed in before the deploy have an old `cf_token` in localStorage that nothing reads: they sign in once more. Roll back by reverting the PR; the API still accepts the body-token mode.

## Follow-ups
A Safari/Firefox pass; a live check of the scheduled refresh (15 minutes); removing the unused `cf_token` / `cf_refresh_token` keys from old browsers (one `removeItem` at start-up) if wanted.
