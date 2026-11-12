# Mobile sidebar: click-through re-walk on merged develop

**Verdict: DONE. 162 of 162 role × width checks pass, 0 fail** (14 control rows).

**What was walked (FE #249):** the sidebar at 375 (drawer: open, one scroll area, footer links reachable, profile menu and Sign out in view, close with X, backdrop and navigation) at 375×812 and at a short 375×520 window, and at 1440×520 (footer pinned while the upper menu scrolls), for all seven roles.

**Date:** 2026-11-12. **Code under test:** FE develop `130167d` (innocent98/cofoundaz) and API develop `e59e1d6f` (innocent98/Cofoundaz-api).
**Scratch stack, not the shared :8000 stack:** a fresh worktree of each repo; Postgres 16 and Redis 7 containers (`rewalk-pg`, `rewalk-redis`) with `alembic upgrade head`
on an empty database; the API on `:8100` with `LLM_PROVIDER=stub`, `EMAIL_BACKEND=file` (verification and invite mails are read from disk) and the per-IP sign-up, resend, forgot
and login limits raised so one machine can walk many accounts (the lockout limit itself, 5 failures per email+IP, is left at its default); the FE as `next dev -p 3102`
proxied to it. Roles: F founder, TM team member, M mentor, BC business consultant, AC accountant, INV investor, LA legal advisor. A cell lists the roles that passed at that
width; `❌ role` failed; `n/a` means the control does not exist for that role or width and the row says why.

**Method, honestly.** A scripted real browser (Chromium via Playwright) clicks and types into every control and compares the result with the raw API (`GET`s made with the same
account's token, the API log of the page's own calls, the mail files, and the database where stated). Screenshots were read by eye for the failure cases and a sample of the passes.
The scripts and raw per-run results are in the shared notes folder (`side-session-notes/.../rewalk-2026-11-12/`: `lib.mjs`, `auth*.mjs`, `team*.mjs`, `journal*.mjs`, `notif1.mjs`,
`side1.mjs`, `ai1.mjs`, `ir1.mjs`, `roles*.mjs`, `all-results.json`), not in the repo. Some rows took more than one run because the first script, not the page, was wrong; every row below is from the final run.


## Findings
None failed.

## NOT verified (labelled, not walked)
- Real phones (iOS Safari URL-bar resizing with `100dvh`); the walk uses Chromium device-size windows only.

## Rows

| Control | 1440 | 375 | Evidence / note |
|---|---|---|---|
| menu closed by default: drawer hidden | – | ✅ F, F*, TM, TM*, M, M*, BC, BC*, AC, AC*, INV, INV*, LA, LA* |  |
| Open sidebar opens the drawer | – | ✅ F, F*, TM, TM*, M, M*, BC, BC*, AC, AC*, INV, INV*, LA, LA* |  |
| exactly one scroll area inside the drawer (no nested scrollers) | – | ✅ F, F*, TM, TM*, M, M*, BC, BC*, AC, AC*, INV, INV*, LA, LA* | scrollable regions: sidebar-nav-scroll 1180/634 |
| after scrolling the drawer to the end, Notifications and Settings links are fully in view | – | ✅ F, F*, TM, TM*, M, M*, BC, BC*, AC, AC*, INV, INV*, LA, LA* | notif {"x":16,"y":607.515625,"width":216,"height":36} settings {"x":16,"y":647.515625,"width":216,"height":36} |
| profile/sign-out trigger is reachable (in view after scroll) | – | ✅ F, F*, TM, TM*, M, M*, BC, BC*, AC, AC*, INV, INV*, LA, LA* | {"x":16,"y":751.515625,"width":216,"height":44} |
| profile menu opens and Sign out is in view | – | ✅ F, F*, TM, TM*, M, M*, BC, BC*, AC, AC*, INV, INV*, LA, LA* | {"x":23,"y":686.515625,"width":202,"height":36} |
| Close (X) hides the drawer | – | ✅ F, F*, TM, TM*, M, M*, BC, BC*, AC, AC*, INV, INV*, LA, LA* |  |
| Tapping the dimmed backdrop closes the drawer | – | ✅ F, F*, TM, TM*, M, M*, BC, BC*, AC, AC*, INV, INV*, LA, LA* |  |
| Choosing a menu item navigates and closes the drawer | – | ✅ F, F*, TM, TM*, M, M*, BC, BC*, AC, AC*, INV, INV*, LA, LA* | /dashboard |
| reopened drawer shows the top of the menu (workspace switcher/first group visible) | – | ✅ F, F*, TM, TM*, M, M*, BC, BC*, AC, AC*, INV, INV*, LA, LA* | scrollTop 0 |
| Sign out from the short mobile drawer works | – | ✅ F | /login |
| sidebar always visible on desktop (no hamburger needed) | ✅ F, TM, M, BC, AC, INV, LA | – |  |
| footer pinned: Notifications, Settings & profile stay put and in view while the upper menu scrolls | ✅ F, TM, M, BC, AC, INV, LA | – | before {"notif":{"y":316,"h":36},"sett":{"y":356,"h":36},"prof":{"y":460,"h":44},"upScroll":"943/135","upTop":0} after {"notif":{"y":316,"h":36},"sett":{"y":356,"h":36},"prof":{"y":460,"h":44},"upScroll":"943/135","upTop":808} |
| upper menu scrolls internally when the window is short | ✅ F, TM, M, BC, AC, INV, LA | – | upper menu 943/135 scrollTop→808 |
