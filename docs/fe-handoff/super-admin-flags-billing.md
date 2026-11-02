# FE hand-off: Super Admin Feature flags and Billing overrides, plus the founder Billing changes they need

**For:** the FE developer. **Scope:** exactly what is below. **Build after** `docs/fe-handoff/super-admin.md`: reuse its staff check, banner and the shared step-up dialog from `docs/fe-handoff/admin-portal.md` section 6.
**Backend:** API #207 (Billing overrides) and #208 (Feature flags), merged to `develop`. **Contract:** `cofoundaz-api/docs/fe-integration-guide-admin-flags.md` and `fe-integration-guide-admin-billing.md`. Every body there was captured live: trust its field names and nesting. **Gap list:** `docs/checklist/admin-prd-gaps.md` (S9, S26). **Design:** `# Cofoundaz Web App UI Build/Super Admin Portal.dc.html` (Feature flags tab; Billing overrides isn't in the design, so match the console's existing card and table style).
Files: `app/super-admin/page.tsx`, `lib/api/admin.ts`, and, for part C, `components/settings/billing/billing-overview.tsx`, `lib/billing-format.ts`, the invoices view. Read `AGENTS.md` first.

Add **Feature flags** and **Billing overrides** to the Super Admin nav, after Overview.

## A. Feature flags (`/super-admin/flags` routes)

- List from `GET /super-admin/flags`. One card per flag: `name`, `key` (small, monospace), badge from `stage` (Beta, GA, Internal), `description`, an on/off toggle for `enabled`, rollout buttons 0, 10, 25, 50, 100 for `rollout_pct`, and "Affects {affected_workspaces} of {total_workspaces} workspaces".
- **Every change goes through a confirm dialog** built on the shared step-up dialog. Before it opens, call `GET /super-admin/flags/{key}/impact` with the proposed `enabled` and `rollout_pct`, and show "This affects ~{affected_after} workspaces (now {affected_now})." Changes are live for real users at once: say so.
- Save with `PATCH /super-admin/flags/{key}`, sending **only the fields that changed**, plus `reason` and `totp_code`. Never send `key` or a `null`.
- Edit dialog: name, description, stage, and the workspace allow-list. The allow-list **replaces** the whole list. Pick workspaces with the Workspaces search from the Admin brief and show names, not ids.
- Under the stage picker: "Stage is only a label. Use the allow-list to limit who gets it."
- Turning a flag off keeps its rollout, so turning it back on restores it. Label the toggle "On / Off (kill switch)".
- **New flag**, `POST /super-admin/flags`: key (lowercase letters, digits, `_`, 3 to 60 characters, starting with a letter; can't be changed later, so say so), name, description, stage, then the step-up fields. A new flag starts off at 0%.
- Errors, showing the API's message: 409 `FLAG_KEY_EXISTS`; 422 `UNKNOWN_WORKSPACE`, `NO_CHANGE`; 404 `FLAG_NOT_FOUND`; `STEP_UP_INVALID` as in the shared dialog. **A refused save still spends the code**, so clear the code field after any failure.
- Do **not** add a founder-side flags hook or wire any feature to `GET /flags`. Nothing uses a flag yet.

## B. Billing overrides (`/super-admin/billing/{workspace_id}` routes)

### Find a workspace

Search box using `GET /admin/workspaces?query=` (Admin brief section 4). Picking a row opens the workspace's billing from `GET /super-admin/billing/{workspace_id}`. 404 `WORKSPACE_NOT_FOUND`: "No such workspace."

### Page

- **Subscription card.** `subscription` is **null** for a workspace that never opened Billing: show "Starter, free". Otherwise show plan, status, price in ₦ (`price_minor / 100`), renews or ends, and a **Comped** tag when `comped` is true.
- **Invoices table.** Number, description, amount, paid (the field is **`paid_at`** here; the founder list uses `date`), status, refunded, pending, and refundable (`refundable_minor`).
- **Overrides history.** From `overrides[]`, newest first: kind, amount or credits or days or plan, reason, `actor_email`, time. Refunds also show Pending or Done. "Credits granted in total: {credits_granted_total}".
- Reload `GET /super-admin/billing/{workspace_id}` after every override. Don't patch the page from the response.

### The four overrides

Each opens the shared step-up dialog with a plain-words effect line first.

- Generate one `request_id` (UUID) **per button press** and keep it for a retry of that press. If the request times out, resend the same `request_id` with a **new** code; the server answers `"replayed": true` and changes nothing.
- Disable submit while a request runs.

| Override | Button shown when | Fields | Effect line |
|---|---|---|---|
| **Refund** | per invoice row with `refundable_minor > 0` | `invoice_id`, `amount_minor` (default and maximum `refundable_minor`, entered in ₦) | "Records a refund of ₦{x} on {number}. **No money is sent.** Make the refund in the Paystack dashboard, then mark it done here." |
| **Mark refund done** | per override with `provider_refund == "pending"` | none (no `request_id`) | "Confirm the refund of ₦{x} for {number} was made in Paystack. The founder will see the invoice as refunded." |
| **Credit** | always | `credits` (1 to 100,000) | "Gives {name} {n} AI credits. They never expire." |
| **Extend trial** | only when `subscription.status == "trialing"` | `days` (1 to 60) | "Moves the trial end from {old} to {new}." |
| **Comp** | always (the API refuses a paying workspace) | `plan_key` (a paid plan), `days` (1 to 365) | "Gives {name} the {plan} plan free until {date}. No card, no charge. It ends by itself." |

Routes: `POST .../refund`, `POST .../refunds/{override_id}/complete`, `POST .../credit`, `POST .../extend-trial`, `POST .../comp`.

Show the API's `message` for: 422 `REFUND_EXCEEDS_INVOICE` (its message says what's left), `TRIAL_TOO_LONG`, `PLAN_NOT_COMPABLE`; 409 `INVOICE_NOT_REFUNDABLE`, `NOT_TRIALING`, `PAID_SUBSCRIPTION`, `REQUEST_ID_REUSED`; 404 `INVOICE_NOT_FOUND`, `REFUND_NOT_FOUND`, `PLAN_NOT_FOUND`.

