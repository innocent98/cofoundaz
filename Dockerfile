# syntax=docker/dockerfile:1.7
#
# Cofoundaz web (Next.js 16, `output: "standalone"`), self-hosted on the VPS.
# See docs/sop/2026-11-06-fe-vps-deploy.md.
#
# ONE IMAGE PER ENVIRONMENT. Next inlines every NEXT_PUBLIC_* value into the
# client bundle at `next build`, so an image built for staging carries the
# staging API URL forever. CD builds a separate image per environment and stamps
# it with the `com.cofoundaz.web.environment` label; the deploy refuses an image
# whose label does not match the target environment.

ARG NODE_IMAGE=node:24-alpine

# --- deps: install exactly the lockfile -------------------------------------
FROM ${NODE_IMAGE} AS deps
WORKDIR /app
# libc6-compat: some prebuilt native modules (e.g. sharp/swc fallbacks) expect glibc symbols.
# hadolint ignore=DL3018
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json ./
# --ignore-scripts: the only lifecycle script is `prepare` (git hooks), which
# has no git repo to act on here.
RUN npm ci --ignore-scripts

# --- build ------------------------------------------------------------------
FROM ${NODE_IMAGE} AS build
WORKDIR /app
ARG NEXT_PUBLIC_API_BASE_URL
ARG NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL} \
    NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL} \
    NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# --- runtime: standalone server only, non-root ------------------------------
FROM ${NODE_IMAGE} AS runtime
WORKDIR /app
ARG WEB_ENVIRONMENT=local
ARG GIT_SHA=unknown
LABEL org.opencontainers.image.title="cofoundaz-web" \
      org.opencontainers.image.revision="${GIT_SHA}" \
      com.cofoundaz.web.environment="${WEB_ENVIRONMENT}"
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    WEB_ENVIRONMENT=${WEB_ENVIRONMENT}

# The `node` user (uid 1000) ships with the official image. Files stay
# root-owned and read-only to it; only the Next cache dir is writable (and
# compose mounts a tmpfs there because the container runs read_only).
COPY --from=build /app/public ./public
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
RUN mkdir -p .next/cache && chown 1000:1000 .next/cache

USER 1000:1000
EXPOSE 3000
HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/healthz >/dev/null || exit 1
CMD ["node", "server.js"]
