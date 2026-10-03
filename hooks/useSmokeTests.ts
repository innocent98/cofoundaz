import { useState, useEffect, useCallback } from 'react';
import { ApiError } from '@/lib/api/client';
import {
  listExperiments,
  createExperiment,
  updateExperiment,
  getSmokeTestStats,
  type RawExperiment,
  type ExperimentStatus,
  type CreateExperimentBody,
} from '@/lib/api/validation';

export type { SmokeTestStats, ExperimentStatus } from '@/lib/api/validation';

/** FE view of a smoke-test experiment (config/metrics unpacked). */
export interface SmokeTest {
  id: string;
  name: string;
  status: ExperimentStatus;
  slug: string;
  targetConversion: number;
  metricType: string;
  visits: number;
  signups: number;
  conversionRate: number;
  config: Record<string, unknown>;
}

function num(v: unknown, d = 0): number {
  const n = typeof v === 'number' ? v : typeof v === 'string' ? parseFloat(v) : NaN;
  return Number.isFinite(n) ? n : d;
}

function toSmokeTest(e: RawExperiment): SmokeTest {
  const visits = num((e.metrics as { visits?: unknown })?.visits);
  const signups = num((e.metrics as { signups?: unknown })?.signups);
  const cfg = e.config ?? {};
  return {
    id: e.id,
    name: e.name,
    status: e.status,
    slug: String((cfg as { slug?: unknown }).slug ?? ''),
    targetConversion: num((cfg as { target_conversion?: unknown }).target_conversion, 5),
    metricType: String((cfg as { metric_type?: unknown }).metric_type ?? 'email_signup'),
    visits,
    signups,
    conversionRate: visits > 0 ? Math.round((signups / visits) * 1000) / 10 : 0,
    config: cfg,
  };
}

function errMsg(err: unknown): string {
  if (err instanceof ApiError) {
    const d = err.data as { error?: { message?: string } } | undefined;
    if (err.status === 403) return "You don't have access to validation in this workspace.";
    return d?.error?.message || 'Something went wrong with smoke tests.';
  }
  return 'Something went wrong with smoke tests.';
}

/** Real Validation Hub smoke tests (guide §2): list / create / metrics / status / stats. */
export function useSmokeTests() {
  const [tests, setTests] = useState<SmokeTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const rows = await listExperiments({ type: 'smoke_test' });
      setTests(rows.map(toSmokeTest));
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void load();
    });
  }, [load]);

  const create = useCallback(async (body: Omit<CreateExperimentBody, 'type'>): Promise<SmokeTest> => {
    const e = await createExperiment({ ...body, type: 'smoke_test' });
    const mapped = toSmokeTest(e);
    setTests((prev) => [mapped, ...prev]);
    return mapped;
  }, []);

  // metrics REPLACE server-side, so send the full object.
  const updateMetrics = useCallback(async (id: string, visits: number, signups: number) => {
    const e = await updateExperiment(id, { metrics: { visits, signups } });
    setTests((prev) => prev.map((t) => (t.id === id ? toSmokeTest(e) : t)));
  }, []);

  const setStatus = useCallback(async (id: string, status: ExperimentStatus) => {
    const e = await updateExperiment(id, { status });
    setTests((prev) => prev.map((t) => (t.id === id ? toSmokeTest(e) : t)));
  }, []);

  return { tests, loading, error, refetch: load, create, updateMetrics, setStatus, getStats: getSmokeTestStats, errMsg };
}
