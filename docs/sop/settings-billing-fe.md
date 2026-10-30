# SOP: Settings hub and Billing, front end

## What shipped
`/settings` is now the Settings hub on the real APIs: **Profile, Security, Workspace, Notifications, AI preferences, Billing**
(D-SET-13). The Billing tab group (Overview, Plans, Usage, Invoices, Payment, Add-ons) replaces the old 100% mock page.
Branch `feature/settings-billing-fe`, one PR to `develop`. Backends: Settings BE (a) API #195 and Billing BE (b) API #196.
Contracts: API repo `docs/fe-integration-guide-settings.md` and `docs/fe-integration-guide-settings-billing.md` (live captures).
Gap rows closed (`docs/checklist/settings-prd-gaps.md`): S1 to S6, S9, S10, B1 to B13 on the FE side. **S7 is the Notifications
developer's** (`docs/fe-handoff/notifications.md` section 6; this PR does not touch `app/(dashboard)/notifications/`) and **S8 is done**
(API #201): see "AI preferences" below.

## AI preferences (S8)
`components/ai/ai-preferences-panel.tsx` is the one component behind both Settings → AI preferences and `/ai/settings`: `GET`/`PATCH /ai/settings`
(proactive suggestions, daily briefing, tone), per member per workspace, founder and team member only (others see the API's 403 as a plain message; the
hub hides the tab). Saves are optimistic and roll back with an error toast. "What I remember", Forget and Clear all were removed (no memory store).
The dashboard learned the new `off` status: the briefing card, Risks and Opportunities show a quiet "turn it on in Settings → AI preferences" state
(`hooks/useDashboardApi.ts`, `components/dashboard/{briefing-card,risks-opportunities}.tsx`). Not verified: the real model's tone.

## Why
The Settings page was only a Billing screen, every number hardcoded, and the avatar-menu "Account & profile" page was read-only
with a "coming soon" note. Nothing in either could be saved.

## How
| Area | What changed | Decision or trade-off |
|---|---|---|
| Hub shell | `app/(dashboard)/settings/page.tsx`: tab bar driven by `?tab=` (`profile` default), billing sub-view by `&view=`. Role-aware: AI preferences only for founder and team member (the AI Co-Founder is a core-role feature); every role gets Profile, Security, Workspace (read-only unless founder), Notifications, Billing | `?tab=billing` is kept because the API's Paystack return URL is `<app>/settings?tab=billing` |
| `/account` | Now `redirect('/settings?tab=profile')`, so the sidebar "Account & profile" link and old bookmarks land on the Profile tab | The shared sidebar was not edited |
| Profile | `components/settings/profile-tab.tsx`: name, role, country, phone, avatar upload / remove; only changed fields are sent (unknown fields are a 422); `null` clears country and phone; Log out kept | Client checks (type, 2 MB) mirror the API but the API stays the authority |
| Security | `security-tab.tsx`: change password (sends the stored refresh token in the body so this device survives), 2FA on / backup codes / off with QR and a real TOTP code, "where you're signed in" | See "Sessions trap" below |
| Workspace | `workspace-tab.tsx`: founder edits name, website, description, industry, country, model, stage, logo; everyone else sees it read-only with a notice | |
| Notifications tab | A link card to `/notifications?tab=preferences` | Digest and quiet hours (S7) are the Notifications page's |
| Billing shell | `billing/billing-tab.tsx`: founder only; anyone else sees "Billing is managed by your workspace founder." (the API answers 403 to them on every route except plans). Handles the Paystack return: `?reference=` is verified once and only the `verify` answer decides success | The reference is removed from the URL afterwards so a refresh does not replay it |
| Overview / Plans | `billing-overview.tsx`, `billing-plans.tsx`: plan card, next invoice and card, trial and cancel and past-due banners, cancel sheet with a reason (no "Pause": not built), resume, trial start, plan change through `preview-change` then confirm (upgrade shows the prorated charge, downgrade says what is kept until when), checkout redirect, `Idempotency-Key` per confirm click | Every outcome of change (`applied`, `scheduled`, `checkout`) and the error codes (`NO_PAYMENT_METHOD` sends to Payment, `CHARGE_FAILED`, `CHARGE_PENDING`) have their own copy |
| Usage | `billing-usage.tsx`: credits, seats, storage meters, daily bars, breakdown table hidden while empty, 90% and 100% banners with Buy credits / See plans | These are the "limit states" while the gate is dark |
| Invoices / Payment / Add-ons | Table with receipt PDF (fetched with the bearer token, saved as a blob), cards list (add through the hosted ₦50 check, make default, remove with the last-card rule), billing details form, credit packs only (seat and storage add-ons are not built so are not shown) | |
| Failed-payment banner | Shown above every Settings tab to the founder while `payment_issue` is set | **A site-wide banner needs the shared layout, which was not edited; recommendation in Follow-ups** |

Rejected: a "Pause for 2 months" button (not built in the API); polling after the return (one verify, then one subscription
refetch is enough for the stubbed and documented flows; the API settles by webhook); a per-plan "locked" overlay on other
pages (the gate is dark; the `402 PLAN_REQUIRED` helper `upgradeTarget` exists in `lib/billing-format.ts` for the pages that adopt it).

### Sessions trap (read before changing the Security tab)
`GET /auth/sessions` marks "this device" from the refresh **cookie** only, but this app keeps its refresh token in `localStorage`
and the API is cross-origin in production. So `current` can be false on every row. The tab then says it can't tell which row is
this device, hides the per-row "Sign out" (it could end the session you are using) and offers only "Sign out other devices", which
sends the stored token in the body and therefore keeps this device. If the API ever accepts the token on the GET, the per-row
buttons come back by themselves. Reported to the lead as a BE request.

## What's involved
- New: `lib/api/settings.ts`, `lib/api/billing.ts`, `lib/billing-format.ts` (+ test), `components/settings/{ui,profile-tab,security-tab,workspace-tab,link-tabs}.tsx`,
  `components/settings/billing/{billing-tab,billing-overview,billing-plans,billing-usage,billing-invoices,billing-payment,billing-addons,use-async}.ts(x)`
  (+ `billing-tab.test.tsx`).
- Changed: `app/(dashboard)/settings/page.tsx` (rewritten), `app/(dashboard)/account/page.tsx` (redirect), `lib/api/profile.ts` (`phone`).
- No API, migration or config change. No shared component edited.

## Verification
- `typecheck`, `lint`, vitest for the touched files (`lib/billing-format.test.ts`, `components/settings/billing/billing-tab.test.tsx`), `build`.
- Re-walk: `docs/checklist/settings-rewalk.md`: 308 of 308 checks (founder, team member, mentor, accountant at 1440 and 375) against the live API on :8000.
  **Method, honestly:** a scripted real-browser (Chromium) walk, not typed by hand like earlier re-walks; screenshots read by eye.
- **Paystack test mode** (key confirmed as a test key): real `initialize` for checkout, add card and add-on through the UI, redirect to the hosted URL
  (navigation aborted, no card entered), and the real `verify` of an unpaid reference on return. Paid states (active, canceling, past due, pending
  downgrade, upgrade, downgrade, cancel, resume) are rendered from the guide's captured bodies via browser stubs.
  **Not verified:** a paid checkout end to end, real webhook delivery, the real ₦50 refund, a real `subscription/disable`, receipt PDF content.
- Bugs the walk found and fixed: 2FA setup ran twice under React strict mode (secret on screen was not the server's), the Paystack-return result
  was dropped under strict mode, nested `<main>`, invoice table overflow at 375.

## Operate / roll back
FE only: revert the PR. The old mock page had no data to keep. The Paystack return URL (`/settings?tab=billing`) is configured in the API.

## Follow-ups
- BE: `GET /auth/sessions` should identify the current device without a cookie (accept the refresh token in a header).
- Site-wide failed-payment banner in the dashboard layout (needs the lead's OK to edit the layout).
- 402 `PLAN_REQUIRED` upgrade prompt on the Sales outreach actions (Sales pages) once `PLAN_ENFORCEMENT` is turned on.
- S7 digest and quiet hours UI (FE developer), S8 AI preferences (needs its API).
- On the local storage backend `avatar_url` and `logo_url` are file paths, not URLs, so the avatar and the sidebar logo can't render
  locally (the sidebar shows a broken logo image after an upload). Production storage returns a URL. The Settings tabs fall back to initials.
