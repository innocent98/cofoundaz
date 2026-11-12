# Review of FE #240 (Team, Journal, Notifications QA fixes)

Lead 24, 2026-11-12. Head reviewed: `e0accfd` (CI green, mergeable, no AI attribution). Read-only code review against the
review comments on #231, #232 and #233, the gap lists (`docs/checklist/{team,journal,notifications}-prd-gaps.md`) and the
API guides (`cofoundaz-api/docs/fe-integration-guide-{team,journal,notifications}.md`). Not yet walked live: the
every-control re-walk (1440 + 375, every role) on `stage` happens after these fixes land and #240 merges.

## Verdict

**Not ready to merge.** Most of the earlier review is addressed (Team thread keys, 403/404 handling, Journal delete,
month picker, dirty-state autosave, debounced search, `field_errors[]`, Notifications bell decoupling, `urgent_unread`,
`ai_insights`, Daily/Weekly, keyboard rows). Two blocking problems remain, both confirmed by the lead in the code:

1. **Team audit sentences use invented action names.** `app/(dashboard)/team/page.tsx:113,152` switch on `INVITE_SENT`
   and similar. The API sends `team.invitation.created`, `team.member.joined` and `workspace.updated` (guide §5, line
   237-244), so those rows fall through to a generic sentence. The test feeds the guessed names, so it passes.
2. **Onboarding changes are out of scope** (`app/(auth)/onboarding/page.tsx` +45, `lib/api/onboarding.ts` +142, wizard,
   constants, tests, e2e). Onboarding is owned by the planned Auth FE step 2 (D-AUTH-1..7) and these edits will collide.

## Comment to paste on #240

> Thanks, most of the review is addressed. Before merge:
>
> 1. **Team audit:** map the real actions from the guide §5 exactly:
>    `team.invitation.created` → "{actor} invited {target}", `team.invitation.resent` → "{actor} re-sent the invitation
>    to {target}", `team.invitation.revoked` → "{actor} revoked the invitation for {target}", `team.member.joined` →
>    "{actor} joined", `team.member.role_changed` → "{actor} changed {target}'s role", `team.member.removed` → "{actor}
>    removed {target}", `team.member.left` → "{actor} left the workspace", `workspace.updated` → "{actor} updated the
>    workspace settings". Drop the invented `INVITE_SENT` / `MEMBER_REMOVED` / `document.*` cases and fix
>    `team-page.test.tsx:213-250` to use these real action strings, including the three currently missing.
> 2. **Remove the onboarding changes** (`app/(auth)/onboarding/page.tsx`, the wizard, `constants.ts`,
>    `lib/api/onboarding.ts`, their tests and the e2e change) from this PR. The Auth FE step 2 brief owns them.
> 3. **Move unrelated edits to one `chore/` PR** (we asked for this on #231-233): `vitest.config.mts`, `ui/tokens.test.ts`,
>    the academy/sales/feedback/health/dashboard test edits, `ai-status-banner.tsx`, `opengraph-image.tsx`. Remove the
>    BOMs. Don't raise test timeouts to 20 s to make suites pass.
> 4. **Revert the `RoadmapDrawer` changes** (no `due_date` field, the API takes `due_on` only; no
>    `process.env.NODE_ENV === 'test'` branch in app code; no extra window Escape listener) or put them in their own PR.
> 5. **Journal:** add an error state for `fetchSettings` (`JOURNAL_NOT_CONFIGURED` → "Journal storage is temporarily
>    unavailable." with Retry; other errors with Retry). Surface stats/prompt/entry load failures with Retry. Use
>    `API_BASE` and `apiClient` for export (it hardcodes `/api/v1/journal/export`, which breaks on stage where the API
>    base is absolute) and `formatApiErrorMessage` for export and delete errors. Clear the toast timer. Check the
>    lock-screen copy against `journal.md` §8.
> 6. **Notifications:** remove `category` / `NotificationCategory`. Replace the guessed realtime `matchesFilterChip` with
>    a refetch of the active chip (or prepend only on all/unread/urgent). Show a load-error state with Retry instead of
>    the invented `DEFAULT_PREFS`.
> 7. Squash away the `push -u origin…` and merge commits, push, and wait for CI green.
>
> After that, the lead does the every-control re-walk on stage (1440 and 375, every role), then we merge and close
> #231-233 as superseded.

## Lower-priority notes (not blocking)

- Journal delete failure shows raw `err.message`; `console.warn` in two Notifications hooks (no PII).
- Sidebar diff is mostly re-indentation; the re-walk must click through it at 375 and 1440.
- #231-233 can be closed as superseded once #240 merges, not before.
