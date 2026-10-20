# HANDOFF — Cofoundaz app-wide build-out (master)

> **First message for a new (lead) session (lead 4):**
> *"Read `cofoundaz/docs/HANDOFF-master.md` and continue as the lead. Assessment BE is merged (#152); Assessment FE (#121)
> and the Dashboard role-leak fix (API #153) await merge. After they merge: re-walk Assessment on develop (click every
> control, all roles, 1440 + 375), then one FE session for the Dashboard minor rows + `mission_status`, then walk Marketing.
> Follow Victoria's Legal work (API #138). No half-built pages; ask me only for genuine product calls."*

Last updated: **2026-10-20 16:30 WAT** (lead session 3 → 4 handover). This file is a map; the detail lives in the gap lists
(`docs/checklist/*-prd-gaps.md`, `*-rewalk.md`), SOPs (`docs/sop/` in both repos), FE guides
(`cofoundaz-api/docs/fe-integration-guide-*.md`), the master checklists (`cofoundaz-api/docs/checklist/PROJECT_CHECKLIST.md`,
`docs/checklist/buildout-status.md`), and memory.

---

## 0. FOR ADEBAYO

### 0a. Open PRs (merge in this order)
| Repo | PR | What | State at handover |
|---|---|---|---|
| API | [#153](https://github.com/innocent98/Cofoundaz-api/pull/153) `fix/dashboard-role-leaks` | Dashboard rows 1-3, 8, 9: `mission: null` + `mission_status` for non-F/TM, search gates, notification audiences, briefing no longer quotes the score | lead reviewed the gates; local CI parity green; GitHub CI was running |
| FE | [#121](https://github.com/innocent98/cofoundaz/pull/121) `feat/assessment-prd-fe` | Assessment rows 1-4, 7, 9-13 (your five issues verified live by the FE session) | lead checked scope + no attribution; CI was running |
| FE | [#120](https://github.com/innocent98/cofoundaz/pull/120) | Dashboard post-merge re-walk evidence (`dashboard-rewalk.md`, 10 gap rows) | docs only |
| FE | this handoff (`docs/lead3-handoff`) | | docs only |

"Dependency review (PR only)" is red on every API PR (also on merged #151): repo setup, not code. Ignore it.

Merged today (2026-10-20): API #152 (Assessment BE: role-gated reads, notification audiences, progress, `?status`, health
delta on complete, answer diff, `stage_at_time` migration **0060**, `meta.quarterly_due`); FE #118, #119 (docs).
Your local stack: you fast-forwarded the API checkout to develop `5a25aae` and ran `alembic upgrade head` (dev DB at 0060).

**Victoria (junior BE, `@vikky-data`):** Module 13 Legal & Compliance Slice 1, spec approved with changes
([#138 comment](https://github.com/innocent98/Cofoundaz-api/issues/138#issuecomment-6291235169)). **No PR yet.** Her
migration is 0059, but develop now has **0060 chaining from 0058**: her 0059 must chain from 0058 and our 0060 re-pointed to
0059, or she renumbers to 0061 chaining from 0060. Tell her in the review. Opus-level review for her scheduler / row-lock paths.

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
- **develop heads (16:30):** API `5a25aae` (#152), FE `2d034e6` (#119). Main checkouts on `develop`; dev DB `cofoundaz-api_db`
  at `0060_assessment_stage_at_time`. FE dev server :3000.
- **Updating the shared stack needs Adebayo:** the permission classifier blocks the lead from fast-forwarding the main API
  checkout / migrating / restarting containers. After merges, give him:
  `git -C cofoundaz-api pull --ff-only && docker compose -f cofoundaz-api/docker-compose.yml exec api alembic upgrade head && docker compose -f cofoundaz-api/docker-compose.yml restart api worker`.
- **Build pattern that works:** the lead dispatches a Sonnet `backend-engineer` agent with `isolation: worktree`; the agent
  commits only, the lead reviews the security paths and pushes + opens the PR. **The agent's worktree comes from the lead's
  current working directory:** `cd` into `cofoundaz-api` first or you get an FE worktree. Agent worktrees live under
  `cofoundaz-api/.claude/worktrees/agent-*` (two from today, both pushed; safe to remove after merge).
- **Scratch DBs** `ci_scratch`, `ci_scratch_test`, `ci_scratch_mig`, `b_e2e`, `b_mig` sit in the shared Postgres; tests must use them, never the dev DB.
- **Real-model capture recipe:** copy `scripts/e2e_run.sh` without the `LLM_PROVIDER=stub` line, point pytest at one scratch e2e file
  (see `docs/sop/2026-10-19-validation-prd-b.md`). Raise per-job `max_tokens` for big JSON outputs.
- **API (docker):** `api` :8000 (uvicorn --reload, bind-mounted), `worker` (restart after handler changes; "unhealthy" label is
  cosmetic), `db` :5432, `redis` :6379. Real LLM locally; daily budget 100k tokens/startup. Console email: links in `docker compose logs api`.
- **FE:** `.claude/launch.json` → `cofoundaz-fe` (:3000). Worktree sessions run `npm ci` and use their own port.
- **Test account (local only, never commit):** `throwaway-founder@example.com` / `Throwaway123!`, workspace NovaPay
  (`11ba2aa0-8c8d-4035-adb8-62530988ed44`). Role accounts: `bb-mentor-1`, `bb-consultant-1`, `rewalk-tm` @example.com, same password.

## 2. Status by page
| Page | Gaps | BE | FE | Live re-walk on develop |
|---|---|---|---|---|
| Dashboard | ✅ `dashboard-prd-gaps.md` | ✅ #129-#134; role leaks **#153 open** | ✅ #101/#104; minor rows 4-7, 10 + `mission_status` **not built** | ✅ founder + TM (2026-10-20, #120); mentor/consultant pending #153 + FE rows |
| Today's Mission | ✅ | ✅ #135 | ✅ #105 | ✅ 2026-10-19 |
| Health Score | ✅ | ✅ #136 | ✅ #106 | ✅ 2026-10-19 |
| Roadmap | ✅ | ✅ #137 | ✅ #107 | ✅ 2026-10-19 |
| Business Builder | ✅ | ✅ #139-#141 | ✅ #108 | ✅ 2026-10-19 |
| Validation | ✅ | ✅ #149-#151 | ✅ #114, #115, #117 | ✅ 2026-10-20 |
| Assessment | ✅ 13 rows | ✅ **#152 merged** | ✅ **#121 open** | **next**, after #121 merges |

Page order: Dashboard → Today's Mission → Health Score → Roadmap → Business Builder → Validation → Assessment →
**Marketing** → Sales → Finance → Funding → Investor Readiness → Legal → Marketplace → Academy → Documents → Calendar → Team →
Analytics → Journal → Notifications → Settings.

## 2b. Incoming (ordered)
1. **After #121 merges, re-walk Assessment** (founder, team member, mentor; 1440 + 375) against the gap list, with evidence in
   `docs/checklist/assessment-rewalk.md`. Not verified live by the FE session: the quarterly banner (90-day state) and the bell
   deep link (mock-tested only). Reproduce them by backdating `completed_at` locally, or say so honestly.
2. **After #153 merges, one FE session for the Dashboard:**
   - `mission_status === "restricted"` hides the mission card for non-F/TM. Today `mission: null` shows the "no roadmap" empty state.
   - Minor rows 4-7 and 10 from `dashboard-rewalk.md`: pipeline tile without a link for restricted roles; Escape closes the AI
     drawer; the avatar footer shows the workspace role; the old top bar's fake `+ Invite` (ShellTopBar on the remaining
     layouts); the AI button overlapping at 375.
   - Then re-walk the Dashboard as mentor and consultant.
3. **Security: activity feed leak (BE, small PR).** `GET /dashboard/activity` (`get_activity` in
   `app/services/dashboard/service.py`, `require_workspace`) and the live `activity.created` stream aren't filtered by role. A
   mentor's feed shows mission task titles and finance/marketing events. Fix: pass the role in and drop `mission.*` /
   `mission_task` rows unless the role is in `MISSION_ROLES`; finance and marketing rows unless in `FINANCE_ROLES` /
   `MARKETING_ROLES`. Apply the same filter to the stream. Test that a mentor's feed doesn't contain a mission task title.
   Flagged by the re-walk agent and the automated security review on #153.
4. **Marketing:** PRD walk, then the gap list.
5. **Victoria's PR** when it lands (see 0a for the migration chain).

## 2c. Follow-ups (not blocking)
- `kpis.tasks_done_this_week` and `calibration.assessment_complete` are still returned to every role (needs an FE tile decision).
- `document.shared` / `document.signature.*` go to every member; they should probably go to the share's recipients only.
- Briefing `mission_done/total` and `tasks_done_week` freeze at generation time (same staleness class as the score was).
- Earlier queue still open: strip em/en dashes from LLM output centrally (`app/platform/llm.py`); consolidate the two
  comment-thread UIs; Validation editor unsaved-changes guard.

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
