# Assessment: click-through re-walk (develop)

`/assessment/*` walked live on merged `develop` (FE `cd38be6`, API `62ae145`, DB at alembic 0060), local stack, 2026-10-20,
workspace NovaPay, real model. Each row: control → action → result checked against the raw API (`/assessments`,
`/assessments/{id}`, `/assessments/compare`, `/assessments/{id}/next-question`, `/notifications`, `/dashboard/summary`, with
`X-Workspace-Id`) → ✅ / ❌ / ⚠️ (not reproduced). Roles: founder (`localhost`), team member (`tm.localhost`), mentor
(`m.localhost`), at 1440 and 375. Test accounts are local only and are not recorded here.

Environment note: the shared `:3000` dev server died part-way through the walk (`ERR_CONNECTION_REFUSED`, HMR socket lost). The
1440 pass was done on `:3000`; the 375 pass was repeated on a dev server started from this worktree on `:3010`
(`API_PROXY_TARGET=http://localhost:8000`, code identical to `cd38be6`). Nothing on the shared stack was pulled, migrated or restarted.

## Result: 46 control rows: 40 pass, 3 fail (A1 at 1440 and 375, A2), 3 pass with a note (A3, A4, A5); 2 required items not reproduced. 5 gaps (1 medium, 2 low, 2 info). Assessment is NOT marked done.
Reason: the two items the lead called out (quarterly banner, quarterly bell deep link) could not be reproduced (see below), and
gap A1 is a real FE bug on the completion screen.

## Founder, 1440
| Control | Action | UI vs API | |
|---|---|---|---|
| Overview intro | load | "Let's calibrate NovaPay" = workspace name; CTA "Start a check-in" (completed rows exist, so not "Begin") | ✅ |
| Shell top bar | load | ⌘K search, health pill, bell, "+ Invite" present (shared `ShellTopBar`) | ✅ |
| Tab bar | Overview / In progress / Past results / Compare | each lands on its route | ✅ (first click on a never-compiled route did nothing for ~10 s in dev; later clicks instant, dev compile lag, not reproducible) |
| Start a check-in | click | `POST /assessments` 201; lands on `/assessment/run/{id}`; API `progress {answered 0, remaining 8, pct 0}` = bar `aria-valuenow` 0 | ✅ |
| Runner header | each screen | "SECTION n OF 5: NAME" follows the question's `section`; "Adaptive: I skip anything that doesn't apply to you." | ✅ |
| Choice question | click an option | autosaves, advances; bar = API `pct` at every step: 0→11→22→33→44→50→60→70→72→81→90 (path widened and narrowed with the answers) | ✅ |
| Scale 1-5 | click a number | advances at once (no Next button, by design) | ✅ |
| Numeric (MRR) | type 5000, "Next question →" | accepted; bar 50 → 60 = API | ✅ |
| Save & exit | click mid-run | toast "Assessment progress saved. You can resume anytime."; lands on In progress | ✅ |
| In progress page | after exit | "You're 22% through." / "Currently on: Market" = API `{answered 2, remaining 7, pct 22}` and next question's section | ✅ |
| Overview in-progress card | after exit | "You're 22% through. Pick up where you left off." + Resume; main CTA reads "Continue"; both open the runner at the same question | ✅ |
| In progress, none active | open | "No active assessment" + "Start a new one" → `/assessment` | ✅ |
| Completion screen | answer last question | "Your Health Score is now 61." "Here's what changed." "+42 from 19": `health.score` 61 = `/dashboard/summary` health 61; previous 19 = header pill before | ✅ |
| Header health pill | after completion | 19 → 61 without reload (= API) | ✅ |
| Completion, second run | worst-path answers | "Your Health Score is now 19", "-42 from 61" = captured `/complete` body (`score 19, previous_score 61, delta -42`) | ✅ |
| Completion per-dimension rows | compare with captured `/complete` body | UI "Product -38 / 25/100"; API `health.dimensions[product] = score 31, previous 69, delta -38`; "25" is the assessment's own score | ❌ gap A1 |
| Completion, tied scores | run 1 (legal 75 unique) / run 2 (product 25 = team 25) | text is the BE narrative ("strongest area is product (25)"); fine | ✅ |
| See my dashboard | click | `/dashboard` | ✅ |
| View past results | click | `/assessment/results`, new row on top | ✅ |
| Browser Back to a finished run | back | "Your assessment is complete." + assessment score 62, no Health card (replay returns `health: null`, per FE guide §4) | ⚠️ info, gap A3 |
| Past results list | load | 6 rows: score, date, "Stage at time", Δ vs previous all = API (`overall_provisional` 15/74/100/93/62/90; Δ -59/-26/+7/+31/-28/First) | ✅ |
| Stage at time | rows from before #152 | "not recorded" for the 4 old rows (API `stage_at_time` null); "Idea" for new rows (API `idea`) | ✅ |
| Row expand | click latest | narrative = `result.narrative`; dimension scores 25/12/14/0/25 with deltas (-75/-88/-57/0/-75) = API minus previous result (100/100/71/0/100) | ✅ |
| Answer diff | same row | "6 answers changed since your previous check-in", each "Changed from: …" = API `changed_from`; unchanged answers have no marker | ✅ |
| Compare default | load | latest 3 selected, radar + 3 insight cards | ✅ |
| Compare cap | pick a 4th | disabled while 3 selected (`aria-pressed`, `disabled`); clicking disabled is a no-op | ✅ |
| Compare reselect | deselect newest, select oldest | cards recompute: "+12 Market since Oct 17", strength Product 100, focus Legal 0 = `/assessments/compare?ids=a,b,c` scores | ✅ |
| Compare "Biggest improvement" card | all dimensions dropped | shows "-75 Product" under the title "Biggest improvement" | ❌ gap A2 |
| `?status` filter (API) | `?status=in_progress` / `completed` / `done` / empty | 1 / 6 / 422 / 422 with the documented message; FE exposes no filter control (it calls the API with the filter itself) | ✅ |
| Progress percentage | every step of two full runs | UI bar and API `pct` equal at all 20 steps | ✅ |

