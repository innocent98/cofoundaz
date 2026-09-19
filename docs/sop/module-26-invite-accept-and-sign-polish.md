# SOP — Accept-invitation landing + e-signature "adopt-&-sign" polish

**What shipped:** a new public **`/invite/{token}`** page that lets an invited user
join a workspace, and an honest **adopt-&-sign** upgrade to the existing public
**`/sign/{token}`** signer page. Two of the UI gaps from the 2026-09-19 PRD/UI audit
(checklist §6a).

## Why

- **Invite acceptance was a real hole.** Onboarding *sends* invites
  (`POST /onboarding/invites`) but the FE had no landing to *accept* one — invited
  users had nowhere to go. The backend already supports the full flow.
- **`/sign` was mislabeled a hole.** It was already a correct typed-signature flow;
  the audit only grepped for "SignaturePad/adopt". The real, honest improvement is a
  better recipient experience (read the doc inline, see your signature, explicit
  consent) — **not** a drawn pad, which the API cannot store (see decision below).

## How

### `/invite/{token}` — new (`app/invite/[token]/page.tsx`)
Public, no-auth preview → auth-aware accept, mirroring the `/sign` page's shell:
- `GET /invitations/{token}` → `{ startup_name, role, inviter_name, email, status }`.
  Uniform **404** (unknown / expired / already-used — backend won't leak which) →
  "invitation no longer valid" state.
- **Logged out** → "Log in to accept" (`/login?next=/invite/{token}`, which
  `safeNextPath()` honors and returns to) + "Create an account"
  (`/signup?next=…&email=…`). New users complete via the emailed link after email
  verification.
- **Logged in** → **Accept** → `POST /invitations/accept { token }` (requires a
  **verified** user). On success, set `cf_workspace_id` to the returned `startup_id`
  so the new workspace is active, then redirect to `/dashboard`.
- **Errors:** `INVITE_EMAIL_MISMATCH` (logged-in email ≠ invited email) → a targeted
  "log in with {email}" banner; `401` mid-flow → bounce to login-and-return; `404` /
  `TOKEN_INVALID` → invalid state.

### `/sign/{token}` — polish (`app/sign/[token]/page.tsx`)
Kept the working `POST { typed_name }` flow; upgraded the recipient UX:
1. **Inline document preview** — `<iframe>` for `application/pdf`, `<img>` for
   `image/*`, over an absolute `file.url`; other types keep the "Open" link fallback.
2. **Adopt-your-signature** — the typed name renders live in a script face
   ("Your signature") so the signer sees it before committing. **Still submits
   `typed_name`.**
3. **Explicit consent checkbox** — gates the Sign button (was a passive sentence).

## Key decision — no drawn signature pad (honesty)

`POST /sign/{token}` accepts **`typed_name` only**
(`app/services/documents/signatures.py::record_signature` sets `signer.signed_name =
typed_name`; IP + user-agent are captured server-side for the audit trail). A
`<canvas>` pad would produce an image the API discards → **un-submittable dead UI**,
which violates the no-fabrication rule. User confirmed the honest polish scope. If a
drawn signature is wanted later, it needs a backend field first.

## What's involved

- New: `app/invite/[token]/page.tsx`.
- Edited: `app/sign/[token]/page.tsx` (preview + adopt render + consent).
- Backend contracts (read-only, `cofoundaz-api`): `invitations.py` (`GET /{token}`,
  `POST /accept`), `services/onboarding/invites.py` (`preview_invitation`,
  `accept_invitation`), `documents.py` (`GET/POST /sign/{token}`, `SignAction`).

## Verification

| Check | Result |
|---|---|
| `npm run typecheck` | 0 |
| `npm run lint` | 0 / 0 |
| `npm test` | 188 passed |
| `npm run build` | clean — `/invite/[token]` + `/sign/[token]` both emitted |
| `CI=1 npm run test:e2e` | 153 passed |
| **Live (staging via dev proxy)** | `/invite/bogus` and `/sign/bogus` both hit the **real** API, 404 → correct "no longer valid" states. Wiring + render confirmed end-to-end. |

**Not exercised live:** the token-gated **happy paths** (valid single-use invite /
sign tokens are emailed, not obtainable without DB/email access). The success-path
code is contract-verified against the real endpoint shapes and type-checks against
them — same verification bound as the original `/sign` page (module-21).

## Follow-ups

- Prefill the signup email from `?email=` (link carries it; the signup form doesn't
  read it yet) and carry `next` through email verification so a brand-new invitee
  returns to `/invite/{token}` automatically after verifying.
- Optionally set the new workspace active via a proper `/auth/me` refresh rather than
  writing `cf_workspace_id` directly.
