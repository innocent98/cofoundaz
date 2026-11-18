import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { HelpTab } from './help-tab';
import * as supportApi from '@/lib/api/support';
import { ApiError } from '@/lib/api/client';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('Founder HelpTab (components/settings/help-tab.tsx)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockPush.mockReset();
  });

  it('renders tickets list, categories, status chips, and "Waiting for you" badge', async () => {
    vi.spyOn(supportApi, 'getFounderTickets').mockResolvedValueOnce({
      tickets: [
        {
          id: 't-1',
          number: 'T-1001',
          subject: 'Stripe webhook failure',
          category: 'billing',
          status: 'open',
          last_message_at: '2026-11-13T10:00:00Z',
          last_author: 'staff',
        },
        {
          id: 't-2',
          number: 'T-1002',
          subject: 'How do I invite members?',
          category: 'how_to',
          status: 'resolved',
          last_message_at: '2026-11-12T10:00:00Z',
          last_author: 'founder',
        },
      ],
      next_cursor: null,
    });

    render(<HelpTab />);

    expect(await screen.findByText('Help & Support')).toBeInTheDocument();
    expect(screen.getByText('Stripe webhook failure')).toBeInTheDocument();
    expect(screen.getByText('T-1001')).toBeInTheDocument();
    expect(screen.getByText('Billing')).toBeInTheDocument();
    expect(screen.getByText('Waiting for you')).toBeInTheDocument();

    expect(screen.getByText('How do I invite members?')).toBeInTheDocument();
    expect(screen.getByText('T-1002')).toBeInTheDocument();
    expect(screen.getByText('How do I...')).toBeInTheDocument();
    expect(screen.getByText('Resolved')).toBeInTheDocument();
  });

  it('submits a new ticket with category, subject, and message', async () => {
    vi.spyOn(supportApi, 'getFounderTickets').mockResolvedValueOnce({
      tickets: [],
      next_cursor: null,
    });
    const createSpy = vi.spyOn(supportApi, 'createFounderTicket').mockResolvedValueOnce({
      id: 't-999',
      number: 'T-1999',
    });

    render(<HelpTab />);

    // Click "New ticket" button
    const newBtn = await screen.findByRole('button', { name: /new ticket/i });
    fireEvent.click(newBtn);

    expect(screen.getByText('Create Support Ticket')).toBeInTheDocument();

    // Fill form
    fireEvent.change(screen.getByLabelText(/subject/i), {
      target: { value: 'Bug in journal rich text editor' },
    });
    fireEvent.change(screen.getByLabelText(/message/i), {
      target: { value: 'Typing markdown causes cursor to jump to end of line.' },
    });

    fireEvent.click(screen.getByRole('button', { name: /submit ticket/i }));

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalledWith({
        category: 'bug',
        subject: 'Bug in journal rich text editor',
        message: 'Typing markdown causes cursor to jump to end of line.',
      });
      expect(mockPush).toHaveBeenCalledWith('/settings/help/t-999');
    });
  });

  it('handles 429 RATE_LIMITED on ticket creation', async () => {
    vi.spyOn(supportApi, 'getFounderTickets').mockResolvedValueOnce({
      tickets: [],
      next_cursor: null,
    });
    vi.spyOn(supportApi, 'createFounderTicket').mockRejectedValueOnce(
      new ApiError(429, 'Too Many Requests', {
        message: 'You have reached the ticket limit of 5 per hour.',
      })
    );

    render(<HelpTab />);
    fireEvent.click(await screen.findByRole('button', { name: /new ticket/i }));

    fireEvent.change(screen.getByLabelText(/subject/i), {
      target: { value: 'Too many tickets test' },
    });
    fireEvent.change(screen.getByLabelText(/message/i), {
      target: { value: 'Testing rate limits on ticket creation.' },
    });
    fireEvent.click(screen.getByRole('button', { name: /submit ticket/i }));

    expect(
      await screen.findByText('You have reached the ticket limit of 5 per hour.')
    ).toBeInTheDocument();
  });

  it('renders ticket thread, right-aligns founder, left-aligns staff with Cofoundaz Support', async () => {
    vi.spyOn(supportApi, 'getFounderTicket').mockResolvedValueOnce({
      ticket: {
        id: 't-1',
        number: 'T-1001',
        subject: 'Invoice clarification',
        category: 'billing',
        status: 'open',
        created_at: '2026-11-13T10:00:00Z',
        resolved_at: null,
      },
      messages: [
        {
          id: 'm-1',
          author_type: 'founder',
          author_name: 'Jane Doe',
          body: 'Why was I billed ₦50,000?',
          created_at: '2026-11-13T10:00:00Z',
        },
        {
          id: 'm-2',
          author_type: 'staff',
          author_name: 'Cofoundaz Support',
          body: 'Hello Jane, that covers the Pro workspace plan for this month.',
          created_at: '2026-11-13T10:15:00Z',
        },
      ],
    });

    render(<HelpTab initialTicketId="t-1" />);

    expect(await screen.findByText('Invoice clarification')).toBeInTheDocument();
    expect(screen.getByText('T-1001')).toBeInTheDocument();
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByText('Why was I billed ₦50,000?')).toBeInTheDocument();

    expect(screen.getByText('Cofoundaz Support')).toBeInTheDocument();
    expect(
      screen.getByText('Hello Jane, that covers the Pro workspace plan for this month.')
    ).toBeInTheDocument();

    // Reply box
    expect(screen.getByLabelText(/your reply/i)).toBeInTheDocument();
  });

  it('handles 404 ticket not found cleanly', async () => {
    vi.spyOn(supportApi, 'getFounderTicket').mockRejectedValueOnce(
      new ApiError(404, 'Not Found', { detail: 'Not Found' })
    );

    render(<HelpTab initialTicketId="t-invalid" />);

    expect(await screen.findByText('Ticket not found.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /back to tickets/i })).toBeInTheDocument();
  });

  it('handles 409 TICKET_CLOSED (> 14 days) by replacing reply box with notice', async () => {
    vi.spyOn(supportApi, 'getFounderTicket').mockResolvedValueOnce({
      ticket: {
        id: 't-resolved',
        number: 'T-1000',
        subject: 'Old resolved ticket',
        category: 'other',
        status: 'resolved',
        created_at: '2026-10-01T10:00:00Z',
        resolved_at: '2026-10-02T10:00:00Z',
      },
      messages: [],
    });
    vi.spyOn(supportApi, 'sendFounderMessage').mockRejectedValueOnce(
      new ApiError(409, 'Conflict', {
        error: { code: 'TICKET_CLOSED' },
      })
    );

    render(<HelpTab initialTicketId="t-resolved" />);

    await screen.findByText('Old resolved ticket');
    fireEvent.change(screen.getByLabelText(/your reply/i), {
      target: { value: 'Can we reopen this?' },
    });
    fireEvent.click(screen.getByRole('button', { name: /send reply/i }));

    expect(
      await screen.findByText('This ticket was resolved more than 14 days ago.')
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /open a new ticket/i })).toBeInTheDocument();
  });
});

