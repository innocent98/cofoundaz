# SOP: AI Co-Founder chat wired to the real conversation API

**What shipped:** the dock drawer, the `/ai` page, `/ai/history` and the dashboard
"Tell me more" now run a real two-way chat against `/api/v1/ai/conversations`. The
"coming soon" stub and its honest-unavailable reply are gone. Branch
`claude/wire-ai-chat-c4e649`, PR to `develop` (see the PR for the link).
Supersedes [module-38](module-38-ai-cofounder-honest-chat.md), which was the interim honest stub.

## Why

The backend chat shipped (Cofoundaz-api PR #128, contract in
`cofoundaz-api/docs/fe-integration-guide-ai-cofounder-chat.md`), so the FE stub that said
"isn't connected yet" was now wrong. Goal: wire all three surfaces to it, keep every state
honest, never fabricate a reply.

## How

Pattern B from the guide: `POST` a message returns 202 with a `generating` assistant turn,
then the FE polls `GET /ai/conversations/{id}` until the last assistant turn is `ready` or
`failed`.

| Decision | Reason |
|---|---|
| Optimistic user turn plus a "Thinking…" assistant bubble; the server thread replaces it on each poll | The user sees their message instantly; local ids (`local-user-N`) never outlive the first poll |
| `isGenerating` is derived from the thread (last turn is an assistant turn still `generating`) | One source of truth; it disables the Send button and the Enter key, so the BE's `409 REPLY_IN_PROGRESS` is not triggered in normal use |
| Poll 1.5s, **cap 90s** (guide suggests about 30s) | Observed live: a real reply took 38s, and a job with an LLM retry took 60s+. A 30s cap showed "couldn't reach" for a reply that then landed. 90s is still bounded |
| Timeout or `failed` shows "Couldn't reach your co-founder. Try again." | Honest, no partial content (the guide says there is none) |
| Send rejected (403/404/409/422/network): roll back the optimistic turns, show the reason, restore the draft to the composer | Nothing unsent looks sent, nothing typed is lost |
| `409` is handled as "re-sync from the server and keep waiting" | Covers our own poll giving up before the worker finishes |
| Opening a conversation whose last reply is `generating` resumes polling | Survives reload or navigation mid-reply |
| Assistant text rendered by a tiny React-element renderer (headings, bullets, numbered lists, `>` quotes, `**bold**`) | The model replies in light markdown; raw `##` and `**` read badly. No HTML strings are ever built, so model output cannot inject markup (unit-tested) |
| Removed fabricated UI: "Sources I used" (hardcoded Finance Hub etc.), "Agents in this chat", topic chips, slash-command menu, "Stop generating", action chips, "Why I said this", the dead "Open full view" and `+` buttons | The BE returns none of it (specialists, actions and reasoning are deferred in v1). Replaced by an honest "About this chat" note (private to you, uses workspace context) |

## What's involved

| Path | Change |
|---|---|
| `lib/api/aiChat.ts` | New SDK: `createConversation`, `listConversations`, `getConversation`, `postMessage`; types per the guide |
| `hooks/useAICoFounder.ts` | Chat half rewritten (list, select, send, bounded poll). Suggestions and memory hooks untouched |
| `components/ai/chat-message-content.tsx` | Shared bubble body: thinking, failed, ready (light markdown) |
| `components/ai-drawer.tsx` | Real thread, composer, New chat, starter prompts, error line |
| `app/(dashboard)/ai/page.tsx` | Real conversation list (search, loading/error/empty), thread, composer; `?c=<id>` deep link |
| `app/(dashboard)/ai/history/page.tsx` | Real list; rows open `/ai?c=<id>` |
| `types/ai.ts` | Dropped `AIMessage` / `AIConversation` (replaced by the SDK types) |
| Dashboard "Tell me more" | Unchanged: it already calls `openAiDrawer()`, which is now a working chat |

No dependency, migration or config changes.

## Verification

| Check | Result |
|---|---|
| typecheck / lint | clean |
| `npm test` | 248 passed (SDK, hook state machine incl. timeout, failed, 409, rollback and resume, renderer) |
| `npm run build` | clean |
| **Live, local full stack** (API :8000 + worker, `throwaway-founder`, NovaPay) | Drawer opened from the dashboard "Tell me more": sent "What is my biggest risk right now?", got a real, context-aware reply (NovaPay, gig-worker fintech, regulatory risk) via the poll in about 10s. `/ai`: sent "What should I focus on this week?", real reply; follow-up "Which of those five is the single most urgent, in one sentence?" resolved "those five" from the thread (about 38s). Send button disabled and placeholder "Your co-founder is replying..." while generating. Conversation list and `/ai/history` show the real threads; a history row deep-links into the thread |
| **Live failure paths** | Local API container briefly lost DNS to OpenAI, so a reply stayed `generating` past 90s: the drawer showed "Couldn't reach your co-founder. Try again." Re-sending then hit the real `409 REPLY_IN_PROGRESS`: the FE showed "Your co-founder is still replying" and kept waiting |

## Operate / roll back

Pure FE change; revert the PR to return to the earlier stub. The chat needs the BE chat
endpoints and the worker (`ai.cofounder.reply`) running; if the worker is down, replies
time out to the honest failure copy after 90s.

## Follow-ups

- After a client timeout the BE may still deliver the reply later; it appears when the
  conversation is reopened (or on the next send, via the 409 re-sync). A "still working"
  state with a manual re-check would be nicer.
- `/ai?agent=<key>` (from the "Your bench" page) no longer pre-fills a slash command; specialist
  routing is deferred in BE v1, so that page is still presentational.
- No token streaming, action chips or sources yet (deferred in BE v1).
- The `/ai/suggestions` and `/ai/memory` endpoints still do not exist; those tabs stay honest-empty.
