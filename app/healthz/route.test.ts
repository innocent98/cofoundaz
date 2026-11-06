import { describe, expect, it } from 'vitest';
import { GET, dynamic } from './route';

describe('/healthz', () => {
  it('returns 200 {status: ok} and is never cached', async () => {
    const res = GET();
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toBe('no-store');
    expect(await res.json()).toEqual({ status: 'ok' });
  });

  it('is rendered per request, not prerendered at build', () => {
    expect(dynamic).toBe('force-dynamic');
  });
});
