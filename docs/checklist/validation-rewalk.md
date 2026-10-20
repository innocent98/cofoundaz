# Validation Hub: click-through re-walk (develop)

Slice (a) (gap rows 1-6, 14) walked on merged `develop` (FE `221ce21` = #114; API `2346b1a` = #149 + #150), local stack,
2026-10-19, workspace NovaPay, real model. Each row: control → action → result checked against the raw API → ✅/❌.
The FE session for slice (b) was working in the same workspace at the same time (it moved one assumption to
"testing" mid-walk); every row below was re-checked against the API at the moment it was clicked.

Slices (b) and (c) were walked on 2026-10-20 (FE `5025154` = #115 + #117; API `ed282f4` = #149-#151), sections below.

## Slice (a): founder, 1440
| Control | Action | Result (API) | | Notes |
|---|---|---|---|---|
| Shell: ⌘K search | "traders" | assumption result from `GET /search` ("Assumption · testing") | ✅ | |
| Shell: + Invite | open, Escape | "Invite to NovaPay" dialog | ✅ | |
| Overview stat strip | load, reload | equals `GET /validation/overview` (0/0/1 untested, 1 live, 2 responses) | ✅ | responses = survey responses + smoke signups, by design |
| Riskiest nudge | load | PRD copy with the riskiest untested statement; moves to the next one when that assumption changes status | ✅ | |
| Design experiment (real model) | click | "Designing…", job polled, builder pre-filled (name, headline, sub, CTA, metric, 5%, "Why this test"), nothing saved | ✅ | |
| Builder step 2 target | type 60 | accepted; saved as 50 (`config.target_conversion` 50) without telling the user | ❌ minor | FE: show "Between 1 and 50" as an error instead of clamping silently |
| Builder step 3 slug: taken | `fe-fee-test` → Publish | 409 shown under the field: "That page address is taken. Try another." | ✅ | |
| Builder step 3 slug: invalid | `ab` → Publish | "Use 3 to 60 lowercase letters, numbers and dashes, not starting or ending with a dash." | ✅ | |
| Publish | `rewalk-assoc-partners` | "Published. Your page is live."; `status` live, slug set, `published_at`, linked to the drafted assumption | ✅ | |
| Copy link | click | pane blocks the clipboard → toast "Could not copy. Select and copy it manually." (honest failure path) | ✅ | success path not reproducible in the pane |
| Open page | link | `target=_blank` to `/p/rewalk-assoc-partners` | ✅ | |
| Funnel / verdict | after visits + signups | equals `GET /smoke-tests/{id}/stats`; 1 unique visitor, 1 signup (repeat not double-counted), no verdict under 100 visits | ✅ | |
| Waitlist | after signups | equals `GET /smoke-tests/{id}/signups` | ✅ | |
| Download CSV | click (blob intercepted in-page, no file saved) | `fe-fee-test-waitlist.csv`: `email,signed_up_at` + 2 rows matching the API | ✅ | |
| Milestone notification | 10th signup | "Association Partner Interest Test just passed 10 signups" for founder + team member; click → `/validation/smoke-tests?test={id}` opens that test | ✅ | |
| End test | click | "Test ended. The page is offline."; public page 404 | ✅ | |
| Resume | click | LIVE again; public page 200 | ✅ | |
| Delete test (detail) | Delete → Cancel, Delete → Delete | dialog warns "This also deletes its waitlist of 10 emails."; cancel keeps it; confirm removes it, page 404, toast "Smoke test deleted" | ✅ | |
| New smoke test, empty | Next ×2 → Save as draft | "Add a test name or headline first." and back to step 1 | ✅ | |
| Save as draft | named test | "Saved as a draft." DRAFT detail | ✅ | |
| Record your numbers | 120 visits, 12 signups → Save | `metrics` saved; server verdict "10% conversion against your 5% bar → looks validated" | ✅ | |
| Publish a draft without a slug | click | live, `slug` null, no public-page block (self-hosted test) | ✅ | |
| Assumptions: nudge | load | same nudge as Overview | ✅ | |
| Assumptions: delete | Delete → confirm | removed in API and UI | ✅ | |
| Interviews: delete | Delete → confirm | "This interview note is deleted for good."; removed | ✅ | |
| Surveys: delete | Delete → confirm | "Its share link stops working and all of its responses are deleted."; removed | ✅ | |

## Slice (a): public page `/p/{slug}` (anonymous)
| Control | Action | Result (API) | | |
|---|---|---|---|---|
| Page | load | headline, sub, email field, CTA, "Powered by Cofoundaz"; a `visit` recorded | ✅ | |
| Invalid email | `not-an-email` → submit | "Enter a valid email address." (no call) | ✅ | |
| Signup | valid email | "You're on the list, we'll be in touch soon." | ✅ | |
| Repeat signup | same email again | same message, stored once | ✅ | |
| Preorder metric page | "I would pay for this" | `preorder_click` counted (pricing block forced on for preorder tests, API fix in #149) | ✅ | |
| Unknown / ended slug | `/p/no-such-page-xyz` | "This page isn't available" + Powered by | ✅ | |
| 375 | load | no horizontal scroll (scrollWidth 375) | ✅ | |

## Slice (a): other roles and widths
| Check | Result | |
|---|---|---|
| Founder at 375: Overview, Smoke tests list | stat cards stack, nudge visible, list fits (Visits/Conversion columns hidden), no horizontal scroll | ✅ |
| Team member (`rewalk-tm`), 1440 | same overview numbers, no "+ Invite"; test detail, funnel, waitlist; Design experiment (real model) pre-fills the builder | ✅ |
| Team member notifications | milestone + insight notifications received | ✅ |
| Mentor (`bb-mentor-1`) | no Validation in the sidebar; `/validation` shows "You don't have access to this page."; API 403; **no** Validation notifications (audience fix in #150) | ✅ |

## Open items from this walk
- ✅ fixed in #115: the builder blocked an out-of-range target ("Between 1 and 50.") instead of clamping it.

**Slice (a) verdict: DONE on merged develop** (one minor FE copy/validation item above, non-blocking).


## Slice (b): interview scripts + Insight Synthesizer, founder, 1440 (develop, 2026-10-20, real model)
| Control | Action | Result (API) | | Notes |
|---|---|---|---|---|
| Generate script, nothing ticked | load | button disabled | ✅ | |
| Assumption checkboxes + Generate (real model) | tick "Traders prefer weekly payouts…", Generate | job → saved script "How Traders Manage Payouts", 8 questions with tips, linked to that assumption; editor opens | ✅ | |
| Move question up/down | move Q1 down | order swapped; after Save the moved question keeps its id | ✅ | |
| Remove question | remove Q8 | 7 left | ✅ | |
| Add question | add, type text | new row; after Save it gets its own id | ✅ | |
| Save with a blank question | Save | "Each question needs text." from the API; nothing saved | ✅ | |
| Save script | Save | `PATCH` persisted order, text and count (8) | ✅ | title edit verified on #115's build (same code) |
| Close editor / open a script from the list | click | editor closes; list item opens its script | ✅ | |
| Delete script | Delete → Cancel, Delete → Delete | dialog "This removes the script and its questions. It cannot be undone."; cancel keeps it, confirm removes it | ✅ | |
| Synthesize insights (Interviews, real model) | click | report `source=interviews`, inputs 4 interviews, AI-labelled, verbatim quotes | ✅ | |
| **Apply** suggestion | "Traders prefer weekly payouts" untested → invalidated → Apply | assumption `invalidated`, `applied_at` set, button → "Applied"; a repeat call → 409 `ALREADY_APPLIED` | ✅ | evidence prepared for this walk (2 contradicting interviews) |
| Past reports | open | 4 reports listed = `GET /insights`; opening one shows it | ✅ | |
| Delete this report | Delete → confirm | "Assumptions you already changed stay as they are."; 4 → 3 | ✅ | |
| Synthesize insights (Surveys) | click | `source=surveys`, "Based on 2 survey answers" | ✅ | |
| Notification "New pattern detected…" | click in Notifications inbox | opens `/validation/interviews?insight={id}` with that report | ✅ / ❌ minor | a Surveys report opens on the Interviews tab (works, wrong tab context) |

## Slice (c): MVP feedback, surveys, linked experiments, founder, 1440
| Control | Action | Result (API) | | Notes |
|---|---|---|---|---|
| Inbox load | load | items = `GET /feedback`; imported rows show source + origin label, no interviewee names | ✅ | |
| Filter tabs All / Interview / Survey / In-app / Email | click each | 13 / 5 / 2 / 3 / 3 rows = `counts` | ✅ | |
| Add feedback, empty | submit | "Write what the customer said."; nothing created | ✅ | |
| Add feedback | text, Email, 18 Oct | created `email`, `received_on` 2026-10-18, not imported | ✅ | textarea has no accessible name ❌ minor |
| Edit | change text + source to In-app, Save changes | persisted | ✅ | |
| Dismiss (imported) | Dismiss | `dismissed: true`, hidden | ✅ | |
| Show dismissed / Hide dismissed | toggle | dismissed row shown / hidden | ✅ | |
| Restore | click | `dismissed: false`, back in the inbox | ✅ | Restore button lacks the item in its accessible name ❌ minor |
| Delete (manual) | Delete → Cancel, Delete → Delete | "It is deleted for good and removed from any theme it is in."; cancel keeps, confirm deletes; theme count drops live (Withdrawal Failures 3× → 2×) | ✅ | |
| Find themes (real model) | click | new run over 13 items replaces the shown themes; labels "{theme} mentioned {n}× across {m} sources" = API | ✅ | |
| Show / Hide quotes | toggle | quotes shown, label flips | ✅ | |
| Send to roadmap → Cancel | open picker, Cancel | picker closes, nothing sent | ✅ | |
| Send to roadmap (default milestone) | "Unexpected Fees" → Add to roadmap | todo task in "Write your problem statement" (first open milestone), description from the theme; card shows "On your roadmap: …" | ✅ | |
| Send to roadmap (chosen milestone) | picker → "Talk to 5 potential users" | task in that milestone | ✅ | verified on #117's build (same code) |
| View link | | `/roadmap` | ✅ | |
| Synthesize insights (MVP) | click | `source=all`: "Based on 4 interviews, 2 survey answers and 6 feedback items" | ✅ | |
| Surveys: Answers tab / Results tab | click | "2 answers" = `GET /surveys/{id}/answers`; Results back | ✅ | |
| Surveys: New share link | → Cancel; (→ Get new link on #117's build) | confirm "Anyone with the old link won't be able to answer."; new link shown with QR, works publicly (200) | ✅ | |
| Assumption card: linked experiment | click "Same-Day Settlement Fee Test" | opens `/validation/smoke-tests?test={id}` | ✅ | |

## Slices (b) + (c): other roles and widths
| Check | Result | |
|---|---|---|
| Founder at 375: Scripts, MVP, Surveys, Interviews + report drawer | no horizontal scroll (375), drawer full width, controls reachable | ✅ |
| Team member (`rewalk-tm`), 1440 | every (b)/(c) control present, no "+ Invite"; added and deleted a feedback entry through the UI; scripts / insights / themes 200 | ✅ |
| Mentor (`bb-mentor-1`) | `/validation/mvp` "You don't have access to this page."; feedback / scripts / insights API 403; no Validation notifications | ✅ |

## Open items (all minor, FE, non-blocking)
- A Surveys-sourced insight notification opens the report on the Interviews tab.
- Feedback form textarea has no accessible name; the Restore button's name omits the item.

**Slices (b) and (c) verdict: DONE on merged develop.** With slice (a), the **Validation Hub is done** (three minor FE items above).
