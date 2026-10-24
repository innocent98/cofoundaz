# SOP: Learning Academy FE wired to the real API

**What shipped.** Every Academy page now reads and writes the real `/api/v1/learning/*` API (PR from `feature/academy-fe`):
Learn next, catalogue, course page, lesson reader, paths, articles and reader, certificates, plus a public `/verify/[code]`
page. The mock hook `hooks/useAcademyApi.ts` is deleted.

**Why.** After API #173 the FE was still a mock UI: a fake player, a hard-coded reason, a toast instead of a PDF, notes in React
state (`academy-prd-gaps.md` FE rows 3, 11, 12, 15, 18, 19, 21, 22 and the FE halves of the "both" rows).

## How
| Decision | Detail | Rejected |
|---|---|---|
| Typed client | `lib/api/learning.ts`, shapes copied from `fe-integration-guide-academy.md` (live captures) | deriving types from the schema |
| Data hooks | `hooks/useLearning.ts`: one request per page, states loading / ready / error / forbidden / notfound, Retry; certificates poll every 3 s up to 30 s, never while the tab is hidden; Learn next re-reads at ~5 s and ~15 s while `reason_source` is `template` | react-query (not in the repo) |
| Markdown | own renderer `components/academy/markdown.tsx` builds React elements only: no HTML parsing, links limited to http(s), mailto, in-app paths, `rel="noopener noreferrer"` | adding a markdown dependency (needs sanitiser config; the content subset is small) |
| Video | `components/academy/video-player.tsx` embeds only `https://www.youtube-nocookie.com/embed/...` (`videoEmbedSrc` allow-list), resumes with `?start=`, reports position every 15 s via the iframe API. `video: null` shows a transcript-only notice, no player | building a player from any other field |
| Notes | `components/academy/note-editor.tsx`, per lesson, 800 ms debounce, plain text, 20000 char cap, "Saved" state | localStorage |
| Certificates | PDF via `fetch` + bearer token and a blob download; LinkedIn is an `<a target=_blank rel=noopener>` only if the host is `www.linkedin.com`; credential id shown, never the uuid; copy verify link | plain `<a href>` to the PDF |
| Public verify | `app/verify/[code]/page.tsx`, outside the dashboard layout, works signed out; 404, 429 and revoked copy | |
| Lessons any order (D-ACA-4) | Mark complete only completes; "Up next" Play / Stay prompt; last lesson shows "Course complete" with the returned certificate | forced order |

## What is involved
- Pages: `app/(dashboard)/academy/{page,layout}.tsx`, `courses/page.tsx`, `courses/[courseId]/page.tsx`,
  `courses/[courseId]/lessons/[lessonId]/page.tsx`, `paths/page.tsx`, `articles/page.tsx`, `articles/[articleId]/page.tsx`,
  `certificates/page.tsx`; public `app/verify/[code]/page.tsx`.
- Shared: `components/academy/{parts,markdown,note-editor,video-player}.tsx`, `lib/learning-format.ts`.
- Notifications: `hooks/useNotifications.ts` deep links `learning.course.completed` to `/academy/certificates` and
  `learning.course.recommended` to the course, with a 🎓 icon.
- Layout: tabs are `<Link>` with `aria-current`, nested `<main>` removed, design tokens instead of hex.
- Draft badge on every course, path and article while `review_status` is `draft`.

## Verification
Unit: markdown (no raw HTML, unsafe links dropped), video allow-list, LinkedIn host check, API client bodies and errors, hero
reason refresh timing, public verify states. CI parity run locally: typecheck, lint, vitest, build. Live walk at 1440 and 375
for founder, team member, mentor, consultant against the real API: `docs/checklist/academy-fe-walk.md` (138 control rows).

## Operate / roll back
No env or migration. Revert the PR; the API is untouched. The preview needs the API proxy (`API_PROXY_TARGET`).

## Follow-ups
- YouTube player and position reporting need one real video to verify live.
- API: legacy certificates never get a PDF; verify rate limit is per code, not per visitor (see the walk doc).
- No e2e (Playwright) spec for Academy was added; coverage is unit plus the live walk.
