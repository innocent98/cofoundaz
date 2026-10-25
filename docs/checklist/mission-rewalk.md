# Today's Mission: full click-through re-walk (develop)

Walked on merged `develop` (FE `5127a6b`, API `0072879`), local stack, 2026-10-19, workspace NovaPay.
Each row: control → action → result checked against the raw API → ✅/❌ → fix.
Roles: F = founder, TM = team member, BC = business consultant, M = mentor (read-only). Viewports 1440 and 375.

## Today (`/mission`), founder, 1440
| Control | Action | Result (API) | | Fix |
|---|---|---|---|---|
| Top bar "+ Invite" | page loaded with an expired access token | Hidden for the founder until a reload: `/auth/me` matches `isAuthEndpoint`, so its 401 never triggers the silent refresh; `useMe` keeps `me=null`, role is null | ❌ | FE: refresh+retry for authenticated `/auth/*` calls (`lib/api/client.ts:17`) |
| Overflow "⋯" → Reprioritize Up | on task 2 | `GET /missions/today` order now Recruit, List, Draft; UI matches | ✅ | |
| Overflow → Reprioritize Down | on task 1 | order List, Recruit, Draft in API and UI | ✅ | |
| Overflow menu: Escape / outside click | open, press Escape; reopen, click outside | 0 menu items after each; focus returns to "⋯" | ✅ | |
| Overflow → Snooze to tomorrow | on Draft | `status: snoozed`, toast "Moved to tomorrow's mission.", card leaves the list | ✅ | |
| Overflow → Not relevant → "Wrong priority" | on Recruit | chips Already done / Wrong priority / Doesn't apply; `status: rejected`, `reject_reason: "Wrong priority"`; toast "Thanks, I'll calibrate." | ✅ | |
| Not relevant: does it calibrate? | next day's generation | Rejected tasks were re-offered the next day | ❌ → ✅ | BE [Cofoundaz-api#143](https://github.com/innocent98/Cofoundaz-api/pull/143) D-MIS-7 (unit-tested) |
| Checkbox complete (roadmap task) | tick List | `PATCH … complete` → `done`; but roadmap task stayed `todo` (re-offered tomorrow, milestone % frozen) | ❌ → ✅ | BE #143 (unit-tested) |
| Checkbox complete, last open task after a snooze | tick custom task with done + rejected + snoozed | Before: day stayed `pending`, no "Mission complete." After #143 (live): `status: complete`, streak 1 → 2, "Mission complete." + sub-copy rendered | ❌ → ✅ | BE #143 (live capture in API guide §8) |
| Checkbox complete when the save fails | forced 500 on the PATCH | Check reverts silently **and the success toast "Nice. Mission progress saved." shows** | ❌ | FE: toggle/snooze/reject/reorder must await the PATCH and toast success only on success, error otherwise (`hooks/useMissionApi.ts:300-366`, `mission/page.tsx:61`) |
| "+ Add a task" | click, type, Enter | input focused, placeholder "Add your own task...", `POST /missions/tasks` 200, custom task listed with "Custom" chip, toast | ✅ | |
| Load error → "Try again" | API briefly down | "We couldn't load today's mission." + Try again → reload recovered | ✅ | |
| Top bar ⌘K search | ⌘K, type "problem", Enter | dialog with Roadmap + Mission groups; Enter navigated to `/roadmap/milestones` | ✅ | |
| Top bar bell | open, Escape | panel lists live items ("Today's mission is complete", 1m ago), "Mark all read", "View all" | ✅ | |
| Top bar "+ Invite" modal | open; Add another person; Cancel | "Invite to NovaPay", 6 roles, second row added (button becomes "Send invites"), Cancel closes | ✅ | |
| Invite with an invalid email | type `not-an-email`, Send | Request still sent; the raw validator text "value is not a valid email address: An email address must have an @-sign." shows **twice** (also for the empty second row) | ❌ | FE (shared `components/team/invite-modal.tsx`): validate client-side, skip empty rows, friendly per-row error |
| Milestone chip | on a task card | links to `/roadmap/milestones` | ✅ | |
| "Ask your AI Co-Founder" (floating) | click | side panel, starter prompts, "AI personalization is paused until 1:00 AM" (local daily budget used) | ✅ | walked with the AI Co-Founder page |

## Upcoming (`/mission/upcoming`), founder, 1440
| Control | Action | Result (API) | | Fix |
|---|---|---|---|---|
| 7-day list | load | matches `GET /missions/upcoming`: snoozed "Draft" first with "Carried over", Sat/Sun rest days, the "Wrong priority" task absent (D-MIS-7 live) | ✅ | |
| Move down | "Describe the problem…" | API order Draft, Quantify, Describe; "Order saved." | ✅ | |
| Move up across a day | first task of Wed | moved into Tue, Describe pushed to Wed | ✅ | |
| Boundary arrows | first ↑, last ↓ | disabled | ✅ | |
| Drag and drop | Describe onto Quantify (DragEvents with a DataTransfer) | API order Draft, Describe, Quantify; persisted | ✅ | |
| Pre-fix data | "Run and note the interviews" done via a mission yesterday still projected on Oct 26 | stale roadmap state from before #143 | ❌ → ✅ | BE #143 migration `0055_mission_roadmap_backfill` (local: 3 tasks fixed, milestone progress 0 → 33% / 14%) |

