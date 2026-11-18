# FE leftovers: re-walk of the open mediums, Legal at 375, and the #253 re-check

**Date:** 2026-11-13. **Branch:** `fix/fe-leftovers-mediums` (PR to `develop`), cut from `origin/develop` `8a4f5f3`.
**Verdict: every row below passes at 1440 and 375 for the roles each page serves. No open item left, no API gap.**

**What was walked.** The branch head, served by `next dev` on `localhost:3018` (proxy pinned to the local API with
`API_PROXY_TARGET`, nothing reached staging), against a **scratch API**: API `origin/develop` `f2d7ff9a` in its own
worktree, migrated from zero on a throwaway Postgres + Redis (`fel-pg`, `fel-redis`), with the stub LLM and the worker
running. The shared docker stack was not touched (it was stopped). All containers, servers and the API worktree were
removed afterwards.

**Branch vs develop.** The branch is `develop` plus changes to Legal (`ip`, `compliance`, `_components/ui.tsx`) and
Validation (`InsightSynthesizer.tsx`, `FeedbackInbox.tsx`) only. Sales, Marketing, Team and onboarding code on the branch
is byte-identical to `develop` `8a4f5f3`, so those rows are the "re-check on merged develop".

**Accounts (local, throwaway).** Workspace "Leftovers Rewalk Co": founder (F) on `localhost:3018`, team member (TM) on
`tm.localhost`, legal advisor (LA) on `la.localhost`, mentor (M) on `m.localhost`, all joined through the real
invitation flow; two fresh users for the onboarding rows. Emails are `delivered+fel-…@resend.dev` sinks, prospects are
`@prospect.example`. Placeholders only.

**How a row is checked.** The control is clicked in the browser pane, then the result is compared with the raw API
(a login + GET as the same role) or the network log. Layout rows use a probe that reads which layout is rendered, the
page's scroll width, and each button's box.

## Which rows were taken (and the count check)

| Lead's count | What the docs actually hold | Taken |
|---|---|---|
| Sales: 2 | `sales-sequences-rewalk.md` ❌ 1 (stale count after a 409 on Stop), ❌ 2 (inline errors stay). Both **already fixed in code** on develop (`c0af7ce`), docs never updated | Re-check both live |
| Validation: 3 | `validation-rewalk.md` "Open items": (a) Surveys insight notification opens on Interviews, (b) feedback textarea has no accessible name, (c) Restore button name omits the item. A 4th row (builder target 60 clamped silently) was **already fixed** (`43f74eb`) | Fix (a) and (c); (b) see V2; re-check the 4th |
| Marketing: 2 | `marketing-rewalk.md` gap 1 (Overview "AI content ideas" adds every run, BE) and gap 2 (CSV spend in minor units, FE). **Both already fixed**: gap 1 by the API (`count_ai_content_ideas` counts the newest ready run), gap 2 in FE `fix/marketing-rewalk-fe` (`majorUnitsCsv`) | Re-check both live |
| Legal G1, G2 | `legal-rewalk.md` R4, R6, R7 | Fix |
| #253 | Team audit log, onboarding logo errors, duplicate activity name | Re-check live |

The labels in the docs say "minor" for Sales and Validation; `buildout-status.md` called them mediums. Same rows.

## 1. Legal at 375 (G1, G2): fixed here

| # | Control | Role / width | Result | Evidence | |
|---|---|---|---|---|---|
| L1 | IP tracker list | F 375 | Stacked cards, table hidden; page `scrollWidth` 375; each card shows name, type · jurisdiction, status chip, renewal, Edit + Delete (44 px tall, right edge ≤ 187 px) | `legal-ip-cards-375-founder.jpg` | ✅ |
| L2 | IP card Edit → rename → Save | F 375 | Drawer opens; card shows the new name; `GET /legal/ip-assets` returns the same name | | ✅ |
| L3 | IP card Delete → confirm | F 375 | Dialog "Delete this asset?"; card gone; API list has 2 | | ✅ |
| L4 | IP card Update renewal (expired) → date → Save | TM 375 | Expired → Registered "Renews 14 Oct 2027"; `PATCH` 200 | | ✅ |
| L5 | IP cards read-only | LA 375 | Cards shown, no button in any card, no Add asset | | ✅ |
| L6 | IP at 1440 | F 1440 | Table shown, cards hidden, no change from #260 | | ✅ |
| L7 | Compliance list | F 375, TM 375 | Stacked cards, table hidden, `scrollWidth` 375; up to five actions wrap inside the card (rightmost edge 308 px), all 44 px tall | | ✅ |
| L8 | Card Mark done (monthly VAT) | F 375 | Dialog; card shows Done; successor card due 16 Dec; toast "Marked done. Next VAT return is due 16 Dec 2026." | `legal-compliance-card-mark-done-375-founder.jpg` | ✅ |
| L9 | Card Delete → confirm | TM 375 | Dialog "Delete this filing?"; card gone; `DELETE` 200 | | ✅ |
| L10 | Cards read-only + Download proof | LA 375 | Only "Download proof" on the filing with proof, "No actions" elsewhere; click → `GET …/proof` 200 | | ✅ |
| L11 | Calendar view → agenda | F 375 | Agenda "Filings due in November 2026", grouped by day, earliest first; entries full width (309 px) × 44 px; grid hidden; `scrollWidth` 375 | `legal-compliance-agenda-375-founder.jpg` | ✅ |
| L12 | Agenda entry click | F 375 | Detail drawer for that filing (status, authority, due, repeats, proof, actions) | | ✅ |
| L13 | Next month / Today | F 375 | December agenda (2 filings); Today returns to November | | ✅ |
| L14 | Calendar at 1440 | F 1440 | 7-column grid shown, agenda hidden | `legal-compliance-grid-1440-founder.jpg` | ✅ |
| L15 | `?item=` deep link | F 375 | The visible card (not the hidden table row) is highlighted | | ✅ ⚠ |
| L16 | Mentor | M 375 | `/legal/compliance` "You don't have access to this page."; no Legal API call from `m.localhost` | | ✅ |

