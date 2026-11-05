# CI pipeline speed (FE)

**What shipped:** `ci.yml` with a docs-only path filter, an always-reporting `CI gate`, typecheck/lint/unit/build running in parallel, and a cached `node_modules`. Branch `ci/pipeline-speed-fe`, PR: see the branch. API twin: `cofoundaz-api` `ci/pipeline-speed` (`docs/sop/2026-11-05-ci-pipeline-speed.md` there).

**Why:** most PRs are docs (handoffs, re-walk evidence) but ran everything: one serial job of ~4.5 min (install 55 s, lint 36 s, unit 110 s, build 40 s) beside a ~4.5 min Playwright job. Measured on the last 3 green develop pushes (264 to 291 s) and 3 green PRs (257 to 295 s).

**How**

| Lever | Detail |
|---|---|
| `changes` job | Lists the PR's files via `gh api pulls/N/files`. Docs-only = every file under `docs/` or ending `.md`. Pushes always count as code. |
| `CI gate` | `if: always()`; green when every needed job is success/skipped, red on failure/cancel. No branch protection exists on `develop` today (`gh api .../protection` is 404). If it is added, require `CI gate`, not the individual jobs. |
| Parallel gates | One matrix job (`Typecheck`, `Lint`, `Unit tests`, `Build`) instead of four serial steps. Wall time is the slowest step plus setup, not the sum. |
| `node_modules` cache | `actions/cache` keyed on `package-lock.json` + Node 20; `npm ci` only on a miss (saves ~55 s per job). `setup-node` `cache: npm` stays for misses. |
| Playwright | Kept whole (13 tests: e2e, accessibility, responsive). `playwright.config.ts` still builds and serves the app itself. |
| Concurrency | Already cancelled superseded runs; unchanged. |

Rejected: `vitest --shard`. The whole unit step is ~110 s, so shards would each pay a runner start and cache restore to save under a minute. Revisit if unit time passes ~5 min.

**Verification:** workflow parses as YAML; timings and a docs-only-skip demonstration are in the PR body.

**Roll back:** revert the PR; nothing depends on it.

**Follow-ups:** the first run on a new `package-lock.json` is a cache miss (full `npm ci`) in every job; that is expected.
