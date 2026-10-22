# HANDOFF — Cofoundaz app-wide build-out (master)

> **First message for a new lead session (start it yourself, from `/Users/adebayovictor/Documents/dev/cofoundaz`):**
> *"Read `cofoundaz/docs/HANDOFF-master.md` and continue as the lead. Start with §2b. No half-built pages; ask me only for
> genuine product calls."*
>
> If the lead-7 handoff PR hasn't merged yet, read this file from its branch:
> `git -C cofoundaz fetch -q origin && git -C cofoundaz show origin/docs/lead7-handoff:docs/HANDOFF-master.md`

Last updated: **2026-10-22 15:00 WAT** (lead session 7 handover). This file is a map; the detail lives in the gap lists
(`docs/checklist/*-prd-gaps.md`, `*-rewalk.md`), SOPs (`docs/sop/` in both repos), FE guides
(`cofoundaz-api/docs/fe-integration-guide-*.md`), design specs (`docs/superpowers/specs/`), the master checklists
(`cofoundaz-api/docs/checklist/PROJECT_CHECKLIST.md`, `docs/checklist/buildout-status.md`), and memory.

---

## 0. FOR ADEBAYO

### 0a. Open PRs (2026-10-22 15:00 WAT) and merge order
All three API PRs carry a migration chained on 0066, so they **merge one at a time in this order**, and the lead has the
next one re-chain its `down_revision` onto the previous before you merge it (then CI re-runs).

