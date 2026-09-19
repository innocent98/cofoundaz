# SOP — Remove local mock API route handlers

**What shipped:** deleted all 78 Next.js mock route handlers under `app/api/v1/`
(the local `/api/v1/*` stubs), and repointed the last 3 raw-`fetch` call sites at
`apiClient` so nothing depends on a same-origin local endpoint anymore.

## Why

The mocks were scaffolding from before the real-API integration (25 modules now
wired to `cofoundaz-api`). They had become dead weight and a **honesty hazard**: in
a no-proxy production build, a few screens were still being served *fabricated* data
by these local routes instead of hitting the real API. Removing them makes the app
call exactly one backend everywhere.

## What was true before removal (why it was safe)

| Consumer | Hit the mock routes? | Why |
|---|---|---|
| **Local dev** (`next dev`) | No | `next.config.ts` `beforeFiles` rewrite proxies every `/api/v1/*` → staging, shadowing the local routes. |
| **e2e suite** (`build && start`, no proxy) | No | Each spec mocks the network itself via Playwright `page.route("**/api/v1/…")`. See `e2e/onboarding.spec.ts`. |
| **`apiClient` callers** (prod) | No | `API_BASE = NEXT_PUBLIC_API_BASE_URL` → real API origin, not same-origin. |
| **3 raw-`fetch` callers** (prod, no proxy) | **Yes** | Raw `fetch('/api/v1/…')` ignores `NEXT_PUBLIC_API_BASE_URL` and resolves same-origin → the local mock. These were the only real dependency. |

## How

1. **Repointed the 3 stragglers to `apiClient`** (respects base URL + `Authorization`
   + `X-Workspace-Id` + silent refresh, and fails into an honest empty/no-op state
   instead of serving mock data):
   - `hooks/useAICoFounder.ts` — `useAISuggestions` (`/ai/suggestions` + accept/dismiss/snooze)
     and `useAIMemory` (`/ai/memory` GET/DELETE, clear-all). On error → empty list
     (AI Co-Founder backend isn't wired yet).
   - `components/dashboard/core-engine.tsx` — `AIBriefingCard` "Do it" → `POST
     /dashboard/briefing/{id}/actions/1/accept`, wrapped in try/catch.
   - `lib/api/onboarding.ts` — `uploadOnboardingLogo` now uses `apiClient` (which
     omits `Content-Type` for `FormData`), unwrapping `{data}` if present.
2. **Deleted `app/api/`** entirely (`rm -rf app/api`) — 78 `route.ts` files, ~1.6k
   LOC, no non-route collateral, nothing imported them.
3. **Cleared stale `.next/`** so `tsc` stopped seeing the old generated
   `.next/types/validator.ts` route references, then rebuilt.

## What's involved

- Deleted: `app/api/v1/**` (all mock handlers).
- Edited: `hooks/useAICoFounder.ts`, `components/dashboard/core-engine.tsx`,
  `lib/api/onboarding.ts`.

## Verification

Full CI gate set, all green locally:

| Check | Result |
|---|---|
| `npm run typecheck` | 0 (after `rm -rf .next && npm run build` to regenerate route types) |
| `npm run lint` | 0 errors / 0 warnings |
| `npm test` | 188 passed |
| `npm run build` | clean — no `/api/*` entries in the route manifest |
| `CI=1 npm run test:e2e` | **153 passed** — the decisive proof: e2e runs a prod build with no proxy, so a load-bearing mock would have failed here |

## Operate / roll back

Pure deletion + call-site repoint; no migration. Roll back by restoring `app/api/`
from git history and reverting the 3 edited files. Note the first `typecheck` after
restoring/deleting routes needs a `.next` rebuild to refresh generated types.

## Follow-ups

- AI Co-Founder (chat, suggestions, memory) remains **mock/unbacked** — the chat hook
  still streams a canned response; suggestions/memory now call real endpoints that
  return empty until the Module 03 backend ships.
- When those endpoints exist, no route work is needed — the callers are already on
  `apiClient`.
