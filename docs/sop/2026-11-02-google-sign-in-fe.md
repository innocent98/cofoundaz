# Google sign-in and sign-up: FE

**What shipped.** "Continue with Google" is live on `/login` and `/signup` (Apple removed), with a new return page `/auth/google/callback`. API: #213 (`08b34faa`). FE PR: `feature/google-sign-in-fe` to `develop`. Brief: `docs/fe-handoff/google-sign-in.md` (built by the lead's team, the FE dev skips it). Contract: `cofoundaz-api/docs/fe-integration-guide-google-sign-in.md`.

## Why
Adebayo's 2026-11-02 calls: link by a verified email, 2FA still applies, first sign-in goes through onboarding, an invite is accepted only if the Google email matches, hide Apple.

## How
| Decision | Why |
|---|---|
| `startGoogleSignIn` POSTs `start` with `credentials: 'include'`, then `window.location.assign(auth_url)` | The API's proof cookie ties the return trip to this browser; no popup. |
| Callback reads `#ticket` from the fragment and `?error` / `?next` from the query, then `history.replaceState`s at once | Nothing secret stays in the address bar or history. |
| Exchange guarded by a `useRef` | The ticket is single use; strict mode runs effects twice. |
| Errors shown on the callback page (not a redirect to `/login`) | One place for the copy table in `content/auth.ts` (`googleSignIn.errors`); unknown codes get a generic line. |
| `completePostLogin` gets optional `email` and `inviteToken`; it now resolves the landing path first, then navigates | Reuses the one post-login path (no fork). Email comes from `/auth/me` for Google. On invite accept success it goes to `/dashboard` and sets `cf_workspace_id`; on failure it navigates nowhere and returns `{ inviteError, continueTo }` so the page shows the API message and a Continue button. |
| Invite token in `sessionStorage` (`cf_invite_token`), set by `/invite/[token]` when signed out, sent as `invite_token` on `start`, cleared after sign-in or a 404 | Survives the Google trip and a refresh, never in a URL. |
| MFA: callback writes `cf_mfa_handoff` `{ticket, next, invite}` (no email); `readHandoff` no longer needs an email; the challenge page passes `invite` on | Same challenge screen as password login. |
| `safeNextPath` moved to `lib/auth/safe-next.ts` | Login and signup both send `next`. |

## What's involved
`lib/api/google-signin.ts`, `lib/auth/post-login.ts`, `lib/auth/safe-next.ts`, `content/auth.ts`, `ui/marketing/auth/auth-form.tsx` (`onGoogle`, Apple removed), `app/(auth)/login/page.tsx`, `app/(auth)/signup/page.tsx`, `app/(auth)/login/mfa/page.tsx`, `app/invite/[token]/page.tsx`, `app/(auth)/auth/google/callback/page.tsx`. No migrations or env (API side already set).

## Verification
Unit: `app/(auth)/auth/google/callback/page.test.tsx` (24 tests: spinner, double effect, every `?error=` code, expired ticket, 429, MFA branch, invite branch and failure, unsafe next, reload), `lib/api/google-signin.test.ts` (start body, start errors, post-login for Google). Local: `tsc`, `eslint`, vitest for `app/(auth)`, `lib`, `content`, `ui` (87 files), `npm run build`. Browser walk: `docs/checklist/google-sign-in-fe-walk.md`. **Not verified:** a real Google account round trip (Adebayo's click).

## Operate / roll back
Pure FE: revert the PR. Needs the API Google config and the redirect URIs Adebayo added for local, staging and production.

## Follow-ups
Real Google round trip on staging; "set a password" and "linked accounts" in Settings are out of scope.