| # | Repo | PR / branch | What | State |
|---|---|---|---|---|
| 1 | API | [#171](https://github.com/innocent98/Cofoundaz-api/pull/171) `feature/finance-ledger-correctness` | Finance slice (c): private receipts (authenticated Cloudinary + signed 5-min links bound to the workspace, CSP sandbox), magic-byte upload check, `GET /finance/categories` + normalising, budgets = all outflows (D-FIN-3) + unbudgeted rows, pagination, NGN only, amount > 0, one model generation at a time (partial unique index). Migration **0067** | **lead reviewed: OK** (Opus review, 4 fixes applied in `783d4859`). Reds: Dependency review (known) and **GitGuardian = false positive** (expired e2e tokens signed with the public CI key, localhost URLs, in commit `7fd0b2fe`; redacted at head): **mark it "test credential" in GitGuardian**. After merge: stack update + run `scripts/privatise_legacy_receipts.py` once per environment |
| 2 | API | [#172](https://github.com/innocent98/Cofoundaz-api/pull/172) `feature/sales-sequences` | Sales slice B: sequences send through the cPanel mailbox (SMTP), bounces read over IMAP, signed unsubscribe (GET page + POST, RFC 8058), send ledger with locks, global hourly cap. Migration **0068** | **lead reviewed: OK** after fixes in `27f280c7` (Opus review: 2 must-fixes, mailbox-policy rejections suppressing contacts and a possible double send after DATA, plus 7 nits, all verified in the diff). PR CI was running at handover. Re-chain onto 0067 before merge |
| 3 | API | [#173](https://github.com/innocent98/Cofoundaz-api/pull/173) `feature/academy-be` | Academy BE: 8 courses / 24 lessons / 6 paths / 10 articles in `content/academy/` (all `review_status: draft`) + idempotent loader, YouTube-nocookie embeds, certificate PDF + worker handler, public `GET /verify/{code}` (60-bit `CFZ-XXXX-XXXX-XXXX`, rate-limited), LinkedIn add-to-profile URL, private lesson notes, `position_s`, recommendations by stage + gaps (D-ACA-3), notifications, search. Migration **0069** | **lead reviewed: OK** (Opus review, 5 nits fixed in `a36142bf`); PR CI was running at handover. Re-chain onto 0068 before merge |
| - | FE | [#146](https://github.com/innocent98/cofoundaz/pull/146) `docs/finance-prd-gaps` | Finance gap list update: Mono sandbox keys are available, Mono adapter scope, D-FIN-10 | lead reviewed: OK. Merge |
| - | FE | `docs/lead7-handoff` | this handoff | docs |

"Dependency review (PR only)" is red on every API PR: repo setup, not code. Ignore it.

**Merged in lead session 7 (2026-10-21 23:45 → 2026-10-22 15:00):** API #170 (Finance b); FE #144 (Sales re-walk), #145 (lead-6 handoff).

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

### 0c. Waiting on you (not on code)
**Do now:**
1. **GitGuardian on #171:** mark the alert a false positive ("test credential"). Then merge #171, and run the stack update + the
   receipts script (commands in §1).
2. **Check `SECRET_KEY` on staging and prod is a real random value**, not the CI placeholder `ci-secret-key-not-used-outside-ci`
   (the #171 reviewer reported the local stack may use it; the lead didn't read secrets to confirm). With that key anyone can forge tokens.
3. **Outreach `.env` fixes** (lead-checked 2026-10-22): `SALES_OUTREACH_IMAP_HOST` has a trailing `/` (remove it); use
   `SALES_OUTREACH_SMTP_HOST=mail.cofoundaz.com`, `SALES_OUTREACH_SMTP_PORT=587`, `SALES_OUTREACH_SMTP_SECURITY=starttls`,
   `SALES_OUTREACH_IMAP_HOST=mail.cofoundaz.com`; add `SALES_OUTREACH_UNSUBSCRIBE_KEY` (random, required in prod after #172).
4. **Publish DKIM:** copy cPanel → Email Deliverability's DKIM TXT (`default._domainkey`) into the DNS provider. Without it outreach lands in spam.
5. **Recommended:** a dedicated outreach mailbox (e.g. `outreach@`), not `info@`, and confirm the host's hourly limit (start ~50/h, not 500).

**Product calls open:**
- **Outreach abuse gate (from the #172 review):** sequences send from your domain with the workspace's startup name as display name,
  so any workspace could pose as "PayPal Security". Before production: enable outreach per workspace by you, or tie it to a paid plan?
- **LinkedIn company page** for Cofoundaz (certificate issuer org). If it exists, its URL/id goes in `ACADEMY_LINKEDIN_ORG_ID`.
- **Academy content review:** all 37 files in `cofoundaz-api/content/academy/` are drafts written by the build session; flip
  `review_status` once you've read them. Record videos and add the YouTube ids when ready.

**Still blocked:**
- **Victoria (Legal, API #138):** parked until she replies. Her migration must chain after the latest head (0069 once #173 lands).
- **Paystack/Flutterwave live checks:** a test-mode sync needs you to paste test keys in the UI during the Finance re-walk
  (sessions never read keys); a live webhook needs a public URL (staging).
- **Calendar sync:** Google OAuth values in the envs; sync code not built yet. Outlook deferred.
- **Smoke-test subdomains** parked; inbound mail (feedback by email, reply detection) not available; Billing needs your Paystack.
- **Marketing external data** (D-MKT-8): real publishing, ad metrics, SEO data, segment sizes wait on accounts.

## 1. Repos and local stack
- FE `cofoundaz` (Next 16 App Router, React 19, Tailwind v4, TS strict) and API `cofoundaz-api` (FastAPI): sibling dirs under
  `/Users/adebayovictor/Documents/dev/cofoundaz`. The lead session works from the parent dir (not a git repo).
- **develop heads (2026-10-22 15:00):** API `02071b7` (#170), FE `29c3c94` (#145). Main API checkout on develop at `02071b7`;
  dev DB `cofoundaz-api_db` at **`0066_finance_invoice_automation`** (verified; stack up, API health 200). Nothing runs on FE :3000 right now; sessions run their own FE dev server on a free port.
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
| Page | Gaps | BE | FE | Live re-walk on develop | State |
|---|---|---|---|---|---|
| Dashboard | 20/20 + gaps 11, 12 | #129-#134, #153, #155, #160 | #101, #104, #123, #130 | ✅ all 4 roles (#134) | ✅ **Done** |
| Today's Mission | 15/15 | #135, #143, #144 | #105, #110 | ✅ 2026-10-19 | ✅ Done |
| Health Score | 10/10 | #136 | #106, #110 | ✅ 2026-10-19 | ✅ Done |
| Roadmap | 11/11 | #137, #145 | #107, #110 | ✅ 2026-10-19 | ✅ Done |
| Business Builder | 21/21 | #139-#141, #146-#148 | #108, #110, #112 | ✅ 2026-10-19 | ✅ Done |
| Validation | 14/14 | #149-#151 | #114, #115, #117 | ✅ 2026-10-20 | ✅ Done |
| Assessment | 13/13 + A1-A6 | #152 | #121, #126 | ✅ 2026-10-20/21 | ✅ Done |
| Marketing | 35/35 + re-walk gaps 1-9 | #156, #157, #161, #162 | #129, #133, #135, #138 | ✅ 15/15 (#137, #141) | ✅ **Done** |
| Sales | 30 gaps (`sales-prd-gaps.md`); 5/6 sub-pages real | #165 (A), #166 (C), #168, **#172 (B) open, must-fixes in progress** | #142, #143 | ✅ 626/626 on 5 sub-pages (#144) | 🟡 **only Sequences left**: land #172, then FE Sequences, then its re-walk |
| Finance | 35 gaps (`finance-prd-gaps.md`, + #146) | #167 (a), #170 (b), **#171 (c) open, reviewed OK** | none yet (still old FE) | ⏳ | (d) model rows 11-13 + Mono adapter next, then one FE session, then re-walk |
| Academy | 24 gaps (`academy-prd-gaps.md`) | **#173 open, reviewed OK** (all BE rows) | old FE | ⏳ | land #173, then one Academy FE session, then re-walk |

Remaining after these: Documents (API ✅) → Calendar (API ✅, sync not built) → Journal (API ✅) → Notifications (API ✅) → Team
(partial) → Settings (partial; Billing needs Paystack) → Funding, Investor Readiness, Marketplace, Analytics (no API: design first like
Sales) → Legal (Victoria).

## 2b. Incoming (ordered)
0. **Lead-7 sub-sessions** (all three idle at handover, nothing mid-task; see §0a): Finance (c) `local_6bb87aaa-9f36-4397-a718-9cb70ee397e5` (done, PR #171),
   Sales B `local_2d6a9b25-a39c-40c5-90e0-d5c08a3c2086` (PR #172, see item 2), Academy BE `local_171a92eb-ac6f-4797-926f-42e2b71e740a` (PR #173).
   Message the one with context (`SendMessage` to its id) rather than starting fresh; worktrees are `wt/finance-ledger-correctness`,
   `wt/sales-sequences`, `wt/academy-be`.
1. **Merge train:** #171 (after Adebayo marks GitGuardian) → stack update + receipts script → have #172's session re-chain 0068 onto
   `0067_finance_ledger_correctness`, merge develop, re-run gates → merge → have #173 re-chain 0069 onto `0068_sales_sequences` → merge.
   Check each head's CI, branch name and attribution before saying "merge #N".
2. **#172 is fixed and lead-verified at `27f280c7`.** Only `SMTPRecipientsRefused` 5xx (not 530/535/554) suppresses a contact; any
   failure once DATA starts settles as `unknown` and is never resent. Nit for later: `smtplib.data()` raises `SMTPDataError` on a definite
   5xx, so a policy-refused message also lands as `unknown` (safe direction, the `code != 250` branch in `_data` is dead). Send windows:
   see its SOP.
3. **Finance (d) model** (rows 11, 12, 13: editable assumptions + recalculate without AI, 36 months + yearly rollup (D-FIN-8), real balance
   sheet with a check line) **+ Mono adapter** (FE #146 "Mono adapter" section, D-FIN-10; sandbox keys in env, never read them). BE
   sub-session, migration after the head at that time. Then **one Finance FE session** (Integrations rebuild for Paystack/Flutterwave/Mono,
   categories Select, budgets table, model editor, receipts via the signed route, invoices automation UI), then the **Finance re-walk**.
4. **Sales FE Sequences** (from #172's FE guide) once #172 merges, then re-walk Sequences and mark Sales ✅. A live delivery check needs the
   corrected `.env` (§0c) and one test send to an address Adebayo owns, with his OK.
5. **Academy FE** (from #173's FE guide: sanitised markdown rendering, YouTube player, certificate PDF/verify/LinkedIn, notes, search) once
   #173 merges, then the Academy re-walk.
6. Then the next pages in §2 order. Keep at most 2-3 sessions running.

## 2c. Follow-ups (not blocking)
- From the lead-7 reviews (not blocking): nginx `client_max_body_size ~11m` for receipt uploads (the app cap limits memory, not
  the temp file); receipt links are bearer tokens in the query string (scrub `token=` from access logs); category filter `lower()` vs
  `casefold()` mismatch for a few characters; ARF spam-complaint reports aren't acted on (`SuppressionReason.complained` unused).
- `kpis.tasks_done_this_week` and `calibration.assessment_complete` are still returned to every role (needs an FE tile decision).
- `document.shared` / `document.signature.*` go to every member; should probably go to the share's recipients only.
- Briefing `mission_done/total` and `tasks_done_week` freeze at generation time.
- Marketing scheduler: if >500 overdue posts ever stay `scheduled` after failed jobs, newer posts queue behind them (edge case).
- `scripts/env.sh verify` false-fails when the env file's first line is a comment (it checks line 1 for `=`): one-line fix.
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

## 4b. Follow-ups queued
- **Lessons from 2026-10-19:** parallel FE sub-sessions that both add a shared module (e.g. `lib/api/comments.ts`) collide
  on merge (add/add). When two pages need the same new shared module, build it once first, or tell the second session to
  reuse the first's branch file.
- **Strip em/en dashes from all LLM output** centrally in `cofoundaz-api/app/platform/llm.py` (a mission "Why" line rendered "value—giving"). Small separate PR.
- Local AI daily budget was used up by the BB FE session's testing on 2026-10-19 (resets at UTC midnight). Real-model checks wait until then.
- **Consolidate the two comment-thread UIs** (`components/roadmap/comment-thread.tsx` and `components/business-builder/comment-drawer.tsx`) and the two mention helper sets in `lib/mentions.ts`, after #108 merges. Refactor only, no behaviour change.

## 5. Fixed along the way (not obvious from PR titles)
- Worker never registered notification subscribers (job events silently dropped), #130.
- Invite emails had no link, #131. Weekends-off reset every streak, #135. Rest days pinged "mission ready", #135.
- The Health Score never moved with real work, #136; its refresh-on-read was rolled back, #136.
- A Sunday-only test bug (`test_channel_service`), #135.
