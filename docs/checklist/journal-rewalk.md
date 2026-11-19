# Journal: click-through re-walk on merged develop

**Verdict: DONE. 198 of 198 role × width checks pass, 0 fail** (64 control rows).

**What was walked (FE #247):** the founder's Journal (Today, All entries, Mood, Reflections, Privacy), passcode set, change and remove, lock and unlock, the lockout after repeated wrong passcodes, forgot-passcode, export and delete; and the six other roles (denied).

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
- A very long (multi-year) journal for the mood chart ranges beyond 12 weeks (only 11 entries over 11 days were seeded; the range chips are checked for the request, not for a long series).
- Retros and the prompt library have no screens (API only, as the build-out row says).
- Per-entry edit or delete is not offered in the All entries tab (only the Today editor edits the day, and "Delete journal permanently" deletes everything); not a defect, noted so nobody looks for it.
- Denied roles get the in-page no-access screen from `RouteGuard`, not a 404.

## Rows

| Control | 1440 | 375 | Evidence / note |
|---|---|---|---|
| tabs: Today, All entries, Mood, Reflections, Privacy | ✅ F | ✅ F |  |
| Today: five mood buttons (Rough, Heavy, Steady, Good, Great) | ✅ F | ✅ F | count 5 |
| Today: stress slider 1–10 starts at 5 | ✅ F | ✅ F | 5 |
| Today: "Another →" swaps the prompt | ✅ F | ✅ F | What would you change if you could repla → Which decision are you avoiding, and wha |
| Today: Dismiss prompt hides it (POST dismiss 200) and it stays hidden after reload | ✅ F | ✅ F | status 200 |
| Today: dismissed prompt stays dismissed on reload | ✅ F | ✅ F |  |
| Today: empty save sends nothing | ✅ F | ✅ F |  |
| Today: live word count updates | ✅ F | ✅ F | 2 words |
| Today: Discard with text asks for confirmation (or clears) | ✅ F | ✅ F | textarea="" Entry discarded. |
| Today: stress label follows the slider | ✅ F | ✅ F |  |
| Today: Save entry → API 2xx; stored mood=good, stress=8, content exact | ✅ F | ✅ F | status 200 api {"mood":"good","stress":8} toast |
| Today: reload restores the saved entry text, mood and stress | ✅ F | ✅ F | textarea "Journal walk entry: testing sa" stress 8 |
| Today: editing and saving again updates the same day (no duplicate) | ✅ F | ✅ F | {"mood":"great"} |
| Privacy: entry text is not stored in plaintext in the database (count of plaintext matches = 0) | ✅ F | ✅ F | plaintext matches: 0 |
| All entries: one row per entry (API count) | ✅ F | ✅ F | UI 11 / API 11 |
| All entries: Expand shows the full text and the button flips to Collapse | ✅ F | ✅ F |  |
| All entries: Collapse works | ✅ F | ✅ F |  |
| All entries: search "zebra" → only the matching entry | ✅ F | ✅ F | rows 1 |
| All entries: search with no match shows an empty state | ✅ F | ✅ F | No entries match. |
| All entries: month filter lists All months + each month with its count | ✅ F | ✅ F | All months / November 2026 (11) |
| All entries: choosing a month requests that month (API month=) and shows its entries | ✅ F | ✅ F | /journal/entries?skip=0&limit=20&month=2026-11 |
| Mood: stats cards match /journal/stats (entries this month, average mood, longest streak) | ✅ F | ✅ F | {"total_entries":11,"entries_this_month":11,"entries_per_week":2.8,"average_mood":"okay","average_mood_score":3.18,"previous_month_average_mood":null,"current_streak_days":11,"longest_streak_days":11, / UI ENTRIES THIS MONTH / … |
| Mood: range chip 4w requests the 4w trend | ✅ F | ✅ F | /journal/mood?range=4w |
| Mood: range chip 12w requests the 12w trend | ✅ F | ✅ F | /journal/mood?range=12w |
| Mood: range chip 6m requests the 6m trend | ✅ F | ✅ F | /journal/mood?range=6m |
| Mood: range chip 1y requests the 1y trend | ✅ F | ✅ F | /journal/mood?range=1y |
| Reflections: every insight card title from /journal/insights is shown | ✅ F | ✅ F | {"insights":[{"kind":"streak","title":"11 days in a row","body":"You have written 11 days running. Your longest run is 11."},{"kind":"great_days","title":"Your best days are on record","body":"3 entries are marked Great. Re-rea… |
| Privacy: daily-prompt toggle flips and saves (PUT settings) | ✅ F | ✅ F | {"passcode_enabled":false,"locked_until":null,"daily_prompt_notifications":false,"evening_reminder":false} → {"passcode_enabled":false,"locked_until":null,"daily_prompt_notifications":true,"evening_reminder":false} |
| Privacy: evening-reminder toggle flips and saves | ✅ F | ✅ F | {"passcode_enabled":false,"locked_until":null,"daily_prompt_notifications":true,"evening_reminder":true} |
| Privacy: toggles persist across reload (aria-checked matches API) | ✅ F | ✅ F | api {"passcode_enabled":false,"locked_until":null,"daily_prompt_notifications":true,"evening_reminder":true} ui true/true |
| Passcode: 2 digits rejected with a message (client or API) | ✅ F | ✅ F | PUT calls +0; Passcode must be between 4 and 12 digits. |
| Passcode: mismatch rejected with a message, nothing sent | ✅ F | ✅ F | Passcodes do not match. |
| Passcode: non-digits rejected with a message | ✅ F | ✅ F | PUT +1 Lock your journal behind a 4 to 12 digit passcode. |
| Passcode: valid passcode saves (PUT 200), settings.passcode_enabled=true, "Passcode set." toast | ✅ F | ✅ F | {"passcode_enabled":true,"locked_until":null,"daily_prompt_notifications":false,"evening_reminder":false} |
| Header shows a "Lock journal" control once a passcode exists | ✅ F | ✅ F |  |
| Change passcode: wrong current passcode is refused with a message | ✅ F | ✅ F | 403 Current passcode |
| Change passcode: correct current passcode → 200 | ✅ F | ✅ F |  |
| Lock journal → locked screen with a passcode field, entries hidden | ✅ F | ✅ F | / Workspace / / / Journal / 🔒 / This one is only yours. / Your journal is encrypted at rest. Private to you: your team, mentors and investors cannot see that entries exist. / Passcode / UNLOCK JOURNAL / Forgot your passcode? / … |
| Locked: API refuses the entry list without an unlock token (no content leaks) | ✅ F | ✅ F | status 423 JOURNAL_LOCKED |
| Locked: API refuses reading an entry by date too | ✅ F | ✅ F | status 423 |
| Locked: API refuses the export without an unlock token | ✅ F | ✅ F | status 423 |
| Lock survives a reload (still locked) | ✅ F | ✅ F |  |
| Unlock with the OLD passcode is refused with a message | ✅ F | ✅ F | That passcode did not match. |
| Repeated wrong passcodes trigger a temporary lockout (429/423) with a message | ✅ F | ✅ F | unlock statuses 403,403,403,403,403,429 · Too many wrong tries. Try again in 15m 8s. |
| API: settings.locked_until is set after repeated failures | ✅ F | ✅ F | {"passcode_enabled":true,"locked_until":"2026-11-12T20:34:39.227560Z","daily_prompt_notifications":false,"evening_reminder":false} |
| Locked screen: "Forgot passcode" opens the reset-with-password dialog | ✅ F | ✅ F |  |
| Forgot passcode: wrong account password refused with a message | ✅ F | ✅ F | status 403 |
| Forgot passcode: correct account password removes the passcode and unlocks the journal | ✅ F | ✅ F | {"passcode_enabled":false,"locked_until":null,"daily_prompt_notifications":false,"evening_reminder":false} |
| Unlock with the right passcode → entries visible again | ✅ F | ✅ F |  |
| API note: the same access token cannot read entries without the journal unlock token (UI holds it in memory) | ✅ F | ✅ F | status 423 |
| Remove passcode: wrong account password refused | ✅ F | ✅ F |  |
| Remove passcode: correct password removes it | ✅ F | ✅ F |  |
| Download all entries: file downloads and contains the entries (plain text, decrypted for the owner) | ✅ F | ✅ F | journal-export.json 1864 bytes; API 200 application/json 1864 bytes |
| Delete: the confirm button is disabled until DELETE is typed | ✅ F | ✅ F |  |
| Delete: lowercase "delete" does not enable it | ✅ F | ✅ F |  |
| Delete dialog closes on Escape (nothing deleted) | ✅ F | ✅ F |  |
| Delete journal permanently: all entries gone (API) and the page says so | ✅ F | ✅ F | API entries 0; toast/page: Journal deleted permanently. |
| Journal is not in the sidebar/menu | ✅ TM, M, BC, AC, INV, LA | ✅ TM, M, BC, AC, INV, LA |  |
| /journal by URL shows the no-access screen, no editor, no tabs | ✅ TM, M, BC, AC, INV, LA | ✅ TM, M, BC, AC, INV, LA | (RouteGuard screen, not a 404/redirect) |
| API GET /journal/entries → 403 | ✅ TM, M, BC, AC, INV, LA | ✅ TM, M, BC, AC, INV, LA | status 403 FORBIDDEN |
| API GET /journal/settings → 403 | ✅ TM, M, BC, AC, INV, LA | ✅ TM, M, BC, AC, INV, LA | status 403 FORBIDDEN |
| API GET /journal/export → 403 | ✅ TM, M, BC, AC, INV, LA | ✅ TM, M, BC, AC, INV, LA | status 403 FORBIDDEN |
| API POST /journal/entries → 403 | ✅ TM, M, BC, AC, INV, LA | ✅ TM, M, BC, AC, INV, LA | status 403 FORBIDDEN |
| API DELETE /journal → 403 | ✅ TM, M, BC, AC, INV, LA | ✅ TM, M, BC, AC, INV, LA | status 403 FORBIDDEN |
