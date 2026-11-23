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
  escalated: boolean;
  is_escalated?: boolean;
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
  author_kind?: 'founder' | 'staff';
  author_type?: 'founder' | 'staff';
  author?: {
    name?: string | null;
  } | null;
  author_name?: string;
  body: string;
  created_at: string;
}

export interface AdminTicketNote {
  id: string;
  author_name?: string;
  author?: {
    name?: string | null;
  } | null;
  body: string;
  created_at: string;
}

export interface AdminTicketDetail {
  id: string;
  number: string;
  subject: string;
  category: string;
  priority: TicketPriority;
  status: 'open' | 'resolved';
  escalated: boolean;
  is_escalated?: boolean;
  escalation_reason?: string | null;
  resolved_at: string | null;
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
  messages: AdminTicketMessage[];
  notes: AdminTicketNote[];
  ticket?: AdminTicketItem & {
    escalation_reason?: string | null;
    resolved_at: string | null;
  };
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

  const rawTickets = res.data?.tickets ?? res.tickets ?? [];
  const tickets: AdminTicketItem[] = rawTickets.map((t: AdminTicketItem) => {
    const isEsc = t.escalated ?? t.is_escalated ?? false;
    return {
      ...t,
      escalated: isEsc,
      is_escalated: isEsc,
    };
  });
  const next_cursor = res.meta?.next_cursor ?? res.next_cursor ?? null;

  return { tickets, next_cursor };
}

/**
 * Get detailed ticket thread with messages and internal notes
 * GET /admin/support/tickets/{id}
 */
export async function getAdminSupportTicket(id: string): Promise<AdminTicketDetail> {
  const res = await apiClient<{ data?: Record<string, unknown> } & Record<string, unknown>>(
    `/admin/support/tickets/${encodeURIComponent(id)}`
  );

  const raw = ('data' in res && res.data) ? res.data : res;

  if (raw.ticket && typeof raw.ticket === 'object') {
    const t = raw.ticket as Record<string, unknown>;
    const isEsc = Boolean(t.escalated ?? t.is_escalated ?? false);
    const messages = (Array.isArray(raw.messages) ? raw.messages : []) as AdminTicketMessage[];
    const notes = (Array.isArray(raw.notes) ? raw.notes : []) as AdminTicketNote[];

    const item: AdminTicketDetail = {
      id: String(t.id || ''),
      number: String(t.number || ''),
      subject: String(t.subject || ''),
      category: String(t.category || ''),
      priority: (t.priority || 'P4') as TicketPriority,
      status: (t.status || 'open') as 'open' | 'resolved',
      escalated: isEsc,
      is_escalated: isEsc,
      escalation_reason: t.escalation_reason ? String(t.escalation_reason) : null,
      resolved_at: t.resolved_at ? String(t.resolved_at) : null,
      founder: t.founder as AdminTicketItem['founder'],
      workspace: t.workspace as AdminTicketItem['workspace'],
      assignee: (t.assignee ?? null) as AdminTicketItem['assignee'],
      created_at: String(t.created_at || ''),
      sla: t.sla as AdminTicketItem['sla'],
      messages,
      notes,
      ticket: {
        id: String(t.id || ''),
        number: String(t.number || ''),
        subject: String(t.subject || ''),
        category: String(t.category || ''),
        priority: (t.priority || 'P4') as TicketPriority,
        status: (t.status || 'open') as 'open' | 'resolved',
        escalated: isEsc,
        is_escalated: isEsc,
        escalation_reason: t.escalation_reason ? String(t.escalation_reason) : null,
        resolved_at: t.resolved_at ? String(t.resolved_at) : null,
        founder: t.founder as AdminTicketItem['founder'],
        workspace: t.workspace as AdminTicketItem['workspace'],
        assignee: (t.assignee ?? null) as AdminTicketItem['assignee'],
        created_at: String(t.created_at || ''),
        sla: t.sla as AdminTicketItem['sla'],
      },
    };
    return item;
  }

  const isEsc = Boolean(raw.escalated ?? raw.is_escalated ?? false);
  const messages = (Array.isArray(raw.messages) ? raw.messages : []) as AdminTicketMessage[];
  const notes = (Array.isArray(raw.notes) ? raw.notes : []) as AdminTicketNote[];

  const item: AdminTicketDetail = {
    id: String(raw.id || ''),
    number: String(raw.number || ''),
    subject: String(raw.subject || ''),
    category: String(raw.category || ''),
    priority: (raw.priority || 'P4') as TicketPriority,
    status: (raw.status || 'open') as 'open' | 'resolved',
    escalated: isEsc,
    is_escalated: isEsc,
    escalation_reason: raw.escalation_reason ? String(raw.escalation_reason) : null,
    resolved_at: raw.resolved_at ? String(raw.resolved_at) : null,
    founder: raw.founder as AdminTicketItem['founder'],
    workspace: raw.workspace as AdminTicketItem['workspace'],
    assignee: (raw.assignee ?? null) as AdminTicketItem['assignee'],
    created_at: String(raw.created_at || ''),
    sla: raw.sla as AdminTicketItem['sla'],
    messages,
    notes,
    ticket: {
      id: String(raw.id || ''),
      number: String(raw.number || ''),
      subject: String(raw.subject || ''),
      category: String(raw.category || ''),
      priority: (raw.priority || 'P4') as TicketPriority,
      status: (raw.status || 'open') as 'open' | 'resolved',
      escalated: isEsc,
      is_escalated: isEsc,
      escalation_reason: raw.escalation_reason ? String(raw.escalation_reason) : null,
      resolved_at: raw.resolved_at ? String(raw.resolved_at) : null,
      founder: raw.founder as AdminTicketItem['founder'],
      workspace: raw.workspace as AdminTicketItem['workspace'],
      assignee: (raw.assignee ?? null) as AdminTicketItem['assignee'],
      created_at: String(raw.created_at || ''),
      sla: raw.sla as AdminTicketItem['sla'],
    },
  };

  return item;
}

