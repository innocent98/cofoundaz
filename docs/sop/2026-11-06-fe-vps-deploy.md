# Self-hosted web deploy (VPS, replacing Vercel)

**What shipped:** a CI/CD pipeline that builds the Next.js app as a Docker image and deploys it to the same VPS as the API, behind the host nginx. `develop` → staging, `main` → production. Branch `ci/fe-vps-deploy`, PR to `develop`. Edge config (nginx sites + certbot runbook) is a separate PR in `cofoundaz-api`, branch `ci/fe-nginx-sites`. **Nothing is live yet:** both CD workflows are off until the repository variables below are set, and Vercel keeps serving `www` until the DNS cutover.

**Why:** Adebayo wants the FE off Vercel and on the VPS with proper CI/CD (`*.vercel.app` previews fail CORS anyway). Design "A" was approved on 2026-11-06.

## How

| Piece | Detail | Decision |
|---|---|---|
| `next.config.ts` | `output: "standalone"` | The image has `server.js` plus only the traced `node_modules`, with no full `npm ci` at runtime. `npm start` still works (it only warns), so Playwright in `ci.yml` is unchanged. |
| `Dockerfile` | 3 stages on `node:24-alpine`: `npm ci` → `next build` → runtime. Copies `public/` and `.next/static` next to the standalone server (standalone leaves them out). Runs as uid 1000, `HOSTNAME=0.0.0.0 PORT=3000`, `HEALTHCHECK` on `/healthz`. Label `com.cofoundaz.web.environment` = the environment it was built for. | Node 24 because Node 20 is end-of-life (ci.yml still uses 20: follow-up). |
| `app/healthz/route.ts` | `GET /healthz` → `200 {"status":"ok"}`, `no-store`, `force-dynamic` | It renders per request, so a 200 proves the Node server answers, not just that a file exists. |
| **One image per environment** | `NEXT_PUBLIC_API_BASE_URL` and `NEXT_PUBLIC_SITE_URL` are inlined into the client bundle at `next build` (Next docs, `environment-variables.md`). So staging and production each get their own build, tagged `sha-<7>-<env>`. | Unlike the API, production is a **rebuild** of the same commit, not the exact bytes staging tested. Rejected design B (nginx serves `/api/v1` on the web host so one image fits both environments): good later, but a bigger edge change. |
| Wrong-image guard | The rollback tag must match `sha-<commit>-<env>` on the runner, and the VPS refuses any image whose label is not the target environment | A staging image in production would send users to the staging API |
| `.github/workflows/deploy-web.yml` | Reusable workflow: `gates` (typecheck, lint, vitest) → `deploy` in the GitHub Environment: preflight (every secret and var set, `WEB_PORT` numeric, `APP_URL` is `https://host`), buildx build + push to GHCR, resolve the **digest**, scp the compose file + script, SSH run `web-deploy.sh` | Actions pinned by SHA (same pins as the API). The VPS `docker login` uses the run's own `GITHUB_TOKEN` (no stored registry credential). |
| `cd-staging.yml` / `cd-production.yml` | push `develop` / `main` (docs-only pushes skipped) + `workflow_dispatch image_tag` for rollback. `concurrency` per environment, never cancelled mid-deploy. | Push deploys run only while `WEB_VPS_DEPLOY_STAGING` / `_PRODUCTION` = `true` (repository variables), so merging this PR changes nothing until the VPS is ready |
| `deploy/docker-compose.web.yml` | One `web` service: `127.0.0.1:${WEB_PORT}:3000` only, `read_only`, tmpfs `/tmp` + `.next/cache`, `cap_drop: ALL`, `no-new-privileges`, 512M / 1 CPU limits, log rotation | Each DEPLOY_PATH gets its own `.env` with project `cofoundaz-web-<env>`, so the two stacks never collide (the API's pattern) |
| `deploy/web-deploy.sh` (runs on the VPS) | Record the running image → pull by digest → check the label → write `.env` → `up -d` → loopback `/healthz` (120 s) → **through nginx**: `curl --resolve <host>:443:127.0.0.1 https://<host>/healthz` → on any failure, roll back to the previous image and check it | `--resolve` runs the check through this box's nginx + TLS even while public DNS still points at Vercel |

## What's involved
`next.config.ts`, `Dockerfile`, `.dockerignore`, `app/healthz/route.ts` (+ test), `.github/workflows/{deploy-web,cd-staging,cd-production}.yml`, `deploy/{docker-compose.web.yml,web-deploy.sh}`. Not touched: `ci.yml` (owned by `ci/pipeline-speed-fe`), the API, the VPS, DNS, Vercel.

## Setup Adebayo must do (names only; no value lives in the repo)

**1. GitHub → innocent98/cofoundaz → Settings → Environments:** create `staging` and `production`. Secrets do not carry over from the API repo, so add them here too.

| Kind | Name | Example / note |
|---|---|---|
| secret | `VPS_HOST` | same box as the API |
| secret | `VPS_USERNAME` | the deploy user (in the `docker` group) |
| secret | `VPS_SSH_KEY` | that user's private key |
| secret | `DEPLOY_PATH` | e.g. `/opt/cofoundaz-web-staging`, `/opt/cofoundaz-web` (create it, owned by the deploy user) |
| var | `APP_URL` | `https://<web host>` with no path. It is also the host the nginx health check uses |
| var | `WEB_PORT` | loopback port. Suggest staging `3001`, production `3000` (the API uses 8000/8001). Must match the nginx upstream |
| var | `NEXT_PUBLIC_API_BASE_URL` | e.g. `https://staging-api.cofoundaz.com/api/v1` / `https://api.cofoundaz.com/api/v1` |
| var | `NEXT_PUBLIC_SITE_URL` | the canonical web origin (metadataBase, sitemap, OG) |
| var (optional) | `VPS_PORT` | default 22 |
| var (optional) | `HEALTH_VIA_NGINX` | set `false` only for a bootstrap deploy before the nginx site + cert exist |
| protection (optional) | required reviewer on `production` | one approval per production deploy |

**2. Repository variables** (Settings → Variables → Actions → Repository): `WEB_VPS_DEPLOY_STAGING=true`, later `WEB_VPS_DEPLOY_PRODUCTION=true`. Until set, pushes skip the deploy (job shows "skipped"); a manual run still works.

**3. DNS:** an A record per web host → VPS IP (AAAA only if IPv6 really works there); CAA must allow `letsencrypt.org`; TTL 300 a day before cutover.

**4. API env** (before any user hits the new host): add the web origins to `BACKEND_CORS_ORIGINS` and set `APP_BASE_URL` in the API's `.env.staging` / `.env.production`, then re-encrypt and redeploy. Update provider callbacks that name the web host: Google OAuth origins/redirects, Paystack + Flutterwave callback URLs, Mono, LinkedIn.

**5. Edge:** apply the `cofoundaz-api` PR `ci/fe-nginx-sites` by following its runbook (cert first, then site, `nginx -t`, reload).

**6. VPS capacity:** two web containers add up to about 1 GB of limits. Before the first deploy, check `free -h`, `df -h /` and `docker stats --no-stream` against the API's rule of leaving 25% of RAM unallocated.

## Operate
- **Normal:** merge to `develop` (staging) or `main` (production). The run summary shows the tag and digest.
- **Rollback:** Actions → `CD (staging|production)` → Run workflow → `image_tag` = an earlier `sha-<commit>-<env>` (see GHCR package `cofoundaz` or old run summaries). Gates and build are skipped; the same digest/label/health/rollback path runs.
- **Auto-rollback:** any failed step after the swap puts the previous image back and checks it. A first deploy has nothing to roll back to.
- **Cutover (production):** deploy while Vercel still serves the host → the nginx check passes via `--resolve` → test with `curl --resolve` / a hosts-file entry → flip the A record → watch. **Back out:** point DNS back at Vercel. Keep the Vercel project live for at least a week.

## Verification (2026-11-06, local Docker 29.1.3)
| Check | Result |
|---|---|
| `npm run typecheck`, `npm run lint`, `vitest app/healthz` (2 tests) | ✅ |
| `actionlint` on the 3 workflows, `shellcheck web-deploy.sh` | ✅ clean |
| `hadolint Dockerfile` | ✅ except DL3025 on the `HEALTHCHECK` shell form (false positive; `CMD` is JSON) |
| `docker build` with placeholder build args | ✅ 371 MB image |
| Run via `web-deploy.sh` (loopback, `HEALTH_VIA_NGINX=false`) | ✅ `/healthz` 200, `/` 200, `/sales-hub/x` → 308 `/sales/x`; runs as uid 1000; root fs read-only; placeholder API URL found in `.next/static` chunks |
| Wrong environment (staging image, `STACK_ENV=production`) | ✅ refused at step 3, nothing touched |
| Crashing image | ✅ loopback health failed after 120 s → rolled back, `.env` back on the good image, `/healthz` 200 |
| nginx check failing (no nginx locally) | ✅ rolled back, "rollback healthy" |
| `npm run build && next start` (Playwright's path) | ✅ serves, with Next's standalone warning |
| **Not verified** | GHCR push/pull, scp/ssh to the real VPS, the nginx `--resolve` path on a real cert, the GitHub Environment wiring. They need the setup above; the first real run is the proof |

## Follow-ups
- Bump `ci.yml` to Node 24 to match the image (after `ci/pipeline-speed-fe` lands; that branch owns `ci.yml`).
- Design B (same-origin `/api/v1` through nginx): one promotable image, no CORS, first-party cookies (helps D-AUTH-6).
- Image scan (Trivy) and SBOM/provenance attestations, as on the API.
- Use a staging-verified gate before production, like the API, once a web e2e smoke against staging exists.
