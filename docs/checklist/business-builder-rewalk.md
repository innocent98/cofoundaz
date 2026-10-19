# Business Builder: full click-through re-walk (develop)

Walked on merged `develop` (FE `5127a6b`; API develop plus the re-walk fix branches), local stack, 2026-10-19,
workspace NovaPay. Each row: control → action → result checked against the raw API → ✅/❌ → fix. Real-model AI was
exercised (local daily budget reset once for the walk; the plan run then exhausted it).

## Overview (`/business-builder`), founder, 1440
| Control | Action | Result (API) | | Fix |
|---|---|---|---|---|
| Artifact tiles | load | 10 tiles from `GET /overview`: CTA from `status` (Review / Continue / Try again for the failed plan), completion, "Edited N hours ago" | ✅ | |
| Suggestions → Approve | "Add a persona: Chidi the trader" | suggestion `approved`; persona created | ✅ | |
| Suggestions → Reject | SWOT update | `rejected`; panel disappears when none are pending | ✅ | |
| Suggestion card title | SWOT suggestion | reads "Update the **swot** canvas" (raw type) | ❌ minor | FE: use the artifact label ("SWOT") |

## Canvas editors (Business Model, Lean, SWOT, Value Prop, Mission & Vision), founder, 1440
| Control | Action | Result (API) | | Fix |
|---|---|---|---|---|
| Add note | Key Partners, type, Enter | `version` 5 → 6, header "Saved · Last edited by Victor Founder, just now" | ✅ | |
| Edit note | click text, retype, Enter | `key_partners[0]` updated, new version | ✅ | |
| Move note to another block | select Channels, then back | moved both ways, versions 7, 8 | ✅ | |
| Remove note | click | removed, version 9 | ✅ | |
| Version history → preview → Restore | Version 6 → "Restore this version" → Restore | "Restored version 6"; new version 11 equals v6 (history kept). (v1-5 were wiped locally by the test-DB issue, see the handoff gotcha) | ✅ | |
| Export | click → "Open document" | `POST …/export` 201, toast "Exported to Documents: NovaPay: Business Model Canvas", opens `/documents/{id}` with every block as an editable section | ✅ | |
| Fill with AI modal | open, Cancel | copy matches the PRD with no dashes; Cancel closes | ✅ | |
| Per-block AI (real model) | Customer Relationships → Draft it | 3 ideas appended to that block only, no dashes, `version` source `ai` | ✅ | |
| Header after an AI write | same | still "Last edited by Victor Founder" until a reload (API `updated_by` null → "Last edited by AI") | ❌ minor | FE: refresh header meta when the AI job finishes |
| Block comments | Comment on Key Partners, post, Edit, Resolve, Delete | `business_canvas` comment with anchor `key_partners`; edit, resolve, delete work | ✅ | |
| @-mention in the BB comment box | type `@bb-con`, press Enter | **Enter inserts a newline** instead of picking; posted with `mention_user_ids: []` (nobody notified). Clicking the option works. The option has no accessible name | ❌ | FE: Enter/Tab picks the highlighted person, named options (same as the Roadmap thread) |
| Mission & Vision "Give me 3 options" (real model) | Vision → Draft it → "Use this" on option 3 | 3 dash-free options; chosen one saved (`version` 3) | ✅ | |
| Value Prop fit-line | Connect Instant settlement → Lost sales; Remove | `fit_links` gets the link, a line is drawn across the panels, "Instant settlement answers the pain Lost sales"; remove empties it | ✅ | |
| SWOT quadrant AI (real model) | Threats → Draft it | 3 threats added, other quadrants untouched | ✅ | |
| Lean add note | Problem | autosaved (`version` 4), "Saved" | ✅ | |
| Whole-canvas "Fill with AI" / records "Draft with AI" | | not re-run: local AI budget exhausted after the plan run; same job path as the per-block AI above | ⚠ | re-check after 01:00 WAT |
| Accessible names | every note | 43 identical "Remove" and "Move note to another block" labels | ❌ minor | FE: include the note text in the labels |

