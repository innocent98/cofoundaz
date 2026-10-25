# Sales Sequences FE walk (live API)

Walked 2026-10-24 on a local dev server (`localhost:3101`, `tm.localhost`, `m.localhost`) against the local API (`localhost:8000`, develop at migration 0069), driven with Playwright. Every row's "raw" evidence is a direct API call made after the click (bearer + `X-Workspace-Id`), not the page's own state. Viewports 1440 and 375.

**No real email was sent.** Every enrolment went into a *paused* sequence (the scheduler only sends `active` sequences, `sending.py:479`; each enrol step asserts the sequence is paused first). The follow-up Send button was opened and cancelled (`sent_today` unchanged, draft `sent_at` null). Not exercised live: a real send, sent/bounced rows, the auto-pause banner (shape verified in e2e from the guide capture), `SEND_UNCERTAIN`/`SEND_LIMIT_REACHED` (message mapping unit-tested).

| Context | Control | Result | Raw API evidence |
|---|---|---|---|
| mentor@1440 | mentor sees the not-available state, no sequence controls | PASS | raw API 403 FORBIDDEN |
| mentor@375 | mentor sees the not-available state, no sequence controls | PASS | raw API 403 FORBIDDEN |
| tm@1440 | team member sees the page, banner, and full controls | PASS |  |
| tm@375 | team member sees the page, banner, and full controls | PASS |  |
| founder@1440 | sending banner matches raw /sales/sending | PASS | 1 of 100, domain cofoundaz.com |
| founder@1440 | + New sequence opens a starter form; empty name is refused inline | PASS |  |
| founder@1440 | wait days: 70 and text are refused inline | PASS |  |
| founder@1440 | unknown merge tag is refused inline with the API wording | PASS |  |
| founder@1440 | merge chip inserts at the caret in the body | PASS |  |
| founder@1440 | add step, remove step, 10-step cap message | PASS |  |
| founder@1440 | preview renders the sample contact; empty-value warning shows for {{company}} in subject | PASS |  |
| founder@1440 | Create sequence posts the exact form; raw API agrees | PASS | id ce0b492b-9238-477e-b89a-9af1f4926e86 status active steps 2 |
| founder@1440 | Pause sequence then Resume sequence (0 people enrolled) round-trips on the API | PASS |  |
| founder@1440 | Save is disabled until edited; edit, Discard changes restores, then Save persists | PASS |  |
| founder@1440 | Stop when deal moves stage checkbox saves to stop_on_stage_change | PASS |  |
| founder@1440 | Write with AI: asks, polls the draft, fills subject+body unsaved, Save persists | PASS | draft subject: A quick note for {{company}} |
| founder@1440 | Deal drawer: Write a follow-up polls to a ready draft, fields editable, Send asks first and Not yet sends nothing | PASS | draft d55d705c-ad7f-4c54-aedc-2601f13cb87c ready, not sent; sent_today 1 |
| founder@1440 | Archive asks first, mentions live enrolments, then removes the card (raw: not in list) | PASS |  |
| founder@375 | sending banner matches raw /sales/sending | PASS | 1 of 100, domain cofoundaz.com |
| founder@375 | + New sequence opens a starter form; empty name is refused inline | PASS |  |
| founder@375 | wait days: 70 and text are refused inline | PASS |  |
| founder@375 | unknown merge tag is refused inline with the API wording | PASS |  |
| founder@375 | merge chip inserts at the caret in the body | PASS |  |
| founder@375 | add step, remove step, 10-step cap message | PASS |  |
| founder@375 | preview renders the sample contact; empty-value warning shows for {{company}} in subject | PASS |  |
| founder@375 | Create sequence posts the exact form; raw API agrees | PASS | id f13e2e09-7e1c-4a03-8368-dff82a2a6ecb status active steps 2 |
| founder@375 | Pause sequence then Resume sequence (0 people enrolled) round-trips on the API | PASS |  |
| founder@375 | Save is disabled until edited; edit, Discard changes restores, then Save persists | PASS |  |
| founder@375 | Stop when deal moves stage checkbox saves to stop_on_stage_change | PASS |  |
| founder@375 | Write with AI: asks, polls the draft, fills subject+body unsaved, Save persists | PASS | first run hit the 10s toast timeout (LLM latency); passed at 375 in walk-ai375 with a 90s wait |
| founder@375 | Leads: Enrol on a lead row opens the dialog, lists the sequence (paused noted), enrols, summary matches raw | PASS | enrollment 15f9ea15-ff34-4909-8e35-5378bfeace03 active, current_step 0 |
| founder@375 | Leads: enrolling the same lead again says already in this sequence; no duplicate row | PASS |  |
| founder@375 | Leads: a lead with no email is skipped with the no-email reason | PASS |  |
| founder@375 | Leads: dialog Escape and Cancel close without enrolling | PASS |  |
| founder@375 | Contact drawer: Enrol in sequence enrols the contact (contact_id set on the enrollment) | PASS |  |
| founder@375 | Sequence card shows live counts from the API and People opens the list | PASS | active 2, total 2, reply_rate 0 |
| founder@375 | People: status filter narrows to Active, then to Replied (empty state) | PASS |  |
| founder@375 | People: Mark replied flips the row and the raw status to replied; reply rate updates | PASS |  |
| founder@375 | People: Stop asks first; Keep going cancels; Stop emails ends it (raw: stopped_by_member) | PASS |  |
| founder@375 | People: acting on a row someone else already ended shows the API 409 message and refreshes | PASS |  |
| founder@375 | Deal drawer: Write a follow-up polls to a ready draft, fields editable, Send asks first and Not yet sends nothing | PASS | draft e833e5bc-47ee-4a69-b5da-d49cbd414581 ready, not sent; sent_today 1 |
| founder@375 | Archive asks first, mentions live enrolments, then removes the card (raw: not in list) | PASS |  |
| public@1440 | forged token shows "This link does not work" (raw 404) | PASS |  |
| public@1440 | valid token: GET only reads, masked email, button shown; nothing unsubscribed on load | PASS |  |
| public@1440 | Unsubscribe button POSTs: confirmation shown, raw GET now true | PASS |  |
| public@1440 | reload shows "already unsubscribed"; address is suppressed for enrol (skipped: suppressed) | PASS |  |
| public@375 | forged token shows "This link does not work" (raw 404) | PASS |  |
| public@375 | valid (already used) token at 375 shows already unsubscribed, fits the viewport | PASS |  |
| founder@375 | Write with AI at 375: draft fills fields; Save persists | PASS | A simpler way for gig workers to save and pay |
| founder@375 | 375: no horizontal overflow on Sequences, Leads | PASS |  |

