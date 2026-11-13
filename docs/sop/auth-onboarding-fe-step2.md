# SOP: Auth & Onboarding, front end step 2

## What shipped
FE half of Module 01 on top of API step 1 (#227). Branch `feature/auth-onboarding-fe`, one PR to `develop`. Gap rows closed
(`docs/checklist/auth-onboarding-prd-gaps.md`): 2, 8, 9, 10, 11 (FE side), 12, 13, 14 (FE sends consent), 15, 16, 17, 18, 20, 23, 24.
**Not in this PR:** gap 5 / D-AUTH-6 (tokens out of `localStorage`) is the second PR on `feature/auth-cookie-session`; gap 19 (AI onboarding
panel) still needs its API work.

## Why
The PRD audit found the lockout, MFA-ticket, consent and decline-invite APIs had no UI, the verify and invite hand-offs lost the invite, the
wizard did not follow PRD §01.6, and the auth screens were below the fold on a phone.

## How (decisions)
| Area | Choice |
|---|---|
| Lockout (D-AUTH-2) | Show the API's own sentence (it has the minutes), disable the button with a live `retry_after_seconds` countdown, one "Reset your password" link. 429 is never "wrong password" |
| Sign-up | `accepted_terms` sent; errors inline under their field (`field_errors`); strength meter is a local hint, the API stays the authority; PRD "That email already has an account. Log in instead?" (D-AUTH-1); invite sign-ups read "Join {startup}" |
| Apple / SMS (D-AUTH-3) | No Apple button existed; SMS row removed from `/setup/mfa`; "Continue with Google" copy |
| Verify | `/verify-email` is "Check your inbox" (email in `sessionStorage`, countdown from `retry_after`, no token box); `/verify` redirects; the link page says "You're verified. Let's build." and Continue routes: stored invite → wizard if unfinished → dashboard |
| MFA tickets | `MFA_INVALID_CODE` stays on the screen with "N tries left"; `MFA_TICKET_EXPIRED` goes to `/login` with "Your sign-in timed out. Log in again." |
| 2FA banner (D-AUTH-4) | `MfaBanner` on the dashboard while `GET /auth/mfa` says `enabled: false`; "Not now" hides it for the browser session only |
| Wizard (D-AUTH-5/7) | 1 you, 2 startup + logo, 3 industry (26 + Other) / model / stage cards with sublabels, 4 eight goal chips (max 3), 5 invite team, 6 Kickoff Assessment (Start assessment / Do it later). A step whose save fails stays put; server `field_errors` show under the field; per-step required fields |
| Invites step | roles without Investor; Co-Founder (`founder`) shows "Co-Founders have full access, including billing."; per-row results from the API, failed rows stay with their reason, Skip always available |
| Guards | `OnboardingGate` (dashboard layout) sends a founder/no-workspace user with `completed: false` to `/onboarding`; `/onboarding` sends `completed: true` (members, finished founders) to `/dashboard`; `pending_invite` shows a notice, never blocks |
| Invite page | wrong signed-in account → "Sign out and use …"; name prompt before the first accept; Decline (`POST /invitations/decline`); dead end has Log in / Back home; "Co-Founder" label |
| Mobile | brand panel is a slim bar under `lg` |
Rejected: copying anything from the FE dev's PR #240 (out of scope); a full-screen wizard layout (kept the split layout, the PRD's "focused" look was not worth a new shell); storing the invite token only in `sessionStorage` (the verify link opens a new tab, so it is mirrored to `localStorage`, URL-safe tokens only).

## What's involved
`app/(auth)/{login,signup,verify,verify-email,onboarding,forgot-password}/…`, `app/(auth)/login/mfa/page.tsx`, `app/invite/[token]/page.tsx`,
`app/setup/mfa/page.tsx`, `app/(dashboard)/layout.tsx` (one wrapper), `app/(dashboard)/dashboard/page.tsx` (one banner),
`ui/marketing/auth/{auth-form,auth-brand-panel}.tsx`, `ui/onboarding/onboarding-wizard.tsx`, `components/{onboarding-gate,auth/*,dashboard/mfa-banner}.tsx`,
`content/{auth,onboarding}.ts`, `lib/api/{api-error,onboarding}.ts`, `lib/auth/{pending,post-login,password-strength,useCountdown}.ts`.
No API, migration or config change. Contract: API repo `docs/fe-integration-guide-auth-onboarding.md` (live captures).

## Verification
Lint, type-check and the touched tests pass locally (`auth-form`, `google-button`, `onboarding-wizard`, `onboarding` API, `api-error`, `password-strength`).
CI runs the rest. Live walk of every flow at 1440 + 375 against a scratch API: `docs/checklist/auth-onboarding-fe-walk.md` (+ evidence images).

## Operate / roll back
Pure FE: revert the PR. Deploy order: this FE sends `accepted_terms`, so it can ship before or after the API's `SIGNUP_REQUIRE_TERMS` is on.

## Follow-ups
D-AUTH-6 token storage (PR 2); gap 19 AI panel (needs API); sidebar name stale until reload right after accepting an invite; a 375 pass of
the invite and lockout screens; a Playwright journey for the wizard (CI e2e) is not added here.
