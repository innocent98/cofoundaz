import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getFounderTickets,
  createFounderTicket,
  getFounderTicket,
  sendFounderMessage,
  type FounderTicketItem,
  type FounderTicketDetail,
} from './support';
import * as client from './client';

describe('Founder Support API (lib/api/support.ts)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches tickets with optional status and cursor', async () => {
    const mockTickets: FounderTicketItem[] = [
      {
        id: 't-1',
        number: 'T-1001',
        subject: 'Cannot access billing invoice',
        category: 'billing',
        status: 'open',
        last_message_at: '2026-11-13T12:00:00Z',
        last_author: 'staff',
      },
    ];

    const spy = vi.spyOn(client, 'apiClient').mockResolvedValueOnce({
      data: { tickets: mockTickets },
      meta: { next_cursor: 'cur_abc' },
    });

    const res = await getFounderTickets({ status: 'open', cursor: 'cur_1' });
    expect(spy).toHaveBeenCalledWith('/support/tickets?status=open&cursor=cur_1');
    expect(res.tickets).toHaveLength(1);
    expect(res.tickets[0].number).toBe('T-1001');
    expect(res.next_cursor).toBe('cur_abc');
  });

  it('creates a new support ticket sending body', async () => {
    const spy = vi.spyOn(client, 'apiClient').mockResolvedValueOnce({
      data: {
        id: 't-new',
        number: 'T-1002',
      },
    });

    const res = await createFounderTicket({
      category: 'bug',
      subject: 'Button broken on onboarding',
      body: 'When I click continue on step 2, nothing happens.',
    });

    expect(spy).toHaveBeenCalledWith('/support/tickets', {
      method: 'POST',
      body: JSON.stringify({
        category: 'bug',
        subject: 'Button broken on onboarding',
        body: 'When I click continue on step 2, nothing happens.',
      }),
    });
    expect(res.id).toBe('t-new');
    expect(res.number).toBe('T-1002');
  });

  it('fetches flat thread detail for a ticket', async () => {
    const mockDetail: FounderTicketDetail = {
      id: 't-1',
      number: 'T-1001',
      subject: 'Invoice query',
      category: 'billing',
      status: 'open',
      created_at: '2026-11-13T10:00:00Z',
      resolved_at: null,
      messages: [
        {
          id: 'm-1',
          author_kind: 'founder',
          author_type: 'founder',
          author: { name: 'John Doe' },
          author_name: 'John Doe',
          body: 'Hello, where can I download my invoice?',
          created_at: '2026-11-13T10:00:00Z',
        },
        {
          id: 'm-2',
          author_kind: 'staff',
          author_type: 'staff',
          author: { name: 'Cofoundaz Support' },
          author_name: 'Cofoundaz Support',
          body: 'Hi John, you can find it under Settings > Billing > Invoices.',
          created_at: '2026-11-13T10:30:00Z',
        },
      ],
    };

    const spy = vi.spyOn(client, 'apiClient').mockResolvedValueOnce({
      data: mockDetail,
    });

    const res = await getFounderTicket('t-1');
    expect(spy).toHaveBeenCalledWith('/support/tickets/t-1');
    expect(res.number).toBe('T-1001');
    expect(res.messages).toHaveLength(2);
    expect(res.messages[1].author?.name || res.messages[1].author_name).toBe('Cofoundaz Support');
  });

  it('sends a reply to an existing ticket and supports thread array response', async () => {
    const mockMessages = [
      {
        id: 'm-1',
        author_kind: 'founder' as const,
        author: { name: 'John Doe' },
        body: 'Initial query',
        created_at: '2026-11-13T10:00:00Z',
      },
      {
        id: 'm-3',
        author_kind: 'founder' as const,
        author: { name: 'John Doe' },
        body: 'Thank you, I found it!',
        created_at: '2026-11-13T11:00:00Z',
      },
    ];

    const spy = vi.spyOn(client, 'apiClient').mockResolvedValueOnce({
      data: { messages: mockMessages },
    });

    const res = await sendFounderMessage('t-1', { body: 'Thank you, I found it!' });
    expect(spy).toHaveBeenCalledWith('/support/tickets/t-1/messages', {
      method: 'POST',
      body: JSON.stringify({ body: 'Thank you, I found it!' }),
    });
    expect(res.id).toBe('m-3');
    expect(res.messages).toHaveLength(2);
  });
});
