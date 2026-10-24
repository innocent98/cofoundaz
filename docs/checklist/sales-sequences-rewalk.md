# Sales Sequences re-walk (merged develop, live API)

Re-walk of the Sales **Sequences** sub-page on merged `develop` (FE `fc1a425`, includes #149; API `25fad5a1`, migration 0069), walked by hand in the built-in browser on 2026-10-24. Spec checked against: `cofoundaz-api/docs/fe-integration-guide-sales-sequences.md`, the Sequences rows (15, 19 to 24) of `sales-prd-gaps.md`, and `sales-sequences-fe-walk.md` (FE #149).

## Result


**120 control rows: 110 ✅, 2 ❌, 5 blocked (real send, `blocked: lead's live send`), 3 other (1 environment note, 1 observation, 1 cross-reference).**


Every non-blocked control is ✅ except the two minor FE defects below. Sales stays 🟡 until the lead's live send.

| Role | 1440 | 375 |
|---|---|---|
| Founder | full walk (51 rows) | full walk (29 rows) |
| Team member | full walk (13 rows) | full walk (14 rows) |
| Mentor | denied, 403 on every endpoint (2 rows) | denied (3 rows) |
| Consultant | denied, 403 on every endpoint (2 rows) | denied (2 rows) |
| Public `/unsubscribe/<token>` | forged token only (valid token blocked) | forged token only |

## How it was walked

- FE dev server from a worktree of `origin/develop` on port 3207, proxying to the shared API at `localhost:8000` (not restarted, not migrated). Hosts `localhost` (founder), `tm.localhost` (team member), `m.localhost` (mentor), `bc.localhost` (consultant).
- Every click, tap, keypress and typed character went through the browser pane (`computer` / `form_input` for the native `<select>`). The "API evidence" column is a raw `fetch` to `/api/v1/...` with the member's bearer and `X-Workspace-Id`, made from the page after the action, never the page's own state. Where a row has no API evidence the control is UI-only (dialog open/close, preview, layout).
- Viewports: 1440x900 and 375x812 (the pane's mobile preset).
- **Email safety.** Every enrolment went into a *paused* sequence, I archived my sequences at the end (paused, or archived with live enrolments stopped), and every follow-up send dialog was cancelled with **Not yet** (`sent_at` stayed null on every draft, `sent_today` never moved because of this walk). The workspace also holds the lead's own live-send sequence `Lead live send check 2026-10-24` (created 12:37 UTC, active); I never edited, paused, enrolled into or archived it (its `updated_at` stayed `12:37:35`). `sent_today` went 1 to 2 during the walk because of that sequence, not mine.
- Test data left in the NovaPay dev workspace: archived sequences `Rewalk paused A`, `Rewalk 375 paused`, `Rewalk TM 375 paused`, `Rewalk TM 1440 paused`, `Rewalk founder 1440 paused B`; follow-up drafts on the deals `Kolo rider savings pilot` (92e3231f, 98fdcb7f, d533a079) and `Walk test Co 446533` (2040ab3e), all unsent.

## ❌ failures

### ❌ 1. Stale "active" count after a 409 on Stop (FE, minor)

Steps (founder, 1440; the same code runs at every viewport):
1. Create a sequence, pause it, enrol two people from Leads / a contact drawer. Open **People**, filter **Active**.
2. Click **Mark replied** on row A (header becomes "1 active · 2 enrolled · 50% reply rate").
3. Click **Stop** on row B (dialog opens). While the dialog is open, end row B elsewhere: `POST /api/v1/sales/enrollments/{B}/stop` -> 200 (`status: stopped`, `stopped_reason: stopped_by_member`).
4. Click **Stop emails** in the dialog.

Request / response from the click: `POST /sales/enrollments/{B}/stop` -> **409**
```json
{"error":{"code":"ENROLLMENT_NOT_ACTIVE","message":"This enrollment has already ended.","field_errors":[]}}
```
The toast shows that message and the People list refreshes to "Nobody with that status" (good). **But the sequence card header still reads "1 active · 2 enrolled · 50% reply rate" and the Archive dialog still says "1 person is still being emailed"**, while `GET /sales/sequences` returns `active_enrollments: 0, total_enrollments: 2, reply_rate: 0.5`. A reload fixes it. The 409 path refreshes the enrolment list but not the sequence list.
Layer: **FE** (the API is correct). Real-world trigger: two members acting on the same row.

### ❌ 2. Inline field errors stay after the field is fixed (FE, minor)

Steps (founder, 1440): **+ New sequence**, leave step 2's subject and body empty, click **Create sequence**. Inline errors "Add a subject." and "Write the email." appear (correct, no request sent). Type a subject and a body into step 2: both red messages remain visible under the now-filled fields until the next submit. No request is involved.
Layer: **FE**. Not blocking, but it reads as if the form is still invalid.

## Observations (not control failures)

- **Follow-up editor shows literal merge tags.** The generated deal follow-up text contains `Hi {{first_name}},` in the editable box. The API renders tags at send time (`render_message` in `app/services/sales/sending.py`, also used by `send_follow_up`), so the recipient will see the name, but the member sees raw tags and nothing says so. The real rendering is part of the blocked live send row. Suggest a one-line hint or a preview in the drawer.
- **Dev proxy hang (environment, not the app).** Once during the walk the Next dev proxy to `localhost:8000` stalled (`ECONNRESET`, every page stuck on "Loading..."), while the API answered `curl` in 80 ms. Restarting my own dev server fixed it. Not reproducible on demand; noted so nobody blames a control for it.
- At 375 the long sequence name in a card header is truncated ("Lead live send check 2026-10-2…"); the name input stays editable.
- Team-member enrolments show `Sender: rewalk-tm` (the account's display name); founder enrolments show `Sender: Victor Founder`. Matches the guide ("the sender is the enrolling member").

## Not covered

- **Blocked: lead's live send** (see the rows): pressing **Send email** on a deal follow-up, a real step send, the delivered message, a real unsubscribe token (read, Unsubscribe button, "already unsubscribed", suppression after unsubscribe), sent counts on People rows (`n of m sent`), and the sent/bounced row states.
- Not producible without sending or DB access: the "paused by bounces" banner and founder-only **Resume** button (still covered only by the FE's mocked e2e), `SEND_UNCERTAIN` / `SEND_LIMIT_REACHED` messages, `configured:false` banner.
- Other Sales tabs (Pipeline, Accounts, AI Coach, Analytics) were only used as navigation targets; they have their own re-walks.

## Rows

Result legend: ✅ passes against the raw API / spec, ❌ fails (see above), `blocked: lead's live send` not exercised on purpose. Ids and emails are throwaway dev-workspace values.


### Founder, 1440

| Control | API evidence | Result |
|---|---|---|
| Sending banner matches GET /sales/sending | "1 of 100 sent today", domain cofoundaz.com; raw 200 configured:true sent_today:1 daily_cap:100 hourly_cap:500 domain:cofoundaz.com | ✅ |
| Empty state "No sequences yet" + its + New sequence button | raw GET /sales/sequences 200 total:0 | ✅ |
| + New sequence opens form (starter step 1, stop-on-reply checkbox checked+disabled) | - | ✅ |
| Create with empty name refused inline "Name this sequence." | raw list total unchanged (0) | ✅ |
| Wait days 70 refused "Enter a whole number of days, 0 to 60."; text input cleared -> same message | no POST; total 0 | ✅ |
| Unknown merge tag {{nope}} -> API wording inline | raw POST 422 VALIDATION_ERROR field steps.0.subject, message identical | ✅ |
| Merge chip inserts at caret (first_name mid-body; sender_name at end of step 2) | textarea value "Hi {{first_name}}, bye" | ✅ |
| + Add step x9 -> 10 steps, Add disabled, "A sequence has 1 to 10 steps." | DOM: 10 inputs, add.disabled | ✅ |
| Remove step x8 back to 2 | DOM 2 steps | ✅ |
| Create with empty step 2 refused: "Add a subject." / "Write the email." | no POST | ✅ |
| Stale "Add a subject."/"Write the email." remain after fields are filled until next submit | screenshot | ❌ FE (minor) |
| Preview with a sample contact renders "Idea for Acme / Hi Ada,..." ; Hide preview | - | ✅ |
| Create sequence -> toast "Sequence created", card appears, status active | raw 201: Rewalk paused A, active, step_count 2 | ✅ |
| Pause sequence | raw status paused | ✅ |
| Resume sequence (0 enrolled) | raw status active | ✅ |
| Pause again | raw status paused | ✅ |
| Save changes disabled until edit; edit shows Discard changes | DOM | ✅ |
| Discard changes restores text | DOM | ✅ |
| Save changes persists edit | raw steps[1].body ends " EDITED" | ✅ |
| Stop when deal moves stage checkbox + Save | raw stop_on_stage_change true, status unchanged paused | ✅ |
| Stop when they reply checkbox is checked+disabled (cannot be unticked) | DOM disabled | ✅ |
| Write with AI: opens prompt box, Write -> "Writing..." (~15s) -> fills subject+body unsaved (dirty, Discard shown), raw unchanged until Save; Save persists | raw steps[0].subject "Faster invoicing for {{company}}’s gig workers" | ✅ |
| Leads: Enrol on row opens dialog listing sequences, paused one preselected with note "This sequence is paused. They are enrolled but nothing is sent until you resume it." | - | ✅ |
| Leads enrol dialog: Cancel and Escape close without enrolling | raw total_enrollments unchanged (0) | ✅ |
| Leads: Enrol (Seq Walk Lead) -> "1 person enrolled."; Done closes | raw enrol 200: active, current_step 0, email seq-walk-lead@example.com, next_send_at set; sequence still paused | ✅ |
| Leads: enrol same lead again -> "Seq Walk Lead is already in this sequence."; no duplicate | raw POST 200 enrolled:0 skipped[already_active]; total_enrollments 1 | ✅ |
| Leads: lead with no email -> "Seq Walk NoEmail has no email address." | raw skipped[no_email] | ✅ |
| Leads: suppressed (unsubscribed) lead -> "Seq Walk Unsub unsubscribed or bounced earlier." | raw skipped[suppressed] | ✅ |
| Deal drawer (Kolo rider savings pilot): existing ready follow-up draft shown, fields editable; "Send follow-up" opens "Send this email now?" ask (nothing sent) | - | ✅ |
| Deal drawer: "Not yet" cancels, nothing sent | raw GET /sales/deals/{id}/follow-up: status ready, sent_at null (sent_today 1->2 was the lead's own sequence send, not this) | ✅ |
| Deal drawer: "Write a new one" -> new draft generated (~10s), fields refilled | raw draft 92e3231f status ready, sent_at null | ✅ |
| Deal drawer: "Send email" confirm (real send) | - | blocked: lead's live send |
| Follow-up editor shows literal {{first_name}} in the draft text (replaced only at send by render_message; not explained in UI) | app/services/sales/sending.py render_message; draft_prompts.py | obs (not a control) |
| Contact drawer (/sales/contacts?contact=id): Enrol in sequence -> dialog, paused preselected; Enrol -> "1 person enrolled." | raw enrollment contact_id set, lead_id null, status active, current_step 0; sequence paused | ✅ |
| Sequence card header counts match raw ("2 active · 2 enrolled · 0% reply rate · Paused") | raw active_enrollments 2, total 2, reply_rate 0 | ✅ |
| People (n) opens list: name, email, "Sender: Victor Founder · 0 of 2 sent · next step Oct 24, 2026" | raw enrollments: sender_name, current_step 0, next_send_at 2026-10-24T12:43:32Z | ✅ |
| People: Show filter Replied -> request ?status=replied, empty state "Nobody with that status"; Active -> rows | raw GET /enrollments?status=replied | ✅ |
| People: Mark replied flips row, header "1 active · 2 enrolled · 50% reply rate", row leaves Active filter | raw status replied, stopped_reason marked_replied, next_send_at null, reply_rate 0.5 | ✅ |
| People: Stop asks "Stop emailing Seq Walk Lead?"; Keep going cancels (enrollment still active) | raw status active | ✅ |
| People: Stop emails on a row someone else already ended -> toast "This enrollment has already ended." list refreshes to "Nobody with that status" | raw POST /enrollments/{id}/stop 409 ENROLLMENT_NOT_ACTIVE "This enrollment has already ended." | ✅ |
| After that 409, card header still says "1 active" and the Archive dialog says "1 person is still being emailed" while raw active_enrollments is 0 (sequence list not refreshed; stale until reload) | raw active_enrollments 0, reply_rate 0.5; UI "1 active · 2 enrolled · 50%" | ❌ FE (minor) |
| People: Stop emails success path clicked by hand | enrolment was ended via raw API in the 409 test; covered at 375 | see founder@375 |
| Hide people collapses list | DOM | ✅ |
| Archive asks ("Archive Rewalk paused A?"); Keep it cancels (status unchanged) | raw status paused | ✅ |
| Archive sequence confirms; card removed | raw list excludes it; include_archived shows status archived | ✅ |
| Sending banner updates on reload to "2 of 100 sent today" | raw sent_today 2 (the lead's own live send) | ✅ |
| + New sequence form: Cancel closes, nothing created | raw total unchanged (1) | ✅ |
| Sales tab bar: Leads tab -> /sales/leads, Sequences tab -> /sales/sequences | location.pathname | ✅ |
| Leads enrol summary: "Open sequences" -> /sales/sequences | raw enrolment active in the paused sequence (1 active) | ✅ |
| Archive with a live enrolment: dialog "Archive Rewalk founder 1440 paused B? 1 person is still being emailed. They are stopped and no more steps go out."; Archive sequence removes it | raw enrolment status stopped, stopped_reason sequence_archived; sequence archived | ✅ |
| Deal drawer on a deal with no draft: "Write a follow-up" -> draft generated (~10s), editable fields + Send follow-up appear | raw GET /sales/deals/34d0aee1…/follow-up draft 2040ab3e status ready, sent_at null | ✅ |

### Founder, 375

| Control | API evidence | Result |
|---|---|---|
| Sequences page: banner "2 of 100 sent today", no horizontal overflow, tab bar scrolls; lead card name truncated at 375 ("Lead live send check 2026-10-2…") | raw sent_today 2 | ✅ |
| + New sequence opens form; empty name refused "Name this sequence." | total unchanged | ✅ |
| Wait days 70 refused "Enter a whole number of days, 0 to 60." | no POST | ✅ |
| Unknown merge tag {{nope}} -> "Unknown merge tag {{nope}}. Use first_name, last_name, company, sender_name." | no sequence created | ✅ |
| Merge chip inserts at the caret (last_name at start when caret at 0; at end of line 3 after tapping there) | textarea value | ✅ |
| Add step to 10 -> Add disabled + "A sequence has 1 to 10 steps."; Remove step x8 back to 2 | DOM | ✅ |
| Preview with a sample contact renders "Hi for Acme / Hi Ada, / Bump for Acme"; Hide preview shown | - | ✅ |
| Create sequence -> card appears, active, 0 active · 0 enrolled | raw 2 steps [0 days "Hi for {{company}}", 3 days "Bump for {{company}}"] | ✅ |
| Pause sequence | raw status paused (lead's live sequence untouched, still active) | ✅ |
| Resume sequence (0 enrolled) then Pause again | raw active then paused | ✅ |
| Save changes disabled until edit; edit shows Discard; Discard restores; edit + Save persists | raw steps[1].body "Bumping this up. EDIT375" | ✅ |
| Stop when deal moves stage checkbox + Save | raw stop_on_stage_change true | ✅ |
| Write with AI: prompt box, Write, ~20s, fills subject+body unsaved (Save/Discard enabled, raw unchanged); Save persists | raw steps[0].subject "A simpler payout idea for {{company}}" | ✅ |
| Leads page: no horizontal page overflow (table scrolls inside its wrapper; Enrol sits at the table's right edge) | scrollWidth 375 | ✅ |
| Leads: Enrol dialog fits 375, paused sequence preselected + paused note; Cancel closes with no enrolment; Escape closes | raw total_enrollments 0 after cancel | ✅ |
| Leads: Enrol (Seq Walk Lead) -> "1 person enrolled." with Open sequences / Done; Done closes | raw enrolment seq-walk-lead@example.com active current_step 0; sequence paused | ✅ |
| Leads: enrol same lead again -> "Seq Walk Lead is already in this sequence." | raw total_enrollments stays 1 | ✅ |
| Leads: no-email lead -> "Seq Walk NoEmail has no email address." | total stays 1 | ✅ |
| Leads: suppressed lead -> "Seq Walk Unsub unsubscribed or bounced earlier." | total stays 1 | ✅ |
| Contact drawer (/sales/contacts?contact=id): Enrol in sequence dialog fits 375, paused preselected; Enrol -> "1 person enrolled." | raw enrolment seqwalk-contact@example.com active, contact_id set, lead_id null; sequence paused | ✅ |
| People (n) list layout (name, email, sender, "0 of 2 sent · next step Oct 24, 2026", Mark replied / Stop) fits 375; Show filter Replied -> ?status=replied + "Nobody with that status"; Active -> rows | raw GET /enrollments?status=replied | ✅ |
| People: Mark replied -> header "1 active · 2 enrolled · 50% reply rate" | raw status replied, marked_replied, reply_rate 0.5 | ✅ |
| People: Stop asks "Stop emailing Seq Walk Lead?"; Keep going cancels; Stop emails ends it; header -> "0 active · 2 enrolled · 50%" | raw status stopped, stopped_reason stopped_by_member, next_send_at null | ✅ |
| Hide people collapses the list (button back to People (2)) | DOM | ✅ |
| Archive asks "Archive Rewalk 375 paused? ... Nobody is being emailed from it right now."; Keep it cancels; Archive sequence removes card | raw list excludes it; include_archived shows archived | ✅ |
| Deal drawer: follow-up draft fits; "Send follow-up" opens "Send this email now?" (nothing sent) | - | ✅ |
| Deal drawer: "Not yet" cancels | raw draft 92e3231f status ready, sent_at null; sent_today stays 2 | ✅ |
| Deal drawer: "Write a new one" -> new draft | raw draft 98fdcb7f ready, sent_at null | ✅ |
| Deal drawer: "Send email" confirm (real send) | - | blocked: lead's live send |

### Team member, 1440

| Control | API evidence | Result |
|---|---|---|
| Sequences page: banner "2 of 100 sent today" matches raw; empty-name refusal; wait days 70 refused; unknown merge tag {{nope}} refused with API wording | raw total unchanged; POST 422 earlier captured | ✅ |
| Merge chip inserts at the caret (last_name after "Hi ") | textarea value "Hi {{last_name}}{{first_name}}," | ✅ |
| Add step to 10 -> Add disabled + cap message; Remove step x8 back to 2; Preview with a sample contact renders "TM idea for Acme / TM bump Acme" | DOM | ✅ |
| Create sequence -> card appears; Pause / Resume / Pause | raw 2 steps [0,3], status paused/active/paused | ✅ |
| Edit + Discard restores; edit + Save persists; Stop when deal moves stage + Save | raw steps[1].body ends "TM1440", stop_on_stage_change true | ✅ |
| Write with AI (step 2) fills unsaved (Save/Discard enabled), raw unchanged | raw steps[1].body "Bumping this. TM1440" | ✅ |
| Leads: Enrol dialog (paused preselected); Cancel + Escape close, nothing enrolled; Enrol -> "1 person enrolled."; repeat -> "already in this sequence"; no-email -> "has no email address"; suppressed -> "unsubscribed or bounced earlier" | raw enrolment active sender_email rewalk-tm@example.com; total stays 1; sequence paused | ✅ |
| Contact drawer: Enrol in sequence -> "1 person enrolled." | raw contact_id set, active | ✅ |
| People: Show Replied -> ?status=replied + "Nobody with that status"; Active -> rows; Mark replied -> toast "SeqWalk Contact marked as replied", header "1 active · 2 enrolled · 50%" | raw replied/marked_replied, reply_rate 0.5 | ✅ |
| People: Stop asks; Keep going cancels; Stop emails -> "0 active" | raw stopped/stopped_by_member | ✅ |
| Hide people; Archive asks ("Archive Rewalk TM 1440 paused?"); Keep it cancels; Archive sequence removes the card | raw archived | ✅ |
| Deal drawer: Send follow-up -> "Send this email now?"; Not yet cancels; Write a new one -> new draft | raw draft 98fdcb7f then d533a079 ready, sent_at null; sent_today 2 | ✅ |
| Deal drawer: Send email (real send) | - | blocked: lead's live send |

### Team member, 375

| Control | API evidence | Result |
|---|---|---|
| Login rewalk-tm@ on tm.localhost; Sequences page loads, banner "2 of 100 sent today" matches raw /sales/sending, same workspace sequences visible, no overflow | raw 200 configured:true sent_today 2 | ✅ |
| + New sequence; empty name refused; Create "Rewalk TM 375 paused" -> card appears | raw 201 active step_count 1 | ✅ |
| Pause sequence / Resume sequence / Pause again | raw paused / active / paused | ✅ |
| Edit + Discard changes restores; edit + Save changes persists | raw steps[0].body ends " TMEDIT" | ✅ |
| Stop when deal moves stage + Save | raw stop_on_stage_change true | ✅ |
| Write with AI (empty instruction) fills subject/body unsaved, Save/Discard enabled, raw unchanged | raw steps[0].body unchanged | ✅ |
| Leads: Enrol (Seq Walk Lead) into paused TM sequence -> "1 person enrolled." | raw enrolment active, sender_name rewalk-tm, sender_email rewalk-tm@example.com (the enrolling member) | ✅ |
| Contact drawer: Enrol in sequence -> "1 person enrolled." | raw contact_id set, active; sequence paused | ✅ |
| People: list shows "Sender: rewalk-tm · 0 of 1 sent"; Show filter Replied -> ?status=replied + "Nobody with that status"; Active -> rows | raw GET /enrollments?status=replied | ✅ |
| People: Mark replied -> "1 active · 2 enrolled · 50% reply rate" | raw replied/marked_replied, reply_rate 0.5 | ✅ |
| People: Stop asks; Keep going cancels; Stop emails -> "0 active" | raw stopped/stopped_by_member | ✅ |
| Hide people; Archive ("Archive Rewalk TM 375 paused? ... Nobody is being emailed from it right now.") -> card removed | raw archived | ✅ |
| Deal drawer: Send follow-up opens "Send this email now?"; Not yet cancels | raw draft 98fdcb7f ready sent_at null; sent_today 2 unchanged | ✅ |
| Deal drawer: Send email (real send) | - | blocked: lead's live send |

### Mentor, 1440 (expect denied)

| Control | API evidence | Result |
|---|---|---|
| /sales/sequences: sidebar has no Sales Hub entry; page shows "You don't have access to this page."; Back to dashboard -> /dashboard | raw GET /sales/sequences, GET /sales/sending, POST create, POST /sales/sending/resume, POST enroll, GET deal follow-up: all 403 FORBIDDEN | ✅ |
| /sales/leads, /sales?deal=<id>, /sales/contacts?contact=<id> all show the not-available page (no Enrol / Send follow-up controls) | text check | ✅ |

### Mentor, 375 (expect denied)

| Control | API evidence | Result |
|---|---|---|
| /sales/sequences shows "You don't have access to this page. Your role in this workspace doesn't include this section." + Back to dashboard (navigates to /dashboard) | raw GET /sales/sequences 403 FORBIDDEN "You don't have permission to do that." | ✅ |
| Raw API denial for every Sequences endpoint (ids are zero-UUID placeholders; 403 comes before lookup): list, GET /sales/sending, POST create, POST /sending/resume, POST enroll, GET+POST deal follow-up, POST enrollments replied/stop | all 403 FORBIDDEN | ✅ |
| Other entry points are denied too: /sales/leads, /sales?deal=<id>, /sales/contacts?contact=<id> show the same not-available page (no Enrol / follow-up controls) | text "You don't have access to this page." | ✅ |

### Consultant, 1440 (expect denied)

| Control | API evidence | Result |
|---|---|---|
| /sales/sequences: no Sales Hub in sidebar; "You don't have access to this page."; Back to dashboard works | raw list, sending, create, resume, enroll, follow-up, replied, stop: all 403 FORBIDDEN | ✅ |
| /sales/leads, /sales?deal=<id>, /sales/contacts?contact=<id> denied | text check | ✅ |

### Consultant, 375 (expect denied)

| Control | API evidence | Result |
|---|---|---|
| /sales/sequences denied page fits 375 (no overflow); Back to dashboard works | raw list, sending, create, resume, enroll, follow-up, stop: all 403 FORBIDDEN | ✅ |
| /sales/leads, /sales?deal=<id>, /sales/contacts?contact=<id> denied | text check | ✅ |

### Public unsubscribe page, 1440

| Control | API evidence | Result |
|---|---|---|
| /unsubscribe/<forged token> shows "This link does not work"; no horizontal overflow | raw GET /public/sales/unsubscribe/not-a-real-token 404 NOT_FOUND "Not found." | ✅ |
| /unsubscribe/<valid token>: read (masked email), Unsubscribe button POST, already-unsubscribed on reload | needs a token from a real delivered message | blocked: lead's live send |

### Public unsubscribe page, 375

| Control | API evidence | Result |
|---|---|---|
| /unsubscribe/<forged token> shows "This link does not work"; fits 375 (scrollWidth 375) | raw 404 | ✅ |

### Environment note

| Control | API evidence | Result |
|---|---|---|
| Dev-server proxy (Next -> API) hung once (ECONNRESET, Loading... forever); restarted my dev server; API itself healthy | - | n/a (env) |
