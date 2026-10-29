# Notifications: PRD and UI gap list (2026-10-29)

Source of truth: `Cofoundaz_Technical_PRD.md` Module 20 (20.1 Inbox, 20.2 Preferences, 20.3 Digest, 20.4 Archived, API line, entities) and §20.2/20.3 as
referenced by Settings. Designed UI: `# Cofoundaz Web App UI Build/Notifications.dc.html` (tabs Inbox, Preferences, Digest & quiet hours,
Announcements; bell popover). Built page: `app/(dashboard)/notifications/page.tsx` (586 lines), `hooks/useNotifications.ts`,
`components/notifications/notification-preferences.tsx`, `components/notification-bell.tsx`.

**How this was walked:** the page source and hooks read end to end against the designed HTML and the PRD; every control mapped to the raw API with `curl`
as the founder (NovaPay), plus the API source (`notifications.py`, `service.py`, `preferences.py`, `registry.py`). Note: while probing I called
`POST /notifications/read-all` once on the local founder account (marking its 498 local test notifications read); it is local test data. The hand re-walk
at 1440 + 375 for every role is the FE developer's acceptance (`docs/fe-handoff/notifications.md`).

## What the page is today

Real: the feed (`GET /notifications?limit=50`), unread count, mark one / mark all read, the SSE stream, and **email on/off per 5 categories** in Preferences.
Mock or wrong:

