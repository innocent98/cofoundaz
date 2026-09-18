'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiClient, ApiError } from '@/lib/api/client';

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
}

export interface DimensionSignal {
  key: string;
  value: number;
  contribution: number;
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
}

export interface Benchmarks {
  status: string; // "insufficient_data" today
  cohort: { stage: string; industry: string };
  min_cohort_size: number;
  percentiles: Record<string, number> | null;
}

function apiMsg(err: unknown): { message: string; code?: string; status?: number } {
  if (err instanceof ApiError) {
    const d = err.data as { error?: { code?: string; message?: string } } | undefined;
    return { message: d?.error?.message || 'Something went wrong.', code: d?.error?.code, status: err.status };
  }
  return { message: (err as { message?: string })?.message || 'Something went wrong.' };
}

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
      setRecs(Array.isArray(res?.data) ? res.data : []);
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

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setNotFound(false);
      const res = await apiClient<{ data?: DimensionDetail }>(`/health-score/dimensions/${apiDim}`);
      setDetail(res?.data ?? null);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) setNotFound(true);
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

  return { detail, loading, notFound, refetch: load };
}

// --- History ----------------------------------------------------------------
export function useHealthHistory(range: '7d' | '30d' | '90d' | 'all') {
  const [points, setPoints] = useState<HistoryPoint[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient<{ data?: HistoryPoint[] }>(`/health-score/history?range=${range}`);
      setPoints(Array.isArray(res?.data) ? res.data : []);
    } catch {
      setPoints([]);
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    void (async () => {
      await load();
    })();
  }, [load]);

  return { points, loading, refetch: load };
}

// --- Benchmarks -------------------------------------------------------------
export function useHealthBenchmarks() {
  const [benchmarks, setBenchmarks] = useState<Benchmarks | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient<{ data?: Benchmarks }>('/health-score/benchmarks');
      setBenchmarks(res?.data ?? null);
    } catch {
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

  return { benchmarks, loading, refetch: load };
}
