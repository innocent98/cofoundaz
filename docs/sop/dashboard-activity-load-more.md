# Dashboard Team activity: Load more (re-walk gap 11)

## What shipped
A "Load more" control on the dashboard Team activity card that pages through `GET /dashboard/activity` with `next_cursor`. Branch `fix/dashboard-activity-load-more` (PR to `develop`).

## Why
The card rendered only the first page (20 rows). The API returns `next_cursor`, but nothing used it, so older rows were unreachable (9 of 29 on the walk account).

## How
- `hooks/useDashboardApi.ts`: `useActivityFeed` gains `loadingMore` and `moreError`, kept apart from the page-level `error` so a failed older page never replaces the rows already shown. `fetchMore` is a no-op without a cursor or while a page is in flight. New `appendActivity` dedupes by id, because rows the live `activity.created` stream prepended can reappear at the page boundary. The existing 422 reset-to-page-1 recovery and the `resync` refetch are unchanged.
- `components/dashboard/activity-upcoming.tsx`: `ActivityCard` takes optional `hasMore`, `loadingMore`, `moreError`, `onLoadMore`. The control sits under the list behind a top border, text-link style like the card's Retry (the repo has no "View all" pattern to follow), 44px tall for touch. Label is "Load more", "Loading..." (disabled, `aria-busy`), or on failure "Couldn't load more activity." with "Retry". It is hidden when `next_cursor` is null.
- Pages are already role-correct (API #155 filters rows by role); the FE does no filtering.

## Files
`hooks/useDashboardApi.ts`, `components/dashboard/activity-upcoming.tsx`, `app/(dashboard)/dashboard/page.tsx`; tests in `hooks/useDashboardApi.test.ts`, `components/dashboard/dashboard-cards.test.tsx`, `e2e/dashboard.spec.ts`.

## Verification
- CI gates run locally: typecheck, lint, `npm test`, `npm run build`, `npm run test:e2e` (all green; e2e on a free port since :3000 was taken).
- Unit: append + overlap dedupe, end of feed hides the control, load-more failure keeps rows and retries, button states. Playwright: mocked 2 pages with one 500, retry, duplicate id shown once.
- Live (own dev server against the shared API :8000): founder feed has 65 rows over 4 pages; the card reached all 65 with unique ids equal to the API's, at 1440 and at 375 (no horizontal overflow, button 44px tall), and the button disappeared on the last page. Mentor: 30 rows reachable across pages, none mentioning mission, finance or marketing, no Mission card.
- Not verified live: the failure state (needs a forced 500 on the shared API); unit and Playwright only.

## Operate / roll back
Pure FE; revert the PR.

## Follow-ups
- A `resync` (reconnect or tab focus) refetches page 1 and drops older pages already loaded; the user presses Load more again.
