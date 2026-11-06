#!/usr/bin/env bash
# Runs ON THE VPS, from inside DEPLOY_PATH (CD ships it there with the compose
# file). Pulls IMAGE_REF, checks it was built for STACK_ENV, swaps the `web`
# container, health-checks it on loopback and then through nginx, and rolls back
# to the previously running image on any failure.
#
# Required env: IMAGE_REF STACK_ENV WEB_PORT
# Optional env: HEALTH_HOST (public host name; enables the nginx check)
#               HEALTH_VIA_NGINX (default true; "false" skips the nginx check,
#                                 for the very first deploy before TLS exists)
#               GHCR_USER GHCR_TOKEN (docker login when both set)
set -euo pipefail

: "${IMAGE_REF:?}" "${STACK_ENV:?}" "${WEB_PORT:?}"
HEALTH_VIA_NGINX="${HEALTH_VIA_NGINX:-true}"
PROJECT="cofoundaz-web-${STACK_ENV}"
COMPOSE="docker compose -f docker-compose.web.yml --env-file .env"
LOOPBACK_URL="http://127.0.0.1:${WEB_PORT}/healthz"

write_env() {
  umask 077
  cat > .env <<ENV
COMPOSE_PROJECT_NAME=${PROJECT}
WEB_IMAGE=$1
WEB_PORT=${WEB_PORT}
ENV
}

wait_healthy() {
  # $1 = attempts (3s apart)
  for _ in $(seq 1 "$1"); do
    if curl -fsS --max-time 5 "${LOOPBACK_URL}" >/dev/null 2>&1; then
      return 0
    fi
    sleep 3
  done
  return 1
}

nginx_check() {
  if [ "${HEALTH_VIA_NGINX}" = "false" ] || [ -z "${HEALTH_HOST:-}" ]; then
    echo "    nginx check skipped (HEALTH_VIA_NGINX=${HEALTH_VIA_NGINX}, HEALTH_HOST=${HEALTH_HOST:-<unset>})"
    return 0
  fi
  # --resolve pins the name to this box, so the check goes through THIS host's
  # nginx + TLS even while public DNS still points somewhere else (cutover).
  for _ in $(seq 1 5); do
    if curl -fsS --max-time 5 --resolve "${HEALTH_HOST}:443:127.0.0.1" \
         "https://${HEALTH_HOST}/healthz" >/dev/null 2>&1; then
      echo "    nginx: https://${HEALTH_HOST}/healthz -> 200"
      return 0
    fi
    sleep 3
  done
  echo "::error::[${STACK_ENV}] https://${HEALTH_HOST}/healthz via local nginx did not return 200"
  return 1
}

echo "==> [${STACK_ENV}] [1/5] Recording the running image for rollback"
PREV_CID="$(${COMPOSE} ps -q web 2>/dev/null || true)"
PREVIOUS_IMAGE=""
if [ -n "${PREV_CID}" ]; then
  PREVIOUS_IMAGE="$(docker inspect --format '{{.Config.Image}}' "${PREV_CID}" 2>/dev/null || true)"
fi
echo "    previous: ${PREVIOUS_IMAGE:-<none - first deploy>}"
echo "    new     : ${IMAGE_REF}"

echo "==> [${STACK_ENV}] [2/5] Pulling the image"
if [ -n "${GHCR_USER:-}" ] && [ -n "${GHCR_TOKEN:-}" ]; then
  printf '%s' "${GHCR_TOKEN}" | docker login ghcr.io -u "${GHCR_USER}" --password-stdin
fi
case "${IMAGE_REF}" in
  *@sha256:*) docker pull "${IMAGE_REF}" ;;
  *) docker image inspect "${IMAGE_REF}" >/dev/null 2>&1 || docker pull "${IMAGE_REF}" ;;
esac

echo "==> [${STACK_ENV}] [3/5] Checking the image was built for ${STACK_ENV}"
BUILT_FOR="$(docker image inspect --format '{{ index .Config.Labels "com.cofoundaz.web.environment" }}' "${IMAGE_REF}")"
if [ "${BUILT_FOR}" != "${STACK_ENV}" ]; then
  # NEXT_PUBLIC_* are baked in at build time: a staging image in production
  # would point production users at the staging API. Refuse before touching
  # the running container.
  echo "::error::Image was built for '${BUILT_FOR}', not '${STACK_ENV}'. Refusing to deploy."
  exit 1
fi

rollback() {
  echo "!!! [${STACK_ENV}] DEPLOY FAILED - rolling back to ${PREVIOUS_IMAGE:-<nothing>}"
  echo "--- web logs (last 80) ---"
  ${COMPOSE} logs --tail=80 web || true
  if [ -n "${PREVIOUS_IMAGE}" ]; then
    write_env "${PREVIOUS_IMAGE}"
    ${COMPOSE} up -d --no-build --remove-orphans web || true
    if wait_healthy 20; then
      echo "    rollback healthy on ${PREVIOUS_IMAGE}"
    else
      echo "::error::rollback image is not healthy either - site may be down"
    fi
  else
    echo "    no previous image - nothing to roll back to."
  fi
  exit 1
}
trap rollback ERR

echo "==> [${STACK_ENV}] [4/5] Starting the new container"
write_env "${IMAGE_REF}"
${COMPOSE} up -d --no-build --remove-orphans web

echo "==> [${STACK_ENV}] [5/5] Health: loopback, then through nginx"
if ! wait_healthy 40; then
  echo "::error::[${STACK_ENV}] ${LOOPBACK_URL} never returned 200 after ~120s"
  false
fi
echo "    loopback: ${LOOPBACK_URL} -> 200"
nginx_check
trap - ERR

echo "==> [${STACK_ENV}] deployed ${IMAGE_REF}"

# Disk hygiene: keep exactly the running image and the one before it (the
# rollback target); remove every other web image built for this environment.
# Images are never built here - CI builds, the VPS only pulls.
KEEP_IDS="$(docker image inspect --format '{{.Id}}' "${IMAGE_REF}" 2>/dev/null || true)"
if [ -n "${PREVIOUS_IMAGE}" ]; then
  KEEP_IDS="${KEEP_IDS} $(docker image inspect --format '{{.Id}}' "${PREVIOUS_IMAGE}" 2>/dev/null || true)"
fi
for id in $(docker image ls -q --no-trunc --filter "label=com.cofoundaz.web.environment=${STACK_ENV}" | sort -u); do
  case " ${KEEP_IDS} " in
    *" ${id} "*) ;;
    *) docker rmi -f "${id}" >/dev/null 2>&1 && echo "    pruned ${id:7:12}" || true ;;
  esac
done
docker image prune -f >/dev/null 2>&1 || true   # dangling layers only
