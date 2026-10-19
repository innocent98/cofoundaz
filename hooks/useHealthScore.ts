import { useState, useEffect, useCallback } from 'react';
import { apiClient, ApiError } from '@/lib/api/client';
import { safeInternalHref } from '@/lib/safe-href';

export type DimensionKey = 'product' | 'market' | 'financial' | 'legal' | 'team';
export type HealthStatus = 'pending_assessment' | 'ok';
export type HealthBand = 'at_risk' | 'needs_work' | 'healthy' | 'thriving';

export interface HealthDimension {
  key: DimensionKey;
  label: string;
  score: number;
  band: HealthBand | null;
  trend: number[]; // the dimension's last up-to-8 scores, oldest first (sparkline)
  status: 'strong' | 'neutral' | 'lagging';
}

export interface HealthRecommendation {
  id: string;
  title: string;
  rationale: string;
  estimatedLift: number;
  effort: string; // 'low' | 'medium' | 'high' (verbatim from the API)
  actionUrl: string; // the API's `href`: the page where the founder does the work
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
  trend?: number[];
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
  href?: string;
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
    if (!meta) continue; // unknown dimension key, ignore rather than crash
    dimensions[meta.feKey] = {
      key: meta.feKey,
      label: d.label || meta.label,
      score: d.score,
      band: d.band,
      trend: Array.isArray(d.trend) ? d.trend : [],
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
      // Off-site or malformed hrefs fall back to the dimension's hub (never followed).
      actionUrl: safeInternalHref(r.href) ?? meta?.hub ?? '/health',
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

// One request serves every caller that asks while it is in flight (the shell's
// Health chip, the Health layout and the page all mount together).
let inflight: Promise<RawOverview | null> | null = null;

function fetchOverview(): Promise<RawOverview | null> {
  if (!inflight) {
    inflight = apiClient<{ data?: RawOverview } | RawOverview>('/health-score')
      .then((res) => {
        const raw = (res as { data?: RawOverview })?.data ?? (res as RawOverview);
        return raw && (raw.status === 'ok' || raw.status === 'pending_assessment') ? raw : null;
      })
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

export function useHealthScore() {
  const [data, setData] = useState<HealthScoreData>(EMPTY_STATE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const raw = await fetchOverview();
      if (raw) {
        setData(mapOverview(raw));
      } else {
        // A 2xx with a body we cannot read is a failure, not "pending".
        setError(new Error('Unexpected Health Score response'));
        setData(EMPTY_STATE);
      }
    } catch (err) {
      // `pending_assessment` is only ever the API's own status. A failed load
      // surfaces through `error` so pages can offer a retry instead of telling
      // an assessed founder to take the assessment.
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

  return { data, loading, error, refetch };
}
