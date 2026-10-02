# SOP — Wire the AI business-plan generator (real async flow)

**What shipped:** replaced the mock business-plan page with the real async
generator (`POST /business-builder/plan/generate` → poll `GET /business-builder/plan`
→ open the generated Document). Branch `fix/business-plan-generator` → PR to `develop`.

## Why

`app/(dashboard)/business-builder/plan/page.tsx` was a local mock — a hardcoded
readiness checklist, decorative Audience/Length toggles (the API takes **no body**),
and a `setTimeout` that faked a "ready" state without ever calling the backend. The
real endpoint (BE guide `fe-integration-guide-ai-business-plan.md`) was never used.

## How

- **`lib/api/business-builder.ts`** — added `generatePlan()` (`POST /plan/generate`
  → `202 {plan_id, status}`), `getPlan()` (`GET /plan` → latest run, `404` → `null`),
  and `getPlanDocument(id)` (`GET /documents/{id}`), plus `BusinessPlanRun` /
  `PlanDocument` types.
- **`hooks/useBusinessPlan.ts`** (new) — effect-driven poller: on mount resumes the
  latest run (`complete` → load doc; `generating` → resume polling from the run's
  `created_at`; `404` → idle). `generate()` POSTs then polls `GET /plan` every 4s.
  Because a stuck `generating` is indistinguishable from "still working" server-side
  (guide §0/§4), the poll is bounded to **2 minutes** → an honest `timeout`/retry
  state. Handles `403` (non-editor) and `failed`.
- **`app/(dashboard)/business-builder/plan/page.tsx`** — rewired to the hook with
  states: checking / idle / generating / ready (section preview + **Open in
  Documents** link to `/documents/{document_id}`, reusing the existing editor) /
  timeout / forbidden / error. Removed the fake checklist + non-functional options.

## Verification

| Check | Result |
|---|---|
| typecheck / lint / unit | 0 / 0 / 229 |
| build / e2e | clean / 153 |
| **Live (staging, test account)** | `GET /plan` → `404` (→ idle); `POST /plan/generate` → `202 {plan_id, status:"generating"}`; polling resolved to `complete` with a real **10-section** plan (genuine LLM content about Kolo — micro-savings for gig workers, not stub). The page rendered the preview and **Open in Documents** opened the real editable "Kolo — Business Plan" Document. |

## Notable discovery — the LLM worker now drains on staging

Contrary to the earlier "AI worker doesn't drain" assumption, the plan completed
with real content, and a spot-check of **canvas AI-fill** (SWOT) also drained in
~45s with real blocks ("Intense competition from banks…", "Unclear product-market
fit", …). So the Pattern-B AI features are **no longer worker-blocked** on staging.

## Follow-ups

- **Upgrade canvas/record AI-fill** from the honest "queued — coming soon" stub to
  real polling + render the filled content (the worker now completes these).
- **Assessment narrative is still blocked upstream** — `next_question` returns
  `key`/`dimension`/`options` but **no question prompt text** (`serialize_question`),
  so the assessment can't be taken, so no narrative is produced. BE fix needed.
- No plan history endpoint in v1 (`GET /plan` returns only the latest); a "previous
  plans" view would read `GET /documents?kind=business_plan`.
