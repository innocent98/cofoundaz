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

## Follow-ups
Sidebar entry still hidden (product call); API disclaimer mentions the hidden Marketplace; slices 2 and 3 pages; entity
summary card, IP renewal to compliance item, owner and linked docs (BE rows 8, 15, 22); a live reminder notification walk.
