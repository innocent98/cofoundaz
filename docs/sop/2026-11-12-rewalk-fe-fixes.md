# Re-walk FE fixes: audit log, onboarding logo, activity names

**What shipped:** three FE fixes from the 2026-11-12 every-control re-walk (`docs/checklist/team-rewalk.md`, `auth-onboarding-rewalk.md`). PR: see branch `fix/rewalk-2026-11-12`.

| Defect | Cause | Fix |
|---|---|---|
| Team > Audit log always empty, Export disabled (high) | `getTeamAuditLogs` read `data.items`; API returns `data.entries` (cursor `next_cursor` was already right) | `lib/api/team.ts` reads `entries`; new unit test uses the live shape |
| Onboarding step 2 rejected logo silent; hint said 5 MB (medium) | `handleUploadLogo` swallowed the 422; no hint match to API (2 MB, PNG/JPG/SVG/WebP) | `app/(auth)/onboarding/page.tsx` shows the API message and returns `false`; wizard stays on step 2; hint now "up to 2 MB" |
| Team > Activity name printed twice (low) | API `summary` already starts with the actor; row also printed the actor | row prints `summary` only (initials avatar kept) |

**Tests:** `lib/api/team.test.ts`, `ui/onboarding/onboarding-wizard.test.tsx`, `app/(dashboard)/team/team-page.test.tsx`. **Verification:** live re-check on a scratch stack at 1440 and 375, rows in the two rewalk docs. **Roll back:** revert the PR; no config or migration. **Follow-up:** `GET /team/members` exposing emails to every role waits on a product decision.
