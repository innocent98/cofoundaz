import { useCallback, useEffect, useRef, useState } from 'react';
import {
  generateFinancialModel,
  getLatestFinancialModel,
  toFinanceError,
  type FinancialModel,
} from '@/lib/api/finance';

// Financial Model is async (Pattern B): POST /generate -> 202, then poll
// GET /finance/model until the latest row is `complete` or `failed`. The guide
// suggests 2s for the first ~10s, then 5s, and giving up after about a minute
// (the row keeps finishing server-side, so we offer "Check again").

export const FAST_POLL_MS = 2000;
export const SLOW_POLL_MS = 5000;
export const FAST_WINDOW_MS = 10_000;
export const GIVE_UP_MS = 60_000;

export type ModelPhase =
  | 'loading'
  | 'none'
  | 'generating'
  | 'complete'
  | 'failed'
  | 'error'
  | 'forbidden';

export function useFinancialModel() {
  const [phase, setPhase] = useState<ModelPhase>('loading');
  const [model, setModel] = useState<FinancialModel | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [timedOut, setTimedOut] = useState(false);
  const [starting, setStarting] = useState(false);

  // Bumped to cancel any in-flight poll chain (new generate, manual refresh, unmount).
  const pollRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
  };

  const fetchLatest = useCallback(async (): Promise<ModelPhase> => {
    try {
      const latest = await getLatestFinancialModel();
      if (latest.status === 'none') {
        setModel(null);
        setPhase('none');
        return 'none';
      }
      const m = latest as FinancialModel;
      setModel(m);
      setError(null);
      setPhase(m.status);
      return m.status;
    } catch (err) {
      const fe = toFinanceError(err, "Couldn't load your financial model.");
      setError(fe.message);
      const p: ModelPhase = fe.forbidden ? 'forbidden' : 'error';
      setPhase(p);
      return p;
    }
  }, []);

  /** Poll until terminal or the give-up window passes. `startedAt` anchors the cadence. */
  const poll = useCallback(
    (startedAt: number) => {
      const token = ++pollRef.current;
      clearTimer();
      const tick = async () => {
        if (token !== pollRef.current) return;
        const result = await fetchLatest();
        if (token !== pollRef.current) return;
        if (result !== 'generating') return;
        const elapsed = Date.now() - startedAt;
        if (elapsed >= GIVE_UP_MS) {
          setTimedOut(true);
          return;
        }
        timerRef.current = setTimeout(tick, elapsed < FAST_WINDOW_MS ? FAST_POLL_MS : SLOW_POLL_MS);
      };
      timerRef.current = setTimeout(tick, FAST_POLL_MS);
    },
    [fetchLatest],
  );

  // Initial load; resume polling if a generation is already running.
  useEffect(() => {
    queueMicrotask(() => {
      void (async () => {
        const result = await fetchLatest();
        if (result === 'generating') poll(Date.now());
      })();
    });
    return () => {
      // The counter is a plain cancel token, not a DOM node: bumping the live value is the point.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      pollRef.current++;
      clearTimer();
    };
  }, [fetchLatest, poll]);

  const generate = useCallback(async (): Promise<{ ok: boolean; message?: string; forbidden?: boolean }> => {
    setStarting(true);
    setTimedOut(false);
    try {
      await generateFinancialModel();
      // Show the generating state immediately, without stale statements from the previous model.
      setModel(null);
      setError(null);
      setPhase('generating');
      poll(Date.now());
      return { ok: true };
    } catch (err) {
      const fe = toFinanceError(err, "Couldn't start the model. Try again.");
      return { ok: false, message: fe.message, forbidden: fe.forbidden };
    } finally {
      setStarting(false);
    }
  }, [poll]);

  /** Manual re-check, e.g. after the give-up message. Restarts the bounded poll. */
  const checkAgain = useCallback(async () => {
    setTimedOut(false);
    const result = await fetchLatest();
    if (result === 'generating') poll(Date.now());
  }, [fetchLatest, poll]);

  return { phase, model, error, timedOut, starting, generate, checkAgain };
}
