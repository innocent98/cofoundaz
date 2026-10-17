import { apiClient, ApiError } from './client';

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

export interface CalendarEntry {
  id: string;
  startup_id: string;
  created_by: string | null;
  title: string;
  channel: ChannelKey;
  status: ContentStatus;
  body: string | null;
  media_ref: string | null;
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
  media_ref?: string | null;
  scheduled_at?: string | null;
}
export type CalendarEntryPatch = Partial<CalendarEntryInput>;

export interface CalendarEntryQuery {
  from?: string;
  to?: string;
  channel?: ChannelKey;
  status?: ContentStatus;
}

export interface MarketingChannel {
  id: string;
  key: ChannelKey;
  status: ChannelStatus;
  notes: string | null;
  ai_fit_note?: string | null;
  fit_note_generated_at?: string | null;
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

export interface Campaign {
  id: string;
  startup_id: string;
  name: string;
  objective: CampaignObjective;
  budget: number;
  channel_mix: ChannelMix;
  status: CampaignStatus;
  metrics: Record<string, unknown>;
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
  kind: 'copy' | 'plan_week' | 'channel_plan' | 'channel_fit' | 'content_gap';
  status: GenerationStatus;
  inputs: Record<string, unknown>;
  output: O;
  error: string | null;
  created_at: string;
  updated_at: string;
}

export interface GenerationAccepted {
  id: string;
  status: GenerationStatus;
}

export interface CopyInput {
  asset_type: AssetType;
  tone: CopyTone;
  key_message: string;
  channel?: ChannelKey | null;
  audience_segment_id?: string | null;
  cta?: string | null;
}
export type CopyOutput = { variants?: string[] };
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

export type FitNotesGeneration = Generation<{ notes?: Partial<Record<ChannelKey, string>> }>;

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

export interface MarketingAnalytics {
  range: AnalyticsRange;
  traffic_by_week: { week_start: string; visits: number }[];
  cac_by_channel: { channel: ChannelKey; spend: number; conversions: number; cac: number | null }[];
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
export const createCalendarEntry = (body: CalendarEntryInput) =>
  call<CalendarEntry>('/calendar-entries', json('POST', body));
export const updateCalendarEntry = (id: string, body: CalendarEntryPatch) =>
  call<CalendarEntry>(`/calendar-entries/${id}`, json('PATCH', body));
export const deleteCalendarEntry = (id: string) =>
  call<{ deleted: boolean }>(`/calendar-entries/${id}`, json('DELETE'));

export const startPlanWeek = () => call<GenerationAccepted>('/calendar/plan-week', json('POST', {}));
export const getPlanWeek = (id: string) => call<PlanWeekGeneration>(`/calendar/plan-week/${id}`);

// ---------------------------------------------------------------- channels

export const listChannels = () => call<MarketingChannel[]>('/channels');
export const updateChannel = (key: ChannelKey, body: { status?: ChannelStatus; notes?: string | null }) =>
  call<MarketingChannel>(`/channels/${key}`, json('PATCH', body));

export const startFitNotes = () => call<GenerationAccepted>('/channels/fit-notes/generate', json('POST', {}));
export const getFitNotes = (id: string) => call<FitNotesGeneration>(`/channels/fit-notes/${id}`);

export const startChannelPlan = (body: ChannelPlanInput) =>
  call<GenerationAccepted>('/channel-plan/recommend', json('POST', body));
export const getChannelPlan = (id: string) =>
  call<ChannelPlanGeneration>(`/channel-plan/recommendations/${id}`);

// ---------------------------------------------------------------- segments

export async function listSegments(): Promise<Segment[]> {
  return (await call<{ segments: Segment[] }>('/segments')).segments;
}
export const createSegment = (body: SegmentInput) => call<Segment>('/segments', json('POST', body));
export const updateSegment = (id: string, body: SegmentPatch) =>
  call<Segment>(`/segments/${id}`, json('PATCH', body));
export const deleteSegment = (id: string) => call<{ deleted: boolean }>(`/segments/${id}`, json('DELETE'));
export async function listSegmentCampaigns(id: string): Promise<Campaign[]> {
  return (await call<{ campaigns: Campaign[] }>(`/segments/${id}/campaigns`)).campaigns;
}

// ---------------------------------------------------------------- campaigns

export async function listCampaigns(): Promise<Campaign[]> {
  return (await call<{ campaigns: Campaign[] }>('/campaigns')).campaigns;
}
export const createCampaign = (body: CampaignInput) => call<Campaign>('/campaigns', json('POST', body));
export const updateCampaign = (id: string, body: CampaignPatch) =>
  call<Campaign>(`/campaigns/${id}`, json('PATCH', body));
export const deleteCampaign = (id: string) => call<{ deleted: boolean }>(`/campaigns/${id}`, json('DELETE'));

// ---------------------------------------------------------------- copy

export const startCopy = (body: CopyInput) => call<GenerationAccepted>('/copy/generate', json('POST', body));
export const getCopy = (id: string) => call<CopyGeneration>(`/copy/generations/${id}`);
export async function listCopyGenerations(): Promise<CopyGeneration[]> {
  return (await call<{ generations: CopyGeneration[] }>('/copy/generations')).generations;
}

// ---------------------------------------------------------------- SEO

export async function listKeywords(): Promise<Keyword[]> {
  return (await call<{ keywords: Keyword[] }>('/keywords')).keywords;
}
export const createKeyword = (body: KeywordInput) => call<Keyword>('/keywords', json('POST', body));
export const updateKeyword = (id: string, body: KeywordPatch) =>
  call<Keyword>(`/keywords/${id}`, json('PATCH', body));
export const deleteKeyword = (id: string) => call<{ deleted: boolean }>(`/keywords/${id}`, json('DELETE'));

export async function listTrackedPages(): Promise<TrackedPage[]> {
  return (await call<{ pages: TrackedPage[] }>('/seo/pages')).pages;
}
export const createTrackedPage = (url: string) => call<TrackedPage>('/seo/pages', json('POST', { url }));
export const updateTrackedPage = (id: string, checklist: Partial<Record<ChecklistKey, boolean>>) =>
  call<TrackedPage>(`/seo/pages/${id}`, json('PATCH', { checklist }));
export const deleteTrackedPage = (id: string) =>
  call<{ deleted: boolean }>(`/seo/pages/${id}`, json('DELETE'));

export const getPositioning = () => call<Positioning>('/positioning');
// PUT is full-replace: always send all five parts.
export const savePositioning = (body: PositioningInput) => call<Positioning>('/positioning', json('PUT', body));

export const startContentGaps = () => call<GenerationAccepted>('/seo/content-gaps/generate', json('POST', {}));
export const getContentGap = (id: string) => call<ContentGapGeneration>(`/seo/content-gaps/${id}`);
export async function listContentGaps(): Promise<ContentGapGeneration[]> {
  return (await call<{ generations: ContentGapGeneration[] }>('/seo/content-gaps')).generations;
}

// ---------------------------------------------------------------- analytics

export const ingestMetrics = (points: MetricPoint[]) =>
  call<{ created: number }>('/metrics', json('POST', { points }));
export const getAnalytics = (range: AnalyticsRange = '30d') =>
  call<MarketingAnalytics>(`/analytics${qs({ range })}`);

// ---------------------------------------------------------------- formatting / pure helpers

/** Money fields are integer minor units (cents/kobo). Platform default currency is NGN. */
export function formatMoney(minor: number | null | undefined): string {
  if (minor === null || minor === undefined) return '-';
  const major = minor / 100;
  return `₦${major.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
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
