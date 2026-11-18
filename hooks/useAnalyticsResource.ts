import { useCallback, useEffect, useRef, useState } from 'react';
import { toAnalyticsError } from '@/lib/api/analytics';

export type AnalyticsResourceStatus = 'loading' | 'ready' | 'error' | 'forbidden' | 'not_found';

export interface AnalyticsResource<T> {
  status: AnalyticsResourceStatus;
  data: T | null;
  error: string | null;
  /** Refetch without flipping back to `loading`, so a list does not flash after a write. */
  reload: () => Promise<void>;
  setData: (next: T) => void;
}

/**
 * One Analytics read with the states every surface needs: loading, ready, error, forbidden (403)
 * and not found (404: a report you cannot see is a 404, never a 403). `load` must be stable
 * (useCallback); a new `load` (range change) refetches and shows `loading` again.
 */
export function useAnalyticsResource<T>(load: (() => Promise<T>) | null): AnalyticsResource<T> {
  const [state, setState] = useState<{ status: AnalyticsResourceStatus; data: T | null; error: string | null }>({
    status: 'loading',
    data: null,
    error: null,
  });
  const runRef = useRef(0);

  const run = useCallback(
    async (silent: boolean) => {
      if (!load) return;
      const id = ++runRef.current;
      if (!silent) setState({ status: 'loading', data: null, error: null });
      try {
        const data = await load();
        if (id !== runRef.current) return;
        setState({ status: 'ready', data, error: null });
      } catch (err) {
        if (id !== runRef.current) return;
        const e = toAnalyticsError(err, "Couldn't load this. Try again.");
        setState((s) => ({
          status: e.forbidden ? 'forbidden' : e.notFound ? 'not_found' : silent && s.data !== null ? 'ready' : 'error',
          data: silent ? s.data : null,
          error: e.message,
        }));
      }
    },
    [load],
  );

  useEffect(() => {
    queueMicrotask(() => {
      void run(false);
    });
    return () => {
      // A plain cancel token: bumping the live value is the point.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      runRef.current++;
    };
  }, [run]);

  const reload = useCallback(() => run(true), [run]);
  const setData = useCallback((next: T) => {
    runRef.current++;
    setState({ status: 'ready', data: next, error: null });
  }, []);

  return { ...state, reload, setData };
}
