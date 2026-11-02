import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import React, { StrictMode } from 'react';
import { ApiError } from '@/lib/api/client';
import GoogleCallbackPage from './page';

const push = vi.fn();
const replace = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push, replace }) }));

const exchange = vi.fn();
vi.mock('@/lib/api/google-signin', async () => {
  const actual = await vi.importActual<typeof import('@/lib/api/google-signin')>('@/lib/api/google-signin');
  return { ...actual, exchangeGoogleTicket: (t: string) => exchange(t) };
});

const completePostLogin = vi.fn();
vi.mock('@/lib/auth/post-login', async () => {
  const actual = await vi.importActual<typeof import('@/lib/auth/post-login')>('@/lib/auth/post-login');
  return { ...actual, completePostLogin: (o: unknown) => completePostLogin(o) };
});

function visit(path: string) {
  window.history.replaceState(null, '', path);
}

describe('Google callback page', () => {
  beforeEach(() => {
    push.mockReset();
    replace.mockReset();
    exchange.mockReset();
    completePostLogin.mockReset();
    sessionStorage.clear();
    visit('/auth/google/callback');
  });

  it('shows the spinner copy while exchanging and scrubs the ticket from the URL', async () => {
    exchange.mockReturnValue(new Promise(() => {}));
    visit('/auth/google/callback#ticket=abc');
    render(<GoogleCallbackPage />);
    expect(screen.getByText('Signing you in with Google')).toBeInTheDocument();
    expect(window.location.hash).toBe('');
    expect(window.location.pathname).toBe('/auth/google/callback');
    await waitFor(() => expect(exchange).toHaveBeenCalledWith('abc'));
  });

  it('redeems the ticket once under strict-mode double effects', async () => {
    exchange.mockResolvedValue({ access_token: 'a', refresh_token: 'r', mfa_required: false });
    visit('/auth/google/callback#ticket=abc');
    render(
      <StrictMode>
        <GoogleCallbackPage />
      </StrictMode>
    );
    await waitFor(() => expect(completePostLogin).toHaveBeenCalled());
    expect(exchange).toHaveBeenCalledTimes(1);
  });

  it('signs in with no email and no invite, using the safe next path', async () => {
    exchange.mockResolvedValue({ access_token: 'a', refresh_token: 'r', mfa_required: false, is_new_user: true, next: '/dashboard' });
    visit('/auth/google/callback#ticket=abc');
    render(<GoogleCallbackPage />);
    await waitFor(() => expect(completePostLogin).toHaveBeenCalled());
    expect(completePostLogin.mock.calls[0][0]).toMatchObject({
      accessToken: 'a',
      refreshToken: 'r',
      nextPath: '/dashboard',
      inviteToken: null,
    });
    expect(completePostLogin.mock.calls[0][0]).not.toHaveProperty('email');
  });

  it.each(['//evil.example', '/\\evil.example', 'https://evil.example', '/a\nb'])('drops an unsafe next path %j', async (bad) => {
    exchange.mockResolvedValue({ access_token: 'a', next: bad });
    visit('/auth/google/callback#ticket=abc');
    render(<GoogleCallbackPage />);
    await waitFor(() => expect(completePostLogin).toHaveBeenCalled());
    expect(completePostLogin.mock.calls[0][0].nextPath).toBeNull();
  });

  it('hands an MFA account to the challenge page without a session', async () => {
    exchange.mockResolvedValue({ mfa_required: true, mfa_ticket: 'mt', access_token: null, invite_token: 'inv', next: '/x' });
    visit('/auth/google/callback#ticket=abc');
    render(<GoogleCallbackPage />);
    await waitFor(() => expect(push).toHaveBeenCalledWith('/login/mfa'));
    expect(JSON.parse(sessionStorage.getItem('cf_mfa_handoff') as string)).toEqual({ ticket: 'mt', next: '/x', invite: 'inv' });
    expect(completePostLogin).not.toHaveBeenCalled();
  });

  it('passes the invite token to post-login', async () => {
    exchange.mockResolvedValue({ access_token: 'a', invite_token: 'inv-1', is_new_user: true });
    visit('/auth/google/callback#ticket=abc');
    render(<GoogleCallbackPage />);
    await waitFor(() => expect(completePostLogin).toHaveBeenCalled());
    expect(completePostLogin.mock.calls[0][0].inviteToken).toBe('inv-1');
  });

  it('ignores a stored invite token the API did not return, and clears it', async () => {
    sessionStorage.setItem('cf_invite_token', 'stored-1');
    exchange.mockResolvedValue({ access_token: 'a' });
    visit('/auth/google/callback#ticket=abc');
    render(<GoogleCallbackPage />);
    await waitFor(() => expect(completePostLogin).toHaveBeenCalled());
    expect(completePostLogin.mock.calls[0][0].inviteToken).toBeNull();
    expect(sessionStorage.getItem('cf_invite_token')).toBeNull();
  });

  it('shows the API message when the invite cannot be accepted and continues on click', async () => {
    exchange.mockResolvedValue({ access_token: 'a', invite_token: 'inv' });
    completePostLogin.mockResolvedValue({ inviteError: 'Invite already used.', continueTo: '/onboarding' });
    visit('/auth/google/callback#ticket=abc');
    render(<GoogleCallbackPage />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Invite already used.');
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(push).toHaveBeenCalledWith('/onboarding');
  });

  const cases: Array<[string, string]> = [
    ['access_denied', 'You cancelled Google sign-in.'],
    ['email_not_verified', "Google hasn't verified that email address. Use another Google account or sign up with email."],
    ['invalid_state', 'That sign-in expired. Please try again.'],
    ['invite_email_mismatch', 'This invitation was sent to a different email address. Sign in with the invited Google account.'],
    ['invite_invalid', 'This invitation is no longer valid.'],
    ['account_disabled', 'This account has been suspended. Contact support.'],
    ['account_unavailable', 'This account is unavailable.'],
    ['google_account_mismatch', 'This account is linked to a different Google account. Use that one, or sign in with your password.'],
    ['exchange_failed', "We couldn't verify your Google sign-in. Try again."],
    ['maintenance', "Cofoundaz is in maintenance. New accounts can't be created right now."],
    ['rate_limited', 'Too many attempts. Try again in a few minutes.'],
    ['try_again', 'Something went wrong. Please try again.'],
    ['something_new', "We couldn't sign you in with Google. Try again."],
  ];
  it.each(cases)('maps ?error=%s to its copy', async (code, copy) => {
    visit(`/auth/google/callback?error=${code}`);
    render(<GoogleCallbackPage />);
    expect(await screen.findByRole('alert')).toHaveTextContent(copy);
    expect(screen.getByRole('link', { name: 'Back to sign in' })).toHaveAttribute('href', '/login');
    expect(exchange).not.toHaveBeenCalled();
    expect(window.location.search).toBe('');
  });

  it('shows the expired copy for GOOGLE_TICKET_INVALID', async () => {
    exchange.mockRejectedValue(new ApiError(400, 'Bad Request', { error: { code: 'GOOGLE_TICKET_INVALID' } }));
    visit('/auth/google/callback#ticket=abc');
    render(<GoogleCallbackPage />);
    expect(await screen.findByRole('alert')).toHaveTextContent('That sign-in has expired. Start again.');
  });

  it('shows the rate-limit copy on 429 and a generic one on other failures', async () => {
    exchange.mockRejectedValueOnce(new ApiError(429, 'Too Many', {}));
    visit('/auth/google/callback#ticket=abc');
    const { unmount } = render(<GoogleCallbackPage />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Too many attempts. Please wait a moment and try again.');
    unmount();
    exchange.mockRejectedValueOnce(new Error('network'));
    visit('/auth/google/callback#ticket=def');
    render(<GoogleCallbackPage />);
    expect(await screen.findByRole('alert')).toHaveTextContent("We couldn't sign you in with Google. Try again.");
  });

  it('sends a reload with neither ticket nor error to /login', async () => {
    render(<GoogleCallbackPage />);
    await waitFor(() => expect(replace).toHaveBeenCalledWith('/login'));
    expect(exchange).not.toHaveBeenCalled();
  });
});
