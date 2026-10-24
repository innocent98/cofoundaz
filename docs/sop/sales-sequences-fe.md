# SOP: Sales Sequences, front end

## What shipped
The Sequences sub-page of the Sales Hub runs on the real API (Sales slice B, API #172), and the Sales pages that feed it
gained their hooks: Enrol on a lead row and in the contact drawer, and a follow-up email section in the deal drawer. The
public unsubscribe page is hosted by the FE at `/unsubscribe/[token]`. Branch `feature/sales-sequences-fe`, one PR to
`develop`. Gap rows closed: 15, 19, 20-24 of `docs/checklist/sales-prd-gaps.md` (24: the FE half, the banner and Resume).
After this, every Sales sub-page is on the real API. Contract: API repo `docs/fe-integration-guide-sales-sequences.md`.

## Why
The page was one hardcoded sequence: "+ New sequence" did nothing, steps could not be added or saved, merge chips did not
insert, "Write with AI" had no handler, and nothing could be enrolled, replied to, stopped, or unsubscribed.

## How
| Area | What changed | Decision or trade-off |
|---|---|---|
| Client | `lib/api/sales.ts`: sequences CRUD, enrol, enrollments, replied / stop, sending status and resume, step drafts, deal follow-up, public unsubscribe, plus helpers (`unknownTags`, `previewTemplate`, `waitLabel`, `enrollSummary`, `followUpSendMessage`) | The unsubscribe calls use plain `fetch` with `Accept: application/json`, never `apiClient` (it would attach a token and redirect on 401). Without that header the API 303-redirects to this very page |
| Hooks | `hooks/useSalesSequences.ts`: `useSequences`, `useSendingStatus`, `useEnrollments`, `useStepDraft`, `waitForDraft` (poll every 1.5 s, give up at 90 s with a "slow" outcome) | Same four states as the rest of Sales (`useLoader`). `hooks/useSalesApi.ts` (the last mock) is deleted |
| Sequence card | `components/sales/sequences/sequence-card.tsx`: name, 1-10 steps, wait days 0-60, merge-chip insertion at the caret, preview with a sample contact, Save / Discard (dirty tracking), Pause / Resume, Archive (confirm), "Stop when deal moves stage" | Inline validation mirrors the API (unknown tag wording, step count, days) and API `field_errors` (`steps.<i>.subject`) are shown under the field. The "Stop when they reply" checkbox stays locked: replies are manual (D-SAL-1) and the label says to press Mark replied |
| Empty merge values | A subject using `{{company}}` or `{{last_name}}` shows what it becomes with no value ("Quick idea for") | Guide UX trap: a missing value renders as empty text |
| Write with AI | Per saved step, optional instructions, polls the draft, drops subject and body into the form **unsaved** (a toast says to review and save) | Disabled for steps not yet saved (the endpoint is by saved step index). Failure reasons (`over_budget`, `generation_failed`, ...) are worded, a timeout offers retry |
| People | `enrollments-panel.tsx`: status filter, sender, steps sent of N, next send date, stopped reason, Mark replied, Stop (confirm), paging | A 409 (already ended elsewhere) shows the API's message and refreshes the row |
| Sending banner | `sending-banner.tsx`: not set up ("nothing is sent"), paused after bounces (founder gets Resume, others are told to ask), live with sent today of the daily cap | A cap-delayed step is never shown as failed (the text says it goes out the next day) |
| Enrol | `components/sales/enroll-dialog.tsx` from Leads (row and deep-link card) and the contact drawer; result lists skips with the guide's reasons (no email, unsubscribed or bounced, already in it, converted, not found) | Paused sequences are offered and labelled: enrolled but nothing sends until resumed. Archived ones are not listed by the API |
| Follow-up | `components/sales/follow-up.tsx` in the deal drawer: write, edit, send once with a confirm that says it cannot be recalled | Send errors map to what to do (`SEND_UNCERTAIN`: check your mailbox before retrying). `DRAFT_IN_PROGRESS` adopts the draft already being written |
| Public page | `app/unsubscribe/[token]`: loads status only (never unsubscribes on load), button POSTs, "already unsubscribed" and "You won't hear from X again" states, invalid link page for 404, noindex and no-referrer | A mail client prefetching the link cannot unsubscribe anyone |

Rejected: a "Mark replied" polling or auto-detect (API has none, deferred); a suppression list view (no endpoint);
any paid-plan gate UI (comes with Billing, D-SAL-11).

## What's involved
- New: `hooks/useSalesSequences.ts`, `components/sales/sequences/{sequence-card,enrollments-panel,sending-banner}.tsx`,
  `components/sales/{enroll-dialog,follow-up}.tsx`, `app/unsubscribe/[token]/{page,layout}.tsx`.
- Changed: `lib/api/sales.ts`, `app/(dashboard)/sales/sequences/page.tsx` (rewritten), `app/(dashboard)/sales/leads/page.tsx`,
  `components/sales/{contact-drawer,deal-drawer}.tsx`. Deleted: `hooks/useSalesApi.ts`.
- No API, migration or config change. Product copy has no em or en dashes.

## Verification
- `typecheck`, `lint`, `npm test` (1189 passed incl. `lib/api/sales-sequences.test.ts`, `app/unsubscribe/[token]/page.test.tsx`),
  `build`, and the full Playwright suite (`e2e/sales-sequences.spec.ts`: 10 tests incl. axe on both pages and 375 overflow).
- Live walk against the local API (develop, migration 0069): founder 1440 and 375, team member and mentor at both widths,
  every control checked against the raw API: `docs/checklist/sales-sequences-fe-walk.md`.
- **Not verified live (needs a real send, with Adebayo's OK):** a sent and bounced row, the real paused-by-bounces banner,
  the follow-up Send success path and its limit errors. These are covered by the guide's captured shapes, unit tests and
  mocked e2e only. All enrolments in the walk went into paused sequences so nothing was emailed.

## Operate / roll back
Revert the PR; the API is unchanged. Sending stays governed by the API (`SALES_OUTREACH_*` env). Sequences created in a walk
are archived.

## Follow-ups
- Lead does one live send, then confirms Sent / Bounced rows and the pause banner on a real mailbox.
- Editing a sequence while two members have it open last-write-wins (no version check in the API).
- Inbound reply detection and open/click tracking stay deferred (D-SAL-1).
