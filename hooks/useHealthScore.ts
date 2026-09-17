import { useState, useEffect, useCallback } from 'react';
import { apiClient, ApiError } from '@/lib/api/client';

export type DimensionKey = 'product' | 'market' | 'financial' | 'legal' | 'team';
export type HealthStatus = 'pending_assessment' | 'ok';
export type HealthBand = 'at_risk' | 'needs_work' | 'healthy' | 'thriving';

export interface HealthDimension {
  key: DimensionKey;
  label: string;
  score: number;
  band: HealthBand | null;
  trend: number[]; // sparkline data (populated by the dimension drill-down endpoint)
  status: 'strong' | 'neutral' | 'lagging';
}

export interface HealthSignal {
  id: string;
  name: string;
  currentValue: string;
  targetValue: string;
  contribution: number;
  sourceUrl: string;
}

export interface HealthRecommendation {
  id: string;
  title: string;
  rationale: string;
  estimatedLift: number;
  effort: string; // 'low' | 'medium' | 'high' (verbatim from the API)
  actionUrl: string;
  dimension: string; // display label, e.g. "Legal"
}

export interface HealthScoreData {
  status: HealthStatus;
  score: number;
  weeklyDelta: number;
  band: HealthBand | null;
  stage: string;
  summary: string; // ok → API summary; pending → the API's empty-state message
  message: string;
  dimensions: Record<DimensionKey, HealthDimension>;
  topRecommendations: HealthRecommendation[];
}

// --- Mapping between the API's dimension model and the FE's ------------------
// The API keys dimensions product/market/money/legal/team; every label matches
// its key EXCEPT `money`, whose display label is "Financial" (see
// cofoundaz-api/docs/fe-integration-guide-health-score.md §1b). The FE has
// always spoken `financial`, so we translate money→financial on the way in and
// keep routing keyed off the FE key.
const DIM_META: Record<
  string,
  { feKey: DimensionKey; label: string; hub: string }
> = {
  product: { feKey: 'product', label: 'Product', hub: '/roadmap' },
  market: { feKey: 'market', label: 'Market', hub: '/validation' },
  money: { feKey: 'financial', label: 'Financial', hub: '/finance' },
  financial: { feKey: 'financial', label: 'Financial', hub: '/finance' },
  legal: { feKey: 'legal', label: 'Legal', hub: '/legal' },
  team: { feKey: 'team', label: 'Team', hub: '/team' },
};

const FE_DIMENSION_ORDER: DimensionKey[] = ['product', 'market', 'financial', 'legal', 'team'];

function bandToStatus(band: string | null): 'strong' | 'neutral' | 'lagging' {
  if (band === 'healthy' || band === 'thriving') return 'strong';
  if (band === 'needs_work') return 'neutral';
  return 'lagging'; // at_risk (and null) render as the "attention" state
}

// The API `GET /health-score` overview shape (money-keyed, array-of-5).
interface RawDimension {
  key: string;
  label: string;
  score: number;
  band: HealthBand | null;
}
interface RawRecommendation {
  id: string;
  dimension: string;
  key: string;
  title: string;
  body: string;
  estimated_lift: number;
  effort: string;
  status: string;
  priority: number;
}
interface RawOverview {
  status: HealthStatus;
  score: number | null;
  band: HealthBand | null;
  delta_7d?: number;
  summary?: string;
  message?: string;
  dimensions: RawDimension[];
  top_recommendations: RawRecommendation[];
}

function emptyDimensions(): Record<DimensionKey, HealthDimension> {
  return FE_DIMENSION_ORDER.reduce((acc, feKey) => {
    const label = Object.values(DIM_META).find((m) => m.feKey === feKey)?.label ?? feKey;
    acc[feKey] = { key: feKey, label, score: 0, band: null, trend: [], status: 'neutral' };
    return acc;
  }, {} as Record<DimensionKey, HealthDimension>);
}

// A safe, non-crashing default so the three consumer pages can read
// `data.dimensions.<key>.score` on first paint without null guards.
const EMPTY_STATE: HealthScoreData = {
  status: 'pending_assessment',
  score: 0,
  weeklyDelta: 0,
  band: null,
  stage: '',
  summary: 'Complete your kickoff assessment to generate your Health Score.',
  message: 'Complete your kickoff assessment to generate your Health Score.',
  dimensions: emptyDimensions(),
  topRecommendations: [],
};

