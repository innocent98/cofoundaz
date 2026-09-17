# SOP — Module 0: Auth & session (real API integration)

## What shipped

The first real `cofoundaz-api` integration: the frontend now authenticates
against the live API instead of the local mocks, and the auth flows are verified
end-to-end against staging. Branch: `feat/api-auth-integration` → PR into `develop`.

## Why

Start replacing the mock layer with the real backend, module by module. Auth is
the gate — nothing authenticated works without a real token. The dev's mock work
was blocked earlier by staging's verification flow; this wires it for real.

## How — key decisions

- **Same-origin dev proxy (solves CORS).** The browser calling
  `staging-api.cofoundaz.com` directly from `localhost:3000` is blocked by CORS
  (`No 'Access-Control-Allow-Origin'`). So `next.config.ts` now proxies
  **`/api/v1/:path*` → the real API server-side** in development
  (`rewrites().beforeFiles`, target `API_PROXY_TARGET`, default staging). The
  client calls same-origin `/api/v1` (no CORS), and `beforeFiles` runs **ahead of
  the local mock route handlers**, so real endpoints win over the mocks.
- **Client base URL.** `lib/api/client.ts` uses `NEXT_PUBLIC_API_BASE_URL`
  (default `/api/v1`) and sends `Authorization: Bearer <cf_token>`. Local dev
  leaves it unset (same-origin + proxy); production sets it to the API origin
  (which must allow the app origin via CORS). Stripped a UTF-8 BOM from the file.
- **Path-based email-link routes.** The backend emails link to
  `/verify-email/{token}` and `/reset-password/{token}` (token in the **path**),
  but the FE only had flat `/verify` / `/reset-password` reading `?token=` — the
  links would have 404'd. Added `app/(auth)/verify-email/[token]/page.tsx` and
  `app/(auth)/reset-password/[token]/page.tsx` (Next 16 async `params`, awaited in
  a server component that hands the token to a client child). Shared client
  components live in `components/auth/` (not `ui/`, which must stay import-portable).
- **Envelope-nesting fix.** `/onboarding/state` returns `{data:{step,completed,…}}`,
  but the login page read `state.completed`/`state.step` (top level) — so a user
  who *had* completed onboarding would be misrouted to onboarding. Fixed to read
  `state.data.*`.

## What's involved

- `next.config.ts` (dev proxy), `lib/api/client.ts` (BOM), `app/(auth)/login/page.tsx`
  (envelope fix), `app/(auth)/reset-password/page.tsx` (reuse shared form),
  `.env.example` (documented `NEXT_PUBLIC_API_BASE_URL`).
- New: `app/(auth)/verify-email/[token]/`, `app/(auth)/reset-password/[token]/`,
  `components/auth/reset-password-form.tsx`, `components/auth/verify-email-client.tsx`.

## Verification (live against staging)

- **Browser login** with the staging test account → authenticated via real
  `/auth/login`, then routed to **onboarding** (account's onboarding incomplete) —
  confirms login + the envelope-nesting routing fix.
- **`/verify-email/{fakeToken}`** → auto-POSTs `/auth/verify`, gets the real `400
  TOKEN_INVALID`, renders "invalid or expired" + resend.
- **curl contract probes** (via the proxy): `login` 200 `{access_token,refresh_token}`,
  `me` `{user,profile,memberships,active_workspace_id}`, `onboarding/state`
  `{data:{step,completed,…}}`, `signup` existing→`409 EMAIL_TAKEN`, `forgot`→generic
  `200`, `verify` fake→`400 TOKEN_INVALID`. Captures in the session scratchpad.
- Gates: `typecheck` 0 · `lint` 0 errors · **188** unit · `build` ✓.

## Operate / config

- **Local dev:** unset `NEXT_PUBLIC_API_BASE_URL` (same-origin `/api/v1`); the dev
  proxy forwards to staging. Point at a local backend with `API_PROXY_TARGET`.
- **Preview/prod:** set `NEXT_PUBLIC_API_BASE_URL` to the API origin; the API must
  send CORS for the app origin (the proxy is dev-only).
- Test account credentials were provided out-of-band — **not committed**.

## Follow-ups

- **Backend/ops:** confirm `APP_BASE_URL` on staging/prod is the **FE origin** so
  email links point at `/verify-email/…` on the app, not the API (see the auth
  email-links FE guide). Verify via the Resend email log.
- Either add the app/localhost origins to staging **CORS** (so we could drop the
  dev proxy) or keep the proxy — proxy is fine and keeps dev same-origin.
- **Module 1 (Onboarding):** wire the wizard to really create the workspace/profile
  (the account currently has `active_workspace_id: null`).
- Delete the `app/api/v1/*` **auth mocks** now that real auth is wired (the proxy
  already bypasses them; removal is cleanup).
