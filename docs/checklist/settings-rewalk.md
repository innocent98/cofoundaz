# Settings + Billing + AI preferences: click-through re-walk on merged develop

**Date:** 2026-10-30. **Verdict: DONE. 350 of 350 checks pass, 0 fail** (308 Settings and Billing + 42 AI preferences; founder, team member,
mentor and accountant, each at 1440 and 375). Every control a role can reach was exercised for that role; a `-` means the control is not shown to
that role by design (for example Workspace editing and Billing for non-founders, AI preferences for mentor and accountant), and the row says how that is checked.

**What was walked.** Merged `origin/develop` `b0074f5` (FE #192: Settings hub, Billing and AI preferences), fresh worktree, `next dev -p 3102`, `/api/v1`
proxied to the shared API on `:8000` (alembic `0082_ai_preferences`, API #195, #196, #201 merged), fresh throwaway founder, team member (TM), mentor (M) and
accountant (AC) in one new workspace.

**Method, honestly.** Not typed by hand like the earlier re-walks: a scripted real-browser (Chromium) walk clicks and types into every control and
compares with the raw API (`GET /auth/me`, `/workspace`, `/billing/*`, `/ai/settings`, `/dashboard/summary`); screenshots were read by eye. The scripts, fixtures and raw
results are in the shared notes folder (`side-session-notes/.../settings-walk/`: `setup.mjs`, `walk.mjs`, `ai-walk.mjs`, `live-paystack.mjs`,
`live-verify.mjs`, `results.json`, `ai-results.json`), not in the repo.

**Live and stubbed.** "live API" rows hit the real API. "stubbed" rows serve the guide's captured body through a browser stub: every paid state (active,
canceling, past due, pending downgrade), upgrade / downgrade / cancel / resume and their errors, the cards list, invoices with rows, and the Paystack-return
outcomes other than "not completed".

**Real Paystack test mode (local key confirmed as a test key).** Through the UI at 1440 and 375: real checkout, add-card and add-on `initialize` returned 200 with a hosted URL and the
browser was redirected to it (navigation aborted: the hosted page was never opened and no card was entered). A real unpaid reference came back through `?reference=`; the
real `verify` answered "not completed" and the page showed "The payment wasn't completed, so nothing changed. You can try again.".

## NOT verified (labelled, not walked)
- A **paid checkout** end to end (a person on Paystack's hosted page).
- Real **webhook** delivery: `subscription.create`, renewal, `invoice.payment_failed`.
- The real **refund of the ₦50** card check.
- A real **cancel at Paystack** (`subscription/disable`) and a real resume.
- **Receipt PDF content** (the download is checked with a stub body only).
- **Tone**: the real model sounding different (the API's own journey runs a stub model).
- Paid-plan screens are rendered from the guide's captures, not from a real paid subscription.

## Findings
None failed on merged develop. Known and filed with the lead (BE): `GET /auth/sessions` can't mark the current device without the cookie, so the FE hides per-row
Sign out when no row is current (covered by two rows below); a malformed `verify` reference returns 422 `INVALID_REFERENCE`; the local storage backend returns file paths for avatar and logo URLs.

Roles: F founder, TM team member, M mentor, AC accountant. A cell lists the roles that passed at that width.

## Settings and Billing

| Area | Control | 1440 | 375 | Source |
|---|---|---|---|---|
| Hub | tab list matches role | F, TM, M, AC | F, TM, M, AC | live API |
| Profile | edit name/role/country/phone + save persists | F, TM, M, AC | F, TM, M, AC | live API |
| Profile | blank name blocked with message | F, TM, M, AC | F, TM, M, AC | live API |
| Profile | Discard restores saved values | F, TM, M, AC | F, TM, M, AC | live API |
| Profile | clear country and phone saves null | F, TM, M, AC | F, TM, M, AC | live API |
| Profile | avatar: wrong type rejected client-side | F, TM, M, AC | F, TM, M, AC | live API |
| Profile | avatar: over 2 MB rejected client-side | F, TM, M, AC | F, TM, M, AC | live API |
| Profile | avatar: upload then remove | F, TM, M, AC | F, TM, M, AC | live API |
| Profile | email is read-only | F, TM, M, AC | F, TM, M, AC | live API |
| Security | password: wrong current → field error | F, TM, M, AC | F, TM, M, AC | live API |
| Security | password: weak and mismatch handled client-side | F, TM, M, AC | F, TM, M, AC | live API |
| Security | password: unchanged rejected by API | F, TM, M, AC | F, TM, M, AC | live API |
| Security | password: change succeeds, new works, old dies, this device stays signed in | F, TM, M, AC | F, TM, M, AC | live API |
| Security | sessions: rows listed; unknown current → note, no per-row Sign out | F, TM, M, AC | F, TM, M, AC | live API |
| Security | sessions: per-row Sign out when current is known (list stubbed to mark one row) | F, TM, M, AC | F, TM, M, AC | stubbed API (guide capture) |
| Security | sessions: Sign out other devices keeps this device alive | F, TM, M, AC | F, TM, M, AC | live API |
| Security | 2FA: turn on with real TOTP, wrong code error, backup codes shown once | F, TM, M, AC | F, TM, M, AC | live API |
| Security | 2FA: new backup codes (wrong password error, then ok) | F, TM, M, AC | F, TM, M, AC | live API |
| Security | 2FA: login now needs a code (mfa_required) | F, TM, M, AC | F, TM, M, AC | live API |
| Security | 2FA: turn off (wrong code error, then backup code works) | F, TM, M, AC | F, TM, M, AC | live API |
| Workspace | founder: bad website → field error | F | F | live API |
| Workspace | founder: edit all fields + save persists | F | F | live API |
| Workspace | founder: logo upload | F | F | live API |
| Workspace | founder: logo wrong type rejected | F | F | live API |
| Notifications | tab links to /notifications preferences | F, TM, M, AC | F, TM, M, AC | live API |
| AI preferences | panel renders (switches + tone), no memory section, no not-saved banner | F, TM | F, TM | live API |
| Billing | overview (live): plan card matches the API | F | F | live API |
| Billing | usage (live): credits, seats, storage meters | F | F | live API |
| Billing | usage (stubbed 100%): limit banner, Buy credits → Add-ons | F | F | stubbed API (guide capture) |
| Billing | invoices (live): empty state | F | F | live API |
| Billing | invoices (stubbed): table + receipt download | F | F | stubbed API (guide capture) |
| Billing | payment (live): empty state, billing details save and clear | F | F | live API |
| Billing | payment: Add card → Paystack redirect (API stubbed, navigation aborted) | F | F | stubbed API (guide capture) |
| Billing | payment (stubbed cards): default, make default, remove, last-card error | F | F | stubbed API (guide capture) |
| Billing | add-ons (live): only credit packs, no seat or storage add-ons | F | F | live API |
| Billing | add-ons: Buy → Paystack redirect (stubbed) | F | F | stubbed API (guide capture) |
| Billing | add-on purchase 503 (stubbed) shown | F | F | stubbed API (guide capture) |
| Billing | plans (live): 3 plans, prices, interval toggle | F | F | live API |
| Billing | plans (live free): Starter is current, CTA disabled | F | - | live API |
| Billing | trial (live): start 14-day Growth trial, no card | F | - | live API |
| Billing | overview (live trialing): trial banner with end date + Subscribe | F | F | live API |
| Billing | trialing → Subscribe to Growth: checkout confirm (live preview) + redirect (stubbed) | F | F | stubbed API (guide capture) |
| Billing | checkout modal: Not now closes, Escape closes | F | F | live API |
| Billing | checkout error: Paystack down (stubbed 502) shown in modal | F | F | stubbed API (guide capture) |
| Billing | paystack return: paid/applied → success | F | F | live API |
| Billing | paystack return: add-on applied | F | F | live API |
| Billing | paystack return: abandoned → nothing changed message | F | F | live API |
| Billing | paystack return: duplicate refunded | F | F | live API |
| Billing | paystack return: amount mismatch | F | F | live API |
| Billing | paystack return: foreign reference 404 | F | F | live API |
| Billing | paystack return: live verify of a malformed reference → INVALID_REFERENCE message | F | F | live API |
| Billing | overview (stubbed active Growth): renews date, next invoice, card, Cancel plan | F | F | stubbed API (guide capture) |
| Billing | cancel flow (stubbed): reason sheet, no Pause, cancel → keeps until date | F | F | stubbed API (guide capture) |
| Billing | resume (stubbed): Keep my plan restores renewal | F | F | stubbed API (guide capture) |
| Billing | resume with no card (stubbed 409) → asks to add a card | F | F | stubbed API (guide capture) |
| Billing | past_due (stubbed): banner with grace days + Fix payment, also on other tabs | F | F | stubbed API (guide capture) |
| Billing | pending downgrade (stubbed): note on overview and on the target plan | F | F | stubbed API (guide capture) |
| Billing | upgrade (stubbed Growth→Scale): preview amounts, confirm, charged toast, Idempotency-Key sent | F | F | stubbed API (guide capture) |
| Billing | upgrade errors (stubbed): NO_PAYMENT_METHOD → Add a card; CHARGE_FAILED; CHARGE_PENDING | F | F | stubbed API (guide capture) |
| Billing | downgrade (stubbed Growth→Starter): keeps-until copy, scheduled toast | F | F | stubbed API (guide capture) |
| Billing | usage banner at 90% (stubbed) + breakdown table | F | F | stubbed API (guide capture) |
| Hub | /account redirects to Profile tab | F, TM, M, AC | F, TM, M, AC | live API |
| Profile | Log out → POST /auth/logout, lands on /login | F | F | live API |
| Workspace | non-founder: read-only, notice shown, no Save or logo button | TM, M, AC | TM, M, AC | live API |
| Workspace | non-founder: PATCH /workspace is 403 from the API | TM, M, AC | TM, M, AC | live API |
| Billing | non-founder sees "Billing is managed by your workspace founder." | TM, M, AC | TM, M, AC | live API |
| Billing | non-founder: billing APIs 403, plans readable | TM, M, AC | TM, M, AC | live API |
| AI preferences | hidden for non-core role; ?tab=ai falls back to Profile | M, AC | M, AC | live API |
| Hub | no horizontal overflow (profile) | - | F, TM, M, AC | live API |
| Security | no horizontal overflow | - | F, TM, M, AC | live API |
| Workspace | no horizontal overflow | - | F, TM, M, AC | live API |
| Billing | overview: no horizontal overflow | - | F | live API |
| Billing | usage: no horizontal overflow | - | F | live API |
| Billing | payment: no horizontal overflow | - | F | live API |
| Billing | add-ons: no horizontal overflow | - | F | live API |
| Billing | plans: no horizontal overflow | - | F | live API |
| Billing | trial (live): second start refused 409, CTA hidden | - | F | live API |
| Billing | overview active: no horizontal overflow | - | F | live API |
| Billing | no horizontal overflow | - | TM, M, AC | live API |

## AI preferences (API #201 `GET/PATCH /ai/settings`)

| Area | Control | 1440 | 375 | Source |
|---|---|---|---|---|
| AI preferences | defaults shown: both on, Encouraging; no memory section or not-saved banner | F, TM | F, TM | live API |
| AI preferences | Proactive suggestions off persists after reload | F, TM | F, TM | live API |
| AI preferences | Daily briefing off persists after reload | F, TM | F, TM | live API |
| AI preferences | Tone: Straight shooter persists; Encouraging back | F, TM | F, TM | live API |
| Dashboard | briefing off + suggestions off: briefing and opportunities show the quiet off states, API status "off" | F, TM | F, TM | live API |
| Dashboard | briefing back on, suggestions still off: briefing not "off", Opportunities still off | F, TM | F, TM | live API |
| /ai/settings | same source of truth: shows saved values; toggle here shows on the hub tab | F, TM | F, TM | live API |
| AI preferences | save failure (stubbed 500) rolls the switch back with an error toast | F, TM | F, TM | stubbed API (guide capture) |
| AI preferences | restore defaults (suggestions on, briefing on, Encouraging) | F, TM | F, TM | live API |
| AI preferences | tab hidden, ?tab=ai falls back to Profile, API 403 | M, AC | M, AC | live API |
| AI preferences | no horizontal overflow (tab) | - | F, TM | live API |
