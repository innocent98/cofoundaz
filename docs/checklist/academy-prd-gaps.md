# Learning Academy: PRD + UI gap list (live walkthrough, 2026-10-21)

Source of truth: `Cofoundaz_Technical_PRD.md` Module 17 (§17.1 to §17.5, API, entities, events, notifications, access
"F, TM"; the RBAC matrix gives marketplace / academy = F ✓, TM ✓, others —) + §2.1 (shared top bar) + §1.1 principle 5
(never hue alone).

**How it was walked:** live on `develop` (FE `bf6de8c` in its own dev server on :3151, proxied to the shared API on
:8000), workspace NovaPay (stage `idea`), every sub-page and every control:
- **Founder** at 1440 and 375, on `localhost`.
- **Team member** at 1440 (pages plus a full course completion through the UI), on `tm.localhost`.
- **Mentor and consultant** FE pages and API reads and writes, on `m.localhost` and `bc.localhost`.

Every FE result was compared with the raw API (`GET /learning/*`, with the AI reason and role checks). The Academy has no
paid external dependency, so nothing was blocked. The dev server was stopped afterwards.

**Test data left in the workspace** (enrolments cannot carry a "Walk test" label, so they are listed here):
- founder: *Shape the problem* completed (100%), one certificate issued;
- team member: *Scope the MVP* completed, one certificate issued; *Talk to customers* enrolled at 0%;
- the "Walk test note" typed into the notes tab is browser state only and was never saved.

Legend: ✅ meets PRD · ❌ gap · Severity: **Sec** (permission/data exposure) > **High** (PRD behaviour broken or a
headline feature missing) > **Med** (PRD feature partial) > **Low** (copy, polish, a11y)

## Is the content real?
**No. Every course, lesson, path and article is placeholder.**
- The catalog is read-only and lives in code (`cofoundaz-api/app/services/learning/catalog.py`). Its header says "ALL
  CONTENT IN THIS FILE IS PLACEHOLDER" and that replacing it is "a required pre-go-live task (spec D8)".
- 6 courses (2 or 3 lessons each, 20 to 34 minutes), 2 paths (Validation foundations, From launch to growth), 2 articles.
- Every title starts with `[Placeholder]`. Every transcript is the string "Placeholder transcript." and every article
  body is "Placeholder article body." (3 words).
- Every `video_ref` is `placeholder://{course}/{n}`. There is no video file, URL or host behind it.
- Paths exist only for `validation` and `launch`. Idea, build, growth and scale have none.
- The CMS that should hold this content (Module 25.4) is not built. See product call D-ACA-1.

| PRD item | Works for real? | Evidence |
|---|---|---|
| Video | ❌ No. The player is a black box with a decorative play icon (no `<video>`, no iframe). | `courses/page.tsx` player block; `video_ref` is `placeholder://…` |
| Transcript | ⚠️ Renders, but the content is "Placeholder transcript." | live, lesson 1 |
| Certificate PDF | ❌ No. **Download** shows a toast "Downloading certificate {uuid}..." and makes no request. | live; no network call; no PDF route in the API (404) |
| Share to LinkedIn | ❌ No. **Share** shows a toast "Opening LinkedIn share dialogue…" and calls nothing (`window.open` was never reached). | live |
| Certificate record | ✅ Yes. Completing the last lesson issues one row with a credential code. | live: `GET /learning/certificates` |
| Progress, enrolment, completion | ✅ Yes, per user. | live (founder and team member kept separate progress) |
| AI reason line | ✅ Yes in the API (real model text), ❌ never shown by the FE. | live: `recommendation_reason` |

## Works (verified live)
- ✅ **Role gating is clean.** `require_role(founder, team_member)` on all 8 routes:
  - Mentor and consultant get `403 FORBIDDEN` "You don't have permission to do that." on every read and on both writes
    (`POST /learning/enrollments`, `PATCH /learning/lessons/{id}/progress`). No token gives `401`.
  - The FE shows "You don't have access to this page. Your role in this workspace doesn't include this section." on
    `/academy` and every sub-route, and the sidebar hides Learning Academy.
  - Founder and team member both see Learning Academy in the sidebar and can use everything.