## Completed (`/mission/completed`), founder, 1440
| Control | Action | Result (API) | | Fix |
|---|---|---|---|---|
| Log + weekly chip | load | grouped by day, newest first, times, milestone chips; "This week: 67% complete" = `weekly_completion_pct` 67; no Load more (`next_cursor` null, 5 items) | ✅ | |
| Day row after snooze/reject | today | 2/2 (snoozed and rejected left out of the total, #143) | ✅ | |

## Streaks (`/mission/streaks`), founder, 1440
| Control | Action | Result (API) | | Fix |
|---|---|---|---|---|
| Stats + heatmap | load | "Consistency beats intensity.", current 2 / best 2 = `/missions/history`; Oct 17 partial shade, Oct 18-19 full | ✅ | |

## Settings (`/mission/settings`), founder, 1440
| Control | Action | Result (API) | | Fix |
|---|---|---|---|---|
| Mission size radio 2 | click | `mission_size: 2`; Upcoming shows 2 tasks/day | ✅ | |
| Delivery time select 7:00 AM | select | `delivery_time: "07:00:00"` | ✅ | |
| Weekends off switch | toggle off | `weekend_missions: true`; Sat/Sun become working days in Upcoming | ✅ | restored to 3 / 6:00 / weekends off |
| Accessible names | a11y tree | the switch has **no accessible name**; the select is named by its value ("6:00 AM"), not "Delivery time" | ❌ | FE: `aria-labelledby` the "Weekends off" / "Delivery time" labels (`mission/settings/page.tsx`) |

## Founder, 375
| Control | Action | Result (API) | | Fix |
|---|---|---|---|---|
| All 5 sub-pages | load at 375x812 | `scrollWidth` 375 on each; the sub-tab strip scrolls horizontally (`overflow-x: auto`, 442 > 343) | ✅ | |
| Overflow menu on a card | tap "⋯" | 4 items inside the viewport (x 143 to 333) | ✅ | |
| Not relevant → "Doesn't apply" | tap | `rejected` / `Doesn't apply`, toast "Thanks, I'll calibrate.", no overflow | ✅ | |
| Upcoming reorder | arrows | same buttons as 1440 (drag is mouse-only; arrows cover touch) | ✅ | |

## Other roles
| Role | Control | Result (API) | | Fix |
|---|---|---|---|---|
| TM (fresh invite `rewalk-tm`) | Invite → signup → verify → accept | Invite email link → signup → verify; after verification the app lands on `/dashboard` (the `/invite/…` next is lost) with 8 "Couldn't load this" tiles; opening the invite link again → Accept → NovaPay dashboard | ⚠ | outside these 4 pages: logged for the Team page walk (verify-email must keep `next`) |
| TM | Today | team mission + "Assigned to you" lists the roadmap task the founder assigned; no "+ Invite" | ✅ | |
| TM | "Assigned to you" row | only a milestone link: the TM can't tick their own task from Mission (roadmap PATCH allows TM) | ❌ | FE session `fe-rewalk-fixes` row 5 |
| TM | Upcoming / Settings | arrows shown; `PUT /missions/upcoming/order` and `PATCH /missions/settings` authorised (F + TM per PRD) | ✅ | |
| TM, 375 | Today | `scrollWidth` 375, mobile tab bar Home / Mission / AI / Notifications | ✅ | |
| Mentor | Login | Routed to `/onboarding`: `GET /onboarding/state` created a founder draft for every invited member | ❌ → ✅ | BE [Cofoundaz-api#144](https://github.com/innocent98/Cofoundaz-api/pull/144) (live: mentor now lands on the NovaPay dashboard) |
| Mentor | Nav | Mission hidden in sidebar and tab bar | ✅ | |
| Mentor | Direct URL `/mission`, `/mission/upcoming`, `/mission/settings` | Full pages rendered: API reads were open to any member | ❌ → ✅ (BE) / ❌ (FE) | BE #143 D-MIS-8: every `GET /missions/*` is F + TM (live 403 captured); FE: no-access state for any route the role can't see (session `fe-rewalk-fixes` row 6) |

## Close-out on merged develop (2026-10-19 evening, API ea7fe95 + #147, FE 3c89d16)
Every ❌ row above was re-checked live after API #142-#147 and FE #110 merged.
| Row | Re-check | |
|---|---|---|
| "+ Invite" with an expired token | forged an expired access token, reload: `/auth/me` 401 → `/auth/refresh` 200 → `/auth/me` 200, "+ Invite" shown | ✅ |
| Save failure toast | forced 500 on complete: check reverts, toast "Couldn't save that. Try again." (no success toast) | ✅ |
| Invite invalid email | `not-an-email` + empty second row: no request sent, one "Enter a valid email address." | ✅ |
| Settings accessible names | switch "Weekends off", select "Delivery time" | ✅ |
| TM ticks own assigned task | "Complete task: Quantify…" in Assigned to you → roadmap task `done`, row drops out | ✅ |
| Mentor direct URL | `/mission`: "You don't have access to this page." + Back to dashboard; API 403 (the page still fires one `/missions/today` request before the guard decides: harmless) | ✅ |
| Mentor login (#144) | `GET /onboarding/state` as mentor → `completed: true`, NovaPay | ✅ |
| BE rows (#143) | merged code is what was verified live on the branch | ✅ |

**Mission: every row ✅ on merged develop (2026-10-19). Page done.**
