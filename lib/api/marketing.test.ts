import { describe, expect, it, vi, beforeEach } from 'vitest';
import * as clientModule from './client';
import {
  createCampaign,
  createCalendarEntry,
  deleteSegment,
  fieldErrorsOf,
  formatMoney,
  gapFillWeeks,
  getAnalytics,
  getOverview,
  ingestMetrics,
  isForbiddenError,
  listCalendarEntries,
  listCampaigns,
  listChannels,
  listKeywords,
  marketingErrorMessage,
  planDayToIso,
  savePositioning,
  startCopy,
  startPlanWeek,
  updateCampaign,
  updateChannel,
  updateTrackedPage,
} from './marketing';

vi.mock('./client', () => {
  class ApiError extends Error {
    constructor(
      public status: number,
      public statusText: string,
      public data: unknown
    ) {
      super(`API Error ${status}: ${statusText}`);
    }
  }
  return { apiClient: vi.fn(), ApiError };
});

const api = () => vi.mocked(clientModule.apiClient);
const ok = <T,>(data: T) => ({ data, meta: null });
const ApiErr = clientModule.ApiError;

beforeEach(() => {
  vi.clearAllMocks();
});

describe('marketing client: request shapes', () => {
  it('GET /marketing overview unwraps the envelope', async () => {
    api().mockResolvedValueOnce(
      ok({ scheduled_this_week: 0, active_channels: 1, active_campaigns: 2, top_channel_by_conversions: 'email', ai_content_ideas: 0 })
    );
    const o = await getOverview();
    expect(api()).toHaveBeenCalledWith('/marketing', undefined);
    expect(o.top_channel_by_conversions).toBe('email');
  });

  it('lists calendar entries with only the provided query params, returning data.entries', async () => {
    api().mockResolvedValueOnce(ok({ entries: [{ id: 'e1' }] }));
    const rows = await listCalendarEntries({ from: '2026-10-01T00:00:00.000Z', to: '2026-11-01T00:00:00.000Z' });
    const url = api().mock.calls[0][0] as string;
    expect(url.startsWith('/marketing/calendar-entries?')).toBe(true);
    expect(url).toContain('from=2026-10-01T00%3A00%3A00.000Z');
    expect(url).not.toContain('status=');
    expect(rows).toEqual([{ id: 'e1' }]);
  });

  it('calls the unfiltered calendar list with no query string', async () => {
    api().mockResolvedValueOnce(ok({ entries: [] }));
    await listCalendarEntries();
    expect(api().mock.calls[0][0]).toBe('/marketing/calendar-entries');
  });

  it('POSTs a calendar entry as JSON', async () => {
    api().mockResolvedValueOnce(ok({ id: 'e1' }));
    await createCalendarEntry({ title: 'Hi', channel: 'email', status: 'scheduled', scheduled_at: '2026-10-01T09:00:00Z' });
    const [path, init] = api().mock.calls[0];
    expect(path).toBe('/marketing/calendar-entries');
    expect(init?.method).toBe('POST');
    expect(JSON.parse(init?.body as string)).toEqual({
      title: 'Hi',
      channel: 'email',
      status: 'scheduled',
      scheduled_at: '2026-10-01T09:00:00Z',
    });
  });

  it('plan-week POSTs an empty JSON body and returns the accepted id', async () => {
    api().mockResolvedValueOnce(ok({ id: 'g1', status: 'generating' }));
    const accepted = await startPlanWeek();
    const [path, init] = api().mock.calls[0];
    expect(path).toBe('/marketing/calendar/plan-week');
    expect(init?.body).toBe('{}');
    expect(accepted).toEqual({ id: 'g1', status: 'generating' });
  });

  it('copy generation posts snake_case fields', async () => {
    api().mockResolvedValueOnce(ok({ id: 'c1', status: 'generating' }));
    await startCopy({ asset_type: 'ad', tone: 'bold', key_message: 'Launch', channel: null });
    const [path, init] = api().mock.calls[0];
    expect(path).toBe('/marketing/copy/generate');
    expect(JSON.parse(init?.body as string)).toMatchObject({ asset_type: 'ad', tone: 'bold', key_message: 'Launch' });
  });

  it('unwraps campaign lists and PATCHes status transitions', async () => {
    api().mockResolvedValueOnce(ok({ campaigns: [{ id: 'c1' }] }));
    expect(await listCampaigns()).toEqual([{ id: 'c1' }]);
    api().mockResolvedValueOnce(ok({ id: 'c1', status: 'active' }));
    await updateCampaign('c1', { status: 'active' });
    const [path, init] = api().mock.calls[1];
    expect(path).toBe('/marketing/campaigns/c1');
    expect(init?.method).toBe('PATCH');
    expect(init?.body).toBe('{"status":"active"}');
  });

  it('creates a campaign with integer-cent budget and channel mix', async () => {
    api().mockResolvedValueOnce(ok({ id: 'c1' }));
    await createCampaign({ name: 'Q4', objective: 'launch', budget: 50000, channel_mix: { email: 60, search: 40 }, segment_ids: ['s1'] });
    expect(JSON.parse(api().mock.calls[0][1]?.body as string)).toEqual({
      name: 'Q4',
      objective: 'launch',
      budget: 50000,
      channel_mix: { email: 60, search: 40 },
      segment_ids: ['s1'],
    });
  });

  it('patches channels by key and returns the raw array for the board', async () => {
    api().mockResolvedValueOnce(ok([{ key: 'email' }]));
    expect(await listChannels()).toEqual([{ key: 'email' }]);
    api().mockResolvedValueOnce(ok({ key: 'email', status: 'active' }));
    await updateChannel('email', { status: 'active' });
    expect(api().mock.calls[1][0]).toBe('/marketing/channels/email');
  });

  it('DELETE segment hits the segment id route', async () => {
    api().mockResolvedValueOnce(ok({ deleted: true }));
    await deleteSegment('s1');
    expect(api().mock.calls[0][0]).toBe('/marketing/segments/s1');
    expect(api().mock.calls[0][1]?.method).toBe('DELETE');
  });

  it('keywords come from data.keywords', async () => {
    api().mockResolvedValueOnce(ok({ keywords: [{ id: 'k1', volume: '2.4K' }] }));
    expect((await listKeywords())[0].volume).toBe('2.4K');
  });

  it('wraps a checklist toggle under { checklist }', async () => {
    api().mockResolvedValueOnce(ok({ id: 'p1' }));
    await updateTrackedPage('p1', { h1: true });
    expect(api().mock.calls[0][1]?.body).toBe('{"checklist":{"h1":true}}');
  });

  it('positioning is saved with PUT (full replace)', async () => {
    api().mockResolvedValueOnce(ok({ statement: 'x' }));
    await savePositioning({ audience: 'a', need: 'b', product: 'c', category: 'd', differentiator: 'e' });
    expect(api().mock.calls[0][0]).toBe('/marketing/positioning');
    expect(api().mock.calls[0][1]?.method).toBe('PUT');
  });

  it('ingests metric points under { points }', async () => {
    api().mockResolvedValueOnce(ok({ created: 1 }));
    const res = await ingestMetrics([{ ts: '2026-10-17', metric: 'visits', value: 5 }]);
    expect(res.created).toBe(1);
    expect(JSON.parse(api().mock.calls[0][1]?.body as string)).toEqual({
      points: [{ ts: '2026-10-17', metric: 'visits', value: 5 }],
    });
  });

  it('requests analytics with the range query', async () => {
    api().mockResolvedValueOnce(ok({ range: '7d' }));
    await getAnalytics('7d');
    expect(api().mock.calls[0][0]).toBe('/marketing/analytics?range=7d');
  });
});

