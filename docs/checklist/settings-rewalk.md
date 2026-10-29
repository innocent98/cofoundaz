# Settings + Billing FE: re-walk ledger (WIP, 2026-10-30)

**Status: NOT DONE. The re-walk table is not filled in yet.** This is a hand-over note for the next session.

## What is built (branch `feature/settings-billing-fe`)
Settings hub (Profile, Security, Workspace, Notifications link, AI preferences link, Billing with Overview / Plans / Usage / Invoices /
Payment / Add-ons) on the real APIs. See `docs/sop/settings-billing-fe.md` (draft, written before the walk finished). S7 is the FE
developer's; S8 is deferred (no API). `typecheck`, `lint`, vitest for the touched files pass; `npm run build` has NOT been run yet.

## Re-walk so far
Method: a scripted Chromium walk (`walk.mjs`, kept in the author's scratchpad, not committed) against the dev server on :3102 and the
shared API on :8000, with throwaway founder / team member / mentor / accountant accounts. Paystack is never reached: the three
redirecting POSTs are stubbed in the browser and the hosted-page navigation is aborted. Paid states are rendered from the guide's captured
bodies via browser stubs.
- Founder at 1440, third full run: 56 of 63 checks passed; the 7 failures were all harness faults (curly apostrophes in selectors, API
  slowness racing read-backs, localStorage re-seeded by the init script after logout) plus real fixes already applied (nested `<main>`,
  one huge daily bar, `INVALID_REFERENCE` message, trial price label).
- A full 8-pass run (4 roles x 1440 and 375) was started and had not finished when work paused. Its output is in the scratchpad
  (`results.json`, `shots/`); screenshots are not committed.
- Two screens were read by eye (profile, security, billing overview, usage).

## Left to do
1. Re-run `node walk.mjs` (needs fresh accounts: `setup2.py`; the walk changes passwords and starts the one-time trial) and fix any real failures.
2. Write the row-per-control table here (role, 1440 / 375, control, result) from `results.json`; label stubbed rows as stubbed.
3. Update the Settings row in `docs/checklist/buildout-status.md` and the FE column of `docs/checklist/settings-prd-gaps.md`.
4. `npm run build`, push, mark the PR ready.

## BE findings for the lead
- **`GET /auth/sessions` cannot mark "this device"** for a localStorage-token client: it reads only the refresh cookie. The FE hides per-row
  "Sign out" when no row is current and offers "Sign out other devices" (body token). Request: accept the refresh token in a header on the GET.
- **`GET /billing/subscription/verify?reference=<malformed>` returns 422 `INVALID_REFERENCE`**, not the 404 the guide lists for foreign references (the FE handles both).
- **The shared stack on :8000 talks to the real Paystack.** Before I knew that, one `POST /billing/subscription/checkout` (growth, monthly) from my
  throwaway founder created a real Paystack initialize call (reference `cfz_checkout_5aa13c9c0941fa9a3480`, never opened or paid). No later call
  reached Paystack (stubbed in the browser). Worth confirming the key is a test key.
- Local storage backend returns file paths for `avatar_url` / `logo_url` (not URLs); the existing sidebar shows a broken logo image after a workspace logo upload locally.
