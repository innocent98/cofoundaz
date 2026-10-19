# Validation Hub: click-through re-walk (develop)

Slice (a) (gap rows 1-6, 14) walked on merged `develop` (FE `221ce21` = #114; API `2346b1a` = #149 + #150), local stack,
2026-10-19, workspace NovaPay, real model. Each row: control → action → result checked against the raw API → ✅/❌.
The FE session for slice (b) was working in the same workspace at the same time (it moved one assumption to
"testing" mid-walk); every row below was re-checked against the API at the moment it was clicked.

Slices (b) (scripts, Insight Synthesizer) and (c) (MVP feedback) get their own sections when their FE lands.

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
- ❌ minor (FE): the builder clamps a target above 50 silently. Fold into the slice (b) FE session or a small fix.

**Slice (a) verdict: DONE on merged develop** (one minor FE copy/validation item above, non-blocking).
