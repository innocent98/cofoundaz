# Authentication & Onboarding: PRD + UI gap list (live walkthrough, 2026-11-05)

Source of truth: `Cofoundaz_Technical_PRD.md` Module 01 (§01.1 to §01.6, API, entities, events, notifications) + §3.5
auth-adjacent public pages. Walked live on `develop` (FE `24c6472`, API `cec5afc8`), scratch stack (containers `aup-*`,
API :8030, FE :3030, emails captured by `EMAIL_BACKEND=file`), with generated test accounts. Browser walk at 1440 and
375 plus a raw-API probe of every endpoint (the FE and the API were compared on each screen). Google sign-in was audited
and shipped before (API #213, FE #216, `docs/fe-handoff/google-sign-in.md`): treated as done, no regression seen (a
`next` of `//evil.example/x` on `/login` landed on `/onboarding`, no open redirect).

Legend: ✅ meets PRD · ❌ gap · BE / FE / security tags in the table

## Works (verified live)
- ✅ Sign-up: `POST /auth/signup` 201 `{user, verification_sent}`; weak password 422 `WEAK_PASSWORD` with the PRD sentence
  ("Add a number and make it at least 8 characters."); taken email 409 `EMAIL_TAKEN` with the PRD sentence.
- ✅ Verify: one-time token (reuse → 400 `TOKEN_INVALID`), a fresh resend invalidates the previous token, 24 h expiry in
  the email, unverified users get 403 `EMAIL_NOT_VERIFIED` on onboarding, dashboard and every workspace route (the
  login still returns tokens, `/auth/me` shows `pending_verification`).
- ✅ Login: same 401 (`That email and password don't match.`) for a wrong password and an unknown email; a disabled
  account answers the same; 5 failures → 429 `ACCOUNT_LOCKED` (15 min), also for the right password while locked.
- ✅ Forgot / reset: generic `{sent:true}` for known and unknown emails; reset link is one use, old links die when a new one
  is issued, all refresh tokens are revoked on reset, 1 h expiry, weak new password rejected, mismatch caught in the UI.
- ✅ 2FA (TOTP): setup shows QR + secret, wrong code rejected with the PRD copy, 10 backup codes shown once with Copy /
  Download, TOTP replay refused, backup code is single use, login → `/login/mfa` → dashboard works with an authenticator
  code, "Use a backup code" toggle exists.
- ✅ Onboarding: autosave per step (PATCH), resumable (leave and come back), `ONBOARDING_INCOMPLETE` 422 lists the missing
  fields, completing queues `roadmap.generate` + `healthscore.initialize` jobs, dashboard then shows the PRD banner
  "Your workspace is running on defaults…" with **Complete assessment**.
- ✅ Invites: preview (`GET /invitations/{token}`) shows startup, role, inviter, invited email; wrong-account accept → 403
  `INVITE_EMAIL_MISMATCH` and the FE explains it; right account accepts and lands on the inviter's dashboard with the
  role; reused or expired link → "This invitation is no longer valid"; new-user path works end to end (sign-up with the
  email prefilled → verify → open the invite again → accept).
