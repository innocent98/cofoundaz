import { describe, expect, it, vi, beforeEach } from 'vitest';
import * as clientModule from './client';
import {
  MEDIA_MAX_BYTES,
  channelsStartedByLaunch,
  charCount,
  definitionChips,
  deleteMedia,
  deleteMetric,
  exportAnalyticsCsv,
  fillSeriesDays,
  formatPeriod,
  getCampaignPerformance,
  getCalendarEntry,
  isOverLimit,
  legacyDefinitionKeys,
  listCampaignReadouts,
  listCopyGenerations,
  listCopyPlatforms,
  listMedia,
  listRecordedMetrics,
  refineCopy,
  summariseMix,
  uploadMedia,
  createCampaign,
  createCalendarEntry,
  deleteSegment,
  fieldErrorsOf,
  formatCac,
  formatMoney,
  majorUnitsCsv,
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
  return { apiClient: vi.fn(), ApiError, API_BASE: '/api/v1' };
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

// Shapes below are copied from cofoundaz-api/docs/fe-integration-guide-marketing-prd.md (live captures).
describe('marketing client: PRD gap routes', () => {
  it('reads one post for the notification deep link', async () => {
    api().mockResolvedValueOnce(ok({ id: 'e1' }));
    await getCalendarEntry('e1');
    expect(api()).toHaveBeenCalledWith('/marketing/calendar-entries/e1', undefined);
  });

  it('filters posts and copy by campaign', async () => {
    api().mockResolvedValueOnce(ok({ entries: [] }));
    await listCalendarEntries({ campaign_id: 'c1' });
    expect(api().mock.calls[0][0]).toBe('/marketing/calendar-entries?campaign_id=c1');
    api().mockResolvedValueOnce(ok({ generations: [] }));
    await listCopyGenerations('c1');
    expect(api().mock.calls[1][0]).toBe('/marketing/copy/generations?campaign_id=c1');
    api().mockResolvedValueOnce(ok({ generations: [] }));
    await listCopyGenerations();
    expect(api().mock.calls[2][0]).toBe('/marketing/copy/generations');
  });

  it('asks for campaign performance and readouts', async () => {
    api().mockResolvedValueOnce(ok({ campaign_id: 'c1', series: [], by_channel: [] }));
    await getCampaignPerformance('c1', '30d');
    expect(api().mock.calls[0][0]).toBe('/marketing/campaigns/c1/performance?range=30d');
    api().mockResolvedValueOnce(ok({ readouts: [{ id: 'r1' }] }));
    expect(await listCampaignReadouts('c1')).toEqual([{ id: 'r1' }]);
    expect(api().mock.calls[1][0]).toBe('/marketing/campaigns/c1/readouts');
  });

  it('refines one variant with the index and instruction in the body', async () => {
    api().mockResolvedValueOnce(ok({ id: 'g2', status: 'generating' }));
    await refineCopy({ parentId: 'g1', variantIndex: 1, instruction: 'Make it shorter' });
    const [path, init] = api().mock.calls[0];
    expect(path).toBe('/marketing/copy/generations/g1/refine');
    expect(init).toMatchObject({ method: 'POST' });
    expect(JSON.parse(String((init as RequestInit).body))).toEqual({ variant_index: 1, instruction: 'Make it shorter' });
  });

  it('loads the platform table', async () => {
    api().mockResolvedValueOnce(ok({ platforms: [{ key: 'x', label: 'X', limit: 280, kind: 'hard' }] }));
    expect((await listCopyPlatforms())[0].limit).toBe(280);
  });

  it('lists and deletes recorded metrics', async () => {
    api().mockResolvedValueOnce(ok({ metrics: [], total: 0, limit: 25, offset: 0 }));
    await listRecordedMetrics('30d', 25, 50);
    expect(api().mock.calls[0][0]).toBe('/marketing/metrics?range=30d&limit=25&offset=50');
    api().mockResolvedValueOnce(ok({ deleted: true }));
    await deleteMetric('m1');
    expect(api().mock.calls[1]).toEqual(['/marketing/metrics/m1', { method: 'DELETE', body: undefined }]);
  });

  it('uploads media as multipart with the file field, and lists and deletes it', async () => {
    api().mockResolvedValueOnce(ok({ id: 'a1', filename: 'hero.png' }));
    const file = new File([new Uint8Array(4)], 'hero.png', { type: 'image/png' });
    await uploadMedia(file);
    const [path, init] = api().mock.calls[0];
    expect(path).toBe('/marketing/media');
    expect((init as RequestInit).body).toBeInstanceOf(FormData);
    expect(((init as RequestInit).body as FormData).get('file')).toBeInstanceOf(File);
    api().mockResolvedValueOnce(ok({ media: [{ id: 'a1' }] }));
    expect(await listMedia()).toEqual([{ id: 'a1' }]);
    api().mockResolvedValueOnce(ok({ deleted: true }));
    await deleteMedia('a1');
    expect(api().mock.calls[2][0]).toBe('/marketing/media/a1');
    expect(MEDIA_MAX_BYTES).toBe(5 * 1024 * 1024);
  });
});

describe('CSV export', () => {
  const fetchMock = vi.fn();
  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
    localStorage.setItem('cf_token', 'placeholder-token');
    localStorage.setItem('cf_workspace_id', 'ws-1');
  });

  it('downloads text/csv with the bearer header and the server file name', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response('date,scope,channel,campaign,metric,value\n', {
        status: 200,
        headers: { 'content-type': 'text/csv; charset=utf-8', 'content-disposition': 'attachment; filename="marketing-metrics-30d.csv"' },
      })
    );
    const { blob, filename } = await exportAnalyticsCsv('30d');
    expect(filename).toBe('marketing-metrics-30d.csv');
    expect(await blob.text()).toContain('date,scope,channel,campaign,metric,value');
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/v1/marketing/analytics/export?range=30d');
    expect((init.headers as Headers).get('Authorization')).toBe('Bearer placeholder-token');
    expect((init.headers as Headers).get('X-Workspace-Id')).toBe('ws-1');
  });

  it('turns the JSON 422 into an ApiError', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: { code: 'VALIDATION_ERROR', message: 'range must be one of 7d, 30d, 90d.', field_errors: [] } }), { status: 422 })
    );
    await expect(exportAnalyticsCsv('30d')).rejects.toBeInstanceOf(ApiErr);
  });
});

