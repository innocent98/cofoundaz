import { describe, expect, it, vi, beforeEach } from 'vitest';
import { reportItem, myReports, REPORT_REASONS } from './reports';
import * as clientModule from './client';

describe('reports API', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('reportItem', () => {
    it('sends POST /reports with item_type, item_id, reason, and trimmed note', async () => {
      const postSpy = vi.spyOn(clientModule, 'apiClient').mockResolvedValue(undefined as never);

      await reportItem({
        item_type: 'ai_message',
        item_id: 'msg-123',
        reason: 'harmful',
        note: '  This is unsafe advice  ',
      });

      expect(postSpy).toHaveBeenCalledTimes(1);
      expect(postSpy).toHaveBeenCalledWith('/reports', {
        method: 'POST',
        body: JSON.stringify({
          item_type: 'ai_message',
          item_id: 'msg-123',
          reason: 'harmful',
          note: 'This is unsafe advice',
        }),
      });
    });

    it('omits empty note when submitting report', async () => {
      const postSpy = vi.spyOn(clientModule, 'apiClient').mockResolvedValue(undefined as never);

      await reportItem({
        item_type: 'comment',
        item_id: 'cmt-456',
        reason: 'spam',
        note: '   ',
      });

      expect(postSpy).toHaveBeenCalledWith('/reports', {
        method: 'POST',
        body: JSON.stringify({
          item_type: 'comment',
          item_id: 'cmt-456',
          reason: 'spam',
        }),
      });
    });
  });

  describe('myReports', () => {
    it('returns array from raw response or data envelope', async () => {
      const getSpy = vi.spyOn(clientModule, 'apiClient').mockResolvedValueOnce({
        data: [
          { id: 'rep-1', item_type: 'ai_message', item_id: 'msg-123', reason: 'inaccurate' },
        ],
      } as never);

      const res1 = await myReports();
      expect(res1).toHaveLength(1);
      expect(res1[0].id).toBe('rep-1');
      expect(getSpy).toHaveBeenCalledWith('/reports/mine');

      getSpy.mockResolvedValueOnce([
        { id: 'rep-2', item_type: 'comment', item_id: 'cmt-789', reason: 'abusive' },
      ] as never);

      const res2 = await myReports();
      expect(res2).toHaveLength(1);
      expect(res2[0].id).toBe('rep-2');
    });

    it('returns empty array when response has no items', async () => {
      vi.spyOn(clientModule, 'apiClient').mockResolvedValueOnce({} as never);
      const res = await myReports();
      expect(res).toEqual([]);
    });
  });

  describe('REPORT_REASONS mapping', () => {
    it('maps all 6 standard reasons', () => {
      expect(REPORT_REASONS.spam).toBe('Spam');
      expect(REPORT_REASONS.abusive).toBe('Abusive or harassing');
      expect(REPORT_REASONS.harmful).toBe('Harmful or unsafe');
      expect(REPORT_REASONS.inaccurate).toBe('Wrong or misleading');
      expect(REPORT_REASONS.privacy).toBe('Shares private information');
      expect(REPORT_REASONS.other).toBe('Something else');
    });
  });
});
