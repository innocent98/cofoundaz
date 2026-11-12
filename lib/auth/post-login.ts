import { apiClient } from '@/lib/api/client';
import { forgetInvite, readInvite, rememberPendingEmail } from '@/lib/auth/pending';

// Shared "we now hold a token pair" routing, used by BOTH the password login and
// the MFA challenge so their behavior can't drift. Persists the session, resolves
// the user, and routes to verify / onboarding / dashboard exactly the same way.

interface UserMeResponse {
  data?: {
    user?: { id: string; email: string; status: string };
    profile?: { full_name?: string | null };
    active_workspace_id?: string | null;
  };
}

interface OnboardingStateResponse {
  data?: { step?: number; completed?: boolean };
}

interface RouterLike {
  push: (href: string) => void;
}

export interface PostLoginResult {
  /** Set when an invite was passed but could not be accepted. Nothing was navigated; the caller shows it and offers `continueTo`. */
  inviteError: string | null;
  continueTo: string;
}

async function resolveLanding(opts: {
  accessToken: string;
  refreshToken?: string;
  email?: string;
  nextPath?: string | null;
}): Promise<string> {
  const { accessToken, refreshToken, nextPath } = opts;

  if (typeof window !== 'undefined') {
    localStorage.setItem('cf_token', accessToken);
    if (refreshToken) localStorage.setItem('cf_refresh_token', refreshToken);
  }

  const authHeader = { Authorization: `Bearer ${accessToken}` };

  let meRes: UserMeResponse | null = null;
  try {
    meRes = await apiClient<UserMeResponse>('/auth/me', { headers: authHeader });
    if (meRes?.data?.profile?.full_name) {
      localStorage.setItem('cf_user_name', meRes.data.profile.full_name);
    }
    if (meRes?.data?.user) {
      localStorage.setItem('cf_user', JSON.stringify(meRes.data.user));
    }
    if (meRes?.data?.active_workspace_id) {
      localStorage.setItem('cf_workspace_id', meRes.data.active_workspace_id);
    }
  } catch (meErr) {
    console.warn('Could not fetch user profile details on login:', meErr);
  }

  // Google sign-in has no typed email, so /auth/me is the source.
  const email = meRes?.data?.user?.email ?? opts.email ?? '';

  if (meRes?.data?.user?.status === 'pending_verification') {
    rememberPendingEmail(email);
    return '/verify-email';
  }

  // An invitation link wins over the wizard: the invitee came to join, not to start a startup.
  if (nextPath?.startsWith('/invite/')) return nextPath;

  try {
    const state = await apiClient<OnboardingStateResponse>('/onboarding/state', { headers: authHeader });
    const onb = state.data;
    if (onb?.completed || (typeof onb?.step === 'number' && onb.step > 6)) {
      return nextPath || '/dashboard';
    }
    return '/onboarding';
  } catch (onberr: unknown) {
    if ((onberr as { status?: number })?.status === 403) {
      rememberPendingEmail(email);
      return '/verify-email';
    }
    return nextPath || '/dashboard';
  }
}

export async function completePostLogin(opts: {
  accessToken: string;
  refreshToken?: string;
  /** Optional: when absent (Google sign-in) the email is read from /auth/me. */
  email?: string;
  router: RouterLike;
  nextPath?: string | null;
  /** Invite carried through a Google round trip; accepted once the session exists. */
  inviteToken?: string | null;
}): Promise<PostLoginResult | void> {
  const { router, inviteToken } = opts;
  const landing = await resolveLanding(opts);

  if (inviteToken) {
    try {
      const res = await apiClient<{ data?: { startup_id?: string } }>('/invitations/accept', {
        method: 'POST',
        body: JSON.stringify({ token: inviteToken }),
      });
      clearStoredInvite();
      const startupId = res?.data?.startup_id;
      if (startupId) localStorage.setItem('cf_workspace_id', startupId);
      router.push('/dashboard');
      return;
    } catch (err) {
      clearStoredInvite();
      const d = (err as { data?: { error?: { message?: string } } })?.data;
      return {
        inviteError: d?.error?.message || 'Could not accept the invitation.',
        continueTo: landing,
      };
    }
  }

  router.push(landing);
}

// The invite token survives the Google round trip in sessionStorage (never a URL).
export const INVITE_TOKEN_KEY = 'cf_invite_token';

export function clearStoredInvite(): void {
  forgetInvite();
}

// After onboarding completes, the workspace has JUST been created — the session
// minted at signup/login predates it, so cf_workspace_id is still unset and every
// tenant-scoped call (dashboard, health, notifications, …) 422s on the missing
// X-Workspace-Id header. Re-read /auth/me and persist the now-active workspace id
// before entering the app. Returns the id (or null if it still couldn't resolve).
export async function syncActiveWorkspace(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  try {
    const me = await apiClient<UserMeResponse>('/auth/me');
    const wid = me?.data?.active_workspace_id ?? null;
    if (wid) localStorage.setItem('cf_workspace_id', wid);
    return wid;
  } catch {
    return null;
  }
}

// Where "Continue" goes on the "You're verified" page (gap 9, D-AUTH-4): a pending invite
// first, then the wizard until it is finished, else the dashboard. Signed out → log in
// (carrying the invite link when there is one).

export async function resolveAfterVerify(): Promise<string> {
  const invite = readInvite();
  const inviteHref = invite ? `/invite/${encodeURIComponent(invite)}` : null;
  const signedIn = typeof window !== 'undefined' && !!localStorage.getItem('cf_token');
  if (!signedIn) return inviteHref ? `/login?next=${encodeURIComponent(inviteHref)}` : '/login';
  if (inviteHref) return inviteHref;
  try {
    const state = await apiClient<OnboardingStateResponse>('/onboarding/state');
    return state.data?.completed ? '/dashboard' : '/onboarding';
  } catch {
    return '/dashboard';
  }
}
