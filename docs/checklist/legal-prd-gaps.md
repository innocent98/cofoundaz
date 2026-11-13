# Legal & Compliance: PRD + UI gap list (2026-11-13)

Source of truth: `Cofoundaz_Technical_PRD.md` Module 13 (§13.1 to §13.6, API, entities, events, notifications, and the
access line "F, LA (read/comment Legal module + shared docs, upload reviewed drafts), TM (granted)") and the designed UI in
`app/(dashboard)/legal/*`. Design and decisions: API repo
`docs/superpowers/specs/2026-10-17-module-13-legal-compliance-slice1-design.md` (D1..D24).

**How it was checked:** a read-only code inventory of both repos (FE `develop` `1fc2fe0`, API `feat/legal-compliance`
`338c2ea7` on develop `da25fb86`). Every control on **all six** pages under `app/(dashboard)/legal/*` was read in source
(`page.tsx`, `compliance/page.tsx`, `ip/page.tsx`, `templates/page.tsx`, `review/page.tsx`, `requests/page.tsx`,
`layout.tsx`, `hooks/useLegalApi.ts`) and compared with the PRD and with the raw API
(`app/api/v1/endpoints/legal.py`, `app/schemas/legal.py`, `app/services/legal/*`). Slice 1 (13.1, 13.4, 13.5) is compared
against built code; 13.2, 13.3 and 13.6 are compared against the PRD only, since no API exists for them yet.

**The API side WAS exercised live.** `e2e/test_legal.py` ran against a real uvicorn server on an isolated `cofoundaz_e2e`
database migrated from zero to `0106_legal`, with real emails, real invitation acceptance and a real proof upload. All 20
response bodies in `e2e/_captures/legal/` are from that run and are the verbatim source for the FE integration guide.

**The browser walk at 1440 + 375 did NOT happen.** The FE is a pure static mock, so nothing below depends on pixels and the
list stands — but the FE session must do the 1440/375/every-role pass before ✅, and add rows for anything visual it finds.
Rows marked **not verified live** say so explicitly.

