# FE hand-off: Funding Hub, parts A to D (`/funding/**` and the public `/dr/[token]`)

**For:** the FE developer. **Scope:** exactly what is below: **Pipeline, Data room, Cap table, Term sheets**, and the public investor data room viewer. **Grants and Analytics stay hidden** (their APIs, slices E and F, are not built).
**Backend:** merged to API `develop` (31ee5a3d): slice A `#218`, B `#222`, C `#229`, D `#235`. No migration to wait for.
**Contract:** four live guides in `cofoundaz-api/docs/`, every body in them captured from a running server (section numbers below refer to them):
`fe-integration-guide-funding.md` (**P**, pipeline), `fe-integration-guide-funding-data-room.md` (**DR**), `fe-integration-guide-funding-cap-table.md` (**CT**), `fe-integration-guide-funding-term-sheets.md` (**TS**).
**Gap list:** `docs/checklist/funding-prd-gaps.md` (row numbers below). **Design and calls:** `docs/superpowers/specs/2026-11-05-funding-hub-design.md`, decisions D-FUND-1..8 accepted 2026-11-05.
Files: `app/(dashboard)/funding/**` (replace the mocks), new `app/dr/[token]/page.tsx` with its own layout, new `lib/api/funding*.ts`, hooks and components as needed. Read `AGENTS.md` first.
Delete the mock layer: everything seeded in `hooks/useFundingApi.ts` (the types there are stale: stages, security types and statuses do not match the API), every hard-coded number on the six pages, and every "coming soon" or toast-only button.

## 1. Who sees what (D-FUND-5, read this first)

| | Founder | Team member | Mentor, Business Consultant, Accountant, Legal Advisor | Investor (external) |
|---|---|---|---|---|
| Pipeline, Data room | yes | yes (full) | no (API 403) | **no**: investors have no account access; they only see the public `/dr/{token}` page |
| **Cap table, Term sheets** | yes | **no: 403, hide the tab and guard the route** | no | no |

- **Cap table and term sheets are founder only.** The API answers **403 `FORBIDDEN`** to everyone else, team members included. Equity and offers are the most sensitive data in the product. Hide the two tabs for non-founders and make a direct visit to `/funding/cap-table` or `/funding/term-sheets` land on `/funding` with no message (same pattern as the other role-gated pages).
- Take the role from the existing auth context (`/auth/me`). A 403 on a founder-only call mid-session (role changed under you) hides those tabs and refetches `/auth/me`.
- **`lib/nav-access.ts` is wrong today:** `'/funding': [F, TM, INV]` lets investors in. Change it to `[F, TM]` and add the per-tab rule above (`/funding/cap-table` and `/funding/term-sheets` founder only). Investors never get a `/funding` page; they arrive from an emailed link at `/dr/{token}`.
- **Plan gate:** the module is Scale. When `PLAN_ENFORCEMENT` is on, every route answers **402 `PLAN_REQUIRED`**: show the upgrade prompt (reuse whatever the other Scale-gated pages already show on 402; ask the lead if none exists), never a generic error. It is off today.
- **The sidebar item stays hidden** (`components/sidebar.tsx`, comment at line 63) until **all six pages are real** and re-walked, together with Investor Readiness's CTA. Do not unhide it in this brief. The page tab bar in `app/(dashboard)/funding/layout.tsx` shows **Pipeline, Data room, Cap table, Term sheets** only; remove the Grants and Analytics tabs and make `/funding/grants` and `/funding/analytics` redirect to `/funding`. Do not leave "coming soon" anywhere.

## 2. Conventions for every part (read once; the guides repeat them)

