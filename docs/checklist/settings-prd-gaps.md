# Settings (+ Billing): PRD and UI gap list (2026-10-27)

Source of truth: `Cofoundaz_Technical_PRD.md` §2.1 (shell: "Settings & Billing `/app/settings`", avatar menu Profile / Preferences /
Sign out, Accountant sees only Settings/Profile), §01.4 (MFA), §03.5 (AI settings), §20.2/20.3 (notification preferences, digest, quiet
hours), Module 24 (Subscription & Billing 24.1 to 24.5, API, entities, events) and §2.2 (Idempotency-Key on billable POSTs). The designed
UI is `# Cofoundaz Web App UI Build/Subscription & Billing.dc.html`; the built page is `app/(dashboard)/settings/page.tsx` (989 lines).

**How this was walked, honestly:** the built-in browser refused `http://localhost:3000` (navigation denied twice), so **no 1440/375
click-through was possible in this pass**. What was done instead: the page source read end to end, the designed UI read, and every
control mapped to the raw API (live `curl` against the running API on :8000 as `throwaway-founder@example.com`, workspace NovaPay).
The hand re-walk of every control at 1440 + 375 for every role stays a to-do for the FE session / lead after the BE lands.

## Build status (updated 2026-10-27, BE only; FE not started)

- **PR 1, `feature/settings-be`** (migration 0077): S1 to S7, S9 built and live-captured. S8 (AI preferences) not built (owned by the AI
  Co-Founder page). S10 built as founder-only billing access: the PRD's team-member "billing grant" has no storage, so there is no grant yet.
  Guide: `cofoundaz-api/docs/fe-integration-guide-settings.md`.
- **PR 2, `feature/settings-billing`** (stacked on PR 1, migration 0078): B1 to B13 built **to the recommended defaults of D-SET-1 to 14**,
  because no answers had come back. Every default is a data or flag change: prices and plan contents live in `billing_plans`, the gate is dark
  behind `PLAN_ENFORCEMENT`. Guide: `cofoundaz-api/docs/fe-integration-guide-settings-billing.md`. **Not exercised live:** Paystack's hosted
  checkout page, a real charge and Paystack's own webhook delivery (see that guide's verification table).
- **Deviations from the defaults:** "never expire" credit packs carry over through a monthly overage calculation (approximate); the per-feature
  usage breakdown is empty (not recorded); read-only mode, seat/storage add-ons, "pause", the payment-failed email and the TM billing grant are
  follow-ups.

## What `/settings` is today

- `app/(dashboard)/settings/page.tsx` is **only the Billing screen, and 100% mock**: six tabs (Overview, Plans, Usage, Invoices,
  Payment, Add-ons), `useState('Starter')`, hardcoded invoices / usage rows / daily bars, "Downgrade scheduled" toasts that call nothing.
  There is **no `/billing` route in the API** (`GET /billing/subscription` is 404) and no `plans` / `subscriptions` tables.
- `app/(dashboard)/account/page.tsx` (the avatar-menu "Profile") is **read-only**: Full name, Email, Role, Country, Workspace name,
  Your role here. Nothing is editable except what `PATCH /auth/me` accepts (full name, once, elsewhere).
- Already real elsewhere (not Settings gaps): mission settings (`GET/PATCH /missions/settings` → `{mission_size:3, delivery_time:"06:00:00",
  weekend_missions:false}`), notification master/category prefs (`GET/PUT /notifications/preferences`), team invitations.

## Decisions needed from Adebayo (D-SET-n), each with the lead's recommended default

Billing cannot be built to the end without these. Items marked **(blocks)** change what I build; the rest I build to the default and
can change cheaply.

