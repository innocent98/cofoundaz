# App Review Audit — FE↔BE functionality walkthrough

**Started:** 2026-10-17 · **Environment:** fully local (local FastAPI stack + `npm run dev` → `API_PROXY_TARGET=http://localhost:8000`) · **Account:** throwaway founder (local dev DB).

Working ledger for the end-to-end review: every page is compared **PRD intent → live behaviour → BE contract**, then bucketed:
- **B1 works** — verify only.
- **B2 broken/mock** — should work; fix (FE wiring or unblock BE).
- **B3 not built** — no backend yet; must show an honest "coming soon" (correct, not a bug).

> Complements the master checklist `docs/checklist/frontend.md` (reconcile fixes back into it) and the BE gap log `docs/backend-requests-ui-gaps.md`. This file tracks the review pass itself.

## Legend
Severity: 🔴 high · 🟠 med · 🟡 low. Status: ⬜ open · 🟣 in progress · ✅ fixed.

---

## Module 01 — Auth & Onboarding (first-run flow)

**Flow confirmed live:** signup → verify-email → login → `/onboarding` (wizard). Signup `POST /auth/signup` 201 + auto `POST /auth/login` 200; onboarding reads `GET /api/v1/onboarding/state` 200. Core path **works**.

| ID | Area | PRD intent | Actual (live) | Bucket | Sev | Status |
|----|------|-----------|---------------|--------|-----|--------|
| A1 | Global browser tab title | Brand "Cofoundaz" + per-page `"%s · Cofoundaz"` | Hardcoded `title: 'Kolo'` in `app/layout.tsx:5` (every page inherits "Kolo") | B2 | 🟠 | 🟣 root default+template fixed → tab reads "Cofoundaz" (verified live); per-page `title` added per page as we walk |
| A2 | Verify-email success | "You're verified. Let's build." → **Continue → MFA setup** | Email-link handler bounced to **/login** despite the user being auto-logged-in; `/verify` page had typo "Cofaundaz" + literal "?" placeholder glyphs | B2 | 🟠 | ✅ fixed — link handler now shows "You're verified. Let's build." + check icon and continues to /dashboard; /verify typo fixed + real check/mail icons |
| A3 | Onboarding "AI Assistant" | PRD: persistent streaming assistant. BE contract `fe-integration-guide-onboarding-ai-panel.md` provides a single `ai_panel` string | **False positive** — `OnboardingAiPanel` is built + unit-tested; renders real OpenAI calibration prose at step 6 (verified live) | B1 | 🟠 | ✅ verified live; PRD's richer streaming assistant is beyond current BE (ai_panel string only) → logged as BE follow-up |
| A4 | Onboarding step 1 copy | H2 "First, about you" | sub was "let's set up your profile credentials and role…" (lowercase, awkward) | B2 | 🟡 | ✅ fixed → "Let's set up your profile and your role in the startup." |
| A5 | Verify route naming | `/verify-email` | two verify entry points: `/verify` (post-signup) + `/verify-email/{token}` (email link), duplicated logic | B2 | 🟡 | ⬜ deferred — cosmetic; consolidation is a refactor |
| A6 | MFA setup | MFA setup after first login (skippable, nag banner) | not surfaced in first-run; flow decouples MFA (`/setup/mfa` exists; SMS "Coming soon") | verify | 🟡 | ⬜ note — revisit in MFA module |
| A7 | Signup terms checkbox | — | programmatic value-set didn't toggle the styled checkbox (needs a real click) | note | 🟡 | ⬜ automation-only; not user-facing |

**Onboarding wizard deviations from PRD (design choices, not bugs — logged):** 6 steps ending at **Team Invites → "Complete Setup" → /dashboard**; the PRD's step-6 **kickoff assessment is decoupled** (reached via the dashboard calibration banner); logo moved to step 5; goal options reworded. **All 6 steps + every CTA tested live** (Continue, Back, model+stage chips, goal cap of 3, add-invite, Complete Setup). Gates green: typecheck, lint, 229 unit tests, production build.

---

## Module 01↔02 bridge

| ID | Area | Issue | Bucket | Sev | Status |
|----|------|-------|--------|-----|--------|
| D1 | First-run dashboard load | After onboarding, the dashboard **422'd on every tenant endpoint** (summary/activity/notifications/health-score). Root cause: the workspace is created *during* onboarding, but the signup/login session never synced `cf_workspace_id`, so no `X-Workspace-Id` header was sent — a race that hit every brand-new founder. | B2 | 🔴 | ✅ fixed — new `syncActiveWorkspace()` (`lib/auth/post-login.ts`) re-reads `/auth/me`, called in onboarding `handleComplete` before routing to /dashboard. Dashboard confirmed loading with the header present (final proof: fresh-onboarding e2e pending) |

---

## Module 02 — Founder Dashboard

Dashboard loads and is **largely solid, honest, and wired** (and, since 2026-10-18, complete against the PRD: see `dashboard-prd-gaps.md`): greeting (Victor/NovaPay), Health card (pending-assessment prompt), Today's Mission, AI Briefing, KPI strip, Risks/Opportunities, Team activity, Next-7-days — real data + proper error/empty states.

