# SOP: Sales CRM, front end (Pipeline, Leads, Accounts)

## What shipped
The three CRM sub-pages of the Sales Hub now run on the real API (Sales slice A, API #165, migration 0063). Branch
`feature/sales-fe-a`, one PR to `develop`. Gap rows closed: 2, 3, 4, 6-14, 16-18 of `docs/checklist/sales-prd-gaps.md`.
Sequences, AI Coach and Analytics are **not** touched (slices B and C, a later FE session); they still read the seeded
state that is left in `hooks/useSalesApi.ts`. Contract: API repo `docs/fe-integration-guide-sales-crm.md` (live captures).

## Why
Every Sales page was seeded `useState`: nothing persisted, "Make deal" deleted the lead, the CSV import was fake, the
Dashboard pipeline tile said "Coming Soon". Design: `docs/superpowers/specs/2026-10-21-sales-design.md` §7, D-SAL-2 to 7.

## How
| Area | What changed | Decision or trade-off |
|---|---|---|
| Client | `lib/api/sales.ts`: typed calls for overview, stages, deals, leads (+ CSV preview/commit), accounts, contacts, activities; error helpers; pure helpers (`nairaToKobo`, `dueLabel`, `importSummary`) | `formatMoney` is Marketing's two-decimal formatter (`₦250,000.50`); whole naira would also print `.00`, a single decimal (`₦250,000.5`) looked wrong on a price |
| Hooks | `hooks/useSalesCrm.ts`: `useLoader` (loading / ready / error / forbidden, `reload`, `setData`, `getData`), `useSalesBoard` with an optimistic `moveDeal`, list and detail hooks, `useMembers` (owner names) | The rollback reads the card from a ref, not from inside a state updater: React can run an updater later, so a fast refusal skipped the rollback (found by the hook's own test) |
| Pipeline (6-11) | Columns from `/sales/stages`, header from `/sales`, native drag plus a per-card stage select (touch and keyboard), `+ Add deal`, deal drawer (D-SAL-5), "Edit stages" editor, lost-reason modal, stall badge, `?deal=<id>` deep link | The Won move gives confetti and a screen-reader line, not a toast: the server already dedupes the bell notification to one per day |
| Confetti (9) | `lib/confetti.ts` wraps `canvas-confetti` (the library the Mission page already uses; there is no ConfettiBurst component) | Skipped under `prefers-reduced-motion` |
| Leads (12-14) | Table with Owner and Created, quick-add with email, status select, search and status filter, paging, delete, CSV modal (choose, map, result), "Make it a deal", `?lead=<id>` card | The `source` column is not offered in the mapping: the API stamps every imported lead `csv` |
| Accounts (16-18) | List, `/sales/accounts/[id]` (info panel, contacts, open deals, activity log and notes), contact drawer with "Log activity", `/sales/contacts?contact=<id>` redirect for search hits | A contact activity is logged against the contact and its account so both timelines show it. "Notes" on the account is the `description` field |
| Dashboard (3) | Pipeline tile reads `kpis.metrics.pipeline` (`ok` / `no_data` / `restricted`) and now carries the trend | The tile mapping already handled `ok`; it only needed the live API and the trend |
| Notifications | `sales.deal.won` / `sales.deal.stalled` follow `data.href` (a `/sales` path) and get a Sales filter | Found by a live click: only Marketing hrefs were allowed, so the bell item did nothing |
| Access (2) | Already in `lib/nav-access.ts` (`/sales`: founder, team member) and `RouteGuard`; verified live | |
| a11y / layout | Axe clean on five routes; label contrast raised; a `sr-only` table header made the Leads page 994 px wide at 375 (absolute element with no positioned ancestor), fixed with `relative` on the scroll wrapper | Same class of bug as the Marketing SOP |

## What's involved
- `lib/api/sales.ts`, `lib/confetti.ts`, `hooks/useSalesCrm.ts` (new); `hooks/useSalesApi.ts` trimmed to the sequences and coach mock.
- `app/(dashboard)/sales/{page,leads/page,accounts/page}.tsx` rewritten; new `accounts/[id]/page.tsx`, `contacts/page.tsx`; `ToastContext.tsx` (error kind, `runAction`), `layout.tsx` (`min-w-0`).
- `components/sales/`: `shared` (gate, stall badge, owner select, activity log), `deal-drawer` (drawer, add deal, lost modal), `stage-editor`, `lead-import`, `contact-drawer`, `account-fields`.
- `hooks/useNotifications.ts`, `app/(dashboard)/notifications/page.tsx`, `hooks/useDashboardApi.ts`, `lib/api/dashboard.ts`.
- No API, migration or config changes. Product copy has no em or en dashes.

## Verification
- Local CI parity (the `ci.yml` jobs): typecheck, lint, `npm test`, `npm run build`, `npm run test:e2e`; counts are in the PR.
- Unit: `lib/api/sales.test.ts` (request shapes, errors, money), `hooks/useSalesCrm.test.tsx` (optimistic move, rollback, forbidden), `components/sales/sales-components.test.tsx` (lost modal, stage editor rules, CSV flow), notification and dashboard mapping.
- Playwright `e2e/sales.spec.ts` (mocked with the guide's captured shapes): drag to Lost and Won, refused move, deep links, add deal, stage editor, leads, CSV, accounts, contact drawer, axe, 375 overflow, role denial.
- Live against `:8000`: see the FE-A status table in `docs/checklist/sales-prd-gaps.md`. Founder and team member at 1440 and 375 (43 steps each), mentor and consultant denied at both widths.
- **Not verified live:** the stall badge and the stalled bell item (nothing can age a deal without a database write), the Sales page hits in ⌘K, a real mailbox send (slice B).

## Operate / roll back
No flags or env. Revert the PR; the pages go back to the seeded mock. Test data created by the walk is labelled "Walk test" in the shared workspace.

## Follow-ups
- Control for the stall threshold (`PATCH /sales/settings`, 3 to 90 days).
- "Suggest a follow-up" on a stalled deal (`?followup=1`) waits for slice B's draft endpoint; the drawer shows a plain nudge until then.
- Enroll-in-sequence from a lead or contact row (rows 15, 19) and the Sequences, Coach, Analytics pages (slices B, C).
- The Mission page could use `lib/confetti.ts` instead of its own call.
