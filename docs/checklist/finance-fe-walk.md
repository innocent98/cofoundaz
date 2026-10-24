# Finance FE: live walk (2026-10-24)

Branch `feature/finance-fe` (FE `9992c32` plus the walk fixes) in its own dev server on :3871, proxied to the local API (docker, develop
`25fad5a1`, migration 0070). Workspace NovaPay. Founder `throwaway-founder`, team member `rewalk-tm` (`tm.localhost`), mentor `bb-mentor-1`
(`m.localhost`), consultant `bb-consultant-1` (`bc.localhost`), all `@example.com`. Every write below was checked against the raw API
(`GET` right after, with the same account). No real Paystack, Flutterwave or Mono key was read, pasted or printed; only obviously fake
keys were used.

Legend: ✅ passed live · 🟡 passed in the mocked Playwright suite only (`e2e/finance.spec.ts`), reason given · ⛔ blocked, reason given.

## Founder at 1440

### Cash flow (`/finance`)
| # | Control | Result | Checked against |
|---|---|---|---|
| 1 | Page load: tiles, 6 month chart (money in, money out, net bars, month-end cash line), tooltip, hidden table | ✅ cash on hand ₦2,119,500 = `cash_on_hand` 211950000; tiles are whole naira | `GET /finance/cash-flow` |
| 2 | Ledger "Showing 50 of 58", **Load more transactions** | ✅ next page appended, "Showing 58 of 58", button gone | `meta.total_estimate` 58 |
| 3 | Chips All / **Needs a category (6)** / Money in / Money out | ✅ counts 6 / 45 / 13 equal the API totals; the chip count is its own exact query | `?uncategorized=true`, `?direction=` |
| 4 | Inline category select on a row | ✅ "Walk test: payroll" set to Payroll, saved as `Payroll` | `GET /finance/transactions` |
| 5 | **Add transaction**: empty submit | ✅ "Add a description." | |
| 6 | Add transaction with **Add category...** and a typed `  fe   walk cat  ` | ✅ saved `fe walk cat` (trimmed, spaces collapsed), 1,250.5 became 125050 kobo, appears in `/finance/categories` | raw row |
| 7 | **Edit** (prefilled), change amount, save | ✅ 200000 kobo | raw row |
| 8 | **Delete** with confirm | ✅ row gone, total back to 58 | raw list |
| 9 | **Ask Finance Advisor** | ✅ AI drawer opens with "My runway is 2.2 months and my monthly burn is ₦960,153. What levers should I look at?" | |
| 10 | Imported rows (Paystack, Flutterwave, bank) offer the category only | 🟡 none exist locally (needs a real sync); covered with mocked rows | |

### Integrations (`/finance/integrations`)
| # | Control | Result |
|---|---|---|
| 11 | Page: Paystack, Flutterwave, Bank (Mono) cards, all "Not connected"; QuickBooks and Xero line says not planned | ✅ |
| 12 | **Connect Paystack**, fake `pk_test_...` | ✅ 422 field error under the key ("Use your Paystack secret key (starts with sk_test_ or sk_live_)."), key box emptied |
| 13 | **Connect Paystack**, fake `sk_test_FAKE...` | ✅ the real API asked Paystack, answered `PAYMENT_KEY_REJECTED`: "Paystack did not accept that key. Check it and try again."; key box emptied (length 0) |
| 14 | **Connect Flutterwave**: secret hash field is shown, empty hash | ✅ "Enter your Flutterwave secret hash." and nothing is sent |
| 15 | **Connect bank** (Mono) | ✅ the Mono sandbox widget opens in-page ("Sandbox uses Mono to link your account") with the public key from `connect_config`; closing it resets the button |
| 16 | A real connect, **Sync now**, Replace key, Disconnect, needs-attention banner, Mono code exchange, bank sync | ⛔ blocked: Adebayo pastes test keys in the Finance re-walk (the widget could be driven to Mono's sandbox test bank, but exchanging the code needs the server's Mono secret, which this walk does not use). Mocked e2e covers connect (validation, rejected key, success shows only `••••last4`), sync summary, skipped non-NGN counts, disconnect confirm, needs-attention, team member read-only, Mono "Coming soon" |

### Budgets (`/finance/budgets`)
| # | Control | Result |
|---|---|---|
| 17 | Table: Design, Hosting (over, +400%), then unbudgeted Equipment, Payroll, Software, Uncategorized, each with a worded status | ✅ equals `GET /finance/budgets?month=2026-10` row for row |
| 18 | **Set budget** on Software (category fixed, limit 30000) | ✅ row becomes "Over budget +10%", API id created |
| 19 | **Delete** with confirm | ✅ row returns to "No budget set" |
| 20 | **Draft missing from actuals** | ✅ "Added 1 budget from last month's spending" (Salaries), API shows it; deleted afterwards |
| 21 | Month selector (Sep 2026, Jan 2025) | ✅ Sep matches the API; Jan 2025 shows "A budget is a plan for your money. Start with last month's actuals." with Draft, Copy last month, Add one budget |
| 22 | **Copy last month's budgets**, **Edit** budget (saving) | 🟡 same code path as Draft and Set; Edit opens prefilled, not saved live |

