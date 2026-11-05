# Investor Readiness: PRD + mock gap list (design pass, 2026-11-05)

Source of truth: `Cofoundaz_Technical_PRD.md` Module 15 (15.1 to 15.5), Module 14 for the hand-off. Design:
`docs/superpowers/specs/2026-11-05-investor-readiness-design.md`. Walked from code, not live: there is **no BE** for this
module (no route, table or service) and the FE is five mock pages over `hooks/useReadinessApi.ts` (hard-coded state, hidden
from the sidebar by FE #184). Every row below is therefore a gap. Slices: **A** score engine + history, **B** deck review,
**C** narrative, **D** mock Q&A, **FE** page wiring. "Default" = lead default, reversible, no product call needed.

## Mock control inventory (every control on the five pages)

| # | Page | Control | Today | Gap row |
|---|---|---|---|---|
| M1 | layout | 5 tab pills (Score & Gaps, Deck Review, Mock Q&A, Narrative Check, History) | real navigation | works |
| M2 | layout | `ShellTopBar` (search, Health chip, bell) | real | works |
| M3 | score | gauge (overall) + colour band | renders hard-coded 64 | 1 |
| M4 | score | verdict headline (3 bands) | real copy, mock score; apostrophe in "Not yet, and that's fine" differs from PRD comma wording | 2 |
| M5 | score | **Open Funding Hub** (≥ 70) | routes to `/funding` | 3 |
| M6 | score | 6 dimension bars | hard-coded | 4 |
| M7 | score | gap cards + **Fix this** | hard-coded 2 gaps | 5, 6 |
| M8 | score | empty "No critical gaps detected." | shown only if list empty | 6 |
| M9 | deck | **Select PDF File** (empty state) | `setTimeout` fake, no file chooser | 12 |
| M10 | deck | empty headline / copy | differs from PRD "Your deck gets one first impression. Rehearse it here." | 12 |
| M11 | deck | **Re-review new version** | fake timeout | 13 |
| M12 | deck | 3 score tiles (Narrative, Design, Data clarity) | hard-coded | 14, 15 |
| M13 | deck | Top fixes list | hard-coded | 14 |
| M14 | deck | slide-by-slide rows with icon placeholder | no thumbnails; "Reviewed just now" hard-coded | 16 |
| M15 | deck | toast "Reading your deck like a partner on a Monday morning…" | toast only; PRD wants a job state | 12 |
| M16 | Q&A | Topic focus ×4 (General / Financials / Market / Team) | local state | 18 |
| M17 | Q&A | Intensity ×3 (Friendly angel / Skeptical VC / Term-sheet grilling) | local state | 18 |
| M18 | Q&A | **Start session** | canned first line | 18 |
| M19 | Q&A | chat input + send | canned reply "Can you elaborate…" after 1 s | 19 |
| M20 | Q&A | **End session** | toast, shows fixed scorecard | 20 |
| M21 | Q&A | scorecard: strongest, weakest, model answer | hard-coded text | 20 |
| M22 | Q&A | PRD: per-answer rating, overall trend vs past sessions | missing | 21 |
| M23 | Q&A | PRD copy "Rough edges found here are cheap…" | present | works |
| M24 | Q&A | **Run another session** | resets local state | 18 |
| M25 | narrative | draft textarea + **Save draft** | toast only, not saved | 22 |
| M26 | narrative | "AI Discrepancies" cards | hard-coded 2 findings | 23, 24 |
| M27 | narrative | empty "Your narrative is perfectly aligned." | when list empty | 24 |
| M28 | narrative | no **Run check** button (page says "will be analyzed") | missing | 23 |
| M29 | history | trend chart | fixed polyline, fake month labels | 25 |
| M30 | history | Mock Q&A session log table | 2 hard-coded rows | 26 |
| M31 | history | PRD review log, markers, range | missing | 25, 26 |

## Gaps

| # | Area | Gap | PRD | BE | FE | Default / decision | Slice |
|---|---|---|---|---|---|---|---|
| 1 | Score (BE) | No scoring at all; `overall` is a literal | 15.1 `GET /readiness/score`; `readiness_scores` | engine + tables + endpoint | read real score, loading + error state with retry (not an empty score) | D-IR-1 (deterministic), D-IR-2 (weights) | A |
| 2 | Score copy | Verdict bands exist; headline text should match the PRD exactly ("Not yet — and that's fine…" uses an em dash in the PRD; our rule strips dashes from output, so keep the comma wording) | 15.1 | none | keep, driven by `band` from API | default: keep current comma copy | FE |
| 3 | Hand-off | **Open Funding Hub** at ≥ 70 | 15.1 | `ready` flag in the score block | button from `ready`; Funding unhidden separately | default: soft link, never a hard gate (spec §6) | A + FE |
| 4 | Dimensions | 6 bars hard-coded; need real per-dimension score, **not enough data** state | 15.1 | per-dimension scoring from the signal table | bars + "Not enough data yet" state | defaults in spec §2 | A + FE |
| 5 | Gap notes | Need real notes with numbers | 15.1 | templated notes ranked by lift (top 5, ≤ 2 per dimension) | cards render API notes | default: templates, not AI (free, no hallucination) | A + FE |
| 6 | Fix CTA | `actionRoute` hard-coded (`/dashboard` for traction) | 15.1 deep links | `href` per signal; optional `learn` link from Academy recommender | **Fix this** → `href`; "Learn how" if `learn` | default | A + FE |
| 7 | Must-haves | Nothing stops 70+ without a deck / model / proof | (not in PRD) | cap at 69 + reasons | show "Capped at 69: {reason}" under the gauge | D-IR-2 | A + FE |
| 8 | Recompute | None | event-driven (implied by `readiness.updated`) | events + stale-on-read (15 min) + nightly, history only on change | none | default (mirrors D-HEA-3) | A |
| 9 | Notifications | None | "Your investor readiness score improved to {score}" | notification type; founders only; band change or ≥ +5, max 1/day | bell deep link to the page | default | A |
| 10 | Roles | No guard exists; any member could reach the mock | "Access: F; INV only if shared" | role sets + 403/404 | hide tabs the role cannot use; 403 empty state | D-IR-4 | A + FE |
| 11 | Investor share | INV reads score "if shared" | 15 header | `GET /readiness/snapshot` (share-safe); share record lives in Funding | none here | D-IR-6, Funding owns the share | A (+ Funding) |
| 12 | Deck upload | No real upload; empty copy differs | 15.2 upload PDF → job | Documents `kind=pitch_deck` upload, `POST /readiness/deck-reviews`, job, PDF validation (scan + magic bytes already in Documents) | real file chooser, drag-drop, job state "Reading your deck like a partner on a Monday morning…", PRD empty copy | default: upload through Documents so the deck is reusable in the data room | B + FE |
| 13 | Deck versions | Re-review does nothing; no version history | 15.2 "keeps version history with score trend" | `version` per deck, content-hash dedup, list endpoint | version dropdown + mini trend; **Re-review new version** uploads a new Documents version | default | B + FE |
| 14 | Deck scores | Narrative /10, Data clarity /10, top 5 fixes | 15.2 | one strict-schema LLM call over extracted slide text | tiles + list from API | default | B + FE |
| 15 | Design /10 | Model is text-only; a real design score needs vision | 15.2 | heuristics or vision | tile or its replacement | **D-IR-5** | B |
| 16 | Slide strip | No thumbnails; "Reviewed just now" fake | 15.2 slide-by-slide strip, thumbnail + notes | `pypdfium2` rasterise → storage → signed URL | thumbnails, real reviewed-at | default: add `pypdfium2` | B + FE |
| 17 | Deck failure | No failed / over-budget / unreadable-PDF state | (implied) | `status failed` + reason; budget gate | honest message + retry | default | B + FE |
| 18 | Q&A setup | Focus + intensity + start are local only | 15.3 | `POST /readiness/qa-sessions`; persona prompts ×3; budget pre-flight (`409 AI_BUDGET_LOW`) | wire setup, show low-budget message, **Run another session** | D-IR-7 | D + FE |
| 19 | Q&A chat | Canned reply | 15.3 AI = investor persona | turn endpoint, context pack from the founder's real numbers, 10-turn cap | real replies, typing state, error + retry, cap notice | D-IR-7 | D + FE |
| 20 | Scorecard | Fixed text | 15.3 per-answer rating, strongest, weakest + model answer | scoring job | render real scorecard, "Generating scorecard…" job state | default | D + FE |
| 21 | Trend | No per-answer rating list or "trend vs past sessions" | 15.3 | `answers[]`, `overall_rating`, trend note from previous sessions | rating chips per answer + trend line | default | D + FE |
| 22 | Draft | **Save draft** only toasts | 15.4 narrative draft editor | `GET/PUT /readiness/narrative` | real save, dirty state, last saved | default: autosave not needed | C + FE |
| 23 | Checker | No way to run the check | 15.4 `POST /readiness/narrative/check` (job) | claims extraction (LLM) + facts (Finance) + comparison (code) | **Run check** button, job state, findings list | default: LLM extracts, code compares (spec §3.4) | C + FE |
| 24 | Findings | Hard-coded two; "headcount" example needs a headcount fact | 15.4 PRD copy | findings with severity; unverified claims separate from mismatches | cards with "Fix the number or the story." copy; empty state | default | C + FE |
| 25 | History chart | Fake polyline and months | 15.5 score trend | `GET /readiness/history?range=` points + markers | real time axis, range picker 30/90/365, markers | default (as Health) | A + FE |
| 26 | Session log | 2 fake rows; PRD says session **and review** log | 15.5 | merged log of Q&A sessions and deck reviews | table with type column; row opens the scorecard / review | default | A (+B,D) + FE |
| 27 | Story signal | Story needs the artefacts above to score | 15.1 Story | Story reads deck / narrative / Q&A / plan artefacts | gap CTAs to those pages | D-IR-1 | A (stub), then B-D |
| 28 | Market size | Nothing stores TAM/SAM/SOM; investors ask first | (Market dimension) | `readiness_inputs` | small "Add sourced market size" form on the score page | default: counts only with a source URL, ≤ 40% of Market | A + FE |
| 29 | Events | `readiness.updated` | 15 Events | publish on persisted change | none | default | A |
| 30 | Sidebar | Entry hidden by FE #184 | n/a | none | unhide **only when A-D and FE are merged and re-walked** | Adebayo's "no half-built pages" bar | FE |
| 31 | Docs | No FE guide, SOP, checklist ticks | repo standard | live captures per slice | | default | each slice |
| 32 | Admin | Support / staff cannot see a workspace's score | (admin portals) | none in v1 | none | default: out of scope; staff use DB read | later |

## Decisions (all accepted 2026-11-05)

Lead recommendation is first in each list. Cost = build effort and ongoing AI spend (budget is 100k tokens per workspace per day).

### D-IR-1: How is the score produced?
**Accepted 2026-11-05 (Adebayo: \"Accept all seven\"), recommended option.**
- **(a) Deterministic from app data; AI only produces stored review artefacts that feed Story (recommended).** Every point
  traces to a number in another hub. Free to recompute (0 tokens), explainable, cannot be talked up by the founder.
  Story is the one blended dimension: deterministic checks (deck exists, investor plan generated) plus the latest AI
  review ratings.
- (b) AI judges the whole readiness from a context dump. Feels smart, but costs ~10k+ tokens per recompute, drifts
  between runs, and cannot be audited ("why 63 today and 66 tomorrow?"). Not recommended.
- (c) Fully deterministic, Story = artefact exists only (no AI inputs). Cheapest, but the Story bar would reward a
  bad deck the same as a good one.

### D-IR-2: Weights, stage scaling and the 70+ gate
**Accepted 2026-11-05 (Adebayo: \"Accept all seven\"), recommended option.**
- **Recommended:** Traction 25 · Financials 20 · Product 15 · Market 15 · Team 15 · Story 10; targets scaled to the
  startup's stage (ready for a round *at your stage*); overall **capped at 69** until a financial model, a reviewed deck
  and one traction/validation proof point exist.
- Alternative: equal weights (about 17 each), simpler to explain, ignores that investors care most about traction.
- Alternative: no stage scaling, a flat bar. An idea-stage founder would sit under 40 for months, which is accurate but
  demoralising. Cost: config only, any option is the same build.

### D-IR-3: How does Readiness relate to Health Score?
**Accepted 2026-11-05 (Adebayo: \"Accept all seven\"), recommended option.**
- **Recommended: two separate scores over shared inputs.** Health = "how healthy is the business" (5 dimensions);
  Readiness = "would an investor write a cheque" (6 dimensions, includes deck and narrative). They reuse the same
  readers, so work in the app moves both. Show a small "Health {n}" chip on the Readiness page, no merging.
- Alternative: derive Readiness from Health plus extras. Less code, but the dimension sets differ (Legal vs Story) and
  a Health change would silently move Readiness.
- Alternative: fold Readiness into Health as a sixth dimension. Rejected: the PRD gives it its own module and verdict copy.

### D-IR-4: Who can see it?
**Accepted 2026-11-05 (Adebayo: \"Accept all seven\"), recommended option.**
- **Recommended:** founder full; team member reads score, gaps, history, deck review and narrative, but not Q&A
  transcripts and cannot run AI tools; mentors, consultants, accountants, legal advisors get 403; investors only through
  a share (D-IR-6).
- Alternative: founder only (the PRD wording): simplest, but a co-founder running ops cannot see why the score moved.
- Alternative: let mentors/consultants read the score: useful for coaching, but exposes fundraising posture to people
  the founder invited for other reasons.

### D-IR-5: Pitch Deck "Design /10" and thumbnails
**Accepted 2026-11-05 (Adebayo: \"Accept all seven\"), recommended option.**
- **Recommended: text-based review plus layout heuristics (slides, words per slide, images per slide via PDF
  structure) behind the Design tile, labelled "layout check, not a visual review"; add `pypdfium2` for real thumbnails.**
  Honest with what the model can actually see. ≈ 10k tokens per review.
- Alternative: vision model reads each slide image. A real design opinion, ~25-40k tokens per review (every page as an
  image), needs a vision-capable model enabled and tested; not verified that our provider setup supports images.
- Alternative: drop the Design tile and show two scores. Smallest build; deviates from the PRD's three scores.

### D-IR-6: What an investor sees of the score, and who builds the share
**Accepted 2026-11-05 (Adebayo: \"Accept all seven\"), recommended option.**
- **Recommended: investors see score, band and the six dimension bars only (no gap notes, no transcripts, no draft); the
  share record is the Funding data-room scope `readiness`, owned by the Funding build; Readiness only provides the
  `snapshot` function.** No Readiness-side share UI in v1.
- Alternative: also show gap notes ("here is what they are fixing"): transparent, but hands an investor a list of weaknesses.
- Alternative: no investor visibility in v1: cheapest, drops a PRD line.

### D-IR-7: Mock Q&A limits and retention
**Accepted 2026-11-05 (Adebayo: \"Accept all seven\"), recommended option.**
- **Recommended: 10 founder answers per session; refuse to start when less than ~40k tokens remain today; full
  transcript kept 90 days and visible to the founder only, scorecard kept indefinitely.** A session costs ~35k tokens (the
  largest AI spend in the app), so at most two fit in a day.
- Alternative: 6 turns (~22k): cheaper, thinner practice. Alternative: unlimited turns: risks eating the day's budget
  for the Advisor and Mission.
- Alternative: keep transcripts forever: nicer history, more sensitive data at rest.

## Lead defaults (no call needed)

- Gap notes are templates with real numbers, never model prose; ranked by potential lift, top 5, ≤ 2 per dimension.
- Recompute: events + stale-on-read (15 min) + nightly; history row only when the score or cap changes.
- Deck is uploaded through Documents (`pitch_deck`), same 15 MB cap and malware scan; same content hash never re-spends tokens.
- Narrative check: LLM extracts claims, **Python compares numbers** (10% tolerance); unverified claims listed apart from mismatches.
- No AI call on page load; every AI call is metered and has an honest over-budget message.
- Funding hand-off is a soft link; Funding may show a readiness banner (see spec §6).
- Sidebar entry returns only after every page is real and re-walked.

## Build order

A (score + history) → B (deck) ∥ D (Q&A) → C (narrative) → FE → lead re-walk → unhide. Waits only on D-IR-1..7;
A can start on defaults after D-IR-1/2/3/4 are answered.

## Status (2026-11-05)

D-IR-1..7 accepted 2026-11-05 (recommended options). Slice A (score + history) is in build on `feature/readiness-score`. Nothing is verified live yet.
