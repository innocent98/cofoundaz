import { apiClient, ApiError } from './client';

export type TicketPriority = 'P1' | 'P2' | 'P3' | 'P4';
export type TicketTab = 'open' | 'mine' | 'resolved';
export type SlaState = 'breached' | 'due_soon' | 'ok' | 'met' | 'late';

export interface AdminSupportCounts {
  open: number;
  mine: number;
  resolved: number;
  breached: number;
  unassigned: number;
}

export interface AdminAttentionResponse {
  tickets: {
    open: number;
    breached: number;
  };
}

export interface AdminTicketItem {
  id: string;
  number: string;
  subject: string;
  category: string;
  priority: TicketPriority;
  status: 'open' | 'resolved';
  is_escalated: boolean;
  founder: {
    id: string;
    name: string | null;
    email: string;
  };
  workspace: {
    id: string;
    name: string;
    plan_key: string;
  };
  assignee: {
    id: string;
    name: string;
    email: string;
  } | null;
  created_at: string;
  sla: {
    state: SlaState;
    due_at: string | null;
  };
}

export interface AdminTicketsListResponse {
  tickets: AdminTicketItem[];
  next_cursor: string | null;
}

export interface AdminTicketMessage {
  id: string;
  author_type: 'founder' | 'staff';
  author_name: string;
  body: string;
  created_at: string;
}

export interface AdminTicketNote {
  id: string;
  author_name: string;
  body: string;
  created_at: string;
}

export interface AdminTicketDetail {
  ticket: AdminTicketItem & {
    escalation_reason?: string | null;
    resolved_at: string | null;
  };
  messages: AdminTicketMessage[];
  notes: AdminTicketNote[];
}

export interface AdminSupportAssignee {
  id: string;
  name: string;
  email: string;
  role?: string;
}

export interface AdminCannedResponse {
  id: string;
  title: string;
  body: string;
  created_at?: string;
}

export interface FetchTicketsParams {
  tab: TicketTab;
  priority?: TicketPriority | 'all';
  category?: string;
  sla?: 'all' | 'breached' | 'due_soon';
  escalated?: boolean;
  unassigned?: boolean;
  query?: string;
  cursor?: string;
}

/**
 * Get dashboard attention counts
 * GET /admin/dashboard/attention
 */
export async function getAdminSupportAttention(): Promise<AdminAttentionResponse> {
  const res = await apiClient<{ data?: AdminAttentionResponse } | AdminAttentionResponse>(
    '/admin/dashboard/attention'
  );
  if ('data' in res && res.data) {
    return res.data;
  }
  return res as AdminAttentionResponse;
}

/**
 * Get support ticket counts for badges and chips
 * GET /admin/support/counts
 */
export async function getAdminSupportCounts(): Promise<AdminSupportCounts> {
  const res = await apiClient<{ data?: AdminSupportCounts } | AdminSupportCounts>(
    '/admin/support/counts'
  );
  if ('data' in res && res.data) {
    return res.data;
  }
  return res as AdminSupportCounts;
}

/**
 * List support tickets with filters & pagination
 * GET /admin/support/tickets?tab=...
 */
export async function getAdminSupportTickets(params: FetchTicketsParams): Promise<AdminTicketsListResponse> {
  const query = new URLSearchParams();
  query.set('tab', params.tab);

  if (params.priority && params.priority !== 'all') {
    query.set('priority', params.priority);
  }
  if (params.category && params.category !== 'all') {
    query.set('category', params.category);
  }
  if (params.sla && params.sla !== 'all') {
    query.set('sla', params.sla);
  }
  if (params.escalated) {
    query.set('escalated', 'true');
  }
  if (params.unassigned) {
    query.set('unassigned', 'true');
  }
  if (params.query && params.query.trim()) {
    query.set('query', params.query.trim());
  }
  if (params.cursor) {
    query.set('cursor', params.cursor);
  }

  const res = await apiClient<{
    data?: { tickets: AdminTicketItem[] };
    tickets?: AdminTicketItem[];
    meta?: { next_cursor: string | null };
    next_cursor?: string | null;
  }>(`/admin/support/tickets?${query.toString()}`);

  const tickets = res.data?.tickets ?? res.tickets ?? [];
  const next_cursor = res.meta?.next_cursor ?? res.next_cursor ?? null;

  return { tickets, next_cursor };
}

/**
 * Get detailed ticket thread with messages and internal notes
 * GET /admin/support/tickets/{id}
 */
export async function getAdminSupportTicket(id: string): Promise<AdminTicketDetail> {
  const res = await apiClient<{ data?: AdminTicketDetail } | AdminTicketDetail>(
    `/admin/support/tickets/${encodeURIComponent(id)}`
  );
  if ('data' in res && res.data) {
    return res.data;
  }
  return res as AdminTicketDetail;
}

/**
 * Get list of eligible staff assignees
 * GET /admin/support/assignees
 */
