import { describe, expect, it, vi, beforeEach } from 'vitest';
import { ApiError } from './client';

const apiClient = vi.fn();
vi.mock('./client', async () => {
  const actual = await vi.importActual<typeof import('./client')>('./client');
  return { ...actual, apiClient: (...a: unknown[]) => apiClient(...a) };
});

import { startGoogleSignIn, googleStartErrorMessage } from './google-signin';
import { completePostLogin } from '@/lib/auth/post-login';

const assign = vi.fn();

describe('startGoogleSignIn', () => {
  beforeEach(() => {
    apiClient.mockReset();
    assign.mockReset();
    sessionStorage.clear();
    Object.defineProperty(window, 'location', { value: { ...window.location, assign }, writable: true });
  });

  it('posts with credentials, sends the stored invite and next, then navigates', async () => {
    sessionStorage.setItem('cf_invite_token', 'inv');
    apiClient.mockResolvedValue({ data: { auth_url: 'https://accounts.google.com/x' } });
    await startGoogleSignIn('/dashboard');
    const [path, opts] = apiClient.mock.calls[0];
    expect(path).toBe('/auth/oauth/google/start');
    expect(opts.credentials).toBe('include');
    expect(JSON.parse(opts.body)).toEqual({ invite_token: 'inv', next: '/dashboard' });
    expect(assign).toHaveBeenCalledWith('https://accounts.google.com/x');
  });

  it('omits invite_token and next when there are none', async () => {
    apiClient.mockResolvedValue({ data: { auth_url: 'https://g/x' } });
    await startGoogleSignIn(null);
    expect(JSON.parse(apiClient.mock.calls[0][1].body)).toEqual({});
  });

  it('maps start errors to copy', () => {
    expect(googleStartErrorMessage(new ApiError(503, '', {}))).toBe("Google sign-in isn't available right now. Use your email instead.");
    expect(googleStartErrorMessage(new ApiError(429, '', {}))).toBe('Too many attempts. Please wait a moment and try again.');
    expect(googleStartErrorMessage(new ApiError(500, '', {}))).toBe("We couldn't start Google sign-in. Please try again.");
  });

  it('on 404 with an invite shows the invite copy and drops the stored token', () => {
    sessionStorage.setItem('cf_invite_token', 'inv');
    expect(googleStartErrorMessage(new ApiError(404, '', {}))).toBe('This invitation is no longer valid.');
    expect(sessionStorage.getItem('cf_invite_token')).toBeNull();
  });
});

describe('completePostLogin with Google (no email, invite)', () => {
  beforeEach(() => {
    apiClient.mockReset();
    localStorage.clear();
    sessionStorage.setItem('cf_invite_token', 'inv');
  });

  function routes(accept: () => unknown) {
    apiClient.mockImplementation(async (path: string) => {
      if (path === '/auth/me') return { data: { user: { id: 'u', email: 'g@example.com', status: 'active' }, active_workspace_id: null } };
      if (path === '/onboarding/state') return { data: { step: 1, completed: false } };
      if (path === '/invitations/accept') return accept();
      throw new Error(path);
    });
  }

  it('new Google user lands in onboarding', async () => {
    routes(() => ({}));
    const push = vi.fn();
    await completePostLogin({ accessToken: 'a', router: { push } });
    expect(push).toHaveBeenCalledWith('/onboarding');
  });

  it('accepts the invite and goes to the dashboard', async () => {
    routes(() => ({ data: { startup_id: 's1', role: 'team_member' } }));
    const push = vi.fn();
    await completePostLogin({ accessToken: 'a', router: { push }, inviteToken: 'inv' });
    expect(push).toHaveBeenCalledWith('/dashboard');
    expect(localStorage.getItem('cf_workspace_id')).toBe('s1');
    expect(sessionStorage.getItem('cf_invite_token')).toBeNull();
  });

  it('returns the API message and does not navigate when accept fails', async () => {
    routes(() => {
      throw new ApiError(400, '', { error: { message: 'Invite already used.' } });
    });
    const push = vi.fn();
    const r = await completePostLogin({ accessToken: 'a', router: { push }, inviteToken: 'inv' });
    expect(r).toEqual({ inviteError: 'Invite already used.', continueTo: '/onboarding' });
    expect(push).not.toHaveBeenCalled();
  });
});
