# SOP: Documents FE for BE-C (template generator, AI drafts, legal disclaimer, export)

## What shipped
Branch `feature/documents-templates-export`, one PR to `develop`. The front end for API BE-C (#189):
`cofoundaz-api/docs/fe-integration-guide-documents-templates-export.md`. Closes the FE halves of gap rows 12 (export), 13 (generator and AI
fill), 18 (Legal category and the four legal templates) and D-DOC-4 (disclaimer). The e-sign v2 UI (BE-D) is not in this PR.

## Why
After #167 the Templates tab still made a blank document in one click, grouped by invented categories, with no auto-fill, no AI and no way to
turn a document into a PDF or Word file (so a rich document could not be signed). BE-C added the API; this slice uses it.

## How
| Area | Change | Decision or trade-off |
|---|---|---|
| Catalog (`/documents/templates`) | Groups by the API's `category` (Legal, Financial, Pitch, Operational); each card links to the generator; a load failure shows Try again | The old FE category guesser is deleted. "Use template" no longer creates anything |
| Generator (`/documents/templates/[key]`) | Reads the form state (`GET /document-templates/{key}`): title, folder, legal fields with source chips ("From your profile"), a preview of each section with "From Business Builder" or "Empty", and a "Let AI draft this section" checkbox on each empty draftable section (on by default). Create is disabled until every required field is filled (the API would accept a bracketed gap, so the FE blocks it, as the guide advises). Sends only edited values, `ai_draft` and `ai_sections` (only when a subset is chosen) | Section text is read-only here because `instantiate` only takes field values; editing happens in the editor. Legal clauses show "completed from the details above" instead of the server preview, which would show stale `[Receiving party]` brackets |
| Disclaimer | `DisclaimerBanner` renders the API's `disclaimer` string, never a local copy, above the generator form and the editor, not dismissible | The editor reads `doc.disclaimer`; the export dialog says the notice is printed on the file |
| After create | Redirect to the editor (not the library): the AI job is tracked there. The toast says the document is in the library and its folder. The job id travels in `sessionStorage` (`lib/documents-ai-handoff.ts`) | A reload still works because the editor can start a new draft; the handoff is only for the first visit |
| AI draft status (`ai-draft-status.tsx`) | Polls `GET /jobs/{id}` every 2 s for 10 s then every 5 s, gives up after 2 min with "Check again". Outcome comes from `result.status` (ready, partial, failed, over_budget, gone), not the job status. Copy per outcome in `lib/documents-ai.ts`; retry only where the API allows it | When a new version was written the editor reloads quietly (`refreshQuietly`, no skeleton, so the banner stays). If the person has unsaved typing it shows the conflict banner "AI added a new version while you were editing" instead of overwriting |
| Retry | "Draft empty sections with AI" in the editor header, shown only when the template allows AI and an empty draftable section exists. 422, 409 and 429 show the API's own message | Draftable keys come from the template form; section headings map to keys with the same slug rule as the API |
| Export (`export-dialog.tsx`) | Format radios, current version shown, warns about unsaved edits and `[bracket]` gaps, calls `POST /documents/{id}/export`, shows file, size, scan chip and Download (signed link, disabled until the scan is clean). 200 reads "Already exported" (new `apiClientWithStatus`). Earlier exports listed with type and version. Reachable from the editor, the library row menu and the version drawer | Export is always the current version (the API has no version parameter); the dialog and drawer say to restore an older version first |
| Library | Export rows say "Exported from version N"; file menu adds Open source document | Uses the new `origin` and `source_*` file fields |
| Errors | Every guide error has real copy: 429 (rate limit and `AI_BUDGET_EXHAUSTED`), 409 in progress, 404 trashed, 403 role, 422 (field errors map to the field via `values.<key>`) | The API message is used when it sends one |

## What's involved
`lib/api/documents.ts` (templates, instantiate, ai-draft, job, export types and calls), `lib/api/client.ts` (`apiClientWithStatus`),
`lib/documents-ai.ts` and `lib/documents-ai-handoff.ts` (new), `lib/documents-format.ts`, `hooks/useDocumentTemplates.ts`, `hooks/useDocumentEditor.ts`
(`template_key`, `disclaimer`, `refreshQuietly`), `components/documents/{disclaimer-banner,ai-draft-status,export-dialog,version-drawer}.tsx`,
`app/(dashboard)/documents/{page,[id]/page,templates/page,templates/[key]/page}.tsx`. No API change, no migration, no dependency.

## Verification
- Unit: `lib/documents-ai.test.ts`, `lib/api/documents.test.ts` (instantiate body, 201 vs 200, export listing).
- Mocked e2e: `e2e/documents-templates.spec.ts` (grouping, disclaimer, required-field gate, 422 to field, ai_sections body, over_budget on create, partial,
  failed, over_budget results, 429 retry, export 201 then 200, 429, 404, 422, bracket gap and unsaved warnings); `e2e/documents.spec.ts` updated.
- Live: `docs/checklist/documents-fe-walk.md` (BE-C section): NDA and pitch deck created, real-model AI draft, PDF and DOCX export, download link bytes `%PDF`,
  PDF preview paints, conflict banner, role matrix for founder, team member, mentor, consultant, accountant, legal advisor and outside investor.

## Operate / roll back
Revert the PR; the API is untouched. Nothing to configure. AI drafts need the worker and a model key on the API side; without them the job ends
`failed` and the page says so with a retry.

## Follow-ups
- BE-D UI (signing order, message, viewed, certificate, link expiry) comes from the next PR.
- Legal clause text is a placeholder until counsel supplies wording (D-DOC-4); the FE does not copy it.
- DOCX previews still need a converter (download only). Exported files cannot be shared yet (API limit).
- Pending and blocked scan states and the AI partial, failed, budget states are covered by mocked tests only.
