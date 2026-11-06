// Liveness probe for the self-hosted deploy (Dockerfile HEALTHCHECK, the CD
// deploy script, and the nginx-routed check). Rendered per request so a 200
// proves the Node server is actually serving, not that a static file exists.
export const dynamic = 'force-dynamic';

export function GET() {
  return Response.json(
    { status: 'ok' },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
