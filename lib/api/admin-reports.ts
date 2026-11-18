import { apiClient, ApiError } from './client';

export type AdminReportTab = 'open' | 'escalated' | 'closed';
export type AdminReportType = 'ai_message' | 'comment';
export type AdminReportStatus = 'open' | 'escalated' | 'dismissed' | 'removed' | 'restored';

export interface AdminReportsCounts {
  open: number;
  escalated: number;
  closed: number;
}

export interface AdminReportSummary {
  id: string;
  item_type: AdminReportType;
  reason: string;
  snippet: string;
  snippet_truncated?: boolean;
  workspace: {
    id: string;
    name: string;
    plan_key: string;
  };
  reporter: {
    id: string;
    name: string;
    email: string;
  };
  created_at: string;
  status?: AdminReportStatus;
}

export interface AdminReportDetail {
  id: string;
  item_type: AdminReportType;
  item_id: string;
  reason: string;
  snippet: string;
  note?: string | null;
  reporter: {
    id: string;
    name: string;
    email: string;
  };
  author: {
    id: string;
    name: string;
  } | null;
  workspace: {
    id: string;
    name: string;
    plan_key: string;
  };
  reports_on_item: number;
  status: AdminReportStatus;
  created_at: string;
  escalation_reason?: string | null;
  escalated_by?: {
    id: string;
    name: string;
  } | null;
  decision_reason?: string | null;
  decided_by?: {
    id: string;
    name: string;
  } | null;
  decided_at?: string | null;
}

export interface FetchAdminReportsParams {
  tab: AdminReportTab;
  type?: AdminReportType | 'all';
  reason?: string;
  query?: string;
  cursor?: string;
}

export interface AdminReportsListResponse {
  reports: AdminReportSummary[];
  next_cursor: string | null;
}

export interface StaffReasonPayload {
  reason: string;
}

export interface StaffStepUpPayload {
  reason: string;
  totp_code: string;
}

/**
 * Get report counts across Open, Escalated, and Closed tabs.
 * GET /admin/reports/counts
 */
export async function getAdminReportsCounts(): Promise<AdminReportsCounts> {
  const res = await apiClient<{ data?: AdminReportsCounts } | AdminReportsCounts>(
    '/admin/reports/counts'
  );
  if ('data' in res && res.data) {
    return res.data;
  }
  return res as AdminReportsCounts;
}

/**
 * List reports with tab, filter, and pagination.
 * GET /admin/reports?tab=...
 */
export async function getAdminReports(params: FetchAdminReportsParams): Promise<AdminReportsListResponse> {
  const q = new URLSearchParams();
  q.set('tab', params.tab);

  if (params.type && params.type !== 'all') {
    q.set('type', params.type);
  }
  if (params.reason && params.reason !== 'all') {
    q.set('reason', params.reason);
  }
  if (params.query && params.query.trim()) {
    q.set('query', params.query.trim());
  }
  if (params.cursor) {
    q.set('cursor', params.cursor);
  }

  const endpoint = `/admin/reports?${q.toString()}`;
  const res = await apiClient<{
    data?: {
      reports?: AdminReportSummary[];
      next_cursor?: string | null;
    };
    reports?: AdminReportSummary[];
    meta?: {
      next_cursor?: string | null;
    };
    next_cursor?: string | null;
  }>(endpoint);

  const reports = res.data?.reports ?? res.reports ?? [];
  const next_cursor = res.data?.next_cursor ?? res.meta?.next_cursor ?? res.next_cursor ?? null;

  return { reports, next_cursor };
}

/**
 * Fetch a single report's detail.
 * GET /admin/reports/{id}
 */
export async function getAdminReport(id: string): Promise<AdminReportDetail> {
  const res = await apiClient<{ data?: AdminReportDetail; report?: AdminReportDetail } | AdminReportDetail>(
    `/admin/reports/${encodeURIComponent(id)}`
  );
  if ('data' in res && res.data) {
    return res.data;
  }
  if ('report' in res && res.report) {
    return res.report;
  }
  return res as AdminReportDetail;
}

/**
 * Dismiss a report with a reason (10-500 chars).
 * POST /admin/reports/{id}/dismiss
 */
export async function dismissAdminReport(id: string, payload: StaffReasonPayload): Promise<void> {
  await apiClient(`/admin/reports/${encodeURIComponent(id)}/dismiss`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Escalate a report to Super Admin with a reason (10-500 chars).
 * POST /admin/reports/{id}/escalate
 */
export async function escalateAdminReport(id: string, payload: StaffReasonPayload): Promise<void> {
  await apiClient(`/admin/reports/${encodeURIComponent(id)}/escalate`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Remove reported content (closes all sibling reports on item).
 * Requires reason (10-500 chars) + 6-digit TOTP code.
 * POST /admin/reports/{id}/remove
 */
export async function removeAdminReportContent(id: string, payload: StaffStepUpPayload): Promise<void> {
  await apiClient(`/admin/reports/${encodeURIComponent(id)}/remove`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Restore previously removed content (Closed tab, removed report).
 * Requires reason (10-500 chars) + 6-digit TOTP code.
 * POST /admin/reports/{id}/restore
 */
export async function restoreAdminReportContent(id: string, payload: StaffStepUpPayload): Promise<void> {
  await apiClient(`/admin/reports/${encodeURIComponent(id)}/restore`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export { ApiError };
