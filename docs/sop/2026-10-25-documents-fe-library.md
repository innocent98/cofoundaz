# SOP: Documents FE (library, trash, versions, sharing, Shared with me)

## What shipped
Branch `feature/documents-fe`, one PR to `develop`. The front end for API BE-A (#185) and BE-B (#187):
`cofoundaz-api/docs/fe-integration-guide-documents-library.md` plus the four older Documents guides. Row 10 (the editor save wiped
folder and status) is its own first commit (`d971717`).

## Why
The 2026-10-24 walk (`docs/checklist/documents-prd-gaps.md`, 38 gaps) found a library with no actions, versions, trash, viewer or folders, false
success toasts, role-blind controls, a mentor shown the whole workspace, and a 375 px layout that hid the controls. BE-A and BE-B gave the
API; this slice makes the pages use it. Product calls: D-DOC-1 (per-person grants, Shared with me, link kept), D-DOC-3 (15 MB, say so).

## How
| Area | Change | Decision or trade-off |
|---|---|---|
| API layer | `lib/api/documents.ts`: one typed module for every route (shapes copied from the live captures), `hasFullLibrary(role)`, `uploadProblem()` | Replaces four ad-hoc hooks (`useDocuments`, `useDocumentFiles`, `useDocumentShares`, the dead mock `useDocumentsApi`, row 35) |
| Library (`/documents`) | One list of documents and files with owner, tags, Private/Shared chip, scan state, size; server search (`q`, debounced 250 ms); real folder tree with counts, New / Rename / Delete folder; Uncategorised and Trash entries; Grid and List both use a per-row actions menu (open, rename, move, tags, share or download, Ask AI, Move to Trash) | Folder filter is the API's exact-path filter, so a parent folder lists only its own items; counts are the subtree total. At < 1024 px the tree becomes a select |
| Upload | Multi-file queue (one at a time, per-file state and error), drag anywhere with a "Drop files to upload" overlay, client check of type, size (15 MB) and empty files, text says the limit and that files are scanned; `scan_status` chips (Scanning, Blocked) | State per file, not byte progress: `fetch` has no upload progress and an XHR path would duplicate the client's token refresh |
| Trash | Soft delete everywhere with a confirm; Trash view with days left, Restore, Delete forever (confirm); copy says shared items stay hidden until restored | |
| Versions | Drawer (`components/documents/version-drawer.tsx`): list, Preview, line diff against the current text, Restore with the confirm "saves it as a new version" | Diff is computed in the browser from the two versions (`diffLines`) |
| Viewer | Signed 5-minute content link; PDF through a blob in a frame (the file is served with a sandbox policy that stops the browser PDF viewer in a frame), images, text, Markdown (as text) and CSV (table); DOCX/XLSX/PPTX get "download to open"; Download button | No converter library added. Over a relative API base (the dev proxy) the link is read same-origin; on staging it needs the API CORS list to include the app origin |
| Editor | Header: Share, Version history, Ask AI, Move to Trash, Save; Status and Folder fields; Save echoes `status`/`folder` (row 10); section controls always visible on touch; 44 px targets | Folder is a free path with suggestions; saving sends it in the PUT |
| Share dialog | People with access (add by email, Can view / Can comment, change, remove, "Invited" for non-members), and "Anyone with the link" (email a read-only link, shown once, list and revoke) | `edit` is not offered (API 422). The old link flow is kept as is; the "anyone with the link" toggle with no email is BE-D |
| Shared with others | Both grants and links in one list with revoke; failures toast the API message | The old unreachable modal is deleted (row 35) |
| Shared with me | `/documents/shared-with-me` list and `/[id]` read-only view with comments (box only for Can comment), a clear "no longer shared" state | Any role, no library calls |
| Roles | `layout.tsx` gate: F and TM get five tabs; every other role gets only Shared with me and any other `/documents/*` URL redirects there, a bell link `/documents/{id}` becomes `/documents/shared-with-me/{id}` | The gate waits for `/auth/me`, so a mentor never fires a library request (e2e asserts none are sent) |
| Errors | Toast has an error kind and one timer (an older toast no longer cuts a newer one short); every action checks the result; Signatures Remind and Cancel return `{ok, error}`; failed loads show Try again, no-match search shows "No matches" | |
| Notifications | `notificationHref` follows `data.href` for `document.*` (only `/documents` paths) with list fallbacks | Replaces the `null` href test |
| Copy | Simple e-signature footnote in the send modal; the sign page no longer promises "their turn" | |

## What's involved
`lib/api/documents.ts`, `lib/documents-format.ts`, `hooks/useDocumentsLibrary.ts`, `hooks/useDocumentEditor.ts`, `hooks/useSignatureRequests.ts`,
`hooks/useNotifications.ts`, `components/documents/{ui,share-dialog,version-drawer,file-viewer,row-menu}.tsx`,
`app/(dashboard)/documents/{layout,page,ToastContext,[id]/page,shared/page,shared-with-me/page,shared-with-me/[id]/page,signatures/page,templates/page}.tsx`,
`app/sign/[token]/page.tsx` (one sentence). Removed: `hooks/useDocuments.ts`, `useDocumentFiles.ts`, `useDocumentShares.ts`, `useDocumentsApi.ts`.
No API change, no migration, no new dependency.

## Verification
- Unit: `lib/api/documents.test.ts`, `lib/documents-format.test.ts`, `hooks/useDocumentEditor.test.ts`, `hooks/useSignatureRequests.test.ts`, `hooks/useNotifications.test.tsx`.
- E2E (mocked with the captured shapes): `e2e/documents.spec.ts` (founder library, trash, error state, 375 px touch targets, mentor and investor Shared with me, revoked document).
- Live walk: `docs/checklist/documents-fe-walk.md` (every control as founder, team member and mentor at 1440 and 375, including the grant round trip
  founder grants by email, mentor sees it, comments, downgrade to Can view removes the box, revoke gives 404).
- Local CI parity: see the PR (tsc, eslint, `npm test` on Node 20, `npm run build`, Playwright `CI=1`).

## Operate / roll back
Revert the PR; the API is untouched. Nothing to configure. For the text and image preview on staging, the API's `BACKEND_CORS_ORIGINS` must include the app origin.

## Follow-ups
- Waiting on BE-C: rows 12 (export so any document can be signed), 13 (template instantiate with auto-fill), 18 (legal templates). BE-D: rows 16, 17, 31 and the e-sign v2 UI (order, viewed, executed PDF, anyone-with-the-link share without an email).
- PDF preview should be confirmed in a real browser on staging; DOCX/XLSX/PPTX preview needs a converter.
- Row 24 progress is per file, not per byte. Row 21 does not drag a document into a folder (Move to folder is a dialog).
- Grants on files and "Can edit" are not in the API yet.
