import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import React from 'react';
import SuperAdminPortal from './page';
import * as adminApi from '@/lib/api/admin';
import * as billingApi from '@/lib/api/billing';
import { ApiError } from '@/lib/api/client';

const mockPush = vi.fn();
const mockReplace = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
}));

vi.mock('@/components/brand/BrandLogo', () => ({
  default: () => <div data-testid="brand-logo">Cofoundaz</div>,
}));

describe('SuperAdminPortal (/super-admin)', { timeout: 25000 }, () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mocks to prevent hanging promises when Overview tab mounts by default
    vi.spyOn(billingApi, 'getPlans').mockResolvedValue({
      plans: [
        {
          key: 'growth',
          name: 'Growth',
          tagline: 'For growing teams',
          currency: 'NGN',
          price_monthly_minor: 5000000,
          price_annual_minor: 50000000,
          ai_credits: 500,
          seats: 5,
          storage_mb: 1000,
          features: [],
          modules: [],
        },
      ],
      addons: [],
    });
    vi.spyOn(adminApi, 'getAdminKpis').mockResolvedValue({
      total_workspaces: { value: 2847, new_in_window: 218 },
      activation_rate: { percent: 64, previous_percent: null },
      paid_conversion: { percent: 18.4, previous_percent: null },
      mrr: { minor: 18200000 },
      signups_series: [],
    });
    vi.spyOn(adminApi, 'getSuperAdminAuditRecent').mockResolvedValue([]);
    vi.spyOn(adminApi, 'getSuperAdminFlags').mockResolvedValue([]);
    vi.spyOn(adminApi, 'getSuperAdminStaff').mockResolvedValue([]);
    vi.spyOn(adminApi, 'getSuperAdminAudit').mockResolvedValue({ items: [], next_cursor: null });
  });

  describe('1. Access Control & Gating', () => {
    it('redirects an Admin to /dashboard silently with no refusal message', async () => {
      vi.spyOn(adminApi, 'getAdminMe').mockResolvedValue({
        user_id: 'usr-admin-1',
        email: 'admin@example.com',
        role: 'admin',
        scopes: ['support'],
      });

      await act(async () => {
        render(<SuperAdminPortal />);
      });

      await waitFor(
        () => {
          expect(mockReplace).toHaveBeenCalledWith('/dashboard');
        },
        { timeout: 8000 }
      );
      expect(screen.queryByText(/Access Denied/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Forbidden/i)).not.toBeInTheDocument();
    });

    it('redirects a non-staff user (404 on getAdminMe) to /dashboard silently', async () => {
      vi.spyOn(adminApi, 'getAdminMe').mockRejectedValue(
        new ApiError(404, 'Not Found', { detail: 'Not Found' })
      );

      await act(async () => {
        render(<SuperAdminPortal />);
      });

      await waitFor(
        () => {
          expect(mockReplace).toHaveBeenCalledWith('/dashboard');
        },
        { timeout: 8000 }
      );
      expect(screen.queryByText(/Access Denied/i)).not.toBeInTheDocument();
    });

    it('grants access to a Super Admin and renders persistent banner & navigation', async () => {
      vi.spyOn(adminApi, 'getAdminMe').mockResolvedValue({
        user_id: 'usr-super-1',
        email: 'super@example.com',
        full_name: 'Lead Super Admin',
        role: 'super_admin',
        scopes: [],
      });

      vi.spyOn(adminApi, 'getAdminKpis').mockResolvedValue({
        total_workspaces: { value: 2847, new_in_window: 218 },
        activation_rate: { percent: 64, previous_percent: null },
        paid_conversion: { percent: 18.4, previous_percent: null },
        mrr: { minor: 18200000 },
        signups_series: [],
      });

      vi.spyOn(adminApi, 'getSuperAdminAuditRecent').mockResolvedValue([
        {
          id: 'aud-1',
          action: 'staff.invite',
          actor_id: 'usr-super-1',
          actor_email: 'super@example.com',
          entity_type: 'staff',
          entity_id: 'st-2',
          reason: 'Added new support teammate',
          details: null,
          created_at: '2026-11-14T10:00:00Z',
        },
      ]);

      await act(async () => {
        render(<SuperAdminPortal />);
      });

      // Persistent banner
      expect(
        await screen.findByText(
          'All actions on this console are permanently logged.',
          {},
          { timeout: 8000 }
        )
      ).toBeInTheDocument();

      // Navigation tabs (no AI config, no Tenant ops, no Danger zone)
      expect(screen.getByRole('button', { name: /Overview/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Feature flags/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Billing overrides/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Staff access/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Audit log/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Security/i })).toBeInTheDocument();

      expect(screen.queryByText('AI configuration')).not.toBeInTheDocument();
      expect(screen.queryByText('Tenant operations')).not.toBeInTheDocument();
      expect(screen.queryByText('Danger zone')).not.toBeInTheDocument();
    });
  });

  describe('2. Overview Tab', () => {
    it('displays total workspaces KPI and recent privileged actions', async () => {
      vi.spyOn(adminApi, 'getAdminMe').mockResolvedValue({
        user_id: 'usr-super-1',
        email: 'super@example.com',
        role: 'super_admin',
        scopes: [],
      });

      vi.spyOn(adminApi, 'getAdminKpis').mockResolvedValue({
        total_workspaces: { value: 2847, new_in_window: 218 },
        activation_rate: { percent: 64, previous_percent: null },
        paid_conversion: { percent: 18.4, previous_percent: null },
        mrr: { minor: 18200000 },
        signups_series: [],
      });

      vi.spyOn(adminApi, 'getSuperAdminAuditRecent').mockResolvedValue([
        {
          id: 'aud-1',
          action: 'user.suspend',
          actor_id: 'usr-super-1',
          actor_email: 'super@example.com',
          entity_type: 'user',
          entity_id: 'usr-bad',
          reason: 'Terms of service violation',
          details: null,
          created_at: '2026-11-14T12:00:00Z',
        },
      ]);

      await act(async () => {
        render(<SuperAdminPortal />);
      });

      expect(
        await screen.findByText(/2[,.]?847/, {}, { timeout: 8000 })
      ).toBeInTheDocument();
      expect(
        await screen.findByText('+218 in 30 days', {}, { timeout: 8000 })
      ).toBeInTheDocument();
      expect(
        await screen.findByText('user.suspend', {}, { timeout: 8000 })
      ).toBeInTheDocument();
      expect(
        await screen.findByText('Terms of service violation', {}, { timeout: 8000 })
      ).toBeInTheDocument();
    });
  });

  describe('3. Feature Flags Tab', () => {
    it('renders flags and triggers impact check on kill-switch toggle', async () => {
      vi.spyOn(adminApi, 'getAdminMe').mockResolvedValue({
        user_id: 'usr-super-1',
        email: 'super@example.com',
        role: 'super_admin',
        scopes: [],
      });

      vi.spyOn(adminApi, 'getSuperAdminFlags').mockResolvedValue([
        {
          key: 'ai_voice_notes',
          name: 'AI Voice Notes',
          description: 'Dictate notes easily',
          stage: 'beta',
          enabled: true,
          rollout_pct: 25,
          affected_workspaces: 25,
          total_workspaces: 100,
        },
      ]);

      vi.spyOn(adminApi, 'getFlagImpact').mockResolvedValue({
        affected_now: 25,
        affected_after: 0,
      });

      await act(async () => {
        render(<SuperAdminPortal />);
      });

      // Switch to Feature flags tab
      const flagsTabBtn = await screen.findByRole('button', { name: /Feature flags/i }, { timeout: 8000 });
      await act(async () => {
        fireEvent.click(flagsTabBtn);
      });

      expect(await screen.findByText('AI Voice Notes', {}, { timeout: 8000 })).toBeInTheDocument();
      expect(
        screen.getByText((_, el) => el?.textContent?.trim() === 'Affects 25 of 100 workspaces')
      ).toBeInTheDocument();

      // Click Kill Switch toggle
      const switchBtn = screen.getByRole('switch');
      expect(switchBtn).toHaveAttribute('aria-checked', 'true');
      await act(async () => {
        fireEvent.click(switchBtn);
      });

      // Verify impact check dialog opened
      expect(adminApi.getFlagImpact).toHaveBeenCalledWith('ai_voice_notes', false, 25);
      expect(
        await screen.findByText(
          'This affects ~0 workspaces (now 25). Changes are live for real users at once.',
          {},
          { timeout: 8000 }
        )
      ).toBeInTheDocument();
    });
  });

  describe('4. Billing Overrides Tab', () => {
    it('searches workspace and renders subscription, invoices, and overrides', async () => {
      vi.spyOn(adminApi, 'getAdminMe').mockResolvedValue({
        user_id: 'usr-super-1',
        email: 'super@example.com',
        role: 'super_admin',
        scopes: [],
      });

      vi.spyOn(adminApi, 'getAdminWorkspaces').mockResolvedValue({
        workspaces: [
          {
            id: 'ws-test-1',
            name: 'Acme Corp',
            owner: { id: 'usr-1', name: 'John Doe', email: 'john@acme.com' },
            stage: 'growth',
            seats: 5,
            members: 5,
            plan: 'Growth',
            health_score: 85,
            country: 'NG',
            last_active_at: null,
            created_at: '2026-11-01',
          },
        ],
        next_cursor: null,
      });

      vi.spyOn(adminApi, 'getSuperAdminBilling').mockResolvedValue({
        workspace_id: 'ws-test-1',
        name: 'Acme Corp',
        subscription: {
          plan: { key: 'growth', name: 'Growth' },
          status: 'active',
          price_minor: 5000000,
          renews_at: '2026-12-01T00:00:00Z',
          ends_at: null,
          comped: true,
        },
        invoices: [
          {
            id: 'inv-1',
            number: 'INV-1001',
            description: 'Monthly Growth Plan',
            amount_minor: 5000000,
            paid_at: '2026-11-01T00:00:00Z',
            status: 'paid',
            refunded_minor: 0,
            refundable_minor: 5000000,
          },
        ],
        overrides: [
          {
            id: 'ovr-1',
            kind: 'credit',
            credits: 500,
            reason: 'Downtime compensation',
            actor_email: 'super@example.com',
            created_at: '2026-11-05T00:00:00Z',
          },
        ],
        credits_granted_total: 500,
      });

      await act(async () => {
        render(<SuperAdminPortal />);
      });

      const billingTabBtn = await screen.findByRole('button', { name: /Billing overrides/i }, { timeout: 8000 });
      await act(async () => {
        fireEvent.click(billingTabBtn);
      });

      const searchInput = await screen.findByPlaceholderText(/Search workspace by name/i, {}, { timeout: 8000 });
      await act(async () => {
        fireEvent.change(searchInput, { target: { value: 'Acme' } });
      });

      const selectBtn = await screen.findByRole('button', { name: /Select/i }, { timeout: 8000 });
      await act(async () => {
        fireEvent.click(selectBtn);
      });

      expect(await screen.findByText('Comped', {}, { timeout: 8000 })).toBeInTheDocument();
      expect(await screen.findByText('INV-1001', {}, { timeout: 8000 })).toBeInTheDocument();
      expect(
        screen.getByText((_, el) => el?.textContent?.trim() === 'Credits granted in total: 500')
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Refund' })).toBeInTheDocument();
    });
  });

  describe('5. Staff Access Tab', () => {
    it('hides edit and revoke on current user row', async () => {
      vi.spyOn(adminApi, 'getAdminMe').mockResolvedValue({
        user_id: 'usr-super-1',
        email: 'super@example.com',
        role: 'super_admin',
        scopes: [],
      });

      vi.spyOn(adminApi, 'getSuperAdminStaff').mockResolvedValue([
        {
          id: 'st-own',
          user_id: 'usr-super-1',
          email: 'super@example.com',
          full_name: 'Lead Super Admin',
          role: 'super_admin',
          scopes: [],
          last_login_at: '2026-11-14T10:00:00Z',
          invited_by_email: null,
          revoked_at: null,
        },
        {
          id: 'st-other',
          user_id: 'usr-other-2',
          email: 'other@example.com',
          full_name: 'Support Agent',
          role: 'admin',
          scopes: ['support'],
          last_login_at: null,
          invited_by_email: 'super@example.com',
          revoked_at: null,
        },
      ]);

      await act(async () => {
        render(<SuperAdminPortal />);
      });

      const staffTabBtn = await screen.findByRole('button', { name: /Staff access/i }, { timeout: 8000 });
      await act(async () => {
        fireEvent.click(staffTabBtn);
      });

      expect(await screen.findByText('Support Agent', {}, { timeout: 8000 })).toBeInTheDocument();
      expect(screen.getByText('Lead Super Admin')).toBeInTheDocument();

      // Only one Edit and one Revoke button should exist (on the other user's row)
      const editButtons = screen.getAllByRole('button', { name: 'Edit' });
      const revokeButtons = screen.getAllByRole('button', { name: 'Revoke' });
      expect(editButtons).toHaveLength(1);
      expect(revokeButtons).toHaveLength(1);
    });
  });

  describe('6. Security Tab', () => {
    it('displays read-only facts without any toggles', async () => {
      vi.spyOn(adminApi, 'getAdminMe').mockResolvedValue({
        user_id: 'usr-super-1',
        email: 'super@example.com',
        role: 'super_admin',
        scopes: [],
      });

      await act(async () => {
        render(<SuperAdminPortal />);
      });

      const securityTabBtn = await screen.findByRole('button', { name: /Security/i }, { timeout: 8000 });
      await act(async () => {
        fireEvent.click(securityTabBtn);
      });

      expect(
        await screen.findByText('Authenticator app required for all staff.', {}, { timeout: 8000 })
      ).toBeInTheDocument();
      expect(
        screen.getByText('A fresh code is required for every staff action.')
      ).toBeInTheDocument();

      // Ensure no toggles or switches exist on this tab
      expect(screen.queryByRole('switch')).not.toBeInTheDocument();
    });
  });
});
