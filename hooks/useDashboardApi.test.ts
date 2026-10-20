import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import {
  mapKpis,
  mapSummary,
  prependActivity,
  toActivityEntry,
  trendFields,
  useActivityFeed,
  useDashboardSummary,
} from './useDashboardApi';
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

  describe('mapKpis (kpis.metrics, honest state per status)', () => {
    const noData = {
      revenue: { status: 'no_data', value_minor: null, currency: null, basis: 'trailing_3mo_avg' },
      runway: { status: 'no_data', months: null, is_low: false, monthly_burn_minor: null, cash_on_hand_minor: null, currency: null },
      pipeline: { status: 'not_built', value_minor: null, currency: null },
      campaign_ctr: { status: 'no_data', ctr_percent: null, impressions: null, clicks: null, range: '30d' },
    };
    const raw = (metrics: unknown) => ({
      tasks_done_this_week: 3,
      metrics,
      revenue: null,
      runway: null,
      pipeline_value: null,
      campaign_performance: null,
    });

    it('no_data: empty state with module CTA, never "Coming Soon" or ₦0; pipeline stays Coming Soon', () => {
      const kpis = mapKpis(raw(noData));
      expect(kpis[0]).toMatchObject({ id: 'revenue', status: 'no_data', value: 'No data yet', hasData: false, cta: { href: '/finance' } });
      expect(kpis[1]).toMatchObject({ id: 'runway', status: 'no_data', value: 'No data yet', cta: { href: '/finance' } });
      expect(kpis[2]).toMatchObject({ id: 'pipeline', status: 'not_built', value: 'Coming Soon' });
      expect(kpis[3]).toMatchObject({ id: 'ctr', status: 'no_data', value: 'No data yet', cta: { href: '/marketing' } });
      expect(kpis.filter((t) => t.value === 'Coming Soon')).toHaveLength(1);
      expect(kpis.some((t) => t.value.includes('₦0'))).toBe(false);
      expect(kpis[4]).toMatchObject({ id: 'tasks', value: '3', hasData: true });
    });

    it('ok: converts kobo to naira, runway months, CTR already a percent (live burning capture)', () => {
      const kpis = mapKpis(raw({
        revenue: { status: 'ok', value_minor: 1000000, currency: 'NGN', basis: 'trailing_3mo_avg' },
        runway: { status: 'ok', months: 27.0, is_low: false, monthly_burn_minor: 2000000, cash_on_hand_minor: 54000000, currency: 'NGN' },
        pipeline: noData.pipeline,
        campaign_ctr: { status: 'ok', ctr_percent: 2.5, impressions: 2000, clicks: 50, range: '30d' },
      }));
      expect(kpis[0]).toMatchObject({ value: '₦10.0K', hasData: true, status: 'ok', hint: 'Avg. monthly money in, last 3 months' });
      expect(kpis[1]).toMatchObject({ value: '27 mo', isAlert: false });
      expect(kpis[3]).toMatchObject({ value: '2.5%', hasData: true });
    });

    it('ok with 0 is real data: ₦0, not the empty state', () => {
      const kpis = mapKpis(raw({ ...noData, revenue: { status: 'ok', value_minor: 0, currency: 'NGN' } }));
      expect(kpis[0]).toMatchObject({ value: '₦0', hasData: true, status: 'ok' });
      expect(kpis[0].cta).toBeUndefined();
    });

    it('runway alert comes from is_low, not a client-side < 6 check', () => {
      const low = mapKpis(raw({ ...noData, runway: { status: 'ok', months: 4.2, is_low: true, currency: 'NGN' } }));
      expect(low[1]).toMatchObject({ value: '4.2 mo', isAlert: true });
      // is_low false must win even for a small number
      const notLow = mapKpis(raw({ ...noData, runway: { status: 'ok', months: 4.2, is_low: false, currency: 'NGN' } }));
      expect(notLow[1].isAlert).toBe(false);
    });

    it('runway out_of_cash: alert styling and "Out of cash"', () => {
      const kpis = mapKpis(raw({ ...noData, runway: { status: 'out_of_cash', months: 0, is_low: true, monthly_burn_minor: 35333333, cash_on_hand_minor: -46000000, currency: 'NGN' } }));
      expect(kpis[1]).toMatchObject({ value: 'Out of cash', isAlert: true, status: 'out_of_cash', hasData: true });
    });

    it('runway not_burning: "Not burning", no months, no alert', () => {
      const kpis = mapKpis(raw({ ...noData, runway: { status: 'not_burning', months: null, is_low: false, monthly_burn_minor: 0, cash_on_hand_minor: 154000000, currency: 'NGN' } }));
      expect(kpis[1]).toMatchObject({ value: 'Not burning', status: 'not_burning', hasData: true });
      expect(kpis[1].isAlert).toBeFalsy();
      expect(kpis[1].value).not.toMatch(/mo/);
    });

    it('restricted: tiles are hidden and carry no value (investor capture)', () => {
      const kpis = mapKpis(raw({
        revenue: { status: 'restricted', value_minor: null, currency: null },
        runway: { status: 'restricted', months: null, is_low: false, currency: null },
        pipeline: noData.pipeline,
        campaign_ctr: { status: 'restricted', ctr_percent: null, impressions: null, clicks: null },
      }));
      expect(kpis.filter((t) => t.hidden).map((t) => t.id)).toEqual(['revenue', 'runway', 'ctr']);
      expect(kpis[0].value).toBe('');
      expect(kpis[2].hidden).toBeFalsy();
    });

    it('per-tile { error: true } marks only that tile Unavailable', () => {
      const kpis = mapKpis(raw({ ...noData, revenue: { error: true } }));
      expect(kpis[0]).toMatchObject({ error: true, value: 'Unavailable' });
      expect(kpis[1].error).toBeFalsy();
      expect(kpis[3].error).toBeFalsy();
    });

    it('ignores the legacy scalar keys', () => {
      const kpis = mapKpis({ revenue: 999, runway: 2, pipeline_value: 5, campaign_performance: 9, tasks_done_this_week: 0 });
      expect(kpis.slice(0, 4).every((t) => t.value === 'Coming Soon')).toBe(true);
    });

    it('handles { error: true } section error gracefully', () => {
      const kpis = mapKpis({ error: true, message: 'Database connection failed' });
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

    it('maps mission_status: restricted stays restricted, ok / absent / unknown are ok', () => {
      expect(mapSummary({ mission: null, mission_status: 'restricted' } as never).missionStatus).toBe('restricted');
      expect(mapSummary({ mission: null, mission_status: 'ok' } as never).missionStatus).toBe('ok');
      expect(mapSummary({ mission: null } as never).missionStatus).toBe('ok');
      expect(mapSummary({ mission: null, mission_status: 'whatever' } as never).missionStatus).toBe('ok');
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
        risks: { status: 'empty', items: [] },
        opportunities: { status: 'empty', items: [] },
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
        risks: { status: 'ready', items: [{ index: 0, severity: 'high', text: 'Runway warning', href: '/finance' }] },
      };
      const readySummary = mapSummary(readyPayload);
      expect(readySummary.briefing.status).toBe('ready');
      expect(readySummary.briefing.content).toBe('Here is your morning overview.');
      expect(readySummary.risksStatus).toBe('ready');
      expect(readySummary.risks).toHaveLength(1);
    });

    // Shapes below are the live captures in cofoundaz-api/docs/fe-integration-guide-dashboard-briefing-v2.md
    it('maps risk and opportunity rows (severity + text + href) and keeps a null href', () => {
      const s = mapSummary({
        briefing: { status: 'ready', message: 'x', id: 'b1', actions: [] },
        risks: {
          status: 'ready',
          message: 'joined',
          items: [
            { index: 0, severity: 'medium', text: 'One deadline is due within seven days.', href: '/roadmap' },
            { index: 1, severity: 'bogus', text: 'Coerced to medium.', href: null },
          ],
        },
        opportunities: {
          status: 'ready',
          message: 'joined',
          items: [{ index: 0, text: 'Add a first validation task.', href: '/validation' }],
        },
      });
      expect(s.risks).toEqual([
        { id: '0', severity: 'medium', description: 'One deadline is due within seven days.', moduleLink: '/roadmap' },
        { id: '1', severity: 'medium', description: 'Coerced to medium.', moduleLink: null },
      ]);
      expect(s.opportunities).toEqual([{ id: '0', description: 'Add a first validation task.', moduleLink: '/validation' }]);
    });

    it('a ready block with no items stays ready (shows the PRD empty copy, not a spinner)', () => {
      const s = mapSummary({
        briefing: { status: 'ready', message: 'All good.', id: 'b1', actions: [] },
        risks: { status: 'ready', message: 'none', items: [] },
        opportunities: { status: 'ready', message: 'none', items: [] },
      });
      expect(s.risksStatus).toBe('ready');
      expect(s.risks).toEqual([]);
    });

    it('maps briefing actions for Do it, including accepted tasks', () => {
      const s = mapSummary({
        briefing: {
          status: 'ready',
          message: 'Hi',
          id: 'b803f642',
          actions: [
            { index: 0, label: 'Interview 3 target customers', kind: 'task', href: '/validation', accepted: true, mission_task_id: 't1' },
            { index: 1, label: 'Review the deadline', kind: 'navigate', href: '/roadmap', accepted: false, mission_task_id: null },
          ],
        },
      });
      expect(s.briefing.id).toBe('b803f642');
      expect(s.briefing.actions).toEqual([
        { index: 0, label: 'Interview 3 target customers', kind: 'task', href: '/validation', accepted: true, missionTaskId: 't1' },
        { index: 1, label: 'Review the deadline', kind: 'navigate', href: '/roadmap', accepted: false, missionTaskId: null },
      ]);
    });

    it('restricted roles (investor capture): all three blocks restricted, flagged so the cards are hidden', () => {
      const s = mapSummary({
        briefing: { status: 'restricted', message: null, id: null, actions: [] },
        risks: { status: 'restricted', message: null, items: [] },
        opportunities: { status: 'restricted', message: null, items: [] },
      });
      expect(s.briefingRestricted).toBe(true);
      expect(s.briefing.status).toBe('restricted');
      expect(s.briefing.id).toBeNull();
      expect(s.risksStatus).toBe('restricted');
    });

    it('mission.empty_reason is carried (weekend_off, all_caught_up); unknown reasons become null', () => {
      const m = (empty_reason: unknown) => mapSummary({ mission: { streak: 0, status: 'pending', tasks: [], empty_reason } }).mission;
      expect(m('weekend_off')?.emptyReason).toBe('weekend_off');
      expect(m('all_caught_up')?.emptyReason).toBe('all_caught_up');
      expect(m('something_new')?.emptyReason).toBeNull();
      expect(mapSummary({ mission: null }).mission).toBeNull();
    });

    it('mission drops snoozed and rejected tasks and maps done to completed', () => {
      const s = mapSummary({
        mission: {
          streak: 1,
          status: 'pending',
          empty_reason: null,
          tasks: [
            { id: 'a', title: 'A', status: 'todo', order: 0 },
            { id: 'b', title: 'B', status: 'done', order: 1, completed_at: '2026-10-18T08:00:00Z' },
            { id: 'c', title: 'C', status: 'snoozed', order: 2 },
            { id: 'd', title: 'D', status: 'rejected', order: 3 },
          ],
        },
      });
      expect(s.mission?.tasks.map((t) => [t.id, t.completed])).toEqual([['a', false], ['b', true]]);
    });

    it('upcoming: real shape (due_on), { items } wrapper, and a section error', () => {
      const live = [{ id: '9797', title: 'Write your problem statement', due_on: '2026-10-24', milestone_id: '9797' }];
      expect(mapSummary({ upcoming: live }).upcoming).toEqual([
        { id: '9797', title: 'Write your problem statement', dueOn: '2026-10-24' },
      ]);
      expect(mapSummary({ upcoming: { items: live } }).upcoming).toHaveLength(1);
      const failed = mapSummary({ upcoming: { error: true } });
      expect(failed.upcoming).toEqual([]);
      expect(failed.upcomingError).toBe(true);
      expect(mapSummary({ upcoming: [] }).upcomingError).toBe(false);
    });

    it('calibration.assessment_complete is passed through for the banner', () => {
      expect(mapSummary({ calibration: { assessment_complete: false } }).calibration?.assessment_complete).toBe(false);
    });
  });

  describe('trendFields (KPI week-over-week chip + sparkline, BE guide 7a)', () => {
    const series = [
      { period: '2026-10-16', value: 4.0 },
      { period: '2026-10-17', value: 1.5 },
    ];

    it('null delta shows no chip, never "+0", but still gives the sparkline', () => {
      expect(trendFields('months', { delta: null, series })).toEqual({ deltaLabel: null, deltaDirection: 'flat', series: [4, 1.5] });
    });

    it('formats each unit and direction', () => {
      expect(trendFields('money', { delta: 1000000, series: [] })).toMatchObject({ deltaLabel: '+₦10.0K vs last week', deltaDirection: 'up' });
      expect(trendFields('months', { delta: -1.25, series: [] })).toMatchObject({ deltaLabel: '-1.3 mo vs last week', deltaDirection: 'down' });
      expect(trendFields('points', { delta: -0.5, series: [] })).toMatchObject({ deltaLabel: '-0.5 pts vs last week', deltaDirection: 'down' });
      expect(trendFields('count', { delta: 3, series: [] })).toMatchObject({ deltaLabel: '+3 vs last week', deltaDirection: 'up' });
    });

    it('a zero change says so instead of a signed zero', () => {
      expect(trendFields('count', { delta: 0, series: [] })).toMatchObject({ deltaLabel: 'No change vs last week', deltaDirection: 'flat' });
    });

    it('needs two points to draw a sparkline', () => {
      expect(trendFields('count', { delta: null, series: [{ period: '2026-10-17', value: 0 }] }).series).toEqual([]);
    });

    it('mapKpis wires trend onto visible tiles (runway capture) and Tasks, and none onto restricted tiles', () => {
      const kpis = mapKpis({
        tasks_done_this_week: 1,
        tasks_trend: { delta: 1, series },
        metrics: {
          revenue: { status: 'restricted', value_minor: null, currency: null },
          runway: { status: 'ok', months: 1.5, is_low: true, monthly_burn_minor: 2000000, cash_on_hand_minor: 3000000, currency: 'NGN', trend: { delta: -2.5, series } },
          pipeline: { status: 'not_built', value_minor: null, currency: null },
          campaign_ctr: { status: 'no_data', ctr_percent: null, impressions: null, clicks: null, trend: { delta: null, series: [] } },
        },
      });
      expect(kpis[0].deltaLabel).toBeUndefined();
      expect(kpis[1]).toMatchObject({ deltaLabel: '-2.5 mo vs last week', deltaDirection: 'down', series: [4, 1.5] });
      expect(kpis[3].deltaLabel).toBeNull();
      expect(kpis[4]).toMatchObject({ deltaLabel: '+1 vs last week', deltaDirection: 'up' });
    });
  });

  describe('toActivityEntry / prependActivity (realtime activity.created)', () => {
    const live = {
      id: '77551c2e',
      action: 'mission.task.added',
      entity_type: 'mission_task',
      entity_id: '33cc724c',
      summary: "Victor Founder added 'Realtime check task' to today's mission",
      meta: null,
      actor: { id: '0a37c892', name: 'Victor Founder' },
      created_at: '2026-10-17T22:39:04.991361+00:00',
    };

    it('maps the live frame to a row with the API sentence', () => {
      const e = toActivityEntry(live, Date.parse('2026-10-17T22:39:10Z'));
      expect(e).toMatchObject({ id: '77551c2e', actor: 'Victor Founder', summary: live.summary, relativeTime: 'just now' });
    });

    it('actor null is System; actor without a name is "A teammate"', () => {
      expect(toActivityEntry({ ...live, actor: null }).actor).toBe('System');
      expect(toActivityEntry({ ...live, actor: { id: 'x', name: null } }).actor).toBe('A teammate');
    });

    it('relative times: minutes, hours, days, then a date after a week', () => {
      const now = Date.parse('2026-10-18T12:00:00Z');
      expect(toActivityEntry({ ...live, created_at: '2026-10-18T11:55:00Z' }, now).relativeTime).toBe('5m ago');
      expect(toActivityEntry({ ...live, created_at: '2026-10-18T10:00:00Z' }, now).relativeTime).toBe('2h ago');
      expect(toActivityEntry({ ...live, created_at: '2026-10-15T12:00:00Z' }, now).relativeTime).toBe('3d ago');
      expect(toActivityEntry({ ...live, created_at: '2026-09-01T12:00:00Z' }, now).relativeTime).toBe('Sep 1, 2026');
    });

    it('prepends a new row and dedupes by id (our own action echoes back)', () => {
      const a = toActivityEntry({ ...live, id: 'a' });
      const b = toActivityEntry({ ...live, id: 'b' });
      expect(prependActivity([a], b).map((x) => x.id)).toEqual(['b', 'a']);
      expect(prependActivity([b, a], b).map((x) => x.id)).toEqual(['b', 'a']);
    });
  });

  describe('useActivityFeed (Keyset Pagination & Null Actor Fallback)', () => {
    it('handles a null actor (System) and a nameless actor (A teammate)', async () => {
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
      expect(result.current.data[1].actor).toBe('A teammate');
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

    it('surfaces an honest error state on fetch failure without falling back to DEFAULT_SUMMARY', async () => {
      const networkError = new Error('500 Internal Server Error');
      vi.mocked(dashboardApi.getDashboardSummary).mockRejectedValueOnce(networkError);

      const { result } = renderHook(() => useDashboardSummary());

      await act(async () => {
        await Promise.resolve();
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toEqual(networkError);
      expect(result.current.data).toBeNull();
    });

    it('allows retrying after a fetch failure and successfully recovers', async () => {
      const networkError = new Error('Network failure');
      const recoveredSummary = {
        data: {
          health: { score: 92 },
          mission: null,
          briefing: { status: 'ready' as const, message: 'Recovered briefing' },
          kpis: {},
        },
      };

      vi.mocked(dashboardApi.getDashboardSummary)
        .mockRejectedValueOnce(networkError)
        .mockResolvedValueOnce(recoveredSummary);

      const { result } = renderHook(() => useDashboardSummary());

      await act(async () => {
        await Promise.resolve();
      });

      expect(result.current.error).toEqual(networkError);
      expect(result.current.data).toBeNull();

      // Retry
      await act(async () => {
        await result.current.refetch();
      });

      expect(result.current.error).toBeNull();
      expect(result.current.data?.health?.score).toBe(92);
      expect(result.current.data?.briefing?.content).toBe('Recovered briefing');
    });
  });
});