- **Default tab is Announcements** ("as requested"); every tab and filter click fires a toast.
- **Filters run on the 50 rows loaded**, and the counts are of those 50. **"Urgent" is always empty**: `categoryFor()` never returns `Urgent`, so "N need you today" is always 0.
- **Dismiss (X) only removes the row from React state**; it returns on reload. There is no archive, no Archived list, no Restore (PRD 20.1, 20.4).
- Only two groups (TODAY, EARLIER THIS WEEK): anything older is mislabelled "earlier this week". No paging (`next_cursor` never used), so the history stops at 50.
- **Preferences** are 5 email toggles; no In app column, no lock on critical alerts, no Push column, no per-module rows beyond 5 (finance, sales, marketing, academy, billing have none).
- **Digest & quiet hours is 100% local state** (digest mode, delivery time, quiet toggle, from, until). `GET /notifications/preferences` already stores these (Settings PR #195) but **nothing sends a digest and quiet hours are not enforced**.
- **Announcements are hardcoded** ("Funding Hub now tracks grants", "Scheduled maintenance, Aug 2"): no PRD section, no API.
- Email for Finance, Sales, Marketing, Validation, Academy and KPI notifications is never sent (those types have no category), including the PRD's locked critical alerts (runway low, invoice overdue).
- `GET /notifications?archived=true` or `?filter=urgent` were silently ignored (unknown query params are dropped).

## Product calls (D-NOT-n), each with the lead's default

| # | Question | Default (built unless told otherwise) |
|---|---|---|
| **D-NOT-1** | Which types are "critical" (locked on, bypass digest and quiet hours)? PRD: payment failed, runway low, compliance overdue, signature requests. | `billing.payment.failed`, `finance.runway.low`, `finance.invoice.overdue`, `document.signature.requested`, `sales.sending.paused`. One constant (`categories.CRITICAL_TYPES`). **They now also email**, which they never did. |
| **D-NOT-2** | The Preferences grid needs a row per module. Should the new rows email by default? | 12 rows (the 5 existing plus Finance, Marketing, Sales, Validation, Academy, AI & insights, Billing). **New rows email OFF by default** (Billing ON); In app ON everywhere. Nobody starts receiving new kinds of email unasked. |
| **D-NOT-3** | Push channel (PRD columns In-app / Email / Push). | **Not built** (no device tokens, no push provider). The grid has In app + Email only; no "coming soon" column. |
| **D-NOT-4** | Announcements tab (design only, not in the PRD). | **Remove the tab.** Fake product news is dishonest, and there is no owner or admin tool to publish it. A later slice if you want it. |
| **D-NOT-5** | Quiet hours: PRD says "push pauses". We have no push; the design says "nothing but urgent reaches you". | Quiet hours **skip non-critical email** during the window (not deferred: the worker has no delayed jobs). In-app is unaffected; critical alerts always get through. |
| **D-NOT-6** | Filter chips: PRD All / Mentions / AI / Deadlines / Billing; design All / Unread / Urgent / Missions / Finance / Team (the built page adds Marketing, Sales). | **All, Unread, Urgent, Mentions, AI, Deadlines, Billing** (PRD set plus the designed Unread and Urgent). Module chips dropped; each row still shows its module icon. |

## Gaps

Severity: **Sec** > **High** > **Med** > **Low**. "FE" = no API change needed.

| # | Gap | Evidence | Sev | Plan |
|---|---|---|---|---|
| N1 | **No archive / restore / archived list; Dismiss lies.** | `handleDismiss` filters local state | High | `archived_at`; `POST /{id}/archive`, `/{id}/restore`, `GET ?archived=true`; archived rows leave list, unread count, read-all. |
| N2 | **Filters and counts are client side over 50 rows; Urgent can never match.** | `categoryFor`, `filteredNotifications` | High | `filter=`, `GET /counts`, `priority` + `module` on every row. FE drops its own categorisation. |
| N3 | **Preferences miss In app, locks, and most modules.** | 5 email toggles; no category for finance/sales/... | High | 12 categories, `in_app` map, `groups` metadata with `critical_types`; critical alerts always delivered (in-app + email). |
| N4 | **Digest does nothing.** | `digest_mode` stored (PR #195), no sender | High | Scheduled per-user digest email (subject "{startup}: your {daily\|weekly} Cofoundaz digest"), cursor `last_digest_at`. |
| N5 | **Quiet hours not enforced.** | stored only | Med | `email_route` skips non-critical email in the window (D-NOT-5). |
| N6 | **Critical alerts never email**; Finance/Sales/Marketing/Validation/Academy/KPI emails are impossible. | `category_for` returned None | Med | Prefix classification + critical bypass (D-NOT-1/2). |
| N7 | **Announcements tab is mock** (D-NOT-4). | hardcoded array | Med | FE: remove tab and the `?tab=announcements` mapping. |
| N8 | **Unknown query params silently ignored** (`archived`, `filter`). | live | Low | Declared and validated: bad `filter` is 422. |
| N9 | **Default tab Announcements, toast on every click.** | page source | Low | FE. |
| N10 | **Sections: only Today / "Earlier this week"; no paging.** | `sectionFor`, `limit=50` | Med | FE: Today / This week / Earlier from `created_at` in the local timezone; "Load more" with `next_cursor`. |
| N11 | **Digest and quiet-hours tab is local state**; delivery-time list has 3 options; no "what still gets through" note; no weekly day or timezone. | page source | High | FE wires to `GET/PUT /preferences` (fields exist); adds weekly day + timezone. |
| N12 | **Empty states**: PRD "All clear. Anything that needs you will show up here."; design "You are all caught up." | page | Low | FE. |
| N13 | **Deep links are hardcoded per type on the client** (`notificationHref`), including `/roadmap/replan`, `/health`. | `useNotifications.ts` | Low | Left as is (works); move server side later (follow-up). |

## Not covered, by decision

Push channel (D-NOT-3), announcements (D-NOT-4), per-type muting, deferring (rather than skipping) quiet-hour email, module chips (D-NOT-6).

## Ledger (2026-10-29)

| Item | State |
|---|---|
| API PR | [Cofoundaz-api#199](https://github.com/innocent98/Cofoundaz-api/pull/199), branch `feature/notifications-be-gaps`, migration `0081_notifications_gaps` (chains after 0077 today; re-chain after Journal 0080 / Billing 0078 / Calendar 0079). Closes N1 to N8. |
| FE hand-off | `docs/fe-handoff/notifications.md` (this PR). FE-only gaps N7, N9 to N13 are in its scope and acceptance rows. |
| Behaviour change | Critical types now also email; five categories keep their email defaults. |
