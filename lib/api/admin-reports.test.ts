import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  getAdminReportsCounts,
  getAdminReports,
  getAdminReport,
  dismissAdminReport,
  escalateAdminReport,
  removeAdminReportContent,
  restoreAdminReportContent,
} from './admin-reports';
import * as clientModule from './client';

describe('admin-reports API', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('getAdminReportsCounts', () => {
    it('fetches /admin/reports/counts and unwraps data', async () => {
      const getSpy = vi.spyOn(clientModule, 'apiClient').mockResolvedValueOnce({
        data: { open: 4, escalated: 2, closed: 11 },
      } as never);

      const res = await getAdminReportsCounts();
      expect(getSpy).toHaveBeenCalledWith('/admin/reports/counts');
      expect(res).toEqual({ open: 4, escalated: 2, closed: 11 });
    });
  });

  describe('getAdminReports', () => {
    it('builds query params and returns list and cursor', async () => {
      const getSpy = vi.spyOn(clientModule, 'apiClient').mockResolvedValueOnce({
        reports: [
          {
            id: 'rep-1',
            item_type: 'ai_message',
            reason: 'harmful',
            snippet: 'Dangerous advice snippet',
            workspace: { id: 'w1', name: 'Acme', plan_key: 'scale' },
            reporter: { id: 'u1', name: 'Alice', email: 'alice@example.com' },
            created_at: '2026-11-14T10:00:00Z',
          },
        ],
        meta: { next_cursor: 'cur-2' },
      } as never);

      const res = await getAdminReports({
        tab: 'open',
        type: 'ai_message',
        reason: 'harmful',
        query: 'Dangerous',
        cursor: 'cur-1',
      });

      expect(getSpy).toHaveBeenCalledWith(
        '/admin/reports?tab=open&type=ai_message&reason=harmful&query=Dangerous&cursor=cur-1'
      );
      expect(res.reports).toHaveLength(1);
      expect(res.next_cursor).toBe('cur-2');
    });
  });

  describe('getAdminReport', () => {
    it('fetches report detail by ID', async () => {
      const mockDetail = {
        id: 'rep-1',
        item_type: 'ai_message' as const,
        item_id: 'msg-999',
        reason: 'harmful',
        snippet: 'Full dangerous advice',
        note: 'Please look at this',
        reporter: { id: 'u1', name: 'Alice', email: 'alice@example.com' },
        author: null,
        workspace: { id: 'w1', name: 'Acme', plan_key: 'scale' },
        reports_on_item: 2,
        status: 'open' as const,
        created_at: '2026-11-14T10:00:00Z',
      };

      const getSpy = vi.spyOn(clientModule, 'apiClient').mockResolvedValueOnce({
        data: mockDetail,
      } as never);

      const res = await getAdminReport('rep-1');
      expect(getSpy).toHaveBeenCalledWith('/admin/reports/rep-1');
      expect(res).toEqual(mockDetail);
    });
  });

  describe('dismissAdminReport', () => {
    it('posts to /admin/reports/{id}/dismiss with reason', async () => {
      const postSpy = vi.spyOn(clientModule, 'apiClient').mockResolvedValue(undefined as never);

      await dismissAdminReport('rep-1', { reason: 'No policy violation found here.' });
      expect(postSpy).toHaveBeenCalledWith('/admin/reports/rep-1/dismiss', {
        method: 'POST',
        body: JSON.stringify({ reason: 'No policy violation found here.' }),
      });
    });
  });

  describe('escalateAdminReport', () => {
    it('posts to /admin/reports/{id}/escalate with reason', async () => {
      const postSpy = vi.spyOn(clientModule, 'apiClient').mockResolvedValue(undefined as never);

      await escalateAdminReport('rep-1', { reason: 'Requires legal team / super admin decision.' });
      expect(postSpy).toHaveBeenCalledWith('/admin/reports/rep-1/escalate', {
        method: 'POST',
        body: JSON.stringify({ reason: 'Requires legal team / super admin decision.' }),
      });
    });
  });

  describe('removeAdminReportContent', () => {
    it('posts to /admin/reports/{id}/remove with reason and totp_code', async () => {
      const postSpy = vi.spyOn(clientModule, 'apiClient').mockResolvedValue(undefined as never);

      await removeAdminReportContent('rep-1', {
        reason: 'Contains prohibited harmful content.',
        totp_code: '123456',
      });
      expect(postSpy).toHaveBeenCalledWith('/admin/reports/rep-1/remove', {
        method: 'POST',
        body: JSON.stringify({
          reason: 'Contains prohibited harmful content.',
          totp_code: '123456',
        }),
      });
    });
  });

  describe('restoreAdminReportContent', () => {
    it('posts to /admin/reports/{id}/restore with reason and totp_code', async () => {
      const postSpy = vi.spyOn(clientModule, 'apiClient').mockResolvedValue(undefined as never);

      await restoreAdminReportContent('rep-1', {
        reason: 'False positive after manual appeal review.',
        totp_code: '654321',
      });
      expect(postSpy).toHaveBeenCalledWith('/admin/reports/rep-1/restore', {
        method: 'POST',
        body: JSON.stringify({
          reason: 'False positive after manual appeal review.',
          totp_code: '654321',
        }),
      });
    });
  });
});
