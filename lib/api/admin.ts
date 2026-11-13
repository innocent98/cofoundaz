import { apiClient, ApiError } from './client';

// ============================================================================
// Types
// ============================================================================

export interface AdminMeResponse {
  user_id: string;
  role: 'super_admin' | 'admin' | string;
  scopes: string[];
  email?: string;
  full_name?: string | null;
}

export interface DashboardKpisResponse {
  total_workspaces: {
    value: number;
    new_in_window: number;
  };
  activation_rate: {
    percent: number;
    previous_percent: number | null;
  };
  paid_conversion: {
    percent: number;
    previous_percent: number | null;
  };
  mrr: {
    minor: number;
    currency?: string;
  };
  signups_series: Array<{
    date: string;
    signups: number;
    activations: number;
  }>;
}

export interface AdminWorkspaceRow {
  id: string;
  name: string;
  owner: {
    id: string;
    name: string | null;
    email: string;
  } | null;
  stage: string | null;
  seats: number;
  members: number;
  plan: string | null;
  health_score: number | null;
  country: string | null;
  last_active_at: string | null;
  created_at?: string;
}

export interface AdminWorkspacesResponse {
  workspaces: AdminWorkspaceRow[];
  next_cursor: string | null;
}

export interface AdminWorkspaceMember {
  id: string;
  user_id: string;
  name: string | null;
  email: string;
  role: string;
  joined_at?: string | null;
}

export interface AdminWorkspaceIntegration {
  id: string;
  provider: string;
  status: string;
  connected_at?: string | null;
}

export interface AdminWorkspaceUsageMeter {
  used: number;
  limit: number | null;
}

export interface AdminWorkspaceDetail {
  id: string;
  name: string;
  owner: {
    id: string;
    name: string | null;
    email: string;
  } | null;
  stage: string | null;
  seats: number;
  seats_limit: number | null; // null = Unlimited
  members_count: number;
  members: AdminWorkspaceMember[];
  subscription: {
    plan: string;
    billing_status: string;
    billing_interval?: string | null;
    renews_at?: string | null;
    expires_at?: string | null;
  } | null;
  usage_meters?: Record<string, AdminWorkspaceUsageMeter> | null;
  integrations: AdminWorkspaceIntegration[];
  health_score: number | null;
  created_at: string;
  last_active_at: string | null;
}

export interface AdminUserPrimaryWorkspace {
  id: string;
  name: string;
  billing_status: string;
  plan?: string | null;
}

export interface AdminUserRow {
  id: string;
  full_name: string | null;
  email: string;
  status: 'active' | 'disabled' | 'pending_verification' | string;
  activity: 'active' | 'dormant' | string;
  workspace_count: number;
  primary_workspace: AdminUserPrimaryWorkspace | null;
  created_at: string;
  last_active_at?: string | null;
}

export interface AdminUsersResponse {
  users: AdminUserRow[];
  next_cursor: string | null;
}

export interface AdminUserSession {
  id: string;
  ip_address: string | null;
  user_agent: string | null;
  signed_in_at: string | null;
  ended_at?: string | null;
}

export interface AdminUserWorkspaceMembership {
  id: string;
  name: string;
  role: string;
  plan: string | null;
  billing_status: string;
}

export interface AdminUserDetail {
  id: string;
  full_name: string | null;
  email: string;
  phone: string | null; // null for staff target
  status: 'active' | 'disabled' | 'pending_verification' | string;
  activity: 'active' | 'dormant' | string;
  is_staff?: boolean;
  workspaces: AdminUserWorkspaceMembership[];
  sessions: AdminUserSession[]; // [] for staff target
  can: {
    suspend: boolean;
    unsuspend: boolean;
    reset_password: boolean;
    resend_verification: boolean;
  };
  created_at: string;
  last_active_at?: string | null;
}

