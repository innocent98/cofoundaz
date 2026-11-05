> **Built by the lead's team (branch `feature/google-sign-in-fe`, 2026-11-02). FE dev: skip this brief.** The text below is kept as the spec it was built from.

# FE hand-off: Google sign-in and sign-up

**For:** the FE developer. **Scope:** exactly what is below. **Backend:** API branch `feature/google-sign-in` (PR linked by the lead; merge first; no migration).
**Contract:** `cofoundaz-api/docs/fe-integration-guide-google-sign-in.md` (every body captured from a live run; section numbers below refer to it). Read `AGENTS.md` first.
**Decisions (Adebayo, 2026-11-02):** a Google email that matches an existing account signs into it and links; 2FA still applies; first Google sign-in creates the account and goes to onboarding; invites survive the round trip; **Apple stays hidden**.

Files: `ui/marketing/auth/auth-form.tsx` (the two buttons, around line 66), `content/auth.ts`, `app/(auth)/login/page.tsx`, `app/(auth)/signup/page.tsx`, `app/invite/[token]/page.tsx`, a new page `app/(auth)/auth/google/callback/page.tsx`, `lib/api/auth.ts` (two new calls), `lib/auth/post-login.ts` (reuse, do not fork).

## 1. The buttons

- `AuthForm` renders a disabled "Continue with Google" and a disabled "Continue with Apple" for both `login` and `signup`. **Delete the Apple button** (and `authShared.apple` if nothing else uses it). Do not leave it disabled or greyed out: hide it.
- Make "Continue with Google" live on both pages. Add an `onGoogle?: () => Promise<void>` prop to `AuthForm`; the button shows the existing loading state while the request runs, and is disabled while `isSubmitting`.
- Click handler (a small helper in `lib/api/auth.ts`, `startGoogleSignIn`):
  1. `POST /auth/oauth/google/start` with `credentials: 'include'` and body `{ invite_token?, next? }` (guide 2). `next` is the same safe path `safeNextPath()` already computes on the login page; omit it when null.
  2. `window.location.assign(data.auth_url)` (same window, no popup, no iframe).
- Errors from `start`: `503 GOOGLE_SIGNIN_NOT_CONFIGURED` -> inline "Google sign-in isn't available right now. Use your email instead."; `404` (only when an invite token was sent) -> "This invitation is no longer valid."; `429` -> "Too many attempts. Please wait a moment and try again."; anything else -> the generic message the login page already uses. Use the shared `apiClient` error handling; it must send cookies (`credentials: 'include'`), check `lib/api/client.ts` already does for the auth calls and add it if not.

## 2. Keep the invite token

The invite email links to `/invite/{token}`, which sends signed-out people to signup/login (with `?email=`). Today the token is not passed on. Do this:

- On `/invite/[token]`, when the viewer is signed out, put the token in `sessionStorage` under `cf_invite_token` before sending them to `/signup` or `/login` (so it survives the Google trip, and a refresh).
- `startGoogleSignIn` reads `cf_invite_token` and sends it as `invite_token`. If `start` answers 404, remove the key and show the "no longer valid" message.
- After a successful sign-in (section 3) the key is removed.

Do not put the invite token in any URL you build.

## 3. The return page `/auth/google/callback`

New client page in the `(auth)` layout, public, shows a centred spinner "Signing you in with Google". It handles the API's redirect (guide 1):

1. Read `ticket` from the URL **fragment** (`location.hash`, `#ticket=…`) and `error` / `next` from the query. **Immediately** `history.replaceState` to `/auth/google/callback` so nothing is left in the address bar.
2. `error` present -> `router.replace('/login?google_error=<code>')` (or show it on this page with a "Back to sign in" button). Map every code with the copy table in guide 4. Unknown codes get "We couldn't sign you in with Google. Try again."
3. `ticket` present -> `POST /auth/oauth/google/exchange {ticket}` **once, with `credentials: 'include'`** (the API ties the ticket to this browser's cookie from `start`) (guard against React strict-mode double effects with a ref; the ticket is single use). `400 GOOGLE_TICKET_INVALID` -> "That sign-in has expired. Start again." with a button to `/login`.
4. On success the body is the login shape plus `is_new_user`, `invite_token`, `next` (guide 2):
   - **`mfa_required: true`** -> store `{ ticket: mfa_ticket, next, invite }` (no email) in the existing `cf_mfa_handoff` sessionStorage entry and `router.push('/login/mfa')` exactly like the password login does. The handoff currently requires `email`; the Google response has none, so relax `readHandoff` to accept a missing email (the challenge page only uses it to call `completePostLogin`, which fetches `/auth/me` anyway; check and, if needed, let `completePostLogin` take the email from `/auth/me`). Also carry `invite_token` in the handoff and accept it after the challenge succeeds (the challenge response does not repeat it).
   - otherwise -> call the existing `completePostLogin({ accessToken, refreshToken, email, router, nextPath })`. `email` comes from `GET /auth/me` (same call `completePostLogin` makes), so make the `email` option optional rather than adding a second `/me` call.
5. `is_new_user: true` must land in **onboarding**, the same place a fresh email sign-up lands after verification: `completePostLogin` already routes by `/auth/me` and onboarding state (empty `memberships`, `active_workspace_id: null`); confirm it does, do not special-case.
6. `invite_token` set -> after the session exists, `POST /invitations/accept {token}` (guide 2), clear `cf_invite_token`, then continue as `/invite/[token]` does after accepting (go to the workspace). If accept fails, show the API message and continue to the normal landing page.
7. Reload safety: if the page loads with neither `ticket` nor `error`, `router.replace('/login')`.

## 4. States and copy

Loading: spinner + "Signing you in with Google". Error: red alert (same component as login errors) + "Back to sign in". Use the copy in guide 4 verbatim for the error codes; the ones the live run proved are `access_denied`, `email_not_verified`, `invalid_state`, `invite_email_mismatch`.

## 5. Behaviours to know, not build

- A Google-only account has no password; email+password login for it fails with the usual invalid-credentials message. Do not add UI for this now.
- Existing verified accounts keep their password after linking. An older unverified sign-up is taken over by Google (its password is removed); nothing to show.
- During maintenance, existing users can still sign in with Google; a brand-new Google user gets `?error=maintenance`.

## 6. Out of scope

Apple sign-in. "Linked accounts" or "unlink Google" in Settings. A "set a password" prompt. Popup-style OAuth.

## 7. Done looks like

- Signed out on `/login` and `/signup`: one "Continue with Google" button, no Apple.
- Full round trip on staging with a real Google account (the API team could only prove it against a fake Google): new account lands in onboarding; the same account signs back in; a password account with the same email signs in and keeps its password.
- A 2FA account reaches the code screen after Google and is signed in only after the code.
- Invite link -> sign in with the invited Google account -> joined; with a different Google account -> "sent to a different email address".
- Re-walk: every control, 1440 and 375 px, light and dark if the app has it. Component test for the callback page (ticket, error, MFA, invite, double-effect) in the existing vitest setup; run `npm run lint`, `npx tsc --noEmit`, the touched tests.
