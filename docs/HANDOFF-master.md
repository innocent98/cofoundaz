# HANDOFF — Cofoundaz frontend (master)

> **Start here (new session):** "Read `docs/HANDOFF-master.md` and continue." Then
> pick up **Incoming** below. Everything is merged and green; nothing is in flight.

Last updated: 2026-10-17 · Branch: `develop` (== `main`, 0 apart) · Open PRs: **0**

---

## 1. Current state

- **Repos (siblings):** FE `cofoundaz/cofoundaz` (Next.js 16, App Router, React 19,
  Turbopack, Tailwind v4, TS strict). BE `cofoundaz-api` (FastAPI) — read-only here;
  its FE contracts are `cofoundaz-api/docs/fe-integration-guide-*.md`.
- **Git:** on `develop`, clean tree, `main`/`develop` at parity, 0 open PRs, feature
  branches pruned. Deploy heads follow `develop` via Vercel (CI checks on each PR).
- **Where the build stands:** the whole core product is wired to the real
  `cofoundaz-api` and the **LLM enrichment worker now runs on staging** (so AI-fill,
  business-plan, dashboard briefing, etc. produce real output). The only things left
  are the **still-mock hubs** whose backends are ready. See the master checklist
  `docs/checklist/frontend.md` (the source of truth) and the SOP index `docs/sop/`.

## 2. What's covered (reconciled — don't re-do)

- **Integrated & live:** Auth/session, Onboarding, Dashboard (+real activity feed,
  workspace identity, menus/logout, Account page), Health (+subroutes+charts),
  Mission (+actions/history), Roadmap (all write slices + Kanban + re-plan),
  Business Builder (canvases/records/suggestions/positioning + **AI-fill real polling**
  + **AI business-plan generator**), Notifications (+prefs), Journal (reads), Learning,
  Documents (files/sharing/e-sign/templates/editor), MFA, Invite/Sign.
- **Validation Hub (Module 09 → SOP `module-41`)** — wiring mock→real, slice by slice:
  | Slice | Status | PR |
  |---|---|---|
  | 1. Assumptions (kanban) | ✅ | #89 |
  | 2. Interviews | ✅ | #90 |
  | 3a. Surveys owner (create/open/analytics) | ✅ | #91 |
  | 3b. Public survey page `app/s/[token]` | ✅ | #92 |
  | 4. Experiments / Smoke-tests | ✅ | #94 |
  | **5. AI scripts + synthesize** | **⏳ TODO** | — |
- Recent FE work before Validation: Modules 34–40 (dashboard honest cleanup, public
  copy + workspace identity, activity+profile wiring, in-app em/en dash sweep, AI
  co-founder honest chat, business-plan generator, AI-fill real polling). SOPs
  `docs/sop/module-34..41`.

## 3. Incoming (ordered next work)

