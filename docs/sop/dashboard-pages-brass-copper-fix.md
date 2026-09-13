# SOP — Dashboard pages (PR #14): reviewer brass→copper + entity + hook fixes

## What shipped

PR #14 (`feat/implement-remaining-pages → develop`, merged as `bf05da3`) adds the
remaining product-app pages and sub-modules — admin portal, super-admin,
marketplace, settings, team, journal, documents, notifications, analytics,
calendar, learning-academy, plus `roadmap/`, `health/`, `ai/`, `assessment/`
sub-routes — and **centralizes the sidebar** (`components/sidebar-context.tsx`
+ `(dashboard)/layout.tsx`, replacing the fragile per-page copies).

On the reviewer pass, three problems CI could not catch were fixed before merge
(commit `4a0651f`, merged via `91247cf`):

## Why

- **Brass regression.** The new sub-modules were built with the *old* brass
  accent `#A8894B` (23 occurrences across 15 files; `develop` had 0), including
  5 `bg-[#A8894B] text-[#12291F]` buttons — off-brand and failing WCAG AA. The
  token test can't catch these because they're hardcoded hexes, not Tailwind
  classes.
- **Entity-in-string labels.** HTML entities were escaped *inside JS string
  literals* (e.g. the sidebar nav label `"Today&apos;s Mission"`), so they
  rendered literally instead of as `'`.
- **Broken pre-commit hook.** `scripts/precommit-checks.mjs` ran ESLint with
  `shell: true`, so the shell choked on route-group paths (`app/(dashboard)/…`)
  and the `&` in `legal&compliance/` — the hook errored on every dashboard commit.

## How

- **Brass → copper** (`docs/dashboard-styling.md` mapping): buttons →
  `bg-copper-600 text-white hover:bg-copper-700`; icons/rings/borders/text →
  `copper-*`; JS color strings (score rings, `var()` fallbacks) → `#9C5B34`.
- **Entities:** replaced `&apos;`/`&#39;` **only inside double-quoted string
  literals** (a scoped regex) — JSX-text entities were left intact (correct there).
- **Hook:** dropped `shell: true` from the ESLint `spawnSync` so paths pass as
  literal argv. Resolved the add/add merge conflict on this file in favour of
  the fixed version.

## What's involved

- 15 `.tsx` under `app/(dashboard)/**` + `components/**` (brass), 5 more (entities),
  `scripts/precommit-checks.mjs` (hook), plus the dev's new pages/components.
- No deps, migrations, or config beyond the hook script.

## Verification

Local reproduction of CI (clean `.next`, `npm ci` toolchain):
`typecheck` 0 · `lint` 0 errors (91 unused-import warnings) · **184** unit ·
`build` ✓ · brass `#A8894B` count **0** · dark-on-copper buttons **0**.
Visual: `/ai` confirmed copper buttons with white text and copper focus ring.
CI on the PR was green (gates + e2e).

## Operate / roll back

Pure FE render + tooling change. Roll back by reverting the merge `bf05da3`.

## Follow-ups

- **`main` is 18 commits behind `develop`** — sync via a `develop → main` PR.
- **91 `no-unused-vars` warnings** (unused icon imports) — clear as pages are touched.
- Dashboard pages are still **static mock UI** — API wiring to `cofoundaz-api` is
  the next real work.
- Dashboard routes are **not yet in the e2e/axe sweep** — contrast/regressions
  there rely on manual checks (which is how the brass slipped past CI).
