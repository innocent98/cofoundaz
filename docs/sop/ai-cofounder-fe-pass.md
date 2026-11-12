# SOP: AI Co-Founder FE pass (Module 03)

**What shipped:** every `/ai/*` page and the dock drawer now run on the real API. Chat shows the routed specialist, the fixed
disclaimer, "Why I said this", sources, confirm-first action chips, feedback, regenerate/retry and **Cancel**; conversations have
server search, topic filter, archive and Delete forever; Suggested actions and Your bench read `GET /ai/suggestions` and
`GET /ai/agents`. Branch `feature/ai-cofounder-fe`, PR to `develop` (see the PR). Live walk: [ai-cofounder-fe-walk](../checklist/ai-cofounder-fe-walk.md).

## Why
API slices 1-3 (#226, #228, #233) were merged, but the FE still showed one "Co-Founder" persona, a client-side title filter, a
hard-coded 11-agent bench and an always-empty suggestions list ([gap list](../checklist/ai-cofounder-prd-gaps.md), rows 3-5, 8-11, 16-19, 22).

## How
| Decision | Reason |
|---|---|
| One `ChatMessage` component used by the page and the drawer | Badge, disclaimer, chips and toolbar behave the same in both |
| `useAICoFounder` no longer owns the list; `onChanged` tells the page to refetch | Search / topic / archived filters live in `useAIConversationList`, the thread hook stays about one thread |
| Search debounced 300 ms; under 2 characters is "no query"; searching leaves the Archived view | API wants 2 to 100 chars; archived chats are not searchable (D-AI-4) |
| Cancel stops the poll first, then `POST …/cancel`; a 409 re-syncs instead of showing an error | The reply may finish between click and request |
| Retry and Regenerate both call `…/regenerate`; Regenerate hidden once a reply executed an action | Matches the API (`ACTION_EXECUTED`), the guide's UX list |
| Thumbs are optimistic and roll back on error; clicking the same thumb clears it (`rating: null`) | Matches the API |
| Disclaimer is its own muted block, never inside the markdown | Guide §5.7 |
| Coming-soon agents are a label, not a button | No control that does nothing (D-AI-6 spirit) |
| `types/ai.ts`, `useAISuggestions`/`useAIMemory` (404 stubs) removed | Memory is deferred (D-AI-5); suggestions now real |
| Not built: attachments, slash commands, memory panel, agents column in History | D-AI-1 / D-AI-5; the list API has no agent field |

## What's involved
- `lib/api/aiChat.ts` (all endpoints + types), `lib/ai-copy.ts` (PRD copy, shared starters)
- `hooks/useAICoFounder.ts` (thread), `hooks/useAIConversationList.ts`, `hooks/useAIBench.ts` (suggestions, agents)
- `components/ai/chat-message.tsx`, `components/ai/conversation-list.tsx`, `components/ai/chat-message-content.tsx` (cancelled, moderation)
- `app/(dashboard)/ai/{page,history,suggestions,agents}`, `components/ai-drawer.tsx` (shared: badge/actions/Cancel, deep link `?c=`)
- Shared components touched: only `ai-drawer.tsx` (AI-only) and `ai/chat-message-content.tsx`. Nothing outside the AI module.
- No migrations, no env or config.

## Verification
Lint, type-check and the touched tests locally (hooks, `lib/api/aiChat`, `components/ai/*`, drawer); CI runs the rest. Live walk
on a scratch stack with the stub model as founder, team member, mentor, accountant at 1440 and 375, see the walk file for what
was faked and what is not verified (real-model quality, `add_task`/`update_roadmap` live, timeout copy).

## Operate / roll back
Pure FE, no flags. Revert the PR to restore the previous pages (the API is backward compatible).

## Follow-ups
- Timeout behaviour: after the 90 s poll cap the pending turn is shown as failed with Retry; if the server is still generating, Retry gets 409 `REPLY_IN_PROGRESS` and the page re-syncs and resumes polling. A failed turn that carries its own text (the daily AI limit) shows that text and no Retry. A 429 on send shows the API message.
- Real-model check of action proposals and reply quality once a key is configured on staging.
- Agents column in History needs `agent_keys` on the list API.
- Attachments, slash commands and memory stay deferred (D-AI-1, D-AI-5).
