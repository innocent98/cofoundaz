# Re-walk: founder Billing, comped plans and refunds (rows 21-24)

Walked 2026-11-05 on a scratch API (`cbf-` Postgres and Redis, API :8871, FE dev :3871, Paystack stubbed, never a live call) built from `cofoundaz-api` `origin/develop` `78fd1fc6`. Data produced through the real Super Admin API (comp, refund, mark done) by a scratch seed that is not committed. Founders signed in through the login form. Browser pane at 1440 and 375.

| # | Row | 1440 | 375 | Evidence |
|---|---|---|---|---|
| 21 | Comped founder opens Billing | PASS | PASS | Card reads "Complimentary until 5 Dec 2026", price "Complimentary". Page text and buttons contain no "Your plan ends on", no "Keep my plan", no "Cancel plan", no "Plan ends". Next-invoice card says nothing is due. No horizontal overflow at 375. |
| 22 | Same founder tries Change plan | PASS | PASS | Both widths: Plans shows "Subscribe to Growth"; its dialog reads "₦24,000 per month..."; Not now closes it; Continue to Paystack sent `POST /billing/subscription/checkout` and got 200 (the browser then went to the stub checkout URL). |
| 23 | Partial refund done | PASS | PASS | Invoices: "₦24,000, PARTLY REFUNDED: ₦10,000". No overflow at 375. |
| 24 | Pending refund only | PASS | PASS | Invoices: "₦24,000, PAID", no refund text. |
| - | Full refund done | PASS | PASS | Invoices: "₦24,000, REFUNDED". |

A second walk on a fresh scratch stack closed the 375 and 1440 gaps from the first; every row is now clicked at both widths with the founders seeded through the real Super Admin comp, refund and mark-done calls.

## Controls clicked

- Comped overview (1440 and 375): Change plan opens Plans; Payment method opens Payment; See usage opens Usage; the Overview pill returns. All worked at 375.
- Plans, comped founder (1440): Growth card reads "Subscribe to Growth" (not disabled). Clicking it opens "Subscribe to Growth", then **Continue to Paystack** sent `POST /billing/subscription/checkout` and got **200**. Starter and Scale cards stay clickable.
- 409 path (1440): before the fix below, choosing Scale and Confirm sent `POST /billing/subscription/change` and got **409**. The dialog showed the API's message: "This plan is complimentary and ends on its own date. Choose a paid plan at checkout to keep it after that."
- Invoices (partial founder): Receipt button sent `GET /billing/invoices/{id}/pdf` and got 200.

## Found and fixed during the walk

For a comped founder the API's `preview-change` answers `upgrade` with a prorated credit of a plan they never paid for, and `/change` then returns 409. So Change plan never reached checkout. The FE now skips the preview for a comp and opens the checkout dialog directly (`components/settings/billing/billing-plans.tsx`). Possible API follow-up: make `preview-change` return `checkout` for a comped workspace.

## Not verified

- A real Paystack payment replacing the comp (stubbed here; the API guide marks this unit-tested only).
- Cancel and resume are unreachable in the UI for a comp, so the 409 on those two was not triggered from the page. Change's 409 was.
