'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiClient, ApiError } from '@/lib/api/client';
import { safeInternalHref } from '@/lib/safe-href';

// Health-score sub-routes (guide §2–§5). API dimension keys are product/market/
// money/legal/team; the FE speaks `financial` for `money`, so we translate on the
// way to /dimensions/{dim}. estimated_lift is a heuristic — always hedge it in UI.

export interface HealthRec {
  id: string;
  dimension: string;
  key: string;
  title: string;
  body: string;
  estimated_lift: number;
  effort: string; // low | medium | high
  status: string; // pending | accepted | dismissed
  priority: number;
  href: string; // where the founder does the work (internal route)
}

// `unit` tells the FE how to format `value`/`target`. A live runway row for a
// profitable startup has status "not_burning" and value 999: never show "999".
export type SignalUnit = 'score' | '%' | 'count' | 'months' | 'days' | 'events';
export interface DimensionSignal {
  key: string;
  label: string;
  value: number;
  unit: SignalUnit;
  target: number;
  contribution: number;
  source: 'assessment' | 'live';
  status?: string;
  href: string;
  source_ref: string;
}
export interface DimensionDetail {
  key: string;
  label: string;
  score: number;
  band: string;
  signals: DimensionSignal[];
  trend: { score: number; computed_at: string }[];
  recommendations: HealthRec[];
}

export interface HistoryPoint {
  score: number;
  dimension_scores: Record<string, number>;
  delta: number;
  computed_at: string;
  trigger?: string;
}

export interface HistoryMarker {
  at: string;
  label: string;
  action: string;
}

// Shown only when the API has at least min_cohort_size other startups in the
// cohort. p25/p50/p75 are bucketed to 5 points server-side for privacy.
export interface BenchmarkRow {
  p25: number;
  p50: number;
  p75: number;
  you: number;
  your_percentile: number;
}
export interface Benchmarks {
  status: string; // "insufficient_data" | "ok"
  cohort: { stage: string; industry: string; size_at_least?: number };
  min_cohort_size: number;
  percentiles: Record<string, BenchmarkRow> | null;
}

function apiMsg(err: unknown): { message: string; code?: string; status?: number } {
  if (err instanceof ApiError) {
    const d = err.data as { error?: { code?: string; message?: string } } | undefined;
    return { message: d?.error?.message || 'Something went wrong.', code: d?.error?.code, status: err.status };
  }
  return { message: (err as { message?: string })?.message || 'Something went wrong.' };
}

// Every href below comes from the API and lands in a <Link> or router.push. They
// are meant to be in-app routes; anything else falls back to /health so a bad
// value can never send the founder off-site.
const internalHref = (href: string | null | undefined) => safeInternalHref(href) ?? '/health';
const withSafeHref = <T extends { href: string }>(row: T): T => ({ ...row, href: internalHref(row.href) });

// --- Recommendations (list + accept/dismiss) --------------------------------
export function useHealthRecommendations(status: 'pending' | 'accepted' | 'dismissed' = 'pending') {
  const [recs, setRecs] = useState<HealthRec[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient<{ data?: HealthRec[] }>(`/health-score/recommendations?status=${status}`);
      setRecs(Array.isArray(res?.data) ? res.data.map(withSafeHref) : []);
    } catch (err) {
      setError(apiMsg(err).message);
      setRecs([]);
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    void (async () => {
      await load();
    })();
  }, [load]);

  const resolve = useCallback(
    async (id: string, action: 'accept' | 'dismiss'): Promise<{ ok: boolean; error?: string }> => {
      try {
        await apiClient(`/health-score/recommendations/${id}/${action}`, { method: 'POST' });
        await load();
        return { ok: true };
      } catch (err) {
        const m = apiMsg(err);
        // 409 RECOMMENDATION_RESOLVED → someone already actioned it; 403 → not founder.
        if (m.code === 'RECOMMENDATION_RESOLVED') return { ok: false, error: 'That recommendation was already actioned.' };
        if (m.status === 403) return { ok: false, error: 'Only a founder can action recommendations.' };
        return { ok: false, error: m.message };
      }
    },
    [load]
  );

  return {
    recs,
    loading,
    error,
    refetch: load,
    accept: (id: string) => resolve(id, 'accept'),
    dismiss: (id: string) => resolve(id, 'dismiss'),
  };
}

// --- Dimension drill-down ---------------------------------------------------
export function useHealthDimension(feDim: string) {
  const apiDim = feDim === 'financial' ? 'money' : feDim;
  const [detail, setDetail] = useState<DimensionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setNotFound(false);
      setError(null);
      const res = await apiClient<{ data?: DimensionDetail }>(`/health-score/dimensions/${apiDim}`);
      const d = res?.data;
      setDetail(
        d
          ? {
              ...d,
              signals: (d.signals ?? []).map(withSafeHref),
              recommendations: (d.recommendations ?? []).map(withSafeHref),
            }
          : null
      );
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) setNotFound(true);
      else setError(apiMsg(err).message);
      setDetail(null);
    } finally {
      setLoading(false);
    }
  }, [apiDim]);

  useEffect(() => {
    if (!apiDim) return;
    void (async () => {
      await load();
    })();
  }, [apiDim, load]);

  return { detail, loading, notFound, error, refetch: load };
}

// --- History ----------------------------------------------------------------
export const HISTORY_RANGES = ['30d', '90d', '365d'] as const;
export type HistoryRange = (typeof HISTORY_RANGES)[number];

export function useHealthHistory(range: HistoryRange) {
  const [points, setPoints] = useState<HistoryPoint[]>([]);
  const [markers, setMarkers] = useState<HistoryMarker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // Markers annotate the chart; the chart is still useful without them, so a
      // markers failure never blocks the history itself.
      const [hist, marks] = await Promise.all([
        apiClient<{ data?: HistoryPoint[] }>(`/health-score/history?range=${range}`),
        apiClient<{ data?: HistoryMarker[] }>(`/health-score/history/markers?range=${range}`).catch(() => null),
      ]);
      setPoints(Array.isArray(hist?.data) ? hist.data : []);
      setMarkers(Array.isArray(marks?.data) ? marks.data : []);
    } catch (err) {
      setError(apiMsg(err).message);
      setPoints([]);
      setMarkers([]);
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    void (async () => {
      await load();
    })();
  }, [load]);

  return { points, markers, loading, error, refetch: load };
}

// --- Benchmarks -------------------------------------------------------------
export function useHealthBenchmarks() {
  const [benchmarks, setBenchmarks] = useState<Benchmarks | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient<{ data?: Benchmarks }>('/health-score/benchmarks');
      setBenchmarks(res?.data ?? null);
    } catch (err) {
      setError(apiMsg(err).message);
      setBenchmarks(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void (async () => {
      await load();
    })();
  }, [load]);

  return { benchmarks, loading, error, refetch: load };
}
