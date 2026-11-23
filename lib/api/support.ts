import { apiClient, ApiError } from './client';

export type SupportCategory = 'billing' | 'account' | 'bug' | 'how_to' | 'feature_request' | 'other';
export type SupportStatus = 'open' | 'resolved';

export const FOUNDER_CATEGORY_LABELS: Record<SupportCategory, string> = {
  billing: 'Billing',
  account: 'Account',
  bug: 'Something is broken',
  how_to: 'How do I...',
  feature_request: 'Feature request',
  other: 'Other',
};

export interface FounderTicketItem {
  id: string;
  number: string; // e.g. "T-1001"
  subject: string;
  category: SupportCategory;
  status: SupportStatus;
  last_message_at: string;
  last_author: 'founder' | 'staff';
}

export interface FounderTicketsResponse {
  tickets: FounderTicketItem[];
  next_cursor: string | null;
}

export interface FounderTicketMessage {
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

export interface FounderTicketDetail {
  id: string;
  number: string;
  subject: string;
  category: SupportCategory;
  status: SupportStatus;
  created_at: string;
  resolved_at: string | null;
  messages: FounderTicketMessage[];
  // Backwards-compatible ticket field
  ticket?: {
    id: string;
    number: string;
    subject: string;
    category: SupportCategory;
    status: SupportStatus;
    created_at: string;
    resolved_at: string | null;
  };
}

export interface CreateTicketPayload {
  category: SupportCategory | string;
  subject: string;
  body: string;
  message?: string;
}

export interface SendMessagePayload {
  body: string;
}

/**
 * List tickets for the current workspace
 * GET /support/tickets?status=open|resolved&cursor=...
 */
export async function getFounderTickets(params?: {
  status?: 'open' | 'resolved';
  cursor?: string;
}): Promise<FounderTicketsResponse> {
  const query = new URLSearchParams();
  if (params?.status) query.set('status', params.status);
  if (params?.cursor) query.set('cursor', params.cursor);

  const qs = query.toString();
  const endpoint = `/support/tickets${qs ? `?${qs}` : ''}`;
  const res = await apiClient<{ data?: { tickets: FounderTicketItem[] }; tickets?: FounderTicketItem[]; meta?: { next_cursor: string | null }; next_cursor?: string | null }>(endpoint);

  const tickets = res.data?.tickets ?? res.tickets ?? [];
  const next_cursor = res.meta?.next_cursor ?? res.next_cursor ?? null;

  return { tickets, next_cursor };
}

/**
 * Create a new support ticket
 * POST /support/tickets
 */
export async function createFounderTicket(payload: CreateTicketPayload): Promise<{ id: string; number: string }> {
  const requestBody = {
    category: payload.category,
    subject: payload.subject,
    body: payload.body || payload.message || '',
  };

  const res = await apiClient<{ data?: { id: string; number: string; ticket?: { id: string; number: string } }; id?: string; number?: string; ticket?: { id: string; number: string } }>(
    '/support/tickets',
    {
      method: 'POST',
      body: JSON.stringify(requestBody),
    }
  );

  const ticketObj = res.data?.ticket ?? res.ticket;
  const id = ticketObj?.id ?? res.data?.id ?? res.id ?? '';
  const number = ticketObj?.number ?? res.data?.number ?? res.number ?? '';

  return { id, number };
}

/**
 * Get ticket thread detail
 * GET /support/tickets/{id}
 */
export async function getFounderTicket(id: string): Promise<FounderTicketDetail> {
  const res = await apiClient<{ data?: Record<string, unknown> } & Record<string, unknown>>(
    `/support/tickets/${encodeURIComponent(id)}`
  );

  const raw = ('data' in res && res.data) ? res.data : res;

  if (raw.ticket && typeof raw.ticket === 'object') {
    const t = raw.ticket as Record<string, unknown>;
    const messages = (Array.isArray(raw.messages) ? raw.messages : []) as FounderTicketMessage[];
    return {
      id: String(t.id || ''),
      number: String(t.number || ''),
      subject: String(t.subject || ''),
      category: (t.category || 'other') as SupportCategory,
      status: (t.status || 'open') as SupportStatus,
      created_at: String(t.created_at || ''),
      resolved_at: t.resolved_at ? String(t.resolved_at) : null,
      messages,
      ticket: {
        id: String(t.id || ''),
        number: String(t.number || ''),
        subject: String(t.subject || ''),
        category: (t.category || 'other') as SupportCategory,
        status: (t.status || 'open') as SupportStatus,
        created_at: String(t.created_at || ''),
        resolved_at: t.resolved_at ? String(t.resolved_at) : null,
      },
    };
  }

  const messages = (Array.isArray(raw.messages) ? raw.messages : []) as FounderTicketMessage[];
  return {
    id: String(raw.id || ''),
    number: String(raw.number || ''),
    subject: String(raw.subject || ''),
    category: (raw.category || 'other') as SupportCategory,
    status: (raw.status || 'open') as SupportStatus,
    created_at: String(raw.created_at || ''),
    resolved_at: raw.resolved_at ? String(raw.resolved_at) : null,
    messages,
    ticket: {
      id: String(raw.id || ''),
      number: String(raw.number || ''),
      subject: String(raw.subject || ''),
      category: (raw.category || 'other') as SupportCategory,
      status: (raw.status || 'open') as SupportStatus,
      created_at: String(raw.created_at || ''),
      resolved_at: raw.resolved_at ? String(raw.resolved_at) : null,
    },
  };
}

/**
 * Reply to a ticket thread
 * POST /support/tickets/{id}/messages
 */
export async function sendFounderMessage(
  id: string,
  payload: SendMessagePayload
): Promise<FounderTicketMessage & { messages?: FounderTicketMessage[] }> {
  const res = await apiClient<{ data?: Record<string, unknown> | FounderTicketMessage[] } & Record<string, unknown>>(
    `/support/tickets/${encodeURIComponent(id)}/messages`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );

  const data = (res.data ?? res) as Record<string, unknown> | FounderTicketMessage[];

  if (Array.isArray(data)) {
    const last = data[data.length - 1] || ({} as FounderTicketMessage);
    return Object.assign({}, last, { messages: data });
  }

  if (data && typeof data === 'object' && Array.isArray(data.messages)) {
    const msgList = data.messages as FounderTicketMessage[];
    const last = msgList[msgList.length - 1] || (data.message as FounderTicketMessage) || ({} as FounderTicketMessage);
    return Object.assign({}, last, { messages: msgList });
  }

  if (data && typeof data === 'object' && data.message) {
    const singleMsg = data.message as FounderTicketMessage;
    return Object.assign({}, singleMsg, { messages: [singleMsg] });
  }

  return data as unknown as FounderTicketMessage;
}

export { ApiError };