export interface StaffActionPayload {
  reason: string;
  totp_code: string;
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Super Admin has scopes: [] and passes every scope check.
 * Admins require the specific scope to be present.
 */
export function hasAdminScope(me: AdminMeResponse | null, requiredScope: string): boolean {
  if (!me) return false;
  if (me.role === 'super_admin') return true;
  return Array.isArray(me.scopes) && me.scopes.includes(requiredScope);
}

// ============================================================================
// API Calls
// ============================================================================

/**
 * Staff probe: GET /admin/me
 * 200 = staff. 404 = not staff (throws ApiError with status 404).
 */
export async function getAdminMe(): Promise<AdminMeResponse> {
  const res = await apiClient<{ data?: AdminMeResponse } | AdminMeResponse>('/admin/me');
  if ('data' in res && res.data) {
    return res.data;
  }
  return res as AdminMeResponse;
}

/**
 * Dashboard KPIs: GET /admin/dashboard/kpis
 */
export async function getAdminKpis(): Promise<DashboardKpisResponse> {
  const res = await apiClient<{ data?: DashboardKpisResponse } | DashboardKpisResponse>('/admin/dashboard/kpis');
  if ('data' in res && res.data) {
    return res.data;
  }
  return res as DashboardKpisResponse;
}

/**
 * Workspaces list: GET /admin/workspaces
 */
export async function getAdminWorkspaces(params: {
  query?: string;
  stage?: string;
  billing_status?: string;
  cursor?: string;
  limit?: number;
} = {}): Promise<AdminWorkspacesResponse> {
  const query = new URLSearchParams();
  if (params.query?.trim()) query.set('query', params.query.trim());
  if (params.stage && params.stage !== 'all') query.set('stage', params.stage);
  if (params.billing_status && params.billing_status !== 'all') query.set('billing_status', params.billing_status);
  if (params.cursor) query.set('cursor', params.cursor);
  if (params.limit) query.set('limit', String(params.limit));

  const qs = query.toString();
  const endpoint = qs ? `/admin/workspaces?${qs}` : '/admin/workspaces';

  const res = await apiClient<{
    data?: { workspaces?: AdminWorkspaceRow[] };
    workspaces?: AdminWorkspaceRow[];
    meta?: { next_cursor?: string | null };
    next_cursor?: string | null;
  }>(endpoint);

  const workspaces = res.data?.workspaces ?? res.workspaces ?? [];
  const next_cursor = res.meta?.next_cursor ?? res.next_cursor ?? null;

  return { workspaces, next_cursor };
}

/**
 * Workspace detail: GET /admin/workspaces/{id}
 */
export async function getAdminWorkspace(id: string): Promise<AdminWorkspaceDetail> {
  const res = await apiClient<{ data?: AdminWorkspaceDetail } | AdminWorkspaceDetail>(
    `/admin/workspaces/${encodeURIComponent(id)}`
  );
  if ('data' in res && res.data) {
    return res.data;
  }
  return res as AdminWorkspaceDetail;
}

/**
 * Users list: GET /admin/users
 */
export async function getAdminUsers(params: {
  query?: string;
  billing_status?: string;
  activity?: string;
  cursor?: string;
  limit?: number;
} = {}): Promise<AdminUsersResponse> {
  const query = new URLSearchParams();
  if (params.query?.trim()) query.set('query', params.query.trim());
  if (params.billing_status && params.billing_status !== 'all') query.set('billing_status', params.billing_status);
  if (params.activity && params.activity !== 'all') query.set('activity', params.activity);
  if (params.cursor) query.set('cursor', params.cursor);
  if (params.limit) query.set('limit', String(params.limit));

  const qs = query.toString();
  const endpoint = qs ? `/admin/users?${qs}` : '/admin/users';

  const res = await apiClient<{
    data?: { users?: AdminUserRow[] };
    users?: AdminUserRow[];
    meta?: { next_cursor?: string | null };
    next_cursor?: string | null;
  }>(endpoint);

  const users = res.data?.users ?? res.users ?? [];
  const next_cursor = res.meta?.next_cursor ?? res.next_cursor ?? null;

  return { users, next_cursor };
}

/**
 * User detail: GET /admin/users/{id}
 */
export async function getAdminUser(id: string): Promise<AdminUserDetail> {
  const res = await apiClient<{ data?: AdminUserDetail } | AdminUserDetail>(
    `/admin/users/${encodeURIComponent(id)}`
  );
  if ('data' in res && res.data) {
    return res.data;
  }
  return res as AdminUserDetail;
}

/**
 * Suspend user: POST /admin/users/{id}/suspend
 */
export async function suspendUser(id: string, payload: StaffActionPayload): Promise<void> {
  await apiClient(`/admin/users/${encodeURIComponent(id)}/suspend`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Unsuspend user: POST /admin/users/{id}/unsuspend
 */
export async function unsuspendUser(id: string, payload: StaffActionPayload): Promise<void> {
  await apiClient(`/admin/users/${encodeURIComponent(id)}/unsuspend`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Send password reset link: POST /admin/users/{id}/reset-password
 */
export async function sendUserPasswordReset(id: string, payload: StaffActionPayload): Promise<void> {
  await apiClient(`/admin/users/${encodeURIComponent(id)}/reset-password`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Resend verification email: POST /admin/users/{id}/resend-verification
 */
export async function resendUserVerification(id: string, payload: StaffActionPayload): Promise<void> {
  await apiClient(`/admin/users/${encodeURIComponent(id)}/resend-verification`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export { ApiError };

