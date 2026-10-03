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
| 2. Interviews | `/validation/interviews` | `GET/POST/PATCH /validation/interviews` | ⏳ next |
| 3. Surveys (+ public link) | `/validation/surveys`, public `/surveys/{token}` | `GET/POST/PATCH /validation/surveys` + analytics + public token read/submit | ⏳ |
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
