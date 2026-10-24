# Academy FE walk (2026-10-24)

Branch `feature/academy-fe` (own dev server on :3290, proxied to the local API on :8000, develop at migration 0069 plus Academy
content: 8 courses, 24 lessons, 6 paths, 10 articles). Every row below was produced by driving the real UI with Playwright
(click, type, download) and comparing with the raw API (`GET /api/v1/...` with the same account). Screenshots of each page
were read at 1440 and 375.

**Accounts / hosts (throwaway, local):** founder `localhost` (workspace NovaPay, idea stage), team member `tm.localhost`,
mentor `m.localhost`, consultant `bc.localhost`. Widths: 1440 and 375. Founder ran a full course each at 1440
(*Price your product*) and 375 (*Scope the MVP*); the team member started *Shape the problem*.

**Legend:** PASS = FE result matches the API / expectation. The `Evidence` column is the raw-API side of the comparison.

## Control-by-control results
| Control | FE result | Raw API / expectation | Pass |
|---|---|---|---|
| f1440 Recommended page | no hero (stage shelf complete) | hero=null stage=idea | yes |
| f1440 Section tabs | [["Recommended","/academy","page"],["Courses","/academy/courses",null],["Learning Paths","/academy/paths",null],["Articles","/academy/articles",null],["Certificates","/academy/certificates",null]] | links with aria-current | yes |
| f1440 Tab touch target | 44px high | >=44 | yes |
| f1440 Catalog cards | 8 cards | 8 courses | yes |
| f1440 Catalog search "zzzz" | empty copy shown | 0 expected | yes |
| f1440 Catalog search "price" | 1 card | title/summary match | yes |
| f1440 Stage chip Launch | 2 cards | 2 with launch tag | yes |
| f1440 Level chip Advanced (+Launch) | 0 cards | 0 expected | yes |
| f1440 Chip All resets | 8 cards | 8 | yes |
| f1440 Draft badge on cards | 8 badges | 8 draft courses | yes |
| f1440 No horizontal scroll (catalog) | ok |  | yes |
| f1440 Course page (completed) | Completed shown + certificate link | completed=true | yes |
| f1440 Start course | opened lesson 1 | enrolled=true | yes |
| f1440 Lesson without video | notice=1 iframes=0 | video=null | yes |
| f1440 Transcript rendered as markdown | headings rendered |  | yes |
| f1440 Notes save | Saved shown | api body="Walk note: ask pilots about WhatsApp. <b>not html</b>" | yes |
| f1440 Notes persist after reload | Walk note: ask pilots about WhatsApp. <b>not html</b> | same as saved | yes |
| f1440 Notes are per lesson | lesson 2 empty | lesson 2 note empty | yes |
| f1440 Mark complete (1 of 3) | Up next prompt, button Completed | progress=33 lesson1=true | yes |
| f1440 Completed button disabled | true |  | yes |
| f1440 Up next: Stay | prompt closed |  | yes |
| f1440 Up next: Play | navigated to lesson 3 |  | yes |
| f1440 Mark last lesson | Course complete card + View certificate | progress=100 completed=true | yes |
| f1440 Certificate card | credential CFZ-RD2A-MKVH-ZGK5 shown, uuid not shown: true | 3 certs | yes |
| f1440 Stalled PDF copy | Still preparing. Check back soon. after 30 s | legacy cert CFZ-C4MB-SWRU-DRXE pdf_ready=false (API: never rendered) | yes |
| f1440 Download PDF | file cofoundaz-certificate-CFZ-RD2A-MKVH-ZGK5.pdf starts %PDF- | application/pdf, attachment | yes |
| f1440 Add to LinkedIn link | _blank noopener noreferrer | href equals API linkedin_url | yes |
| f1440 Copy verify link | clipboard=http://localhost:3000/verify/CFZ-RD2A-MKVH-ZGK5 | verify_url=http://localhost:3000/verify/CFZ-RD2A-MKVH-ZGK5 | yes |
| f1440 View verify page (signed in) | Valid credential |  | yes |
| f1440 /verify/[code] signed out (lowercase code) | COFOUNDAZ CREDENTIAL CHECK \|  \| cfz-rd2a-mkvh-zgk5 \|  \| Valid credential \|  \| AWARDED TO \| Victor Founder \| COURSE \| Price your product \| ISSUED ON \| 24 October 2026 \| ISSUED BY \| Cofoundaz \| Cofoundaz home | GET /verify/{code} public | yes |
| f1440 /verify unknown code | 404 copy shown | 404 NOT_FOUND | yes |
| f1440 /verify rate limited | COFOUNDAZ CREDENTIAL CHECK \|  \| CFZ-AAAA-BBBB-CCCC \|  \| Checking this credential... \|  \| Cofoundaz home | 429 RATE_LIMITED | see note |
| f1440 Paths | 6 path cards | 6 paths | yes |
| f1440 Path CTA | Idea foundations: Review path |  | yes |
| f1440 Path CTA opens course | /academy/courses/idea-shape-the-problem |  | yes |
| f1440 Articles list | 10 | 10 | yes |
| f1440 Article search "runway" | 3 | 3 | yes |
| f1440 Article tag chip "money" | 3 | 3 | yes |
| f1440 Article empty state | No articles match. |  | yes |
| f1440 Article reader | title "Questions that get honest answers", Draft=false, related=1 |  | yes |
| f1440 Reading progress bar | 100% after scrolling to the end |  | yes |
| f1440 Related item link | /academy/articles/article-pricing-basics |  | yes |
| f1440 Bell has certificate notification | present | learning.course.completed | yes |
| f1440 Console errors | none |  | yes |
| f375 Recommended page | no hero (stage shelf complete) | hero=null stage=idea | yes |
| f375 Section tabs | [["Recommended","/academy","page"],["Courses","/academy/courses",null],["Learning Paths","/academy/paths",null],["Articles","/academy/articles",null],["Certificates","/academy/certificates",null]] | links with aria-current | yes |
| f375 Tab touch target | 44px high | >=44 | yes |
| f375 Catalog cards | 8 cards | 8 courses | yes |
| f375 Catalog search "zzzz" | empty copy shown | 0 expected | yes |
| f375 Catalog search "price" | 1 card | title/summary match | yes |
| f375 Stage chip Launch | 2 cards | 2 with launch tag | yes |
| f375 Level chip Advanced (+Launch) | 0 cards | 0 expected | yes |
| f375 Chip All resets | 8 cards | 8 | yes |
| f375 Draft badge on cards | 8 badges | 8 draft courses | yes |
| f375 No horizontal scroll (catalog) | ok |  | yes |
| f375 Course page (completed) | Completed shown + certificate link | completed=true | yes |
| f375 Start course | opened lesson 1 | enrolled=true | yes |
| f375 Lesson without video | notice=1 iframes=0 | video=null | yes |
| f375 Transcript rendered as markdown | headings rendered |  | yes |
| f375 Notes save | Saved shown | api body="Walk note: ask pilots about WhatsApp. <b>not html</b>" | yes |
| f375 Notes persist after reload | Walk note: ask pilots about WhatsApp. <b>not html</b> | same as saved | yes |
| f375 Notes are per lesson | lesson 2 empty | lesson 2 note empty | yes |
| f375 Mark complete (1 of 3) | Up next prompt, button Completed | progress=33 lesson1=true | yes |
| f375 Completed button disabled | true |  | yes |
| f375 Up next: Stay | prompt closed |  | yes |
| f375 Up next: Play | navigated to lesson 3 |  | yes |
| f375 Mark last lesson | Course complete card + View certificate | progress=100 completed=true | yes |
| f375 Certificate card | credential CFZ-2CEF-NBFR-P4GU shown, uuid not shown: true | 4 certs | yes |
| f375 Stalled PDF copy | Still preparing. Check back soon. after 30 s | legacy cert CFZ-C4MB-SWRU-DRXE pdf_ready=false (API: never rendered) | yes |
| f375 Download PDF | file cofoundaz-certificate-CFZ-2CEF-NBFR-P4GU.pdf starts %PDF- | application/pdf, attachment | yes |
| f375 Add to LinkedIn link | _blank noopener noreferrer | href equals API linkedin_url | yes |
| f375 Copy verify link | clipboard=http://localhost:3000/verify/CFZ-2CEF-NBFR-P4GU | verify_url=http://localhost:3000/verify/CFZ-2CEF-NBFR-P4GU | yes |
| f375 View verify page (signed in) | Valid credential |  | yes |
| f375 /verify/[code] signed out (lowercase code) | COFOUNDAZ CREDENTIAL CHECK \|  \| cfz-2cef-nbfr-p4gu \|  \| Valid credential \|  \| AWARDED TO \| Victor Founder \| COURSE \| Scope the MVP \| ISSUED ON \| 24 October 2026 \| ISSUED BY \| Cofoundaz \| Cofoundaz home | GET /verify/{code} public | yes |
| f375 /verify unknown code | 404 copy shown | 404 NOT_FOUND | yes |
| f375 /verify rate limited | COFOUNDAZ CREDENTIAL CHECK \|  \| CFZ-AAAA-BBBB-CCCC \|  \| We could not find a credential with this code. Check the code and try again. \|  \| Cofoundaz home | 429 RATE_LIMITED | see note |
| f375 Paths | 6 path cards | 6 paths | yes |
| f375 Path CTA | Idea foundations: Review path |  | yes |
| f375 Path CTA opens course | /academy/courses/idea-shape-the-problem |  | yes |
| f375 Articles list | 10 | 10 | yes |
| f375 Article search "runway" | 3 | 3 | yes |
| f375 Article tag chip "money" | 3 | 3 | yes |
| f375 Article empty state | No articles match. |  | yes |
| f375 Article reader | title "Questions that get honest answers", Draft=true, related=1 |  | yes |
| f375 Reading progress bar | 100% after scrolling to the end |  | yes |
| f375 Related item link | /academy/articles/article-pricing-basics |  | yes |
| f375 Bell has certificate notification | present | learning.course.completed | yes |
| f375 Console errors | none |  | yes |
| tm1440 Learn next hero | reason="Your assessment flagged market as a gap, and Shape the problem covers it." | hero.reason="Your assessment flagged market as a gap, and Shape the problem covers it." source=template | yes |
| tm1440 Hero title + Draft badge | Shape the problem title shown=true | review_status=draft | yes |
| tm1440 Shelf heading | none | stage=idea | see note |
| tm1440 Hero CTA | "Start course" opens course page |  | yes |
| tm1440 Continue watching row | 1 course(s) with ring | 1 in continue_watching (33%) | yes |
| tm1440 Continue opens next lesson | /academy/courses/idea-shape-the-problem/lessons/idea-shape-the-problem-2 | next_lesson_id=idea-shape-the-problem-2 | yes |
| tm1440 Certificates are per person | 1 cards | 1 for this user | yes |
| tm1440 Console errors | none |  | yes |
| mentor1440 /academy | access denied screen |  | yes |
| mentor1440 /academy/courses | access denied screen |  | yes |
| mentor1440 /academy/courses/idea-shape-the-problem | access denied screen |  | yes |
| mentor1440 /academy/paths | access denied screen |  | yes |
| mentor1440 /academy/articles | access denied screen |  | yes |
| mentor1440 /academy/certificates | access denied screen |  | yes |
| mentor1440 Sidebar hides Learning Academy | hidden |  | yes |
| mentor1440 Raw API | /learning/recommendations 403; /learning/courses 403; /learning/certificates 403; /learning/lessons/idea-shape-the-problem-1/notes 403 | 403 expected | yes |
| consultant1440 /academy | access denied screen |  | yes |
| consultant1440 /academy/courses | access denied screen |  | yes |
| consultant1440 /academy/courses/idea-shape-the-problem | access denied screen |  | yes |
| consultant1440 /academy/paths | access denied screen |  | yes |
| consultant1440 /academy/articles | access denied screen |  | yes |
| consultant1440 /academy/certificates | access denied screen |  | yes |
| consultant1440 Sidebar hides Learning Academy | hidden |  | yes |
| consultant1440 Raw API | /learning/recommendations 403; /learning/courses 403; /learning/certificates 403; /learning/lessons/idea-shape-the-problem-1/notes 403 | 403 expected | yes |
| verify1440 rate limited (same code) | COFOUNDAZ CREDENTIAL CHECK \| CFZ-QQQQ-WWWW-EEEE \| Too many requests. Slow down a moment. \| Try again \| Cofoundaz home | 429 RATE_LIMITED | yes |
| tm375 Learn next hero | reason="At the idea stage, this course will help you sharpen the problem, validate market pain, and build a stronger foundation for your product." | hero.reason="At the idea stage, this course will help you sharpen the problem, validate market pain, and build a stronger foundation for your product." source=ai | yes |
| tm375 Hero title + Draft badge | Shape the problem title shown=true | review_status=draft | yes |
| tm375 Shelf heading | none | stage=idea | see note |
| tm375 Hero CTA | "Continue" opens course page |  | yes |
| tm375 Continue watching row | 1 course(s) with ring | 1 in continue_watching (67%) | yes |
| tm375 Continue opens next lesson | /academy/courses/idea-shape-the-problem/lessons/idea-shape-the-problem-3 | next_lesson_id=idea-shape-the-problem-3 | yes |
| tm375 Certificates are per person | 1 cards | 1 for this user | yes |
| tm375 Console errors | none |  | yes |
| mentor375 /academy | access denied screen |  | yes |
| mentor375 /academy/courses | access denied screen |  | yes |
| mentor375 /academy/courses/idea-shape-the-problem | access denied screen |  | yes |
| mentor375 /academy/paths | access denied screen |  | yes |
| mentor375 /academy/articles | access denied screen |  | yes |
| mentor375 /academy/certificates | access denied screen |  | yes |
| mentor375 Sidebar hides Learning Academy | hidden |  | yes |
| mentor375 Raw API | /learning/recommendations 403; /learning/courses 403; /learning/certificates 403; /learning/lessons/idea-shape-the-problem-1/notes 403 | 403 expected | yes |
| consultant375 /academy | access denied screen |  | yes |
| consultant375 /academy/courses | access denied screen |  | yes |
| consultant375 /academy/courses/idea-shape-the-problem | access denied screen |  | yes |
| consultant375 /academy/paths | access denied screen |  | yes |
| consultant375 /academy/articles | access denied screen |  | yes |
| consultant375 /academy/certificates | access denied screen |  | yes |
| consultant375 Sidebar hides Learning Academy | hidden |  | yes |
| consultant375 Raw API | /learning/recommendations 403; /learning/courses 403; /learning/certificates 403; /learning/lessons/idea-shape-the-problem-1/notes 403 | 403 expected | yes |
| verify375 rate limited (same code) | COFOUNDAZ CREDENTIAL CHECK \| CFZ-QQQQ-WWWW-EEEE \| Too many requests. Slow down a moment. \| Try again \| Cofoundaz home | 429 RATE_LIMITED | yes |