## Records (Personas, Pricing, Revenue, Competitive), founder, 1440
| Control | Action | Result (API) | | Fix |
|---|---|---|---|---|
| Add persona | fill all fields, Save | every field stored (lists split per line) | ✅ | |
| Edit / Delete persona | quote edit; delete with confirm | saved; deleted | ✅ | |
| Generate personas from my validation notes (real model) | no notes → with 2 interviews + 1 assumption | empty state "Log a customer interview or an assumption in Validation first." → "2 personas added from your validation notes", quotes from the interviews, interviewee names withheld, no dashes | ✅ | |
| Persona Export / Comment | click | "Exported to Documents: NovaPay: Customer Personas"; `business_record` comment saved | ✅ | |
| Pricing model selector / tiers | Tiered, Add tier, Save | `model_type: tiered`, 4 tiers | ✅ | |
| Pricing advisor (real model) | WTP notes + competitor price → Get pricing advice → Apply → "Yes, apply" | grounded advice, 3 tiers, questions to ask; Apply asks first, then replaces tiers | ✅ | |
| Remove tier / Delete model / Add pricing model | click | tiers 3 → 2; model deleted with confirm; new subscription model saved | ✅ | |
| Revenue growth % / months | 8%, 24 months (real typing) | `?months=24&growth_pct=8`; "Month 24: ₦1.2M a month, from ₦200k today." | ✅ | |
| Send to financial model | "Yes, send it" | 200; `finance_runway_settings.revenue_drivers` holds both streams (D-BB-5) | ✅ | |
| Streams Add / Edit / Delete / Assumptions | click | saved, edited, deleted with confirm; Assumptions expands (`aria-expanded`) | ✅ | |
| Positioning map | arrow keys; "Place Paystack"; pointer drag; Edit axes | `map_y` 0.43 → 0.58; placed at 0.5/0.5; drag to 0.73/0.75; axis "Speed of settlement" persisted | ✅ | |
| Add competitor, Threat level left on "Select..." | Save | **silent failure**: `POST` 422 `threat_level` field error, nothing shown | ❌ → ✅ (API) / ❌ (FE) | API `fix/bb-rewalk`: blank = default "medium" (live 201); FE: show `field_errors` on every record form, don't send blank selects |
| Record forms a11y | persona, stream, competitor forms | visible labels not associated with inputs; Edit/Delete buttons don't name the item; both axis inputs share one label | ❌ minor | FE |

## Business Plan (`/business-builder/plan`), founder, 1440
| Control | Action | Result (API) | | Fix |
|---|---|---|---|---|
| Readiness checklist | load | "8 of 9 ready", SWOT "Started, 75% filled" | ✅ | |
| Draft missing sections with AI (real model) | Draft it | "9 of 9 ready" | ✅ | |
| Audience / length | Investors, Concise | pressed states | ✅ | |
| Generate (real model) | Draft it | "Compiling your canvases…", "0 of 10 sections" → 10 of 10 with stage captions, "Your business plan is ready." 10 sections, 17k characters, no dashes in the body | ✅ | |
| Plan document title | | "NovaPay **—** Business Plan": an em dash in API copy (not model output) | ❌ → ✅ | API #142 now covers all API-authored copy (8 strings) with a guard test |
| Regenerate a section | Team | disabled with no explanation once the AI daily budget is used up (`over_budget`) | ❌ minor | FE: say "AI is at its daily limit, try again tomorrow." next to it |
| Open document / Generate a new plan | click | opens the plan document; back to the options form | ✅ | |
| AI budget | one plan run | used about 24k tokens against the 15,000 token/startup/day cap; explains the earlier unexplained "failed" plan | ⚠ product call | asked in the session summary |

## 375, founder
| Page | Result | | |
|---|---|---|---|
| All 11 routes | `scrollWidth` 375, no unclipped overflow | ✅ | |
| SWOT "Move to" select at 375 | Strengths 4 → 3, Opportunities 5, new version | ✅ | |

## Other roles
| Role | Control | Result (API) | | Fix |
|---|---|---|---|---|
| Consultant | SWOT editor | banner "You're in suggest mode. The founder approves your edits."; no AI / Export | ✅ | |
| Consultant | Add a Threats note → "Send suggestion" | canvas unchanged (`version` 9); pending `canvas_update` suggestion; toast "Suggestion sent" | ✅ | |
| Founder | notification + Approve | "bb-consultant-1@example.com suggested changes to SWOT" / "Review suggestions"; Approve → `version` 10 with the note | ✅ | |
| Mentor | SWOT | read-only: Version history + Comments only; preview without "Restore" | ✅ | |
| Team member | SWOT | edits directly (Add, Move, Remove, AI, Export) | ✅ | |

## Close-out on merged develop (2026-10-19 evening, API ea7fe95 + #147, FE 3c89d16)
Every ❌ row above was re-checked live after API #142-#147 and FE #110 merged.
| Row | Re-check | |
|---|---|---|
| Mention Enter | type "@bb-con", Enter → "@bb-consultant-1@example.com ", saved with 1 mention; option named "Mention bb-consultant-1@example.com, business consultant" | ✅ |
| Header after AI (row 15) | manual note → "Last edited by Victor Founder"; Channels AI → "Last edited by AI, just now" without reload | ✅ |
| Record form errors | competitor Map X = 2 → 422 shown under Map X ("Input should be less than or equal to 1") | ✅ |
| Labels | "Edit competitor: Moniepoint", "Remove note: Focused fintech positioning", form labels associated | ✅ |
| Over-budget hint on Regenerate | in code (`plan-regenerate.tsx` shows OVER_BUDGET_MESSAGE + title); not reproducible live now the cap is 100k | ✅ (code + unit) |
| Suggestion title | "Update the SWOT" | ✅ |
| Whole-canvas "Fill with AI" / records "Draft with AI" (were ⚠) | ran live with budget: on filled canvases/lists they draft nothing (by design) but still said "AI draft added" | ❌ → API [#148](https://github.com/innocent98/Cofoundaz-api/pull/148) (job reports ready / nothing_new / over_budget, live-captured) + FE follow-up PR (in progress) |
