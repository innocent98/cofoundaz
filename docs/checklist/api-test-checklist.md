# Cofoundaz — API Integration Test Checklist (manual QA)

Your hands-on test plan for every **integrated** area (auth → documents, plus the
AI Co-Founder enrichment features — the LLM worker drains on staging now, so
AI-fill and the business-plan generator produce real content). Each row says **where**
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
| 1.7 ✅ | `/dashboard` | Load the dashboard | Widgets populate from `GET /dashboard/summary`; greeting, health, mission, KPIs, briefing/risks/opportunities, and the **real** "Next 7 days" (`upcoming`) all show real data | KPIs with no backend series show **"Coming Soon"** (not fake `$0`); a per-card failure shows **"Unavailable" + Retry**; no seeded fake notifications/tasks/schedule |
| 1.8 ✅ | `/dashboard` | Look at the AI Briefing card actions | Only **"Tell me more"** (opens the AI co-founder drawer) — the old **"Do it"** button is **gone** | "Do it" was removed: it faked completing a task with no backend (no action endpoint exists). "Tell me more" must open the AI drawer |
| 1.9 ✅ | sidebar → **Security (2FA)** / `/setup/mfa` | Set up an authenticator: scan the QR (or copy the key), enter the 6-digit code, save the backup codes | `POST /auth/mfa/totp/setup` → `{secret, otpauth_uri}`; `POST …/totp/verify` → `{enabled, backup_codes}` | ⚠️ **Enabling is one-way — no disable endpoint yet, so use a throwaway account, NOT the shared test one.** **SMS** option is greyed "coming soon" (backend `FeatureNotEnabled`). Needs `MFA_ENCRYPTION_KEY` set (it is on staging) or every call 500s |
| 1.10 ✅ | `/login` with a 2FA-enabled account | Log in → 6-digit challenge → enter the code (or a backup code) | Login returns `{mfa_required, mfa_ticket}` (no token); `POST /auth/mfa/challenge {mfa_ticket, code}` → tokens | The "Use a backup code" toggle accepts a saved code. Deep-linking `/login/mfa` with no ticket bounces to `/login` |
| 1.11 ✅ | `/invite/{token}` | Open an invite link — try both logged out **and** logged in | `GET /invitations/{token}` previews inviter/workspace/role; `POST /invitations/accept` joins + lands `/dashboard` | Logged out → login/signup CTAs (login returns you here to accept). ⚠️ Logged in as a **different email** than invited → "log in with {email}" mismatch banner. Expired/used → 404 "no longer valid" |
| 1.12 ⚠️ | `/dashboard` | Force a load failure (e.g. go offline, then open/refresh) | `GET /dashboard/summary` fails → an **"Unable to load dashboard" card with Retry** | ⚠️ Must show an **honest error**, never a fabricated "new account" (health 0 / "complete your assessment") |
| 1.13 ✅ | `/dashboard` | Scroll the **Team activity** feed; click "load more" if present | `GET /dashboard/activity` — each row shows the **full sentence** (e.g. "Ade rejected 'QA snooze check'") and a **real relative time** (e.g. "13d ago"); keyset pagination pages older items | ⚠️ Must **not** show "{name} ." with blank action or "just now" on every row (the old bug). Empty → honest empty state |
| 1.14 ✅ | `/onboarding` | Fill the first steps and watch the side panel | Once key details are in, an **AI co-founder calibration message** appears (`ai_panel` on `GET/PATCH /onboarding/state`) | Prose text; appears when the backend has generated/templated it |
| 1.15 ✅ | left sidebar (any dashboard page) | Look at the workspace switcher (top) and your profile (bottom) | Both show **your real data** from `GET /onboarding/state`: your startup **name** + **stage** + uploaded **logo** (top), your **name** + **role** (bottom) | ⚠️ Must **not** show the old placeholders **"Kolo"/"Validation stage"** or **"Amara Okafor"/"Founder"** for every account — a different account must show its own name/logo. No logo → first letter of the name |
| 1.16 ✅ | left sidebar → **workspace switcher** (top) | Click the workspace box | A dropdown opens: your workspace(s) with a check on the active one, plus **Account & profile** and **Settings & billing** links | Clicking outside or pressing Esc closes it. The Cofoundaz logo above it must be **visible** (it was dark-on-dark before) |
| 1.17 ✅ | left sidebar → **profile** (bottom) | Click your name/avatar at the very bottom | A menu opens with your **name + email**, **View account**, **Settings & billing**, and **Log out** | **Log out** signs you out (`POST /auth/logout`), clears the session and returns you to `/login` |
| 1.18 ✅ | `/account` (via the menus) | Open **Account & profile** / **View account** | A read-only page shows your real **name, email, role, country** and your **workspace name + stage + logo** from `GET /auth/me` | ⚠️ Editing and **Change photo** are intentionally **disabled / "coming soon"** — there's no backend update/avatar endpoint yet (not a bug). A **Log out** action is also here |
| 1.19 ⛔ | **AI Co-Founder** (`/ai` page + the floating chat drawer) | Open it; type a question (e.g. "How long is my runway?") and send | A **"Coming soon"** state; sending returns an **honest** "the AI Co-Founder isn't connected yet" reply | ⚠️ Must **not** fabricate an answer (no invented runway figures, sources, or action chips) — the chat has **no backend** (BE guide confirms only `GET /ai/status` exists). The real AI shows up as the dashboard briefing, mission reasons, and health tips |

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
| 5.7 ✅ | any canvas **or** record page (personas / competitive / pricing / revenue) | Click **Fill with AI / Draft with AI** | Button shows "Drafting…", then **polls the job** (`GET /jobs/{id}`), and on success flips to "**AI draft added**" and the content **auto-refreshes** with real AI drafts — no manual reload | Takes ~30-60s. If it runs long → honest "taking longer, reload/try again" (never a fake result). A record whose fields are already filled shows "added" with no visible change (it only fills empties) |
| 5.10 ✅ | `/business-builder/plan` (AI business plan) | Click **Generate business plan**; wait | `POST /plan/generate` → **202**; the page polls `GET /plan` and, on complete, shows a **10-section** preview with real content + **Open in Documents** (opens the editable `business_plan` Document) | Takes up to ~2 min. If it runs over, you get an honest "taking longer, try again" (never a fake result). Non-editor roles get a "founder/editor only" message (403). A page refresh mid-run safely resumes |
| 5.8 ✅ | `.../business-model-canvas`, `/value-proposition`, `/swot` | **Click an item to edit it in place**; **drag an item by its grip handle to reorder** within a block | Both autosave the full block via `PUT /canvases/{type}` | Edit: Enter/blur commits, Escape cancels, emptying it removes the item. Reorder stays **within one block**. `mission-vision` is text-only; `lean-canvas` doesn't have these yet |
| 5.9 ✅ | any canvas (AI draft) + AI usage display | Check the AI budget guardrail | `GET /ai/status` → when the workspace is **over its daily AI budget**, AI-draft buttons show "**AI draft paused (until <reset>)**" instead of running; usage display shows tokens used / "**Unlimited**" when no cap | Honest degradation, never a silent/fake AI result |

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
2. **AI-fill** (Business Builder) — **now fully working** (no longer blocked): the worker drains
   on staging and the FE polls the job + auto-refreshes the canvas/records with real AI content
   (item 5.7).
