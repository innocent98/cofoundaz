import { apiClient } from './client';

export type AIContentStatus = 'empty' | 'generating' | 'ready' | 'restricted';

export interface DashboardSectionError {
  error: true;
  message?: string;
  [key: string]: unknown;
}

export function isSectionError(section: unknown): section is DashboardSectionError {
  return typeof section === 'object' && section !== null && (section as DashboardSectionError).error === true;
}

export interface DashboardGreeting {
  first_name?: string | null;
  startup_name?: string | null;
  salutation?: string | null;
  [key: string]: unknown;
}

export interface DashboardHealthData {
  score?: number;
  delta_7d?: number | null;
  status?: string;
  band?: string;
  summary?: string;
  [key: string]: unknown;
}
export type DashboardHealthSection = DashboardHealthData | DashboardSectionError;

export interface RawMissionTask {
  id: string;
  title: string;
  reason?: string | null;
  order?: number;
  status?: string;
  completed_at?: string | null;
  [key: string]: unknown;
}

export type MissionEmptyReason = 'weekend_off' | 'all_caught_up' | null;

export interface DashboardMissionData {
  streak?: number;
  status?: string;
  tasks?: RawMissionTask[];
  /** Why the task list is empty (null when there are tasks). */
  empty_reason?: MissionEmptyReason | string | null;
  [key: string]: unknown;
}
export type DashboardMissionSection = DashboardMissionData | DashboardSectionError | null;

export interface DashboardUpcomingItem {
  id?: string;
  title: string;
  /** ISO date (YYYY-MM-DD) the milestone is due. */
  due_on?: string | null;
  milestone_id?: string;
  type?: string;
  date?: string;
  time?: string;
  badge?: string;
  [key: string]: unknown;
}
export type DashboardUpcomingSection = DashboardUpcomingItem[] | { items: DashboardUpcomingItem[] } | DashboardSectionError;

export type KpiMetricStatus = 'ok' | 'no_data' | 'restricted' | 'not_built' | 'not_burning' | 'out_of_cash';

/** Week-over-week change plus the last 14 daily snapshots (BE guide section 7a). */
export interface DashboardTrend {
  /** Current minus the snapshot exactly 7 days ago; null during a workspace's first week. */
  delta: number | null;
  series: Array<{ period: string; value: number }>;
}

export interface DashboardRevenueMetric {
  trend?: DashboardTrend;
  status: KpiMetricStatus;
  /** Minor units (kobo). Average monthly inflow over the trailing 3 months. */
  value_minor: number | null;
  currency: string | null;
  basis?: string;
}

export interface DashboardRunwayMetric {
  trend?: DashboardTrend;
  status: KpiMetricStatus;
  months: number | null;
  /** Always a boolean; drives the alert styling. */
  is_low: boolean;
  monthly_burn_minor: number | null;
  /** Minor units; can be negative when out of cash. */
  cash_on_hand_minor: number | null;
  currency: string | null;
}

export interface DashboardPipelineMetric {
  status: KpiMetricStatus;
  value_minor: number | null;
  currency: string | null;
}

export interface DashboardCtrMetric {
  trend?: DashboardTrend;
  status: KpiMetricStatus;
  /** Already a percentage: 2.5 means 2.5%. */
  ctr_percent: number | null;
  impressions: number | null;
  clicks: number | null;
  range?: string;
}

/** A single tile whose source query failed; the other tiles are unaffected. */
export interface DashboardMetricError {
  error: true;
}

export interface DashboardKpiMetrics {
  revenue?: DashboardRevenueMetric | DashboardMetricError;
  runway?: DashboardRunwayMetric | DashboardMetricError;
  pipeline?: DashboardPipelineMetric | DashboardMetricError;
  campaign_ctr?: DashboardCtrMetric | DashboardMetricError;
}

export interface DashboardKpisData {
  metrics?: DashboardKpiMetrics;
  tasks_done_this_week?: number | null;
  tasks_trend?: DashboardTrend;
  /** Legacy scalar keys: still sent, always null. Read `metrics` instead. */
  revenue?: number | null;
  runway?: number | null;
  pipeline_value?: number | null;
  campaign_performance?: number | string | null;
  [key: string]: unknown;
}
export type DashboardKpisSection = DashboardKpisData | DashboardSectionError;

export interface DashboardCalibrationData {
  assessment_complete?: boolean;
  step?: number | string;
  [key: string]: unknown;
}
export type DashboardCalibrationSection = DashboardCalibrationData | DashboardSectionError;

export interface BriefingActionData {
  index: number;
  label: string;
  /** `task` adds the label to today's mission; `navigate` goes to `href`. */
  kind: 'task' | 'navigate' | string;
  href: string | null;
  accepted: boolean;
  mission_task_id: string | null;
}

export interface DashboardBriefingData {
  id?: string | null;
  date?: string;
  status?: AIContentStatus;
  message?: string | null;
  content?: string | null;
  actions?: BriefingActionData[];
  [key: string]: unknown;
}
export type DashboardBriefingSection = DashboardBriefingData | DashboardSectionError;

export interface RawRiskItem {
  index: number;
  severity: 'high' | 'medium' | 'low' | string;
  text: string;
  /** Server-mapped module route; can be null (render the row without a CTA). */
  href: string | null;
  [key: string]: unknown;
}
export interface DashboardRisksData {
  status?: AIContentStatus;
  message?: string | null;
  items?: RawRiskItem[];
  [key: string]: unknown;
}
export type DashboardRisksSection = DashboardRisksData | DashboardSectionError;

