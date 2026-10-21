import { API_BASE, apiClient, ApiError } from './client';

// Typed client for the Marketing backend (Module 10), /api/v1/marketing/*.
// Shapes are copied from the live-captured FE integration guides in
// cofoundaz-api/docs/fe-integration-guide-marketing-*.md. Every function
// unwraps the `{data, meta}` envelope and returns the payload.
//
// Access is founder / team_member only; other roles get 403 FORBIDDEN, which
// `isForbiddenError` lets callers turn into a "not available for your role" state.

// ---------------------------------------------------------------- enums

export const CHANNEL_KEYS = [
  'organic_social',
  'paid_social',
  'search',
  'email',
  'content_seo',
  'partnerships',
  'events',
  'referral',
] as const;
export type ChannelKey = (typeof CHANNEL_KEYS)[number];

export type ContentStatus = 'draft' | 'scheduled' | 'published';
export type ChannelStatus = 'active' | 'testing' | 'paused' | 'not_started';
export type CampaignObjective = 'awareness' | 'leads' | 'sales' | 'launch';
export type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed';
export type AssetType = 'ad' | 'social_post' | 'email' | 'landing_headline' | 'product_description';
export type CopyTone = 'bold' | 'friendly' | 'expert' | 'playful';
export type GenerationStatus = 'generating' | 'ready' | 'failed';
export type MetricName = 'visits' | 'impressions' | 'clicks' | 'conversions' | 'spend';
export type AnalyticsRange = '7d' | '30d' | '90d';
export type PerformanceRange = AnalyticsRange | 'all';
export type FitLevel = 'high' | 'medium' | 'low';

export const CHECKLIST_KEYS = [
  'title_tag',
  'meta_description',
  'h1',
  'keyword_in_intro',
  'image_alt',
  'internal_links',
  'url_slug',
  'mobile_friendly',
] as const;
export type ChecklistKey = (typeof CHECKLIST_KEYS)[number];

// ---------------------------------------------------------------- shapes

export interface MarketingOverview {
  scheduled_this_week: number;
  active_channels: number;
  active_campaigns: number | null;
  top_channel_by_conversions: ChannelKey | null;
  ai_content_ideas: number | null;
}

/** An image for a post's media slot. `url` is storage-dependent: use it as given. */
export interface MarketingMedia {
  id: string;
  filename: string;
  content_type: string;
  size_bytes: number;
  url: string;
  created_at: string;
}