⚠ L15: the browser pane was hidden, and a hidden pane ignores every programmatic scroll (even `window.scrollTo`), so the
scroll position itself could not be shown live. `scrollToShown` picks the id whose element has layout boxes (card below
`md`, row above), which the probe confirmed. TM and LA at 1440 render the same table as before; not re-walked here.

## 2. Validation

| # | Control | Role / width | Result | Evidence | |
|---|---|---|---|---|---|
| V1 | "New pattern detected" notification for a **Surveys** report | F 1440 (clicked in Notifications), F 375, TM 375 (the notification's link) | Lands on `/validation/surveys?insight=…`, Surveys tab active, report drawer open ("Based on 3 survey answers"). Before: Interviews tab. Close clears `?insight` | `validation-insight-link-surveys-1440-founder.jpg` | ✅ fixed |
| V2 | Add feedback: field names | TM 375, F 1440 | Textarea "What did they say?", select "Where from", date "Date", now explicit `<label for>` pairs. The old wrapping label already named them in browsers; the a11y reader used by the walks only reads explicit names, which is why it was flagged | | ✅ fixed |
| V3 | Add feedback submit | TM 375 | Entry listed with Edit / Delete | | ✅ |
| V4 | Restore button name | TM 375, F 1440 | "Restore: Fees are too high for small sales" (item in the name, like Dismiss); click → back in the inbox; API `dismissed: false` | | ✅ fixed |
| V5 | Builder step 2 target 60 | F 1440 | Alert "Between 1 and 50.", `aria-invalid`, Next disabled, no silent clamp | | ✅ (fixed earlier, `43f74eb`) |
| V6 | Mentor | M 375 | `/validation/interviews?insight=…` refused; no Validation API call | | ✅ |

## 3. Sales Sequences (fixed earlier in `c0af7ce`, re-checked)

| # | Control | Role / width | Result | Evidence | |
|---|---|---|---|---|---|
| S1 | Stop → (enrolment ended elsewhere) → Stop emails | F 1440 | `POST …/stop` 409, toast "This enrollment has already ended.", sequences list refetched, header "2 active" → "1 active", Archive dialog "1 person is still being emailed" (= API) | | ✅ |
| S2 | Same | TM 375 | 409; header "0 active · 3 enrolled · 33.3% reply rate" | `sales-409-count-refresh-375-tm.jpg` | ✅ |
| S3 | New sequence, empty step 2 → Create → type subject + body | F 1440, TM 375 | "Add a subject." / "Write the email." appear, then each disappears as its field is filled (only the still-empty name error stays) | | ✅ |

## 4. Marketing (fixed earlier, re-checked)

| # | Control | Role / width | Result | |
|---|---|---|---|---|
| M1 | Overview "AI content ideas" | F 1440, TM 375 | Two ready content-gap runs of 1 idea each: the card shows **1** (the old sum would be 2); SEO lists the newest run's 1 idea | ✅ |
| M2 | Analytics Export CSV | F 1440, TM 375 | File: `…,spend,300,NGN` and `…,spend,120,NGN` with a `unit` column; the page shows ₦300 / ₦120 (the API writes 30000 / 12000 kobo) | ✅ |

## 5. #253 re-check on develop code

| # | Control | Role / width | Result | |
|---|---|---|---|---|
| T1 | Team > Audit log | F 1440, F 375 | 7 rows = `GET /team/audit` 7 entries; no empty state; Export log enabled | ✅ |
| T2 | Team > Activity | F 1440, F 375 | Each row prints the actor once (initials + summary), no doubled name | ✅ |
| O1 | Onboarding step 2 hint | new user 1440, 375 | "PNG, JPG, SVG, or WebP up to 2 MB" | ✅ |
| O2 | 2.5 MB PNG → Continue | 1440, 375 | Alert "Logo must be 2 MB or smaller.", stays on step 2 | ✅ |
| O3 | Text file → Continue | 1440, 375 | `POST /onboarding/logo` 422, alert "Logo must be a PNG, JPG, SVG, or WebP image.", stays on step 2 | ✅ |
| O4 | Valid PNG → Continue | 1440, 375 | `POST /onboarding/logo` 200, step 3 "What are you building?" | ✅ |

The logo file was set on the input with `DataTransfer` (the pane cannot drive a native file chooser), the same way as the
first #253 re-check.

## Counts

| Area | Rows | ✅ | ❌ |
|---|---|---|---|
| Legal (G1, G2) | 16 | 16 (1 ⚠ env) | 0 |
| Validation | 6 | 6 | 0 |
| Sales | 3 | 3 | 0 |
| Marketing | 2 | 2 | 0 |
| #253 | 6 | 6 | 0 |
| **Total** | **33** | **33** | **0** |

## API gaps

None needed. Optional nicety for the API: add `source` to the `validation.insight.detected` payload so the bell can link
straight to the right tab (today the FE reads the report first, then moves tab).
