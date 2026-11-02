# FE hand-off: Reported issues (Report action on AI replies and comments + Admin Reports tab)

**For:** the FE developer. **Scope:** exactly what is below; no backend work. **Backend:** API branch `feature/admin-reports` (PR number in the API repo; it re-chains after the Tickets PR #211, migration `0088_content_reports`, so wait for #211 to merge first).
**Contract:** `cofoundaz-api/docs/fe-integration-guide-admin-reports.md` (every body captured from a live run; capture names below match it). **Gap row:** A21 (PRD 25.5) in `docs/checklist/admin-prd-gaps.md`.
Read `AGENTS.md` first. Two surfaces: the founder app (a Report action) and the Admin console (a new Reports tab; the mock `app/admin-portal/page.tsx` has none, add one).

**Privacy rule (D-ADM-9):** staff see only the snippet the founder reported. There is no "view in context" and no API for it. Do not build one.

## Part 1: Report action (founder app)

New `lib/api/reports.ts` (`reportItem`, `myReports`) and one shared `components/reports/report-dialog.tsx`. Calls send `Authorization` and `X-Workspace-Id`; any workspace member can report.

- **Where it appears:**
  - on each **AI Co-Founder reply** (the assistant messages rendered by `components/ai/chat-message-content.tsx`): a small "Report" item (flag icon) in the message actions. Only on assistant messages with `status: "ready"`. Never on the person's own prompts.
  - on each **comment** by someone else (`components/roadmap/comment-thread.tsx`, `components/business-builder/comment-drawer.tsx`, the Team page comments index): a "Report" item in the comment's menu. Hide it on your own comments (`is_mine: true`). Do not add it to document comments.
- **Dialog:** a reason radio (spam "Spam", abusive "Abusive or harassing", harmful "Harmful or unsafe", inaccurate "Wrong or misleading", privacy "Shares private information", other "Something else") and an optional note (max 500, counter). When "Something else" is picked, make the note required (the API refuses `other` without a note, and that error comes back with an empty `field`, so show its `message` under the note box). Submit -> `POST /reports` `{item_type: "ai_message"|"comment", item_id, reason, note?}`. On 201 close the dialog, toast "Thanks, we'll take a look", and mark the item "Reported".
- **"Reported" state:** load `GET /reports/mine` once per page that shows reportable items (refetch after a report) and match on `item_type` + `item_id`. A reported item shows a muted "Reported" label instead of the Report action. The list only holds reports staff haven't decided, so the label disappears when they decide; that is expected.
- **Errors** (show the API `message`): `ALREADY_REPORTED` 409 (treat as success: mark it Reported), `RATE_LIMITED` 429 (10 an hour; keep the dialog open), `OWN_COMMENT` 422, `NOT_FOUND` 404 (the item is gone or not yours: close the dialog and refetch the thread), `VALIDATION_ERROR` 422.

## Part 2: Removed content (founder app)

Comments and AI messages now carry `removed_by_moderation: boolean`. When it is `true` the text (`body` / `content`) already reads "Removed by moderation".
- Render a muted row "Removed by moderation" (use the API text, do not hard-code a different string) with **no** edit, reply, resolve, copy or Report actions. Applies to AI chat (`GET /ai/conversations/{id}` messages), comment threads (`GET /team/comments`), and the Comments tab snippet (`GET /team/comments/threads`). It applies to everyone who can see the item, not only the author.
- A removed comment's edit (`PATCH /team/comments/{id}`) answers 403: you should not offer it.

## Part 3: Admin Reports tab

Add `Reports` to `AdminTab` and the sidebar (hidden unless `GET /admin/me` shows the `moderation` scope or the Super Admin role; a 404 means not staff, handle as the other tabs do). New `lib/api/admin-reports.ts`. Routes are under `/admin/reports`, no workspace header.

1. **Tabs and badges:** Open / Escalated / Closed -> `GET /admin/reports?tab=open|escalated|closed`; badge numbers from `GET /admin/reports/counts` (refetch after every action).
2. **Filters:** type (All / AI reply / Comment -> `type=ai_message|comment`), reason (`reason=`). Search box `query` (debounced ~300 ms; matches the snippet, the workspace name and the reporter's name or email). This is the per-page search for P13; do not add a global search. Paging via `meta.next_cursor` ("Load more").
3. **List row:** type chip, reason chip, the snippet (already cut to 200 chars; show an ellipsis when `snippet_truncated`), workspace name + `plan_key`, reporter name, age from `created_at`. On the Closed tab show a status chip (`dismissed`, `removed`, `restored`).
4. **Detail pane** (`GET /admin/reports/{id}`): full `snippet` as **plain text** (never HTML), reason, the reporter's note, reporter name + email, **author name only** (`author` is `null` for an AI reply: show "AI Co-Founder"), workspace, "N people reported this" from `reports_on_item` (show when > 1), and for decided or escalated reports the reasons and who did it (`escalation_reason`, `escalated_by`, `decision_reason`, `decided_by`).
5. **Actions** (each needs a reason, 10-500 chars):
   - **Dismiss** `POST .../dismiss {reason}` (no code).
   - **Escalate to Super Admin** `POST .../escalate {reason}` (no code). 409 `ALREADY_ESCALATED`: refetch.
   - **Remove content** `POST .../remove {reason, totp_code}`. Confirm copy: "The author will see 'Removed by moderation'. This closes every report on this item. You can restore it later." Ask for the staff member's own 6-digit authenticator code in the dialog. `403 STEP_UP_INVALID` (not 401): show its message and ask for a new code; codes are single-use.
   - **Restore** (only on a `removed` report, Closed tab) `POST .../restore {reason, totp_code}`, same code prompt.
6. **Escalated reports (R7):** only a Super Admin can decide them. For a moderator who is not a Super Admin, on an escalated report hide Dismiss, Remove and Restore and show "Waiting for a Super Admin". If a moderator still gets `403 SUPER_ADMIN_ONLY` (for example removing an item that has an escalated report on it) show the API `message`.
7. **After an action:** refetch the list, counts and detail. After Remove, the sibling reports on the same item also leave the Open tab (they are closed as `removed`).

## Rules for this page

- All user text (snippets, notes, reasons) is rendered as text, never HTML.
- Error codes to handle: `VALIDATION_ERROR`, `RATE_LIMITED`, `ALREADY_REPORTED`, `OWN_COMMENT`, `ALREADY_ESCALATED`, `REPORT_CLOSED`, `NOT_REMOVED`, `SUPER_ADMIN_ONLY`, `STEP_UP_INVALID`, `NOT_FOUND`, `FORBIDDEN`. Show the API `message` unless this brief gives other copy.
- Not built (do not mock): reviews (Marketplace), notifications to the author or reporter, withdrawing your own report.
- Re-walk (click every control, all roles that apply, 1440 and 375) is part of done: founder app needs a founder, a team member and a mentor; staff side needs a moderation Admin and a Super Admin.
