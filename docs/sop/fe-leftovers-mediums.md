# FE leftovers: Legal mobile layout, Validation fixes, and re-checks of earlier fixes

**What shipped:** the open FE re-walk leftovers, in one PR from branch `fix/fe-leftovers-mediums` to `develop`
(commits `de100c8`, `21bd0ab` and the docs commit). Legal tables and calendar now work on phones. Three Validation
items are fixed. The Sales, Marketing and #253 fixes that were already in code are now proven live. Record:
`docs/checklist/fe-leftovers-rewalk.md` (33/33 rows pass).

## Why

| Item | Problem | Root cause |
|---|---|---|
| Legal G1 | At 375 the IP (760 px) and Compliance (860 px) tables scrolled sideways inside their cards, and the actions started off-screen | A desktop table with `min-w-[…]` inside `overflow-x-auto`, with no layout for phones |
| Legal G2 | At 375 the Compliance calendar grid scrolled sideways and its entries were 27 px tall | A 7-column month grid with `min-w-[720px]`, the same at every width |
| Validation: notification tab | A "New pattern detected" bell item for a **Surveys** report opened on the Interviews tab | The notification payload has `insight_id` but no `source`, so `hooks/useNotifications.ts` always links to `/validation/interviews?insight=` |
| Validation: Restore name | Screen readers heard "Restore" on every dismissed row | No `aria-label`, unlike Dismiss |
| Validation: feedback field names | The walk's a11y reader saw an unnamed textarea | The form used wrapping `<label>`s. Browsers name controls from these, but readers that only use explicit names do not |
| Sales ×2, Marketing ×2, Validation target clamp | Listed as open in `buildout-status.md` | Already fixed in code (`c0af7ce`, `fix/marketing-rewalk-fe`, the API's `count_ai_content_ideas`, `43f74eb`); the docs were never updated |

## How

- **Stacked cards below `md`** (`app/(dashboard)/legal/ip/page.tsx`, `compliance/page.tsx`): each list renders a
  `<ul className="md:hidden">` of cards and keeps the table in `hidden md:block`, which is the pattern Finance invoices,
  expenses and budgets already use. The cards reuse the same buttons, labels and `ItemActions` as the table rows. The
  shared link buttons already get `max-md:min-h-11`, so every card action is 44 px tall.
- **Agenda below `md`** (`compliance/page.tsx` `CalendarView`): it lists the shown month's days that have filings,
  earliest first. Each entry is a full-width, `min-h-11` button that opens the same detail drawer. Month navigation is
  shared with the grid, which is unchanged at `md` and up.
- **Deep links with two layouts**: rows and cards have different ids (`ip-`/`ip-m-`, `filing-`/`filing-m-`). A new
  `scrollToShown(ids)` in `legal/_components/ui.tsx` scrolls to whichever one is rendered (`getClientRects().length > 0`).
- **Insight link** (`app/(dashboard)/validation/components/InsightSynthesizer.tsx`): a linked `?insight=` report is read
  first. If its `source` belongs to another tab (`SOURCE_PATH`: surveys → Surveys, feedback/all → MVP feedback), the page
  calls `router.replace` to that tab with the same `?insight=`, and that tab opens the report. Rejected alternative:
  changing the bell href, because the payload has no source. That needs an API change (noted below), and the FE
  redirect also covers old notifications.
- **Names** (`components/validation/FeedbackInbox.tsx`): Restore gets `aria-label="Restore: <text>"`. The form fields get
  explicit `<label htmlFor>` and `id` pairs from `useId`.

## What's involved

| File | Change |
|---|---|
| `app/(dashboard)/legal/ip/page.tsx` | Phone cards + `scrollToShown` |
| `app/(dashboard)/legal/compliance/page.tsx` | Phone cards, agenda, `scrollToShown` |
| `app/(dashboard)/legal/_components/ui.tsx` | `scrollToShown` |
| `app/(dashboard)/legal/legal-mobile-layout.test.tsx` | New: cards carry every field/action, read-only for the legal advisor, agenda order / month / 44 px / empty |
| `app/(dashboard)/validation/components/InsightSynthesizer.tsx` (+ `.test.tsx`, new) | Move a linked report to its own tab |
| `components/validation/FeedbackInbox.tsx`, `validation-slice-c.test.tsx` | Restore name, explicit labels |
| `docs/checklist/*` | Re-walk record + evidence, source rewalk docs marked, `buildout-status.md` ticked |

No API, migration or config change.

## Verification

- Local: `npm run typecheck`, `npx eslint` on the touched paths, `npx vitest run` on the touched test files (4 files,
  30 tests pass). CI runs the rest.
- Live: every touched control, at 1440 and 375, for founder, team member, legal advisor and mentor, against a scratch API
  (develop `f2d7ff9a`, stub LLM, worker running). Results and evidence are in `docs/checklist/fe-leftovers-rewalk.md`.
- Not shown live: the deep link's scroll position. The hidden browser pane ignores programmatic scrolling, so only the
  highlight and the choice of target were checked.

## Operate / roll back

Revert the PR. FE only, nothing to deploy beyond the normal web build.

**Running a scratch API for a walk** (the shared stack stays untouched): use an API worktree at `origin/develop` with its
own `.env` of throwaway values (`SECRET_KEY`, Fernet keys generated locally, `LLM_PROVIDER=stub`, `EMAIL_BACKEND=file`,
`REFRESH_COOKIE_SECURE=False`). Set `BACKEND_CORS_ORIGINS` as a **JSON list** that includes every FE host you use
(`http://localhost:3018`, `http://tm.localhost:3018`, …); without it, `POST /auth/refresh` returns 403 and every hard
navigation logs you out. Start the FE with `API_PROXY_TARGET=http://localhost:<port>`; otherwise `next dev` proxies to
**staging**. Turbopack refuses a symlinked `node_modules`, so use an APFS clone instead (`cp -cR`).

## Follow-ups

- Optional API nicety: add `source` to the `validation.insight.detected` payload so the bell links straight to the
  right tab (the FE redirect then becomes a no-op).
- Compliance card actions such as "Edit" are 44 px tall but about 24 px wide. That passes WCAG 2.5.8, and the gaps
  between them are 16 px. Widen them if testing on real phones shows mis-taps.
