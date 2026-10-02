import { apiClient } from './client';

export interface MeUser {
  id: string;
  email: string;
  status?: string;
}

export interface MeProfile {
  full_name: string | null;
  role_title: string | null;
  country: string | null;
  avatar_url: string | null;
}

export interface MeMembership {
  startup_id: string;
  name: string | null;
  role: string | null;
}

export interface MeResponse {
  user: MeUser;
  profile: MeProfile;
  memberships: MeMembership[];
  active_workspace_id: string | null;
}

/** GET /auth/me — the signed-in user, their profile and workspace memberships. */
export async function getMe(): Promise<MeResponse> {
  const res = await apiClient<{ data?: MeResponse } | MeResponse>('/auth/me');
  return (res as { data?: MeResponse }).data ?? (res as MeResponse);
}

/**
 * Sign the user out: best-effort server-side `POST /auth/logout`, then clear the
 * local session tokens regardless of the server's response. The caller handles
 * the redirect to /login.
 */
export async function logout(): Promise<void> {
  try {
    await apiClient('/auth/logout', { method: 'POST' });
  } catch {
    // Still clear locally even if the server call fails.
  }
  try {
    localStorage.removeItem('cf_token');
    localStorage.removeItem('cf_refresh_token');
    localStorage.removeItem('cf_workspace_id');
  } catch {
    /* ignore storage errors */
  }
}
