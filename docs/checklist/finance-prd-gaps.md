# Finance Hub: PRD + UI gap list (live walkthrough, 2026-10-21)

Source of truth: `Cofoundaz_Technical_PRD.md` Module 12 (§12.1 Cash Flow to §12.7 Integrations, API, entities, events,
notifications, access "F, AC (read/write ledgers, invoices, reports), TM (Finance grant)") + §2.1 (shared top bar) + §1.1
principle 5 (never hue alone) + §1.4 (financial disclaimer). The API guides are `cofoundaz-api/docs/fe-integration-guide-finance-*.md`
(cashflow, runway, budgets, invoices, expenses, model).

**Integration decisions applied (Adebayo, confirmed):**
- **Payments = Paystack with per-founder keys.** Each founder pastes their own Paystack secret key in Finance →
  Integrations. It is stored encrypted and never returned. Their transactions are read as revenue, and the invoice
  "Pay now" creates payment links on their account.
- Payments are built behind a **provider interface** so Flutterwave can be a second adapter later.
- The PRD's **Stripe** connector card becomes **Paystack**.
- **Bank connection = Mono** (sandbox keys pending). **QuickBooks / Xero deferred.**

**How it was walked:** live on `develop` (FE `bf6de8c` in its own dev server on :3841, proxied to the shared API
`17510c8` on :8000), workspace NovaPay, every sub-page and every control:
- **Founder** (`throwaway-founder`): at 1440 and 375 (375 checked for page-level overflow and layout on all seven pages).
- **Team member** (`rewalk-tm`): FE at `tm.localhost` (Cash flow rendered with identical numbers), plus API reads and
  writes (create, delete, create invoice).
- **Mentor and consultant** (`bb-mentor-1`, `bb-consultant-1`): FE at `m.localhost` / `bc.localhost`, plus API reads,
  writes and the AI `POST /finance/model/generate`.
- **Accountant: no test account exists** in the shared workspace, so the AC path was not walked (see "Not walked").

**Real model:** one 3-statement model generation (Financial model → Generate model; two more concurrent runs were started
through the API to test gap 15).
**Email:** the one invoice was sent to the Resend sink address `delivered+walk-test@resend.dev`, never to a real client.

**Test data left in the workspace** (useful for the FE session; all labelled "Walk test"):
- 9 manual transactions ("Walk test: seed funding" ₦5,000,000 in; three customer payments; three payroll rows; cloud hosting;
  two equipment rows) plus the zero-amount row "Walk test: zero" from gap 30 (the future-dated and USD probe rows were deleted);
- 5 expenses (AWS Sep and Oct, AWS overage, Figma, Notion with a receipt, Slack recurring), which post `source: expense`
  rows to the ledger;
- 2 budgets for Oct 2026 (Design, Hosting, Hosting over budget at 125%);
- invoice `INV-2026-001` "Walk test Client Ltd" (₦107,500, sent, marked paid → a `source: invoice` ledger row);
- runway assumptions saved at growth 5%, hiring ₦200k, one-offs ₦100k;
- three generated financial models (the latest is shown on the page);
- the workspace is in the danger band (2.2 months runway), so `finance.runway.low` fired for the founder and team member.

Legend: ✅ meets PRD · ❌ gap · Severity: **Sec** (permission/data exposure) > **High** (PRD behaviour broken or a headline
feature missing) > **Med** (PRD feature partial) > **Low** (copy, polish, a11y)

## Works (verified live)
- ✅ **Real API everywhere:** all six data pages call the real API; the only static page is Integrations (a stub, see gaps).
  Tile numbers match `GET /finance/cash-flow` exactly (cash on hand, burn, money in, runway). Money is `amount_minor` kobo and
  renders correctly (₦5,000,000 typed became `500000000`).
- ✅ **Role gating is clean** (`require_role(*FINANCE_ROLES)` on every route; FINANCE_ROLES = founder, team member, accountant):
  - Mentor and consultant get `403 FORBIDDEN` "You don't have permission to do that." on every read and write, including
    the AI `POST /model/generate`.
  - The FE shows "You don't have access to this page." on `/finance` and sub-routes, and Finance is hidden from their sidebar.
  - Global search returns no finance results for them, and they receive no `finance.*` notification.
  - A wrong `X-Workspace-Id` returns 403 on reads and on an expense ID from the real workspace; a missing token returns 401.
