# Documents FE: live walk (2026-10-25)

Branch `feature/documents-fe`, FE in its own `next dev` on :3920, proxied to the shared local API on :8000
(BE-A #185 + BE-B #187 + migration 0073). Workspace NovaPay. Every row below was driven through the real UI by a scripted
browser walk (Playwright, one browser context per role, no mocks) and, where it changes data, read back from the API.
Roles: **founder** (`throwaway-founder`), **team member** (`rewalk-tm`), **mentor** (`bb-mentor-1`). Credentials are in
`docs/HANDOFF-master.md` section 1 and are not repeated here. Emails used for shares and links were Resend sink addresses.

Results: **95 of 95 checks pass at 1440 px, 93 of 93 at 375 px**. The 375 run skips the grid-view touch audit only.
Touch-target rows check every control inside the Documents pages, dialogs and menus is at least 44 px high.

| Area | Check | 1440 | 375 |
|---|---|---|---|
| founder-library | Library loads with tabs Library/Templates/Signatures/Shared with others/Shared with me | pass | pass |
| founder-library | rows show owner name, date and Private/Shared chip (row 22) | pass | pass |
| touch | library (list): every control at least 44px high | pass | pass |
| layout | library (list): no horizontal page scroll | pass | pass |
| founder-library | server search "swot" narrows the list (row 20) | pass | pass |
| founder-library | search with no hit shows "No matches" (row 34) | pass | pass |
| founder-library | Grid view has an actions menu on every card (row 23) | pass | pass |
| touch | library (grid): every control at least 44px high | pass | n/a |
| layout | library (grid): no horizontal page scroll | pass | n/a |
| founder-library | New document menu offers Blank / From a template / Upload a file (row 33) | pass | pass |
| editor | blank document opens in the editor | pass | pass |
| touch | editor: every control at least 44px high | pass | pass |
| layout | editor: no horizontal page scroll | pass | pass |
| editor | Save with status Final and folder succeeds | pass | pass |
| editor | row 10: second save keeps folder and status (API read-back) | pass | pass |
| versions | drawer lists 3 versions with Current badge | pass | pass |
| versions | Preview shows version 1 content | pass | pass |
| versions | Changes vs current shows a diff | pass | pass |
| versions | Restore asks for confirmation and explains it creates a new version | pass | pass |
| versions | Restore creates version 4 with the old content | pass | pass |
| editor | Ask AI opens the assistant drawer | pass | pass |
| share | add by email as Can view (grant listed) | pass | pass |
| touch | share dialog: every control at least 44px high | pass | pass |
| layout | share dialog: no horizontal page scroll | pass | pass |
| share | change to Can comment | pass | pass |
| share | duplicate grant shows the API message (409) | pass | pass |
| share | grantee who is a team member shows the API message (422) | pass | pass |
| share | anyone-with-the-link: link shown once | pass | pass |
| mentor | /documents sends a mentor to Shared with me (row 27) | pass | pass |
| mentor | mentor sees only the Shared with me tab | pass | pass |
| mentor | granted document listed with Can comment chip | pass | pass |
| touch | mentor shared list: every control at least 44px high | pass | pass |
| layout | mentor shared list: no horizontal page scroll | pass | pass |
| mentor | /documents/templates redirects to Shared with me | pass | pass |
| mentor | /documents/signatures redirects to Shared with me | pass | pass |
| mentor | /documents/shared redirects to Shared with me | pass | pass |
| mentor | a bell link /documents/{id} lands on the shared view | pass | pass |
| mentor | shared document is read-only (no editor controls) | pass | pass |
| mentor | Can comment: post a comment and see it | pass | pass |
| touch | mentor shared document: every control at least 44px high | pass | pass |
| layout | mentor shared document: no horizontal page scroll | pass | pass |
| mentor | after downgrade to Can view the comment box is gone | pass | pass |
| founder-shared | Shared with others lists the person grant and the link | pass | pass |
| touch | shared with others: every control at least 44px high | pass | pass |
| layout | shared with others: no horizontal page scroll | pass | pass |
| founder-shared | revoke a person grant, toast and row gone | pass | pass |
| mentor | after revoke the document is 404 for the mentor ("no longer shared") | pass | pass |
| mentor | API read after revoke is 404 | pass | pass |
| mentor | empty state explains what Shared with me is | pass | pass |
| founder-shared | revoke a link | pass | pass |
| menu | row menu lists Open/Rename/Move/Edit tags/Share/Ask AI/Move to Trash | pass | pass |
| menu | Rename | pass | pass |
| menu | Move to folder (creates the folder) | pass | pass |
| menu | Edit tags | pass | pass |
| search | search finds a document by tag (row 20) | pass | pass |
| folders | folder navigation filters to the folder (row 21) | pass | pass |
| folders | rename folder re-points its documents | pass | pass |
| folders | deleting a non-empty folder shows the API message (409) | pass | pass |
| trash | trash asks for confirmation (row 8) | pass | pass |
| trash | trashed document is 404 on the live route | pass | pass |
| trash | Trash view lists it with days left | pass | pass |
| touch | trash: every control at least 44px high | pass | pass |
| layout | trash: no horizontal page scroll | pass | pass |
| trash | Restore brings it back | pass | pass |
| trash | Delete forever removes it (second permanent delete is 404) | pass | pass |
| upload | upload UI states the 15 MB limit and scanning (row 25/D-DOC-3) | pass | pass |
| upload | multi-file queue: txt Uploaded, exe rejected, 16 MB rejected | pass | pass |
| upload | uploaded file lands in the list | pass | pass |
| touch | upload queue: every control at least 44px high | pass | pass |
| layout | upload queue: no horizontal page scroll | pass | pass |
| upload | drag-anywhere overlay "Drop files to upload" (row 24) | pass | pass |
| viewer | text file opens inline (row 11) | pass | pass |
| viewer | Download opens the signed link (a request to /documents/files/download?token=) | pass | pass |
| menu | file menu has Download and no Share | pass | pass |
| trash | file moved to Trash (soft delete, row 8) | pass | pass |
| templates | Templates tab navigates with no toast (row 33) | pass | pass |
| touch | templates: every control at least 44px high | pass | pass |
| layout | templates: no horizontal page scroll | pass | pass |
| signatures | send-for-signature modal carries the simple e-signature footnote (row 36) | pass | pass |
| touch | signature modal: every control at least 44px high | pass | pass |
| layout | signature modal: no horizontal page scroll | pass | pass |
| touch | signatures: every control at least 44px high | pass | pass |
| layout | signatures: no horizontal page scroll | pass | pass |
| templates | Use template creates a document and returns to the Library | pass | pass |
| signatures | add and remove a signer row | pass | pass |
| signatures | request sent, signer link shown once | pass | pass |
| signatures | Remind confirms only after the API said yes | pass | pass |
| signatures | Cancel confirms only after the API said yes | pass | pass |
| touch | signatures with a request: every control at least 44px high | pass | pass |
| layout | signatures with a request: no horizontal page scroll | pass | pass |
| team-member | team member gets the full library (5 tabs) | pass | pass |
| team-member | team member sees the full row menu | pass | pass |
| team-member | team member can open Share on a new document | pass | pass |
| touch | team member editor: every control at least 44px high | pass | pass |
| layout | team member editor: no horizontal page scroll | pass | pass |

## Not covered by the walk (be honest about it)

- **Consultant, accountant, legal advisor, investor in the browser:** closed by the BE-C walk below (section "Role walk").
- **PDF preview pixels:** closed by the BE-C walk below (the exported NDA renders two pages with the boxed legal notice).
- **Text and image preview against a cross-origin API:** locally the signed link is read through the dev proxy (same origin). On staging the
  API origin differs, so the text viewer needs the API's CORS list to include the app origin (it already must for every other call);
  if the fetch fails the viewer falls back to the download prompt.
- **The 30-day purge** (worker job, unit-tested in the API) and **email delivery** of grant and link emails (sink addresses, bodies not read).
- **Ask AI** opens the assistant drawer with the document text as the first message; the reply was not read (the drawer is not part of this slice).
- **Test data left behind:** `walk-test.pdf` and `walk-valid.pdf` in the `Walk` folder, and one cancelled signature request on
  `walk-valid.pdf` (a file with a request cannot be trashed). Everything else the walk created was permanently deleted.

## BE-C walk: templates, AI drafts, legal disclaimer, export (2026-10-25)

Branch `feature/documents-templates-export`. FE dev server on port 3107 against the shared API (`localhost:8000`, develop with BE-C).
Founder `throwaway-founder@example.com`, workspace NovaPay. A real model drafted the AI text (not the stub). Pane at 1440-class width
(pane scales down; no horizontal scroll) and 375 x 812 emulated.

### Founder, generator and export

| Area | Control or behaviour | Result at 1440 | Result at 375 |
|---|---|---|---|
| templates | Catalog lists 9 templates in four groups Legal (4), Financial (1), Pitch (3), Operational (1); legal cards say "Draft, not legal advice" | pass | pass |
| templates | "Use template" is a link to `/documents/templates/{key}` (no document is created from the gallery any more) | pass | pass |
| generator | NDA: banner shows the API's disclaimer text, `role=note` | pass | pass |
| generator | NDA: Disclosing party prefilled "NovaPay" with chip "From your profile" | pass | pass |
| generator | NDA: Create document disabled while receiving party, purpose, governing law are empty, with the "Fill in ..." line | pass | pass |
| generator | NDA: filling the three fields enables Create; the document opens in the editor with the clause text completed and the banner above the editor | pass | pass |
| generator | Business plan (NovaPay): sections filled from Business Builder carry "From Business Builder", Team and The Ask say only the founder knows them | pass | not re-walked |
| generator | Pitch deck: "Why Now" empty and draftable, checkbox "Let AI draft this section" on by default, button reads "Create and draft with AI" | pass | not re-walked |
| generator | Unticking the only AI checkbox changes the button to "Create document" (Financial Model) | pass | not re-walked |
| ai | Create and draft: the editor shows "AI is drafting Why now", then "AI drafted Why now." and the page reloads to v2 on its own with the text in the section (real model: Chinedu example, about 2 hours of reconciliation) | pass | not re-walked |
| ai | "Draft empty sections with AI" on a Financial Model with an empty draftable section starts a job (banner appears, button hides) | pass | not re-walked |
| ai | Typing in the editor while the job runs: when it finishes the banner "AI added a new version of this document while you were editing." with Reload latest, instead of overwriting the typing | pass | not re-walked |
| export | Editor Export button opens the dialog: version number, PDF and DOCX radios, Latin-1 note, "The legal notice is printed on the export." | pass | pass (no horizontal scroll, dialog 16 px from each edge) |
| export | Export as PDF: "Exported.", file name, size, version, chip "Scan clean", Download enabled | pass | pass |
| export | Export PDF again: "Already exported. Nothing has changed since, so this is the same file." (API 200) | pass | not re-walked |
| export | Export as DOCX from the library row menu "Export as PDF or Word": new DOCX 37 KB, scan clean | pass | not re-walked |
| export | Earlier exports list (file type, version, date, size, scan chip, download icon); the just-made file is not listed twice | pass | pass |
| export | Download opens the signed link; curl of that link returned 200, `application/pdf`, 4444 bytes, starts `%PDF-1.4`, `content-disposition: attachment` | pass | not re-walked |
| library | Exports show as "Exported from version 1"; the file menu has Download and Open source document | pass | not re-walked |
| viewer | The exported PDF opens in the viewer and paints 2 pages, the first with the boxed disclaimer (**PDF preview pixels, closed**) | pass | not re-walked |
| version history | Drawer has "Export current version" (closes the drawer, opens the export dialog) and says older versions must be restored first | pass | not re-walked |

### Role walk (the four items #167 could not verify)

Role accounts: `bb-mentor-1`, `bb-consultant-1`, `rewalk-tm`, plus local-only `doc-accountant`, `doc-advisor` (memberships added in the local DB as
accountant and legal_advisor) and `doc-investor` (verified account with no membership, the outside-investor case). All password `Throwaway123!`.

API matrix (HTTP status per route, from `curl` against `localhost:8000`, header `X-Workspace-Id` = NovaPay):

| Account | Role | catalog | template form | instantiate | export | ai-draft | library list |
|---|---|---|---|---|---|---|---|
| throwaway-founder | founder | 200 | 200 | 201 | 200 | 422 (nothing to draft) | 200 |
| rewalk-tm | team_member | 200 | 200 | 201 | 200 | 422 (nothing to draft) | 200 |
| bb-mentor-1 | mentor | 403 | 403 | 403 | 403 | 403 | 403 |
| bb-consultant-1 | business_consultant | 403 | 403 | 403 | 403 | 403 | 403 |
| doc-accountant | accountant | 403 | 403 | 403 | 403 | 403 | 403 |
| doc-advisor | legal_advisor | 403 | 403 | 403 | 403 | 403 | 403 |
| doc-investor | none (outside investor) | 403 | 403 | 403 | 403 | 403 | 403 |

Browser (host per role, so localStorage is separate; 375 x 812 emulation):

| Role (host) | Visit | Result |
|---|---|---|
| accountant (`ac.localhost`) | `/documents/templates/nda` | redirected to `/documents/shared-with-me`; only `/documents/shared-with-me` was requested; tab bar shows Shared with me only |
| legal advisor (`ad.localhost`) | `/documents/templates/nda` | same |
| outside investor (`inv.localhost`) | `/documents/templates/nda` | same |
| consultant (`bc.localhost`) | `/documents/{founder doc id}` | redirected to `/documents/shared-with-me/{id}`, "no longer shared" message, no library request |
| team member (`tm.localhost`) | NDA generator, fill three fields, Create | document created at 375, banner shown, no horizontal scroll |
| mentor (`m.localhost`) | covered by the #167 walk and the API matrix above | not repeated |

### Not exercised live in this walk

- **AI result states `partial`, `failed`, `over_budget`, `gone`, `nothing_to_draft`, `429 AI_BUDGET_EXHAUSTED`, `409 AI_DRAFT_IN_PROGRESS`** and the export 429, 404-on-trashed,
  422 too-large: the live stack cannot be forced into them. They are covered by mocked Playwright (`e2e/documents-templates.spec.ts`, shapes from the guide) only.
- **Pending and blocked scan on an export** (Download disabled, blocked copy): mocked only; every real export was already `clean`.
- **Send an export for signature** from the UI: untouched here (the signature modal lists files, and exports are files); the API did it live in the guide.
- **Version-specific export:** the API exports the current version only, so the UI says so; there is nothing to walk for an older version.
- **Test data left behind** (local only): documents "Non-Disclosure Agreement", "Pitch Deck", "Financial Model" and the PDF and DOCX exports, plus a TM-made NDA, in NovaPay.
