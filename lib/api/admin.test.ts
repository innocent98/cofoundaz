import { describe, expect, it, vi, beforeEach } from 'vitest';
import * as client from './client';
import {
  getAdminMe,
  getAdminKpis,
  getAdminWorkspaces,
  getAdminWorkspace,
  getAdminUsers,
  getAdminUser,
  suspendUser,
  unsuspendUser,
  sendUserPasswordReset,
  resendUserVerification,
  hasAdminScope,
  type AdminMeResponse,
} from './admin';

vi.mock('./client', async (orig) => ({
  ...(await orig<typeof import('./client')>()),
  apiClient: vi.fn(),
}));

describe('admin api', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('hasAdminScope', () => {
    it('returns true for Super Admin regardless of scopes array', () => {
      const superAdmin: AdminMeResponse = {
        user_id: 'sa-1',
        role: 'super_admin',
        scopes: [],
      };
      expect(hasAdminScope(superAdmin, 'support')).toBe(true);
      expect(hasAdminScope(superAdmin, 'content')).toBe(true);
      expect(hasAdminScope(superAdmin, 'anything')).toBe(true);
    });

    it('returns true only if required scope is present for regular admin', () => {
      const supportAdmin: AdminMeResponse = {
        user_id: 'adm-1',
        role: 'admin',
        scopes: ['support', 'moderation'],
      };
      expect(hasAdminScope(supportAdmin, 'support')).toBe(true);
      expect(hasAdminScope(supportAdmin, 'moderation')).toBe(true);
      expect(hasAdminScope(supportAdmin, 'content')).toBe(false);
    });

    it('returns false for null me object', () => {
      expect(hasAdminScope(null, 'support')).toBe(false);
    });
  });

  describe('api calls', () => {
    it('getAdminMe calls /admin/me', async () => {
      const mockMe = { user_id: 'u-1', role: 'admin', scopes: ['support'] };
      vi.mocked(client.apiClient).mockResolvedValueOnce({ data: mockMe });

      const res = await getAdminMe();
      expect(client.apiClient).toHaveBeenCalledWith('/admin/me');
      expect(res).toEqual(mockMe);
    });

    it('getAdminKpis calls /admin/dashboard/kpis', async () => {
      const mockKpis = {
        total_workspaces: { value: 120, new_in_window: 15 },
        activation_rate: { percent: 75, previous_percent: 70 },
        paid_conversion: { percent: 12, previous_percent: null },
        mrr: { minor: 5000000, currency: 'NGN' },
        signups_series: [{ date: '2026-10-01', signups: 10, activations: 8 }],
      };
      vi.mocked(client.apiClient).mockResolvedValueOnce({ data: mockKpis });

      const res = await getAdminKpis();
      expect(client.apiClient).toHaveBeenCalledWith('/admin/dashboard/kpis');
      expect(res).toEqual(mockKpis);
    });

    it('getAdminWorkspaces handles query parameters and cursor pagination', async () => {
      const mockWorkspaces = [
        {
          id: 'ws-1',
          name: 'Acme',
          owner: { id: 'u-1', name: 'John', email: 'john@example.com' },
          stage: 'mvp',
          seats: 5,
          members: 8,
          plan: 'pro',
          health_score: 92,
          country: 'NG',
          last_active_at: new Date().toISOString(),
        },
      ];
      vi.mocked(client.apiClient).mockResolvedValueOnce({
        data: { workspaces: mockWorkspaces },
        meta: { next_cursor: 'cursor-123' },
      });

      const res = await getAdminWorkspaces({
        query: 'Acme',
        stage: 'mvp',
        billing_status: 'active',
        cursor: 'prev-cursor',
        limit: 10,
      });

      expect(client.apiClient).toHaveBeenCalledWith(
        '/admin/workspaces?query=Acme&stage=mvp&billing_status=active&cursor=prev-cursor&limit=10'
      );
      expect(res).toEqual({
        workspaces: mockWorkspaces,
        next_cursor: 'cursor-123',
      });
    });

    it('getAdminWorkspace calls /admin/workspaces/{id}', async () => {
      const mockDetail = {
        id: 'ws-1',
        name: 'Acme',
        owner: { id: 'u-1', name: 'John', email: 'john@example.com' },
        stage: 'growth',
        seats: 10,
        seats_limit: null,
        members_count: 5,
        members: [],
        subscription: { plan: 'growth', billing_status: 'active' },
        usage_meters: null,
        integrations: [],
        health_score: 85,
        created_at: new Date().toISOString(),
        last_active_at: new Date().toISOString(),
      };
      vi.mocked(client.apiClient).mockResolvedValueOnce({ data: mockDetail });

      const res = await getAdminWorkspace('ws-1');
      expect(client.apiClient).toHaveBeenCalledWith('/admin/workspaces/ws-1');
      expect(res).toEqual(mockDetail);
    });

    it('getAdminUsers handles query parameters and cursor pagination', async () => {
      const mockUsers = [
        {
          id: 'u-1',
          full_name: 'Alice',
          email: 'alice@example.com',
          status: 'active',
          activity: 'active',
          workspace_count: 2,
          primary_workspace: { id: 'ws-1', name: 'Alpha', billing_status: 'active' },
          created_at: new Date().toISOString(),
        },
      ];
      vi.mocked(client.apiClient).mockResolvedValueOnce({
        data: { users: mockUsers },
        meta: { next_cursor: 'user-cursor-99' },
      });

      const res = await getAdminUsers({
        query: 'Alice',
        billing_status: 'active',
        activity: 'active',
        cursor: 'cur-1',
        limit: 20,
      });

      expect(client.apiClient).toHaveBeenCalledWith(
        '/admin/users?query=Alice&billing_status=active&activity=active&cursor=cur-1&limit=20'
      );
      expect(res).toEqual({
        users: mockUsers,
        next_cursor: 'user-cursor-99',
      });
    });

    it('getAdminUser calls /admin/users/{id}', async () => {
      const mockDetail = {
        id: 'u-1',
        full_name: 'Bob',
        email: 'bob@example.com',
        phone: '+2348012345678',
        status: 'active',
        activity: 'active',
        workspaces: [],
        sessions: [],
        can: { suspend: true, unsuspend: false, reset_password: true, resend_verification: true },
        created_at: new Date().toISOString(),
      };
      vi.mocked(client.apiClient).mockResolvedValueOnce({ data: mockDetail });

      const res = await getAdminUser('u-1');
      expect(client.apiClient).toHaveBeenCalledWith('/admin/users/u-1');
      expect(res).toEqual(mockDetail);
    });

    it('suspendUser POSTs to /admin/users/{id}/suspend with reason and totp_code', async () => {
      vi.mocked(client.apiClient).mockResolvedValueOnce({});
      const payload = { reason: 'Fraud activity confirmed', totp_code: '123456' };

      await suspendUser('u-1', payload);
      expect(client.apiClient).toHaveBeenCalledWith('/admin/users/u-1/suspend', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    });

    it('unsuspendUser POSTs to /admin/users/{id}/unsuspend with reason and totp_code', async () => {
      vi.mocked(client.apiClient).mockResolvedValueOnce({});
      const payload = { reason: 'Identity verified', totp_code: '654321' };

      await unsuspendUser('u-1', payload);
      expect(client.apiClient).toHaveBeenCalledWith('/admin/users/u-1/unsuspend', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    });

    it('sendUserPasswordReset POSTs to /admin/users/{id}/reset-password', async () => {
      vi.mocked(client.apiClient).mockResolvedValueOnce({});
      const payload = { reason: 'User requested reset', totp_code: '112233' };

      await sendUserPasswordReset('u-1', payload);
      expect(client.apiClient).toHaveBeenCalledWith('/admin/users/u-1/reset-password', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    });

    it('resendUserVerification POSTs to /admin/users/{id}/resend-verification', async () => {
      vi.mocked(client.apiClient).mockResolvedValueOnce({});
      const payload = { reason: 'Email not delivered previously', totp_code: '998877' };

      await resendUserVerification('u-1', payload);
      expect(client.apiClient).toHaveBeenCalledWith('/admin/users/u-1/resend-verification', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    });
  });
});

