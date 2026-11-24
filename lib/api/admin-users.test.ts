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
  updateUserRole,
  revokeUser,
  sendUserPasswordReset,
  resendUserVerification,
  hasAdminScope,
  type AdminMeResponse,
} from './admin-users';

vi.mock('./client', async (orig) => ({
  ...(await orig<typeof import('./client')>()),
  apiClient: vi.fn(),
}));

describe('Admin Users API (lib/api/admin-users.ts)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('hasAdminScope', () => {
    it('returns true for Super Admin regardless of scopes array', () => {
      const superAdmin: AdminMeResponse = {
        user_id: 'usr_sa_01',
        role: 'super_admin',
        scopes: [],
        email: 'sa@cofoundaz.com',
      };
      expect(hasAdminScope(superAdmin, 'support')).toBe(true);
      expect(hasAdminScope(superAdmin, 'content')).toBe(true);
      expect(hasAdminScope(superAdmin, 'moderation')).toBe(true);
      expect(hasAdminScope(superAdmin, 'anything')).toBe(true);
    });

    it('returns true only if required scope is present for regular admin', () => {
      const supportAdmin: AdminMeResponse = {
        user_id: 'usr_adm_01',
        role: 'admin',
        scopes: ['support', 'moderation'],
        email: 'staff@cofoundaz.com',
      };
      expect(hasAdminScope(supportAdmin, 'support')).toBe(true);
      expect(hasAdminScope(supportAdmin, 'moderation')).toBe(true);
      expect(hasAdminScope(supportAdmin, 'content')).toBe(false);
    });

    it('returns false for null me object', () => {
      expect(hasAdminScope(null, 'support')).toBe(false);
    });
  });

  describe('real API contract calls', () => {
    it('getAdminMe calls /admin/me and unwraps real envelope', async () => {
      const rawApiResponseBody = {
        data: {
          user_id: 'usr_sa_01',
          role: 'super_admin',
          scopes: [],
          email: 'admin@cofoundaz.com',
          full_name: 'Victor Super Admin',
        },
      };
      vi.mocked(client.apiClient).mockResolvedValueOnce(rawApiResponseBody);

      const res = await getAdminMe();
      expect(client.apiClient).toHaveBeenCalledWith('/admin/me');
      expect(res).toEqual(rawApiResponseBody.data);
    });

    it('getAdminKpis calls /admin/dashboard/kpis and returns KPI metrics', async () => {
      const rawApiResponseBody = {
        data: {
          total_workspaces: { value: 1420, new_in_window: 85 },
          activation_rate: { percent: 64.0, previous_percent: 61.0 },
          paid_conversion: { percent: 18.0, previous_percent: null },
          mrr: { minor: 18200000, currency: 'NGN' },
          signups_series: [
            { date: '2026-10-15', signups: 12, activations: 8 },
            { date: '2026-10-16', signups: 15, activations: 10 },
          ],
        },
      };
      vi.mocked(client.apiClient).mockResolvedValueOnce(rawApiResponseBody);

      const res = await getAdminKpis();
      expect(client.apiClient).toHaveBeenCalledWith('/admin/dashboard/kpis');
      expect(res).toEqual(rawApiResponseBody.data);
    });

    it('getAdminWorkspaces parses exact API contract fields (owner_name, owner_email, plan_key, workspace_name)', async () => {
      const rawApiResponseBody = {
        data: {
          workspaces: [
            {
              id: 'ws_test_01',
              workspace_id: 'ws_test_01',
              name: 'Paystack Clone',
              workspace_name: 'Paystack Clone',
              owner_name: 'Shola Akinlade',
              owner_email: 'shola@example.com',
              stage: 'growth',
              seats: 12,
              members: 20,
              plan_key: 'scale',
              plan: 'scale',
              health_score: 95,
              country: 'NG',
              last_active_at: '2026-11-18T10:00:00Z',
              created_at: '2026-01-01T00:00:00Z',
            },
          ],
        },
        meta: {
          next_cursor: 'cur_next_100',
        },
      };
      vi.mocked(client.apiClient).mockResolvedValueOnce(rawApiResponseBody);

      const res = await getAdminWorkspaces({
        query: 'Paystack',
        stage: 'growth',
        billing_status: 'active',
        cursor: 'cur_prev_99',
        limit: 20,
      });

      expect(client.apiClient).toHaveBeenCalledWith(
        '/admin/workspaces?query=Paystack&stage=growth&billing_status=active&cursor=cur_prev_99&limit=20'
      );
      expect(res.workspaces).toHaveLength(1);
      expect(res.workspaces[0].owner_name).toBe('Shola Akinlade');
      expect(res.workspaces[0].owner_email).toBe('shola@example.com');
      expect(res.workspaces[0].plan_key).toBe('scale');
      expect(res.workspaces[0].workspace_name).toBe('Paystack Clone');
      expect(res.next_cursor).toBe('cur_next_100');
    });

    it('getAdminWorkspace returns exact contract fields (usage.*, subscription.plan_key, subscription.status, full_name)', async () => {
      const rawApiResponseBody = {
        data: {
          id: 'ws_test_01',
          workspace_id: 'ws_test_01',
          name: 'Paystack Clone',
          workspace_name: 'Paystack Clone',
          owner_name: 'Shola Akinlade',
          owner_email: 'shola@example.com',
          stage: 'growth',
          seats: 12,
          seats_limit: 15,
          members_count: 2,
          members: [
            {
              id: 'm_1',
              user_id: 'usr_founder_01',
              full_name: 'Shola Akinlade',
              email: 'shola@example.com',
              role: 'founder',
              joined_at: '2026-01-01T00:00:00Z',
            },
            {
              id: 'm_2',
              user_id: 'usr_tm_02',
              full_name: 'Ezra Olubi',
              email: 'ezra@example.com',
              role: 'team_member',
              joined_at: '2026-02-01T00:00:00Z',
            },
          ],
          usage: {
            seats_used: 12,
            seats_limit: 15,
            storage_bytes_used: 524288000,
            storage_bytes_limit: 10737418240,
          },
          subscription: {
            plan_key: 'scale',
            plan_name: 'Scale',
            status: 'active',
            billing_status: 'active',
            billing_interval: 'annual',
            renews_at: '2026-12-01T00:00:00Z',
          },
          usage_meters: {
            api_calls: { used: 4500, limit: 10000 },
          },
          integrations: [
            { id: 'int_1', provider: 'slack', status: 'connected', connected_at: '2026-03-01T00:00:00Z' },
          ],
          health_score: 95,
          created_at: '2026-01-01T00:00:00Z',
          last_active_at: '2026-11-18T10:00:00Z',
        },
      };
      vi.mocked(client.apiClient).mockResolvedValueOnce(rawApiResponseBody);

      const res = await getAdminWorkspace('ws_test_01');
      expect(client.apiClient).toHaveBeenCalledWith('/admin/workspaces/ws_test_01');
      expect(res.owner_name).toBe('Shola Akinlade');
      expect(res.usage?.seats_used).toBe(12);
      expect(res.usage?.seats_limit).toBe(15);
      expect(res.subscription?.plan_key).toBe('scale');
      expect(res.subscription?.status).toBe('active');
      expect(res.members[0].full_name).toBe('Shola Akinlade');
    });

    it('getAdminUsers parses exact contract fields (primary_workspace.workspace_name, plan_key, last_login_at)', async () => {
      const rawApiResponseBody = {
        data: {
          users: [
            {
              id: 'usr_founder_01',
              full_name: 'Ezra Olubi',
              email: 'ezra@example.com',
              status: 'active',
              activity: 'active',
              workspace_count: 2,
              plan_key: 'pro',
              primary_workspace: {
                id: 'ws_1',
                workspace_id: 'ws_1',
                workspace_name: 'Paystack',
                billing_status: 'active',
                plan_key: 'pro',
              },
              created_at: '2026-01-01T00:00:00Z',
              last_login_at: '2026-11-18T09:30:00Z',
            },
          ],
        },
        meta: {
          next_cursor: 'cur_usr_50',
        },
      };
      vi.mocked(client.apiClient).mockResolvedValueOnce(rawApiResponseBody);

      const res = await getAdminUsers({
        query: 'Ezra',
        billing_status: 'active',
        activity: 'active',
        cursor: 'cur_usr_0',
        limit: 20,
      });

      expect(client.apiClient).toHaveBeenCalledWith(
        '/admin/users?query=Ezra&billing_status=active&activity=active&cursor=cur_usr_0&limit=20'
      );
      expect(res.users[0].primary_workspace?.workspace_name).toBe('Paystack');
      expect(res.users[0].primary_workspace?.plan_key).toBe('pro');
      expect(res.users[0].last_login_at).toBe('2026-11-18T09:30:00Z');
      expect(res.next_cursor).toBe('cur_usr_50');
    });

    it('getAdminUser parses exact contract fields (ip, last_login_at, revoked_at, workspace_id)', async () => {
      const rawApiResponseBody = {
        data: {
          id: 'usr_founder_01',
          full_name: 'Ezra Olubi',
          email: 'ezra@example.com',
          phone: '+2348099887766',
          status: 'disabled',
          activity: 'active',
          is_staff: false,
          workspaces: [
            {
              id: 'ws_1',
              workspace_id: 'ws_1',
              workspace_name: 'Paystack',
              role: 'founder',
              plan_key: 'pro',
              billing_status: 'active',
            },
          ],
          sessions: [
            {
              id: 'sess_1',
              ip: '102.89.34.1',
              user_agent: 'Chrome/120',
              last_login_at: '2026-11-18T09:30:00Z',
              revoked_at: '2026-11-18T10:00:00Z',
            },
          ],
          can: {
            suspend: false,
            unsuspend: true,
            reset_password: true,
            resend_verification: false,
          },
          created_at: '2026-01-01T00:00:00Z',
          last_login_at: '2026-11-18T09:30:00Z',
        },
      };
      vi.mocked(client.apiClient).mockResolvedValueOnce(rawApiResponseBody);

      const res = await getAdminUser('usr_founder_01');
      expect(client.apiClient).toHaveBeenCalledWith('/admin/users/usr_founder_01');
      expect(res.sessions[0].ip).toBe('102.89.34.1');
      expect(res.sessions[0].last_login_at).toBe('2026-11-18T09:30:00Z');
      expect(res.sessions[0].revoked_at).toBe('2026-11-18T10:00:00Z');
      expect(res.workspaces[0].workspace_id).toBe('ws_1');
      expect(res.workspaces[0].workspace_name).toBe('Paystack');
      expect(res.can.unsuspend).toBe(true);
    });

    it('suspendUser POSTs valid step-up payload with reason and totp_code', async () => {
      vi.mocked(client.apiClient).mockResolvedValueOnce({});
      const payload = { reason: 'Violation of acceptable use policy', totp_code: '456789' };

      await suspendUser('usr_1', payload);
      expect(client.apiClient).toHaveBeenCalledWith('/admin/users/usr_1/suspend', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    });

    it('unsuspendUser POSTs valid step-up payload with reason and totp_code', async () => {
      vi.mocked(client.apiClient).mockResolvedValueOnce({});
      const payload = { reason: 'Account appeal approved by staff', totp_code: '123456' };

      await unsuspendUser('usr_1', payload);
      expect(client.apiClient).toHaveBeenCalledWith('/admin/users/usr_1/unsuspend', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    });

    it('updateUserRole PATCHes valid payload with role, reason, and totp_code', async () => {
      vi.mocked(client.apiClient).mockResolvedValueOnce({});
      const payload = { reason: 'Promotion to workspace admin', totp_code: '654321' };

      await updateUserRole('usr_1', 'admin', payload);
      expect(client.apiClient).toHaveBeenCalledWith('/admin/users/usr_1/role', {
        method: 'PATCH',
        body: JSON.stringify({ role: 'admin', ...payload }),
      });
    });

    it('revokeUser POSTs valid payload with reason and totp_code', async () => {
      vi.mocked(client.apiClient).mockResolvedValueOnce({});
      const payload = { reason: 'Access revocation requested', totp_code: '789123' };

      await revokeUser('usr_1', payload);
      expect(client.apiClient).toHaveBeenCalledWith('/admin/users/usr_1/revoke', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    });

    it('sendUserPasswordReset POSTs valid payload with reason and totp_code', async () => {
      vi.mocked(client.apiClient).mockResolvedValueOnce({});
      const payload = { reason: 'Staff triggered recovery', totp_code: '112233' };

      await sendUserPasswordReset('usr_1', payload);
      expect(client.apiClient).toHaveBeenCalledWith('/admin/users/usr_1/reset-password', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    });

    it('resendUserVerification POSTs valid payload with reason and totp_code', async () => {
      vi.mocked(client.apiClient).mockResolvedValueOnce({});
      const payload = { reason: 'User verification resend requested', totp_code: '998877' };

      await resendUserVerification('usr_1', payload);
      expect(client.apiClient).toHaveBeenCalledWith('/admin/users/usr_1/resend-verification', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    });
  });
});
