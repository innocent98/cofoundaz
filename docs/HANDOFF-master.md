# HANDOFF — Cofoundaz app-wide build-out (master)

> **First message for a new lead session (start it yourself, from `/Users/adebayovictor/Documents/dev/cofoundaz`):**
> *"Read `cofoundaz/docs/HANDOFF-master.md` and continue as the lead. Start with §0a. No half-built pages; ask me only for
> genuine product calls."*
>
> If the lead-13 handoff PR hasn't merged yet, read this file from its branch:
> `git -C cofoundaz fetch -q origin && git -C cofoundaz show origin/docs/lead13-handoff:docs/HANDOFF-master.md`

Last updated: **2026-10-27 ~14:30 WAT (lead session 13 handover, weekly usage limit)**. Lead 13 was session `local_016c7571-74ef-4f0d-8038-42fbaae26d62`; lead 12 was session `local_834938e8-7994-46f3-b253-9f454e329879`; lead 11 was session `local_fafcc475-7de3-4c37-ba3f-fe728ace6b39`; lead 10 was `local_07d6ffed-3092-46d5-afa6-5e42c3f68d6d`. This file is a map; the detail lives in the gap lists
(`docs/checklist/*-prd-gaps.md`, `*-rewalk.md`), SOPs (`docs/sop/` in both repos), FE guides
(`cofoundaz-api/docs/fe-integration-guide-*.md`), design specs (`docs/superpowers/specs/`), the master checklists
(`cofoundaz-api/docs/checklist/PROJECT_CHECKLIST.md`, `docs/checklist/buildout-status.md`), and memory.

---

## 0. FOR ADEBAYO

