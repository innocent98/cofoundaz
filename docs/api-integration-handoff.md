# Cofoundaz Frontend — Real-API Integration Handoff

**Status as of this doc:** the frontend is wired to essentially every real,
unblocked `cofoundaz-api` endpoint, the local mock API layer has been **removed**,
and the buildable UI/functionality gaps from the PRD/UI audit are shipped. This is
the durable map of **what's live, what's blocked on the backend, and what's mock-only**
(no backend exists yet), so the next person doesn't have to reverse-engineer it from
the diff.

Complements — does not replace — the per-module records in [`docs/sop/`](./sop/), the
always-current task map in [`docs/checklist/frontend.md`](./checklist/frontend.md), and
the backend asks in [`docs/backend-requests-ui-gaps.md`](./backend-requests-ui-gaps.md).

---

## Snapshot

| Bucket | Count | Meaning |
|---|---|---|
| ✅ **Integrated & verified live** | 33 module SOPs | Wired to the real API and exercised end-to-end against staging |
| ⛔ **Backend-blocked** | 8 | The FE can't finish honestly until the backend ships/changes something (relayed below + in `backend-requests-ui-gaps.md`) |
| 🚫 **Mock-only (no backend)** | product hubs + a few ops screens | No endpoint exists; intentionally left mock until an API ships |
| 🔧 **Polish follow-ups** | a few, non-blocking | Documented per-SOP; safe to defer |

Every integrated module was verified **live against staging** (via the dev proxy),
gates green each time: `typecheck` 0 · `lint` 0 · **188** unit · clean `build` ·
**153** e2e. CI (GitHub Actions) is green on `develop`.

---

## How it's wired (cross-cutting)

- **API base — one path, no local fallback.** `lib/api/client.ts::apiClient` sends
  `Authorization: Bearer <cf_token>` and `X-Workspace-Id` (from `localStorage`), throws
  `ApiError(status, statusText, data)` on non-2xx, normalizes envelopes (`{data, meta}`),
  and handles `FormData` (skips `Content-Type`). Base is `NEXT_PUBLIC_API_BASE_URL ||
  '/api/v1'`. **Every** call now goes through `apiClient` — the 78 local
  `app/api/v1/*` mock route handlers were deleted (SOP `mock-api-routes-removal`), so
  there is no same-origin mock fallback in any build.
- **Local dev talks to staging same-origin.** `next.config.ts` proxies `/api/v1/*`
  → `https://staging-api.cofoundaz.com` (server-side, so no CORS). Preview/prod call
  the API origin directly via `NEXT_PUBLIC_API_BASE_URL` (which must allow the app
  origin via CORS).
- **Auth.** Login stores `cf_token` + `cf_refresh_token` + `cf_workspace_id`. On a
  `401` from an authenticated call, `apiClient` does a **single-flight silent
  `POST /auth/refresh`** and retries once; only if that fails does it clear + redirect
  to `/login?session=expired`. `/auth/`, `/shared/`, `/sign/` are exempt. See
  `docs/sop/auth-refresh-flow-fix.md`. **MFA:** login can return `{mfa_required, mfa_ticket}`
  instead of tokens; the shared `lib/auth/post-login.ts` routes both password and MFA
  logins the same way.
- **Optimistic concurrency.** Canvases and documents use a `version` + `409` model:
  canvases (`CANVAS_VERSION_CONFLICT`) re-read + retry; documents
  (`DOCUMENT_VERSION_CONFLICT`) **never** silently retry — the editor shows a
  conflict banner and offers reload.
- **Charts.** `recharts` (added this pass) renders real Health data
  (`components/health/health-charts.tsx`). The dashboard's KPI "sparkline" was
  **removed** — the API returns point-in-time KPI values, not a series, so a trend
  line there was fabricated.
- **Honesty rule (followed throughout).** No fabricated data. Empty/insufficient API
  states (benchmarks cohort, 0 recommendations, deferred ai-fill, single-point charts,
  disabled SMS-MFA) are shown as-is rather than invented. Estimates are hedged.
- **Verification harness.** `npm run dev` + a browser, driving the real UI logged-in
  (or logged-out for `/sign` `/shared` `/invite`), asserting server-side + rendered
  state, and **restoring any test data written**. Test account:
  `adevictor98@gmail.com` (onboarded, health 90 / thriving). CI mirror:
  `CI=1 npm run test:e2e`.

