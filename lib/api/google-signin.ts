import { apiClient, ApiError } from './client';
import { googleSignIn } from '@/content/auth';
import { INVITE_TOKEN_KEY, clearStoredInvite } from '@/lib/auth/post-login';

// Google sign-in / sign-up. The FE never sees a Google token: `start` returns a
// URL, the API handles Google's redirect, and the callback page redeems a
// single-use ticket. Contract: cofoundaz-api/docs/fe-integration-guide-google-sign-in.md

export interface GoogleExchangeData {
  access_token?: string | null;
  refresh_token?: string | null;
  mfa_required?: boolean;
  mfa_ticket?: string;
  is_new_user?: boolean;
  invite_token?: string | null;
  next?: string | null;
}

function storedInvite(): string | null {
  try {
    return sessionStorage.getItem(INVITE_TOKEN_KEY);
  } catch {
    return null;
  }
}

/** POST /auth/oauth/google/start, then send the whole window to Google. */
export async function startGoogleSignIn(next?: string | null): Promise<void> {
  const invite = storedInvite();
  const body: { invite_token?: string; next?: string } = {};
  if (invite) body.invite_token = invite;
  if (next) body.next = next;

  // credentials: 'include' so the API's proof cookie is stored for the return trip.
  const res = await apiClient<{ data?: { auth_url?: string } }>('/auth/oauth/google/start', {
    method: 'POST',
    credentials: 'include',
    body: JSON.stringify(body),
  });
  const url = res?.data?.auth_url;
  if (!url) throw new Error(googleSignIn.startGeneric);
  window.location.assign(url);
}

/** Copy for a failed `start`. A 404 with an invite means the invite died; the stored token is dropped. */
export function googleStartErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 503) return googleSignIn.startNotConfigured;
    if (err.status === 404 && storedInvite()) {
      clearStoredInvite();
      return googleSignIn.inviteInvalid;
    }
    if (err.status === 429) return googleSignIn.tooManyAttempts;
  }
  return googleSignIn.startGeneric;
}

/** POST /auth/oauth/google/exchange. Single use; must carry the proof cookie. */
export async function exchangeGoogleTicket(ticket: string): Promise<GoogleExchangeData> {
  const res = await apiClient<{ data?: GoogleExchangeData }>('/auth/oauth/google/exchange', {
    method: 'POST',
    credentials: 'include',
    body: JSON.stringify({ ticket }),
  });
  return res?.data ?? {};
}

export function googleErrorMessage(code: string | null | undefined): string {
  const table = googleSignIn.errors as Record<string, string>;
  return (code && Object.prototype.hasOwnProperty.call(table, code) && table[code]) || googleSignIn.unknownError;
}
