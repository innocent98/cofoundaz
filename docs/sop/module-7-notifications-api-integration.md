# SOP — Module 7: Notifications (real API integration — Inbox feed)

## What shipped

The Notifications **Inbox** (`/notifications`) now renders the live feed
(`GET /api/v1/notifications`) instead of hardcoded rows, and **mark-one /
mark-all read** POST to the API. Branch `feat/api-notifications` → PR into
`develop`.

## Why

The Inbox showed a static list of sample notifications and its read actions
only mutated local state. Nothing hit the API.

## How — key decisions

- **New `useNotifications` hook** fetches `GET /notifications?limit=50` and
  `GET /notifications/unread-count` in parallel, and exposes `markRead(id)` /
  `markAllRead()` that POST to `/notifications/{id}/read` and
  `/notifications/read-all` (optimistic, reconcile on non-404 error; a 404 is
  treated as "already gone" per guide §4/§6).
- **Row → UI mapping** (guide §1/§5): `title` is generic per `type` and `body`
  is always `""` in v1, so the hook derives the **icon** and a **filter
  category** from the dotted `type` (e.g. `business.*`/`assessment.*` → Missions,
  `healthscore.*` → Finance, `workspace.*`/`document.*` → Team), a relative
  **time** and a **TODAY / EARLIER THIS WEEK** section from `created_at`, and
  `isUnread` from `!read`. `description` is left `""` (never fabricate a subtitle
  from the empty `body`).
- **Page rewire:** the hardcoded `notifications` state was replaced with the
  hook's `items`; `handleMarkAllRead`/`handleMarkSingleRead` now call the hook's
  API-backed actions. Local dismiss stays client-side (v1 has no delete
  endpoint). The default tab (Announcements) and the Preferences/Digest tabs are
  unchanged (Slice-2 follow-ups).

## What's involved

- `hooks/useNotifications.ts` (new) — feed + unread-count fetch, mark read/all,
  `RawNotification → NotificationItem` mapper.
- `app/(dashboard)/notifications/page.tsx` — consume the hook; removed the
  hardcoded feed + unused local interface.

## Verification (live, staging)

- `GET /notifications` → **200** with the account's **2 real** unread rows
  (`business.artifact.completed` from creating a persona, `assessment.completed`
  from the kickoff assessment); `unread-count` → **2**.
- Inbox renders both under **TODAY**, filter chips read **All 2 / Missions 2**,
  fake sample rows are gone.
- **`Mark all read` verified live:** clicking it drove the server
  `unread-count` from **2 → 0** (`POST /notifications/read-all` persisted).
- Gates: `typecheck` 0 · `lint` 0 errors · **188** unit · clean `build` ✓.

## Follow-ups

- **Bell badge is still hardcoded** across the app shells (a `5` in the
  dashboard navbar + per-route layouts) — wire it to `unread-count` (poll every
  30–60s / on focus per guide §2). Same cross-cutting shape as the `72` Health
  pill.
- **Keyset pagination** (`next_cursor`) — the hook fetches the first 50; add
  "load more" when a workspace exceeds that.
- **Richer per-instance titles** — the backend title is generic per `type`; a
  nicer line ("Ada shared 'Business Plan'") must be built client-side from
  `type` + `data` + a lookup (guide §1).
- **Preferences & Digest (Slice 2)** — `GET`/`PUT /notifications/preferences`,
  quiet hours, email delivery; the Preferences/Digest tabs remain mock.
- **Deep-linking** — switch on `type` and route using `data` fields (guide §5).