- ✅ **Progress is per user, shared nothing.** The founder finishing a course left the team member at 0%, and each got
  their own certificate. A second workspace member never sees another member's certificate.
- ✅ **Enrolment is idempotent.** First `POST /learning/enrollments` returns `201`, the repeat `200` with the same body.
  Unknown course gives `404 NOT_FOUND`, a missing field gives `422 VALIDATION_ERROR` with `field_errors`.
- ✅ **Completion maths.** One lesson of three gave `progress` 33; the last lesson gave 100 and `completed_at`, and the PATCH
  response carried the new certificate once and `certificate: null` on a repeat (idempotent, nothing issued twice).
  Completing lessons out of order is accepted. `completed: false` is rejected with `422` (v1 can only complete).
- ✅ **Paths maths.** The Validation path showed 33% (mean of 100, 0 and 0), the same as the API.
- ✅ **Recommendations API.** `GET /learning/recommendations` returned the stage shelf, `continue_watching` and a reason
  line that upgraded from the template ("Recommended for your idea stage.") to real model text after the worker ran.
- ✅ **Shell:** `ShellTopBar` is used (breadcrumb, ⌘K, health pill, bell).
- ✅ **375:** no page-level horizontal scroll on any of the five sub-pages (the tab bar scrolls inside itself).

