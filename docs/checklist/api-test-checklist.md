# Cofoundaz — API Integration Test Checklist (manual QA)

Your hands-on test plan for the **25 integrated modules**. Each row says **where**
to go, **what** to do, **what's expected**, and **what to watch for** (the traps we
hit during integration). Complements the developer record in
[`docs/api-integration-handoff.md`](../api-integration-handoff.md) and the per-module
[`docs/sop/`](../sop/) docs.

---

## Before you start

| | |
|---|---|
| **Environment** | Run `npm run dev` locally — it proxies `/api/v1/*` → `https://staging-api.cofoundaz.com` server-side (same-origin, no CORS), so you're testing the **real staging API**. Or test the deployed app if `NEXT_PUBLIC_API_BASE_URL` is set to the API origin. |
| **Account** | Log in with an onboarded account. The known-good staging test account is fully onboarded, assessment-complete, **health = ~90 (thriving)**, and has roadmap + mission tasks — so non-empty paths are visible. A brand-new account will legitimately show empty states. |
| **How to verify deeply** | Open DevTools → Network, filter `api/v1`. Confirm each action fires the expected request, sends `Authorization: Bearer …` + `X-Workspace-Id`, and returns 2xx. A `401` should silently refresh and retry once (you'll see a `POST /auth/refresh`), not bounce you to login. |
| **Roles** | Editor-only writes (roadmap/canvas/records/suggestions/recommendations/doc-edit) return **403 for a mentor/viewer**. Today the 403 surfaces *after* the click (controls aren't pre-disabled) — that's known, not a bug. |

**Legend:** ✅ expected to work live · ⚠️ works but watch the noted trap · ⛔ backend-blocked (will look broken — that's expected, see bottom) · 🚫 mock-only (not real yet).

---

## 1. Auth · Session · Onboarding · Dashboard

| # | Where | Do this | Expected | Watch for |
|---|---|---|---|---|
| 1.1 ✅ | `/login` | Log in with valid creds | Lands on `/dashboard`; `cf_token`, `cf_refresh_token`, `cf_workspace_id` set in localStorage | Wrong creds → inline error, **no** redirect loop |
| 1.2 ✅ | any page | Leave the tab idle until the access token expires, then act | Action succeeds; Network shows one `POST /auth/refresh` then the retried call | ⚠️ Refresh token is **single-use/rotating** — a burst of calls must share ONE refresh (no logout storm) |
| 1.3 ✅ | — | Manually corrupt `cf_token`, then trigger any call | Cleared session → redirect to `/login?session=expired&next=…` | Should happen **once**, not repeatedly |
| 1.4 ✅ | email link | Open a verify-email / reset-password link | Token page resolves against the real API | `/auth/*` never triggers the session-expired redirect |
| 1.5 ✅ | `/onboarding` | Start the 6-step wizard, refresh mid-way | Resumes on the step you left (server-persisted via `PATCH /onboarding/state`) | ⚠️ Country must be an **ISO code** (a free-text country 422s server-side — FE uses a select) |
| 1.6 ⚠️ | `/onboarding` logo step | Upload a logo | Uploads via `POST /onboarding/logo` (multipart), preview shows | Now routed through `apiClient` (real API), not a local mock — verify it actually reaches staging |
| 1.7 ✅ | `/dashboard` | Load the dashboard | Widgets populate from `GET /dashboard/summary` + `/activity`; health pill + notification bell show **real** numbers | No hardcoded `72`/`5` |
| 1.8 ⚠️ | `/dashboard` | Click "Do it" on an AI briefing card | Fires `POST /dashboard/briefing/{id}/actions/1/accept` | If the endpoint isn't live it fails silently (card stays) — by design, no crash |
| 1.9 ✅ | sidebar → **Security (2FA)** / `/setup/mfa` | Set up an authenticator: scan the QR (or copy the key), enter the 6-digit code, save the backup codes | `POST /auth/mfa/totp/setup` → `{secret, otpauth_uri}`; `POST …/totp/verify` → `{enabled, backup_codes}` | ⚠️ **Enabling is one-way — no disable endpoint yet, so use a throwaway account, NOT the shared test one.** **SMS** option is greyed "coming soon" (backend `FeatureNotEnabled`). Needs `MFA_ENCRYPTION_KEY` set (it is on staging) or every call 500s |
| 1.10 ✅ | `/login` with a 2FA-enabled account | Log in → 6-digit challenge → enter the code (or a backup code) | Login returns `{mfa_required, mfa_ticket}` (no token); `POST /auth/mfa/challenge {mfa_ticket, code}` → tokens | The "Use a backup code" toggle accepts a saved code. Deep-linking `/login/mfa` with no ticket bounces to `/login` |
| 1.11 ✅ | `/invite/{token}` | Open an invite link — try both logged out **and** logged in | `GET /invitations/{token}` previews inviter/workspace/role; `POST /invitations/accept` joins + lands `/dashboard` | Logged out → login/signup CTAs (login returns you here to accept). ⚠️ Logged in as a **different email** than invited → "log in with {email}" mismatch banner. Expired/used → 404 "no longer valid" |

---

## 2. Health Score

| # | Where | Do this | Expected | Watch for |
|---|---|---|---|---|
| 2.1 ✅ | `/health` | Load overview | Score + 5 dimensions from `GET /health-score`; 2-state (has-score vs building) | Thriving account shows ~90 |
| 2.2 ⚠️ | `/health/dimensions/[dim]` | Open the **Financial** dimension | Loads correctly | ⚠️ FE remaps `financial` ↔ API's `money` key — confirm Financial isn't blank |
| 2.3 ✅ | `/health/history` | Change the range selector | `GET /health-score/history?range=…` refetches | Chart matches range |
| 2.4 ⚠️ | `/health/benchmarks` | Load benchmarks | Shows cohort data **or** an honest "not enough data" state | Empty cohort must say so — not fake percentiles |
| 2.5 ⚠️ | `/health/recommendations` | Accept / dismiss a recommendation | `POST …/{id}/accept\|dismiss`, item resolves | Writes are **contract-verified but not run live** (test account has 0 recs) — **re-test on a lower-scoring workspace**. Expect `409 RECOMMENDATION_RESOLVED` if acted twice |
| 2.6 ✅ | `/health` + `/health/history` + `/health/dimensions/[dim]` | Look at the charts (recharts) | Overview: a **5-dimension radar**; history: a **score area chart** (0–100 axis, tooltip); dimension detail: a **trend line** | All fed **real** API data — a single assessment renders one honest dot, not a fake line. Note the **dashboard** KPI cards deliberately have **no** sparkline now (no series exists — a trend there would be fabricated) |

---

## 3. Mission

| # | Where | Do this | Expected | Watch for |
|---|---|---|---|---|
| 3.1 ✅ | `/mission` | Load today | Tasks + streak from `GET /missions/today`; correct state (no-roadmap / empty / pending / complete) | Weekend-off day can be legitimately task-less |
| 3.2 ✅ | `/mission` | Complete / snooze / reject / add / reorder a task | Each hits `POST /missions/tasks` or `PATCH …/{id}`; list + streak reconcile after refetch | Completion is one-way |
| 3.3 ⚠️ | `/mission` | Reject a task | Rejects with a reason | ⚠️ Reason must be an **exact** allowed string (straight apostrophe in "Doesn't apply" — a curly one 422s). UI chips are safe |
| 3.4 ✅ | `/mission/settings` | Change mission size / delivery time / weekends | `PATCH /missions/settings` persists | Time converts 12h ↔ 24h; "weekends off" is the inverse of API's `weekend_missions` |
| 3.5 ✅ | `/mission/completed`, `/streaks`, `/upcoming` | Load each | Populated from `GET /missions/history` (+ roadmap for upcoming) | Empty history → honest empty state |

---

## 4. Roadmap

| # | Where | Do this | Expected | Watch for |
|---|---|---|---|---|
| 4.1 ✅ | `/roadmap` | Load the tree | Phases → milestones → tasks from `GET /roadmap` | Slipped/drift count shows if present |
| 4.2 ✅ | `/roadmap` | Add/edit/delete a phase, milestone, or task | `POST/PATCH/DELETE /roadmap/{phases,milestones,tasks}`; tree refetches | Editor-only (mentor → 403) |
| 4.3 ⚠️ | `/roadmap/dependencies` | Add a task dependency that would form a loop | Server rejects with `409` (cycle) | FE also pre-checks; confirm the cycle is blocked |
| 4.4 ✅ | `/roadmap/templates` | Browse gallery, apply a template | `GET /roadmap/templates`, `POST …/apply`; roadmap updates | — |
| 4.5 ✅ | `/roadmap/replan` | Preview then apply an AI re-plan; check history | `POST /roadmap/replan/preview\|apply`, `GET …/history` | Preview must not mutate until you **apply** |
| 4.6 ✅ | `/roadmap/kanban` (Status view) | Drag a task card between **To Do / In Progress / Done** | Optimistic move; `PATCH /roadmap/tasks/{id}` persists the new status; refetch reconciles | Mentor/viewer → `403` and the card snaps back with a note. Phase view is click-to-open (no "move milestone to phase" API) |
| 4.7 ✅ | `/roadmap/replan` | Generate a re-plan; expand a **history** entry | Each change shows **old → new date + a day-delta** ("+17 days"); history entries expand to their real before/after diffs | Deltas are computed from the real dates — nothing invented |

---

## 5. Business Builder

| # | Where | Do this | Expected | Watch for |
|---|---|---|---|---|
| 5.1 ✅ | `/business-builder` | Load overview | Artifact completion % from `GET /business-builder/overview` | — |
| 5.2 ⚠️ | `/business-builder/lean-canvas` | Edit blocks, wait for autosave | `PUT /canvases/lean` with a `version` | ⚠️ Concurrency: a stale version → `409 CANVAS_VERSION_CONFLICT`; FE **re-reads + retries** (edit in two tabs to see it) |
| 5.3 ✅ | `.../business-model-canvas`, `/value-proposition`, `/swot`, `/mission-vision` | Edit, let it autosave | Persists via `useCanvasEditor` (`GET/PUT /canvases/{type}`) | Debounced autosave — pause after typing |
| 5.4 ⚠️ | `.../personas`, `/competitive-analysis`, `/pricing`, `/revenue-model` | Create / edit / delete a record | `POST/PUT/DELETE /business-builder/{kind}` (plural path); list refreshes | ⚠️ Required-field validation comes from the server (`field_errors`) — submit an incomplete record to see the message. Pricing has nested tiers |
| 5.5 ⚠️ | `/business-builder` suggestions panel | Approve / reject a suggestion | `POST …/suggestions/{id}/approve\|reject` | `409` if the canvas moved on or suggestion no longer pending |
| 5.6 ✅ | positioning map | Edit axes | `GET/PUT /positioning-map` | Competitors plot against saved axes |
| 5.7 ⛔ | any canvas | Click **AI-fill / AI draft** | Fires `POST /canvases/{type}/ai-fill` → **202 queued**, shows "AI draft queued — coming soon" | **No worker drains the job** — it never completes. This is the honest stub, **not** a bug (see blocked list) |
| 5.8 ✅ | `.../business-model-canvas`, `/value-proposition`, `/swot` | **Click an item to edit it in place**; **drag an item by its grip handle to reorder** within a block | Both autosave the full block via `PUT /canvases/{type}` | Edit: Enter/blur commits, Escape cancels, emptying it removes the item. Reorder stays **within one block**. `mission-vision` is text-only; `lean-canvas` doesn't have these yet |

---

## 6. Notifications · Journal · Learning

| # | Where | Do this | Expected | Watch for |
|---|---|---|---|---|
| 6.1 ✅ | notification bell / `/notifications` | Open inbox, mark read / read-all | `GET /notifications`, `/unread-count`, `POST …/read`, `/read-all`; bell count updates | — |
| 6.2 ✅ | `/notifications` preferences | Toggle master email + the 5 category switches | `GET/PUT /notifications/preferences` (partial merge) | 🚫 "Digest & quiet hours" and "Announcements" tabs are **mock** — not real yet |
| 6.3 ⛔ | `/journal` | **Read** entries | Reads work | — |
| 6.4 ⛔ | `/journal` | **Write** a new entry | Returns **500 `JOURNAL_NOT_CONFIGURED`** on staging until the encryption key is set; UI degrades gracefully | Backend-blocked — expected to fail-soft, not crash |
| 6.5 ✅ | `/academy` (+ courses/articles/paths/certificates) | Browse, enroll, complete a lesson | `/learning/*`, enroll, lesson-complete fire and persist | — |

---

## 7. Documents

| # | Where | Do this | Expected | Watch for |
|---|---|---|---|---|
| 7.1 ✅ | `/documents` | Upload / list / delete a file | `GET/POST/DELETE /documents/files` | — |
| 7.2 ✅ | `/documents` | Share a doc, then revoke the share | `POST /documents/{id}/shares`, `DELETE …/{share_id}` | Share list updates |
| 7.3 ✅ | `/documents/signatures` | Send / remind / cancel a signature request | `GET/POST /documents/*/signature-requests` | Status reflects server |
| 7.4 ✅ | `/documents/templates` | Create a doc from a template | `GET /document-templates`, `POST /documents {template_key}` | — |
| 7.5 ⚠️ | `/documents/[id]` | Open the editor, edit, save | `GET/PUT /documents/{id}` with `version` | ⚠️ On `409 DOCUMENT_VERSION_CONFLICT` the editor shows a **conflict banner** and does **NOT** auto-retry (unlike canvases) — reload to resolve |
| 7.6 ⛔ | emailed `/sign/{token}` or `/shared/{token}` link | Open a **real emailed** link | The recipient pages are built and work when hit directly | ⚠️ A real email link currently opens **raw JSON**, because `SERVER_HOST` points at the API host, not the FE origin. Test by visiting `/sign/{token}` on the **FE** origin directly. Backend-blocked |
| 7.7 ✅ | `/documents/[id]` editor | **Add / remove / reorder** sections (drag the grip handle **or** use up/down), edit **headings**, then Save | The full `sections[]` saves via `PUT /documents/{id}` | Explicit **Save** (documents don't autosave — 409 conflict model, item 7.5). Headings were previously read-only |
| 7.8 ✅ | `/sign/{token}` (visit on the FE origin) | Review the inline doc preview, type your name → see the **signature-font "adopt"** render, tick **consent**, Sign | `POST /sign/{token} {typed_name}` records it; success/invalid states shown | Typed-signature only — **no drawn pad** (the API stores `typed_name`). The consent checkbox gates the Sign button |

---

## What will look broken — but is EXPECTED (⛔ backend-blocked)

Don't file these as FE bugs; they're waiting on the API team:

1. **Assessment** (`/assessment*`) — questions arrive with **no prompt text** from the
   backend, so the FE can't render real question copy. Pages are ready; blocked until
   `serialize_question` returns a `prompt`.
2. **AI-fill** (Business Builder) — enqueues (202) but no worker completes it. Stub says
   "coming soon" (item 5.7).
3. **Journal writes** — `500 JOURNAL_NOT_CONFIGURED` until the encryption key is set
   (item 6.4).
4. **Emailed sign/share links** — open raw JSON until `SERVER_HOST` points at the FE
   origin (item 7.6).
5. **MFA — SMS + disable** — TOTP works (items 1.9/1.10), but the **SMS** option is a
   `FeatureNotEnabled` stub (greyed) and there is **no disable/reset** endpoint, so
   enabling 2FA is one-way. Also confirm `MFA_ENCRYPTION_KEY` in prod (set on staging).

**Designed screens with no endpoints at all** (FE ready to build once the API ships —
see [`docs/backend-requests-ui-gaps.md`](../backend-requests-ui-gaps.md)): **Team
Directory** (no members API), **Notifications → Archived** (no archive endpoint),
**Journal → Retrospectives** and **Calendar reminders** (no such objects). These pages
either don't exist yet or are intentionally mock — not test targets.

## What is intentionally fake (🚫 mock-only — no backend exists)

Not integrated because there's no endpoint yet — **don't test these as real**:
Marketing, Sales, Finance, Validation, Funding, Investor-Readiness, Legal &
Compliance hubs; Notifications "Digest/quiet-hours" & "Announcements"; Calendar,
Analytics/Reports, Marketplace, Admin/Super-Admin.

---

## Quick sign-off grid

- [ ] 1. Auth / session / refresh / onboarding / dashboard **+ MFA (setup/challenge) + invite-accept**
- [ ] 2. Health score (+ dimensions/history/benchmarks/recommendations) **+ charts (radar/history/trend)**
- [ ] 3. Mission (today / actions / settings / history)
- [ ] 4. Roadmap (tree / CRUD / dependencies / templates / replan) **+ Kanban DnD + re-plan diff**
- [ ] 5. Business Builder (canvases / records / suggestions / positioning / ai-fill stub) **+ canvas edit-in-place + reorder**
- [ ] 6. Notifications / journal / learning
- [ ] 7. Documents (files / sharing / e-sign / templates / editor / recipient pages) **+ section editing + adopt-&-sign**
