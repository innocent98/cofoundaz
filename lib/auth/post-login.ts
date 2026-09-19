import { apiClient } from '@/lib/api/client';

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

export async function completePostLogin(opts: {
  accessToken: string;
  refreshToken?: string;
  email: string;
  router: RouterLike;
  nextPath?: string | null;
}): Promise<void> {
  const { accessToken, refreshToken, email, router, nextPath } = opts;

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

  if (meRes?.data?.user?.status === 'pending_verification') {
    router.push(`/verify?email=${encodeURIComponent(email)}`);
    return;
  }

  try {
    const state = await apiClient<OnboardingStateResponse>('/onboarding/state', { headers: authHeader });
    const onb = state.data;
    if (onb?.completed || (typeof onb?.step === 'number' && onb.step > 6)) {
      router.push(nextPath || '/dashboard');
    } else {
      router.push('/onboarding');
    }
  } catch (onberr: unknown) {
    if ((onberr as { status?: number })?.status === 403) {
      router.push(`/verify?email=${encodeURIComponent(email)}`);
    } else {
      router.push(nextPath || '/dashboard');
    }
  }
}
