# SOP: Finance Hub, front end

## What shipped
The whole Finance hub runs on the real API with no mock left: Cash flow, Runway, Budgets, Invoices, Expenses, Financial model and a
rebuilt Integrations page. It consumes the four finished backend slices: (a) payments core with Paystack and Flutterwave (#167),
(b) invoice automation (#170), (c) ledger correctness (#171), (d) the editable 3-statement model and the Mono bank adapter (#176).
Branch `feature/finance-fe`, one PR to `develop` (the page set is big, but every part shares one API layer and one set of hooks, so it
was kept as one reviewable change). Gap rows closed: 1, 6, 7, 11, 12, 14 (minus XLSX), 16, 17, 18, 19, 20, 21 (naira only), 22, 24, 25
(minus Resend), 26 (minus thumbnails), 28, 31, 32, 33 (FE half), 34 of `docs/checklist/finance-prd-gaps.md`, plus D-FIN-1 to D-FIN-10.
Contracts: API repo `docs/fe-integration-guide-finance-*.md` (payments, invoices-automation, ledger, model, model-mono; the newer guide
wins where two overlap).

## Why
The pages were the old designed UI on a partial API: the ledger loaded every row, categories were free text, budgets ignored manual
spend, receipts opened raw storage URLs, Integrations was four disabled cards, the model could not be edited, and invoices had no
reminders, PDF or pay link.

## How
| Area | What changed | Decision or trade-off |
|---|---|---|
| Client | `lib/api/finance.ts`: `Page<T>` (cursor + exact total) on transactions, expenses, invoices; `listCategories`; `getReceiptLink`; integrations (`getIntegrations`, `connectPaymentProvider`, `connectMono`, `syncIntegration`, `disconnectIntegration`); invoice `remindInvoice`, `createPayLink`, `downloadInvoicePdf` (bearer fetch, blob download); model `patchModelAssumptions`, `recalculateModel`; new Budget, Invoice and FinancialModel fields typed nullable where the API sends null | Money stays integer kobo end to end. Unbudgeted budget rows are the same type with `id`/`limit_minor` null, not a second type |
| Hooks | `useFinancePaged` (page one as a resource, "Load more" appends, a filter or reload restarts; the tail is keyed to its page-one object so a stale tail can never show), `useCategories`, `useIntegrations`, `useUncategorizedCount` | The "Needs a category" chip count is its own `limit=1` query so it is exact, not the size of the loaded page |
| Shell | `ShellTopBar` (search, health, bell, invite) replaces the page's own header | Same as the other hubs |
| Ledger | Server side filters, load more, card list under `md`, category select on manual and imported rows (invoice and expense rows stay read-only), "Paystack payout, not counted as income" note, chart with net bars, month-end cash line, tooltip and a hidden table, whole-naira tiles, Advisor seeds the AI drawer | The cash line is derived: `cash_on_hand` is the balance after the newest month, so walking back subtracts each month's net (`lib/finance/cashSeries.ts`) |
| Categories | `CategorySelect`: the API list plus "Add category..."; the saved value from the response is what shows | The API normalises spelling on write; the FE never assumes what it sent is what was stored |
| Budgets | Table with budget, spent, variance and variance %, worded status, bar, unbudgeted rows with **Set budget**; cards under `md` | Status is words, never colour alone. Copy says spent now includes manual spend (D-FIN-3) |
| Expenses | Donut with a text legend, one table that fits at 1440, cards under `md`, **View receipt** | Receipts: the expense only has an API route, so each click asks for a fresh 5 minute signed link and opens it in a new tab. The link is never stored or rendered. No thumbnails (a link per row per render) |
| Integrations | Paystack, Flutterwave, Bank (Mono) cards; key dialog (password fields, emptied the moment a request starts, unmounted on success, failure asks again); `••••last4`; Test mode or Sandbox tag; webhook URL with Copy and the warning that invoices will not auto-mark paid without it; sync summary sentence incl. skipped non-NGN counts; needs-attention banner with the PRD copy; disconnect confirm with the PRD copy | Founder only for connect, replace, disconnect (D-FIN-2); team member and accountant see status and Sync. One payment provider at a time: the other card says to disconnect first. Mono uses `@mono.co/connect.js` 2.3.0 with the public key from `connect_config`; the one-time code goes to the API |
| Invoices | Server status filter, load more, cards under `md`, detail dialog (PAID stamp, Copy or Create pay link, reminder state), **Send reminder** with a confirm naming the client email and a 24 hour hint, overdue badge, auto-remind in the builder and the row, **Download PDF** (API), "Paid via ..." tag and no Mark unpaid when `paid_via` is set, a note when text will print as `?` in the PDF | After a reminder the screen says "queued", not "delivered". The browser print view stays only for the unsaved builder preview |
| Model | Editor for every assumption in the guide (growth, COGS, opex growth, receivable and payable days, starting revenue and costs, depreciation months, hires, one-offs, capex), "AI suggested X" next to an edited value, **Use AI value**, Save edits, **Recalculate** (saves first), "Edited, not yet recalculated" banner, Balance check line and a hard error if it fails, Monthly or Yearly, revenue, net income and cash chart, 36 column table with a sticky first column, CSV (monthly or yearly), Regenerate behind an AI budget confirm, `409 MODEL_ALREADY_GENERATING` treated as "keep polling" | The editor is remounted by `key` whenever the server copy changes, so inputs always start from what the engine used and no effect copies props into state. Sensitivity stays P&L only and says so; it now subtracts depreciation |
| Runway | Inputs in naira (no more "thousands"), the Best and Worst definitions shown, chart with axis, zero line and cash-out marker per scenario, "At base case, cash out: Nov 2026." and a three row scenario table | Hiring and one-off rows are not possible: the API has scalars only |
| Contrast | Table headers and small captions moved from `text-sage-400` to `text-sage-600` | axe flagged 2.57:1 contrast |

Rejected: a client side XLSX export (the guide defers it and the FE would need a new dependency); a polling loop for sync (the guide says do not); showing the signed receipt link as text.

## What's involved
- New: `hooks/useFinancePaged.ts`, `lib/finance/{cashSeries,modelEdits,reminders,syncSummary}.ts` (+ tests), `types/mono-connect.d.ts`,
  `app/(dashboard)/finance/_components/{CategorySelect,LoadMore,ReceiptButton,charts}.tsx`,
  `app/(dashboard)/finance/integrations/SecretKeyDialog.tsx`, `app/(dashboard)/finance/model/ModelEditor.tsx`, `e2e/finance.spec.ts`.
- Changed: `lib/api/finance.ts`, `hooks/useFinanceApi.ts`, `hooks/useFinancialModel.ts`, `lib/finance/{format,model}.ts`, every page under
  `app/(dashboard)/finance/`, the Finance layout. Deleted: `_components/CategoryInput.tsx`.
- Dependency added: `@mono.co/connect.js@2.3.0` (exact). No API, migration or env change.
- Product copy has no em or en dashes.

## Verification
- `typecheck`, `lint`, `npm test`, `build` and the full Playwright suite on a port that is not 3000 (`e2e/finance.spec.ts`: ledger, integrations
  founder / team member / needs attention / no Mono keys, budgets, receipts, invoices, model, roles, 375 overflow on all seven pages, axe on four).
- Live walk against the local API, founder, team member, mentor and consultant, every control checked against the raw API:
  `docs/checklist/finance-fe-walk.md`.
- **Not verified live:** a real Paystack or Flutterwave connect and sync, the Mono code exchange and bank sync, a provider webhook paying an
  invoice (blocked: test keys are pasted by Adebayo in the re-walk); an overdue invoice and the reminder (needs a DB backdate); the accountant
  role (no account); Cloudinary private signing (local storage only).

## Operate / roll back
Revert the PR; the API is unchanged. Nothing to configure: the Mono card shows "Coming soon" when the API's `connect_config.configured` is
false, and the connect buttons are disabled when `encryption_configured` is false.

## Follow-ups
- BE: runway hiring and one-off rows, invoice `account_id` / notes / payment details, an invoice Resend route, finance context for the Advisor,
  an XLSX export route (all in the walk's findings).
- Receipt thumbnails, an AI "suggest category" for uncategorised rows, a repeat-monthly job for recurring expenses (D-FIN-5).