3. **Journal writes** — `500 JOURNAL_NOT_CONFIGURED` until the encryption key is set
   (item 6.4).
4. **Emailed sign/share links** — open raw JSON until `SERVER_HOST` points at the FE
   origin (item 7.6).
5. **MFA — SMS + disable** — TOTP works (items 1.9/1.10), but the **SMS** option is a
   `FeatureNotEnabled` stub (greyed) and there is **no disable/reset** endpoint, so
   enabling 2FA is one-way. Also confirm `MFA_ENCRYPTION_KEY` in prod (set on staging).
6. **Dashboard briefing "Do it"** (item 1.8) — **removed**: no
   `POST /dashboard/briefing/{id}/actions/{index}/accept` endpoint exists, so the button
   could never persist anything. "Tell me more" (opens the AI drawer) remains.
7. **Profile / account editing + photo** (item 1.18) — `/account` is **read-only**:
   `/auth/me` is GET-only and `PATCH /onboarding/state` returns `409 ONBOARDING_ALREADY_COMPLETE`
   once onboarding is done, and there's **no user-avatar upload** endpoint. So editing
   name/role, startup name/logo, and the photo are all backend-blocked (shown as
   "coming soon").
8. **AI Co-Founder chat** (item 1.19) — the conversational chat has **no backend**; the
   `/ai` router only exposes `GET /ai/status` (confirmed by the BE's own
   `fe-integration-guide-ai-cofounder.md` §3). The chat shows an honest "coming soon" and
   never fabricates a reply. The real AI Co-Founder is the enrichment features (briefing,
   mission reasons, health recs, etc.).

**Designed screens with no endpoints at all** (FE ready to build once the API ships —
see [`docs/backend-requests-ui-gaps.md`](../backend-requests-ui-gaps.md)): **Team
Directory** (no members API), **Notifications → Archived** (no archive endpoint),
**Journal → Retrospectives** and **Calendar reminders** (no such objects). These pages
either don't exist yet or are intentionally mock — not test targets.

## What is intentionally fake (🚫 mock-only — no backend exists)

Not wired in the FE yet — **don't test these as real**:
Marketing, Sales, Finance, Validation, Funding, Investor-Readiness, Legal &
Compliance hubs; Notifications "Digest/quiet-hours" & "Announcements"; Calendar,
Analytics/Reports, Marketplace, Admin/Super-Admin. (Note: **Finance + Marketing
now have backend APIs** — those two hubs are wireable; the rest still have no API.)

---

## Quick sign-off grid

- [ ] 1. Auth / session / refresh / onboarding / dashboard **+ MFA (setup/challenge) + invite-accept + dashboard summary/real activity feed + onboarding AI panel + workspace switcher/profile menus/log out + Account page + honest AI Co-Founder chat**
- [ ] 2. Health score (+ dimensions/history/benchmarks/recommendations) **+ charts (radar/history/trend)**
- [ ] 3. Mission (today / actions / settings / history)
- [ ] 4. Roadmap (tree / CRUD / dependencies / templates / replan) **+ Kanban DnD + re-plan diff**
- [ ] 5. Business Builder (canvases / records / suggestions / positioning) **+ canvas edit-in-place + reorder + AI budget guardrail + AI-fill (real polling) + AI business-plan generator**
- [ ] 6. Notifications / journal / learning
- [ ] 7. Documents (files / sharing / e-sign / templates / editor / recipient pages) **+ section editing + adopt-&-sign**
