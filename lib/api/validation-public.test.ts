import { afterEach, describe, expect, it, vi } from 'vitest';
import { PublicApiError, getPublicPage, sendPublicEvent, submitPublicSignup } from './validation-public';

const ok = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

afterEach(() => vi.unstubAllGlobals());

describe('public smoke-test page client', () => {
  it('sends no auth or workspace headers', async () => {
    localStorage.setItem('cf_token', 'stale');
    localStorage.setItem('cf_workspace_id', 'ws');
    const fetchMock = vi.fn().mockResolvedValue(ok({ data: { headline: 'H' } }));
    vi.stubGlobal('fetch', fetchMock);
    await getPublicPage('novapay');
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/v1/validation/pages/novapay');
    expect(Object.keys(init.headers)).toEqual(['Content-Type']);
    localStorage.clear();
  });

  it('turns a 404 into a PublicApiError with the status', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(ok({ error: { code: 'NOT_FOUND' } }, 404)));
    await expect(getPublicPage('nope')).rejects.toMatchObject({ status: 404 });
  });

  it('reports a network failure as status 0', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('offline')));
    await expect(getPublicPage('x')).rejects.toBeInstanceOf(PublicApiError);
    await expect(getPublicPage('x')).rejects.toMatchObject({ status: 0 });
  });

  it('posts events fire-and-forget and never throws', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new TypeError('offline'));
    vi.stubGlobal('fetch', fetchMock);
    expect(() => sendPublicEvent('novapay', 'visit', 'abcdefgh')).not.toThrow();
    await Promise.resolve();
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/v1/validation/pages/novapay/events');
    expect(JSON.parse(init.body)).toEqual({ kind: 'visit', visitor_id: 'abcdefgh' });
  });

  it('returns the server message for a signup', async () => {
    const fetchMock = vi.fn().mockResolvedValue(ok({ data: { message: 'On the list!' } }, 201));
    vi.stubGlobal('fetch', fetchMock);
    await expect(submitPublicSignup('novapay', 'a@example.com', 'abcdefgh')).resolves.toBe('On the list!');
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ email: 'a@example.com', visitor_id: 'abcdefgh' });
  });
});
