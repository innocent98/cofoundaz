# Self-hosted web deploy (VPS, replacing Vercel)

**What shipped:** a CI/CD pipeline that builds the Next.js app as a Docker image and deploys it to the same VPS as the API, behind the host nginx. `develop` → staging, `main` → production. Branch `ci/fe-vps-deploy`, PR to `develop`. Edge config (nginx sites + certbot runbook) is a separate PR in `cofoundaz-api`, branch `ci/fe-nginx-sites`. **Nothing is live yet:** push deploys stay off until the repository variables in the runbook are set. `www`/apex DNS already points at the VPS, so the site is down until the runbook below is done.

**Why:** Adebayo wants the FE off Vercel and on the VPS with proper CI/CD (`*.vercel.app` previews fail CORS anyway). He approved design "A" on 2026-11-06. Triggers: `develop` → staging, `main` → production ("lets use develop for stage").

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
| `deploy/web-deploy.sh` (runs on the VPS) | Record the running image → pull by digest → check the label → write `.env` → `up -d` → loopback `/healthz` (120 s) → **through nginx**: `curl --resolve <host>:443:127.0.0.1 https://<host>/healthz` → on any failure, roll back to the previous image and check it | `--resolve` runs the check through this box's nginx + TLS even before public DNS reaches this box |

## What's involved
`next.config.ts`, `Dockerfile`, `.dockerignore`, `app/healthz/route.ts` (+ test), `.github/workflows/{deploy-web,cd-staging,cd-production}.yml`, `deploy/{docker-compose.web.yml,web-deploy.sh}`. Not touched: `ci.yml` (owned by `ci/pipeline-speed-fe`), the API, the VPS, DNS, Vercel. Edge: `cofoundaz-api` PR #230: a standalone site for stock nginx 1.24 (what the VPS runs) and the full-layout variant. `verify-web-local.sh` passes 28/28 for each, including apex → www and bootstrap sites loading with no certs.

## Go-live runbook: production first (copy-paste, in order)

**Situation on 2026-11-06:** `cofoundaz.com` and `www.cofoundaz.com` already resolve to the VPS (DNS at Cloudoon). nginx has no site or cert for them yet, so the public site is **down** until steps 1 to 6 are done. There is no Vercel DNS to fall back to (Adebayo: "Wait for VPS pipeline"). `stage.cofoundaz.com` has no DNS record yet, so staging comes after production (step 8).

Defaults used below (they are environment values, not code; change them freely): production serves **`www.cofoundaz.com`**, and **`cofoundaz.com` 301-redirects to www** so browsers only ever see one origin (one CORS entry, one cookie host, one OAuth callback). Production port `3000`, staging `3001` (the API uses 8000/8001). Deploy folders `/opt/cofoundaz-web` and `/opt/cofoundaz-web-staging`.

The VPS has 4 vCPU and 7.8 GiB RAM with **no swap**, and the existing container limits already add up to about 11.5 GiB. The web container is capped at 512 MiB (Node heap 384 MiB) with `restart: unless-stopped`. Images are **never built on the VPS**: CI builds them and the VPS only pulls. After each deploy, the script keeps the running image and the one before it (the rollback target) and deletes older web images.

### 1. VPS: swap, deploy folder, free port (you, over SSH)
A 2 GiB swapfile is recommended: with limits above physical RAM and no swap, a memory spike makes the kernel kill a container instead of slowing down.
```bash
sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile && echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab && sudo sysctl vm.swappiness=10 && echo 'vm.swappiness=10' | sudo tee /etc/sysctl.d/99-swappiness.conf
```
```bash
sudo mkdir -p /opt/cofoundaz-web && sudo chown "$(whoami)": /opt/cofoundaz-web
```
Port 3000 must be free (no output means free):
```bash
sudo ss -ltnp | grep -E ':(3000|3001)\b'
```
Run the `mkdir`/`chown` as (or for) the same deploy user the API CD uses.