export interface RawOpportunityItem {
  index: number;
  text: string;
  href: string | null;
  [key: string]: unknown;
}
export interface DashboardOpportunitiesData {
  status?: AIContentStatus;
  message?: string | null;
  items?: RawOpportunityItem[];
  [key: string]: unknown;
}
export type DashboardOpportunitiesSection = DashboardOpportunitiesData | DashboardSectionError;

export interface DashboardSummaryData {
  greeting?: DashboardGreeting | null;
  health?: DashboardHealthSection | null;
  mission?: DashboardMissionSection;
  upcoming?: DashboardUpcomingSection | null;
  kpis?: DashboardKpisSection | null;
  calibration?: DashboardCalibrationSection | null;
  briefing?: DashboardBriefingSection | null;
  risks?: DashboardRisksSection | null;
  opportunities?: DashboardOpportunitiesSection | null;
  [key: string]: unknown;
}

export interface ApiResponseEnvelope<T> {
  data: T;
  meta?: Record<string, unknown>;
}

export type DashboardSummaryResponse = ApiResponseEnvelope<DashboardSummaryData>;

export interface DashboardActor {
  id?: string;
  name: string | null;
  email?: string | null;
  avatar_url?: string | null;
  role?: string | null;
  [key: string]: unknown;
}

export interface DashboardActivityItem {
  id: string;
  actor: DashboardActor | null;
  /** Ready-to-render sentence, e.g. "Ade rejected 'QA snooze check'". */
  summary?: string;
  /** Dotted action key, e.g. "mission.task.completed". */
  action?: string;
  entity_type?: string;
  entity_id?: string;
  /** ISO timestamp the event occurred — the real API field (not `timestamp`). */
  created_at?: string;
  // Legacy/compat fields (not emitted by the current API; kept optional):
  verb?: string;
  entity?: string;
  timestamp?: string;
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface DashboardActivityData {
  items: DashboardActivityItem[];
  next_cursor: string | null;
  total_estimate?: number;
}

export type DashboardActivityResponse = ApiResponseEnvelope<DashboardActivityData>;

/**
 * Fetches the founder dashboard summary (health, mission, kpis, AI briefing, etc.).
 * Calls GET /api/v1/dashboard/summary via apiClient.
 */
export async function getDashboardSummary(): Promise<DashboardSummaryResponse> {
  const res = await apiClient<DashboardSummaryResponse | DashboardSummaryData>('/dashboard/summary');
  if (res && typeof res === 'object' && 'data' in res && res.data) {
    return res as DashboardSummaryResponse;
  }
  return { data: res as DashboardSummaryData };
}

/**
 * Fetches the paginated activity feed for the dashboard.
 * Calls GET /api/v1/dashboard/activity via apiClient with keyset cursor and optional limit.
 */
export async function getDashboardActivity(
  cursor?: string,
  limit?: number
): Promise<DashboardActivityResponse> {
  const params = new URLSearchParams();
  if (cursor) params.set('cursor', cursor);
  if (limit !== undefined && limit !== null) params.set('limit', String(limit));

  const query = params.toString();
  const endpoint = `/dashboard/activity${query ? `?${query}` : ''}`;
  const res = await apiClient<
    | DashboardActivityResponse
    | DashboardActivityData
    | DashboardActivityItem[]
    | { items?: DashboardActivityItem[]; next_cursor?: string | null; meta?: Record<string, unknown> }
  >(endpoint);

  // Normalize into standard { data: { items, next_cursor }, meta } envelope
  if ('data' in res && res.data && Array.isArray((res.data as DashboardActivityData).items)) {
    return {
      data: {
        items: (res.data as DashboardActivityData).items,
        next_cursor: (res.data as DashboardActivityData).next_cursor ?? null,
        total_estimate: (res.data as DashboardActivityData).total_estimate,
      },
      meta: (res as DashboardActivityResponse).meta,
    };
  }

  if ('items' in res && Array.isArray(res.items)) {
    return {
      data: {
        items: res.items,
        next_cursor: res.next_cursor ?? null,
      },
      meta: (res as { meta?: Record<string, unknown> }).meta,
    };
  }

  if (Array.isArray(res)) {
    return {
      data: {
        items: res,
        next_cursor: null,
      },
    };
  }

  return {
    data: {
      items: [],
      next_cursor: null,
    },
  };
}

export interface BriefingAcceptResult {
  action_index: number;
  kind: 'task' | 'navigate' | string;
  href: string | null;
  mission_task: { id: string; title: string } | null;
}

/**
 * POST /dashboard/briefing/{id}/actions/{index}/accept. Idempotent: a repeat call
 * returns the same mission task. 409 BRIEFING_STALE means the briefing is from an
 * earlier day; refetch the summary rather than retrying.
 */
export async function acceptBriefingAction(briefingId: string, index: number): Promise<BriefingAcceptResult> {
  const res = await apiClient<{ data: BriefingAcceptResult }>(
    `/dashboard/briefing/${encodeURIComponent(briefingId)}/actions/${index}/accept`,
    { method: 'POST' },
  );
  return res.data;
}

export const dashboardApi = {
  getSummary: getDashboardSummary,
  getActivity: getDashboardActivity,
  acceptBriefingAction,
};
