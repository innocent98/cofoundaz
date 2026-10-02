# SOP — AI-fill: real polling + auto-refresh (canvases & records)

**What shipped:** upgraded Business Builder AI-fill from an honest "queued — coming
soon" stub to the real async flow — enqueue, poll the job, then refresh the
canvas/records so the AI-drafted content appears. Added the AI-draft button to the
four record pages (which had none). Branch `fix/ai-fill-real-polling` → PR to `develop`.

## Why

The AI-fill job endpoints returned `202 {job_id, status:"queued"}` but, at the time
the stub was written, no worker drained them, so the FE honestly said "coming soon".
The **worker now runs on staging** (verified while wiring the business-plan
generator), so AI-fill actually completes in ~30-60s — the stub was leaving a
working feature switched off.

## How

- **`hooks/useBusinessAiFill.ts`** — after the `202`, poll `GET /jobs/{job_id}`
  (`queued → running → succeeded`) every 2.5s up to a 45s bound, then resolve a
  typed `AiFillResult` (`succeeded | failed | skipped | timeout`). Worker writes to
  the canvas/record row, not the job result, so `succeeded` tells us *when* to
  re-fetch (guide §3, Option A). No fabricated output; a slow job → honest `timeout`.
- **`components/business-builder/ai-draft-button.tsx`** — new `onFilled` callback +
  real states: Drafting… (spinner) → **AI draft added** (success, calls `onFilled`) /
  **Nothing to draft** (skipped) / timeout note / error. Keeps the over-budget pill.
- **`hooks/useCanvasEditor.ts`** — exposed a `reload()` so canvas pages can re-fetch
  after a fill.
- **Wiring** — `onFilled` passed on all 5 canvas pages (lean via its `fetchCanvasData`,
  the other 4 via `useCanvasEditor().reload`). **Added `<AiDraftButton kind=… onFilled=refetch>`**
  to the 4 record pages (personas / competitors / pricing / revenue-streams), which
  previously had no AI-fill trigger.

## Verification

| Check | Result |
|---|---|
| typecheck / lint / unit | 0 / 0 / 229 |
| build / e2e | clean / 153 |
| **Live (staging, test account)** | **Business Model Canvas** "Fill with AI" → "Drafting…" → after ~45s the button showed **"AI draft added"** and the canvas **auto-populated** with real AI content (Key Partners "Payment processors and banks", "KYC…"; Key Activities "Validate target customer…", "Build and test MVP"; …) with no manual reload. **Personas** "Draft with AI" → polled → "AI draft added" + refetch (the one existing, already-complete persona was left as-is, since records fill only empty fields). |

## Follow-ups

- Records whose fields are already complete show "AI draft added" with no visible
  change (the worker fills only empty fields); fine, but a "nothing to add" nuance
  could be friendlier.
- **Assessment narrative is still blocked upstream** — the assessment questions have
  no prompt text (`serialize_question`), so the assessment can't be taken and no
  narrative is produced. Logged as a BE follow-up (`backend-requests-ui-gaps.md` §8).
