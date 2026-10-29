# FE hand-off: Notifications (`/notifications`)

**For:** the FE developer. **Scope:** exactly what is below; nothing else on the page.
**Backend:** API PR [Cofoundaz-api#199](https://github.com/innocent98/Cofoundaz-api/pull/199) (merge first; migration `0081`).
**Contract:** `cofoundaz-api/docs/fe-integration-guide-notifications-inbox.md` (every body captured from a live run; read it end to end; section numbers
below refer to it) plus the older guides it extends (`-notifications.md`, `-read-filter.md`, `-realtime.md`). **Gap list:** `docs/checklist/notifications-prd-gaps.md`.
**Design:** `# Cofoundaz Web App UI Build/Notifications.dc.html`. Files: `app/(dashboard)/notifications/page.tsx`, `hooks/useNotifications.ts`,
`hooks/useNotificationPreferences.ts`, `components/notifications/notification-preferences.tsx` (split into smaller components if it helps). Read `AGENTS.md` first.

## 1. Who sees it

Every role (each sees only their own rows; the API already hides types a role may not open). No role-specific UI. A 401 follows the existing
session-expired redirect in `apiClient`.

## 2. Page shell

Tabs: **Inbox, Preferences, Digest & quiet hours, Archived**. **Remove the Announcements tab**, its `announcements` array, its `?tab=announcements`
mapping and the "Announcements" default (D-NOT-4). **Default tab is Inbox.** Keep the `?tab=` deep link (`inbox`, `preferences`, `digest`, `archived`;
the avatar menu's "Preferences" uses `?tab=preferences`). **Remove every toast that fires on navigation or filter change** ("Switched to ...",
"Filtered by ..."). Toasts only for results of an action (archived with Undo, restored, saved, error).

## 3. Inbox tab

| Control | Behaviour | Endpoint |
|---|---|---|
| Heading line | `{unread} unread · {urgent_unread} need you today` from counts; "Nothing unread" when `unread` is 0 | `GET /notifications/counts` |
| Filter chips | **All, Unread, Urgent, Mentions, AI, Deadlines, Billing**, each with its count from `/counts` (keys `all, unread, urgent, mentions, ai, deadlines, billing`). Choosing a chip refetches the list with `filter=` (no client filtering). Drop the Missions / Finance / Team / Marketing / Sales chips and `categoryFor` | `GET /notifications?filter=` |
| List | Grouped **Today / This week / Earlier** by `created_at` in the browser's timezone (this week = the last 7 days, not today). Row: module icon, `title`, `body` (when not empty), relative time, unread dot, inline CTA (existing `actionText` / `notificationHref` logic stays) | `GET /notifications?limit=20` |
| Critical rows | `priority === "critical"`: pinned look (brass left border on a brass wash, per design `urgent` styling). Use `module` for the icon (map the 15 module strings; unknown -> a neutral dot). **Do not derive urgency or category from `type`** | field on each row |
| Load more | Button under the list when `next_cursor` is not null; sends the same `filter` and the cursor; appends | `GET /notifications?filter=&cursor=` |
| Row click | Existing behaviour: marks read and routes to `href`; a row with no `href` does nothing (no toast) | `POST /notifications/{id}/read` |
| Mark as read (check) | As today (optimistic, then refetch counts) | same |
| **Archive (X, was "Dismiss")** | `POST /notifications/{id}/archive`; the row leaves the list, counts refetch; toast "Archived" with an **Undo** that calls restore. Remove the local-state-only `handleDismiss` | `POST .../archive`, `POST .../restore` |
| Mark all read | Marks the unread ones (archived are skipped); toast "All caught up."; counts refetch | `POST /notifications/read-all` |
| Preferences button | Switches to the Preferences tab | none |
| Realtime | Keep the existing SSE hook: a new `notification.created` event prepends the row only if it matches the active chip, and refetches counts. Rows from the stream now include `archived`, `priority`, `module` | existing stream |

States: loading = three skeleton rows; error = message with Retry; **empty (All chip)** = "All clear. Anything that needs you will show up here.";
empty (other chip) = "Nothing here."; a 422 `VALIDATION_ERROR` on `filter` cannot happen from the UI, treat as a generic error.

## 4. Archived tab

`GET /notifications?archived=true` (paged the same way, newest first, `Load more`). Each row: title, time, a **Restore** button
(`POST .../restore`, row leaves this list, toast "Restored"). No other actions. Empty: "Nothing archived."

## 5. Preferences tab (the grid)

Replaces `notification-preferences.tsx`' five toggles. Build from `GET /notifications/preferences` (guide section 4): a table with a row per entry of
`groups` (use its `title` and `description`, do not hardcode categories) and two switch columns, **In app** (`in_app[key]`) and **Email**
(`categories[key]`). Above the grid keep the master switch "Email notifications" (`master_email`); when it is off the Email column is disabled and
dimmed (as today). A row whose `critical_types` is not empty shows a lock icon with the tooltip **"Critical alerts can't be turned off. They protect your
business."**; its switches stay editable (they control only the non-critical types of that row). **No Push column, no "coming soon" text** (D-NOT-3).
Each switch saves immediately with `PUT /notifications/preferences` (send only the changed key, e.g. `{"in_app": {"sales": false}}`), optimistic with
rollback and an error toast. Footnote: "Turning In app off stops new notifications of that kind from appearing. Alerts that protect your business always
arrive." Loading = skeleton rows; error = Retry. 375 px: the table becomes stacked rows (title + description, then the two switches beneath).

## 6. Digest & quiet hours tab

Wire to the same `GET/PUT /notifications/preferences` (fields in guide section 5). Remove all local `useState` for these.

| Control | Maps to | Notes |
|---|---|---|
| Three cards Off / Daily / Weekly | `digest_mode` = `realtime` / `daily` / `weekly` | "Off" label stays (design); descriptions as designed |
| Delivery time | `digest_time` (`HH:MM`) | A time list 05:00 to 10:00 hourly is enough; show 12-hour labels |
| Weekly day | `digest_day` (0 Monday to 6 Sunday) | Shown only in Weekly mode; replace "each Monday" copy with the chosen day |
| Timezone | `timezone` | A select with the browser zone preselected (`Intl.DateTimeFormat().resolvedOptions().timeZone`) plus Africa/Lagos; sends an IANA name |
| Quiet hours toggle | `quiet_enabled` | |
| From / Until | `quiet_from`, `quiet_until` (`HH:MM`, window may cross midnight) | Options 18:00 to 23:00 for From and 04:00 to 09:00 for Until |
| Explainer (digest card) | static | "Urgent alerts always arrive straight away, so they are not repeated in your digest." |
| Quiet-hours note (replaces the design's "what still gets through") | static | "Email pauses from {from} to {until}. Notifications still appear in your inbox. Critical alerts (runway, overdue invoices, signature requests, payment failures) always reach you." |

Each control saves on change (same optimistic pattern). Do not say "Push pauses" anywhere.

## 7. Bell popover (`components/notification-bell.tsx`)

No redesign. Only requirement: it keeps working with the new row fields and the archive-aware unread count (`/unread-count` already excludes archived).

## 8. Out of scope (do not build)

Announcements, a Push column or push settings, module chips, per-type muting, deleting notifications, marking as unread, changing the bell, email template changes.

## 9. Cross-cutting rules

- Every API call through `apiClient`; keep `ApiError` handling. No hardcoded counts anywhere.
- No em or en dashes in rendered copy. 375 px: tabs and chips scroll horizontally, rows single column, no clipped text.
- Loading, empty and error state for every tab.

## 10. Acceptance = the re-walk rows

Done means every row passes on merged `develop`, at 1440 and 375, as founder, team member and mentor, each result matching the raw API.

| # | Row | Pass when |
|---|---|---|
| 1 | Open `/notifications` | Lands on Inbox; no Announcements tab; no toast |
| 2 | Heading line and chip counts | Equal `GET /notifications/counts` (not the loaded rows) |
| 3 | Each chip (Unread, Urgent, Mentions, AI, Deadlines, Billing) | List equals the same `filter=` call; Urgent rows are the critical ones and look pinned |
| 4 | Scroll history beyond 20 rows | Load more appends with the cursor; filter kept; no duplicates |
| 5 | Groups | Today / This week / Earlier correct in the local timezone |
| 6 | Archive a row, reload | Row gone from Inbox, present in Archived; unread and chip counts dropped; Undo restores it |
| 7 | Archived tab: Restore | Row returns to Inbox; empty state when none |
| 8 | Mark one / mark all read | Dots clear, counts match the API; archived untouched |
| 9 | Preferences: Finance In app off, Email on | Reload keeps both; the lock tooltip shows on Finance; no Push column |
| 10 | Master email off | Email column disabled; In app still editable |
| 11 | Digest tab: Daily, 08:00, timezone, quiet hours 21:00 to 06:00 | Reload keeps all; weekly shows the day picker; notes as written |
| 12 | A realtime event while on the Inbox (trigger `mission.ready`) | Row appears only if it matches the active chip; counts update |
| 13 | Role check | A mentor sees no founder-only types and no error states |
| 14 | 375 px | All of the above reachable; the grid stacks; no overflow |
| 15 | Network failure on a save | Switch rolls back, error toast; skeleton error has Retry |