---

## ✅ Integrated & verified live

Grouped by area. "SOP" = the per-module record with the exact endpoints, captured
shapes, and verification evidence.

### Auth · Onboarding · Dashboard
| Area | Endpoints | SOP |
|---|---|---|
| Auth & session (+ verify/reset email links) | `POST /auth/login`, `/auth/me`, `/onboarding/state` | `module-0-auth-api-integration` |
| Silent token refresh | `POST /auth/refresh` (single-flight, rotating) | `auth-refresh-flow-fix` |
| **Two-factor (TOTP)** — setup, login challenge | `POST /auth/mfa/totp/setup\|verify`, `/auth/mfa/challenge`; login `{mfa_required, mfa_ticket}` | `module-27-mfa-totp` |
| **Accept-invitation** landing | `GET /invitations/{token}`, `POST /invitations/accept` | `module-26-invite-accept-and-sign-polish` |
| Onboarding wizard (+ logo via `apiClient` FormData) | `PATCH /onboarding/state`, `POST /onboarding/logo` | `module-1-onboarding-api-integration` |
| Dashboard widgets | `GET /dashboard/summary`, `/activity` | `module-2-dashboard-api-integration` |

### Health Score
| Area | Endpoints | SOP |
|---|---|---|
| Overview (2-state machine, 5 dims) + **dimension radar** | `GET /health-score` | `module-3-…`, `module-32-real-charts-health` |
| Sub-routes: dimensions / **history area chart** / benchmarks / recommendations (+accept/dismiss) | `GET /health-score/dimensions/{dim}`, `/history?range`, `/benchmarks`, `/recommendations?status`, `POST …/{id}/accept\|dismiss` | `module-23-health-subroutes`, `module-32-real-charts-health` |

> Note: `money`→`financial` label/key remap lives in the FE. Accept/dismiss **writes**
> are contract-verified but not run live (thriving test account has 0 recommendations).

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
| S4 · AI re-plan + **DiffViewer** (deltas, expandable history) | `POST /roadmap/replan/preview\|apply`, `GET …/history` | `module-18-roadmap-replan`, `module-29-roadmap-replan-diffviewer` |
| **Kanban drag-and-drop** (status change) | `PATCH /roadmap/tasks/{id}` | `module-28-roadmap-kanban-dnd` |

### Business Builder
| Area | Endpoints | SOP |
|---|---|---|
| Overview | `GET /business-builder/overview` | `module-6-business-builder-api-integration` |
| Canvas writes — lean | `GET/PUT /canvases/lean` (version/`409`) | `module-16-business-builder-canvas-writes` |
| Canvas persistence + **item edit-in-place + drag-reorder** — BMC/value-prop/SWOT/mission-vision | `GET/PUT /canvases/{type}` via `useCanvasEditor` | `module-24-…`, `module-30-canvas-edit-in-place`, `module-33-canvas-item-reorder` |
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
| Public recipient pages + **adopt-&-sign** (preview, consent) | `GET/POST /sign/{token}`, `GET /shared/{token}` | `module-21-…`, `module-26-invite-accept-and-sign-polish` |
| Document editor + **section add/remove/reorder (drag) + headings** | `GET/PUT /documents/{id}` (`409`) | `module-25-document-editing`, `module-31-document-section-editing` |

### Cross-cutting shell
Shared `<HealthPill>` (real score or hidden) + `<NotificationBell>` (real unread)
replaced hardcoded `72`/`5` across shells. SOP `module-10-shell-health-notifications`.

---

## ⛔ Backend-blocked (relay to the API team)

The only things the FE can't finish **honestly** without a backend change. None are
FE bugs. Full endpoint asks for the *missing-feature* ones are in
[`docs/backend-requests-ui-gaps.md`](./backend-requests-ui-gaps.md).

**Existing features that need a backend fix:**
1. **Assessment** — `serialize_question` returns no **prompt text** (the `Question`
   bank has no prompt field). The `/assessment` pages are ready to wire the moment
   prompts are served. **Fix:** add `prompt` to `Question` + `serialize_question`.
2. **AI-fill completion** — `POST …/ai-fill` enqueues (`202`) but no worker drains it.
   FE ships an honest "coming soon" stub. **Fix:** the AI worker; FE then polls
   `GET /jobs/{id}` (the hook already returns `job_id`).
