# Startup Assessment: PRD + UI gap list (live walkthrough, 2026-10-20)

Source of truth: `Cofoundaz_Technical_PRD.md` Module 07 (§07.1 to §07.4, API, entities, events, notifications, access
"F take, TM read results") + §2.1 (shared top bar). Walked live on `develop` (FE `5025154`, API `ed282f4`), local stack,
workspace NovaPay, as founder (1440 + 375), team member and mentor. A full check-in was taken end to end (with real-model
narrative). A read-only code inventory backs each row.

Legend: ✅ meets PRD · ❌ gap

## Works (verified live)
- ✅ FE fully wired to the real API: no mock or seed data anywhere in `/assessment/*`.
- ✅ Runner: one question per screen, "Section {x} of 5: {name}", "Adaptive: I skip anything that doesn't apply to you.",
  adaptive server-driven flow (10 questions for this workspace), choice / scale / numeric questions, autosave per answer,
  **Save & exit** → toast "Assessment progress saved. You can resume anytime." → In progress → **Resume** continues where it stopped.
- ✅ Completion scores the assessment, recomputes the Health Score (88 → 95), queues the AI narrative (arrives in Results).
- ✅ Past results: list with score, date, change vs previous; expand shows narrative + five dimension scores with deltas.
- ✅ Compare: radar overlay, "How your fundamentals have matured", pick up to 3 (4th disabled), insight cards from real scores.
- ✅ Team member reads Results / Compare; a team member who presses Start gets "Only founders can take the assessment in this workspace."
- ✅ Quarterly cron: `assessment.quarterly.due` after 90 days, PRD copy, deduped per quarter.
- ✅ 375: Results and Compare fit (no horizontal scroll).

## Gaps
| # | Area | Gap (observed) | PRD | Fix |
|---|---|---|---|---|
| 1 | Shell | Own header: no ⌘K search; **"+ Invite" has no handler**; shown to team members | §2.1 shared top bar | FE: use `ShellTopBar` (as Validation) |
| 2 | Start | Intro says **"Let's calibrate Cofoundaz"** (product name), not the startup | **"Let's calibrate {startup}"** | FE: workspace name |
| 3 | Start | CTA "Start a check-in" | CTA **"Begin"** (first run); keep "Start a check-in" for quarterly is fine | FE copy |
| 4 | Roles | Team member is offered **Start / Resume / In progress**, which are founder-only (403) | F take, TM read results | FE: read-only mode for TM (hide start/resume/in-progress, show results/compare) |
| 5 | Roles (security) | **API reads are open to every member**: a mentor gets 200 on list, detail (all answers + narrative) and compare, although the FE blocks them | TM read results; others no access | BE: reads gated to founder + team member (403 otherwise); tests per role |
| 6 | Notifications (security) | `assessment.completed` goes to all members except the actor (mentors, investors… included); `assessment.quarterly.due` to all members | assessment is F/TM only | BE: both to founder (+ team member for completed); quarterly to founders only (only they can take it) |
| 7 | In progress | Card says "You're in section 1 of 5", an estimate from dimension order | **"You're {pct}% through. Pick up where you left off."** | BE: `progress` (answered, remaining applicable, pct) on list/next-question; FE copy |
| 8 | API | `GET /assessments?status=in_progress` **ignores the filter** (returns completed ones) | `GET /assessments?status` | BE: implement filter |
| 9 | Completion | Shows "Your assessment score is 100" + "strongest area is product (100). Focus next on product (100)" (same dimension when scores tie) | **"Done. Recalibrating your workspace…"** → **"Your Health Score is now {score}. Here's what changed."** CTA **"See my dashboard"** | BE: complete returns new health score + per-dimension health deltas; FE: PRD copy, no strongest/focus line when tied |
| 10 | Header | Health pill stays 88 after completion until reload (API 95) | | FE: refresh health after complete |
| 11 | Results detail | Answers never shown (API returns `answers_by_dimension` as raw keys); no diff | **"answers grouped, diff-highlight vs previous"** | BE: detail returns question prompt + human answer label per answer and `changed_from` vs the previous completed assessment; FE: grouped answers with changed ones highlighted |
| 12 | Results list | No "stage at time" | list: date, resulting score, **stage at time** | BE: snapshot `stage` on complete (column + migration; older rows null → "not recorded"); FE column |
| 13 | Quarterly | No in-app prompt when a check-in is due (bell only) | notification CTA **"Start re-assessment"** | FE: deep link of `assessment.quarterly.due` → `/assessment` with the CTA; optional banner on /assessment when due (BE: `quarterly_due` flag on list) |

## Decisions (lead, reversible; no product call needed)
- **D-ASM-1:** assessment reads = founder + team member; everyone else 403 (PRD access row). Notifications follow the same audience; quarterly-due goes to founders only.
- **D-ASM-2:** progress pct = answered / (answered + remaining applicable questions given current answers); it can move as adaptive answers change the path.
- **D-ASM-3:** "stage at time" is snapshotted from the startup at completion; past assessments show "not recorded" rather than a guess.
- **D-ASM-4:** the completion screen shows the new Health Score and per-dimension change (the PRD's "Here's what changed"); the assessment's own score stays in Results.

## Build order
BE (lead), one PR: rows 5, 6, 7, 8, 9, 11, 12, 13 (BE parts), with tests, e2e journey, live-captured FE guide, SOP.
FE (one sub-session): rows 1-4, 7, 9-13 (FE parts). Then a click-every-control re-walk on develop.
