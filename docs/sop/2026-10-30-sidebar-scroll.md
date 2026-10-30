# Sidebar: scroll the nav list only

**What shipped:** the dashboard sidebar keeps its logo, workspace switcher and footer pinned, and only the nav groups scroll, with a thin themed scrollbar. Commit `db9e63d` on `fix/sidebar-scroll`.

**Why:** on short screens the whole sidebar scrolled, so the switcher and footer moved out of view.

**How:** the sidebar is `overflow-hidden`, and the nav groups sit in a `min-h-0 flex-1 overflow-y-auto` wrapper (`data-testid="sidebar-nav-scroll"`). `overscroll-contain` stops the scroll reaching the page.

**What's involved:** `components/sidebar.tsx` only.

**Verification:** typecheck, lint, `components/sidebar.test.tsx` (9 passed) and `npm run build`. A temporary Playwright check with a mocked API at 1440x600 and 375x640 (sidebar open): the nav scrolled 600px while the sidebar itself stayed at `scrollTop` 0, no horizontal overflow, and at 1440 the workspace switcher menu stayed in view.

**Roll back:** revert the commit. No API or config change.

**Follow-ups:** none.
