import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient, isCredentialEndpoint } from './client';
import { clearSession, getAccessToken, setSession } from '@/lib/auth/session';

describe('isCredentialEndpoint', () => {
  it.each([
    '/auth/login',
    '/auth/signup',
    '/auth/refresh',
    '/auth/verify',
    '/auth/verify/resend',
    '/auth/password/forgot',
    '/auth/password/reset',
    '/auth/mfa/challenge',
    '/shared/abc',
    '/sign/abc',
  ])('exempts %s from refresh', (e) => expect(isCredentialEndpoint(e)).toBe(true));

  it.each(['/auth/me', '/auth/sessions', '/auth/mfa/totp/setup', '/auth/mfa/totp/verify', '/auth/logout', '/missions/today'])(
    'refreshes and retries %s',
    (e) => expect(isCredentialEndpoint(e)).toBe(false),
  );
});

describe('apiClient 401 handling', () => {
  const fetchMock = vi.fn();
  beforeEach(() => {
    setSession({ access_token: 'old' });
    vi.stubGlobal('fetch', fetchMock);
  });
  afterEach(() => {
    fetchMock.mockReset();
    vi.unstubAllGlobals();
    clearSession();
    localStorage.clear();
  });

  const json = (status: number, body: unknown) =>
    new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

  it('refreshes and retries /auth/me after a 401', async () => {
    fetchMock
      .mockResolvedValueOnce(json(401, {}))
      .mockResolvedValueOnce(json(200, { data: { access_token: 'new', refresh_token: null, expires_in: 900 } }))
      .mockResolvedValueOnce(json(200, { data: { id: 'u1' } }));
    await expect(apiClient('/auth/me')).resolves.toEqual({ data: { id: 'u1' } });
    expect(fetchMock.mock.calls[1][0]).toContain('/auth/refresh');
    expect(new Headers(fetchMock.mock.calls[2][1].headers).get('Authorization')).toBe('Bearer new');
    // Cookie mode: no body, credentials and the CSRF header, and the token stays in memory only.
    const [, init] = fetchMock.mock.calls[1];
    expect(init.credentials).toBe('include');
    expect(init.body).toBeUndefined();
    expect(new Headers(init.headers).get('X-Auth-Mode')).toBe('cookie');
    expect(getAccessToken()).toBe('new');
    expect(JSON.stringify({ ...localStorage })).not.toContain('new');
  });

  it('does not refresh on a 401 from /auth/login', async () => {
    fetchMock.mockResolvedValueOnce(json(401, { detail: 'bad' }));
    await expect(apiClient('/auth/login', { method: 'POST' })).rejects.toMatchObject({ status: 401 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('login sends cookie mode and includes credentials', async () => {
    fetchMock.mockResolvedValueOnce(json(200, { data: { access_token: 'a' } }));
    await apiClient('/auth/login', { method: 'POST', body: '{}' });
    const [, init] = fetchMock.mock.calls[0];
    expect(init.credentials).toBe('include');
    expect(new Headers(init.headers).get('X-Auth-Mode')).toBe('cookie');
  });

  it('a page load with only the hint refreshes before the first call', async () => {
    clearSession();
    localStorage.setItem('cf_session', '1');
    fetchMock
      .mockResolvedValueOnce(json(200, { data: { access_token: 'fresh', refresh_token: null, expires_in: 900 } }))
      .mockResolvedValueOnce(json(200, { data: { id: 'u1' } }));
    await apiClient('/missions/today');
    expect(fetchMock.mock.calls[0][0]).toContain('/auth/refresh');
    expect(new Headers(fetchMock.mock.calls[1][1].headers).get('Authorization')).toBe('Bearer fresh');
  });

  it('with no hint and no token an anonymous call makes no refresh', async () => {
    clearSession();
    fetchMock.mockResolvedValueOnce(json(200, { data: {} }));
    await apiClient('/invitations/abc');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('a 401 for a request sent with a token that is no longer current retries with the current one, no refresh', async () => {
    fetchMock
      .mockImplementationOnce(async () => {
        setSession({ access_token: 'renewed' }) // another call renewed the token while this one was in flight
        return json(401, {})
      })
      .mockResolvedValueOnce(json(200, { data: { ok: true } }))
    await expect(apiClient('/missions/today')).resolves.toEqual({ data: { ok: true } })
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(fetchMock.mock.calls[1][0]).not.toContain('/auth/refresh')
    expect(new Headers(fetchMock.mock.calls[1][1].headers).get('Authorization')).toBe('Bearer renewed')
  })
});