Legend: ❌ gap · ◐ partial · ✅ built · Slice: **1** (formation + IP + compliance BE, built) · **2** (advisor requests) ·
**3** (templates + AI review) · **FE-1** (wire the three Slice 1 pages) · **FE** (front-end work on a later slice's pages) ·
Severity: **Sec** > **High** > **Med** > **Low**

## Headline

**The Slice 1 API is built and the front end calls none of it.** `hooks/useLegalApi.ts` is 144 lines of `useState` with
hard-coded arrays — no `fetch`, no API client, no error or loading states. Every tick, row, badge and date on all three pages
comes from that file; every write is a `triggerToast(...)` and nothing persists across a reload. So every data-backed row
below is a gap by construction, exactly as Sales was before FE-A.

Three things are worse than "not wired yet", because they will still be wrong after someone wires them:

- the jurisdiction dropdown offers **four** jurisdictions where the API serves **two**, and sends display names where the API
  takes codes (rows 6 and 7);
- the mock's shapes are not the contract — a squashed `meta` string, `"Was due Jul 10"` display dates, `statusBg` colours
  carried as data (row 3);
- the PRD's `compliance_items.proof_doc_id` says proof is a **Documents** record. Slice 1 stores a storage key on the row
  instead (row 21). That is a deliberate divergence and needs a decision, not a patch.

## Cross-cutting

| # | Status | Gap | Sev | Slice |
|---|---|---|---|---|
| 1 | ❌ | FE calls no Legal endpoint at all: `useLegalApi.ts` is seeded `useState`, every mutation is a toast, nothing persists | High | FE-1 |
| 2 | ✅ | Role gating built and tested: reader set F + TM + LA on GETs, writer set F + TM on writes, uniform 404 cross-tenant. **Not verified live** (no browser walk) | Sec | 1, FE-1 |
| 3 | ❌ | Mock shapes are not the API contract: `meta: "CAC · est. 1 day · ₦500"` vs structured `authority`/`est_days`/`est_cost_minor`; `due: "Was due Jul 10"` vs ISO `due_on` + derived `status`; `statusBg`/`dueColor` carried as data | High | FE-1 |
| 4 | ❌ | No legal entry in the sidebar access rules or ⌘K search; no activity-feed visibility rule for `legal.*` | Med | FE-1 |
| 5 | ◐ | Events `legal.compliance.due_soon` and `legal.compliance.overdue` built; `legal.contract.flagged` is Slice 3. **`legal.ip.renewal_due_soon` is NOT in the PRD's events list** — added in Slice 1 (D18), needs ratifying | Low | 1 |

## 13.1 Entity Formation (`/legal`)

| # | Status | Gap | Sev | Slice |
|---|---|---|---|---|
| 6 | ❌ | Dropdown offers **Nigeria, Kenya, Ghana, Delaware USA**; the API serves **NG** and **US-DE** only. Kenya and Ghana 404 by design (D6). Either the API gains two jurisdictions with real step content, or the FE drops them — see **D-LEG-2** | High | 1, FE-1 |
| 7 | ❌ | Dropdown sends display names (`"Nigeria"`, `"Delaware, USA"`); the API takes codes (`NG`, `US-DE`) | High | FE-1 |
| 8 | ❌ | The PRD's **entity summary card** (name, type, reg no., formed date) shown "when complete" cannot be built: there is no `legal_entities` table. The FE's completion card is a congratulation with no entity data in it | High | 1 |
| 9 | ❌ | PRD asks for **doc links** per step. `FormationStepDef` has no link field, and the FE's "Docs" button is wired to nothing (`onClick` only stops propagation) | Med | 1, FE-1 |
| 10 | ❌ | The API returns `disclaimer` plus an `estimates: true` flag; the page renders neither. PRD requires the §1.4 disclaimer to be visible, and the flag exists so no client presents catalog figures as verified fact (D6) | Sec | FE-1 |
| 11 | ✅ | Per-jurisdiction checklist, "mark done" / untick, and progress kept per jurisdiction so switching never wipes ticks (D8) | — | 1 |
| 12 | ❌ | Step toggle is optimistic-only and local; no `PATCH /legal/formation/steps/{step_key}`, no failure state | Med | FE-1 |

## 13.4 IP Tracker (`/legal/ip`)

| # | Status | Gap | Sev | Slice |
|---|---|---|---|---|
| 13 | ❌ | "Add asset" drawer submits to `triggerToast("IP asset added successfully.")` — no `POST`, no validation, no error path | High | FE-1 |
| 14 | ❌ | No edit and no delete on a row, though the API has `PATCH` and `DELETE` | Med | FE-1 |
| 15 | ❌ | **PRD 13.4: "renewal date → auto compliance item".** Not built: an IP asset with a `renewal_on` creates no linked compliance item, and nothing defines what happens when that date moves or the asset is deleted — see **D-LEG-3** | High | 1 |
| 16 | ❌ | `renewal` is a display string; PRD wants a **"Renews {date}"** chip. API returns ISO `renewal_on` | Low | FE-1 |
| 17 | ◐ | API stores three statuses (`drafting`, `filed`, `registered`) and derives `expired` from `renewal_on` (D9). **The PRD and the mock both list only Filed / Registered / Expired** — `drafting` is a Slice 1 addition, needs ratifying | Low | 1 |

## 13.5 Compliance Calendar (`/legal/compliance`)

| # | Status | Gap | Sev | Slice |
|---|---|---|---|---|
| 18 | ❌ | **No way to create a filing.** The page has no "Add" control at all, though the API has `POST /legal/compliance-items` | High | FE-1 |
| 19 | ❌ | "Mark done" only toasts "Prompting for proof upload…" — no `PATCH`, no upload, no proof | High | FE-1 |
| 20 | ❌ | Calendar toggle is a placeholder: the button toasts "Calendar view is not fully supported in this demo" and renders "Calendar view rendering placeholder." PRD requires **list + calendar toggle** | Med | FE-1 |
| 21 | ❌ | **PRD entity is `compliance_items(… proof_doc_id)`** — proof as a Documents record. Slice 1 stores `proof_key` on the row and serves it through its own authenticated route. Divergence, not an oversight — see **D-LEG-4** | High | 1 |
| 22 | ❌ | PRD lists **owner** and **linked docs** on an item; neither exists. `created_by`/`completed_by` are audit stamps, not an assignable owner | Med | 1, FE-1 |
| 23 | ❌ | **Recurrence has no UI.** The API has a `recurrence` enum and drift-free next-occurrence spawning (D16/D24); nothing on the page sets, shows or explains it. VAT and PAYE are monthly in Nigeria, so this is the module's most-used field and it is invisible | High | FE-1 |
| 24 | ✅ | Derived status (`upcoming` / `due_soon` / `overdue` / `done`) is returned on every row, and the mock's four status labels match it exactly. There is deliberately **no** overdue-count endpoint — the FE counts the rows for its banner, which is what it already does (D13) | — | 1 |
| 25 | ❌ | Overdue banner copy is "{n} filing overdue. These carry penalties, handle it first." PRD: "**{n} filings overdue. These carry penalties — handle them first.**" No plural handling | Low | FE-1 |
| 26 | ❌ | No edit and no delete on a row, though the API has `PATCH` and `DELETE` | Med | FE-1 |

## 13.2 Contract Templates (`/legal/templates`) — Slice 3

No API exists (`GET /legal/templates`, `POST /legal/templates/{id}/generate`) and no `contracts` entity.

| # | Status | Gap | Sev | Slice |
|---|---|---|---|---|
| 27 | ❌ | No templates API and no `contracts` table; the gallery renders `TemplateItem` objects seeded in `useLegalApi.ts` | High | 3 |
| 28 | ❌ | Gallery is a flat `templates.map`. PRD requires it **grouped**: NDAs · Employment & Contractors · Fundraising (SAFE, Convertible Note) · Commercial · IP Assignment | Med | 3, FE |
| 29 | ❌ | PRD's note under the fundraising group — *"Standard instruments only. Anything negotiated belongs with a lawyer."* — is absent (there is no grouping to hang it on) | Sec | FE |
| 30 | ◐ | "Use template" opens a generator modal with party and key-term fields, but the fields are static placeholders, not per-template as the PRD requires ("fields per template") | Med | 3, FE |
| 31 | ❌ | "Generate draft" runs `router.push("/legal/review")`. No job, no document created, no draft passed — the review page simply shows its own hard-coded contract | High | 3, FE |
| 32 | ❌ | Card carries `badge`; PRD wants an explicit **jurisdiction tag**, and the generated draft must open in 13.3 "already AI-checked" | Med | 3 |

## 13.3 AI Contract Review (`/legal/review`) — Slice 3

| # | Status | Gap | Sev | Slice |
|---|---|---|---|---|
| 33 | ❌ | No `POST /legal/review` job, no analysis, no persistence. Findings are three hard-coded cards in the page | High | 3 |
| 34 | ❌ | `fileUploaded` is initialised `true` "for demo", so the PRD's empty state — **"Never sign blind again."** with CTA **"Review a contract"** — can never render | Med | FE |
| 35 | ❌ | Upload only toasts "Contract loaded: {name}. Analyzing…". No file is sent, and there is no "pick from Documents" path, which the PRD requires alongside the drop zone | High | 3, FE |
| 36 | ◐ | Severity chips (**High risk** / **Caution** / **FYI**) match the PRD, but clause ref, plain-language explanation and suggested action are fixed strings | Med | 3 |
| 37 | ❌ | Left pane is a "mock skeleton for document text highlighting" — no `PdfViewer`, no clause highlights | Med | 3, FE |
| 38 | ❌ | Footer reads a hard-coded "3 findings · 1 high risk"; PRD wants **"{n} findings · {h} high risk."** | Low | FE |
| 39 | ❌ | **"Send to my legal advisor"** toasts; PRD routes it into 13.6. **"Accept & continue to signature"** toasts; PRD routes it into Module 18 e-signatures | Med | 2, 3, FE |
| 40 | ❌ | Event `legal.contract.flagged` and the notification **"Contract review flagged {n} issues in {doc}"** CTA **"See findings"** are not built | Med | 3 |

## 13.6 Legal Advisor Requests (`/legal/requests`) — Slice 2

| # | Status | Gap | Sev | Slice |
|---|---|---|---|---|
| 41 | ❌ | No `advisor_requests` entity and no CRUD `/legal/advisor-requests`; the list is seeded `AdvisorRequest` objects | High | 2 |
| 42 | ❌ | Mock row is `{title, subtitle, status}`. PRD requires **subject, doc, advisor, status** — there is no doc reference and no advisor on the record at all | High | 2 |
| 43 | ❌ | "New request" dialog takes a title and a description. PRD requires **pick doc** + note to advisor; there is no document picker | High | 2, FE |
| 44 | ❌ | Submit toasts "New advisor request opened." — nothing is created or persisted | High | FE |
| 45 | ❌ | **No advisor view.** PRD requires the same list scoped to the advisor, plus **"Upload reviewed draft"** creating a new document version (Module 18), plus a comment thread | High | 2 |
| 46 | ❌ | Status copy on return — **"{Advisor} returned {doc} with {n} comments."** — is not present; statuses are display strings with baked-in colours | Low | 2, FE |
| 47 | ❌ | Notification to LA — **"{Founder} requested your review of {doc}"** — is not built. This is the only PRD notification addressed to a legal advisor | Med | 2 |

### Access-line consequence (cross-cutting, recorded here)

The PRD's access line gives LA **"read/comment Legal module + shared docs, upload reviewed drafts"**. Slice 1 gives LA
read-only with no comment surface and no upload anywhere. Comment and "upload reviewed draft" arrive with 13.6 (Slice 2), so
until then LA's grant on 13.1 / 13.4 / 13.5 is a **partial** implementation of that line, not a complete one.

## Product calls (D-LEG)

Each has a proposed default. **The default is what gets built unless told otherwise.**

| ID | Question | Proposed default |
|---|---|---|
| **D-LEG-1** | The PRD access line reads "TM (granted)". Slice 1 gives every team member blanket write on compliance items and IP assets. Is TM write **blanket**, or **per-grant** like Documents? | **Blanket.** It is what the approved spec (D1) says and what shipped: reader set F + TM + LA, writer set F + TM. Per-grant would need a grants table and a Documents-style share model — a slice of its own. |
| **D-LEG-2** | Slice 1 serves **NG** and **US-DE**. The FE dropdown offers Nigeria, Kenya, Ghana and Delaware. How many jurisdictions does Slice 1 really support, and who writes real step content for the rest? | **Two, and the FE drops Kenya and Ghana** until someone supplies real CAC/FIRS-grade content for them. Four honest jurisdictions beat ten with placeholders; nothing that reads as legal advice ships without the §1.4 disclaimer. |
| **D-LEG-3** | PRD 13.4: an IP renewal date "→ auto compliance item". Should an IP asset with a `renewal_on` create a linked compliance item? And what happens when the date moves, or the asset is deleted? | **Defer to a later slice.** Slice 1 already notifies on IP renewals directly (`legal.ip.renewal_due_soon`, 14/7/1 days), so the deadline is not missed. Auto-creation needs a link column, a reconciliation rule on date change, and a deletion rule — and would double-notify against the existing reminder. |
| **D-LEG-4** | PRD entity: `compliance_items(… proof_doc_id)`. Slice 1 stores `proof_key` and serves the file through its own authenticated route, mirroring Finance receipts. Move proof into Documents (Module 18), or keep it on the row? | **Keep it on the row for Slice 1.** It mirrors shipped Finance behaviour (magic-byte sniff, `save_private`, authenticated read) and has no Documents dependency. Moving to `proof_doc_id` later is an additive migration plus a backfill. |
| **D-LEG-5** | The proof download route: Finance's four-route pattern (upload, issue a 5-minute signed link, download, delete), or two routes (upload plus one authenticated GET that streams the file)? | **Ask.** Genuinely open — the signed-link design brings ~12 token-security tests with it (expired, tampered, traversal, wrong key shape, foreign secret, foreign workspace, malformed claim). The direct stream needs role and cross-tenant tests only. This is the one item blocking code. |
| **D-LEG-6** | `legal.compliance.overdue` is not in Module 13's events list, but Module 20.2 names "compliance overdue" among the critical alerts locked ON for in-app + email. Should it be in `CRITICAL_TYPES`, and should the `deadlines` inbox filter include the legal events? | **Yes to both.** 20.2 is explicit that compliance overdue is a locked-on critical alert, and a filing deadline is what the `deadlines` filter is for. Currently neither is wired. |
| **D-LEG-7** | The formation catalog's disclaimer is adapted, not the PRD §1.4 text. §1.4 reads "This is AI-assisted guidance…" and **nothing in the catalog is AI-generated** — the steps are hand-written constants. | **Keep the adapted wording.** Quoting §1.4 verbatim would tell the user an AI wrote steps that a human wrote. The adapted text makes the same disclaimer (guidance, not advice; estimates change; involve a professional) without the false claim. |
| **D-LEG-8** | `IpAssetStatus` adds `drafting` to the PRD's Filed / Registered / Expired. | **Keep it.** A trademark being prepared but not yet filed is a real state, and `expired` is derived rather than stored, so the stored set is `drafting / filed / registered`. The FE's add drawer should offer the first two only. |

## Blocked (on Adebayo, not code)

- **D-LEG-5** is the only item blocking Slice 1 code. Everything else above is either built, deferred by a default, or FE work.
- **Live e2e captures.** `e2e/test_legal.py` cannot be run on this Windows host. Per the standing arrangement, CI proves it on
  the PR and the lead runs `scripts/e2e_run.sh` on a Docker host and commits the captures. Until then
  `docs/fe-integration-guide-legal.md` ships labelled with a capture map rather than live bodies.

## Deferred follow-ups

- `legal_entities` + the entity summary card (row 8) — needs a table, a migration and an FE card.
- IP renewal → linked compliance item (row 15, D-LEG-3).
- Owner and linked docs on compliance items (row 22).
- Proof as a Documents record (row 21, D-LEG-4) — additive migration plus backfill if adopted.
- LA comment surface (13.6) — arrives with Slice 2.
- Scheduler follow-ups raised in PR review: a batch cap plus a `ScheduledRun` anti-join on `_due_compliance`; clearing claims
  when a `due_on` moves after a reminder has fired; deleting the stored proof **after** the DB commit rather than before.