- ✅ **Cash flow:** tiles, 6-month in/out chart, ledger with **All / Needs a category (n) / Money in / Money out** chips,
  inline category **Set**, **Edit** (modal) and **Delete** (confirm dialog). Invoice and expense ledger rows are read-only
  ("Managed by its source"). The **runway < 6 months** banner appears with **Ask Finance Advisor** and the tiles go red.
- ✅ **Runway:** Base/Best/Worst chips match the API (worst 1.6 months, Nov 2026); assumptions save and the scenario numbers
  recalculate (growth 5%, hiring ₦200k, one-offs ₦100k saved as `20000000` / `10000000` kobo); the honest note that money
  in includes funding is shown.
- ✅ **Budgets:** month selector, **Draft budget from actuals** ("Added 2 budgets from last month's spending"),
  **Copy last month's budgets**, New budget (category suggestions from existing categories), Edit, Delete, and a
  worded **OVER BUDGET** state (125% used, over by ₦10,000), not colour alone. The page says "Manual transactions do not count".
- ✅ **Invoices:** builder with live preview, tax and terms (Net 15 gave due 5 Nov), **Save draft**, **Save and send**
  (confirm dialog), **Mark paid** (confirm; adds ₦107,500 to cash on hand and posts a ledger row) and **Mark unpaid**, status
  filter chips, **Print**. The client email, line items and number are HTML-escaped in the email body. The page says plainly that
  auto-remind is not sent yet.
- ✅ **Expenses:** month selector, add form (vendor, category, amount, date, notes, recurring, receipt), recurring toggle in the
  table, receipt **Attach / Replace / Remove**, per-category breakdown; each expense posts a ledger row. The form says
  "Recurring (a label only; the next one is not created for you)".
- ✅ **Financial model:** Generate model → "Building your model" → polling → **P&L / Cash Flow / Balance Sheet** tabs,
  AI assumptions panel, **Regenerate**, **Export CSV**, revenue sensitivity slider, §1.4-style note. The balance sheet balances
  to within ₦1 in the first two months.
- ✅ **Notifications:** `finance.runway.low` reaches the founder and the team member (not mentor or consultant) and the bell
  link goes to `/finance/runway`.
- ✅ **375:** no page-level horizontal scroll on any sub-page (tables scroll inside their cards, the tab bar scrolls inside itself).