## Founder, 375
| Control | Result | |
|---|---|---|
| Overview, In progress (empty), Past results (expanded), Compare | `scrollWidth` 375 on each; only the tab pill row scrolls inside its own container | ✅ |
| Runner (start, answer, Save & exit, Continue, resume to the same question, finish) | no horizontal overflow on any screen; bar = API at 12/25/37/50/62/75/87 | ✅ |
| Completion screen | fits; same A1 mismatch | ✅ layout / ❌ A1 |

## Team member, 1440 and 375
| Control | Result (API) | |
|---|---|---|
| Overview | no "In progress" tab, no Start / Resume, no "+ Invite"; "Only founders can take the assessment. You can read every result and compare check-ins." + View past results + Compare | ✅ |
| `POST /assessments` | 403 `FORBIDDEN` "You don't have permission to do that." (nothing created) | ✅ |
| `GET /assessments`, detail | 200; 7 rows = founder's list | ✅ |
| Past results + expand | same rows; "8 answers changed" = API 8 `changed: true` | ✅ |
| Compare | loads, 7 selectable rows | ✅ |
| `/assessment/in-progress` typed in | "Only founders can take the assessment" + View past results | ✅ |
| `/assessment/run/{id}` typed in | "We couldn't load this assessment / Only founders can take the assessment in this workspace." (API `next-question` 403); has a pointless "Try again" | ⚠️ gap A4 (low) |
| Bell | got `assessment.completed` for the founder's run (16:34 and the later one); clicking one marks it read and lands on `/assessment/results` from `/dashboard` | ✅ |
| 375 | Overview, Past results, Compare: `scrollWidth` 375 | ✅ |

## Mentor, 1440 and 375
| Control | Result (API) | |
|---|---|---|
| Sidebar | no Assessment entry | ✅ |
| `/assessment`, `/assessment/results` typed in | "You don't have access to this page." + "Back to dashboard" (works), no error toast, no broken UI | ✅ |
| `GET /assessments`, `/{id}`, `/compare`, `/{id}/next-question`, `POST /assessments` | all 403 `FORBIDDEN`, identical envelope | ✅ |
| Notifications | no new `assessment.*` from today's four completions; one old `assessment.completed` from 13:29 (before #152) is still in the feed; clicking it lands on the clean no-access page | ✅ / ⚠️ gap A5 (info) |
| 375 | no-access page fits | ✅ |

