# Sidebar on short desktop windows

**What shipped:** the desktop sidebar pins its footer only when the window is tall enough; on short windows the whole sidebar (menu + footer) scrolls as one area, as on mobile. FE PR: see the PR for branch `fix/sidebar-short-viewport` (base develop `ac95a4f`).

**Why:** with Analytics & Reports added (FE #271) the menu got longer, and on laptops (1366×768, 1280×720, browser zoom 110–125%, a docked console) the pinned footer (Notifications, Settings, Security, profile ≈ 230 px) left room for about two menu items. FE #249 fixed width only (`lg:` = 1024px wide).

**How:** a Tailwind v4 custom variant `pinned` in `app/globals.css`: `@media (min-width: 1024px) and (min-height: 760px)`. The sidebar's layout classes in `components/sidebar.tsx` that used `lg:` (footer pinned, upper menu scrolling) now use `pinned:`; outside it the single `sidebar-nav-scroll` area scrolls everything. The 760 px threshold was measured: at 768 tall the pinned layout still shows 6–7 menu items; below it the footer would take over. The aside itself keeps `lg:` (always visible on desktop). Also: `aria-current="page"` on the active link and an effect that scrolls it into view (`block: 'nearest'`). Rejected: a ResizeObserver (more code, flicker), shrinking the footer (still ≈ 150 px).

**What's involved:** `app/globals.css`, `components/sidebar.tsx`, `components/sidebar.test.tsx` (class check + aria-current), `docs/checklist/sidebar-desktop-walk.md` + evidence.

**Verification:** walk of 24 runs (see the checklist doc); lint, typecheck and the sidebar test file pass locally. CI runs the rest.

**Operate / roll back:** revert the PR; no config or API change. To change the threshold edit the one media query in `globals.css`.

**Follow-ups:** none blocking. Real-device check of 110–125% browser zoom.
