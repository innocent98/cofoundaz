# Marketplace: PRD + UI gap list (2026-11-05)

Source of truth: `Cofoundaz_Technical_PRD.md` Module 16 (§16.1 to §16.6, messaging, API, entities, events, notifications), line 131 (AI disclaimer link),
Module 25.3 / 25.5 (vetting, listing moderation, reported reviews), Module 24 (payment, receipts), the access row at line 900. Designed UI:
`app/(dashboard)/marketplace/*` (layout + 6 pages on `hooks/useMarketplaceApi.ts`). Design: `docs/superpowers/specs/2026-11-05-marketplace-design.md`.

**How it was checked:** read-only inventory of both repos (FE `develop` `4beea23`, API develop `08b34faa`, last migration 0088). There is **no Marketplace API**
(no model, route, event, notification kind, row policy). Every page is static or seeded `useState`, so every data-backed row below is a gap by construction.
The only existing touches: `/marketplace: [F, TM]` in `lib/nav-access.ts:41`, the `ReportItemType` comment "Marketplace reviews join when Marketplace is built",
and the Admin mock's "Expert vetting" tab (D-ADM-5 deferred it to here).

Legend: ❌ gap · Layer: BE / FE / both · Slice (BE): A Providers+vetting · B Listings+directory · C Booking+checkout+ledger · D Fulfilment+messaging · E Settlement+disputes · F Reviews+matches+tools+purchases
· FE-1 founder directory/booking · FE-2 reviews/purchases/tools · FE-3 provider portal · FE-4 Admin/Super Admin queues
· Severity: **Sec** (security/money/trust) > **High** > **Med** > **Low** · "Default" = lead default (spec 1.2), built unless Adebayo objects.

## Decisions (D-MP-1..9): all accepted 2026-11-05 (Adebayo: "Accept all nine")

Full options, costs and exposure are in the spec §1.1 and §1.3. Recommendations:

| ID | Question | Recommendation |
|---|---|---|
| D-MP-1 | Who can be an expert: invite-only / open applications / hybrid | **Hybrid**: launch with 10-20 invited experts; "Apply" page feeds the same vetting queue behind a flag |
| D-MP-2 | Provider surface: Admin-operated / small provider portal / email links | **Small provider portal** `/provider` (about 6 pages) |
| D-MP-3 | Money flow: platform holds + pays out / Paystack split subaccounts / off-platform | **Platform holds and pays out, gated on counsel + Paystack in writing**; fall back to split |
| D-MP-4 | Release/refund/dispute policy | **Hold until acceptance; auto-release 7 d (48 h for consultations); 2 revisions; full refund until accepted; staff-decided disputes; over ₦500k needs Super Admin** |
| D-MP-5 | Commission | **15% from the expert side, founder pays the listed price**, per-provider override |
| D-MP-6 | What "Vetted" means and who does it | **Per-category rubric** (licence + 2 refs for Legal/Accounting; ID + portfolio + 1 ref otherwise); tooltip lists only checks done |
| D-MP-7 | Reviews | **Verified only**: one per completed booking, 30 d window, 7 d edit, expert reply, "New" until 3 |
| D-MP-8 | What "Tools & Integrations" are | **Curated directory with sourced perks only**; Connect only for real integrations; else hide the tab. Never ship the mock's invented deals |
| D-MP-9 | Legal gate | **Build everything; production charging off until counsel and Paystack answer** |

Lead defaults D-MP-L1..L19 (spec §1.2), the ones that change what a page does: L1 only founders pay/accept/review; L2 card only (AI credits are not money); L4 no custom-quote flow; L5 two listing types; L7 provider accepts within 48 h or auto-refund; L8 listing edits re-review; L11 staff read a thread only inside a dispute.

## Mock control inventory (every control on the layout and six pages)

