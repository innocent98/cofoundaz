# Legal FE walk (2026-11-13)

Branch `feature/legal-fe` (off develop `7de10ee`), API develop `3386fc06` (Legal slice 1, migration `0106_legal`).
Scratch stack: own Postgres 16 and Redis 7 containers, own uvicorn on :8021, Next dev on :3100 proxying to it. The
shared :8000 stack was not touched. Users and data were created by a seed script (founder, team member, legal advisor
and mentor invited into one workspace; three filings and two IP assets). Browser: the app's built-in pane at 1440 and
375, driving the real UI; every write was then read back from the raw API (`curl` with each role's bearer token).

**Result: 48 rows, 48 pass, 0 fail** (several rows bundle a few sub-checks). Not exercised live: see the end.

## Founder, 1440

| # | Control | Evidence | Result |
|---|---|---|---|
| 1 | Formation loads | Jurisdiction select lists Nigeria, Delaware, USA (values `NG`, `US-DE`) from `GET /formation/jurisdictions`; Kenya and Ghana absent | ✅ |
| 2 | Step meta | "CAC · est. 1 day · est. ₦500", "FIRS · est. 5 days" (null cost shows no price) | ✅ |
| 3 | Disclaimer | API string rendered under the list, plus "Timings and fees shown are estimates, not verified figures." | ✅ |
| 4 | Tick step 1 and 2 | "2 of 4 steps done"; raw API shows `reserve_name`, `file_incorporation` completed | ✅ |
| 5 | Untick | "1 of 4 steps done", checkbox `aria-checked` false | ✅ |
| 6 | Switch to Delaware | "0 of 3 steps done", three Delaware steps; back to Nigeria keeps its ticks | ✅ |
| 7 | All steps ticked | Banner "All formation steps marked done" (no entity data claimed) | ✅ |
| 8 | Compliance: skeleton | Skeleton rows while loading | ✅ |
| 9 | Compliance: list | Annual return 8 Nov 2026 "Overdue by 5 days"; VAT return 16 Nov "Due in 3 days"; PAYE "Not specified" authority; recurrence under the title | ✅ |
| 10 | Overdue banner | "1 filing overdue. These carry penalties, handle it first." | ✅ |
| 11 | Add filing: empty submit | "Enter what is being filed." and "Pick a due date." | ✅ |
| 12 | Add filing: save | Toast "Filing added.", row appears sorted by date | ✅ |
| 13 | Attach proof: lying PNG (HTML body, image/png type) | API 422 text shown: "Proof must be a PNG, JPEG, or PDF." | ✅ |
| 14 | Attach proof: `.html` type, then 10 MB + 1 | Client messages shown, Upload disabled | ✅ |
| 15 | Attach proof: real PNG | Dialog closes; row now offers Download proof and Replace proof; raw API `proof_url` set | ✅ |
| 16 | Download proof | `GET .../proof` with the bearer token (`accessTokenForRequest()`), blob saved as `proof-of-filing.png`; no `cf_token` read | ✅ |
| 17 | Mark done (recurring VAT) with proof | Toast "Marked done. Next VAT return is due 16 Dec 2026."; raw API: old row done with proof, successor open, `previous_item_id` set, no proof | ✅ |
| 18 | Filters | Overdue 1, Due soon 0, Upcoming 3, Done 1, All 5 with correct rows; date range narrows; Clear dates; empty copy "No filings match these filters" | ✅ |
| 19 | Calendar view | November 2026 grid, status-coloured chips, Next and Previous month, chip opens detail drawer with actions | ✅ |
| 20 | Edit | Prefilled; title changed, authority cleared (null sent), recurrence changed; toast "Filing updated." | ✅ |
| 21 | Delete | Confirm text, Cancel keeps the row, Delete removes it; toast "Filing deleted." | ✅ |
| 22 | IP: error state | Forced 500 on `/legal/ip-assets`: message plus Retry; Retry restores the list | ✅ |
| 23 | IP: list | Expired kolo.africa (derived), "Expired 14 Oct 2026" in red; registered mark "Renews 23 Nov 2026" | ✅ |
| 24 | IP: add drawer | Status choices drafting and filed only; empty submit "Enter a name."; saved patent filed, renews 1 Mar 2027 | ✅ |
| 25 | IP: filters | Type domain 1 row; trademark + filed shows "No assets match these filters"; filed 1 row | ✅ |
| 26 | IP: renew expired | "Update renewal" opens edit with the expired hint; new date turns it into Registered, "Renews 14 Oct 2027" | ✅ |
| 27 | IP: delete | Confirm text about reminders; row removed | ✅ |
| 28 | Notification links | `/legal/compliance?item={id}` and `/legal/ip?asset={id}` highlight and scroll to the row | ✅ |
| 29 | Removed tabs | Tabs show Formation, IP tracker, Compliance only; `/legal/templates` redirects to `/legal` (same for review, requests) | ✅ |

## Founder, 375

| # | Check | Result |
|---|---|---|
| 30 | Page never scrolls sideways on Formation, IP, Compliance (scrollWidth 375) | ✅ |
| 31 | Tabs fit; filter chips scroll inside their row | ✅ |
| 32 | Compliance and IP tables scroll inside their card | ✅ |
| 33 | Calendar grid scrolls inside its card | ✅ |
| 34 | Add filing and Add asset drawers are 375 wide and full height | ✅ |
| 35 | Mark done dialog fits (343 wide), closes on backdrop | ✅ |
| 36 | Formation checkbox rows are 79 px high (tap target) | ✅ |

## Team member, 1440

| # | Check | Result |
|---|---|---|
| 37 | Membership role `team_member`; Add filing, Mark done, Attach proof, Edit, Delete all present | ✅ |
| 38 | Add filing then Delete it: toast "Filing added.", rows 4 to 5 to 4 | ✅ |
| 39 | Formation: 4 checkboxes; IP: Add asset, Edit, Update renewal, Delete present | ✅ |

## Legal advisor, 1440 and 375

| # | Check | Result |
|---|---|---|
| 40 | Compliance shows all 4 filings and filters, no Add, Mark done, Attach, Edit or Delete | ✅ |
| 41 | Download proof works (`proof-of-filing.png` saved) | ✅ |
| 42 | IP lists 2 assets with no Actions column and no Add asset | ✅ |
| 43 | Formation read only: 0 checkboxes, progress "4 of 4 steps done", disclaimer shown | ✅ |
| 44 | 375: all three pages 375 wide, 0 write controls | ✅ |
| 45 | Raw API: POST compliance-item, POST ip-asset, PATCH formation step all 403 `FORBIDDEN`; GET jurisdictions and compliance 200 | ✅ |

## Mentor (denied), 1440 and 375

| # | Check | Result |
|---|---|---|
| 46 | `/legal`, `/legal/compliance`, `/legal/ip` show "You don't have access to this page." at 375 and 1440 | ✅ |
| 47 | No `/api/v1/legal/` request is made from the page | ✅ |
| 48 | Raw API: GET jurisdictions, GET compliance-items, GET proof all 403 | ✅ |

## Not verified live

- Reminder notifications (14, 7, 1 days, going overdue): the worker was not run, so no real `legal.*` notification
  arrived. The link mapping is unit-tested (`hooks/useNotifications.test.tsx`) and the landing highlight was walked by URL.
- Proof 404 after the file vanishes (toast "Proof not available."): code path only.
- Month-end recurrence anchoring: API unit tests (guide section 9).
- Saved-file behaviour in a real browser download folder (blob and filename proven; the save itself is the browser's).
- Empty states with zero rows (Add buttons inside them): code path; the seeded workspace always had rows.

## Findings for the lead

1. **Sidebar entry is still hidden** (`components/sidebar.tsx`, "hidden until real", 2026-11-05). With slice 1 real, legal
   advisors have no way into the module except a URL. Unhide only on Adebayo's word.
2. **The API disclaimer says "you can find one in the Marketplace"**, and Marketplace is a hidden module. The FE renders the
   API string as is (it is legal text); a BE copy change is the right fix if Marketplace stays hidden.
3. **Templates, Contract review, Advisor requests are removed from the tabs** and redirect to `/legal` because slices 2 and 3
   have no API. Product call: keep them hidden until those ship.
4. The notification payloads carry no `href`, so the FE builds the link from `item_id` and `asset_id`.