export async function getAdminSupportAssignees(): Promise<AdminSupportAssignee[]> {
  const res = await apiClient<{ data?: { assignees: AdminSupportAssignee[] }; assignees?: AdminSupportAssignee[] } | AdminSupportAssignee[]>(
    '/admin/support/assignees'
  );
  if (Array.isArray(res)) return res;
  if ('data' in res && res.data?.assignees) return res.data.assignees;
  if ('assignees' in res && res.assignees) return res.assignees;
  return [];
}

/**
 * Get canned responses
 * GET /admin/support/canned
 */
export async function getAdminCannedResponses(): Promise<AdminCannedResponse[]> {
  const res = await apiClient<{ data?: { responses: AdminCannedResponse[] }; responses?: AdminCannedResponse[] } | AdminCannedResponse[]>(
    '/admin/support/canned'
  );
  if (Array.isArray(res)) return res;
  if ('data' in res && res.data?.responses) return res.data.responses;
  if ('responses' in res && res.responses) return res.responses;
  return [];
}

/**
 * Create a new canned response
 * POST /admin/support/canned
 */
export async function createAdminCannedResponse(payload: { title: string; body: string }): Promise<AdminCannedResponse> {
  const res = await apiClient<{ data?: AdminCannedResponse } | AdminCannedResponse>(
    '/admin/support/canned',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );
  if ('data' in res && res.data) return res.data;
  return res as AdminCannedResponse;
}

/**
 * Update an existing canned response
 * PUT /admin/support/canned/{id}
 */
export async function updateAdminCannedResponse(
  id: string,
  payload: { title: string; body: string }
): Promise<AdminCannedResponse> {
  const res = await apiClient<{ data?: AdminCannedResponse } | AdminCannedResponse>(
    `/admin/support/canned/${encodeURIComponent(id)}`,
    {
      method: 'PUT',
      body: JSON.stringify(payload),
    }
  );
  if ('data' in res && res.data) return res.data;
  return res as AdminCannedResponse;
}

/**
 * Delete a canned response
 * DELETE /admin/support/canned/{id}
 */
export async function deleteAdminCannedResponse(id: string): Promise<void> {
  await apiClient(`/admin/support/canned/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

/**
 * Reply to founder
 * POST /admin/support/tickets/{id}/reply
 */
export async function replyAdminSupportTicket(
  id: string,
  payload: { body: string }
): Promise<AdminTicketMessage> {
  const res = await apiClient<{ data?: { message: AdminTicketMessage }; message?: AdminTicketMessage } | AdminTicketMessage>(
    `/admin/support/tickets/${encodeURIComponent(id)}/reply`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );
  if ('data' in res && res.data?.message) return res.data.message;
  if ('message' in res && res.message && typeof res.message === 'object' && 'body' in res.message) {
    return res.message as AdminTicketMessage;
  }
  return res as AdminTicketMessage;
}

/**
 * Add internal note (never emailed)
 * POST /admin/support/tickets/{id}/notes
 */
export async function addAdminSupportNote(
  id: string,
  payload: { body: string }
): Promise<AdminTicketNote> {
  const res = await apiClient<{ data?: { note: AdminTicketNote }; note?: AdminTicketNote } | AdminTicketNote>(
    `/admin/support/tickets/${encodeURIComponent(id)}/notes`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );
  if ('data' in res && res.data?.note) return res.data.note;
  if ('note' in res && res.note && typeof res.note === 'object' && 'body' in res.note) {
    return res.note as AdminTicketNote;
  }
  return res as AdminTicketNote;
}

/**
 * Change priority
 * PATCH /admin/support/tickets/{id}/priority
 */
export async function updateAdminSupportPriority(
  id: string,
  priority: TicketPriority
): Promise<void> {
  await apiClient(`/admin/support/tickets/${encodeURIComponent(id)}/priority`, {
    method: 'PATCH',
    body: JSON.stringify({ priority }),
  });
}

/**
 * Assign ticket
 * POST /admin/support/tickets/{id}/assign
 */
export async function assignAdminSupportTicket(
  id: string,
  assignee_user_id: string | null
): Promise<void> {
  await apiClient(`/admin/support/tickets/${encodeURIComponent(id)}/assign`, {
    method: 'POST',
    body: JSON.stringify({ assignee_user_id }),
  });
}

/**
 * Escalate ticket (sets to P1, cannot be undone here)
 * POST /admin/support/tickets/{id}/escalate
 */
export async function escalateAdminSupportTicket(
  id: string,
  payload: { reason: string; totp_code?: string }
): Promise<void> {
  await apiClient(`/admin/support/tickets/${encodeURIComponent(id)}/escalate`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Resolve ticket
 * POST /admin/support/tickets/{id}/resolve
 */
export async function resolveAdminSupportTicket(
  id: string,
  payload: { closing_message?: string; reason?: string; totp_code?: string }
): Promise<void> {
  await apiClient(`/admin/support/tickets/${encodeURIComponent(id)}/resolve`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Reopen resolved ticket
 * POST /admin/support/tickets/{id}/reopen
 */
export async function reopenAdminSupportTicket(
  id: string,
  payload: { reason?: string }
): Promise<void> {
  await apiClient(`/admin/support/tickets/${encodeURIComponent(id)}/reopen`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export { ApiError };