| Page | Control | Today | Row |
|---|---|---|---|
| Layout | 6 tab pills (Experts, Services, Tools & Deals, Bookings, Reviews, Purchases), `ShellTopBar` | route links only | 1 |
| Layout | `ToastContext` provider | local toasts stand in for every action | 2 |
| Experts | AI banner "Based on your roadmap, you could use **Design** help with **Landing Page UI**. We found **1** strong match." | hard-coded | 9 |
| Experts | "See match" button | sets category filter to Design only | 9 |
| Experts | Category pills (All, Legal, Accounting, Design, Development, Marketing) | filters seeded list | 5 |
| Experts | Budget, rating, languages filters | absent (PRD) | 5 |
| Experts | Card: avatar initials, Vetted badge + tooltip, name, specialty, rating + count, "Starts at" | seeded (3 providers), tooltip static | 3, 4, 6 |
| Experts | Card "Message" | toast "Drafting message..." | 20 |
| Experts | Card "Book" | toast then redirect to Bookings after 1 s | 15 |
| Experts | Card click / provider profile page | none exists | 7 |
| Experts | Empty state "No providers found for this category yet." | present | 8 |
| Services | Listing cards (title, provider avatar/name/Vetted icon, deliverables, price, days) | seeded (2) | 11 |
| Services | "Book this" | toast then redirect to Bookings | 15 |
| Services | Filters, provider link, slot for consultations | absent | 12, 13 |
| Services | Empty state | present | keep |
| Tools | Cards (logo initials, category chip, name, one-liner, discount tag) | seeded Stripe, AWS Activate with invented perks | 32, 33 |
| Tools | "Get deal" (external-link icon) | toast "Applying for ... deal" | 34 |
| Tools | "Connect" (PRD) | absent | 35 |
| Tools | Empty state | absent | 36 |
| Bookings | "New booking request" button | opens generic drawer, no listing | 16 |
| Bookings | 4 status tabs (Upcoming, In progress, Delivered, Closed) | filter 2 seeded rows | 24 |
| Bookings | Booking card (title, provider, date, amount, status chip) | seeded | 24, 25 |
| Bookings | "Accept delivery" | local status to closed, toast | 26 |
| Bookings | "Request changes" | local status to in_progress, toast | 27 |
| Bookings | Empty state | present | keep |
| Bookings drawer | Backdrop close, 3-step bar, Cancel/Back, "Next Step" | local state | 15 |
| Bookings drawer | Step 1: date input, time-slot Select (2 hard-coded WAT slots) | uncontrolled, ignored | 13, 14 |
| Bookings drawer | Step 2: brief textarea, upload drop zone (click does nothing) | uncontrolled | 17, 18 |
| Bookings drawer | Step 3: summary ("Custom Request", "Selected Date", "TBD via quote") | static text | 16, 19 |
| Bookings drawer | "Submit Brief" | closes, toast "Booking confirmed!" | 19, 21 |
| Reviews | Pending prompt: heading, 5 star buttons (hover/click), Feedback textarea, "Submit review" | one seeded prompt; rating/text state shared by all cards | 40, 41 |
| Reviews | Zero-star guard toast | present | keep |
| Reviews | Submitted list (provider, service, stars, date, quote) | seeded | 42 |
| Reviews | Empty "no pending reviews" | present; no empty for submitted | 43 |
| Purchases | Table (Item, Provider, Amount, Date, Status) | seeded 2 rows, amounts as strings | 44, 45 |
| Purchases | Receipt download button | toast "Downloading receipt..." | 46 |
| Purchases | Filter, empty state | absent | 47 |
| Elsewhere | AI disclaimer "find one in the Marketplace" | plain text, no link (`legal/review/page.tsx:142` and other AI outputs) | 10 |
| Elsewhere | Admin "Expert vetting" tab | mock (`app/admin-portal/page.tsx`), removal was planned | 54 |
| Elsewhere | Sidebar entry | hidden by FE #184; unhide last | 61 |

## Gaps

### Platform and roles
| # | Gap | Sev | Layer | Slice | Default / Q |
|---|---|---|---|---|---|
| 1 | No Marketplace API: no models, routes, events, notification kinds or row policies; tabs navigate to seeded pages | High | both | A-F | |
| 2 | Every action is a local toast; replace the toast shim with real success/error states from the API | Med | FE | FE-1/2 | |
| 3 | Directory data is seeded; needs `providers`, search, pagination, stable ids | High | both | B | L18 |
| 4 | "Vetted" is a boolean set in code; must come from staff-ticked checks and expire with the licence | Sec | both | A | D-MP-6 |
| 5 | Only category pills; PRD wants category, budget, rating, languages (plus search, sort, "available this week") | Med | both | B, FE-1 | L18 |
| 6 | Rating shown as a number with a review count from seed; needs verified-review aggregate, "New" below 3 reviews, refunded reviews excluded | High | both | F | D-MP-7 |
| 7 | No provider profile page (bio, services, portfolio, reviews, Message, Book) | High | both | B, FE-1 | |
| 8 | Empty states for no providers/no match in filters; error and loading states | Low | FE | FE-1 | |
| 9 | AI banner hard-coded (Design / Landing Page UI / 1 match); needs `GET /marketplace/matches` from the real roadmap, deterministic ranking, real count, hidden if zero | High | both | F | cached 24 h, about 30-40 credits |
| 10 | AI disclaimer "find one in the Marketplace" (PRD:131) is not a link; deep-link to `/marketplace?category=Legal|Accounting` | Med | FE | F | |
| 11 | Services are seeded; need listings with type, price_minor, deliverables, delivery days, revisions | High | both | B | L5 |
| 12 | Services lack filters (category, price, timeline) and a link to the provider | Med | both | B, FE-1 | |
| 13 | No provider availability: no rules, exceptions, timezone, notice, buffer; no slot API | High | both | B | L6 |
| 14 | Slot Select is two hard-coded WAT times; show real slots in the founder's timezone with the provider's | High | FE | FE-1 | |
| 15 | "Book" / "Book this" only redirect; booking must start from a specific listing and carry it through the drawer | High | both | C, FE-1 | |
| 16 | Generic "New booking request" and "TBD via quote" have no PRD basis; remove and book from a listing | Med | FE | FE-1 | L4 |
| 17 | Brief is uncontrolled and never saved | High | both | C | |
| 18 | Upload zone does nothing; need scanned uploads (type/size limits) and "Attach from Documents" (time-boxed view grant) | High | both | C, D | L10 |
| 19 | Confirmation step shows fake data; must show listing snapshot, slot, total, ToS consent, then **Pay** | High | both | C, FE-1 | D-MP-3, L2 |
| 20 | "Message" is a toast; need threads before booking and per booking, files, unread, notification; no AI affordances | High | both | D | L17 |
| 21 | No payment: need Paystack initialize/saved-card for `mp_` references, webhook finalise (HMAC, dedupe, re-verify), orders, ledger, slot hold, idempotency | Sec | BE | C | D-MP-3; flag `MARKETPLACE_PAYMENTS_ENABLED` |
| 22 | Plan credits as payment (PRD 16.4) is not possible: AI credits are tokens/50, not money | Med | both | C | L2 |
| 23 | Provider accept/decline within 48 h, auto-refund on silence or decline; slot freed | High | BE | C | L7 |

