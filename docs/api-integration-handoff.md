# Cofoundaz Frontend — Real-API Integration Handoff

**Status as of this doc:** the frontend is wired to essentially every real,
unblocked `cofoundaz-api` endpoint. This is the durable map of **what's live,
what's blocked on the backend, and what's mock-only** (no backend exists yet), so
the next person doesn't have to reverse-engineer it from the diff.

Complements — does not replace — the per-module records in [`docs/sop/`](./sop/)
and the always-current task map in [`docs/checklist/frontend.md`](./checklist/frontend.md).

---

## Snapshot

| Bucket | Count | Meaning |
|---|---|---|
| ✅ **Integrated & verified live** | 25 modules | Wired to the real API and exercised end-to-end against staging |
| ⛔ **Backend-blocked** | 4 | The FE can't finish honestly until the backend ships/changes something (relayed below) |
| 🚫 **Mock-only (no backend)** | ~8 areas | No endpoint exists; intentionally left mock until an API ships |
| 🔧 **Polish follow-ups** | many, non-blocking | Documented per-SOP; safe to defer |

Every integrated module was verified **live against staging** (via the dev proxy),
gates green each time: `typecheck` 0 · `lint` 0 errors · **188** unit · clean
`build` · **153** e2e. CI (GitHub Actions) is green on `develop`.

---

## How it's wired (cross-cutting)

- **API base.** `lib/api/client.ts::apiClient` sends `Authorization: Bearer <cf_token>`
  and `X-Workspace-Id` (from `localStorage`), throws `ApiError(status, statusText, data)`
  on non-2xx, and normalizes envelopes (`{data, meta}`). Base is
  `NEXT_PUBLIC_API_BASE_URL || '/api/v1'`.
- **Local dev talks to staging same-origin.** `next.config.ts` proxies `/api/v1/*`
  → `https://staging-api.cofoundaz.com` (server-side, so no CORS). Preview/prod call
  the API origin directly via `NEXT_PUBLIC_API_BASE_URL` (which must allow the app
  origin via CORS).
- **Auth.** Login stores `cf_token` + `cf_refresh_token` + `cf_workspace_id`. On a
  `401` from an authenticated call, `apiClient` does a **single-flight silent
  `POST /auth/refresh`** and retries once; only if that fails does it clear + redirect
  to `/login?session=expired`. `/auth/`, `/shared/`, `/sign/` are exempt (public /
  bad-credential paths). See `docs/sop/auth-refresh-flow-fix.md`.
- **Optimistic concurrency.** Canvases and documents use a `version` + `409` model:
  canvases (`CANVAS_VERSION_CONFLICT`) re-read + retry; documents
  (`DOCUMENT_VERSION_CONFLICT`) **never** silently retry — the editor shows a
  conflict banner and offers reload.
- **Honesty rule (followed throughout).** No fabricated data. Where the API returns
  an empty/insufficient state (benchmarks cohort, 0 recommendations, deferred
  ai-fill), the UI says so rather than inventing numbers. Estimates are hedged
  ("est. +9", never "+9 guaranteed").
- **Verification harness.** `npm run dev` + the built-in browser, driving the real
  UI logged-in (or logged-out for `/sign` `/shared`), asserting server-side +
  rendered state. Test account: `adevictor98@gmail.com` (onboarded, health 90 /
  thriving). CI mirror: `CI=1 npm run test:e2e`.

---

## ✅ Integrated & verified live

Grouped by area. "SOP" = the per-module record with the exact endpoints, captured
shapes, and verification evidence.

### Auth · Onboarding · Dashboard
| Area | Endpoints | SOP |
|---|---|---|
| Auth & session (+ verify/reset email links) | `POST /auth/login`, `/auth/me`, `/onboarding/state` | `module-0-auth-api-integration` |
| Silent token refresh | `POST /auth/refresh` (single-flight, rotating) | `auth-refresh-flow-fix` |
| Onboarding wizard | `PATCH /onboarding/state` (resume/autosave) | `module-1-onboarding-api-integration` |
| Dashboard widgets | `GET /dashboard/summary`, `/activity` | `module-2-dashboard-api-integration` |

