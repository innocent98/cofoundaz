# SOP — Roadmap brought fully to the PRD (Module 05 + the 23.2 comments thread)

## What shipped

All six Roadmap pages (`/roadmap`, `/kanban`, `/milestones`, `/dependencies`, `/templates`, `/replan`) and the milestone
drawer now meet PRD Module 05 and §23.2, with no mock data, no dead controls and no hard-coded shell. One FE PR, **stacked on
#105** (Today's Mission, which introduced the shared top bar); retarget to `develop` after it merges. **It needs API
#137** (breakdown job, `GET /team/members`, `/team/comments`, due-soon notifications). Gap list:
`docs/checklist/roadmap-prd-gaps.md` (all 11 rows closed on the FE). Contract: BE `docs/fe-integration-guide-roadmap-prd.md`.

## Why

The live walkthrough found 11 gaps: a five-stage rail with "Traction" and no "Build", a dead "Break down" and "⋯", no Owner
or Dependencies columns, display-only owner and assignee, no dependency or comments section in the drawer, no overdue or
re-planned chips on the timeline, no graph, a Kanban with no keyboard alternative to drag, generic notification links and a
drawer that was not a dialog. Beyond the list, the timeline placed cards by array index with a fixed "TODAY" line and a zoom
control that did nothing, and the Roadmap layout still carried its own header with a hard-coded bell badge ("5") and a dead
"+ Invite".

## How

| Area | Approach |
|---|---|
| Shell | `roadmap/layout.tsx` mounts the shared `ShellTopBar` (⌘K, Health, real bell, founder-only Invite) like Mission |
| Data | `useRoadmapApi` keeps the ids the API sends (`owner`/`assignee` `{id,name}`, `dependency_count`, `replanned`), uses the six real stages, orders by the server `order`, and no longer flashes the skeleton on every refetch (`loading` is initial only) |
| Board | `useRoadmapBoard` = tree + members + breakdown + which milestone is open. Reads `?milestone=` / `?task=` so notifications deep-link (a task opens its milestone with that thread expanded). `BoardDrawer` is the one drawer used by Timeline, Kanban and Milestones |
| Breakdown | `lib/api/breakdown.ts` + `useMilestoneBreakdown`: 202 → poll `/jobs/{id}` every 2s, 60s cap, then refetch and highlight `created_task_ids`. 409 shows "I'm already breaking this milestone down." (no polling); `over_budget`, `failed`, `gone`, timeout each have their own copy. One state per milestone, so Milestones rows and the drawer agree |
| Pickers | `PersonSelect` over `GET /team/members` (name, else email, else "Member"; "Unassigned" sends `null`). Native `<select>` and `<input type="date">` so they are accessible and mobile friendly |
| Comments | `CommentThread` (`lib/api/comments.ts`, `useComments`): oldest first, composer with @ autocomplete (ARIA combobox + listbox, arrows/Enter/Esc, Ctrl+Enter posts). The text keeps "@Name"; only mentions still in the text are sent as `mention_user_ids` (`lib/mentions.ts`). Edit/delete only when `is_mine`, inline delete confirm, "Resolve thread" for founder, team member or author, investors read-only |
| Timeline | Cards are placed by `due_on` on a real axis (`buildScale` in `lib/roadmap-format.ts`); Week/Month/Quarter rescale; the Today line sits on today's date and the canvas scrolls to it. Overdue and "Re-planned" chips (tooltip "Adjusted on {date} because {reason}"), expandable tasks, inline add phase / milestone instead of `window.prompt` |
| Graph | `lib/dependency-graph.ts` lays tasks in layers (prerequisite left of what it blocks); the page draws SVG nodes and arrows above the existing list |
| Kanban | Card titles are buttons that open the drawer; a "Move to" select on each card is the keyboard alternative to drag; the fake grip on phase cards (nothing was draggable) is gone |
| Notifications | `notificationHref`: due soon → `/roadmap?milestone=`, mention → milestone or task, overdue → `/roadmap/replan`; `team.*` gets the Team category and icon |
| Roles | Founder and team member edit (`canEdit`); mentors and business consultants read and comment; investors read only. The server still enforces every route |

Decisions and rejected alternatives:

- **Date-scaled timeline rather than a prettier mock.** The old layout was decoration; honest placement needed real dates, so cards without a due date sit at their phase start.
- **Native selects over a custom listbox** for owner and assignee: keyboard, screen reader and mobile behaviour for free, and the member list is short.
- **Comment resolve is per comment**, as the API defines it, labelled "Resolve thread" to match the PRD.
- **One drawer for every view** rather than a per-page copy, so the breakdown, thread and pickers cannot drift.
- Rejected: optimistic comment writes (the server owns `edited_at`, `resolved_at` and `is_mine`; the response replaces the row); polling the breakdown forever (60s cap with an honest message).

## What's involved

`app/(dashboard)/roadmap/{layout,page}.tsx`, `roadmap/{kanban,milestones,dependencies}/page.tsx`, `roadmap/templates/page.tsx`
(dialog roles), `roadmap/components/RoadmapDrawer.tsx` (rewritten), `components/roadmap/*` (new: board-drawer, breakdown-button,
comment-thread, milestone-chips, person-select, row-menu), `hooks/useRoadmapApi.ts`, `hooks/useRoadmapBoard.ts`,
`hooks/useMilestoneBreakdown.ts`, `hooks/useTeamMembers.ts`, `hooks/useComments.ts` (new), `hooks/useNotifications.ts`,
`lib/api/{breakdown,comments,members}.ts`, `lib/{mentions,roadmap-format,dependency-graph}.ts` (new). No migrations, no config.

## Verification

- Unit/component: new tests for breakdown, comments, mentions, format and scale, graph layout, `useRoadmapApi` mapping,
  `useMilestoneBreakdown` (fake timers: ready, 409, over budget, failed, timeout), the comment thread (post with mention, role
  gating, resolve, delete, failed edit, investor read-only, retry), the drawer (dialog, pickers, null email fallback, read-only) and
  the Timeline, Milestones and Kanban pages. Full suite: 82 files, 657 tests.
- CI gates reproduced locally: `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, `npm run test:e2e` (marketing
  and auth only; the dashboard is not in the Playwright sweep).
- Live on the local full stack (API #137 in docker, FE on :3003) as the founder, 1440px and 375px: Timeline scaled by date,
  overdue chip (forced a past due date), re-planned chip (applied a real re-plan), expand tasks, owner and assignee set and
  persisted, real-LLM breakdown ("Added 4 tasks", new rows highlighted), the 409 copy while a job ran, row menu → drawer,
  comment post with a @ mention (id persisted server-side), edit, resolve, reopen, delete, empty state, dependency form
  and graph, Kanban "Move to", `?task=` deep link (thread expanded, Esc closes, URL cleared).
- **Not verified live:** the role views (mentor, team member, investor) because the test mentor/TM passwords are not
  known here, so read-only rendering is unit-tested only; `over_budget`, `failed`, `gone` and the 60s timeout; a notification
  actually arriving in the bell; the 429 and 422 comment errors.

## Operate / roll back

Pure FE; revert the PR. Needs API #137 deployed first, otherwise breakdown, members and comments 404 (the pickers and thread
show their error states, the rest of the page still works).

## Follow-ups

- The floating AI dock overlaps the drawer footer on small screens (shared shell, not touched here).
- Other section layouts still carry their own headers; adopt `ShellTopBar` per page pass.
- Dependencies are task to task; the Milestones "Dependencies" column counts the same edges per milestone.
