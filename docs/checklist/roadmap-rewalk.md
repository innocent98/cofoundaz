# Roadmap: full click-through re-walk (develop)

Walked on merged `develop` (FE `5127a6b`; API develop plus the re-walk fix branches), local stack, 2026-10-19,
workspace NovaPay. Each row: control → action → result checked against the raw API → ✅/❌ → fix.
Real-model AI was exercised (local daily budget reset for the walk).

## Timeline (`/roadmap`), founder, 1440
| Control | Action | Result (API) | | Fix |
|---|---|---|---|---|
| Header + stage rail | load | "Your path from Idea to profitability…", rail Idea, Validation, Build, Launch, Growth, Scale | ✅ | |
| Phase label | load | "PHASE 0: SHAPE THE IDEA", "PHASE 1: FIRST SIGNALS": renders the zero-based `order` | ❌ | FE `roadmap/page.tsx:260` `Phase {phase.order}` → order + 1 |
| Week / Month / Quarter | click each | axis rescales (weekly ticks Oct 10 … Jan 2; months; quarter boundary), pressed state moves | ✅ | |
| "Re-planned" chip | hover/a11y | labelled "Re-planned. Adjusted on Oct 18, 2026 because 8 days overdue and not yet done." = API `replanned` | ✅ | |
| Add phase | name + Enter | `POST` → phase "Rewalk test phase" `order` 2, rendered | ✅ | |
| "+ Milestone" | on the new phase | inline title → milestone created (no date, 0%, 0 tasks) | ✅ | |
| "N tasks" expander | "19 tasks" | `aria-expanded` false → true, task list shown, collapses again | ✅ | |
| Delete phase | confirm | native confirm "Delete phase … and everything under it?"; phase gone from `GET /roadmap` | ✅ | |
| Milestone card | Enter from the keyboard | drawer opens (`role=dialog`, labelled), focus inside; Escape closes; focus returns to the card | ✅ | |

## Milestone drawer, founder, 1440 (and 375)
| Control | Action | Result (API) | | Fix |
|---|---|---|---|---|
| Title | edit | `title` "Rewalk milestone edited" | ✅ | |
| Details | type, Tab out | `description` saved on blur | ✅ | |
| Due date / Owner | set Nov 15 / rewalk-tm | `due_on` 2026-11-15, `owner.id` = rewalk-tm | ✅ | |
| Add task | Enter, and the "Add task" button | two tasks created | ✅ | |
| Task assignee / due / done | set, tick | `assignee` rewalk-tm, `due_on` 2026-11-10, `done`; milestone 50% | ✅ | |
| Task "not done" | tick again | back to `todo`, 0% | ✅ | |
| Delete task | confirm | removed | ✅ | |
| "Break down" (real model) | click | "Breaking this down…" → "Added 5 tasks." (5 relevant titles appended, no dashes) | ✅ | |
| "Break down" twice at once | two concurrent `POST …/breakdown` | **both 202**, two jobs ran (10 near-duplicate tasks appended to "Sketch the solution") | ❌ → ✅ | BE `fix/roadmap-rewalk`: row lock before the running-job check; live after: 202 + 409 `BREAKDOWN_IN_PROGRESS`; UI shows "I'm already breaking this milestone down." and one job adds 4 |
| Comment with @-mention | type `@rew`, Enter, post | autocomplete → `mention_user_ids` [rewalk-tm]; TM got "You were mentioned by Victor Founder: …" | ✅ | |
| Edit comment | Save | body updated, `edited_at` set, mention kept, "edited" label | ✅ | |
| Resolve / Reopen thread | click | `resolved_at` set → "Reopen thread" → null | ✅ | |
| Delete comment | inline "Delete this comment? Yes / No" | No keeps it | ✅ | |
| Task-level "Comments" | toggle, post | `aria-expanded` true; comment on `roadmap_task` | ✅ | |
| Status select / "Mark Milestone Complete" | click | Milestone `done` but its 6 tasks stayed `todo` at 0%, and they stayed in the mission queue | ❌ → ✅ | BE `fix/roadmap-rewalk` D-RM-5: completing a milestone completes its open tasks (live: done, 100%, 6/6 done); reopening leaves the work done |
| Delete milestone | confirm | removed from the phase | ✅ | |
| 375 | open drawer, post a comment | drawer 0-375, no horizontal scroll, comment saved | ✅ | |

