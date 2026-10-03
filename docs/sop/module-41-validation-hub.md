# SOP — Validation Hub (Module 09) real-API integration

**What shipped:** wiring the Validation Hub from mock to the real `cofoundaz-api`
`/validation/*` endpoints, slice by slice (one PR each, verified live against
staging). Guide: `cofoundaz-api/docs/fe-integration-guide-validation.md`.

The hub was 100% mock (`hooks/useValidationApi.ts` — hardcoded `initial*` arrays).
Each slice replaces one page's data source with a real hook and retires that part
of the mock; the mock hook is deleted once the last slice lands.

## Slice status

| Slice | Pages | Endpoints | Status |
|---|---|---|---|
| 1. Assumptions | `/validation/assumptions` | `GET/POST/PATCH /validation/assumptions` | ✅ shipped |
| 2. Interviews | `/validation/interviews` | `GET/POST/PATCH /validation/interviews` | ✅ shipped |
| 3a. Surveys (owner) | `/validation/surveys` | `GET/POST/PATCH /validation/surveys` + `/analytics` | ✅ shipped |
| 3b. Public survey page | `/s/{token}` (new, no-auth) | `GET/POST /validation/surveys/{token}` | ⏳ next |
| 4. Experiments / Smoke-tests | `/validation/smoke-tests`, `/mvp` | `GET/POST/PATCH /validation/experiments` + `GET /smoke-tests/{id}/stats` | ⏳ |
| 5. AI scripts + synthesize | `/validation/scripts` | `POST /validation/scripts/generate` + `POST /validation/synthesize` (202 → poll) | ⏳ |

---

## Slice 1 — Assumptions (shipped)

### Why
The assumptions kanban was fully mock, with a **hardcoded** "riskiest untested
assumption" banner ("Gig workers will pay ₦500/month…") and a latent **risk-badge
bug** (the page checked lowercase `risk` but the mock data was capitalized, so every
card showed "Low risk"). The real API returns lowercase risk, which fixes it.

### How
- **`lib/api/validation.ts`** (new, grows per slice) — `listAssumptions` /
  `createAssumption` / `updateAssumption` over `GET/POST/PATCH /validation/assumptions`.
  apiClient auto-injects Bearer + `X-Workspace-Id`, so no extra headers.
- **`hooks/useAssumptions.ts`** (new) — loads on mount, maps `evidence_count` →
  `evidenceCount`, optimistic `updateStatus` (reconciles via refetch on failure),
  `addAssumption` (POST → prepend). Honest error state.
- **`app/(dashboard)/validation/assumptions/page.tsx`** — rewired to the real hook;
  dropped the local-mock duplication; the banner now **derives the riskiest untested
  assumption from real data** (hidden/neutral when none); "Design experiment" links to
  `/validation/smoke-tests` (wired in slice 4); loading + error states added.

### Verification (live, staging test account)
GET empty board → quick-add created a real assumption (POST, "High risk" badge
correct) → `PATCH {status:"validated"}` returned 200 and, after reload, the card
rendered in **Validated** (count 1) — the page reads server truth. typecheck 0 /
lint 0 / unit 229 / build clean / e2e 153.

### Notes / follow-ups
- There is **no `DELETE /validation/assumptions`** — the test assumption created
  during verification persists (harmless on the test account).
- Drag-to-move was confirmed via its underlying PATCH + reload (native HTML5 DnD is
  not reliably drivable in the automated browser); the handler calls the same
  `updateStatus` path.
- `evidence_count` is server-derived from linked experiments + interviews — it will
  become non-zero once slices 2/4 link records to assumptions.

---

## Slice 2 — Interviews (shipped)

### How
- **`lib/api/validation.ts`** — added `listInterviews` / `createInterview` /
  `updateInterview` + `RawInterview`/`CreateInterviewBody` types
  (`GET/POST/PATCH /validation/interviews`).
- **`hooks/useInterviews.ts`** (new) — load on mount, `addInterview` (POST →
  prepend), maps `key_quotes[0]` → `quote`; honest error state.
- **`app/(dashboard)/validation/interviews/page.tsx`** — rewired to the real hook:
  the New-note form POSTs (`held_on` = today, `verdict` = lowercased stance,
  `key_quotes` = [the quote] — the API 422s on empty quotes), the list reads real
  data with an honest empty state + loading/error. Verdict maps lowercase ↔ the
  Supports/Contradicts/Neutral badges.

### Verification (live)
Empty list → added "Ada · fintech / Supports / 'I would pay for this today'" (POST
201) → persisted on reload (GET). typecheck 0 / lint 0 / unit 229 / build / e2e 153.

### Notes
- The "Synthesize insights" button (`InsightSynthesizer`) is still mock — it's the
  AI synthesize feature wired in **slice 5**.
- The single textarea maps to **both** `notes` and the first `key_quotes` entry; a
  later polish could split notes vs. multiple quotes and add verdict/segment filters.

---

## Slice 3a — Surveys owner (shipped)

### How
- **`lib/api/validation.ts`** — added the full survey surface: `listSurveys`,
  `createSurvey`, `updateSurvey` (returns `{survey, public_token}`),
  `getSurveyAnalytics`, **plus the public** `getPublicSurvey` / `submitSurveyResponse`
  (so slice 3b only needs the page) + all types.
- **`hooks/useSurveys.ts`** (new) — list/create/`setStatus` (open→returns the
  one-time token)/analytics; surfaces `field_errors`.
- **`app/(dashboard)/validation/surveys/page.tsx`** — full rewrite from the single
  hardcoded mock to: a **survey list** (status, question/response counts), a
  **create builder modal** (title + questions of type choice/scale/nps/open, choice
  options, required, client-side validation matching the guide's limits), **Open &
  get link** (PATCH→open captures `public_token` and shows the `/s/{token}` link +
  Copy **once**), Stop/Resume collecting, and a **real analytics panel** (choice
  bars, scale/nps average, open "N answered"; honest empty state).

### Key behaviour (guide §4)
`public_token` is returned **only** on the first open and cannot be re-fetched — the
UI shows it once with a "shown once" label; re-opening a closed survey reuses the
token but does not return it (we say so).

### Verification (live)
Created "Pricing check" (choice Yes/No) → listed as Draft → **Open & get link**
produced a real `/s/{token}` link (status → Open) → analytics panel showed
"0 responses · 0% completion". Fixed a nested-`<button>` hydration error (card is now
a role=button `<div>`). typecheck 0 / lint 0 / unit 229 / build / e2e 153.

### Follow-ups
- **Slice 3b** builds the public `/s/{token}` page that actually collects responses
  (the SDK for it is already in `lib/api/validation.ts`).
- Editing a survey's questions/title and the "Synthesize insights" AI (slice 5) are
  not wired here.