## Gaps
| # | Area | Gap (observed) | PRD | Layer | Sev | Proposed fix |
|---|---|---|---|---|---|---|
| 1 | Roles | Every team member has full create/edit/**delete**, send invoice, mark paid and can run the AI model (TM created and deleted a transaction and created and deleted an invoice: 200/200). There is no per-member "Finance grant"; `FINANCE_ROLES` = founder + team member + accountant. | Access: **F, AC, TM (Finance grant)** | both | **Sec** | Decide D-FIN-1. Default: keep TM = full access (matches every other hub so far) and record it. Revisit grants as one cross-hub feature on the Team page. The new Paystack key area is founder-only regardless (row 4). |
| 2 | Receipts | Receipts are stored as public Cloudinary `secure_url`s (anyone holding the link reads a financial document; investors "never see raw ledgers"). Local storage returns a filesystem path (`var/storage/receipts/...`) that the FE refuses to link. | "Investor never sees raw ledgers" | BE | **Sec** (preventive) | Store receipts as private/authenticated assets and serve through `GET /finance/expenses/{id}/receipt` (role-checked, signed short-lived URL). Return that route from the API instead of the raw URL. Test as mentor. |
| 3 | Receipts | Upload type check trusts the client `Content-Type`: an HTML file sent as `image/png` is accepted (200). | receipt upload | BE | Med | Sniff magic bytes (PNG/JPEG/PDF), and cap size, before saving. |
| 4 | Paystack (BE) | No payments provider: no `finance_connections` table, no `/finance/integrations/*` routes (PRD API), no secrets storage. `TransactionSource` has `stripe` and no `paystack`. | §12.7, API `POST /finance/integrations/{provider}/connect`, `/sync`, `/disconnect`; `finance_connections(provider,status,last_sync_at)` | BE | High | Build behind a `PaymentProvider` interface (`validate_key`, `list_transactions`, `create_payment_link`, `verify_webhook`) with a `PaystackProvider` adapter (Flutterwave later). Table `finance_connections(startup_id, provider, status, key_ciphertext, key_last4, mode test/live, account_name, last_sync_at, last_error)` with a unique `(startup_id, provider)`. Encrypt with the existing Fernet helper pattern (`app/services/journal/encryption.py`), never return the key (only `key_last4`, mode, name). Routes: `GET /finance/integrations`, `POST /{provider}/connect` (validates the key against Paystack, 422 on a bad key), `POST /{provider}/sync`, `POST /{provider}/disconnect` (keeps history). **Founder only** for connect/disconnect; F, TM and AC may read status. Rename the enum value to `paystack` (migration; no data uses `stripe`). |
| 5 | Paystack (BE) | No transaction import. `external_ref` has no unique index, so a re-sync would double count. | "Their transactions are read as revenue"; transactions `source`, `external_ref` | BE | High | Sync worker (on demand and a scheduled job, e.g. hourly) pages `GET /transaction?status=success`, maps to `direction: in`, `source: paystack`, `external_ref = reference`, kobo amount, and records Paystack fees as an out row (D-FIN-7). Add a unique index `(startup_id, source, external_ref)` and upsert. Store `last_sync_at` and `last_error`; a failed key flips the connection to `needs_attention` (sync error banner, row 7). Backfill window and rate limit documented. Only `NGN` rows count (row 30). |
| 6 | Paystack (BE + FE) | Invoices have no pay link; the email has no link and no PDF; `mark-paid` is manual only. | **"Send invoice"** (email w/ PDF + pay link if Stripe connected); "Pay now" | both | High | BE: on `send`, if the founder has a Paystack connection, `POST /transaction/initialize` (amount, email, `reference = invoice number + id`) and store `pay_url`, `pay_reference` on the invoice; include the link in the email. A per-connection webhook route (`POST /webhooks/paystack/{connection_id}`, HMAC-SHA512 over the raw body with that founder's key, constant-time compare) marks the invoice paid on `charge.success` (idempotent, matched by reference) and posts the single ledger row. Import skips a charge whose reference matches an invoice (no double count). FE: show the pay link with **Copy link** on a sent invoice and a "Paid via Paystack" tag. Webhook live test is blocked on a public URL (see Blocked). |
| 7 | Integrations (FE) | `/finance/integrations` is a static page: four cards, each a disabled "Coming soon", plus a banner "Automatic syncing is not available yet". It states honestly that nothing is connected. | §12.7: cards **QuickBooks, Xero, Bank connection, Stripe**; **Connect** → **"Connected as {org}"** + last sync + **Sync now** / **Disconnect** (confirm "Disconnect {provider}? Historical data stays; new data stops syncing."); error banner "{Provider} connection needs attention — reconnect to resume syncing." | FE | High | Rebuild on the row 4 routes. **Paystack** card: **Connect** opens a secure key dialog (password-type field, "Starts with sk_", test/live badge, never shown again), then **Connected as {business name}** ("Test mode" tag when `sk_test_`), last sync time, **Sync now**, **Disconnect** with the PRD confirm copy, and the PRD error banner. Show last 4 digits only. **Bank connection (Mono)**: card "Coming soon" with a note. **QuickBooks / Xero**: remove the cards (deferred) or show "Not planned yet". Founder sees the controls; TM and AC see status read-only. Add a **Paystack** source chip to the ledger. |
| 8 | Invoices | **Overdue and reminders are not automated.** `auto_remind` is stored and editable, but no scheduler job exists in `app/worker/scheduler.py`; nothing is emailed and no overdue event fires. | Overdue automation toggle **"Auto-remind every 7 days"**; reminder email subject **"Reminder: invoice {number} from {startup}"**, body "Hi {client_first} — a friendly nudge that invoice {number} for {amount} was due on {date}…"; event `finance.invoice.overdue`; notification **"Invoice overdue: {number} · {client} · {amount}"** CTA **"Send reminder"** | BE | High | Daily job: for `sent` invoices past `due_on`, emit `finance.invoice.overdue` once (idempotent), notify F + TM + AC with CTA "Send reminder" (manual `POST /finance/invoices/{id}/remind`), and, when `auto_remind`, email the PRD copy every 7 days (`last_reminded_at`, a cap, and a stop on paid). Keep the FE note honest until it ships. |
| 9 | Events | Only `finance.runway.low` exists. `finance.invoice.paid` and `finance.runway.updated` are never emitted, and no "Invoice paid: {number} 🎉" notification reaches anyone (founder and TM notification lists contain only `runway.low` after a paid invoice). | Events: `finance.runway.updated`, `finance.invoice.overdue`, `finance.invoice.paid`; notification **"Invoice paid: {number} 🎉"** | BE | Med | Emit `finance.invoice.paid` from `mark-paid` and the Paystack webhook (row 6) with `invoice_id`; emit `finance.runway.updated` when assumptions save or the ledger changes the runway band. Register both in the notifications registry and audience (`FINANCE_ROLES`). FE: icon, category and deep link (`/finance/invoices`). |
| 10 | Notifications | `finance.runway.low` title is "Your runway is running low" with an empty body and no CTA. | **"Runway below 6 months — review recommended"** CTA **"Open Finance"** | BE | Low | PRD title, a body with the months and burn (already in `data`), and CTA. The FE link `/finance/runway` is already right. |
| 11 | Financial model | The model cannot be edited. Assumptions are AI-picked and shown read-only, there is no input form, and there is no **Recalculate**. Nothing is cell-editable. The Business Builder revenue drivers are used only when there are no revenue actuals and are not shown. | Forecast Builder: assumption inputs (revenue drivers from Module 08, cost lines, headcount plan) → **"Build my 3-statement model"**; every generated cell editable → **"Recalculate"** | both | High | BE: accept an `assumptions` override on `POST /model/generate` and `PATCH /model/{id}/assumptions` + `POST /model/{id}/recalculate` that re-runs the deterministic engine with no AI call; store edited cells as overrides. FE: assumptions panel with inputs (growth, COGS %, opex growth, DSO/DPO, headcount rows, one-offs, revenue drivers), inline cell edit, Recalculate. Show the Business Builder drivers with their source. |
| 12 | Financial model | Horizon is 12 months with no yearly rollup. | monthly ×36, yearly rollup | both | Med | Decide D-FIN-8. Default: extend the engine to 36 months (it is deterministic, so no extra AI cost) and add a yearly rollup toggle. |
| 13 | Financial model | **Balance sheet is a plug.** It has no totals; "Paid-in capital" equals the first month's closing cash (₦1,172,667) and then stays constant, ignoring the ₦5,000,000 funding in the ledger. Assets are only cash and receivables. It balances only by construction. | investor-grade 3-statement model | BE | Med | Seed opening equity from actuals (funding rows, retained earnings from history), add total assets and total liabilities + equity rows with a check line, and carry fixed assets if capex is present. Add a unit test that asserts balance each month. |
| 14 | Financial model | No charts and no XLSX. Export is CSV of the visible statement. The "✨ AI-built from your actuals and assumptions — investor-grade structure, your numbers." line is missing, and the sensitivity slider affects the P&L only. | charts, sensitivity (±20% revenue), **Export XLSX**, copy line, §1.4 disclaimer | FE | Med | Add revenue/net-income/closing-cash charts, XLSX export (all three statements as sheets), the PRD copy line, and apply sensitivity to the cash view too (or say it is P&L only, which the page already does). |
| 15 | Financial model | `POST /model/generate` can be called repeatedly: two calls returned two `generating` jobs (202 each). Each is an AI call against the workspace budget, and any team member can trigger it. | AI budget control | BE | Med | Reject with 409 while one is `generating`; add a per-workspace daily cap shared with the AI budget; return the existing job instead. |
| 16 | Cash flow | The chart shows money in and out bars only, no **net** bars, no **cash line**, no axis values, no tooltip or text equivalent, and it is read by colour plus legend. | "in/out/net bars + cash line, monthly" | FE | Med | Add net bars (or a net line) and the cash line (from the API's running balance), value labels or a tooltip, and a visually hidden table for screen readers. |
| 17 | Categories | Category is free text in the ledger, expenses and budgets (with a datalist on budgets). A budget for "Hosting" never matches an expense typed "hosting". There is no category list endpoint, and no AI suggestion for uncategorised rows. | transactions table: category **Select**, inline categorize | both | Med | BE: `GET /finance/categories` (defaults + the workspace's used ones, case-folded) and normalise on write. FE: a Select with "Add category". Optional: AI "Suggest category" for the "needs a category" chip (one batched call, fenced inputs). |
| 18 | Budgets | **Budget actuals only count Expenses.** A manual outflow transaction (my "Walk test: equipment" ₦4,500,000 in category Equipment) never reaches a budget, and a founder has two places to log spend. The page discloses this, but the ledger and the budget disagree. | budget vs actuals by category | both | Med | Decide D-FIN-3. Default: actuals = all outflow ledger rows of the month (manual + expense + imported) by category, so no re-entry is needed, with expenses kept as the place for receipts and recurring labels. Add a regression test with a manual outflow. |
| 19 | Budgets | Budgets render as cards, not the PRD table. There is no **variance %** column, and spend in a category with no budget (₦33,000 in Software) is invisible. | table (budget, actual, **variance % colored**), over-budget rows flagged | both | Med | BE: include unbudgeted categories in `GET /budgets` as rows with `limit_minor: null`. FE: a table with variance %, worded status (not colour alone) and a card list under `md`. |
| 20 | Budgets | Empty copy is "No budget set for Oct 2026" and "Draft limits from last month's spending…". **Draft budget from actuals** is rule-based (copies last month's expense totals), not AI. | Empty: **"A budget is a plan for your money. Start with last month's actuals."** CTA **"Draft budget from actuals"** (AI) | both | Low | PRD copy. Decide D-FIN-4. Default: keep the deterministic draft (it is auditable and free) and drop the "(AI)" in the PRD, or add an optional AI rounding step later. |
| 21 | Runway | Assumptions are three scalars: MoM growth, one **monthly** hiring spend and one one-off total, entered in "NGN thousands" ("20 means 20,000 naira"). Best and worst are fixed offsets the user cannot see or change. | editable growth %, **hiring plan rows**, **one-off costs**, scenario chips | both | Med | BE: `hiring_plan: [{month, amount_minor, role}]` and `one_offs: [{month, amount_minor, label}]` (keep the scalar fields as a fallback). FE: row editors in naira (no "thousands"), and a small panel stating what Best and Worst change. |
| 22 | Runway | Copy and chart: "Cash runs out in Dec 2026." instead of "At base case, cash out: Dec 2026." The chart has no y-axis, no per-scenario cash-out marker and no values. | **"At base case, cash out: {MMM YYYY}."**, chart of cash-out date per scenario | FE | Low | PRD sentence per selected scenario, a marker at the zero crossing, axis labels, and a three-row summary (Base, Best, Worst cash-out dates) next to the chart. |
| 23 | Invoices | The builder takes free-text client name and email. There is no client picker (Sales accounts), no notes, no payment details block and no due-date field (terms only). | client (from **Sales accounts** or new), line items, tax %, **notes, payment details block** | both | Med | BE: `account_id` (nullable) on invoices plus `notes` and `payment_details`; FE: a client combobox reading Sales accounts (after Sales slice A) with "New client", and the two text fields. Until Sales exists, add "Save client" as a local pick list. |
| 24 | Invoices | "Print or save as PDF" is the browser print dialog. The email has no PDF attachment (subject "Invoice {number} from {startup}"). | **"Send invoice"** (email w/ PDF) / **"Download PDF"** | both | Med | BE: render a PDF server-side (`GET /finance/invoices/{id}/pdf`) and attach it to the email. FE: a real **Download PDF** action. |
| 25 | Invoices | No **"PAID"** stamp (status chip only), the **Auto-remind** toggle exists only as a table checkbox (not in the builder), and a sent invoice has no detail view or **Resend**. | paid state stamp **"PAID"**, Overdue automation toggle | FE | Low | A PAID stamp on the invoice preview, the toggle in the builder, and a detail drawer with Resend and **Copy pay link** (row 6). |
| 26 | Expenses | Not the PRD layout: the breakdown is horizontal bars, not a donut; receipts show the text **On file** with no thumbnail or viewer; at 1440 the table is 820px in a 747px card, so **Actions** (Edit, Delete) is clipped and needs an inner scroll. | monthly by-category **donut**, receipt **upload thumb** | FE | Low | Donut with a text legend (also readable at 375), a receipt thumbnail that opens the authenticated receipt (row 2), and a table that fits. |
| 27 | Expenses | **Recurring** is a label only; the next expense is not created. The honest copy says so. | recurring flag | both | Low | Decide D-FIN-5. Default: keep it a label for now; later a "repeat monthly" job that drafts next month's expense for confirmation. |
| 28 | Lists | `GET /finance/transactions`, `/expenses` and `/invoices` are unbounded: `?limit=1` is ignored and returns all rows, with `meta: null`. The FE loads and renders everything. Paystack import (row 5) makes this a real problem. | (scale) | both | Med | Cursor or page params with `meta` totals; FE "Load more" and server-side filters (the chips already exist client-side). |
| 29 | Currency | The API accepts any `currency` on a transaction (a USD row was saved), but every total says NGN and appears to ignore non-NGN rows (cash on hand did not change after a USD inflow). The UI has no currency field. | "Money stored as integer minor units + currency code" | BE | Med | Decide D-FIN-6. Default: NGN-only in v1: reject other currencies with a clear 422, or convert at write time. Paystack import keeps only `NGN` and reports skipped counts. |
| 30 | Validation | A **zero-amount** transaction is accepted (negative is rejected with 422). | | BE | Low | `amount_minor > 0` on create and update, and the same message in the FE. |
| 31 | Mobile | At 375 the ledger (min width 971px), expenses (837px) and invoices (917px) tables need an inner horizontal scroll to reach Category and the row actions, and the chart has no values. | | FE | Low | Card list under `md` for these three, with the actions in a row menu. Model statements may keep the scroll with a sticky first column. |
| 32 | Shell | Own header (breadcrumb + health pill + bell). No ⌘K search, although the search API returns finance results to F, TM and AC (transactions, invoices). | §2.1 shared top bar | FE | Med | `ShellTopBar` (as Validation, Assessment and Marketing). Make search hits land on the right sub-page. |
| 33 | Advisor | **Ask Finance Advisor** (runway banner) opens the generic AI Co-Founder panel with no prefill and no finance context. | CTA **"Ask Finance Advisor"** | both | Med | FE: open the panel with a first message such as "My runway is {n} months. What levers should I look at?". BE: add the runway, burn and top spend categories to that conversation's context for F, TM and AC only. |
| 34 | Polish | The AI floating button sits above the modal overlay at 1440 (visible over the dimmed edit modal). Tiles show uneven decimals (₦960,166.67 next to ₦1,500,000). | | FE | Low | Hide the button while a modal or drawer is open. Round tile figures to whole naira (kobo only in tables). |
| 35 | Docs | No FE guide for the integrations routes, pay links or the new events; the six existing guides need a re-capture once rows 9, 11, 19 and 28 change shapes. | | BE | Low | Add `fe-integration-guide-finance-integrations.md` from live captures (test-mode keys), and update the others in the same PR. |

## Not walked (no account or no safe way)
- **Accountant (AC):** no test account exists. The role is in `FINANCE_ROLES` and the FE `nav-access` (`'/finance': [F, TM, AC]`),
  search, activity and notifications use the same set, and the Team schema can invite it. Create `bb-accountant-1` (or similar)
  before the re-walk so AC gets the full F/TM checks, plus a denial check that AC cannot touch the Paystack key.
- **Investor:** no investor account. "Never sees raw ledgers" is enforced by the same role set (`require_role`, search, notifications),
  verified for mentor and consultant only.
- **Overdue state:** an invoice only becomes overdue after its `due_on` passes, and backdating needs a DB write (not done).
  `_derived_status` is read in code only. Walk it in the re-walk once row 8 ships or with an approved backdate.
- **Real Resend delivery** of the invoice email (sink address only) and the receipt viewer on Cloudinary storage (local storage was used).

## Related, outside the Finance page
- **Business Builder → "Send to financial model"** is wired on the API (`send_to_finance`), but the Finance model page does not show
  the drivers or say they were used (row 11).
- **Sales hub** is the source for invoice clients (row 23) and the Paystack payments would be the first real revenue source for
  the Sales funnel.
- **Dashboard** cash and runway KPIs read the same ledger, so rows 18, 29 and 5 change them.
- **Module 22 Reports:** the AC "reports" access has nothing to point at yet.

## Decisions needed (proposed defaults; none block BE work on the other rows)
| ID | Question | Proposed default | Who |
|---|---|---|---|
| D-FIN-1 | PRD says "TM (Finance grant)". Per-member module grants, or is every team member a finance user? | Every TM has full Finance access (consistent with Marketing, Validation, Business Builder). Grants become one cross-hub Team-page feature later. | **needs Adebayo** (product/permission model) |
| D-FIN-2 | Who manages the Paystack key? | Founder only can connect, replace or disconnect. TM and AC see status and sync, and no one sees the key after it is saved. Replace requires re-entry. | lead can decide |
| D-FIN-3 | One source of spend truth for budgets? | Budget actuals = all outflow ledger rows by category (manual, expense, imported). Expenses stay for receipts. | **needs Adebayo** (changes how the cash and budget pages agree) |
| D-FIN-4 | Is "Draft budget from actuals" AI? | Keep it deterministic. | lead can decide |
| D-FIN-5 | Recurring expenses: label or generator? | Label now; confirm-before-create job later. | lead can decide |
| D-FIN-6 | Currencies? | NGN only in v1, reject others. | lead can decide |
| D-FIN-7 | How are Paystack charges, fees and refunds recorded, and how is a paid invoice kept from double counting? | Gross charge = money in. Paystack fee = a money-out row in category "Payment fees". A refund = money out. A charge with a reference that matches an invoice is not imported a second time. Imported rows are read-only except category. | lead can decide |
| D-FIN-8 | Model horizon? | 36 months with a yearly rollup (deterministic engine, no extra AI cost). | lead can decide |
| D-FIN-9 | Key custody and secrets policy for founders' Paystack keys. | Fernet with a dedicated key rotated through an env var, an audit row on connect/disconnect, and a "test key" badge. Production key custody (KMS) is a later hardening step. | **needs Adebayo** (security) |

## Blocked on external accounts (honest status)
- **Mono bank connection:** sandbox keys pending. The card is "Coming soon" until they arrive. The Mono adapter would follow
  the same provider interface (transactions in, no payments).
- **Paystack live-money tests:** everything in rows 4 to 7 is buildable and testable with Paystack **test-mode** keys. Checking a
  real settlement or a live webhook needs a public HTTPS URL (a dev tunnel or staging) and a live key.
- **QuickBooks / Xero:** deferred by decision. No work until it is reopened.
- **Flutterwave:** a second adapter later. The provider interface is the only thing to do now.
- **Accountant and investor accounts, and the overdue state** (see "Not walked").

## Counts (35 gaps)
- **By layer:** BE 12 (rows 2, 3, 4, 5, 8, 9, 10, 13, 15, 29, 30, 35), FE 9 (7, 14, 16, 22, 25, 26, 31, 32, 34), both 14
  (1, 6, 11, 12, 17, 18, 19, 20, 21, 23, 24, 27, 28, 33).
- **By severity:** Sec 2 (rows 1, 2; neither is a live leak today), High 6 (rows 4, 5, 6, 7, 8, 11), Med 17, Low 10.
- **Paystack connector** (buildable now with test-mode keys): rows 4, 5, 6 (BE) and 6, 7 (FE).

## Build order (proposal)
1. **BE (lead), stacked PRs:**
   - **(a) Provider + Paystack core:** `finance_connections` migration, encryption, `PaymentProvider` + `PaystackProvider`, connect/list/disconnect (4),
     import + unique index + scheduled sync (5), pay links + webhook (6). Test-mode keys, a recorded-fixture adapter test, and 403 tests per role.
   - **(b) Invoice automation and events:** overdue/reminder job (8), paid and runway.updated events (9), notification copy (10), PDF (24).
   - **(c) Ledger correctness:** categories (17), budgets over all outflows and unbudgeted rows (18, 19), pagination (28), currency (29), validation (30),
     private receipts (2, 3), model concurrency (15).
   - **(d) Model:** assumptions/recalculate (11), horizon (12), balance sheet (13).
   - Each PR ships tests, an e2e journey, a live-captured FE guide and an SOP.
2. **FE (one sub-session, after (a) and (c), or chained):** `ShellTopBar`, Integrations rebuild, Paystack source chip and pay link,
   chart (16), categories Select, budgets table, runway editors and copy, invoice builder fields, model editor and XLSX, expenses donut and
   thumbnails, advisor prefill, cards at 375, polish.
3. **Re-walk:** every control on merged develop at 1440 and 375 as F, TM, accountant (new account), mentor and consultant, including the
   overdue state and a Paystack test-mode sync.
