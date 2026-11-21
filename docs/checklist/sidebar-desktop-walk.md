# Desktop sidebar on short windows: walk

**Verdict: PASS. 24 of 24 viewport × role/page runs pass** (founder on `/dashboard` and `/documents`, accountant on `/documents`; 8 viewports each).
**Date:** 2026-11-18. **Code under test:** this branch (`fix/sidebar-short-viewport`) on FE develop `ac95a4f`, `next dev` on :3105.

**Method, honestly.** A scripted Chrome (Playwright, `walk.mjs` in the evidence folder) opens the page at each size with the API mocked (`/auth/me` returns the role; every other call returns an empty list),
so this walk exercises the sidebar's layout, not API data. It does not use the shared API stack. Checks per run: how many scroll areas exist inside the sidebar; menu items visible at the top;
the active item in view on load; after scrolling to the end, Notifications, Settings & Billing, Security (2FA) and the profile button fully inside the sidebar and not overlapping;
the profile menu opens and Sign out is inside the window; no horizontal page scroll. Raw results: `sidebar-desktop-walk-evidence/results.json`.

| Viewport | Layout used | Founder (18 items) | Accountant (5 items) |
|---|---|---|---|
| 1440×900 | pinned footer, menu scrolls | ✅ 8–9 items visible above the footer | ✅ all 5 |
| 1366×768 | pinned footer (≥ 760 tall) | ✅ 6–7 items visible | ✅ all 5 |
| 1440×700 | whole sidebar scrolls as one area | ✅ | ✅ |
| 1280×720 | whole sidebar scrolls | ✅ | ✅ |
| 1280×600 | whole sidebar scrolls | ✅ | ✅ |
| 1024×640 | whole sidebar scrolls | ✅ | ✅ |
| 375×812 | drawer, whole menu scrolls | ✅ | ✅ |
| 375×520 | drawer, whole menu scrolls | ✅ | ✅ |

In every run: footer links, profile button and Sign out reachable, no overlap, active item in view, **exactly one scroll area** (no double scrollbars), no horizontal scroll.

## Not verified
- Real laptops and browser zoom: simulated only by window size (110–125% zoom at 1440×900 is ≈ 1309×720 CSS px, which the 1280×720 row covers).
- Live API data (role comes from a mocked `/auth/me`); other roles' menus sit between these two.

Evidence: `sidebar-desktop-walk-evidence/` (`*-top.png` first view, `*-end.png` scrolled to the end, `accountant-*-profile.png` profile menu open).
