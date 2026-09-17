# SOP — Cross-cutting: real Health pill + notification bell across shells

## What shipped

The hardcoded **`Health 72 ↑`** pill and **`5`** notification badge that were
duplicated across every dashboard route shell now render **real data** (or
nothing). Two shared components replace ~14 inline copies. Branch
`feat/shell-health-notifications` → PR into `develop`.

## Why

Each route shell (`app/(dashboard)/*/layout.tsx`) and a couple of page headers
hardcoded a fake `72` Health pill and a fake `5` bell badge — a lie on every
screen, and 14+ copies to keep in sync. The shared `Sidebar` had its own fake
`5` too.

## How — key decisions

- **Two shared components:**
  - `components/health-pill.tsx` — `<HealthPill className? />` reads
    `useHealthScore` and renders the real score (or **nothing** until an
    assessment exists). Accepts a `className` so each shell keeps its own pill
    styling.
  - `components/notification-bell.tsx` — `<NotificationBell className? iconClassName? />`
    is a `Link` to `/notifications` showing the real `unread-count`
    (`useNotifications`), with the badge **hidden at 0** (and `9+` past nine).
- **Replaced the hardcoded pill + bell** in 14 shells (sales, investor-readiness,
  marketplace, assessment, academy, ai, marketing, finance, documents, legal,
  validation, funding layouts + analytics-reports & notifications pages) — a
  scripted pass for the common markup, hand-edits for the variants (a mangled
  `↑`, inline-`<svg>` bells). Removed now-unused `Bell` imports.
- **Shared `Sidebar`** notifications nav item: its `5` badge is now the real
  `unreadCount`, hidden at 0.
- The `/dashboard` home navbar was already wired (Module 3) and is left as-is;
  the four earlier module shells (health/mission/roadmap/business-builder) keep
  their inline wiring — functionally identical (could be migrated to `<HealthPill>`
  later for consistency, non-blocking).

## What's involved

- `components/health-pill.tsx`, `components/notification-bell.tsx` (new).
- `components/sidebar.tsx` — real unread badge.
- 14× `app/(dashboard)/…` layouts/pages — pill + bell replaced.
- `app/(dashboard)/journal/page.tsx` — removed the lock-screen's decorative `5`.

## Verification (live, staging)

- The `/finance` and `/documents` shells render **"Health 90"** (real, was `72`);
  no `Health 72` remains anywhere.
- The header **bell badge is hidden** (account unread-count is `0`) and the
  **sidebar** "Notifications" item shows **no `5`** — both data-driven (Module 7
  already proved the badge shows the real count, `2 → 0` after mark-all-read).
- Gates: `typecheck` 0 · `lint` 0 errors · **188** unit · clean `build` ✓.

## Follow-ups

- Migrate the four early module shells' inline Health-pill logic to `<HealthPill>`
  for a single source of truth (cosmetic/consistency).
- The analytics-reports header's `History` "activity drawer" control still shows
  a static `5` — it's a different feature (not the notification feed); wire or
  drop it when that drawer is built.
- Poll `unread-count` on an interval / window-focus (guide §2) so the badge
  updates without a full reload.
