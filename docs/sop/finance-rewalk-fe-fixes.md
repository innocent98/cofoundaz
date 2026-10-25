# SOP: Finance re-walk, front-end fixes

## What shipped
Branch `fix/finance-rewalk-fe`, one PR to `develop`. Closes the FE side of the hand re-walk (`docs/checklist/finance-rewalk.md`, PR #157)
defects D2, D3, D4, D6, D8, and applies the Funding labels from `cofoundaz-api/docs/fe-integration-guide-finance-funding.md`
(D-FIN-11: Funding is cash, not revenue).

## Why
| Defect | Problem |
|---|---|
| D2 | "View receipt" opened a blank tab, then pointed it at the signed link. When the file was gone (legacy expense `cbee3c6d`) the founder saw raw `NOT_FOUND` JSON |
| D3 | Invoice cards at 375 had no Auto-remind control; only the desktop table had one |
| D4 | Two formatters: kobo were dropped ("₦45,000.5") and tiles rounded to whole naira while tables showed decimals |
| D6 | Dialog inputs 37 to 38 px, runway chips 26 px, many link buttons 14 to 30 px at 375 |
| D8 | Runway footnote still said funding counts as revenue (false since API #182) |

## How
| Fix | Change | Decision or trade-off |
|---|---|---|
| D2 | `ReceiptButton` fetches the signed link (through `API_BASE`, same-origin proxy in dev) and aborts after the headers. A non-OK answer closes the pre-opened tab and toasts "This receipt is no longer available. Use Replace to upload it again." | Blocked or failed checks (network, CORS) open the link anyway: we only block on a definite 4xx/5xx, so a good receipt is never refused. The tab is still opened synchronously for the pop-up blocker |
| D3 | A labelled **Auto-remind** checkbox on each invoice card (44 px row), same handler and disabled rule (`paid`) as the table | Label beside the box, not a switch, to match the table and the builder |
| D4 | One `formatMoney` in `lib/finance/format.ts`: whole naira when kobo is 0, exactly two decimals otherwise. `formatMoneyWhole` is removed and the tiles use `formatMoney` | The tiles now show kobo too (₦960,166.67). `formatMajor` (the model statement tables, no symbol, whole naira) is a separate dense-table helper and unchanged |
| D6 | `max-md:min-h-11` on `inputCls`, all button classes, `linkBtn`, `dangerLinkBtn`, the modal close, tab nav, filter pills, runway chips, model view tabs and slider, month pickers, the category select, and labels around checkboxes | Desktop sizes unchanged. Inline links inside a sentence ("expenses" in the budgets note) and the app shell header (search, bell, invite) are not Finance controls and are left alone |
| D8 + labels | Runway footnote reworded. Dashboard tiles: "Monthly revenue ... funding excluded" (was "Monthly money in, all inflows") and burn "... funding excluded" | Chart stays "Money in / Money out" |
| Nudge | `lib/finance/funding.ts`: an uncategorised, editable inflow of at least ₦100,000 and at least twice a normal month shows "Categorise as Funding" / "It is revenue" on `/finance` | The trailing revenue already contains a third of the row, so that share is subtracted before comparing, otherwise a big raise raises its own bar and the nudge never fires (caught live). "It is revenue" dismisses for the page session only. Uses only `Transaction.direction/category/source/amount_minor` and `CashFlow.monthly_revenue` |

## What's involved
`app/(dashboard)/finance/_components/{ReceiptButton,ui}.tsx`, `finance/{page,layout}.tsx`, `finance/{invoices,budgets,expenses,runway,model}/page.tsx`,
`lib/finance/{format,funding}.ts` (+ tests), `_components/ReceiptButton.test.tsx`. No API change, no migration, no new dependency.

## Verification
- `tsc`, `eslint`, `npm test` (147 files, 1246+ tests), `npm run build`, Playwright `CI=1` against `next start -p 3002`: all green locally.
- Live in the browser pane on my own `next dev -p 3010` against the shared API (`:8000`), test founder account:
  - 1440 and 375: legacy receipt `cbee3c6d` now closes the tab and shows the toast (no JSON).
  - 375: invoice cards show Auto-remind (44 px); toggling posts and toasts "Auto-remind turned on/off."; restored afterwards.
  - Tiles ₦960,166.67 / ₦1,535,833.33, runway month table ₦1,002,743.75; footnote and tile labels read as above.
  - 375 sweep of every Finance page and dialog (cash, runway, budgets, invoices and builder, expenses and dialog, model, integrations): no Finance control under 44 px.
  - Nudge: seeded an uncategorised ₦9,000,000.50 inflow; banner showed; **Categorise as Funding** moved revenue ₦4,535,833.50 to ₦1,535,833.33 and burn back to ₦960,166.67 with cash unchanged. The seeded row was deleted.
- Not exercised live: a still-present receipt through the real tab (no such row; covered by `ReceiptButton.test.tsx`); a budget limit with kobo (formatter unit-tested instead).

## Operate / roll back
Pure FE; revert the PR. Nothing to configure.

## Follow-ups
- Re-walk rows E9, P8, P13 and the money-format rows on merged develop.
- D2 API half (clear `has_receipt` when the file is gone) is a BE ask.
- Shell header controls (36 px) are an app-shell item, not Finance.
