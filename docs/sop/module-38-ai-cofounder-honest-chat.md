# SOP — AI Co-Founder chat: honest "coming soon" (no fabricated replies)

**What shipped:** removed the fabricated AI Co-Founder chat behaviour from the
`/ai` page and the AI drawer, and replaced it with an honest "coming soon" state.
Branch `fix/ai-cofounder-honest-chat` → PR to `develop`.

## Why

The conversational AI Co-Founder had **no backend** but the FE faked it:
- `hooks/useAICoFounder.ts` seeded two fake conversations with invented data
  ("Q3 Runway & Burn Analysis" — "$142,000 cash balance… 5.0 months runway",
  fake sources "August Financial Ledger", a "Contractor IP & NDA Review" thread).
- `sendMessage` streamed a **hardcoded** reply ("Here is my assessment regarding…")
  with a typewriter effect, plus fabricated `reasoningSummary` / `sources` /
  `actionChips` on every turn.

The backend's own guide confirms the chat is not built:
`cofoundaz-api/docs/fe-integration-guide-ai-cofounder.md` §0/§3 — *"'AI Co-Founder'
… is not a chatbot you send messages to … The `/ai` router exposes only
`GET /ai/status` … do not ship the chat drawer against a live endpoint — there is
nothing to call."* "AI Co-Founder" is a brand over ~8 background enrichment
features (dashboard briefing, mission reasons, health recs, roadmap rationale,
onboarding panel, canvas/records AI-fill, assessment narrative, business plan),
most of which are already wired in our FE.

## How

- **`hooks/useAICoFounder.ts`** — `DEFAULT_CONVERSATIONS` is now `[]`; initial
  messages/active-conversation are empty. `sendMessage` appends one honest
  assistant reply ("The AI Co-Founder isn't connected yet… nothing you type here
  is sent anywhere yet") with **no** reasoning/sources/action chips and no fake
  typewriter. New conversations stamp `lastMessageAt` as ISO (was the display
  string "Just now", which rendered as "Invalid Date").
- **`app/(dashboard)/ai/page.tsx`** — empty state carries a "Coming soon" pill and
  honest copy pointing to where the AI *does* work; the conversation-date formatter
  guards against invalid dates.
- **`components/ai-drawer.tsx`** — the drawer's empty state ("Press ⌘J to chat" +
  prompts) is replaced with the same honest "coming soon" note.

## Verification

| Check | Result |
|---|---|
| typecheck / lint / unit | 0 / 0 / 229 |
| build / e2e | clean / 153 |
| **Live (staging, test account)** | `/ai` shows "No conversations found" (fake threads gone), a "Coming soon" badge, and honest copy. Sending "How long is my runway?" returns the honest "isn't connected yet" reply — **no** fabricated runway figure, sources, or action chips. Conversation list shows a valid date ("Oct 2"), not "Invalid Date". The drawer shows the matching honest state. |

## Follow-ups

- When the backend ships a real conversation endpoint (its own module + FE guide
  per the index §3), wire the chat for real and restore the composer flow.
- The §2 enrichment features remain the real "AI Co-Founder"; the LLM worker that
  drains the Pattern-B jobs (canvas/records AI-fill, business plan) is still the
  outstanding backend gap.