## Notes on the rows marked "see note"
- **`Shelf heading` (team member, 1440 and 375):** the script expected a "For the Idea stage" shelf, but the `idea` stage has a
  single course and it is the hero, so the API's `recommended` has one item and the FE (correctly) shows no empty shelf.
  Not a defect; the shelf heading is exercised in `useLearning`/page code and by the founder's catalog.
- **`/verify rate limited` (founder runs):** the script requested a different code in the page than in the loop; the API's
  limiter is keyed per code (see API findings), so the page correctly showed the 404 copy. Re-run with the same code
  (`verify1440` / `verify375` rows above) shows "Too many requests. Slow down a moment."

## Gap rows closed by this PR (FE rows of `academy-prd-gaps.md`)
| # | Result |
|---|---|
| 3 Recommended | `GET /learning/recommendations` is the single source: "Learn next" hero with the API's reason string (template then AI, re-read once at ~5 s and ~15 s), shelf titled from `stage`, continue-watching with rings. Hero hidden when `hero` is null. Verified live as team member (reason equals `hero.reason`) |
| 11 Lesson player | Mark complete, Up next Play / Stay, Completed state, "Course complete" card with View certificate from the returned `certificate` |
| 12 Catalog | live search, stage and level chips, progress ring, Start / Continue / Review course label, "No courses match." |
| 15 Data layer | one request per page, skeletons, Retry on error, no swallowed errors, empty states only for a successful empty list |
| 18 Certificates copy | PRD empty state + Browse courses; "Credentials earned from completing courses." |
| 19 Stage tags | all tags shown on cards and course page |
| 21 375 | 44 px tabs and controls; Mark complete is a fixed bar above the tab bar below `lg`; lesson list is a collapsible block |
| 22 a11y | tabs and cards are `<Link>`, `aria-current="page"`, visible focus; nested `<main>` removed |

