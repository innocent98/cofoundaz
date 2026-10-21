# Sales Hub: design (PRD Module 11)

Date: 2026-10-21 · Owner: lead session · Gap list: `docs/checklist/sales-prd-gaps.md`
Sources: `Cofoundaz_Technical_PRD.md` Module 11 (§11.1 to §11.6, API, entities, events, notifications, access matrix row
"validation / marketing / sales"), the designed Sales UI already in `app/(dashboard)/sales/*`, and the Marketing build
(precedent for access, money, AI jobs and honesty about missing integrations).

## 1. Intent

Sales is the only revenue hub with no backend. Today all six sub-pages run on seeded `useState` in `hooks/useSalesApi.ts`:
nothing persists, the coach and analytics are static, and the Dashboard's `pipeline` KPI says "Coming Soon". The goal is
a real, small CRM that an early-stage founder actually runs their first customers through: leads in, deals across a
board, a timeline per account, outreach sequences that really send, an AI coach that rehearses calls on their real deals,
and analytics computed from that data.

**Success:** every control on the six sub-pages works against the API for founder and team member at 1440 and 375, the
Dashboard pipeline tile shows a real value, and a sequence email really lands in an inbox from the outreach domain.

**Non-goals:** external CRM sync (HubSpot, Pipedrive), Gmail/Outlook mailbox connect, inbound reply parsing, open/click
tracking, multi-currency, per-member "Sales grant".

**Anti-goals:** anything that could get an email account suspended (outreach is kept on its own provider so signup emails are never at risk); a "coming
soon" state for something we could build; numbers in AI prose that the API didn't compute.

## 2. Decisions

| ID | Decision | By |
|---|---|---|
| D-SAL-1 | Sequences **really send**, through a **separate email provider, not Resend** (Adebayo is providing it, 2026-10-21), from its own outreach domain, so outreach can never affect the auth-email account. The sender sits behind an `OutreachSender` interface; only slice B depends on the provider. Reply-To = the sending member's account email. Real unsubscribe links. "Stop when they reply" is a manual **Mark replied** until inbound mail exists. | Adebayo, 2026-10-21 (provider revised same day) |
| D-SAL-2 | Access: founder + every team member full access, no grant (same as D-MKT-1). Mentor, consultant and all other roles get 403, Sales hidden from their sidebar, no sales search hits or notifications. | lead (Marketing precedent) |
| D-SAL-3 | Money in kobo (`value_minor`), currency fixed `NGN`, formatted ₦ with two decimals like Marketing. | lead |
| D-SAL-4 | Stages are editable per workspace: rename, reorder, add, delete (only when empty). Exactly one **won** and one **lost** terminal stage, renamable, never deletable. Max 10 stages. Each stage has a win probability used for the weighted forecast (defaults 10/20/40/60/80/100/0). | lead |
| D-SAL-5 | A deal card opens a **deal drawer** (the PRD names no deal page): edit fields, change stage, activity timeline, notes, call prep, delete. The board gets **+ Add deal**. | lead |
| D-SAL-6 | "Make it a deal" converts a lead: finds or creates the account (case-insensitive company name match within the workspace), creates a contact from the lead, creates a deal in the first stage, marks the lead `converted` with links to all three. | lead |
| D-SAL-7 | Stall = no activity for N days (workspace setting, default 14, 3 to 90). Activity = logged activity, stage move, or a next-step edit. Notified once per stall episode. | lead |
| D-SAL-8 | Send guardrails (protect the outreach provider account and domain): 100 sequence emails per workspace per day; at most one sequence email per recipient per day; workspace-wide suppression list (unsubscribed, bounced, complained); **auto-pause** every active sequence in a workspace on its 3rd complaint in 7 days or a bounce rate above 10% over its last 50 sends, with a notification to founders. | lead |
| D-SAL-9 | Role-play coach reuses the co-founder chat protocol (202 + generating message + poll), in its own tables. Scorecard and call prep are background LLM jobs, metered against the existing daily budget. | lead |
| D-SAL-10 | Health Score live signals do **not** read sales data in this build-out (follow-up; needs targets per stage like D-HEA-2). | lead |

## 3. Data model (migrations 0063 onward, all `startup_id`-scoped, all lookups through `tenant_scope`)

