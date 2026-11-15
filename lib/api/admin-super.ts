import { apiClient, ApiError, API_BASE } from './client';
import { ensureSession, getAccessToken } from '@/lib/auth/session';
import type { StaffActionPayload } from './admin';

// ============================================================================
// Types
// ============================================================================

export interface SuperAdminAuditItem {
  id: string;
  action: string;
  actor_id: string;
  actor_email: string | null;
  entity_type: string;
  entity_id: string;
  reason: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

export interface SuperAdminAuditResponse {
  items: SuperAdminAuditItem[];
  next_cursor: string | null;
}

export interface SuperAdminStaffMember {
  id: string; // staff row id, used for revoke and edit
  user_id: string; // account user id
  email: string;
  full_name: string | null;
  role: 'super_admin' | 'admin' | string;
  scopes: string[]; // e.g. ['support', 'content', 'moderation']
  last_login_at: string | null;
  invited_by_email: string | null;
  revoked_at: string | null;
  created_at?: string;
}

export interface AddStaffPayload {
  email: string;
  role: string;
  scopes?: string[];
  reason: string;
  totp_code: string;
}

export interface EditStaffPayload {
  role?: string;
  scopes?: string[];
  reason: string;
  totp_code: string;
}

export interface FeatureFlagItem {
  key: string;
  name: string;
  description: string;
  stage: 'beta' | 'ga' | 'internal' | string;
  enabled: boolean;
  rollout_pct: number;
  affected_workspaces: number;
  total_workspaces: number;
  workspace_ids?: string[];
}

export interface FlagImpactResponse {
  affected_now: number;
  affected_after: number;
}

export interface CreateFlagPayload {
  key: string;
  name: string;
  description: string;
  stage: string;
  reason: string;
  totp_code: string;
}

export interface UpdateFlagPayload {
  name?: string;
  description?: string;
  stage?: string;
  enabled?: boolean;
  rollout_pct?: number;
  workspace_ids?: string[];
  reason: string;
  totp_code: string;
}

export interface SuperAdminSubscription {
  plan: string;
  status: string;
  price_minor: number;
  renews_at: string | null;
  ends_at: string | null;
  comped: boolean;
}

export interface SuperAdminInvoice {
  id: string;
  number: string;
  description: string;
  amount_minor: number;
  paid_at: string | null;
  status: string;
  refunded_minor: number;
  pending_refund_minor?: number;
  refundable_minor: number;
}

export interface SuperAdminOverride {
  id: string;
  kind: 'refund' | 'credit' | 'extend_trial' | 'comp' | string;
  amount_minor?: number;
  credits?: number;
  days?: number;
  plan_key?: string;
  invoice_number?: string;
  provider_refund?: 'pending' | 'done' | string;
  reason: string;
  actor_email: string;
  created_at: string;
}

export interface SuperAdminBillingDetail {
  workspace_id: string;
  name?: string;
  subscription: SuperAdminSubscription | null;
  invoices: SuperAdminInvoice[];
  overrides: SuperAdminOverride[];
  credits_granted_total: number;
}

export interface RefundOverridePayload {
  invoice_id: string;
  amount_minor: number;
  request_id: string;
  reason: string;
  totp_code: string;
}

export interface CreditOverridePayload {
  credits: number;
  request_id: string;
  reason: string;
  totp_code: string;
}

export interface ExtendTrialOverridePayload {
  days: number;
  request_id: string;
  reason: string;
  totp_code: string;
}

export interface CompOverridePayload {
  plan_key: string;
  days: number;
  request_id: string;
  reason: string;
  totp_code: string;
}

// ============================================================================
// API Calls: Audit & Overview
// ============================================================================

/**
 * Fetch recent privileged actions for Super Admin overview: GET /super-admin/audit?limit=5
 */
export async function getSuperAdminAuditRecent(): Promise<SuperAdminAuditItem[]> {
  const res = await getSuperAdminAudit({ limit: 5 });
  return res.items;
}

/**
 * Fetch audit log: GET /super-admin/audit
 */
export async function getSuperAdminAudit(params: {
  actor?: string;
  action?: string;
  workspace_id?: string;
  start_date?: string;
  end_date?: string;
  cursor?: string;
  limit?: number;
} = {}): Promise<SuperAdminAuditResponse> {
  const query = new URLSearchParams();
  if (params.actor?.trim()) query.set('actor', params.actor.trim());
  if (params.action && params.action !== 'all') query.set('action', params.action);
  if (params.workspace_id?.trim()) query.set('workspace_id', params.workspace_id.trim());
  if (params.start_date) query.set('start_date', params.start_date);
  if (params.end_date) query.set('end_date', params.end_date);
  if (params.cursor) query.set('cursor', params.cursor);
  if (params.limit) query.set('limit', String(params.limit));

  const qs = query.toString();
  const endpoint = qs ? `/super-admin/audit?${qs}` : '/super-admin/audit';

  try {
    const res = await apiClient<{
      data?: { items?: SuperAdminAuditItem[]; entries?: SuperAdminAuditItem[]; next_cursor?: string | null };
      items?: SuperAdminAuditItem[];
      entries?: SuperAdminAuditItem[];
      meta?: { next_cursor?: string | null };
      next_cursor?: string | null;
    }>(endpoint);

    const items =
      res.data?.items ??
      res.data?.entries ??
      res.items ??
      res.entries ??
      [];
    const next_cursor =
      res.data?.next_cursor ??
      res.meta?.next_cursor ??
      res.next_cursor ??
      null;

    return { items, next_cursor };
  } catch (err) {
    // A bad cursor (422) refetches from the start
    if (params.cursor && err instanceof ApiError && err.status === 422) {
      return getSuperAdminAudit({ ...params, cursor: undefined });
    }
    throw err;
  }
}

/**
 * Export audit log CSV: authenticated fetch to /super-admin/audit/export
 */
export async function exportSuperAdminAuditCsv(params: {
  reason: string;
  actor?: string;
  action?: string;
  workspace_id?: string;
  start_date?: string;
  end_date?: string;
}): Promise<{ blob: Blob; filename: string }> {
  const query = new URLSearchParams();
  query.set('reason', params.reason);
  if (params.actor?.trim()) query.set('actor', params.actor.trim());
  if (params.action && params.action !== 'all') query.set('action', params.action);
  if (params.workspace_id?.trim()) query.set('workspace_id', params.workspace_id.trim());
  if (params.start_date) query.set('start_date', params.start_date);
  if (params.end_date) query.set('end_date', params.end_date);

  await ensureSession();
  const token = getAccessToken();
  const headers = new Headers();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(`${API_BASE}/super-admin/audit/export?${query.toString()}`, { headers });
  if (!res.ok) {
    let errData: unknown = null;
    try {
      errData = await res.json();
    } catch {
      /* not json */
    }
    throw new ApiError(res.status, res.statusText, errData);
  }
  const blob = await res.blob();
  return { blob, filename: 'audit-log.csv' };
}

// ============================================================================
// API Calls: Staff Access
// ============================================================================

/**
 * List staff members: GET /super-admin/staff
 */
export async function getSuperAdminStaff(): Promise<SuperAdminStaffMember[]> {
  const res = await apiClient<{
    data?: { staff?: SuperAdminStaffMember[] } | SuperAdminStaffMember[];
    staff?: SuperAdminStaffMember[];
  } | SuperAdminStaffMember[]>('/super-admin/staff');

  if (Array.isArray(res)) return res;
  if ('staff' in res && Array.isArray(res.staff)) return res.staff;
  if ('data' in res) {
    if (Array.isArray(res.data)) return res.data;
    if (res.data && 'staff' in res.data && Array.isArray(res.data.staff)) return res.data.staff;
  }
  return [];
}

/**
 * Add staff member: POST /super-admin/staff
 */
export async function addSuperAdminStaff(payload: AddStaffPayload): Promise<void> {
  await apiClient('/super-admin/staff', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Edit staff member: PATCH /super-admin/staff/{id}
 */
export async function editSuperAdminStaff(id: string, payload: EditStaffPayload): Promise<void> {
  await apiClient(`/super-admin/staff/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

/**
 * Revoke staff member: POST /super-admin/staff/{id}/revoke
 */
export async function revokeSuperAdminStaff(id: string, payload: StaffActionPayload): Promise<void> {
  await apiClient(`/super-admin/staff/${encodeURIComponent(id)}/revoke`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// ============================================================================
// API Calls: Feature Flags
// ============================================================================

/**
 * List feature flags: GET /super-admin/flags
 */
export async function getSuperAdminFlags(): Promise<FeatureFlagItem[]> {
  const res = await apiClient<{
    data?: { flags?: FeatureFlagItem[] } | FeatureFlagItem[];
    flags?: FeatureFlagItem[];
    items?: FeatureFlagItem[];
  } | FeatureFlagItem[]>('/super-admin/flags');

  if (Array.isArray(res)) return res;
  if ('flags' in res && Array.isArray(res.flags)) return res.flags;
  if ('items' in res && Array.isArray(res.items)) return res.items;
  if ('data' in res) {
    if (Array.isArray(res.data)) return res.data;
    if (res.data && 'flags' in res.data && Array.isArray(res.data.flags)) return res.data.flags;
  }
  return [];
}

/**
 * Get impact before toggling or changing rollout %: GET /super-admin/flags/{key}/impact
 */
export async function getFlagImpact(
  key: string,
  enabled: boolean,
  rollout_pct: number
): Promise<FlagImpactResponse> {
  const query = new URLSearchParams({
    enabled: String(enabled),
    rollout_pct: String(rollout_pct),
  });
  const res = await apiClient<{ data?: FlagImpactResponse } | FlagImpactResponse>(
    `/super-admin/flags/${encodeURIComponent(key)}/impact?${query.toString()}`
  );
  if ('data' in res && res.data) {
    return res.data;
  }
  return res as FlagImpactResponse;
}

/**
 * Create new feature flag: POST /super-admin/flags
 */
export async function createSuperAdminFlag(payload: CreateFlagPayload): Promise<void> {
  await apiClient('/super-admin/flags', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Update feature flag (sends only changed fields): PATCH /super-admin/flags/{key}
 */
export async function updateSuperAdminFlag(key: string, payload: UpdateFlagPayload): Promise<void> {
  await apiClient(`/super-admin/flags/${encodeURIComponent(key)}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

// ============================================================================
// API Calls: Billing Overrides
// ============================================================================

/**
 * Get workspace billing details: GET /super-admin/billing/{workspace_id}
 */
export async function getSuperAdminBilling(workspaceId: string): Promise<SuperAdminBillingDetail> {
  const res = await apiClient<{ data?: SuperAdminBillingDetail } | SuperAdminBillingDetail>(
    `/super-admin/billing/${encodeURIComponent(workspaceId)}`
  );
  if ('data' in res && res.data) {
    return res.data;
  }
  return res as SuperAdminBillingDetail;
}

/**
 * Record a refund: POST /super-admin/billing/{workspace_id}/refund
 */
export async function overrideRefund(
  workspaceId: string,
  payload: RefundOverridePayload
): Promise<void> {
  await apiClient(`/super-admin/billing/${encodeURIComponent(workspaceId)}/refund`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Mark refund done: POST /super-admin/billing/{workspace_id}/refunds/{override_id}/complete
 */
export async function overrideCompleteRefund(
  workspaceId: string,
  overrideId: string,
  payload: StaffActionPayload
): Promise<void> {
  await apiClient(
    `/super-admin/billing/${encodeURIComponent(workspaceId)}/refunds/${encodeURIComponent(overrideId)}/complete`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );
}

/**
 * Grant AI credits: POST /super-admin/billing/{workspace_id}/credit
 */
export async function overrideCredit(
  workspaceId: string,
  payload: CreditOverridePayload
): Promise<void> {
  await apiClient(`/super-admin/billing/${encodeURIComponent(workspaceId)}/credit`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Extend trial: POST /super-admin/billing/{workspace_id}/extend-trial
 */
export async function overrideExtendTrial(
  workspaceId: string,
  payload: ExtendTrialOverridePayload
): Promise<void> {
  await apiClient(`/super-admin/billing/${encodeURIComponent(workspaceId)}/extend-trial`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Comp plan: POST /super-admin/billing/{workspace_id}/comp
 */
export async function overrideComp(
  workspaceId: string,
  payload: CompOverridePayload
): Promise<void> {
  await apiClient(`/super-admin/billing/${encodeURIComponent(workspaceId)}/comp`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
