# Funding Hub: design

Date: 2026-11-05. Status: **draft, waiting for Adebayo's calls on D-FUND-1..8** (questions, options and costs in
`docs/checklist/funding-prd-gaps.md`). PRD Module 14 (`Cofoundaz_Technical_PRD.md:569-590`), plus the Module 15 hand-off
(`:591-608`), the access row `funding (shared scopes) / investor-readiness | ✓ | ▢ | — | R(shared) ...` (`:899`) and the plan
catalog (`app/services/billing/catalog.py:14`, `funding` is a Scale module).
Mock: `app/(dashboard)/funding/**` (6 pages, 910 lines) on `hooks/useFundingApi.ts` (seeded `useState`). Hidden from the sidebar since
FE #184. **The API has no Funding code at all**: no models, no routes, no `funding.*` events or notification kinds.

## 1. What this is, in the founder's terms

A founder raising money needs five things in one place, and each maps to a sub-page:

| Sub-page | The founder's question | Built from |
|---|---|---|
| Pipeline `/funding` | "Who am I talking to, and what's next with each?" | New: investors, interactions, round |
| Data room `/funding/data-room` | "Can I show diligence material safely, and who looked at what?" | **Reuses Documents** (files, folders, viewer, PDF tooling); new: shares with a viewer log |
| Cap table `/funding/cap-table` | "Who owns what, and what does this round do to me?" | New: holders, instruments, scenarios; pure maths, no AI |
| Term sheets `/funding/term-sheets` | "Which offer is better, and what's odd in it?" | New: term sheets; AI extraction and explanation over deterministic rules |
| Grants `/funding/grants` | "Which non-dilutive money fits me, and how do I apply?" | New: grant catalogue, matches, applications; AI fit and drafting |
| Analytics `/funding/analytics` | "How is the raise going?" | Derived from the above; no new tables |

## 2. What already exists, and what we reuse (do not duplicate)

| Need | Existing piece | How Funding uses it |
|---|---|---|
| Files, folders, versions, trash, virus-scan state | `documents`, `document_files`, `document_folders`, `document_versions` | The data room **references** library items. It never copies a file. |
| Viewing a file in the browser, signed content URLs | Documents viewer and `signed_urls` | Investor viewer streams through a Funding route that checks the share, then the same storage layer. |
| PDF handling | `pypdf` and `reportlab` already dependencies, `esign_pdf.py` stamps PDFs | Per-viewer watermark = stamp at serve time. No new dependency. |
| Link shares with expiry and revoke | `document_shares` + `services/documents/links.py` (HMAC-derived token, only the hash stored) | **Same token pattern, new table**: Documents shares are one document, view-only, and keep only `last_viewed_at`. A data room share spans folders and needs a per-view log, a viewer email gate and watermark. Extending `document_shares` would break its `CHECK (document XOR file)` and its public page. |
| Person-bound access that binds on verified email | `document_grants` (D-DOC-1) | Pattern for the optional investor account path (D-FUND-3). |
| Investor as a role | `MembershipRole.investor` exists; Team invite deliberately excludes it ("they arrive via Funding", `services/team/members.py:42`) | Funding owns the investor invite. |
| Funding inflows in the ledger | `FUNDING_CATEGORY` (D-FIN-11), runway/burn in `services/finance/*` | Suggested raise size; "record the money" on commit. Funding is cash, never revenue. |
| Jobs + LLM + budget | `job_dispatcher`, worker, `platform/llm.py` (`complete_json`), `llm_budget` (100k tokens/day/workspace) | Every AI touchpoint below is a job through the same seam. Stub client keeps tests offline. |
| Notifications, realtime, events | `notifications/registry.py`, `platform/events.py`, `realtime.py` | New kinds `funding.*` (PRD events). Audience is founder + team members with Funding access, never "all members". |
| Calendar | Calendar module (events, action items) | "Meeting" stage and interaction log can link a calendar event. Optional link, no new calendar code. |
| SAFE document | `template_defs.py` SAFE template with disclaimer | Cap-table SAFE row offers "Draft SAFE" through the existing template instantiate. |
| Plan gating | `SCALE_MODULES` includes `funding`; enforcement is behind `PLAN_ENFORCEMENT` | Reuse the `funding` module key. No new gate. |
| Pipeline UX | Sales Kanban (stages table, drag, stall) | Same interaction shapes; but **separate tables**: investors are not deals and stages are fixed by the PRD. |

