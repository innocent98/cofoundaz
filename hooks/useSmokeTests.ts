import { useState, useEffect, useCallback } from 'react';
import { ApiError } from '@/lib/api/client';
import {
  listExperiments,
  createExperiment,
  updateExperiment,
  deleteValidationItem,
  getSmokeTestStats,
  listSmokeSignups,
  type RawExperiment,
  type ExperimentStatus,
  type CreateExperimentBody,
  type SmokeTestStats,
} from '@/lib/api/validation';

export type { SmokeTestStats, ExperimentStatus, WaitlistSignup } from '@/lib/api/validation';

/** FE view of a smoke-test experiment (config unpacked). */
export interface SmokeTest {
  id: string;
  name: string;
  status: ExperimentStatus;
  /** Top-level `slug`: the one that is live. Empty when the test has no hosted page. */
  slug: string;
  targetConversion: number;
  metricType: string;
  /** Hand-entered numbers (tests hosted elsewhere). Live traffic is in `stats`. */
  manualVisits: number;
  manualSignups: number;
  config: Record<string, unknown>;
}

function num(v: unknown, d = 0): number {
  const n = typeof v === 'number' ? v : typeof v === 'string' ? parseFloat(v) : NaN;
  return Number.isFinite(n) ? n : d;
}

export function toSmokeTest(e: RawExperiment): SmokeTest {
  const cfg = e.config ?? {};
  const metrics = (e.metrics ?? {}) as { visits?: unknown; signups?: unknown };
  return {
    id: e.id,
    name: e.name,
    status: e.status,
    slug: e.slug ?? '',
    targetConversion: num((cfg as { target_conversion?: unknown }).target_conversion, 5),
    metricType: String((cfg as { metric_type?: unknown }).metric_type ?? 'email_signup'),
    manualVisits: num(metrics.visits),
    manualSignups: num(metrics.signups),
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

/** Real Validation Hub smoke tests: list, create, publish, stats, waitlist, delete. */
export function useSmokeTests() {
  const [tests, setTests] = useState<SmokeTest[]>([]);
  const [statsById, setStatsById] = useState<Record<string, SmokeTestStats>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const rows = (await listExperiments({ type: 'smoke_test' })).map(toSmokeTest);
      setTests(rows);
      // Live numbers per test; a failed stats call just leaves that row blank.
      const entries = await Promise.all(
        rows.map(async (t) => {
          try {
            return [t.id, await getSmokeTestStats(t.id)] as const;
          } catch {
            return null;
          }
        })
      );
      setStatsById(Object.fromEntries(entries.filter((x): x is readonly [string, SmokeTestStats] => x !== null)));
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
    const mapped = toSmokeTest(await createExperiment({ ...body, type: 'smoke_test' }));
    setTests((prev) => [mapped, ...prev]);
    return mapped;
  }, []);

  const replace = (t: SmokeTest) => setTests((prev) => prev.map((x) => (x.id === t.id ? t : x)));

  // Metrics REPLACE server-side, so send the full object.
  const updateMetrics = useCallback(async (id: string, visits: number, signups: number) => {
    const t = toSmokeTest(await updateExperiment(id, { metrics: { visits, signups } }));
    replace(t);
    return t;
  }, []);

  /** Publish = `status: live`. */
  const setStatus = useCallback(async (id: string, status: ExperimentStatus) => {
    const t = toSmokeTest(await updateExperiment(id, { status }));
    replace(t);
    return t;
  }, []);

  const remove = useCallback(async (id: string) => {
    await deleteValidationItem('experiments', id);
    setTests((prev) => prev.filter((t) => t.id !== id));
    setStatsById((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const getStats = useCallback(async (id: string) => {
    const s = await getSmokeTestStats(id);
    setStatsById((prev) => ({ ...prev, [id]: s }));
    return s;
  }, []);

  return {
    tests,
    statsById,
    loading,
    error,
    refetch: load,
    create,
    updateMetrics,
    setStatus,
    remove,
    getStats,
    getSignups: listSmokeSignups,
    errMsg,
  };
}