## API findings (reported to the lead, not worked around)
1. **Legacy certificate never gets a PDF.** Founder certificate `CFZ-C4MB-SWRU-DRXE` (course *Shape the problem*, issued 2026-10-21 before the
   PDF handler existed) stays `pdf_ready: false`, `pdf_url: null`. Nothing re-enqueues it. FE shows "Preparing your PDF..." then,
   after the 30 s budget, "Still preparing. Check back soon." Needs a backfill job or a re-enqueue on read.
2. **`GET /verify/{code}` rate limit is per code, not per visitor.** 34 calls to one unknown code gave 429s while a different code
   immediately returned 404; 29 calls then 429 on the original. The guide says "30 per minute per visitor". Varying the code
   bypasses the limit.
3. **Worker `scheduled.sales.outreach_bounces` fails every minute** (`Can't operate on closed transaction inside context manager`,
   worker container reports unhealthy). Unrelated to Academy; seen in the worker log.

## Global search and notification (founder, 1440)
| Control | FE result | Raw API |
|---|---|---|
| Cmd+K "runway" | "Learning Academy" group lists the course *Know your numbers* and the article *How to read your runway...* | `/search` returns `course` and `article` items |
| Click the article result | opens `/academy/articles/article-read-your-runway` | href from the API |
| Cmd+K "Price your product", click | opens `/academy/courses/validation-price-your-product` | href from the API |