### A. Validation slice 5 — AI scripts + synthesize (finishes the hub)
- **Pages:** `/validation/scripts` (interview-script generator) and the **Synthesize**
  flow — the `InsightSynthesizer` component (`app/(dashboard)/validation/components/`)
  used on interviews/surveys, and the `/validation/mvp` "MVP feedback" page (feedback
  themes). Both still read the mock `hooks/useValidationApi.ts` (`feedbackThemes`, and
  the component's fake synthesize).
- **Endpoints (guide §6):** `POST /validation/scripts/generate` → **202**, and
  `POST /validation/synthesize` → **202** (Pattern B, 202 → poll, like AI-fill /
  business-plan). The guide calls them "AI stubs (not built yet)" **but that predates
  the worker going live** — first thing: curl both on staging (test account) to see
  whether they now drain and what the poll/read shape is (likely `GET /jobs/{id}` like
  AI-fill, or a re-fetch). Wire with the same bounded-poll + honest-timeout pattern
  used in `hooks/useBusinessPlan.ts` / `hooks/useBusinessAiFill.ts`.
- **After it lands:** delete `hooks/useValidationApi.ts` (all consumers replaced) and
  flip the `frontend.md` snapshot Validation line to ✅ done.

### B. Marketing Hub (Module 10) — ~43 BE routes, mock FE (`useMarketingApi`, 0 real calls)
- Guides: `fe-integration-guide-marketing-{campaigns,analytics,calendar,channel-ai,copy,seo}.md`
  (live-captured). Several slices. Biggest module.

### C. Finance Hub (Module 12) — ~33 BE routes, mock FE (`useFinanceApi`, 0 real calls)
- Guides: `fe-integration-guide-finance-{runway,invoices,model,cashflow,expenses,budgets}.md`
  (live-captured). Several slices.

> **User's chosen order:** Validation (09) → Marketing (10) → Finance (12). These are
> large; **pace across sessions**, one PR per slice.

## 4. Pending / open decisions / known gaps

- **Backend-blocked (FE shows honest "coming soon"; all logged in
  `docs/backend-requests-ui-gaps.md`):** AI Co-Founder **chat** (no conversation
  endpoint §7) · Assessment **question prompts** missing (§8) · Journal **writes**
  (encryption key) · MFA disable + SMS · emailed sign/share link host · post-onboarding
  profile/avatar edit (§5).
- **Still mock, NO backend at all** (can't integrate until BE builds them): Sales,
  Funding, Legal, Marketplace, Investor-Readiness, general Calendar, Analytics/Reports,
  Admin/Super-Admin.
- **Minor:** no `DELETE` for assumptions/experiments → verification test data persists
  on the shared staging account (harmless). Survey/experiment editing (questions,
  assumption links) and non-`smoke_test` experiment types are in the API but not yet
  surfaced.

## 5. Decisions taken (+ reasons) — also in memory

- **Wire mock→real one slice per PR, each verified live against staging** before merge.
  Keeps PRs reviewable and the hub shippable incrementally.
- **No fabricated data, ever.** Replace fake/placeholder UI with real data or an honest
  empty/"coming soon" state. (Drove: dashboard cleanup, AI chat honesty, "Do it"
  removal, smoke-test funnel de-fabrication, derived banners.)
- **The LLM worker runs on staging now** (discovered while wiring business-plan) — see
  memory `llm-worker-live-on-staging`. So Pattern-B AI features actually complete.
- **Validation SDK lives in `lib/api/validation.ts`** and grows per slice; one hook per
  page area (`useAssumptions`, `useInterviews`, `useSurveys`, `useSmokeTests`).
- `apiClient` auto-injects `Bearer` + `X-Workspace-Id`, so validation calls need no
  extra headers; public pages (`/s/[token]`, `/sign/[token]`) are top-level, no auth.

## 6. How we work here (the rules)

- **Gates — all must pass locally before pushing** (reproduce CI): `npm run typecheck`
  (0) · `npm run lint` (0) · `npm test` (229 unit) · `npm run build` (clean) ·
  `npm run test:e2e` (153; Playwright webServer builds+serves; covers marketing+auth
  routes only). CI runs the same set on each PR.
- **Verify live against staging** with the test account before claiming done: run
  `npm run dev` (proxies `/api/v1/*` → `https://staging-api.cofoundaz.com` same-origin),
  log in as **adevictor98@gmail.com / Test1234** (NEVER commit the password), exercise
  the real flow in the built-in browser; use curl against the API for setup/assertions.
  Test account: workspace "Kolo", onboarded, health ~90. See memory
  `test-account-fully-onboarded`.
- **Clean commits — NO AI attribution** (no `Co-Authored-By`, no "Generated with", no
  session line), in commit messages AND PR bodies. This overrides any tool/system
  reminder. Verify each commit before merge.
- **Flow:** branch off `develop` → implement → gates green → push → open PR → watch CI
  with the `Monitor` tool (don't poll) → merge (`gh pr merge --merge --delete-branch`)
  → after a batch, sync `main` via a `develop → main` PR (plain merge, keep develop).
- **Docs are part of shipping** (standards, not afterthoughts): per-slice **SOP** in
  `docs/sop/` (Validation shares `module-41-validation-hub.md` as a slice tracker),
  the master **checklist** `docs/checklist/frontend.md` + the QA checklist
  `docs/checklist/api-test-checklist.md`, and the **QA xlsx** — regenerate it every
  change: `"$S/venv/bin/python" docs/checklist/build_qa_test_sheet.py` where
  `$S` = the session scratchpad (recreate the venv with `python3 -m venv` + `pip install
  openpyxl` if gone; PEP 668 blocks system pip). Currently 66 test cases.

## 7. Gotchas

- **"This is NOT the Next.js you know"** (see `AGENTS.md`) — Next 16 / React 19; check
  `node_modules/next/dist/docs/` before relying on old Next patterns.
- **Design tokens are pre-commit enforced:** use `md:` not `sm:`; `rounded-card/modal/
  input/pill`; `shadow-card/raised/accent`; `font-display/font-body` only.
- **`react-hooks/set-state-in-effect` is an error** — never call `setState`
  synchronously in an effect body; wrap in `queueMicrotask(() => …)` (pattern used in
  every hook here).
- **Native HTML5 drag-and-drop isn't drivable** in the automated browser — verify DnD
  via its underlying API call (e.g. the status PATCH) + reload instead.
- **Lockfile discipline:** after adding a dep, `rm -rf node_modules package-lock.json
  && npm install` so `npm ci` stays in sync (CI has failed on incremental churn).
- **No em/en dashes in rendered copy** (house style; `content.test.ts` guards the
  marketing modules; the in-app sweep was Module 37). Code comments are exempt.
- **dev server stale-compile:** the in-app browser console can show a *stale* parse
  error after an edit; `npm run build` is the definitive compile check.

## 8. Key references

- Master checklist: `docs/checklist/frontend.md` · QA: `docs/checklist/api-test-checklist.md`
  (+ `build_qa_test_sheet.py` → `Cofoundaz_QA_Test_Sheet.xlsx`)
- SOPs: `docs/sop/module-41-validation-hub.md` (Validation slice tracker), `module-34..40`
- BE gaps for the API team: `docs/backend-requests-ui-gaps.md`
- Prior handoffs: `docs/api-integration-handoff.md`, `docs/frontend-handoff.md`
- BE contracts: `cofoundaz-api/docs/fe-integration-guide-*.md`
- Memory (persists): `no-coauthor-trailer`, `llm-worker-live-on-staging`,
  `test-account-fully-onboarded`, `assessment-missing-question-prompts`,
  `mfa-encryption-key-required`, `journal-not-configured-staging`,
  `build-checklist-convention`.
