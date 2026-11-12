import { useCallback, useEffect, useState } from 'react';
import { readinessError, type ReadinessError } from '@/lib/api/readiness';

interface Settled<T> {
  data: T | null;
  error: ReadinessError | null;
  /** Which `load` function and which reload count this result belongs to. */
  load: unknown;
  version: number;
}

/**
 * Loads one readiness resource. `load` must be stable (a module function or a useCallback keyed on
 * its inputs): a new `load` starts a new fetch. A failed load keeps the previous data and sets
 * `error`, so a page can show a retry instead of a number that is not real.
 */
export function useReadinessLoad<T>(load: () => Promise<T>) {
  const [version, setVersion] = useState(0);
  const [res, setRes] = useState<Settled<T>>({ data: null, error: null, load: null, version: -1 });

  useEffect(() => {
    let active = true;
    load().then(
      (data) => {
        if (active) setRes({ data, error: null, load, version });
      },
      (err) => {
        if (active) setRes((prev) => ({ data: prev.data, error: readinessError(err, 'We could not load this. Try again.'), load, version }));
      },
    );
    return () => {
      active = false;
    };
  }, [load, version]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);
  const setData = useCallback((data: T) => setRes((prev) => ({ ...prev, data, error: null })), []);
  const loading = res.load !== load || res.version !== version;

  return { data: res.data, setData, loading, error: res.error, reload };
}
