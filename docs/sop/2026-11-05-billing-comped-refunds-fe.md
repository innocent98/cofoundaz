# Founder Billing: comped plans and refunds (FE)

**What shipped:** the Settings > Billing screen understands comped plans and refunded invoices. PR: innocent98/cofoundaz#226 (`fix/billing-comped-refunds`). Part C of `docs/fe-handoff/super-admin-flags-billing.md`; parts A, B and D are not in it.

**Why:** a founder whose plan staff comped saw "Your plan ends on" and a Keep my plan button that failed with 409 `PLAN_COMPLIMENTARY`, and refunded invoices still read "Paid".

**How**
- `Subscription.comped` and `Invoice.refunded_minor` (status may be `refunded`) added to `lib/api/billing.ts`, shapes taken from `cofoundaz-api/docs/fe-integration-guide-admin-billing.md`.
- `planStatusLine` returns "Complimentary until {ends_at}" for a comp. `invoiceStatusLabel` returns Paid, "Partly refunded: ₦x", Refunded or Failed; pending refunds are never in the founder payload.
- `billing-overview.tsx`: a comp is not a cancellation, so the ends banner, Keep my plan, "Plan ends" block, Cancel and the pending-change banner are hidden; the price reads "Complimentary".
- `billing-plans.tsx`: a comp's own plan shows "Subscribe to Growth", and choosing a paid plan skips `preview-change` and goes to checkout (the API previews an upgrade with a bogus credit and `/change` returns 409). Any remaining 409 shows the API message.
- Alternative rejected: wait for an API change to `preview-change`; the FE handles it now.

**Files:** `lib/api/billing.ts`, `lib/billing-format.ts`, `components/settings/billing/{billing-overview,billing-plans,billing-invoices}.tsx`, tests in `lib/billing-format.test.ts` and `billing-tab.test.tsx`.

**Verification:** typecheck, lint, vitest (16 pass) locally; live walk in `docs/checklist/billing-comped-refunds-walk.md`.

**Operate / roll back:** FE only; revert the PR. No config.

**Follow-ups:** API `preview-change` should return `checkout` for a comped workspace. Real Paystack payment over a comp is unverified.