## Kanban (`/roadmap/kanban`), founder, 1440
| Control | Action | Result (API) | | Fix |
|---|---|---|---|---|
| "Move to" select | Document how people… → In Progress | `in_progress` | ✅ | |
| Drag to Done | DragEvents onto the Done column | `done`; card in Done; milestone 33% → 50% | ✅ | |
| Group by Phase / Status | toggle | phase columns with milestone cards / status columns | ✅ | |
| Card title (task / milestone) | click | opens the milestone's drawer | ✅ | |

## Milestones (`/roadmap/milestones`), founder, 1440
| Control | Action | Result (API) | | Fix |
|---|---|---|---|---|
| Table | load | title, phase, owner, due, progress, dependencies ("3 dependencies" → `/roadmap/dependencies`), status, Re-planned | ✅ | |
| Actions → Edit | click | opens the drawer | ✅ | |
| Actions → Delete | confirm (cancel, then OK on a throwaway) | cancel keeps it; OK removes it | ✅ | |
| Break down (row) | double click | one job (+4 tasks), second click "I'm already breaking this milestone down." | ✅ | after the BE lock fix |

## Dependencies (`/roadmap/dependencies`), founder, 1440
| Control | Action | Result (API) | | Fix |
|---|---|---|---|---|
| Create link | prerequisite + dependent, Add Dependency | edges 3 → 4, graph and list updated | ✅ | |
| Cycle guard | reverse link | refused: "That would create a loop, … already depends on …" (no dash rendered); edges stay 4 | ✅ | |
| Remove dependency | click | edges 4 → 3 (no confirm) | ✅ | |

## Templates (`/roadmap/templates`), founder, 1440
| Control | Action | Result (API) | | Fix |
|---|---|---|---|---|
| Preview | Company formation | modal lists phase, milestones, tasks with effort | ✅ | |
| Apply → "Apply this pack" → "Confirm & apply" | click | "Applied "Company formation", added 1 phase, 2 milestones, 4 tasks."; phase "Incorporation"; card shows "Applied" + "Re-apply" | ✅ | |
| Preview modal keyboard | Escape; focus on open | **Escape doesn't close it and focus stays on the page behind**; the Close button works | ❌ | FE: Escape + initial focus + return focus on the template preview and confirm modals |

## Re-Plan (`/roadmap/replan`), founder, 1440
| Control | Action | Result (API) | | Fix |
|---|---|---|---|---|
| On-track state | load | "You're on track, no milestones have slipped." + history | ✅ | |
| Check for adjustments | with one milestone made overdue (Oct 10) | proposal "+16 days", Oct 10 → Oct 26, reason "9 days overdue and not yet done." | ✅ | The on-track banner stayed because I made it overdue from outside the open page; on load an overdue milestone shows "1 milestone has slipped" (`slippedCount`) |
| Accepted / Rejected toggle | click twice | "Apply 0 changes" (disabled when none accepted) ↔ "Apply 1 change" | ✅ | |
| Apply | click | `due_on` 2026-10-26, `replanned` set; new history entry | ✅ | |
| History entry | click | expands to the change rows; no `aria-expanded` | ❌ (a11y, minor) | FE: `aria-expanded` on history rows |

## 375, founder
| Page | Result | | |
|---|---|---|---|
| All 6 sub-pages | `scrollWidth` 375, no unclipped overflow (timeline scrolls inside "Roadmap timeline, scroll sideways") | ✅ | |

## Other roles (PRD access F, TM, M, BC; edits F + TM; comments everyone but investors)
| Role | Control | Result (API) | | Fix |
|---|---|---|---|---|
| Consultant, 375 | Timeline + drawer | no Add phase / Milestone / Delete / Break down / field editors; comments only | ✅ | |
| Consultant | Comment with @Victor | posted; founder notified "You were mentioned by A teammate: …"; Edit/Delete only on their own comment | ✅ | "A teammate" is the app-wide fallback for members without a name |
| Team member | Timeline | Add phase, Milestone, Delete phase shown (editor) | ✅ | |
| Team member | Notifications | mention from the founder received | ✅ | |

## Close-out on merged develop (2026-10-19 evening, API ea7fe95 + #147, FE 3c89d16)
Every ❌ row above was re-checked live after API #142-#147 and FE #110 merged.
| Row | Re-check | |
|---|---|---|
| Phase labels | PHASE 1: SHAPE THE IDEA, PHASE 2: FIRST SIGNALS, PHASE 3: INCORPORATION | ✅ |
| Template preview keyboard | Enter on Preview → focus inside (Close), Escape closes, focus back on Preview | ✅ |
| Re-plan history a11y | `aria-expanded` + `aria-controls` on entries | ✅ |
| BE rows (#145) | merged code is what was verified live on the branch (202 + 409, milestone complete → tasks done) | ✅ |
