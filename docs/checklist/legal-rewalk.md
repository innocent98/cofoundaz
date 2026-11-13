# Legal & Compliance: click-through re-walk (merged develop)

**Date:** 2026-11-13. **Verdict: every control on the three visible tabs (Formation, IP tracker, Compliance) works for every role at 1440 and 375. Three small FE defects (D1 to D3) were found and fixed in this PR and re-checked live. One mobile-layout gap (G1/G2) is left for a follow-up.** **Update 2026-11-13 (FE #261 (FE #261, `fix/fe-leftovers-mediums`)):** G1 and G2 are fixed (stacked cards and an agenda below `md`) and re-walked for F, TM, LA, M at 375 and F at 1440: `fe-leftovers-rewalk.md` §1, 16/16. With that, all 81 rows pass. No data or permission leak: the legal advisor gets no write control anywhere, and the mentor is refused on every Legal route before any Legal API call is made.

**What was walked.** Merged FE `origin/develop` `2fd770c` (includes FE #255 and the sidebar entry #257), served by `next dev` on `localhost:3017`, proxying to a **scratch API** on `:8017`. The scratch API is API develop `7cadd951` plus the disclaimer copy fix (API PR #248, `60a051a7`), migrated from zero on a throwaway Postgres container, with a throwaway Redis. The shared docker stack was not touched. Every row was clicked or typed **by hand in the Claude browser pane**. `innerText`, `aria-*` and `getBoundingClientRect` were read with JS only to check results. Results were compared with the raw API (same account's bearer token and `X-Workspace-Id`, same minute). Two exceptions were scripted, and are marked as such below: (1) file **selection** for proof uploads, because the pane cannot drive a native file chooser, so a `File` was put on the input with `DataTransfer` and the upload button was then clicked by hand; (2) three rows of seed data and three "deleted elsewhere" deletes, made with `curl`-style API calls. Widths: **1440** (1440x900) and **375** (375x812).

**Accounts (local, throwaway, created for this walk).** One workspace, "Legal Rewalk Co". Founder on `localhost:3017`, team member on `tm.localhost:3017`, legal advisor on `la.localhost:3017`, mentor on `m.localhost:3017` (one host per role keeps cookies apart). All four were invited and accepted through the real invitation flow. Emails are `delivered+legal-<role>-…@resend.dev` sinks. The password was generated per run and kept outside the repo.

**Specs checked against:** `cofoundaz-api/docs/fe-integration-guide-legal.md`, `legal-prd-gaps.md` (D-LEG-1: founder and team member write, legal advisor reads, everyone else is refused), `legal-fe-walk.md` (the branch walk before merge).

**Legend.** ✅ = the UI matches the raw API and the guide. ❌ = defect (see "Defects"). ⚠ = a note that is not a defect. 🔧 = fixed in this PR and re-checked live. Roles: F founder, TM team member, LA legal advisor, M mentor.

## Counts

| | Rows | ✅ | ❌ open | 🔧 fixed here | ⚠ notes |
|---|---|---|---|---|---|
| F 1440 (Formation 11, IP 17, Compliance 22) | 50 | 50 | 0 | 3 (D1, D2, D3) | 3 |
| F 375 | 8 | 5 | 3 rows (gaps G1, G2) | | |
| TM 1440 + 375 | 9 | 9 | 0 | | |
| LA 1440 + 375 | 9 | 9 | 0 | | 1 |
| M 1440 + 375 | 5 | 5 | 0 | | |
| **Total** | **81** | **78** | **3 rows, 2 gaps** | **3** | **4** |

## 1. Founder (F), 1440: Formation `/legal`

| # | Control | Result | API evidence | |
|---|---|---|---|---|
| F1 | Page load | Jurisdiction select defaults to Nigeria; 4 steps with authority, days and fee ("CAC · est. 1 day · est. ₦500") | `GET /legal/formation/jurisdictions` 200 (NG, DE); `GET /formation/checklist?jurisdiction=NG` 200 | ✅ |
| F2 | Tick "Reserve company name" | Box ticked, title struck through, "1 of 4 steps done" | `reserve_name` `completed: true` in the same minute | ✅ |
| F3 | Tick the other three | "4 of 4 steps done" and the "All formation steps marked done" panel | each PATCH 200 | ✅ (evidence `f-1440-formation-all-done.jpg`) |
| F4 | Untick one | "3 of 4", the completion panel goes | PATCH 200, `completed: false` | ✅ |
| F5 | Reload | Ticks persist (true, true, true, false) | | ✅ |
| F6 | Select "Delaware, USA" | 3 steps: Certificate of Incorporation, EIN, bank account (Mercury / Brex); "0 of 3" | `?jurisdiction=DE` 200 | ✅ ⚠ N1 |
| F7 | Disclaimer | "…For anything non-standard, involve a licensed professional." It is the API's `disclaimer` string verbatim. The FE has no copy of its own, so the Marketplace pointer is gone with API #248 | `disclaimer` field | ✅ |
| F8 | Estimates line | "Timings and fees shown are estimates, not verified figures." | `estimates: true` | ✅ |
| F9 | Tabs Formation / IP tracker / Compliance (clicked) | Each lands on its page; `aria-current="page"` on the active tab | | ✅ |
| F10 | Sidebar "Legal & Compliance" (clicked) | Lands on `/legal` | | ✅ |
| F11 | Hidden routes `/legal/templates`, `/legal/review`, `/legal/requests` | Each redirects to `/legal` (the old review page's "find one in the Marketplace" copy is gone with it) | | ✅ |

## 2. Founder (F), 1440: IP tracker `/legal/ip`

| # | Control | Result | API evidence | |
|---|---|---|---|---|
| I1 | Empty state | "No IP assets tracked yet" with its own Add asset button | `GET /ip-assets` 200, `[]` | ✅ |
| I2 | Add asset (empty state button), save empty | "Enter a name." under the name field; no request | none | ✅ 🔧 D1 |
| I3 | Name set, jurisdiction cleared, save | "Enter a jurisdiction."; no request | none | ✅ |
| I4 | Trademark "Rewalk Mark", Nigeria, Filed, renewal 2027-03-15 | Toast "IP asset added."; row "FILED · Renews 15 Mar 2027" | POST 200, `status: filed`, `renewal_on: 2027-03-15` | ✅ |
| I5 | New-asset status options | Drafting, Filed only (registering happens from an edit) | | ✅ |
| I6 | Header Add asset: Patent "Old Patent", renewal 2026-01-10 | Row "EXPIRED · Expired 10 Jan 2026" in red; action reads "Update renewal" | `derived_status: expired` | ✅ (evidence `f-1440-ip-list.jpg`) |
| I7 | Edit Rewalk Mark (prefilled), status Registered | Edit offers Drafting / Filed / Registered; row "REGISTERED" | PATCH 200 | ✅ |
| I8 | Update renewal on Old Patent | Drawer hint "This asset shows as expired because its renewal date has passed…"; new date 2027-01-10 gives "DRAFTING · Renews 10 Jan 2027" | PATCH 200 | ✅ 🔧 D2 |
| I9 | Type filter Patent | Old Patent only | `?type=patent` | ✅ |
| I10 | + status filter Registered | "No assets match these filters" | `?type=patent&status=registered` `[]` | ✅ |
| I11 | Clear type, then status | Rewalk Mark, then both | | ✅ |
| I12 | Delete Old Patent: Cancel, Escape, then Delete | Cancel and Escape keep it; the confirm names the asset and says reminders stop; Delete gives toast "IP asset deleted." | `GET /ip-assets` after: Rewalk Mark only | ✅ |
| I13 | Deep link `?asset=<id>` | Row highlighted and scrolled into view | | ✅ |
| I14 | Drawer: Escape, X, focus | Both close it; focus stays inside the dialog | | ✅ |
| I15 | API down, change a filter | "Couldn't load this. Try again." with Retry | proxied GET 500 | ✅ (evidence `f-1440-ip-error.jpg`) |
| I16 | API back, Retry | List loads ("No assets match these filters" under Patent) | GET 200 | ✅ |
| I17 | Edit an asset that was deleted elsewhere, save | Drawer closes, toast "That asset no longer exists.", stale row gone | PATCH 404 | ✅ 🔧 D3 |

## 3. Founder (F), 1440: Compliance `/legal/compliance`

| # | Control | Result | API evidence | |
|---|---|---|---|---|
| C1 | Empty state | "No filings yet" with Add filing | `GET /compliance-items` `[]` | ✅ (evidence `f-1440-compliance-empty.jpg`) |
| C2 | Add filing, save empty | "Enter what is being filed." and "Pick a due date."; no request | none | ✅ 🔧 D1 |
| C3 | VAT return, FIRS, due 2026-11-18, Monthly | Toast "Filing added."; row "Due in 5 days · DUE SOON · Repeats monthly" | POST 200, `derived_status: due_soon` | ✅ |
| C4 | Overdue banner (an overdue and an upcoming filing seeded through the API) | "1 filing overdue. These carry penalties, handle it first." | `derived_status: overdue` | ✅ (evidence `f-1440-compliance-list.jpg`) |
| C5 | Chips All (3) / Overdue / Due soon / Upcoming | Each shows only its row; `aria-pressed` follows | | ✅ |
| C6 | Chip Done (0) | "No filings match these filters" | | ✅ |
| C7 | Due from 2026-11-10 | The 1 Nov row drops out; Due to gets `min` and Due from gets `max` | | ✅ ⚠ N2 |
| C8 | Due to 2026-12-31, then Clear dates | VAT only, then all 3 and the inputs empty | | ✅ |
| C9 | List / Calendar toggle | Calendar shows Annual return on 1 Nov and VAT on 18 Nov | | ✅ ⚠ N3 (evidence `f-1440-compliance-calendar.jpg`) |
| C10 | Calendar entry VAT return | Detail drawer: status, authority, due, repeats, proof "None attached", actions | | ✅ |
| C11 | Next ×2, Previous, Today | Jan 2027 (PAYE entry), Dec 2026, back to Nov 2026 | | ✅ |
| C12 | Mark done on VAT with a `.txt` file (scripted file pick) | "Proof must be a PNG, JPEG, or PDF." and Mark done disabled | none | ✅ |
| C13 | Same dialog, a real PNG (scripted file pick), Mark done | Toast "Marked done. Next VAT return is due 18 Dec 2026."; the old row is DONE with Download / Replace proof; a new UPCOMING row appears | `POST …/proof` 200, PATCH `status: done` 200, successor with `previous_item_id` | ✅ |
| C14 | Download proof | File fetched | `GET …/proof` 200 | ✅ |
| C15 | Attach proof on Annual return: Upload with no file | "Choose a file first." | none | ✅ |
| C16 | 11 MB PDF (scripted pick) | "Proof exceeds the 10 MB limit." and Upload disabled | none | ✅ |
| C17 | Text file named `.pdf` (scripted pick), Upload | Server refusal shown in the dialog: "Proof must be a PNG, JPEG, or PDF." | `POST …/proof` refused (status not captured) | ✅ |
| C18 | Real JPEG (scripted pick), Upload | Toast "Proof uploaded."; row gains Download proof / Replace proof; status unchanged (still OVERDUE) | 200 | ✅ |
| C19 | Edit PAYE, append " 2026", submit with Enter | Toast "Filing updated."; title updated | PATCH 200 | ✅ |
| C20 | Delete Annual return (has proof) | The confirm says "…will be removed together with its proof file"; Delete gives toast "Filing deleted." and the overdue banner goes | DELETE 200 | ✅ |
| C21 | Deep link `?item=<id>` | Row highlighted | | ✅ |
| C22 | Edit a filing that was deleted elsewhere, save | Drawer closes, toast "That filing no longer exists.", stale row gone | PATCH 404 | ✅ 🔧 D3 |

## 4. Founder (F), 375

| # | Control | Result | |
|---|---|---|---|
| R1 | Formation: tick and untick the last step | "4 of 4" plus the completion panel, then back; no page overflow (`scrollWidth` 375) | ✅ (evidence `f-375-formation.jpg`) |
| R2 | Legal tab bar, selects, Add buttons | 44 px targets, full-width Add asset | ✅ |
| R3 | IP: Edit drawer | Full width (375), Save changes gives "IP asset updated." | ✅ |
| R4 | IP table | Scrolls sideways inside its card (760 px in a 341 px box); Status, Renewal, Edit and Delete start off-screen | ❌ G1 (evidence `f-375-ip.jpg`) → ✅ fixed 2026-11-13: stacked cards below `md` (`fe-leftovers-rewalk.md` L1 to L5) |
| R5 | Compliance: Mark done dialog | Fits (343 px wide); Mark done without proof gives "Marked done. Next VAT return is due 18 Jan 2027." | ✅ |
| R6 | Compliance table | 860 px wide in a 341 px box; the actions start off-screen | ❌ G1 (evidence `f-375-compliance.jpg`) → ✅ fixed 2026-11-13: stacked cards below `md` (L7 to L10) |
| R7 | Calendar view | The grid scrolls sideways; entries are 86x27 px | ❌ G2 (evidence `f-375-compliance-calendar.jpg`) → ✅ fixed 2026-11-13: agenda below `md`, 44 px entries (L11 to L13) |
| R8 | Page-level overflow on all three tabs | None (`scrollWidth` 375) | ✅ |

## 5. Team member (TM), 1440 and 375

| # | Control | Result | |
|---|---|---|---|
| T1 | Formation | Sees the founder's ticks; checkboxes are interactive | ✅ |
| T2 | Tick and untick "Open a corporate bank account" | 4 of 4, then 3 of 4 | ✅ |
| T3 | IP: Add asset "rewalk.example" | Toast; row "DRAFTING · No renewal date" | ✅ |
| T4 | IP: Edit, type to Domain | Row type Domain | ✅ |
| T5 | IP: Delete with confirm | Row gone | ✅ |
| T6 | Compliance: Download proof (on the founder's filing) | `GET …/proof` 200 | ✅ |
| T7 | Compliance: Add filing "Pension remittance" due 2026-11-05 | Row OVERDUE, overdue banner back | ✅ |
| T8 | Compliance: every row shows Mark done / Attach / Edit / Delete | Same write set as the founder (D-LEG-1) | ✅ |
| T9 | 375: Mark done dialog on Pension remittance | Fits, closes on Escape | ✅ (evidence `tm-375-mark-done.jpg`) |

## 6. Legal advisor (LA), 1440 and 375 (read only, D-LEG-1)

| # | Control | Result | |
|---|---|---|---|
| L1 | Sidebar | "Legal & Compliance" under "Fund & protect"; Dashboard, Documents, Calendar | ✅ |
| L2 | Formation | Steps shown as static rows (`aria-label` "…: done" / "…: not done"), no checkboxes; disclaimer shown | ✅ (evidence `la-1440-formation-readonly.jpg`) |
| L3 | IP tracker | No Add asset; no Actions column; the founder's asset listed | ✅ |
| L4 | IP filters | Present and working | ✅ |
| L5 | Compliance | No Add filing; every row "No actions" except the one with proof, which shows only "Download proof"; overdue banner shown | ✅ (evidence `la-1440-compliance-readonly.jpg`) |
| L6 | Download proof | `GET …/proof` 200 (D-LEG-5: the reader roles can download) | ✅ |
| L7 | Calendar entry detail | Fields shown, "No actions" | ✅ |
| L8 | Chips and dates | Present and working | ✅ |
| L9 | 375: IP | No Add asset; no page overflow | ✅ (evidence `la-375-ip-readonly.jpg`) |

## 7. Mentor (M), 1440 and 375 (no access, D-LEG-1)

| # | Control | Result | |
|---|---|---|---|
| M1 | Sidebar | No Legal entry | ✅ |
| M2 | `/legal` by URL | "You don't have access to this page." No `/api/v1/legal` request is made | ✅ (evidence `m-1440-legal-blocked.jpg`) |
| M3 | `/legal/compliance` by URL | Same refusal | ✅ |
| M4 | `/legal/ip` by URL, 375 | Same refusal, fits | ✅ |
| M5 | Back to dashboard (375) | Lands on `/dashboard` | ✅ |

## Defects

| # | Where | What | Status |
|---|---|---|---|
| D1 | `_components/ui.tsx` `Field` | Field errors and hints were plain text next to the input: a screen reader did not announce "Enter a name." and the input was not marked invalid | 🔧 Fixed: `Field` now sets `aria-describedby` (error or hint id) and `aria-invalid` on its control. Unit test in `ComplianceForms.test.tsx` |
| D2 | `ip/page.tsx` row action | The visible "Update renewal" button was named "Edit Old Patent" for assistive tech (WCAG 2.5.3, label in name) | 🔧 Fixed: named "Update renewal for <name>" when expired |
| D3 | IP drawer; Compliance filing drawer, Mark done and Proof dialogs | A save that returned 404 (deleted in another tab or by a teammate) showed "That … no longer exists." inside the drawer. After closing it, the deleted row **stayed in the list** (the delete flow refreshes, these did not) | 🔧 Fixed: a 404 now closes the dialog, shows the toast, and reloads the list, the same as the delete flow. Re-checked live (I17, C22); unit tests for all three compliance dialogs |

## Gaps (not fixed here)

| # | What | Why not here | Suggested owner |
|---|---|---|---|
| G1 | At 375 the IP and Compliance tables scroll sideways inside their cards (760 px and 860 px), so Status, Edit, Delete, Mark done and the other actions start off-screen. Nothing is unreachable, but nothing hints that the table scrolls | Needs a stacked card layout below `md` for both tables: a layout change, not a small fix | FE follow-up (same pattern as other hubs' mobile rows). **Fixed 2026-11-13, FE #261 (FE #261, `fix/fe-leftovers-mediums`)** |
| G2 | At 375 the Compliance calendar grid also scrolls sideways, and its entries are 27 px tall (under the 44 px touch target) | Same layout change: an agenda list below `md` would solve both | FE follow-up, with G1. **Fixed 2026-11-13, FE #261 (FE #261, `fix/fe-leftovers-mediums`)** |

## Notes (not defects)

| # | Note |
|---|---|
| N1 | The jurisdiction choice is not remembered: a reload goes back to the first jurisdiction the API serves. The API stores progress per jurisdiction, so nothing is lost |
| N2 | The status chip counts always count every filing; they ignore the Due from / Due to range, while the list respects it. This is how the code is written (counts come from the unfiltered set); it reads as "totals" |
| N3 | The selected List / Calendar button is only a light grey fill on white (`#f4f6f8`); it is hard to see which view is on. `aria-pressed` is correct |
| N4 | Only Formation shows a disclaimer. Compliance shows none, because the API only returns `disclaimer` on the formation checklist. No change asked for; noted because the brief said "Formation/Compliance" |

## Disclaimer copy (API #248)

The disclaimer on Formation is the API's own `disclaimer` field, rendered as is (`app/(dashboard)/legal/page.tsx`, the `Checklist` component); the FE holds no copy of it. With API #248 on the scratch API, the page reads "…For anything non-standard, involve a licensed professional." with no Marketplace pointer (F7, L2). **Staging and production keep the old text until API #248 merges and deploys.** The hidden `/legal/review` page no longer carries its own copy of the sentence: FE #255 replaced it with a redirect to `/legal` (F11).

## Cleanup

The scratch API, scratch Postgres (`legal-pg`) and Redis (`legal-redis`) containers and the `:3017` dev server were stopped and removed after the walk. Nothing was written to the shared stack or to staging.
