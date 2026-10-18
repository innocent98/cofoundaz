# Today's Mission: PRD + UI-handoff gap list (live walkthrough, 2026-10-18)

Source of truth: `Cofoundaz_Technical_PRD.md` Module 04 (§04.1 to §04.5) + §2.1 (global top bar), plus the existing designed
pages in this repo (the UI handoff): `/mission`, `/mission/upcoming`, `/mission/completed`, `/mission/streaks`,
`/mission/settings`. Walked live on `develop` (FE `711774a`, API `ce47f2a`) as the local test founder on a Sunday
(weekends off), at 1440px. Every row was checked live and/or confirmed in code.

Legend: ✅ meets PRD · ❌ gap · ⏳ fixed in an open PR

## Works (verified live)
- ✅ Today: H1 + "{Weekday}, {MMM D}", task card (checkbox, title, chips), overflow menu with Reprioritize ↑/↓, Snooze to
  tomorrow, Not relevant → reason chips (Already done / Wrong priority / Doesn't apply) → task removed. "+ Add a task" with
  the placeholder "Add your own task..." creates a task. "View roadmap" link. All-done state "Mission complete." + "That's
  what compounding looks like. See you tomorrow." + confetti + streak chip.
- ✅ Completed: weekly completion % chip and per-day rows.
- ✅ Streaks: "Consistency beats intensity.", current streak, a 13-week heatmap.
- ✅ Settings: mission size 1/2/3, delivery time select (default 6:00 AM), "Weekends off" + "Rest is a strategy too."

## Gaps
| # | Area | Gap (observed) | PRD / handoff | Fix |
|---|---|---|---|---|
| 1 | Settings → BE | **Delivery time is stored but never used.** Generation and "mission ready" run at a global 06:00 (`MISSION_GEN_HOUR`) | §04.5 delivery time; cron at workspace time | BE: scheduler fires per workspace at its `delivery_time` | **Done:** ⏳ BE #135 (delivery_time drives the scheduler). FE: Settings PATCH round-trip verified live (size 3→2→3, 6:00→7:00→6:00, weekends); the BE scheduling itself is unit-tested in the API repo |
| 2 | Notification copy | "Today's mission is ready" with an empty body | "Your mission for today is ready", body = first task title | BE | **Done:** ⏳ BE #135 copy. Not an FE surface |
| 3 | Notification copy | Streak milestone "You hit a mission streak milestone" | "🔥 {n} days straight. You're building a habit most founders never do." | BE | **Done:** ⏳ BE #135 copy. Not an FE surface |
| 4 | Task card | AI **why-line** never rendered (BE sends `reason`) | *"Why: {reason}"* | FE | **Done:** ✅ "Why: {reason}" on every task, verified live (milestone line, then the AI reason once the worker writes it); unit-tested |
| 5 | Task card | No **milestone link chip** for roadmap tasks; the BE doesn't send the milestone | milestone link chip | BE: `milestone {id,title,due_on}` on tasks; FE chip → roadmap | **Done:** ✅ milestone chip → `/roadmap/milestones` on Today, Upcoming, Completed and Assigned; live + unit |
| 6 | Today | No **"Building today's mission from your roadmap…"** state while loading/generating | §04.1 pending state | FE | **Done:** ✅ "Building today's mission from your roadmap…" while loading or generating (observed live while a deleted mission regenerated); no invented defaults anywhere (settings are null until loaded); unit |
| 7 | Today | No-roadmap empty state uses its own copy and links to /roadmap | "Your mission comes from your roadmap." + CTA **"Generate my roadmap"** (`POST /roadmap/generate`) | FE | **Done:** ✅ PRD empty state + "Generate my roadmap" (`POST /roadmap/generate` → refetch). **Not reachable live**: onboarding always creates a roadmap, so no workspace in this stack is roadmap-less; the endpoint call itself was verified live (202 succeeded) and the state is unit-tested for Today and Upcoming |
| 8 | Today | Reject gives no confirmation | toast **"Thanks — I'll calibrate."** (no dash in rendered copy → "Thanks, I'll calibrate.") | FE | **Done:** ✅ "Thanks, I'll calibrate." and "Moved to tomorrow's mission." toasts verified live; reject persisted server-side with the exact reason string |
| 9 | Today | Overflow menu doesn't close on Escape/outside click; "⋯" only visible on hover (unreachable by keyboard); checkbox and "⋯" have no accessible names | a11y | FE | **Done:** ✅ menu closes on Escape (focus returns to "⋯") and outside click, verified live; "⋯" is always visible and focusable; checkbox/"⋯" accessible names; weekend_off + all_caught_up copy; "Assigned to you" section; axe clean in unit tests |
| 10 | Upcoming | Shows roadmap tasks grouped by milestone: **not the next 7 days**, no dates, **no editable order** | §04.2 "next 7 days preview list (read-only, editable order)" | BE: `GET /missions/upcoming` (7-day projection honouring size + weekends) + `PUT /missions/upcoming/order`; FE | **Done:** ✅ 7-day list from `/missions/upcoming`: dates, "Tomorrow", rest days, empty-queue days, "Carried over" tag; ↑/↓ and drag PUT the whole order. Live: reorder changed the next days (Tue/Wed swapped) and persisted across reload; drag verified with synthetic DnD events; hidden for roles that 403 |
| 11 | Completed | Day counts only, plus a stray "1/5"; no log of the completed tasks | §04.3 "reverse-chron log" | BE: `GET /missions/completed` (cursor); FE | **Done:** ✅ log grouped by day from `/missions/completed` with Load more (one page live; cursor paging unit-tested), weekly % chip kept, stray "1/5" removed |
| 12 | Streaks | No **best streak** stat | §04.4 best streak | BE: `best_streak` on history; FE | **Done:** ✅ Best streak stat (live: 1 day), current streak from history. Also fixed a heatmap off-by-one in UTC+ zones (`toISOString` shifted local dates) |
| 13 | Settings | Weekends toggle has no accessible name; size options aren't radios | §04.5 "radio 1/2/3" | FE | **Done:** ✅ real radio group, labelled switch, labelled select; every change PATCHes and persisted across reload (live), toast on save/failure |
| 14 | Shell | The Mission section's top bar lacks the PRD §2.1 global search, so it differs from the dashboard's shell | §2.1 top bar on all `/app` routes | FE: one shared top bar for every page | **Done:** ✅ `ShellTopBar` (⌘K search, Health, bell, + Invite + invite modal) mounted in the Mission layout; `DashboardNavbar` takes a section `title`. Live as founder (Invite modal opened and sent) and as team member (no Invite). **Other section layouts still carry their own headers**: they adopt `ShellTopBar` page by page |
| 15 | Access | TM sees the shared workspace mission; PRD wants TM's own assigned tasks | Module 04 access line | BE `assigned_to_me` (#135); FE "Assigned to you" | **Done:** ✅ "Assigned to you" from `assigned_to_me`, verified live with a freshly invited team member assigned a roadmap task |

## Decisions (lead, 2026-10-18; the user delegated decisions while away)
- **D-MIS-1 Delivery time:** the scheduler generates and announces each workspace's mission at its own `delivery_time`
  (in `SCHEDULER_TIMEZONE`; per-workspace timezones are a recorded follow-up). Opening the page early still generates the
  mission lazily, because a founder who shows up early should get their plan, not a wait screen. So "Building today's mission…"
  shows while it's loading or generating, not as a block before the delivery hour.
- **D-MIS-2 Upcoming:** a read-only projection of the next 7 days from the live roadmap queue (mission size per day,
  weekends skipped when off, today's tasks excluded). "Editable order" = the founder drags tasks to reprioritize. That
  writes a per-task `mission_rank` that the generator respects ahead of the default milestone/due order. Nothing is
  created for future days, so a changed roadmap is always reflected.
- **D-MIS-3 Completed:** `GET /missions/completed` lists completed tasks newest first (title, completed_at, mission date,
  milestone), with cursor pagination. The day rows stay.
- **D-MIS-4 Best streak:** the longest run of consecutive completed missions, computed on read (same rules as the
  current streak, so weekends-off days don't break it).
- **D-MIS-5 Team-member view (revised):** built via `assigned_to_me` (roadmap `assignee_id` already exists), so it is no
  longer deferred to the Team page.
- **D-MIS-6 Shell:** fix the top bar once at layout level, so every page (not just Mission) gets the PRD §2.1 bar.

## Build order
BE (lead): delivery-time scheduling + notification copy + task milestone + upcoming projection/order (migration
`roadmap_tasks.mission_rank`) + completed log + best streak, with tests, a live-captured guide and an SOP. Then one FE
session closes every row, then a live re-walk.

## Follow-ups found during the FE walk
- **BE:** a snoozed task keeps the day `pending` forever (`_maybe_complete` only treats done/rejected as finished), so after a
  snooze the founder can tick everything else and never get "Mission complete." or the streak. Decide: let snoozed count as
  resolved, or carry the day to complete when only snoozed tasks remain.
- **FE shell:** every other section layout still renders its own header; swap them for `ShellTopBar` page by page.
- A completed day hides the "+ Add a task" control (existing design); tasks added via API still appear (fixed: the page no
  longer hides open tasks behind "Mission complete.").
