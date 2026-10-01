import { apiClient } from './client';

export type AIContentStatus = 'empty' | 'generating' | 'ready';

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

export interface DashboardMissionData {
  streak?: number;
  status?: string;
  tasks?: RawMissionTask[];
  [key: string]: unknown;
}
export type DashboardMissionSection = DashboardMissionData | DashboardSectionError | null;

export interface DashboardUpcomingItem {
  id?: string;
  title: string;
  type?: string;
  date?: string;
  time?: string;
  badge?: string;
  [key: string]: unknown;
}
export type DashboardUpcomingSection = DashboardUpcomingItem[] | { items: DashboardUpcomingItem[] } | DashboardSectionError;

export interface DashboardKpisData {
  revenue?: number | null;
  runway?: number | null;
  pipeline_value?: number | null;
  campaign_performance?: number | string | null;
  tasks_done_this_week?: number | null;
  [key: string]: unknown;
}
export type DashboardKpisSection = DashboardKpisData | DashboardSectionError;

export interface DashboardCalibrationData {
  assessment_complete?: boolean;
  step?: number | string;
  [key: string]: unknown;
}
export type DashboardCalibrationSection = DashboardCalibrationData | DashboardSectionError;

export interface DashboardBriefingData {
  id?: string;
  date?: string;
  status?: AIContentStatus;
  message?: string | null;
  content?: string | null;
  actions?: Array<{ index: number; label: string; [key: string]: unknown }>;
  [key: string]: unknown;
}
export type DashboardBriefingSection = DashboardBriefingData | DashboardSectionError;

export interface RawRiskItem {
  id: string;
  severity?: 'high' | 'medium' | 'low' | 'red' | 'amber' | string;
  description: string;
  moduleLink?: string;
  [key: string]: unknown;
}
export interface DashboardRisksData {
  status?: AIContentStatus;
  message?: string;
  items?: RawRiskItem[];
  [key: string]: unknown;
}
export type DashboardRisksSection = DashboardRisksData | RawRiskItem[] | DashboardSectionError;

export interface RawOpportunityItem {
  id: string;
  type?: string;
  description: string;
  ctaText?: string;
  moduleLink?: string;
  [key: string]: unknown;
}
export interface DashboardOpportunitiesData {
  status?: AIContentStatus;
  message?: string;
  items?: RawOpportunityItem[];
  [key: string]: unknown;
}
export type DashboardOpportunitiesSection = DashboardOpportunitiesData | RawOpportunityItem[] | DashboardSectionError;

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
  verb: string;
  entity: string;
  timestamp: string;
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

export const dashboardApi = {
  getSummary: getDashboardSummary,
  getActivity: getDashboardActivity,
};