### Bookings, delivery, money
| # | Gap | Sev | Layer | Slice | Default / Q |
|---|---|---|---|---|---|
| 24 | Bookings and four tabs are seeded; need the booking state machine mapped to Upcoming / In progress / Delivered / Closed, plus per-booking detail | High | both | C, D, FE-1 | spec §5 |
| 25 | Card has no meeting link, add-to-calendar, due date, thread, files, cancel | Med | both | D, FE-1 | |
| 26 | "Accept delivery" is local; needs real acceptance that releases the payment, plus auto-release (7 d / 48 h) | Sec | both | D, E | D-MP-4 |
| 27 | "Request changes" is local; needs reason, round counter (2 included), provider response, after-limit path to dispute | High | both | D | D-MP-4 |
| 28 | Provider side: submit delivery with message and files, mark consultation complete | High | both | D, FE-3 | D-MP-2 |
| 29 | Consultation bookings must create a Calendar meeting for the founder with the provider as external attendee (ICS) | Med | BE | D | reuses `calendar/invites.py` |
| 30 | Cancel, refund (full/partial), no-show, provider-no-show report; Paystack `refund()` needs an `amount` | Sec | BE | C, E | D-MP-4 |
| 31 | Disputes: open, evidence, staff resolution (release / refund / split), Super Admin step-up above threshold, audited thread access | Sec | both | E, FE-4 | D-MP-4, L11, L19 |
| 32 | Payouts: expert bank account (name resolution, Fernet), release → queue → Paystack Transfer, balance-aware retry, webhooks, failure handling | Sec | BE | E | D-MP-3, L13 |
| 33 | Commission snapshot per booking, kobo rounding, per-provider override, net preview to expert | Sec | BE | C, E | D-MP-5 |
| 34 | Append-only ledger + nightly reconciliation against Paystack; chargeback offset on provider balance | Sec | BE | C, E | L12 |
| 35 | Payment webhook dispatcher for `mp_` references, refunds and transfers on the existing endpoint; subscription events unchanged | Sec | BE | C, E | |
| 36 | Legal/regulatory review before production charging (funds holding, KYC/AML, NDPA, VAT/WHT, ToS) | Sec | process | gate | D-MP-9, spec §1.3 |

### Tools and deals
| # | Gap | Sev | Layer | Slice | Default / Q |
|---|---|---|---|---|---|
| 37 | Tools are seeded with invented perks ("₦20M fee-free", "$10k credits") that no agreement backs; misrepresentation risk | Sec | both | F, FE-2 | D-MP-8 |
| 38 | Tools need a staff CMS (name, logo, perk text, link, `verified_on`, active) with 90-day staleness flag | Med | both | F, FE-4 | D-MP-8 |
| 39 | "Get deal" is a toast; reveal code/link, count the click, show affiliate disclosure | Med | both | F | D-MP-8 |
| 40 | "Connect" (PRD) absent; only deep-link to integrations we actually have | Low | both | F | D-MP-8 |
| 41 | No empty state for tools | Low | FE | FE-2 | |

