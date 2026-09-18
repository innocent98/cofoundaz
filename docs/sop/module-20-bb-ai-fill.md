# SOP — Module 20: Business Builder · AI-fill (honest deferred stub)

## What shipped

The Business Builder **AI-fill** affordance now calls the **real** deferred
endpoint and tells the truth about it. A single reusable "AI draft" button on
each of the five canvas pages enqueues `POST /business-builder/canvases/{type}/ai-fill`
(`202 queued`) and then shows **"AI draft queued — coming soon"** — no fake
spinner, no fabricated results. Branch `feat/api-bb-ai-fill` → PR into `develop`.

## Why — this is a deferred, worker-less seam

AI-fill enqueues a job but **no backend worker drains it yet** (guide §4/§10): the
job stays `"queued"` forever and the canvas is never actually filled. The guide is
explicit: *"Do not build a UI flow that waits for this job to reach succeeded… if
you want to ship the button now, disable it after showing 'AI fill requested'."*

The FE was doing the opposite — **four canvas pages fabricated success**:
- `mission-vision`: toasts "✦ 3 Mission/Vision suggestions generated!"
- `business-model-canvas`: toast "✦ AI draft added. Review before using."
- `lean-canvas`: called the real endpoint but then toasted "Lean Canvas drafted
  with AI" and mapped non-existent blocks (net: nothing added, but claimed
  success).
- `swot`: a modal whose "Draft it" just closed it.

Per the user's decision ("ship the honest stub"), all four are replaced with a
truthful affordance, and `value-proposition` (which had none) gains one too.

## How

- **`hooks/useBusinessAiFill.ts`** (new) — `requestCanvasFill(type)` /
  `requestRecordFill(kind)` → `POST …/ai-fill` (returns `{job_id, status}`). It
  **never polls for completion** and never fabricates results; a `403` (mentor)
  is surfaced as "only a founder/team member can request an AI draft."
- **`components/business-builder/ai-draft-button.tsx`** (new) — fires the enqueue,
  then swaps to a non-interactive **"AI draft queued — coming soon"** chip (with a
  tooltip explaining the feature isn't available yet). Surfaces errors inline.
- **All five canvas pages** now use it (`mission_vision`, `swot`, `business_model`,
  `lean`, `value_prop`). The fake modals/toasts and their dead state
  (`showAiModal`, `isAiGenerating`, `handleDraftAI`) are removed; lean-canvas's
  autosave is untouched.

## What's involved

| Path | Change |
| --- | --- |
| `hooks/useBusinessAiFill.ts` | new: enqueue canvas/record ai-fill (no polling) |
| `components/business-builder/ai-draft-button.tsx` | new: honest enqueue button |
| `…/mission-vision/page.tsx` | 2 fake toasts → one honest button |
| `…/swot/page.tsx` | fake modal → honest button |
| `…/business-model-canvas/page.tsx` | fake modal + "AI draft added" toast → honest button |
| `…/lean-canvas/page.tsx` | fake modal + mishandled enqueue → honest button (autosave intact) |
| `…/value-proposition/page.tsx` | new honest button |

Contract: `cofoundaz-api/docs/fe-integration-guide-business-builder.md` §4/§10;
`GET /jobs/{id}` for status (Bearer only, no `X-Workspace-Id`).

## Verification (live, staging via dev proxy)

- **Endpoint** — `POST /business-builder/canvases/business_model/ai-fill` → **202
  `{job_id, status:"queued"}`**; `GET /jobs/{job_id}` → `status:"queued"`,
  `type:"business.canvas.ai_fill"` (confirms the deferral — no worker, stays queued).
- **UI** — the "Fill with AI" button on the Business Model canvas fires the real
  `202` and swaps to **"AI draft queued — coming soon"** (no fabricated success).
- **No regressions** — lean-canvas (the complex page whose fake modal was removed)
  still loads with its autosave ("Saved to cloud · last synced …") intact.
- No data mutated (the jobs are harmless no-ops); nothing to clean up.
- Gates: `typecheck` 0 · `lint` 0 errors · **188** unit · clean `build` · e2e ✓.

## Follow-ups

- **Backend**: this is blocked on the AI-fill worker (Module 03 AI Co-Founder). Once
  it drains `business.{canvas|kind}.ai_fill` jobs and writes results, the FE should
  poll `GET /jobs/{id}` to `succeeded`/`failed` and refresh the canvas/record — the
  hook already returns the `job_id` to build that on.
- **Record kinds**: `useBusinessAiFill.requestRecordFill` exists but no record page
  surfaces it yet (personas/etc. use explicit add forms); wire it when the worker
  ships. Mentor role-gating already surfaced (403 → friendly message).
- The canvas pages that are still mock for *persistence* (mission-vision,
  business-model, value-prop, swot) remain a separate canvas-writes follow-up
  (only lean has real GET/PUT today).