### Health Score
| Area | Endpoints | SOP |
|---|---|---|
| Overview (2-state machine, 5 dims) | `GET /health-score` | `module-3-health-score-api-integration` |
| Sub-routes: dimensions / history / benchmarks / recommendations (+accept/dismiss) | `GET /health-score/dimensions/{dim}`, `/history?range`, `/benchmarks`, `/recommendations?status`, `POST …/{id}/accept\|dismiss` | `module-23-health-subroutes` |

> Note: the `money`→`financial` label/key remap lives in the FE. Accept/dismiss
> **writes** are contract-verified but not run live (thriving test account has 0
> recommendations) — re-verify on a lower-scoring workspace.

### Mission
| Area | Endpoints | SOP |
|---|---|---|
| Today's mission (state machine, streak) | `GET /missions/today`, `GET/PATCH /missions/settings` | `module-4-mission-api-integration` |
| Task actions (add/complete/snooze/reject/reorder) | `POST /missions/tasks`, `PATCH /missions/tasks/{id}` | `module-4-mission-task-actions` |
| History sub-pages (completed/streaks/upcoming) | `GET /missions/history` (+ roadmap for upcoming) | `module-4-mission-history` |

### Roadmap (read + all write slices)
| Slice | Endpoints | SOP |
|---|---|---|
| Tree read | `GET /roadmap` | `module-5-roadmap-api-integration` |
| S1 · phase/milestone/task CRUD | `POST/PATCH/DELETE /roadmap/{phases,milestones,tasks}` | `module-18-roadmap-writes` |
| S2 · dependencies | `POST/DELETE /roadmap/tasks/{id}/dependencies` (`409` cycle) | `module-18-roadmap-dependencies` |
| S3 · template gallery | `GET /roadmap/templates{,/{id}}`, `POST …/apply` | `module-18-roadmap-templates` |
| S4 · AI re-plan | `POST /roadmap/replan/preview\|apply`, `GET …/history` | `module-18-roadmap-replan` |

### Business Builder
| Area | Endpoints | SOP |
|---|---|---|
| Overview | `GET /business-builder/overview` | `module-6-business-builder-api-integration` |
| Canvas writes — lean | `GET/PUT /canvases/lean` (version/`409`) | `module-16-business-builder-canvas-writes` |
| Canvas persistence — BMC/value-prop/SWOT/mission-vision | `GET/PUT /canvases/{type}` via `useCanvasEditor` | `module-24-bb-canvas-persistence` |
| Record CRUD — personas/competitors/pricing/revenue | `GET/POST/PUT/DELETE /business-builder/{kind}` (plural paths) | `module-17-business-builder-records` |
| Suggestions review + positioning-map axes | `GET/POST …/suggestions{,/{id}/approve\|reject}` (`409`), `GET/PUT /positioning-map` | `module-19-bb-suggestions-positioning-map` |
| AI-fill (honest deferred stub) | `POST /canvases/{type}/ai-fill` (202 queued) — see blocked list | `module-20-bb-ai-fill` |

### Notifications · Journal · Learning
| Area | Endpoints | SOP |
|---|---|---|
| Inbox feed + mark read | `GET /notifications`, `/unread-count`, `POST …/read`, `/read-all` | `module-7-notifications-api-integration` |
| Email preferences | `GET/PUT /notifications/preferences` | `module-22-notification-preferences` |
| Journal (read + write) | `GET /journal/*`, `POST /journal/entries` (blocked, see below) | `module-8-journal-api-integration` |
| Learning academy | `/learning/courses\|articles\|paths\|certificates`, enroll, lesson-complete | `module-15-learning-academy` |

### Documents
| Area | Endpoints | SOP |
|---|---|---|
| Files (upload/list/delete) | `GET/POST/DELETE /documents/files` | `module-9-documents-files-api-integration` |
| Sharing + list + share UI | `GET /documents`, `POST /documents/{id}/shares`, `DELETE …/{share_id}` | `module-11/12-documents-*` |
| E-signature (send/cancel/remind) | `GET/POST /documents/*/signature-requests` | `module-13-documents-esignature` |
| Templates | `GET /document-templates`, `POST /documents {template_key}` | `module-14-documents-templates` |
| Public recipient pages | `GET/POST /sign/{token}`, `GET /shared/{token}` | `module-21-documents-public-recipient-pages` |
| Document editor | `GET/PUT /documents/{id}` (`409`) | `module-25-document-editing` |

