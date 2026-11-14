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
  author_type: 'founder' | 'staff';
  author_name: string;
  body: string;
  created_at: string;
}

export interface FounderTicketDetail {
  ticket: {
    id: string;
    number: string;
    subject: string;
    category: SupportCategory;
    status: SupportStatus;
    created_at: string;
    resolved_at: string | null;
  };
  messages: FounderTicketMessage[];
}

export interface CreateTicketPayload {
  category: SupportCategory | string;
  subject: string;
  message: string;
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
  const res = await apiClient<{ data?: { id: string; number: string; ticket?: { id: string; number: string } }; id?: string; number?: string; ticket?: { id: string; number: string } }>(
    '/support/tickets',
    {
      method: 'POST',
      body: JSON.stringify(payload),
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
  const res = await apiClient<{ data?: FounderTicketDetail } | FounderTicketDetail>(
    `/support/tickets/${encodeURIComponent(id)}`
  );

  if ('data' in res && res.data) {
    return res.data;
  }
  return res as FounderTicketDetail;
}

/**
 * Reply to a ticket thread
 * POST /support/tickets/{id}/messages
 */
export async function sendFounderMessage(
  id: string,
  payload: SendMessagePayload
): Promise<FounderTicketMessage> {
  const res = await apiClient<{ data?: { message: FounderTicketMessage }; message?: FounderTicketMessage } | FounderTicketMessage>(
    `/support/tickets/${encodeURIComponent(id)}/messages`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );

  if ('data' in res && res.data?.message) {
    return res.data.message;
  }
  if ('message' in res && res.message && typeof res.message === 'object' && 'body' in res.message) {
    return res.message as FounderTicketMessage;
  }
  return res as FounderTicketMessage;
}

export { ApiError };