| Table | Key columns |
|---|---|
| `sales_settings` | startup_id PK, stall_days (14), outreach_postal_address (nullable, printed in the footer when set), paused_at, paused_reason |
| `pipeline_stages` | id, startup_id, name, position, kind (`open`/`won`/`lost`), win_probability (0..100) |
| `sales_accounts` | id, startup_id, name, website, industry, description, owner_id, created_at |
| `sales_contacts` | id, startup_id, account_id (nullable), first_name, last_name, email (nullable), phone, title, created_at |
| `sales_leads` | id, startup_id, name, company, email, source (`manual`/`csv`/`referral`/`inbound`/`event`/`other`), status (`new`/`working`/`qualified`/`disqualified`/`converted`), owner_id, converted_deal_id/contact_id/account_id, created_at |
| `deals` | id, startup_id, name, account_id, contact_id, value_minor, currency, stage_id, next_step, next_step_due, closed_reason (`price`/`timing`/`competitor`/`no_budget`/`ghosted`/`other`), closed_note, closed_at, owner_id, last_activity_at, stalled_notified_at, created_at |
| `deal_stage_changes` | id, deal_id, from_stage_id, to_stage_id, changed_by, changed_at (feeds funnel + cycle length) |
| `sales_activities` | id, startup_id, kind (`call`/`email`/`meeting`/`note`), body, occurred_at, author_id, account_id, contact_id, deal_id (at least one set) |
| `email_sequences` | id, startup_id, name, steps_json (`[{wait_days, subject, body}]`, 1 to 10 steps), stop_on_stage_change bool, status (`active`/`paused`/`archived`), created_by |
| `sequence_enrollments` | id, sequence_id, lead_id or contact_id, email, enrolled_by, status (`active`/`completed`/`replied`/`unsubscribed`/`bounced`/`stopped`), current_step, next_send_at, unsubscribe_token_hash |
| `sequence_sends` | id, enrollment_id, step_index, provider_message_id, sent_at, delivery_status (`sent`/`delivered`/`bounced`/`complained`) |
| `sales_suppressions` | startup_id, email (lower), reason, created_at; unique (startup_id, email) |
| `sales_coach_sessions` / `sales_coach_messages` | session: mode `roleplay`, deal_id or scenario text, persona, difficulty, status, scorecard_json; messages: role, content, status (chat protocol) |
| `sales_call_preps` | id, deal_id, status, output_json (context, objections + responses, call goal, 3 discovery questions), created_at |

Merge tags are `{{first_name}}`, `{{last_name}}`, `{{company}}`, `{{sender_name}}`. Unknown tags are rejected at save time;
a recipient missing a value gets an empty string, never the literal tag.

## 4. API (`/api/v1/sales/*`, `require_role(*SALES_ROLES)` = founder + team_member)

- `GET /sales` overview: total pipeline value (open stages), weighted forecast, win rate (won / (won + lost), all time),
  per-stage count + value sum. Feeds the board header and the Dashboard `pipeline` KPI (`status: "ok"`, `value_minor`,
  `currency`; trend via `kpi_snapshots`).
- Stages: `GET/PUT /sales/stages` (whole ordered list in one call, validated: one won, one lost, no delete with deals).
- CRUD `/sales/leads|accounts|contacts|deals` with list filters (status, owner, stage, account, q) and pagination like
  Marketing. `GET /sales/accounts/{id}` returns info + contacts + open deals + lifetime won value.
- `POST /sales/deals/{id}/stage` `{stage_id, closed_reason?, closed_note?}`: `closed_reason` required for the lost stage,
  writes `deal_stage_changes`, bumps `last_activity_at`, publishes `sales.deal.stage_changed` and `sales.deal.won|lost`.
- `POST /sales/leads/{id}/convert` (D-SAL-6) → `{deal, account, contact}`.
- CSV import: `POST /sales/leads/import/preview` (multipart, ≤2 MB, ≤5,000 rows) → headers, first 5 rows, suggested
  mapping; `POST /sales/leads/import` `{upload_id, mapping}` → `{added, duplicates_skipped, invalid_rows: [{row, error}]}`.
  Dedupe by lowercased email against existing leads, contacts, and earlier rows in the file; rows without email are
  allowed and never deduped. FE toast: "{added} added, {n} duplicates skipped".
- Activities: `GET/POST /sales/activities?account_id|contact_id|deal_id`, `PATCH/DELETE` author only.
- Sequences: CRUD; `POST /sales/sequences/{id}/enroll` `{lead_ids?, contact_ids?}` → `{enrolled, skipped: [{id, reason}]}`
  (reasons: no email, suppressed, already active in this sequence); `POST /sales/enrollments/{id}/replied`,
  `POST /sales/enrollments/{id}/stop`; `POST /sales/sequences/{id}/steps/{i}/write` (AI draft job, appends nothing, returns
  a suggested subject + body for the FE to drop into the step).
- Sending status: `GET /sales/sending` → `{configured, domain, sent_today, daily_cap, paused, paused_reason}`; founders can
  `POST /sales/sending/resume`.
