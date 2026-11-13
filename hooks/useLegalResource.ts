import { useCallback, useEffect, useRef, useState } from 'react';
import { toLegalError } from '@/lib/api/legal';

export type LegalResourceStatus = 'loading' | 'ready' | 'error' | 'forbidden';

export interface LegalResource<T> {
  status: LegalResourceStatus;
  data: T | null;
  /** The API's own message when status is `error`. */
  error: string | null;
  /** Refetch without flipping back to `loading`, so lists don't flash after a write. */
  reload: () => Promise<void>;
  /** Replace the cached value with a fresh server response (e.g. a PATCH that returns the whole list). */
  setData: (next: T) => void;
}

/**
 * Loads one Legal resource with the four states every list needs: loading, ready, error
 * and forbidden (403). `load` must be stable (useCallback); changing it refetches and
 * shows `loading` again, which is what a filter or jurisdiction switch wants.
 */
export function useLegalResource<T>(load: () => Promise<T>): LegalResource<T> {
  const [state, setState] = useState<{ status: LegalResourceStatus; data: T | null; error: string | null }>({
    status: 'loading',
    data: null,
    error: null,
  });
  const runRef = useRef(0);

  const run = useCallback(
    async (silent: boolean) => {
      const id = ++runRef.current;
      if (!silent) setState({ status: 'loading', data: null, error: null });
      try {
        const data = await load();
        if (id !== runRef.current) return;
        setState({ status: 'ready', data, error: null });
      } catch (err) {
        if (id !== runRef.current) return;
        const le = toLegalError(err, "Couldn't load this. Try again.");
        setState((s) => ({
          status: le.forbidden ? 'forbidden' : silent && s.data !== null ? 'ready' : 'error',
          data: silent ? s.data : null,
          error: le.message,
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
      // A plain cancel token, not a DOM node: bumping the live value is the point.
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