| # | Question | Recommended default |
|---|---|---|
| **D-SET-1 (blocks)** | Plan names, NGN prices, annual price | Take the designed UI as given: **Starter** free · **Growth** ₦24,000/mo or ₦240,000/yr · **Scale** ₦68,000/mo or ₦680,000/yr (2 months free annually). Stored as kobo in a `billing_plans` table, so changing a price is a data change plus a new Paystack plan code, not a deploy. |
| **D-SET-2 (blocks)** | What each plan unlocks | The design's lists: **Starter** core AI Co-Founder, Roadmap, Health Score, Business Builder, Documents, 500 AI credits/mo, 1 seat. **Growth** + Marketing, Sales, Finance, Validation hubs, Analytics, 5,000 credits, 5 seats. **Scale** + Funding, Investor Readiness, Legal, priority support, 20,000 credits, unlimited seats. Mentors, investors, lawyers and accountants stay free on every plan (PRD FAQ). |
| **D-SET-3 (blocks)** | Does enforcement start now? Today Marketing/Sales/Finance/Validation are in use for every workspace | **Build the gate, ship it dark.** A reusable `require_feature("...")` dependency reads a `PLAN_ENFORCEMENT` env flag (default off in every environment). Turning it on is a deliberate step. Existing workspaces get a free Growth trial (D-SET-4) when it is turned on, so nobody is locked out the day it flips. |
| **D-SET-4 (blocks)** | Trial length | **14 days of Growth, no card**, once per workspace, started when enforcement turns on (existing) or at signup (new). After it ends the workspace drops to Starter, never to read-only. |
| **D-SET-5 (blocks)** | D-SAL-11: does the Sales outreach paid-plan gate flip on when Billing ships? | **Gate is wired, flag off.** Outreach send requires Growth or higher once `PLAN_ENFORCEMENT` is on. It stays ON for everyone until you flip the flag (your 2026-10-24 "leave it on for now"). |
| **D-SET-6 (blocks)** | Proration and plan changes | Paystack has no proration, so we compute it. **Upgrade:** charge the prorated difference now on the saved card, switch the Paystack plan, limits apply immediately (PRD copy). **Downgrade:** takes effect at the end of the paid period; nothing is charged or refunded. **Monthly to annual:** treated as an upgrade, credit for unused days. |
| **D-SET-7 (blocks)** | Cancellation | **Cancel at period end** (`subscription/disable`; access runs to `current_period_end`, data kept 90 days as the PRD says). Reason stored for the retention sheet. "Pause for 2 months" (in the design) is **not built** unless you want it. |
| **D-SET-8** | Failed payment | **7 days grace** (PRD), banner counting days left, then the workspace drops to Starter limits. The PRD's "read-only mode" needs a workspace-wide write block across ~30 routers; recommended **not now**, as a follow-up behind the same flag. |
| **D-SET-9** | AI credits meaning | **1 credit = 50 LLM tokens** (so a ~24k-token business plan is ~480 credits, near the design's usage table). The meter reads the existing `llm_usage_daily` tokens. The monthly cap is enforced only with the flag on; the existing 100k tokens/day abuse guard stays. |
| **D-SET-10** | Add-ons | Ship **AI credit packs** (2,000 for ₦8,000; 10,000 for ₦32,000; one-time Paystack charge, never expire). **Extra seat** and **extra storage** are listed but need recurring add-on billing: recommended later. |
| **D-SET-11** | Add / replace a card (Paystack has no SetupIntent) | Hosted Paystack checkout for a ₦50 charge that is **refunded straight away**; the saved authorization becomes the card. Cards come only from Paystack's `charge.success` data (brand, last4, expiry, reusable); we never see a PAN. |
| **D-SET-12** | Invoice PDF | We generate our own receipt PDF per paid charge (reusing the Documents PDF writer). Paystack's own receipt emails still go out. |
| **D-SET-13** | Settings hub scope | Hub tabs: **Profile, Security, Workspace, Notifications, AI preferences, Billing**. Notifications and AI preferences deep-link to their existing pages / pages the Notifications and AI sessions own. I build the missing Profile/Security/Workspace APIs. |
| **D-SET-14** | Delete account / workspace | **Not self-service in this slice.** "Download my data" (JSON export) and "Delete account" request (queued, confirm by email) are recommended as the next slice. |

## Gaps: Settings (non-Billing)

Severity: **Sec** > **High** > **Med** > **Low**.

| # | Gap | Evidence | Sev | Plan |
|---|---|---|---|---|
| S1 | **Profile is read-only; `PATCH /auth/me` silently drops fields.** Sent `{"role_title":"CEO","country":"NG"}`: 200, nothing changed, no error. | live curl, `auth/me.py` `MePatch` only has `full_name`, `extra="ignore"` | High | Accept `full_name`, `role_title`, `country` (ISO-2), `phone`; reject unknown fields with a field error instead of ignoring. |
| S2 | **No avatar upload.** `profile.avatar_url` exists, no endpoint. Onboarding has `POST /onboarding/logo` for the workspace only. | openapi | Med | `POST /auth/me/avatar` (same image rules as the logo: type, size, magic bytes), `DELETE`. |
| S3 | **No change-password for a logged-in user.** Only forgot/reset by email. | `POST /auth/password/change` 404 | High | `POST /auth/password/change {current_password, new_password}`: verifies current, applies the signup password policy, revokes every other session, audit row, email notice. |
| S4 | **MFA can be turned on but never off, and backup codes are shown once.** No status, no disable, no regenerate; SMS endpoints are seams. | `auth/mfa.py`, `auth/seams.py` | High | `GET /auth/mfa` (status, remaining backup codes), `POST /auth/mfa/disable {password, code}`, `POST /auth/mfa/backup-codes/regenerate {password}`. SMS stays a seam (no SMS vendor, PRD marks TOTP recommended). |
| S5 | **No "where I'm signed in".** `auth_sessions` has ip, user_agent, created_at, revoked_at but nothing reads it. | `db/models/auth.py` | Med | `GET /auth/sessions` (current marked), `DELETE /auth/sessions/{id}`, `POST /auth/sessions/revoke-others`. Refresh-token families are revoked together. |
| S6 | **Workspace settings have no home.** Name, description, website, industry, logo are edited only via the onboarding wizard (`PATCH /onboarding/state`), which is resumable-draft logic, not a settings API. Mentors/consultants cannot be told apart from a founder in the UI. | `onboarding/state.py` | Med | `GET/PATCH /workspace` (founder only; TM read): name, description, website, industry, business model, stage, country, logo via the existing endpoint. Audit row. |
| S7 | **Notification digest + quiet hours are FE-only mock state** (`digestMode`, `quietFrom`, `quietUntil` are `useState`; `GET /notifications/preferences` returns only `master_email` + 5 categories). PRD 20.2/20.3: quiet hours, daily/weekly digest, critical alerts locked on. | `notifications/page.tsx` lines 41-50, live GET | Med | Persist `digest_mode` (`realtime`/`daily`/`weekly`), `digest_time`, `digest_day`, `quiet_hours {from,to,tz}` and a `locked` list on the preferences payload. **Sending the digest email is not built** (own slice, owner: Notifications). |
| S8 | **AI preferences have no API** (`/ai/settings` 404): proactive suggestions, daily briefing, tone, "What I remember" list, Forget, Clear all. | PRD 03.5, live 404 | Med | Only if D-SET-13 puts it in this slice; recommended **owned by the AI Co-Founder page** (it needs the memory store that does not exist yet). |
| S9 | **No audit trail of account changes** for users (password, MFA, sessions) visible to them; `write_audit` is called for MFA only. | `platform/audit` | Low | Audit rows on every Settings write; no UI. |
| S10 | **Role gating for the hub is undefined.** PRD: Accountant sees only Settings/Profile; mentors/consultants/investors also reach `/settings`. The billing tab must show "Billing is managed by your workspace founder." to non-billing users. | PRD 24 access line, `team_member` has a `billing` grant toggle (F-only) that nothing reads | High | `require_billing_access` dependency: founder, or TM with a `billing` grant. 403 body carries the PRD copy. Profile/Security are open to every role. |

## Gaps: Billing (all new; built in the second PR once the D-SET calls land)

| # | Gap | PRD | Sev | Plan |
|---|---|---|---|---|
| B1 | **No billing data model.** | 24 entities | High | `billing_plans`, `billing_subscriptions`, `billing_customers`, `billing_payment_methods`, `billing_invoices`, `billing_addon_purchases`, `billing_webhook_events` (idempotency), `billing_trials`. |
| B2 | **No plans API.** | 24.1 | High | `GET /billing/plans` (public-safe list with kobo prices and entitlements). |
| B3 | **No subscription state / checkout.** | 24.1 | High | `GET /billing/subscription`, `POST /billing/subscription/checkout {plan, interval}` → Paystack `transaction/initialize` with the plan code → `authorization_url`; `GET /billing/subscription/verify?reference=` for the callback return. |
| B4 | **No Paystack webhook.** Must verify `x-paystack-signature` = HMAC-SHA512 of the raw body with the secret key, constant-time, fail closed, size-capped, idempotent by event id/reference. | 24 API | High (Sec) | `POST /webhooks/billing/paystack` (public, no auth, signature only): `charge.success`, `subscription.create`, `subscription.disable`, `subscription.not_renew`, `invoice.create`, `invoice.update`, `invoice.payment_failed`. |
| B5 | **No plan change / proration.** | 24.1 | High | `POST /billing/subscription/preview-change`, `POST /billing/subscription/change {plan, interval}` with `Idempotency-Key`. |
| B6 | **No cancel / resume.** | 24.1 | High | `POST /billing/subscription/cancel {reason}`, `POST /billing/subscription/resume`. |
| B7 | **No usage meters.** AI credits from `llm_usage_daily`, seats from memberships (professional collaborators free), storage from document bytes, plus 90% threshold event. | 24.2 | High | `GET /billing/usage` with per-feature breakdown and daily series; `billing.usage.threshold` notification once per cycle. |
| B8 | **No payment methods.** | 24.3 | Med | `GET /billing/payment-methods`, `POST .../add` (₦50 checkout), `PUT .../{id}/default`, `DELETE .../{id}` (blocked if it is the only card on an active paid plan: PRD copy). |
| B9 | **No invoices / PDF.** | 24.4 | Med | `GET /billing/invoices`, `GET /billing/invoices/{id}/pdf`. |
| B10 | **No add-ons.** | 24.5 | Med | `GET /billing/addons`, `POST /billing/addons/{id}/purchase` (credit packs). |
| B11 | **No billing details** (company name, TIN, address) the design shows. | design | Low | `GET/PUT /billing/details`. |
| B12 | **No plan gate.** Needed for D-SAL-11 and every PRD "locked by plan" state. | 24, D-SAL-11 | High | `require_feature(feature)` dependency (402-style `PLAN_REQUIRED` with the plan needed), `entitlements(startup)`; flag `PLAN_ENFORCEMENT`; applied to Sales outreach send only in this slice. |
| B13 | **No billing events/notifications.** `billing.payment.failed` (critical, locked ON), `billing.usage.threshold`, `billing.plan.changed`. | 24 events | Med | Register in the notification registry; payment failed also drives the site-wide banner via `GET /billing/subscription` (`payment_issue`, `grace_days_left`). |

## Not walked / not testable here

- Visual states at 1440 and 375 for every role (browser blocked, see top).
- The full Paystack round trip (card entry on the hosted checkout page, a real charge, real webhook delivery from Paystack's servers to
  a public URL): test-mode only, and `localhost` is not reachable by Paystack. The e2e journey signs and POSTs webhook bodies itself
  with the real HMAC; request/response shapes for Paystack's own API come from its documentation and are marked in the FE guide.

## Build order

1. PR 1 `feature/settings-be`: S1 to S7, S9, S10 (+ the `require_billing_access` dependency). Independent of D-SET answers.
2. PR 2 (stacked or from develop): Billing B1 to B13, after D-SET-1 to 8 are confirmed or defaulted.


## Ledger / hand-over (2026-10-29)

| Item | State |
|---|---|
| API PR 1, branch `feature/settings-be` (migration 0077) | Complete: S1 to S7, S9, S10 (founder-only billing access). API PR #195 (head `e3887fcf`), CI gates run locally on a scratch DB: full unit 4425 passed, e2e 98 passed. |
| API PR 2, branch `feature/settings-billing` (migration 0078, stacked on PR 1) | Built and tested to the **recommended defaults**; draft PR #196 (head `f1a1df11`), draft because Adebayo has not answered D-SET-1, 2, 4 and 6. Opus review done, its High/Medium findings fixed. |
| Where the unanswered values live (one-line changes) | Prices, plan contents, credits, seats, storage: `cofoundaz-api/app/services/billing/catalog.py` (`PLANS`, `ADDONS`) AND the seed inlined in `alembic/versions/0078_billing.py` (`_PLANS`; before release, edit the migration seed or add a data migration, since a deployed DB already holds the rows in `billing_plans`). Trial length: env `BILLING_TRIAL_DAYS` (default 14). Grace: `BILLING_GRACE_DAYS` (7). Proration: `flows.py` `_prorated_credit` / `preview_change`. Enforcement: env `PLAN_ENFORCEMENT` (default off). |
| Left | FE session (Settings hub + Billing tabs); hand re-walk of every control at 1440 + 375 for every role; Adebayo's D-SET answers; S8 AI preferences; digest sender; account deletion/export; read-only mode; seat/storage add-ons; live Paystack round trip (hosted page, real charge, real webhook). |
| Next step | Lead relays D-SET-1 to 7, then merge PR 1, then re-chain PR 2 on develop, then FE sub-session using the two guides in `cofoundaz-api/docs/`. |