After recording a refund, the success toast repeats: "Recorded as pending. No money has been sent."

There's no way to cancel a pending refund yet. Put "Record a refund only when you're about to make it in Paystack." under the Refund button.

## C. Founder Billing changes (existing Settings screens)

These ship in the same PR, because a comped or refunded founder otherwise sees wrong things.

- **Comped plan** (`subscription.comped == true`): show "Complimentary until {ends_at}" in place of the plan status line. **Hide** the "Your plan ends on" banner, the **Keep my plan** button, the "Plan ends" next-invoice block, and Cancel. Today a comped founder would see "Your plan ends on..." and a Keep my plan button that fails with 409 `PLAN_COMPLIMENTARY`.
  - Update `lib/billing-format.ts` and `components/settings/billing/billing-overview.tsx`.
  - **Change plan stays available**, because checkout replaces the comp.
  - If cancel, resume or change still returns 409 `PLAN_COMPLIMENTARY`, show its message.
- **Refunds on invoices:** the founder's invoice list has a new field, `refunded_minor`. When it's above 0 and the status is still `paid`, show "Partly refunded: ₦{x}". A `refunded` status shows "Refunded". Pending refunds never appear to the founder.

## D. Out of scope (do not build)

Danger zone (next brief), cancelling a pending refund, any Paystack call, flag targeting by plan or stage, a founder-side flags hook, editing a flag's key, bulk overrides.

## E. Acceptance = the re-walk rows

Done means every row passes on merged `develop`, at 1440 and 375, as a Super Admin (rows 1 to 20) and as a founder (rows 21 to 24), with row 25 as an Admin. Each result must match the raw API.

| # | Row | Pass when |
|---|---|---|
| 1 | Flags tab | Cards equal `GET /super-admin/flags`; affected counts shown |
| 2 | New flag with a bad key, then a taken key | Field error, then the API's message; code field cleared |
| 3 | New flag | Card appears off at 0% |
| 4 | Turn it on at 10% | Confirm shows the impact numbers; card updates after save |
| 5 | Turn it off, then on again | Rollout restored to 10% |
| 6 | Allow-list one workspace at 0% | "Affects 1"; names shown, not ids |
| 7 | Save with nothing changed | `NO_CHANGE` message |
| 8 | Two saves inside one 30-second code | Second shows the wait message; still signed in |
| 9 | Billing: search and open a workspace with no subscription | "Starter, free"; no crash |
| 10 | Record a partial refund | Pending in history; founder's invoice unchanged |
| 11 | Refund more than is left | API message with the amount left |
| 12 | Mark it done | Founder sees "Partly refunded" |
| 13 | Refund and complete the rest | Founder sees "Refunded"; plan unchanged |
| 14 | Retry a press after a forced timeout (same `request_id`, new code) | Replayed, nothing doubled |
| 15 | Credit 500 | Founder Usage limit rises by 500 |
| 16 | Extend a trial by 7 days, then try 90 | Date moves; then `TRIAL_TOO_LONG` |
| 17 | Extend trial on a non-trial workspace | Button disabled |
| 18 | Comp Growth for 30 days on a free workspace | Comped tag; history row |
| 19 | Comp a paying workspace | `PAID_SUBSCRIPTION` message |
| 20 | Every override | Audit log shows it with the reason |
| 21 | Founder on a comped plan opens Billing | "Complimentary until..."; no ends banner, no Keep my plan, no Cancel |
| 22 | Same founder tries Change plan | Checkout works |
| 23 | Founder with a partial refund done | "Partly refunded: ₦x" |
| 24 | Founder with a pending refund only | Nothing shown |
| 25 | Admin opens either tab's URL | Lands on `/dashboard` |
| 26 | 375 px | Every control reachable, no overflow or clipped text |
