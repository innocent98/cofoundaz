# Finance Hub: click-through re-walk (merged develop)

**Date:** 2026-10-24. **Verdict (original walk): not done yet. See "Slice (e) re-check, 2026-10-24" at the end for the current state.** API #182 (the Funding fix) was merged during the walk and the six re-check rows were redone on it, see "Funding fix re-check". Everything that could be clicked without a real third-party key passes except the items under "Failures" (no blocking defect; 5 open defects after the Funding fix: 2 on the API side, 5 on the FE side, all Low or Medium). **Still open:** (1) real imports: the Paystack and Flutterwave test accounts hold no transactions, so ledger import and payout tagging could not be exercised, (3) Mono sandbox sync fails server-side (D7). Finance should not be marked Done until those close.

**What was walked.** Merged `origin/develop` `8ac8a55` (includes FE #153) on the shared dev server `localhost:3000` (proxy to the docker API on `:8000`, develop `a9fd3a50`, migration 0070, worker up). Every row was clicked or typed **by hand in the Claude browser pane** (no Playwright, no scripted UI). Page text, `innerText` and `getBoundingClientRect` were used only to read results. Each result was then compared with the raw API (`curl` with the same account's bearer token and `X-Workspace-Id`, same minute). Widths: **1440** (pane emulation 1440x900) and **375** (375x812). Raw API captures are in `finance-rewalk-evidence/` (no tokens in them).

**Accounts / hosts (local, throwaway test accounts only).** Workspace NovaPay (`11ba2aa0-8c8d-4035-adb8-62530988ed44`). All four use the local test password already recorded in `docs/HANDOFF-master.md` (`Throwaway123!`): founder `throwaway-founder@example.com` on `localhost:3000`, team member `rewalk-tm@example.com` on `tm.localhost:3000`, mentor `bb-mentor-1@example.com` on `m.localhost:3000`, consultant `bb-consultant-1@example.com` on `bc.localhost:3000` (one host per role keeps cookies apart). No accountant account exists, so the accountant role was **not walked**.

**Money never leaves the machine.** Invoice emails go to `delivered+...@resend.dev` sink addresses and the local API's email provider is `console` (the worker log shows the body, nothing is delivered). No real Paystack, Flutterwave or Mono key was used. The only "keys" typed were an obviously fake `pk_test_PLACEHOLDER_NOT_A_KEY`.

**Specs checked against:** `cofoundaz-api/docs/fe-integration-guide-finance-*.md`, `finance-prd-gaps.md` (D-FIN-1..10), `finance-fe-walk.md` (FE #153).

**Legend.** ✅ = the UI matches the raw API and the guide. ❌ = defect (see "Failures"). ⚠ = a note that is not a defect. 🔁 = **re-check after Funding fix** (the row involves a Funding inflow in revenue or burn). ⏳ = not done yet, reason given. Roles: F founder, TM team member, M mentor, BC business consultant.

## 1. Founder (F), 1440: Cash flow `/finance`

| # | Control | Result | API evidence | |
|---|---|---|---|---|
| C1 | Page load: 4 tiles | Cash on hand ₦2,119,500; burn ₦960,167; money in ₦1,535,833; runway 2.2 months | `GET /finance/cash-flow` 200: `cash_on_hand` 211950000, `monthly_burn` 96016667, `monthly_revenue` 153583333, `runway_months` 2.2 (burn = net average of the last 3 months: (out − in)/3) | ✅ 🔁 |
| C2 | Low-runway banner | "Runway is under 6 months: 2.2 months left." | `runway_low: true` | ✅ |
| C3 | 6-month chart and hidden table | 6 months, May to Oct; Oct money out ₦5,633,000, net −₦3,725,500, cash at month end ₦2,119,500 | `by_month` rows equal (kobo ÷ 100) | ✅ |
| C4 | Ledger count and chips: All | "Showing 18 of 18 transactions" | `GET /finance/transactions?limit=50` 200, `total_estimate` 18 | ✅ |
| C5 | Chip "Needs a category (5)" | 5 rows | `?uncategorized=true` 200, 5 | ✅ |
| C6 | Chip "Money in" | 5 rows | `?direction=in` 200, 5 | ✅ |
| C7 | Chip "Money out" | 13 rows | `?direction=out` 200, 13 | ✅ |
| C8 | Add transaction: submit empty | Dialog stays open (browser required-field check) | no request sent | ✅ |
| C9 | Add transaction: description but no amount | "Enter an amount like 1500 or 1500.50." | no request sent | ✅ |
| C10 | Add transaction: Money in, ₦3,000.50, category Funding | Count 19; tiles move at once: burn ₦960,167 → ₦959,167, money in ₦1,535,833 → ₦1,536,834 | `POST` row `amount_minor` 300050, `category: Funding`, `direction: in`; cash-flow `monthly_revenue` 153683350, `monthly_burn` 95916650 | ✅ 🔁 ❌ see D1 |
| C11 | Edit (prefilled), amount to 4000, save | Row shows +₦4,000 | row `amount_minor` 400000, `updated_at` moved | ✅ |
| C12 | Inline category select on a manual row | Select shows `Funding` for the edited row; options = the 19 API categories + "Add category..." | `GET /finance/categories` 200: 15 defaults + Design, Hosting, Salaries | ✅ |
| C13 | Delete (confirm names the row and says cash/runway change) | Row gone, count 18, tiles back to the C1 values | row deleted; `cash_on_hand` 211950000 again | ✅ |
| C14 | Imported/invoice/expense rows | Show the category chip and "From an invoice. Mark it unpaid to change." / "From an expense. Edit it there." with a link, no Edit/Delete | `source: invoice` / `expense` | ✅ |
| C15 | Ask Finance Advisor | AI drawer opens and sends "My runway is 2.2 months and my monthly burn is ₦958,833. What levers should I look at?" | the figure is computed client-side; the reply stayed on "Thinking…" for 10+ s in this stack (AI chat is worker-bound) | ✅ ⚠ see ask A5 |
| C16 | Legacy zero row "Walk test: zero" | Shows "-₦0" with an "Add category" select | row `amount_minor` 0 (legacy, created before the zero-amount rule) | ⚠ N3 |

## 2. Founder (F), 1440: Runway `/finance/runway`

| # | Control | Result | API evidence | |
|---|---|---|---|---|
| R1 | Page load, Base case | 1.9 months, cash out Nov 2026; avg net burn ₦555,113; cash now ₦2,123,500 (drifted from C1 only because of the C10 row alive at that moment) | `GET /finance/runway` 200: `scenarios.base.runway_months` 1.9, `cash_out_date` 2026-11, `avg_net_burn_minor` 55511332 | ✅ 🔁 |
| R2 | Best case chip | "12+ months", "Cash stays above zero for the whole 12 month projection", burn ₦0 | `best.runway_months: null`, `avg_net_burn_minor` 0 | ✅ |
| R3 | Worst case chip | 1.3 months, cash out Nov 2026, burn ₦1,533,233 | `worst.runway_months` 1.3, `avg_net_burn_minor` 153323333 | ✅ |
| R4 | Base case chip again | back to 1.9 months, ₦555,113 | equal | ✅ |
| R5 | Assumptions form shows naira | growth 5, hiring 200000, one-off 100000 | `hiring_spend_minor` 20000000, `one_off_costs_minor` 10000000 | ✅ |
| R6 | Save with growth 250 | Toast "Assumptions saved. Scenarios updated."; Base/Best/Worst all "12+ months" | PUT 200, `mom_growth_percent` 250 (allowed range is 0..1000, guide) | ✅ |
| R7 | Growth 1500 | Browser blocks it: "Value must be less than or equal to 1000." No request | API says 422 `Input should be less than or equal to 1000` (checked with 5000) | ✅ |
| R8 | Restore growth 5, save | form shows `5,200000,100000` | `GET` equal | ✅ |
| R9 | "Month by month (Base case)" disclosure | 12 rows; Nov 2026 net −₦1,081,975, cash ₦941,525 | `by_month[0]` net −108197500, `cash_balance` 94152500 | ✅ ⚠ N5 |
| R10 | Cash balance chart and scenario table | 3 rows: 1.9 / 12+ / 1.3 months, cash-out dates | equal to R1..R3 | ✅ |
| R11 | Footnote | "Money in counts every inflow, including funding rounds, so a recent raise makes revenue look higher than it is." | this is exactly D1 | ✅ 🔁 (footnote reworded in FE #160, re-checked 2026-10-24 slice (e): now says funding adds to cash but is not revenue) |

## 3. Founder (F), 1440: Budgets `/finance/budgets`

| # | Control | Result | API evidence | |
|---|---|---|---|---|
| B1 | Table | Design ₦15,000 / ₦0 "Left ₦15,000 −100%" UNDER; Hosting ₦40,000 / ₦200,000 "Over by ₦160,000 +400%" OVER, 500% used; Equipment ₦4,500,000, Payroll ₦900,000, Software ₦33,000, Uncategorized ₦0 all "NO BUDGET SET" | `GET /finance/budgets?month=2026-10` 200 row for row (`spent_minor` 450000000 / 90000000 / 3300000 / 0) | ✅ |
| B2 | "Set budget" on Software: submit empty | Dialog stays (required field) | no request | ✅ |
| B3 | Set budget Software ₦30,000 + note | Row "Over by ₦3,000 +10%", 110% used, note shown | `limit_minor` 3000000, `status: over`, `notes: rewalk note` | ✅ |
| B4 | Edit (prefilled 30000 / note), change to 45000.50 | "Left ₦12,000.5 −26.7%" UNDER | `limit_minor` 4500050, `percent_used` 73.3 | ✅ ❌ see D4 |
| B5 | Delete: Cancel, then Delete | Cancel keeps it; Delete removes it, row back to "No budget set" | budget gone from API | ✅ |
| B6 | New budget with a category that already has one (Design) | Under the category select: "A budget for this category and month already exists." | `POST` 422 `field_errors[category]` same text | ✅ |
| B7 | New budget dialog category list | 19 categories + "Add category..." | same as `/finance/categories` | ✅ |
| B8 | "Draft missing from actuals" | Toast "Added 1 budget from last month's spending." Salaries ₦900,000 appears | Sep spend in Salaries 90000000 → Oct budget `limit_minor` 90000000; Design and Hosting skipped (already budgeted) | ✅ |
| B9 | "Copy last month's budgets" in Oct | Toast "Nothing to add. Last month had no budgets, or every category already has one." | Sep has none | ✅ |
| B10 | Month selector Sep 2026 | Salaries ₦900,000, Hosting ₦40,000, Design ₦15,000, all NO BUDGET SET | `?month=2026-09` equal | ✅ |
| B11 | Month selector Jan 2025 | "No budget set for Jan 2025 / A budget is a plan for your money. Start with last month's actuals." + Draft, Copy last month, Add one budget | empty list | ✅ |
| B12 | Empty-state "Draft budget from actuals" and "Copy last month" | Toasts "Nothing to add. Last month had no spending..." / "...no budgets..." | no rows created | ✅ |
| B13 | Month selector Nov 2026 + "Copy last month's budgets" | Toast "Copied 3 budgets from last month." Design ₦15,000, Hosting ₦40,000, Salaries ₦900,000 | `?month=2026-11`: 3 rows with limits 1500000 / 4000000 / 90000000 | ✅ |
| B14 | Spent is "all outflows" (D-FIN-3) | Equipment ₦4,500,000 counts manual rows | manual rows with `category: Equipment` | ✅ |
| B15 | Cleanup | The Nov rows and Oct Salaries row were deleted through the API (`DELETE` 200 x4) | | ✅ |

## 4. Founder (F), 1440: Invoices `/finance/invoices`

| # | Control | Result | API evidence | |
|---|---|---|---|---|
| I1 | List | INV-2026-002 (sent, ₦107,500, due 8 Nov), INV-2026-001 (paid), client names and emails | `GET /finance/invoices?limit=50` 200: 2 rows equal | ✅ |
| I2 | Chips Draft / Sent / Paid / Overdue | Draft "No invoices with this status."; Sent → 002; Paid → 001; Overdue → "No invoices with this status." | `?status=` equal | ✅ |
| I3 | Auto-remind checkbox on 002 | Unticking saves | `auto_remind` false; ticking again → true | ✅ |
| I4 | View (sent) | Items "Walk consulting (x2) ₦100,000", subtotal ₦100,000, tax 7.5% ₦7,500, total ₦107,500; Pay link "No pay link yet. Connect Paystack or Flutterwave..."; Create pay link; Go to Integrations; Reminders text; Download PDF | invoice GET equal | ✅ |
| I5 | Create invoice: empty save | "Add the client's name." | no request | ✅ |
| I6 | Create invoice: bad email, no line | "Each line needs a description, a whole quantity of 1 or more, and a price like 1500 or 1500.50." | no request | ✅ |
| I7 | Create invoice: name, sink email, line "Rewalk consulting" × 3 at 25000.50, tax 7.5, Net 15, Save draft | Row INV-2026-003, DRAFT, "Set when sent", ₦80,626.61 | draft: quantity 3, `unit_price_minor` 2500050, `subtotal` 7500150, `tax_minor` 562511, `total_minor` 8062661, `due_on: null` (qty field starts as `1`, my first attempt typed `13` and the preview/total followed it correctly: 34938199) | ✅ |
| I8 | Live preview in the builder | Totals update as typed; "PREVIEW. THE SERVER CONFIRMS THE TOTALS WHEN YOU SAVE." | preview = server totals for both attempts | ✅ |
| I9 | Edit draft | Prefilled with every field; save keeps number INV-2026-003 | `GET` equal | ✅ |
| I10 | Send (confirm names the recipient and says it cannot be recalled) | SENT, due 8 Nov (Net 15) | `status: sent`, `issued_on` 2026-10-24, `due_on` 2026-11-08; email in the worker log (console provider) | ✅ |
| I11 | Create pay link with nothing connected | Rejected | `POST .../pay-link` 422 `NO_PAYMENT_CONNECTION` "Connect Paystack or Flutterwave before creating a pay link." | ✅ |
| I12 | Mark paid (confirm "adds ₦80,626.61 to your cash on hand today and updates your runway") | PAID | `status: paid`, `transaction_id` set; ledger row "Invoice INV-2026-003: Rewalk Client Ltd" Revenue 8062661; `cash_on_hand` 220412661 | ✅ |
| I13 | Mark unpaid (confirm "removes the ₦80,626.61 payment from your books") | SENT again | `paid_at` null, `transaction_id` null; cash back to 212350000 | ✅ |
| I14 | PDF (row) | Request `GET /invoices/{id}/pdf` 200 | `application/pdf`, `content-disposition: attachment; filename="invoice-INV-2026-003.pdf"`, 1692 B, starts `%PDF-1.4` | ✅ |
| I15 | Delete a draft (INV-2026-004, created through the API): confirm "will be removed. This cannot be undone." | Row gone | `GET` 404 | ✅ |
| I16 | Remind on a sent, not-overdue invoice | n/a in the UI (button hidden) | API: 422 "Only a sent invoice that is past due can be reminded." | ✅ |
| I17 | Overdue: I backdated my own test invoice 003 (`due_on` 2026-10-10, local DB update, restored afterwards) | OVERDUE badge; row offers Send reminder; Overdue chip would list it | `status: overdue` | ✅ |
| I18 | Send a reminder (confirm: "A reminder with the invoice attached will be emailed to delivered+rewalk@resend.dev. You can send another after 24 hours.") | Sent | `reminder_count` 1, `last_reminded_at` set; worker log shows the reminder body | ✅ |
| I19 | Second reminder inside 24 h | Rejected | `POST .../remind` 422 "A reminder was already sent in the last 24 hours." | ✅ |
| I20 | "Print or save as PDF" in the builder | not clicked: opens `window.open` print window, not scriptable in the pane | n/a | ⏳ |
| I21 | Copy pay link; "Paid via Paystack/Flutterwave" tag | Pay link and Copy pay link verified with a real Paystack test key (N14, N15). The "Paid via" tag needs a paid Paystack transaction, which the test account does not have | ⏳ (tag only) |

## 5. Founder (F), 1440: Expenses `/finance/expenses`

| # | Control | Result | API evidence | |
|---|---|---|---|---|
| E1 | Donut, legend and total (Oct 2026) | ₦83,000; Hosting ₦50,000 60.2%; Software ₦33,000 39.8% | `GET /finance/expenses/summary` 200 equal | ✅ |
| E2 | Table | 4 rows with category, recurring tick, receipt state, amount | `GET /finance/expenses?limit=50` equal | ✅ |
| E3 | Month selector Sep 2026 | ₦55,000; Hosting 72.7%, Design 27.3%; 2 rows | `?month=2026-09` equal | ✅ |
| E4 | Recurring checkbox on "Walk test: AWS" | ticks; ticking again unticks | `recurring: true`, then `false` | ✅ |
| E5 | Add expense: Rewalk Vendor, Software, 1234.56, recurring | Appears first; total ₦84,234.56 | `amount_minor` 123456, `recurring: true`; ledger row "Expense: Rewalk Vendor" 123456 | ✅ |
| E6 | Edit (prefilled), amount 2000, save | ₦2,000 | expense and linked ledger row both 200000 | ✅ |
| E7 | Delete (confirm says receipt deleted and amount added back to cash) | Row gone | `GET` 404; cash back | ✅ |
| E8 | View receipt, receipt uploaded by the API today | New tab titled "download (8×8)": the image | `GET /expenses/{id}/receipt` 200 then `GET /finance/receipts/download?token=…` 200 | ✅ |
| E9 | View receipt, legacy expense `cbee3c6d` | New tab with raw JSON | download link 404 `NOT_FOUND` "Not found." (file gone, `has_receipt` still true) | ❌ see D2 → ✅ slice (e) re-check E9b |
| E10 | Remove receipt (confirm "The expense stays.") | Row says "Attach" again | `has_receipt: false`, `receipt_url: null` | ✅ |
| E11 | Attach / Replace (file chooser) | ⏳ the pane cannot open a file chooser. The API side was exercised with `curl -F file=@receipt.png;type=image/png` → 200, `has_receipt: true` | | ⏳ |

## 6. Founder (F), 1440: Financial model `/finance/model`

| # | Control | Result | API evidence | |
|---|---|---|---|---|
| M1 | Load | 36 months, "Projection generated 21 Oct 2026, recalculated 24 Oct 2026", disclaimer; P&L Nov 2026 revenue 1,597,267, COGS 559,043, net income −959,404 | `GET /finance/model` 200: `status: complete`, `horizon_months` 36, revenue `values[0]` 159726666, `balance_check.balanced: true` | ✅ |
| M2 | Tabs P&L / Cash Flow / Balance Sheet | Cash flow Nov: opening 2,119,500, collections 1,535,833, payments 2,496,000, closing 1,159,333. Balance sheet: total assets 2,756,600 = liabilities + equity 2,756,600, "Balance check 0", note "assets equal liabilities plus equity in every period." | `cash_flow` / `balance_sheet` rows equal | ✅ |
| M3 | Monthly / Yearly | Yearly Year 1..3: cash −9,147,383 / −18,444,612 / −22,243,552, balance check 0 0 0 | `yearly.balance_sheet` cash −914738253 etc. | ✅ |
| M4 | Paid-in capital note | "Paid-in capital is the money you recorded under the category Funding. A raise recorded under another category shows up in retained earnings instead." Paid-in capital 0 (the 5M seed row is uncategorised) | | ✅ 🔁 |
| M5 | Edit Revenue growth 6, Save edits | Banner "Edited, not yet recalculated. The tables and chart below do not include your latest edits."; field note "Edited. AI suggested 4. Use AI value" | `stale: true`, `overrides {monthly_revenue_growth_pct: 6.0}`; revenue still 159726666 | ✅ |
| M6 | Banner Recalculate | Banner clears; Nov revenue 1,627,983 | `stale: false`, revenue `values[0]` 162798333, balanced | ✅ |
| M7 | Add hire (Rewalk engineer, ₦250,000 from 2026-11), editor Recalculate (saves first) | Statements update | `hiring_plan [{role, start_month 2026-11, monthly_cost_minor 25000000}]`, `stale: false`, balanced | ✅ |
| M8 | Use AI value on growth | field back to 4, banner "Edited, not yet recalculated" | `overrides` updated, `stale: true` | ✅ |
| M9 | Clear edits (hiring) | hiring rows removed | `overrides: null`, `hiring_plan: null`, `stale: true` | ✅ |
| M10 | Banner Recalculate again | back to the AI numbers (Nov revenue 1,597,267) | `stale: false` | ✅ |
| M11 | Export CSV | Blob `text/csv;charset=utf-8`, 9226 B, header `Statement,Line,2026-11,…`, `P&L,Revenue,1597266.66,…` | equals `values[0]` 159726666 ÷ 100 | ✅ |
| M12 | Add one-off (Legal fees ₦50,000, 2026-11) and capex (Laptops ₦360,000, 2026-11), Recalculate | Statements move | `one_offs`, `capex` saved; Nov opex 204,762,750 vs 199,762,750 before (+₦50,000); fixed assets 36000000 → 35000000 → 34000000 (₦10,000 a month over 36 months); balanced | ✅ |
| M13 | Clear edits for one-off and capex | rows removed | `overrides: null` | ✅ |
| M14 | Refresh from my latest numbers (confirm "...Your saved edits are kept, but any edit dated outside the new window is left out and listed as a warning.") | Recalculated from the ledger | `revenue_0_minor` moved 153583333 → 153716667 while the ₦4,000 Funding row existed (D1 again), back to 153583333 after the row was deleted; `warnings: []`; opening cash = live cash on hand | ✅ 🔁 |
| M15 | Regenerate: dialog "uses your workspace's AI budget... Recalculate instead, which is instant and free", Cancel | Nothing generated | none | ✅ |
| M16 | Regenerate for real (side effect of TM check, see T9) | `POST /finance/model/generate` as TM → 202; about 20 s later a **new model** (`3661ef86…`, growth 5.0, balanced) replaced the old one | | ✅ |

## 7. Founder (F), 1440: Integrations `/finance/integrations` (no real key)

| # | Control | Result | API evidence | |
|---|---|---|---|---|
| N1 | Page | Paystack, Flutterwave, Bank (Mono), all "Not connected"; "Sandbox only: you can link test banks."; "QuickBooks and Xero are not planned yet." | `GET /finance/integrations` 200: `encryption_configured: true`, 3 providers, `connection: null`, key hints, Mono `connect_config {configured, public_key: test_pk_…, sandbox: true}` (a public key; no secret anywhere in the response) | ✅ |
| N2 | Connect Paystack opens | Text "For your security we never show your key again. It is stored encrypted..."; the key box is `type=password` | | ✅ |
| N3 | Connect with an empty key | Dialog stays (required) | no request | ✅ |
| N4 | Connect with `pk_test_PLACEHOLDER_NOT_A_KEY` | "Use your Paystack secret key (starts with sk_test_ or sk_live_). Your key was not saved. Paste it again to retry." Box emptied | 422 field error | ✅ |
| N5 | Connect Flutterwave opens | Two password fields: Secret key (FLWSECK_TEST- / FLWSECK-) and Secret hash | | ✅ |
| N6 | Connect bank (Mono) | After about 10 s the Mono widget opens in-page ("Sandbox uses Mono to link your account") | `connect_config` as N1 | ✅ |
| N7 | Mono, with Adebayo's OK for the sandbox consent: Link account → consent tick → Continue → GTBank → Success → data status Available → NGN savings account → Continue | "Your account has been linked successfully!" then the card reads "Connected as GTBank · Samuel Olamide · SANDBOX · Account ending e694" | `POST /finance/integrations/mono/connect` 200: connection `status: active`, `mode: test`, `key_last4: e694`, `account_name: GTBank · Samuel Olamide`; no code or token in any response | ✅ |
| N8 | Mono: Sync now (and the auto-sync after linking) | Card shows "We could not reach Mono. We will retry automatically." and "Last synced: Never" | `POST .../mono/sync` 200 with `summary: {}`, `last_error: "We could not reach Mono. We will retry automatically."`, `last_sync_at: null` (twice); 0 bank rows in the ledger | ❌ see D7 → ✅ slice (e) re-check N8b |
| N9 | Mono widget after success | Pressing Continue on the widget's success screen returns it to its welcome screen; it closes only with its X (the first X taps in the pane did nothing because the success screen sits on top) | | ✅ ⚠ N6 |
| N10 | Mono: Disconnect (confirm "Historical data stays; new data stops syncing.") | Toast "Bank (Mono) disconnected. Imported history stays." | `connection: null` | ✅ |
| N11 | Paystack: Connect with Adebayo's `sk_test_…` key | Dialog closes, toast "Connected to Paystack in test mode. Use Sync now to import your payments." Card: Connected · TEST MODE · "Key ••••90e0", Last synced Never, webhook URL with Copy and the dashboard instructions | `POST .../paystack/connect` 200: `status: active`, `mode: test`, `key_last4: 90e0`, `webhook_url`; **the key is not in the API response** (grep of the full `GET /finance/integrations` body: 0 hits), **not in the page DOM after saving** (0 hits), and not in the database in plaintext (`finance_connections`, 3 rows, 0 hits for the key or the Flutterwave key/hash) | ✅ |
| N12 | Paystack: Sync now | Toast "Synced. Nothing new to import."; "Last synced: 24 Oct 2026, 18:34 · Last sync: Nothing new to import." Ledger count stays 18 | `last_sync_at` set, `last_sync_summary` all zeros (`fetched: 0`) because the test account has no transactions | ✅ ⚠ N9 |
| N13 | Paystack: Replace key (same key) | Dialog "Replace key"; toast "Connected to Paystack in test mode..."; still "Key ••••90e0" | 200 | ✅ |
| N14 | Paystack: Create pay link on invoice 002 (View → Create pay link) | Pay link `https://checkout.paystack.com/s04zrsqkprky9ze` appears, toast "Pay link created.", Copy pay link | `pay_url` the same, `pay_provider: paystack` (a real Paystack test checkout was created) | ✅ |
| N15 | Copy pay link | Clipboard `writeText` (spied) = the checkout URL | equals `pay_url` | ✅ |
| N16 | Paystack: Disconnect (confirm) | Toast "Paystack disconnected. Imported history stays."; the invoice keeps its pay link | `connection: null`; invoice `pay_url` unchanged | ✅ |
| N17 | While Paystack is connected, Connect Flutterwave | Button disabled, text "Disconnect Paystack first. One payment account can be connected at a time." | rule in `page.tsx` (`otherPaymentConnected`) | ✅ |
| N18 | Flutterwave: Connect with Adebayo's `FLWSECK_TEST-…-X` key plus the value he gave as the secret hash (`FLWSECK_TEST…`, which Flutterwave lets you choose, so I cannot verify it is the one set in the dashboard) | Dialog closes; card Connected · TEST MODE · "Key ••••f2-X", webhook URL | `status: active`, `mode: test`, `key_last4: f2-X`; neither value in the response or the DOM | ✅ ⚠ hash unverified |
| N19 | Flutterwave: Sync now | The first tap answered 429 `SYNC_TOO_SOON` "Synced a moment ago. Try again shortly." (connect had just synced); a direct call later succeeded | `POST .../flutterwave/sync` 200, `last_sync_at` set, summary all zeros | ✅ ⚠ N9 |
| N20 | Flutterwave: Disconnect (confirm) | Card Not connected | `connection: null` | ✅ |
| N21 | Paystack payouts out of revenue (D-FIN-1..10), needs-attention banner, skipped non-NGN counts, imported rows' category-only edit | ⏳ the test accounts have no transactions and no way to make one from here | summaries all zero | ⏳ |

## 8. Founder (F), 375

| # | Control | Result | API evidence | |
|---|---|---|---|---|
| P1 | No horizontal scroll, all 7 pages | `scrollWidth` 375 on cash flow, runway, budgets, invoices, expenses, model, integrations | n/a | ✅ |
| P2 | Cash flow: tiles stack; Runway banner + "Ask Finance Advisor"; sub-nav strip scrolls inside itself | same values as 1440 | `cash_on_hand` 211950000 | ✅ |
| P3 | Cash flow: ledger renders as cards (one visible table → 22 cards) with Edit / Delete links | | | ✅ |
| P4 | Add transaction dialog | 16 px gutters (left 16, right 359), no overflow; new category "  rw   cat  " | row saved; category `rw cat` (trimmed, spaces collapsed); appears in `/finance/categories` | ✅ ❌ see D5 |
| P5 | Delete the card (confirm) | Row gone | count 19 → 18 | ✅ |
| P6 | Bell panel at 375 | Fits (left 16), all rows readable | | ✅ ⚠ the Academy re-walk D1 does not reproduce here |
| P7 | Budgets: cards "Spent ₦200,000 of ₦40,000 · 500% used" with Edit / Delete, "Set budget" | equal to 1440 | | ✅ |
| P8 | Invoices: cards with number, client, "Due 8 Nov 2026", amount, status, View / Mark paid / PDF | equal | | ✅ ❌ see D3 → ✅ slice (e) re-check |
| P9 | Invoice builder at 375 | Fields at 16 px gutters, terms select and tax side by side, `scrollWidth` 375 | | ✅ |
| P10 | Expenses: cards with "Recurring", Attach / View / Replace / Remove, Edit / Delete | equal | | ✅ |
| P11 | Model: statements scroll inside their card | `scrollWidth` 375 | | ✅ |
| P12 | Integrations: three cards stack | `scrollWidth` 375 | | ✅ |
| P13 | Touch targets | Inputs in dialogs are 37 to 38 px tall; runway chip buttons measure 26 px | | ⚠ D6 |

## 9. Team member (TM)

| # | Control | Result | API evidence | |
|---|---|---|---|---|
| T1 | `/finance` 1440 | Same numbers as the founder (₦2,119,500 / ₦960,167 / ₦1,535,833 / 2.2 months); Add transaction present | `GET /finance/cash-flow` as TM 200, identical body | ✅ |
| T2 | Runway | Same chips and Save assumptions button | TM `PUT /finance/runway/assumptions` 200 | ✅ |
| T3 | Budgets | New budget, Draft, Copy, Edit, Delete, Set budget all present | TM `POST /finance/budgets` 200 (I created and deleted one: `DELETE` 200) | ✅ |
| T4 | Invoices | Create invoice, chips, View, Mark paid / unpaid, PDF present | `GET /finance/invoices` 200 | ✅ |
| T5 | Expenses | Add expense, Attach / View / Replace / Remove, Edit, Delete present | `GET /finance/expenses` 200 | ✅ |
| T6 | Model | Tabs, Regenerate, Export CSV, editor with Save edits / Recalculate / Refresh present | `GET /finance/model` 200, same body | ✅ |
| T7 | Integrations | "Only a founder can connect Paystack/Flutterwave/Bank (Mono)." under each card; no Connect, Replace or Disconnect | TM connect → 403 `FORBIDDEN`; disconnect 403; mono/connect 403 (`roles_matrix.txt`) | ✅ |
| T8 | TM `POST /finance/integrations/paystack/sync` | n/a in the UI | 404 `NOT_FOUND` (no connection to sync) | ✅ |
| T9 | TM `POST /finance/model/generate` | n/a in the UI (Regenerate button is shown to TM) | 202: allowed by the guide ("founder, team_member or accountant") but it spends the workspace AI budget | ✅ ⚠ N2 |
| T10 | 375: all 7 pages | `scrollWidth` 375 on each | | ✅ |

## 10. Mentor (M) and business consultant (BC)

| # | Control | Result | API evidence | |
|---|---|---|---|---|
| X1 | M: Finance in the sidebar | absent (0 `/finance` links) | | ✅ |
| X2 | M: `/finance`, `/runway`, `/budgets`, `/invoices`, `/expenses`, `/model`, `/integrations` | each: "You don't have access to this page. Your role in this workspace doesn't include this section. Back to dashboard" | all 11 GETs + 5 writes → 403 `FORBIDDEN` "You don't have permission to do that." (`finance-rewalk-evidence/roles_matrix.txt`) | ✅ |
| X3 | M: Back to dashboard | link `/dashboard` | | ✅ |
| X4 | BC: Finance in the sidebar | absent | | ✅ |
| X5 | BC: the same 7 routes | same denial | same 403 matrix | ✅ |
| X6 | M and BC at 375 | denial fits (`scrollWidth` 375) | | ✅ |
| X7 | M, BC: `GET /finance/receipts/download?token=x` | n/a | 404 `NOT_FOUND` (token route needs no role, guarded by the signed token) | ✅ |

## Funding fix re-check (after API #182, develop `06b47c5b`)

Same steps as before, on the same founder account. The founder added a Money-in ₦3,000.50 transaction in category Funding by hand, and everything was read back from the raw API.

| Row | Before the fix | After the fix | Verdict |
|---|---|---|---|
| C1 tiles (no Funding row) | cash 211950000, burn 96016667, revenue 153583333 | identical | ✅ |
| C10 add Funding ₦3,000.50 | `monthly_revenue` 153683350, `monthly_burn` 95916650 (the tiles moved) | `cash_on_hand` 211950000 → **212250050** (+300050); `monthly_burn` 96016667 and `monthly_revenue` 153583333 **unchanged**; the Oct bar in `by_month` still shows the inflow (inflow 191050050) | ✅ |
| R1 runway with the row | avg net burn ₦555,113 and cash now moved with it | avg net burn 55697032 (₦556,970, the same as without the row); `baseline.cash_on_hand` 212250050; base 1.9 months | ✅ |
| R11 runway footnote | "Money in counts every inflow, including funding rounds..." | text unchanged | ❌ D8 |
| M4 paid-in capital | 0 (no categorised Funding row) | after Refresh: Paid-in capital 300050 in every month; balance check balanced, max difference 0 | ✅ |
| M14 Refresh from my latest numbers | `revenue_0_minor` 153583333 → 153716667 | stays **153583333**; opening cash 212250050 (it includes the Funding cash) | ✅ |

Cleanup: the row was deleted, cash is back to 211950000, and the model was refreshed again.

## Failures

### D1. API: a Funding inflow counted as revenue and offset burn (FIXED by API #182, re-verified)
- **Steps:** founder, `/finance`, Add transaction, Money in, ₦3,000.50, category Funding.
- **Response:** `GET /finance/cash-flow` before: `monthly_revenue` 153583333, `monthly_burn` 96016667; after: 153683350 and 95916650 (+1000.17 and −1000.17 naira, one third of ₦3,000.50, the trailing-3-month average). The model sees it too: `revenue_0_minor` 153583333 → 153716667 after Refresh (M14). The runway page footnote even says so.
- **Expected after the lead's fix:** Funding stays in cash on hand and paid-in capital only. Every row marked 🔁 must be re-walked after that merge (C1, C10, R1, R11, M4, M14).
- **Layer: API.** Severity: Medium. Already known; this walk captured live proof. The row was deleted afterwards.

### D2. API + FE: legacy receipt opens a blank tab with raw JSON
- **Steps:** founder, `/finance/expenses`, "View receipt" on "Walk test: Notion" (`cbee3c6d-f462-4b03-bd57-1c0a8c180e7f`).
- **Response:** `GET /finance/expenses/cbee3c6d…/receipt` 200 (a signed link), then `GET /finance/receipts/download?token=…` 404 `{"error":{"code":"NOT_FOUND","message":"Not found.","field_errors":[]}}`. The expense still says `has_receipt: true`.
- **Expected:** API: either keep the file or clear `has_receipt` when the file is gone, or answer the link request with a clear error. FE: show a message instead of a tab of JSON (`ReceiptButton.tsx` opens a blank tab first, then navigates it).
- **Layer: API (data) and FE (handling).** Severity: Low (one legacy row; a receipt uploaded today works, E8).

### D3. FE: invoice cards at 375 have no Auto-remind control
- **Steps:** founder at 375, `/finance/invoices`.
- **Actual:** the card shows number, client, due, amount, status, View / Mark paid / PDF. The Auto-remind checkbox exists only in the desktop table (I3). A phone user cannot turn it on or off after saving.
- **Expected:** the same toggle on the card (or in View).
- **Layer: FE.** Severity: Medium (a feature missing on phones, not a crash).

### D4. FE: money amounts drop the trailing zero
- **Steps:** budgets: limit 45000.50 shows "₦45,000.5" and "Left ₦12,000.5"; invoice builder preview "₦325,006.5"; runway month table "₦1,001,273.75" while the tiles on the same page are whole naira.
- **Expected:** two decimals whenever there are decimals ("₦45,000.50"), one rule across pages.
- **Layer: FE.** Severity: Low.

### D5. FE (low): category names are trimmed, but the stray category stays after the transaction is deleted
- **Steps:** 375, add a transaction with a new category, delete the transaction.
- **Actual:** `rw cat` stays in `/finance/categories` (`in_use` false). This is how the API models custom categories (the 1440 old walk saw the same), so it is a note rather than a defect. Listed here only so it is not mistaken for a leak.
- **Layer:** none. Severity: none (see N4).

### D6. FE (low): touch targets under 44 px at 375
- Dialog inputs are 37 to 38 px tall; the runway scenario chips measure 26 px. (The Academy hub tabs were 44 px.)
- **Layer: FE.** Severity: Low.

### D7. API: Mono sandbox sync fails after a successful link
- **Steps:** founder, Integrations, Connect bank, finish the sandbox flow (GTBank, Success, Available, NGN account), then Sync now (and the auto-sync that runs right after linking).
- **Response:** `connect` 200 (account `GTBank · Samuel Olamide`, `e694`), then `POST /finance/integrations/mono/sync` 200 with `summary: {}`, `last_error: "We could not reach Mono. We will retry automatically."`, `last_sync_at: null`. The API log shows only the INFO lines (no cause). The guide says a Mono 401 on sync means "Mono refused our platform key" and is shown with this same message, and that the real Mono sandbox was never verified against the API.
- **Expected:** transactions of the sandbox account in the ledger (or a message that says why not).
- **Layer: API** (platform key, request shape or Mono data status). Severity: Medium for the Mono feature; the bank link, status and disconnect work.

### D8. FE: the runway footnote still says funding counts as revenue
- After API #182 the numbers ignore Funding, but `/finance/runway` still prints "Money in counts every inflow, including funding rounds, so a recent raise makes revenue look higher than it is."
- **Expected:** drop or reword the sentence (Funding now stays in cash and paid-in capital only).
- **Layer: FE.** Severity: Low.

## Asks from FE #153, confirmed or rejected live

| Ask | Verdict | Evidence |
|---|---|---|
| Runway hiring rows and one-off rows (gap 21) | **Rejected, still open (API).** The runway API has three scalar fields only. `PUT` with `hiring_plan` and `one_offs` returns **200 and silently drops them** (`GET` shows only `mom_growth_percent`, `hiring_spend_minor`, `one_off_costs_minor`). The financial model already has real hiring, one-off and capex rows (M7, M12). | `finance-rewalk-evidence/runway_ask_hiring_oneoff_rows.txt` |
| Invoice client picker, notes, payment details (gaps 23, 25) | **Rejected, still open (API).** Invoice bodies have `client_name`, `client_email`, `line_items`, `tax_percent`, `terms`, `auto_remind` only; no `account_id`, `notes`, `payment_details`; no resend route (OpenAPI lists none). | `GET /api/v1/openapi.json` finance paths (34), invoice body in I1 |
| Advisor finance context (gap 33, BE half) | **Rejected, still open (API).** `grep -ri "finance\|runway" app/services/ai_cofounder` finds nothing; the FE only seeds the first message (C15). | |
| XLSX export (gap 14) | **Rejected, still open (API).** No export route in OpenAPI; CSV works (M11). | |
| Legacy receipt `cbee3c6d` missing file | **Confirmed**: D2. | E9 |

## Notes (not failures)

| # | Note |
|---|---|
| N1 | The `localhost:3000` dev server went down once mid-walk (a restart by another session) and the browser session was lost; I logged in again. No data was affected. |
| N2 | TM (and the accountant role) can regenerate the model, which spends the workspace AI budget (T9, M16). It follows the guide; flagging it as a product choice. The new model replaced the old one (new id), so the earlier model edits are gone. |
| N3 | Legacy rows: a zero-amount manual transaction "Walk test: zero" (C16) and the "Uncategorized ₦0" budget row it creates (B1). |
| N4 | Custom categories are kept for the workspace even when unused (D5). |
| N5 | Runway "Month by month" shows kobo decimals (D4). |
| N6 | The Mono widget takes about 10 s to appear (button says "Linking" meanwhile). The success screen's Continue sends the widget back to its welcome screen, and a tap on its X also reached the page below (it opened the Invite dialog, which I cancelled). Mono's own widget behaviour, not logged as a defect. |
| N7 | Dev environment: the API's email provider is `console`; the sink addresses never got real mail. `verify`/pay URLs use `localhost:3000` (API config). |
| N8 | The accountant role has no account here and was not walked. |
| N9 | Right after connecting, the Paystack "Sync now" result did not show until a reload on the first try; the second try updated at once. The same click can also hit `SYNC_TOO_SOON`. Not reproduced reliably, so only a note. |
| N10 | The Adebayo-supplied test keys were typed into masked fields on `fin.localhost:3000` only, never written to a file, log or this doc, and all three connections were disconnected at the end of the walk. |

## State this walk left behind (local database)
Founder / NovaPay: invoice INV-2026-003 "Rewalk Client Ltd" (sent, ₦80,626.61, 1 reminder, cannot be deleted through the API); transaction categories now include `rw cat`; a new financial model (id `3661ef86…`, AI generated by the TM check). Deleted again: the Funding row, expense "Rewalk Vendor", budgets I created, draft INV-2026-004, the 375 transaction. Runway assumptions are growth 5 / ₦200,000 / ₦100,000 as before. Invoice 002 auto-remind is back on.

## Counts
Rows are counted from the tables above (a row with ✅ and a ⚠, 🔁 or ❌ marker next to it is counted under its main mark; ⏳ rows are not passes).

| Section | Rows | ✅ | ⏳ | note |
|---|---|---|---|---|
| 1 Cash flow | 16 | 16 | 0 | C16 is ⚠ N3 |
| 2 Runway | 11 | 10 | 0 | R11 ❌ (D8) |
| 3 Budgets | 15 | 15 | 0 | |
| 4 Invoices | 21 | 18 | 3 | I20, I21 ⏳ (plus I21's pay-link tag) |
| 5 Expenses | 11 | 9 | 1 | E9 ❌ (D2), E11 ⏳ |
| 6 Model | 16 | 16 | 0 | |
| 7 Integrations | 21 | 19 | 1 | N8 ❌ (D7), N21 ⏳ |
| 8 Founder 375 | 13 | 13 | 0 | P8 ❌ D3, P13 ⚠ |
| 9 Team member | 10 | 10 | 0 | |
| 10 Mentor + consultant | 7 | 7 | 0 | |
| **Total** | **141** | **133** | **5** | **4 ❌ rows (E9, P8, N8, R11)**, 1 ⚠ |

Defects: **D1 API Medium (known, 🔁), D2 API+FE Low, D3 FE Medium, D4 FE Low, D6 FE Low, D7 API Medium** (D5 is a note). D1 is fixed. Open: 5 defects, 2 API-side (D2, D7), 5 FE-side (D2, D3, D4, D6, D8).


---

## Slice (e) re-check, 2026-10-24

**Branch** `feature/finance-slice-e-fe` (this PR) on my own `next dev -p 3950`, proxy to the shared API `:8000` (develop `4143bbc0`, migration 0071). FE base: develop `5088d83` (includes #160). **Accounts/hosts:** founder `localhost:3950`, team member `tm.localhost:3950`, mentor `m.localhost:3950`, consultant `bc.localhost:3950` (all four logged in through the real login form; throwaway local accounts, never committed). Widths 1440 (pane) and 375 (emulated). Clicks and typing were done in the Claude browser pane; the iframe and `getBoundingClientRect` scripts were used only to read results and to survey the role pages, and every outcome was checked against the raw API (same account's bearer token, same minute). Raw API facts below are quoted from the responses, with no tokens.

### Earlier defects, re-verified on merged develop (#160) plus this branch

| Row | Check | Result | Evidence |
|---|---|---|---|
| D2 / E9b | Receipt whose file is gone: created expense "Slice E Receipt Test", uploaded a 1x1 PNG, deleted the file in the API container's local storage, clicked View receipt | The tab closes, the row flips from "View receipt" to **Attach** (refetch), no JSON tab | `GET /finance/expenses/{id}/receipt` **410** (network log). The 410 body per guide: `RECEIPT_FILE_MISSING` "This receipt file is no longer available. Upload it again." (toast text itself not caught by my reader; asserted in `ReceiptButton.test.tsx`) ✅ |
| D3 / P8b | 375, invoice card INV-2026-004 | Card has **Auto-remind** (44 px), View, Resend, Mark paid, PDF, all 44 px | `getBoundingClientRect` heights 44 ✅ |
| D4 | Money with kobo | "₦25,000.50" (card, View), "₦556,970.32" (runway tile), "Tax (0%) ₦0" | page text ✅ |
| D6 | 375 audit of every Finance page plus the invoice builder: interactive elements under 44 px | Only the runway "Month by month" summary (20 px) was found, fixed here (`max-md:min-h-11`). Left alone, as in #160: the inline "expenses" link in the budgets note and the app shell header (search, bell, invite 30 to 36 px). No horizontal scroll (`scrollWidth` 375) on any page ✅ |
| D8 / R11 | Runway footnote | "Funding (a raise, investment or grant) adds to your cash on hand but is not counted as revenue and does not reduce burn." ✅ |
| D7 / N8b | Integrations, Connect bank, Mono sandbox (consent, GTBank, Success, Available, NGN savings account ending 3461, Continue) | "Your account has been linked successfully!". Card: "Connected as GTBank · Samuel Olamide · SANDBOX · Account ending 3461", "Last sync: 142 transactions imported." A second Sync now: "Last sync: Nothing new to import." A third inside the cooldown: **429** (API log). **D7 is fixed by API slice (e).** | `POST /finance/integrations/mono/connect` 200 (2.11 s) then `POST .../mono/sync` 200 (4.71 s) in the API log; `GET /finance/integrations` mono connection: `status: active`, `mode: test`, `last_error: null`, `last_sync_summary {fetched 142, credits 79, debits 63, imported 0, duplicates 0, skipped_currency 0}` (the bank adapter counts rows under credits/debits; the card text adds them). 142 `source: bank` rows in the ledger. No WARNING line was logged because nothing failed ✅ |

### The four asks and Advisor

| Ask | Check | Result | Evidence |
|---|---|---|---|
| Runway rows (D-FIN-12) | Added a hire ("Slice E engineer", ₦300,000 from 2026-11) and a one-off ("Slice E laptops", ₦50,000, 2026-12) through the model's own PATCH, reloaded Runway | New **From your financial model** card lists both, read only, with "Edit in the model" linking `/finance/model`. Base case moved **1.9 to 1.5 months**, avg net burn ₦556,970.32 to ₦861,136.99. With no rows the card reads "No hires in the model." / "No one-off costs in the model."; with no model it shows the empty message. FE sends only the three scalars (`PUT` body unchanged) | `GET /finance/runway` `data.model_rows {model_id, href: "/finance/model", hiring_plan[1], one_offs[1]}` ✅. Rows removed again afterwards (runway back to 1.9) |
| Invoice client picker, notes, payment details | Builder: picked "Kolo Riders Co-op" | Name and email prefilled ("funke@kolo.example", first contact with an email). Only a bank name typed: "Payment details need a bank name, an account name and an account number. Clear all four to leave them out." (no request). All fields filled, Save draft: `account_id`, `account_name`, `notes`, `payment_details` returned. Edit prefilled all of them; unlinking the client and clearing notes and all four bank fields sent explicit nulls and the API returned `account_id: null`, `notes: null`, `payment_details: null`. After send, View shows "Sales client", **Notes**, **Pay by bank transfer** (GTBank · NovaPay Ltd · 0123456789) | `POST/PATCH /finance/invoices` 200 each; email body in the worker log carries "Pay by bank transfer ... Bank: GTBank ... Account number: 0123456789" and the notes ✅ |
| Resend | Send INV-2026-004, then Resend (row, confirm dialog) | Inside 60 s: toast "This invoice was emailed a moment ago. Try again in 43 seconds." (and "...29 seconds." a minute later: the count is from the first send). After 60 s: toast "Sent to funke@kolo.example.", `last_sent_at` moved, View shows "Last emailed 24 Oct 2026." Button only on sent and overdue rows. Mentor and consultant `POST .../resend`: 403 | 429 `RESEND_TOO_SOON` shown as-is, 200 after ✅ |
| XLSX | Cash flow, chip **Money out**, Export Excel; Model, Export Excel | Toasts "Transactions exported to Excel." / "Model exported to Excel."; browser download via blob with the auth headers | Network: `GET /api/v1/finance/transactions/export.xlsx?direction=out` 200 and `GET /api/v1/finance/model/3661ef86.../export.xlsx` 200. Team member: both 200, `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`, body starts `PK`. Mentor and consultant: both **403 `FORBIDDEN`** ✅ ⚠ note: exporting while the model shows "Edited, not yet recalculated" exports the stored statements without the edits (it is the saved model); the page banner already says so |
| Receipt 410 | see D2 / E9b | ✅ | |
| Advisor finance context | Founder: **Ask Finance Advisor**; then API conversations with the live model | Real reply with the real ledger: "Your cash on hand is **NGN 2,118,000**, and your monthly burn is **NGN 960,667**. Your runway is approximately **2.2 months**." and "three ways to extend my runway" quotes ₦2.118m, ₦960,667, 2.2 months and NGN 1.536m monthly revenue. Team member (a Finance role) gets the same figures (NGN 2.118m, 960,667, 2.2 months). **Mentor and consultant: `GET/POST /ai/conversations` are 403 for them, so no figures reach them at all.** FE seed shortened to a figure-free question ("Give me three ways to extend my runway.") | worker log + `GET /ai/conversations/{id}` (`status: ready`) ✅ |

### New findings

| # | Layer | Severity | Finding |
|---|---|---|---|
| D9 | API (LLM) | Medium | The question wording "What levers should I look at first?" (also "...first to extend my runway?") makes the model return nothing: worker log `job ai.cofounder.reply failed: LLM API returned an empty completion.` on every retry; the assistant message stays `generating` and the drawer shows "Thinking..." with no end or error. Neighbouring wordings ("Give me three ways to extend my runway.", "What is my cash on hand...") answer fine. The old FE seed ended with exactly that phrase, which is the C15 symptom of the first walk. FE avoided the phrase, but the API should (a) end a message after its last retry as failed with a visible message and (b) not send a prompt that yields an empty completion. |
| D10 | API | Low to Medium | A `source: bank` ledger row accepts `PATCH {"amount_minor": 100}` with **200** (amount changed, direction too) and `DELETE` with 200, while the guide says category is the only edit allowed on an imported row. Expense rows (422 "This transaction is managed by an expense") and Paystack rows (422 "Imported transactions are read-only except the category.") are correctly refused, so Mono bank rows are the odd one out. The FE hides Edit/Delete on imported rows, so only API clients can do it. I used the delete to clean up my 142 sandbox rows. |
| N11 | note | | Runway model rows come from the newest complete model; a model that is still "Edited, not yet recalculated" is read with its edits (the hire moved the runway before I recalculated). |

### Paystack test payment (I21, N21), walked later the same day

Adebayo typed the Paystack **test** secret key (shown as `sk_test_…`, last four `50ac`) in chat; it was entered only in the masked key field on the local Integrations page and is in no file, capture or log.

| Row | Steps and result | Evidence |
|---|---|---|
| Connect | Connect Paystack, key in the masked field | `POST /finance/integrations/paystack/connect` 200; connection `active`, `mode: test`, `key_last4: 50ac` ✅ |
| Pay link | View INV-2026-003 (sent, ₦80,626.61), Create pay link | Toast "Pay link created." with a `checkout.paystack.com` link ✅. On INV-2026-004 (client `funke@kolo.example`) the same call answered **502** `ProviderBadResponse` (worker log "pay link not created ... via paystack"); the working invoice used a `resend.dev` address, so Paystack most likely rejects the `.example` customer email. The founder gets no cause. ⚠ note N12 |
| Payment | Opened the link, chose Paystack's built-in **Success** test option (the checkout offers it in test mode; no card number was typed), Pay NGN 80,626.61 | Redirect to `localhost:3000/finance/invoices?trxref=...` (the API's configured callback host; my dev server is on :3950, so the page was blank, not a defect of the app) |
| Sync now | Integrations, Sync now | Card: "Last sync: 1 fee, 1 payment matched to invoices." `POST .../paystack/sync` 200 (1.50 s); `last_sync_summary {fetched 2, fees 1, invoice_matched 1, imported 0, duplicates 0, paystack_payouts 0, paystack_unmatched 0, skipped_currency 0, skipped_oversize 0}` ✅ |
| I21 "Paid via Paystack" tag | Invoices | INV-2026-003 now **paid**, tag "Paid via Paystack", only View and PDF (no Mark unpaid, as designed); `paid_via: paystack`, `paid_at` 2026-10-24T21:57:45Z. The invoice's ledger row "Invoice INV-2026-003" Revenue ₦80,626.61 | ✅ |
| N21 imported row, category-only edit | `/finance`: row "Paystack fee for INV-2026-003-…" (₦1,309.40, Payment fees, source paystack) shows a category select and **no Edit or Delete**. API: `PATCH amount_minor` **422** "Imported transactions are read-only except the category.", `DELETE` 422 (same text), `PATCH category` 200 (restored to Payment fees) | ✅ |
| N21 needs-attention banner | Not shown: `paystack_unmatched` was 0, so there was nothing unmatched to flag | ⏳ not producible with one matched payment; covered by API and `syncSummary` unit tests |
| N21 skipped non-NGN counts | `skipped_currency` 0 and `skipped_oversize` 0 (an NGN-only test account); the card text for non-zero counts is covered by `lib/finance/syncSummary.test.ts` | ⏳ unit tests only |
| Payout tagging | Paystack test mode produced **no payout or settlement** (`paystack_payouts: 0`, no payout row), so "Paystack payout, not counted as income" tagging stays covered by tests only | ⏳ tests only |

Old invoice INV-2026-002's pay link comes from the earlier walk's Paystack account (a different test key); paying it did not show up under this key (`fetched 0`), so it was left unpaid.

### Rows I could not close

| Row | Why |
|---|---|
| Needs-attention banner, skipped non-NGN counts, payout tagging (parts of N21) | Cannot be produced by one NGN test payment in Paystack test mode (see above); unit and API tests cover them |
| I20 (print window), E11 (file chooser) | The pane cannot drive them |
| Imported row, category-only edit (bank source) | The FE hides Edit and Delete on bank rows, but the API allows more (D10). Paystack rows are correctly read-only |

### Cleanup
Paystack disconnected through the UI after the payment (all three providers "Not connected"). Left behind by the Paystack walk: INV-2026-003 is now paid via Paystack with its fee row (neither can be removed through the API). Deleted: the 141 remaining sandbox bank rows (and the one I deleted first), the "Slice E Receipt Test" expense, the model hire and one-off rows (model recalculated). Mono disconnected through the UI (confirm: "Historical data stays; new data stops syncing."). Cash on hand is back to ₦2,119,500. Left behind: invoice INV-2026-004 (sent; sent invoices cannot be deleted), several AI conversations from the Advisor checks (founder and team member).

### Counts after this re-check
Original 141 rows: 133 ✅ before; E9, P8, N8, R11 and I21 are now ✅ (138 ✅). N21 is ✅ for connect, pay link, payment, sync, the invoice match, the Paid via Paystack tag and the category-only imported row, and ⏳ for the banner, non-NGN counts and payout tagging (not producible, unit tested). Also ⏳: I20, E11. New defects D9, D10 are API-side.