| ID | Area | Issue | Bucket | Sev | Status |
|----|------|-------|--------|-----|--------|
| D2 | Health card CTA | "See what's driving it →" linked to `/app/health` (stale PRD prefix) → broken route | B2 | 🟠 | ✅ fixed → `/health` |
| D4 | Today's Mission | blank card when mission exists but 0 tasks (empty-state only covered the `null` case) | B2 | 🟡 | ✅ fixed — added empty-state copy + Go-to-mission |
| D3 | First-run calibration banner | PRD specifies a top "running on defaults / Complete your assessment" banner; absent (only Health-card copy nudges; no direct CTA to `/assessment`) | B2 | 🟠 | ✅ fixed 2026-10-18 — `CalibrationBanner` shows when `calibration.assessment_complete === false` (PRD copy + **Complete assessment**); SOP `2026-10-18-dashboard-prd-complete` |
| D5 | CofaundazLogo component | `components/CofaundazLogo.tsx` misspelled identifier (renders brand text fine, so not user-visible) | B2 | 🟡 | ⬜ code-quality rename |

**Verified honest / working (not bugs):** AI Co-Founder drawer → honest "Coming soon — chat isn't available yet; already works behind the scenes (briefing, mission reasons, health tips)"; "+ Invite" → was honest "coming soon" (now wired, 2026-10-18); KPI strip → "Coming Soon" deep-linking to hubs; "Do it" briefing action already removed (was faked). CTAs tested: health link (fixed), mission link, KPI deep-links, Tell-me-more (opens AI drawer).

**Real blockers behind the honest "coming soon" (each its own module):**
- **Assessment** (BE-blocked: missing question prompts) — dashboard/health/mission all nudge here; medium BE fix; next in journey order.
- **AI Co-Founder chat** (no conversation endpoint) — large BE build (conversations/messages/streaming).
- [x] **Dashboard KPIs** — FE tiles wired to BE `kpis.metrics` (Revenue / Runway / Campaign CTR live, honest state per status; 2026-10-17, SOP `2026-10-17-dashboard-kpi-tiles-wiring`). Pipeline stays Coming Soon (no Sales backend). Remaining: Finance/Marketing/Sales hubs still mock, so the `no_data` CTA lands on a mock page. Marketing hub wired to the real backend (PR #102). Finance hub wired to the real API (PR #103).
- [x] **Team invite from dashboard** — BE `POST /team/invitations` (#131) + FE modal wired 2026-10-18 (founder only; created/skipped/undelivered, per-row 422, 403/429). SOP `2026-10-18-dashboard-prd-complete`.
- [x] **Dashboard PRD walkthrough (20 gaps)** — all closed 2026-10-18, each verified live (founder + invited mentor, desktop + 375px). Per-row evidence: `docs/checklist/dashboard-prd-gaps.md`.

## Known BE-blocked (to review/unblock this pass)
AI Co-Founder chat (no conversation endpoint) · Assessment question prompts missing · Journal writes (key — set locally ✓) · MFA disable + SMS · emailed sign/share link host · post-onboarding profile/avatar edit. (`docs/backend-requests-ui-gaps.md`)


## Module 12 — Finance Hub

All seven pages wired to the real `/api/v1/finance/*` API and verified live on 2026-10-17 (SOP `docs/sop/2026-10-17-finance-hub-wiring.md`). No mock data remains.

| ID | Area | Status |
|----|------|--------|
| F1 | Cash flow and transactions (add, edit, categorize, delete, runway banner) | ✅ wired, verified live |
| F2 | Runway (scenarios, save assumptions) | ✅ wired, verified live |
| F3 | Invoices (create, edit, send, mark paid/unpaid, delete, auto-remind, print) | ✅ wired, verified live |
| F4 | Expenses (CRUD, receipts, recurring, breakdown) | ✅ wired, verified live |
| F5 | Budgets (CRUD, draft from actuals, copy last month) | ✅ wired, verified live |
| F6 | Financial model (async generate, statements, sensitivity, CSV) | ✅ wired, verified live |
| F7 | Integrations (bank, QuickBooks, Xero, Stripe) | B3 not built: honest "Not connected" and disabled "Coming soon" (needs OAuth and real third-party accounts) |
| F8 | Fabricated "Connected as GTBank / Stripe" state | ✅ removed |
| F9 | Finance header "+ Invite" (dead button, no invite endpoint) | ✅ removed from Finance layout |

---

## Module 10 — Marketing Hub (wired 2026-10-17)

All eight pages now run on the real `/api/v1/marketing/*` backend; every number comes from the API and every CTA performs a real action. SOP: `docs/sop/2026-10-17-marketing-hub-wiring.md`.

- [x] Overview: real tiles (scheduled, active campaigns, top channel, AI ideas) + "this week's idea" from content gaps
- [x] Calendar: month grid from API, create / edit / publish / delete, unscheduled backlog, AI "Plan my first week" with per-post and Add all accept
- [x] Campaigns: 4-step wizard, AI channel split (Apply), launch / pause / resume / complete / edit / delete, segment targeting
- [x] AI copy: real generation (poll to ready), More like this, Save to calendar, history, content-gap handoff
- [x] Channels: 8 real cards, status + own notes, AI fit notes generation
- [x] SEO: keywords CRUD, AI content gaps + Write it, on-page checklist, positioning statement
- [x] Segments: CRUD, persona link, used-in + delete warning
- [x] Analytics: funnel, gap-filled traffic, CAC by channel, leaderboard, range switch, Record metric (ingestion form)
- [x] Loading / empty / error / "not available for your role" states on every page
- [ ] Honest "coming soon": rule-based segment counting, campaign duplicate, calendar drag-to-reschedule, Marketing-hub "+ Invite" (removed; no hub-level invite flow)

## Module 04 — Today's Mission (2026-10-18)

Complete against the PRD: all 15 gap rows closed (`mission-prd-gaps.md`), verified live as founder and team member at 1440px and 375px. SOP `2026-10-18-mission-prd-complete`. Open: BE snoozed tasks keep the day pending (no completion or streak); the no-roadmap empty state could not be reached live (unit-tested); other section layouts still use their own headers instead of `ShellTopBar`.
