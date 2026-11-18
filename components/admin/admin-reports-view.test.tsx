import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AdminReportsView } from './admin-reports-view';
import * as adminReportsApi from '@/lib/api/admin-reports';
import type { AdminMeResponse } from '@/lib/api/admin';

const superAdminMe: AdminMeResponse = {
  user_id: 'sa-1',
  role: 'super_admin',
  scopes: [],
  email: 'superadmin@example.com',
  full_name: 'Super Admin',
};

const moderatorMe: AdminMeResponse = {
  user_id: 'mod-1',
  role: 'admin',
  scopes: ['moderation'],
  email: 'mod@example.com',
  full_name: 'Mod Admin',
};

const mockCounts = {
  open: 3,
  escalated: 1,
  closed: 5,
};

const mockOpenReports = [
  {
    id: 'rep-1',
    item_type: 'ai_message' as const,
    reason: 'inaccurate',
    snippet: 'This is a misleading AI financial statement.',
    snippet_truncated: false,
    workspace: { id: 'ws-1', name: 'Alpha Inc', plan_key: 'scale' },
    reporter: { id: 'rep-u1', name: 'John Doe', email: 'john@alpha.com' },
    created_at: '2026-11-14T08:00:00Z',
    status: 'open' as const,
  },
  {
    id: 'rep-2',
    item_type: 'comment' as const,
    reason: 'abusive',
    snippet: 'Teammate rude comment snippet that is truncated...',
    snippet_truncated: true,
    workspace: { id: 'ws-2', name: 'Beta Ltd', plan_key: 'growth' },
    reporter: { id: 'rep-u2', name: 'Jane Smith', email: 'jane@beta.com' },
    created_at: '2026-11-14T07:00:00Z',
    status: 'open' as const,
  },
];

const mockDetailReport1 = {
  id: 'rep-1',
  item_type: 'ai_message' as const,
  item_id: 'msg-1',
  reason: 'inaccurate',
  snippet: 'This is a misleading AI financial statement.',
  note: 'Check the tax calculation',
  reporter: { id: 'rep-u1', name: 'John Doe', email: 'john@alpha.com' },
  author: null, // AI message -> shows AI Co-Founder
  workspace: { id: 'ws-1', name: 'Alpha Inc', plan_key: 'scale' },
  reports_on_item: 2,
  status: 'open' as const,
  created_at: '2026-11-14T08:00:00Z',
};