- Every call through `apiClient`; keep `ApiError` handling; refetch after every write instead of editing local state by hand. Errors are `{"error": {"code", "message", "field_errors"}}`; branch on `code`.
- **Money** is an integer in **minor units of the round's currency** (kobo/cents). The round has **one currency** (`NGN` or `USD`, no conversion anywhere). Always show the round's symbol and never mix. Format with the money helper the Finance and Sales pages already use; never use floats.
- **The currency lock (UX consequence):** once any amount exists, the round's currency cannot be changed. An investor's committed amount, a cap table SAFE or share price, or a term sheet's valuation or investment all lock it. A change is refused with **409 `CAP_TABLE_HAS_AMOUNTS`** (the message names what holds amounts) or 422 on a round with investor amounts, and money already recorded in Finance is 409 `ROUND_HAS_RECORDED_MONEY`. Disable the currency control with the reason as a tooltip, and still show the API's message if it is refused.
- Percentages are **basis points** in the cap table, term sheets and comparison (100 = 1%); the pipeline bar's percentages are whole numbers and **are not capped at 100** (P section 3).
- Copy: no em or en dashes in anything rendered. The pages that show a flag, a conversion or a model must show the API's `disclaimer` string.
- States: every list and tab has a loading skeleton, an error with Retry, and the empty text given below.
- 375 px: tab bars scroll horizontally; tables scroll inside their card; drawers and modals are full width with 16 px gutters; the board scrolls horizontally with the column header sticky.

## 3. Part A: Pipeline (`/funding`) (guide P; gap rows 1 to 7, 9, 10, 37, 38)

**Round header and bar.** `GET /funding/overview` (P section 5) and `GET/PUT /funding/round` (P section 4).
- Empty workspace (`overview.empty` true): the empty state "Add your first investor" with one button; **no "Find investors" control** (the directory is not built, D-FUND-1). The first investor creates a planning round by itself.
- The bar shows `committed_minor` of `target_minor`, in two tones: **soft** (Term Sheet with an amount) and **committed**; percentages uncapped (120% is real); `null` percentages mean "no target set" (show "Set a target"). `suggested_target` is a **hint** with an "Use this" action that calls `PUT /round`; never auto-apply. Round name, status (`planning`, `open`, `closed`) and target are editable from the header (PUT).
- **Closed round:** the board is read-only history; adding an investor is **409 `ROUND_CLOSED`** until the founder starts the next round explicitly (`PUT /round` creates it). A next round without a currency keeps the previous round's currency.

**Board.** Seven fixed columns in this order: Research, Outreach, Meeting, Diligence, Term Sheet, Committed, Passed (no custom stages). Cards from `GET /funding/investors` (P section 6); filter by `stage`, `q`, `warm`, `type`.
- Card: name, firm, type chip, warm/cold, cheque range (`check_min_minor` to `check_max_minor`, formatted in the round currency), next step and date (`next_step_overdue` true shows it in the warning colour), last touch.
- Drag or the card menu calls `POST /investors/{id}/stage` with `{stage, position?, passed_reason?, note?}` (P section 7). **Passed needs one of the five reasons** (Valuation, Stage mismatch, Sector conflict, Ghosted, Other): open the reason modal; the API refuses otherwise. Update optimistically and reconcile with the response; on failure put the card back.
- **Add investor** (modal) and **edit** (`PATCH`) with name, firm, type, warm, cheque min/max, next step and date, thesis notes. A new investor cannot be created as Passed. **Delete** is permanent and removes the interaction log: confirm "Delete {name}? Their notes and history are removed."
- **Drawer** per investor: profile, thesis editing, and the **interaction log** (`GET/POST /investors/{id}/events`, kinds note, email, call, meeting; stage changes are written by the system and shown in the same list). "Last touch" comes from the log, not a constant.
- **The drawer's data room chip** ("Shared, viewed Pitch deck") must come from the investor's shares: `GET /funding/data-room/shares?investor_id=` (DR section 4: `status`, `view_count`, `last_viewed_at`). No chip when there is no share. Link it to the Data room tab filtered to that share.
- **Do not build** "Prep me for this meeting" (slice F), the Calendar link on Meeting, or the readiness banner. Correct the footer tip (row 38): it must not say to click the card for a brief.

