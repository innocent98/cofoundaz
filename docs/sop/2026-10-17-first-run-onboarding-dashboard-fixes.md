# SOP — First-run fixes: onboarding → dashboard (Auth/Onboarding + Dashboard)

**What shipped (one line):** Fixed the first-run journey from signup to a working dashboard — a brand-new founder previously hit a broken verify flow, a hardcoded tab title, and a dashboard that **422'd on every endpoint**. Branch `fix/first-run-onboarding-dashboard` → PR to `develop`.

## Why
Walking the app end-to-end from a fresh throwaway account (local full-stack) surfaced real first-run breakage:
- The browser tab read **"Kolo"** (a hardcoded startup name at the product level).
- The email-verify link dumped the (already-logged-in) user back at `/login`, with a **"Cofaundaz" typo** and literal **"?"** glyphs where icons belong.
- **Critical:** after completing onboarding, the dashboard 422'd on `/dashboard/summary`, `/dashboard/activity`, `/notifications`, `/health-score` — **every tenant-scoped call**. Root cause: the workspace is created *during* onboarding, but the signup/login session never synced `cf_workspace_id`, so no `X-Workspace-Id` header was sent. This hit **every new founder**.

## How (approach + decisions)
- **Tab title** (`app/layout.tsx`): replaced `title: 'Kolo'` with a branded default + template `{ default: 'Cofoundaz', template: '%s · Cofoundaz' }`. Per-page titles are added as each page is reviewed.
- **Verify flow**: the email-link handler (`components/auth/verify-email-client.tsx`) now shows *"You're verified. Let's build."* with a check icon and **continues into the app** (`/dashboard`, guard routes to onboarding if incomplete) instead of bouncing to `/login`. Fixed the `/verify` page typo + swapped the `?` placeholders for real `CheckCircle2`/`Mail` icons.
- **First-run 422 (the important one)**: added `syncActiveWorkspace()` (`lib/auth/post-login.ts`) that re-reads `/auth/me → active_workspace_id` and persists `cf_workspace_id`; it's called in onboarding `handleComplete` **before** routing to `/dashboard`. Confirmed the dashboard 200s once the header is present.
- **Dashboard**: fixed a stale `/app/health` link → `/health`; added a proper empty state to Today's Mission when the mission exists but has 0 tasks (pre-assessment).
- **Onboarding copy** nit on step 1 cleaned up.

## What's involved (files)
- `app/layout.tsx` — branded title.
- `components/auth/verify-email-client.tsx`, `app/(auth)/verify/page.tsx` — verify flow + icons + typo.
- `lib/auth/post-login.ts` (`syncActiveWorkspace`) + `app/(auth)/onboarding/page.tsx` — workspace-id sync.
- `app/(dashboard)/dashboard/page.tsx` — `/app/health`→`/health`, mission empty state.
- `ui/onboarding/onboarding-wizard.tsx` — step-1 copy.
- `docs/checklist/app-review-audit.md` — the review ledger (new).

## Verification
- **Live**, local full-stack (local FastAPI + worker + Postgres/Redis; `npm run dev` → local API): fresh throwaway signup → verify → login → onboarding (all 6 steps + every CTA tested) → dashboard. The onboarding AI calibration panel rendered **real OpenAI prose** (pipeline confirmed). Dashboard loads with greeting, pending-assessment health, honest empty/coming-soon states.
- **Gates (local, mirror CI):** `npm run typecheck` ✓, `npm run lint` ✓, `npm test` (229) ✓, `npm run build` ✓.

## Follow-ups (tracked in `docs/checklist/app-review-audit.md`)
- D3: first-run calibration banner (PRD) — small FE add.
- D5: rename misspelled `components/CofaundazLogo.tsx` component.
- A3 note: the onboarding AI panel is a single `ai_panel` string; the PRD's richer streaming assistant is beyond current BE.
- Verify routes `/verify` + `/verify-email/{token}` are duplicated — candidate for consolidation.
- Larger: build the backends behind the dashboard's honest "coming soon" — Assessment prompts, AI Co-Founder chat, dashboard KPIs (Finance/Sales/Marketing), team invite.