### 0a. Open PRs and in-flight sessions (lead 13 handover, 2026-10-27 ~14:30 WAT)
Adebayo merged every lead-12 PR (FE #176-#178, API #193) before lead 13 started. Lead 13 started three sub-sessions and, at the
weekly usage limit, asked each to **commit, push if local CI is green, write a ledger note, report and stop**. None merges.
| Session (open by id) | Task | Branch / worktree | State at handover |
|---|---|---|---|
| `docs-finish` `local_ee3b1fcd-06d0-4914-9b4c-1f0726ffd456` | Documents D6-D8 (375 layout: file-row menu clipped, signer email 26px, no New folder) + live re-check of D1-D4, D2 `failed` state, D6-D8 after merge | FE `fix/documents-375-layout` (`wt/documents-375`); re-check notes on `docs/documents-rewalk-3` | **FE #179 merged 2026-10-27** (D6 row menu flips/clamps, D7 signer fields wrap, D8 New folder on phones; SOP `docs/sop/2026-10-27-documents-375-layout.md`). **Docs PR #180 open** (`docs/documents-rewalk-3`, CI green, no attribution): D1, D2 (API + UI, plus a fresh request pending → ready), D3, D4 **pass** on develop; D6-D8 verified on the branch preview only. **Left: one 375 re-check of D6-D8 on merged develop, then flip Documents ✅** (add it to #180 or a follow-up docs PR). Session stopped clean. |
| `calendar` `local_46e14c47-501d-45b6-8daa-7be515785014` | Calendar PRD gap list (`docs/checklist/calendar-prd-gaps.md`: 14 BE, 18 FE, 9 lead defaults) + BE: feed, reminders, meetings, Google OAuth/token plumbing + sync | API `feature/calendar-be` (`wt/calendar-be`) | **API PR #194 open** (head `2685ddb7`, migration **0077** on 0076, no attribution). Feed + layers, meetings (invites, ICS, notes → summary → "Add all to tasks"), reminders, Google sync (signed state + HttpOnly proof cookie, Fernet tokens, Reconnect state, pull/push, picker, revoke, 15-min worker job); Opus review 7 findings, 6 fixed, 1 already handled. Guide `docs/fe-integration-guide-calendar-v2.md` (Google faked in every capture). Adebayo squashed it (head `f5d9c306`). **GitGuardian is still red on a false positive:** milestone feed ids `ms-<uuid>` (`app/services/calendar/feed.py:102`, `reminders.py:215`) match its ModelScope API key pattern (incident 39270739, 4 occurrences in a guide and two captures). Either mark it as a false positive in GitGuardian, or (better, it recurs on every capture) rename the prefix to `milestone-` before the FE builds on it, re-capture, and update the guide. Other CI checks were still running at handover. **0077 clash:** Settings PR 1 also adds 0077, so re-chain whichever merges second. FE notes: connect needs `credentials: "include"`; `/calendar/sync` reads `?connected=google` or `?error=<code>`. Per env: `GOOGLE_CLIENT_ID/SECRET`, `FINANCE_CONNECTIONS_ENCRYPTION_KEY`, `API_PUBLIC_URL`, the 3 redirect URIs, worker restart. Not built: B14, Outlook, meeting bot, compliance layer. Live walk not done (FE pass owns it). |
| `settings` `local_4b2900da-007e-45cb-a59d-6f2cceb6ac45` | Settings + Billing gap list (`docs/checklist/settings-prd-gaps.md`, D-SET-1..14) + BE PR 1 (non-Billing) + Paystack subscription plumbing (webhook HMAC, idempotent events, plan gate behind `PLAN_ENFORCEMENT` off) | API `feature/settings-be` (`wt/settings-be`) | Still parking at handover (asked to commit, push if local CI green, write a ledger note in its gap list, report, stop). **Read its final report by id first**; nothing was pushed when lead 13 last checked. |

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
**Open product calls (lead 13):**
- **D-CAL-3:** will you submit the Google OAuth app for verification? The calendar scope is sensitive: in "Testing" only listed test
  users can connect and their refresh tokens die after 7 days. The code handles both modes (a "Reconnect Google" state).
- **D-SET-1..7 (Billing), defaults proposed by the Settings session:** (1) prices Starter free, Growth ₦24k/mo or ₦240k/yr, Scale
  ₦68k/mo or ₦680k/yr (the design's); (2) plan contents = the design's lists; (3) plan gate built but off behind `PLAN_ENFORCEMENT`;
  (4) 14-day Growth trial, no card; (5) D-SAL-11 outreach gate wired but off; (6) upgrade prorated now, downgrade at period end;
  (7) cancel at period end, data kept 90 days, no pause. Lead told the session to hold 1, 2, 4 and 6 (money calls) until you answer.
  D-SET-8..14 are built to defaults (7-day grace then Starter limits, 1 credit = 50 tokens, credit packs only, no account deletion yet).
- Machine load: load average ~140 on 2026-10-27 (toupesu `ng test` runs, haven dev server on :3000) stopped the sessions' live browser
  walks. Calendar and Settings gap lists were built from source + PRD + raw API; their FE passes must do the every-control walk.

**Do when convenient:**
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
| Documents | BE-A #185, BE-B #187, BE-C #189, BE-D #190 + #191, worker volume #192, requeue + `failed` #193 | #167, #169, #173, #174, fixes #177 | #175 (76/87) then second pass #178 (**93/103**, D6-D8 found at 375) | 🟡 D6-D8 FE fix + live re-check in flight (§0a) → ✅ |
| Calendar | events + milestones only; feed, meetings, reminders, Google sync being built (`feature/calendar-be`) | 100% static mock (`hooks/useCalendarApi.ts`, "July 2026", Save = `console.log`) | not walked live (load) | 🟡 gap list done, BE in progress |
| Settings | `/account` read-only; no `/billing/*` | Billing tab 100% mock | not walked live (load) | 🟡 gap list done, BE PR 1 in progress; Billing waits on D-SET-1..7 |

Remaining after these: Journal (API ✅) → Notifications (API ✅) → Team (invitations only in the API), all three as the
**FE-developer hand-off pass** (0b-46) → Funding, Investor Readiness, Marketplace, Analytics
(no API: design first like Sales) → Legal (Victoria). FE for Documents/Calendar/Journal/Notifications already calls the real API
hooks; they need the PRD walk → gap list → fixes → re-walk treatment. Team's FE page still looks mock-driven.

Cross-cutting: **brand** logo + favicon (#158); **colour tokens** phase 1 (#162), phase 2 navy/blue Option B (#166), semantic status
colours + AA contrast 0 failing pairs over 106 routes plus Documents (#168, #169). All merged; SOP `docs/sop/colour-tokens.md`.

## 2b. Incoming (ordered)
1. **Collect the parked sessions (§0a)** and check what each pushed. Adebayo merges docs PR #180 after review. Finish the lead's sidebar PR (§0a, small).
2. **Finish Documents:** #179 is merged → re-check D6-D8 on develop at 375 (resume `docs-finish`, it has the context) → **Documents ✅** in `buildout-status.md`. Staging-only checks once deployed: preview CORS from the staging origin, the
   Cloudinary `read_private` path, and `requeue_finalize` once per environment (§0c item 5).
3. **Journal, Notifications, Team: the FE-developer hand-off pass (0b-46).** Per page: walk live (1440 + 375, every control, every
   role) against the PRD section and the designed UI, compare with the raw API, write `docs/checklist/{page}-prd-gaps.md`, build every
   BE gap (tests, e2e captures, live-captured `cofoundaz-api/docs/fe-integration-guide-{page}.md`, SOP, checklist), then write
   **`docs/fe-handoff/{page}.md`**: the exact scope for the human FE developer (screens, controls, endpoint per control, states, errors,
   role rules, out-of-scope list, acceptance = the re-walk rows). Team also needs grant/membership removal (0b-41). Journal writes 500
   on staging until its encryption key is set (§0c item 4).
4. **Calendar and Settings carry on** in their sessions: Calendar BE → API PR → FE pass; Settings PR 1 → Billing once D-SET-1..7
   are answered → FE pass. Relay D-CAL-3 when Adebayo answers.
5. Then Funding, Investor Readiness, Marketplace, Analytics (no API, design first like Sales) → Legal (Victoria). Keep at most 2-3
   sessions running.

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
