# SOP — Module 1: Onboarding (real API integration)

## What shipped

The onboarding wizard now runs against the live `cofoundaz-api`: it resumes the
draft workspace, autosaves each step, and gates completion — verified end-to-end
on staging. Branch `feat/api-onboarding` → PR into `develop`.

## Why

Onboarding is the gate to the whole product: `GET /onboarding/state` lazily
creates the founder's workspace (`Startup` + `founder` membership), and
`POST /onboarding/complete` unlocks the dashboard. The test account had no
workspace, so nothing downstream worked until this.

## How — key decisions & fixes

- **Envelope + nesting flattened in the client.** `GET/PATCH /onboarding/state`
  returns `{data:{step, completed, founder_profile:{…}, startup:{…}, …}}`, but the
  wizard works with a flat shape. `lib/api/onboarding.ts` now unwraps `data` and
  flattens `founder_profile.*` / `startup.*` (one `flatten()` — the only place
  that knows the nesting). The page read fields flat before, so initial load and
  resume were broken.
- **Country must be an ISO code.** `PATCH …/state` with `country:"Nigeria"`
  returns **500** (a bad value isn't validated); `country:"NG"` works. Replaced
  the free-text Country input with a **`<select>` of all 249 ISO countries**
  (`lib/countries.ts`, generated via `Intl.DisplayNames`) that submits the code.
  The list is passed into the wizard as a prop (the wizard is in `ui/`, which must
  stay import-portable — it can't import `@/lib`).
- **Complete gate errors surfaced.** `POST /onboarding/complete` returns `422
  ONBOARDING_INCOMPLETE` with `field_errors:[{field,message}]`; the page now shows
  the message + the missing-field messages instead of a bare status code.
- Stripped a UTF-8 BOM from the onboarding page.

## What's involved

- `lib/api/onboarding.ts` (flatten mapping), `lib/countries.ts` (new ISO list),
  `ui/onboarding/onboarding-wizard.tsx` (country select + `countries` prop),
  `app/(auth)/onboarding/page.tsx` (pass countries, complete error handling, BOM).

## Verification (live against staging)

- **Browser:** login → resumed onboarding at **Step 2 with "Kolo" pre-filled**
  (proves resume + the nested-field flatten); Country select showed **Nigeria (NG)**
  from the persisted code; **Continue → `PATCH /onboarding/state` 200** with
  `country="NG"` (the 500 is gone) and advanced to Step 2.
- **curl contract:** `PATCH` requires `step` (422 without); flat fields autosave;
  nested rejected (422); `complete` → `422 ONBOARDING_INCOMPLETE` with per-field
  `field_errors`.
- Gates: `typecheck` 0 · `lint` 0 errors · **188** unit · `build` ✓.

## Operate / roll back

Same dev proxy as Module 0 (`/api/v1` → staging). Roll back by reverting the PR.

## Follow-ups

- **Backend bug to relay:** `PATCH /onboarding/state` with an invalid `country`
  (a display name) returns **500** — it should be a `422 VALIDATION_ERROR`. The FE
  now only sends ISO codes, so it's mitigated, but the backend should validate.
- **Complete flow** (`job_ids` → route to dashboard) is coded and its gate verified,
  but not run to actual completion (that would permanently mark the shared test
  account onboarded). Exercise it once with a full set of fields when ready — it
  also unblocks Module 2 (dashboard) by giving the account a completed workspace.
- **Logo upload / invites** are wired (`/onboarding/logo`, `/onboarding/invites`)
  but not yet live-verified.