**Moving to Committed (UX consequence, P section 8).** Moving a card to **Committed** with an amount returns `record_in_finance` (an **offer**). The server has written nothing to Finance. Show the confirm "Record this in Finance?" with the amount; only on Yes call `POST /investors/{id}/record-funding`.
- After the money is recorded, **that investor's amount and the round currency are frozen** (409 `INVESTOR_RECORDED`, 409 `ROUND_HAS_RECORDED_MONEY`): show the amount read-only with "Recorded in Finance".
- **USD rounds:** Finance is naira only, so recording needs a naira amount (`amount_minor` in the body); the form asks for it (P section 8).
- **Ledger size limit:** one Finance entry cannot exceed about ₦21,474,836.47 (a 32-bit limit). `fits_ledger: false` in the offer means one entry cannot hold it: show the API's explanation and let the founder record a smaller part (P section 8). Do not hide the limit.

**Notification.** `funding.round.committed_changed` appears in the bell with CTA "See pipeline" (`/funding`); already handled by the notifications component once the page exists. Nothing to build beyond the link target.

## 4. Part B: Data room (`/funding/data-room`) (guide DR sections 1 to 5; gap rows 11 to 17, 19, 20)

Founder and team member. **Do not build** the investor account path (row 43) or the readiness-score share scope (row 44): neither exists.

- **Empty state** (`set_up: false`): "Your diligence, ready before they ask." with "Set up data room" -> `POST /data-room/setup` (creates Corporate, Financials, Product, Market, Team, Legal; safe to call again).
- **Tree:** folders with their items from `GET /funding/data-room` (DR section 3). Custom folders: create, rename, reorder (`position`), delete (deleting a folder removes its references, never the Documents files; confirm with the item count). Names are unique per workspace, case-insensitive (409 `FOLDER_EXISTS`).
- **Add items by reference** from the Documents library (a picker over the Documents library: files from `GET /documents/files` and rich documents from the documents list): `POST /data-room/folders/{id}/items` with exactly one of `file_id` or `document_id`. Show each Documents chip the picker already has (type, scan). Errors: 409 `FILE_NOT_CLEAN` (the scan has not passed: disable such rows in the picker with the reason), 409 `ITEM_EXISTS`. Never copy a file.
- **Items can vanish:** an item whose file was trashed or failed the scan stays in the founder's list with `available: false` and a `reason`; show a warning chip ("In trash", "Scan pending", "Blocked"). The investor no longer sees it.
- **Share** (modal, "Share data room"): investor email (typed, or picked from the pipeline, which also sets `investor_id`), folders to share (1 to 50), optional expiry (date, or days 1 to 365; none = never), **Allow downloads** (default off), "Send invite" (default on). Response has the copyable `link`; it stays the same every time the share is listed ("Copy link" always works while active, `null` once revoked or expired).
- **D-FUND-8, the download and watermark rules (say them in the UI):**
  - Every PDF the investor opens is **stamped with their verified email and the time of viewing**. This is always on; `watermark` is returned as `true` for display only, **not a toggle**. Show a read-only line "Every page is marked with the viewer's email."
  - With downloads **off** (the default) an investor can only view what can be watermarked: PDFs, your rich Documents (shown as PDF) and PNG/JPEG images. **Anything else (docx, xlsx, pptx, csv, txt, md) is refused** with 422 `VIEW_ONLY_UNSUPPORTED`.
  - The share response carries **`unviewable_items`** (those items in the chosen folders when downloads are off). **Warn the founder before they send:** "These files can't be shown view-only: upload a PDF or allow downloads." with the file names, and offer the "Allow downloads" switch right there. Each item in the room also has `viewable`.
  - With downloads **on**, other types are served as they are, unwatermarked: label the switch "Allowed to download. Downloaded files are not watermarked (PDFs still are)."