### Reviews and purchases
| # | Gap | Sev | Layer | Slice | Default / Q |
|---|---|---|---|---|---|
| 42 | Pending reviews and given reviews are seeded; need real reviews tied to completed bookings, one per booking, 30-day window | High | both | F | D-MP-7 |
| 43 | One shared `rating`/`reviewText` state across all pending cards (bug once more than one prompt exists) | Med | FE | FE-2 | |
| 44 | Edit within 7 days; provider public reply; report a review (Reported issues); removal by staff only | Med | both | F, FE-2 | D-MP-7 |
| 45 | Empty state for submitted reviews missing; prompt-sent notification once + reminder at 7 d | Low | both | F | |
| 46 | Purchases are seeded strings; need `orders` with kobo amounts, status (Paid/Held/Released/Refunded/Partially refunded/Failed), link to booking | High | both | F, FE-2 | |
| 47 | Receipt button is a toast; need a real receipt PDF (service + commission lines, ToS-consistent, flagged "not a tax invoice" until accountant review) | High | both | F | spec §1.3 (5) |
| 48 | Purchases lacks filters (status, date) and empty state | Low | both | F, FE-2 | |

### Providers and Admin
| # | Gap | Sev | Layer | Slice | Default / Q |
|---|---|---|---|---|---|
| 49 | No provider account type: `marketplace_providers`, `require_provider`, invite and apply, TOTP optional, cannot book own listing | Sec | BE | A | D-MP-1, D-MP-2, L16 |
| 50 | Provider portal missing entirely: overview, profile, listings, availability, bookings, messages, earnings + payout account | High | both | A-E, FE-3 | D-MP-2 |
| 51 | Credential and ID uploads: storage, scan, restricted access (moderation scope only), audited, retention and deletion | Sec | BE | A | spec §1.3 (4) |
| 52 | Vetting queue (checklist per category, approve / reject with reason template / request changes / suspend, licence-expiry flag) | Sec | both | A, FE-4 | D-MP-6; PRD 25.3 |
| 53 | Listing moderation (pending queue, diff for revisions, approve / reject / request changes), deterministic pre-screen | High | both | B, FE-4 | L8, L9 |
| 54 | Reported listings and reviews tab: dismiss, unlist with PRD confirm copy, escalate; add `listing`, `provider`, `review` to `ReportItemType` | High | both | B, F, FE-4 | PRD 25.3, 25.5 |
| 55 | Admin mock "Expert vetting" tab is static; rebuild on real queues (D-ADM-5 deferral ends) | Med | FE | FE-4 | |
| 56 | Super Admin money console (payout hold / release / retry, commission override, reconciliation) with audit and reasons | Sec | both | E, FE-4 | L19 |
| 57 | Notification kinds + preferences for founder side (booking confirmed, delivered, review prompt, declined/expired, message, dispute outcome); provider emails + portal inbox | High | BE | C, D, F | L14; PRD strings kept |
| 58 | Events `marketplace.booking.confirmed`, `marketplace.delivery.submitted` (PRD) plus the rest in spec §6 | Med | BE | C, D | |
| 59 | Row policies: founder tables by `startup_id`; provider sees only own rows and only the booking brief/files; TM mutations rejected | Sec | BE | A-F | L1 |
| 60 | Access: nav-access already `[F, TM]`; API must 403 mentor/accountant/legal/BC/investor and enforce founder-only money actions | Sec | BE | A-F | L1 |
| 61 | Unhide the sidebar entry only after FE-1..4 and the every-control re-walk pass; and only with 10+ approved experts in 4+ categories | Med | FE | last | cold-start rule |
| 62 | Re-walk: every control, roles F / TM / provider / Admin / Super Admin / blocked roles, 1440 + 375, real Paystack test-mode payment, refund, transfer, webhook | Med | process | after FE | feedback-rewalk |

## PRD line map (nothing unmapped)

| PRD | Maps to rows |
|---|---|
| Access F, TM; providers separate portal, v1 via Admin | 49, 50, 59, 60, D-MP-2 |
| 16.1 filter rail, cards, Vetted tooltip, AI banner, "See matches", profile page | 3-9, 4 |
| 16.2 services cards, Book this | 11-15 |
| 16.3 tools, Connect / Get deal, discount tags | 37-41 |
| 16.4 slot, brief, attach docs, pay (credits or card), status list, Accept / Request changes | 13-19, 21-27 |
| 16.5 reviews | 42-45 |
| 16.6 purchases, receipt link | 46-48 |
| Messaging per booking | 20 |
| API list, entities, events, notifications | 1, 57, 58 |
| Line 131 AI disclaimer link | 10 |
| 25.3 pending listings, approve / reject / request changes, reported listings, unlist copy | 52-55 |
| 25.5 reported reviews | 54 |
| Module 24 payment, receipts; Stripe replaced by Paystack (D-ADM-6) | 21, 22, 47 |
| Line 900 access row | 60 |
