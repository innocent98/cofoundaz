import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  getSuperAdminAuditRecent,
  getSuperAdminAudit,
  exportSuperAdminAuditCsv,
  getSuperAdminStaff,
  addSuperAdminStaff,
  editSuperAdminStaff,
  revokeSuperAdminStaff,
  getSuperAdminFlags,
  getFlagImpact,
  createSuperAdminFlag,
  updateSuperAdminFlag,
  getSuperAdminBilling,
  overrideRefund,
  overrideCompleteRefund,
  overrideCredit,
  overrideExtendTrial,
  overrideComp,
} from './admin-super';
import { apiClient, ApiError } from './client';
import * as session from '@/lib/auth/session';

vi.mock('./client', async () => {
  const actual = await vi.importActual('./client');
  return {
    ...actual,
    apiClient: vi.fn(),
  };
});

describe('admin-super API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Audit Log & Overview', () => {
    it('fetches recent audit items with limit 5 for overview', async () => {
      vi.mocked(apiClient).mockResolvedValueOnce({
        items: [
          {
            id: 'aud-1',
            action: 'staff.invite',
            actor_id: 'usr-1',
            actor_email: 'lead@example.com',
            entity_type: 'staff',
            entity_id: 'st-1',
            reason: 'Added new support lead',
            details: null,
            created_at: '2026-11-14T10:00:00Z',
          },
        ],
        next_cursor: null,
      });

      const items = await getSuperAdminAuditRecent();
      expect(apiClient).toHaveBeenCalledWith('/super-admin/audit?limit=5');
      expect(items).toHaveLength(1);
      expect(items[0].action).toBe('staff.invite');
    });

    it('fetches audit items with filters', async () => {
      vi.mocked(apiClient).mockResolvedValueOnce({
        data: {
          items: [],
          next_cursor: 'cursor-123',
        },
      });

      const res = await getSuperAdminAudit({
        actor: 'test@example.com',
        action: 'user.suspend',
        workspace_id: 'ws-1',
        start_date: '2026-11-01',
        end_date: '2026-11-14',
        limit: 20,
      });

      expect(apiClient).toHaveBeenCalledWith(
        expect.stringContaining('/super-admin/audit?')
      );
      expect(apiClient).toHaveBeenCalledWith(
        expect.stringContaining('actor=test%40example.com')
      );
      expect(apiClient).toHaveBeenCalledWith(
        expect.stringContaining('action=user.suspend')
      );
      expect(apiClient).toHaveBeenCalledWith(
        expect.stringContaining('workspace_id=ws-1')
      );
      expect(apiClient).toHaveBeenCalledWith(
        expect.stringContaining('start_date=2026-11-01')
      );
      expect(apiClient).toHaveBeenCalledWith(
        expect.stringContaining('end_date=2026-11-14')
      );
      expect(apiClient).toHaveBeenCalledWith(
        expect.stringContaining('limit=20')
      );
      expect(res.next_cursor).toBe('cursor-123');
    });

    it('refetches from start when cursor returns 422', async () => {
      // First call with bad cursor returns 422
      vi.mocked(apiClient)
        .mockRejectedValueOnce(new ApiError(422, 'Unprocessable Entity', { message: 'Bad cursor' }))
        // Retry call without cursor succeeds
        .mockResolvedValueOnce({
          items: [{ id: 'aud-fresh', action: 'flag.update' }],
          next_cursor: null,
        });

      const res = await getSuperAdminAudit({ cursor: 'corrupt-cursor' });
      expect(apiClient).toHaveBeenCalledTimes(2);
      expect(apiClient).toHaveBeenNthCalledWith(1, '/super-admin/audit?cursor=corrupt-cursor');
      expect(apiClient).toHaveBeenNthCalledWith(2, '/super-admin/audit');
      expect(res.items).toHaveLength(1);
    });

    it('exports audit log as CSV blob', async () => {
      vi.spyOn(session, 'ensureSession').mockResolvedValue(undefined as never);
      vi.spyOn(session, 'getAccessToken').mockReturnValue('mock-jwt-token');

      const mockBlob = new Blob(['col1,col2\nval1,val2'], { type: 'text/csv' });
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        blob: vi.fn().mockResolvedValue(mockBlob),
      });
      global.fetch = mockFetch;

      const res = await exportSuperAdminAuditCsv({
        reason: 'Monthly compliance audit verification',
        action: 'staff.revoke',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/super-admin/audit/export?reason=Monthly+compliance+audit+verification&action=staff.revoke'),
        expect.objectContaining({
          headers: expect.any(Headers),
        })
      );
      expect(res.filename).toBe('audit-log.csv');
      expect(res.blob).toBe(mockBlob);
    });
  });

  describe('Staff Access', () => {
    it('fetches staff members', async () => {
      vi.mocked(apiClient).mockResolvedValueOnce({
        data: {
          staff: [
            {
              id: 'staff-1',
              user_id: 'usr-1',
              email: 'super@example.com',
              full_name: 'Lead Admin',
              role: 'super_admin',
              scopes: [],
              last_login_at: '2026-11-14T12:00:00Z',
              invited_by_email: null,
              revoked_at: null,
            },
          ],
        },
      });

      const staff = await getSuperAdminStaff();
      expect(apiClient).toHaveBeenCalledWith('/super-admin/staff');
      expect(staff).toHaveLength(1);
      expect(staff[0].email).toBe('super@example.com');
    });

    it('adds a staff member', async () => {
      vi.mocked(apiClient).mockResolvedValueOnce({});

      await addSuperAdminStaff({
        email: 'newadmin@example.com',
        role: 'admin',
        scopes: ['support', 'content'],
        reason: 'Hiring new support specialist',
        totp_code: '123456',
      });

      expect(apiClient).toHaveBeenCalledWith('/super-admin/staff', {
        method: 'POST',
        body: JSON.stringify({
          email: 'newadmin@example.com',
          role: 'admin',
          scopes: ['support', 'content'],
          reason: 'Hiring new support specialist',
          totp_code: '123456',
        }),
      });
    });

    it('edits a staff member', async () => {
      vi.mocked(apiClient).mockResolvedValueOnce({});

      await editSuperAdminStaff('staff-123', {
        role: 'admin',
        scopes: ['moderation'],
        reason: 'Updated scopes per quarterly review',
        totp_code: '654321',
      });

      expect(apiClient).toHaveBeenCalledWith('/super-admin/staff/staff-123', {
        method: 'PATCH',
        body: JSON.stringify({
          role: 'admin',
          scopes: ['moderation'],
          reason: 'Updated scopes per quarterly review',
          totp_code: '654321',
        }),
      });
    });

    it('revokes a staff member', async () => {
      vi.mocked(apiClient).mockResolvedValueOnce({});

      await revokeSuperAdminStaff('staff-123', {
        reason: 'Contract concluded with contractor',
        totp_code: '112233',
      });

      expect(apiClient).toHaveBeenCalledWith('/super-admin/staff/staff-123/revoke', {
        method: 'POST',
        body: JSON.stringify({
          reason: 'Contract concluded with contractor',
          totp_code: '112233',
        }),
      });
    });
  });

  describe('Feature Flags', () => {
    it('fetches feature flags', async () => {
      vi.mocked(apiClient).mockResolvedValueOnce({
        flags: [
          {
            key: 'ai_voice_notes',
            name: 'AI voice notes',
            description: 'Dictate notes',
            stage: 'beta',
            enabled: true,
            rollout_pct: 25,
            affected_workspaces: 12,
            total_workspaces: 100,
          },
        ],
      });

      const flags = await getSuperAdminFlags();
      expect(apiClient).toHaveBeenCalledWith('/super-admin/flags');
      expect(flags).toHaveLength(1);
      expect(flags[0].key).toBe('ai_voice_notes');
    });

    it('fetches impact before updating flag rollout', async () => {
      vi.mocked(apiClient).mockResolvedValueOnce({
        data: {
          affected_now: 25,
          affected_after: 50,
        },
      });

      const impact = await getFlagImpact('ai_voice_notes', true, 50);
      expect(apiClient).toHaveBeenCalledWith('/super-admin/flags/ai_voice_notes/impact?enabled=true&rollout_pct=50');
      expect(impact.affected_after).toBe(50);
    });

    it('creates a new feature flag', async () => {
      vi.mocked(apiClient).mockResolvedValueOnce({});

      await createSuperAdminFlag({
        key: 'dark_mode',
        name: 'Dark Mode',
        description: 'Dark theme toggle',
        stage: 'internal',
        reason: 'Internal testing of dark theme',
        totp_code: '445566',
      });

      expect(apiClient).toHaveBeenCalledWith('/super-admin/flags', {
        method: 'POST',
        body: JSON.stringify({
          key: 'dark_mode',
          name: 'Dark Mode',
          description: 'Dark theme toggle',
          stage: 'internal',
          reason: 'Internal testing of dark theme',
          totp_code: '445566',
        }),
      });
    });

    it('updates a feature flag with only changed fields', async () => {
      vi.mocked(apiClient).mockResolvedValueOnce({});

      await updateSuperAdminFlag('dark_mode', {
        rollout_pct: 50,
        reason: 'Expanded internal rollout to 50%',
        totp_code: '778899',
      });

      expect(apiClient).toHaveBeenCalledWith('/super-admin/flags/dark_mode', {
        method: 'PATCH',
        body: JSON.stringify({
          rollout_pct: 50,
          reason: 'Expanded internal rollout to 50%',
          totp_code: '778899',
        }),
      });
    });
  });

  describe('Billing Overrides', () => {
    it('fetches workspace billing details', async () => {
      vi.mocked(apiClient).mockResolvedValueOnce({
        data: {
          workspace_id: 'ws-abc',
          subscription: {
            plan: 'Growth',
            status: 'active',
            price_minor: 5000000,
            renews_at: '2026-12-01T00:00:00Z',
            ends_at: null,
            comped: false,
          },
          invoices: [
            {
              id: 'inv-1',
              number: 'INV-001',
              description: 'Growth monthly',
              amount_minor: 5000000,
              paid_at: '2026-11-01T00:00:00Z',
              status: 'paid',
              refunded_minor: 0,
              refundable_minor: 5000000,
            },
          ],
          overrides: [],
          credits_granted_total: 1000,
        },
      });

      const billing = await getSuperAdminBilling('ws-abc');
      expect(apiClient).toHaveBeenCalledWith('/super-admin/billing/ws-abc');
      expect(billing.subscription?.plan).toBe('Growth');
      expect(billing.invoices).toHaveLength(1);
    });

    it('submits a refund override', async () => {
      vi.mocked(apiClient).mockResolvedValueOnce({});

      await overrideRefund('ws-abc', {
        invoice_id: 'inv-1',
        amount_minor: 2500000,
        request_id: 'req-uuid-1',
        reason: 'Customer billing dispute resolution',
        totp_code: '123123',
      });

      expect(apiClient).toHaveBeenCalledWith('/super-admin/billing/ws-abc/refund', {
        method: 'POST',
        body: JSON.stringify({
          invoice_id: 'inv-1',
          amount_minor: 2500000,
          request_id: 'req-uuid-1',
          reason: 'Customer billing dispute resolution',
          totp_code: '123123',
        }),
      });
    });

    it('completes a refund override', async () => {
      vi.mocked(apiClient).mockResolvedValueOnce({});

      await overrideCompleteRefund('ws-abc', 'ovr-1', {
        reason: 'Confirmed refund disbursed via Paystack dashboard',
        totp_code: '456456',
      });

      expect(apiClient).toHaveBeenCalledWith(
        '/super-admin/billing/ws-abc/refunds/ovr-1/complete',
        {
          method: 'POST',
          body: JSON.stringify({
            reason: 'Confirmed refund disbursed via Paystack dashboard',
            totp_code: '456456',
          }),
        }
      );
    });

    it('submits an AI credit override', async () => {
      vi.mocked(apiClient).mockResolvedValueOnce({});

      await overrideCredit('ws-abc', {
        credits: 500,
        request_id: 'req-uuid-2',
        reason: 'Service downtime compensation credit',
        totp_code: '789789',
      });

      expect(apiClient).toHaveBeenCalledWith('/super-admin/billing/ws-abc/credit', {
        method: 'POST',
        body: JSON.stringify({
          credits: 500,
          request_id: 'req-uuid-2',
          reason: 'Service downtime compensation credit',
          totp_code: '789789',
        }),
      });
    });

    it('submits an extend trial override', async () => {
      vi.mocked(apiClient).mockResolvedValueOnce({});

      await overrideExtendTrial('ws-abc', {
        days: 14,
        request_id: 'req-uuid-3',
        reason: 'Extended trial for partnership onboarding',
        totp_code: '321321',
      });

      expect(apiClient).toHaveBeenCalledWith('/super-admin/billing/ws-abc/extend-trial', {
        method: 'POST',
        body: JSON.stringify({
          days: 14,
          request_id: 'req-uuid-3',
          reason: 'Extended trial for partnership onboarding',
          totp_code: '321321',
        }),
      });
    });

    it('submits a comp override', async () => {
      vi.mocked(apiClient).mockResolvedValueOnce({});

      await overrideComp('ws-abc', {
        plan_key: 'Growth',
        days: 30,
        request_id: 'req-uuid-4',
        reason: 'Non-profit accelerator comped sponsorship',
        totp_code: '654654',
      });

      expect(apiClient).toHaveBeenCalledWith('/super-admin/billing/ws-abc/comp', {
        method: 'POST',
        body: JSON.stringify({
          plan_key: 'Growth',
          days: 30,
          request_id: 'req-uuid-4',
          reason: 'Non-profit accelerator comped sponsorship',
          totp_code: '654654',
        }),
      });
    });
  });
});