- **Share list:** every share with email, investor name, folders, status (`active`, `expired`, `revoked`), `view_count`, `total_duration_s`, `last_viewed_at`. Actions: copy link, edit (`PATCH`: folders, downloads, expiry; **`expires_at: null` clears the expiry, leaving it out leaves it**), **Revoke** (`DELETE`; immediate, even for a viewer mid-document; confirm "Revoke access for {email}? They lose access immediately."). A revoked share cannot be edited or revived: create a new one.
- **Access log tab:** `GET /data-room/access-log` (`share_id`, `limit`, `offset`): viewer email, investor, document name, started, duration. One row per document opened; duration grows with the viewer's heartbeat, so an open row changes. There is no IP in the response.
- **Notification** `funding.dataroom.viewed` ("{Investor} viewed your data room, {doc}"), at most one a day per share; CTA to this tab.

## 5. Part C: The public investor viewer (`/dr/[token]`) (guide DR section 6; gap row 18, D-FUND-3)

A **new public route** with its **own layout**: no sidebar, no shell top bar, no auth, no workspace header. Like the existing `app/shared/[token]`, but with its own code. Set `robots: noindex` in the page metadata. The emailed link is `{APP_BASE_URL}/dr/{token}`. All API calls go to `/funding/dr/{token}/...` **without** `Authorization` or `X-Workspace-Id`.

State machine (DR section 6): dead link -> email step -> code step -> browser -> viewer.
1. `GET /dr/{token}`: **404** is the one neutral page "This link isn't available." (unknown, revoked, expired and mistyped all look the same; do not distinguish). 200 shows the company name only.
2. **Email step:** `POST /dr/{token}/otp` `{email}`. The answer is **identical for any address** and never confirms a code was sent: say "If that address can open this room, a code is on its way." Per-address throttle is **429 `RATE_LIMITED`**; a locked share is **429 `TOO_MANY_ATTEMPTS`**. **The hourly code cap is a silent 202 with no email**: offer "Send a new code" again after a few minutes and "Ask the sender for a new link" as the way out.
3. **Code step:** 6 digits, `POST /dr/{token}/verify` `{email, code}` -> `{session, expires_at}`. Every failure is the same **401 `INVALID_CODE`**; do not say which part was wrong. Keep the session **in memory only** (never the URL, never localStorage) and send it as header **`X-Data-Room-Session`** on every later call. 401 `SESSION_REQUIRED` anywhere = back to the email step.
4. **Browser:** `GET /dr/{token}/tree` (folders and items, `viewable`, top-level `allow_download`). An item with `viewable: false` is shown greyed with "Not available as a view-only copy".
5. **Open a document:** `POST /dr/{token}/items/{id}/open` -> `content_url`, **a path relative to the API origin** (`/api/v1/funding/dr/...`): resolve it with `resolveApiUrl`/`API_BASE`, it is not an FE route. It carries a 2-minute ticket, needs no header, and is the source for an `<iframe>`/PDF.js (PDFs and images-as-PDF), `<img>`/text view for the rest when downloads are on. Call `open` again when it expires. Show "Confidential. This copy is marked with your email." above the document.
6. **Heartbeat:** while a document is on screen **and the tab is visible**, `POST /dr/{token}/heartbeat` `{view_id}` every **15 seconds** (`heartbeat_every_s`); stop on any 404. Never inflate: do not beat from a hidden tab.
7. **Revoked or expired mid-session:** any 404 on tree/open/content/heartbeat -> "This data room is no longer available." and stop everything.
- `?download=true` on the content URL only works when `allow_download` is true; show a Download button only then, with "Downloaded files are not watermarked."
- Errors table: DR section 7. 375 px: folder list and viewer stack (list above, viewer full width); the viewer scrolls inside its frame.

## 6. Part D: Cap table (`/funding/cap-table`, founder only) (guide CT; gap rows 21 to 27, 45)

**Do not build** the data room snapshot of the cap table (row 28): it needs a decision (a Documents file would be visible to team members). Do not build an export.

