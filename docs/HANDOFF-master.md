# HANDOFF — Cofoundaz app-wide build-out (master)

> **First message for a new (lead) session (lead 5):**
> *"Read `cofoundaz/docs/HANDOFF-master.md` and continue as the lead. Follow §2b in order: fold in the BE session's
> readout + re-walk-BE PRs, start the Marketing FE fixes, re-walk the fixed rows, then close Dashboard and Marketing and start
> Sales (first page with no API). No half-built pages; ask Adebayo only for genuine product calls."*

Last updated: **2026-10-21 10:45 WAT** (lead session 4 → 5 handover). This file is a map; the detail lives in the gap lists
(`docs/checklist/*-prd-gaps.md`, `*-rewalk.md`), SOPs (`docs/sop/` in both repos), FE guides
(`cofoundaz-api/docs/fe-integration-guide-*.md`), the master checklists (`cofoundaz-api/docs/checklist/PROJECT_CHECKLIST.md`,
`docs/checklist/buildout-status.md`), and memory.

---

## 0. FOR ADEBAYO

### 0a. Open PRs (refreshed 2026-10-21 11:15 WAT, at the actual handover)
| Repo | PR / branch | What | State |
|---|---|---|---|
| API | [#162](https://github.com/innocent98/Cofoundaz-api/pull/162) `fix/marketing-rewalk-be` | Marketing re-walk BE gaps 1 (idea count), 4 (no past plan slots), 5 (search hrefs to items), 9 (stale SEO flag), 7 (`GET /marketing/media/{id}/file`, marketing roles, workspace-scoped, path-checked) | **lead reviewed: OK**; CI was running |
| FE | [#133](https://github.com/innocent98/cofoundaz/pull/133) `fix/marketing-rewalk-fe` | Marketing re-walk FE gaps 2, 3, 4, 6, 8 | CI 5/5 green. Integrations of #161/#162 (readout figures, stale flag, media file) may be pending: read its PR body |
| FE | [#134](https://github.com/innocent98/cofoundaz/pull/134) `docs/dashboard-done` | Dashboard gaps 11/12 re-checked, **Dashboard done**; this handoff refresh | docs |

Merged since the first lead-5 draft: API #160 (notification read filter), #161 (readout figures); FE #130, #131, #132.
Local API checkout at `37d2f65` (#161), DB `0062`. #162 has no migration.

"Dependency review (PR only)" is red on every API PR: repo setup, not code. Ignore it.

**Merged in lead session 4 (2026-10-20 16:30 → 2026-10-21 10:30):** API #153, #154, #155, #156, #157, #158, #159; FE #120-#129.
Staging CD is **green again** on API `229e9fd` (Resend `cofoundaz.com` domain re-verified by Adebayo 2026-10-21; the live gate passes).

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

### 0c. Blocked on your accounts or a product call (not on code)
- **Victoria (Legal, API #138):** parked until she replies. Her migration must now chain after **0062** (develop has 0060, 0061, 0062).
- **Finance integrations:** Mono sandbox keys to come (Adebayo); Paystack keys + a formal yes on the per-founder-key approach (#22).
- **Calendar sync:** Google OAuth values are now in the committed staging/production envs (API #154); sync code not built yet
  (Calendar page). Outlook deferred.
- **Smoke-test subdomains** parked; feedback by email / in-app widget needs an inbound-mail provider; Billing needs Paystack keys.
- **Marketing external data** (D-MKT-8): real publishing, ad metrics, SEO data, segment sizes all wait on accounts.

---

## 1. Repos and local stack
- FE `cofoundaz` (Next 16 App Router, React 19, Tailwind v4, TS strict) and API `cofoundaz-api` (FastAPI): sibling dirs under
  `/Users/adebayovictor/Documents/dev/cofoundaz`. The lead session works from the parent dir (not a git repo).
- **develop heads (2026-10-21 10:40):** API `229e9fd` (#159), FE `cbebd4a` (#129). Main API checkout is at `18949a6` (#157):
  Adebayo should `git -C cofoundaz-api pull --ff-only` (no migration since 0062). Dev DB `cofoundaz-api_db` at
  **`0062_marketing_prd_b`**. Nothing runs on FE :3000 right now; sessions run their own FE dev server on a free port.
- **Updating the shared stack needs Adebayo** (classifier blocks the lead and sub-sessions): give him
  `git -C cofoundaz-api pull --ff-only && docker compose -f cofoundaz-api/docker-compose.yml exec api alembic upgrade head && docker compose -f cofoundaz-api/docker-compose.yml restart api worker`.
  Also blocked for the lead: fast-forwarding the shared FE checkout, local DB UPDATEs, decrypting env files, opening a PR that
  carries `.enc` files. Hand those to Adebayo as bash blocks.
- **Build pattern now in use:** the lead starts **sub-sessions** (`start_session`, `cwd` = the repo, `use_worktree: true`, Sonnet)
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
| Dashboard | 20/20 + gaps 11, 12 | #129-#134, #153, #155, #160 | #101, #104, #123, #130 | ✅ all 4 roles; gaps 11/12 re-checked 2026-10-21 (#134) | ✅ **Done** |
| Today's Mission | 15/15 | #135, #143, #144 | #105, #110 | ✅ 2026-10-19 | ✅ Done |
| Health Score | 10/10 | #136 | #106, #110 | ✅ 2026-10-19 | ✅ Done |
| Roadmap | 11/11 | #137, #145 | #107, #110 | ✅ 2026-10-19 | ✅ Done |
| Business Builder | 21/21 | #139-#141, #146-#148 | #108, #110, #112 | ✅ 2026-10-19 | ✅ Done |
| Validation | 14/14 | #149-#151 | #114, #115, #117 | ✅ 2026-10-20 | ✅ Done |
| Assessment | 13/13 + A1-A6 | #152 | #121, #126 | ✅ 2026-10-20/21 incl. quarterly banner + bell (100-day backdate, restored) | ✅ **Done** (#127); A5 cleared by #160 |
| Marketing | 35/35 + re-walk gaps 1-9 | #156, #157, #161, **#162 open** | #129, **#133 open** | 🟡 #131: 71/75 pass | closes after #162 + #133 merge and a re-check of the failing rows + readout row |

Remaining page order: **Sales** (no API) → Finance (API built in Sept, connectors deferred) → Funding (no API) → Investor
Readiness (no API) → Legal (Victoria) → Marketplace (no API) → Academy (API ✅) → Documents (API ✅) → Calendar (API ✅, sync
not built) → Team (partial: invites/members/comments only) → Analytics (no API) → Journal (API ✅) → Notifications (API ✅) →
Settings (partial; Billing needs Paystack).

## 2b. Incoming (ordered)
1. **After #162 + #133 merge** (Adebayo pulls the API checkout; no migration): if #133's body lists pending integrations
   (readout structured figures, SEO stale prompt, media file blob, search hrefs opening items), one small FE session on
   `fix/marketing-be-integrations` for those.
2. **Marketing re-check on merged develop:** the 3 failing rows + readout row + gaps 1-9 from `docs/checklist/marketing-rewalk.md`,
   founder + TM at 1440/375, mentor/consultant denial spot-check, one real-model readout. Then mark Marketing ✅ (docs PR).
3. **Sales (PRD Module 11):** no API. Brainstorm/design first (superpowers:brainstorming), gap list = full PRD scope, decisions for
   Adebayo, then BE slices → FE → re-walk, same pattern.
4. **Victoria's PR** when it lands (chain after 0062; Opus-level review of scheduler/row-lock paths).

## 2c. Follow-ups (not blocking)
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
