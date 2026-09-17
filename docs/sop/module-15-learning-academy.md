# SOP — Module 15: Learning Academy (real API integration)

## What shipped

The Learning Academy (`/academy` + Courses / Paths / Articles / Certificates)
now reads the live `/learning` API and supports **enroll** and **lesson
completion** (which issues a **certificate**). Branch
`feat/api-learning-academy` → PR into `develop`.

## Why

The academy was entirely mock (`useAcademyApi` returned canned courses/lessons/
articles/certificates; the Paths page had a hardcoded array). The `/learning`
API and content exist and are exercised by e2e — but there is **no
fe-integration-guide** for it, so this was built from the endpoints + the
committed `e2e/_captures/learning/*.json` bodies.

## How — key decisions

- **`useAcademyApi` rewritten to fetch real data** (same exported shapes so the
  pages keep working): `GET /learning/courses`, `/articles`, `/paths`,
  `/certificates` in parallel, then each course's `GET /learning/courses/{id}`
  to **flatten lessons** (small catalog — 6 courses × ~2–3 lessons).
- **API → FE mapping**: `level` lowercased→titlecased; `duration_min`→minutes;
  `stage_tags[0]`→`stageTag`; `progress`→`progressPct`; lessons carry the parent
  `courseId`; certificates **join `course_id`→title** (the cert row has no
  title); article `readTime`/`excerpt` derived from `body`.
- **Writes**: `enroll(courseId)` → `POST /learning/enrollments {course_id}`;
  `markLessonComplete(lessonId)` → `PATCH /learning/lessons/{id}/progress
  {completed:true}`. Completing the last lesson **issues a certificate**, so the
  hook refetches to pick up progress + the new cert.
- **Paths page** de-hardcoded (was a local array) → the hook's real paths, with
  loading/empty states and duration formatting.

## What's involved

- `hooks/useAcademyApi.ts` — full rewrite (real fetch + mappers + enroll +
  lesson progress).
- `app/(dashboard)/academy/paths/page.tsx` — real paths.
- (Main / Courses / Articles / Certificates pages already consumed the hook; they
  now render real data unchanged.)

## Verification (live, staging)

- `GET /learning/courses` → **200**, **6** real courses; the main page renders
  the hero + stage shelves and the Courses page renders the cards + the **lesson
  player** (transcript, mark-complete) from real course details.
- **Paths** (2) and **Articles** (2) render real content (the hardcoded
  "From Idea to MVP" path is gone).
- **Full write flow verified live** — enrolled in "Shape the problem", completed
  all **3 lessons** via `PATCH …/progress`; the last completion **issued a
  certificate** (`credential_code hifVGbG…`), and the **Certificates page rendered
  it** with the joined course title and issue date.
- Gates: `typecheck` 0 · `lint` 0 errors · **188** unit · clean `build` ✓.

## Follow-ups

- **Recommendations** endpoint (`GET /learning/recommendations` → `stage`,
  `recommended`, `continue_watching`) — the hook can adopt it for the main
  page's "recommended for you" shelf.
- Wire the Courses-page **player's mark-complete** button + a **course-start
  enroll** call through the hook's `markLessonComplete`/`enroll` (the hook
  exposes both; the player currently marks complete, enroll-on-start is a small
  add).
- Content is backend **placeholder** today ("[Placeholder] …") — no FE change
  needed when real content lands.
- No integration guide exists for `/learning`; consider asking backend to add one.