## Notes
- Mentor: the app shell blocks `/sales/*` for mentors and consultants with "You don't have access to this page." before the page mounts; the raw API returns `403 FORBIDDEN`. The page's own 403 state (`SalesGate`) is the second line of defence and is shared with the other Sales pages.
- Team member: same page and controls as founder. Founder-only `POST /sales/sending/resume`: the Resume button renders for founders only (e2e: team member sees "Ask a founder to resume sending.").
- Test data created in the NovaPay dev workspace: leads "Seq Walk *", contact "SeqWalk Contact", sequences "Walk * paused" (all archived), one fake `sequence_sends` row used to mint a valid unsubscribe token, and the suppression it produced (`fe-walk-unsub@example.com`).
- No API gaps found. Observation for the lead: there is no suppression-list endpoint, so a suppressed address is visible only as the `suppressed` skip reason when enrolling (the guide documents it that way).

## Re-walk fixes (`fix/sales-sequences-rewalk-fe`, 2026-10-24)
Same setup as above, paused sequences only, no email sent.

| Context | Control | Result | Raw API evidence |
|---|---|---|---|
| founder@1440 | Stop on an enrollment already ended elsewhere (409 `ENROLLMENT_NOT_ACTIVE`) refreshes the sequence's active count | PASS | card moved from "1 active · 1 enrolled" to "0 active · 1 enrolled"; raw `active_enrollments` 0 |
| founder@1440 | Inline errors (name, unknown merge tag, wait days) clear as each field is edited; create then succeeds | PASS | sequence created, raw list shows it |
| founder@375 | Stop 409 refreshes the active count | PASS | raw `active_enrollments` 0 |
| founder@375 | Inline errors clear per field; create succeeds | PASS | sequence created, raw list shows it |

Mocked e2e added in `e2e/sales-sequences.spec.ts` for both fixes. Mark replied also now refreshes the counts on a 409.
