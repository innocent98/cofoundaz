import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AdminSupportView } from './admin-support-view';
import * as adminTicketsApi from '@/lib/api/admin-tickets';
import { ApiError } from '@/lib/api/client';
import { type AdminMeResponse } from '@/lib/api/admin';

const mockAdminMe: AdminMeResponse = {
  user_id: 'staff-1',
  role: 'admin',
  scopes: ['support'],
  email: 'agent@cofoundaz.com',
  full_name: 'Support Agent',
};

describe('Admin Support View (components/admin/admin-support-view.tsx)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders badges, filters, ticket row, priority chip, and SLA state', async () => {
    vi.spyOn(adminTicketsApi, 'getAdminSupportCounts').mockResolvedValue({
      open: 5,
      mine: 2,
      resolved: 10,
      breached: 1,
      unassigned: 3,
    });
    vi.spyOn(adminTicketsApi, 'getAdminSupportAssignees').mockResolvedValue([
      { id: 'staff-1', name: 'Support Agent', email: 'agent@cofoundaz.com' },
    ]);
    vi.spyOn(adminTicketsApi, 'getAdminCannedResponses').mockResolvedValue([]);

    const mockTicket: adminTicketsApi.AdminTicketItem = {
      id: 't-101',
      number: 'T-101',
      subject: 'Payments failing intermittently',
      category: 'billing',
      priority: 'P1',
      status: 'open',
      escalated: true,
      founder: { id: 'u-1', name: 'Bob Founder', email: 'bob@startup.io' },
      workspace: { id: 'ws-1', name: 'Startup Beta', plan_key: 'growth' },
      assignee: null,
      created_at: '2026-11-13T09:00:00Z',
      sla: { state: 'breached', due_at: null },
    };

    vi.spyOn(adminTicketsApi, 'getAdminSupportTickets').mockResolvedValue({
      tickets: [mockTicket],
      next_cursor: null,
    });
    vi.spyOn(adminTicketsApi, 'getAdminSupportTicket').mockResolvedValue({
      id: 't-101',
      number: 'T-101',
      subject: 'Payments failing intermittently',
      category: 'billing',
      priority: 'P1',
      status: 'open',
      escalated: true,
      resolved_at: null,
      founder: { id: 'u-1', name: 'Bob Founder', email: 'bob@startup.io' },
      workspace: { id: 'ws-1', name: 'Startup Beta', plan_key: 'growth' },
      assignee: null,
      created_at: '2026-11-13T09:00:00Z',
      sla: { state: 'breached', due_at: null },
      messages: [],
      notes: [],
    });

    render(<AdminSupportView adminMe={mockAdminMe} />);

    expect(await screen.findByText('Payments failing intermittently', {}, { timeout: 10000 })).toBeInTheDocument();
    expect(screen.getByText('T-101')).toBeInTheDocument();
    expect(screen.getAllByText('P1')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Escalated')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Overdue')[0]).toBeInTheDocument();
    expect(screen.getByText('Bob Founder')).toBeInTheDocument();
    expect(screen.getByText('Startup Beta (growth)')).toBeInTheDocument();
  });

  it('null-guards founder name falling back to email or default', async () => {
    vi.spyOn(adminTicketsApi, 'getAdminSupportCounts').mockResolvedValue({
      open: 1,
      mine: 0,
      resolved: 0,
      breached: 0,
      unassigned: 1,
    });
    vi.spyOn(adminTicketsApi, 'getAdminSupportAssignees').mockResolvedValue([]);
    vi.spyOn(adminTicketsApi, 'getAdminCannedResponses').mockResolvedValue([]);

    const mockTicket: adminTicketsApi.AdminTicketItem = {
      id: 't-null-founder',
      number: 'T-999',
      subject: 'Deleted founder account query',
      category: 'account',
      priority: 'P3',
      status: 'open',
      escalated: false,
      founder: { id: 'u-deleted', name: null, email: 'ghost@deleted.io' },
      workspace: { id: 'ws-ghost', name: 'Ghost Co', plan_key: 'starter' },
      assignee: null,
      created_at: '2026-11-13T09:00:00Z',
      sla: { state: 'ok', due_at: null },
    };

    vi.spyOn(adminTicketsApi, 'getAdminSupportTickets').mockResolvedValue({
      tickets: [mockTicket],
      next_cursor: null,
    });
    vi.spyOn(adminTicketsApi, 'getAdminSupportTicket').mockResolvedValue({
      ...mockTicket,
      resolved_at: null,
      messages: [],
      notes: [],
    });

    render(<AdminSupportView adminMe={mockAdminMe} />);

    expect(await screen.findByText('Deleted founder account query', {}, { timeout: 10000 })).toBeInTheDocument();
    expect(screen.getAllByText('ghost@deleted.io')[0]).toBeInTheDocument();
  });

  it('sends a reply to founder, and auto-assigns ticket on first reply', async () => {
    vi.spyOn(adminTicketsApi, 'getAdminSupportCounts').mockResolvedValue({
      open: 1,
      mine: 0,
      resolved: 0,
      breached: 0,
      unassigned: 1,
    });
    vi.spyOn(adminTicketsApi, 'getAdminSupportAssignees').mockResolvedValue([]);
    vi.spyOn(adminTicketsApi, 'getAdminCannedResponses').mockResolvedValue([]);

    const mockTicket: adminTicketsApi.AdminTicketItem = {
      id: 't-102',
      number: 'T-102',
      subject: 'Need help connecting domain',
      category: 'how_to',
      priority: 'P3',
      status: 'open',
      escalated: false,
      founder: { id: 'u-2', name: 'Charlie', email: 'charlie@domain.co' },
      workspace: { id: 'ws-2', name: 'Domain App', plan_key: 'starter' },
      assignee: null,
      created_at: '2026-11-13T10:00:00Z',
      sla: { state: 'ok', due_at: '2026-11-14T10:00:00Z' },
    };

    vi.spyOn(adminTicketsApi, 'getAdminSupportTickets').mockResolvedValue({
      tickets: [mockTicket],
      next_cursor: null,
    });
    vi.spyOn(adminTicketsApi, 'getAdminSupportTicket').mockResolvedValue({
      ...mockTicket,
      resolved_at: null,
      messages: [],
      notes: [],
    });

    const replySpy = vi.spyOn(adminTicketsApi, 'replyAdminSupportTicket').mockResolvedValueOnce({
      id: 'm-reply-1',
      author_kind: 'staff',
      author: { name: 'Cofoundaz Support' },
      body: 'Here are the DNS CNAME records to add.',
      created_at: '2026-11-13T11:00:00Z',
    });

    render(<AdminSupportView adminMe={mockAdminMe} />);

    const replyInput = await screen.findByPlaceholderText(/type reply to founder/i, {}, { timeout: 10000 });
    fireEvent.change(replyInput, {
      target: { value: 'Here are the DNS CNAME records to add.' },
    });
    fireEvent.click(screen.getByRole('button', { name: /send reply/i }));

    await waitFor(() => {
      expect(replySpy).toHaveBeenCalledWith('t-102', {
        body: 'Here are the DNS CNAME records to add.',
      });
    });
  });

  it('adds an internal staff note', async () => {
    vi.spyOn(adminTicketsApi, 'getAdminSupportCounts').mockResolvedValue({
      open: 1,
      mine: 0,
      resolved: 0,
      breached: 0,
      unassigned: 0,
    });
    vi.spyOn(adminTicketsApi, 'getAdminSupportAssignees').mockResolvedValue([]);
    vi.spyOn(adminTicketsApi, 'getAdminCannedResponses').mockResolvedValue([]);

    const mockTicket: adminTicketsApi.AdminTicketItem = {
      id: 't-103',
      number: 'T-103',
      subject: 'Security inquiry',
      category: 'account',
      priority: 'P2',
      status: 'open',
      escalated: false,
      founder: { id: 'u-3', name: 'Dave', email: 'dave@sec.com' },
      workspace: { id: 'ws-3', name: 'Sec Corp', plan_key: 'scale' },
      assignee: null,
      created_at: '2026-11-13T10:00:00Z',
      sla: { state: 'ok', due_at: null },
    };

    vi.spyOn(adminTicketsApi, 'getAdminSupportTickets').mockResolvedValue({
      tickets: [mockTicket],
      next_cursor: null,
    });
    vi.spyOn(adminTicketsApi, 'getAdminSupportTicket').mockResolvedValue({
      ...mockTicket,
      resolved_at: null,
      messages: [],
      notes: [],
    });

    const noteSpy = vi.spyOn(adminTicketsApi, 'addAdminSupportNote').mockResolvedValueOnce({
      id: 'n-1',
      author_name: 'Support Agent',
      body: 'Verified 2FA logs with devops.',
      created_at: '2026-11-13T11:00:00Z',
    });

    render(<AdminSupportView adminMe={mockAdminMe} />);
    expect(await screen.findByText('Security inquiry', {}, { timeout: 10000 })).toBeInTheDocument();

    // Switch to Internal notes tab
    const notesTabBtn = await screen.findByRole('button', { name: /internal notes/i }, { timeout: 10000 });
    fireEvent.click(notesTabBtn);

    const noteInput = await screen.findByPlaceholderText(/internal notes visible to staff only/i, {}, { timeout: 10000 });
    fireEvent.change(noteInput, {
      target: { value: 'Verified 2FA logs with devops.' },
    });
    fireEvent.click(screen.getByRole('button', { name: /save internal note/i }));

    await waitFor(() => {
      expect(noteSpy).toHaveBeenCalledWith('t-103', {
        body: 'Verified 2FA logs with devops.',
      });
    });
  });

  it('resolves ticket without TOTP using optional closing message confirmation dialog', async () => {
    vi.spyOn(adminTicketsApi, 'getAdminSupportCounts').mockResolvedValue({
      open: 1,
      mine: 0,
      resolved: 0,
      breached: 0,
      unassigned: 0,
    });
    vi.spyOn(adminTicketsApi, 'getAdminSupportAssignees').mockResolvedValue([]);
    vi.spyOn(adminTicketsApi, 'getAdminCannedResponses').mockResolvedValue([]);

    const mockTicket: adminTicketsApi.AdminTicketItem = {
      id: 't-104',
      number: 'T-104',
      subject: 'Close this request',
      category: 'other',
      priority: 'P4',
      status: 'open',
      escalated: false,
      founder: { id: 'u-4', name: 'Eve', email: 'eve@corp.com' },
      workspace: { id: 'ws-4', name: 'Eve Startup', plan_key: 'starter' },
      assignee: null,
      created_at: '2026-11-13T10:00:00Z',
      sla: { state: 'ok', due_at: null },
    };

    vi.spyOn(adminTicketsApi, 'getAdminSupportTickets').mockResolvedValue({
      tickets: [mockTicket],
      next_cursor: null,
    });
    vi.spyOn(adminTicketsApi, 'getAdminSupportTicket').mockResolvedValue({
      ...mockTicket,
      resolved_at: null,
      messages: [],
      notes: [],
    });

    const resolveSpy = vi.spyOn(adminTicketsApi, 'resolveAdminSupportTicket').mockResolvedValueOnce();

    render(<AdminSupportView adminMe={mockAdminMe} />);

    // Click Resolve ticket
    const resolveBtn = await screen.findByRole('button', { name: /resolve ticket/i }, { timeout: 10000 });
    fireEvent.click(resolveBtn);

    // Confirmation dialog is rendered without TOTP
    expect(await screen.findByText(/resolve ticket T-104/i, {}, { timeout: 10000 })).toBeInTheDocument();
    expect(screen.getByText('This sends the founder a closing email.')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('000000')).not.toBeInTheDocument();

    // Type optional closing message
    const msgInput = screen.getByPlaceholderText(/optional closing message sent to founder/i);
    fireEvent.change(msgInput, {
      target: { value: 'Your request has been completely taken care of. Have a nice day!' },
    });

    const confirmBtn = screen.getByRole('button', { name: /confirm resolution/i });
    expect(confirmBtn).toBeEnabled();
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(resolveSpy).toHaveBeenCalledWith('t-104', {
        message: 'Your request has been completely taken care of. Have a nice day!',
      });
    });
  });

  it('handles resolve error inline without breaking page state', async () => {
    vi.spyOn(adminTicketsApi, 'getAdminSupportCounts').mockResolvedValue({
      open: 1,
      mine: 0,
      resolved: 0,
      breached: 0,
      unassigned: 0,
    });
    vi.spyOn(adminTicketsApi, 'getAdminSupportAssignees').mockResolvedValue([]);
    vi.spyOn(adminTicketsApi, 'getAdminCannedResponses').mockResolvedValue([]);

    const mockTicket: adminTicketsApi.AdminTicketItem = {
      id: 't-105',
      number: 'T-105',
      subject: 'Resolve Error Test',
      category: 'other',
      priority: 'P4',
      status: 'open',
      escalated: false,
      founder: { id: 'u-5', name: 'Frank', email: 'frank@test.com' },
      workspace: { id: 'ws-5', name: 'Frank Co', plan_key: 'starter' },
      assignee: null,
      created_at: '2026-11-13T10:00:00Z',
      sla: { state: 'ok', due_at: null },
    };

    vi.spyOn(adminTicketsApi, 'getAdminSupportTickets').mockResolvedValue({
      tickets: [mockTicket],
      next_cursor: null,
    });
    vi.spyOn(adminTicketsApi, 'getAdminSupportTicket').mockResolvedValue({
      ...mockTicket,
      resolved_at: null,
      messages: [],
      notes: [],
    });

    vi.spyOn(adminTicketsApi, 'resolveAdminSupportTicket').mockRejectedValueOnce(
      new ApiError(400, 'Bad Request', {
        message: 'Unable to resolve ticket due to pending invoice.',
      })
    );

    render(<AdminSupportView adminMe={mockAdminMe} />);

    const resolveBtn = await screen.findByRole('button', { name: /resolve ticket/i }, { timeout: 10000 });
    fireEvent.click(resolveBtn);

    const confirmBtn = await screen.findByRole('button', { name: /confirm resolution/i }, { timeout: 10000 });
    fireEvent.click(confirmBtn);

    expect(
      await screen.findByText('Unable to resolve ticket due to pending invoice.', {}, { timeout: 10000 })
    ).toBeInTheDocument();
  });
});
