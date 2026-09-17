# SOP — Mock API layer (PR #17) + reviewer build/encoding fixes

## What shipped

PR #17 (`feat/mock-api-platform-coverage → develop`, merged `f3eef9f`) adds a
**local mock API layer** so the frontend can be built offline, decoupled from
the unstable staging backend:

- **78 mock route handlers** under `app/api/v1/*` returning hardcoded canned
  JSON, contract-shaped to the staging OpenAPI (auth, dashboard, business-builder,
  finance, health, roadmap, sales, missions, notifications, documents, …).
- **Typed client SDK** `lib/api/*` (`client.ts`, `auth.ts`, `business-builder.ts`,
  `onboarding.ts`, 160 KB generated `schema.d.ts`) + hooks (`useDashboardApi`,
  `useBusinessBuilderApi`).
- **Auth + onboarding wired to the mock** (`login/signup/verify/forgot-password/
  onboarding` + new `onboarding-wizard`). Dashboard pages still render static
  inline data (hooks exist but are not consumed yet).

> ⚠️ This is a mock layer, **not** real `cofoundaz-api` integration. The client
> honors `NEXT_PUBLIC_API_BASE_URL` (default `/api/v1` → the mocks); the seam for
> real wiring is that env var. Real integration remains the open checklist item.

## Why (the reviewer pass)

CI showed green-ish, but a local reproduction found the PR was **not shippable**:

- **Build broke.** 3 files had stray **Windows-1252 bytes** (smart quotes,
  bullets, em-dash, middot) saved as non-UTF-8 → Turbopack `failed to convert
  rope into string`: `app/(auth)/reset-password/page.tsx`,
  `app/(dashboard)/business-builder/lean-canvas/page.tsx`,
  `app/(dashboard)/dashboard/page.tsx`. Root cause: a Windows editor's encoding
  default (the PR's `verify-routes.ps1` confirms Windows).
- **A unit test failed.** `onboarding-wizard` `handleNext` saved with
  `currentStep` (off-by-one) — the test expects the **next** step number.
- **Stale + CONFLICTING** with develop (6 behind); one conflict on
  `dashboard/page.tsx` (overlapping the copper/navbar fix), and 28 brass hexes
  present only because the branch predated the brass→copper fix.
- **`next.config.ts`** proxied `/api/v1/*` → `staging-api.cofoundaz.com` in
  **every** environment (would leak to preview/prod), plus a UTF-8 BOM.

## How

- **Encoding:** byte-level repair — decode valid UTF-8 runs, map stray bytes via
  cp1252, re-encode UTF-8. Preserves real multibyte chars (`₦`, `✦`) while fixing
  the strays. (A blind `cp1252` decode would have corrupted the valid ones.)
- **Conflict:** resolved `dashboard/page.tsx` to develop's side (correct `₦9M` +
  plain apostrophe vs the branch's corrupted `?9M`/`&apos;`); merging develop also
  swept in the copper fixes (brass count → 0).
- **Onboarding:** `handleNext` now computes `nextStep` and calls
  `onSaveStep(nextStep, { …values, step: nextStep })`.
- **Config:** `rewrites()` gated behind `process.env.NODE_ENV === 'development'`;
  BOM stripped.

## Verification

Local reproduction of CI (`npm ci`, clean `.next`): `typecheck` 0 · `lint` 0
errors (142 warnings) · **188** unit (21 files) · `build` ✓ (compiles) · brass 0.

## Operate / roll back

Revert the merge `f3eef9f`. No migrations/config beyond `next.config.ts`.

## Follow-ups

- **Real API integration** — wire the dashboard pages (and the rest) to
  `cofoundaz-api` via `NEXT_PUBLIC_API_BASE_URL`, replacing the mocks. This mock
  layer is scaffolding toward that, not the destination.
- The **mock handlers currently ship in prod builds** (they're app routes) —
  decide whether to exclude them from production or keep as a fallback.
- **142 lint warnings** (unused vars/imports in the mock handlers) — clean up.
- Editor encoding: the dev should set UTF-8 to stop the Windows-1252 corruption
  recurring (the pre-commit hook + typecheck do **not** catch it — only `build` does).