describe('marketing client: errors', () => {
  const forbidden = new ApiErr(403, 'Forbidden', { error: { code: 'FORBIDDEN', message: 'Forbidden', field_errors: [] } });
  const unverified = new ApiErr(403, 'Forbidden', { error: { code: 'EMAIL_NOT_VERIFIED', message: 'Verify your email.' } });
  const validation = new ApiErr(422, 'Unprocessable', {
    error: {
      code: 'VALIDATION_ERROR',
      message: 'Please check the highlighted fields.',
      field_errors: [{ field: 'channel_mix', message: 'Unknown channel: nope' }],
    },
  });

  it('recognises role-based 403s but not unverified-email 403s', () => {
    expect(isForbiddenError(forbidden)).toBe(true);
    expect(isForbiddenError(unverified)).toBe(false);
    expect(isForbiddenError(new Error('x'))).toBe(false);
  });

  it('prefers the specific field message over the generic 422 summary', () => {
    expect(marketingErrorMessage(validation)).toBe('Unknown channel: nope');
    expect(fieldErrorsOf(validation)).toEqual({ channel_mix: 'Unknown channel: nope' });
  });

  it("surfaces the API's own message otherwise", () => {
    expect(marketingErrorMessage(unverified)).toBe('Verify your email.');
    expect(marketingErrorMessage(forbidden)).toBe('Marketing is not available for your role.');
  });

  it('falls back for non-API errors', () => {
    expect(marketingErrorMessage('boom', 'fallback')).toBe('fallback');
    expect(marketingErrorMessage(new Error('network down'))).toBe('network down');
  });
});

describe('marketing client: pure helpers', () => {
  it('formats integer minor units', () => {
    expect(formatMoney(21000)).toBe('₦210');
    expect(formatMoney(1190)).toBe('₦11.9');
    expect(formatMoney(null)).toBe('-');
  });

  it('gap-fills weeks the API omits', () => {
    expect(
      gapFillWeeks([
        { week_start: '2026-09-14', visits: 310 },
        { week_start: '2026-09-28', visits: 420 },
      ])
    ).toEqual([
      { week_start: '2026-09-14', visits: 310 },
      { week_start: '2026-09-21', visits: 0 },
      { week_start: '2026-09-28', visits: 420 },
    ]);
    expect(gapFillWeeks([])).toEqual([]);
  });

  it('maps a plan day offset to 09:00 local on that day', () => {
    const base = new Date(2026, 9, 17, 15, 30);
    const d = new Date(planDayToIso(base, 2));
    expect([d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes()]).toEqual([2026, 9, 19, 9, 0]);
  });
});