## 3. Roles (the F+TM pattern, with two exceptions)

| Role | Pipeline, Data room, Grants, Analytics | Cap table, Term sheets |
|---|---|---|
| Founder | full | full |
| Team member | full (F+TM, as Sales/Finance, D-MKT-1) | **per D-FUND-5** (recommended: founder only) |
| Mentor, Business Consultant, Legal Advisor, Accountant | none (403 "You don't have access to this page.") | none |
| Investor (external) | **only** what a data room share scopes to them, through the viewer; never the pipeline, cap table or term sheets | none |

Server-side on every route (`require_funding_editor`, the same shape as Sales' guard). Hiding the sidebar item is not access control.
The mock's PRD note "INV: read-only shared Data Room + Readiness" is honoured as: data room scopes + an optional `readiness` scope that
Investor Readiness owns (see section 9).

## 4. Data model sketch

Money is `*_minor` integers with a `currency` (D-FUND-7: one currency per round). Every table has `startup_id` (row policy) and the usual
`id`, `created_at`, `updated_at`.

```
funding_rounds      id, name, status(planning|open|closed), currency, target_minor, pre_money_minor?, opened_at, closed_at
investors           id, round_id, name(person or firm), firm, type(angel|vc|syndicate|other), stage(7 values), warm(bool),
                    check_min_minor, check_max_minor, committed_minor?, next_step, next_step_on?, last_touch_at,
                    thesis_notes, source(manual|directory), directory_id?, passed_reason?, stage_entered_at, position
investor_events     id, investor_id, kind(stage_change|note|email|call|meeting), body, occurred_at, calendar_event_id?, actor_id
investor_directory  id, firm, type, stage_focus[], sectors[], geographies[], check range, website, source_url, verified_on   -- only if D-FUND-1 = seed

data_room_folders   id, name, position, is_standard                                   -- the six standard + custom
data_room_items     id, folder_id, document_id? | file_id? (XOR), position           -- references into Documents
data_room_shares    id, round_id?, investor_id?, email, scopes(folder ids), allow_download, watermark, expires_at?,
                    token_hash, revoked_at?, otp_required, last_viewed_at
data_room_views     id, share_id, item_id, viewer_email, started_at, duration_s, ip_hash   -- the access log

cap_holders         id, name, kind(founder|employee|advisor|investor|pool), user_id?, email?
cap_entries         id, holder_id, security(common|preferred|option|safe|note), shares?, price_minor?, amount_minor?,
                    valuation_cap_minor?, discount_pct?, issued_on, vesting(cliff_months, months, start_on)?, round_id?, notes
cap_scenarios       id, name, inputs_json(new_money, pre_money, pool_topup_pct, ...), result_json, created_by

term_sheets         id, investor_id?, label, source_file_id?, terms_json(valuation, amount, pool, liq_pref, participating, board,
                    pro_rata, exclusivity_days, ...), flags_json, extracted_by_ai(bool), confirmed_at
grants              id, name, funder, amount_min/max_minor, currency, deadline, regions[], sectors[], stages[], eligibility,
                    source_url, verified_on, status(active|stale)                  -- the catalogue, shared across workspaces
grant_matches       id, startup_id, grant_id, fit_score, why_json, state(new|dismissed|applying), computed_at
grant_applications  id, startup_id, grant_id?, name, funder, status(draft|submitted|won|lost), deadline, owner_id, answers_json
```

No new table for analytics: funnel, time-in-stage (from `stage_entered_at` + stage_change events), committed-vs-target and
engagement all derive from the above. Health Score signals from Funding are **not** added (same call as D-SAL-10: deferred).

## 5. Endpoints (the PRD list, made concrete)

All under `/api/v1/funding`, JSON, guarded as section 3. Public viewer routes are token-scoped and unauthenticated by design.

| Area | Endpoints |
|---|---|
| Round | `GET/PUT /round` (one open round per workspace in v1), `GET /overview` (header bar, nudges) |
| Pipeline | `GET/POST /investors`, `PATCH/DELETE /investors/{id}`, `POST /investors/{id}/stage` (passed needs reason), `GET/POST /investors/{id}/events`, `POST /investors/{id}/meeting-prep` (job), `GET /directory` (if seeded) |
| Data room | `GET /data-room`, `POST /data-room/setup` (six standard folders), folder + item CRUD, `GET/POST /data-room/shares`, `DELETE /data-room/shares/{id}`, `GET /data-room/access-log`, **public** `GET /dr/{token}` (meta), `POST /dr/{token}/otp`, `POST /dr/{token}/verify`, `GET /dr/{token}/items/{id}/content`, `POST /dr/{token}/heartbeat` |
| Cap table | `GET /cap-table` (`?fully_diluted=`), holders and entries CRUD, `POST /cap-table/model` (stateless), scenarios CRUD |
| Term sheets | CRUD, `POST /term-sheets/extract` (job, from an uploaded file), `GET /term-sheets/compare?ids=` |
| Grants | `GET /grants/matches`, `POST /grants/matches/{id}/dismiss`, applications CRUD, `POST /grants/applications/{id}/draft` (job) |
| Analytics | `GET /analytics?from=&to=` |

Events: `funding.dataroom.viewed`, `funding.grant.matched`, `funding.round.committed_changed` (PRD), plus `funding.term_sheet.added`.
Notifications (PRD copy): "{Investor} viewed your data room, {doc}, {duration}" (one per share per day, not per page), "New grant match:
{grant} · {amount} · closes {date}" CTA "See fit", "Term sheet added, comparison updated". Audience: founder + team members only.

## 6. Per sub-page behaviour (what makes it real, not a mock)

**Pipeline.** Seven fixed stages (Research, Outreach, Meeting, Diligence, Term Sheet, Committed, Passed). Drag or the card menu moves a
card; Passed needs one of five reasons (the mock's five stay); every move writes an `investor_events` row and resets `stage_entered_at`.
Header bar = sum of `committed_minor` over Committed investors versus `target_minor` (the mock hard-codes ₦58M of ₦90M and calls it
"soft-committed"; PRD says target vs soft-committed, so the bar counts Term Sheet + Committed with an amount, split into two tones
(**lead default D-FUND-L2**). New: Add investor, edit card, interaction log, next step with date, empty state. A suggested target =
18 months of net burn from Finance runway, shown as a hint, never auto-applied. Committed with an amount opens a confirm: "Record this in
Finance and the cap table?" (creates a Funding-category transaction only after the founder confirms the money arrived, and a SAFE row
draft). Prompt, never automatic.

**Data room.** "Set up standard structure" creates Corporate / Financials / Product / Market / Team / Legal. Items are picked from the
Documents library (files and rich documents) and shown with their permission/scan chips; a file with `scan_status != clean` cannot be added.
A share = email (typed or picked from the pipeline), folder scopes, optional expiry, watermark (default on), download (default off),
and an emailed link. The investor opens `/dr/{token}`, proves the email with a 6-digit code (**D-FUND-3**), then browses only the scoped folders
in an in-app viewer. PDFs are stamped with the viewer email at serve time; other types are view-only unless the founder ticks download
(**D-FUND-8**). The viewer sends a 15-second heartbeat so `duration_s` is real. Access log tab = viewer, doc, time, duration; revoke is
immediate; the share row tells "Viewed Pitch deck" back into the pipeline card (the drawer's data room chip is real instead of hard-coded).
A document that is trashed or loses its scan status disappears from the room at once (checked on every serve, not on add).

**Cap table.** Holders and entries; fully-diluted toggle; vesting fields; donut from the same rows. "Model a round": new money, pre-money,
option pool top-up %, SAFE conversion; output is a before/after table and the headline "You'd go from {a}% to {b}%". Save as scenario
stores inputs and result. All maths is deterministic server code with unit tests against worked examples; **no LLM touches a number**.
Scope of instruments per D-FUND-4. The page carries the §1.4 disclaimer. The mock's "Founders 70 · Options 18 · SAFE 12" is wrong in kind:
a SAFE has no shares until it converts, so the ledger shows it as an amount with cap/discount and the model converts it.

**Term sheets.** Upload (PDF) or enter by hand. Extraction is an AI job that proposes values the founder **must confirm** before they are
saved (`confirmed_at`). Comparison table has one column per sheet (not the mock's fixed A/B). Flags come from a deterministic rules
table (liquidation preference above 1x or participating, option pool above 15% pre-money, exclusivity above 45 days, more than one
investor board seat on a seed round, super pro-rata, full-ratchet anti-dilution) and the AI only words each flag in plain language
(**D-FUND-6**). Copy "Negotiate with clarity." and the §1.4 disclaimer on the page and in the notification.

**Grants.** A shared `grants` catalogue (**D-FUND-2**) is matched to a workspace in a weekly job: a deterministic prefilter (region, sector,
stage, deadline not passed) then the LLM scores the best 10 and writes a one-line "why it fits" using the profile and Business Builder.
Matches land with the PRD notification. "Start application" creates an application whose editor has "Draft with AI": each of the funder's
questions is filled from Business Builder + Finance, every answer editable and ✨-chipped. The tracker table (Draft/Submitted/Won/Lost,
deadline, owner) is the second tab. A workspace can also add a grant by hand to the tracker.

**Analytics.** Funnel (Contacted = left Research, Meetings, Diligence, Committed), average time in stage, committed vs target, data room
engagement (views per day, average session, top documents). Every number has a "no data yet" state, not zeros dressed up as data.

## 7. AI touchpoints and cost

Cost is tokens against the existing 100k/day/workspace budget (a job that hits the budget ends with the worded
"budget used up for today" state, as Sales does). Estimates assume the chat-class model already configured.

| Touchpoint | Trigger | Rough tokens | Notes |
|---|---|---|---|
| Meeting prep | button on an investor card | ~5k (in 4k, out 1k) | Investor notes + last events + Finance snapshot + Business Builder one-liner. Cached per investor for 24h. |
| Grant matching | weekly job + "refresh" | ~8k per run per workspace | Prefilter keeps the LLM to ten candidates. |
| Grant application draft | button | ~2k per question, ~15k per application | Per answer; the founder can redo one answer. |
| Term sheet extraction | upload | ~10k in, 1k out | Founder confirms values. |
| Term sheet flag wording | on save | ~3k | Only for rule-flagged terms. |
| Cap table, pipeline, data room, analytics | | **0** | Deterministic. |

A normal active month for one founder: about 60-80k tokens in total, i.e. under one day's budget. No AI call on any page load.

## 8. External dependencies

| Dependency | Needed for | Status |
|---|---|---|
| Transactional email (Resend, the Documents share path) | data room invite, OTP code, viewed notice | exists |
| A public host for `/dr/{token}` | investor viewer | the FE already serves `/shared/[token]`; same Next app, new route |
| cPanel SMTP (Sales outreach) | **not used.** Funding sends one-to-one invites, not outreach. | n/a |
| Investor and grant source data | directory, catalogue | **D-FUND-1, D-FUND-2**: content we curate and Adebayo reviews (same flow as Academy content, API #188) |
| FX rates | multi-currency totals | **avoided** by D-FUND-7 (one currency per round) |
| Mono, Paystack, Google | nothing | n/a |

## 9. Interface with Investor Readiness (assumed, flag for `ir-design`)

Assumed, so the two designs can be built in either order:

1. IR exposes `GET /readiness/score` returning at least `{score: 0-100, band, computed_at}` per workspace. Funding **reads** it for
   one nudge on the Pipeline: below 40 a quiet banner "Your readiness score is {n}. Closing gaps first usually helps"; never a block,
   because the PRD gates nothing, it only shows the "Open Funding Hub" CTA at 70+. If the score does not exist yet the banner is absent.
2. IR's CTA "Open Funding Hub" deep-links to `/funding`. Both items are unhidden from the sidebar **together** (they are one story).
3. The pitch deck IR reviews is a Documents file. Funding's data room offers "Pitch deck" as a pinned item pointing at the latest
   reviewed version; IR owns the deck, Funding only references it.
4. The investor-visible readiness score ("INV sees Readiness Score only if shared") is a **scope on a data room share**
   (`scopes` may include the token `readiness`); IR owns the payload and Funding just serves it. Not in slice B's first cut unless IR has shipped.
5. Mock Q&A and Financial Narrative need nothing from Funding. IR's narrative checker reads Finance, as today.

## 10. Build slices

One API PR per slice with its own migration (numbers taken at build time; develop is at 0088 and other work is in flight), SOP, checklist
update and a **live-captured** FE guide `cofoundaz-api/docs/fe-integration-guide-funding-*.md`. FE follows on merged API (a human FE dev
or our team, Adebayo's call as with Admin). Security-critical slices get an Opus review per task.

| Slice | Content | New tables | Size / review |
|---|---|---|---|
| A: Round + Pipeline | guard, round, investors, events, stage rules, header stats, notifications `funding.round.committed_changed`, directory if D-FUND-1 = seed | `funding_rounds`, `investors`, `investor_events` (+ `investor_directory`) | M; Sonnet |
| B: Data room | structure, items by reference, shares, OTP gate, public viewer routes, watermark stamping, heartbeat, access log, `funding.dataroom.viewed` | `data_room_*` (4) | **L, security-critical**: public token, email gate, serve-time authorisation, rate limits. Opus review per task |
| C: Cap table | holders, entries, vesting, fully-diluted, round model engine, scenarios, SAFE draft link | `cap_*` (3) | M; engine needs worked-example tests. Opus final review |
| D: Term sheets | CRUD, compare, rule flags, extraction job, AI wording | `term_sheets` | S-M; Sonnet |
| E: Grants | catalogue + import command, match job, applications, Draft with AI | `grants`, `grant_matches`, `grant_applications` | M; content review by Adebayo |
| F: Copilot + Analytics + glue | meeting-prep job, analytics endpoint, Finance "record the money", readiness banner, calendar link | none | S; Sonnet |
| B2 (only if D-FUND-3 = accounts) | investor invite as `MembershipRole.investor`, read-only Shared data room page, grant-style email binding | none beyond B | M, security-critical |

Order: A, B, C, D, E, F (B before C because the cap table snapshot is the thing investors ask for most, and a data room is useless without
folders to put it in). FE passes follow each slice on merged API; re-walk of every control for every role at 1440 and 375, as for Sales.

## 11. FE changes to the mocks

- Pipeline: real API, add investor, card edit, interaction log, empty state; the drawer chip and header bar read real data.
- Data room: replace the folder count rows with a tree of real items, add Set up standard structure, expiry date, pick-from-pipeline,
  allow-download toggle; access log gains document and duration; investor viewer route `/dr/[token]` (public, own layout).
- Cap table: add-entry drawer with vesting, fully-diluted toggle, dilution table, scenarios list; remove the hard-coded 70% maths.
- Term sheets: variable columns, upload/enter, confirm-extracted-values step.
- Grants: expandable "why it fits", Application tracker tab, editor with Draft with AI, manual add.
- Analytics: real charts; "no data yet" states.
- No "coming soon": anything not built is left out. Unhide Funding in the sidebar only when all of A-F are merged and re-walked (with IR).

## 12. Known gaps against the PRD (deliberate, pending the calls)

Hardware-grade e-sign on term sheets (not in the PRD); investor accounts if D-FUND-3 stays on magic links; multi-currency totals; live
grant scraping; 409A/valuation advice (never); Health Score signals from Funding; investor updates (Module 22.3 uses this investor list, built there).
