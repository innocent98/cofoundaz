# Auth & Onboarding FE step 2: live walk (2026-11-12)

Branch `feature/auth-onboarding-fe` (from `develop` `afbf060`). Scratch stack: API from `develop` `f7073893` (includes #227, migration 0103) on
:8055 with its own Postgres + Redis (containers `aufe-pg`, `aufe-redis`, removed afterwards), `EMAIL_BACKEND=file`, `LLM_PROVIDER=stub`; FE `next dev` on :3055
proxying to it. The shared :8000 stack was not touched. Driver: the in-app browser; typed values were set through the input setters and every
submit went through the real form handler. Screenshots: `auth-onboarding-fe-walk-evidence/`. Test accounts are throwaway `@example.com` addresses.

Legend: ✅ passed live · ⚠️ passed with a note · ➖ not walked (reason).

| # | Flow | Gap rows | 1440 | 375 | What was seen |
|---|---|---|---|---|---|
| 1 | Sign-up, empty terms | 13, 14 | ✅ | ✅ | inline "Accept the Terms and Privacy Policy to create your account." under the box, no top banner; strength meter live |
| 2 | Sign-up, weak password / bad email | 13 | ✅ | ➖ | API `WEAK_PASSWORD` and the email validator's text shown under their own field |
| 3 | Sign-up, valid | 14, 12 | ✅ | ✅ | `accepted_terms: true` sent; lands on `/verify-email` with **no email in the URL** |
| 4 | Check your inbox | 12 | ✅ | ✅ | H1 "Check your inbox", "It expires in 24 hours.", "Resend in 52s" counting down, button disabled, token box gone, "Already verified? Log in" |
| 5 | Verify link → success page | 9 | ✅ | ➖ | "You're verified. Let's build." + Continue; Continue → `/onboarding` (unfinished wizard) |
| 6 | Duplicate email | 13, D-AUTH-1 | ✅ | ➖ | "That email already has an account. Log in instead?" with the link to `/login` |
| 7 | Wizard steps 1 to 6 | 17, 18, 20 | ✅ | ✅ | country defaulted from the locale (US); phone `abc` and website `javascript:` refused by the API and shown under the field, step stays; step 3 blocks on industry/model/stage; 8 goal chips, the 4th disabled; invite step: no Investor, Co-Founder warning, per-row "That doesn't look like an email address."; Skip; step 6 Start assessment / Do it later |
| 8 | "Other" industry | 17 | ✅ | ✅ | free-text field; typed value stored (`Pet care` shown back in the AI panel) |
| 9 | Do it later → dashboard | D-AUTH-4/5 | ✅ | ➖ | both banners: "Protect your startup: turn on two-factor sign-in…" (Not now / Turn on 2FA) and the calibration banner |
| 10 | Start assessment | D-AUTH-5 | ➖ | ✅ | completes onboarding, lands on `/assessment` ("Let's calibrate MateCo") |
| 11 | 2FA setup | 16 | ✅ | ➖ | H1 "Protect your startup", no SMS row, TOTP code accepted, 10 backup codes; banner gone after enabling |
| 12 | Login lockout | 1, 2 | ✅ | ➖ | unknown email: 5 wrong passwords answer 401, the 6th the PRD 429; button "Try again in 14:53" disabled with a live countdown, "Reset your password" link |
| 13 | MFA typo, then burned ticket | 8 | ✅ | ➖ | wrong code → "That code isn't right. Try again. 4 tries left."; 5 wrong → `/login` with "Your sign-in timed out. Log in again."; a fresh login + real code → dashboard |
| 14 | Forgot / reset | 15 | ✅ | ➖ | "If that email has an account, a reset link is on its way."; reset page "Choose a new password", mismatch caught, "Password updated. Log in with your new password." + Log in link |
| 15 | Invite: signed out, sign-up, verify | 9, 13, 23 | ✅ | ➖ | invite page says "Co-Founder"; sign-up heading "Join WalkCo", email prefilled; after verify Continue goes **back to the invite**, not an empty workspace |
| 16 | Invite: name prompt, accept | 23 | ✅ | ➖ | accepting with an empty name asks for it; with a name joins and lands on the dashboard |
| 17 | Invite: wrong account | 23 | ✅ | ➖ | "You're signed in as … but this invitation was sent to …" + "Sign out and use …" (no Accept) |
| 18 | Invite: decline | decline | ⚠️ | ➖ | `POST /invitations/decline` 200, the link then reads as no longer valid with Log in / Back home. The "Invitation declined" panel flashed past before a screenshot (reload followed in the same script) |
| 19 | Member opens `/onboarding` | 10 | ✅ | ➖ | redirected to `/dashboard` |
| 20 | Founder with an unfinished wizard opens `/dashboard` | 10 | ✅ | ➖ | redirected to `/onboarding` |
| 21 | Pending invitee in the wizard | 11 | ✅ | ✅ | "You have a pending invitation…" notice above the wizard; logging in with an invite `next` goes to the invite, not the wizard |
| 22 | Mobile layout | 24 | ➖ | ✅ | brand panel is a slim bar under `lg`; `/signup` form heading at y=165, `/login` 185, `/forgot-password` 275, `/verify-email` 376, wizard 209 (all above the 812 px fold); no horizontal overflow on any of them |

Bugs found by the walk and fixed in this PR: the pending-invite notice squeezed the wizard into a side-by-side row (wrapped in one column); a login
with `?next=/invite/…` was sent to the wizard for an invitee with no workspace (the invite link now wins); the lock banner repeated "Reset your
password" (now the API's sentence plus one link); a security review flagged the invite token from `next` flowing into an API path (now matched
against a URL-safe pattern and URL-encoded).

Not walked: Google sign-in (unchanged, audited earlier); real email delivery (file backend); the production proxy's client IP; the 1440 look of
the member dashboard banners; a 375 pass of the invite page and the MFA/lockout screens (their forms share the layout measured in row 22); the
sidebar name for a just-joined invitee still reads "Your account" until a reload (the greeting is right; follow-up).
Token storage (gap 5, D-AUTH-6) is the second PR (`feature/auth-cookie-session`), so this walk still had tokens in `localStorage`.
