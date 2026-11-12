# AI Co-Founder FE pass: live walk (2026-11-12)

Branch `feature/ai-cofounder-fe` (base `develop` `afbf060`). Walked live in the built-in browser against a **scratch stack**
(own Postgres 17 + Redis, API from a `origin/develop` worktree `31ee5a3d` on :8020, the in-process worker, FE `next dev` on :3020
with `API_PROXY_TARGET`), workspace NovaPay (Fintech, build stage), with four seeded roles: founder, team member, mentor,
accountant. All values are test values on localhost.

**What was faked:** `LLM_PROVIDER=stub`, so every reply is `[stub-llm] AI-generated assessment narrative.`. Routing (keyword rules),
badges, sources, disclaimers, topics, statuses and access are real. Two things the stub cannot do were set up by hand in the scratch DB
and are labelled below: **proposed action chips** (the stub never emits an `<actions>` block, so two `ai_actions` rows were inserted
for one reply) and **Cancel** (my scratch worker was stopped so a reply stayed `generating`, then restarted). The suggestions cards
came from the real aggregator after completing the Kickoff Assessment through the API.

Legend: ✅ passes live · ⚪ not live (reason) · ➖ deferred by decision.

## Gap-list rows closed by this PR (FE and BE + FE)
| Row | Control / behaviour | Result |
|---|---|---|
| 3 | Action chips: Confirm, Dismiss, then "Done: {result_label}" + **Open it** (href `/documents/{id}`) + **Undo**; after Undo "Undone: …"; Regenerate hides once a reply changed something | ✅ (seeded proposals); `add_task` Confirm on my hand-seeded payload returned the API's "That change could not be made." and the UI showed it in the red alert, nothing else changed (my payload's milestone key was not real; ⚪ `add_task` success path is covered by the hook/component tests only) |
| 4 | Hover toolbar (always visible, so touch works): Copy, thumbs up/down (toggle, `aria-pressed`), Regenerate (latest reply only), **Why I said this** expander; **Retry** on failed/cancelled | ✅ thumbs → `POST /feedback` 200, Regenerate → 202 then poll, Retry after Cancel gave a new reply |
| 5 | **Cancel** replaces Stop generating (D-AI-2): turn becomes "Cancelled." and the composer is usable at once | ✅ (worker stopped for the test) |
| 8 | PRD empty state "Meet your AI Co-Founder." + body, the four PRD starter chips (page and drawer share `lib/ai-copy.ts`), PRD placeholder | ✅ |
| 9 | Right panel: **Suggested actions** (real, links to the tab), **Sources I used** (from the last reply), **Agents in this chat** | ✅ (Finance chat: "Your startup profile / Your finance snapshot", "Finance Advisor") |
| 10 | Server search over title **and reply text** with a highlighted snippet (page list and History); topic chips; word that only appears in replies (`narrative`) now finds all four chats | ✅ |
| 11 | Dock "Open full view →" opens `/ai?c={conversation}` and that exact chat | ✅ |
| 16 | Suggested actions page: real cards; **Do it** = accept then navigate (`/health`); **Snooze 1 week**; **Dismiss**; error state with Try again; proactive-off state "Proactive suggestions are off. Turn them on in AI settings." (link works, toggle persisted) | ✅ |
| 17 | History: topic column + chips, Archived view, row checkboxes + select all, **Archive N selected / Unarchive N selected**, per-row **Delete forever** with a confirm dialog (Cancel keeps it), search with snippet | ✅. The agents column is not shown (the list API has no agent field) |
| 18 | Your bench from `GET /ai/agents`: 4 "Ask {agent name}" buttons, 7 "Coming soon" labels (not controls) | ✅ |
| 19 | "Ask Legal Assistant" → `/ai?agent=legal` → new chat "Pinned to Legal Assistant"; reply badge "Legal Assistant via Co-Founder", topic Legal | ✅ |
| 22 | At 375 a **Conversations** button opens a sheet with search, chips and the list; the composer clears the bottom tab bar | ✅ |
| 7, 20 | Attachments, slash commands, memory panel | ➖ deferred (D-AI-1, D-AI-5): no control is shown |
| (new) | Archive from the chat header; an archived chat is read-only with "This conversation is archived. Unarchive it to continue." + **Unarchive**; archived chats do not appear in the normal list | ✅ |

BE-only rows (1, 2, 6, 12, 13, 15, 21) and security row 14 are API work already merged; seen working through the UI (routing and badges,
sources, disclaimers, aggregate suggestions, no empty conversations). Row 14: mentor and accountant get **403 on `/ai/status`**, and on
conversations, suggestions, agents and settings (checked with the logged-in token).

## Per role (1440 and 375)
| Role | 1440 | 375 |
|---|---|---|
| Founder | Chat (send, routing badge, disclaimer, sources, Why, Copy, thumbs, Regenerate, Cancel, Retry, Archive, Unarchive, pinned agent, list search + chips + Archived), Suggested actions, History, Bench, Settings (toggle persists), dock drawer (4 starters, send, thumbs, Open full view): ✅ | Chat + Conversations sheet, History, Bench, Suggested actions, Settings: no horizontal scroll (scrollWidth 375). One fix made on the way: History overflowed (397), now 375 |
| Team member | Sidebar entry, empty first-run, send + Finance badge, own list only (1 chat, none of the founder's), History (own row + delete), Bench (4 Ask / 7 soon), Suggested actions, `/ai/status` 200; no "+ Invite" | same code paths as the founder at 375 (not separately re-clicked) |
| Mentor | Every `/ai/*` route shows "You don't have access to this page."; no sidebar entry, no dock; all five AI API endpoints 403 | blocked page, same code |
| Accountant | same as mentor (confirmed `accountant` membership via `/auth/me`) | same code |

## Found and fixed during the walk
- Chat area overflowed the viewport at 1440 (page scrolled, composer low): height now `100dvh` minus the header stack (document height = viewport).
- Icon-only Archive button had no accessible name: `aria-label="Archive conversation"`.
- History overflowed at 375: root `min-w-0`, date column hidden below `sm`.

## Not verified live (honest list)
- Real model: reply quality, a real model proposing actions, real latency. The 90 s timeout copy and the "failed" Retry on a server-failed turn (unit-tested only).
- `add_task` and `update_roadmap` confirm/undo end to end, and `ACTION_CHANGED` / `ACTION_TARGET_GONE` copy (unit-tested; only `draft_document` was exercised live).
- Over-budget reply text; ⌘J (existing code, unit test).
- Mentor / accountant / team member at 375 were not re-clicked page by page (same components, guard verified at 1440).
