# AI Co-Founder: PRD + UI gap list (live walkthrough, 2026-11-05)

Source of truth: `Cofoundaz_Technical_PRD.md` Module 03 (§03.1 to §03.5, API, entities, events, credits, notifications,
access "F, TM") + §2.1 (shared shell, AI dock) + §5.3 (events) + §5.4 (AI orchestration contract). Walked live on
`develop` (FE `24c6472`, API `cec5afc8`), scratch stack (own Postgres + Redis + API on :8020, worker, FE on :3020),
workspace NovaPay, as founder, team member, mentor and accountant (1440 + 375). Every AI route was compared with the raw API
response, and the API was hit directly per role (including the endpoints the PRD names that the FE never calls). Real model
(whatever the local `.env` configures): chat turns, the worker and the usage meter ran for real.

Legend: ✅ meets PRD · ❌ gap

## What the module is today (the headline)
The built Module 03 is a **single-persona chat** with a per-user history and two preference toggles. Of the PRD's five
sub-pages only **Chat (part)**, **History (part)** and **Settings (toggles + tone)** have a backend. **Suggested actions** and
**Your bench** have no API at all; the FE shows an empty state / a hard-coded list. The orchestrator, agent routing, workspace
retrieval, long-term memory, tool actions, streaming and the `ai.*` events from §5.3/§5.4 are all absent. The PRD's own build
phase table (§ phasing, MVP row) scopes the first release to "chat + orchestrator core, 4 agents: Strategist, Finance,
Legal-lite, Mentor", so some of this is later-phase by design; **D-AI-1 asks Adebayo to draw that line**.

API surface that exists (`app/api/v1/endpoints/ai.py`): `GET/PATCH /ai/settings`, `GET /ai/status`,
`POST/GET /ai/conversations`, `GET /ai/conversations/{id}`, `POST /ai/conversations/{id}/messages` (202, job
`ai.cofounder.reply`, FE polls). PRD endpoints that return **404**: `GET /ai/suggestions`, `POST /ai/suggestions/{id}/{action}`,
`GET/DELETE /ai/memory`, `GET /ai/agents`, `POST /ai/messages/{id}/actions/{action}`. Tables: `ai_conversations`, `ai_messages`
only (no `topic`, `agent_key`, `reasoning_summary`, `tool_calls_json`, `ai_agent_routes`, `ai_memory`).

## Works (verified live)
- ✅ Chat end to end with a real model: send → `generating` turn → FE shows "Thinking…" → reply renders as markdown (headings, bold, lists) in the page and in the dock drawer. A reply to "How long is my runway?" used the real ledger figure (NGN 0 cash, 0 burn) from the Finance grounding.
- ✅ Send guards: a second send while a reply is generating → 409 `REPLY_IN_PROGRESS` (FE: "Your co-founder is still replying. Try again in a moment."); empty and 8001-char messages → 422; a bad conversation id → 422.
- ✅ Privacy: conversations are private to their creator. A team member opening the founder's conversation (read or post) gets 404, and the reverse; each role's list shows only its own. Journal content is never in the prompt (the prompt builder only gets startup profile, goals, tone and, for finance roles, a numbers-only finance summary).
- ✅ Roles: founder and team member use the chat, history, bench and settings (team member sees no "+ Invite"). Mentor and accountant: API 403 on settings, list, create and read; FE shows "You don't have access to this page." on every `/ai/*` route, the sidebar hides AI Co-Founder and the dock FAB is not rendered.
- ✅ Global ⌘K search returns the caller's AI conversations (by title, group "AI Co-Founder", link `/ai?c={id}`); mentor and accountant get none.
- ✅ Settings: Proactive suggestions and Daily briefing toggles and the Tone radio persist (API after each click: `proactive_suggestions:false, daily_briefing:false, tone:straight_shooter`), toast "AI preferences saved."; defaults are on / on / Encouraging; usage card (tokens used today, daily budget, resets-at, enrichment failures) matches `GET /ai/status`.
- ✅ Dock: FAB with tooltip "Ask your AI Co-Founder" on the dashboard, drawer with "Open full view →", "New chat", Esc closes (⌘J is in the code and its unit test; not pressed in this walk). Mobile bottom bar has Home, Mission, AI, Notifications, More as in §2.1.
- ✅ 375: Chat, Suggested actions, History, Bench and Settings fit with no horizontal scroll (scrollWidth 375). Tab strip scrolls sideways inside itself.
- ✅ Moderation: removed messages serialise as the placeholder (code path, not exercised).