## Gaps
| # | Area | Gap (observed) | PRD | Layer | Sev | Proposed fix |
|---|---|---|---|---|---|---|
| 1 | Certificates (future) | The PDF, a public verify page and the LinkedIn share do not exist yet, so nothing leaks today. When they are built, a PDF route keyed by certificate id alone would expose any member's certificate (name, course, date) to any logged-in user who guesses an id. `Certificate` rows carry `startup_id` and `user_id` but the list route is the only reader. | `GET /learning/certificates` (PDF gen job) | BE | **Sec** (preventive) | Serve the PDF at `GET /learning/certificates/{id}/pdf` through the same `startup_id` + `user_id` filter as the list (404 for anyone else). Keep any public verify page limited to course, date and holder name, keyed by the unguessable credential code, never the row id. Test as the other member and as a mentor. |
| 2 | Notes (future) | Notes need storage and the PRD says **private**. A table keyed by lesson and startup would let a team member read the founder's notes. | lesson player: **notes tab (private)** | BE | **Sec** (preventive) | Key notes by `(user_id, lesson_id)` and filter every read and write by the caller's `user_id`, with a test that the other member and a mentor get `404`/`403`. Never include notes in AI prompts or search. |
| 3 | Recommended | The page never calls `GET /learning/recommendations`. It builds everything from `/courses`:<br>• Hero is `courses[0]`, so a founder who already **completed** it still sees "Start course" on it.<br>• The reason line is a **hardcoded string**: "Because your assessment flagged pricing as a gap and you're entering Validation." It is shown to every user, on every stage. The real AI reason the API returns is never rendered.<br>• The shelf is hardcoded **"For the Validation stage"** and filters on the label "Validation", while NovaPay is at `idea`. A founder at any other stage sees an empty shelf under that heading (a header with nothing under it while loading, too).<br>• "Continue watching" is a client filter on 0 < progress < 100. | §17.1 hero **"Learn next"** with the AI reason and **"Start course"**, shelf **"For the {stage} stage"**, continue-watching row | FE | High | Use `GET /learning/recommendations` as the single source: first `recommended` item as the hero, `recommendation_reason` as the line (render whatever string is there; poll once or twice for the AI upgrade, see the API guide §2), `recommended` as the shelf titled from `stage`, `continue_watching` for the row with progress bars. Label the hero "Learn next". Hide a section when it is empty. Drop the invented sentence. |
| 4 | Course page | No course page. A catalog card goes straight into the lesson player (first lesson, not the first unfinished one). There is no overview, no curriculum accordion and no **Start course / Continue** button; **Start course** on the hero only lands on the catalog. Nothing calls `POST /learning/enrollments` (enrolment only happens as a side effect of the first **Mark complete**). The URL stays `/academy/courses` for the player, so a reload or a shared link loses the course and lesson. The API has no course description or outcomes to show. | §17.2 course page: overview, curriculum accordion, **"Start course" / "Continue"** | both | High | BE: add `description` and `outcomes[]` (and instructor, if wanted) to the course detail. FE: `/academy/courses/[id]` (overview + curriculum with per-lesson done ticks + Start or Continue, which POSTs the enrolment and opens the first unfinished lesson) and `/academy/courses/[id]/lessons/[lessonId]` for the player. Card and hero links go to the course page. |
| 5 | Lesson player | **No video.** The player is a black box with a play icon that does nothing, and the lesson title overlaid at the bottom. `video_ref` is a `placeholder://` string and there is no player component or hosting decision. | §17.2 lesson player: **video** | both | High | Decide D-ACA-2. BE: resolve `video_ref` to a playable URL (signed, expiring if private). FE: a real player (HLS or provider embed) with resume position (row 16). Until real video exists, show an honest "Video coming soon" state rather than a play button that does nothing. |
| 6 | Content | All content is placeholder (see "Is the content real?"). Every title shows `[Placeholder]` to users, transcripts and articles are one line, and 4 of 6 stages have no path. The catalog is read-only code, so changing a word needs a deploy. | §17.2 to §17.4 | BE | High | Decide D-ACA-1 (source of real content). Until then keep the `[Placeholder]` prefix so it is never mistaken for real. Build the CMS (Module 25.4) or a seed-from-markdown loader behind the same read endpoints so the FE never changes. |
| 7 | Certificates | **Download PDF** and **Share to LinkedIn** are fake. They only raise a toast with the **raw certificate UUID** in it. There is no PDF route. On completion the API enqueues `learning.certificate.generate`, but **no handler is registered** for it, so the worker marks that job as a terminal failure ("no handler") on every completion (`app/worker/runner.py:106`; read from code, not observed in the jobs table). The PRD's "PDF gen job" is therefore not built. The buttons are labelled **Download** and **Share**. | §17.5 **"Download PDF"**, **"Share to LinkedIn"**; "PDF gen job on course completion" | both | High | BE: register the handler, render the PDF (holder name, course, date, credential ID, QR to the verify URL), store it, `GET …/pdf`. FE: **Download PDF** downloads it (disabled with "Generating…" until it exists), **Share to LinkedIn** opens LinkedIn's add-certification URL filled with the name, issue date, credential ID and the verify URL (row 17). Never put the UUID in copy. |
| 8 | Articles | Cards are not links: clicking a card or **Read article** does nothing. There is no reader view, no progress bar, no "related items", no search box and no way to filter by tag (tags are plain labels). "N min read" is computed from a 3-word body. | §17.4 article index (**search, tags**), reader view (**progress bar, est. read time, related items**) | both | High | FE: `/academy/articles/[id]` reader (rendered markdown body, scroll progress bar, read time from the real body), a search box and tag chips on the index. BE: `GET /learning/articles/{id}`, optional `?q=&tag=`, and a `related` list (same tags, plus courses) on the detail. Body format to be decided with the content source (D-ACA-1). |
| 9 | Recommendation logic | The API's shelf is "courses tagged with your stage, beginner first", not an AI pick. The AI writes one **shelf-level** reason line, once per workspace, and never regenerates it (the line stays stale after the founder moves stage or finishes the course). It is shared by every member. Its prompt gets only the stage and course titles, so it can never say "because your assessment flagged pricing as a gap". A founder at `idea` got a one-course shelf. | §17.1 "AI-picked course w/ reason line (*Because your assessment flagged pricing as a gap and you're entering Validation.*)" | BE | Med | Decide D-ACA-3. Default: regenerate the reason when the stage changes or the hero course changes; pass Assessment gaps and the Validation state into the prompt; make the pick use stage plus gaps (tag courses with `gap_tags`), and give each reason per hero course. Keep the template as the fallback. |
| 10 | Notifications | Neither PRD notification exists. `learning.course.completed` is published but nothing consumes it, and no job recommends a course. After the founder and team member completed courses, their notification lists held only `healthscore.dropped` and `finance.runway.low`. | **"Certificate earned: {course} 🎓"** CTA **"Download it"**; **"New course recommended for your stage: {course}"** | both | Med | BE: subscribe to the completed event and notify the learner with the certificate id in the payload; notify when the shelf's top course changes (stage change). FE: deep link to `/academy/certificates` and a Learning category and icon in the inbox (as Marketing did). |
| 11 | Lesson player | **Mark complete & Continue** only marks the open lesson and stays on it (no advance, so "Continue" is not true). No next-lesson autoplay prompt. The toast says "Lesson marked complete." even when the lesson was already complete. Finishing the **last** lesson shows nothing special: the PATCH returns the new `certificate`, but the FE ignores it, so there is no "You earned a certificate" moment and no link. Any lesson can be completed out of order. | §17.2 **"Mark complete"**, **next-lesson autoplay prompt** | FE | Med | After a successful mark: move to the next lesson with a "Up next: {title} · Play / Stay" prompt (auto after 5 s when real video exists); on the last lesson show a "Course complete" card with **View certificate** from the returned `certificate`. Disable the button on completed lessons ("Completed ✓"). Decide D-ACA-4 on ordering. |
| 12 | Course catalog | The **Search courses…** box is not wired: typing "zzzz" still shows all 6 cards. The progress indicator is a 1 px bar, not a ring. The card has no "Continue", "Completed" or percentage state. Only the first stage tag is shown. There are no filters for level or stage. | §17.2 catalog grid (thumb, title, duration, lesson count, level, **progress ring**) | FE | Med | Filter by title as you type (and by level and stage chips), a progress ring on the card (number inside, check when complete), a "Completed" or "Continue" label. Show the empty result copy "No courses match". |
| 13 | Learning paths | A path card shows title, stage, "N courses", duration and a percentage. It does **not** list its courses in order, shows no per-course completion, and uses the boilerplate "A structured track for the {stage} stage." The PRD tagline is missing. **Start Path / Continue Path** just opens the catalog. Paths are not grouped by stage. There are paths for 2 of 6 stages. | §17.3 path cards per stage (**ordered course list, total time, completion %**); copy **"The curriculum for where you are — not where the internet thinks you are."** | both | Med | BE: embed the ordered `courses` (id, title, duration, progress, completed) in the path response. FE: the ordered list with ticks, the tagline as the page subtitle, paths grouped by stage with the user's stage first, and the CTA opens the first unfinished course. Content for the other stages is D-ACA-1. |
| 14 | Notes | **Private Notes** is a single textarea held in React state. It is shared by every lesson (text typed on lesson 1 appeared on lesson 2), is not saved, and is gone on reload or "Back to catalog". There is no API. | §17.2 **notes tab (private)** | both | Med | BE: `lesson_notes(user_id, lesson_id, body, updated_at)` with `GET/PUT /learning/lessons/{id}/notes`, scoped per row 2. FE: load and debounce-save per lesson, show "Saved" state. |
| 15 | Data layer | The hook loads the whole Academy in **14 requests on every page** (4 lists + one detail call per course), and again for each page the user opens; the Recommended page makes them even though it needs one. Articles, paths and certificates calls swallow errors (`.catch` returns an empty list), so a failed certificates call shows "You haven't earned any certificates yet" which is false. The hook's `error` is never rendered anywhere, and there are no skeleton or loading states. | | FE | Med | One query per page (react-query or SWR cache shared across the section). Course detail only when a course is opened. Real error states with Retry, and empty states only for a successful empty list. |
| 16 | Progress API | `PATCH /lessons/{id}/progress` accepts only `{"completed": true}`. There is no watch position, so "continue watching" cannot resume a video and shows a course at its percentage only. `continue_watching` includes every enrolled course (also 0%), which the FE then filters on its own. | `PATCH /learning/lessons/{id}/progress`; continue-watching row (progress bars) | BE | Med | Accept an optional `position_s` (and keep `completed`), store it on `lesson_progress`, return `last_lesson_id` and `position_s` on the course summary so Continue opens at the right place. |
| 17 | Certificates | The record has no **holder name** (needed on the PDF), no **issuer** and no public verification page. The credential code is a 22-character random string (`Za9mHuv4…` style), long for a card and meaningless to a third party; LinkedIn needs a URL that proves the credential. | §17.5 card: course, date, **credential ID** | both | Med | BE: a short readable code (`CFZ-XXXX-XXXX`, unique) alongside the secret one if needed, and a public `GET /verify/{code}` page. FE: show the code, a "Copy verify link" action. Needed by row 7. |
| 18 | Certificates (copy) | Empty state reads "You haven't earned any certificates yet. Complete a course to get started." The page subtitle says "completing Cofoundaz learning paths", but certificates are per course. | **"Finish any course to earn your first certificate."** | FE | Low | PRD empty-state copy (with a **Browse courses** link) and "Credentials earned from completing courses." |
| 19 | Catalog | The stage chip shows only `stage_tags[0]`, so *Scope the MVP* (validation and build) reads "VALIDATION" and *Shape the problem* (idea and validation) reads "IDEA". | `stage_tags[]` | FE | Low | Show all tags (or the one for the user's stage first). |
| 20 | Search | The global ⌘K search finds the "Learning Academy" page but not a single course, lesson or article (query "placeholder" returned no results). | | BE | Low | Index courses and articles for founder and team member only (same roles as the module). Do not index notes. |
| 21 | 375 | The five tab buttons are 29 px tall (under 44 px). In the lesson player the curriculum list and **Mark complete** sit below the transcript box, so the main action is off screen on a phone. | §1.1 mobile | FE | Low | 44 px touch targets; on phones put the lesson list in a collapsible block and keep **Mark complete** in a sticky bottom bar. |
| 22 | Navigation a11y | The section tabs are `<button>` plus `router.push`, so they cannot be opened in a new tab, are not links to a screen reader, and carry no `aria-current`. Cards are clickable `<div>`s (no keyboard focus). | a11y | FE | Low | `<Link>` for tabs and cards, `aria-current="page"`, visible focus. |
| 23 | Docs | The API FE guide covers only `/learning/recommendations` (it says so). Courses, lessons, paths, articles, enrolment and certificates have no live-captured guide. | | BE | Low | Add a guide from live captures when rows 4, 7, 8 and 13 change the shapes. |
| 24 | Events | `learning.course.completed` fires with no listener. Mission, Health and Roadmap do not react to finished courses, and the Academy has no way to link a Roadmap task to a course. | `learning.course.completed` | BE | Low | Decide with the Mission owner whether completing a recommended course ticks a task or lifts a Health driver. Otherwise keep it as an audit event. |

**Counts:**
- **By layer:** BE 8 (rows 1, 2, 6, 9, 16, 20, 23, 24), FE 8 (3, 11, 12, 15, 18, 19, 21, 22), both 8 (4, 5, 7, 8, 10, 13, 14, 17). Total 24.
- **By severity:** Sec 2 (rows 1, 2; both preventive, nothing leaks today), High 6 (3, 4, 5, 6, 7, 8), Med 9 (9 to 17), Low 7 (18 to 24).

## FE status (2026-10-24, `feature/academy-fe`)
FE rows 3, 11, 12, 15, 18, 19, 21, 22 and the FE halves of 4, 5, 7, 8, 13, 14, 17 are closed; evidence in `academy-fe-walk.md`.

## Related, outside the Academy page
- Dashboard and Mission could surface "Learn next" from this module; no such link exists yet. Decide with row 24.
- Module 25.4 (CMS) is the long-term home of rows 5, 6 and 8's content.
- The AI reason uses the `ai.learning.recommendations` job. It spent real model budget in this walk; the daily budget counts it.

## Decisions needed (proposed defaults; none block BE work on the other rows)
| ID | Question | Proposed default | Who |
|---|---|---|---|
| D-ACA-1 | Where does real course, lesson, path and article content come from, and who writes it? | Write 6 to 10 short founder-stage courses plus 10 articles in markdown/MDX in a `content/` folder, loaded by a seed script into DB tables (the Module 25.4 CMS later). Keep the `[Placeholder]` prefix until a course is reviewed. | **needs Adebayo** (content, licensing) |
| D-ACA-2 | Where is video hosted? | A managed host with signed playback (Mux or Cloudflare Stream) or unlisted YouTube/Vimeo embeds for the first release. The API returns a playable URL; the FE has one player component. | **needs Adebayo** (cost, accounts) |
| D-ACA-3 | What does "AI-picked" mean, and how often does it refresh? | Pick by stage plus Assessment/Validation gaps, one reason per hero course, regenerated when stage or gaps change. | lead can decide |
| D-ACA-4 | Must lessons be taken in order, and what counts as complete? | Any order (as today). Complete means pressing **Mark complete** (or reaching the end of the video once video exists). | lead can decide |
| D-ACA-5 | Certificate design, issuer name, verification URL and LinkedIn organisation. | One template (Cofoundaz as issuer, holder name, course, date, credential ID, QR). LinkedIn add-certification URL with the verify link; no LinkedIn app needed. | **needs Adebayo** (brand, LinkedIn page) |
| D-ACA-6 | Should team members earn certificates and see the founder's progress? | Yes to certificates for any member; progress stays per person. A team-progress view is out of scope. | lead can decide |
| D-ACA-7 | Should mentors, consultants or investors ever see the Academy? | No, as the PRD says (F, TM only). | lead can decide |

## Build order (proposal)
1. **BE (lead), stacked PRs:**
   - **(a)** Certificate handler and PDF route with the row 1 scoping, readable code and holder name (7, 17); course
     `description`/`outcomes` and path course lists (4, 13); article detail, search, tags, related (8); resume
     position (16); notes with per-user scoping (2, 14).
   - **(b)** Notifications (10), recommendation logic and reasons (9), search indexing (20), FE guides from live
     captures (23).
   - **(c)** The content loader or CMS and the real content (6) once D-ACA-1 is answered. This gates go-live.
   - Each PR ships with tests, an e2e journey, a live-captured FE guide and an SOP.
2. **FE (one sub-session, after (a), or chained):**
   - Recommended from the API (3), course page and routes (4), real player and autoplay (5, 11), catalog search and
     rings (12), paths (13), notes (14), articles reader (8), certificates actions (7, 18), data layer (15);
   - polish: 19, 21, 22.
3. **Re-walk:** click every control on merged develop at 1440 and 375 as F, TM, mentor and consultant, with real
   content and a real video, a downloaded PDF and a LinkedIn link that opens.

## Verification table
| Claim | How verified |
|---|---|
| All FE behaviour above (hardcoded copy, dead controls, fake toasts, no reader, notes lost, no search, no advance) | live, in the browser, plus the page source |
| Role gating and the 403s | live, FE and raw API, four roles |
| Per-user progress, certificate, idempotency, error shapes | live, raw API |
| Real-model reason text | live (`recommendation_reason` upgraded) |
| No `learning.*` notifications | live (inbox types) |
| `learning.certificate.generate` has no handler (row 7) | **code only** (`runner.py:106`, no `register_handler` for it); the jobs table was not queried |
| Content is placeholder | live and `catalog.py` |
| Rows 1, 2 (security) | reasoned from the schema and the planned routes; nothing exploitable exists today |