- Coach: `POST /sales/coach/sessions`, `POST /sales/coach/sessions/{id}/messages` (202), `GET /sales/coach/sessions/{id}`,
  `POST /sales/coach/sessions/{id}/end` (scorecard job); `POST /sales/deals/{id}/call-prep` (job), `GET` latest.
- Deal follow-up: `POST /sales/deals/{id}/follow-up` → AI draft job; the drawer shows it and can send it once through the
  same sender and guardrails (logged as an `email` activity).
- `GET /sales/analytics?from&to`: funnel (deals that reached each stage, from `deal_stage_changes`), avg cycle days
  (created → won, won in range), win/loss reasons (lost in range), activity leaderboard (activities per member in range),
  monthly closed-won revenue (last 12 months).
- Public, no auth: `GET /public/sales/unsubscribe/{token}` (status for the FE page) and `POST` (one-click, RFC 8058,
  also the `List-Unsubscribe-Post` target). `POST /webhooks/sales-outreach`: signature verified the provider's way with
  `SALES_OUTREACH_WEBHOOK_SECRET`, maps delivered / bounced / complained, idempotent on the event id.

## 5. Sending (D-SAL-1, D-SAL-8)

- Provider: **to be named by Adebayo** (not Resend). `OutreachSender` interface (`send(message) -> provider_message_id`)
  with a console implementation for local/e2e and one implementation for the chosen provider. New settings:
  `SALES_OUTREACH_PROVIDER`, `SALES_OUTREACH_API_KEY`, `SALES_OUTREACH_DOMAIN` (any unset = not configured),
  `SALES_OUTREACH_WEBHOOK_SECRET`. The provider must report bounces and complaints (webhook) or D-SAL-8 can't work.
- Header: `From: "{Sender name} at {Startup}" <outreach@{SALES_OUTREACH_DOMAIN}>`, `Reply-To: {sender email}`,
  `List-Unsubscribe: <https://{api}/public/sales/unsubscribe/{token}>`, `List-Unsubscribe-Post: List-Unsubscribe=One-Click`.
  Footer appended server-side and not editable: startup name, postal address if set, "Unsubscribe" link to the FE page
  `/unsubscribe/{token}`. Tokens are random, stored hashed.
- A scheduler job every 5 minutes picks due enrollments (`next_send_at <= now`, sequence active, workspace not paused,
  under cap) with row locks (`FOR UPDATE SKIP LOCKED`), renders, sends, records `sequence_sends`, advances the step. Over
  the cap: stays due for tomorrow. Stop conditions: replied, unsubscribed, bounced/complained, suppressed, deal stage
  changed (when the sequence opts in), last step sent.
- Not configured (`SALES_OUTREACH_DOMAIN` unset): sequences can be built and enrolled, nothing sends, and the Sequences
  page shows "Sending isn't set up yet" with the reason; this is the only honest blocked state and it disappears when the
  env is set. Local dev and e2e use the console sender.

## 6. Notifications and events

| Event | Audience | Copy (PRD) |
|---|---|---|
| `sales.deal.stalled` | deal owner if F/TM, else founders | "Deal stalled: {deal} has had no activity for {n} days", CTA "Suggest a follow-up" → deal drawer, follow-up draft |
| `sales.deal.won` | F + TM | "Deal moved to Closed Won: {deal} 🎉" |
| `sales.sending.paused` | founders | "Sales emails paused: too many {bounces/complaints}", CTA "Review" → Sequences |

`sales.deal.stage_changed` and `sales.deal.lost` are published for the activity feed (visibility = SALES_ROLES) and
analytics, no notification. Search: deals, accounts, contacts and leads in ⌘K for F + TM, hrefs to the board drawer,
account page, contact drawer and leads list.

## 7. FE (replace `useSalesApi` with `lib/api/sales.ts` + hooks; no mock left)

- Pipeline: real columns from `/sales/stages`, header from `/sales`, drag calls the stage endpoint (optimistic, rolled
  back on error), real `ConfettiBurst` on won, lost-reason modal posts the reason, stall badge from `last_activity_at`,
  + Add deal, deal drawer (D-SAL-5), stage editor (D-SAL-4) behind a "Edit stages" control.
- Leads: columns Name, Company, Source, Status, Owner, Created; quick-add with email; real CSV upload → mapping step →
  result toast; "Make it a deal" (PRD copy); enroll in sequence from row.
- Accounts: list → `/sales/accounts/[id]` page (info panel, contacts list, open deals, activity log, notes); contact
  drawer with fields + "Log activity" timeline; enroll from contact row.
- Sequences: list columns (name, steps, active enrollments, reply rate); builder (add/remove/reorder steps, wait days,
  subject, body, merge-tag menu that inserts at the cursor, "Write with AI", exit conditions with "Stop when they reply"
  locked on), enrollments table with Mark replied / Stop, sending status banner, unsubscribe page `/unsubscribe/[token]`.
