# Roadmap: PRD + UI-handoff gap list (live walkthrough, 2026-10-18)

Source: `Cofoundaz_Technical_PRD.md` Module 05 (§05.1 to §05.6) + the existing pages (`/roadmap`, `/kanban`, `/milestones`,
`/dependencies`, `/templates`, `/replan`). Walked live (FE `develop` + API `feat/health-live-signals`) as the local test founder
at 1440px.

## Works (verified live)
- ✅ H1 "Roadmap" + sub "Your path from {stage} to profitability, I re-plan it when reality changes."; Week/Month/Quarter zoom;
  phases → milestones on the timeline; "Add phase", "+ Milestone", delete phase.
- ✅ Milestone drawer: due date, owner, status select, tasks (done/delete/add), "Mark Milestone Complete".
- ✅ Kanban: group by Status/Phase, draggable cards. Templates: gallery with Preview/Apply. Re-plan: on-track state, "Check for
  adjustments", history. Dependencies: create link + list.

## Gaps (all 11 closed on the FE, 2026-10-18)
| # | Area | Gap (observed) | PRD | Fix | Status |
|---|---|---|---|---|---|
| 1 | Stage rail | "Idea / Validation / Launch / Traction / Scale" (5): no **Build**, "Traction" isn't a stage | Idea→Scale = the 6 real stages | FE: rail from the API stages (idea, validation, build, launch, growth, scale) | **Done:** ✅ rail from the six real stages (Idea, Validation, Build, Launch, Growth, Scale), current marked `aria-current="step"`, earlier stages tinted; unit + live |
| 2 | Milestones | **"Break down" has no handler** (dead) and the "⋯" menu is dead; there's no AI breakdown backend | "Ask AI to break this down" (generates tasks); row actions edit, delete | BE: `POST /roadmap/milestones/{id}/breakdown` (AI job); FE: wire + edit/delete menu | **Done:** ✅ "Break down" on Milestones and "Ask AI to break this down" in the drawer start `POST /roadmap/milestones/{id}/breakdown`, poll `/jobs/{id}` every 2s (60s cap), refetch and highlight `created_task_ids` ("Added 4 tasks.", green "New" rows). 409 shows "I'm already breaking this milestone down.", `over_budget`, `failed`, `gone` and timeout have their own copy. "⋯" is an accessible menu (Edit/Delete; Open for read-only roles). Live with the real LLM (4 tasks added; 409 forced while a job ran); the other states are unit-tested. BE ⏳ API #137 |
| 3 | Milestones | No **Owner** and **Dependency count** columns (the API already sends `owner`, `dependency_count`) | table columns | FE | **Done:** ✅ Owner and Dependencies columns (name, else email, else Unassigned; "N dependencies" links to the graph); dates read "Oct 10, 2026"; verified live |
| 4 | Drawer | Owner and task assignee/due are **display-only**; there's no members list to pick from | assignee, due date | BE: `GET /team/members`; FE: pickers (PATCH already supports `owner_id`/`assignee_id`/`due_on`) | **Done:** ✅ owner and task assignee pickers over `GET /team/members` (name, else email; "Unassigned" sends `null`), milestone and task due-date inputs, editable title and details. Founder and team member edit; every other role reads. Live: owner and assignee set and persisted (Timeline card showed the email for a null name); unassign + due date unit-tested. BE ⏳ API #137 |
| 5 | Drawer | No **dependencies** section | details, tasks, dependencies, comments | FE (from `/roadmap/dependencies`) | **Done:** ✅ drawer "Dependencies" section ("X is blocked by Y" per task, Manage → graph page). Unit-tested; the Dependencies page itself verified live (3 links created from the form) |
| 6 | Drawer | No **comments** thread; no comments backend at all | comments (Module 23.2 thread) | BE: generic comments API (entity, mentions → notification, resolve); FE thread | **Done:** ✅ comment thread on every milestone and (per task) in the drawer: @ autocomplete sends `mention_user_ids`, mentions highlighted, edit and delete only when `is_mine`, inline delete confirm, Resolve / Reopen thread, investors read-only, errors with Retry. Live: post with a mention (id persisted), edit, resolve, reopen, delete, empty state; a task-entity comment via API opens expanded from the deep link. BE ⏳ API #137 |
| 7 | Timeline | No "↻ Re-planned" chip/tooltip, no task expansion under milestones; "Overdue" chip not shown on the timeline (the API sends `replanned`, `overdue`, tasks) | §05.1 | FE | **Done:** ✅ Timeline is now laid out by real dates (axis, Today line at its true date, Week/Month/Quarter zoom actually rescales), "Overdue" chip, "Re-planned" chip with tooltip "Adjusted on {date} because {reason}" (also in drawer, Kanban and Milestones), tasks expand under each milestone. Live: forced overdue, applied a re-plan, chip appeared |
| 8 | Dependencies | **No graph view** (list only) | graph view (nodes/edges) + list | FE: SVG graph from `/roadmap/dependencies` | **Done:** ✅ SVG graph (prerequisites left, arrows to what they block, done and overdue tinted) above the existing list, with an accessible summary. Live: 3 links, 3 layers; layout is unit-tested |
| 9 | Kanban | Card click doesn't open the drawer; no keyboard alternative to drag | "same drawer" | FE | **Done:** ✅ card titles open the drawer; each task card has a "Move to" select as the keyboard alternative to drag; Phase view cards open too. Live: moved a task To Do to In Progress |
| 10 | Notifications | No "Milestone due soon"; overdue copy is generic | "Milestone due soon: {title}, {relative_time}" · "Milestone overdue, I've drafted a re-plan for your review" CTA "Review re-plan" | BE | **Done:** ✅ FE deep links: due soon opens `/roadmap?milestone=`, a @ mention opens the milestone (or the task's milestone with that thread expanded), overdue goes to `/roadmap/replan`; Team category and icon for `team.*`. Unit-tested and the `?task=` and `?milestone=` links walked live. **Not seen live:** a notification actually arriving (it needs a second logged-in member). BE ⏳ API #137 |
| 11 | Drawer a11y | The drawer isn't a dialog (no role/label, focus) | a11y | FE | **Done:** ✅ drawer is `role="dialog"` `aria-modal` labelled by the milestone, focus moves in and returns to the opener, Esc closes, Tab is trapped; template modals got dialog roles too; unit-tested, verified live |

## Decisions (lead, 2026-10-18; delegated)
- **D-RM-1 Breakdown:** an async AI job (202 + `job_id`, poll `GET /jobs/{id}`) that **appends** 3 to 5 tasks to the milestone (never
  deletes). One running job per milestone (409 otherwise). Founder/TM only.
- **D-RM-2 Comments:** one generic comments API for any entity (v1: roadmap milestones and tasks), under `/team/comments` per
  PRD 23. Every active member can read. Every member except investors can post. Authors edit/delete their own; founder/TM can
  resolve. Mentions are explicit `mention_user_ids` → notification "You were mentioned by {name}: "{snippet}"".
- **D-RM-3 Members list:** `GET /team/members` (active members: id, name, email, role), readable by any member, for pickers and
  the Team page later.
- **D-RM-4 Due soon:** a daily scheduler pass notifies once per milestone due within the next 2 days.