### Expenses (`/finance/expenses`)
| # | Control | Result |
|---|---|---|
| 23 | Donut with text legend (Hosting 60.2%, Software 39.8%) and the table at 1440 with no clipped Actions | ✅ equals `GET /finance/expenses/summary` |
| 24 | **Add expense** (category select, 4500.25) | ✅ 450025 kobo, category Software |
| 25 | **Recurring** checkbox | ✅ API `recurring: true` |
| 26 | **Delete** with confirm | ✅ list back to 4 |
| 27 | **Edit** | ✅ opens prefilled; saving not clicked (same form as Add) |
| 28 | **View receipt** on a receipt uploaded by the API | ✅ asks `GET /expenses/{id}/receipt`, opens the signed link, which served `image/png` (200). The page never holds a storage URL; the link is fetched fresh per click |
| 29 | **Remove** receipt with confirm | ✅ `has_receipt: false`, `receipt_url: null` |
| 30 | **Attach** and **Replace** (file picker) | 🟡 the browser pane cannot open a file chooser; the mocked e2e drives the real input and checks one `file` part is posted. The API side was exercised with a PNG sent as `text/plain` (accepted) |
| 31 | The old walk expense "Walk test: Notion" | finding: its receipt row says `has_receipt: true` but the signed link answers 404 (the file is gone from local storage after the API container was rebuilt). Reported to the lead |

### Invoices (`/finance/invoices`)
| # | Control | Result |
|---|---|---|
| 32 | List (server status filter), chips All / Draft / Sent / Paid / **Overdue** | ✅ Overdue shows "No invoices with this status." |
| 33 | **PDF** (row) and **Download PDF** (detail) | ✅ `GET /invoices/{id}/pdf` 200 |
| 34 | **View** detail dialog on a paid invoice | ✅ PAID stamp, totals, dates |
| 35 | Builder: client, line, tax 7.5, Net 15, **Auto-remind** tick, **Save and send** with confirm | ✅ INV-2026-002 `sent`, `net_15`, `auto_remind: true`, total 10750000, due 8 Nov, `pay_url: null` (no connection). Sent to the Resend sink address only |
| 36 | **Create pay link** with nothing connected | ✅ toast "Connect Paystack or Flutterwave in Integrations first." (`NO_PAYMENT_CONNECTION`) |
| 37 | **Mark paid**, confirm | ✅ `paid`, ledger row posted, cash +₦107,500 |
| 38 | **Mark unpaid**, confirm | ✅ back to `sent` |
| 39 | **Send reminder** (overdue), 24 hour gap error, overdue badge, Copy pay link, Paid via tag | 🟡 an invoice only becomes overdue after its due date and there is no API to set that (the guide backdated in the DB; not done here). Mocked e2e covers the confirm dialog naming the client email, "Reminder queued", the button disabling inside 24 hours, the exact 422, Copy pay link, and the Paid via Paystack tag with Mark unpaid hidden. Lead: walk it after an approved backdate |

### Financial model (`/finance/model`)
| # | Control | Result |
|---|---|---|
| 40 | Legacy 12 month model: note "built before the balance check", **Recalculate** | ✅ upgraded to 36 months, `balance_check.balanced: true` |
| 41 | Tabs P&L / Cash Flow / Balance Sheet, **Monthly / Yearly** | ✅ yearly Year 1 to 3 columns, Balance check row 0 0 0, "assets equal liabilities plus equity" line; cash -914738253 kobo = -9,147,383 |
| 42 | Edit revenue growth 6 and COGS 25, **Save edits** | ✅ "Edited, not yet recalculated" banner, "AI suggested 4" and "AI suggested 35", API `stale: true`, `overrides` `{cogs 25.0, growth 6.0}` |
| 43 | Banner **Recalculate** | ✅ `stale: false`, new revenue 162798333 for month 1 |
| 44 | **Add hire** (Backend engineer, 300000), editor **Recalculate** (saves first) | ✅ `hiring_plan` `monthly_cost_minor: 30000000`, balance still balanced |
| 45 | **Clear edits** (hiring) and **Use AI value** (growth, COGS) | ✅ `overrides: null`, stale until recalculated; recalculated again |
| 46 | **Export CSV** | ✅ toast; unit-tested content, including the yearly layout |
| 47 | **Regenerate** | ✅ confirm dialog explains the AI budget; cancelled (no model was generated); the 409 `MODEL_ALREADY_GENERATING` handling is unit-level (not exercised) |
| 48 | Out-of-range edit (150) | 🟡 blocked in the browser before sending (message names the 100 limit); the API 422 path is in the mocked suite |
| 49 | Sensitivity slider, one-offs, capex rows, refresh from latest numbers with warnings | 🟡 slider is client-side and unit-tested; capex and one-off rows use the same editor as hires; `warnings` are unit-level in the API (not captured live) |

