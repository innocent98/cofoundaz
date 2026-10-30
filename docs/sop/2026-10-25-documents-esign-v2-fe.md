# SOP: Documents FE for BE-D (e-sign v2, executed PDF, link shares)

## What shipped
Branch `feature/documents-esign-v2-ui`, one PR to `develop`. The front end for API BE-D (#190) and its review fixes (#191):
`cofoundaz-api/docs/fe-integration-guide-documents-esign-v2.md`. Closes the FE halves of gap rows 15, 16, 17, 31 and 37.

## Why
After BE-A to BE-C the Signatures tab could only send and cancel, signers could not be ordered, nothing showed that a signer had opened the
link, a completed request left no executed document, and "anyone with the link" needed an email and had no expiry or copy-again.

## How
| Area | Change | Decision or trade-off |
|---|---|---|
| API layer | `lib/api/signatures.ts` (editor and public signer calls, `normaliseRequest`), link-share calls in `lib/api/documents.ts` (`createLinkShare`, `setShareExpiry`, `revokeLinkShare` for documents and files) | `normaliseRequest` fills BE-D fields, so a half-deployed API shows plain rows instead of crashing |
| Send (`send-dialog.tsx`) | Only clean PDFs selectable (others disabled "export to PDF first"), signers with order numbers and move arrows when "one after another" is on, message with the default sentence as placeholder, expiry 7/14/30/90 days or never, field errors on the signer row, result dialog with a link per released signer and "Waits for X" for the rest | Entry points: Signatures "New request", Library file menu "Send for signature" (`?file=`), Export dialog "Send this PDF for signature". Word files get "export as PDF first" |
| Request cards (`request-card.tsx`) | Sent, expiry and completed times; per signer Awaiting / Viewed / Signed / Waiting with times; Copy link (confirm, then recorded; hidden for waiting and signed signers); Remind (confirm that old links stop working); Cancel (confirm); Details with message, IP and user agent, link audit lines, SHA-256, legal caveat | A cancelled or expired request labels unsigned signers "Not signed" |
| Executed copy | `ready`: download via the signed link; `pending`: "Preparing" and the list refreshes every 3 s for 60 s, then "taking longer, we will email it"; `legacy`: plain statement that no executed copy exists | `LINK_NOT_RECOVERABLE` tells the editor to send a reminder |
| Public sign page | Message and sender, expiry, legal caveat next to consent, blob PDF preview, typed-name sign, then the signer's executed copy with polling on `EXECUTED_NOT_READY`; every dead token is one "no longer valid" page | The API serves files under a sandbox policy that blanks a framed PDF, so `useBlobPreview` frames a blob copy (also used on the shared page) |
| Link shares (`share-dialog.tsx`) | "Anyone with the link" (no email) with 7/30/90 days, a date, or never; list with Copy again, Change expiry, Revoke; email-a-link kept; the same dialog for uploaded files (view only, no people section) | Clipboard copy is best effort (`lib/clipboard.ts`), so a blocked clipboard never fails a created link. Shares made before BE-D have no link and say to make a new one |
| Public shared page | Renders `kind: file` (preview, Download) and shows the legal notice on documents | |
| Locked files | Moving a signed or executed file to the Trash explains it is part of a signature record | |

## What's involved
`lib/api/signatures.ts`, `lib/api/documents.ts`, `lib/api/client.ts` (`resolveApiUrl`), `lib/documents-sign.ts`, `lib/clipboard.ts`, `hooks/useSignatureRequests.ts`,
`hooks/useBlobPreview.ts`, `components/documents/{send-dialog,request-card,share-dialog,export-dialog,file-viewer}.tsx`,
`app/(dashboard)/documents/{signatures,shared,page}.tsx`, `app/sign/[token]/page.tsx`, `app/shared/[token]/page.tsx`. No API change, no migration, no dependency.

## Verification
- Unit: `lib/documents-sign.test.ts`, `hooks/useSignatureRequests.test.ts` (kept).
- Mocked e2e: `e2e/documents-esign.spec.ts` (request states, copy audit, executed states, send flow, errors, sign page and executed polling, file link shares, walk fixes).
- Live: `docs/checklist/documents-fe-walk.md` (BE-D section): two-signer sequential round trip through the public page, Viewed, Signed, audit line, anyone-with-link shares with expiry on a document and a file then revoke, signing a BE-C export, DOCX 422 at the API, founder, team member and mentor at 1440 and 375.

## Operate / roll back
Revert the PR; the API is untouched. The executed PDF needs the worker to read the same file storage as the API; on the local stack it could not (see follow-ups).

## Follow-ups
- Re-run one signing once api and worker share an uploads volume, to see the executed copy go pending to ready and download it.
- Field placement on the PDF is not built (API decision), so the send dialog says signatures are added on a page at the end.
- Sharing exported or executed files by grant is still not in the API.

## Update: re-walk fixes (`fix/documents-rewalk-fixes`)

Defects from the hand re-walk (`docs/checklist/documents-rewalk.md`), fixed in one PR:

| Defect | Fix |
|---|---|
| D1 Copy link gave nothing to copy when the clipboard was blocked | `share-dialog.tsx` keeps a set of links the browser refused to copy and shows each in a read-only, click-to-select field under its row (documents and files). The toast now points at that field |
| D2 Old completed requests spun forever on "Preparing the executed copy" | `executedUi(e, completedAt)` in `lib/documents-sign.ts`: a pending copy more than 2 minutes after completion is `delayed`: plain copy "The executed copy is taking longer than usual. Check back later.", a Check again button, no spinner and no polling. Inside the window the spinner and 3 s polling stay, and the existing 60 s cap now uses the same copy. `executed.state` of `failed` or `unavailable` (not in the guide yet) reads "could not be made" |
| D3 Add section left focus in the title | The editor focuses the new section's heading and selects "New section", so typing names it |
| D4 Signup ignored `?email=` | `AuthForm` takes `initialEmail`; `/signup` reads `email` from the query (one plain address only, in a Suspense boundary). The terms checkbox is 20 px (was 16) |
| Share rows truncated at 375 | Rows and dialog lines wrap instead of cutting, with the controls wrapping under the text |
| Comment authors with no profile name read "Unknown" | `personName` returns "A member" (the API sends `author.name: null` and no email) |

Verification: `docs/checklist/documents-fe-walk.md` (re-walk fixes section), unit tests (`lib/documents-sign.test.ts`, `lib/documents-format.test.ts`, `ui/marketing/auth/auth-form.test.tsx`), mocked e2e in `e2e/documents-esign.spec.ts`.
Not in this PR: D5 (no investor invite; Funding) and the BE half of D2 (backfill stuck requests).