### 2. nginx site + certificate for apex + www (you, over SSH)
The VPS runs **Ubuntu's stock nginx 1.24**. The API repo's full `deploy/nginx/` layout (conf.d files, `snippets/cofoundaz/`, nginx.org ≥ 1.25) was never installed there. So this uses the **standalone** site: **one** file with an inline upstream, ACME location, headers and `listen 443 ssl http2;`. It needs nothing else. It comes from the API repo branch `ci/fe-nginx-sites` (PR #230), proven on nginx 1.24 by `deploy/nginx/test/verify-web-local.sh` (28/28).

If you already installed the hand-written `/etc/nginx/sites-available/web-production.conf` and the certificate, this file replaces it at the same path. Skip the bootstrap and certbot steps if `sudo ls /etc/letsencrypt/live/www.cofoundaz.com/` already lists `fullchain.pem`.

Render it (on the VPS from a clone, or on your Mac and `scp` the two files over):
```bash
cd /tmp && rm -rf cfz-edge && git clone --depth 1 --branch ci/fe-nginx-sites https://github.com/innocent98/Cofoundaz-api.git cfz-edge && cd cfz-edge
```
```bash
WEB_ENV=production WEB_SERVER_NAMES="www.cofoundaz.com" WEB_REDIRECT_NAMES="cofoundaz.com" WEB_CERT_NAME="www.cofoundaz.com" WEB_PORT=3000 OUT_DIR=/tmp/web-edge-production ./deploy/nginx/web/render.sh
```
HTTP-only bootstrap site (answers the ACME challenge; nothing else exists yet):
```bash
sudo mkdir -p /var/www/certbot && sudo install -m 644 /tmp/web-edge-production/sites-available/web-production-bootstrap.conf /etc/nginx/sites-available/ && sudo ln -sf /etc/nginx/sites-available/web-production-bootstrap.conf /etc/nginx/sites-enabled/ && sudo nginx -t && sudo systemctl reload nginx
```
One certificate for both names (DNS already points here, so HTTP-01 works now):
```bash
sudo certbot certonly --webroot -w /var/www/certbot --cert-name www.cofoundaz.com -d www.cofoundaz.com -d cofoundaz.com
```
Swap the bootstrap site for the real one:
```bash
sudo rm -f /etc/nginx/sites-enabled/web-production-bootstrap.conf && sudo install -m 644 /tmp/web-edge-production/sites-available/web-production.conf /etc/nginx/sites-available/ && sudo ln -sf /etc/nginx/sites-available/web-production.conf /etc/nginx/sites-enabled/ && sudo nginx -t && sudo systemctl reload nginx
```
Check that TLS and routing work. Expect **502** for `/healthz` now (no container yet; it turns 200 after step 6), and `301` → www for the apex:
```bash
curl -sS -o /dev/null -w '%{http_code}\n' https://www.cofoundaz.com/healthz; curl -sS -o /dev/null -w '%{http_code} %{redirect_url}\n' https://cofoundaz.com/
```
The CD health check uses exactly this path from the VPS (`curl --resolve www.cofoundaz.com:443:127.0.0.1 https://www.cofoundaz.com/healthz`), through the site's `location /`.

### 3. GitHub environment `production` (you, on your Mac, in this repo)
Secrets go in the FE repo too; they do not carry over from the API repo. Use the same VPS host, user and key the API CD uses.
```bash
gh api -X PUT repos/innocent98/cofoundaz/environments/production >/dev/null && echo created
```
```bash
gh secret set VPS_HOST --env production --repo innocent98/cofoundaz
```
```bash
gh secret set VPS_USERNAME --env production --repo innocent98/cofoundaz
```
```bash
gh secret set VPS_SSH_KEY --env production --repo innocent98/cofoundaz < ~/.ssh/<deploy-key-file>
```
```bash
gh secret set DEPLOY_PATH --env production --repo innocent98/cofoundaz --body /opt/cofoundaz-web
```
```bash
gh variable set APP_URL --env production --repo innocent98/cofoundaz --body https://www.cofoundaz.com
```
```bash
gh variable set NEXT_PUBLIC_SITE_URL --env production --repo innocent98/cofoundaz --body https://www.cofoundaz.com
```
```bash
gh variable set WEB_PORT --env production --repo innocent98/cofoundaz --body 3000
```
**Decision for you:** which API production talks to. Until now `www` (Vercel, off `main`) was the staging front end. Run **one** of these:
```bash
gh variable set NEXT_PUBLIC_API_BASE_URL --env production --repo innocent98/cofoundaz --body https://api.cofoundaz.com/api/v1
```
```bash
gh variable set NEXT_PUBLIC_API_BASE_URL --env production --repo innocent98/cofoundaz --body https://staging-api.cofoundaz.com/api/v1
```
`VPS_PORT`: **leave it unset** while SSH listens on 22 (the default). Set it only if SSH moved to another port. It opens nothing; it is just where the deploy connects.

### 4. API CORS + `APP_BASE_URL` (before the first user arrives)
In the API repo, on the API you chose in step 3 (`production` for `api.`, `staging` for `staging-api.`):
```bash
./scripts/env.sh decrypt production
```
Edit `.env.production`: add `https://www.cofoundaz.com` to `BACKEND_CORS_ORIGINS` (keep the existing entries; JSON list or comma list), and set `APP_BASE_URL=https://www.cofoundaz.com`. Then:
```bash
./scripts/env.sh encrypt production && rm .env.production
```
Commit `.env.production.enc` on a `fix/` branch → PR → merge; the API's CD redeploys with it. This is the lead session's shared stack, so coordinate with it. Also check the provider callbacks that name the web host: Google OAuth authorized origins/redirects, Paystack + Flutterwave callback URLs, Mono, LinkedIn.

### 5. Merge and promote
Merge FE PR #236 into `develop`, then open and merge `develop` → `main` as usual.
```bash
gh pr create --repo innocent98/cofoundaz --base main --head develop --title "release: self-hosted web deploy" --body "Promote develop to main."
```

### 6. First production deploy
Either turn on push deploys **before** merging to `main` (each later push to `main` then deploys by itself):
```bash
gh variable set WEB_VPS_DEPLOY_PRODUCTION --repo innocent98/cofoundaz --body true
```
or run it once by hand after the merge:
```bash
gh workflow run cd-production.yml --repo innocent98/cofoundaz --ref main
```
Watch the run with `gh run watch --repo innocent98/cofoundaz`. Success means `/healthz` passed on loopback **and** through nginx. Then:
```bash
curl -sS https://www.cofoundaz.com/healthz; echo; curl -sS -o /dev/null -w '%{http_code}\n' https://www.cofoundaz.com/
```

### 7. Roll back
Actions → `CD (production)` → Run workflow with `image_tag` = an earlier `sha-<commit>-production` (shown in each run summary):
```bash
gh workflow run cd-production.yml --repo innocent98/cofoundaz --ref main -f image_tag=sha-<commit>-production
```
A failed deploy already rolls itself back. The edge on its own: remove the `sites-enabled` symlink, `nginx -t`, reload.

### 8. Staging afterwards (`stage.cofoundaz.com`, deploys from `develop`)
1. Cloudoon DNS: an `A` record `stage` → the VPS IP (the same IP as `api.`). Check `dig +short stage.cofoundaz.com`.
2. Run `sudo mkdir -p /opt/cofoundaz-web-staging && sudo chown "$(whoami)": /opt/cofoundaz-web-staging`.
3. Step 2 again with `WEB_ENV=staging WEB_SERVER_NAMES="stage.cofoundaz.com" WEB_CERT_NAME="stage.cofoundaz.com" WEB_PORT=3001 OUT_DIR=/tmp/web-edge-staging` (no redirect names), `certbot ... --cert-name stage.cofoundaz.com -d stage.cofoundaz.com`, and the `web-staging*` files. Same standalone layout; its upstream and rate-limit zone names differ, so both sites load side by side.
4. Step 3 with `--env staging`: `DEPLOY_PATH=/opt/cofoundaz-web-staging`, `APP_URL` + `NEXT_PUBLIC_SITE_URL=https://stage.cofoundaz.com`, `WEB_PORT=3001`, `NEXT_PUBLIC_API_BASE_URL=https://staging-api.cofoundaz.com/api/v1`.
5. Add `https://stage.cofoundaz.com` to the **staging** API's `BACKEND_CORS_ORIGINS` (step 4 with `staging`).
6. Run `gh variable set WEB_VPS_DEPLOY_STAGING --repo innocent98/cofoundaz --body true`, then push to `develop` or run `gh workflow run cd-staging.yml --ref develop`.

### Reference: everything the workflows read
| Kind | Name | Production default | Staging default |
|---|---|---|---|
| env secret | `VPS_HOST`, `VPS_USERNAME`, `VPS_SSH_KEY` | same as the API repo | same |
| env secret | `DEPLOY_PATH` | `/opt/cofoundaz-web` | `/opt/cofoundaz-web-staging` |
| env var | `APP_URL` (also the nginx health-check host) | `https://www.cofoundaz.com` | `https://stage.cofoundaz.com` |
| env var | `NEXT_PUBLIC_SITE_URL` | `https://www.cofoundaz.com` | `https://stage.cofoundaz.com` |
| env var | `NEXT_PUBLIC_API_BASE_URL` | your step 3 choice | `https://staging-api.cofoundaz.com/api/v1` |
| env var | `WEB_PORT` (must match the nginx upstream) | `3000` | `3001` |
| env var, optional | `VPS_PORT` | unset (22) | unset |
| env var, optional | `HEALTH_VIA_NGINX` | unset (`true`). `false` only to deploy before the cert exists | unset |
| repo var | `WEB_VPS_DEPLOY_PRODUCTION` / `WEB_VPS_DEPLOY_STAGING` | `true` turns on push deploys | |
| optional | a required reviewer on the `production` environment | one approval per production deploy | |

## Operate
- **Normal:** push to `develop` (staging) or `main` (production). The run summary shows the tag and digest.
- **Promotion:** `develop` → `main` by PR, as today. Production is a rebuild of that commit with production values.

## Verification (2026-11-06, local Docker 29.1.3)
| Check | Result |
|---|---|
| `npm run typecheck`, `npm run lint`, `vitest app/healthz` (2 tests) | ✅ |
| `actionlint` on the 3 workflows, `shellcheck web-deploy.sh` | ✅ clean |
| `hadolint Dockerfile` | ✅ except DL3025 on the `HEALTHCHECK` shell form (false positive; `CMD` is JSON) |
| `docker build` with placeholder build args | ✅ 371 MB image |
| Run via `web-deploy.sh` (loopback, `HEALTH_VIA_NGINX=false`) | ✅ `/healthz` 200, `/` 200, `/sales-hub/x` → 308 `/sales/x`; runs as uid 1000; root fs read-only; placeholder API URL found in `.next/static` chunks |
| Wrong environment (staging image, `STACK_ENV=production`) | ✅ refused at step 3, nothing touched |
| Prune after deploy (3 labelled images, deploy a new one) | ✅ the running and previous images kept, the older one removed |
| Crashing image | ✅ loopback health failed after 120 s → rolled back, `.env` back on the good image, `/healthz` 200 |
| nginx check failing (no nginx locally) | ✅ rolled back, "rollback healthy" |
| `npm run build && next start` (Playwright's path) | ✅ serves, with Next's standalone warning |
| **Not verified** | GHCR push/pull, scp/ssh to the real VPS, the nginx `--resolve` path on a real cert, the GitHub Environment wiring. They need the setup above; the first real run is the proof |

## Follow-ups
- Bump `ci.yml` to Node 24 to match the image (after `ci/pipeline-speed-fe` lands; that branch owns `ci.yml`).
- Design B (same-origin `/api/v1` through nginx): one promotable image, no CORS, first-party cookies (helps D-AUTH-6).
- Image scan (Trivy) and SBOM/provenance attestations, as on the API.
- Use a staging-verified gate before production, like the API, once a web e2e smoke against staging exists.