export interface CalendarEntry {
  id: string;
  startup_id: string;
  created_by: string | null;
  title: string;
  channel: ChannelKey;
  status: ContentStatus;
  body: string | null;
  media_ref: string | null;
  media_id: string | null;
  media: MarketingMedia | null;
  campaign_id: string | null;
  scheduled_at: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CalendarEntryInput {
  title: string;
  channel: ChannelKey;
  status?: ContentStatus;
  body?: string | null;
  media_id?: string | null;
  campaign_id?: string | null;
  scheduled_at?: string | null;
}
export type CalendarEntryPatch = Partial<CalendarEntryInput>;

export interface CalendarEntryQuery {
  from?: string;
  to?: string;
  channel?: ChannelKey;
  status?: ContentStatus;
  campaign_id?: string;
}

export interface ChannelStats30d {
  visits: number;
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  has_data: boolean;
}

export interface MarketingChannel {
  id: string;
  key: ChannelKey;
  status: ChannelStatus;
  notes: string | null;
  ai_fit_note?: string | null;
  fit_level?: FitLevel | null;
  fit_note_generated_at?: string | null;
  stats_30d?: ChannelStats30d;
}

/** The rule builder's fixed attribute list (GET /segments/attributes). */
export interface SegmentAttributes {
  text: string[];
  channel_acquired: ChannelKey[];
  behaviour_tags: { max_tags: number; max_length: number };
}

export interface Segment {
  id: string;
  startup_id: string;
  name: string;
  definition: Record<string, unknown>;
  est_size: number | null;
  persona_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface SegmentInput {
  name: string;
  definition?: Record<string, unknown>;
  est_size?: number | null;
  persona_id?: string | null;
}
export type SegmentPatch = Partial<SegmentInput>;

export type ChannelMix = Partial<Record<ChannelKey, number>>;

export interface CampaignMetrics {
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  click_through_rate: number;
  conversion_rate: number;
}

export interface Campaign {
  id: string;
  startup_id: string;
  name: string;
  objective: CampaignObjective;
  budget: number;
  channel_mix: ChannelMix;
  status: CampaignStatus;
  metrics: Partial<CampaignMetrics>;
  segment_ids: string[];
  period_start: string | null;
  period_end: string | null;
  launched_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CampaignInput {
  name: string;
  objective: CampaignObjective;
  budget?: number;
  channel_mix?: ChannelMix;
  segment_ids?: string[];
  period_start?: string | null;
  period_end?: string | null;
}
export type CampaignPatch = Partial<CampaignInput> & { status?: CampaignStatus };

export interface Keyword {
  id: string;
  keyword: string;
  volume: string | null;
  difficulty: number | null;
  current_rank: number | null;
  target_page: string | null;
  /** Always "manual": there is no SEO data provider. */
  source?: 'manual';
  /** When volume, difficulty or rank last changed; null if never entered. */
  metrics_updated_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface KeywordInput {
  keyword: string;
  volume?: string | null;
  difficulty?: number | null;
  current_rank?: number | null;
  target_page?: string | null;
}
export type KeywordPatch = Partial<KeywordInput>;

export interface TrackedPage {
  id: string;
  url: string;
  checklist: Record<ChecklistKey, boolean>;
  completed: number;
  total: number;
  created_at: string;
  updated_at: string;
}

export interface Positioning {
  audience: string | null;
  need: string | null;
  product: string | null;
  category: string | null;
  differentiator: string | null;
  statement: string | null;
}
export type PositioningInput = Omit<Positioning, 'statement'>;

// AI generations (copy, plan_week, channel_plan, channel_fit, content_gap)
export interface Generation<O> {
  id: string;
  startup_id: string;
  campaign_id?: string | null;
  kind: 'copy' | 'plan_week' | 'channel_plan' | 'channel_fit' | 'content_gap';
  status: GenerationStatus;
  inputs: Record<string, unknown>;
  output: O;
  error: string | null;
  created_at: string;
  updated_at: string;
  /** Only meaningful on content_gap runs (true = brand details changed since); null/absent on every other kind. */
  stale?: boolean | null;
}

export interface GenerationAccepted {
  id: string;
  status: GenerationStatus;
}

export type PlatformKey =
  | 'x'
  | 'instagram'
  | 'linkedin'
  | 'facebook'
  | 'whatsapp'
  | 'google_ads_headline'
  | 'google_ads_description'
  | 'email_subject';

export interface CopyPlatform {
  key: PlatformKey;
  label: string;
  limit: number;
  /** "hard": the platform rejects longer text. "recommended": longer works but is cut off or performs worse. */
  kind: 'hard' | 'recommended';
}

export interface CopyInput {
  asset_type: AssetType;
  tone: CopyTone;
  key_message: string;
  channel?: ChannelKey | null;
  platform?: PlatformKey | null;
  campaign_id?: string | null;
  audience_segment_id?: string | null;
  cta?: string | null;
}

export interface RefineInput {
  parentId: string;
  variantIndex: number;
  instruction: string;
}

export interface CopyOutput {
  variants?: string[];
  /** null when no platform was chosen. */
  limit?: number | null;
  platform?: PlatformKey | null;
  lengths?: number[];
  over_limit?: number[];
}
export type CopyGeneration = Generation<CopyOutput>;

export interface PlanWeekEntry {
  title: string;
  channel: ChannelKey;
  body: string;
  day_offset: number;
}
export type PlanWeekGeneration = Generation<{ entries?: PlanWeekEntry[] }>;

export interface ChannelPlanInput {
  objective: CampaignObjective;
  budget?: number | null;
}
export type ChannelPlanGeneration = Generation<{ channel_mix?: ChannelMix; rationale?: string }>;

export type FitNotesGeneration = Generation<{
  notes?: Partial<Record<ChannelKey, string>>;
  levels?: Partial<Record<ChannelKey, FitLevel>>;
}>;

export interface ContentGap {
  title: string;
  target_keyword: string;
  angle: string;
}
export type ContentGapGeneration = Generation<{ gaps?: ContentGap[] }>;

// Analytics
export interface MetricPoint {
  ts: string;
  metric: MetricName;
  value: number;
  channel?: ChannelKey | null;
  campaign_id?: string | null;
}

export interface RecordedMetric {
  id: string;
  ts: string;
  metric: MetricName;
  value: number;
  channel: ChannelKey | null;
  campaign_id: string | null;
  campaign_name: string | null;
  created_at: string;
}

export interface RecordedMetricsPage {
  metrics: RecordedMetric[];
  total: number;
  limit: number;
  offset: number;
}

export interface CampaignPerformance {
  campaign_id: string;
  name: string;
  range: PerformanceRange;
  totals: CampaignMetrics;
  /** One point per day that has data, ascending. */
  series: { date: string; impressions: number; clicks: number; conversions: number; spend: number }[];
  /** The campaign's channel_mix applied to its totals: always an estimate. */
  by_channel: {
    channel: ChannelKey;
    share_percent: number;
    impressions: number;
    clicks: number;
    conversions: number;
    spend: number;
    estimated: boolean;
  }[];
}

/** One pre-formatted figure. `value` is the raw number (kobo for money), `display` is what to render ("n/a" when not computable). */
export interface ReadoutFigure {
  value: number | null;
  display: string;
}
export type ReadoutMetric = 'spend' | 'impressions' | 'clicks' | 'ctr' | 'conversions' | 'cac';
export type ReadoutWindowFigures = Record<ReadoutMetric, ReadoutFigure>;

/** Computed by the API, a sibling of `output`. Null on rows written before the figures existed. */
export interface ReadoutFigures {
  this_week: ReadoutWindowFigures;
  last_week: ReadoutWindowFigures;
  all_time: ReadoutWindowFigures;
  change: ReadoutWindowFigures;
  windows: { this_week: { start: string; end: string }; last_week: { start: string; end: string } };
  days_live: ReadoutFigure;
  currency: string;
}

export interface CampaignReadout {
  id: string;
  campaign_id: string;
  week_start: string;
  status: GenerationStatus;
  output: {
    headline?: string;
    summary?: string;
    wins?: string[];
    watch?: string[];
    next_step?: string;
  } | null;
  figures?: ReadoutFigures | null;
  error: string | null;
  created_at: string;
}

export interface MarketingAnalytics {
  range: AnalyticsRange;
  traffic_by_week: { week_start: string; visits: number }[];
  cac_by_channel: {
    channel: ChannelKey;
    spend: number;
    conversions: number;
    cac: number | null;
    attributed_spend?: number;
    attributed_conversions?: number;
    /** True when campaign spend split by channel mix is included. */
    estimated?: boolean;
  }[];
  funnel: {
    impressions: number;
    clicks: number;
    conversions: number;
    click_through_rate: number;
    conversion_rate: number;
  };
  leaderboard: {
    campaign_id: string;
    name: string;
    clicks: number;
    conversions: number;
    spend: number;
    cac: number | null;
  }[];
}

// ---------------------------------------------------------------- errors

interface ErrorBody {
  error?: { code?: string; message?: string; field_errors?: { field: string; message: string }[] };
}

function errorBody(err: unknown): ErrorBody['error'] | undefined {
  if (!(err instanceof ApiError)) return undefined;
  const data = err.data as ErrorBody | string | null;
  if (data && typeof data === 'object') return data.error;
  return undefined;
}

/** Ids that arrive from a URL (?entry=, ?generation=, /campaigns/[id]) must look like UUIDs before they reach a request path. */
export const isUuid = (v: string | null | undefined): v is string =>
  typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);

/** 403 FORBIDDEN: the caller's membership role is not founder / team_member. */
export function isForbiddenError(err: unknown): boolean {
  if (!(err instanceof ApiError) || err.status !== 403) return false;
  const code = errorBody(err)?.code;
  return !code || code === 'FORBIDDEN';
}

export function fieldErrorsOf(err: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  for (const fe of errorBody(err)?.field_errors ?? []) {
    if (fe.field && !out[fe.field]) out[fe.field] = fe.message;
  }
  return out;
}

/** The API's own message. For field-level 422s the specific field message wins. */
export function marketingErrorMessage(err: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (err instanceof ApiError) {
    if (isForbiddenError(err)) return 'Marketing is not available for your role.';
    const body = errorBody(err);
    const first = body?.field_errors?.[0]?.message;
    if (err.status === 422 && first) return first;
    if (body?.message) return body.message;
    if (first) return first;
    return fallback;
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

// ---------------------------------------------------------------- helpers

interface Envelope<T> {
  data: T;
  meta?: unknown;
}

const BASE = '/marketing';

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await apiClient<Envelope<T>>(`${BASE}${path}`, init);
  return res.data;
}

function json(method: string, body?: unknown): RequestInit {
  return { method, body: body === undefined ? undefined : JSON.stringify(body) };
}

function qs(params: Record<string, string | undefined>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) sp.set(k, v);
  const s = sp.toString();
  return s ? `?${s}` : '';
}

// ---------------------------------------------------------------- overview

export const getOverview = () => call<MarketingOverview>('');

// ---------------------------------------------------------------- calendar

export async function listCalendarEntries(q: CalendarEntryQuery = {}): Promise<CalendarEntry[]> {
  const data = await call<{ entries: CalendarEntry[] }>(`/calendar-entries${qs({ ...q })}`);
  return data.entries;
}
export const getCalendarEntry = (id: string) => call<CalendarEntry>(`/calendar-entries/${encodeURIComponent(id)}`);
export const createCalendarEntry = (body: CalendarEntryInput) =>
  call<CalendarEntry>('/calendar-entries', json('POST', body));
export const updateCalendarEntry = (id: string, body: CalendarEntryPatch) =>
  call<CalendarEntry>(`/calendar-entries/${encodeURIComponent(id)}`, json('PATCH', body));
export const deleteCalendarEntry = (id: string) =>
  call<{ deleted: boolean }>(`/calendar-entries/${encodeURIComponent(id)}`, json('DELETE'));

export const startPlanWeek = () => call<GenerationAccepted>('/calendar/plan-week', json('POST', {}));
export const getPlanWeek = (id: string) => call<PlanWeekGeneration>(`/calendar/plan-week/${encodeURIComponent(id)}`);

// ---------------------------------------------------------------- channels

export const listChannels = () => call<MarketingChannel[]>('/channels');
export const updateChannel = (key: ChannelKey, body: { status?: ChannelStatus; notes?: string | null }) =>
  call<MarketingChannel>(`/channels/${encodeURIComponent(key)}`, json('PATCH', body));

export const startFitNotes = () => call<GenerationAccepted>('/channels/fit-notes/generate', json('POST', {}));
export const getFitNotes = (id: string) => call<FitNotesGeneration>(`/channels/fit-notes/${encodeURIComponent(id)}`);

export const startChannelPlan = (body: ChannelPlanInput) =>
  call<GenerationAccepted>('/channel-plan/recommend', json('POST', body));
export const getChannelPlan = (id: string) =>
  call<ChannelPlanGeneration>(`/channel-plan/recommendations/${encodeURIComponent(id)}`);

// ---------------------------------------------------------------- segments

export async function listSegments(): Promise<Segment[]> {
  return (await call<{ segments: Segment[] }>('/segments')).segments;
}
export const createSegment = (body: SegmentInput) => call<Segment>('/segments', json('POST', body));
export const updateSegment = (id: string, body: SegmentPatch) =>
  call<Segment>(`/segments/${encodeURIComponent(id)}`, json('PATCH', body));
export const deleteSegment = (id: string) => call<{ deleted: boolean }>(`/segments/${encodeURIComponent(id)}`, json('DELETE'));
export const getSegmentAttributes = () => call<SegmentAttributes>('/segments/attributes');
export async function listSegmentCampaigns(id: string): Promise<Campaign[]> {
  return (await call<{ campaigns: Campaign[] }>(`/segments/${encodeURIComponent(id)}/campaigns`)).campaigns;
}

// ---------------------------------------------------------------- campaigns

export async function listCampaigns(): Promise<Campaign[]> {
  return (await call<{ campaigns: Campaign[] }>('/campaigns')).campaigns;
}
export const getCampaign = (id: string) => call<Campaign>(`/campaigns/${encodeURIComponent(id)}`);
export const getCampaignPerformance = (id: string, range: PerformanceRange = 'all') =>
  call<CampaignPerformance>(`/campaigns/${encodeURIComponent(id)}/performance${qs({ range })}`);
export async function listCampaignReadouts(id: string): Promise<CampaignReadout[]> {
  return (await call<{ readouts: CampaignReadout[] }>(`/campaigns/${encodeURIComponent(id)}/readouts`)).readouts;
}
export const createCampaign = (body: CampaignInput) => call<Campaign>('/campaigns', json('POST', body));
export const updateCampaign = (id: string, body: CampaignPatch) =>
  call<Campaign>(`/campaigns/${encodeURIComponent(id)}`, json('PATCH', body));
export const deleteCampaign = (id: string) => call<{ deleted: boolean }>(`/campaigns/${encodeURIComponent(id)}`, json('DELETE'));

// ---------------------------------------------------------------- copy

export const startCopy = (body: CopyInput) => call<GenerationAccepted>('/copy/generate', json('POST', body));
export const getCopy = (id: string) => call<CopyGeneration>(`/copy/generations/${encodeURIComponent(id)}`);
export async function listCopyGenerations(campaignId?: string): Promise<CopyGeneration[]> {
  return (await call<{ generations: CopyGeneration[] }>(`/copy/generations${qs({ campaign_id: campaignId })}`))
    .generations;
}
export async function listCopyPlatforms(): Promise<CopyPlatform[]> {
  return (await call<{ platforms: CopyPlatform[] }>('/copy/platforms')).platforms;
}
/** Refine one variant. Creates a NEW generation linked through `inputs.refine`; the parent is untouched. */
export const refineCopy = ({ parentId, variantIndex, instruction }: RefineInput) =>
  call<GenerationAccepted>(
    `/copy/generations/${encodeURIComponent(parentId)}/refine`,
    json('POST', { variant_index: variantIndex, instruction })
  );

// ---------------------------------------------------------------- SEO

export async function listKeywords(): Promise<Keyword[]> {
  return (await call<{ keywords: Keyword[] }>('/keywords')).keywords;
}
export const createKeyword = (body: KeywordInput) => call<Keyword>('/keywords', json('POST', body));
export const updateKeyword = (id: string, body: KeywordPatch) =>
  call<Keyword>(`/keywords/${encodeURIComponent(id)}`, json('PATCH', body));
export const deleteKeyword = (id: string) => call<{ deleted: boolean }>(`/keywords/${encodeURIComponent(id)}`, json('DELETE'));

export async function listTrackedPages(): Promise<TrackedPage[]> {
  return (await call<{ pages: TrackedPage[] }>('/seo/pages')).pages;
}
export const createTrackedPage = (url: string) => call<TrackedPage>('/seo/pages', json('POST', { url }));
export const updateTrackedPage = (id: string, checklist: Partial<Record<ChecklistKey, boolean>>) =>
  call<TrackedPage>(`/seo/pages/${encodeURIComponent(id)}`, json('PATCH', { checklist }));
export const deleteTrackedPage = (id: string) =>
  call<{ deleted: boolean }>(`/seo/pages/${encodeURIComponent(id)}`, json('DELETE'));

export const getPositioning = () => call<Positioning>('/positioning');
// PUT is full-replace: always send all five parts.
export const savePositioning = (body: PositioningInput) => call<Positioning>('/positioning', json('PUT', body));

export const startContentGaps = () => call<GenerationAccepted>('/seo/content-gaps/generate', json('POST', {}));
export const getContentGap = (id: string) => call<ContentGapGeneration>(`/seo/content-gaps/${encodeURIComponent(id)}`);
export async function listContentGaps(): Promise<ContentGapGeneration[]> {
  return (await call<{ generations: ContentGapGeneration[] }>('/seo/content-gaps')).generations;
}

// ---------------------------------------------------------------- analytics

export const ingestMetrics = (points: MetricPoint[]) =>
  call<{ created: number }>('/metrics', json('POST', { points }));
export async function listRecordedMetrics(range: AnalyticsRange, limit = 25, offset = 0): Promise<RecordedMetricsPage> {
  return call<RecordedMetricsPage>(`/metrics${qs({ range, limit: String(limit), offset: String(offset) })}`);
}
export const deleteMetric = (id: string) => call<{ deleted: boolean }>(`/metrics/${encodeURIComponent(id)}`, json('DELETE'));

/**
 * GET /analytics/export is text/csv, not the JSON envelope, so a plain link cannot send the
 * bearer header. Fetch it as a blob. Errors (a bad range) are the usual JSON 422.
 */
export async function exportAnalyticsCsv(range: AnalyticsRange): Promise<{ blob: Blob; filename: string }> {
  const headers = new Headers();
  const token = typeof window !== 'undefined' ? localStorage.getItem('cf_token') : null;
  const workspaceId = typeof window !== 'undefined' ? localStorage.getItem('cf_workspace_id') : null;
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (workspaceId) headers.set('X-Workspace-Id', workspaceId);
  const res = await fetch(`${API_BASE}${BASE}/analytics/export${qs({ range })}`, { headers });
  if (!res.ok) {
    let data: unknown = null;
    try {
      data = await res.json();
    } catch {
      /* not JSON */
    }
    throw new ApiError(res.status, res.statusText, data);
  }
  const disposition = res.headers.get('content-disposition') ?? '';
  const filename = /filename="?([^";]+)"?/.exec(disposition)?.[1] ?? `marketing-metrics-${range}.csv`;
  const text = await res.text();
  return { blob: new Blob([majorUnitsCsv(text)], { type: 'text/csv;charset=utf-8' }), filename };
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') { row.push(cell); cell = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(cell); rows.push(row); row = []; cell = '';
    } else cell += ch;
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

const csvCell = (v: string) => (/[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

/**
 * The API writes `spend` in minor units with no unit. Rewrite spend rows to naira (what the page
 * shows) and add a `unit` column, so the file matches the screen. A file that already has a
 * `unit` column is left alone.
 */
export function majorUnitsCsv(text: string): string {
  const rows = parseCsv(text);
  if (rows.length === 0) return text;
  const header = rows[0];
  const metricIdx = header.indexOf('metric');
  const valueIdx = header.indexOf('value');
  if (metricIdx < 0 || valueIdx < 0 || header.includes('unit')) return text;
  const out = [[...header, 'unit']];
  for (const r of rows.slice(1)) {
    if (r.length === 1 && r[0] === '') continue;
    if (r[metricIdx] === 'spend' && r[valueIdx] !== '' && !Number.isNaN(Number(r[valueIdx]))) {
      const major = Number(r[valueIdx]) / 100;
      out.push([...r.slice(0, valueIdx), String(major), ...r.slice(valueIdx + 1), 'NGN']);
    } else out.push([...r, 'count']);
  }
  return out.map((r) => r.map(csvCell).join(',')).join('\n') + '\n';
}

// ---------------------------------------------------------------- media

export const MEDIA_MAX_BYTES = 5 * 1024 * 1024;
export const MEDIA_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];

/**
 * GET /media/{id}/file returns the image bytes but needs the bearer header, which an <img src> cannot
 * send. Fetch it as a blob; the caller owns the object URL and must revoke it.
 */
export async function fetchMediaBlob(id: string, signal?: AbortSignal): Promise<Blob> {
  const headers = new Headers();
  const token = typeof window !== 'undefined' ? localStorage.getItem('cf_token') : null;
  const workspaceId = typeof window !== 'undefined' ? localStorage.getItem('cf_workspace_id') : null;
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (workspaceId) headers.set('X-Workspace-Id', workspaceId);
  const res = await fetch(`${API_BASE}${BASE}/media/${encodeURIComponent(id)}/file`, { headers, signal });
  if (!res.ok) throw new ApiError(res.status, res.statusText, null);
  return res.blob();
}

export async function listMedia(): Promise<MarketingMedia[]> {
  return (await call<{ media: MarketingMedia[] }>('/media')).media;
}
export function uploadMedia(file: File): Promise<MarketingMedia> {
  const body = new FormData();
  body.append('file', file);
  return call<MarketingMedia>('/media', { method: 'POST', body });
}
export const deleteMedia = (id: string) => call<{ deleted: boolean }>(`/media/${encodeURIComponent(id)}`, json('DELETE'));

export const getAnalytics = (range: AnalyticsRange = '30d') =>
  call<MarketingAnalytics>(`/analytics${qs({ range })}`);

// ---------------------------------------------------------------- formatting / pure helpers

/** Money fields are integer minor units (cents/kobo). Platform default currency is NGN. */
export function formatMoney(minor: number | null | undefined): string {
  if (minor === null || minor === undefined) return '-';
  const major = minor / 100;
  return `₦${major.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

/** Cost per customer is a small figure, so it always shows two decimals (cards and leaderboard agree). */
export function formatCac(minor: number | null | undefined): string {
  if (minor === null || minor === undefined) return '-';
  return `₦${(minor / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export const CHANNEL_LABELS: Record<ChannelKey, string> = {
  organic_social: 'Organic social',
  paid_social: 'Paid social',
  search: 'Search',
  email: 'Email',
  content_seo: 'Content / SEO',
  partnerships: 'Partnerships',
  events: 'Events',
  referral: 'Referral',
};

/** Fill weeks with no visits (the API omits them) so charts draw a continuous axis. */
export function gapFillWeeks(
  rows: { week_start: string; visits: number }[]
): { week_start: string; visits: number }[] {
  if (rows.length === 0) return [];
  const byWeek = new Map(rows.map((r) => [r.week_start, r.visits]));
  const sorted = [...byWeek.keys()].sort();
  const out: { week_start: string; visits: number }[] = [];
  const cursor = new Date(`${sorted[0]}T00:00:00Z`);
  const last = new Date(`${sorted[sorted.length - 1]}T00:00:00Z`);
  while (cursor <= last) {
    const key = cursor.toISOString().slice(0, 10);
    out.push({ week_start: key, visits: byWeek.get(key) ?? 0 });
    cursor.setUTCDate(cursor.getUTCDate() + 7);
  }
  return out;
}

/** Local midnight of `base` plus `dayOffset` days, 09:00 local, as an ISO instant. */
export function planDayToIso(base: Date, dayOffset: number): string {
  const d = new Date(base.getFullYear(), base.getMonth(), base.getDate() + dayOffset, 9, 0, 0, 0);
  return d.toISOString();
}

/**
 * Daily series with the missing days filled with zeros. The API sends one point per day that has data.
 * `until` defaults to the last day with data; pass today to draw the tail of a range.
 */
export function fillSeriesDays(
  series: CampaignPerformance['series'],
  opts: { from?: string; until?: string } = {}
): CampaignPerformance['series'] {
  if (series.length === 0) return [];
  const byDay = new Map(series.map((p) => [p.date, p]));
  const days = [...byDay.keys()].sort();
  const start = opts.from && opts.from < days[0] ? opts.from : days[0];
  const end = opts.until && opts.until > days[days.length - 1] ? opts.until : days[days.length - 1];
  const out: CampaignPerformance['series'] = [];
  const cursor = new Date(`${start}T00:00:00Z`);
  const last = new Date(`${end}T00:00:00Z`);
  while (cursor <= last) {
    const key = cursor.toISOString().slice(0, 10);
    out.push(byDay.get(key) ?? { date: key, impressions: 0, clicks: 0, conversions: 0, spend: 0 });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return out;
}

/** Is variant `index` over the platform limit? Trusts `over_limit`, falls back to lengths vs limit. */
export function isOverLimit(output: CopyOutput | null | undefined, index: number): boolean {
  if (!output) return false;
  if (output.over_limit?.includes(index)) return true;
  const len = output.lengths?.[index];
  return typeof output.limit === 'number' && typeof len === 'number' && len > output.limit;
}

/** Text length of a variant against a platform limit (counts characters, not UTF-16 units). */
export function charCount(text: string): number {
  return Array.from(text).length;
}

/** The calendar channel a platform belongs to, for a draft made from copy written for it. */
export const PLATFORM_CHANNEL: Record<PlatformKey, ChannelKey> = {
  x: 'organic_social',
  instagram: 'organic_social',
  linkedin: 'organic_social',
  facebook: 'organic_social',
  whatsapp: 'organic_social',
  google_ads_headline: 'search',
  google_ads_description: 'search',
  email_subject: 'email',
};

export const FIT_LABELS: Record<FitLevel, string> = { high: 'High fit', medium: 'Medium fit', low: 'Low fit' };

export const SEGMENT_TEXT_LABELS: Record<string, string> = {
  location: 'Location',
  business_type: 'Business type',
  company_size: 'Company size',
  income_band: 'Income band',
};

/** Definition chips as "Label: value". Unknown (legacy) keys render as plain chips and never throw. */
export function definitionChips(definition: Record<string, unknown> | null | undefined): string[] {
  if (!definition) return [];
  const chips: string[] = [];
  for (const [key, value] of Object.entries(definition)) {
    if (key === 'behaviour_tags' && Array.isArray(value)) {
      for (const t of value) if (typeof t === 'string' && t.trim()) chips.push(t.trim());
    } else if (key === 'channel_acquired' && typeof value === 'string') {
      chips.push(`Found via ${CHANNEL_LABELS[value as ChannelKey] ?? value}`);
    } else if (key === 'description' && typeof value === 'string') {
      if (value.trim()) chips.push(value.trim());
    } else if (typeof value === 'string' && value.trim()) {
      chips.push(`${SEGMENT_TEXT_LABELS[key] ?? key}: ${value.trim()}`);
    } else if (typeof value === 'number') {
      chips.push(`${SEGMENT_TEXT_LABELS[key] ?? key}: ${value}`);
    }
  }
  return chips;
}

/** Keys the rule builder stores. Anything else on an old segment is dropped on the next save. */
export const DEFINITION_KEYS = [
  'location',
  'business_type',
  'company_size',
  'income_band',
  'channel_acquired',
  'behaviour_tags',
] as const;

export function legacyDefinitionKeys(definition: Record<string, unknown> | null | undefined): string[] {
  return Object.keys(definition ?? {}).filter((k) => !(DEFINITION_KEYS as readonly string[]).includes(k));
}

export const OBJECTIVE_LABELS: Record<CampaignObjective, string> = {
  awareness: 'Awareness',
  leads: 'Leads',
  sales: 'Sales',
  launch: 'Launch',
};

export const CHANNEL_STATUS_LABELS: Record<ChannelStatus, string> = {
  active: 'Active',
  testing: 'Testing',
  paused: 'Paused',
  not_started: 'Not started',
};

/** Channels a launch moved from Not started to Testing (D-MKT-4), as readable sentences. */
export function channelsStartedByLaunch(before: MarketingChannel[], after: MarketingChannel[]): string[] {
  const was = new Map(before.map((c) => [c.key, c.status]));
  return after
    .filter((c) => was.get(c.key) !== undefined && was.get(c.key) !== c.status && c.status === 'testing')
    .map((c) => `${CHANNEL_LABELS[c.key]} is now Testing.`);
}

/** "Email 60%, Search 40%" or a plain sentence when no split is set. */
export function summariseMix(mix: ChannelMix): string {
  const parts = Object.entries(mix)
    .filter(([, v]) => (v ?? 0) > 0)
    .map(([k, v]) => `${CHANNEL_LABELS[k as ChannelKey]} ${Math.round(v ?? 0)}%`);
  return parts.length ? parts.join(', ') : 'No channel split set';
}

/** "Oct 20 to Nov 3", "From Oct 20", "Until Nov 3" or "No period set". */
export function formatPeriod(start: string | null, end: string | null): string {
  const fmt = (iso: string) =>
    new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  if (start && end) return `${fmt(start)} to ${fmt(end)}`;
  if (start) return `From ${fmt(start)}`;
  if (end) return `Until ${fmt(end)}`;
  return 'No period set';
}
