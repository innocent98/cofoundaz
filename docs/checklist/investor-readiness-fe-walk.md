# Investor Readiness FE: live walk (2026-11-12)

Branch `feature/investor-readiness-fe`. FE run locally (`next dev`, API proxy) against a **scratch API stack** (own Postgres, Redis,
uvicorn and worker on `develop` at `f7073893`, migrations to 0103). The shared :8000 stack was down and was not touched. Walked in the
in-app browser at 1440 and 375 wide with four seeded accounts in one workspace: founder, team member, mentor, accountant.

## What this walk is NOT

**The real model could not be used.** The OpenAI account behind the API answered `429 insufficient_quota` ("no credits remaining") on
every call (worker log, deck review job). The walk therefore ran with `LLM_PROVIDER=stub`, which returns fixed placeholder text
(`[stub-llm] ...`, scores 1/10, no extracted claims).

| Needs the real model | Status |
|---|---|
| Deck review quality (narrative and data clarity scores, top fixes, slide notes) | **NOT verified.** The page, upload, job state, polling, scores, slide strip and thumbnails ran against stub output |
| Mock Q&A questions, per-answer ratings, model answer, trend | **NOT verified.** Chat, counter, resume, end, scoring job and scorecard layout ran against stub output; trend (second scored session) never shown |
| Narrative claim extraction | **NOT verified.** With the stub no numbers are extracted, so the check returned "We found no numbers to compare" |

To close this gap: add credits (or point `LLM_API_KEY` at a funded key), then re-run the three flows below on the real model.

One more caveat: to see the findings cards I **seeded one `narrative_checks` row** in the scratch DB with the findings, claims and use-of-funds
bodies copied verbatim from the API guide section 14.7. The UI rendering is verified; the BE producing those findings from a real model is
the BE guide's own evidence, not this walk's.

## Founder, 1440

| # | Page | Control | Result |
|---|---|---|---|
| 1 | layout | 5 tabs navigate; sidebar entry "Investor Readiness" under GROW, links to `/investor-readiness` | pass |
| 2 | score | gauge, verdict text from API, "Updated" time | pass (score 8, `not_yet`) |
| 3 | score | must-haves card: "You cannot pass 69 until these are done" lists 3 unmet with reasons and "Do this" links | pass |
| 4 | score | **Recalculate**: recomputes (Team 52 to 54), button shows "Recalculated" and is disabled for 60 s | pass |
| 5 | score | dimension rows expand and show signals (value of target, note, Open link); `step` signals show "Not started / In progress / Done" | pass |
| 6 | score | gap cards with lift and **Fix this**; Market gap focuses the TAM field on the page | pass |
| 7 | score | **Save market size**: SAM larger than TAM shows "SAM cannot be larger than TAM."; valid values with a source link save, gap disappears, score refreshes | pass |
| 8 | deck | empty state with PRD copy; non-PDF refused client-side ("A deck review needs a PDF...") | pass |
| 9 | deck | real PDF upload via Documents, job state "Reading your deck like a partner on a Monday morning...", then review | pass (stub scores) |
| 10 | deck | same bytes under another name: "This exact deck was already reviewed, so nothing new was run." | pass |
| 11 | deck | changed PDF is version 2; version dropdown switches versions; "Overall by version" trend | pass |
| 12 | deck | tiles (Narrative, Layout check with "not a visual review" note, Data clarity), top fixes, slide strip with real rendered thumbnails (signed links) | pass |
| 13 | qa | topic focus x4 and persona x3 radios, **Start mock session** (201, opening question) | pass |
| 14 | qa | type and send answers, typing state, "Answer N of 10" counter | pass |
| 15 | qa | reload mid-session resumes the open session | pass |
| 16 | qa | **End session** goes to "Generating scorecard...", then scorecard (rating pill, trend line "first scored session", strongest, weakest, every answer rated) | pass (stub text) |
| 17 | qa | **Run another session** shows "Your past sessions"; ending a session with no answers returns to setup | pass |
| 18 | narrative | textarea autosaves after ~1 s ("Saved"), persists across reload, character counter | pass |
| 19 | narrative | **Check my narrative**: job runs, result renders; "Uses AI" hint changes to "No AI used if nothing changed" | pass (stub: no numbers found) |
| 20 | narrative | findings cards (high, medium, info, ok), quotes, use of funds | pass (seeded row, see above) |
| 21 | narrative | editing after a check shows "Your narrative changed since this check. Check again." | pass |
| 22 | history | 30 / 90 / 1 year range picker, step chart on a real time axis with the 70 line, markers list | pass |
| 23 | history | log table: deck review, Mock Q&A and narrative check rows; links open the review, the session and the narrative page | pass |

## Team member, 1440 (read-only)

| Page | Expected | Result |
|---|---|---|
| score | no Recalculate; market size shown disabled with "Only the founder can edit"; Fix this links still navigate | pass |
| deck | review readable, version dropdown works, no upload button | pass (hidden file input removed for this role after the walk found it present; re-checked by type-check only) |
| qa | no Start; table of sessions with date, focus, persona, answer count and rating; no transcript or scorecard | pass |
| narrative | textarea read-only, no save status, no Check button, findings visible | pass |
| history | log visible; Q&A rows are not links | pass |

## Mentor and accountant

| Check | Result |
|---|---|
| API `GET` score, deck-reviews, qa-sessions, narrative, history | 403 on all five, both roles |
| sidebar entry hidden | pass |
| typing `/investor-readiness/deck` or `/qa` shows "You don't have access to this page." | pass |

## 375 wide (founder)

Score, deck, Q&A (setup and active chat), narrative and history: no horizontal page scroll (document width 375), tabs scroll sideways inside
their strip, the chat input sits above the mobile tab bar. Not clicked at 375 beyond Start and End session; the controls are the same as at 1440.

## Not covered

- Real-model deck review, Q&A and narrative claim extraction (credits, above).
- **Unit-level only, not walked live:** the 10-answer cap and its notice ("That's all 10 questions. Scoring your session...", `hooks/useQaSession.test.ts`), `TURN_MISMATCH` recovery, the `AI_BUDGET_LOW` and `AI_BUDGET_EXHAUSTED` messages, scoring-failed and "Try scoring again".
- The team-member deck file-input removal (found during the walk) was **type-checked only**, not re-walked.
- Failed deck review states (`no_text`, `unreadable` and so on) in the UI: the copy is in `lib/readiness-format.ts` and unit-tested, not walked.
- `capped: true` and `ready: true` states (Open Funding Hub button), and a dimension with `score: null`.
- Thumbnail link expiry refetch (15 minutes).
- Mentor/accountant at 375.
- Team member at 375.