describe('AdminReportsView', { timeout: 15000 }, () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(adminReportsApi, 'getAdminReportsCounts').mockResolvedValue(mockCounts);
    vi.spyOn(adminReportsApi, 'getAdminReports').mockResolvedValue({
      reports: mockOpenReports,
      next_cursor: null,
    });
    vi.spyOn(adminReportsApi, 'getAdminReport').mockResolvedValue(mockDetailReport1);
  });

  it('renders top stats, counts, list items, and detail pane', async () => {
    render(<AdminReportsView adminMe={superAdminMe} />);

    await waitFor(() => {
      expect(screen.getByText('Content Moderation & Reports')).toBeInTheDocument();
      expect(screen.getByText('Alpha Inc')).toBeInTheDocument();
      expect(screen.getByText('Beta Ltd')).toBeInTheDocument();
    }, { timeout: 5000 });

    await waitFor(() => {
      // Detail pane shows "AI Co-Founder" for author=null
      expect(screen.getByText('AI Co-Founder')).toBeInTheDocument();
      expect(screen.getByText(/2 people reported this content/i)).toBeInTheDocument();
      expect(screen.getByText(/Check the tax calculation/i)).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('allows dismissing a report with reason', async () => {
    const dismissSpy = vi.spyOn(adminReportsApi, 'dismissAdminReport').mockResolvedValue(undefined);

    render(<AdminReportsView adminMe={superAdminMe} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Dismiss Report' })).toBeInTheDocument();
    }, { timeout: 5000 });

    fireEvent.click(screen.getByRole('button', { name: 'Dismiss Report' }));

    const reasonInput = await screen.findByPlaceholderText(/State the internal reason for this decision/i, {}, { timeout: 5000 });
    fireEvent.change(reasonInput, { target: { value: 'Valid explanation that this did not violate policy.' } });

    const submitBtns = screen.getAllByRole('button', { name: 'Dismiss Report' });
    const modalSubmitBtn = submitBtns[submitBtns.length - 1];
    fireEvent.click(modalSubmitBtn);

    await waitFor(() => {
      expect(dismissSpy).toHaveBeenCalledWith('rep-1', {
        reason: 'Valid explanation that this did not violate policy.',
      });
    }, { timeout: 5000 });
  });

  it('allows escalating a report with reason', async () => {
    const escalateSpy = vi.spyOn(adminReportsApi, 'escalateAdminReport').mockResolvedValue(undefined);

    render(<AdminReportsView adminMe={superAdminMe} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Escalate to Super Admin/i })).toBeInTheDocument();
    }, { timeout: 5000 });

    fireEvent.click(screen.getByRole('button', { name: /Escalate to Super Admin/i }));

    const reasonInput = await screen.findByPlaceholderText(/State the internal reason for this decision/i, {}, { timeout: 5000 });
    fireEvent.change(reasonInput, { target: { value: 'Need second opinion on potentially harmful tax advice.' } });

    const submitBtns = screen.getAllByRole('button', { name: 'Escalate to Super Admin' });
    fireEvent.click(submitBtns[submitBtns.length - 1]);

    await waitFor(() => {
      expect(escalateSpy).toHaveBeenCalledWith('rep-1', {
        reason: 'Need second opinion on potentially harmful tax advice.',
      });
    }, { timeout: 5000 });
  });

  it('allows removing content using StaffActionDialog (reason + TOTP)', async () => {
    const removeSpy = vi.spyOn(adminReportsApi, 'removeAdminReportContent').mockResolvedValue(undefined);

    render(<AdminReportsView adminMe={superAdminMe} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Remove Content/i })).toBeInTheDocument();
    }, { timeout: 5000 });

    fireEvent.click(screen.getByRole('button', { name: /Remove Content/i }));

    // Inside StaffActionDialog
    expect(await screen.findByText("The author will see 'Removed by moderation'. This closes every report on this item. You can restore it later.", {}, { timeout: 5000 })).toBeInTheDocument();

    const reasonInput = screen.getByPlaceholderText(/Explain why this action is being taken/i);
    fireEvent.change(reasonInput, { target: { value: 'Contains severe policy violations and misleading advice.' } });

    const totpInput = screen.getByPlaceholderText('000000');
    fireEvent.change(totpInput, { target: { value: '123456' } });

    const confirmBtn = screen.getByRole('button', { name: 'Remove content' });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(removeSpy).toHaveBeenCalledWith('rep-1', {
        reason: 'Contains severe policy violations and misleading advice.',
        totp_code: '123456',
      });
    }, { timeout: 5000 });
  });

  it('enforces R7 rule: non-super-admin on escalated report sees "Waiting for a Super Admin" with actions hidden', async () => {
    const mockEscalatedDetail = {
      ...mockDetailReport1,
      status: 'escalated' as const,
      escalation_reason: 'Escalated by first reviewer',
    };
    vi.spyOn(adminReportsApi, 'getAdminReport').mockResolvedValue(mockEscalatedDetail);

    render(<AdminReportsView adminMe={moderatorMe} />);

    await waitFor(() => {
      expect(screen.getByText('Waiting for a Super Admin')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Dismiss Report' })).toBeNull();
      expect(screen.queryByRole('button', { name: /Remove Content/i })).toBeNull();
    }, { timeout: 5000 });
  });

  it('allows restoring content on Closed tab for removed report', async () => {
    const mockRemovedClosedReport = {
      ...mockDetailReport1,
      id: 'rep-removed-1',
      status: 'removed' as const,
    };
    vi.spyOn(adminReportsApi, 'getAdminReport').mockResolvedValue(mockRemovedClosedReport);
    vi.spyOn(adminReportsApi, 'getAdminReports').mockImplementation(async (params) => {
      if (params.tab === 'closed') {
        return {
          reports: [{ ...mockOpenReports[0], id: 'rep-removed-1', status: 'removed' as const }],
          next_cursor: null,
        };
      }
      return { reports: mockOpenReports, next_cursor: null };
    });
    const restoreSpy = vi.spyOn(adminReportsApi, 'restoreAdminReportContent').mockResolvedValue(undefined);

    render(<AdminReportsView adminMe={superAdminMe} />);

    // Click Closed tab
    const closedTabBtn = await screen.findByRole('button', { name: /closed/i }, { timeout: 5000 });
    fireEvent.click(closedTabBtn);

    const restoreBtn = await screen.findByRole('button', { name: /Restore Content/i }, { timeout: 5000 });
    fireEvent.click(restoreBtn);

    const reasonInput = await screen.findByPlaceholderText(/Explain why this action is being taken/i, {}, { timeout: 5000 });
    fireEvent.change(reasonInput, { target: { value: 'Content restored after author appeal verification.' } });

    const totpInput = screen.getByPlaceholderText('000000');
    fireEvent.change(totpInput, { target: { value: '654321' } });

    const confirmBtn = screen.getByRole('button', { name: 'Restore content' });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(restoreSpy).toHaveBeenCalledWith('rep-removed-1', {
        reason: 'Content restored after author appeal verification.',
        totp_code: '654321',
      });
    }, { timeout: 5000 });
  });
});
