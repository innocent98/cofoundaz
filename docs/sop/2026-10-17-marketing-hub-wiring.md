# SOP: Marketing Hub wired to the real Module 10 backend

**What shipped (one line):** Every page under `/marketing` (overview, calendar, campaigns, AI copy, channels, SEO, segments, analytics) now reads and writes the real `/api/v1/marketing/*` API. All mock data, fake saves and static "AI output" are gone. Branch `claude/wire-marketing-hub-9970e0`, one PR to `develop`.

## Why
The Marketing backend (5 slices: campaigns and segments, calendar, AI plan-week, channel AI, AI copy, SEO, metrics and analytics) was complete and live-captured, but the FE still ran on `useMarketingApi` mock arrays. Launch was local only, "Plan my first week" was a toast, the copy generator flipped a flag over three hardcoded paragraphs, channel cards toggled local state, and the analytics page drew a fixed SVG and invented CAC rows. The dashboard's Campaign CTR tile already reads real ingested metrics, so the hub contradicted it.

## How (approach and decisions)
- **Typed client** `lib/api/marketing.ts` follows `lib/api/dashboard.ts` / `client.ts` (`apiClient` adds `X-Workspace-Id`). Each function unwraps `{data, meta}`. Shapes are copied from the live-captured guides in `cofoundaz-api/docs/fe-integration-guide-marketing-*.md`. Error helpers: `marketingErrorMessage` (API message, field message wins on 422), `fieldErrorsOf`, `isForbiddenError` (403 `FORBIDDEN` only, not `EMAIL_NOT_VERIFIED`).
- **Hooks**: `hooks/useMarketingApi.ts` (one hook per area on a shared `useResource` with `loading | ready | error | forbidden`; mutations call the API then reload, and throw the `ApiError`), plus `hooks/useMarketingGeneration.ts` (POST 202, then bounded poll, see below).
- **Shared UI** `components/marketing-hub/` (`DataGate`, `EmptyState`, `ErrorState`, `ForbiddenState`, `GenerationNote`, `Drawer`, `Field`). `ToastContext` gained an error kind and `runAction(fn, successMsg)`, which toasts the API's own message on failure.
- **AI generations** (plan-week, copy, channel plan, fit notes, content gaps) all use the same machine: poll starts at 1.5s, backs off to 5s, 90s hard timeout, three consecutive poll errors abort. Terminal phases are `ready`, `failed` (with a friendly `over_budget` message) and an honest `timeout`. Nothing is fabricated client-side.
- **The "accept" step** is explicit everywhere: plan-week proposals are added to the calendar one by one or "Add all" (one `POST /calendar-entries` each, per the guide), the channel-plan split is applied to the sliders only on "Apply this split", fit notes are written server-side then re-read, copy variants are copied / re-generated / saved to the calendar, content gaps hand off to the copy page ("Write it").
- **Roles**: a 403 `FORBIDDEN` on any page renders "Not available for your role", never a crash.
- **Rejected**: client-side pagination or a month cache for the calendar (API is unpaginated by design; the grid fetches only the visible month plus unscheduled drafts). Reading `campaign.metrics` (always `{}`); the leaderboard comes from `/analytics`.

## What's involved
| Area | Files |
|---|---|
| Client | `lib/api/marketing.ts`, `lib/api/marketing.test.ts` |
| Hooks | `hooks/useMarketingApi.ts`, `hooks/useMarketingGeneration.ts` (+ tests) |
| Shared UI | `components/marketing-hub/states.tsx`, `drawer.tsx` |
| Pages | `app/(dashboard)/marketing/{page,layout,ToastContext}`, `calendar/`, `campaigns/`, `copy/`, `channels/`, `seo/`, `segments/`, `analytics/` (+ `marketing-pages.test.tsx`) |
| Backend routes used | `/marketing` overview, `calendar-entries`, `calendar/plan-week`, `channels`, `channels/fit-notes`, `channel-plan/recommend`, `segments`, `campaigns`, `copy`, `keywords`, `seo/pages`, `positioning`, `seo/content-gaps`, `metrics`, `analytics` |

Money is integer minor units. The UI takes major units (₦) and converts; there is no currency field in Marketing, so the platform default NGN is displayed.

## Verification
Live, local full-stack (`API_PROXY_TARGET=http://localhost:8000 PORT=3003 npm run dev`, docker FastAPI, worker draining AI with a real LLM, local test account). Every CTA below was driven in the in-app browser against the real API:
- **Overview**: four real tiles, "this week's idea" from the newest ready content-gap run, empty variant when none.
- **Segments**: empty state, create, validation, edit, "Used in", delete warning when campaigns use it, delete.
- **Campaigns**: empty state, 4-step wizard, AI "Recommend a split" through Apply, create-and-launch, save-as-draft, Launch, Pause, Resume, Complete, Edit, Delete.
- **Channels**: eight real cards, status change, own notes, AI fit notes generated and rendered inline with timestamp.
- **AI copy**: 3 real variants, More like this (regenerates), Save to calendar (scheduled and draft), history. Copy-to-clipboard: the failure path was exercised (hidden pane has no clipboard focus); the success path is `navigator.clipboard.writeText`.
- **Calendar**: month grid from API, new post, validation (scheduled needs a time), edit, Mark published, delete, unscheduled backlog, Plan my first week (7 real proposals) with Add, Discard, Add all.
- **SEO**: keyword add/edit/validation, content gaps (7 real ideas) and Write it handoff, tracked page add/duplicate 422/checklist toggle, positioning partial and full save with composed statement.
- **Analytics**: real funnel, gap-filled traffic, CAC, leaderboard; range switch fires `range=7d`; Record metric (visits, channel spend/conversions, campaign clicks/conversions/spend).
- **Gates (mirror CI)**: `npm run typecheck`, `npm run lint`, `npm test` (302), `npm run build`, `npm run test:e2e` (153 passed).

Honest gaps in live verification: the analytics **empty state** and the **403 role state** could not be reached on this account (the workspace already had ingested metrics and the user is a founder), so both are covered by component/hook tests only. The segment **persona link** was only seen with an empty persona list. The over-budget and timeout AI paths are unit-tested, not reproduced live.

## Operate / roll back
No migrations or config. Revert the PR to restore the mock hub. Metric ingestion is append-only on the backend (no delete), so test metrics cannot be removed once recorded.

## Follow-ups
- **No backend, shown honestly**: rule-based segment definitions that count real users (the segment form says so), a Marketing-hub "+ Invite" (removed from this layout; the shared header button is a dead stub on every hub), campaign "duplicate as new draft" for a completed campaign, calendar drag-to-reschedule (PRD 10.2), multi-channel posts, campaign `metrics` (always `{}`; use `/analytics`).
- `[stub-llm]` strings can appear in staging if the stub provider is on; the FE never filters them (that is a backend config concern).
- Persona labels read `data.name` / `data.title` from Business Builder records; confirm the persona schema's display field.