describe('marketing pure helpers', () => {
  it('fills the days the API leaves out with zeros', () => {
    const out = fillSeriesDays([
      { date: '2026-10-20', impressions: 5, clicks: 1, conversions: 0, spend: 100 },
      { date: '2026-10-22', impressions: 7, clicks: 2, conversions: 1, spend: 200 },
    ]);
    expect(out.map((p) => p.date)).toEqual(['2026-10-20', '2026-10-21', '2026-10-22']);
    expect(out[1]).toEqual({ date: '2026-10-21', impressions: 0, clicks: 0, conversions: 0, spend: 0 });
    expect(fillSeriesDays([])).toEqual([]);
  });

  it('extends a series to the end of the range', () => {
    const out = fillSeriesDays([{ date: '2026-10-20', impressions: 1, clicks: 0, conversions: 0, spend: 0 }], { until: '2026-10-22' });
    expect(out.map((p) => p.date)).toEqual(['2026-10-20', '2026-10-21', '2026-10-22']);
  });

  it('flags a variant over the platform limit from over_limit or from lengths', () => {
    expect(isOverLimit({ limit: 280, lengths: [19, 300], over_limit: [1] }, 1)).toBe(true);
    expect(isOverLimit({ limit: 280, lengths: [19, 300] }, 1)).toBe(true);
    expect(isOverLimit({ limit: 280, lengths: [19, 300], over_limit: [] }, 0)).toBe(false);
    expect(isOverLimit({ limit: null, lengths: [900] }, 0)).toBe(false);
    expect(isOverLimit(null, 0)).toBe(false);
  });

  it('counts characters, not UTF-16 units', () => {
    expect(charCount('Hi 🎉')).toBe(4);
  });

  it('renders definition chips, including old keys, without throwing', () => {
    expect(
      definitionChips({ location: 'Lagos', behaviour_tags: ['trial', 'mobile first'], channel_acquired: 'email', description: 'Small merchants', favourite_colour: 'green' })
    ).toEqual(['Location: Lagos', 'trial', 'mobile first', 'Found via Email', 'Small merchants', 'favourite_colour: green']);
    expect(definitionChips(null)).toEqual([]);
    expect(legacyDefinitionKeys({ location: 'Lagos', description: 'x' })).toEqual(['description']);
  });

  it('names the channels a launch started, and nothing else', () => {
    const ch = (key: string, status: string) => ({ id: key, key, status, notes: null }) as never;
    expect(
      channelsStartedByLaunch(
        [ch('email', 'not_started'), ch('search', 'active'), ch('events', 'not_started')],
        [ch('email', 'testing'), ch('search', 'active'), ch('events', 'not_started')]
      )
    ).toEqual(['Email is now Testing.']);
  });

  it('summarises the mix and the period honestly', () => {
    expect(summariseMix({ email: 60, search: 40 })).toBe('Email 60%, Search 40%');
    expect(summariseMix({})).toBe('No channel split set');
    expect(formatPeriod(null, null)).toBe('No period set');
    expect(formatPeriod('2026-10-20', '2026-11-03')).toMatch(/Oct 20, 2026 to Nov 3, 2026/);
    expect(formatPeriod('2026-10-20', null)).toMatch(/^From /);
  });
});

describe('request paths', () => {
  it('encodes ids so a crafted value cannot change the path', async () => {
    api().mockResolvedValueOnce(ok({}));
    await getCalendarEntry('../auth/me');
    expect(api().mock.calls[0][0]).toBe('/marketing/calendar-entries/..%2Fauth%2Fme');
  });
});

describe('analytics export in major units', () => {
  const src = 'date,scope,channel,campaign,metric,value\n2026-10-20,business,email,"Walk, push",spend,30000\n2026-10-20,business,email,,visits,77\n';
  it('converts spend to naira and adds a unit column', () => {
    expect(majorUnitsCsv(src)).toBe(
      'date,scope,channel,campaign,metric,value,unit\n2026-10-20,business,email,"Walk, push",spend,300,NGN\n2026-10-20,business,email,,visits,77,count\n'
    );
  });
  it('leaves a file that already has a unit column alone', () => {
    const withUnit = 'date,metric,value,unit\nx,spend,300,NGN\n';
    expect(majorUnitsCsv(withUnit)).toBe(withUnit);
  });
  it('shows CAC with two decimals everywhere', () => {
    expect(formatCac(32650)).toBe('₦326.50');
    expect(formatCac(53571)).toBe('₦535.71');
  });
});