### Runway (`/finance/runway`)
| # | Control | Result |
|---|---|---|
| 50 | Base / Best / Worst chips | ✅ 1.9 months (Nov 2026), "12+ months", 1.3 months: equal the API |
| 51 | Assumptions in naira: one-off 150000.50 saved | ✅ `one_off_costs_minor: 15000050`; the panel names what Best and Worst change; chart has axis, zero line and cash-out dots; a three row scenario table |
| 52 | Hiring plan rows and one-off rows | ⛔ the API has three scalar fields only (see "Findings for the lead") |

## Team member (`rewalk-tm`, `tm.localhost`) at 1440
| Check | Result |
|---|---|
| `/finance` renders with the same numbers (₦2,119,440 after the walk's own rows), Add transaction present | ✅ |
| `/finance/integrations`: no Connect, Replace or Disconnect buttons, "Only a founder can connect Paystack" notes | ✅ |
| API: `POST /finance/integrations/paystack/connect` as the team member | ✅ 403 `FORBIDDEN` |
| API: `GET /finance/integrations`, budgets | ✅ 200 |

## Mentor and consultant (`m.localhost`, `bc.localhost`) at 1440
| Check | Result |
|---|---|
| `/finance` and `/finance/integrations` show "You don't have access to this page." (route guard); Finance is not in the sidebar | ✅ both roles |
| API: integrations, cash-flow and connect all answer 403 `FORBIDDEN` "You don't have permission to do that." | ✅ both roles |
| If the guard lets a member through but the API refuses (revoked access), the pages show "Not available for your role" | 🟡 mocked e2e |

## Accountant
No accountant account exists in the shared workspace. The guides say the role may read everything the team member can and sync, but not connect or disconnect; the FE treats any non-founder that way (verified for the team member, same code path). **Not walked live.**

## 375 (phone) as founder
All seven pages: no horizontal page scroll (`scrollWidth` 375 on cash flow, runway, budgets, invoices, expenses, model, integrations). The ledger, budgets, expenses and invoices render as card lists under `md`; the model statements scroll inside their card with a sticky first column. Mocked Playwright repeats the overflow check on every page. A first run caught one real overflow (the visually hidden chart table widened the page to 514px); fixed by wrapping it in a `div` with `sr-only`.
Team member, mentor and consultant at 375 were not repeated: they render the same shared components, or the access-denied screen.

## Findings for the lead (not worked around in the FE)
1. **Runway (gap 21):** `PUT /finance/runway/assumptions` takes `mom_growth_percent`, `hiring_spend_minor`, `one_off_costs_minor` only. The `hiring_plan[]` and `one_offs[]` arrays from the gap list are not in the API, so the FE keeps three fields, now in naira.
2. **Invoices (gap 23):** no `account_id`, `notes` or `payment_details` on invoices, so there is no client picker or notes block. Gap 25 "Resend" has no route either; the detail view offers Download PDF, Send reminder and Copy or Create pay link.
3. **Advisor context (gap 33, BE half):** the FE seeds the first message ("My runway is 2.2 months ..."), but the AI conversation still gets no finance context from the server.
4. **XLSX export (gap 14):** the model guide says there is no export route and none was added client side; CSV (monthly or yearly) stays.
5. **Legacy receipt:** expense `cbee3c6d-f462-4b03-bd57-1c0a8c180e7f` ("Walk test: Notion") has `has_receipt: true`, but its signed link answers 404 (file lost with the old container). A receipt uploaded now works (200, `image/png`).
6. **Budgets:** a legacy zero-amount ledger row makes an "Uncategorized" unbudgeted row with ₦0 spent appear. Harmless, but a zero-spend row is noise.
7. **Receipt thumbnails (gap 26):** not built; the signed link lives 5 minutes, so a thumbnail would need a link per row on every render. The row says "On file" with **View receipt**.

## Test data left in NovaPay
`INV-2026-002` "FE Walk Client Ltd" (sent, cannot be deleted through the API); the transaction "Walk test: payroll" now has category Payroll; a `fe walk cat` category entry; runway assumptions reset to growth 5%, hiring ₦200,000, one-off ₦100,000; the model was upgraded to 36 months and recalculated with no edits. Bulk rows, the walk receipt expense and the Salaries budget were deleted.