function mapOverview(raw: RawOverview): HealthScoreData {
  if (raw.status === 'pending_assessment') {
    return {
      ...EMPTY_STATE,
      status: 'pending_assessment',
      message: raw.message ?? EMPTY_STATE.message,
      summary: raw.message ?? EMPTY_STATE.summary,
    };
  }

  const dimensions = emptyDimensions();
  for (const d of raw.dimensions ?? []) {
    const meta = DIM_META[d.key];
    if (!meta) continue; // unknown dimension key — ignore rather than crash
    dimensions[meta.feKey] = {
      key: meta.feKey,
      label: d.label || meta.label,
      score: d.score,
      band: d.band,
      trend: [],
      status: bandToStatus(d.band),
    };
  }

  const topRecommendations: HealthRecommendation[] = (raw.top_recommendations ?? []).map((r) => {
    const meta = DIM_META[r.dimension];
    return {
      id: r.id,
      title: r.title,
      rationale: r.body,
      estimatedLift: r.estimated_lift,
      effort: r.effort,
      actionUrl: meta?.hub ?? '/health',
      dimension: meta?.label ?? r.dimension,
    };
  });

  return {
    status: 'ok',
    score: raw.score ?? 0,
    weeklyDelta: raw.delta_7d ?? 0,
    band: raw.band,
    stage: '',
    summary: raw.summary ?? '',
    message: '',
    dimensions,
    topRecommendations,
  };
}

export function useHealthScore() {
  const [data, setData] = useState<HealthScoreData>(EMPTY_STATE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient<{ data?: RawOverview } | RawOverview>('/health-score');
      const raw = (res as { data?: RawOverview })?.data ?? (res as RawOverview);
      if (raw && (raw.status === 'ok' || raw.status === 'pending_assessment')) {
        setData(mapOverview(raw));
      } else {
        setData(EMPTY_STATE);
      }
    } catch (err) {
      // Keep the page functional: a fresh workspace with no assessment still
      // shows the empty-state CTA rather than a crash. Auth issues surface via
      // `error` for callers that want to react.
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        console.warn('Health score unauthorized or forbidden:', err.message);
      }
      setError(err instanceof Error ? err : new Error(String(err)));
      setData(EMPTY_STATE);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      refetch();
    });
  }, [refetch]);

  const dismissRecommendation = useCallback((id: string) => {
    // Optimistic local removal. The real founder-only endpoint
    // (POST /health-score/recommendations/{id}/dismiss) is wired with the
    // recommendations sub-route in a follow-up; the overview has no dismiss control.
    setData((prev) => ({
      ...prev,
      topRecommendations: prev.topRecommendations.filter((r) => r.id !== id),
    }));
  }, []);

  return { data, loading, error, refetch, dismissRecommendation };
}

// Mock per-dimension signal detail — still used by the dimension drill-down
// sub-route, which is wired to its own `/health-score/dimensions/{key}` endpoint
// in a follow-up. The overview (this module) does not use these.
export const mockDimensionSignals: Record<DimensionKey, HealthSignal[]> = {
  product: [
    { id: 's1', name: 'MVP progress', currentValue: '40% built', targetValue: 'Working prototype', contribution: 6, sourceUrl: '/roadmap' },
    { id: 's2', name: 'User feedback logged', currentValue: '18 notes', targetValue: '≥ 10', contribution: 4, sourceUrl: '/validation' },
    { id: 's3', name: 'Feature focus', currentValue: 'Narrow', targetValue: 'Narrow', contribution: 3, sourceUrl: '/business-builder' },
  ],
  market: [
    { id: 's4', name: 'Assumptions validated', currentValue: '3 of 7', targetValue: '≥ 3', contribution: 5, sourceUrl: '/validation' },
    { id: 's5', name: 'Segment clarity', currentValue: 'Defined', targetValue: 'Defined', contribution: 4, sourceUrl: '/business-builder' },
    { id: 's6', name: 'Competitive map', currentValue: 'Complete', targetValue: 'Complete', contribution: 2, sourceUrl: '/business-builder' },
  ],
  financial: [
    { id: 's7', name: 'Runway', currentValue: '8.4 months', targetValue: '≥ 9 months', contribution: -3, sourceUrl: '/finance-hub' },
    { id: 's8', name: 'Revenue growth', currentValue: 'Flat', targetValue: '+10% / mo', contribution: -4, sourceUrl: '/finance-hub' },
    { id: 's9', name: 'Budget set', currentValue: 'Yes', targetValue: 'Yes', contribution: 2, sourceUrl: '/finance-hub' },
    { id: 's10', name: 'Burn discipline', currentValue: 'On plan', targetValue: 'On plan', contribution: 2, sourceUrl: '/finance-hub' },
  ],
  legal: [
    { id: 's11', name: 'Entity formed', currentValue: 'In progress', targetValue: 'Formed', contribution: -2, sourceUrl: '/legal' },
    { id: 's12', name: 'Founder agreements', currentValue: 'Signed', targetValue: 'Signed', contribution: 4, sourceUrl: '/legal' },
    { id: 's13', name: 'IP assignment', currentValue: 'Pending', targetValue: 'Complete', contribution: -1, sourceUrl: '/legal' },
  ],
  team: [
    { id: 's14', name: 'Active members', currentValue: '4', targetValue: '≥ 2', contribution: 5, sourceUrl: '/team' },
    { id: 's15', name: 'Advisors engaged', currentValue: '2', targetValue: '≥ 1', contribution: 3, sourceUrl: '/team' },
    { id: 's16', name: 'Weekly activity', currentValue: 'High', targetValue: 'Steady', contribution: 2, sourceUrl: '/team' },
  ],
};