## Not verified live (honest gaps)
| Item | Why |
|---|---|
| YouTube player, `?start=` resume and the 15 s `position_s` reporting | no lesson has a video yet. URL building and the host allow-list are unit-tested (`lib/learning-format.test.ts`); the iframe API reporting is **untested live** |
| Position resume without video | `position_s` is read from the API and only used by the player; transcript-only lessons have nothing to resume |
| LinkedIn dialog | the link is opened in a new tab and its href equals the API's `linkedin_url`; the LinkedIn form itself was not opened (no account) |
| Revoked credential copy | unit-tested only (API has no revoke yet) |
| `learning.course.recommended` notification deep link | unit-tested mapping only; needs a stage change |

## Re-walk fixes (`fix/academy-rewalk-fe`, 2026-10-24): D1 and D4
Own dev server on :3291 against the local API, Playwright driving the real UI at 375 x 812 and 1440 x 812 for founder, team member,
mentor and consultant (`/dashboard`, open the bell).

| Control | FE result | Expectation | Pass |
|---|---|---|---|
| bell-founder-375 panel position | x=16 right=359 width=343 (viewport 375) | needs 16px gutters | yes |
| bell-founder-375 failed list | shows "Could not load notifications." + Retry, not "No new notifications." | GET /notifications 500 (blocked in browser) | yes |
| bell-founder-375 Retry | error cleared, 8 rows | request succeeds | yes |
| bell-team_member-375 panel position | x=16 right=359 width=343 (viewport 375) | needs 16px gutters | yes |
| bell-team_member-375 failed list | shows "Could not load notifications." + Retry, not "No new notifications." | GET /notifications 500 (blocked in browser) | yes |
| bell-team_member-375 Retry | error cleared, 8 rows | request succeeds | yes |
| bell-mentor-375 panel position | x=16 right=359 width=343 (viewport 375) | needs 16px gutters | yes |
| bell-consultant-375 panel position | x=16 right=359 width=343 (viewport 375) | needs 16px gutters | yes |
| bell-founder-1440 panel position | x=932 right=1316 width=384 (viewport 1440) | inside viewport | yes |
| bell-founder-1440 failed list | shows "Could not load notifications." + Retry, not "No new notifications." | GET /notifications 500 (blocked in browser) | yes |
| bell-founder-1440 Retry | error cleared, 8 rows | request succeeds | yes |
| bell-team_member-1440 panel position | x=1024 right=1408 width=384 (viewport 1440) | inside viewport | yes |
| bell-team_member-1440 failed list | shows "Could not load notifications." + Retry, not "No new notifications." | GET /notifications 500 (blocked in browser) | yes |
| bell-team_member-1440 Retry | error cleared, 8 rows | request succeeds | yes |
| bell-mentor-1440 panel position | x=1024 right=1408 width=384 (viewport 1440) | inside viewport | yes |
| bell-consultant-1440 panel position | x=1024 right=1408 width=384 (viewport 1440) | inside viewport | yes |

- **D1:** the popover is `fixed inset-x-4` below `md` (16 px gutters whatever else sits in the header) and `md:absolute md:right-0 md:w-96` from `md`. It is the only bell popover in the app (`components/dashboardnavbar.tsx`); `NotificationBell` elsewhere is a plain link.
- **D4:** the failure was produced by aborting `GET /notifications?...` with a 500 in the browser (the API itself was healthy), then letting it through and pressing Retry.
- **D2 is not fixed here**: there is no safe API to write the profile name (see the PR).
