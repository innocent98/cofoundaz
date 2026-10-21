# SOP: Marketing re-walk, front-end fixes (gaps 2, 3, 4, 6, 8)

## What shipped
FE fixes for the gaps logged in `docs/checklist/marketing-rewalk.md`. Branch `fix/marketing-rewalk-fe`, one PR to `develop`.

## Why and how
| Gap | Problem | Fix |
|---|---|---|
| 2 | Export CSV carried `spend` in minor units (30000) with no unit, while the page shows ₦300 | The BE writes the CSV, so `exportAnalyticsCsv` post-processes it with `majorUnitsCsv` (`lib/api/marketing.ts`): spend rows become naira, a `unit` column (`NGN` / `count`) is added. A file that already has a `unit` column is left untouched, so a later BE fix does not double convert. |
| 3 | Month to Week opened on the first week of the month | `weekAnchorForMonth` (`lib/marketing-calendar.ts`): the week of today when today is in the viewed month, else the first of that month. A deep-linked post still sets its own anchor. |
| 4 (FE) | Button said "first week" once posts existed | `Plan my first week` only when the calendar is empty, `Plan another week` otherwise (`calendar/page.tsx`). Past-dated first slot is a BE item. |
| 6 | CAC `₦326.5` on cards vs `₦535.71` in the leaderboard | `formatCac` (always two decimals) used in both places. |
| 8 | Segment name error stayed after a valid name | The name field clears `errors.name` on change once the value is non-empty. |

## Verification
Unit: `lib/api/marketing.test.ts`, `lib/marketing-calendar.test.ts`, `marketing-prd-pages.test.tsx`. Playwright: `e2e/marketing.spec.ts` (three new tests). Live against the local API as the founder at 1440 and 375: downloaded CSV spend rows equal the page (`2026-10-17 ... FE walk push, spend, 2000, NGN` vs ₦2,000), Month to Week showed Oct 18 to Oct 24 on Wed Oct 21, button read "Plan another week", CAC all two decimals, segment error cleared on typing, no sideways scroll at 375.

## Operate / roll back
FE only. Revert the PR. Dev against a local API needs `API_PROXY_TARGET=http://localhost:8000 npx next dev -p <port>` because the API's CORS allows only :3000.

## Follow-ups
Waiting on BE: #161 (render structured readout figures), SEO `stale` flag (Regenerate prompt), search item hrefs (confirm the target routes open the item), media file URL.
