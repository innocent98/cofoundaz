import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient, isCredentialEndpoint } from './client';

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
    localStorage.setItem('cf_token', 'old');
    localStorage.setItem('cf_refresh_token', 'r1');
    vi.stubGlobal('fetch', fetchMock);
  });
  afterEach(() => {
    fetchMock.mockReset();
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  const json = (status: number, body: unknown) =>
    new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

  it('refreshes and retries /auth/me after a 401', async () => {
    fetchMock
      .mockResolvedValueOnce(json(401, {}))
      .mockResolvedValueOnce(json(200, { data: { access_token: 'new', refresh_token: 'r2' } }))
      .mockResolvedValueOnce(json(200, { data: { id: 'u1' } }));
    await expect(apiClient('/auth/me')).resolves.toEqual({ data: { id: 'u1' } });
    expect(fetchMock.mock.calls[1][0]).toContain('/auth/refresh');
    expect(new Headers(fetchMock.mock.calls[2][1].headers).get('Authorization')).toBe('Bearer new');
    expect(localStorage.getItem('cf_refresh_token')).toBe('r2');
  });

  it('does not refresh on a 401 from /auth/login', async () => {
    fetchMock.mockResolvedValueOnce(json(401, { detail: 'bad' }));
    await expect(apiClient('/auth/login', { method: 'POST' })).rejects.toMatchObject({ status: 401 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