### Mock / seed / dead data in the FE
- `app/(dashboard)/ai/agents/page.tsx`: the **11-agent bench is a hard-coded array** (names, categories, one-liners); `GET /ai/agents` does not exist. Two cards share key `cofounder` (Strategist, Readiness Coach) and two share `product` (Validation Scientist, Product Manager), so "Ask" cannot tell them apart.
- `hooks/useAICoFounder.ts`: `useAISuggestions` and `useAIMemory` call `/ai/suggestions` and `/ai/memory`, which 404; both catch the error and return an empty list with a comment "backend is not wired yet". `useAIMemory` is not rendered anywhere.
- Starter prompts are hard-coded (fine, as in the PRD) but are not the PRD's four (see row 8).
- No mock *messages*: replies are never fabricated; a failed or timed-out turn resolves to "Couldn't reach your co-founder. Try again." (not walked live: needs the worker down).

## Gaps
| # | Area | Gap (observed) | PRD | Fix |
|---|---|---|---|---|
| 1 | Orchestrator | No intent classification and no agent routing. Every reply comes from one generic "AI co-founder" system prompt; messages carry no `agent_key`, confidence or route; no `ai_agent_routes`. The FE labels every reply just **"Co-Founder"** | §5.4.1, `ai_agent_routes`, `AgentBadge` **"Finance Advisor via Co-Founder"** | BE: orchestrator (`orchestrator.intent@vN`) + per-agent configs, routes table, `agent_key` on messages. Scope per D-AI-1 |
| 2 | Context | The prompt gets only startup name/industry/stage/one-liner/goals/tone (+ numbers-only finance for F/TM/accountant). No memory facts, no retrieval over workspace docs/artifacts, no roadmap, mission, health, assessment, validation, sales or marketing data. Live: "What should I focus on this week?" gave a generic plan and ignored the workspace's three mission tasks; "Poke holes in my business model" replied by asking the founder for the model, evidence and channels the workspace already holds | "I know your startup — your stage, your numbers, your plan"; §5.4.2 memory + top-k hits, hard tenancy filter | BE: read-only context builder per agent (start with roadmap, mission, health, assessment, business canvas, finance, pipeline), RBAC-filtered like the module routes; vector store later (D-AI-5) |
| 3 | Actions | No write actions. No `POST /ai/messages/{id}/actions/{action}`, no `tool_calls_json`, no chips **"Draft the document"** / **"Add as task"** / **"Update roadmap"**, no result card **"Done — I created {artifact}."** + **"Open it"** + **"Undo"**, no `ai.action.executed` | §03.1 anatomy + confirmation, §5.4.4, events | BE: proposed-change tool results + confirm endpoint (+ Undo for reversible), event. FE: chips and result card. Scope per D-AI-1 |
| 4 | Message anatomy | No "Why I said this" reasoning summary, no copy / regenerate / thumbs on hover (hover shows nothing). A failed turn leaves the error text and the user must retype; there is no retry | §03.1 message anatomy | BE: `reasoning_summary`, feedback + regenerate endpoints. FE: hover toolbar, expandable reasoning, **Retry** on a failed turn |
| 5 | Streaming | Reply arrives whole after a 15 to 60 s wait behind "Thinking…" (poll every 1.5 s, 90 s cap). No character streaming and no **"Stop generating"** button; Send just shows a spinner | §03.1 composer, API note "SSE/WebSocket" | Decide in D-AI-2; if kept as polling, drop the PRD wording or add a cancel for the job |
| 6 | Safety | Legal/financial answers do not get the auto-appended disclaimer block. The NDA clause reply ended with a model-written "Have a lawyer adapt this…" line only because the model chose to; nothing guarantees it | §5.4.5 | BE: classify (after row 1) and append a fixed disclaimer block to legal/financial agents' replies |
| 7 | Composer | No attach button (library docs or upload) and no slash commands `/draft`, `/analyze`, `/plan`, `/agents`. Typing `/draft` is sent to the model as plain text | §03.1 composer | FE (+ BE for attachments); slash commands depend on rows 1 and 3. Defer per D-AI-1 |
| 8 | Copy | Empty state H2 is **"Ask your AI Co-Founder anything."** with body "Replies use what it knows…"; PRD is H2 **"Meet your AI Co-Founder."** + **"I know your startup — your stage, your numbers, your plan. Ask me anything, and I'll bring in the right specialist."** Starter chips: page shows "What is my biggest risk right now?" and "Help me prepare for my next investor conversation" where the PRD has **"How long is my runway?"** and **"Draft an NDA for a contractor"**; the dock drawer shows only 2 of the 4 chips. Composer placeholder is "Ask anything, strategy, money, legal, marketing..." (drawer: "Ask anything...") vs **"Ask anything — strategy, money, legal, marketing…"**. | §03.1 first-run empty state, composer | FE: PRD copy; one shared `STARTER_PROMPTS` for page and drawer (the PRD's em dashes were stripped on purpose elsewhere (#142 strips them from LLM output); use the PRD text unless Adebayo wants the no-dash rule applied to UI copy too) |
| 9 | Context panel | Right panel has **"Suggested Actions"** (always "No active suggestions.": the source 404s, and when it has items they are inert `div`s with a pointer cursor and no handler) and a static "About this chat" paragraph. No **"Sources I used"** (linked workspace items) and no **"Agents in this chat"** (`AgentBadge` list). Panel only appears at ≥1280 px, with no alternative below | §03.1 layout | FE: the three sections; "Sources" and "Agents" need rows 1 and 2 to carry data. Make suggestion cards act (row 15) or hide the section |
| 10 | Conversation list | No topic filter chips; conversations have no `topic`. Search is a client-side **title** filter: a word that appears only in a reply ("Confidentiality") finds nothing, in both the page list and History. `GET /ai/conversations?query=x&topic=y` ignores both params (returns everything) | §03.1 left pane, `GET /ai/conversations?query&topic`, **"Search hits highlight matched snippet"** (§03.3) | BE: `topic` (auto-tagged at first reply) + `query` over title and message content with a snippet in the response. FE: chips, server search, highlight |
| 11 | Dock | **"Open full view →"** links to bare `/ai`, so the conversation just held in the drawer is not opened (live: drawer reply, click, the page opens the empty first-run state; the conversation is only in the list) | §03.1 drawer variant | FE: link to `/ai?c={activeConversationId}` (the page already opens `?c=`) |
| 12 | Input | A whitespace-only message is accepted: `POST …/messages {"content":"   "}` → 202 and a model call is made (title becomes empty) | send validation | BE: strip, then `min_length=1` (422) |
| 13 | Conversations | `POST /ai/conversations` with no message creates an untitled empty conversation (201). It shows as "New conversation" in the list, History and (if titled null) nowhere searchable; repeated calls litter the list. The FE never calls it without a message, but the API allows it | `POST /ai/conversations` | BE: require `message`, or hide empty conversations from the list and delete them after 24 h |
| 14 | Roles (security, low) | `GET /ai/status` is open to **every member**: mentor and accountant get 200 with the workspace's tokens used today, daily budget, over-budget flag and the types and times of recent AI job failures, although AI is F + TM only | Access: F, TM | BE: gate to founder + team member (the Sales buyer and Settings usage card already sit behind F/TM pages); test per role |
| 15 | Suggested actions | No backend: `GET /ai/suggestions` 404, no accept / dismiss / snooze, no `ai.suggestion.created`, no suggestion generator, no `ai_suggestions` table. The "Proactive suggestions" toggle exists but gates other features (dashboard Opportunities, course recommendation emails), not this list | §03.2, `GET /ai/suggestions`, `POST /ai/suggestions/{id}/{accept\|dismiss\|snooze}`, event, notification **"Your AI Co-Founder has a suggestion for you"** (digest by default) | BE: per D-AI-3 (source of suggestions), then endpoints, event, notification (batched into the digest, respecting the toggle) |
| 16 | Suggested actions (FE) | The page swallows the 404 and shows the PRD empty copy **"Nothing right now. When I spot something worth your time, it'll be here."** forever, so a missing feature reads as "nothing to suggest". "Do it" / "Snooze 1 week" / "Dismiss" have never run against a real response; "Do it" only calls accept and removes the card (no navigation to the thing to do) | §03.2 CTAs | FE: show an error state on non-404 failures; "Do it" opens the target (deep link) then marks accepted; verify live once row 15 ships |
| 17 | History | Table has CONVERSATION / STARTED / LAST ACTIVE only. No grouping by topic, no topic chip, no **agents involved**, no bulk archive (and no archive or delete endpoint at all, so a founder cannot remove a conversation), no snippet highlight. Titles are the first 80 characters of the first message, not a generated title. Row click → `/ai?c=` (href confirmed in search results; the row click itself was not walked) | §03.3 | BE: `topic`, `archived_at`, bulk archive endpoint, generated title (cheap model call after first reply). FE: group by topic, chips, agents column, checkboxes + "Archive", highlight. Delete vs archive per D-AI-4 |
| 18 | Bench | The grid of 11 cards is FE-hard-coded (see mock list); `GET /ai/agents` 404. Cards show name, module and one-liner, but nothing about availability: no role/grant filter, no "coming soon" for agents that do not exist yet (all 11 look live though only one persona answers). "Agent Bench table" (the PRD's one-liner source) is referenced in §03.4 but is not in the PRD file, so copy is unverified | §03.4, `GET /ai/agents` | BE: `GET /ai/agents` from the agent registry (row 1) with `available` per role. FE: render from it; mark unavailable agents. Get the Bench table from Adebayo |
| 19 | Bench (FE) | **"Ask {agent}"** goes to `/ai?agent={key}` and the chat page ignores `agent` entirely (live: "Ask Finance" lands on the generic empty chat; nothing pre-routed, no new chat, no badge). Button labels are "Ask Finance", "Ask Sales"… not "Ask {agent name}" ("Ask Finance Advisor") | §03.4 CTA → new chat pre-routed | FE: read `agent`, start a new chat pinned to it; BE: accept `agent_key` on `POST /ai/conversations` and honour it in routing (needs row 1) |
| 20 | Settings | No **"What I remember"** panel, no per-item **"Forget this"**, no **"Clear all memory"** (danger button + confirm modal **"Clear AI memory? I'll forget everything I've learned about {startup} outside your actual data."**); no `ai_memory`, `GET/DELETE /ai/memory` 404, nothing is ever remembered between chats. The unused `useAIMemory` hook calls the 404s | §03.5, `GET/DELETE /ai/memory` | Per D-AI-5; if deferred, keep the spec line but do not ship a half panel |
| 21 | Events | None of the module's events exist: no `ai.action.executed`, no `ai.suggestion.created` (§5.3 lists both with Notifications and Analytics as consumers). The only AI chat event is `ai.cofounder.reply.failed`, which no consumer reads (a failed reply raises no notification and no analytics) | §5.3 | BE: with rows 3 and 15; decide whether `reply.failed` should notify (recommended: no, the FE already shows it) |
| 22 | 375 | The conversation list and search are hidden below `lg`, so on the Chat page a phone user cannot switch conversations or search (they must leave for the History tab); the composer's textarea is clipped under the bottom tab bar until the page is scrolled (placeholder cut to 1.5 lines) | §03.1 (lg 3-pane) + §2.1 mobile | FE: a conversations sheet/drawer button in the chat header at `<lg`; add bottom padding for the tab bar |

Counts: 22 rows. 7 BE-only (1, 2, 6, 12, 13, 15, 21), 7 FE-only (7, 8, 9, 11, 16, 19, 22), 7 BE + FE (3, 4, 5, 10, 17, 18, 20),
1 security (14, low).

## Not verified in this walk (honestly labelled)
- Reply-failure and 90 s timeout copy ("Couldn't reach your co-founder. Try again."): needs the worker stopped; unit-tested only.
- Over-budget reply (`BUDGET_FAILED_TEXT`) and the Settings over-budget banner: not exhausted locally.
- Credits: PRD says "each message decrements plan AI credits; at 90% emit a usage notification". Usage is metered in tokens against `LLM_DAILY_TOKEN_BUDGET` per workspace; Billing converts tokens to credits (`billing.usage.threshold`, Module 24). The credit decrement and the 90% notification were not exercised from chat here (see the Settings/Billing re-walk).
- ⌘J shortcut and Esc-to-close were read from `components/ai-drawer.tsx` and its tests; the keys were not pressed.
- History row click → `/ai?c=` and the "Tell me more" seeded drawer from the dashboard briefing: code and search-result hrefs only.
- Health Score chip in the top bar: not visible for this unscored workspace (the assessment is not taken); not checked with a score.

## Platform notes (not AI-specific, no gap raised)
- Module 03's "TM w/o Finance grant cannot invoke Finance Advisor" assumes per-module team-member grants. There is no TM module-grant model in the API (only Documents grants), and Finance routes already allow TM (`FINANCE_ROLES` = founder, team member, accountant), so the chat's finance grounding for TM is consistent with the page. If grants arrive platform-wide, the agent allow-list should read them.
- The sidebar lists "AI Co-Founder" under OVERVIEW; §2.1's sidebar has no such entry (the PRD reaches the module via the dock, the mobile tab and `⌘J`). Kept, treated as a deliberate addition.
- One user can use up the workspace's daily token budget (100k) alone; there is no per-user cap. Not a PRD item.

## Decisions for Adebayo (genuine product calls)
- **D-AI-1: What is in v1 of Module 03?** The PRD's module describes 11 agents, retrieval, memory, actions, streaming and suggestions; the PRD's phase table says MVP = "chat + orchestrator core, 4 agents (Strategist, Finance, Legal-lite, Mentor)".
  - (a) Build the full module before calling the page done.
  - (b) **MVP slice (recommended):** orchestrator + the 4 MVP agents routed from one chat, read-only workspace context (rows 1, 2, 6), the three confirm-first action chips (add task, update roadmap, draft document; row 3), "Why I said this" + copy / regenerate / thumbs (row 4). Defer memory, attachments, slash commands, the other 7 agents.
  - (c) Keep the single persona and hide Suggested actions, Bench and memory until built (cheapest, but the page then does not match the PRD).
- **D-AI-2: Streaming.** (a) Keep job + polling (Pattern B, used everywhere else) and amend the PRD (no character streaming; replace "Stop generating" with "Cancel" that stops the job). (b) Build SSE for chat only. **Recommended: (a)** now, revisit SSE after routing lands; the 15 to 60 s wait is the real cost and a real model on a queue will not feel streamed either way.
- **D-AI-3: Where do Suggested actions come from?** (a) **Aggregate what the app already generates (recommended):** briefing actions and opportunities, health recommendations, mission "why", learning recommendations, business suggestions, each card with a deep link as its "Do it". No new model spend, honours the Proactive-suggestions toggle. (b) A new scheduled LLM job that reads the workspace and writes `ai_suggestions` (richer, costs tokens daily per workspace, needs row 2 first).
- **D-AI-4: History: archive only, or also delete?** PRD says bulk archive. Conversations are private and may hold sensitive founder text, and today there is no way to remove one. (a) **Archive (PRD) plus a per-conversation "Delete forever" (recommended).** (b) Archive only. (c) Delete only. (Also: should archived conversations stay searchable? Recommended: no, behind an "Archived" filter.)
- **D-AI-5: Long-term memory ("What I remember").** (a) **Defer until retrieval (row 2) ships, drop the panel from v1 (recommended):** memory is only useful once the agent reads it, and it is the highest-privacy-risk item (facts about the founder stored by the model). (b) Build now: model proposes facts from chats, stored in `ai_memory`, every fact visible with "Forget this", off by default per workspace until the founder opts in, never from Journal content, redact PII.
- **D-AI-6: Hide or label the unbuilt tabs in the meantime?** Suggested actions and Your bench look finished but are empty / static. (a) **Hide both tabs until built (recommended, same as Funding/IR/Marketplace were hidden).** (b) Keep and add a "Coming soon" banner. (c) Keep as is.

## Decisions (lead, reversible; no product call needed)
- **D-AI-7:** `GET /ai/status` = founder + team member only (row 14), like the rest of the module.
- **D-AI-8:** `POST /ai/conversations` requires a first message; an empty conversation is never created (row 13).
- **D-AI-9:** whitespace-only content is a 422 (row 12).
- **D-AI-10:** "Open full view" and "Ask {agent}" both land on a specific conversation id / new pinned chat (rows 11, 19), never on the bare first-run page.

## Build order (proposal, after D-AI-1 to D-AI-6)
1. BE slice 1 (small, no product call): rows 12, 13, 14; row 10 `query` + `topic` params; row 17 archive/delete (per D-AI-4).
2. BE slice 2 (core, per D-AI-1 b): rows 1, 2, 6 (+ 21 for events), tests per role, live-captured FE guide, SOP.
3. BE slice 3: row 3 actions + row 4 feedback/regenerate; row 15 suggestions (per D-AI-3); row 18 `GET /ai/agents`.
4. FE (one session, after slice 2 for data): rows 4, 8, 9, 10, 11, 16, 17, 19, 22 and the tabs per D-AI-6; row 5 per D-AI-2; row 20 per D-AI-5.
5. Click-every-control re-walk on merged develop, founder + team member + mentor + accountant, 1440 + 375.

## Scratch stack used (for reproduction)
Own Postgres 17 + Redis (`aic-pg`, `aic-redis`), API `uvicorn` on :8020 from an `origin/develop` worktree with the file email
backend, the AI worker (`python -m app.worker`), FE `next dev -p 3020` with `API_PROXY_TARGET=http://127.0.0.1:8020`.
Seeded through the public API: founder signs up, verifies, onboards (NovaPay, Fintech, build stage), invites a team member,
a mentor and an accountant by email token; each accepts. Test values only, localhost only; the stack and its containers are
removed after the walk.