## Not reproduced
| Item | Why |
|---|---|
| **Quarterly 90-day banner (`meta.quarterly_due`)** | Needs the latest completed `completed_at` more than 90 days old. All 8 completed assessments are within 90 days, and the "latest" one is only the newest of them, so backdating the one latest row leaves the next one (also today) as the latest and `quarterly_due` stays false. The whole set has to move. The local-DB `UPDATE` I issued for that was refused by the permission classifier and I did not work around it. Original values are saved (below). API side is already live-verified in the FE guide (`list_quarterly_due`, false again while a check-in is in progress); here I confirmed `quarterly_due: false` with a recent completion and false while one is in progress. The banner render (`founder && quarterlyDue && !inProgress`, "Time for your quarterly check-in", "Start re-assessment") is code-read and mock-tested only. |
| **Bell deep link of `assessment.quarterly.due`** | No such notification exists for the founder yet (it needs the scheduler tick, which needs the backdate). `assessment.completed` → `/assessment/results` is verified live (team member, from `/dashboard`). The quarterly mapping `assessment.quarterly.due → /assessment` is `hooks/useNotifications.ts:41`, unit-tested only. |

Originals to restore after the backdate (completed assessments, UTC): `775a94b0-6d7f-4e7c-9242-85f3eb2800c9` 16:45:09.731022, `0a925e39-73ce-4b86-a456-9261c93db209` 16:34:51.354973,
`447dcc2f-ec8e-48a5-9231-00ff9a563159` 15:05:01.968044, `89d0c5f7-b9ea-46d8-bfe1-aa286988d1fb` 15:03:20.652532,
`39740872-f648-41f7-8568-ec3ec10dd209` 13:29:14.514435 (all 2026-10-20), `2166532a-172a-48ae-8da8-28f8cd3bf5c5` 2026-10-17 17:43:51.524351,
`01d7c783-a488-40b2-8804-f24dff3bafbb` 2026-10-17 17:43:00.725744, `945491d7-7bce-49c0-a0c0-3b17b2e82055` 2026-10-17 17:20:49.700779.

## Gaps
| # | Sev | Where | Observed | Fix |
|---|---|---|---|---|
| A1 | **Medium** | Completion screen, per-dimension rows | Each row pairs the assessment's own dimension score with the Health-score delta: UI "Product -38 · 25/100" while `health.dimensions[product]` is `score 31, previous 69, delta -38` (run 1: UI 67, API 69). The number and the delta come from different scales, so 25 − (−38) ≠ 63. | FE: show `health.dimensions[].score` beside its delta (or show assessment scores with an assessment delta); do not mix. |
| A2 | Low | Compare insight cards | Title "Biggest improvement" shows "-75 Product" when every dimension fell; "Core strength" silently takes the first dimension on a tie (Product 25 = Team 25). | FE: title "Biggest change" or hide when ≤ 0; note ties. |
| A3 | Info | `/assessment/run/{finished id}` revisited | Shows "Your assessment is complete." with the assessment score, not the Health Score, because the replay's `health` is null (documented). | Accept, or FE: redirect a finished run to `/assessment/results`. |
| A4 | Low | Team member on `/assessment/run/{id}` | Error card with "Try again" for a permanent 403. | FE: hide Try again on 403 or send TM to Past results. |
| A5 | Info | Mentor bell | Pre-#152 `assessment.completed` rows stay in mentors' feeds and deep-link to the no-access page. Clean, not broken. | Optional one-off cleanup of old rows. |

Outside Assessment, seen in passing: right after the +42 completion the Health module sent "Your Health Score dropped 29 points"
(`delta_7d -29`, relative to a week earlier); consistent with the API, a Health-module wording question, not Assessment.

No Back button exists in the runner (one answer per screen, autosave, Save & exit). PRD 07.1 does not ask for one, so it is not
counted as a failure.
