# SOP — Two-factor authentication (TOTP): setup + login challenge

**What shipped:** the MFA screens from the design comp — a **setup** flow
(`/setup/mfa`: authenticator QR + manual key → verify → backup codes) and a
**login challenge** (`/login/mfa`: 6-digit or backup code) — plus the login-page
hand-off that routes an MFA-required sign-in to the challenge. Closes checklist §6a
MFA setup + challenge.

## Why

The design has full MFA (`mfaSetup` + `mfaChallenge`) and the backend implements the
**TOTP** path end to end, but the FE had **no MFA screens and no login hand-off** —
so an account with 2FA on literally could not sign in (login returns
`access_token: null`, which the old login page treated as an error).

## How — verified backend contract (TOTP only)

| Endpoint | Purpose | Shape |
|---|---|---|
| `POST /auth/login` | when 2FA on, withholds tokens | `{ mfa_required: true, mfa_ticket, access_token: null }` |
| `POST /auth/mfa/totp/setup` | begin enrollment (pending secret) | `{ secret, otpauth_uri }` · 409 if already on |
| `POST /auth/mfa/totp/verify {code}` | enable + issue backup codes | `{ enabled: true, backup_codes: [...] }` |
| `POST /auth/mfa/challenge {mfa_ticket, code}` | login 2nd factor | `{ access_token, refresh_token }` · code = TOTP **or** backup code |

Files:
- `lib/api/mfa.ts` — the four calls above via `apiClient`.
- `lib/auth/post-login.ts` — **extracted** the post-token routing (`/auth/me` →
  status → `/onboarding/state` → verify/onboarding/dashboard) so the password login
  and the MFA challenge share one code path and can't drift.
- `app/(auth)/login/page.tsx` — detects `mfa_required`, stashes `{ticket, email, next}`
  in **sessionStorage** (never the URL — the ticket is a short-lived secret), routes
  to `/login/mfa`; otherwise uses `completePostLogin`.
- `app/(auth)/login/mfa/page.tsx` — challenge card in the auth shell; 6-digit input
  with a "Use a backup code" toggle; missing ticket → back to `/login`.
- `app/setup/mfa/page.tsx` — authenticated setup: QR (rendered **offline** via the
  new `qrcode` dep — sending the secret to an external QR service would leak it) +
  copyable base32 key; verify → backup-codes screen (copy / download own codes);
  SMS shown **disabled** ("Coming soon"); 409 → "already on"; 401 → login.
- `components/sidebar.tsx` — a "Security (2FA)" footer link to `/setup/mfa` (Settings
  is billing-only, so there was no account-security home to host it).

## Key decisions / constraints

- **TOTP only; SMS is disabled.** `POST /auth/mfa/sms/{setup,verify}` raise
  `FeatureNotEnabled` (they live in `seams.py`). The UI shows SMS but greyed
  "Coming soon" — never wired, so nothing is faked.
- **No MFA-disable endpoint exists.** Once on, the backend has no "turn off". The
  "already on" screen says to contact support; **relay to backend** that a disable/
  reset path is needed.
- **`MFA_ENCRYPTION_KEY` is set on staging** — verified live (`totp/setup` → 200).
  Without it every MFA endpoint errors (config default is `None`); confirm it's set
  per environment before enabling MFA in prod.
- New dependency: `qrcode` + `@types/qrcode` (offline, no network, no secret leak).

## Verification

| Check | Result |
|---|---|
| typecheck / lint | 0 / 0 (incl. the `ui/tokens.test.ts` design-token guard — codes use an inline monospace stack, not the cleared `font-mono` utility) |
| unit / build / e2e | 188 · clean (both routes emitted, `qrcode` bundles client-side) · 153 |
| **`/setup/mfa` live (staging)** | Logged-in (token injected, no password typed), the page fired the real `totp/setup`, rendered a **scannable QR + real base32 secret**, Authenticator active / SMS "Coming soon". Screenshot captured. |
| **`/login/mfa` guard live** | No ticket → redirects to `/login` ✓ |
| login regression | `POST /auth/login` (test account) returns `mfa_required: false` + token; routing logic is byte-for-byte the same (extracted, not rewritten). |

**Not exercised live (by design):** the enable→backup-codes and challenge happy
paths. Completing `totp/verify` would **enable MFA on the shared staging test
account**, and with no disable endpoint that would lock it for all other
verification. Those paths are contract-verified + type-checked against the real
endpoints; the risky dependency (secret encryption / `setup`) is confirmed live.

## Follow-ups

- Relay to backend: **MFA disable/reset** endpoint; SMS implementation; confirm
  `MFA_ENCRYPTION_KEY` in prod.
- Wire the setup step into the onboarding flow ("add a second factor" after verify),
  as the comp shows, and reflect 2FA on/off status in the sidebar entry (needs
  `mfa_type` on `/auth/me`).
- Full end-to-end live test on a disposable account once a disable path exists.
