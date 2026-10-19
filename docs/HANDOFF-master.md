# HANDOFF — Cofoundaz app-wide build-out (master)

> **First message for a new (lead) session:**
> *"Read `cofoundaz/docs/HANDOFF-master.md` and continue as the lead. Step 1 is done. Continue Validation (§2 Step 2):
> follow the FE session `fe-validation-a` for slice (a), then build BE slice (b) (interview scripts + Insight Synthesizer),
> then (c) (MVP feedback), each with an FE session and a click-every-control re-walk. No half-built pages; ask me only
> for genuine product calls."*

Last updated: **2026-10-19 22:10 WAT** (lead session 2: FE #114 verified, slice (b) BE built as API #150). This file is a map; the detail lives
in the gap lists (`docs/checklist/*-prd-gaps.md`), SOPs (`docs/sop/` in both repos), FE guides
(`cofoundaz-api/docs/fe-integration-guide-*.md`), the master checklists
(`cofoundaz-api/docs/checklist/PROJECT_CHECKLIST.md`, `docs/checklist/app-review-audit.md`), and memory.

---

## 0. FOR ADEBAYO

### 0a. Open PRs
| Repo | PR | What | Notes |
|---|---|---|---|
| FE | [#109](https://github.com/innocent98/Cofoundaz/pull/109) | Docs only: Validation gap list, Business Builder close-out, audit notes | merge any time |
| FE | [#113](https://github.com/innocent98/Cofoundaz/pull/113) | Docs only: Step 1 closed + this handoff | merge any time |
| API | [#149](https://github.com/innocent98/Cofoundaz-api/pull/149) | Validation slice (a): overview, Design experiment, `/p/{slug}` pages, waitlist, server verdict, milestone notif, deletes; migration 0056. +fix: a preorder-metric page always shows pricing (found in the live check) | CI green except the pre-existing "Dependency review" job (fails on every PR, #148 too). **Merge first** |
| FE | [#114](https://github.com/innocent98/Cofoundaz/pull/114) | Validation slice (a) FE incl. public `/p/[slug]` | CI green, no attribution, scope clean; verified live by the lead against #149. **Merge after #149** |
| API | [#150](https://github.com/innocent98/Cofoundaz-api/pull/150) | Validation slice (b): interview scripts + Insight Synthesizer; migration 0057 | stacked on #149: after #149 merges, `gh pr edit 150 --base develop` and push a commit to start CI. Then an FE session for (b) |

Merged 2026-10-19 (Step 1): API #142-#148, FE #110-#112 (re-walk fixes, AI budget 100k, honest AI fill messages).
Everything else from 2026-10-18/19 is merged: API #135-#137, #139-#141 (staging CD green, migrations auto-run);
FE #105-#108. Stacked PRs: GitHub retargets them to `develop` itself when the base merges with branch deletion.
Retargeting doesn't start CI in either repo: push a commit (merge `develop` in) to start it.

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

### 0c. Blocked on your accounts or a product call (not on code)
- **Finance integrations:** bank connection via **Mono** decided (Adebayo registering; sandbox keys to come, see #21);
  QuickBooks/Xero **deferred**. Currently an honest "Not connected".
- **Calendar sync:** Google OAuth client is created and its values are in the `.env` files, **not re-encrypted yet**;
  never read or print those values. Microsoft/Outlook **deferred** (#20). Apple not started.
- **Smoke-test subdomains** (`{slug}.cofoundaz.site`): **parked** by Adebayo; pages stay at `/p/{slug}` (D-VAL-1).
- **Feedback by email / in-app widget** need an inbound-mail provider (D-VAL-3).
- **Billing** (Settings): provider is **Paystack** (decided 2026-10-19); still needs keys.
- The **Dashboard Pipeline tile** stays "Coming Soon" until the Sales page is built (in the page queue; no decision needed).

---

## 1. Repos and local stack
- FE `cofoundaz` (Next 16 App Router, React 19, Tailwind v4, TS strict) and API `cofoundaz-api` (FastAPI): sibling dirs under
  `/Users/adebayovictor/Documents/dev/cofoundaz`. The lead session works from the parent dir.
- **develop heads (2026-10-19 21:20):** API `33132f9` (#148), FE `e07bad3` (#112).
- **Slice (b) worktree:** `/private/tmp/claude-501/-Users-adebayovictor-Documents-dev-cofoundaz/55f98077-834b-48c4-aff2-eb55bd95867e/scratchpad/api-b`
  (now detached; own venv, use it for CI parity). The **API main checkout is on `feat/validation-prd-b`** (superset of (a);
  dev DB at 0057, worker restarted) so FE sessions for (a) and (b) both work against it. Next free migration number: **0058**. Real-model capture recipe: copy
  `scripts/e2e_run.sh` without the `LLM_PROVIDER=stub` line and point it at one e2e file (see the slice (b) SOP).
- **Local checkouts right now:** the API main checkout is on **`feat/validation-prd-a`** (keep it there until #149 merges:
  the FE session tests against it). The dev DB is at **`0056_smoke_test_pages`** (from #149; the `smoke_test_slugs` table
  was added by hand after a branch-internal migration change, so it matches the PR). Worker restarted on that branch.
  The FE main checkout is on `docs/step1-closed` (PR #113, docs only). 
- **CI-parity worktree:** `/private/tmp/claude-501/-Users-adebayovictor-Documents-dev-cofoundaz/8dbb9ba0-e578-4ec4-b809-d663b109a1ed/scratchpad/api-ci`
  (detached, own poetry venv, `.env` copied). If it's gone, recreate it: `git worktree add --detach <dir> <branch>`,
  `cp .env`, `poetry install --no-root --with dev`; run e2e with `PYTHONPATH=$PWD COMPOSE_PROJECT_NAME=cofoundaz-api`.
- **API (docker):** `api` :8000 (uvicorn --reload, bind-mounted), `worker` (restart after handler changes; its "unhealthy"
  label is cosmetic), `db` :5432, `redis` :6379. The local worker uses the **real LLM** (`LLM_PROVIDER=openai`); the daily
  budget is now 100k tokens/startup (#147). Console email: links print in `docker compose logs api`.
- **FE:** `.claude/launch.json` → `cofoundaz-fe` (:3000, `API_PROXY_TARGET=http://localhost:8000`). Worktree sessions run `npm ci`
  and use their own port.
- **Test account (local only, never commit):** `throwaway-founder@example.com` / `Throwaway123!`, workspace NovaPay (assessed,
  roadmap, missions, Business Builder filled, 1 assumption + 2 interviews in Validation), workspace id
  `11ba2aa0-8c8d-4035-adb8-62530988ed44`. Role accounts in NovaPay: `bb-mentor-1`, `bb-consultant-1`, `rewalk-tm` @example.com,
  all `Throwaway123!`.

## 2. In flight
| Page | Walkthrough + gaps | BE | FE | Live re-walk |
|---|---|---|---|---|
| Dashboard | ✅ `dashboard-prd-gaps.md` (20) | ✅ merged #129 to #134 | ✅ merged #101/#104 | ✅ full live re-walk 2026-10-18 (founder + mentor, 1440 + 375) |
| Today's Mission | ✅ `mission-prd-gaps.md` (15) | ✅ merged #135 | ✅ merged #105 | ✅ full click-through + close-out on merged develop 2026-10-19 (`mission-rewalk.md`) |
| Health Score | ✅ `health-prd-gaps.md` (10) | ✅ merged #136 | ✅ merged #106 | ✅ full click-through + close-out on merged develop 2026-10-19 (`health-rewalk.md`) |
| Roadmap | ✅ `roadmap-prd-gaps.md` | ✅ merged #137 | ✅ merged #107 | ✅ full click-through + close-out on merged develop 2026-10-19 (`roadmap-rewalk.md`) |
| Business Builder | ✅ `business-builder-prd-gaps.md` (21) | ✅ merged #139-#141 | ✅ merged #108 | ✅ full click-through + close-out on merged develop 2026-10-19 (`business-builder-rewalk.md`) |
| Validation | ✅ `validation-prd-gaps.md` (14), D-VAL-1..6 | (a) API #149 open; (b), (c) next | (a) session `fe-validation-a` | after each slice |

Page order (PRD sidebar): Dashboard → Today's Mission → Health Score → Roadmap → Business Builder → Validation → Assessment →
Marketing → Sales → Finance → Funding → Investor Readiness → Legal → Marketplace → Academy → Documents → Calendar → Team →
Analytics → Journal → Notifications → Settings. (Finance and Marketing hubs were wired early, #102/#103; they still get a PRD walk.)

### Step 1: DONE (2026-10-19)
Mission, Health, Roadmap and Business Builder pass every control on merged develop, at 1440 and 375, as founder, team
member, consultant and mentor. Evidence: `docs/checklist/{mission,health,roadmap,business-builder}-rewalk.md`.

### Step 2: Validation (in progress)
**Slice (a): BE done, API [#149](https://github.com/innocent98/Cofoundaz-api/pull/149) open** (gap rows 2-6, 14). Guide
`cofoundaz-api/docs/fe-integration-guide-validation-prd-a.md`, SOP `docs/sop/2026-10-19-validation-prd-a.md`. Lead decisions
D-VAL-4 (server verdict after 100 visits), D-VAL-5 (signup milestones 10/25/50/100/250/500/1000), D-VAL-6 (a claimed
slug stays with its workspace: security review). FE: session **`fe-validation-a`** (worktree, Sonnet) is building it and
will open an FE PR. **When it reports:** check the PR (CI, no attribution, scope, no mock), verify live, tell Adebayo to
merge #149 then the FE PR, then re-walk Validation's slice-(a) controls on develop and record them in
`docs/checklist/validation-rewalk.md`. Its notes arrive in the old lead session, which relays them.

**Slice (b) BE DONE: API [#150](https://github.com/innocent98/Cofoundaz-api/pull/150)** (guide `cofoundaz-api/docs/fe-integration-guide-validation-prd-b.md`,
SOP `docs/sop/2026-10-19-validation-prd-b.md`). Built as designed below, plus: evidence fenced as escaped JSON (security review:
anonymous survey answers reach the model), prompt refs rewritten out of prose, own token caps (scripts 2,500, synthesis 4,000;
the 800 default made the reasoning model return empty completions). Next: FE session for (b) once #150 is retargeted.
**Slice (c) next (lead, BE):** MVP feedback + the BE bits of gap rows 9 (open survey answers endpoint, re-show/rotate share
link) and 10 (linked experiment names on assumption cards), which no slice had claimed.

_Original slice (b) design:_ gap rows 7, 12, 13. Branch from `feat/validation-prd-a` (stacked) or from develop once #149
merges. Design worked out so far:
- **Interview scripts:** new table `interview_scripts` (startup_id, title, assumption_ids jsonb, questions jsonb
  `[{id, question, tip}]`, timestamps), migration 0057. `POST /validation/scripts/generate {assumption_ids}` already exists
  as a stub (validates ids via `link_ids`); add the worker handler `validation.scripts.generate` that drafts 6-10
  questions with interviewer tips (PRD tip copy: *"Ask about the last time it happened, not hypotheticals."*) and
  **saves a script** (PRD: generated scripts appear in a list and are editable), `job.result = {status: ready|over_budget,
  script_id}`. CRUD: `GET /validation/scripts`, `GET/PATCH/DELETE /validation/scripts/{id}`. 422 when no assumption is given.
- **Insight Synthesizer:** table `insight_reports` (startup_id, source, patterns jsonb `[{id, theme, summary, quotes}]`,
  contradictions jsonb, suggestions jsonb `[{id, assumption_id, from_status, to_status, reason, applied_at}]`, timestamps).
  `POST /validation/synthesize {source: interviews|surveys|all}` (stub exists) → handler reads interview notes, key quotes,
  verdicts and linked assumptions plus open survey answers (never interviewee names, as personas-from-validation does), asks
  the model for patterns / contradictions / suggested assumption status changes (only for real assumption ids, only when
  the status changes), stores the report, publishes `validation.insight.detected` once per report with the top theme.
  Notification copy (PRD): **"New pattern detected in customer feedback: {theme}"** CTA **"See insight"**. Reads:
  `GET /validation/insights`, `GET /validation/insights/{id}`. Apply: `POST /validation/insights/{id}/suggestions/{sid}/apply`
  → `update_assumption` (which already fires validated/invalidated events), stamps `applied_at`, 409 if already applied.
  422 `NOTHING_TO_SYNTHESIZE` when there's no interview or open answer yet. `over_budget` → no report, job result says so.
- Tests first, e2e journey with captures, live real-model captures, guide, SOP, checklist, local CI parity, PR. Then an FE
  session for (b), then slice (c) MVP feedback (D-VAL-2/3: inbox, auto-import interview quotes + open survey answers +
  manual entries, AI theme clustering "{theme} mentioned {n}× across {m} sources", "Send to roadmap").

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
