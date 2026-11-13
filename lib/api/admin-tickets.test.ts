import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getAdminSupportCounts,
  getAdminSupportAttention,
  getAdminSupportTickets,
  getAdminSupportTicket,
  getAdminSupportAssignees,
  getAdminCannedResponses,
  createAdminCannedResponse,
  updateAdminCannedResponse,
  deleteAdminCannedResponse,
  replyAdminSupportTicket,
  addAdminSupportNote,
  updateAdminSupportPriority,
  assignAdminSupportTicket,
  escalateAdminSupportTicket,
  resolveAdminSupportTicket,
  reopenAdminSupportTicket,
  type AdminTicketItem,
  type AdminTicketDetail,
} from './admin-tickets';
import * as client from './client';

describe('Admin Support Tickets API (lib/api/admin-tickets.ts)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches counts for badges and chips', async () => {
    const mockCounts = {
      open: 14,
      mine: 3,
      resolved: 42,
      breached: 2,
      unassigned: 5,
    };
    const spy = vi.spyOn(client, 'apiClient').mockResolvedValueOnce({
      data: mockCounts,
    });

    const res = await getAdminSupportCounts();
    expect(spy).toHaveBeenCalledWith('/admin/support/counts');
    expect(res.open).toBe(14);
    expect(res.breached).toBe(2);
  });

  it('fetches attention counts for dashboard', async () => {
    const spy = vi.spyOn(client, 'apiClient').mockResolvedValueOnce({
      data: {
        tickets: { open: 7, breached: 1 },
      },
    });

    const res = await getAdminSupportAttention();
    expect(spy).toHaveBeenCalledWith('/admin/dashboard/attention');
    expect(res.tickets.open).toBe(7);
    expect(res.tickets.breached).toBe(1);
  });

  it('fetches tickets with complex query parameters', async () => {
    const mockItem: AdminTicketItem = {
      id: 't-10',
      number: 'T-1010',
      subject: 'Critical production bug',
      category: 'bug',
      priority: 'P1',
      status: 'open',
      is_escalated: true,
      founder: { id: 'u-1', name: 'Alice', email: 'alice@startup.co' },
      workspace: { id: 'ws-1', name: 'Startup Alpha', plan_key: 'scale' },
      assignee: { id: 'staff-1', name: 'Staff Support', email: 'staff@cofoundaz.com' },
      created_at: '2026-11-13T09:00:00Z',
      sla: { state: 'breached', due_at: '2026-11-13T10:00:00Z' },
    };

    const spy = vi.spyOn(client, 'apiClient').mockResolvedValueOnce({
      data: { tickets: [mockItem] },
      meta: { next_cursor: 'cur_page2' },
    });

    const res = await getAdminSupportTickets({
      tab: 'open',
      priority: 'P1',
      category: 'bug',
      sla: 'breached',
      escalated: true,
      unassigned: true,
      query: 'Alpha',
      cursor: 'cur_page1',
    });

    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining('/admin/support/tickets?tab=open&priority=P1&category=bug&sla=breached&escalated=true&unassigned=true&query=Alpha&cursor=cur_page1')
    );
    expect(res.tickets).toHaveLength(1);
    expect(res.tickets[0].number).toBe('T-1010');
    expect(res.next_cursor).toBe('cur_page2');
  });

  it('fetches full ticket detail with conversation and internal notes', async () => {
    const mockDetail: AdminTicketDetail = {
      ticket: {
        id: 't-10',
        number: 'T-1010',
        subject: 'Critical production bug',
        category: 'bug',
        priority: 'P1',
        status: 'open',
        is_escalated: true,
        escalation_reason: 'Major outage reported',
        resolved_at: null,
        founder: { id: 'u-1', name: 'Alice', email: 'alice@startup.co' },
        workspace: { id: 'ws-1', name: 'Startup Alpha', plan_key: 'scale' },
        assignee: null,
        created_at: '2026-11-13T09:00:00Z',
        sla: { state: 'breached', due_at: null },
      },
      messages: [
        {
          id: 'm-1',
          author_type: 'founder',
          author_name: 'Alice',
          body: 'We cannot login!',
          created_at: '2026-11-13T09:00:00Z',
        },
      ],
      notes: [
        {
          id: 'n-1',
          author_name: 'Support Agent',
          body: 'Checking auth service logs now.',
          created_at: '2026-11-13T09:05:00Z',
        },
      ],
    };

    const spy = vi.spyOn(client, 'apiClient').mockResolvedValueOnce({
      data: mockDetail,
    });

    const res = await getAdminSupportTicket('t-10');
    expect(spy).toHaveBeenCalledWith('/admin/support/tickets/t-10');
    expect(res.ticket.subject).toBe('Critical production bug');
    expect(res.messages).toHaveLength(1);
    expect(res.notes).toHaveLength(1);
  });

  it('manages canned responses (get, create, update, delete)', async () => {
    const getSpy = vi.spyOn(client, 'apiClient').mockResolvedValueOnce({
      data: { responses: [{ id: 'c-1', title: 'Greeting', body: 'Hello!' }] },
    });
    const items = await getAdminCannedResponses();
    expect(getSpy).toHaveBeenCalledWith('/admin/support/canned');
    expect(items).toHaveLength(1);

    const postSpy = vi.spyOn(client, 'apiClient').mockResolvedValueOnce({
      data: { id: 'c-2', title: 'Farewell', body: 'Have a great day!' },
    });
    const created = await createAdminCannedResponse({ title: 'Farewell', body: 'Have a great day!' });
    expect(postSpy).toHaveBeenCalledWith('/admin/support/canned', {
      method: 'POST',
      body: JSON.stringify({ title: 'Farewell', body: 'Have a great day!' }),
    });
    expect(created.id).toBe('c-2');

    const putSpy = vi.spyOn(client, 'apiClient').mockResolvedValueOnce({
      data: { id: 'c-2', title: 'Updated', body: 'New body' },
    });
    const updated = await updateAdminCannedResponse('c-2', { title: 'Updated', body: 'New body' });
    expect(putSpy).toHaveBeenCalledWith('/admin/support/canned/c-2', {
      method: 'PUT',
      body: JSON.stringify({ title: 'Updated', body: 'New body' }),
    });
    expect(updated.title).toBe('Updated');

    const delSpy = vi.spyOn(client, 'apiClient').mockResolvedValueOnce({});
    await deleteAdminCannedResponse('c-2');
    expect(delSpy).toHaveBeenCalledWith('/admin/support/canned/c-2', { method: 'DELETE' });
  });

  it('executes ticket actions (reply, note, priority, assign, escalate, resolve, reopen)', async () => {
    const replySpy = vi.spyOn(client, 'apiClient').mockResolvedValueOnce({
      data: { message: { id: 'm-reply', author_type: 'staff', author_name: 'Cofoundaz Support', body: 'We fixed it.', created_at: '2026-11-13T10:00:00Z' } },
    });
    const msg = await replyAdminSupportTicket('t-1', { body: 'We fixed it.' });
    expect(replySpy).toHaveBeenCalledWith('/admin/support/tickets/t-1/reply', {
      method: 'POST',
      body: JSON.stringify({ body: 'We fixed it.' }),
    });
    expect(msg.body).toBe('We fixed it.');

    const noteSpy = vi.spyOn(client, 'apiClient').mockResolvedValueOnce({
      data: { note: { id: 'n-new', author_name: 'Staff', body: 'Customer confirmed fix.', created_at: '2026-11-13T10:01:00Z' } },
    });
    const note = await addAdminSupportNote('t-1', { body: 'Customer confirmed fix.' });
    expect(noteSpy).toHaveBeenCalledWith('/admin/support/tickets/t-1/notes', {
      method: 'POST',
      body: JSON.stringify({ body: 'Customer confirmed fix.' }),
    });
    expect(note.id).toBe('n-new');

    const prioSpy = vi.spyOn(client, 'apiClient').mockResolvedValueOnce({});
    await updateAdminSupportPriority('t-1', 'P2');
    expect(prioSpy).toHaveBeenCalledWith('/admin/support/tickets/t-1/priority', {
      method: 'PATCH',
      body: JSON.stringify({ priority: 'P2' }),
    });

    const assignSpy = vi.spyOn(client, 'apiClient').mockResolvedValueOnce({});
    await assignAdminSupportTicket('t-1', 'staff-99');
    expect(assignSpy).toHaveBeenCalledWith('/admin/support/tickets/t-1/assign', {
      method: 'POST',
      body: JSON.stringify({ assignee_user_id: 'staff-99' }),
    });

    const escSpy = vi.spyOn(client, 'apiClient').mockResolvedValueOnce({});
    await escalateAdminSupportTicket('t-1', { reason: 'Severe customer dissatisfaction' });
    expect(escSpy).toHaveBeenCalledWith('/admin/support/tickets/t-1/escalate', {
      method: 'POST',
      body: JSON.stringify({ reason: 'Severe customer dissatisfaction' }),
    });

    const resSpy = vi.spyOn(client, 'apiClient').mockResolvedValueOnce({});
    await resolveAdminSupportTicket('t-1', {
      reason: 'Issue resolved cleanly',
      totp_code: '123456',
    });
    expect(resSpy).toHaveBeenCalledWith('/admin/support/tickets/t-1/resolve', {
      method: 'POST',
      body: JSON.stringify({ reason: 'Issue resolved cleanly', totp_code: '123456' }),
    });

    const reopenSpy = vi.spyOn(client, 'apiClient').mockResolvedValueOnce({});
    await reopenAdminSupportTicket('t-1', { reason: 'Customer followed up with new logs' });
    expect(reopenSpy).toHaveBeenCalledWith('/admin/support/tickets/t-1/reopen', {
      method: 'POST',
      body: JSON.stringify({ reason: 'Customer followed up with new logs' }),
    });
  });
});

