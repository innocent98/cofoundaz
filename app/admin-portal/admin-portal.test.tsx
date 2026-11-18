import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import AdminPortalPage from './page';
import * as adminApi from '@/lib/api/admin';
import { ApiError } from '@/lib/api/admin';

const mockPush = vi.fn();
const mockReplace = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
  usePathname: () => '/admin-portal',
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('@/lib/api/admin', async (orig) => {
  const actual = await orig<typeof import('@/lib/api/admin')>();
  return {
    ...actual,
    getAdminMe: vi.fn(),
    getAdminKpis: vi.fn(),
    getAdminWorkspaces: vi.fn(),
    getAdminWorkspace: vi.fn(),
    getAdminUsers: vi.fn(),
    getAdminUser: vi.fn(),
    suspendUser: vi.fn(),
    unsuspendUser: vi.fn(),
    sendUserPasswordReset: vi.fn(),
    resendUserVerification: vi.fn(),
  };
});

describe('AdminPortalPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('hidden access: non-staff user receiving 404 gets plain 404 and redirects to /dashboard without access denied copy', async () => {
    vi.mocked(adminApi.getAdminMe).mockRejectedValue(new ApiError(404, 'Not Found', { detail: 'Not Found' }));

    render(<AdminPortalPage />);

    expect(await screen.findByText('404')).toBeInTheDocument();
    expect(screen.getByText('This page could not be found.')).toBeInTheDocument();
    expect(screen.queryByText(/access denied/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/forbidden/i)).not.toBeInTheDocument();
    expect(mockReplace).toHaveBeenCalledWith('/dashboard');
  });

  it('staff access: renders console, real role, and scope chips for Super Admin', async () => {
    vi.mocked(adminApi.getAdminMe).mockResolvedValue({
      user_id: 'sa-1',
      role: 'super_admin',
      scopes: [],
    });
    vi.mocked(adminApi.getAdminKpis).mockResolvedValue({
      total_workspaces: { value: 1420, new_in_window: 85 },
      activation_rate: { percent: 64, previous_percent: 61 },
      paid_conversion: { percent: 18, previous_percent: null },
      mrr: { minor: 18200000, currency: 'NGN' },
      signups_series: [{ date: '2026-10-15', signups: 12, activations: 8 }],
    });

    render(<AdminPortalPage />);

    expect(await screen.findByText('Admin Portal')).toBeInTheDocument();
    expect(screen.getByText('Super admin')).toBeInTheDocument();

    // Nav items visible for Super Admin
    expect(screen.getByRole('tab', { name: 'Dashboard' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Workspaces' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Users' })).toBeInTheDocument();

    // Out of scope tabs must NOT be present
    expect(screen.queryByText(/expert vetting/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/content library/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/tenant operations/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/key rotation/i)).not.toBeInTheDocument();

    // KPIs rendered
    expect(await screen.findByText('1,420')).toBeInTheDocument();
    expect(screen.getByText('+85 in 30 days')).toBeInTheDocument();
    expect(screen.getByText('64%')).toBeInTheDocument();
    expect(screen.getByText('+3.0 pts from prior period')).toBeInTheDocument();
    expect(screen.getByText('₦182,000')).toBeInTheDocument();
  });

  it('scope gating: hides Workspaces and Users tabs for staff without support scope', async () => {
    vi.mocked(adminApi.getAdminMe).mockResolvedValue({
      user_id: 'adm-content',
      role: 'admin',
      scopes: ['content'],
    });
    vi.mocked(adminApi.getAdminKpis).mockResolvedValue({
      total_workspaces: { value: 50, new_in_window: 5 },
      activation_rate: { percent: 50, previous_percent: null },
      paid_conversion: { percent: 10, previous_percent: null },
      mrr: { minor: 1000000 },
      signups_series: [],
    });

    render(<AdminPortalPage />);

    expect(await screen.findByText('Admin Portal')).toBeInTheDocument();
    expect(screen.getByText('Admin')).toBeInTheDocument();
    expect(screen.getByText('content')).toBeInTheDocument();

    // Dashboard is visible, but Workspaces and Users are hidden
    expect(screen.getByRole('tab', { name: 'Dashboard' })).toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: 'Workspaces' })).not.toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: 'Users' })).not.toBeInTheDocument();
  });

  it('workspaces tab: lists workspaces and opens detail modal on row click', async () => {
    vi.mocked(adminApi.getAdminMe).mockResolvedValue({
      user_id: 'sa-1',
      role: 'super_admin',
      scopes: [],
    });
    vi.mocked(adminApi.getAdminKpis).mockResolvedValue({
      total_workspaces: { value: 1, new_in_window: 1 },
      activation_rate: { percent: 50, previous_percent: null },
      paid_conversion: { percent: 10, previous_percent: null },
      mrr: { minor: 100000 },
      signups_series: [],
    });

    const mockWorkspace: adminApi.AdminWorkspaceRow = {
      id: 'ws-test-1',
      name: 'Paystack Clone',
      owner: { id: 'u-owner', name: 'Shola Akinlade', email: 'shola@example.com' },
      stage: 'growth',
      seats: 12,
      members: 20,
      plan: 'scale',
      health_score: 95,
      country: 'NG',
      last_active_at: new Date().toISOString(),
    };

    vi.mocked(adminApi.getAdminWorkspaces).mockResolvedValue({
      workspaces: [mockWorkspace],
      next_cursor: null,
    });

    const mockWorkspaceDetail: adminApi.AdminWorkspaceDetail = {
      ...mockWorkspace,
      seats_limit: 15,
      members_count: 2,
      members: [
        { id: 'm-1', user_id: 'u-owner', name: 'Shola Akinlade', email: 'shola@example.com', role: 'founder' },
      ],
      subscription: { plan: 'scale', billing_status: 'active', renews_at: '2026-12-01T00:00:00Z' },
      usage_meters: { api_calls: { used: 4500, limit: 10000 } },
      integrations: [{ id: 'int-1', provider: 'slack', status: 'connected' }],
      created_at: '2026-01-01T00:00:00Z',
    };

    vi.mocked(adminApi.getAdminWorkspace).mockResolvedValue(mockWorkspaceDetail);

    render(<AdminPortalPage />);

    expect(await screen.findByRole('tab', { name: 'Workspaces' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', { name: 'Workspaces' }));

    expect(await screen.findByText('Paystack Clone')).toBeInTheDocument();
    expect(screen.getByText(/Shola Akinlade \(shola@example.com\)/i)).toBeInTheDocument();
    expect(screen.getByText('95')).toBeInTheDocument();

    // Click row to open detail modal
    fireEvent.click(screen.getByText('Paystack Clone'));

    expect(await screen.findByText('Workspace Detail')).toBeInTheDocument();
    expect(screen.getByText('12 / 15')).toBeInTheDocument();
    expect(screen.getByText('slack (connected)')).toBeInTheDocument();
    expect(screen.getByText('4500 / 10000')).toBeInTheDocument();
  });

  it('users tab: renders users, status Suspended for disabled, opens profile with action dialog', async () => {
    vi.mocked(adminApi.getAdminMe).mockResolvedValue({
      user_id: 'sa-1',
      role: 'super_admin',
      scopes: [],
    });
    vi.mocked(adminApi.getAdminKpis).mockResolvedValue({
      total_workspaces: { value: 1, new_in_window: 1 },
      activation_rate: { percent: 50, previous_percent: null },
      paid_conversion: { percent: 10, previous_percent: null },
      mrr: { minor: 100000 },
      signups_series: [],
    });

    const mockUser: adminApi.AdminUserRow = {
      id: 'usr-1',
      full_name: 'Ezra Olubi',
      email: 'ezra@example.com',
      status: 'disabled',
      activity: 'active',
      workspace_count: 2,
      primary_workspace: { id: 'ws-1', name: 'Paystack', billing_status: 'active', plan: 'pro' },
      created_at: new Date().toISOString(),
    };

    vi.mocked(adminApi.getAdminUsers).mockResolvedValue({
      users: [mockUser],
      next_cursor: null,
    });

    const mockUserDetail: adminApi.AdminUserDetail = {
      id: 'usr-1',
      full_name: 'Ezra Olubi',
      email: 'ezra@example.com',
      phone: '+2348099887766',
      status: 'disabled',
      activity: 'active',
      workspaces: [{ id: 'ws-1', name: 'Paystack', role: 'founder', plan: 'pro', billing_status: 'active' }],
      sessions: [{ id: 's-1', ip_address: '102.89.34.1', user_agent: 'Chrome/120', signed_in_at: new Date().toISOString() }],
      can: { suspend: true, unsuspend: true, reset_password: true, resend_verification: true },
      created_at: '2026-01-01T00:00:00Z',
    };

    vi.mocked(adminApi.getAdminUser).mockResolvedValue(mockUserDetail);
    vi.mocked(adminApi.suspendUser).mockResolvedValue();

    render(<AdminPortalPage />);

    expect(await screen.findByRole('tab', { name: 'Users' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', { name: 'Users' }));

    // User is rendered with "Suspended" (not "disabled")
    expect(await screen.findByText('Ezra Olubi')).toBeInTheDocument();
    expect(screen.getAllByText('Suspended').length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText('disabled')).not.toBeInTheDocument();

    // Click View to open User Profile modal
    fireEvent.click(screen.getByRole('button', { name: 'View' }));

    expect(await screen.findByText('User Profile')).toBeInTheDocument();
    expect(screen.getByText('102.89.34.1')).toBeInTheDocument();

    // Click Suspend user button
    fireEvent.click(screen.getByRole('button', { name: 'Suspend user' }));

    // Reusable StaffActionDialog opens with exact confirm copy
    expect(
      await screen.findByText("Suspend ezra@example.com? They're signed out everywhere immediately.")
    ).toBeInTheDocument();

    // Fill reason and TOTP
    fireEvent.change(screen.getByLabelText(/Reason/i), {
      target: { value: 'Suspicious credential breach reported.' },
    });
    fireEvent.change(screen.getByLabelText(/Authenticator code/i), {
      target: { value: '123456' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Suspend' }));

    await waitFor(() => {
      expect(adminApi.suspendUser).toHaveBeenCalledWith('usr-1', {
        reason: 'Suspicious credential breach reported.',
        totp_code: '123456',
      });
      expect(screen.getByText('ezra@example.com is suspended.')).toBeInTheDocument();
    });
  });

  it('mid-session revoke: redirects to /dashboard when an API call returns 404', async () => {
    vi.mocked(adminApi.getAdminMe).mockResolvedValue({
      user_id: 'sa-1',
      role: 'super_admin',
      scopes: [],
    });
    vi.mocked(adminApi.getAdminKpis).mockRejectedValue(
      new ApiError(404, 'Not Found', { detail: 'Not Found' })
    );

    render(<AdminPortalPage />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/dashboard');
    });
  });
});
