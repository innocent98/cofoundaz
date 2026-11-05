# Marketplace: design

Date: 2026-11-05. Status: **design accepted 2026-11-05: D-MP-1..9 accepted as recommended (Adebayo: "Accept all nine"); production charging stays off until counsel and Paystack confirm in writing (D-MP-3, D-MP-9)**. PRD Module 16 (`Cofoundaz_Technical_PRD.md:610-640`), plus the references at
line 131 (AI disclaimer: "find one in the Marketplace"), Module 25.3 / 25.5 (moderation, reported reviews), Module 24 (Billing) and the access row at line 900.
Mocks: `app/(dashboard)/marketplace/*` (6 pages on `hooks/useMarketplaceApi.ts`, all seeded `useState`, hidden from the sidebar by FE #184).
Gap list: `docs/checklist/marketplace-prd-gaps.md`. No product code in this pass.

> `D-MKT-1..8` already belong to Marketing, so Marketplace questions are **D-MP-n**.

## 0. What exists today

- **No Marketplace API at all.** No model, route, event, notification kind or row policy. The only touches are `/marketplace: [F, TM]` in `lib/nav-access.ts:41`,
  the `ReportItemType` enum comment "Marketplace reviews join when Marketplace is built" (`app/db/models/enums.py:630`), and the Admin mock's "Expert vetting" tab
  that D-ADM-5 told us to remove until now.
- **Reusable plumbing** (checked in `cofoundaz-api`, develop `08b34faa`, last migration 0088):

| Need | Reuse | Where | Gap to close |
|---|---|---|---|
| Take a card payment, platform-owned Paystack account | `initialize` / `verify` / `charge_authorization` / `refund` / `verify_signature`, the idempotent `reference_for` pattern | `app/services/billing/paystack.py`, `billing/flows.py` | `refund()` has no `amount` (needed for split refunds); no Transfers or recipients; webhook dispatcher knows only subscription events |
| Webhook HMAC + dedupe | `verify_signature`; the dedupe-key pattern | `billing/webhook.py:113`, `finance/payments/webhooks.py:44` | Marketplace events route by reference prefix (`mp_`) into a new handler. Founder-owned finance keys are a different account and are **not** used here |
| Encrypt a stored secret/bank detail | Fernet helper | `finance/payments/crypto.py`, `calendar/crypto.py` | Reuse for payout account number |
| Receipts / invoices | `record_invoice`, `receipt.py` | `billing/flows.py:191`, `billing/receipt.py` | Marketplace receipt is a different document (provider is the seller of the service) |
| Meetings + ICS invite to an outside attendee | `calendar_events`, `invites.send_pending`, `meetings.py` | `app/services/calendar/*` | Provider is not a workspace member; invite goes to their email as external attendee |
| Staff, scopes, step-up, audit | `platform_staff` (scope `moderation` already exists), `require_staff`, `stepup.py`, `write_audit` | `app/services/staff/*` | New queues/actions only |
| Report a listing/review | `content_reports` + staff queue (#212) | `app/db/models/content_report.py`, `services/staff/reports.py` | Add `listing`, `provider`, `review` to `ReportItemType` |
| Files, virus scan, magic-byte sniff | `documents/files.py`, `scanner.py`, `sniff.py` | `app/services/documents/*` | Documents are workspace-scoped; providers have no workspace, so a small `marketplace_files` table reuses the storage and scanner |
| Per-document view grant to an outside email | `document_grants` (binds on verified email) | `documents/grants.py` | Used for "attach from Documents" to a booking; revoked at close |
| Notifications | `notifications/registry.py` (kinds, audience by role, preferences) | `app/services/notifications/*` | Audience is workspace-role based; providers get transactional email + a portal inbox |
| AI call + usage meter | `llm_usage`, credits = tokens/50 (D-SET-9) | `billing/usage.py` | One cached call (match banner) |

## 1. Decisions

### 1.1 Needed from Adebayo (D-MP-1..9)

These are the money and trust calls. Everything else is a lead default (1.2).

| ID | Question | Options (cost) | Recommendation |
|---|---|---|---|
| **D-MP-1** | Who can be an expert? | (a) **Invite-only**: you and ops hand-pick. Cost: slowest supply, highest quality, no public "apply" page. (b) **Open applications**: anyone applies, staff vet. Cost: PRD 25.3 assumes this ("provider application: credentials docs"); vetting load is unbounded and spam applications arrive. (c) **Hybrid**: launch with 10-20 invited experts you choose, an "Apply to become an expert" page feeds the **same** vetting queue, switched on by a flag when you want supply. Cost: one public page + one flag over (a). | **(c)**. A marketplace with 3 experts looks empty and with 300 unvetted ones looks unsafe; invite first, open the door by flag. |
| **D-MP-2** | How do experts run their side? PRD: "Providers have separate portal (v1: managed via Admin)". | (a) **Admin-operated**: staff type listings, mark deliveries, relay messages for experts. Cost: nearly free to build, collapses at about 20 bookings, and "Accept delivery" has nobody to deliver. (b) **Small provider portal** (`/provider`, invite-bound, TOTP-optional): profile, listings, availability, booking inbox (accept/decline/deliver), messages, payout account, earnings. Cost: one more FE surface (about 6 pages) and a `require_provider` guard. (c) **Email-only magic links** per booking (like the data-room link). Cost: no profile or listing editing, so staff still key in listings. | **(b)**, minimal. Same API, same Next app, routes under `/provider`, like `/admin`. A provider is a normal `users` row plus a `marketplace_providers` row (same shape as `platform_staff`, so no column on `users` to mass-assign). |
| **D-MP-3** | How does money move? The biggest call; see 1.3 for legal exposure. | (a) **Platform collects, holds, then pays out**: founder pays Cofoundaz's Paystack account; on acceptance we `Transfer` the expert's net to their bank; commission stays. Cost: full control (refunds, disputes, "Accept delivery" means something); **Cofoundaz holds customer funds**, needs Paystack Transfers enabled and funded balance, payout/reconciliation code, chargeback exposure. (b) **Paystack split with expert subaccounts**: expert settles directly, commission auto-deducted. Cost: no holding by us and less code; but no escrow (money is gone before delivery), disputes and refunds depend on the expert's balance, and each expert needs a Paystack subaccount. (c) **Directory only, pay off-platform**: founder pays the expert directly, Cofoundaz bills experts a referral fee. Cost: smallest legal surface; no checkout, no orders, no receipts, no "Accept delivery", commission leakage. Does not match the PRD. | **(a), gated on written legal advice and Paystack's written approval before slice C goes live**; fall back to **(b)** if either says no. The ledger (1.4) is designed once so both fit. Not (c). |
| **D-MP-4** | Release, refund and dispute policy | (a) **Hold until acceptance, auto-release 7 days after delivery; consultations auto-release 48 h after the slot; 2 revision rounds included; founder can cancel for a full refund until the expert accepts; one dispute per booking, decided by staff (full release, full refund, or split).** Cost: protects founders, makes experts wait; needs timers and a staff dispute queue. (b) Pay the expert at delivery, refunds only at the expert's discretion. Cost: simplest; founders carry all the risk; "Request changes" has no teeth. (c) Milestone payments (30/70). Cost: a second payment flow, new states. | **(a)**. Cancellation within 24 h of a consultation forfeits the fee to the expert; provider no-show is a full refund on report. Dispute outcomes above ₦500,000 need a Super Admin step-up. Numbers are constants you can change. |
| **D-MP-5** | Commission and fees | (a) **15% of the listed price, taken from the expert's side; the founder pays exactly the listed price**; per-provider override column; Paystack's processing fee (about 1.5% + ₦100, capped; verify current) and transfer fee come out of Cofoundaz's 15%. Cost: net margin about 12-13%. (b) 10% flat. Cost: friendlier to experts, thin after fees. (c) Founder-side service fee on top (e.g. 5%). Cost: price shown at checkout differs from the listing, hurts conversion. (d) Tiered by plan or volume. Cost: complexity before there is volume. | **(a)**. Show the expert their net before they publish a listing. Revisit with real volume. Tax on the commission (VAT) is flagged in 1.3, not decided here. |
| **D-MP-6** | What does "Vetted" mean, and who does it? PRD tooltip promises "verified credentials and past client checks". | (a) **Per-category rubric**: Legal and Accounting (regulated) = ID + professional licence (NBA / ICAN / ANAN or equivalent) + 2 client references called or emailed by staff; Design / Development / Marketing = ID + portfolio review + 1 reference. Staff tick each check; the badge tooltip lists only checks actually done for that expert. Cost: about 30-45 min of staff time per expert; someone must own it. (b) Documents only (ID + licence), no references. Cost: faster; the tooltip must drop "past client checks". (c) Self-declared, no badge. Cost: no ops; no trust signal, and the AI disclaimer's "find a licensed professional" loses its point. | **(a)**, with the tooltip generated from the ticked checks so we never claim more than we did. Re-vet yearly; licence expiry date stored and auto-flagged. Who does it (you, or an Admin with `moderation` scope) is yours to name. |
| **D-MP-7** | Reviews | (a) **Verified only**: one review per completed booking (accepted or auto-released), by the founder who booked, within 30 days, editable 7 days, one public reply from the expert, stars shown as "New" until 3 reviews. Removal only through reports and staff. Cost: slower to accumulate reviews. (b) Anyone in the workspace can review any expert they talked to. Cost: easy to game; no tie to money. (c) Reviews open from day one with no completed booking. Cost: fake-review risk, defeats "verified". | **(a)**. A review on a booking that ended in a full refund is allowed but tagged "refunded" and excluded from the average. |
| **D-MP-8** | What are "Tools & Integrations"? PRD 16.3: partner cards with **"Connect"** or **"Get deal"** and founder-discount tags. The mock shows "Stripe: ₦20M fee-free processing" and "AWS Activate: up to $10k credits", which nobody has agreed. | (a) **Curated directory with honest perks**: staff-managed list (Admin), each tool has category, link, and a perk text **only where a real public startup programme or a signed Cofoundaz deal exists**, with `verified_on`; "Get deal" reveals the code/link and counts the click; referral links are labelled "Cofoundaz may earn a commission". "Connect" appears only for tools we really integrate (links to the existing Finance/Calendar integration screens). Cost: your time to source 8-12 real programmes; staleness checks. (b) **Hide the tab** until partnerships exist. Cost: loses a PRD sub-page; honest. (c) Ship as mocked. Cost: false discount claims, a misrepresentation risk. Not recommended. | **(a)**, seeded with only programmes we can link to publicly (e.g. cloud-credit programmes, startup plans) and no numbers we cannot source. If you do not want to source real deals now, choose (b) and the tab and routes stay out until then. Never (c). |
| **D-MP-9** | Legal gate on holding funds | (a) **Build all slices, but production card charging stays off (`MARKETPLACE_PAYMENTS_ENABLED=false`) until counsel and Paystack answer in writing.** Cost: none on build; launch waits on you. (b) Hold the money slices until the answer. Cost: delays the whole page, since "no half-built pages" blocks unhide. (c) Skip legal, launch. Cost: unbounded. | **(a)**, and book the call with a Nigerian fintech lawyer and your Paystack account manager now, with the questions in 1.3. Staging runs on Paystack test keys either way. |

### 1.2 Lead defaults (built as written, reversible)

| ID | Default |
|---|---|
| D-MP-L1 | **Access.** Founders and team members browse, message, and see bookings/orders. Only **founders** book, pay, accept or reject a delivery, open a dispute, and review (money and acceptance are the founder's). One constant flips this. Mentors, accountants, advisors, investors: no access (PRD access row). |
| D-MP-L2 | **Pay by card only (Paystack, NGN, kobo).** The PRD's "plan credits" are AI credits (tokens/50, D-SET-9), not money, so they cannot pay for a service. A saved card (`charge_authorization`) gives one-click rebooking. |
| D-MP-L3 | **Plans.** Marketplace is open on every plan, behind no module gate (commission is the revenue). The existing `PLAN_ENFORCEMENT` flag is not involved. |
| D-MP-L4 | **No custom quote flow in v1.** The mock's "TBD via quote" path and generic "New booking request" button are dropped; every booking starts from a listing. Pre-sale questions go through "Message". A provider-made custom offer is a follow-up. |
| D-MP-L5 | **Two listing types**: `consultation` (time slot, duration, uses availability, creates a Calendar meeting) and `package` (fixed scope, deliverables list, delivery days, 2 revisions). |
| D-MP-L6 | **Availability** = weekly rules + date exceptions + minimum notice (default 24 h) + buffer, in the provider's timezone (default Africa/Lagos). Providers paste a fixed meeting link per consultation listing. No provider Google sync in v1. A slot is held 15 minutes during checkout. |
| D-MP-L7 | **Provider must accept within 48 h** or the booking expires and the card is refunded in full. Decline = full refund. |
| D-MP-L8 | **Listing review.** A new listing needs staff approval. Edits to title, category, deliverables or description on a live listing go to review while the live version stays; price edits apply to new bookings at once. A booking snapshots title, price, deliverables and commission at purchase. |
| D-MP-L9 | **Pre-screen** every listing and profile with deterministic rules (contact details in text, "guaranteed approval/returns", prohibited categories, price outside sanity bounds) before it reaches the queue. No AI. |
| D-MP-L10 | **Brief attachments**: upload (PDF, DOCX, PNG, JPG, XLSX; 10 MB each, scanned) or "Attach from Documents", which creates a view-only grant for the provider's verified email that ends when the booking closes. The provider never sees the workspace. |
| D-MP-L11 | **Staff can read** a booking's thread, brief, files and delivery **only inside a dispute** or a report, and that read is audited (a marketplace exception to D-ADM-9; ToS must say so, see 1.3). Staff still never read Documents, Journal or AI chats. |
| D-MP-L12 | **Chargebacks.** A card chargeback after payout is recovered by offsetting the provider's next payouts (negative balance in the ledger); no clawback from the bank. |
| D-MP-L13 | **Payout timing.** Released funds queue a transfer; the worker sends it when the Paystack balance covers it (balance only holds settled funds, about T+1), retrying with backoff. Minimum payout ₦1,000, weekly batching later if fees bite. |
| D-MP-L14 | **Provider notifications** are transactional email plus an in-portal inbox, because the notification registry's audience is workspace roles. Founder-side kinds are added to the registry with preferences. |
| D-MP-L15 | **Currency NGN only.** USD experts and listings are a follow-up. |
| D-MP-L16 | **A provider cannot book their own listing** (same user, or same email as any member of the workspace). |
| D-MP-L17 | **Off-platform dealing** is forbidden by the ToS; we do not regex-block contact details in messages (hostile), we do flag them for review when a booking cancels right after a message exchange. |
| D-MP-L18 | **Search** is SQL filters (category, price range, min rating, language, availability this week) plus sort (relevance by deterministic score, rating, price). No embeddings in v1. |
| D-MP-L19 | **Roles for staff**: vetting, listing moderation and reports use the existing `moderation` scope; disputes and refunds use `moderation` plus Super Admin step-up above the threshold; payout holds/force-release are Super Admin only. |

### 1.3 Legal and regulatory exposure (flagged, not solved)

This is not legal advice and none of it is settled. Each line needs a Nigerian lawyer, an accountant, or Paystack in writing before real money moves.

1. **Holding customer funds (D-MP-3 a).** Collecting a payment for a third party's service and paying them later looks like escrow or a payment-collection service. Whether Cofoundaz needs a licence from the CBN (or must use a licensed partner) is the first question for counsel. Paystack's merchant terms may also restrict marketplaces or fund-holding and may require approval for Transfers; ask in writing.
2. **Split payments (D-MP-3 b)** move the holding to Paystack but may still count as facilitating payments to third parties, and each subaccount needs Paystack's verification of the expert.
3. **KYC and AML on payouts.** We collect bank details and an ID document. Counsel should say what record-keeping and suspicious-activity duties apply to a platform that pays out. Do **not** collect BVN; use Paystack's account-name resolution instead.
4. **Data protection (NDPA 2023).** ID documents and licences are personal data. Needs a lawful basis, a retention period, restricted access (staff with `moderation` only, audited), and deletion on rejection or request. Credential files are not workspace content, so they sit in `marketplace_files`, encrypted at rest like other uploads.
5. **Tax.** VAT (7.5%) on Cofoundaz's commission, withholding tax on professional fees paid by a company, who issues the invoice for the service (the expert) and for the fee (Cofoundaz). Needs an accountant; receipts here show both lines but are not tax invoices until reviewed.
6. **Regulated professions.** Legal advice must come from lawyers called to the Nigerian Bar; accounting from ICAN/ANAN members. A "Legal" listing from an unverified person risks unlicensed practice being attributed to the platform. This is why D-MP-6 (a) checks licences for Legal and Accounting.
7. **The "Vetted" claim.** Advertising a check we did not do is a consumer-protection exposure (FCCPC). The tooltip is generated from the checks actually recorded.
8. **Partner deals.** Perks and referral links must be true, current, and disclosed as commissionable (D-MP-8).
9. **Terms of service.** Needs Marketplace terms for founders and for experts (independent contractors, platform not a party to the service, not liable for professional advice, dispute rules, staff access to disputed threads, refund policy). Drafted by counsel; we show a required consent checkbox at first booking and at provider onboarding. The §1.4 AI disclaimer's link to the Marketplace stays as is.
10. **Chargebacks and fraud.** Stolen-card payments reaching experts. Mitigations: payout delay after release, offsetting, per-provider holds by Super Admin; not a substitute for Paystack's own risk rules.

### 1.4 Money flow (D-MP-3 a, recommended)

```
 Founder card ──pay listed price P──▶ Paystack (Cofoundaz account)        ledger: charge +P  (held)
                                          │ settles about T+1
   booking confirmed ◀── webhook charge.success (HMAC, dedupe, verify by reference)
        │
   provider accepts ─▶ work / meeting ─▶ delivered ─┬─ founder "Accept"            ┐
        │                                            ├─ 7 d silence (auto-release)  ├─▶ release
        │                                            └─ "Request changes" (max 2)   ┘
        │ decline / 48 h silence / cancel before accept                ledger: release
        └────────▶ Paystack Refund(P) ─▶ founder card                  commission = P × bps (15%)
                                                                       provider net = P − commission
   release ─▶ payout queued ─▶ worker: POST /transfer (recipient code, reference) ─▶ expert bank
                                  ▲ waits for settled balance            ledger: payout −net
                                  └─ webhooks transfer.success | failed | reversed (idempotent)
   dispute (staff) ─▶ full release | full refund | split (Refund(partial) + payout(rest))
   chargeback after payout ─▶ negative provider balance, offset against next payout (D-MP-L12)
```

Ledger rule: `marketplace_ledger_entries` is **append-only** (DB trigger, like `audit_log`, D-ADM-11). Order and payout statuses are derived from, and reconciled against, it; a nightly job compares ledger sums to Paystack's transactions/transfers and writes a reconciliation row. The same ledger carries (b) by writing `settlement_mode='direct'` with the commission as a split line and no hold/release/payout entries.

## 2. Users and roles

| Actor | Account | Surface | Can |
|---|---|---|---|
| Founder | workspace member `founder` | `/marketplace/*` | everything on the founder side, incl. pay, accept, dispute, review |
| Team member | `team_member` | `/marketplace/*` | browse, message, view bookings/orders/receipts (D-MP-L1) |
| Expert (provider) | `users` + `marketplace_providers` row | `/provider/*` | own profile, listings, availability, booking inbox, deliveries, messages, payout account, earnings. **No workspace data** beyond the booking brief and files the founder sent |
| Admin (scope `moderation`) | `platform_staff` | `/admin/marketplace` | vetting, listing moderation, reported listings/reviews, disputes under threshold, partner tools |
| Super Admin | `platform_staff` | `/super-admin` | disputes over threshold, payout hold/release, commission override, reconciliation |
| Mentor, accountant, legal advisor, BC, investor | memberships | none | nav-access already excludes them; API returns 403 |

Provider status: `invited | applied | in_review | changes_requested | approved | suspended | rejected`. Only `approved` providers are visible to founders. A suspended provider's active bookings are honoured or refunded by staff; no new bookings.

## 3. Sub-pages: what each does

### 3.1 Experts `/marketplace` (PRD 16.1)
- **Founder.** Provider cards (photo, name, specialty, rating and count or "New", from-price, **Vetted** badge with generated tooltip). Filter rail: category, budget range, minimum rating, languages, "available this week". Search by name/specialty. Sort. **Provider profile** `/marketplace/experts/{id}`: bio, credentials summary, services (listings), portfolio, reviews, **Message** and **Book**. AI banner: "Based on your roadmap, you could use {category} help with {task}. {n} strong matches." with **See matches**.
- **Expert.** `/provider/profile`: edit headline, bio, photo, categories, languages, location/timezone, portfolio items, credentials upload (feeds vetting).
- **AI (see section 8).** One cached classification; ranking is deterministic.

### 3.2 Services `/marketplace/services` (16.2)
- **Founder.** Listing cards (title, provider with Vetted, deliverables, price, timeline, **Book this**), filter by category/price/timeline, link through to the provider. Consultations show duration and next available slot.
- **Expert.** `/provider/listings`: create/edit/pause listings (draft → submit for review), see review status and rejection reasons, see net-of-commission preview.

### 3.3 Tools & Deals `/marketplace/tools` (16.3, D-MP-8)
- **Founder.** Partner cards (logo, one-liner, category, perk text with `verified_on`). **Get deal** reveals the code or link (and records the click); **Connect** deep-links to an existing integration screen only for tools we integrate. Disclosure line on commissionable links.
- **Staff.** `/admin/marketplace/tools` CMS: add/edit/pause, `verified_on`, 90-day staleness flag.

### 3.4 Bookings `/marketplace/bookings` (16.4)
- **Founder.** From a listing: pick slot (consultation) or confirm scope (package) → **brief** ("What do you need done?" + attachments) → **confirm and pay** (listed price, no hidden fee; ToS checkbox first time) → Paystack hosted checkout or saved card → status list: Upcoming / In progress / Delivered / Closed, per-booking detail with thread, files, meeting link + "Add to calendar", **Accept delivery**, **Request changes** (2 rounds), **Cancel**, **Report a problem** (dispute).
- **Expert.** `/provider/bookings`: inbox (accept/decline within 48 h), calendar of consultations, mark complete, **submit delivery** (message + files), respond to change requests, see earnings per booking.

### 3.5 Reviews `/marketplace/reviews` (16.5, D-MP-7)
- **Founder.** Pending prompts ("How was your engagement with {provider}?"): stars + text; given reviews list with edit (7 days) and the provider's reply.
- **Expert.** See reviews on their profile, post one public reply; can **report** a review (goes to Reported issues).

### 3.6 Purchases `/marketplace/purchases` (16.6)
- **Founder / TM.** Order table (item, provider, amount, date, status, **receipt** download PDF, link to the booking). Status: Paid, Held, Released, Refunded, Partially refunded, Failed. Filter by status/date.
- **Expert.** `/provider/earnings`: payouts table (gross, commission, net, status, transfer reference), pending vs paid, negative balance if any.

### 3.7 Messaging (PRD "per-booking thread")
Threads exist per workspace-provider pair, before any booking (the **Message** button) and attached to a booking once one exists. Reuses the FE `ChatThread` without AI affordances. Attachments via `marketplace_files`. Unread counts and a notification per new message (digest-collapsed for 10 minutes).

### 3.8 Provider portal `/provider/*` (D-MP-2)
Pages: Overview, Profile, Listings, Availability, Bookings, Messages, Earnings and payout account. Onboarding after invite: set password / sign in → accept terms → profile → upload credentials → submit for vetting → (approved) payout account → first listing → listing review.

## 4. Admin: vetting and moderation (PRD 25.3, 25.5)

| Queue | Actions | Notes |
|---|---|---|
| **Provider applications** `/admin/marketplace/providers` | per-category checklist ticks (ID, licence + expiry, references, portfolio), **Approve**, **Reject** (reason template Select, emailed), **Request changes** (message), **Suspend** | Credential files viewable only here, access audited; checklist drives the badge tooltip; licence expiry flagged 30 days ahead |
| **Pending listings** `/admin/marketplace/listings` | Approve / Reject (template reason) / Request changes; side-by-side diff for a revision | Deterministic pre-screen result shown as chips |
| **Reported listings and reviews** | Dismiss, **Unlist** (confirm copy PRD: "Unlist {listing}? Active bookings are honored; no new bookings."), remove review, escalate to Super Admin | Rides on `content_reports` (add types `listing`, `provider`, `review`); reporter count shown |
| **Disputes** `/admin/marketplace/disputes` | read thread/brief/delivery (audited), decide: release, refund, split; reason mandatory (min 10 chars) | Over ₦500,000: Super Admin step-up (`stepup.py`) |
| **Money console** (Super Admin) | hold/release a provider's payouts, commission override, reconciliation report, payout failures | Every action `write_audit` with reason |
| **Partner tools** | CMS (3.3) | |

D-ADM-5's "Expert vetting waits for Marketplace" ends here. The Admin FE rebuild of these queues goes to the same FE developer as the rest of Admin (memory: admin FE to junior dev) via an exact-scope brief; the lead decides.

## 5. Data model sketch

All money in `*_minor` (kobo), `currency='NGN'`. UUID PKs, `created_at/updated_at`. Founder-side tables carry `startup_id` and get row policies like the other modules; provider-side tables are keyed by `provider_id` and filtered in the service by the caller's provider row.

| Table | Key columns |
|---|---|
| `marketplace_providers` | `user_id` unique, `display_name`, `headline`, `bio`, `category` (+ `categories[]`), `languages[]`, `timezone`, `location`, `avatar_file_id`, `status`, `vetting_json` (ticked checks with who/when), `licence_expires_on`, `vetted_at`, `vetted_by`, `commission_bps` null (override), `rating_avg`, `rating_count` (recomputed in the review transaction), `suspended_reason` |
| `marketplace_files` | `owner_user_id`, `purpose` (credential, portfolio, avatar, brief, delivery, message), `booking_id` null, `storage_key`, `mime`, `size`, `scan_status` |
| `marketplace_provider_portfolio` | `provider_id`, `title`, `description`, `url`, `file_id`, `position` |
| `marketplace_payout_accounts` | `provider_id` unique, `bank_code`, `account_number_enc` (Fernet), `last4`, `account_name`, `paystack_recipient_code`, `verified_at` |
| `marketplace_listings` | `provider_id`, `type` (consultation, package), `title`, `summary`, `category`, `tags[]`, `price_minor`, `duration_min`, `delivery_days`, `deliverables_json`, `revisions_included`, `meeting_url`, `status` (draft, pending_review, active, paused, unlisted, rejected), `pending_revision_json`, `published_at`, `unlisted_by/reason` |
| `marketplace_availability_rules` / `_exceptions` | `provider_id`, `weekday`, `start`, `end`, `slot_min`, `buffer_min`, `min_notice_h`; exceptions by date (blocked or extra hours) |
| `marketplace_bookings` | `startup_id`, `listing_id`, `provider_id`, `booked_by`, `status`, `title_snap`, `price_minor`, `commission_bps_snap`, `deliverables_snap`, `brief`, `starts_at`, `ends_at`, `slot_hold_expires_at`, `accept_by`, `due_at`, `delivered_at`, `auto_release_at`, `revisions_used`, `calendar_event_id`, `closed_reason` |
| `marketplace_deliveries` | `booking_id`, `round`, `message`, `submitted_at`, `decision` (accepted, changes_requested, auto_released), `decision_note`, `decided_at` |
| `marketplace_threads` / `marketplace_messages` | thread: `startup_id`, `provider_id`, `booking_id` null; message: `sender_user_id`, `sender_side`, `body`, `file_ids[]`, `read_at_founder_side`, `read_at_provider_side` |
| `marketplace_orders` | `booking_id` unique, `startup_id`, `amount_minor`, `commission_minor`, `provider_net_minor`, `status` (pending, paid, held, released, refunded, partially_refunded, failed), `settlement_mode`, `paystack_reference` unique (`mp_` prefix), `paid_at`, `receipt_number`, `idempotency_key` |
| `marketplace_ledger_entries` | `order_id`, `provider_id`, `kind` (charge, release, commission, refund, payout, payout_reversal, chargeback, adjustment), `amount_minor` signed, `external_ref`, `note`, `actor_id`; **append-only trigger** |
| `marketplace_payouts` | `provider_id`, `order_id`, `amount_minor`, `status` (queued, processing, paid, failed, reversed, held), `paystack_transfer_code`, `reference` unique, `attempts`, `next_attempt_at`, `failure_reason` |
| `marketplace_disputes` | `booking_id` unique, `opened_by`, `reason`, `detail`, `status`, `resolution` (release, refund, split), `refund_minor`, `decided_by`, `decision_note`, `decided_at` |
| `marketplace_reviews` | `booking_id` unique, `startup_id`, `provider_id`, `stars` 1-5, `body`, `status` (published, removed), `reply_body`, `reply_at`, `refunded` bool, `edited_at` |
| `marketplace_partner_tools` / `_clicks` | `slug`, `name`, `logo_file_id`, `one_liner`, `category`, `kind` (deal, link, connect), `perk_text`, `code_enc`, `url`, `verified_on`, `active`, `connect_route`; clicks: `tool_id`, `startup_id`, `user_id`, `at` |
| `marketplace_webhook_events` | `event_key` unique (idempotency), `type`, `received_at`, `outcome` |
| `content_reports` (existing) | enum adds `listing`, `provider`, `review` |

Booking state machine (maps to the mock's four tabs):

| State | Tab | Founder sees | Next |
|---|---|---|---|
| `pending_payment` | (hidden, 15 min) | Paystack checkout | paid → `awaiting_provider`; expiry → `expired` |
| `awaiting_provider` | Upcoming | "Waiting for {provider} to accept" | accept → `confirmed`/`in_progress`; decline or 48 h → `declined`/`expired` (refund) |
| `confirmed` (consultation, future slot) | Upcoming | date, meeting link, add to calendar, cancel | slot ends → `delivered` |
| `in_progress` (package) | In progress | thread, files, due date | provider delivers → `delivered` |
| `delivered` | Delivered | Accept delivery / Request changes / Report a problem | accept or 7 d/48 h → `completed`; changes (≤2) → `in_progress`; dispute → `disputed` |
| `disputed` | Delivered | "Cofoundaz is reviewing" | staff resolves → `completed` or `refunded` |
| `completed`, `refunded`, `partially_refunded`, `cancelled`, `declined`, `expired` | Closed | receipt, review prompt | terminal |

## 6. Endpoints (all under `/api/v1`)

**Founder** (`require founder|team_member`, mutations founder-only per D-MP-L1; startup-scoped):
`GET /marketplace/providers?category&min_price&max_price&min_rating&language&available&q&sort&page` · `GET /marketplace/providers/{id}` (profile, listings, portfolio, reviews) · `GET /marketplace/listings?type&category&…` · `GET /marketplace/listings/{id}/slots?from&to` · `POST /marketplace/bookings` (idempotency key; creates booking + order + Paystack init, returns `authorization_url` or charges saved card) · `GET /marketplace/bookings?status` · `GET /marketplace/bookings/{id}` · `POST /marketplace/bookings/{id}/{cancel|accept-delivery|request-changes|dispute}` · `GET|POST /marketplace/threads` · `GET|POST /marketplace/threads/{id}/messages` (PRD `POST /marketplace/bookings/{id}/messages` kept as an alias) · `POST /marketplace/files` · `POST /marketplace/bookings/{id}/documents` (attach from Documents) · `GET /marketplace/reviews/pending` · `GET /marketplace/reviews/mine` · `POST|PATCH /marketplace/reviews` · `GET /marketplace/orders` · `GET /marketplace/orders/{id}/receipt` · `GET /marketplace/matches` (AI, cached) · `GET /marketplace/tools` · `POST /marketplace/tools/{id}/reveal` · `POST /reports` (existing, new item types).

**Provider** (`require_provider`; own rows only): `GET|PATCH /provider/me` · `POST /provider/apply` · `POST /provider/submit` · CRUD `/provider/listings` (+`/submit`, `/pause`) · `GET|PUT /provider/availability` · `GET /provider/bookings` · `POST /provider/bookings/{id}/{accept|decline|deliver|complete}` · threads/messages/files as above · `GET|PUT /provider/payout-account` (Paystack name resolution on save) · `GET /provider/earnings` · `POST /provider/reviews/{id}/reply`.

**Admin** (`/admin/marketplace/*`, scope `moderation`, reason min 10 chars): `GET /providers?status` · `GET /providers/{id}` · `POST /providers/{id}/{approve|reject|request-changes|suspend|unsuspend}` · `PUT /providers/{id}/vetting` · `GET /listings?status` · `POST /listings/{id}/{approve|reject|request-changes|unlist|relist}` · reports via the existing `/admin/reports` · `GET /disputes` · `POST /disputes/{id}/resolve` · `GET|POST|PATCH /tools`. **Super Admin:** `POST /super-admin/marketplace/payouts/{id}/{hold|release|retry}` · `PATCH /super-admin/marketplace/providers/{id}/commission` · `GET /super-admin/marketplace/reconciliation`.

**Webhook:** the existing Paystack billing webhook gains a dispatcher: `charge.success` with reference prefix `mp_` → marketplace order finalise (re-verify by reference, idempotent on `event_key`); `refund.processed|failed`; `transfer.success|failed|reversed`. Subscription events untouched.

**Events:** `marketplace.booking.created|confirmed|declined|expired|cancelled`, `marketplace.delivery.submitted|accepted|changes_requested`, `marketplace.order.paid|released|refunded`, `marketplace.payout.paid|failed`, `marketplace.dispute.opened|resolved`, `marketplace.review.created`, `marketplace.provider.approved|rejected`.

## 7. Notifications

| Kind (founder, F + the booker) | Copy (PRD strings kept) |
|---|---|
| `marketplace.booking.confirmed` | "Booking confirmed: {service} with {provider} · {date}" |
| `marketplace.delivery.submitted` | "{Provider} delivered your order" · CTA "Review delivery" |
| `marketplace.review.prompt` | "How was {provider}? Leave a quick review" |
| `marketplace.booking.declined` / `.expired` | "{Provider} could not take this on. You were refunded in full." |
| `marketplace.message.new` | "{Provider}: {preview}" |
| `marketplace.dispute.resolved` | "We reviewed your report on {service}: {outcome}" |
| **Provider (email + portal inbox)** | new booking request (accept within 48 h), booking cancelled, changes requested, delivery accepted + payout queued, payout paid/failed, review received, listing approved/rejected, vetting result |
| **Staff** | new application, new listing, dispute opened, payout failed (Admin dashboard counters, not notifications) |

Rules: no founder notification to mentors/advisors; review prompt sent once at completion plus one reminder at 7 days; message notifications collapse per thread for 10 minutes.

## 8. AI touchpoints and cost

| Touchpoint | What | Cost / control |
|---|---|---|
| **Match banner** (`GET /marketplace/matches`) | One LLM call picks the open roadmap/mission task most suited to outside help and maps it to one of the five categories, with a one-line reason. **Providers are then ranked deterministically** (category, rating, price fit, availability), so "{n} strong matches" is a real count of vetted providers with an active listing | About 1.5-2k tokens per workspace, cached 24 h and recomputed on roadmap change at most daily; about 30-40 credits at tokens/50. Metered in `llm_usage` as `marketplace_match`; whether it decrements plan credits follows the Dashboard briefing (decide at build). Zero matches or no suitable task: banner hidden, never a fake count |
| AI disclaimer link | §1.4 copy "find one in the Marketplace" becomes a deep link `/marketplace?category=Legal` (or Accounting by context) | none |
| Listing/profile pre-screen | Deterministic rules (L9) | none |
| Review spam check | Rate and similarity rules, staff queue | none |

Deliberately not in v1: AI-written briefs, AI provider summaries, AI dispute triage. Each would cost 3-5k tokens per use and adds a way to be confidently wrong about money or credentials.

## 9. Build slices

One API PR per slice, each with its own migration (numbers claimed at build time; Funding and Investor Readiness slices also queue after 0088, and Legal #214 clashes on 0087), SOP, checklist update, and a live-captured FE guide (`docs/fe-integration-guide-marketplace-*.md`). Security-critical slices (C, E) get an Opus review per task.

| Slice | Content | New tables |
|---|---|---|
| **A. Providers and vetting** | `marketplace_providers`, files, portfolio, `require_provider`, invite/apply, profile API, credentials upload, Admin vetting queue and checklist, provider emails, audit | providers, files, portfolio |
| **B. Listings and directory** | listings (+ pending revision), availability + slot generator, pre-screen, listing moderation, founder directory/profile/listings/slots read APIs, filters, `content_reports` new types, unlist | listings, availability_rules/exceptions |
| **C. Booking and checkout** | bookings, orders, **ledger** (append-only), Paystack initialize/saved-card for `mp_` references, webhook dispatcher + `marketplace_webhook_events`, slot holds, accept/decline/expiry timers (auto-refund), receipts, `MARKETPLACE_PAYMENTS_ENABLED` flag, Marketplace ToS consent | bookings, orders, ledger_entries, webhook_events |
| **D. Fulfilment and messaging** | threads/messages, brief files + Documents grants, deliveries, accept/request-changes, consultation Calendar event + ICS, auto-release timers, notifications (founder + provider) | threads, messages, deliveries |
| **E. Settlement and disputes** | payout accounts (name resolution, Fernet), release → payout worker (balance-aware retry), Paystack Transfers + webhooks, refund with amount, disputes + staff resolution + Super Admin step-up, chargeback offset, payout hold, nightly reconciliation | payout_accounts, payouts, disputes |
| **F. Reviews, matches, tools, purchases** | reviews (verified, reply, edit, report), rating recompute, `GET /orders` + receipt PDF, AI matches (cached), partner tools + clicks + CMS, notifications polish, disclaimer deep link | reviews, partner_tools, tool_clicks |

Order: A → B → C → D → E; F can start after D. **Legal gate:** C is built and tested on Paystack test keys; production charging stays off until D-MP-9 clears. Slices E and C together are the only place money moves.

FE passes (after merged API, exact-scope briefs): FE-1 founder directory, profile, services, booking drawer with real slots/pay, bookings, threads; FE-2 reviews, purchases, tools; FE-3 provider portal; FE-4 Admin marketplace queues and Super Admin money console. Then an every-control re-walk on merged develop: founder, team member, provider, Admin, Super Admin, plus the blocked roles; 1440 and 375; real Paystack **test-mode** payment, refund, transfer and webhook round trips captured; unhide the sidebar entry last.

## 10. Verification plan (per slice)

Unit and API tests for guards, state machine, slot maths, commission rounding (kobo, banker's-safe, sum of net + commission = price), idempotent webhooks (replay, out-of-order, bad HMAC), ledger append-only trigger, double-booking race (two founders, one slot), expiry timers, refund amounts, payout retry; live e2e journey on a scratch DB with Paystack test keys: invite expert → vet → list → approve → founder books and pays → expert accepts → delivers → founder accepts → payout; plus decline, expiry, request-changes, dispute (all three outcomes), chargeback offset. Each guide cites captured bodies. Not provable locally: real bank transfers and settlement timing (needs live Paystack with Transfers enabled), licence-check ops, tax treatment.

## 11. Risks and follow-ups

- Cold start: an empty directory is worse than a hidden one; unhide only after 10+ approved experts across at least four categories.
- Staff load: vetting at 30-45 min each and disputes need a named owner.
- Off-platform leakage of commission: accepted and policed by ToS and cancel-after-message flags (L17).
- Follow-ups: custom quotes, USD, provider Google calendar sync, expert Paystack subaccounts (if (b) is chosen later), AI briefs, saved experts / favourites, expert analytics, public (logged-out) expert pages for SEO.
