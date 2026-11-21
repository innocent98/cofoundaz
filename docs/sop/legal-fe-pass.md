# SOP: Legal & Compliance FE pass (Module 13, slice 1)

**What shipped.** `app/(dashboard)/legal/**` moved from a mock (`hooks/useLegalApi.ts`, deleted) to the real API for
Formation, IP tracker and Compliance. PR: `feature/legal-fe` to `develop` (see the PR for the number).

**Why.** API #214 shipped slice 1; the pages still ran on seeded `useState` and toasts (gap rows 1 to 26 in
`docs/checklist/legal-prd-gaps.md`). Contract: `cofoundaz-api/docs/fe-integration-guide-legal.md` (live captures).

## How
- `lib/api/legal.ts`: typed client, `toLegalError`, proof upload and `downloadComplianceProof` (bearer fetch to blob,
  `accessTokenForRequest()`, never `cf_token`).
- `lib/legal-format.ts`: money from minor units, ISO dates without timezone shift, UTC "today" like the API, status labels
  and colours from `derived_status`, calendar grid, notification links.
- `hooks/useLegalResource.ts`: loading / ready / error / forbidden for every list.
- Pages: Formation (`page.tsx`), IP (`ip/page.tsx`), Compliance (`compliance/page.tsx`: list, filters, calendar,
  create/edit/delete, mark done with optional proof, proof attach/replace/download). Shared UI in `_components/`.
- Roles: `useLegalAccess()` gives `canWrite` (founder, team member). A legal advisor sees every list but no write control;
  other roles hit the existing `RouteGuard` denied page and the API 403.
- Decisions: Kenya and Ghana dropped (D-LEG-2); add drawer offers drafting and filed (D-LEG-8); `expired` only derived;
  mark done uploads proof first so a rejected file leaves the filing open; recurring successor found by refetching the list;
  the dead "Docs" button and "entity formed" card were removed (no API behind them).
- **Hidden, not faked:** Templates, Contract review and Advisor requests have no API. Their tabs are gone and their routes
  redirect to `/legal`.
- Notifications: `legal.compliance.*` opens `/legal/compliance?item=`, `legal.ip.renewal_due_soon` opens `/legal/ip?asset=`
  (`hooks/useNotifications.ts`).

## Files
`lib/api/legal.ts`, `lib/legal-format.ts`, `hooks/useLegalResource.ts`, `hooks/useNotifications.ts`,
`app/(dashboard)/legal/{layout,page,ToastContext}.tsx`, `legal/ip/page.tsx`, `legal/compliance/page.tsx`,
`legal/_components/*`, redirect stubs in `legal/{templates,review,requests}/page.tsx`. Tests: `lib/legal-format.test.ts`,
`lib/api/legal.test.ts`, `hooks/useNotifications.test.tsx`.

## Verification
Live walk, `docs/checklist/legal-fe-walk.md`: founder 1440 + 375, team member, legal advisor (1440 + 375), mentor denied,
each write read back from the raw API, on a scratch API stack. Local checks: typecheck, eslint on the touched paths, the three
touched test files.

## Operate / roll back
No config or migration. Revert the PR to return to the mock pages.

## Re-walk fixes (2026-11-13, `fix/legal-rewalk`)
The every-control re-walk on merged develop (`docs/checklist/legal-rewalk.md`) found three small defects, fixed here:

| # | Change | Files |
|---|---|---|
| D1 | `Field` ties its error or hint to the control (`aria-describedby`) and sets `aria-invalid`, so a screen reader announces "Enter a name." | `legal/_components/ui.tsx` |
| D2 | The expired asset's "Update renewal" button is named "Update renewal for <name>" (it was "Edit <name>") | `legal/ip/page.tsx` |
| D3 | A 404 on save (row deleted elsewhere) closes the drawer or dialog, toasts "That … no longer exists." and reloads the list, as the delete flow already did. Before, the stale row stayed. New `onGone` prop on `AssetDrawer`, `FilingDrawer`, `MarkDoneDialog`, `ProofDialog` | `legal/ip/page.tsx`, `legal/compliance/page.tsx`, `legal/_components/ComplianceForms.tsx` |

Test: `legal/_components/ComplianceForms.test.tsx` (404 to `onGone` for all three compliance dialogs, a non-404 stays inline,
field error is the input's accessible description). Live re-check of D3 on IP and Compliance in the re-walk (I17, C22).
Rejected: reloading the list on every drawer close (an extra GET on each Cancel).

## Follow-ups
Slices 2 and 3 pages; entity summary card, IP renewal to compliance item, owner and linked docs (BE rows 8, 15, 22); a live
reminder notification walk; re-walk gap G1/G2 (at 375 the IP and Compliance tables and the calendar scroll sideways, so
row actions start off-screen: a stacked layout below `md`). The sidebar entry is shown again (#257) and the disclaimer's
Marketplace pointer is removed in API #248.
