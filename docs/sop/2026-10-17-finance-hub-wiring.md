# SOP: Finance Hub wired to the real Finance API

**What shipped:** every Finance page (cash flow and transactions, runway, invoices, expenses, budgets, financial model, integrations) now reads and writes the real `/api/v1/finance/*` backend. The mock hook, the hardcoded rows and the fabricated "Connected as GTBank, synced 2h ago" state are gone. Branch `claude/wire-finance-hub-4aa355`, one PR to `develop`.

## Why

The backend for Module 12 was complete across six slices (cash flow, runway, invoices, expenses, budgets, AI model) with live-captured guides, while the FE was entirely mock. Goal: no fake numbers, no fake saves, no dead buttons, and honest states everywhere. This also unblocks the dashboard revenue and runway tiles, which can now show real data.

## How

| Decision | Reason |
|---|---|
| `lib/api/finance.ts` typed SDK (one function per route, `data` unwrapped, minor units everywhere) plus `toFinanceError` | Mirrors `lib/api/dashboard.ts`. `toFinanceError` returns the API's own message, per-field errors (including the `""` and `query.x` keys from the guides) and a `forbidden` flag |
| `useFinanceResource` generic hook with `loading / ready / error / forbidden` | Every list gets the same four states. A 403 renders "Not available for your role", never a crash. Stale responses are dropped (month switching); a failed background reload keeps the last good data |
| Writes go through `useFinanceAction` (busy flag, success toast, API error toast, or inline field errors for forms) | The API has no idempotency key on money POSTs, so every submit disables while in flight |
| Display helpers in `lib/finance/format.ts`: `toMinor` parses typed amounts by string, never floats | `19.99` becomes `1999` exactly. Runway screen speaks NGN thousands, converted at the boundary (x 100,000 kobo) |
| Runway headline tests `=== null` and `=== 0` separately; empty workspace is detected from the baseline before showing "out of cash" | Straight from the runway guide: null means never runs out, 0 means out now |
| Banner on Cash Flow is driven by `runway_low`, never by a null `runway_months` | Cash-flow guide trap (3) |
| Ledger rows with `source` `invoice` or `expense` have no edit or delete, with a link to the parent | The API 422s on them; hiding is better than failing |
| Invoice builder preview is advisory; after save the list re-renders from the server response | Server computes totals and ignores ours. Send is behind a confirm dialog (one-shot, emails the client) |
| Budgets and Expenses share one category picker; seeders refetch the month | Budget "spent" matches the category string exactly; seeder responses contain only newly created rows |
| Financial model polls 2s for 10s then 5s, gives up honestly at 60s with "Check again"; `failed` shows the API error and a Regenerate button | Per the model guide. Sensitivity slider is client-side and P&L only, labelled as such; export is a client-side CSV (XLSX deferred by the BE) |
| "Print or save as PDF" opens a print view of the invoice | No server PDF endpoint exists |
| Integrations: four providers shown as "Not connected" with a disabled "Coming soon" button | See blocker below. Nothing is faked |
| Removed from `layout.tsx`: the dead "+ Invite" button (no member-invite endpoint exists) | A dead button is worse than none. The mobile menu button now opens the sidebar and tabs are real links |
| Server-built text containing em dashes (e.g. `Invoice INV-... - Client`) is passed through `plainText` | No em or en dashes in rendered copy |

## What's involved

| Path | Change |
|---|---|
| `lib/api/finance.ts`, `lib/api/finance.test.ts` | SDK, types, error mapping |
| `lib/finance/{format,invoiceMath,model,printInvoice}.ts` (+ tests) | Money/date helpers, invoice preview math, sensitivity and CSV, print view |
| `hooks/useFinanceResource.ts`, `hooks/useFinanceApi.ts`, `hooks/useFinancialModel.ts` (+ tests) | Resource hook, per-area data hooks, async model polling |
| `app/(dashboard)/finance/**` | All pages rewritten; `_components/ui.tsx` (states, modal, confirm), `_components/useFinanceAction.ts`, `_components/CategoryInput.tsx`; `ToastContext` gained an error kind |

No migrations or config. No backend changes.

## Verification

Live on the local full stack (backend in docker on :8000, `API_PROXY_TARGET=http://localhost:8000 PORT=3002 npm run dev`), throwaway founder account, in the in-app browser:

| Page | Exercised live |
|---|---|
| Cash flow | Empty state; add (money in, money out); inline categorize; edit; KPI tiles recomputed from the API (burn, runway); invoice-managed row is read-only; delete (confirm) |
| Runway | Scenario tabs; save assumptions (PUT, scenarios updated, persisted after reload); empty state when no data |
| Invoices | Server validation error inline (bad email); create draft; edit draft; send (confirm); auto-remind toggle; mark paid (cash on hand rose by exactly the total, ledger row appeared); mark unpaid (cash back to prior value); create second draft and delete it |
| Expenses | Create; reject a .txt receipt client-side; attach PNG; replace with PDF; remove receipt (confirm); recurring toggle; edit; month switch and breakdown; delete (confirm) |
| Budgets | Draft from actuals; create (over-budget styling, 125%); duplicate category shows the API message; edit limit and notes; copy last month; delete |
| Model | Generate (202, polled, completed with real AI assumptions); statement tabs; sensitivity; CSV export |
| Integrations | All four "Not connected", buttons disabled |
| Role | 403 simulated by stubbing `fetch` on the budgets page: "Not available for your role" |

CI gates run locally: `npm run typecheck`, `npm run lint`, `npm test` (39 files, 309 tests), `npm run build`, `npm run test:e2e` (153 passed). All green. Not run: none of the workflow's steps were skipped.

Not exercised live: a real non-finance role (403 simulated), the low-runway banner button "Ask Finance Advisor" (only shown when runway is low), the browser print dialog, receipt "View" for an `https` URL (local storage returns a filesystem path, so the UI shows "On file").

## Operate / roll back

Pure FE change; revert the PR. The backend is untouched.

## Follow-ups

- **Integrations (the one remaining blocker):** bank, QuickBooks, Xero and Stripe connectors have no backend because they need OAuth and real third-party accounts. The page is honest and disabled until that exists.
- Member invite has no endpoint, so the "+ Invite" button was removed from the Finance header (other hubs still carry a dead one).
- Account cleanup limits: a sent invoice cannot be deleted and models cannot be deleted, so the test account keeps `INV-2026-001` (sent) and one generated model.
- Single currency per workspace: forms use NGN; multi-currency is unsupported by the BE.
