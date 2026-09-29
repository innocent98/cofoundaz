import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { mapKpis, mapSummary, useActivityFeed, useDashboardSummary } from './useDashboardApi';
import * as dashboardApi from '@/lib/api/dashboard';
import { ApiError } from '@/lib/api/client';

vi.mock('@/lib/api/dashboard', () => ({
  getDashboardSummary: vi.fn(),
  getDashboardActivity: vi.fn(),
  isSectionError: (section: unknown) =>
    typeof section === 'object' && section !== null && (section as Record<string, unknown>).error === true,
}));

describe('useDashboardApi & Dashboard Mappers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  describe('mapKpis (Null-Safety & Honesty Rules)', () => {
    it('renders financial KPIs as "Coming Soon" when null, never as $0', () => {
      const rawKpis = {
        revenue: null,
        runway: null,
        pipeline_value: null,
        campaign_performance: null,
        tasks_done_this_week: 0,
      };

      const kpis = mapKpis(rawKpis);

      expect(kpis[0]).toMatchObject({
        id: 'revenue',
        label: 'Monthly Revenue',
        value: 'Coming Soon',
        hasData: false,
      });

      expect(kpis[1]).toMatchObject({
        id: 'runway',
        label: 'Runway',
        value: 'Coming Soon',
        hasData: false,
      });

      expect(kpis[2]).toMatchObject({
        id: 'pipeline',
        label: 'Pipeline Value',
        value: 'Coming Soon',
        hasData: false,
      });

      expect(kpis[3]).toMatchObject({
        id: 'ctr',
        label: 'Campaign CTR',
        value: 'Coming Soon',
        hasData: false,
      });

      expect(kpis[4]).toMatchObject({
        id: 'tasks',
        label: 'Tasks This Week',
        value: '0',
        hasData: true,
      });
    });

    it('formats real financial values when present and flags low runway alert', () => {
      const rawKpis = {
        revenue: 2500000,
        runway: 4,
        pipeline_value: 120000,
        campaign_performance: '4.5%',
        tasks_done_this_week: 7,
      };

      const kpis = mapKpis(rawKpis);

      expect(kpis[0].value).toBe('₦2.5M');
      expect(kpis[0].hasData).toBe(true);

      expect(kpis[1].value).toBe('4 mo');
      expect(kpis[1].isAlert).toBe(true);

      expect(kpis[2].value).toBe('₦120.0K');
      expect(kpis[3].value).toBe('4.5%');
      expect(kpis[4].value).toBe('7');
    });

    it('handles { error: true } section error gracefully', () => {
      const errorKpis = { error: true, message: 'Database connection failed' };
      const kpis = mapKpis(errorKpis);

      expect(kpis[0].error).toBe(true);
      expect(kpis[0].value).toBe('Unavailable');
    });
  });

  describe('mapSummary (Resilient Section Handling & AI Status States)', () => {
    it('guards against health section returning { error: true }', () => {
      const payload = {
        health: { error: true, message: 'Health computation timeout' },
        mission: { streak: 2, tasks: [] },
        briefing: { status: 'ready', message: 'Hello' },
        kpis: {},
      };

      const summary = mapSummary(payload);

      expect(summary.health.error).toBe(true);
      expect(summary.health.errorMessage).toBe('Health computation timeout');
      expect(summary.health.score).toBe(0);
    });

    it('guards against mission section returning { error: true } or null', () => {
      const errorPayload = {
        health: { score: 80 },
        mission: { error: true, message: 'Mission service unavailable' },
        briefing: {},
        kpis: {},
      };

      const errorSummary = mapSummary(errorPayload);
      expect(errorSummary.mission?.error).toBe(true);
      expect(errorSummary.mission?.errorMessage).toBe('Mission service unavailable');

      const nullPayload = {
        health: { score: 80 },
        mission: null,
        briefing: {},
        kpis: {},
      };

      const nullSummary = mapSummary(nullPayload);
      expect(nullSummary.mission).toBeNull();
    });

    it('guards against calibration section returning { error: true }', () => {
      const payload = {
        health: { score: 80 },
        calibration: { error: true, message: 'Calibration service failure' },
        kpis: {},
      };

      const summary = mapSummary(payload);
      expect(summary.calibration?.error).toBe(true);
    });

    it('handles AI Daily Briefing status states: empty, generating, ready', () => {
      // 1. generating state
      const generatingPayload = {
        briefing: {
          status: 'generating',
          message: 'Drafting summary in background...',
        },
        risks: { status: 'generating' },
        opportunities: { status: 'generating' },
      };
      const genSummary = mapSummary(generatingPayload);
      expect(genSummary.briefing.status).toBe('generating');
      expect(genSummary.risksStatus).toBe('generating');
      expect(genSummary.opportunitiesStatus).toBe('generating');

      // 2. empty state
      const emptyPayload = {
        briefing: {
          status: 'empty',
          message: '',
        },
        risks: [],
        opportunities: [],
      };
      const emptySummary = mapSummary(emptyPayload);
      expect(emptySummary.briefing.status).toBe('empty');
      expect(emptySummary.risksStatus).toBe('empty');

      // 3. ready state
      const readyPayload = {
        briefing: {
          status: 'ready',
          message: 'Here is your morning overview.',
          actions: [{ index: 0, label: 'Review CAC' }],
        },
        risks: [{ id: 'r-1', description: 'Runway warning', severity: 'high' }],
      };
      const readySummary = mapSummary(readyPayload);
      expect(readySummary.briefing.status).toBe('ready');
      expect(readySummary.briefing.content).toBe('Here is your morning overview.');
      expect(readySummary.risksStatus).toBe('ready');
      expect(readySummary.risks).toHaveLength(1);
    });
  });

  describe('useActivityFeed (Keyset Pagination & Null Actor Fallback)', () => {
    it('safely handles null actors and falls back to "System"', async () => {
      const mockResponse = {
        data: {
          items: [
            {
              id: 'act-1',
              actor: null,
              verb: 'updated',
              entity: 'System Config',
              timestamp: '2026-09-26T14:00:00Z',
            },
            {
              id: 'act-2',
              actor: { name: null, email: null },
              verb: 'triggered',
              entity: 'Nightly Sync',
              timestamp: '2026-09-26T14:05:00Z',
            },
            {
              id: 'act-3',
              actor: { name: 'Amara' },
              verb: 'reviewed',
              entity: 'Pitch Deck',
              timestamp: '2026-09-26T14:10:00Z',
            },
          ],
          next_cursor: 'cursor-page-2',
        },
      };

      vi.mocked(dashboardApi.getDashboardActivity).mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useActivityFeed());

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.data).toHaveLength(3);
      expect(result.current.data[0].actor).toBe('System');
      expect(result.current.data[1].actor).toBe('System');
      expect(result.current.data[2].actor).toBe('Amara');
      expect(result.current.hasMore).toBe(true);
      expect(result.current.nextCursor).toBe('cursor-page-2');
    });

    it('recovers from 422 malformed/expired cursor by resetting to page 1', async () => {
      const page1Response = {
        data: {
          items: [{ id: 'act-1', actor: { name: 'User 1' }, verb: 'created', entity: 'Task', timestamp: new Date().toISOString() }],
          next_cursor: 'corrupt-cursor',
        },
      };

      const page1RecoveredResponse = {
        data: {
          items: [{ id: 'act-1', actor: { name: 'User 1' }, verb: 'created', entity: 'Task', timestamp: new Date().toISOString() }],
          next_cursor: null,
        },
      };

      // 1. Initial mount fetch succeeds with corrupt cursor
      vi.mocked(dashboardApi.getDashboardActivity).mockResolvedValueOnce(page1Response);

      const { result } = renderHook(() => useActivityFeed());
      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.nextCursor).toBe('corrupt-cursor');

      // 2. FetchMore fails with 422 ApiError
      const err422 = new ApiError(422, 'Unprocessable Entity', { detail: 'Invalid cursor' });
      vi.mocked(dashboardApi.getDashboardActivity).mockRejectedValueOnce(err422);
      // 3. Recovery fetch calls first page without cursor
      vi.mocked(dashboardApi.getDashboardActivity).mockResolvedValueOnce(page1RecoveredResponse);

      await act(async () => {
        result.current.fetchMore();
      });

      await waitFor(() => {
        expect(dashboardApi.getDashboardActivity).toHaveBeenCalledWith(undefined);
        expect(result.current.nextCursor).toBeNull();
      });
    });

    it('renders empty feed honestly without fabricating items', async () => {
      vi.mocked(dashboardApi.getDashboardActivity).mockResolvedValueOnce({
        data: { items: [], next_cursor: null },
      });

      const { result } = renderHook(() => useActivityFeed());
      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.data).toEqual([]);
      expect(result.current.hasMore).toBe(false);
    });
  });

  describe('useDashboardSummary (Delayed Re-fetch on Generating)', () => {
    it('triggers a single delayed re-fetch when AI briefing is generating', async () => {
      vi.useFakeTimers();

      const generatingSummary = {
        data: {
          health: { score: 88 },
          mission: null,
          briefing: { status: 'generating' as const, message: '' },
          kpis: {},
        },
      };

      const readySummary = {
        data: {
          health: { score: 88 },
          mission: null,
          briefing: { status: 'ready' as const, message: 'Ready briefing' },
          kpis: {},
        },
      };

      vi.mocked(dashboardApi.getDashboardSummary)
        .mockResolvedValueOnce(generatingSummary)
        .mockResolvedValueOnce(readySummary);

      const { result } = renderHook(() => useDashboardSummary());

      // Let initial microtask and promise resolve
      await act(async () => {
        await Promise.resolve();
      });

      expect(result.current.data?.briefing?.status).toBe('generating');

      // Advance timers by 3.5s to trigger single delayed refetch
      await act(async () => {
        vi.advanceTimersByTime(3600);
      });

      expect(dashboardApi.getDashboardSummary).toHaveBeenCalledTimes(2);
      expect(result.current.data?.briefing?.status).toBe('ready');
      expect(result.current.data?.briefing?.content).toBe('Ready briefing');
    });
  });
});
