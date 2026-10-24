# SOP: Finance slice (e), front-end wiring and final re-check

## What shipped
Branch `feature/finance-slice-e-fe`, one PR to `develop`. Wires the FE to API slice (e) (#184, `cofoundaz-api/docs/fe-integration-guide-finance-slice-e.md`)
and re-checks every open Finance re-walk row (`docs/checklist/finance-rewalk.md`, section "Slice (e) re-check, 2026-10-24").

## Why
API #184 changed the contract: the runway reads the Financial Model's rows (D-FIN-12) and `PUT /finance/runway/assumptions` now 422s on rows;
invoices gained `account_id`, `notes`, `payment_details`, `last_sent_at` and a resend route; there are XLSX exports; a missing receipt file answers 410.

## How
| Area | Change | Decision or trade-off |
|---|---|---|
| Runway | `Runway.model_rows` type; a read-only "From your financial model" card (hires and one-offs, link to `model_rows.href`); the page still sends only the three scalars | No row editor on the runway (D-FIN-12). `model_rows` is optional in the component so an older API cannot crash the page |
| Invoice builder | Client picker (Sales accounts, optional), notes, payment details (4 fields, all-or-nothing, null clears on edit) | The picker prefills name and email (first contact with an email) but the invoice keeps its own copy, as the API does. If Sales is not readable by the role the picker hides and typing still works. Partial bank details are refused locally with one message |
| Invoice view | Shows Sales client, Notes, Pay by bank transfer, "Last emailed" | |
| Resend | Row and View button on sent and overdue; confirm dialog; the API's 429 `RESEND_TOO_SOON` text is toasted as-is | No client-side cooldown: the server owns the 60 s clock |
| XLSX | `downloadFile()` in `lib/api/finance.ts` (blob with auth headers, file name from `Content-Disposition`), shared with the PDF download; "Export Excel" on the ledger (current chip filter passed through) and on the model | Model button disabled unless the model is complete; 409 `MODEL_NOT_READY` has its own message. CSV export kept |
| Receipt 410 | `ReceiptButton` shows the API message on 410 `RECEIPT_FILE_MISSING`, closes the pre-opened tab and calls `onMissing`; Expenses refetches so Attach appears | |
| Advisor | Seed is now a figure-free question ("Give me three ways to extend my runway.") because the API adds the founder's real cash, burn, runway and overdue invoices to the prompt | The old ending "What levers should I look at first?" makes the model return an empty completion (D9), so it is avoided |
| 375 | Runway "Month by month" summary 44 px; model toolbar wraps | |

## What's involved
`lib/api/finance.ts` (+ `finance.test.ts`), `app/(dashboard)/finance/{page,runway/page,invoices/page,model/page,expenses/page}.tsx`,
`_components/ReceiptButton.tsx` (+ test), docs (`finance-rewalk.md`, `buildout-status.md`, this SOP). No API change, no migration, no new dependency.

## Verification
- `tsc`, `eslint`, `npm test` (148 files, 1255 tests), `npm run build`, Playwright `CI=1` on a temp config against `next start -p 3951` (283 passed; config deleted): green locally.
- Live, by hand in the browser pane on `next dev -p 3950` against the shared API, four roles on four hosts: see the re-walk doc for every control, request and response.
- Paystack test payment walked with a test key supplied in chat (pay link, Paystack's Success test option, sync, invoice matched, Paid via Paystack tag, fee row category-only); disconnected afterwards.
- Not exercised: needs-attention banner, non-NGN skipped counts and payout tagging (Paystack test mode gave no payout; unit tests only), the print window and file chooser (pane cannot drive them), Cloudinary receipts.

## Operate / roll back
Revert the PR; the API contract is backward compatible for reads. Local test data created and removed: sandbox bank rows, one expense. Left: invoice INV-2026-004 (sent invoices cannot be deleted).

## Follow-ups
- API: D9 (AI chat empty completion and the job never ends the message), D10 (bank rows editable and deletable through the API).