3. **Journal encryption key on staging** — reads work; `POST /journal/entries` returns
   `500 JOURNAL_NOT_CONFIGURED` until the key is set. **Fix:** set it per environment.
4. **Emailed-link host** — sign/share links use `{SERVER_HOST}` = the **API host**, so
   a real emailed link opens raw JSON instead of the built recipient pages. **Fix:**
   point `SERVER_HOST` (or a public-links base) at the FE origin.
5. **MFA** — TOTP is fully wired, but **SMS** endpoints are `FeatureNotEnabled` stubs
   (shown disabled in the UI), there is **no MFA-disable/reset** endpoint (the "already
   on" screen tells the user to contact support), and `MFA_ENCRYPTION_KEY` must be set
   per environment (verified set on staging). **Fix:** implement SMS + a disable path;
   confirm the key in prod.

**Missing-feature screens with no endpoints at all** (designed in the PRD/UI, FE ready
to build once the API ships — see `backend-requests-ui-gaps.md`):
6. **Team Directory** — no members API (list/role/remove/seats; only invite create+accept exist).
7. **Notifications → Archived** — no archive/restore endpoint.
8. **Journal → Retrospectives** and **Calendar & reminders** — no such objects/API.

Also relayed (environment/ops): onboarding country `500→422` on non-ISO input
(worked around FE-side with an ISO select); confirm `APP_BASE_URL` = FE origin; CORS
for the app origin in preview/prod.

---

## 🚫 Mock-only — no backend exists yet

FE screens with **no API to integrate against**. They stay mock until an endpoint
ships; don't mistake them for "not yet wired." (The old local `/api/v1` mock route
handlers are gone — these pages render from in-hook mock scaffolding, not a fake HTTP
layer.)

- **Product hubs:** Marketing, Sales, Finance, Validation, Funding, Investor
  Readiness, Legal & Compliance (`useMarketingApi`/`useSalesApi`/etc. are mock).
- **Notifications tabs:** *Digest & quiet hours* and *Announcements* — only
  `master_email` + categories exist server-side.
- **Ops/admin screens** not backed by a documented endpoint: Calendar,
  Analytics/Reports, Marketplace, Admin Portal, Super-Admin (the last two are also
  thin vs the PRD's multi-screen spec — see checklist §6b).

---

## 🔧 Non-blocking polish follow-ups

Tracked per-SOP; safe to defer. Highlights:

- **Mentor role-gating** on all editor-only writes (roadmap, canvas, records,
  suggestions, recommendations accept/dismiss, document edit) — today a `403` is
  surfaced after the click rather than pre-disabling controls.
- **Roadmap:** dependency graph view (`GET /roadmap/dependencies` nodes/edges),
  phase rename UI, Milestones-list drawer, task detail fields.
- **Business Builder:** record reorder (`position`); migrate `lean-canvas` onto
  `useCanvasEditor` (it's the last canvas without edit-in-place / reorder).
- **Documents:** optional debounced autosave (documents deliberately use explicit
  Save + `409` banner today); inline file preview on `/sign`.
- **Onboarding:** carry `?next` + email through email verification so a new invitee
  returns to `/invite/{token}` automatically; prefill signup email from `?email`.
- **Notifications:** keyset pagination (`next_cursor`) on the inbox; migrate the 4
  early module shells' inline pill/badge to the shared components.
- **Health:** benchmarks populated (percentile) path once cohort aggregation ships;
  charts fill into real lines as more assessments accrue (no code change).

---

## Running & verifying locally

```bash
npm run dev            # proxies /api/v1 → staging (same-origin, no CORS)
npm run typecheck      # tsc --noEmit
npm run lint           # eslint (0 errors / 0 warnings expected)
npm test               # vitest — 188 unit
CI=1 npm run test:e2e  # playwright — 153 (builds + starts its own server)
```

Dependencies of note (both offline / no data leak): `qrcode` (MFA QR),
`recharts` (Health charts). After adding any dependency, regenerate a clean
`package-lock.json` (`rm -rf node_modules package-lock.json && npm install`) so CI's
`npm ci` stays in sync.

The pre-commit hook enforces design tokens (use `md:` not `sm:`; `shadow-card` not
`shadow-sm`; no `font-mono`) + ESLint on staged files. CI on `develop`/`main` runs the
same set. Reproduce CI locally before pushing — a green local run is part of finishing
the work.
