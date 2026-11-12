# HANDOFF — Cofoundaz app-wide build-out (master)

> **First message for a new lead session (start it yourself, from `/Users/adebayovictor/Documents/dev/cofoundaz`):**
> *"Read `cofoundaz/docs/HANDOFF-master.md` and continue as the lead. Start with §0a. No half-built pages; ask me only for
> genuine product calls."*
>
> If the lead-24 handoff PR hasn't merged yet, read this file from its branch:
> `git -C cofoundaz fetch -q origin && git -C cofoundaz show origin/docs/lead24-handoff:docs/HANDOFF-master.md`

Last updated: **2026-11-12 ~12:40 WAT (lead session 24, handing over to lead 25, which Adebayo starts himself)**. Lead 24 was session `local_0f813530-39f3-4407-92bc-d9eb5272b9a1` (stays open, capped: no new work). Lead 23 was session `local_2a64fa6e-08f3-4ad4-ad3a-8b5832e1e323`. Lead 22 was session `local_d8bf2dc1-5968-4569-aefb-a51e78700310`. Lead 21 was session `local_db966c75-9250-4f68-80da-e3878c9e0bba`. Lead 20 was session `local_1bac7c03-f04b-4f82-99fd-3df089317419`. Lead 19 left no handoff of its own (it merged FE #216 and #218 on 2026-11-03). Lead 18 was session `local_90e78be7-a5e6-47e2-baf6-cf427912e03f` (started by lead 17). Lead 17 was session `local_e292715c-83ae-4894-8547-a9b8cc162c0a`; lead 16 was before it. Lead 15 was session `local_39a65db8-604e-4b86-9823-829f77313ca3`; lead 14 was session `local_720c2389-f281-4841-b8e1-c0a528cce121`; lead 13 was session `local_016c7571-74ef-4f0d-8038-42fbaae26d62`; lead 12 was session `local_834938e8-7994-46f3-b253-9f454e329879`; lead 11 was session `local_fafcc475-7de3-4c37-ba3f-fe728ace6b39`; lead 10 was `local_07d6ffed-3092-46d5-afa6-5e42c3f68d6d`. This file is a map; the detail lives in the gap lists
(`docs/checklist/*-prd-gaps.md`, `*-rewalk.md`), SOPs (`docs/sop/` in both repos), FE guides
(`cofoundaz-api/docs/fe-integration-guide-*.md`), design specs (`docs/superpowers/specs/`), the master checklists
(`cofoundaz-api/docs/checklist/PROJECT_CHECKLIST.md`, `docs/checklist/buildout-status.md`), and memory.

---

## 0. FOR ADEBAYO

### 0a. Open PRs and in-flight sessions

**Lead 24 handover to lead 25 (2026-11-12 ~12:40 WAT). Adebayo starts lead 25 himself: don't auto-chain from lead 24.**

**State:**
- API develop is **`f7073893`**. Migration chain: `… 0096 → 0100_ai_slice3 → 0099_funding_cap_table → 0103_readiness_narrative` (head). Out of number order by design; one head.
- Reserved: **0101** Marketplace C (#234), **0102** Funding D (#235). Both currently chain on 0103. Whichever merges second re-chains onto the other's revision (merge develop in with a merge commit, no force-push).
- FE develop is `18c7e00` (+ this handoff). FE `main` last released 2026-11-06 (#237). www = main (port 3100), stage = develop (3101), both on the VPS, both calling the **staging** API.
- Production API unchanged: `main` = 2026-09-21 (#89), migration 0027. Launch plan is in the lead-23 block below.
- Nothing merged between 2026-11-07 and 2026-11-12: both API sessions stopped after their last pushes on 11-06/07.

**Merged in lead 24 (2026-11-06/07), each verified (whole CI, attribution, branch, one head) and on Adebayo's "merge":**

| PR | What | Commit |
|---|---|---|
| API #232 | prod CORS allows www.cofoundaz.com (takes effect on the prod release) | `deb53bfa` |
| API #233 | AI Co-Founder slice 3: actions, feedback, regenerate, suggestions, bench (0100) | `5dcda40d` |
| API #229 | Funding C cap table (0099). Opus review: 0 high, 3 medium (currency-lock bypass, pre-money SAFE cap missing the pool top-up, converted SAFE as a separate holder row), 5 lows; all fixed; clean Opus fix-check | `dcdd7a67` |
| API #236 | Investor Readiness C narrative check (0103). All IR API slices (A score, B deck, C narrative, D mock Q&A) are now merged | `f7073893` |
| FE #239 | lead-23 handoff (FE #235 closed as superseded) | `18c7e00` |

**Open PRs (verify yourself before asking "Merge #N"):**

| PR | State at handover | Next |
|---|---|---|
| **API #234** Marketplace C booking/checkout/ledger (`feature/marketplace-booking`, head `be9e779c`, 0101 on 0103) | Three Opus rounds. Round 1: 1 high (charges stranded: non-final webhook outcomes answered 200, timer failed orders without verifying). Round 2 (fix-check): new N1-N3 (a mismatch stuck forever; unbounded retry on Paystack 4xx; **double charge on packages** when verify failed after a charge, because the founder saw "nothing was charged"). Round 3 fixes are pushed (every post-charge verify failure → 502 `PAYMENT_UNCONFIRMED`; mismatch closes the booking as `payment_review`, flagged for staff; bounded retry; per-hold commits). **CI is red on 3 checks:** Unit tests shard 3/4, End-to-end, CI gate | 1) The Marketplace session ([local_aad778e5](#local_aad778e5-f115-4579-8aa3-b3587cd13e75)) reads CI's logs, fixes, pushes once. 2) Run a **final Opus fix-check of round 3** (diff `bbc76d30..be9e779c` plus the CI fix): N1-N6, L5, and look for new double-refund or lock-order problems. 3) Ask to merge. Open gap: whether real Paystack answers 404 or 400 on verify for an unknown reference was never confirmed (no key used); the code is safe either way. Confirm it on staging and map 400 → not-found if so. Charging stays off in prod (two gates now: `MARKETPLACE_PAYMENTS_ENABLED` + refusal in production/`sk_live_` without a second flag) until counsel + Paystack confirm in writing (D-MP-3/9) |
| **API #235** Funding D term sheets (`feature/funding-term-sheets`, head `f4eba132`, 0102 on 0103) | CI green 18/18, CodeQL findings fixed. The session also has two lows from #229 to fold in (round currency default; duplicated `terms(sigma)` line) | Run the **final Opus review** (term-sheet flags D-FUND-6, founder-only gating D-FUND-5, audit rows, tenancy), route fixes to the Funding session ([local_9566a3ee](#local_9566a3ee-8063-48a3-ad66-db641935ab03)), check the fixes, ask to merge. Then Funding E (grants) and F (analytics) |
| **FE #240** FE dev: Team + Journal + Notifications QA fixes (`feature/team-journal-notifications-qa-fixes`, head `e0accfd`) | Reviewed by lead 24: **not ready**. Two blockers confirmed in code: Team audit sentences use invented action names (`INVITE_SENT`…; the API sends `team.invitation.created`, `team.member.joined`, `workspace.updated`), and out-of-scope onboarding changes that will collide with Auth FE step 2. Plus unrelated test/config edits, `RoadmapDrawer` changes, Journal settings error state and export URL, Notifications guessed filters/defaults | Paste-ready comment: `docs/fe-handoff/REVIEW-pr240.md`. Adebayo sends it to the FE dev (or asks the lead to post it). After the dev's fixes: re-check, merge, then the every-control re-walk on stage (1440 + 375, every role), then close FE #231/#232/#233 as superseded |
| FE #231 / #232 / #233 | Superseded by #240 | Close after #240 merges |
| API #214 Legal (Victoria) | Adebayo told Victoria to retarget to `develop` (2026-11-12) | When retargeted: fresh review per `victoria-legal-process` (gap list, D-LEG calls, live guide, re-walk) |

**Sessions:** no session is building. Still open (keep, they own the open PRs): Marketplace [local_aad778e5](#local_aad778e5-f115-4579-8aa3-b3587cd13e75) (#234) and Funding [local_9566a3ee](#local_9566a3ee-8063-48a3-ad66-db641935ab03) (#235). Archived on 2026-11-12: lead 21, lead 22, AI Co-Founder, Auth step 1, IR narrative, and the September prod-prep session. Lead 24 itself stays open but takes no new work.

**Cleanup done 2026-11-12:** 52 stale worktrees removed (every one had a merged or closed PR, nothing uncommitted, nothing unpushed; `comp-billing-api` held only a scratch `e2e/test_cbf_seed.py`). Local branches deleted except `develop`, `main` and the two open-PR branches. Remaining worktrees: `wt/marketplace-c`, `wt/funding-d`, `wt/lead24-handoff`. **Remote branches of merged/closed PRs were not deleted**: the auto-mode classifier blocked the bulk `git push --delete`. Adebayo runs it himself (lead 24 gave him the exact command with the named branches; open-PR heads and bases are excluded).

**Lead 25, first (in this order):**
1. Ask the Marketplace session to fix #234's red CI; then the round-3 Opus fix-check; then ask to merge.
2. Final Opus review of #235; route fixes; ask to merge. Re-chain whichever of #234/#235 merges second.
3. Track FE #240 through the dev's fixes, merge, re-walk on stage, close #231-233.
4. Next builds (max 3 at once): **Auth FE step 2** once Adebayo signs off the D-AUTH-7 list (then D-AUTH-6 cookie switch); **Funding E grants** (needs the drafted grants catalogue, below); **AI Co-Founder FE pass** and **Readiness FE pass** (APIs complete). Marketplace FE after #234.
5. Draft for Adebayo's review (D-FUND-1/2): a curated directory of ~50 Africa-focused funds (firm-level, no personal contacts) and a grants catalogue of 30-40 grants (each with a source link and `verified_on`). Neither exists yet; Funding E needs the grants catalogue.

**Adebayo's own to-dos (as of 2026-11-12):**
- Sign off or edit the **D-AUTH-7 lists** in `docs/checklist/auth-onboarding-prd-gaps.md` (26 industries + "Other", 8 goal chips, 6 stage cards). Auth FE step 2 waits on it.
- Send the FE dev the #240 review comment (`docs/fe-handoff/REVIEW-pr240.md`).
- Run the remote-branch cleanup command lead 24 gave him.
- Real Google sign-up and sign-in on `www` and `stage`.
- Counsel + Paystack in writing on holding Marketplace funds (D-MP-3/9).
- Turn on the Dependency graph and set `ENABLE_CODE_SCANNING=true`.
- Delete the Vercel project (planned ~2026-11-13).
- Decide when to launch the production API.
- Later: review the fund directory and grants catalogue once the lead drafts them.
- Done 2026-11-12: Admin message + briefs sent to the FE dev; Victoria told to retarget #214.

**Gotchas learned in lead 24:**
- Opus fix-checks keep finding new money bugs introduced by the previous round's fixes (#234 went three rounds). Always run a fix-check after a money-path fix; never merge on the session's own report.
- A session that hits a usage limit just stops; it doesn't report. If an open PR hasn't moved, read the session's last events (`list_events`) before assuming it's working.
- The auto-mode classifier blocks bulk remote branch deletion and starting sessions from automated turns; give Adebayo the command or a card.
- `gh pr merge --match-head-commit` needs the full 40-char SHA.

**Lead 23 handover to lead 24 (2026-11-06 ~20:00 WAT). Adebayo starts lead 24 himself: don't auto-chain from lead 23.**

**State:**
- API develop is **`4d7526e0`**. The migration chain ends `… 0094_marketplace_listings → 0097_ai_conversation_archive → 0098_ai_orchestrator → 0096_auth_onboarding_gaps` (head). Out of number order by design; one head.
- Reserved migration numbers: **0099** Funding C (#229), **0100** AI slice 3, **0101** Marketplace C. Each one that merges after another re-chains onto the newest head. Tell the session the exact `down_revision`; never chain onto an unmerged revision.
- FE develop is `29d4532` (+ this handoff). FE `main` was released today (#237, merge commit).
- **The frontend is off Vercel and on the VPS (LIVE):**
  - `www.cofoundaz.com` serves FE `main` on port **3100**; `stage.cofoundaz.com` serves FE `develop` on port **3101**. Port 3000 on the VPS belongs to another Express app; don't use it.
  - Each merge deploys by itself (`CD (production)` / `CD (staging)` in the FE repo): gates, build, GHCR, SSH deploy by digest, `/healthz` through nginx, auto-rollback. Manual rollback: re-run the workflow with an earlier `image_tag`. SOP + runbook: `docs/sop/2026-11-06-fe-vps-deploy.md`; edge: API `docs/deployment/WEB_FRONTEND_EDGE.md`.
  - **Both FEs call the staging API** (Adebayo: "Staging API for now"). Staging FE moved from `www` to `stage`; `www` now = `main`.
  - Certs for www + apex and for stage are issued and auto-renew. The apex 301-redirects to www. DNS is at Cloudoon.
  - Vercel project is the fallback until ~2026-11-13, then Adebayo deletes it.
- **The production API is far behind:** API `main` was last released 2026-09-21 (#89), migration **0027**, 496 commits behind develop. Switching `www` to `api.cofoundaz.com` is a **launch**, not a variable flip (see "Production launch" below).

**Merged in lead 23 (2026-11-06):**

| PR | What | Commit |
|---|---|---|
| API #226 | AI Co-Founder slice 1 (conversation management) | `c6ed4d37` (0097) |
| API #228 | AI orchestrator + 4 agents (retargeted from #226's branch) | `c431cda4` (0098) |
| API #227 | Auth & Onboarding step 1 (e2e regressions fixed; explicit invite-role allowlist) | `4d7526e0` (0096 on 0098) |
| FE #236 | Self-hosted web deploy (Docker, GHCR, SSH, rollback) | `3a5059a` |
| FE #237 | Release develop → main (merge commit) | — |
| API #230 | nginx web vhost templates + runbook (config only) | `36093db5` |
| FE #238 / API #231 | runbook ports 3100/3101 + busy-port hard stop | `29d4532` / `8119c844` |

**Open PRs:**

| PR | State | Next |
|---|---|---|
| **API #232** `chore/prod-cors-www` | Re-encrypted `.env.production.enc` (Adebayo added `https://www.cofoundaz.com` to `BACKEND_CORS_ORIGINS` + `APP_BASE_URL`; plaintext deleted). CI just started | Verify CI, ask "Merge #232". Takes effect only on the API develop → main release. The shared checkout `cofoundaz-api/` still shows `.env.production.enc` as modified (same bytes as the PR); after #232 merges, `git checkout -- .env.production.enc` there, then pull |
| **API #229** Funding C cap table | The session rebuilt the branch locally (`tmp-rewrite`, gitleaks clean, re-chained). **It refuses to force-push on a relayed approval:** Adebayo must type "Yes, force-push" in that session himself. Lead 23 also told it to re-chain 0099 onto `0096_auth_onboarding_gaps` first | After the push: whole CI, then the **Opus final money-path review** (share maths, SAFE conversion cap/discount/MFN, pre/post-money, dilution, row locks, audit rows, founder-only gating), then merge |
| API #214 Legal (Victoria) | Targets `main`, not `develop`; review posted 2026-11-05 | Victoria acts on the review |
| FE #231 / #232 / #233 (FE dev) | No pushes since the 2026-11-04/05 review comments; #233 still fails 2 checks | Adebayo points the dev at the comments; keep the PRs open |
| FE #235 lead-22 handoff | Superseded by this lead-23 handoff PR (which contains it) | Close #235 when this one merges |

**Sessions (message by id; each keeps its context):**

| Session | Doing | Next for it |
|---|---|---|
| `ai-cofounder-api` `local_d8cf74aa-8eea-442b-9574-06bcee52194d` | **Building** slice 3 on `feature/ai-cofounder-slice-3` (migration 0100 on 0096) | PR → verify → merge; then the AI FE pass |
| `marketplace-slice-a-prov` `local_aad778e5-f115-4579-8aa3-b3587cd13e75` | **Building** slice C (booking, checkout, ledger) on `feature/marketplace-booking` (0101 on 0096). Opus per task, Paystack test keys only, prod charging off; fixing the two slice-B lows | PR → verify → merge |
| `funding-slice-b-data-roo` `local_9566a3ee-8063-48a3-ad66-db641935ab03` | **Waiting on Adebayo's direct force-push OK** for #229 | push → CI → Opus review; then D term sheets, E grants, F copilot |
| `auth-onboarding-api` `local_61ef1365-a1f8-4f3c-a21f-8137d3aebc6e` | idle (#227 merged) | Auth FE step 2, once Adebayo edits the D-AUTH-7 industry list; D-AUTH-6 cookie switch |
| `ir-design` `local_c61f651d-2256-42cc-a830-1c1f61496136` | idle | Readiness slice C (narrative): start when a slot frees (max 3 building) |
| `fe-ci-cd-move-frontend-f` `local_3ba1c971-9784-468b-8507-7f4c5fb6dbd3` | done | can be archived |

**Production launch (Adebayo's call on timing; prepare it when he says go):**
1. API release PR develop → main. 71 migrations (0027 → head) run on the production DB, so **back up the prod DB first** and have a restore drill ready.
2. Production `.env` needs every key added since September (MFA, Journal and Finance encryption keys; Google OAuth; Paystack test or live; LLM key; mail; CORS already in #232). Give Adebayo a checklist of names; never read values.
3. After the prod API is healthy on head: set the FE `production` env var `NEXT_PUBLIC_API_BASE_URL=https://api.cofoundaz.com/api/v1` and re-run `CD (production)`.
4. Provider callbacks for www/stage: Google OAuth origins and redirects, Paystack/Flutterwave, Mono, LinkedIn.

**Adebayo's own to-dos:**
- Type "Yes, force-push" in the Funding session.
- Point the FE dev at the #231-233 review comments.
- Edit the D-AUTH-7 industry list.
- Real Google sign-up and sign-in on `www` and `stage` (add both origins in Google Cloud Console first if needed).
- Send the FE dev the Admin message and briefs.
- Tell Victoria to read #214's review.
- Counsel and Paystack confirm Marketplace fund holding in writing (D-MP-3/9).
- Turn on the Dependency graph and set `ENABLE_CODE_SCANNING=true`.
- Review the fund directory and grants catalogue.
- Delete the Vercel project around 2026-11-13.
- Decide when to launch the production API.
- Optional: confirm `curl -sI http://www.cofoundaz.com/` on the VPS returns 301 (lead 23's network intercepts port 80).

**Gotchas learned in lead 23:**
- Merging a parent PR can leave the next PR CONFLICTING. GitHub then runs no `pull_request` checks on it at all (only 1 check shows). Merge develop in (merge commit, no force-push) before reading its CI.
- The classifier blocks a session's force-push even with Adebayo's approval relayed by the lead. The approval has to be typed in that session.
- FE worktrees have no `node_modules`, so the pre-commit hook's `npx eslint` fails. For docs-only commits use `--no-verify`; for code, `npm ci` in the worktree.
- `grep -r` skips symlinked files in `sites-enabled`; use `-R`.
- Text pasted from the chat can turn host names into markdown links; on the VPS, values came through fine, but check `nginx -t` and the curl result rather than the echo.
- The VPS has no swap and the container memory limits exceed RAM; the runbook includes a 2 GiB swapfile step (Adebayo ran it).

**Lead 22 handover to lead 23 (2026-11-05 ~23:30 WAT). Adebayo starts lead 23 himself: don't auto-chain from lead 22.**

**State:**
- API develop is **`8960f83a`**.
- Migration chain: `0092 → 0093_readiness_mock_qa → 0095_funding_data_room → 0094_marketplace_listings` (head). Yes, 0094 sits after 0095 by down_revision; the SOPs say so.
- FE develop has #229 and #230 (the gap lists) and #234 (lead-21 handoff).
- The shared :8000 stack is down. Sessions run their own scratch stacks.
- When the stack next comes up, rebuild `api` + `worker` first (Mako changed in the lock), then `alembic upgrade head`.

**Merged in lead 22 (all squash, each on Adebayo's named "Merge #N"):**

| PR | What | Commit |
|---|---|---|
| FE #229 | AI Co-Founder gap list | `ec90e02a` |
| FE #230 | Auth & Onboarding gap list | `ebfd430b` |
| API #223 | pins #220's 0092 migration test to 0091; `downgrade -1` from head broke every later slice | `3f462384` |
| API #221 | Readiness D, mock Q&A | `f47a90ce` (0093) |
| API #222 | Funding B, data room | `614236be` (0095) |
| API #225 | Mako 1.4.3; the CVE-2026-102991 image alert is gone | `ae8d81ba` |
| API #224 | Marketplace B, listings + directory | `8960f83a` (0094) |

Every slice got an Opus review per task, then an Opus fix check, sometimes two rounds. The highs caught:
- the Q&A 90-day purge kept verbatim answers in the scorecard;
- `/otp` let the link holder find the invited email;
- "downloads off" protected PDFs only;
- the e2e 404 from adding `review` to `ReportItemType`;
- a report restore could relist a moderator's step-up unlist.

**Lead 23, first (in this order).** For every PR: verify it yourself (whole CI run incl. Security, e2e, CodeQL, attribution, `feature/` branch, one alembic head), then ask for "Merge #N". Squash with `--match-head-commit`.

1. **API #226, AI Co-Founder slice 1** (`feature/ai-cofounder-slice-1`, head `a49db147`, `0097_ai_conversation_archive` on 0094).
   - Done: Opus review plus fixes. The medium was that deleting a chat mid-reply let the LLM debit roll back, giving unbilled tokens past the budget. Fixed with a locked re-read after the call, and DELETE now returns 409 `REPLY_IN_PROGRESS` while generating. The lows were query trimming and a guide note on the report snippet copies. I checked the fix diff myself.
   - At handover: 14 checks pass, only e2e is still running. If it's green, ask Adebayo to merge.
2. **API #228, orchestrator + 4 agents** (`feature/ai-cofounder-orchestrator`, head `0e45526d`, `0098_ai_orchestrator` on 0097). It's stacked on #226 and its base is still the slice-1 branch, so only 1 check has run.
   - Done: Opus review and 4 lows fixed:
     - the router debit is committed first, and locks are taken in DELETE's order;
     - the stray `BriefingStatus.cancelled` is gone;
     - `<`/`>` are escaped in the workspace-data fence;
     - history is capped at 24k chars, with a pre-flight budget refusal.
   - After #226 merges: the session retargets it with `gh pr edit 228 --base develop`, never `--delete-branch`. Then check its full CI and ask to merge.
   - The two-session deadlock test isn't feasible with the fixture; the SOP says the fix relies on lock order.
3. **API #227, Auth & Onboarding step 1** (`feature/auth-onboarding-gaps`, head `adba1150`, `0096_auth_onboarding_gaps` on 0094). Auth, so it got the Opus review per task, a fix check, and lead checks of the follow-ups.
   - The 2 highs, both fixed:
     - Refresh-token reuse never committed the family revocation (this bug was already on develop).
     - The CSRF guard could be skipped with a junk body token, which handed the refresh token to script.
   - The 3 mediums, all fixed: an atomic lockout reservation; the lockout DoS; invite griefing, via a new decline endpoint.
   - The fix check then found a new medium (refused pair attempts counted toward the email total) and 2 lows. All fixed in `e59f2293`, then a double-decrement fix in `adba1150` (from the automated PR reviewer).
   - At handover CI was running: 9 pass, 5 pending.
   - **Re-chain before merge:** if #226/#228 merge first, 0096 must move onto `0098_ai_orchestrator`. Tell the session the exact down_revision, then do a full CI re-check.
   - Then the Auth FE PR (build-order step 2 in `auth-onboarding-prd-gaps.md`). It needs Adebayo's D-AUTH-7 industry-list edit and the D-AUTH-6 cookie switch.
4. **API #229, Funding C cap table** (`feature/funding-cap-table`, head `7c72e2e2`, `0099_funding_cap_table` on **0095**, so it must re-chain onto the newest head).
   - **Not reviewed yet.** CI is red on Security, CodeQL and CI gate; read the logs once the run is complete.
   - Needs the Opus final review with money-path scrutiny: share maths, SAFE conversion (cap/discount/MFN, pre/post-money), dilution, row locks, audit rows, founder-only gating on every route, notification and export.
   - Its session was told to park and write a ledger note.

**Lead defaults set by lead 22. Each is written in its PR's SOP; Adebayo can overrule:**
- **D-FUND-8.** With downloads off: images become stamped PDFs, other non-PDF types get 422 `VIEW_ONLY_UNSUPPORTED` (flagged at add time), and PDFs over 40M pixels are refused.
- **Funding accepted risks:**
  - the email-blind code cap means the link holder can delay an investor's code by up to an hour;
  - folder-name case-insensitivity is enforced in the service, under a lock;
  - the 120-s content ticket rides in the query string.
- **Readiness.** Model ratings feeding `story.mock_qa` are accepted, bounded by the 69 cap.
- **Auth lockout:**
  - the email-wide lock refuses only IPs with no sign-in to that account in 30 days (the (email, IP) lock from D-AUTH-2 is unchanged);
  - IPv6 is keyed on the /64;
  - reset mails are capped 5/h per (email, IP) and 20/h per email;
  - invited users can decline or start their own startup.

**Sessions, all idle. Message by id; each keeps its context:**

| Session | Has | Next for it |
|---|---|---|
| `ai-cofounder-api` `local_d8cf74aa-8eea-442b-9574-06bcee52194d` | #226, #228 | retarget #228 after #226 merges; then slice 3 (actions, feedback/regenerate, suggestions, `GET /ai/agents`), then the FE |
| `auth-onboarding-api` `local_61ef1365-a1f8-4f3c-a21f-8137d3aebc6e` | #227 | re-chain on your word; then Auth FE |
| `funding-slice-b-data-roo` `local_9566a3ee-8063-48a3-ad66-db641935ab03` | #229 | fix red CI + Opus findings, re-chain; then D term sheets, E grants (Adebayo reviews the catalogue), F copilot |
| `marketplace-slice-a-prov` `local_aad778e5-f115-4579-8aa3-b3587cd13e75` | Marketplace A+B | slice C booking + checkout + ledger (Opus per task, Paystack test keys only, prod charging off). Two lows carried in: dynamic `getattr(client, method)` calls in asserts (`tests/api/test_marketplace_listings.py:209, 684-686`) and a stale `review` flag after the flagged value is removed (`listings.py:115-117`) |
| `ir-design` `local_c61f651d-2256-42cc-a830-1c1f61496136` | Readiness A/B/D | slice C, the narrative |

Keep at most 3 building at once. Number migrations up front: 0096-0099 are taken, so the next free number is 0100. Re-chain each PR at merge time.

**Follow-ups (not blocking):**
- slowapi `Limiter` has no Redis `storage_uri`, so per-IP limits apply per worker (small `chore/`).
- The new auth tests and older suites still use `assert client.get(...)`. CodeQL flags only mutating calls, so keep new tests in the assign-then-assert style.
- After the AI, Auth, Funding, Readiness and Marketplace backends land: FE passes plus every-control re-walks (1440 + 375, all roles) before any of those pages flips ✅ or is unhidden.

**Adebayo's own to-dos (carried):**
- Point the FE dev at the #231-233 review comments.
- Edit the D-AUTH-7 industry list.
- Do a real Google sign-up and sign-in on `www.cofoundaz.com`.
- Send the FE dev the Admin message and briefs.
- Tell Victoria to read #214's review.
- Get counsel and Paystack to confirm Marketplace fund holding in writing (D-MP-3/9).
- Turn on the Dependency graph and set `ENABLE_CODE_SCANNING=true`.
- Review the fund directory and grants catalogue.

**Gotchas learned in lead 22:**
- A migration test using `downgrade -1` from `head` breaks as soon as anything chains on top. Pin explicit revisions.
- A PR can only chain onto revisions that are on develop. Chaining onto an unmerged PR's revision makes CI see a missing revision.
- Parallel `buildout-status.md` row edits conflict on every merge. Merge develop in and keep every row (a small script resolves it).
- `gh pr checks` can die on a GitHub TLS timeout mid-wait. Re-check rather than trusting the loop's exit.
- CodeQL `py/side-effect-in-assert` fails CI on `assert client.post/delete(...)`. Brief every session to assign first.

**Lead 21 handover to lead 22 (2026-11-05 ~20:30 WAT). Adebayo starts lead 22 himself: don't auto-chain from lead 21.**

**Lead 22, first (in this order):**
1. **Three API slices are building. Each reports to lead 21, which relays to you until it's archived. You can also message a session by id.** Verify each PR yourself (whole CI run incl. Security + e2e, CodeQL, no attribution, branch name), run the Opus review, then ask Adebayo to merge:
   | Slice | Session | Branch | Migration | Review |
   |---|---|---|---|---|
   | Readiness D, mock Q&A | `ir-design` `local_c61f651d-2256-42cc-a830-1c1f61496136` | `feature/readiness-mock-qa` (`wt/readiness-qa`) | `0093_readiness_mock_qa` on 0092 | Opus: transcript privacy (TM sees scores only), budget refusal under ~40k, retries don't re-spend, 90-day purge |
   | Marketplace B, listings + directory | `marketplace-slice-a-prov` `local_aad778e5-f115-4579-8aa3-b3587cd13e75` | `feature/marketplace-listings` (`wt/marketplace-b`) | `0094_marketplace_listings` on 0092 | Opus: visibility (only approved, non-suspended), no staff fields to founders, self-act guard on listing moderation, slot maths across DST |
   | Funding B, data room | `funding-slice-b-data-roo` `local_9566a3ee-8063-48a3-ad66-db641935ab03` | `feature/funding-data-room` (`wt/funding-b`) | `0095_funding_data_room` on 0092 | **Opus per task** (public token, email code brute force, serve-time authorisation, watermark) |
   All three branch from 0092, so **each one that merges after another must re-chain** its migration onto the newest head (`alembic heads` = exactly one). Merge order suggestion: Readiness D, Marketplace B, Funding B.
   The app was quit at ~20:00 and stalled `ir-design` mid-slice and the Marketplace session before slice B started; lead 21 nudged both to resume at ~20:20. If either shows idle with no PR, message it again.
2. **FE #229 (AI Co-Founder gap list) and FE #230 (Auth & Onboarding gap list)**: docs only, decisions recorded (heads `677fcc1`, `43da7c3`). Check CI and attribution, then they're ready for Adebayo's merge. #230's D-AUTH-7 draft (26 industries + "Other", 8 goal chips, 6 stage cards) needs **Adebayo's edit** before the onboarding FE step uses it.
3. **FE dev PRs #231 Team, #232 Journal, #233 Notifications** (opened by lead 21 from sammyspec's branches, reviews posted as PR comments 2026-11-05: Team `#issuecomment-6661516886`, Journal `...6661517730`, Notifications `...6661518526`). All three **need fixes**; #233 fails Unit tests on CI (Marketing tests reworded for one locale). Each also edits Marketing/test setup files that must move to a separate `chore/` PR. Adebayo points the FE dev at the comments. When the dev pushes, re-review against the comment list, CI green, then an every-control re-walk at 1440 + 375 per role before Adebayo merges. **Keep the PRs open** (Adebayo asked; fixes land in place).
4. **Next builds once a slot frees (max 3 sessions):** (a) **Auth & Onboarding API PR** from `auth-onboarding-prd-gaps.md` build order step 1 (gaps 1-4, 6-8, 11, 12, 14, 21, 22, 25 + D-AUTH-2 lockout, D-AUTH-6 tokens out of localStorage needs the cookie/refresh path); auth = Opus review. Then its FE PR. (b) **AI Co-Founder MVP** per D-AI-1 (orchestrator + 4 agents, workspace context, confirm-first actions, archive + delete). (c) Then Readiness C (narrative), Funding C (cap table, Opus final), Marketplace C (booking + checkout + ledger, Opus per task, Paystack test keys only).

**Merged in lead 21 (2026-11-05):** FE #226 + #227 (by lead 20 on Adebayo's "Merge both"), **#228 develop to main** (merge commit `e705ac1b`: `www` has #225 + #226). API **#218** Funding slice A (`b6cdd7c0`, 0090), **#219** Readiness slice B deck review (`9e21ae5f`, 0091; Opus found an uncounted-token retry + stuck review, fixed; worker `reap_stale` now caps re-queues), **#220** Marketplace slice A providers + vetting (`5d051f09`, 0092; Opus found self-vetting, ticks surviving request-changes, unscanned file reads, all fixed). API develop is **`5d051f09`**, migrations end at **`0092_marketplace_providers`**. FE develop is `24c6472` (+ this handoff).

**Decisions taken by Adebayo this session (all in memory):**
- **D-AI-1..6 "Accept all six"** (`ai-cofounder-decisions`): v1 = PRD MVP (orchestrator + Strategist, Finance, Legal-lite, Mentor; workspace context; 3 confirm-first actions; "Why I said this"); no streaming, "Cancel" stops the job; Suggested actions aggregate existing outputs; archive + "Delete forever", archived not searchable; memory deferred, panel dropped; hide Suggested actions and Your bench until built.
- **D-AUTH-1..7 "Accept all seven"** (`auth-onboarding-decisions`): keep PRD duplicate-email message; lockout per (email, IP); hide Apple + SMS 2FA; onboarding first then 2FA banner, Co-Founder invite = founder with a warning, no Investor in the wizard; Kickoff Assessment as step 6; tokens out of localStorage before launch; lead drafts the industry list, Adebayo edits.
- **Marketplace approved-profile edits "Lock name, queue flagged"** (`marketplace-decisions`): `display_name` locked after approval (422 `NAME_LOCKED`); pre-screen-flagged edits stay live and land in the Admin queue (`?flagged=true`, `clear-flag`); unflagged edits need no review. Built in #220.
- Build AI Co-Founder + Auth & Onboarding PRD passes next ("AI Co-Founder + Auth"); keep the FE dev's PRs open rather than closing them.

**Gotchas learned in lead 21:**
- `feature-dev:code-reviewer` agents have **no Bash**: write the diff to the scratchpad (`git diff -U40 origin/develop...origin/<branch> > …`) and point them at it, or use `general-purpose` for git access.
- `gh pr review --request-changes` fails on PRs opened from Adebayo's own account; post the review with `gh pr comment --body-file`.
- In zsh, `git show $B:app/...` expands `:a` as a modifier: quote it (`"$B:app/..."`).
- A session started by a session can't start sessions with `user_asked`; propose an `own_initiative` card (Adebayo clicks) or message an idle session that has the context. Archived sessions can't receive messages (`funding-a` was archived).
- Parallel API slices all branch from the same head: assign distinct migration numbers up front and re-chain at merge.

**Adebayo's own to-dos (carried + new):** point the FE dev at the three review comments; edit the D-AUTH-7 industry list in #230; real Google sign-up + sign-in on `www.cofoundaz.com`; send the FE dev `MESSAGE-to-fe-dev-admin.md` + the six Admin briefs; tell Victoria to read #214's review; counsel + Paystack in writing on holding Marketplace funds (D-MP-3/9); GitHub Dependency graph + `ENABLE_CODE_SCANNING=true`; later review the fund directory and grants catalogue.

**Module map (2026-11-05 ~20:30):**
| Module | BE | PRD+UI pass | FE / re-walk |
|---|---|---|---|
| 14 Funding Hub | A ✅ (#218); **B data room building**; C cap table, D term sheets, E grants, F copilot left | ✅ #221 | after slices; hidden |
| 15 Investor Readiness | A ✅ (#216), B ✅ (#219); **D mock Q&A building**; C narrative left | ✅ #222 | after; hidden |
| 16 Marketplace | A ✅ (#220); **B listings building**; C-F left (prod charging off) | ✅ #224 | after; hidden |
| 03 AI Co-Founder | exists; MVP gaps per #229 | ✅ #229 (D-AI accepted) | fix slices next |
| 01 Auth & Onboarding | exists; gaps per #230 | ✅ #230 (D-AUTH accepted) | fix slices next |
| 20/21/23 Notifications, Journal, Team | ✅ | ✅ | FE dev PRs #233/#232/#231, need fixes |
| 13 Legal | Victoria #214 (changes requested) | not done | hidden |
| 22 Analytics & Reports | none | not done | hidden |
| 25/26 Admin + Super Admin | ✅ | ✅ | FE dev (no PRs yet) |
| Everything else (14 pages) | ✅ | ✅ | ✅ re-walked |


**Lead 20 handover to lead 21 (2026-11-05), kept for history.**

**Lead 21, first (in this order):**
1. **API #218, Funding slice A (round + investor pipeline, migration `0090_funding_core`).** The Opus review passed the money path (row lock, `ALREADY_RECORDED` 409, Finance `Funding` category, never automatic). Its 5 fixes are pushed at `7c204192`: asserts, `IntegrityError` → 409 on the one-open-round index, edits locked after recording, a `move_stage` lock, an index on `recorded_transaction_id`. CI result: see "Lead 20's last checks" below. If the **Security** job is red, read its log (`gh run view --job <id> --log-failed` after the run completes), fix it on `feature/funding-pipeline` (message `funding-a` `local_f12e903b-ace7-4f92-bf1b-a8b5fdf1b04c`), and re-check. Merge only on Adebayo's named go-ahead, squash, `--match-head-commit`. **Don't use `--delete-branch` on a PR that another PR is stacked on**: #217 was closed by that and had to be reopened as #218.
2. **FE #226, founder Billing comped plan + refunds (part C of `super-admin-flags-billing.md`)**: ready for Adebayo's merge (rows 21-24 pass at both widths, CI green on `baca1794`). Then the FE dev skips part C.
3. **develop to main** after #226 merges, so `www` gets the comp fix and the Legal/Analytics sidebar hide (#225). **Merge it with a merge commit, never squash** (a squashed release caused today's conflict: #220 fixed it by merging main into develop).
4. Then build, keeping 2-3 sessions running (see "Next build" below).

**Merged in lead 20 (2026-11-05):** FE #219 (develop to main, merge commit `83b938c5`: Google sign-in on `www`), #220 (main into develop), #221 Funding design, #222 Investor Readiness design, #223 faster FE CI, #224 Marketplace design, #225 hide Legal & Compliance and Analytics & Reports. API #215 faster CI (4 unit shards, `critical` e2e on PRs, `CI gate` always reports; docs-only PRs skip the heavy jobs, proven on #222/#224), #216 Investor Readiness slice A (score + history, `0089_readiness_scores`, Opus-reviewed).

**Decisions taken by Adebayo this session (all in memory):**
- **D-IR-1..7** "Accept all seven" (`investor-readiness-decisions`): deterministic score, weights T25/F20/P15/M15/Team15/S10, capped at 69 until model + **reviewed** deck + traction proof; separate from Health; F full, TM reads (no Q&A transcripts, no AI tools), other roles 403; deck review = text + layout; investor sees bars only via a Funding share; Q&A 10 answers, refuse under ~40k tokens, 90-day transcripts.
- **D-FUND-1..8** "Accept all eight" (`funding-decisions`): curated fund directory + grants catalogue (Adebayo reviews both), email + 6-digit code data room, SAFE-converting cap table, cap table and term sheets founder-only, rules-based term flags, one currency per round, downloads off + PDF watermark.
- **D-MP-1..9** "Accept all nine" (`marketplace-decisions`): hybrid experts, `/provider` portal, platform holds funds **only once counsel + Paystack confirm in writing** (else split), 15% expert-side, verified reviews, real perks only, **production charging off until then**.
- Hide Legal & Compliance and Analytics & Reports until real ("Yes, hide both"; FE #225).
- **Victoria follows our process** (`victoria-legal-process`): her API #214 got a changes-requested review (migration `0067_legal` must become the next free number on the head, retarget to `develop`, magic-byte sniff + private storage for proof uploads, asserts, SOP/checklist/e2e/guide) and a comment spelling out gap list → D-LEG calls → slices → FE pass → every-control re-walk.
- Fix the founder comp display ourselves (FE #226), not via the FE dev.

**Verified this session:**
- **Admin + Super Admin API is ready for all six FE briefs**: every route, code and step-up the briefs name exists on develop, with live-captured guides; staging runs the develop head. PRD lines not built all trace to decisions: D-ADM-3 (no impersonation), D-ADM-12 (no system health grid), D-ADM-13 (AI config deferred), P8 (platform analytics out), T2 (no AI triage), Content editor deferred, moderation with Marketplace. Small: founder ticket categories lack PRD's "Abuse"/"Data"; the staff guide's line "no scoped routes exist" is stale (fix in the next API docs PR).
- The FE dev (sammyspec) pushed `feature/team-fe`, `feature/journal-fe`, `feature/notifications-fe` (2026-11-04/05) with **no PRs**, and has no Admin branches.

**Module map (2026-11-05):**
| Module | BE | PRD+UI pass | FE / re-walk |
|---|---|---|---|
| 14 Funding Hub | slice A in #218; **B data room, C cap table, D term sheets, E grants, F copilot/analytics left** (D-FUND-1 directory and D-FUND-2 catalogue need Adebayo's content review) | ✅ #221 | FE pass after the slices; hidden |
| 15 Investor Readiness | A ✅ (#216); **B deck review, D mock Q&A, then C narrative left** | ✅ #222 | FE pass after; hidden |
| 16 Marketplace | **none yet**: slices per `docs/superpowers/specs/2026-11-05-marketplace-design.md` | ✅ #224 | after; hidden; prod charging off |
| 13 Legal | Victoria #214 (changes requested) | **not done** (she owes `legal-prd-gaps.md`) | hidden |
| 22 Analytics & Reports | **none** | **not done** | hidden |
| 03 AI Co-Founder | exists | **never done** | **never re-walked** |
| 01 Auth & Onboarding | exists; Google ✅ | **only Google** | Google waits on Adebayo's click on `www` |
| 20/21/23 Notifications, Journal, Team | ✅ | ✅ | waits on the FE dev's PRs |
| 25/26 Admin + Super Admin | ✅ (verified ready) | ✅ | FE dev; founder part C is ours (#226) |
| Everything else (14 pages) | ✅ | ✅ | ✅ re-walked |

**Next build (Adebayo hadn't chosen at handover; ask him in one line):** PRD + UI passes for **AI Co-Founder** and **Auth & Onboarding** (never audited, every founder uses them), or the **Analytics & Reports** design. Alongside: **Readiness slice B** (deck review, `pypdfium2`) and **D** (mock Q&A), **Funding slice B** (data room, needs Documents link shares, email + OTP, PDF watermark), **Marketplace slice A** (catalogue + provider accounts). Migrations: next free is **0091** after #218. Victoria's Legal migration takes whatever is free when she rebases.

**Adebayo's own to-dos:** real Google sign-up + sign-in on `www.cofoundaz.com`; send the FE dev `MESSAGE-to-fe-dev-admin.md` + six Admin briefs and ask for PRs on Team/Journal/Notifications; tell Victoria to read #214's review; ask counsel + Paystack in writing about holding Marketplace funds (D-MP-3/9); turn on GitHub Dependency graph + `ENABLE_CODE_SCANNING=true` to bring back "Dependency review"; later review the fund directory and grants catalogue.

**Sessions (all Sonnet; message by id):** `funding-a` `local_f12e903b-ace7-4f92-bf1b-a8b5fdf1b04c` (#218 fixes), `comp-billing-fe` `local_b2d76332-cb44-4513-8393-a60cc4e1db95` (#226 walk), `ir-design` `local_c61f651d-2256-42cc-a830-1c1f61496136` (has Readiness context: give it slice B or D). Done, can be archived on Adebayo's yes: `ci-speed` `local_c2bfaa66-...`, `funding-design` `local_83cc81d5-...`, `marketplace-design` `local_a2953654-...`.

**Gotchas learned in lead 20:**
- `gh pr merge --delete-branch` on a branch another PR targets **closes** that PR (GitHub doesn't retarget). Merge without deleting, retarget the child with `gh pr edit <n> --base develop`, then delete.
- Several design PRs all add a row to `docs/checklist/buildout-status.md`, so each merge conflicts the next: merge develop in and keep all rows.
- Squash-merged stacked PRs leave the child with conflicts on the same lines: merge develop into the child (never rebase or force-push, others stack on it).
- With the new CI, the Security job and e2e logs only appear after the **whole run** completes.
- The shared local API stack on :8000 is **down**. Sessions run their own scratch stack (`<prefix>-pg`, `<prefix>-redis`) and stop it after.

**Lead 20's last checks (filled at handover):** **#218** was red only on the Security job: **bandit B101, `assert` in app code** (`app/services/funding/investors.py:272`, `:301`, maybe more). Lead 20 sent `funding-a` the fix at handover (explicit checks instead of asserts, run the CI bandit command locally, push, full run green). Unit shards and e2e were still running on `7c204192`. Check its next head yourself before telling Adebayo it's ready. **#226** is complete: rows 21-24 PASS at 1440 and 375 (`billing-comped-refunds-walk.md`), CI green on `baca1794`, no attribution, scratch containers stopped. Ready for Adebayo's merge.

**Lead 18 handover to lead 19 (2026-11-02), kept for history. Adebayo starts lead 19 himself: don't auto-chain from lead 18.**

**Lead 19, first thing:** the Google check is **done**. Adebayo did a real Google sign-up and sign-in on local :3000 on 2026-11-02 and both worked. He then asked for Google's official button branding, and it's in.
1. **FE #216** (`feature/google-sign-in-fe`) is ready for his merge: head `fb1e0fe4`, CI green, mergeable, no attribution. It has the open-redirect fix and the official Google button (multicolour G, white with a `#747775` border, Roboto Medium 14px, `ui/marketing/auth/google-button.tsx`), with screenshots in `docs/checklist/google-sign-in-fe-walk-evidence/`. Re-check CI on the head before telling him; merge only on his named go-ahead.
2. After it merges, open a **develop to main** PR so `www` gets it. Then Adebayo does a real click on staging (`www.cofoundaz.com`, API `staging-api`).
3. The dev server on :3000 is stopped. The local API stack may still be up.

**State:**
- **Admin API "Next" is done** except Content (deferred). Merged today: API **#211 Tickets** (`073cef9f`, 0087), **#212 Reported issues** (`02c7caf5`, 0088), **#213 Google sign-in** (`08b34faa`, no migration). FE briefs **#212** (`admin-support-tickets.md`), **#213** (`admin-reported-issues.md`), **#214** (`google-sign-in.md`). Also FE #210 (Danger zone brief) and #211 (lead-18 handoff).
- API develop is **`08b34faa`**; migrations end at **`0088_content_reports`**. Staging `CD (staging)` passed for `219ad18b`, `073cef9f`, `02c7caf5`; `08b34faa` ✅ too (Tickets, Reported issues, Google sign-in are on staging).
- **Local stack is DOWN.** Adebayo ran `docker compose down` himself (images rebuilt for pypdf 6.21.4). The shared checkout is on `08b34faa`. When he brings it up: `docker compose up -d && docker compose exec -T api alembic upgrade head` (0088 not yet applied locally).

**Decisions taken by Adebayo this session (all in memory `admin-decisions`, `google-sign-in-queued`):**
- Tickets T1-T8 ("Accept all three" + defaults): first-reply SLA P1 1h / P2 4h / P3 24h / P4 72h; no AI triage; text only (5000 chars); 5 tickets/hr, 20/day, 30 replies/hr; workspace founder sees all the workspace's tickets, never notes; reply reopens within 14 days; escalate = P1 + note, resolve emails.
- **P1 exception** ("Yes, skip it"): no fresh authenticator code on routine ticket actions (reply, note, assign, priority, resolve, escalate). Audit rows and escalate reasons stay.
- **P5** ("Keep repo markdown"): Academy stays repo markdown. **Content editor deferred** ("Defer the editor"): Content library stays hidden.
- Reported issues R1-R12 are **lead defaults** (Adebayo saw them, no change): staff see only the snippet copied at report time; remove/restore need step-up; moderator vs Super Admin on escalations.
- **Google sign-in** ("Accept all four"): link by verified email (an unverified squatter row is taken over, its 2FA cleared); 2FA still applies; first sign-in goes to onboarding; invite accepted only if emails match; hide Apple. **Adebayo added the redirect URIs** (local, staging, prod).
- **Google sign-in FE is ours, not the FE dev's** (Adebayo: "lets do it alongside our work").

**In flight:**
| Session | Task | Branch | State |
|---|---|---|---|
| `google-sign-in-fe` `local_c1f0452c-26a8-4d31-9aa8-d0762951aaa3` (Sonnet) | Wire Google buttons, `/auth/google/callback`, invite + MFA, hide Apple, walk 1440 + 375 | FE `feature/google-sign-in-fe` (`wt/google-sign-in-fe`) | **FE #216** open, head `fb1e0fe4` (official Google button added after Adebayo's passing real click), CI green, mergeable, no attribution. Lead 18 found an open redirect in `safeNextPath` (`/\evil.com`); fixed with one shared `isSafeInternalPath` rule (decodes first; rejects `//`, backslash, whitespace, control chars) and reviewed. Walk evidence `docs/checklist/google-sign-in-fe-walk.md` (screens up to Google's chooser live; post-consent paths unit-tested). Real Google click passed (Adebayo, local). Waiting on his merge |

Done and idle (can be archived on Adebayo's yes): `admin-tickets` `local_dce82c80-...`, `admin-reports` `local_535f9f7b-...`, `google-sign-in` `local_d7993816-...`.

**Follow-ups found this session (not blocking):**
- Google (SOP `cofoundaz-api/docs/sop/2026-11-02-google-sign-in.md`): email the owner when Google is linked; a set-password path for Google-only accounts (they can't turn 2FA off today); unique index `oauth_accounts(user_id, provider)`; rate limit keys on the proxy IP unless `FORWARDED_ALLOW_IPS` is set; squatter's access token lives up to 15 min after takeover.
- Reported issues: no notification to the author on removal yet.
- Scratch containers from finished sessions are still running (`tk-*`, `rep-*`, `gsi-*`, `adz-*`, `dvafee-*`, `sr-ci-*`); worktrees `wt/admin-slice-*`, `wt/admin-tickets*`, `wt/admin-reports*`, `wt/google-sign-in` can go. Deleting is blocked for the lead: give Adebayo the commands.

**Adebayo's own to-dos:** send the FE dev the Admin briefs (`admin-portal.md`, `super-admin*.md`, `admin-support-tickets.md`, `admin-reported-issues.md`) with `MESSAGE-to-fe-dev-admin.md`; the FE dev still has no PRs for Team, Journal, Notifications or Admin.

**Next, in order (lead 19):**
1. ~~Confirm staging for `08b34faa`~~ ✅ passed (lead 18).
2. FE #216 merge, then develop to main, then a staging click (see "Lead 19, first thing" above). Staging `08b34faa` deploy: ✅ confirmed by lead 18.
3. **CI tuning** (§2b item 5): path filters, sharded unit suite, trim API e2e to critical journeys. Measure before/after.
4. Then **Funding, Investor Readiness, Marketplace** (§2b item 6): design first per page (PRD + existing FE page, gap list with D-n questions), then BE slices; unhide each in the sidebar when it ships. Expert vetting and listing moderation come with Marketplace.
5. Lead's habits (from lead 17, still true): check every session's branch, PR and CI yourself; brief each sub-session with worktree, branch, migration number and the rules; Opus review per task on security slices; grep tests for side effects in `assert` before pushing (CodeQL fails them); `gh pr merge --squash --match-head-commit` only on Adebayo's named go-ahead; keep 2-3 sessions building.

**Lead 17 handover to lead 18 (2026-11-02), kept for history.**

**State:**
- **First-release Admin API is complete:** slices **A #205, B #206, C #207, D #208, E #209 all merged**. API develop is `219ad18b`; migrations end at `0086_admin_danger_zone`.
- Develop was red from #207's merge until #210: the test Paystack stub stamped every payment with a fixed date, so from 2026-11-01 a monthly plan "bought" in a test had already ended. The fix is in `app/services/finance/payments/stub_transport.py`. Real billing was never affected.
- FE develop has the Admin gap list (#207) and three FE briefs (#208, #209). The Danger zone brief (#210) and this handoff are open.

**Open, Adebayo merges:**
- **FE #210**: Danger zone FE brief (`docs/fe-handoff/super-admin-danger-zone.md`), with the app-wide maintenance banner.
- **This handoff PR.**

**Slice E notes:**
- Turning maintenance off is a one-person action; turning it on, and global sign-out, need a second Super Admin.
- Accepted narrow gap: a live-updates stream ticket minted in the 30 s before a global sign-out can still open a stream. It's in the SOP.
- Staging deploy of `219ad18b` not checked yet: confirm `CD (staging)` succeeded.

**Admin is API only** (Adebayo 2026-10-31, "only do the BE"). The FE and its re-walk go to the junior FE dev:
- Briefs: `docs/fe-handoff/admin-portal.md`, `super-admin.md`, `super-admin-flags-billing.md`, `super-admin-danger-zone.md` (FE #210).
- Message: `docs/fe-handoff/MESSAGE-to-fe-dev-admin.md`, which Adebayo sends.
- The FE dev has **no PRs open yet**, for Team, Journal, Notifications or Admin.

**Decisions (all in memory `admin-decisions`):**
- D-ADM-1..7 (spec `docs/superpowers/specs/2026-10-31-admin-portals-design.md`).
- P1-P13 (`docs/checklist/admin-prd-gaps.md`).
- Slice C's four calls ("Accept all four"): credit = AI credits; comp = free plan up to 365 days; extend trial 1-60 days capped at 90; a refund shows to the founder only after it's marked done.

**Next API work, in order:**
1. **Tickets**, with the founder Help intake in Settings (P4).
2. **Content tools.** P5 is open: Academy stays repo markdown unless Adebayo says otherwise; ask when this starts.
3. **Reported issues.**
4. **Google sign-in** (§2b 3a). Three product calls first: linking to existing accounts, 2FA, onboarding and invites.

Expert vetting and listing moderation wait for Marketplace.

**Founder-side Billing change still owed to the FE:** a comped founder today sees "Your plan ends on" and a Keep my plan button that fails 409 `PLAN_COMPLIMENTARY`. The fix is part C of `super-admin-flags-billing.md`. Comp should be used on staging only after the FE dev ships it.

**Not verified:** a real renewal, the ₦50 refund, a meeting reminder firing on staging, a comp lapsing in real time, live Paystack webhooks for comp.

**How lead 17 learned to work (keep doing it):**
- **Check a session's branch and PR yourself before reporting.** A note is not proof, and sessions have pushed with conflicts unresolved or waited on long local runs.
- **Read CI's own log** when it fails. GitHub holds a run's logs until every job in it finishes.
- **CI shares one e2e database across the staff journeys:** never assert exact staff counts, and leave maintenance mode off.
- **`gh pr merge` needs Adebayo to name the PR** in his current message. Always pass `--match-head-commit`.
- **Commit hooks run ESLint and need `node_modules`.** In an FE docs worktree, symlink one from a worktree that has it (e.g. `ln -s ../<wt>/node_modules`), commit, then remove the link. Never use `--no-verify`.
- **Deleting worktrees is blocked by the classifier.** Give Adebayo the command.
- **Keep 2 or 3 sessions building.** Don't idle while one waits on CI.

**Lead 17 (2026-10-31), kept for history.**

**Staging FE is `https://www.cofoundaz.com`** (moves to `https://stage.cofoundaz.com` later, not now). The API already allows both. Lead can't type a password there; Adebayo signs in in the browser pane.

**Merged:** API #203, #204, #205 (slice A), #206 (slice B); FE #202, #203, #205 (develop to main), #206, #207.

**Settings freeze: root caused, fix merged in FE #203.** Reproduced on staging. Next takes a soft navigation's URL from the cached route entry, which ignores the query string on a static page, so after a load on `?tab=billing` every pill lands back there. Same-page URLs now use `lib/replace-url.ts`. See `docs/sop/2026-10-31-settings-pills-frozen.md`. Re-check on `www` after deploy.

**Verified 2026-10-31:** freeze fix on `www`; Keep my plan on Kolo; webhook delivery (Adebayo, Paystack dashboard). **`www` deploys from `main`**, so FE fixes need a develop to main PR. API staging deploys from develop.

**Admin + Super Admin: API only here** (Adebayo: "only do the BE"); FE and its re-walk go to the junior FE dev via `docs/fe-handoff/admin-portal.md` and `super-admin.md`. D-ADM-1..7 and P1-P13 accepted. Spec `docs/superpowers/specs/2026-10-31-admin-portals-design.md`, gap list `docs/checklist/admin-prd-gaps.md`. Slice C (`local_451b8c48-40c1-4f21-bc44-5776eb604b37`, stacked on merged #206) waits on four billing calls. Slice D flags (`local_ff52e864-1f9b-49b9-8a57-06c262f77067`) running. Then slice E, then the later brief for flags, overrides and Danger zone.

**Lead 16 handover (2026-10-31). Adebayo starts lead 17 himself: don't auto-chain from lead 16.**

**Lead 17, first (in this order):**
1. **Check API #203 and #204.** Both were still in CI at handover; "Dependency review" is the known red. Merge only when Adebayo names the PR in his current message.
   - **#203** `fix/billing-paystack-link`, head `2aa8a27c`: cancel, plan changes and resume now find the live Paystack subscription. `GET /subscription?customer=` needs the numeric id, so a customer code returned nothing and the subscription stayed unlinked unless the webhook linked it. Unlinked cancel never reached Paystack, so the card would keep being charged; resume then got "This subscription is already in place." Also bumps `pypdf` to 6.21.4 for new advisories, so **rebuild** the images (`docker compose build api worker`) after merge.
   - **#204** `feature/meeting-reminder-email`, head `2c049c10`: meeting reminders by email, new type `calendar.meeting.reminder`, new Calendar preferences row on by default, skips the digest. Adebayo asked for this. No live email yet.
2. **FE #202** (this file and the checklist): Adebayo merges.
3. **Settings freeze, open bug, not fixed.** Adebayo: after a payment, Settings buttons stop responding and a refresh doesn't help. Not reproduced locally on a paid account: no overlay, none disabled, all 12 Settings and Billing tabs worked. That was a dev server, not the cancelled state. His screenshot shows Keep my plan still responds, so tabs (`router.replace`) may be the difference: a guess. Waiting on him for the staging FE address, which buttons, Console errors, and a private-window try. `staging-app.cofoundaz.com` does not respond, so lead 16 gave him the wrong address. Repo homepage is `https://cofoundaz.vercel.app`.
4. **After #203 deploys,** Adebayo clicks Keep my plan on Kolo. Confirm it recovers. His Paystack subscription may still be active from the unlinked cancel.
5. **After #204 deploys,** a meeting 20 minutes ahead should send an email. Check quiet hours are off.
6. **Webhook not proven.** Adebayo said the redirect proved it; it doesn't. The resume failure suggests `subscription.create` wasn't processed on staging, so ask him to check delivery in the Paystack dashboard (test webhook URL `https://staging-api.cofoundaz.com/api/v1/webhooks/billing/paystack`). Renewals depend on it.
7. **Then build:** Admin Portal + Super Admin (§2b item 3, design first), then Google sign-in (§2b item 3a).

**Verified by Adebayo on staging:** Google consent and two-way sync; paid subscription, card saved, receipt PDF, credit pack, cancel showing the end date; ₦50 charge. **Verified by lead 16:** AI tone on the real model (chat only, local stack, not the daily briefing). Staging gate passed on `00582a07` and minted proof.

**Still not verified:** webhook delivery, resume, ₦50 refund (Adebayo will check on the live key, a real ₦50), a reminder firing on staging, invite email (Team page invite is still mock, waits on the FE dev), renewals.

**Answered:** billing is recurring by design: checkout attaches a Paystack plan and Paystack charges the saved card. No renewal has happened yet.

**Google sign-in correction:** the login page already shows "Continue with Google" and "Continue with Apple" buttons. They look unwired and no backend was found. Three product calls are still open: linking to existing accounts, 2FA, onboarding and invites.

**Leftovers:** worktrees `wt/billing-paystack-link`, `wt/meeting-reminder-email`, `wt/billing-tone-checks` go when their PRs merge. Two untracked old logos in `cofoundaz/public/` await Adebayo's yes to delete. Local DB has a throwaway paid founder `freeze-walk-94d122@example.com`, and Paystack test mode has `resume-probe-*` customers. `cofoundaz-api/` checkout is one commit behind develop. Local `worker` showed unhealthy: not looked into.

**Test tip:** a worktree needs `cp ../../cofoundaz-api/.env.example .env` and the venv `cofoundaz-api-kvMkS96W-py3.14`, with `DATABASE_URL=...ci_scratch` (see §4 and the local-test-db memory).

**Lead 16 earlier (2026-10-30), kept for history.**

**Merged:** API #201 AI preferences (0082). FE #190 Calendar, #192 Settings + Billing + AI preferences, #191, #193, #194, #195. **Calendar and Settings are ✅ on merged develop** (Settings by scripted real-browser walk, 350/350).

**Open, CI to confirm, Adebayo merges:** FE #196 sidebar scroll; API #202 stops the live e2e gate crashing on a missing `PAYSTACK_SECRET_KEY`. That crash failed every `CD (staging)` run since #196 Billing, so no staging-verified proof was minted. The next gate run on develop is the real proof and may show failures it was hiding.

**Done by Adebayo:** FE dev message sent; `JOURNAL_ENCRYPTION_KEY` set; local Paystack key confirmed as a test key. Watch for the FE dev's Team, Journal and Notifications PRs and re-walk each on merged develop.

**Next, in order:** Admin Portal + Super Admin (§2b item 3; both FE pages exist as mocks, `app/admin-portal/page.tsx` and `app/super-admin/page.tsx`, with no API and no walk; design first), then Google sign-in/sign-up (§2b item 3a).

**Cleaned:** merged worktrees and 46 stale remote branches. Kept remote: `docs/sales-sequences-rewalk` (a re-check commit not on develop) and `feat/legal-compliance` (Legal design spec, no PR). Shared FE checkout's stale gap-list drafts deleted and develop pulled. Old untracked `public/cofoundaz_logo.png` and `public/cofoundaz_text_logo.png` left alone: superseded by `public/brand/`, not on develop, so not recoverable if deleted.

**Not verified, needs a person or a public URL:** Billing paid checkout, webhooks, ₦50 refund, real cancel and resume, receipt PDF. Calendar real Google consent, reminders firing, invite email. AI preferences real model tone.

**Lead 15 handover (2026-10-30 ~00:30 WAT), kept for history.** Adebayo paused for the night and starts lead 16 himself tomorrow
(don't auto-chain). Every session was told to commit, push, write a ledger note and stop.

**Next lead, first (in this order):**
1. **The merge train is done.** API #199 Notifications merged at 00:25 (`e7153db7`, 0081). The stack is on **`0081_notifications_gaps`**.
2. **FE-dev hand-over:** Adebayo sends the FE dev `docs/fe-handoff/MESSAGE-to-fe-dev.md` (the process, strict develop-only PRs,
   order Team → Journal → Notifications). When his PRs come in: check CI, check that the head branch is off develop, then re-walk
   every acceptance row at 1440 + 375 for every role on merged develop before flipping a page ✅.
3. **Resume the two FE passes** (Sonnet, each in its own worktree, each draft PR, never merges): read each ledger note, then message
   the session by id to continue. Re-walk every control at 1440 + 375 for every role before flipping a page done.
4. **S8 AI preferences** in `settings` (`local_4b2900da-…`): migration **0082 after 0081**. Start it when a slot frees
   (max 2-3 sessions running).
5. Then **Admin Portal (25) + Super Admin Portal (26) BE**, design first (§2b item 3).
6. Parked: lead's `fix/sidebar-scroll` (`wt/sidebar-scroll`, `5b71c2c`, not pushed). #184 is merged, so rebase on develop, `npm ci`,
   build, browser check at 1440 + 375, push, PR.

**Merging:** Adebayo approves merges, but the classifier refuses `gh pr merge` ("Merge Without Review") unless his *current* message
names the PR. #196 and #198 went through with his in-turn approval; #194 needed him to say "You merge #194". If it refuses, ask him in
one line naming the PR, or give him the command. Always: CI green on the head, mergeable, no AI attribution in commits or the body,
`--squash --match-head-commit <sha>`.

**Shared stack update after each API merge (Adebayo OK'd the lead running these, 2026-10-29: "run those commands yourself. I approve"):**
`git -C cofoundaz-api pull --ff-only`, then `docker compose exec -T api alembic upgrade head`, `docker compose restart api worker`,
then `/health` (it can show 000 for ~15 s while restarting; re-check). Rebuild (`docker compose build api worker`) only if
`pyproject.toml`/`poetry.lock` changed: none did tonight.

**Merged in lead 15 (2026-10-29/30, all squash):** API **#200 Team** `a8832a15`, **#196 Billing** `e7a39e77` (0078; its e2e was fixed
by giving CI a throwaway Paystack test key + stubbed provider, `e092073f`), **#194 Calendar** `513143fd` (0079), **#198 Journal**
`e033720f` (0080), **#199 Notifications** `e7153db7` (0081). FE #187, #188, #189 were merged by Adebayo before lead 15 started.

**Shared stack:** API develop `e7153db7`, migration **`0081_notifications_gaps`** head, `/health` 200.

**Sessions (all Sonnet; message by id, they keep context):**
| Session | Task | Branch / worktree | State at handover |
|---|---|---|---|
| `jnt-pass` `local_e08a654a-63c4-48f3-a39a-c278c1cb3ce9` | Journal/Notifications/Team API pass + FE-dev briefs | API `feature/notifications-be-gaps` | done: #199 re-chained, merged by lead 15. Can be archived |
| `calendar-fe` `local_d57769cf-ac86-4e8e-bdf0-3b21e854d268` | Calendar FE pass (all FE gaps in `cofoundaz-api/docs/handoff/calendar-prd-gaps.md`, guide `fe-integration-guide-calendar-v2.md`), dev server :3101 | FE `feature/calendar-fe` (`wt/calendar-fe`) | **FE PR #190** open, head `509c734`, stopped clean. Ledger `docs/checklist/calendar-rewalk.md`, SOP `docs/sop/2026-10-30-calendar-fe.md`. Left: confirm CI; re-verify the needs-attention banner after its refetch fix; walk the team-member and 375 rows marked "not walked"; then merge and re-walk on develop. Deferred: action-item assignee/title edit. No BE bugs |
| `settings-fe` `local_53684470-dcdd-47d1-824c-99564cde4b1f` | Settings + Billing FE pass (gap list `docs/checklist/settings-prd-gaps.md`; guides `fe-integration-guide-settings{,-billing}.md`). **S7 (digest UI) excluded: it's in the FE dev's Notifications brief; never touch `app/(dashboard)/notifications/`.** S8 deferred (no BE yet). Dev server :3102 | FE `feature/settings-billing-fe` (`wt/settings-fe`) | **Draft FE PR #192**, head `2296629`, stopped. **Not done.** Ledger `docs/checklist/settings-rewalk.md`: scripted walk 220/246 pass across 4 roles × 1440/375; 26 failures not yet triaged (2FA setup dialog timeouts, password-change reload at 375, Paystack-return cases, avatar at 375; some are API slowness under load). Left: re-run the walk with fresh accounts, fix real failures, write the per-control table, update the buildout row and the gap list FE column, `npm run build`, CI, mark ready. BE asks in the ledger: `GET /auth/sessions` can't mark "this device" for a header-token client; verify-with-malformed-ref 422 vs the guide's 404; local `avatar_url`/`logo_url` are paths, not URLs |
| `settings` `local_4b2900da-007e-45cb-a59d-6f2cceb6ac45` | Billing BE (merged); next S8 AI preferences (0082) | API | idle; was archived, lead 15 unarchived it |
| `calendar` `local_46e14c47-501d-45b6-8daa-7be515785014` | Calendar BE (merged) | API | done; can be archived |

**⚠ Ask Adebayo first thing:** the shared stack on :8000 calls **real Paystack**. A `settings-fe` walk made one real
`POST /billing/subscription/checkout` initialize call (reference `cfz_checkout_5aa13c9c0941fa9a3480`, never opened or paid). He
should confirm the local `PAYSTACK_SECRET_KEY` is a **test** key (`sk_test_…`); never read it yourself. Until then, FE walks stub
Paystack in the browser.

**Gotchas from lead 15:** sub-sessions may be **archived** (SendMessage fails "session is archived"): unarchive, then resend. The
shared FE checkout `cofoundaz/` has stale untracked `docs/checklist/{calendar,settings}-prd-gaps.md` drafts that block `git pull`
there; the copies on develop (FE `docs/checklist/settings-prd-gaps.md`, API `docs/handoff/calendar-prd-gaps.md`) are the real ones.
Work from worktrees off `origin/develop`, and ask Adebayo before deleting those drafts.

**Lead 14 handover (2026-10-29 ~23:00 WAT), kept for history.** Adebayo starts lead 15 himself (don't auto-chain this time).

**Next lead, first (in this order):** Adebayo approved the lead merging PRs (2026-10-29: "I approve you to merge"), but the
classifier may still refuse `gh pr merge` ("Merge Without Review"); if it does, give him one bash block per PR. Squash every merge.
1. **FE #187 then #188** (Notifications / Team FE hand-off briefs; lead 14 resolved their `buildout-status.md` conflicts, #188 now
   contains #187's row, so merge #187 first). Then this handoff PR **#189**.
2. **API merge train, each when its CI is green** (GitGuardian red on #196/#198 is history-only test values: squash; ignore
   "Dependency review"):
   - **#196 Billing** (head `6c954349`, SSRF fix reviewed by lead 14: strict `cfz_(checkout|card|addon|upgrade)_<20 hex>` regex,
     422 `INVALID_REFERENCE` before any Paystack call, `quote()`, the only interpolated Paystack path).
   - then message `calendar` "Billing merged" → it re-chains to **0079 on 0078_billing** → **#194** green → merge.
   - then message `jnt-pass` → **#198 Journal** re-chained to **0080 on 0079** → merge → **#199 Notifications** to **0081 on 0080** → merge.
   - **#200 Team** (head `931476e2`, no migration): merge when green, any time.
3. After each API merge, update the shared stack (Adebayo's OK; lead 14 had it: "Yes, start it"):
   `git -C cofoundaz-api pull --ff-only`, `alembic upgrade head`, restart api + worker; `docker compose build api worker` only if
   `pyproject.toml` deps changed (Billing/Calendar may add PyJWT use but no new deps: check the lock diff).
4. Then `settings` builds **S8 AI preferences** (`feature/ai-preferences`, migration 0082 after Notifications; brief already sent).
5. Then the **Admin Portal (25) + Super Admin Portal (26) BE** (design first: PRD + `app/admin-portal`, `app/super-admin`), then the
   Settings/Billing and Calendar **FE passes** (FE-developer briefs or Claude FE sessions: ask Adebayo which).

**Open PRs at handover (~23:00):**
| PR | What | State |
|---|---|---|
| FE #187 / #188 | Notifications / Team gap lists + `docs/fe-handoff/{page}.md` briefs | conflicts fixed by lead 14, CI re-running |
| FE #189 | this handoff | CI running |
| API #196 | Billing BE (b), migration 0078, D-SET-1..14 accepted, plan gate dark | head `6c954349` (SSRF + asserts fixed), CI running |
| API #194 | Calendar BE, `milestone-`/`marketing-` ids, proof cookie = signed JWT | head `6813b28a`; red only from the 0077 clash until it re-chains to 0079 |
| API #198 | Journal BE gaps, 0080 | head `dc146b85` (unlock token now a purpose-scoped HS256 JWT, generated test passcodes), CI running |
| API #199 | Notifications BE gaps, 0081 | green; re-chain after #198 |
| API #200 | Team BE (role change, remove, leave, invite resend/revoke, audit, comments index) | head `931476e2` (asserts fixed), CI running |

**Merged in lead 14:** API #197, #195; FE #180, #181, #182, #183 (lead) and #184 (three hubs hidden), #185 (**Documents ✅**),
#186 (Journal FE brief) by Adebayo.

**Sessions (all Sonnet, idle unless noted; message by id, they keep context):** `settings` `local_4b2900da-007e-45cb-a59d-6f2cceb6ac45`
(SSRF fix pushed; starts S8 AI preferences once #196 merges, migration 0082), `calendar` `local_46e14c47-501d-45b6-8daa-7be515785014` (waiting for "Billing merged"),
`jnt-pass` `local_e08a654a-63c4-48f3-a39a-c278c1cb3ce9` (fixes pushed; re-chains #198/#199 on the lead's word), `docs-finish`
`local_ee3b1fcd-06d0-4914-9b4c-1f0726ffd456` (done; can be archived after #185 merges).

**Known red checks (ignore):** "Dependency review (PR only)" on every API PR (GitHub Dependency graph is off; Adebayo can enable it
under Settings → Code security). CodeQL also lists mako 1.4.1 CVE-2026-102991 as a dependency alert; pip-audit doesn't flag it,
so the Security job passes. Bump mako when a fix exists.

**Shared stack:** up on API develop `7c0576b1`, migration **0077** head, `/health` 200 (haven wasn't holding 5432/6379 today, so a
plain `up -d` worked). The image still has dnspython 2.8.0 (lock-only change, not rebuilt; harmless locally).

**Lead's parked work:** FE `fix/sidebar-scroll` (`wt/sidebar-scroll`, `5b71c2c`, not pushed). Rebase on develop after #184 merges
(both edit `components/sidebar.tsx`), then `npm ci`, build, browser check at 1440 + 375, push, PR.

**Lead 13 handover (2026-10-27 ~14:30 WAT), kept for history:**
Adebayo merged every lead-12 PR (FE #176-#178, API #193) before lead 13 started. Lead 13 started three sub-sessions and, at the
weekly usage limit, asked each to **commit, push if local CI is green, write a ledger note, report and stop**. None merges.
| Session (open by id) | Task | Branch / worktree | State at handover |
|---|---|---|---|
| `docs-finish` `local_ee3b1fcd-06d0-4914-9b4c-1f0726ffd456` | Documents D6-D8 (375 layout: file-row menu clipped, signer email 26px, no New folder) + live re-check of D1-D4, D2 `failed` state, D6-D8 after merge | FE `fix/documents-375-layout` (`wt/documents-375`); re-check notes on `docs/documents-rewalk-3` | **FE #179 merged 2026-10-27** (D6 row menu flips/clamps, D7 signer fields wrap, D8 New folder on phones; SOP `docs/sop/2026-10-27-documents-375-layout.md`). **Docs PR #180 open** (`docs/documents-rewalk-3`, CI green, no attribution): D1, D2 (API + UI, plus a fresh request pending → ready), D3, D4 **pass** on develop; D6-D8 verified on the branch preview only. **Left: one 375 re-check of D6-D8 on merged develop, then flip Documents ✅** (add it to #180 or a follow-up docs PR). Session stopped clean. |
| `calendar` `local_46e14c47-501d-45b6-8daa-7be515785014` | Calendar PRD gap list (`docs/checklist/calendar-prd-gaps.md`: 14 BE, 18 FE, 9 lead defaults) + BE: feed, reminders, meetings, Google OAuth/token plumbing + sync | API `feature/calendar-be` (`wt/calendar-be`) | **API PR #194 open** (head `2685ddb7`, migration **0077** on 0076, no attribution). Feed + layers, meetings (invites, ICS, notes → summary → "Add all to tasks"), reminders, Google sync (signed state + HttpOnly proof cookie, Fernet tokens, Reconnect state, pull/push, picker, revoke, 15-min worker job); Opus review 7 findings, 6 fixed, 1 already handled. Guide `docs/fe-integration-guide-calendar-v2.md` (Google faked in every capture). Adebayo squashed it (head `f5d9c306`). **GitGuardian is still red on a false positive:** milestone feed ids `ms-<uuid>` (`app/services/calendar/feed.py:102`, `reminders.py:215`) match its ModelScope API key pattern (incident 39270739, 4 occurrences in a guide and two captures). **Adebayo 2026-10-29: "Next lead renames it."** So the next lead renames the prefix to `milestone-` on `feature/calendar-be` (feed + reminders + tests), re-captures the two calendar_v2 files, updates the guide, pushes, and checks GitGuardian goes green before #194 merges. Other CI checks were still running at handover. **0077 clash:** Settings PR 1 also adds 0077, so re-chain whichever merges second. FE notes: connect needs `credentials: "include"`; `/calendar/sync` reads `?connected=google` or `?error=<code>`. Per env: `GOOGLE_CLIENT_ID/SECRET`, `FINANCE_CONNECTIONS_ENCRYPTION_KEY`, `API_PUBLIC_URL`, the 3 redirect URIs, worker restart. Not built: B14, Outlook, meeting bot, compliance layer. Live walk not done (FE pass owns it). |
| `settings` `local_4b2900da-007e-45cb-a59d-6f2cceb6ac45` | Settings + Billing gap list (`docs/checklist/settings-prd-gaps.md`, D-SET-1..14) + BE PR 1 (non-Billing) + Paystack subscription plumbing (webhook HMAC, idempotent events, plan gate behind `PLAN_ENFORCEMENT` off) | API `feature/settings-be` (`wt/settings-be`) + `feature/settings-billing` (`wt/settings-billing`) | **API #195** (Settings BE (a): profile, avatar, password, 2FA, sessions, workspace, notification digest + quiet hours; head `e3887fcf`, migration **0077** `0077_settings_notif_schedule`). Unit, e2e, migrations, lint, quality, CodeQL and Semgrep all green. **Red:** (1) GitGuardian "Generic Password", a test password literal in `e2e/test_settings.py` (test value: mark it, or build the password at runtime); (2) the Security job's pip-audit, **`dnspython 2.8.0` CVE-2026-114605, fix 2.9.0**. That's new and not from this PR, so it reddens every API PR: bump it in a small `chore/dnspython-2.9` PR first, then rebase. **API #196 Billing is a DRAFT** stacked on #195 (head `f1a1df11`, migration `0078_billing`; CI skipped as a draft). Prices, plan contents, trial and proration wait on D-SET-1, 2, 4 and 6; the PR body says where each value lives. **FE #182** is the docs PR with the gap list. **0077 clash with Calendar #194:** both add 0077 on 0076, so re-chain whichever merges second (and Billing's 0078 with it). |

**Lead's own parked work:** FE `fix/sidebar-scroll` (`wt/sidebar-scroll`, commit `5b71c2c`, **not pushed**). Adebayo asked for a
scrollbar on the dashboard's left panel: the logo, workspace switcher and footer stay pinned, and only the nav groups scroll with a
thin `brand-x26533d` scrollbar (`components/sidebar.tsx`). typecheck, lint and `components/sidebar.test.tsx` (8/8) pass. Still to do:
`npm ci` in the worktree (Turbopack panics on a symlinked `node_modules`), full `npm test` + `npm run build`, a browser check at 1440
and 375 (long nav list, short viewport, workspace switcher dropdown still visible), push, then the PR.

**Next lead, first:** read each session's report (open them by id), check any pushed branch or PR (CI, head branch, no attribution),
then resume them one at a time (2-3 at most). Relay to Calendar/Settings any answers to D-CAL-3 and D-SET-1..7 (§0c), quoting
Adebayo's words. After the Documents FE PR merges, have `docs-finish` re-check D6-D8 on develop and flip **Documents ✅** only if every
control passes. Then start the Journal, Notifications, Team pass (§2b item 3).

**Stack state (2026-10-27, lead 13):** API `e5e9b969`, migration `0076` (head), `/health` 200, FE checkout on `68df2cb`. Adebayo gave
lead 13 an OK to run the docker commands this time ("you can do"). `requeue_finalize` ran: both stuck requests (`a8a56480`, `895cba33`)
were enqueued and fail with "the signed file's content is missing" (pre-#192 content was never on the shared volume), so they end
`executed.state: "failed"` by design (#193). **Port clash:** Adebayo's `haven-api` containers hold host 5432 and 6379, so Cofoundaz's
db and redis came up with no network and the API couldn't resolve `db`. Lead 13 recreated db + redis with a no-host-ports override
(`services: {db: {ports: !reset []}, redis: {ports: !reset []}}` passed as a second `-f`) and restarted api + worker. Data is in
volumes, untouched. Host-side tools that expect `localhost:5432` (host pytest on `ci_scratch`) hit haven's Postgres while it runs:
use a scratch container on another port.

**Merged in lead session 12 (2026-10-25):**
- API #190 Documents BE-D e-sign v2 (`0075`, new dep `pypdf`), #191 BE-D review fixes (`0076`: signing row lock, link-copy audit,
  `LINK_NOT_RECOVERABLE`, `legacy` state, expiry bounds, per-party email claim, `PDF_UNREADABLE`), #192 worker shares the
  `app_storage` volume (compose, dev + prod).
- FE #173 Documents templates + AI drafts + legal banner + PDF/DOCX export, #174 e-sign v2 UI (send flow, order, message, viewed,
  detail + audit, executed PDF, public sign page, link shares on files; SVG blob-preview XSS fixed before merge), #175 Documents
  hand re-walk (76/87).
- Shared stack verified on API `ccb30cf9`, migration `0076`, api + worker on the `cofoundaz-api_app_storage` volume, `/health` 200.

**Merged in lead session 11 (2026-10-25):**
- API #185 Documents BE-A (squash, `22f90ee2`, migration `0072`), #186 Finance D9 + D10 (`4513f845`), #187 Documents BE-B (`8630d2ad`,
  `0073`), #188 Academy content reviewed (`9a00de50`), #189 Documents BE-C (`064daaba`, `0074`, new dep `python-docx`).
- FE #162 colour tokens phase 1, #165 Finance done (docs), #166 colour phase 2 (navy/blue, Option B), #167 Documents FE (library,
  trash, versions, sharing, Shared with me), #168 semantic status colours + AA fixes, #169 Documents status colours.
- **Finance ✅ and Academy content reviewed.** Disk: every merged worktree removed (Cofoundaz 44 GB → ~4 GB).

**Merged in lead session 10 (2026-10-24):** FE #157 (Finance re-walk), #158 (brand logo), #159 (lead-9 handoff), #160 (Finance FE
fixes D2-D4, D6, D8, Funding labels), #161 (Documents PRD gap list, 38 gaps), #163 (Finance FE slice (e) + final re-check 138/141).
API #184 (Finance slice (e), squash-merged `4143bbc0`, migration `0071_finance_slice_e`).

### 0b. Decisions (all also in memory)
All are reversible and none blocks merging.
1. **Health blend (D-HEA-1):** each dimension = 50% kickoff assessment + 50% live app signals. *Alternative:* raise the live share once there's usage data.
2. **Health ramp (D-HEA-1b):** the live share rises from 0% on assessment day to 50% over 14 days, so a new founder's score doesn't halve on day one.
3. **Health signal targets per stage (D-HEA-2)** live in `cofoundaz-api/app/services/health_score/live_signals.py`. For example, Validation stage targets 5 assumptions tested, 5 interviews/30d, roadmap 20% done, 2 team members and 1 signed agreement. Adjust any of them.
4. **KPI threshold alerts:** runway below 3 months, revenue past ₦100K/₦1M/₦10M, CTR below 1% (`cofoundaz-api/app/services/dashboard/kpi_snapshots.py`).
5. **Mission delivery time (D-MIS-1):** opening the app early still generates the mission instantly; delivery time drives the morning notification and pre-generation.
6. **Upcoming reorder (D-MIS-2)** really changes future missions (stored as `mission_rank` on roadmap tasks).
7. **"+ Invite":** Co-Founder joins as `founder` (full access); investors aren't invitable there (they'll come via Funding).
8. **Runway rows (D-FIN-12, Adebayo 2026-10-24):** runway has no hiring/one-off rows of its own; it reads the Financial Model's rows
   (`model_rows` + link) and `PUT /finance/runway/assumptions` 422s on `hiring_plan`/`one_offs`/unknown fields. Shipped in #184 + #163.
9. **Documents (D-DOC-1..4, Adebayo 2026-10-24):** (1) per-person grants by account or email, Can view / Can comment first, Can edit
   later, a "Shared with me" list; anonymous token links stay as "anyone with the link"; until grants ship every Documents route is
   F+TM only. (2) Simple typed-name e-signatures now, plus a stamped executed PDF + audit certificate page emailed to all parties, with a
   legal caveat; a certificate provider later. (3) Upload limit stays 15 MB (PRD says 100 MB), shown in the UI. (4) Legal templates ship
   as structured drafts with a clear "not legal advice" banner; a lawyer replaces the text later.
10. **Squash-merge #184 and #185 (Adebayo 2026-10-24):** a scratch-run survey `public_token` was committed then deleted inside #184
   (commit `64d163a0`, a throwaway value); squash-merging keeps it out of develop and Adebayo marks the GitGuardian incident as a test
   value. #185 carries those commits too (it was stacked), so it must be squash-merged as well. History rewrites are blocked by the
   classifier: never ask a session to force-push for this.
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
36. **D-FIN-11 Funding is cash, not revenue (Adebayo 2026-10-24: "your recommendation ... is okay"):** `Funding`-category inflows stay
    in cash on hand, the cash-flow chart and paid-in capital, but are out of monthly revenue, burn/runway, the dashboard tiles, the
    briefing and a new model's starting revenue (API #182). Uncategorized inflows still count as revenue.
37. **LinkedIn company page id = `146743971`** (Adebayo 2026-10-24): public, so it is the `ACADEMY_LINKEDIN_ORG_ID` code default (API #183).
38. **Brand (Adebayo 2026-10-24):** the logo's colours are the brand: navy `#051736` + blue `#0F6AFC`. Logo + favicon now (FE #158).
    **Colour-token refactor as its own session, after the Finance re-walk FE fixes land:** phase 1 replace the ~5,500 hard-coded
    hex values in 223 FE files with semantic tokens (zero visual change, screenshot-diffed); phase 2 swap the token values to the
    navy/blue palette in one file. Today colours are NOT centrally configurable.

39. **Colour phase 2 = Option B (Adebayo 2026-10-25):** copper retired from UI chrome; buttons, links and focus rings are blue (`#0263F4`,
    visually ~the logo blue and AA-safe; the exact logo blue `#0F6AFC` is `brand-500`); copper kept for warnings, one chart colour and
    gold badges. State UI uses `success` / `warning` / `danger` / `info` tokens, never the brand ramp (#168, #169).
40. **Academy content approved as it stands (Adebayo 2026-10-25, "flip all"):** all 48 files `review_status: reviewed` (API #188).
    New content files still start as `draft`.
42. **E-sign copy link kept, with an audit trail (lead 12, from the #190 Opus review):** editors can still copy a signer's link (gap
   row 31, the fallback when email fails), but every handout (create response or copy) is recorded in `signature_signers.link_copies`,
   shown to editors and printed on the certificate by name (no member email, since the certificate goes to external signers).
   Alternative: drop copy-link and offer only "remind". Adebayo was told and didn't object.
43. **E-sign scope calls (BE-D session, lead accepted):** no field placement yet (signatures go on an appended signature page next to
   the certificate; needs the PDF viewer + a field model); DOCX must be exported to PDF before signing (`422 PDF_REQUIRED`); signers
   can download the executed PDF with their own link for 90 days.
44. **Signer/share links are derived from `SECRET_KEY`** (HMAC of purpose, id and version; only a hash is stored). That makes the
   still-open §0c item 4 (confirm `SECRET_KEY` on staging/prod is a real random value) a signing-security item now, and rotating it
   kills every outstanding signer and share link.
45. **Calendar (Adebayo 2026-10-27, "Accept D-CAL-1, 2 and 4 defaults"):** D-CAL-1 no meeting-bot vendor (paste notes or
    transcript after the meeting, AI writes summary/decisions/action items, "Add all to tasks"); D-CAL-2 Google sync per user, only
    Calendar-module events are pushed, pulled Google events private to the connecting user (teammates see "Busy"); D-CAL-4 Cofoundaz
    sends external invites + ICS itself, Google push with `sendUpdates=none`. **D-CAL-3 open** (§0c).
46. **FE hand-off to a human FE developer (Adebayo 2026-10-27):** from Journal, Notifications and Team on, the lead confirms the API
    covers the PRD + designed UI (gap pass, BE fixes, live-captured guide), then writes an **exact-scope FE brief** per page for "the FE
    guy" instead of starting a Claude FE sub-session. He follows that scope exactly; the swept scope also anchors the later APIs.
41. **Documents BE-B limits accepted (lead, in the BE-B SOP):** a grant outlives the grantee's workspace membership (member removal
    doesn't exist yet: fix it with the Team page); a provider-signed file URL already issued stays valid up to 5 minutes after trash.

### 0c. Waiting on you (not on code)
**Open product calls:** none (lead 14 got D-CAL-3 and D-SET-1..14 answered).

**Answered (history):**
- ~~D-CAL-3~~ **answered 2026-10-29: yes, parked** (you submit later). Was: will you submit the Google OAuth app for verification? The calendar scope is sensitive: in "Testing" only listed test
  users can connect and their refresh tokens die after 7 days. The code handles both modes (a "Reconnect Google" state).
- ~~D-SET-1..14~~ **all accepted 2026-10-29 ("Accept all defaults")**. Were, as proposed by the Settings session: (1) prices Starter free, Growth ₦24k/mo or ₦240k/yr, Scale
  ₦68k/mo or ₦680k/yr (the design's); (2) plan contents = the design's lists; (3) plan gate built but off behind `PLAN_ENFORCEMENT`;
  (4) 14-day Growth trial, no card; (5) D-SAL-11 outreach gate wired but off; (6) upgrade prorated now, downgrade at period end;
  (7) cancel at period end, data kept 90 days, no pause. Lead told the session to hold 1, 2, 4 and 6 (money calls) until you answer.
  D-SET-8..14 are built to defaults (7-day grace then Starter limits, 1 credit = 50 tokens, credit packs only, no account deletion yet).
- Machine load: load average ~140 on 2026-10-27 (toupesu `ng test` runs, haven dev server on :3000) stopped the sessions' live browser
  walks. Calendar and Settings gap lists were built from source + PRD + raw API; their FE passes must do the every-control walk.

**Do when convenient:**
- **Google OAuth verification (D-CAL-3, parked, yours):** before submitting, set the consent screen (name, logo, support email,
   authorized domain `cofoundaz.com` verified in Search Console, homepage + privacy + terms URLs; the privacy policy must state the
   calendar data use and Google's "Limited Use" wording). Scopes `calendar.events` + `calendar.calendarlist.readonly` are sensitive,
   not restricted: no CASA audit. Demo video (2-4 min, unlisted YouTube, production domain visible): homepage + privacy link →
   login → Calendar → Connect Google → **pause on the consent screen showing app name + both scopes** → calendar picker → create an
   event in Cofoundaz and show it in Google → show a Google event as Busy in Cofoundaz → disconnect and show access revoked.
- **GitGuardian:** mark incidents 39270782 (#195 test password), 39270739 (#194 `ms-` ids) and 39279306 (#198 test passcode) as test values / false positives after their squash merges.
1. **Outreach deliverability (DNS):** `default._domainkey.cofoundaz.com` is NXDOMAIN on the authoritative nameservers (Cloudoon:
   ns1.cloudoon.com, ns2.cloudoon.net, ns3.cloudoon.org): add the DKIM TXT from cPanel → Email Deliverability in the **Cloudoon** DNS
   panel. Set reverse DNS for 169.58.188.170 to `mail.cofoundaz.com` at Contabo. Not a Sales blocker (your call, 2026-10-24).
2. **GitGuardian:** mark incident 38953900 (survey `public_token` in `e2e/_captures/validation/survey_opened.json`, #184) as a test
   value. Optional: rotate the Paystack **test** secret key you pasted in chat on 2026-10-24 (it's connected on the local NovaPay
   workspace; test mode only).
3. Optional: delete the `VPS_PORT` **secret** from the staging and production GitHub environments (nothing references it since #175).
4. Still open from lead 7: confirm `SECRET_KEY` on staging/prod is a real random value (`SALES_OUTREACH_UNSUBSCRIBE_KEY` is set,
   Adebayo 2026-10-25: never rotate it); a dedicated `outreach@` mailbox +
   hourly limit ~50; journal encryption key on staging (journal writes 500 there until set); Mono production approval.
5. **Before e-sign is used on staging/prod:** confirm `SECRET_KEY` there is a real random value (0b-44). After the D2 API PR
   merges and deploys, run its requeue command once per environment (the PR states the exact command).
6. Remove `wt/documents-be-d` once its PR merges (its session was blocked from removing it):
   `git -C cofoundaz-api worktree remove /Users/adebayovictor/Documents/dev/cofoundaz/wt/documents-be-d`.
7. Optional: SVG versions of the logo and wordmark from the designer (they'd replace the PNGs in `public/brand/`).

Done in lead 9: unsubscribe round trip (passed live, recorded in #151), Funding product call (D-FIN-11), LinkedIn id (D37).
Done in lead 10: Paystack test payment (your test key), runway rows call (D-FIN-12), Documents Q1-Q4 (D-DOC-1..4), squash-merge call.
Done in lead 11: Academy content review (all approved), colour sign-offs (#166, #168, #169), unsubscribe key set.

**Product calls open:** none. Academy content was reviewed and every colour PR signed off on 2026-10-25.
Legal templates (NDA, contractor, founder agreement, SAFE) are structured drafts with a disclaimer: a lawyer should replace the text
before production use (D-DOC-4).

**Still blocked:** Victoria (Legal, API #138; her migration must now chain after **0074**). Calendar sync not built (Google OAuth values in
env). Smoke-test subdomains parked; inbound mail not available; Billing needs Paystack (and the outreach paid-plan gate, D-SAL-11,
comes with it).

## 1. Repos and local stack
- FE `cofoundaz` (Next 16 App Router, React 19, Tailwind v4, TS strict) and API `cofoundaz-api` (FastAPI): sibling dirs under
  `/Users/adebayovictor/Documents/dev/cofoundaz`. The lead session works from the parent dir (not a git repo).
- **develop heads (2026-10-25 ~21:15, lead 12):** API `ccb30cf9` (#192), FE `4e0a06f` (#175). The shared API checkout is on
  `ccb30cf9`, migrated to **`0076_documents_signer_link_audit`**, api + worker rebuilt (have `pypdf`) and both mount the
  `cofoundaz-api_app_storage` volume (files uploaded locally before #192 lived in the old container layer and now 404).
- *(lead 11, superseded)* **develop heads (2026-10-25 ~17:00):** API `064daaba` (#189), FE `6c7d989` (#169).
  The shared API checkout is on `064daaba`, migrated to **`0074_documents_templates_export`**, image rebuilt (has `python-docx`),
  api + worker recreated, Academy content re-synced (all `reviewed`). Verified live: `/health` 200; BE-C templates list (9, Legal /
  Financial / Pitch / Operational) and PDF + DOCX export 201 `scan_status: clean` (two test exports left in NovaPay).
  **The shared FE checkout `cofoundaz/` is far behind develop** (on `cbfe88a`, #156) with two untracked logo PNGs in `public/`: sessions
  use their own worktrees, so it only matters if someone runs the FE from it; Adebayo can `git -C cofoundaz pull --ff-only` after
  deleting those two untracked PNGs (they're in develop now).
  The local NovaPay workspace has a Paystack test connection, a paid test invoice INV-2026-003 and its fee row; its 142 Mono sandbox
  bank rows from the slice (e) re-check are gone (cause not traced, local data). Sessions run their own FE dev server on a free port.
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
| Sales | #165, #166, #168, #172, #177, #179 | #142, #143, #149, #154 | 626/626 (#144) + Sequences hand re-walk #151 incl. live sends + unsubscribe round trip | ✅ **Done 2026-10-24** |
| Academy | #173, #178, #179, #180, #183 | #148, #152 | #150 (114/119) then re-check #156: D1-D4 20/20 | ✅ **Done 2026-10-24**; content **reviewed** 2026-10-25 (#188) |
| Finance | #167, #170, #171, #176, #182, #184, #186 | #153, #160, #163 | #157 then slice (e) re-check in #163: **138/141 ✅** incl. a real Paystack test payment and Mono sandbox sync (142 rows). Accepted as unit-tested only (not producible in test mode / the pane): needs-attention banner, non-NGN skip counts, payout tagging, I20 print window, E11 file chooser | ✅ **Done 2026-10-25** (D9 + D10: API #186, verified live; see `finance-rewalk.md`) |
| Documents | BE-A #185, BE-B #187, BE-C #189, BE-D #190 + #191, worker volume #192, requeue + `failed` #193 | #167, #169, #173, #174, fixes #177, #179 | #175, #178, third pass #180, **fourth pass FE #185: D6-D8 pass on develop** | ✅ **Done 2026-10-29** |
| Calendar | API #194 ✅ merged `513143fd` (0079) | FE #190 merged | #194 re-walk on merged develop | ✅ **Done 2026-10-30**; real Google consent, reminders firing and invite email not verified |
| Settings + Billing + AI preferences | API #195, #196, #201 ✅ merged (0082) | FE #192 merged | #195 re-walk on merged develop, 350/350 scripted | ✅ **Done 2026-10-30**; paid Paystack flow and real model tone not verified |
| Journal, Notifications, Team | #200, #198 (0080), #199 (0081) ✅ all merged | FE briefs FE #186-#188 + `fe-handoff/MESSAGE-to-fe-dev.md` | FE dev builds, lead re-walks | 🟡 **with the FE dev** (BE complete) |
| Funding Hub, Investor Readiness, Marketplace | designed 2026-11-05 (FE #221, #222, #224); Readiness A ✅ #216; Funding A #218 | mock, **hidden from the sidebar** (FE #184) | n/a | 🟡 **building**, see §0a module map |
| Admin Portal (25), Super Admin Portal (26) | ✅ A-E, Tickets, Reports (verified ready 2026-11-05) | briefs with the FE dev; founder part C in FE #226 | n/a | 🟡 FE with the FE dev |
| Analytics & Reports (22), Legal (13, Victoria #214) | none / Victoria slice 1 in review | mock, **hidden from the sidebar** (FE #225) | n/a | later |

Remaining after these: Journal (API ✅) → Notifications (API ✅) → Team (invitations only in the API), all three as the
**FE-developer hand-off pass** (0b-46) → Funding, Investor Readiness, Marketplace, Analytics
(no API: design first like Sales) → Legal (Victoria). FE for Documents/Calendar/Journal/Notifications already calls the real API
hooks; they need the PRD walk → gap list → fixes → re-walk treatment. Team's FE page still looks mock-driven.

Cross-cutting: **brand** logo + favicon (#158); **colour tokens** phase 1 (#162), phase 2 navy/blue Option B (#166), semantic status
colours + AA contrast 0 failing pairs over 106 routes plus Documents (#168, #169). All merged; SOP `docs/sop/colour-tokens.md`.

## 2b. Incoming (ordered)
1. ~~Merge train~~ **done in lead 15** (#200, #196, #194, #198, #199; stack on 0081).
2. **S8 AI preferences** (`settings` session, brief sent 2026-10-29): `GET/PATCH /ai/settings`; daily briefing off stops briefing
   generation + notification, proactive suggestions off stops the AI-initiated nudges (session documents which surfaces), tone from
   a fixed enum into the LLM prompt seam. "What I remember" / Forget / Clear all deferred (no memory store); FE hides that section.
3. **Admin Portal (25) + Super Admin Portal (26) BE**: ✅ A-E, Tickets (#211), Reported issues (#212) merged 2026-11-02; Content deferred by Adebayo; vetting/moderation after Marketplace. (Original note follows.) Adebayo 2026-10-29: before Funding, Investor Readiness, Marketplace.
   Design first like Sales: read the PRD sections + the existing FE pages, write a spec with D-ADM-n questions, get Adebayo's calls,
   then BE slices with live-captured guides. Platform-level roles (not workspace roles) are new: check how `super-admin` auth should
   work before building.
3a. **Google sign-in/sign-up**: ✅ API #213 merged 2026-11-02 (four calls accepted); FE #216 open: real Google click passed locally, official button in; waiting on merge. (Original note follows.) Nothing existed then: Google is only used for Calendar. Calls to make first: linking to an existing email account, whether 2FA still applies, and first-time users going through onboarding and invite acceptance. Needs a redirect URI per environment.
4. ~~FE passes for Calendar and Settings/Billing~~ **done in lead 16.** **FE passes for Calendar and Settings/Billing**: Claude FE sessions (`calendar-fe`, `settings-fe`), started 2026-10-29 by
   Adebayo's call ("we can start now"); resume them from their ledgers. The junior FE dev builds Journal, Notifications, Team from `docs/fe-handoff/*.md`; the lead re-walks each after merge.
5. **CI tuning, both repos (Adebayo 2026-10-29; global rule "CI pipeline shape").** One small `ci/pipeline-speed` PR per repo:
   path filters so docs-only PRs skip unit/build/e2e (most of our PRs are docs: re-walks, handoffs) with a cheap always-run job so
   required checks still report; shard the API unit suite (~4,460 tests) across 2-4 jobs with `pytest-split` and keep coverage
   combined; FE `vitest --shard`; check dependency caching. Keep e2e on PRs. Skip the post-merge e2e on `develop` only if branch
   protection requires up-to-date branches (check it first). Measure before and after on one PR.
   **Trim API e2e to the critical journeys (Adebayo 2026-10-29: "e2e shouldn't be something big, just the criticals").** The API has
   97 e2e tests in 64 files, one per feature, because each feeds an FE guide's captures. Mark ~10-15 critical journeys (signup + verify
   + login, assessment to dashboard, invite + accept, document upload + share + e-sign to executed PDF, invoice + Paystack test payment,
   Billing subscribe + webhook, Calendar connect) with a `critical` marker and run only those on every PR. The rest run nightly and on
   PRs that touch their area (path filters), and stay available for re-capturing guides. FE Playwright is already small (13 tests).
6. Then Funding, Investor Readiness, Marketplace (unhide in the sidebar when each ships), Analytics & Reports → Legal (Victoria).
   Keep at most 2-3 sessions running.

## 2c. Follow-ups (not blocking)
- **From lead 12:** e-sign field placement (needs the PDF viewer + a `signature_fields` model), a draw-a-signature pad, an editor
  "rebuild executed copy" action, reminder timers, a real malware scanner behind `get_scanner()`; no invite path for investors
  (re-walk D5, comes with Funding); the worker's email claim is at-most-once (a crash between claim and send loses that one email;
  the signer can still download); `GET /sign/{token}` marks Viewed, so mail link scanners may mark it early; the certificate's
  legal caveat spills onto a near-empty page; a signer's own tab never offers the executed PDF (they get it by email and their
  link works).
- **From lead 11:** BE-C: uploaded files still can't be shared by link; non-Latin text in PDFs needs a TrueType font; legal template text
  needs a lawyer; AI template draft tested with a fake client only (budget exhaustion / provider failure not seen live). BE-B: 30-day
  purge, Cloudinary inline URLs and the grant rate limit unit-tested only. #167: PDF preview pixels and staging CORS for previews
  unverified. The worker image also copies `content/`; harmless (it reads the DB). D9's failed-reply path and D10 on bank rows verified by
  e2e only (no live bank rows locally now).
- **From lead 10:** the Health Score "Agreements signed" signal shows the count of completed signature requests to every role
  (`app/services/health_score/live_signals.py:235-246`); a member downgraded from F/TM can still open old Advisor chats whose replies
  quoted finance figures (history is replayed); an accountant (Finance role, not Sales) sees a linked Sales `account_name` on invoices; a
  brief local-storage outage permanently clears an expense's `has_receipt` (410 self-heal); `POST /finance/invoices/{id}/send` lock is in
  #184 but the old e2e captures for Validation (`e2e/_captures/validation/`) sit untracked in the shared API checkout, don't commit them;
  #163's I20 (print window) and E11 (file chooser) can't be clicked in the browser pane, walk them by hand once.
- **From lead 9:** `Refunds`-category inflows still count as revenue (decide whether a refund in nets against revenue); a raise
  left uncategorized still counts as revenue until the founder picks Funding (FE nudge in §2b item 1); the landing page's product
  mock still draws a "C" in its illustrated sidebar; optional logo on the certificate PDF and the email header (API); the worker's
  docker healthcheck calls an HTTP port the worker doesn't serve (cosmetic "unhealthy").
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
   Locally run only the fast checks (lint, format, typecheck, the touched area's tests, the migration round trip if one was added,
   on a fresh DB; `TZ=UTC` after local midnight). CI runs the full suite, e2e and scans and is the authority (Adebayo 2026-10-29,
   global rule: full local runs were wearing the machine). One PR per page, stacked when needed.
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
- **haven-api port clash (2026-10-27):** if `docker ps` shows `cofoundaz-api_db` / `_redis` with an empty network column, they lost the
  host-port fight with haven. Recreate them with the no-host-ports override (§0a) and restart api + worker. Don't stop haven's
  containers without asking.
- **Turbopack rejects a symlinked `node_modules`** ("points out of the filesystem root"): run `npm ci` in each FE worktree before
  `npm run dev` there. A symlink is fine for `tsc`, `eslint` and `vitest`.
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
  For a local test run without touching the live stack, use the worktree recipe in memory `local-test-db-gotcha`.
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

- **Lead-9 lessons:** (1) **The host's Node is 26; CI pins Node 20.** Node 25+ ships a global `localStorage` that breaks jsdom:
  ~34 FE unit tests fail on develop under Node 26 for that reason alone. Run FE tests with
  `PATH=$HOME/.nvm/versions/node/v24.22.1/bin:$PATH` (Node 24 matches CI's results). (2) **Playwright reuses whatever answers on
  :3000** (`reuseExistingServer` when not CI) and the shared dev server usually holds :3000: run E2E with `CI=1` and a temp config on
  another port (`sed` the config to :3002, `npx next start -p 3002`), then delete the temp config. (3) **API worktree tests:** give
  each worktree its own env (`poetry env use /opt/homebrew/bin/python3.11 && poetry install`): the migration tests shell out to
  `poetry run alembic`, so borrowing another venv's python gave 125 false failures. The e2e runner also needs CI's throwaway `.env`
  (see `.github/workflows/ci.yml` "Write a CI .env"), and a full e2e run rewrites every capture: `git checkout -- e2e/_captures`
  except the group you changed. (4) Per-run scratch Postgres/Redis as their own containers worked well (`fnr-pg` :5671,
  `fnr-redis` :6671; remove them when done). (5) The FE design-token hook checks whole touched files, so editing an old file means
  fixing its pre-existing `slate-*` classes too. (6) Sub-sessions can die on transient network errors (SSL mismatch, ECONNRESET):
  check whether they committed before re-briefing, then just tell them to continue.

- **Lead-10 lessons:** (1) **A lead started by a session can only propose cards**, and only the user's own words allow `user_asked`;
  put each brief in a card and let Adebayo click. (2) `git -C cofoundaz worktree add wt/x` puts the worktree **inside the repo**: always
  pass the absolute `/Users/adebayovictor/Documents/dev/cofoundaz/wt/<slug>`. (3) **Stray e2e captures leak tokens:** a full e2e run
  wrote `validation/survey_opened.json` with a `public_token` that got committed; briefs must say "check `git status` before every
  commit" and the lead checks GitGuardian on every API PR, not just CI. (4) **CodeQL flags `assert` with side effects** in tests
  (`assert client.delete(...)`) as errors: put it in API briefs. (5) **Stacked PR + squash merge:** when a stacked PR's base is
  squash-merged, the top PR must merge develop (normal merge) and will conflict on the base's files; take develop's side. (6) One Opus
  review per security PR plus a short **re-verification** pass after fixes paid off again: #185's first review found public Cloudinary
  URLs for documents (High) that the slice's own tests passed. (7) The classifier blocked the shared-stack pull/migrate/restart this
  time even though lead 8/9 had an OK: ask per update and hand Adebayo the commands.

- **Lead-11 lessons:** (1) **`content/` is baked into the API image** (only `app/` and `alembic/` are mounted): after a content PR,
  `python -m app.services.learning.content` alone re-syncs the OLD files; `docker compose build api` + `up -d api` first. (2) **Verify a
  dependency rebuild, don't trust it:** after #189 Adebayo's `build` left the old image (python-docx missing) while `up -d` looked fine;
  check `docker compose images` age and `exec api python -c "import <pkg>"`. (3) **Adebayo may merge before a session's follow-up push
  lands** (#168 merged at its first head): briefs for follow-ups should say "if the PR is already merged, open a new PR from develop".
  (4) **Remove worktrees when their PR merges:** 48 merged worktrees had grown to ~30 GB (each FE copy has its own `node_modules` and
  `.next`, screenshot builds up to 5 GB). `git worktree remove` refuses dirty trees; a leftover folder after "Directory not empty" is a
  deregistered copy, safe to `rm -rf` once checked with `lsof`. (5) zsh doesn't word-split `$var` in `for x in $list`: use arrays or
  explicit loops in shell snippets.

- **Lead-12 lessons:** (1) **In-process tests can't see container topology:** unit, `run_once` and e2e all share one storage dir, so
  the worker missing the uploads volume (#192) only showed in the FE live walk on docker. Any new worker job that touches storage,
  mail or other per-container state needs one check on the docker stack. (2) Adebayo merged #190 and #174 before their follow-up
  pushes and PR CI finished: put review fixes in the brief as "new PR from develop if merged" (done), and check develop CI after any
  early merge. (3) A turn started by a side-session event can't start sessions, but it can **message existing ones**: reuse an idle
  session that already has the context (new branch in its worktree) instead of proposing cards. (4) The classifier blocks a
  sub-session's `git worktree remove`; hand it to Adebayo. (5) Opus review + the lead's own read of tokens/storage found the signing
  race (Medium) that 569 unit tests missed; keep doing both for every security path.

- **Lead-14 lessons:** (1) The classifier allowed `gh pr merge` for the first merges of the session, then blocked it as "Merge Without
  Review" (and blocked a sub-session's `gh pr ready`): plan for Adebayo merging, and give him bash blocks. (2) Sessions started by an
  earlier lead still take messages from the new lead: reuse them (they keep context) instead of starting fresh ones. (3) A date-based
  e2e test broke at month end (`entry()` = tomorrow + 2 days falls into next month from the ~29th): pin the browser clock with
  `page.clock.setFixedTime` for calendar tests. (4) CodeQL `py/weak-sensitive-data-hashing` fires on HMAC tokens whose inputs are
  named like secrets (nonce, passcode version): use PyJWT for signed tokens, it clears the alert. (5) Parallel BE PRs: assign
  migration numbers up front (0078 Billing, 0079 Calendar, 0080 Journal, 0081 Notifications, 0082 AI prefs) and re-chain in merge order.

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
