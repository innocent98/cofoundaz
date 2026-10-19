# Validation Hub: PRD + UI-handoff gap list (live walkthrough, 2026-10-19)

Source of truth: `Cofoundaz_Technical_PRD.md` Module 09 (§09.1 to §09.7, Insight Synthesizer, API/entities/events/
notifications) + §2.1 (global top bar), plus the existing designed pages (`/validation` and its six sub-routes). Walked live
on `develop` (FE `5127a6b`, API `0072879`) as the local test founder at 1440px; a read-only code inventory backs each row.

Legend: ✅ meets PRD · ❌ gap

## Works (verified live)
- ✅ Assumptions kanban on the real API (create, drag between Untested/Testing/Validated/Invalidated PATCHes status;
  `evidence_count` derived from linked interviews/experiments). Events `validation.assumption.validated|invalidated` publish.
- ✅ Interview notes on the real API (interviewee, segment, date, notes, key quotes, verdict chips).
- ✅ Surveys on the real API: builder, one-time share link `/s/{token}` (public page with "Powered by Cofoundaz"),
  per-question analytics + completion rate, "Stop collecting".
- ✅ Smoke tests list + 3-step builder + stats on the real API; verdict banner copy matches the PRD (computed in the FE).

## Gaps
| # | Area | Gap (observed) | PRD | Fix |
|---|---|---|---|---|
| 1 | Shell | Own header: no ⌘K search, dead **"+ Invite"** | §2.1 shared top bar | FE: `ShellTopBar` |
| 2 | Overview | Stat strip is **mock** (shows 1/1/1 + "10 responses" while the workspace has 0 assumptions) | validated/invalidated/untested, live experiments, responses collected | BE: `GET /validation/overview`; FE wire |
| 3 | Overview | Riskiest-assumption nudge is **hardcoded** ("Gig workers will pay ₦500…"); "Design experiment" only toasts | **"Your riskiest untested assumption: '{text}'. Want an experiment for it?"** CTA **"Design experiment"** | BE: riskiest untested (risk high first) + AI experiment draft; FE |
| 4 | Smoke tests | No hosted page: visits/signups are typed by hand; no email capture; post-signup message never shown; "Powered by Cofoundaz" only on surveys | Public page at `{slug}.cofoundaz.site` with email capture, CTA/preorder tracking, footer "Powered by Cofoundaz", message **"You're on the list, we'll be in touch soon."** | BE: public page config + visit/signup/click capture, slug uniqueness; FE public route (see D-VAL-1) |
| 5 | Smoke tests | Verdict + sample threshold only in the FE | verdict when sample ≥ threshold | BE: verdict in stats (single source) |
| 6 | Smoke tests | No milestone notification | **"{test} just passed {n} signups"** | BE event + notification |
| 7 | Scripts | **Mock**: "Generate script" flips a flag; questions and tips hardcoded; assumption list from seed data | select assumption(s) → **"Generate script"** → editable questions with interviewer tips (*"Ask about the last time it happened, not hypotheticals."*); script list | BE: job handler + `interview_scripts` storage + CRUD; FE |
| 8 | Interviews | No assumption-link control, no list filters; notes plain text | assumption links, list + filters, rich-text notes | FE (BE already stores `assumption_ids`) |
| 9 | Surveys | No QR code; share link can't be re-shown after first open; open-text answers not readable | share link + QR | FE QR; BE: re-show/rotate link, open answers endpoint |
| 10 | Assumptions | Linked experiments not shown; add-form placeholder unverified | card: evidence count, **linked experiments**; placeholder *"e.g. Gig workers will pay ₦500/month for automated savings"* | FE (+ BE expose linked experiment names) |
| 11 | MVP feedback | **Entirely mock** (seed quotes); no BE at all (cut from v1 as D1) | inbox with source tags (interview/in-app/email), AI theme cards **"{theme} mentioned {n}× across {m} sources"** with drill-in quotes, **"Send to roadmap"** | BE: feedback model + CRUD + import from interviews/survey answers, clustering job, send-to-roadmap; FE (see D-VAL-2/3) |
| 12 | Insight Synthesizer | **Mock** on Interviews/Surveys/MVP (2.5 s timeout, hardcoded report, one "Apply" that only toasts); BE job has no handler | **"Synthesize insights"** job → patterns, contradictions, suggested assumption status changes each with **"Apply"** | BE: handler + stored report + per-suggestion apply (PATCH assumption); FE |
| 13 | Events / notifications | No `validation.insight.detected`; no Validation notifications | **"New pattern detected in customer feedback: {theme}"** CTA **"See insight"** | BE |
| 14 | Data hygiene | No DELETE on any validation entity | (implied: manage lists) | BE + FE delete with confirm |

## Decisions
Confirmed by Adebayo 2026-10-19:
- **D-VAL-1 Smoke-test hosting:** serve published pages on the app domain at `/p/{slug}` (like surveys' `/s/{token}`),
  with real visit, email-signup and CTA/preorder-click capture. Move to `{slug}.cofoundaz.site` later, once wildcard DNS
  and TLS exist; old links redirect.
- **D-VAL-2 MVP feedback:** build it now (reverses the v1 cut D1): inbox, AI theme clustering with drill-in quotes,
  "Send to roadmap".
- **D-VAL-3 Feedback sources:** auto-import interview key quotes and open survey answers, plus manual entries tagged
  interview / in-app / email. Real email forwarding and an in-app widget come later (they need an inbound-mail provider).

## Build order
BE (lead), stacked PRs: (a) overview endpoint + riskiest nudge + AI experiment draft, smoke-test public page with
visit/signup/click capture, server-side verdict, signup-milestone notification, deletes; (b) interview scripts
(job + storage) and the Insight Synthesizer (job, stored report, per-suggestion Apply, `validation.insight.detected` +
notification); (c) MVP feedback (model, import, clustering job, Send to roadmap). Each with tests, an e2e journey, a
live-captured FE guide and an SOP. Then one FE sub-session per slice (or one chained session), then a live re-walk.

## Related finding from the 2026-10-19 re-walk (not Validation)
- AI-written copy can contain em dashes (seen in a mission "Why" line). Fix centrally: strip em/en dashes from every LLM
  output in `app/platform/llm.py` (small separate PR).
