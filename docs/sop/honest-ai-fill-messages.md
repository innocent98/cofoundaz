# Honest AI fill messages

**What shipped:** whole-canvas "Fill with AI" and the records pages' "Draft with AI" now report what the job did, instead of always saying "AI draft added". PR `fix/honest-ai-fill-messages`; depends on API PR #148 (job `result`), and degrades to the old behaviour on an older API.

**Why:** these jobs only fill empty canvases and lists, so on a filled one nothing happens, yet the button toasted success.

**How:** `outcomeFromResult(result, kind)` in `hooks/useBusinessAiFill.ts` reads `GET /jobs/{id}` `data.result` (canvas: `{status, filled[]}`; records: `{status, added}`). `ready` or no result keeps "AI draft added" and refetches; `nothing_new` shows the canvas or records copy and does not refetch; `over_budget` shows the daily-limit copy. `components/business-builder/ai-draft-button.tsx` renders the message in its status chip.

| Result | Message |
|---|---|
| `ready` / null | AI draft added |
| `nothing_new`, canvas | Every section already has content. Use the AI button on a section to add ideas. |
| `nothing_new`, records | Your list already has entries. Add more by hand, or use the AI buttons on a record. |
| `over_budget` | AI is at its daily limit, try again tomorrow. |

**Verification:** unit tests (`components/business-builder/ai-draft-button.test.tsx`); live on the value-proposition canvas (all blocks filled) and the competitors list (2 entries), both `nothing_new`.

**Roll back:** revert the PR; no API change.
