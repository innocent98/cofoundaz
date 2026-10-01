# SOP — Dashboard fabricated-data cleanup

**What shipped:** removed the hardcoded/fabricated content on the founder dashboard
(`app/(dashboard)/dashboard/page.tsx`) and wired those areas to real data or honest
states, closing a long-standing honesty gap flagged during the PR #74 review.

## Why

The dashboard carried seeded fake content that pre-dated the real-API integration:
seeded notifications ("Tayo returned your NDA…", "Sahel Fund viewed your data
room…"), seeded mission tasks shown before real data loaded, a fully hardcoded
"Next 7 days" panel ("Investor call, Sahel Fund", etc.) while the real `upcoming`
data was fetched but never rendered, and an invite form that `console.log`-ed and
silently closed as if an invite had been sent. All violated the no-fabricated-data
rule.

## How (`app/(dashboard)/dashboard/page.tsx`)

- **Notifications** — replaced the 4 seeded fake items with real data from
  `useNotifications()` (`GET /notifications` + `/unread-count`), mapped into the
  shape the navbar + dropdown already expect. "Mark all read" now calls the real
  `markAllRead`.
- **Mission tasks** — initial state is now `[]` (was 3 fake tasks that flashed
  before the real mission summary populated them).
- **"Next 7 days"** — renders the real `upcoming` items from the summary with an
  honest "Nothing scheduled in the next 7 days." empty state. Note: `mapSummary`
  doesn't surface `upcoming` as a top-level field but preserves the raw payload on
  `summaryData.raw`, so the panel reads `summaryData.raw.upcoming` (array / `{items}`
  / error shapes all handled).
- **Invite form** — no workspace-member invite endpoint exists from the dashboard
  (see `docs/backend-requests-ui-gaps.md`), so the handler no longer fakes a send;
  it shows an honest "Team invites from here are coming soon — this isn't wired up
  yet." notice.

## Verification

| Check | Result |
|---|---|
| typecheck / lint / unit | 0 / 0 / 229 |
| build / e2e | clean / 153 |
| **Live (staging)** | On the test account (which has real data): the "Next 7 days" panel shows the real **"Sketch the solution"**; the notifications dropdown shows **real** items (document-signed, artifact-completed) — no "Tayo"/"Sahel"; the invite form shows the honest "coming soon" notice on submit. No fabricated strings remain. |

## Follow-ups

- Cleaner: add `upcoming` to `mapSummary`'s output + `DashboardSummaryResponse` type
  so the panel doesn't need to read `summaryData.raw`.
- Wire the dashboard invite to a real endpoint once a workspace-member invite API
  exists (backend-blocked today).
- The briefing "Do it" remains client-only — no backend action endpoint
  (`POST /dashboard/briefing/{id}/actions/{index}/accept` is not implemented).
