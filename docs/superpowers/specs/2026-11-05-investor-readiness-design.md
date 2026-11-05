# Investor Readiness: design

Status: **proposed, waiting for Adebayo's calls on D-IR-1..7** (`docs/checklist/investor-readiness-prd-gaps.md`).
Source: `Cofoundaz_Technical_PRD.md` Module 15 (15.1 to 15.5), Module 14 for the hand-off. Today the five pages are 100%
mock (`hooks/useReadinessApi.ts` returns hard-coded state; no BE route, table or service exists) and hidden from the
sidebar (FE #184). Nothing here is built yet. Defaults below apply unless a D-IR answer changes them.

## 1. What the page is for

Answer one question for a founder: **"If I started talking to investors today, what would they find missing, and what is
the shortest path to fix it?"** Five pages: Score & Gaps, Deck Review, Mock Q&A, Narrative Check, History.

Principle (same as Health Score): **every point traces to something real in the app.** The score is computed from data
that already exists in the other hubs; AI is used only where a human-style judgement is the product (deck review, mock
investor, narrative extraction), and those results feed the score as stored artefacts, never as a live model call.

## 2. Scoring model

### 2.1 Dimensions, weights, verdict

Default weights (D-IR-2): **Traction 25 · Financials 20 · Product 15 · Market 15 · Team 15 · Story 10 = 100.**
Rationale: investors weight evidence of demand and money discipline over polish; Story is lowest because it is the
only dimension that is partly AI-judged and the easiest to game.

`overall = round(sum(weight × dimension_score) / 100)`. Verdict bands from the PRD: `< 40` "Not yet…", `40-69` "Getting
close…", `70+` "You're ready to run a process." and the **Open Funding Hub** CTA.

**Must-have cap (D-IR-2):** overall is capped at **69** until three artefacts exist: a financial model (status ready),
a reviewed pitch deck, and at least one traction or validation proof point (recorded revenue, a won deal, or a
validated assumption with ≥ 10 smoke-test signups or ≥ 5 interviews). The cap is shown ("Capped at 69: add a reviewed
pitch deck") so it is honest, not hidden. Without it a workspace could reach 70+ with a perfect Team and Product score
and no deck.

### 2.2 Signal table (one declarative table, as `health_score/live_signals.py`)

Each signal: `key, dimension, label, unit, targets-by-stage, read(db, startup), href, gap_note template`. A signal
scores `min(value / target, 1) × 100`; `None` = "not applicable yet" and is dropped from the average (never counted
as 0, except the Story artefact signals where absence is the finding). Dimension score = mean of its applicable
signals. Targets scale by `Startup.stage` (idea → scale) so the score means "ready for a round **at your stage**"
(D-IR-2); an idea-stage founder is not told Traction is 0 forever.

| Dim | Signal | Reads from (existing service) | Gap note → fix deep link | Missing today |
|---|---|---|---|---|
| **Team** | Active members (≥ 2 incl. a co-founder) | `Membership` (reuse Health `team` signal) | "You are a solo founder. Investors back teams; invite a co-founder or first hire." → `/team` | no "full-time / equity" flag, so we cannot tell co-founder from employee; v1 counts active founder+TM members |
| | Founder agreement signed | `Document` kind `founder_agreement` + `SignatureRequest.completed` (Documents) | "No signed founder agreement. Diligence asks for it first." → `/documents` (template) | none |
| | Advisor or mentor attached | `Membership` role mentor / business_consultant / legal_advisor | "No advisor on the cap table of credibility. Invite a mentor." → `/team` | none |
| | Assessment Team score | `AssessmentResult.dimension_scores`, latest (Assessment) | "Your assessment flagged Team gaps." → `/assessment` | none |
| | Workspace activity + mission streak | Health `team` live signals (`live_signals.py`) | "Activity has stalled." → `/mission` | none |
| **Traction** | Revenue recorded, 30 d, and month-on-month growth | `kpi_metrics` revenue + `KpiSnapshot` (Dashboard/Finance) | "No recorded revenue. Log income in Finance." → `/finance` | no MRR/growth helper; slice A adds `traction.mrr_series()` over transactions |
| | Paying customers (distinct payers/clients, won deals) | `Deal` won + paid `Invoice` (Sales, Finance) | "No won deals or paid invoices yet." → `/sales/pipeline` | distinct-customer count helper |
| | Pipeline coverage (open deal value vs stage target) | `Deal`, `PipelineStage` (Sales) | "Pipeline is thin." → `/sales` | none |
| | Demand proof: smoke-test signups, interviews, survey responses | `SmokeTestEvent`, `Interview`, `SurveyResponse` (Validation) | "No demand proof recorded." → `/validation` | none |
| **Market** | Assumptions validated / invalidated | `Assumption.status` (Validation; reuse Health `market`) | "Most assumptions are untested." → `/validation/assumptions` | none |
| | Customer interviews, 30 d | `Interview` (reuse Health) | "Talk to 5 customers." → `/validation/interviews` | none |
| | Canvas customer segments + competitors filled | `BusinessCanvas`, `BusinessPositioningMap` (Business Builder) | "Competitor map is empty. Investors ask 'who else?'" → `/business-builder/positioning` | none |
| | Market size with a source (TAM / SAM / SOM) | **nothing stores it** | "Add a sourced market size." → score page inline form | new `readiness_inputs` row (founder-entered, counted only with a source URL, max 40% of the Market dimension: it is a claim, not evidence) |
| **Product** | Roadmap tasks done % | `RoadmapTask` (reuse Health `product`) | "Roadmap is stalled at {n}%." → `/roadmap` | none |
| | Mission completion, 7 d | Mission (reuse Health) | → `/mission` | none |
| | Solution / value proposition defined | `BusinessCanvas` blocks (UVP, solution) | "Canvas has no solution block." → `/business-builder/canvas` | none |
| | Product usage proof (launched stage, smoke test converting) | `Startup.stage`, `Experiment` smoke-test results | "No proof anyone uses it." → `/validation/experiments` | none |
| **Financials** | Runway months vs 12; profitable = full | `finance.runway.runway_payload` (Finance) | "Runway is {n} months. Raise or cut before outreach." → `/finance/runway` | none |
| | Financial model ready and fresh | `FinancialModel.status == ready` and `overrides_rev == calculated_rev` | "Model is {stale/missing}." → `/finance/model` | none |
| | Books current (transactions last 30 d, categorised) | `Transaction` (reuse Health) | "No transactions logged this month." → `/finance` | none |
| | Use of funds defined | the **Narrative** draft (§3.4) or a round target in Funding (when built) | "You have not said what the money is for." → `/investor-readiness/narrative` | depends on slice C (draft) |
| **Story** | Pitch deck reviewed; latest deck review overall | `deck_reviews` (new, §3.2) → score = mean of Narrative / Data clarity (+ Design if D-IR-5 keeps it) × 10 | "No deck reviewed yet." → `/investor-readiness/deck` | slice B |
| | Business plan generated for investors | `BusinessPlan` with `options.audience == investors` (Business Builder) | "Generate an investor business plan." → `/business-builder/plan` | none |
| | Narrative consistent with the numbers | latest `narrative_checks` (0 open high findings = 100) | "Deck and model disagree." → `/investor-readiness/narrative` | slice C |
| | Defended the pitch: latest Mock Q&A rating | `mock_sessions.scorecard` | "Rehearse your Q&A." → `/investor-readiness/qa` | slice D |

Dimensions with every signal `None` (e.g. brand-new workspace) show **"Not enough data yet"** with the signals that
would unlock them, instead of a 0 that reads as a verdict.

### 2.3 How a gap note and its fix link are chosen

1. Every signal below target yields a candidate gap: `lift = dimension_weight × (1 − signal_score/100) / n_signals_in_dimension`
   = points the overall score would gain by hitting target (same "potential lift" idea as Health D-HEA-4).
2. Sort by lift, take the **top 5**, at most 2 per dimension so one weak area does not hide the rest.
3. Note text is a **template filled with the real numbers** (table above), not model output: deterministic, free,
   and cannot hallucinate. `href` is the signal's source page.
4. **Learn link (optional, free):** each gap also carries `learn: {title, href}` from the Academy recommender
   (`services/learning/recommendations.py`) keyed by dimension tag, shown as a small "Learn how" link under "Fix this".
   If the recommender has nothing for that tag the key is `null` and the FE hides the link.
5. The existing mock's `gaps[] {dimension, note, actionRoute}` shape is kept (plus `signal_key`, `lift`, `learn`) so
   the page needs little change.

### 2.4 Reuse, not rebuild

`live_signals.SIGNALS` already holds readers for roadmap %, mission completion, assumptions, interviews,
transactions, runway, e-signatures, members, activity, streak. The readiness engine **imports those `read` callables**
and wraps them with its own targets and gap templates; it does not copy the queries. New readers (revenue growth,
paying customers, pipeline coverage, canvas completeness, model freshness, founder agreement, advisor, artefact
signals) live in `services/readiness/signals.py`. Health and Readiness stay two scores over shared inputs (D-IR-3).

## 3. Components

### 3.1 Score engine (slice A)

- `services/readiness/{config,signals,scoring,service,triggers}.py` mirroring `health_score/`.
- `config.py`: weights, bands, cap rules, `CONFIG_VERSION` (stored on every row so a weights change is visible in history).
- **Recompute triggers** (same policy as D-HEA-3, one more reuse): (a) event bus: subscribe to the Health refresh
  events (`mission.*`, `roadmap.*`, `document.signature.completed`, `workspace.member.joined`, `business.plan.generated`)
  plus new `readiness.deck.reviewed`, `readiness.qa.scored`, `readiness.narrative.checked`; (b) **on read when the
  cached row is older than 15 min**; (c) nightly scheduler pass for active workspaces. Min 15 min between event-driven
  recomputes per workspace. Honest gap: Health's own event list does not cover finance transactions, validation or deals,
  so those inputs are picked up by (b) and (c), at most 15 min stale on read. Adding events for them is a
  follow-up for both scores.
- **Caching:** `readiness_scores` holds the latest row per workspace (one read = one indexed row, no recompute on the
  hot path unless stale). A recompute is pure SQL reads, no LLM, no tokens.
- **History:** a `readiness_score_history` row is written only when the score or the cap state changes.
- **Notifications** (registered in the notification registry): "Your investor readiness score improved to {score}"
  sent to founders only, at most once per 24 h and only when the band changes or the score rose ≥ 5 since the last
  notification; "Mock Q&A session summary ready" (slice D).
- **Event:** `readiness.updated {startup_id, score, previous_score, band, ready}` after a persisted change.

### 3.2 Pitch deck review (slice B)

- Upload goes through **Documents** (`kind=pitch_deck`, PDF, existing 15 MB cap, malware scan, versions, data-room
  reuse later), then `POST /readiness/deck-reviews {file_id}`. The deck stays one object across Documents, Readiness
  and (later) the Funding data room.
- Job (`platform/jobs`, type `readiness.deck_review`, counted as AI enrichment so the budget gate applies): extract text
  per page with `pypdf` (already a dependency), cap 30 slides and 6k tokens of text; one `metered_complete_json` call with a
  strict schema → `{narrative, data_clarity, design?, top_fixes[5], slides[{n, title, notes}]}`.
  Prompt wraps the extracted text in a fence (same prompt-injection discipline as the public survey answers).
- **What the model cannot see:** the LLM client is text-only (`platform/llm.py`, no image input). So "Design /10"
  cannot be a real visual judgement. D-IR-5 decides: layout heuristics only (rec), vision, or drop the tile.
- **Thumbnails:** the PRD strip shows a thumbnail per slide. `pypdf` cannot rasterise; add `pypdfium2` (pure wheel, no
  system library) and store PNGs via `platform/storage`, served by signed URL. Generated once per review, not per view.
- Versioning: `version` increments per workspace per deck file; "Re-review new version" uploads a new Documents version
  and starts review N+1. The same content hash never re-spends tokens (returns the existing review).

### 3.3 Mock Q&A (slice D)

- `POST /readiness/qa-sessions {focus, intensity}` creates a session. Each turn is one synchronous
  `metered_complete` call (the same pattern the Sales coach chat uses): persona system prompt (three intensities map to
  three prompt blocks) + a **context pack** (≈ 1.2k tokens: canvas headline, plan summary, revenue / runway, validation
  verdicts, so the "investor" asks about the founder's real numbers) + the transcript.
- **Turn cap 10** founder answers (D-IR-7); the session auto-moves to "ending" at the cap.
- `POST …/end` queues a scoring job: one `complete_json` call → `{answers[{q, a, rating 1-5}], strongest, weakest,
  model_answer, overall_rating, trend_note}`; `overall_rating` ∈ Needs work / Good / Strong, which is what the History
  table shows and what the Story "defended the pitch" signal reads.
- Pre-flight: refuse to start (`409 AI_BUDGET_LOW`, honest message) when `llm_budget.headroom` is under the session's
  worst case (~40k), instead of dying mid-answer.

### 3.4 Financial narrative (slice C)

- `readiness_narrative` (one editable draft per workspace, autosave-able) and `narrative_checks` (history).
- Check job, **LLM extracts, code compares**: (1) `complete_json` extracts structured claims from the latest deck text and the
  draft: `{metric, value, currency, period, source: deck|draft, slide?}` (MRR, ARR, burn, runway, headcount, ask, growth);
  (2) a **facts builder** reads the same metrics from Finance (`kpi_metrics`, `runway_payload`, `FinancialModel` assumptions /
  pnl); (3) Python compares per metric with a 10% tolerance and emits findings
  `{severity, claim, fact, message}` using the PRD copy ("Deck says ₦2M MRR; your model says ₦1.6M. Fix the number or the
  story."). The model never judges a number, so it cannot invent a discrepancy. Metrics Finance has no fact for are reported
  as "unverified claim", not as a mismatch.
- Check needs a deck review (slice B) or a non-empty draft; with neither it returns an empty-state reason.

### 3.5 History

`GET /readiness/history?range=30|90|365` → `{points[{at, score, band, dims}], markers[{at, label}], log[...]}`.
Markers: deck reviewed, Q&A scored, narrative checked, band changed, cap lifted. The log merges deck reviews and Q&A
sessions (the PRD "session/review log"); the mock's trend polyline becomes real data.

## 4. AI touchpoints and token cost

Budget: `LLM_DAILY_TOKEN_BUDGET = 100000` per workspace per UTC day, **shared with every other AI feature** (mission,
roadmap, advisor chat, Business Builder). Estimates (≈ 4 chars/token; measured on real runs during each slice):

| Touchpoint | Calls | In | Out | ≈ Total | Notes |
|---|---|---|---|---|---|
| Score recompute, gap notes, learn links | 0 | 0 | 0 | **0** | pure SQL + templates |
| Deck review (20 slides) | 1 | 8k | 2.5k | **~10k** | content-hash dedup; 1 per version |
| Mock Q&A session (10 turns) | 10 + 1 | 3k avg per turn + 4k scoring | 250 × 10 + 1k | **~35k** | the budget hog; cap + pre-flight |
| Narrative check | 2 | 6k | 1.5k | **~8k** | manual button only |
| Meeting prep, etc. | n/a | | | | Funding's, not ours |

A heavy readiness day (deck + one Q&A + one check) ≈ **55k of 100k**, leaving 45k for the rest of the app; two Q&A
sessions in one day will hit the cap and the second gets the honest low-budget message. All calls go through
`metered_complete*` so usage lands in `llm_usage`. No AI call on page load, ever.

## 5. Roles and access

Defaults pending D-IR-4. PRD: "Access: F; INV sees Readiness Score only if shared."

| Role | Score, gaps, history | Deck / Q&A / narrative (read) | Run AI tools, edit narrative | Notes |
|---|---|---|---|---|
| founder | read | read | **yes** | |
| team_member | read | read deck review + narrative; **no** Q&A transcripts | no | spend and pitch practice stay the founder's |
| mentor, consultant, accountant, legal | **403** | 403 | 403 | no fundraising signal for advisors by default |
| investor | **only via a share** (§6) | no | no | read-only snapshot |

Guards follow the existing role-set pattern (`READINESS_READ_ROLES`, `READINESS_WRITE_ROLES` in `enums.py` next to
`FINANCE_ROLES`). Cross-workspace access returns 404 as elsewhere.

## 6. Hand-off to Funding Hub (interface assumption)

The `funding-design` session owns Module 14. **Assumed interface, to be reconciled in review of both PRs:**

1. **Soft link, no hard gate.** Funding Hub is reachable at any score. Readiness only *recommends* it: "Open Funding Hub"
   at ≥ 70 routes to `/funding`. (A hard gate would block founders who have a warm intro now; revisit if Adebayo wants one.)
2. Readiness exposes `GET /readiness/score` with a stable `{score, band, ready, capped, computed_at}` block plus
   `GET /readiness/snapshot` (a share-safe subset: score, band, six dimension scores, `computed_at`, **no gap notes, no
   transcripts**).
3. Funding consumes it two ways: (a) a banner on the pipeline when `ready == false` ("Readiness {score}: close these
   gaps before outreach", link back) reading the event `readiness.updated` or the score endpoint; (b) the data-room
   **share scope `readiness`** (PRD: INV gets "read-only shared Data Room + Readiness"). Funding owns the share record and
   the investor-facing route; it calls the snapshot function in-process. Readiness owns no share table.
4. Event contract: `readiness.updated {startup_id, score, previous_score, band, ready}` (bus). Funding must not write
   Readiness tables. The Funding "Prep me for this meeting" brief may read the latest `gaps[]` through the same service
   function.

## 7. Data model sketch (migration numbers are "next free" at build time; head is `0088` today)

| Table | Columns (beyond `id`, timestamps) | Slice |
|---|---|---|
| `readiness_scores` (1 row / workspace, unique `startup_id`) | `score`, `band`, `capped`, `cap_reasons` jsonb, `dimensions` jsonb `{dim: {score, weight, signals[{key,label,value,target,score,href,note}]}}`, `gaps` jsonb, `config_version`, `trigger`, `computed_at` | A |
| `readiness_score_history` | `startup_id`, `score`, `band`, `dimension_scores` jsonb, `capped`, `trigger`, `config_version`; index `(startup_id, created_at)` | A |
| `readiness_inputs` (unique `startup_id`) | `tam_minor`, `sam_minor`, `som_minor`, `currency`, `source_url`, `updated_by` | A |
| `deck_reviews` | `startup_id`, `document_id`, `file_id`, `version`, `content_sha256`, `status` (queued/running/ready/failed), `scores` jsonb, `top_fixes` jsonb, `slides` jsonb, `slide_count`, `tokens_used`, `error`, `job_id`, `created_by`; unique `(startup_id, version)` | B |
| `mock_sessions` | `startup_id`, `created_by`, `focus`, `intensity`, `status` (active/ending/scored/failed), `turns`, `transcript` jsonb, `scorecard` jsonb, `rating`, `tokens_used`, `started_at`, `ended_at` | D |
| `readiness_narrative` (unique `startup_id`) | `body` text, `updated_by` | C |
| `narrative_checks` | `startup_id`, `deck_review_id` null, `draft_sha256`, `claims` jsonb, `facts` jsonb, `findings` jsonb, `status`, `tokens_used`, `error` | C |

The PRD's `transcript_ref` becomes a jsonb column (transcripts are ≤ 10 turns of text; no file store needed); retention per D-IR-7.

## 8. Endpoints (all under `/api/v1`, workspace-scoped like the rest)

| Route | Purpose | Roles | Slice |
|---|---|---|---|
| `GET /readiness/score` | cached score, dimensions with signals, gaps, cap state (recomputes if stale) | read set | A |
| `POST /readiness/score/recompute` | force recompute (1 per 60 s) | founder | A |
| `GET /readiness/history?range=` | points, markers, log | read set | A |
| `GET/PUT /readiness/inputs` | market-size inputs | read / founder | A |
| `GET /readiness/snapshot` | share-safe subset (in-process for Funding too) | read set | A |
| `POST /readiness/deck-reviews`, `GET /readiness/deck-reviews`, `GET …/{id}`, `GET …/{id}/slides/{n}/thumbnail` | review + versions + thumbnails | write / read | B |
| `GET/PUT /readiness/narrative`, `POST /readiness/narrative/check`, `GET /readiness/narrative/checks/latest` | draft and checker | read / founder | C |
| `POST /readiness/qa-sessions`, `POST …/{id}/messages`, `POST …/{id}/end`, `GET /readiness/qa-sessions`, `GET …/{id}` | mock investor | founder (list/read: see D-IR-4) | D |

Jobs poll through the existing `GET /jobs/{id}` (FE: poll every 2 s up to 60 s, same as other AI jobs).

## 9. Slice plan (each BE slice = one PR with its own migration, SOP, checklist ticks and live-captured FE guide)

| Slice | Contents | Depends on | Est. |
|---|---|---|---|
| **A: Score engine + History** | config, readers, scoring, cap, triggers, nightly, tables `readiness_scores/history/inputs`, endpoints score / recompute / history / inputs / snapshot, notifications, `readiness.updated`, role sets. Unblocks the Funding hand-off | none | 1 PR |
| **B: Deck review** | `pypdfium2`, thumbnails, `deck_reviews`, job, endpoints; feeds Story | A | 1 PR |
| **D: Mock Q&A** | `mock_sessions`, turn endpoint, scoring job, budget pre-flight | A | 1 PR (parallel with B) |
| **C: Narrative** | draft, claim extraction, facts builder, comparator, `narrative_checks` | A, B | 1 PR |
| **FE pass** | replace `useReadinessApi` mocks per page, real upload via Documents, polling, empty and error states, budget message, History chart; then **unhide the sidebar entry only when all five pages are real** | A-D | 1-2 FE PRs |
| **Re-walk** | every control, all roles, 1440 + 375, on merged develop | FE | lead |

Order: A → (B ∥ D) → C → FE → re-walk. Max 2 sessions at once.

## 10. Verification plan

- Score engine: unit tests per signal and per cap rule; a fixture workspace walked from empty to 70+ proving each fix
  CTA moves the number it names; recompute coalescing (15 min) and history-on-change.
- AI slices: live runs on the real model (deck: a real PDF; Q&A: a full 10-turn session; narrative: a seeded deck/model
  mismatch), tokens read back from `llm_usage` to replace the estimates above.
- FE guide for each slice from captured responses (rule: `docs/fe-integration-guide-*.md`), with unexercised paths labelled.
- Not verifiable locally: nothing external is involved (no third-party round trip), so the full flow can be live.

## 11. Out of scope for v1

Sharing UI and investor view (Funding owns, §6) · vision-based design scoring unless D-IR-5 chooses it · multi-deck
comparison · scheduled/automatic deck re-review · peer benchmarks ("founders like you") until there is cohort data ·
voice Q&A · exporting a readiness report PDF.
