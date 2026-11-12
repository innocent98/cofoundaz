import { AUTH_MODE_HEADER } from '@/lib/auth/session';
import { apiClient } from './client';
import type { MeResponse } from './profile';

// Settings hub: Profile, Security, Workspace.
// Contract: cofoundaz-api/docs/fe-integration-guide-settings.md (bodies there are live captures).

async function call<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const res = await apiClient<{ data: T }>(endpoint, options);
  return res.data;
}

const json = (body: unknown): RequestInit => ({ body: JSON.stringify(body) });

// ---------------------------------------------------------------- profile

/** Fields PATCH /auth/me accepts. `country` and `phone` take null to clear. Unknown fields are a 422. */
export interface ProfilePatch {
  full_name?: string;
  role_title?: string;
  country?: string | null;
  phone?: string | null;
}

export function updateProfile(patch: ProfilePatch): Promise<MeResponse> {
  return call<MeResponse>('/auth/me', { method: 'PATCH', ...json(patch) });
}

/** POST /auth/me/avatar (multipart `file`): PNG, JPG or WebP up to 2 MB, checked by content. */
export function uploadAvatar(file: File): Promise<MeResponse> {
  const form = new FormData();
  form.append('file', file);
  return call<MeResponse>('/auth/me/avatar', { method: 'POST', body: form });
}

export function removeAvatar(): Promise<MeResponse> {
  return call<MeResponse>('/auth/me/avatar', { method: 'DELETE' });
}

// ---------------------------------------------------------------- security

export interface MfaStatus {
  enabled: boolean;
  method: string | null;
  enabled_at: string | null;
  backup_codes_remaining: number;
}

export const getMfaStatus = (): Promise<MfaStatus> => call<MfaStatus>('/auth/mfa');

export const regenerateBackupCodes = (password: string): Promise<{ backup_codes: string[] }> =>
  call('/auth/mfa/backup-codes/regenerate', { method: 'POST', ...json({ password }) });

export const disableMfa = (password: string, code: string): Promise<{ enabled: boolean }> =>
  call('/auth/mfa/disable', { method: 'POST', ...json({ password, code }) });

export interface PasswordChangeResult {
  changed: boolean;
  other_sessions_signed_out: number;
}

/**
 * POST /auth/password/change. The HttpOnly refresh cookie identifies this device (X-Auth-Mode: cookie),
 * so it keeps this sign-in and revokes the others.
 */
export function changePassword(currentPassword: string, newPassword: string): Promise<PasswordChangeResult> {
  return call('/auth/password/change', {
    method: 'POST',
    credentials: 'include',
    headers: { ...AUTH_MODE_HEADER },
    ...json({ current_password: currentPassword, new_password: newPassword }),
  });
}

export interface AuthSession {
  id: string;
  label: string;
  ip: string | null;
  signed_in_at: string;
  expires_at: string;
  current: boolean;
}

export const listSessions = (): Promise<AuthSession[]> => call<AuthSession[]>('/auth/sessions');

export const revokeSession = (id: string): Promise<{ revoked: boolean }> =>
  call(`/auth/sessions/${id}`, { method: 'DELETE' });

/** Keeps this device (the cookie identifies it). 409 CURRENT_SESSION_UNKNOWN when there is no cookie. */
export function revokeOtherSessions(): Promise<{ revoked: number }> {
  return call('/auth/sessions/revoke-others', {
    method: 'POST',
    credentials: 'include',
    headers: { ...AUTH_MODE_HEADER },
    ...json({}),
  });
}

// ---------------------------------------------------------------- workspace

export interface WorkspaceSettings {
  id: string;
  name: string;
  description: string | null;
  website: string | null;
  logo_url: string | null;
  industry: string | null;
  business_model: string | null;
  stage: string | null;
  country: string | null;
  /** True for founders only. */
  can_edit: boolean;
}

export type WorkspacePatch = Partial<
  Pick<WorkspaceSettings, 'name' | 'description' | 'website' | 'industry' | 'business_model' | 'stage' | 'country'>
>;

export const getWorkspace = (): Promise<WorkspaceSettings> => call<WorkspaceSettings>('/workspace');

export const updateWorkspace = (patch: WorkspacePatch): Promise<WorkspaceSettings> =>
  call<WorkspaceSettings>('/workspace', { method: 'PATCH', ...json(patch) });

/** PNG, JPG or WebP up to 2 MB (SVG is rejected here). */
export function uploadWorkspaceLogo(file: File): Promise<WorkspaceSettings> {
  const form = new FormData();
  form.append('file', file);
  return call<WorkspaceSettings>('/workspace/logo', { method: 'POST', body: form });
}

// ---------------------------------------------------------------- AI preferences
// cofoundaz-api/docs/fe-integration-guide-ai-settings.md. Per member per workspace; founder and team member only (others 403).

export type AiTone = 'straight_shooter' | 'encouraging';

export interface AiSettings {
  proactive_suggestions: boolean;
  daily_briefing: boolean;
  tone: AiTone;
}

export const getAiSettings = (): Promise<AiSettings> => call<AiSettings>('/ai/settings');

/** Send only what changes; the response is always the full object. */
export const updateAiSettings = (patch: Partial<AiSettings>): Promise<AiSettings> =>
  call<AiSettings>('/ai/settings', { method: 'PATCH', ...json(patch) });
