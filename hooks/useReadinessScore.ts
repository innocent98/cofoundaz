import { useCallback, useEffect, useState } from 'react';
import {
  getHistory,
  getInputs,
  getScore,
  putInputs,
  readinessError,
  recomputeScore,
  type HistoryRange,
  type MarketInputs,
  type ReadinessError,
  type ReadinessHistory,
} from '@/lib/api/readiness';
import { useReadinessLoad } from './useReadinessLoad';

const RECOMPUTE_COOLDOWN_MS = 60_000;

export function useReadinessScore() {
  const base = useReadinessLoad(getScore);
  const { setData } = base;
  const [recomputing, setRecomputing] = useState(false);
  const [recomputeError, setRecomputeError] = useState<ReadinessError | null>(null);
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const [now, setNow] = useState(0);

  // Tick only while the cooldown runs, so the button re-enables itself.
  useEffect(() => {
    if (cooldownUntil === 0) return;
    const id = setInterval(() => {
      const t = Date.now();
      setNow(t);
      if (t >= cooldownUntil) clearInterval(id);
    }, 1000);
    return () => clearInterval(id);
  }, [cooldownUntil]);

  const recompute = useCallback(async () => {
    setRecomputing(true);
    setRecomputeError(null);
    try {
      const next = await recomputeScore();
      setData(next);
      const t = Date.now();
      setNow(t);
      setCooldownUntil(t + RECOMPUTE_COOLDOWN_MS);
    } catch (err) {
      const e = readinessError(err, 'We could not recalculate. Try again.');
      setRecomputeError(e);
      if (e.status === 429) {
        const t = Date.now();
        setNow(t);
        setCooldownUntil(t + RECOMPUTE_COOLDOWN_MS);
      }
    } finally {
      setRecomputing(false);
    }
  }, [setData]);

  return {
    score: base.data,
    loading: base.loading,
    error: base.error,
    reload: base.reload,
    recompute,
    recomputing,
    recomputeError,
    coolingDown: cooldownUntil > now,
  };
}

export type HistoryWithClock = ReadinessHistory & { fetchedAt: number };

export function useReadinessHistory(range: HistoryRange) {
  const load = useCallback(async (): Promise<HistoryWithClock> => ({ ...(await getHistory(range)), fetchedAt: Date.now() }), [range]);
  const base = useReadinessLoad(load);
  return { history: base.data, loading: base.loading, error: base.error, reload: base.reload };
}

export function useMarketInputs() {
  const base = useReadinessLoad<MarketInputs>(getInputs);
  const { setData } = base;
  const save = useCallback(
    async (patch: Partial<MarketInputs>) => {
      const next = await putInputs(patch);
      setData(next);
      return next;
    },
    [setData],
  );
  return { inputs: base.data, loading: base.loading, error: base.error, reload: base.reload, save };
}
