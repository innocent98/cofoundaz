# Settings pills frozen after payment

**What shipped:** same-page tabs and filters no longer use `router.replace`, so Settings and Billing pills work after a full page load on `?tab=billing`. Fix branch `fix/settings-pills-frozen`.

## Why
Adebayo reported that after a payment every pill in Settings stopped responding and a refresh didn't help. Keep my plan still worked.

Reproduced on staging (`www.cofoundaz.com`) on a healthy API: 4 of 4 pills dead after loading `/settings?tab=billing`. The click reached React and `router.replace` ran, but the URL stayed the same and no `_rsc` request went out. Router state showed `canonicalUrl: /settings?tab=billing` with a tree for the clicked tab.

**Root cause:** on a soft navigation Next 16.2 takes the URL from the cached route entry, not the requested one (`next/dist/client/components/segment-cache/navigation.js:156`, `route.canonicalUrl + url.hash`). `/settings` is static, so that entry doesn't vary by query string. Once it holds `?tab=billing`, each navigation lands back there and `useSearchParams` never changes. Paystack returns to that URL and a refresh reloads it, which is why it looked tied to payment.

**Not explained:** why a load on `?tab=profile` didn't pin the same way, and an offscreen iframe on `?tab=billing` didn't freeze. Neither changes the fix, which leaves the route cache out of same-page URL changes.

## How
`lib/replace-url.ts` wraps `window.history.replaceState`, which Next documents as integrating with `useSearchParams`. These pages are client-only and need no server round trip.

Rejected: forcing a dynamic render of `/settings` (slower, and leaves the same trap on other static pages); a Next upgrade (no confirmed fix).

## What's involved
| Area | Files |
|---|---|
| Helper | `lib/replace-url.ts`, `lib/replace-url.test.ts` |
| Settings, Billing | `app/(dashboard)/settings/page.tsx`, `components/settings/billing/billing-tab.tsx` |
| Same trap elsewhere | `app/(dashboard)/calendar/page.tsx`, `calendar/meetings/page.tsx`, `calendar/sync/page.tsx`, `sales/coach/page.tsx`, `validation/components/InsightSynthesizer.tsx`, `hooks/useRoadmapBoard.ts` |

Rule from now on: use `replaceUrl` for a same-page query change, `router` only for a different page.

## Verification
- Typecheck, lint, and the touched tests pass locally; CI runs the rest.
- On the frozen staging page, `history.replaceState` changed the page to Profile while `router.replace` did nothing.
- Verified on `www` after deploy (2026-10-31, on `main` via #205): all 12 pills worked on a fresh load of `/settings?tab=billing`, and the 5 re-tested worked after a real reload.
- `www` deploys from `main`, so a develop merge alone doesn't reach it.

## Operate / roll back
No config or migration. Revert the PR to roll back.

## Follow-ups
- Any new same-page tab must use `replaceUrl`.
