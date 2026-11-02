# Google sign-in FE: walk evidence (2026-11-02)

Branch `feature/google-sign-in-fe`, dev server on :3103 proxying to the local API (:8000, real Google client configured). Browser pane, 1440 and 375.
**Not done:** a real Google account round trip. Signing in to Google is Adebayo's. Everything past the Google consent screen (new account, returning, link, 2FA, invite) is covered by unit tests only.

| # | Control / state | Width | Result |
|---|---|---|---|
| 1 | `/login`: one "Continue with Google", no Apple | 1440 | pass |
| 2 | `/signup`: one "Continue with Google", no Apple | 1440, 375 | pass (button 327x45 at 375, no horizontal overflow, no "Apple" in the page text) |
| 3 | Click Continue with Google on `/login?next=...` | 1440 | `POST /auth/oauth/google/start` 200, whole window moved to Google's account chooser (`accounts.google.com/v3/signin`), `redirect_uri` = `http://localhost:8000/api/v1/auth/oauth/google/callback` |
| 4 | Start with a stale invite in `sessionStorage` (`cf_invite_token`) | 1440 | `start` 404, copy "This invitation is no longer valid.", stored key removed, no navigation |
| 5 | `/auth/google/callback?error=access_denied` | 1440 | red alert "You cancelled Google sign-in." plus "Back to sign in" (links to `/login`); query scrubbed from the address bar |
| 6 | `/auth/google/callback?error=invite_email_mismatch&x=1` | 375 | page renders, address bar scrubbed to `/auth/google/callback` |
| 7 | `/auth/google/callback#ticket=<bogus placeholder>` | 1440 | real `POST /auth/oauth/google/exchange` 400, copy "That sign-in has expired. Start again.", fragment scrubbed |
| 8 | `/auth/google/callback` with nothing | 1440 | replaced to `/login` |
| 9 | Other `?error=` codes (11 more + unknown) | n/a | unit tests (`app/(auth)/auth/google/callback/page.test.tsx`) |
| 10 | Strict-mode double effect, MFA branch (handoff without email, with invite), invite accept success and failure, unsafe `next` dropped | n/a | unit tests (callback page test, `lib/api/google-signin.test.ts`) |

## Google branding pass (2026-11-02, after Adebayo's real sign-up and sign-in on :3000 worked)
The button is Google's light-theme Sign-In button (`ui/marketing/auth/google-button.tsx`), not a Cofoundaz style. The app has no dark mode, so only the light theme ships.

| Check | Result |
|---|---|
| Computed style, 1440 | white fill, `1px solid #747775`, text `#1F1F1F`, Roboto 500 loaded via next/font, 14px, height 40px, 12px side padding, 4px radius |
| Mark | inline multicolour G, `#EA4335 #4285F4 #FBBC05 #34A853`, 20px, `aria-hidden` |
| Labels | `/login` "Continue with Google", `/signup` "Sign up with Google" |
| 375 | full width (327px), no horizontal overflow |
| Accessibility | axe clean (unit test); native `<button>`, visible focus outline, `aria-busy` while starting |

Screenshots: `google-sign-in-fe-walk-evidence/login-1440.jpg`, `signup-1440.jpg`, `login-375.jpg`, `signup-375.jpg`.

## Real Google round trip
2026-11-02: Adebayo did a real Google sign-up and sign-in on :3000 and both worked (reported by the lead). 2FA, link-by-email and invite round trips are still unit-tested only.

## (Earlier note) Still needs Adebayo's real Google click
The API redirects the browser to its configured FE address after Google. For the local run, that is the dev server on the address the API has in its config; start this branch on that port (3000 is free) and click Continue with Google once on `/login`. Then check: new account lands in onboarding; sign out and back in; a password account with the same email links and keeps its password; a 2FA account reaches the code screen; invite link with the invited and a different Google account.
