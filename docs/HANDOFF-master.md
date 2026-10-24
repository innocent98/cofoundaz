# HANDOFF — Cofoundaz app-wide build-out (master)

> **First message for a new lead session (start it yourself, from `/Users/adebayovictor/Documents/dev/cofoundaz`):**
> *"Read `cofoundaz/docs/HANDOFF-master.md` and continue as the lead. Start with §2b. No half-built pages; ask me only for
> genuine product calls."*
>
> If the lead-8 handoff PR hasn't merged yet, read this file from its branch:
> `git -C cofoundaz fetch -q origin && git -C cofoundaz show origin/docs/lead8-handoff:docs/HANDOFF-master.md`

Last updated: **2026-10-24 (lead session 8 handover)**. This file is a map; the detail lives in the gap lists
(`docs/checklist/*-prd-gaps.md`, `*-rewalk.md`), SOPs (`docs/sop/` in both repos), FE guides
(`cofoundaz-api/docs/fe-integration-guide-*.md`), design specs (`docs/superpowers/specs/`), the master checklists
(`cofoundaz-api/docs/checklist/PROJECT_CHECKLIST.md`, `docs/checklist/buildout-status.md`), and memory.

---

## 0. FOR ADEBAYO

### 0a. Open PRs and merge order (lead 8 handover, 2026-10-24 ~15:30 WAT)
| Order | Repo | PR / branch | What | State |
|---|---|---|---|---|
| 1 | API | [#180](https://github.com/innocent98/Cofoundaz-api/pull/180) `feature/profile-name-update` | `PATCH /auth/me` `{full_name}`: invited members could never set a name. **FE #152 (merged) already calls it**, so its D2 name prompt errors until this merges | lead-built, local gates green (3945 tests, 96.90%, isolated DBs), live-captured guide `docs/fe-integration-guide-profile.md`; PR CI was running |
| 2 | FE | [#153](https://github.com/innocent98/cofoundaz/pull/153) `feature/finance-fe` | Whole Finance hub on the real API (7 pages, keys never echoed, signed receipts, model editor, Mono Connect) | lead-checked; conflict resolved at `bbe5f362`; the session saw 1 local Playwright failure after the develop merge, so **check PR CI's E2E before saying "merge"** |
| 3 | FE | [#151](https://github.com/innocent98/cofoundaz/pull/151) `docs/sales-sequences-rewalk` | Sequences hand re-walk evidence (both live sends recorded) | needs: re-check of the #154 rows + the unsubscribe round trip (§0c item 2), then merge and mark Sales ✅ |
| - | API | `chore/env-update-2026-10-24` (Adebayo's own) | `cb18ff65 chore(env): update encrypted staging & production environment`, committed locally on the shared API checkout's `develop` (blocks the lead's `pull --ff-only`) | Adebayo: `pull --rebase` + push to a branch + PR (the lead can't push `.enc` files) |
| - | FE | `docs/lead8-handoff` | this handoff | docs |

"Dependency review (PR only)" is red on every API PR: repo setup, not code. Ignore it.

**Merged in lead session 8 (2026-10-24):** API #171 (Finance c, 0067), #172 (Sales B sequences, 0068), #174 (re-chain 0068 onto 0067), #173 (Academy BE, 0069), #175 (CD SSH port from `vars`; backfill runnable in the image), #176 (Finance d model + Mono, 0070), #177 (outreach jobs outside the worker SAVEPOINT), #178 (env.sh verify; lesson filename), #179 (public token routes rate-limited per caller). FE #146, #147, #148 (Academy FE), #149 (Sales Sequences FE), #150 (Academy re-walk evidence), #152 (Academy re-walk fixes D1/D2/D4), #154 (Sequences re-walk fixes).

### 0b. Decisions (all also in memory)
All are reversible and none blocks merging.
1. **Health blend (D-HEA-1):** each dimension = 50% kickoff assessment + 50% live app signals. *Alternative:* raise the live share once there's usage data.
2. **Health ramp (D-HEA-1b):** the live share rises from 0% on assessment day to 50% over 14 days, so a new founder's score doesn't halve on day one.
3. **Health signal targets per stage (D-HEA-2)** live in `cofoundaz-api/app/services/health_score/live_signals.py`. For example, Validation stage targets 5 assumptions tested, 5 interviews/30d, roadmap 20% done, 2 team members and 1 signed agreement. Adjust any of them.
4. **KPI threshold alerts:** runway below 3 months, revenue past ₦100K/₦1M/₦10M, CTR below 1% (`cofoundaz-api/app/services/dashboard/kpi_snapshots.py`).
5. **Mission delivery time (D-MIS-1):** opening the app early still generates the mission instantly; delivery time drives the morning notification and pre-generation.
6. **Upcoming reorder (D-MIS-2)** really changes future missions (stored as `mission_rank` on roadmap tasks).
7. **"+ Invite":** Co-Founder joins as `founder` (full access); investors aren't invitable there (they'll come via Funding).
8. **Search:** Journal is excluded (entries have no title and are encrypted at rest).
9. **Roadmap AI breakdown (D-RM-1):** "Ask AI to break this down" runs as a background job and only **appends** 3 to 5 tasks (deduped by title), never edits or deletes. One run at a time per milestone.
10. **Comments (D-RM-2):** one generic comments thread (`/team/comments`, PRD 23.2), first used on roadmap milestones and tasks. Every member except **investors** can post; only the author edits or deletes; founders, team members or the author can resolve.
11. **Mentions (D-RM-3):** the FE sends explicit member ids picked from @-autocomplete (no parsing of @names from text), so nobody can mention someone outside the workspace.
12. **Due-soon notification (D-RM-4):** sent once per milestone, 2 days before its due date.

13. **Business Builder (D-BB-1..5):** canvas snapshots + restore (cap 50); Export creates a Documents doc; only
    `business_consultant` suggests; per-section AI only appends; "Send to financial model" feeds the 3-statement model's
    starting revenue only while there are no revenue actuals (revised; runway has no revenue assumption).
15. **Re-walk decisions (2026-10-19, lead):** D-MIS-7 ("Wrong priority" rests 7 days, "Doesn't apply" never returns,
    "Already done" completes the roadmap task), mission tasks complete their roadmap task, snoozed counts as resolved,
    D-MIS-8 (Mission reads F + TM only), D-RM-5 (completing a milestone completes its tasks). See memory
    `rewalk-decisions-2026-10-19`.
16. **AI budget raised to 100,000 tokens/startup/day** (Adebayo, 2026-10-19; one business plan ≈ 24k). API #147.
17. **Payments + Billing provider: Paystack** (Adebayo, 2026-10-19: "for payment, yes, we're using paystack."). Settles
    the Billing question below.
18. **Calendar sync redirect URLs (agreed):** `https://api.cofoundaz.com/api/v1/calendar/sync/google/callback`, the same path
    on `https://staging-api.cofoundaz.com` and `http://localhost:8000`; Outlook uses the same paths with `outlook` in place
    of `google`. Sync code isn't built yet: build to match these.
20. **Calendar: Google now, Microsoft later** ("we'll use that google for now, and microsoft later."). Outlook sync deferred.
21. **Bank connection: Mono** (Adebayo is registering). Mono test (sandbox) keys go in the env files like Google's; never
    read secret values. Build and test against Mono test mode; live keys after Mono's business approval.
22. **Paystack approach (PROPOSED, not yet a formal yes):** each founder connects their own Paystack by pasting their secret
    key in Finance → Integrations (no OAuth for third-party apps); stored encrypted, never returned. Their transactions are
    read as revenue; invoice "Pay now" creates payment links on their account (money goes straight to the founder).
    Adebayo's own Paystack account is only for Cofoundaz Billing (subscriptions). Dev: his test-mode keys stand in as a founder.
19. **Smoke-test subdomains parked** ("#3 is not coming, so we should park that atm."): pages stay at `/p/{slug}` (D-VAL-1).
14. **Validation (D-VAL-1..3, confirmed 2026-10-19):** smoke-test pages served at `/p/{slug}` on the app domain (subdomain
    later); build MVP feedback now; feedback sources = auto-import interview quotes + open survey answers, plus manual
    entries tagged interview/in-app/email (real email forwarding and an in-app widget later).
23. **Assessment (D-ASM-1..4, lead 2026-10-20):** reads + notifications founder + team member only (quarterly-due to founders);
    progress pct = answered / (answered + remaining applicable); `stage_at_time` snapshotted at completion, old rows "not
    recorded"; completion screen shows the new Health Score + per-dimension change. Memory `assessment-decisions`.
24. **Dashboard role leaks (lead 2026-10-20, from D-MIS-8):** mission + briefing data, mission search rows and mission/briefing
    notifications are founder + team member only; `finance.runway.low` also to accountant; `marketing.*` to F + TM.
    **Kept open to every role (your call if you disagree):** `healthscore.*` (Health page is open to all), `roadmap.*`,
    `business.*`, `document.*`.

24b. **Marketing (D-MKT-1..8, 2026-10-20):** D-MKT-1 every team member keeps full Marketing access, no grants (Adebayo:
    "keep"); D-MKT-8 no social/ad/SEO/analytics integrations yet (Adebayo: "no integration yet"): publishing only flips
    status, metrics manual, SEO numbers estimates, labelled honestly. Lead defaults D-MKT-2..7 (one channel per post,
    platform char limits, launch moves channels Not started→Testing, fixed segment attributes, interim CSV export, CAC by
    channel_mix labelled "estimated"). Memory `marketing-decisions`.
25. **No `claude/` branch names (Adebayo, 2026-10-21, global):** use `feature/`, `fix/`, `docs/`, `chore/`. App branch prefix is set
    to `feature`; every brief names the exact branch (`git push -u origin HEAD:fix/<slug>`). Same strictness as no attribution.

26. **Sales (D-SAL-1..10, design `docs/superpowers/specs/2026-10-21-sales-design.md`, approved 2026-10-21):** sequences **really
    send**, via a **separate mail provider (not Resend)**; Adebayo says webmail/SMTP (host not confirmed yet). Env names agreed:
    `SALES_OUTREACH_PROVIDER=smtp`, `SALES_OUTREACH_SMTP_HOST|PORT|SECURITY|USERNAME|PASSWORD`, `SALES_OUTREACH_FROM_EMAIL`,
    `SALES_OUTREACH_IMAP_HOST|PORT` (bounce reading), `SALES_OUTREACH_HOURLY_LIMIT` (already in the env files). Webmail gives no
    complaint feedback; Reply-To = the founder, so "Stop when they reply" stays a manual Mark replied. Lead defaults D-SAL-2..10 and
    the builder-check calls (§11 of the spec). Memory `sales-decisions`.
27. **Payments: Paystack AND Flutterwave now, founder chooses** (Adebayo 2026-10-21); per-founder secret keys pasted in Finance →
    Integrations, Fernet-encrypted with `FINANCE_CONNECTIONS_ENCRYPTION_KEY` (D-FIN-9), founder-only connect (D-FIN-2). Flutterwave
    webhooks are re-verified with the API (static `verif-hash` proves little). `API_PUBLIC_URL` = domain only (code appends `/api/v1`).
28. **Finance (D-FIN-1..9):** D-FIN-1 TM full access (from D-MKT-1); **D-FIN-3 budgets = every money-out ledger row** (Adebayo);
    D-FIN-9 key custody (Adebayo); rest lead defaults in `docs/checklist/finance-prd-gaps.md`. Memory `finance-decisions`.
29. **Academy (D-ACA-1..5), answered 2026-10-22:** D-ACA-1 "your recommendation" (markdown in `content/academy/` + loader,
    every item `draft` until Adebayo reviews it; CMS later); D-ACA-2 **YouTube** (unlisted, youtube-nocookie embeds; no videos
    recorded yet, lessons are transcript-only until then); D-ACA-5 "your recommendation" (Cofoundaz-issued PDF + public verify page +
    LinkedIn add-to-profile URL). Lead: D-ACA-3 picks by stage + Assessment/Validation gaps, D-ACA-4 any lesson order. Memory
    `academy-decisions`.
30. **Outreach mail host = cPanel** (Adebayo 2026-10-22), mailbox currently `info@cofoundaz.com`. Lead check (no login):
    server `mail.cofoundaz.com` (169.58.188.170, cert covers mail. and webmail.); from the dev network 465 is filtered, 587 STARTTLS
    and 993 IMAPS are open; SPF has the server IP; **no DKIM record published**; DMARC `p=none`. Why not Resend: Resend sends the
    auth email (signup/reset), and cold-outreach complaints could throttle or suspend it; Resend is for transactional/opt-in mail.
31. **D-FIN-10 (lead default, FE #146):** once Mono is connected, bank credits that match a Paystack payout are tagged "Paystack
    payout" and kept out of revenue. **Mono sandbox keys are now in the env files**, so the Mono adapter is buildable.

32. **D-SAL-11 outreach abuse gate (Adebayo 2026-10-24): "tied to a paid plan"**, then "can we leave it on for now, for testing pending
    when billing will be ready" -> outreach stays ON in every environment; the paid-plan gate is built together with Billing.
33. **Sales isn't blocked on DNS** (Adebayo 2026-10-24: "you do not need to pend, just continue, since its working"): the 13:40 WAT live
    send (sequence `e5b4701c-...`, ledger `sent`, delivered to his Gmail) counts as verified; DKIM/PTR is an ops follow-up (§0c).
34. **D-FIN-10 tightened (lead, from the #176 Opus review):** a bank credit is tagged "Paystack payout" (kept out of revenue and cash)
    only when its narration names Paystack AND Paystack charges in the 10 days before it cover its amount; the tagged count is in
    `last_sync_summary`. Mono webhooks read `data.account._id`.
35. **Outreach `.env` fixed by Adebayo** (IMAP trailing slash, `mail.cofoundaz.com`, 587 `starttls`) and DKIM "published" (in cPanel's
    zone, which isn't authoritative; see §0c item 1).

### 0c. Waiting on you (not on code)
**Do when convenient:**
1. **Outreach deliverability (DNS):** the live send landed in Gmail **spam**. `default._domainkey.cofoundaz.com` is **NXDOMAIN on the authoritative nameservers (Cloudoon: ns1.cloudoon.com, ns2.cloudoon.net, ns3.cloudoon.org)**: add the DKIM TXT from cPanel → Email Deliverability in the **Cloudoon** DNS panel (not cPanel's zone editor). Set reverse DNS for 169.58.188.170 to `mail.cofoundaz.com` at Contabo (now `vmi3513172.contaboserver.net`). Then the lead resends one check. Adebayo (2026-10-24): "you do not need to pend, just continue, since its working" -> not a Sales blocker.
2. **Unsubscribe round trip (last open Sales row):** the live emails' links point at `http://localhost:3000/unsubscribe/{token}`
   (local `APP_BASE_URL`), so clicking them in Gmail reached nothing (Gmail's own one-click banner shows "unsubscribed" regardless;
   cofoundaz.com 404s because prod is on `main` and the token is signed with the local key). Paste the link from the `+followup`
   email to the lead, who opens it on a local FE and checks the suppression row. Also still wanted: Gmail "Show original" SPF/DKIM/DMARC.
3. ~~Deal follow-up send~~ **done 14:43 WAT** to adevictor98+followup@gmail.com (200 `sent: true`; 429 `SEND_LIMIT_REACHED` on the
   plain address because it already had the 13:40 step; 409 `DRAFT_ALREADY_SENT` on a repeat). Recorded in #151.
4. Optional: delete the `VPS_PORT` **secret** from the staging and production GitHub environments (nothing references it since #175).
5. Still open from lead 7: confirm `SECRET_KEY` on staging/prod is a real random value; set `SALES_OUTREACH_UNSUBSCRIBE_KEY` per environment (generate with `python3 -c "import secrets; print(secrets.token_urlsafe(48))"`, never rotate it); a dedicated `outreach@` mailbox + hourly limit ~50.

**Product calls open:** Academy content review (48 draft files in `cofoundaz-api/content/academy/`, flip `review_status`); LinkedIn company page URL/id for `ACADEMY_LINKEDIN_ORG_ID`.

**Still blocked:** Victoria (Legal, API #138; her migration must chain after **0070**). Paystack/Flutterwave/Mono live checks need you to paste test keys in the Finance re-walk. Calendar sync not built (Google OAuth values in env). Smoke-test subdomains parked; inbound mail not available; Billing needs Paystack (and the outreach paid-plan gate, D-SAL-11, comes with it).

## 1. Repos and local stack
- FE `cofoundaz` (Next 16 App Router, React 19, Tailwind v4, TS strict) and API `cofoundaz-api` (FastAPI): sibling dirs under
  `/Users/adebayovictor/Documents/dev/cofoundaz`. The lead session works from the parent dir (not a git repo).
- **develop heads (2026-10-24, lead 8):** API `02965528` (#179), FE develop after #154. Main API checkout on develop; dev DB
  `cofoundaz-api_db` at **`0070_finance_model_mono`**, Academy content loaded, receipts backfill done (local moved=1, staging moved=0).
  Staging CD green at `25fad5a1` with the staging-verified proof minted. Sessions run their own FE dev server on a free port.
- **Lead 8 had standing OK to run docker commands itself** ("run the docker commands yourself"): pull, `alembic upgrade head`,
  restart, `docker compose build api worker` when a PR adds Python deps (#173 added reportlab/pyyaml and the API crashed until rebuilt),
  and `docker compose exec -T api python -m app.services.learning.content` after content changes.
- **Updating the shared stack needs Adebayo's say-so** (the classifier blocks it otherwise). On 2026-10-22 he said "run the docker
  commands yourself" and the lead ran `up -d` / migrate / restart fine (the api container also migrates on start). Ask per update, or give him
  `git -C cofoundaz-api pull --ff-only && docker compose -f cofoundaz-api/docker-compose.yml exec api alembic upgrade head && docker compose -f cofoundaz-api/docker-compose.yml restart api worker`.
  After #171 merges, once per environment: `docker compose -f cofoundaz-api/docker-compose.yml exec api python scripts/privatise_legacy_receipts.py`.
  The stack is sometimes stopped (other projects' containers running): `docker compose -f cofoundaz-api/docker-compose.yml up -d` first.
  Also blocked for the lead: fast-forwarding the shared FE checkout, local DB UPDATEs, decrypting env files, opening a PR that
  carries `.enc` files. Hand those to Adebayo as bash blocks.
- **Build pattern now in use:** the lead starts **sub-sessions** (`start_session`, Sonnet; a lead that was itself started by a session can only
  *propose* cards, and cards can't carry `cwd`, so briefs start in the parent dir and run `git worktree add
  /Users/adebayovictor/Documents/dev/cofoundaz/wt/<slug> -b <branch> origin/develop` themselves; worktrees live under `wt/`)
  with a complete brief; they open PRs; the lead verifies head branch, CI, attribution and reviews security paths (permission
  checks, schedulers/row locks, storage, auth) itself; Adebayo merges. A turn started by a session's report can't start new
  sessions (only message existing ones): ask Adebayo, then start on his word.
- **Scratch DBs** `ci_scratch`, `ci_scratch_test`, `ci_scratch_mig`, `b_e2e`, `b_mig` sit in the shared Postgres; tests must use them, never the dev DB.
- **Real-model capture recipe:** copy `scripts/e2e_run.sh` without the `LLM_PROVIDER=stub` line, point pytest at one scratch e2e file
  (see `docs/sop/2026-10-19-validation-prd-b.md`). Sub-sessions can't read the key, so real-model quality is checked in the FE
  live walk against the shared stack.
- **API (docker):** `api` :8000 (uvicorn --reload, bind-mounted), `worker` (restart after handler changes; "unhealthy" label is
  cosmetic), `db` :5432, `redis` :6379. Real LLM locally; daily budget 100k tokens/startup. Console email: links in `docker compose logs api`.
- **Test accounts (local only, never commit):** `throwaway-founder@example.com` / `Throwaway123!`, workspace NovaPay
  (`11ba2aa0-8c8d-4035-adb8-62530988ed44`). Role accounts: `bb-mentor-1`, `bb-consultant-1`, `rewalk-tm` @example.com, same
  password. Separate hosts per role: `localhost`, `tm.localhost`, `m.localhost`, `bc.localhost` on the FE port.

## 2. Status by page
| Page | BE | FE | Live re-walk on develop | State |
|---|---|---|---|---|
| Dashboard, Today's Mission, Health Score, Roadmap, Business Builder, Validation, Assessment, Marketing | done | done | ✅ | ✅ **Done** (8 pages) |
| Sales | #165, #166, #168, #172, #177, #179 | #142, #143, #149, #154 | 5 sub-pages 626/626 (#144); Sequences hand re-walk FE #151 open (both live sends verified) | 🟡 re-check #154 rows + unsubscribe round trip, then ✅ |
| Academy | #173, #178, #179, #180 (open) | #148, #152 | re-walk #150: 114/119, all 4 defects fixed (D3 #179, D1/D4/D2 #152, D2 needs #180) | 🟡 merge #180, re-check D1-D4, then ✅ |
| Finance | #167, #170, #171, #176 (all 35 BE gaps) | #153 (open, conflict resolved) | ⏳ | merge #153, then re-walk with Adebayo pasting test keys |

Remaining after these: Documents (API ✅) → Calendar (API ✅, sync not built) → Journal (API ✅) → Notifications (API ✅) → Team
(partial) → Settings (partial; Billing needs Paystack) → Funding, Investor Readiness, Marketplace, Analytics (no API: design first like
Sales) → Legal (Victoria).

## 2b. Incoming (ordered)
0. **Live sessions at lead-8 handover** (message them by id; don't start fresh):
   - Finance FE `local_46c51936-1d1c-4047-b02d-20b00ed14851` (`wt/finance-fe`): PR #153 done; API asks in its walk doc (runway hiring/one-off rows, invoice client picker/notes/payment details, Advisor finance context, XLSX export, legacy receipt `cbee3c6d` missing file).
   - Academy FE `local_11c6290f-96f0-46a6-8e97-edb90763ea10` (`fix/academy-rewalk-fe`): PR #152 done (D2 needs the API profile PR merged first).
   - Sales Sequences FE `local_8ce6b5db-7771-4a92-8238-1c759749d904` (`fix/sales-sequences-rewalk-fe`, Auto-fix on its PRs): PR #154 done.
   - Re-walk sessions (idle, keep for re-checks): Sales `local_01609068-f36e-4bd9-a388-ab9a77fd8e03` (PR #151), Academy `local_39d5cd53-7b1d-473e-abb0-24a1b22184d4`.
   - Done, archivable: Finance (d) BE `local_0b7311d5-2443-4c5c-9744-c1dfd6e7c33e`.
1. **Merge train (§0a):** API #180 (then live-test #152's D2 name prompt with a nameless member, e.g. a fresh invite) → FE #153 once its
   E2E is green. Then ask the **Academy re-walk session** (`local_39d5cd53-...`) to re-check D1-D4 on develop and mark Academy ✅, and the
   **Sales re-walk session** (`local_01609068-...`) to re-check the two #154 rows. The **unsubscribe round trip**: Adebayo pastes the
   `+followup` email's link; open it on a local FE (`http://localhost:<port>/unsubscribe/<token>`), confirm the page, the
   `sales_suppressions` row for `adevictor98+followup@gmail.com` and the status endpoint; record it in #151; merge #151; Sales ✅.
2. **Sales:** merge the FE fix PR, then the re-walk session re-checks its 2 rows; the lead does the **deal follow-up send** to
   adevictor98@gmail.com (only with Adebayo's OK, §0c item 3) and Adebayo clicks the **unsubscribe** link (§0c item 2). Then merge #151 and mark Sales ✅.
3. **Finance re-walk** after #153 merges (by hand, all roles, 1440 + 375) with Adebayo pasting Paystack/Flutterwave **test** keys for the
   live connect rows; Mono Connect sandbox opens locally. Then triage #153's API asks into a Finance BE slice (e).
4. Then the next pages in §2 order. Keep at most 2-3 sessions running.

## 2c. Follow-ups (not blocking)
- **From lead 8:** starting revenue in the model counts all money in over 3 months, including Funding inflows (a fresh raise inflates
  it; touches runway/dashboard too, product call). Two Paystack payouts inside one 10-day window can both be "covered" by the same
  charges (accepted: payouts are below charges). The founder's legacy certificates `CFZ-C4MB-SWRU-DRXE` / `CFZ-RVE9-Z2ZX-N7RS`
  (pre-PDF) never get a PDF (local test data). Send windows (business hours/weekends) aren't enforced for sequences (spec has none).
- From the lead-7 reviews (not blocking): nginx `client_max_body_size ~11m` for receipt uploads (the app cap limits memory, not
  the temp file); receipt links are bearer tokens in the query string (scrub `token=` from access logs); category filter `lower()` vs
  `casefold()` mismatch for a few characters; ARF spam-complaint reports aren't acted on (`SuppressionReason.complained` unused).
- `kpis.tasks_done_this_week` and `calibration.assessment_complete` are still returned to every role (needs an FE tile decision).
- `document.shared` / `document.signature.*` go to every member; should probably go to the share's recipients only.
- Briefing `mission_done/total` and `tasks_done_week` freeze at generation time.
- Marketing scheduler: if >500 overdue posts ever stay `scheduled` after failed jobs, newer posts queue behind them (edge case).
- pip-audit flags dev-only `pytest` and `virtualenv` advisories (outside the gate's `--only main`): bump when convenient.
- Consolidate the two comment-thread UIs; Validation editor unsaved-changes guard; 3 minor Validation FE items.
- The staging-fix session tested Resend with the staging key directly (no value printed). Briefs now say: never call providers
  with real keys.

## 3. How we work (keep doing this)
1. **Walk the page live** (browser pane, 1440 + 375) against the PRD section **and** the existing designed UI. Click every
   control, compare it to the raw API, and write `docs/checklist/{page}-prd-gaps.md` with the decisions.
2. **Build every BE gap** with tests + an e2e journey whose captures feed a **live-captured FE guide**, an SOP and the checklist.
   Reproduce **all** CI gates locally (fresh DB; `TZ=UTC` after local midnight). One PR per page, stacked when needed.
3. **One FE sub-session per page** (`start_session`, fresh, worktree, Sonnet), with the gap list + guide as its spec.
4. **Verify each FE PR yourself** (CI, no attribution, scope, no mock), then **re-walk live** on develop after merge.
   A re-walk means **clicking every control** on every sub-page at 1440 and 375, for every role, and checking each result
   against the API, with per-control evidence in `docs/checklist/{page}-rewalk.md`. A sweep (pages load, no errors) is
   not a re-walk. A page is "done" only when every control is ✅ on merged `develop`.
5. The user merges. Claude can't merge, push to other sessions' branches, or edit its own permissions (classifier); give exact
   commands in bash blocks at the end of the message.
- No AI attribution in commits/PRs. No em/en dashes in rendered copy. The user's bar: no half-baked pages, no "coming soon"
  except what's genuinely blocked on accounts (§0c).

## 4. Gotchas
- **`docs/checklist/buildout-status.md` is edited by almost every PR**, so parallel PRs conflict on it after each merge. Resolve by
  merging develop into the branch and keeping both sides' facts (the hook needs `node_modules`: `npm ci` in the worktree first,
  never `--no-verify`). Tell Adebayo the merge order up front.
- **Develop CI can go red from a fresh advisory** (certifi PYSEC-2026-4320, fixed by #159): check `pip-audit` before blaming a PR.
- Retargeting a PR's base does NOT trigger FE CI (`pull_request` default types). Push a commit (e.g. merge develop) to start it.
- `test_streak_broken_by_gap` failed every Monday until #139 pinned its date.
- After midnight WAT, local pytest shows ~10 date-skew failures (local date vs UTC); run with `TZ=UTC` (CI is UTC).
- The API hot-reloads on file changes, so switching branches in the API checkout briefly 500s the local FE.
- Stacked PRs need manual retargeting after their base merges (`gh pr edit N --base develop`).
- A sub-session's worktree doesn't contain untracked files from the main checkout: pass absolute paths.
- Next 16 / React 19: read `AGENTS.md`; `react-hooks/set-state-in-effect` is an error; design tokens are enforced pre-commit.

- **Never run the API unit suite on the host against the dev DB:** migration tests downgrade `DATABASE_URL` and wipe every
  post-0045 table (comments, canvas versions, calendar…). Use `DATABASE_URL=postgresql://user:password@localhost:5432/ci_scratch`.
  For full CI parity without touching the live stack, use the worktree recipe in memory `local-test-db-gotcha`.
- **Walking several roles at once:** use `http://m.localhost:3000`, `http://bc.localhost:3000`, `http://tm.localhost:3000`
  (separate localStorage per host). `127.0.0.1` is blocked by Next dev. Role accounts (local only): `bb-mentor-1`,
  `bb-consultant-1`, `rewalk-tm` @example.com, all `Throwaway123!`.
- **The worker doesn't hot-reload:** `docker compose restart worker` after switching API branches. The re-walk used a
  local-only `local/rewalk` branch (develop + all fix branches) so the live stack stayed consistent; don't push it.
- **AI budget for real-model checks:** delete today's `llm_usage_daily` row for NovaPay locally to test AI flows.

- **Sub-session commits/pushes are sometimes denied by the classifier** (Finance walk, Academy walk). Don't push for them (that's
  permission laundering): give Adebayo the exact commands. Briefs already say "if denied, report path/branch/SHA".
- **Running API tests in a fresh worktree:** `poetry run` creates an empty venv there. Use the main checkout's venv
  (`poetry env info -p` in `cofoundaz-api`) and CI's env vars (`SECRET_KEY`, `FIRST_SUPERUSER_EMAIL/PASSWORD`, `TEST_DATABASE_URL`,
  `REDIS_URL`, `LOG_FILE_PATH=""`) with scratch DBs.
- **The LLM stub doesn't enforce provider schema rules**: OpenAI strict `json_schema` needs `additionalProperties: false` and every
  property required on every object (#168 broke real scorecards). New AI features: add the strict-schema walker test
  (`tests/services/sales/test_coach_schemas.py`) and always do one real-model run in the FE walk.
- **Stacked PRs merged before retarget skip PR CI** (#167): CI then only runs on develop after the merge. Retarget to develop and push
  a commit before asking Adebayo to merge.
- **Parallel BE slices both add a migration:** assign numbers up front and tell the second session to chain after the first.

- **Lead-7 lessons:** (1) one Opus review agent per PR in parallel (read-only, ~25-line report) found real bugs in all three
  (legacy receipts left public; double-send after DATA; mailbox-policy rejections suppressing contacts). Keep doing it for
  security paths. (2) Three parallel BE PRs each with a migration on the same head need a merge train with re-chaining; assign
  numbers up front (done here: 0067/0068/0069). (3) From the dev network SMTP 465 is filtered; use 587 STARTTLS locally.
  (4) GitGuardian flags signed tokens in e2e captures even when expired: redact tokens in captures *before* the first commit.

- **Lead-8 lessons:** (1) **Merge trains: re-chain BEFORE each merge.** #172 merged right after #171 with both on 0066, develop got two
  alembic heads, staging CD failed at migrate and rolled back (fixed by #174). The CI single-head check can't see across branches.
  (2) **Worker handlers run inside `db.begin_nested()`**: a handler that commits must be registered with
  `register_handler(..., manages_transactions=True)` (#177); service-level tests never caught it, so test new handlers through `run_once`.
  (3) **Never store short non-secret values (ports) as GitHub secrets:** masking blanked an image digest containing `22` (#175).
  (4) slowapi's default limits are per full URL: public `/{token}` routes need `shared_limit(scope=...)`.
  (5) In this shell, piping `dig +short` through cut/grep printed nothing: use `/usr/bin/dig +noall +answer` with no pipe.
  (6) The deployed image ships `app/`, `alembic/`, `content/` only, not `scripts/`: one-off jobs belong under `app/` (`python -m app...`).
  (7) Scripted Playwright walks don't count as re-walks; the hand re-walks found 4 + 2 defects the scripted walks passed.
  (8) **Give every test run its own scratch DBs** (`<slug>_db`, `<slug>_test`, created fresh): the named shared ones (`ci_scratch*`) collide
  with other sessions' migration tests and produce phantom failures (lead 8 saw 29 on a 1-file change). Also export a throwaway
  `JOURNAL_ENCRYPTION_KEY` (CI generates one per run) or ~74 journal tests fail.

## 4b. Follow-ups queued
- **Lessons from 2026-10-19:** parallel FE sub-sessions that both add a shared module (e.g. `lib/api/comments.ts`) collide
  on merge (add/add). When two pages need the same new shared module, build it once first, or tell the second session to
  reuse the first's branch file.
- Local AI daily budget was used up by the BB FE session's testing on 2026-10-19 (resets at UTC midnight). Real-model checks wait until then.
- **Consolidate the two comment-thread UIs** (`components/roadmap/comment-thread.tsx` and `components/business-builder/comment-drawer.tsx`) and the two mention helper sets in `lib/mentions.ts`, after #108 merges. Refactor only, no behaviour change.

## 5. Fixed along the way (not obvious from PR titles)
- Worker never registered notification subscribers (job events silently dropped), #130.
- Invite emails had no link, #131. Weekends-off reset every streak, #135. Rest days pinged "mission ready", #135.
- The Health Score never moved with real work, #136; its refresh-on-read was rolled back, #136.
- A Sunday-only test bug (`test_channel_service`), #135.