- Coach: real role-play setup (deal picker or scenario, persona, difficulty), chat, End session → scorecard with
  "Practice this again"; Call prep with deal picker; copy "Rehearse here, win out there."
- Analytics: all five PRD widgets from `/sales/analytics` with a date range.

## 8. Slices

| Slice | Scope | Review |
|---|---|---|
| **A (BE)** CRM core | settings, stages, accounts, contacts, leads + CSV import, deals + stage moves, activities, stall scheduler + notification, won notification, overview + Dashboard KPI, search, activity visibility, permissions | Sonnet reviews; Opus on permission checks + scheduler |
| **FE-A** | Pipeline, Leads, Accounts (+ account page, drawers) on A | Sonnet |
| **B (BE)** Sequences + sending | sequences, enrollments, sender, scheduler with row locks, guardrails + auto-pause, suppression, unsubscribe, provider webhook, Write with AI, deal follow-up draft + send | **Opus** (webhook signature, public unsubscribe, row locks); provider-specific part waits on §9 |
| **C (BE)** Coach + analytics | coach sessions, scorecard, call prep, analytics endpoint | Sonnet |
| **FE-BC** | Sequences, Coach, Analytics, unsubscribe page | Sonnet |
| Re-walk | every control, all roles, 1440 + 375, one real send to a test inbox once DNS is live | lead |

Each BE slice ships tests, an e2e journey whose captures feed `cofoundaz-api/docs/fe-integration-guide-sales-*.md`, an
SOP and checklist rows. A and FE-A can overlap with B.

## 9. Needs from Adebayo (not blocking A or C)

1. Name the outreach email provider and its sending domain; set the domain up and verify it there.
2. Confirm it can send bounce/complaint webhooks; point one at `https://{staging-api,api}.cofoundaz.com/api/v1/webhooks/sales-outreach`.
3. Put the key and webhook secret in the env files (`SALES_OUTREACH_*`); Claude never reads the values.

## 10. Left to the builder

Pagination sizes, exact index set, persona preset list, prompt wording, chart library choices (match Marketing analytics),
drawer vs page breakpoints at 375.

## 11. Lead calls from the builder check (settled, change any)

1. **Sender** = the member who enrolled (`enrolled_by`), frozen at enrolment as name + email on the enrollment. If that
   member has left, the enrollment falls back to the sequence's `created_by`, then to the first founder. Deal follow-ups
   send as the clicking member.
2. **Unsubscribe** suppresses the email for the whole workspace and stops every active enrollment for it there. It never
   crosses workspaces.
3. **Webhook core** (handler, idempotency on provider event id, bounce/complaint counting, auto-pause) is built against a
   normalized event `{event_id, type, provider_message_id, email, occurred_at}`; only the signature check + parsing adapter
   waits for the provider. Events for an unknown `provider_message_id` still suppress by email and are logged.
4. **Per-recipient limit** defers the step to the next day, applies across all sequences and the deal follow-up. Due sends
   go out oldest `next_send_at` first; anything over a cap rolls to the next day in the same order.
5. **Stop on stage change** = any stage move of an open deal whose `contact_id` is the enrolled contact (or the converted
   deal of the enrolled lead). Converting a lead moves its active enrollments to the new contact.
6. **Funnel history:** a deal's creation writes an initial `deal_stage_changes` row (`from_stage_id` null). Funnel counts
   use stage position, so "reached stage X" = reached X or later. A stage with history can still be deleted when it has
   no deals: it is soft-deleted (`archived_at`), kept for history and hidden from the board.
7. **Reopen** is allowed (drag out of won/lost): clears `closed_at` / `closed_reason`; won revenue counts only deals
   currently won. `sales.deal.won` fires on every move into won; the notification is de-duplicated to once per deal per day.
8. **Stall:** only open-stage deals; new activity clears `stalled_notified_at` (ends the episode). No owner, or an owner who
   left → notify founders. Owners must be current F/TM members (validated on write).
9. **Dashboard trend:** add `pipeline` to the existing daily `kpi_snapshots` job and `_TREND_FIELD`, same as the other tiles.
10. **CSV preview** is stored in Redis for 30 minutes under `upload_id`. Invalid = unparseable email, or no name and no
    company. `invalid_rows` returns at most 50 entries plus a total count.
11. **Converting a lead with no company** creates no account (deal and contact have `account_id` null). No email → contact
    without email (not enrollable).
12. **Unsubscribe:** List-Unsubscribe points at the API POST; the footer link at the FE page using the existing app-URL
    setting the auth emails use. Both public endpoints are rate-limited per IP like the auth endpoints.