- **Units (CT section 2):** shares are whole numbers; **ownership is basis points** (`pct_bps`, show `bps / 100` with two decimals; a column sums to exactly 100.00%); price per share is a 6-decimal string in minor units.
- **A SAFE or note has no shares until a round converts it.** The ledger lists it as an **amount** with cap and discount. **Never draw a SAFE as a slice or a percentage of the donut** (this is the mock's bug, row 23). Show them in their own "Convertibles" block with `converting_amount_minor` (principal plus note interest to `as_of`).
- **Ledger** `GET /funding/cap-table?fully_diluted=&as_of=`: holders with their entries. **Fully diluted toggle** (default on): off leaves options and the pool out and their `pct_bps` is `null` (not 0). Donut and table come from the same rows. Totals strip from `totals`. Empty state "Add your first holder".
- **Holders** (founder, employee, advisor, investor, and the one **option pool**; a second pool is 409 `POOL_EXISTS`; the pool holds options only). **Entries** by security: common, preferred, options need shares (price, issue date, vesting start + months + cliff optional); SAFE and note need an amount, may have cap, discount (1 to 9999 bps), post/pre-money kind, MFN; **notes default to pre-money, SAFEs to post-money**; a note with interest needs its issue date. The drawer shows only the fields valid for the chosen security (CT section 4 table). Vesting shows `vested_shares` as of today. Deleting a holder deletes their entries: confirm with the count.
- **Model a round** (`POST /funding/cap-table/model`, nothing saved; CT section 5): rounds (1 to 5) with name, new money, pre-money, pool target (basis points of the post-round fully diluted total). Show the **headline** "You'd go from {a}% to {b}%" (founders' combined stake), the per-step numbers, and the **dilution table** (one row per holder, before and after, change). Pre-money includes the SAFEs and the pool top-up; say so in a footnote. Each conversion shows which term won (`cap`, `discount`, `round`). Refusals are 422 with a code to word (`EMPTY_CAP_TABLE`, `POOL_TARGET_TOO_HIGH`, `SAFE_CAPS_EXCEED`, `CONVERSION_DID_NOT_SETTLE`, `INVALID_ROUND`): CT section 5.
- **Scenarios:** "Save as scenario" (`POST /scenarios` with the same `inputs`), list, open, rename, delete. **A saved scenario is a snapshot**: label it with its date and offer "Re-run on today's numbers" (call `/model` with its `inputs`).
- **Change history** (`GET /cap-table/audit`) as a drawer or tab: who changed what, with before and after.
- **"Draft SAFE"** (row 45) on a SAFE row: a pure FE link into the existing Documents SAFE template flow (no API in this slice).
- The page carries the API's `disclaimer` (estimates, not legal or tax advice) and must not be shown to non-founders (section 1).
- **Field trap:** in the model response the dilution `ref` is the holder id (`round-N` for new investors), while a conversion's `ref` is the SAFE **entry** id (CT section 5). Two SAFEs held by one person are one holder row.

## 7. Part E: Term sheets (`/funding/term-sheets`, founder only) (guide TS; gap rows 29 to 32)

- **Terms are all optional**; an unstated term is absent and **never flagged or compared**. Units: money minor units, `option_pool_pre_bps` basis points, `liq_pref_x100` hundredths (150 = 1.5x), seats counts, `exclusivity_days` days (TS section 2).
- **Add a sheet two ways:** "Enter by hand" (`POST /term-sheets`, saved as confirmed) or "Upload term sheet" (PDF from Documents, `POST /term-sheets/extract`).
- **Sheet states (TS section 3):** `extracting` (poll `GET /term-sheets/{id}` every 3 to 5 s), `needs_confirmation`, `confirmed`, `failed` (`error`: `no_text`, `unreadable`, `file_missing`, `generation_failed`, `over_budget`, `job_failed` -> offer "Enter the terms by hand" or "Try again"). **Only `confirmed` sheets have terms and flags, can be compared or edited.** The same file again returns the existing sheet (200 `deduplicated`); a failed one can be retried. A used-up daily AI allowance is **429 `AI_BUDGET_EXHAUSTED`**: show the "used up for today" state and offer manual entry.
- **The confirm step is the heart of the page.** For a `needs_confirmation` sheet show the form prefilled from `proposed.terms`, each field with its source quote from `proposed.quotes` (only for fields that were found), every field editable, and a plain warning "The AI may be wrong. Check each value against your document." `POST /{id}/confirm` takes **the founder's final values**.
- **Currency check before the form (TS section 5):** if `currency_mismatch` is true the document states a different currency (`document_currency`) than the round (`round_currency`). Show the warning "This document states amounts in {document_currency}; your round is in {round_currency}. Convert the amounts below, or confirm they are already in {round_currency}." The proposed numbers are the document's own, **not converted**. Confirming money terms then needs `acknowledge_currency_mismatch: true` (else 409 `CURRENCY_MISMATCH`).
- **Flags (TS section 6):** per sheet `flags[]` with `title`, `threshold`, `text` (fixed) and `ai_text` (a plainer rewording, `null` until the optional job finishes or if it failed). **Show `ai_text` when present, else `text`, and keep the exact `text` one click away.** Words are "unusual for this stage", **never a verdict**: do not colour a flag red or call a term bad. `GET /term-sheets/rules` is the table the flags come from (show it in an info popover). The page carries the `disclaimer` ("Negotiate with clarity ...") and an "Ask a Legal Advisor to review" shortcut (a link to Documents e-review; no API).
- **Compare** (`GET /term-sheets/compare?ids=a,b,c`, 2 to 6 confirmed sheets): **one column per sheet** (not a fixed A and B), one row per term at least one sheet states, `best` and `worst` highlights (empty on ties, a single stater, or unranked terms), derived `post_money_minor` and `investor_ownership_bps`. Link each column to its investor (`investor_id`). Highlights are a plain ordering, not advice: terms trade off, say so in a footnote. Comparing an unconfirmed sheet is 409 `TERM_SHEET_NOT_CONFIRMED`.
- Edit a confirmed sheet (`PATCH`: `terms` replaces the terms whole, so send the full object; label and investor attach), delete (permanent), history drawer from `GET /term-sheets/audit`.
- Notification `funding.term_sheet.added` ("Term sheet added, comparison updated") goes to other founders; link target `/funding/term-sheets`.

## 8. Out of scope (do not build)

Grants (rows 33 to 36, 46, 47), Analytics (rows 39 to 42), "Prep me for this meeting" (row 8), the readiness banner (49), the Calendar link on Meeting (50), investor accounts (43), the readiness scope on a share (44), the cap table snapshot in the data room (28), the investor directory ("Find investors"), unhiding the Funding sidebar item, and any "coming soon" placeholder.

## 9. Acceptance = the re-walk rows

Done means every row passes on merged `develop`, at 1440 and 375, as **founder** (rows 1 to 33), **team member** (rows 34 to 38) and a **mentor** (row 39), each result matching the raw API. Rows 22 to 26 are the public viewer: use a real emailed link (file or Resend mailbox).

| # | Row | Pass when |
|---|---|---|
| 1 | Open `/funding` with no round | Empty state "Add your first investor"; no mock cards; no "Find investors" |
| 2 | Add an investor; set a target and currency | Round appears; bar shows it in the right symbol; percentages uncapped; reload keeps it |
| 3 | Drag a card across stages; move one to Passed | Reason modal appears, five reasons; the move persists; history in the drawer |
| 4 | Move a card to Committed with an amount | "Record this in Finance?" appears; nothing written until Yes; after Yes the amount is read-only and the currency control is disabled with a reason |
| 5 | USD round, record the money | Form asks for a naira amount; a too-large amount shows the ledger-size message |
| 6 | Close the round, then add an investor | 409 message shown; board is read-only; "Start next round" works |
| 7 | Drawer: add a note, call, meeting; edit thesis; delete investor | Log rows persist; delete confirm copy exact; log gone with it |
| 8 | Set up the data room | Six standard folders; empty state copy exact |
| 9 | Add a Documents file and a rich Document; try a scan-pending file; add a duplicate | Items listed; pending file disabled with reason; duplicate shows the API message |
| 10 | Trash a Documents file that is in the room | Item shows a warning chip; the investor view no longer lists it |
| 11 | Create a share (typed email, two folders, expiry 7 days) | Invite sent; link copyable and unchanged on reload; status active |
| 12 | Share a folder with a .docx while downloads are off | Warning names the file before sending; "Allow downloads" resolves it |
| 13 | Edit a share (downloads on, expiry cleared with null, narrow the folders) | Each change persists and applies to a viewer already inside |
| 14 | Revoke a share while an investor has a document open | Their next call is the neutral dead-link page; the share cannot be edited |
| 15 | Pipeline card chip | Shows the real share status and last view; none without a share |
| 16 | Access log | Viewer, document, time, duration match `GET /data-room/access-log`; duration grows while open |
| 17 | Open `/dr/{token}` for a dead, revoked and mistyped link | The same neutral page for all three |
| 18 | Ask for a code with the invited address and with a stranger's | Same message both times; mail only to the invited one |
| 19 | Wrong code, then the right one | Same error for every wrong case; session works; no token in the URL or localStorage |
| 20 | Open a PDF | Every page shows the viewer's email and time; heartbeat every 15 s (and none from a hidden tab) |
| 21 | Open a .txt with downloads off, then on | Off: greyed with the reason, 422 never shown raw; on: opens, Download shown with the unwatermarked note |
| 22 | Throttle: five wrong guesses; ten code requests | Clear throttle messages; the hourly code cap shows the "ask for a new link" way out |
| 23 | Keep a document open until the session or share expires | Back to the email step (401) or the no-longer-available page (404); heartbeats stop |
| 24 | Add holders, a pool, common, options with vesting, a SAFE, a note | Ledger and donut match `GET /cap-table`; SAFEs only in the convertibles block; vested shares shown |
| 25 | Toggle fully diluted | Basic view leaves options and pool out; their percentages are blank, not 0 |
| 26 | Model a round with a pool target; then two rounds | Headline, steps, dilution table equal the raw `/model`; conversions name the winning term; refusal codes worded |
| 27 | Save, open, rename, delete a scenario; change the cap table; reopen | Scenario shows its saved numbers with its date; "Re-run" uses today's |
| 28 | Cap table change history | Rows equal `GET /cap-table/audit` |
| 29 | Try to change the round currency with amounts present | Control disabled with the reason; the API's 409 message shown if forced |
| 30 | Upload a term sheet PDF | Extracting state polls; then the confirm form with quotes; nothing counts before confirming |
| 31 | Upload a PDF whose document currency differs | Warning shown; confirming money without acknowledging is refused |
| 32 | Enter a sheet by hand that trips rules; reword job lands | Flags show `ai_text` when present, with the exact text one click away; no red verdict styling; disclaimer visible |
| 33 | Compare three sheets | One column each; highlights match the API; unconfirmed sheet cannot be picked; history drawer matches audit |
| 34 | Team member opens `/funding` | Pipeline and Data room work fully |
| 35 | Team member visits `/funding/cap-table` and `/funding/term-sheets` | Tabs are hidden; direct visits land on `/funding` |
| 36 | Team member's API calls to the two founder pages | 403, nothing leaks into the UI |
| 37 | Team member opens the bell | No cap table or term sheet notifications |
| 38 | `/funding/grants` and `/funding/analytics` | Redirect to `/funding`; no tabs for them |
| 39 | Mentor opens `/funding` | Denied page / redirect as the other role-gated pages |
| 40 | 375 px, every page | Every control reachable; no overflow or clipped text; viewer and tables scroll inside their frames |
