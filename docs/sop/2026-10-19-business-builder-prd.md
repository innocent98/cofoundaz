# SOP: Business Builder editors brought to the PRD (Module 08, slices a, b and c)

## What shipped

All eleven Business Builder pages now share the PRD editor pattern: shared top bar, last edited + version history,
Export to Documents, the AI confirmation modal, per-section AI, comment threads, consultant suggest mode and read-only
roles. One FE PR to `develop`. **It needs API #139 (slice a), #140 (slice b) and #141 (slice c).** Checklist:
`docs/checklist/business-builder-prd-gaps.md`. Contracts: API `docs/fe-integration-guide-business-builder-prd.md`.

## Why

The live walkthrough found 21 gaps: fake bell and dead Invite, every canvas showing "Continue", no last edited or
history, a fake Export toast and a local JSON download, no AI confirmation, whole-artifact-only AI, no comments, a
hard-coded founder role (so the consultant banner never showed), read-only map dots, and a pricing page with no model
selector or advisor.

## How

| Area | Approach |
|---|---|
| Access | `lib/bb-access.ts` + `hooks/useBuilderAccess.ts` turn the real workspace role into `edit` (founder, team member), `suggest` (business_consultant only, D-BB-3) or `read`. Controls are hidden, never disabled; the server still enforces |
| Canvas editing | `useCanvasEditor` owns the version ref, serializes saves, retries once on 409, exposes `flush`/`reload`/`applyCanvas`. Pure edit ops in `lib/canvas-ops.ts`. `CanvasFrame` gives every canvas the header, history panel, comment drawer, Export and suggest bar |
| Suggest mode | A consultant's canvas edits stay local; one "Send suggestion" posts a `canvas_update` with the full blocks. Record create/update/delete post suggestions immediately (`SUGGEST_KIND` maps URL segment to enum kind). Suggestions panel shows a diff and hides Approve/Reject for non-editors |
| History | `VersionHistoryPanel`: list, preview, Restore (new version, history kept); 409 offers "Reload the latest version" |
| Export | `ExportButton` (founder/team only) POSTs, toasts "Exported to Documents" with Open document, shows the 422 inline |
| AI | `AiConfirmModal` with the PRD copy in front of every entry point. `lib/api/bb-jobs.ts` polls jobs and returns the job `result`; section AI refetches the canvas after a job so the next autosave does not 409 |
| Comments | `lib/api/comments.ts`, `CommentDrawer`, counts hooks; canvas threads keyed by block `anchor`, records by id; @ mentions from `/team/members` |
| Map | `PositioningMap`: pointer-event drag, arrow-key nudge, Place button, PUT `map_x/map_y` (0..1) |
| Plan (row 17) | `useBusinessPlan` posts `/plan/generate` with `{audience, length}` and polls `GET /plan` every 2.5s, showing `progress.stage` and done/total. `PlanReadinessCard` (checklist, "Draft missing sections with AI" polling readiness while the jobs run), `RegenerateSection` (job result: ready / section_missing / over_budget / gone), failed state with retry (`over_budget` vs `generation_failed`). Safety net: stop polling after 5 minutes |
| Revenue (row 15) | `RevenueProjectionCard` (recharts stacked area, growth input prefilled from the API, months 6/12/24), per-stream Assumptions toggle, "Send to financial model" with an overwrite confirm and a toast to `/finance/model`; Finance model page shows "Revenue is from your Business Builder plan, not actuals" when `assumptions.revenue_source` is `business_builder` |
| Fit-lines (row 12) | `useCanvasEditor` carries `fitLinks` (refetched after each save, since the API prunes renamed or deleted items). `FitOverlay` measures `data-chip` elements and draws SVG curves (large screens); `FitList` (selects) is the keyboard and phone path; `PUT /canvases/value_prop/fit` replaces the list |
| Pricing | `PricingEditor` (model chips + tier table, draft saved with one button) and `PricingAdvisor` (prefilled from competitor prices; Apply writes through pricing CRUD) |

Decisions: consultant edits are staged (one suggestion per send) instead of one POST per keystroke; notes move between
blocks on BMC, Lean and SWOT (not Value Prop, whose blocks are semantically fixed); "Move to" select is the touch and
keyboard alternative to native drag; the old whole-page `window.prompt` adds became inline inputs; the dead
`useBusinessBuilderApi` and `PricingFormModal` were removed.

## What's involved

`lib/api/{business-builder,api-error,bb-jobs,comments}.ts`, `lib/{bb-access,bb-overview,bb-records,canvas-ops,map-geometry,mentions,relative-time}.ts`,
`hooks/{useBuilderAccess,useCanvasEditor,useBusinessRecords,useBusinessAiFill,useCommentCounts,useRecordThreads}`,
`components/business-builder/*` (new: canvas-frame, artifact-header, export-button, version-history-panel, comment-*,
section-ai-button, mission-options, personas-from-validation, pricing-editor, pricing-advisor, positioning-map,
sticky-canvas-page, suggest-bar, ai-confirm-modal and more), `app/(dashboard)/business-builder/**`. No migrations or config.

## Verification

Unit: pure logic (canvas ops, access, overview CTA, relative time, jobs, comments grouping, mentions, map geometry,
records helpers), `useCanvasEditor` and `useBusinessRecords` in suggest mode, and component tests for the confirm modal,
header and map. Live against the local stack with the real model: overview, SWOT section AI, add, history preview and
restore, export (201 and 422), comments on a block and a record, BMC move (select and dispatched drag), map drag and
keyboard, M&V options and Use this, personas from validation (422 then success), pricing advisor and Apply, as
founder, consultant (suggest flow, banner, no AI/Export) and mentor (read-only) at 1440px and 375px (no horizontal
overflow on any page).

Not verified live: a real-model plan run (the local daily AI budget was used up; the progress screen was verified against the guide's response shape and the over_budget failed state appeared live), the Finance model note (needs a model generation), restore 409 and 403 (shapes taken from the guide's captures), real pointer drag between blocks (the
test pane cannot drive native DnD), accountant/legal read-only roles (same code path as mentor).

## Operate / roll back

Revert the PR. Needs API #139, #140 and #141; against an older API the new calls (`/versions`, `/export`, `/comments`
anchors, AI block scope) would 404.

## Follow-ups

The rest of rows 13 and 14 (not in the slice a to c scope).
