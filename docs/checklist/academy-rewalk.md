# Learning Academy: click-through re-walk (merged develop)

**Date:** 2026-10-24. **Verdict: DONE.** First walk (2026-10-24, develop `fc1a425`): 119 rows, 114 pass, 4 defects. Re-check (same day, develop `8ac8a55` + API `a9fd3a50`): all 4 fixed and verified by hand, see "Re-check" below. The first-walk tables and failure write-ups are kept as the record. Details and repro steps in "Failures".

**What was walked.** Merged `origin/develop` `fc1a425` (includes FE #148 and API #173) on a fresh dev server (`next dev -p 3391`,
`/api/v1` proxied to the shared API on `:8000`, develop `25fad5a1`, migration 0069, Academy content loaded: 8 courses / 24 lessons /
6 paths / 10 articles, all `review_status: draft`). Every row below was clicked or typed **by hand in the Claude browser pane**
(no Playwright, no script that drives the UI), at 1440 and 375 (pane emulation), then compared with the raw API
(`curl` with the same account's bearer token + `X-Workspace-Id`, same minute). Reading the DOM (`innerText`, `href`, `getBoundingClientRect`)
was used to read results, never to click. Raw captures of the API side are in `academy-rewalk-evidence/` (no tokens in them).

**Accounts / hosts (local, throwaway, passwords not recorded here):** founder `throwaway-founder@` on `localhost:3391` (NovaPay, `idea` stage),
team member `rewalk-tm@` on `tm.localhost`, mentor `bb-mentor-1@` on `m.localhost`, consultant `bb-consultant-1@` on `bc.localhost`.
Signed out = `anon.localhost` (a host with no cookies or storage; `127.0.0.1` does not hydrate under Next dev, so it was not used).

**Specs checked against:** `cofoundaz-api/docs/fe-integration-guide-academy.md`, `academy-prd-gaps.md` (gap list and D-ACA-1..5),
`academy-fe-walk.md` (FE #148).

**Legend.** ✅ = the UI matches the raw API and the guide. ❌ = a defect (see "Failures"). ⚠ = a note that is not a defect.
Widths: **1440** and **375**. Roles: F founder, TM team member, M mentor, BC business consultant.

## Re-check of D1 to D4 (2026-10-24, merged develop `8ac8a55`, API develop `a9fd3a50`, alembic 0070)

Fixes: FE #152 (bell clip and error state, profile-name prompt) and API #179 (verify limiter per visitor) + #180 (`PATCH /auth/me`).
Same method as above (by hand in the browser pane, 1440 and 375, compared with the raw API; own dev server `:3392`).
Raw captures in `academy-rewalk-evidence/recheck_*`. Test members were created through the API only (signup, verify via the dev email log,
invite from the founder, accept): `rewalk-nameless-...@example.com` (1440) and `rewalk-nameless-b-...@example.com` (375), password = the shared test password.
For D4 a pass-through proxy returned 500 for `GET /notifications?limit=50` while a flag file existed (scratch script, not in the repo); the API was never touched.

| # | Defect | Check | Result | Evidence | |
|---|---|---|---|---|---|
| R1 | D1 bell clipped at 375 | Founder, 375, open the bell | Panel is now `fixed inset-x-4` (16 px to 359 px, width 343), title "Notifications" and every row fully visible | `getBoundingClientRect` left 16, right 359, viewport 375 (was -64 to 279) | ✅ |
| R2 | D1 at 1440 | Founder, 1440, open the bell | Panel inside the viewport under the bell | screenshot | ✅ |
| R3 | D4 error state, 375 | `GET /notifications?limit=50` forced to 500, open the bell | "Could not load notifications." + a Retry button (not "No new notifications.") | network: `/notifications?limit=50` 500, `/unread-count` 200; badge still "9+" | ✅ |
| R4 | D4 Retry | Failure removed, tap Retry | List loads (Health Score rows) | `GET /notifications?limit=50` 200 | ✅ |
| R5 | D4 error state, 1440 | Same, 1440 | Same message + Retry | 500 on the list | ✅ |
| R6 | D3 limiter per visitor | 36 calls to one unknown code, then another unknown code and a real code | 30 x 404, then 429 on all three codes | `{"error":{"code":"RATE_LIMITED","message":"Too many requests. Slow down a moment.","field_errors":[]}}` for `CFZ-D3AA-...`, `CFZ-D3DD-...` and the real `CFZ-C4MB-SWRU-DRXE` (before: other codes 404/200) | ✅ |
| R7 | D3 header spoof | Limited visitor repeats with `X-Forwarded-For: 203.0.113.9` | still 429 (header not trusted) | `recheck_verify_xff.txt` | ✅ |
| R8 | D3 in the page | After exhausting the limiter, open `/verify/CFZ-D3QQ-WWWW-EEEE` signed out at 375 | "Too many requests. Slow down a moment." + Try again (a code never requested before) | page text | ✅ |
| R9 | D2 prompt appears before the last completion | Nameless team member, 1440: Start course, Mark complete on lessons 1 and 2 (no prompt), open lesson 3, Mark complete | Lesson 3 stays open and "Add your name before you finish" shows (full name box, "Save name and finish course", "Not now"); nothing is completed and no certificate exists yet | `GET /learning/courses/validation-talk-to-customers`: `progress 67`, lesson 3 `completed: false`; `GET /learning/certificates`: `[]` | ✅ |
| R10 | D2 blank name | Save with an empty box | "Tell us your name." | `PATCH /api/v1/auth/me` 422 | ✅ |
| R11 | D2 whitespace name | Save with 5 spaces | "Tell us your name." | `PATCH /auth/me` 422 | ✅ |
| R12 | D2 too long | Save with 125 characters (1440) and 131 (375) | "Keep it to 120 characters." | `PATCH /auth/me` 422, `field_errors: [{"field":"full_name","message":"Keep it to 120 characters."}]` | ✅ |
| R13 | D2 valid name | Type `Recheck Tester Adaeze`, "Save name and finish course" | Course completes: "Course complete" card + View certificate | request `PATCH /auth/me` body `{"full_name":"Recheck Tester Adaeze"}` -> 200, `profile.full_name` set; then `PATCH /learning/lessons/validation-talk-to-customers-3/progress` `{"completed":true}` -> 200, `progress 100`, certificate `holder_name: "Recheck Tester Adaeze"`, `credential_id: CFZ-5NQM-ANJD-5FDV` (`recheck_d2_name_flow.txt`) | ✅ |
| R14 | D2 `/auth/me` | `GET /auth/me` after the save | `profile.full_name: "Recheck Tester Adaeze"` | 200 | ✅ |
| R15 | D2 certificate page + PDF | View certificate; PDF | Card says "Recheck Tester Adaeze"; PDF text has "Recheck Tester Adaeze", course "Talk to customers", `CFZ-5NQM-ANJD-5FDV` | `GET /learning/certificates/{id}/pdf` 200, 3861 B | ✅ |
| R16 | D2 public verify | View verify page (1440), and `GET /verify/CFZ-5NQM-ANJD-5FDV` | "AWARDED TO Recheck Tester Adaeze" | 200 `holder_name: "Recheck Tester Adaeze"` | ✅ |
| R17 | D2 at 375 | Second nameless member: continue-watching card, sticky Mark complete on lesson 3 | Same prompt; blank -> "Tell us your name." (422); 131 characters -> "Keep it to 120 characters." (422) | `perf` statuses 422 | ✅ |
| R18 | D2 "Not now" | Tap "Not now", then Mark complete again | Prompt hides; the next Mark complete shows it again; no certificate until a name is saved | `GET /learning/certificates`: `[]` | ✅ ⚠ N10 |
| R19 | D2 valid name at 375 | Type `Recheck Tester Bola`, save | "Course complete"; certificate card "Recheck Tester Bola"; Download PDF request 200; no overflow | certificate `CFZ-YWQG-B4BJ-GHVR` `holder_name: "Recheck Tester Bola"`, `pdf_ready: true`; `GET /verify/CFZ-YWQG-B4BJ-GHVR` 200 same name | ✅ |
| R20 | `PATCH /auth/me` validation (API) | `""`, `"   "`, 121 characters, `{}`, `null` | all 422 (`Tell us your name.`, `Keep it to 120 characters.`, `Field required`, `Input should be a valid string`); profile unchanged | `recheck_patch_auth_me_invalid.txt` | ✅ |

**Result: 20 of 20 re-check rows pass, 0 failures. D1, D2, D3 and D4 are fixed. Academy is Done.**

Notes from the re-check (not defects):
- **N10:** "Not now" only hides the prompt. Pressing Mark complete shows it again, so a learner cannot finish a course without a name. That matches the guide (the name is frozen at issue), but the button label suggests "skip". At 375 the sticky Mark complete bar also covers the "Not now" button until you scroll.
- The prompt only appears at the final lesson, as designed (R9); the earlier lessons and the course page have no name hint.
- The first-walk notes N1, N2, N4 to N9 still apply (legacy certificates without a PDF, no video, submit-on-Enter article search, 48 repeated Health Score alerts, `verify_url` host from config).
- State left behind: two new local test members on NovaPay (`rewalk-nameless-...`, `rewalk-nameless-b-...`) with one certificate each; the earlier TM account now has the name `Rewalk Teammate` (set by someone else's test).

## 1. Founder (F), 1440

| # | Control | Result | API evidence | |
|---|---|---|---|---|
| F1 | Hub `/academy` (Recommended) | No hero. Sentence "You have finished everything for this stage." Idea-stage courses are all done | `GET /learning/recommendations` 200: `stage: idea`, `hero: null`, `recommended: []`, `continue_watching: []` | ✅ |
| F2 | Hub "Browse all courses" link | Opens `/academy/courses` | link text is FE copy; target is the catalogue | ✅ |
| F3 | Catalogue cards and labels | 8 cards; completed ones say "Review course", the rest "Start course"; progress ring numbers | `GET /learning/courses` 200: 8 courses; `completed` / `progress` / `enrolled` per card equal | ✅ |
| F4 | Draft badge on every card | 8 DRAFT badges | `review_status: draft` on all 8 | ✅ |
| F5 | Search "price" | 1 card: Price your product | title/summary match | ✅ |
| F6 | Search "zzzz" | "No courses match." | 0 matches | ✅ |
| F7 | Stage chips Idea / Validation / Launch / Build / Growth / Scale | 1 / 4 / 2 / 1 / 2 / 2 cards | counts of `stage_tags` in the API list: idea 1, validation 4, launch 2, build 1, growth 2, scale 2 | ✅ |
| F8 | Level chips Beginner / Intermediate / Advanced | 2 / 3 / 3 cards | `level` counts 2 / 3 / 3 | ✅ |
| F9 | Launch + Advanced, then "All" | 0 cards + empty copy; "All" resets both groups to 8 | no course has both | ✅ ⚠ one "All" chip clears stage and level together |
| F10 | Open course card (Price your product, completed) | Description, 3 outcomes, 3 lessons with ticks, "Completed" ring, "View your certificate" link | `GET /learning/courses/validation-price-your-product` 200: same description, outcomes, 3 lessons, all `completed: true`, `next_lesson_id: null` | ✅ |
| F11 | "Review course" on a completed course | Opens lesson 1 (API has no next lesson, FE falls back to first) | `next_lesson_id: null` | ✅ |
| F12 | Lesson reader, no video | Notice "There is no video for this lesson yet. Read the transcript below."; 0 iframes; transcript rendered as headings and lists, no raw HTML | `video: null`, transcript markdown | ✅ |
| F13 | Reader tabs Transcript / Private notes | Tab switches; notes tab loads the saved note as plain text | `GET /lessons/validation-price-your-product-1/notes` 200 | ✅ |
| F14 | Type a note with `<script>` and `**bold**` | "Saved" appears after the debounce; text stays literal, no script ran | PUT saved: `body` equals the typed text verbatim, `updated_at` set | ✅ |
| F15 | Notes are per lesson | Lesson 2 note box empty, counter 0 / 20000 | lesson 2: `body: ""`, `updated_at: null` | ✅ |
| F16 | Lesson list row (side panel) | Opens lesson 2 | route `/lessons/validation-price-your-product-2` | ✅ |
| F17 | Plan your go-to-market: "Start course" | Enrols and opens lesson 1 | course: `enrolled: true`, `progress: 0`, `next_lesson_id: ...-1` | ✅ |
| F18 | "Mark complete" lesson 1 of 3 | "Saving...", then 33%, "Up next: Write launch messaging" with Play / Stay, button "Completed ✓" disabled | `progress: 33`, lesson 1 `completed: true`, `next_lesson_id: ...-2` | ✅ |
| F19 | "Stay" | Prompt closes, stays on lesson 1 | n/a | ✅ |
| F20 | Lesson 2 "Mark complete", then "Play" | Toast "Lesson marked complete." 67%; Play opens lesson 3 | progress 67 | ✅ |
| F21 | Last lesson "Mark complete" | "Course complete" card + "View certificate" | `progress: 100`, `completed_at` set, certificate `CFZ-CKYN-DQSZ-NWKU` | ✅ |
| F22 | "View certificate" | Opens `/academy/certificates`; new card first | `GET /learning/certificates` 200: 5 certificates, newest first | ✅ |
| F23 | Certificate card content | course, "Victor Founder", issued 24 October 2026, "Cofoundaz", credential `CFZ-CKYN-DQSZ-NWKU`; row UUID never shown | `credential_id`, `holder_name`, `issuer`, `issued_at` equal | ✅ |
| F24 | "Preparing your PDF..." on a fresh certificate | Shown briefly while `pdf_ready` false, then enabled | first read `pdf_ready: false`, later `true` | ✅ |
| F25 | "Download PDF" | Request `GET /learning/certificates/4fc28b84-.../pdf` 200 (id equals the API row). The pane does not expose the saved file, so the file itself is checked by curl | `application/pdf`, `content-disposition: attachment; filename="cofoundaz-certificate-CFZ-CKYN-DQSZ-NWKU.pdf"`, 3852 B, starts `%PDF-1.4` | ✅ ⚠ saved file not inspected in the pane |
| F26 | "Add to LinkedIn" | `href` identical to `linkedin_url`; `target=_blank`, `rel="noopener noreferrer"`. Not clicked (nothing submitted on LinkedIn) | `linkedin_url` = `https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=Plan%20your%20go-to-market&organizationName=Cofoundaz&issueYear=2026&issueMonth=10&certId=CFZ-CKYN-DQSZ-NWKU&certUrl=http%3A%2F%2Flocalhost%3A3000%2Fverify%2FCFZ-CKYN-DQSZ-NWKU` (all 5 cards compared) | ✅ ⚠ not clicked |
| F27 | "Copy verify link" | Clipboard write (spied on `writeText`) = `http://localhost:3000/verify/CFZ-CKYN-DQSZ-NWKU` | equals `verify_url`. ⚠ the API builds it from its configured FE URL (`localhost:3000`), so it must be set per environment | ✅ |
| F28 | "View verify page" (signed in) | `/verify/CFZ-CKYN-DQSZ-NWKU`: Valid credential, Victor Founder, Plan your go-to-market, 24 October 2026, Cofoundaz | `GET /verify/CFZ-CKYN-DQSZ-NWKU` 200 same fields | ✅ |
| F29 | Legacy certificate `CFZ-C4MB-SWRU-DRXE` | "Download PDF" disabled; "Preparing your PDF..." then banner "Still preparing. Check back soon." after the 30 s poll | `pdf_ready: false`, `pdf_url: null` (never rendered, as briefed: not a page bug) | ✅ ⚠ |
| F30 | Paths tab | 6 path cards; ordered course rows with Done / %; progress bars; "Idea · Your stage" chip; subtitle "The curriculum for where you are, not where the internet thinks you are." | `GET /learning/paths` 200: 6 paths; Idea 100, Validation 100, Build 100, Launch 100 (after F21), Grow 0, Scale 0 | ✅ |
| F31 | Path CTA "Start path" (Grow repeatably) | Opens `/academy/courses/growth-find-a-channel` (first course) | first course of the path | ✅ |
| F32 | Path CTAs on done paths | "Review path" opens the first course | `courses[0]` | ✅ |
| F33 | Articles tab | 10 cards, 20 tag chips, Draft badges, "1 min read" | `GET /learning/articles` 200: 10 articles, `read_min: 1`, all draft | ✅ ⚠ every article reads "1 min" |
| F34 | Article search "runway" + Enter | 3 results: read-your-runway, weekly-founder-review, first-hire | `?q=runway` 200: same 3 ids | ✅ ⚠ search is submit-on-Enter with no hint (the catalogue filters live) |
| F35 | Article search "zzzz" + Enter | "No articles match." | `?q=zzzz` 200: `[]` | ✅ |
| F36 | Clear (x) in the search box | 10 cards back | unfiltered list | ✅ |
| F37 | Tag chip "money" | 3 cards: pricing-basics, accepting-first-payments, read-your-runway | `?tag=money` 200: same 3 | ✅ |
| F38 | "Read article" card | Reader: tags, Draft badge, read time, rendered markdown, top progress bar reaching 100 at the end | `GET /learning/articles/article-pricing-basics` 200: `read_min 1`, `review_status draft`, body 1455 chars | ✅ |
| F39 | Reader "Related" items | 3 articles + 3 courses | `related.articles`: interview-questions, painkiller-or-vitamin, accepting-first-payments; `related.courses`: validation-price-your-product, idea-shape-the-problem, validation-talk-to-customers | ✅ |
| F40 | Related article click, then related course click | Opens `article-interview-questions`; then `/academy/courses/validation-price-your-product` | hrefs from the API ids | ✅ |
| F41 | ⌘K "runway" | Pages: Runway; Learning Academy: course Know your numbers, article How to read your runway...; Mission task | `GET /search?q=runway` 200: `course` growth-know-your-numbers, `article` article-read-your-runway, `href`s equal | ✅ |
| F42 | Click the article result | Opens `/academy/articles/article-read-your-runway` | `href` | ✅ |
| F43 | ⌘K "numbers" + Enter on the course result | Opens `/academy/courses/growth-know-your-numbers` | `href` | ✅ |
| F44 | Bell: open | 8 visible rows incl. "Certificate earned: Plan your go-to-market 🎓", others `healthscore.dropped` | `GET /notifications?limit=50` 200: `learning.course.completed`, title "Certificate earned: Plan your go-to-market 🎓", body "Download it" | ✅ ⚠ see note N6 (48 of 50 rows are the same Health Score alert) |
| F45 | Click that bell row | Opens `/academy/certificates` | deep link `/academy/certificates` | ✅ |
| F46 | No horizontal scroll, console | `scrollWidth` 1440 on all pages | n/a | ✅ ⚠ console showed proxy 500s only (N7) |

## 2. Founder (F), 375

| # | Control | Result | API evidence | |
|---|---|---|---|---|
| F47 | Hub | Same "finished" sentence; tab strip scrolls inside itself; Recommended / Courses / Paths 44 px high, Articles and Certificates off-screen but present | hero `null` | ✅ |
| F48 | Section tabs touch size | 5 tabs, each 44 px high | n/a | ✅ |
| F49 | "Browse all courses" | `/academy/courses`, 8 cards, `scrollWidth` 375 | 8 courses | ✅ |
| F50 | Search "price" / "zzzz" | 1 card / "No courses match." | as F5, F6 | ✅ |
| F51 | Chips Launch, Launch+Advanced, All, Growth, Growth+Beginner | 2 / 0 + empty copy / 8 / 2 / 0 | `stage_tags` and `level` counts as F7, F8 | ✅ |
| F52 | Course page (Find a repeatable channel) | Description, outcomes, curriculum. The "Start course" card sits below the outcomes, so it is under the fold on a phone | `GET /learning/courses/growth-find-a-channel` 200 | ✅ ⚠ |
| F53 | "Start course" | Opens lesson 1 | `enrolled: true` | ✅ |
| F54 | Lesson page | Notice, transcript, sticky "Mark complete" bar above the tab bar, collapsible "Lessons" block | `video: null` | ✅ |
| F55 | Private notes tab, type `<img src=x onerror=alert(1)>` | "Saved"; shown as text, 0 `<img>` in the page | `GET /lessons/growth-find-a-channel-1/notes` 200: `body` verbatim | ✅ |
| F56 | Sticky "Mark complete" | Toast, "Up next: Double down on the winner", button "Completed ✓" | `progress: 33` | ✅ |
| F57 | "Stay", then lesson list link to lesson 2 | Prompt closes; lesson 2 opens. ⚠ one coordinate tap on that row did not navigate; the same link tapped by reference did (not reproduced) | route `...-2` | ✅ ⚠ |
| F58 | Mark complete lesson 2, "Play", Mark complete lesson 3 | 67%, then lesson 3, then "Course complete" + "View certificate" | certificate `CFZ-LAQ7-BMS4-N877` | ✅ |
| F59 | Certificates page | Card, then Download PDF / Add to LinkedIn / Copy verify link / View verify page, no overflow | `GET /learning/certificates` 200: 6 certificates, newest `CFZ-LAQ7-BMS4-N877`, `pdf_ready: true` | ✅ |
| F60 | Download PDF, Copy verify link | PDF request `.../68cf074f-.../pdf` 200; clipboard `http://localhost:3000/verify/CFZ-LAQ7-BMS4-N877` | row id and `verify_url` equal | ✅ |
| F61 | Add to LinkedIn (href) | equals `linkedin_url` for `CFZ-LAQ7-BMS4-N877`; not clicked | equal | ✅ |
| F62 | View verify page | Valid credential, Find a repeatable channel | `GET /verify/CFZ-LAQ7-BMS4-N877` 200 | ✅ |
| F63 | Learning Paths tab, "Continue path" (Grow repeatably, now 50%) | 6 cards; Grow shows Done + 0%; CTA opens `growth-know-your-numbers` | Grow `progress: 50`, next course know-your-numbers | ✅ |
| F64 | Articles tab, search "runway" + Enter, "zzzz", clear, chip "money" | 3 / empty copy / 10 / 3, ids equal | same as F34 to F37 | ✅ |
| F65 | Article reader, scroll, related article | Reader with Draft badge and progress bar (86 at mid-scroll), related opens `article-interview-questions` | `related` as F39 | ✅ |
| F66 | Header search tap, "price" | Pages: Pricing; Academy: Price your product (course), Pricing your first product in naira (article) | `GET /search?q=price` 200 same 3 | ✅ |
| F67 | Click the article result | Opens `/academy/articles/article-pricing-basics` | `href` | ✅ |
| F68 | **Bell panel** | **Panel spans -64 px to 279 px: the title reads "...ations" and every row is cut on the left** | `GET /notifications?limit=50` 200 (data fine) | ❌ see D1 |
| F69 | Click the "Certificate earned: Find a repeatable channel" row | Opens `/academy/certificates` | deep link | ✅ |
| F70 | Other 375 header controls | Header buttons are 30 to 36 px tall (search 30, bell 36, Invite 36). ⚠ shell, not Academy | n/a | ⚠ |

## 3. Team member (TM)

| # | Control | Result | API evidence | |
|---|---|---|---|---|
| T1 | Hub at 1440 | "Learn next" card with sparkle line "At the idea stage, this course will help you sharpen the problem, validate market pain, and build a stronger foundation for your product." + "Shape the problem" + Draft + 30 min / 3 lessons + "Continue →" | `hero.reason` is that exact string, `reason_source: "ai"`, `matched_gaps: [market, product]` | ✅ |
| T2 | "Continue watching" row at 1440 | 1 course, ring 67, "67% complete · Continue", link to lesson 3 (not clicked at 1440; clicked at 375, T14) | `continue_watching`: idea-shape-the-problem, `progress 67`, `next_lesson_id: ...-3` | ✅ |
| T3 | Hero "Continue →" (1440) | Opens `/academy/courses/idea-shape-the-problem` | course link | ✅ |
| T4 | Course page "Continue" (1440) | Opens lesson 3 "Size the pain" | `next_lesson_id: ...-3` | ✅ |
| T5 | Private note on lesson 3 (1440) | "TM private note 1440" saved | TM `body` equal; **founder** `GET` same lesson: `body: ""`, `updated_at: null` (isolated) | ✅ |
| T6 | Certificates tab (1440) | Only the TM's own legacy card "Scope the MVP", holder "Cofoundaz member", "Preparing your PDF...", Download disabled | `GET /learning/certificates`: 1 row, `holder_name: "Cofoundaz member"`, `pdf_ready: false`, issued 2026-10-21 | ✅ ⚠ N3 |
| T7 | Copy verify link, Add to LinkedIn href, View verify page (1440) | `http://localhost:3000/verify/CFZ-RVE9-Z2ZX-N7RS`; href equal; verify page "AWARDED TO Cofoundaz member" | `GET /verify/CFZ-RVE9-Z2ZX-N7RS` 200 `holder_name: "Cofoundaz member"` | ✅ |
| T8 | Catalogue (1440) | Idea course says "Continue", Scope the MVP "Review course", rest "Start course" | TM `progress` 67 / 100 / 0 | ✅ |
| T9 | Learning Paths tab + "Continue path" (1440) | % 34 / 42 / 50 / 0 / 0 / 0; second card opens `idea-shape-the-problem` | API `progress` 34, 42, 50, 0, 0, 0 | ✅ |
| T10 | Articles: search "hire" + Enter, "Read article" (1440) | 1 result, reader opens, related = equity-talk article + 2 courses | `?q=hire`: `[article-first-hire]`; `related` equal | ✅ |
| T11 | ⌘K "equity" + click article (1440) | Course Build the org + article The equity conversation... ; click opens the article | `GET /search?q=equity` 200 equal | ✅ |
| T12 | Bell (1440) | Rows equal the API list (Health Score alerts, briefing) | `GET /notifications` 200 | ✅ |
| T13 | Hub at 375 | Same hero and reason; "Continue watching" below | same as T1 | ✅ |
| T14 | Click the continue-watching card (375) | Opens lesson 3 | `next_lesson_id` | ✅ |
| T15 | Notes at 375 | The 1440 note is there, so it persists across widths | same `body` | ✅ |
| T16 | Last lesson "Mark complete" (375) | "Course complete: You earned a certificate for Shape the problem." No warning that the profile has no name | PATCH → certificate `CFZ-GP9Q-SUMJ-P9UW`, `holder_name: "Cofoundaz member"` | ❌ see D2 |
| T17 | Certificates page (375) | New card first, holder **Cofoundaz member**; Download PDF request `.../7ef69e9e-.../pdf` 200; Copy link = `http://localhost:3000/verify/CFZ-GP9Q-SUMJ-P9UW`; LinkedIn href equal | `GET /learning/certificates`: 2 rows, new one `pdf_ready: true` | ✅ (name: D2) |
| T18 | Catalogue at 375: search "customers", chips Beginner, Beginner+Validation, All | `validation-talk-to-customers`; 2; 2; 8 | API `level`/`stage_tags` | ✅ |
| T19 | Learning Paths at 375, "Start path" (Grow) | 50% / 50% / 50% / 0 / 0 / 0; opens `growth-find-a-channel` | API 50, 50, 50, 0, 0, 0 after T16 | ✅ |
| T20 | Articles at 375: search "equity" + Enter | 1 result, no overflow | `?q=equity`: `[article-cofounder-equity-talk]` | ✅ |
| T21 | Header search at 375, "customers", click the course | Learning Academy: Talk to customers, Your first ten customers...; opens the course | `GET /search?q=customers` 200 equal | ✅ |
| T22 | Bell at 375 | Panel fits (16 to 359 px); new row "Certificate earned: Shape the problem" first. (The clip in D1 only happens for the founder header, which has the Invite button.) | `learning.course.completed` | ✅ |
| T23 | Cross-user PDF | TM asking for the founder's certificate PDF | `GET /learning/certificates/4fc28b84-.../pdf` as TM: **404 NOT_FOUND** (same body as an unknown id) | ✅ |

## 4. Mentor (M) and business consultant (BC): denied everywhere

Both roles are denied at the API and the FE shows "You don't have access to this page. Your role in this workspace doesn't include this section."
with a "Back to dashboard" button. The sidebar (and the 375 "More" drawer) has no Learning Academy entry. The FE sends no `/learning` request.
The FE PR's finding stands, confirmed against the API and the gap list (row D-ACA-7: F and TM only).

| # | Control | Result | API evidence | |
|---|---|---|---|---|
| M1 | M 1440: `/academy`, `/academy/courses`, `/academy/courses/idea-shape-the-problem`, the lesson route, `/academy/paths`, `/academy/articles`, `/academy/articles/article-pricing-basics`, `/academy/certificates` | all 8 show the denial, URL kept, no data text | `GET /learning/recommendations`, `/courses`, `/courses/{id}`, `/paths`, `/articles`, `/articles/{id}`, `/certificates`, `/lessons/{id}/notes` all **403 FORBIDDEN** "You don't have permission to do that." | ✅ |
| M2 | M 1440: write routes | n/a (no UI) | `POST /learning/enrollments`, `PATCH /lessons/{id}/progress`, `PUT /lessons/{id}/notes` all **403** | ✅ |
| M3 | M 1440: "Back to dashboard" | Opens `/dashboard` | n/a | ✅ |
| M4 | M 1440: sidebar | Dashboard, Health Score, Roadmap, Business Builder, Documents, Analytics & Reports; no Learning Academy | n/a | ✅ |
| M5 | M 1440: ⌘K "runway" | "No results for 'runway'" | `GET /search?q=runway` 200 `results: []` | ✅ |
| M6 | M 1440: bell | No learning rows | 50 notifications: 48 `healthscore.dropped`, 2 `roadmap.milestone.due_soon`, 0 `learning.*` | ✅ |
| M7 | M 1440: FE requests while denied | 0 `/learning` requests on the certificates page | performance entries: onboarding, auth/me, missions (403), notifications only | ✅ |
| M8 | M 375: 7 routes (hub, courses, lesson, paths, articles, article, certificates) | all show the denial, `scrollWidth` 375 (no header on the denial screen at 375) | as M1 | ✅ |
| M9 | M 375: "Back to dashboard", "More" drawer | `/dashboard`; drawer lists Dashboard, Health Score, Roadmap, Business Builder, Documents, Analytics & Reports, Notifications, Settings, Security; no Academy | n/a | ✅ |
| M10 | M 375: header search and bell | not repeated at 375 (done at 1440, M5, M6) | | ⚠ |
| B1 | BC 1440: `/academy`, `/academy/courses`, the lesson route, `/academy/paths`, `/academy/articles`, `/academy/articles/article-pricing-basics`, `/academy/certificates` | all 7 show the denial; 0 `/learning` requests | same 403 set as M1 for `bb-consultant-1@` (12 of 12 learning routes 403, writes 403) | ✅ |
| B2 | BC 1440: "Back to dashboard"; sidebar | `/dashboard`; no Learning Academy | n/a | ✅ |
| B3 | BC 1440: ⌘K "price" | Pages: Pricing only; no course or article | `GET /search?q=price` 200: one `page` result | ✅ |
| B4 | BC 1440: bell | not opened; API: 48 `healthscore.dropped` + 2 `roadmap...`, 0 `learning.*` | | ✅ ⚠ |
| B5 | BC 375: the same 7 routes | all show the denial | as B1 | ✅ |
| B6 | BC 375: "Back to dashboard", "More" drawer | `/dashboard`; no Academy in the drawer | n/a | ✅ |
| B7 | M and TM PDF of another person's certificate | M and BC asking for the founder's PDF: **403**; TM: **404** (T23); no token: **401 UNAUTHORIZED** "Not authenticated." | guide section 12, "Owner-only PDF" (now seen live for TM, M, BC and no token) | ✅ |

## 5. Public `/verify/[code]`, signed out (`anon.localhost`, no cookies or storage)

| # | Control | Result | API evidence | |
|---|---|---|---|---|
| V1 | 1440: lower-case code `cfz-ckyn-dqsz-nwku` | Valid credential; Victor Founder; Plan your go-to-market; 24 October 2026; Cofoundaz. Code is shown as typed (lower case). 0 cookies, 0 storage keys | `GET /verify/CFZ-CKYN-DQSZ-NWKU` 200 | ✅ |
| V2 | 375: `cfz-laq7-bms4-n877` | Valid credential, same layout, `scrollWidth` 375 | 200 `holder_name`, `course_title` equal | ✅ |
| V3 | 375: unknown `CFZ-AAAA-BBBB-CCCC` | "We could not find a credential with this code. Check the code and try again." | 404 `NOT_FOUND` "Not found." | ✅ |
| V4 | 375: malformed `abc` | same not-found copy | 404 `NOT_FOUND` | ✅ |
| V5 | 375: legacy `CFZ-C4MB-SWRU-DRXE` | Valid credential, Shape the problem, 21 October 2026 | 200 `valid: true` | ✅ |
| V6 | 375 and 1440: after 30+ calls to one code | "Too many requests. Slow down a moment." + "Try again" | 30 x 404, then 429 `RATE_LIMITED` "Too many requests. Slow down a moment." | ✅ (limiter: D3) |
| V7 | "Try again" while limited / after the window | Re-requests (still 429 copy); after about a minute the same click shows the not-found copy | 429, then 404 | ✅ |
| V8 | "Cofoundaz home" | Opens `/` | link `/` | ✅ |
| V9 | 1440: unknown code page | not repeated at 1440 (done at 375, V3) | | ⚠ |

## Failures

### D1. FE: the founder's bell panel is cut off on the left at 375
- **Steps:** log in as the founder on `localhost:3391`, set the pane to 375 x 812, open `/academy` (any dashboard page), tap the bell (top right).
- **Request / response:** `GET /api/v1/notifications?limit=50` -> 200 with 50 rows (fine). The data is not the problem.
- **Actual:** the panel (class `absolute top-12 right-0 z-50 w-[min(24rem,calc(100vw-2rem))]`) measures left -64 px, right 279 px, width 343 px. The title reads "...ations", and every row loses its first characters. The header has "+ Invite" to the right of the bell, so the bell is not at the viewport edge and `right-0` pushes the panel out to the left. For the team member (no Invite button) it fits (16 to 359 px).
- **Expected:** the panel stays inside the viewport at 375.
- **Layer: FE** (shell notification popover, shared by every page; not Academy code). Severity: Medium (the bell is a primary control on phones for founders).

### D2. FE: no profile-name warning before a course is finished (guide UX instruction 6)
- **Steps:** log in as `rewalk-tm@` (profile `full_name` is `null`) on `tm.localhost:3391`, open the hub, "Continue", lesson 3 of Shape the problem, "Mark complete", then "View certificate".
- **Request / response:** `PATCH /learning/lessons/idea-shape-the-problem-3/progress` `{"completed":true}` -> 200 with a certificate; `GET /learning/certificates` -> `{"credential_id":"CFZ-GP9Q-SUMJ-P9UW","course_title":"Shape the problem","holder_name":"Cofoundaz member",...}`; `GET /verify/CFZ-GP9Q-SUMJ-P9UW` -> `"holder_name":"Cofoundaz member"`.
- **Actual:** the "Course complete" card and the certificate say "Cofoundaz member". Nothing before or during the course tells the learner to add a name. The guide (section 1, item 6) says the holder name is frozen at issue and that the FE must send people without a name to the profile first. `grep` finds no use of the profile name anywhere in the Academy FE.
- **Expected:** a visible prompt (course page or lesson page, before the last lesson) to add a full name, linking to the profile.
- **Layer: FE.** Severity: Medium (the wrong name is permanent on a public page and the PDF).

### D3. API: the verify rate limit is per code, not per visitor
- **Steps:** `for i in 1..36: curl http://localhost:8000/api/v1/verify/CFZ-TTTT-UUUU-VVVV`, then call a different code and a real code (`academy-rewalk-evidence/verify_rate_limit_per_code.txt`).
- **Request / response:** calls 1 to 30 -> 404 `NOT_FOUND`; 31 to 36 -> 429 `{"error":{"code":"RATE_LIMITED","message":"Too many requests. Slow down a moment.","field_errors":[]}}`. A different unknown code straight after -> 404 (not 429). The real code `CFZ-C4MB-SWRU-DRXE` -> 200.
- **Expected (guide section 1, item 8):** "30 per minute per visitor". One visitor can try any number of different codes. The FE page itself behaves correctly (V6, V7).
- **Layer: API.** Severity: Medium (limiter bypass; the code space is 12 characters, so guessing is still hard, but the guide and the behaviour disagree). Already reported in the FE walk (`academy-fe-walk.md`, API finding 2); still open on merged develop.

### D4. FE (low): the bell shows "No new notifications." when its list request failed
- **Steps:** with the dev server before keep-alive was switched off (the Next dev rewrite to the docker API reset sockets, `Error: socket hang up` / `read ECONNRESET`), open the bell on any page.
- **Request / response:** `GET /api/v1/notifications?limit=50` -> 500 twice (the request never reached the API, see N7), while the badge still said "9+" and `GET /notifications/unread-count` (direct) was 140.
- **Actual:** the panel said "No new notifications." (an empty state for a failed load). The Academy articles list, hit by the same flake, showed "Could not load this data." with a Retry button, and Retry recovered once the flake passed.
- **Expected:** an error state with Retry, as the data-layer rule (gap 15) says.
- **Layer: FE** (shell bell). Severity: Low. The 500 itself was caused by the local dev proxy, not by the API.

## Notes (not failures)

| # | Note |
|---|---|
| N1 | **Legacy certificates without a PDF:** `CFZ-C4MB-SWRU-DRXE` (founder, as briefed) and `CFZ-RVE9-Z2ZX-N7RS` (team member, issued 2026-10-21 11:42 UTC). Both stay `pdf_ready: false`, `pdf_url: null`, and the FE copy ("Preparing your PDF..." then "Still preparing. Check back soon.") is right. Needs a backfill or re-enqueue on the API side; certificates issued today render in seconds. |
| N2 | **Not verifiable here:** the LinkedIn dialog (href only, by design); the saved PDF file in the pane (request 200 + curl of the same bytes checked instead); the clipboard (read is blocked in the pane, so `writeText` was spied on); video player, `?start=` resume and position reporting (no lesson has a video, so the transcript-only state is correct); `learning.course.recommended` (needs a stage change); a revoked credential (no revoke feature). |
| N3 | A TM with no profile name gets "Cofoundaz member" on certificates and the verify page (this is D2's cause). |
| N4 | Article search submits on Enter; the catalogue filters as you type. There is no hint on the articles box. The single "All" chip on the catalogue clears stage and level together. Each is a design choice, not a defect. |
| N5 | `/verify/[code]` prints the code as it was typed (lower case in V1, V2). The API normalises it. |
| N6 | 48 of the first 50 notifications for every role are the same "Your Health Score dropped 31 points" alert (a new one about every 15 minutes). Not Academy, but it will push `learning.course.completed` rows out of the 50 the bell loads. Belongs to the Dashboard/Health module. |
| N7 | Dev-environment flake: Next's dev rewrite to the docker API reset reused sockets (`ECONNRESET`), giving 500s on the browser's calls that never reached uvicorn (the API log shows none of them). Curl through the same proxy was fine. The rest of the walk ran with a keep-alive-off preload (`NODE_OPTIONS=--require`, kept out of the repo) and had no further 500s. |
| N8 | At 375 the sign-in form sits below the first screen (the brand panel fills it). Not Academy; noted in passing. |
| N9 | `verify_url` / `linkedin_url` use `http://localhost:3000` because the API's FE base URL is a local config value. It must be set per environment before the LinkedIn button is useful on staging. |

## State this walk left behind (local database)
Founder: certificates for Plan your go-to-market (`CFZ-CKYN-DQSZ-NWKU`) and Find a repeatable channel (`CFZ-LAQ7-BMS4-N877`); notes on two lessons. Team member: Shape the problem completed (`CFZ-GP9Q-SUMJ-P9UW`) with a note on lesson 3. Verify limiter hits on `CFZ-TTTT-...`, `CFZ-QQQQ-...`, `CFZ-MMMM-...` (expired within a minute).

## Counts
Rows are counted from the tables above (a row with ✅ and a ⚠ is a pass; a row with only ⚠ is a note, not a check).

| Section | Rows | ✅ | ❌ | ⚠ only |
|---|---|---|---|---|
| Founder 1440 | 46 | 46 | 0 | 0 |
| Founder 375 | 24 | 22 | 1 | 1 |
| Team member | 23 | 22 | 1 | 0 |
| Mentor + consultant | 17 | 16 | 0 | 1 |
| Signed out | 9 | 8 | 0 | 1 |
| **Total** | **119** | **114** | **2 rows** | **3** |

The 2 ❌ rows belong to D1 and D2; D3 (API) and D4 (FE, low) were found while checking rows that otherwise pass (V6 and the article search retry). So: **4 defects (D1, D2 FE medium; D3 API medium; D4 FE low)**.
Because of these, Academy is **not** marked Done in `buildout-status.md`.
