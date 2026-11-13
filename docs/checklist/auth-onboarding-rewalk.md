# Authentication, onboarding and cookie session: click-through re-walk on merged develop

**Verdict: NOT DONE. 300 of 304 role × width checks pass, 4 fail** (126 control rows).

**What was walked (FE #243 auth step 2, #245 cookie session):** sign-up, e-mail verification (valid, superseded, reused, garbage link), resend and its countdown, login, the lockout countdown, forgot and reset password,
2FA set-up (QR, manual key, wrong and right code, backup codes download and copy), the 2FA challenge (TOTP, backup code, reused backup code), the dashboard 2FA banner (show, "Not now", comes back in a new session),
the 6-step onboarding wizard (every step, Back, validation, reload-resume, logo, invites, Do it later / Start assessment), invite preview, accept, decline, wrong-account and invalid-token states for six roles, and the cookie session
(survives a reload and a second tab, both tabs reloading at once, sign-out in one tab signs out the other, a public page is not redirected, the cookie flags, CSRF).

**Date:** 2026-11-12. **Code under test:** FE develop `130167d` (innocent98/cofoundaz) and API develop `e59e1d6f` (innocent98/Cofoundaz-api).
**Scratch stack, not the shared :8000 stack:** a fresh worktree of each repo; Postgres 16 and Redis 7 containers (`rewalk-pg`, `rewalk-redis`) with `alembic upgrade head`
on an empty database; the API on `:8100` with `LLM_PROVIDER=stub`, `EMAIL_BACKEND=file` (verification and invite mails are read from disk) and the per-IP sign-up, resend, forgot
and login limits raised so one machine can walk many accounts (the lockout limit itself, 5 failures per email+IP, is left at its default); the FE as `next dev -p 3102`
proxied to it. Roles: F founder, TM team member, M mentor, BC business consultant, AC accountant, INV investor, LA legal advisor. A cell lists the roles that passed at that
width; `❌ role` failed; `n/a` means the control does not exist for that role or width and the row says why.

**Method, honestly.** A scripted real browser (Chromium via Playwright) clicks and types into every control and compares the result with the raw API (`GET`s made with the same
account's token, the API log of the page's own calls, the mail files, and the database where stated). Screenshots were read by eye for the failure cases and a sample of the passes.
The scripts and raw per-run results are in the shared notes folder (`side-session-notes/.../rewalk-2026-11-12/`: `lib.mjs`, `auth*.mjs`, `team*.mjs`, `journal*.mjs`, `notif1.mjs`,
`side1.mjs`, `ai1.mjs`, `ir1.mjs`, `roles*.mjs`, `all-results.json`), not in the repo. Some rows took more than one run because the first script, not the page, was wrong; every row below is from the final run.


## Findings (❌), for the lead to route

1. **Onboarding step 2: a rejected logo is silent, and the hint disagrees with the API (medium, FE).** Repro: sign up, verify, log in, reach onboarding step 2 (Startup), type a name, choose a `.txt` file (or an image larger than 2 MB), click Continue.
   The wizard moves to step 3 with no message and no logo is saved. Raw API: `POST /onboarding/logo` → **422** `{"error":{"code":"VALIDATION_ERROR","message":"Logo must be a PNG, JPG, SVG, or WebP image.","field_errors":[]}}`;
   for a file over 2 MB → **422** `{"error":{"code":"VALIDATION_ERROR","message":"Logo must be 2 MB or smaller.","field_errors":[]}}`. The page's own hint says "PNG, JPG, or SVG up to 5MB", so a 3 MB logo is accepted by the form and rejected by the API.
   Cause: `app/(auth)/onboarding/page.tsx` `handleUploadLogo` swallows the error ("Non-blocking upload error") and `ui/onboarding/onboarding-wizard.tsx` has no client-side type or size check (only `accept="image/*"`). Same at 1440 and 375.
   Screenshots: `rewalk-2026-11-12-evidence/FAIL-onboarding-logo-1-selected.png`, `FAIL-onboarding-logo-2-moved-on-no-message.png`.


## NOT verified (labelled, not walked)
- **Continue with Google** (sign-up and login buttons are present; the Google round trip needs Google credentials, so the click is not walked here). The queued staging click is tracked in `google-sign-in-fe-walk.md`.
- **Real e-mail delivery** (the walk reads the mail files the API wrote; delivery through the real provider is not exercised).
- **Lockout per real client IP behind the production proxy** (here every request comes from 127.0.0.1).
- **Apple and SMS 2FA** (not built, hidden by D-AUTH-2).
- Observation, not a defect: `POST /auth/login` still returns `data.refresh_token` in the JSON body (legacy header mode). The FE does not store it (no token in localStorage, sessionStorage or `document.cookie`), and the cookie `cfz_refresh` is HttpOnly, SameSite=Lax, path `/api/v1/auth`.
- Not in the product: a show/hide-password toggle exists on no form (row marked n/a).

## Rows

| Control | 1440 | 375 | Evidence / note |
|---|---|---|---|
| signup: page renders (Google, email, password, terms, Create, Log in link) | ✅ any | ✅ any |  |
| signup: empty submit shows field errors, no API call | ✅ any | ✅ any | Enter your email address. |
| signup: bad email + weak password blocked client-side | ✅ any | ✅ any | 8+ characters, one number |
| signup: terms unchecked blocked | ✅ any | ✅ any | Accept the Terms and Privacy Policy to create your account. |
| signup: success lands on /verify-email | ✅ any | ✅ any | http://localhost:3102/verify-email |
| verify-email: shows address + 24h expiry + resend countdown | ✅ any | ✅ any | Resend in 59s |
| verify-email: countdown ticks down | ✅ any | ✅ any | 59->56 |
| verify-email: "Log in" link present | ✅ any | ✅ any |  |
| signup: duplicate email gives PRD message (D-AUTH-1) | ✅ any | ✅ any | / Create your workspace / Free to start. Set up in under 10 minutes. / Continue with Google / or / Work email / That email already has an account. Log in instead? / Password / 8+ characters, one number / Password strength: Stro… |
| signup: duplicate API 409/422 body | ✅ any | ✅ any | 409 {"code":"EMAIL_TAKEN","message":"That email already has an account. Log in instead?","field_errors":[]} |
| verify-email: Resend enabled after countdown | ✅ any | ✅ any |  |
| verify-email: Resend sends a 2nd email | ✅ any | ✅ any | We sent a verification link to au1440b@rewalk-qa.com. It expires in 24 hours. |
| login: unverified account is sent to /verify-email | ✅ any | ✅ any | http://localhost:3102/verify-email |
| verify link: superseded token shows an error with a way out | ✅ any | ✅ any | This link has expired or was already used. If you have already verified, log in. |
| verify link: valid token verifies and continues | ✅ any | ✅ any | http://localhost:3102/verify-email/NORuzatPaHLK1n8278SYSjgB0_fXiVL2iSn7agaORxg nd your account is active. / Continue |
| verify link: reused token reports used/expired, not success | ✅ any | ✅ any | This link has expired or was already used. If you have already verified, log in. |
| verify link: garbage token shows error | ✅ any | ✅ any | / This link didn't work / This link has expired or was already used. If you have already verified, log in. / Already verified? Log in / Send me a new link |
| login: renders email, password, submit, Google, Forgot, Sign up links | ✅ any | ✅ any |  |
| login: empty submit blocked client-side | ✅ any | ✅ any | Enter your email address. |
| login: show/hide password toggle (not offered on this page) | n/a any | n/a any | no such control on login, signup or reset |
| login: wrong password → generic error, stays on /login | ✅ any | ✅ any | / Welcome back / Log in to pick up where you left off. / Continue with Google / or / That email and password don't match. / Work email / Password / Forgot password? / Log in / New here? Create your w |
| login: wrong password API status | ✅ any | ✅ any | 401 |
| login: repeated wrong passwords → 429 lockout (locks after the 5th failure, 6th attempt is refused) | ✅ any | ✅ any | 429 / Welcome back / Log in to pick up where you left off. / Continue with Google / or / Too many attempts. Try again in 15 minutes or reset your password. / Reset your password / Work email / Password / Forgot password? / |
| login: lockout shows a visible countdown | ✅ any | ✅ any | 15 minute |
| login: submit disabled while locked | ✅ any | ✅ any | disabled=true |
| login: countdown decrements | ✅ any | ✅ any | 14:57 -> 14:53 |
| login: correct password while locked is still refused (API) | ✅ any | ✅ any | 429 {"code":"ACCOUNT_LOCKED","message":"Too many attempts. Try again in 15 minutes or reset your password.","field_errors":[],"retry_after_seconds":892} |
| login: success (new user, onboarding unfinished) → /onboarding | ✅ any | ✅ any | http://localhost:3102/onboarding |
| forgot: renders email + submit + back to login | ✅ any | ✅ any |  |
| forgot: empty submit blocked | ✅ any | ✅ any | Enter the email address associated with your account and we'll send you a recovery link. |
| forgot: unknown address gets the same neutral confirmation, no email sent | ✅ any | ✅ any | / Reset your password / Enter the email address associated with your account and we'll send you a recovery link. / If that email has an account, a reset link i |
| forgot: known address shows the same confirmation text and sends a reset email | ✅ any | ✅ any | 1 mail |
| reset: two password fields + submit | ✅ any | ✅ any | pw fields=2 |
| reset: weak password blocked client-side | ✅ any | ✅ any | characters long. |
| reset: mismatch blocked client-side | ✅ any | ✅ any | match. |
| reset: valid reset succeeds and offers login | ✅ any | ✅ any | / Choose a new password / Enter your new account password below. / Password updated. Log in with your new password. / Log in |
| reset: old password dies, new works (API) | ✅ any | ✅ any | 401/200 |
| reset: reused link is rejected | ✅ any | ✅ any | / Choose a new password / Enter your new account password below. / This reset link is invalid or has expired. Request a new one. / NEW PASSWORD / CONFIRM NEW PASSWORD / Update password |
| reset: bogus token page: form shows, submit gives invalid/expired error | ✅ any | ✅ any | / Choose a new password / Enter your new account password below. / This reset link is invalid or has expired. Request a new one. / NEW PASSWORD / CONFIRM NEW P |
| reset: no token in URL shows an error | ✅ any | ✅ any | / Invalid reset link / This password reset link is missing a valid token. / Request new reset link |
| setup: fixture founder onboarded via API | ✅ F | ✅ F | complete=200 |
| login → /dashboard for an onboarded founder | ✅ F | ✅ F | http://localhost:3102/dashboard |
| 2FA banner shows on dashboard when 2FA is off | ✅ F | ✅ F | Protect your startup: turn on two-factor sign-in. It takes a minute. / / Not now / Turn on 2FA |
| 2FA banner: "Not now" hides it | ✅ F | ✅ F |  |
| 2FA banner: stays hidden after reload in the same tab session | ✅ F | ✅ F |  |
| 2FA banner: comes back in a new tab/session | ✅ F | ✅ F |  |
| 2FA banner: "Turn on" goes to /setup/mfa | ✅ F | ✅ F | http://localhost:3102/setup/mfa |
| setup: QR image and manual key shown | ✅ F | ✅ F | key len=32 |
| setup: copy key button | ✅ F | ✅ F |  |
| setup: wrong code → error, stays on setup | ✅ F | ✅ F |  |
| setup: right code → "Two-factor is on" + backup codes | ✅ F | ✅ F |  |
| setup: backup codes listed (count) | ✅ F | ✅ F | 10 codes |
| setup: Download backup codes gives a file | ✅ F | ✅ F | cofoundaz-backup-codes.txt |
| setup: Copy codes button enabled | ✅ F | ✅ F |  |
| API: /auth/mfa enabled=true | ✅ F | ✅ F | {"enabled":true,"method":"totp","enabled_at":"2026-11-12T19:27:07.541058+00:00","backup_codes_remaining":10} |
| setup: "I've saved my codes" leaves setup for Settings | ✅ F | ✅ F | http://localhost:3102/settings |
| 2FA banner: not shown once 2FA is on | ✅ F | ✅ F |  |
| setup: revisiting says already on | ✅ F | ✅ F |  |
| challenge: password login with 2FA on goes to /login/mfa | ✅ F | ✅ F | http://localhost:3102/login/mfa |
| challenge: wrong code → error, stays | ✅ F | ✅ F | That code isn't right. Try again. 4 tries left. |
| challenge: right TOTP → /dashboard | ✅ F | ✅ F | http://localhost:3102/dashboard |
| challenge: backup-code switch control exists | ✅ F | ✅ F |  |
| challenge: backup code signs in | ✅ F | ✅ F | http://localhost:3102/dashboard |
| challenge: used backup code is refused the 2nd time | ✅ F | ✅ F | / Two-step verification / Enter one of the backup codes you saved. / That code isn't right. Try again. 4 tries left. / Verify / Use your authenticator app / Ba |
| challenge: opening /login/mfa without a login sends you to /login | ✅ F | ✅ F | http://localhost:3102/login |
| login of a not-yet-onboarded user lands on /onboarding | ✅ F | ✅ F | http://localhost:3102/onboarding |
| step 1: header "Step 1 of 6", 17% progress | ✅ F | ✅ F |  |
| step 1: blank submit shows "Please enter your full name." and stays | ✅ F | ✅ F |  |
| step 1: save → step 2, API state has name/role/country/phone/how_heard | ✅ F | ✅ F | {"full_name":"Olu Builder","role_title":"CTO","country":"NG","phone":"+2348012345678","how_heard":"Twitter"} |
| reload mid-wizard resumes at step 2 | ✅ F | ✅ F |  |
| step 2: Back returns to step 1 with saved values kept | ✅ F | ✅ F |  |
| step 2: blank startup name blocked | ✅ F | ✅ F |  |
| step 2: invalid website is blocked with "Enter a web address starting with http or https." | ✅ F | ✅ F | blocked: Enter a web address starting with http or https. |
| step 3 → Back → step 2 keeps the startup values | ✅ F | ✅ F |  |
| step 2: logo upload (PNG) on Continue → API 200 and moves on | ✅ F | ✅ F | {"calls":1,"status":200,"step":3,"vis":null} |
| step 2: non-image file is refused with a visible message | ❌ F | ❌ F | {"calls":1,"status":422,"step":3,"vis":null} (Playwright bypasses the picker filter accept=image/*) |
| step 2: >5 MB file is refused with a visible message | ❌ F | ❌ F | {"calls":1,"status":422,"step":3,"vis":null} |
| step 3 shows | ✅ F | ✅ F |  |
| step 3: submit with nothing chosen is blocked with a message | ✅ F | ✅ F | Select your industry |
| step 3: stage still required | ✅ F | ✅ F |  |
| step 3: save → step 4; API has industry/model/stage | ✅ F | ✅ F | ["Fintech","b2b","validation"] |
| step 4: goals toggle (select then deselect) | ✅ F | ✅ F |  |
| step 4: save → step 5; API goals = [Validate my idea] only, notes saved | ✅ F | ✅ F | ["Validate my idea"] |
| step 5: bad invite email is reported on its row | ✅ F | ✅ F | That doesn't look like an email address. |
| step 5: Add another invite adds a row | ✅ F | ✅ F |  |
| step 5: Send invites → 200, emails written for both, moves to step 6 | ✅ F | ✅ F | status 200, mails +2, step 6 |
| step 6: Back, Do it later, Start assessment present | ✅ F | ✅ F |  |
| step 6: Back returns to step 5 | ✅ F | ✅ F |  |
| step 6: "Do it later" → /dashboard | ✅ F | ✅ F | http://localhost:3102/dashboard |
| dashboard after Do it later: nudges to complete the assessment | ✅ F | ✅ F | Complete assessment |
| API: onboarding completed, founder membership + workspace created | ✅ F | ✅ F | [{"startup_id":"47c137c8-7f33-4b29-ae37-42f57283c8d1","name":"Rewalk Ob","role":"founder"}] |
| API: assessment_pending stays true after Do it later | ✅ F | ✅ F | assessment_pending=true completed=true |
| visiting /onboarding after completion redirects to /dashboard | ✅ F | ✅ F | http://localhost:3102/dashboard |
| step 6 is resumable after a fresh login | ✅ F | ✅ F | http://localhost:3102/onboarding |
| step 6: "Start assessment" → /assessment | ✅ F | ✅ F | http://localhost:3102/assessment |
| "Log in to accept" goes to login with ?next= back to the invite | ✅ team_member, M, business_consultant, AC, legal_advisor, INV | ✅ team_member, M, business_consultant, AC, legal_advisor, INV | /login?next=%2Finvite%2FgnOuKKzm-nWuL1icWfrIpILr6NnMiEQHuYjDhGs3TUY |
| after login returns to the invite, shows Accept + Decline + name field | ✅ team_member, M, business_consultant, AC, legal_advisor, INV | ✅ team_member, M, business_consultant, AC, legal_advisor, INV | Workspace invitation / Fiona Founder invited you / Join Rewalk Labs as Team member / Invitation sent to iatea1440mwdyb1wn@rewalk-qa.com / Your name / Accept inv |
| Accept → API 200 and lands in the workspace | ✅ team_member, M, business_consultant, AC, legal_advisor, INV | ✅ team_member, M, business_consultant, AC, legal_advisor, INV | status 200 url /dashboard |
| API: membership has the invited role in Rewalk Labs | ✅ team_member, M, business_consultant, AC, legal_advisor, INV | ✅ team_member, M, business_consultant, AC, legal_advisor, INV | [{"startup_id":"a3257673-cb25-43c7-8e67-740c2b591781","name":"Rewalk Labs","role":"team_member"}] |
| sidebar shows exactly the entries NAV_ROLES allows for this role (Funding, IR, Marketplace, Legal, Analytics are hidden from the sidebar by product call, excluded) | ✅ team_member, M, business_consultant, AC, legal_advisor, INV | – | /dashboard /ai /mission /health /roadmap /business-builder /validation /assessment /marketing /sales /finance /investor-readiness /academy /documents /calendar /team /notifications /settings /setup/mfa |
| reusing the accepted link is refused by the API | ✅ team_member, M, business_consultant, AC, legal_advisor, INV | ✅ team_member, M, business_consultant, AC, legal_advisor, INV | 400 "TOKEN_INVALID" |
| Decline → API 200, page confirms | ✅ M | ✅ M | status 200 · Workspace invitation / Invitation declined / We've let them know you won't be joining. / Go to my dashboard |
| reopening a declined link shows it is no longer valid, no Accept button | ✅ M | ✅ M | Workspace invitation / This invitation is no longer valid / It may have already been accepted, been revoked, or expired. Ask whoever invited you to send a fresh link. / Log in / Back home |
| declined invitee has no membership in the workspace | ✅ M | ✅ M | [] |
| signed in as a different address: page says the invite is for another email | ✅ M | ✅ M | Workspace invitation / Fiona Founder invited you / Join Rewalk Labs as Mentor / Invitation sent to imm1440mwdyb1wn@rewalk-qa.com / You're signed in as imo1440mwdyb1wn@rewalk-qa.com, but this invitation was sent to imm1440mwdyb1… |
| invalid token page: clear message, no crash | ✅ any | ✅ any | Workspace invitation / This invitation is no longer valid / It may have already been accepted, been revoked, or expired. Ask whoever invited you to send a fresh link. / Log in / Back home |
| "Create an account" opens signup with the email prefilled/locked | ✅ team_member | ✅ team_member | email field=isn1440mwdyb1wn@rewalk-qa.com url /signup?next=%2Finvite%2FfPMMm8OaDg6aWtFPX6N3r62Hn-c2jHVCJfrW8stg2HY&email=isn1440mwdyb1wn%40rewalk-qa.com |
| after verifying an invited sign-up, the user ends up back on the invite (known issue: link was lost) | ✅ team_member | ✅ team_member | landed /invite/fPMMm8OaDg6aWtFPX6N3r62Hn-c2jHVCJfrW8stg2HY · Workspace invitation / Fiona Founder invited you / Join Rewalk Labs as Team member / Invitation sent to isn1440mwdyb1wn@rewalk-qa.com / Your name / Accept invit |
| login lands on /dashboard | ✅ F | ✅ F | http://localhost:3102/dashboard |
| refresh cookie cfz_refresh is HttpOnly, SameSite, scoped to /api/v1/auth | ✅ F | ✅ F | {"httpOnly":true,"sameSite":"Lax","path":"/api/v1/auth","secure":false,"exp":true} |
| no access/refresh token in localStorage, sessionStorage or document.cookie (D-AUTH-7) | ✅ F | ✅ F | {"ls":["cf_user={\"id\":\"f99b15c0-b640-409f-9fdd-93d28722d","cf_session=1","cf_user_name=Test Founder","cf_workspace_id=5c6b7396-6f84-4425-9a2f-63a77b08c6f3"],"ss":["__next_debug_channel:05wSX51u1YzWbF90ee6md=[\"Ok4xNzk0NTEyNT… |
| session survives a reload (silent refresh, still on /dashboard) | ✅ F | ✅ F | http://localhost:3102/dashboard refresh calls: 200 |
| second tab opens straight into the app (no login bounce) | ✅ F | ✅ F | http://localhost:3102/dashboard |
| both tabs reloaded at once both stay signed in (refresh-rotation race) | ✅ F | ✅ F | /dashboard / /dashboard |
| refresh with the cookie but without the cookie-mode CSRF header is refused or ignored (API) | ✅ F | ✅ F | 403 {"error":{"code":"CSRF_REJECTED","message":"This request didn't come from the Cofoundaz app.","field_errors":[]}} |
| refresh with the right header but a hostile Origin is refused (API) | ✅ F | ✅ F | 403 {"error":{"code":"CSRF_REJECTED","message":"This request didn't come from the Cofoundaz app.","field_errors":[]}} |
| Sign out → /login | ✅ F | ✅ F | http://localhost:3102/login |
| tab B (on /dashboard) is signed out too and sent to /login | ✅ F | ✅ F | http://localhost:3102/login |
| public page tab (/pricing) is NOT redirected by the remote logout | ✅ F | ✅ F | http://localhost:3102/pricing |
| public page still renders after logout | ✅ F | ✅ F | Skip to content / Product / Pricing / About / Log in / Start free / PRICING / Si |
| refresh cookie cleared after logout | ✅ F | ✅ F | [] |
| the cookie value that was live at logout can no longer refresh (API, proper headers) | ✅ F | ✅ F | 401 {"error":{"code":"UNAUTHORIZED","message":"Not authenticated.","field_errors":[]}} |
| visiting /dashboard after logout redirects to /login | ✅ F | ✅ F | http://localhost:3102/login?session=expired&next=%2Fdashboard |
| browser Back after logout does not show the app | ✅ F | ✅ F | http://localhost:3102/login?session=expired&next=%2Fdashboard |
| a fresh login after revoke-others works | ✅ F | ✅ F | http://localhost:3102/dashboard |
| lost cookie + reload sends the user to /login (not a blank/broken shell) | ✅ F | ✅ F | http://localhost:3102/login?session=expired&next=%2Fdashboard |

## Re-check after the fix (2026-11-12, branch `fix/rewalk-2026-11-12`)

Same scratch stack as the Team re-check. The API limit is 2 MB (`"Logo must be 2 MB or smaller."`), types PNG, JPG, SVG, WebP.

| Control | 1440 | 375 | Evidence / note |
|---|---|---|---|
| step 2: hint states the real limit | ✅ F | ✅ F | "PNG, JPG, SVG, or WebP up to 2 MB" |
| step 2: >2 MB file is refused with a visible message and the wizard stays on step 2 | ✅ F | not re-run | alert "Logo must be 2 MB or smaller." |
| step 2: non-image file is refused with a visible message and the wizard stays on step 2 | not re-run | ✅ F | alert "Logo must be a PNG, JPG, SVG, or WebP image." |
| step 2: a valid PNG still uploads and moves to step 3 | not re-run | ✅ F | step 3 "What are you building?" |
