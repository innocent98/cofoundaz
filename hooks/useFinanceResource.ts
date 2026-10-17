import { useCallback, useEffect, useRef, useState } from 'react';
import { toFinanceError } from '@/lib/api/finance';

export type ResourceStatus = 'loading' | 'ready' | 'error' | 'forbidden';

export interface FinanceResource<T> {
  status: ResourceStatus;
  data: T | null;
  /** The API's own message when status is `error`. */
  error: string | null;
  /** Refetch without flipping back to `loading`, so lists don't flash after a write. */
  reload: () => Promise<void>;
  /** Replace the cached value with a fresh server response (e.g. a PUT result). */
  setData: (next: T) => void;
}

/**
 * Loads one Finance resource and exposes the four states every list needs:
 * loading, ready, error and forbidden (403: the caller's role may not use
 * Finance). `load` must be stable (wrap in useCallback); changing it refetches
 * and shows `loading` again, which is what a month switcher wants.
 */
export function useFinanceResource<T>(load: () => Promise<T>): FinanceResource<T> {
  const [state, setState] = useState<{ status: ResourceStatus; data: T | null; error: string | null }>({
    status: 'loading',
    data: null,
    error: null,
  });
  // Bumped on every run and on unmount so a slow response never overwrites a newer one.
  const runRef = useRef(0);

  const run = useCallback(
    async (silent: boolean) => {
      const run = ++runRef.current;
      if (!silent) setState({ status: 'loading', data: null, error: null });
      try {
        const data = await load();
        if (run !== runRef.current) return;
        setState({ status: 'ready', data, error: null });
      } catch (err) {
        if (run !== runRef.current) return;
        const fe = toFinanceError(err, "Couldn't load this. Try again.");
        setState((s) => ({
          // A failed background reload keeps the last good data on screen.
          status: fe.forbidden ? 'forbidden' : silent && s.data !== null ? 'ready' : 'error',
          data: silent ? s.data : null,
          error: fe.message,
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
      // The counter is a plain cancel token, not a DOM node: bumping the live value is the point.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      runRef.current++;
    };
  }, [run]);

  const reload = useCallback(() => run(true), [run]);
  const setData = useCallback((next: T) => {
    runRef.current++;
    setState({ status: 'ready', data: next, error: null });
  }, []);

  return { status: state.status, data: state.data, error: state.error, reload, setData };
}