### Cross-cutting shell
Shared `<HealthPill>` (real score or hidden) + `<NotificationBell>` (real unread)
replaced hardcoded `72`/`5` across shells. SOP `module-10-shell-health-notifications`.

---

## ⛔ Backend-blocked (relay to the API team)

These are the only things the FE can't finish **honestly** without a backend change.
None are FE bugs.

1. **Assessment module** — `serialize_question` returns `{key, dimension, section,
   qtype, options}` but **no question prompt text** (the `Question` bank has no
   prompt field). A scale question arrives as just `key:"market_clarity"`. The FE
   won't invent the product's real question copy. **Fix:** add `prompt` (and any
   help text) to `Question` + `serialize_question`. The `/assessment` FE pages are
   ready to wire the moment prompts are served.
2. **AI-fill completion** — `POST /business-builder/{canvas|kind}/ai-fill` enqueues a
   job (`202 queued`) but **no worker drains it**, so it never completes. The FE
   ships an honest "AI draft queued — coming soon" stub (Module 20) that fires the
   real endpoint but never fabricates results. **Fix:** the Module 03 AI Co-Founder
   worker; then the FE polls `GET /jobs/{id}` to `succeeded` and refreshes (the hook
   already returns `job_id`).
3. **Journal encryption key on staging** — journal reads work; `POST /journal/entries`
   returns `500 JOURNAL_NOT_CONFIGURED` until the encryption key is set on staging.
   The UI degrades gracefully. **Fix:** set the key per environment.
4. **Emailed-link host** — sign/share links are built as `{SERVER_HOST}/sign|shared/{token}`,
   and `SERVER_HOST` currently points at the **API host**, not the FE origin — so a
   real emailed link opens raw JSON, not the (now-built) recipient pages. **Fix:**
   point `SERVER_HOST` (or a dedicated public-links base) at the FE origin.

Also relayed earlier (environment/ops): onboarding country `500→422` on non-ISO
input (already worked around FE-side with an ISO select); confirm `APP_BASE_URL` =
FE origin for email links; CORS for the app origin in preview/prod.

---

## 🚫 Mock-only — no backend exists yet

These have FE screens but **no API to integrate against**. They stay mock until an
endpoint ships; don't mistake them for "not yet wired."

- **Product hubs:** Marketing, Sales, Finance, Validation, Funding, Investor
  Readiness, Legal & Compliance. (Their `useMarketingApi`/`useSalesApi`/etc. hooks
  are mock scaffolding.)
- **Notifications tabs:** *Digest & quiet hours* and *Announcements* — only
  `master_email` + categories exist server-side.
- **Assorted ops screens** not backed by a documented endpoint (e.g. Calendar,
  Analytics/Reports, Marketplace, Admin/Super-Admin).

---

## 🔧 Non-blocking polish follow-ups

Tracked per-SOP; safe to defer. Highlights:

- **Mentor role-gating** on all editor-only writes (roadmap, canvas, records,
  suggestions, recommendations accept/dismiss, document edit) — today a `403` is
  surfaced after the click rather than pre-disabling controls.
- **Roadmap:** dependency graph view (`GET /roadmap/dependencies` nodes/edges),
  phase rename UI, Milestones-list drawer, task detail fields.
- **Business Builder:** canvas item edit-in-place (add/remove only today), record
  reorder (`position`), migrate lean-canvas onto `useCanvasEditor`.
- **Documents:** section add/remove/reorder + autosave in the editor, inline file
  preview on `/sign`.
- **Notifications:** keyset pagination (`next_cursor`) on the inbox; migrate the 4
  early module shells' inline pill/badge to the shared components.
- **Health:** benchmarks populated (percentile) path once cohort aggregation ships.
- **Deferred infra:** sync `main` ← `develop`; clear pre-existing `no-unused-vars`
  warnings; resolve the two home routes.

---

## Running & verifying locally

```bash
npm run dev            # proxies /api/v1 → staging (same-origin, no CORS)
npm run typecheck      # tsc --noEmit
npm run lint           # eslint (0 errors expected; ~warnings pre-exist)
npm test               # vitest — 188 unit
CI=1 npm run test:e2e  # playwright — 153 (builds + starts its own server)
```

The pre-commit hook enforces design tokens (use `md:` not `sm:`) + ESLint on staged
files. CI on `develop`/`main` runs the same set. Reproduce CI locally before
pushing — a green local run is part of finishing the work.
