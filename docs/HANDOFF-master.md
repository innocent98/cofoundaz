# HANDOFF — Cofoundaz app-wide build-out (master)

> **First message for a new (lead) session:**
> *"Read `cofoundaz/docs/HANDOFF-master.md` and continue as the lead. First do §2 'Step 1': a full click-through re-walk of
> Today's Mission, Health Score, Roadmap and Business Builder on `develop`. Click every button, input, menu and action at
> 1440 and 375 as founder and the other roles, fix anything that doesn't work (BE yourself, FE via sub-session), and record
> the evidence per page. Only then start Validation (Step 2). No half-built pages; ask me only for genuine product calls."*

Last updated: **2026-10-19 20:20 WAT** (Step 1 re-walk session, close-out). This file is a map; the detail lives
in the gap lists (`docs/checklist/*-prd-gaps.md`), SOPs (`docs/sop/` in both repos), FE guides
(`cofoundaz-api/docs/fe-integration-guide-*.md`), the master checklists
(`cofoundaz-api/docs/checklist/PROJECT_CHECKLIST.md`, `docs/checklist/app-review-audit.md`), and memory.

---

## 0. FOR ADEBAYO

### 0a. Open PRs
| Repo | PR | What | Notes |
|---|---|---|---|
| FE | [#109](https://github.com/innocent98/Cofoundaz/pull/109) | Docs only: Validation gap list, Business Builder close-out, audit notes | merge any time |
| ~~API #142-#147, FE #110~~ | merged 2026-10-19 | re-walk fixes + AI budget 100k | done |
| API | [#142](https://github.com/innocent98/Cofoundaz-api/pull/142) | No em/en dashes: LLM output stripped at the seam + 8 API copy strings + guard test | re-walk |
| API | [#143](https://github.com/innocent98/Cofoundaz-api/pull/143) | Mission: roadmap sync, D-MIS-7 reject calibration, snooze completes the day, D-MIS-8 F+TM reads, migration 0055 backfill | re-walk; needs `alembic upgrade head` (CD does it) |
| API | [#144](https://github.com/innocent98/Cofoundaz-api/pull/144) | Invited members no longer routed to founder onboarding (`GET /onboarding/state` member view) | re-walk; blocks every non-founder login |
| API | [#145](https://github.com/innocent98/Cofoundaz-api/pull/145) | Roadmap: breakdown row lock (202+409), D-RM-5 milestone complete completes tasks | re-walk |
| API | [#146](https://github.com/innocent98/Cofoundaz-api/pull/146) | Business Builder: blank competitor threat level no longer 422s | re-walk |
| API | [#148](https://github.com/innocent98/Cofoundaz-api/pull/148) | AI fill jobs report ready / nothing_new / over_budget | last BB re-walk row |
| FE | from session `fe-rewalk-fixes` | 19 FE rows across the four pages + an app-wide route guard | in progress |

#143 and #145 both touch `app/services/mission/service.py`/`roadmap.py` in different places; merge in order #142 → #143 → #144 → #145 → #146 (each is branched from develop; later ones may need `develop` merged in, which re-runs CI).

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
- **develop heads (2026-10-19 14:55):** API `0072879` (#139-#141 merged), FE `5127a6b` (#108 merged). Both local checkouts are on
  `develop`; the dev DB is at `0054_business_plan_options`. Next free migration number: **0055**.
- **API (docker):** `api` :8000 (uvicorn --reload, bind-mounted), `worker` (restart after handler changes; its "unhealthy"
  label is cosmetic), `db` :5432, `redis` :6379. The local worker uses the **real LLM** (`LLM_PROVIDER=openai`); the daily
  token budget was used up by testing on 2026-10-19 and resets at UTC midnight (01:00 WAT). Console email: links print in
  `docker compose logs api`.
- **FE:** `.claude/launch.json` → `cofoundaz-fe` (:3000, `API_PROXY_TARGET=http://localhost:8000`). Worktree sessions run `npm ci`
  and use their own port.
- **Test account (local only, never commit):** `throwaway-founder@example.com` / `Throwaway123!`, workspace NovaPay (assessed,
  roadmap, missions, Business Builder filled), workspace id `11ba2aa0-8c8d-4035-adb8-62530988ed44`. Also mentor, consultant and
  team-member accounts that joined via invite.

## 2. In flight
| Page | Walkthrough + gaps | BE | FE | Live re-walk |
|---|---|---|---|---|
| Dashboard | ✅ `dashboard-prd-gaps.md` (20) | ✅ merged #129 to #134 | ✅ merged #101/#104 | ✅ full live re-walk 2026-10-18 (founder + mentor, 1440 + 375) |
| Today's Mission | ✅ `mission-prd-gaps.md` (15) | ✅ merged #135 | ✅ merged #105 | ✅ full click-through + close-out on merged develop 2026-10-19 (`mission-rewalk.md`) |
| Health Score | ✅ `health-prd-gaps.md` (10) | ✅ merged #136 | ✅ merged #106 | ✅ full click-through + close-out on merged develop 2026-10-19 (`health-rewalk.md`) |
| Roadmap | ✅ `roadmap-prd-gaps.md` | ✅ merged #137 | ✅ merged #107 | ✅ full click-through + close-out on merged develop 2026-10-19 (`roadmap-rewalk.md`) |
| Business Builder | ✅ `business-builder-prd-gaps.md` (21) | ✅ merged #139-#141 | ✅ merged #108 | 🔁 walked + closed out 2026-10-19 except AI fill outcome messages: API #148 + FE follow-up PR (`business-builder-rewalk.md`) |
| Validation | ✅ `validation-prd-gaps.md` (14), D-VAL-1..3 confirmed | next (lead): slices a, b, c | | |

Page order (PRD sidebar): Dashboard → Today's Mission → Health Score → Roadmap → Business Builder → Validation → Assessment →
Marketing → Sales → Finance → Funding → Investor Readiness → Legal → Marketplace → Academy → Documents → Calendar → Team →
Analytics → Journal → Notifications → Settings. (Finance and Marketing hubs were wired early, #102/#103; they still get a PRD walk.)

### Step 1: full click-through re-walk of the four finished pages (WALKED 2026-10-19; closing out)
**Close-out (evening):** API #142-#147 and FE #110 merged; every ❌ row re-checked live on develop and passing. Mission, Health, Roadmap are DONE. Business Builder has one open row: AI fill jobs said "AI draft added" when nothing was drafted (API #148 open, FE follow-up PR from session `fe-rewalk-fixes`). Start Validation (Step 2) once those merge and the row re-checks green.
**State:** every control walked at 1440 and 375 as founder, team member, consultant and mentor; evidence per control in
`docs/checklist/{mission,health,roadmap,business-builder}-rewalk.md`. BE fixes are API #142-#146; FE fixes (19 rows + an
app-wide route guard) are in sub-session `fe-rewalk-fixes`. To close Step 1: merge those, then re-check every ❌ row live on
`develop` and flip it to ✅. Not re-run (AI budget exhausted): whole-canvas "Fill with AI" and records "Draft with AI".

On 2026-10-19 the lead only **swept** Mission, Health, Roadmap and Business Builder after merge (every route loads, no
API errors, no mock text, no overflow at 375px, comments post on both threads). That is **not** the bar. Each FE session
verified its own rows before merge, but nobody has clicked every control on the merged code.
For each page and sub-page: click **every** button, link, input, menu item, drag, modal, toggle and AI action, at 1440 and
375, as founder, team member, consultant and a read-only role (mentor/investor). Confirm each one does what the PRD says
against the raw API (network tab or curl). Fix every failure: BE yourself, FE through a sub-session. Record the evidence
per control in `docs/checklist/{page}-rewalk.md` (control → action → result → ✅/❌ → fix PR). A page passes only when every
row is ✅. Known item to verify first: real-model AI flows (plan generation, personas from validation, M&V options,
pricing advisor, section AI). The local AI budget resets at 01:00 WAT.
Also ship the small fix first: strip em/en dashes from all AI output (`cofoundaz-api/app/platform/llm.py`).

### Step 2: Validation BE slice (a) (lead)
Per `docs/checklist/validation-prd-gaps.md` rows 2-6 and 14 (read the whole file and the PRD lines 455-479 first):
- `GET /validation/overview`: stat strip (validated/invalidated/untested, live experiments, responses collected).
- Riskiest untested assumption (risk high first) + "Design experiment" (AI draft of a smoke test for it, never auto-saved).
- **Hosted smoke-test pages (D-VAL-1):** published config at `/p/{slug}` (FE public route like `app/s/[token]`), slug
  uniqueness, public endpoints to read the page and record visit / email signup / CTA or preorder click (rate-limited,
  no auth, no PII beyond the email the visitor types), "Powered by Cofoundaz", post-signup message "You're on the list,
  we'll be in touch soon." Stats computed from real events; verdict moved server-side.
- Signup-milestone notification "{test} just passed {n} signups"; DELETE for validation entities.
- Then slices (b) scripts + Insight Synthesizer, (c) MVP feedback (D-VAL-2/3). FE: one sub-session per slice, chained.
Validation BE today: CRUD + two job endpoints with **no worker handlers** (`/synthesize`, `/scripts/generate`); see the gap
list for file:line pointers.

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