/**
 * Get list of eligible staff assignees
 * GET /admin/support/assignees
 */
export async function getAdminSupportAssignees(): Promise<AdminSupportAssignee[]> {
  const res = await apiClient<
    | {
        data?: { staff?: AdminSupportAssignee[]; assignees?: AdminSupportAssignee[] } | AdminSupportAssignee[];
        staff?: AdminSupportAssignee[];
        assignees?: AdminSupportAssignee[];
      }
    | AdminSupportAssignee[]
  >('/admin/support/assignees');

  if (Array.isArray(res)) return res;
  if (res && typeof res === 'object') {
    if (res.data) {
      if (Array.isArray(res.data)) return res.data;
      if (Array.isArray(res.data.staff)) return res.data.staff;
      if (Array.isArray(res.data.assignees)) return res.data.assignees;
    }
    if (Array.isArray(res.staff)) return res.staff;
    if (Array.isArray(res.assignees)) return res.assignees;
  }
  return [];
}

/**
 * Get canned responses
 * GET /admin/support/canned
 */
export async function getAdminCannedResponses(): Promise<AdminCannedResponse[]> {
  const res = await apiClient<
    | {
        data?: { canned?: AdminCannedResponse[]; responses?: AdminCannedResponse[] } | AdminCannedResponse[];
        canned?: AdminCannedResponse[];
        responses?: AdminCannedResponse[];
      }
    | AdminCannedResponse[]
  >('/admin/support/canned');

  if (Array.isArray(res)) return res;
  if (res && typeof res === 'object') {
    if (res.data) {
      if (Array.isArray(res.data)) return res.data;
      if (Array.isArray(res.data.canned)) return res.data.canned;
      if (Array.isArray(res.data.responses)) return res.data.responses;
    }
    if (Array.isArray(res.canned)) return res.canned;
    if (Array.isArray(res.responses)) return res.responses;
  }
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
 * PATCH /admin/support/canned/{id}
 */
export async function updateAdminCannedResponse(
  id: string,
  payload: { title: string; body: string }
): Promise<AdminCannedResponse> {
  const res = await apiClient<{ data?: AdminCannedResponse } | AdminCannedResponse>(
    `/admin/support/canned/${encodeURIComponent(id)}`,
    {
      method: 'PATCH',
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
): Promise<AdminTicketMessage & { messages?: AdminTicketMessage[] }> {
  const res = await apiClient<{ data?: Record<string, unknown> | AdminTicketMessage[] } & Record<string, unknown>>(
    `/admin/support/tickets/${encodeURIComponent(id)}/reply`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );

  const data = (res.data ?? res) as Record<string, unknown> | AdminTicketMessage[];

  if (Array.isArray(data)) {
    const last = data[data.length - 1] || ({} as AdminTicketMessage);
    return Object.assign({}, last, { messages: data });
  }

  if (data && typeof data === 'object' && Array.isArray(data.messages)) {
    const msgList = data.messages as AdminTicketMessage[];
    const last = msgList[msgList.length - 1] || (data.message as AdminTicketMessage) || ({} as AdminTicketMessage);
    return Object.assign({}, last, { messages: msgList });
  }

  if (data && typeof data === 'object' && data.message) {
    const singleMsg = data.message as AdminTicketMessage;
    return Object.assign({}, singleMsg, { messages: [singleMsg] });
  }

  return data as unknown as AdminTicketMessage;
}

/**
 * Add internal note (never emailed)
 * POST /admin/support/tickets/{id}/notes
 */
export async function addAdminSupportNote(
  id: string,
  payload: { body: string }
): Promise<AdminTicketNote & { notes?: AdminTicketNote[] }> {
  const res = await apiClient<{ data?: Record<string, unknown> | AdminTicketNote[] } & Record<string, unknown>>(
    `/admin/support/tickets/${encodeURIComponent(id)}/notes`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );

  const data = (res.data ?? res) as Record<string, unknown> | AdminTicketNote[];

  if (Array.isArray(data)) {
    const last = data[data.length - 1] || ({} as AdminTicketNote);
    return Object.assign({}, last, { notes: data });
  }

  if (data && typeof data === 'object' && Array.isArray(data.notes)) {
    const noteList = data.notes as AdminTicketNote[];
    const last = noteList[noteList.length - 1] || (data.note as AdminTicketNote) || ({} as AdminTicketNote);
    return Object.assign({}, last, { notes: noteList });
  }

  if (data && typeof data === 'object' && data.note) {
    const singleNote = data.note as AdminTicketNote;
    return Object.assign({}, singleNote, { notes: [singleNote] });
  }

  return data as unknown as AdminTicketNote;
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
  payload?: { message?: string; closing_message?: string; reason?: string; totp_code?: string }
): Promise<void> {
  const msg = payload?.message || payload?.closing_message;
  const body = msg && msg.trim() ? { message: msg.trim() } : undefined;
  await apiClient(`/admin/support/tickets/${encodeURIComponent(id)}/resolve`, {
    method: 'POST',
    body: body ? JSON.stringify(body) : JSON.stringify({}),
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