- ✅ Sign-out clears local tokens and revokes the refresh cookie server side; `/login?next=` is sanitised (no open
  redirect); Terms, Privacy, Security, Cookies, Contact and the 404 page ("Well, this page didn't survive
  product-market fit.") exist.
- ✅ No mock or seed data anywhere in sign-up, verify, login, forgot, reset, 2FA, onboarding and invite screens (all real API).

## Gaps
| # | Area | Gap (observed) | PRD | Fix |
|---|---|---|---|---|
| 1 | Lockout (security) | **Account lockout leaks which emails exist**: after 5 wrong passwords a registered email answers 429 `ACCOUNT_LOCKED`, an unknown email answers 401 forever (8 tries, never locked). It also lets anyone lock a victim out for 15 min (counter is per account, no IP) | login lockout; "no user enumeration" (§01.5) | BE: count failures per (email, IP) and per email for unknown addresses too, same response either way; see D-AUTH-2 |
| 2 | Lockout copy | API says "Try again in a few minutes or reset your password." (no `{m}`); FE ignores it and shows **"Too many attempts. Please wait a moment and try again."** (no minutes, no reset link) | **"Too many attempts. Try again in {m} minutes or reset your password."** | BE: `retry_after_seconds` in the 429 body (+ `Retry-After` header); FE: PRD sentence with minutes and a "reset your password" link |
| 3 | Lockout vs reset | A password reset does **not** clear the lock (reset succeeded, login still 429), yet the message tells the user to reset | lockout copy | BE: successful reset clears `failed_login_count` / `locked_until` |
| 4 | Rate limits (security) | Only the global limiter (120/min per IP, or per user when a token is sent) applies. No tighter limit on sign-up, forgot, verify-resend or login. Key is the remote address; behind the production proxy that may be the proxy's IP (not checkable locally) | (hardening) | BE: per-route limits (e.g. forgot 5/h per email + 20/h per IP, signup 10/h per IP); confirm trusted-proxy headers on staging |
| 5 | Token storage (security) | Access and refresh tokens are kept in `localStorage` (`cf_token`, `cf_refresh_token`) although the API already sets an HttpOnly refresh cookie. Any XSS reads both | (hardening) | FE: access token in memory, refresh through the cookie only; see D-AUTH-6 |
| 6 | Onboarding input (security) | `PATCH /onboarding/state` stores `website: "javascript:alert(1)"` (the FE accepted it too); phone `"abc"`; goals as free strings (`<script>x</script>`) | Step 2 Website; Step 4 chips | BE: website http(s) only, phone E.164-ish, goals from the fixed list, name/description length caps; FE same checks |
| 7 | Invites (security) | `POST /onboarding/invites` accepts and **emails** an invalid address (`"nope"` in `created`); skipped entries (self-invite, duplicates) come back with no reason | Step 5 | BE: `EmailStr`, per-row result `{email, status, reason}`; FE shows rows that failed |
| 8 | MFA challenge | The MFA ticket dies on the **first** wrong code (Redis key deleted on resolve). After one typo the screen keeps saying "That code isn't right. Try again." for every later attempt, even a correct code or backup code (seen live) | **"Enter your 6-digit code"** flow | BE: ticket allows 5 attempts then burns, new code `MFA_TICKET_EXPIRED`; FE: on that code go back to `/login` with "Your sign-in timed out. Log in again." |
| 9 | Verify landing | `/verify-email/{token}` success jumps straight to `/dashboard`: no **"You're verified. Let's build."** page, no MFA step, no onboarding hand-off. For an invited user the invite `next` is lost (verify link carries no `next`), so they land in an empty draft workspace ("Your workspace") and must reopen the email | §01.2 success page + Continue → MFA setup; invite flow | FE: success page with Continue; verify link keeps `next`; route by state (invite pending → invite, else MFA step if chosen, else onboarding); see D-AUTH-4 |
| 10 | Guards | `/dashboard` opens for a user who has not finished onboarding: every card says "Couldn't load this" (API 422, no workspace header). Invited members can open `/onboarding` (the wizard for a founder) | wizard is the first-run path | FE: redirect to `/onboarding` until `onboarding.completed`; members never see it |
| 11 | Onboarding state | `GET`/`PATCH /onboarding/state` without `X-Workspace-Id` creates a **founder draft startup** for an invited member (6 startups for 8 accounts in the scratch DB); the draft carries role title "Founder & CEO" for a mentor too | wizard is for founders | BE: never create a draft for a user that has a membership or a pending invite; default role title only for founders |
| 12 | Verify page | Route is `/verify?email=<address>` (email in the URL; PRD `/verify-email`, which 404s). Missing: H1 **"Check your inbox"**, "It expires in 24 hours.", **"Resend in {s}s"** countdown. Present but not in PRD: a "paste your verification code / token" box. A second resend inside 60 s still says "A fresh verification link has been sent" (API throttled silently, no mail went out); success and error lines stack; a used link says "Verification failed" even though the account is verified | §01.2 | FE: PRD copy and route, email in session storage not the URL, countdown from `retry_after`, remove token box, "already verified? Log in" on a used link; BE: resend returns `{sent, retry_after}` |
| 13 | Sign-up screen | Google only (no **Apple**); button "Sign up with Google" (PRD **"Continue with Google"**, login already says that); password has no strength meter; errors are one banner at the top, not inline under the field; the taken-email line is text, not the PRD link; left panel shows 3 static bullets (PRD rotating value-prop lines); invited users still see **"Create your workspace"** | §01.1 | FE: copy, strength meter, inline errors, link, invite variant ("Join {startup}"); Apple per D-AUTH-3 |
| 14 | Consent | The Terms/Privacy checkbox is checked only in the browser. The API accepts sign-up without it and records nothing | §01.1 checkbox | BE: `accepted_terms: true` required, store timestamp + document version; FE sends it |
| 15 | Forgot / reset copy | Forgot confirmation says **"We've sent a reset link to {email}."** (asserts delivery; PRD "If that email has an account, a reset link is on its way."); reset page title "Set new password" (PRD "Choose a new password"); success "Password updated. Redirecting you to login…" (PRD **"Password updated. Log in with your new password."**) | §01.5 | FE: PRD copy |
| 16 | MFA setup | H1 "Add a second factor" (PRD **"Protect your startup"**); SMS row says "Coming soon" and the API answers 501 `FEATURE_NOT_ENABLED` for `/auth/mfa/sms/*` and `/auth/oauth/apple`; backup-code field placeholder "XXXX-XXXX" but codes are 10 digits; never offered after verify (only from the avatar menu); no dashboard nag banner after "I'll do this later" (not seen) | §01.4 | FE: copy, placeholder, banner; SMS and Apple per D-AUTH-3 |
| 17 | Wizard structure | Order and content differ: 1 profile ✅, 2 startup has **no logo field** (logo is step 5 and the API has `/onboarding/logo`), 3 **industry is free text** (PRD combobox) and stage labels differ ("Idea / Concept", "Problem Validation"… without the PRD sublabels), 4 offers **6 goals** (PRD 8: validate, MVP, first customers, revenue, funding, legal, financial, team), 5 is the logo, 6 is Invite team with **"Complete Setup"** (PRD "Send invites" + "Skip — it's just me for now"). **Step 6 Kickoff Assessment does not exist** (no Start assessment / Do it later). Layout is the split brand panel, not the full-screen focused one; H2s differ ("Tell us about yourself" vs "First, about you") | §01.6 steps 1-6 | FE: rebuild steps to the PRD; see D-AUTH-5 (assessment step), D-AUTH-7 (industry list) |
| 18 | Wizard validation | Continue advances with nothing chosen on step 3 (industry, model, stage) and step 1 (BE stores empty `full_name`/`name`). The real check only fires at the end: the red banner "Pick your industry (step 3). Pick your stage (step 3)." appears on step 6 with no link back; the invite mail already went out and the stale banner stays after Back | autosave per step | FE: per-step required fields, banner links to the step; BE: reject empty strings |
| 19 | AI panel | No persistent "Onboarding Assistant" panel, no ✨ chips on pre-filled fields, no adaptive follow-ups. BE returns one fixed sentence in `ai_panel` ("Got it: a Fintech startup at the idea stage. Let's calibrate your workspace.") and the FE never shows it | §01.6 AI behavior | BE: follow-up questions after steps 2-3 (LLM, budgeted, stub fallback) + PATCH of answers; FE: right panel |
| 20 | Prefill | Country has no geo default | Step 1 | FE: default from locale / IP country |
| 21 | Notifications | Completing onboarding sends no **"Welcome to Cofoundaz — let's build {startup}"** email (only "Verify your email" and invites were captured). In-app **"Your workspace is ready…"** not checked (needs a stack walk with the notifications stream) | §01 Notifications | BE: welcome email on `onboarding.completed`; verify the in-app one |
| 22 | Emails | Invite subject "You're invited to join WalkCo on Cofoundaz" (PRD **"{Founder} invited you to join {Startup} on Cofoundaz"**); all auth/invite emails use indigo `#4f46e5`, not the brand blue `#0F6AFC` / navy `#051736`; no "password changed" email after a reset | §01 Notifications; brand decisions | BE: subject, colours; optional security email |
| 23 | Invite screen | Invalid or used link is a dead end (no Log in / Back home link). Signed in as the wrong user the page still shows **Accept** (only the 403 explains), then offers "Log in to accept" without a sign-out. An invited member's name is empty ("Your account", avatar "U"): nothing asks for it. Invite roles offered include **Investor** (PRD lists six roles) | §3.5 `/invite/{token}` | FE: links on dead end, warn "Signed in as {email}" with Sign out, name prompt on first accept; roles per D-AUTH-4 |
| 24 | Mobile (375) | On `/signup`, `/login` and `/onboarding` the navy brand panel fills the whole first screen: the form heading starts at y=836 / 836 / 957 on an 812 px viewport, so the form is below the fold. `/verify` overflows by 1 px | responsive | FE: hide or shrink the brand panel under `md` |
| 25 | Session tokens | A password reset or sign-out revokes refresh tokens, but an already issued access token (15 min) stays valid | (info) | none now; note for the security page |

Not walked (say so, don't guess): the unverified-user path in the browser right after sign-up (API gates it, FE behaviour
unseen); a bogus `/reset-password/{token}` page (loads, error shape only seen through the API); the dashboard 2FA nag banner;
real email delivery (file backend only); production proxy IP handling; Apple sign-in and SMS 2FA (not built).

## Decisions (all seven accepted by Adebayo 2026-11-05: "Accept all seven")
- **D-AUTH-1: sign-up "email already has an account". Accepted 2026-11-05: (a)** keep the PRD message, rely on rate
  limits (gap 4). The real leak (gap 1) is fixed separately.
- **D-AUTH-2: lockout model. Accepted 2026-11-05: (a)** per (email, IP) counter, same answer for unknown emails, message
  with minutes, a reset clears the lock.
- **D-AUTH-3: Apple sign-in and SMS 2FA. Accepted 2026-11-05:** hide both for v1 (no Apple button, no SMS row); keep the
  API seams.
- **D-AUTH-4: 2FA timing and invite roles. Accepted 2026-11-05:** onboard first, dashboard banner until 2FA is set;
  Co-Founder = `founder` role with a one-line warning ("Co-Founders have full access, including billing"); drop
  Investor from the wizard (invited later from Team / Investor Readiness).
- **D-AUTH-5: Kickoff Assessment as wizard step 6. Accepted 2026-11-05:** add it as the PRD says (Start assessment /
  Do it later); the dashboard banner stays for Do it later.
- **D-AUTH-6: token storage. Accepted 2026-11-05:** fix before launch (access token in memory, refresh through the
  HttpOnly cookie, silent refresh).
- **D-AUTH-7: industry list and goal chips. Accepted 2026-11-05:** the lead proposes, Adebayo edits. **Draft for his edit:**
  - Industries (26, stored as these labels; "Other" opens a free-text field): Fintech · Healthtech · Edtech · Agritech ·
    E-commerce & retail · Logistics & supply chain · Marketplaces · SaaS & developer tools · AI & data · Climate & energy ·
    Mobility & transport · Proptech & construction · Media & entertainment · Gaming · Travel & hospitality · Food & beverage ·
    Fashion & beauty · Consumer hardware · Manufacturing · Telecoms & connectivity · Legaltech & govtech · HR & recruiting ·
    Cybersecurity · Insurtech · Professional services · Other.
  - Goal chips (8, pick up to 3, exactly the PRD list): Validate my idea · Build my MVP · Get first customers ·
    Grow revenue · Raise funding · Get legally set up · Get financially organized · Build my team.
  - Stage cards (PRD labels + sublabels): Idea "It's in my head or on paper" · Validation "I'm testing it with real people" ·
    Build "I'm building the product" · Launch "I'm live with first users" · Growth "I have revenue and I'm growing" ·
    Scale "I'm expanding what already works".

## FE step 2 status (2026-11-12, PR `feature/auth-onboarding-fe`)
Closed on the FE: 2, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 20, 23, 24 (walk: `auth-onboarding-fe-walk.md`). Gap 5 (D-AUTH-6) is built in the second PR on
`feature/auth-cookie-session` (walk: `auth-cookie-session-walk.md`). Open: 19 (AI onboarding panel, needs API follow-ups).

## Build order (proposal)
1. BE (one PR): gaps 1, 2 (body), 3, 4, 6, 7, 8 (ticket attempts), 11, 12 (`retry_after`), 14, 21, 22, 25 note; migration for
   terms acceptance and the new rate-limit keys; tests per gap.
2. FE (one PR): gaps 2, 8, 9, 10, 12, 13, 15, 16, 18, 20, 23, 24, then 17 + 19 once D-AUTH-5 / -7 are answered;
   gap 5 per D-AUTH-6.
3. Re-walk every control on merged develop (all roles, 1440 + 375), including the items under "Not walked".
