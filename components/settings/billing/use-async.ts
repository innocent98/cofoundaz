'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiErrorInfo } from '@/lib/api/api-error';

/** Load once on mount; `reload` refetches without blanking the data. */
export function useAsync<T>(fn: () => Promise<T>, failMessage: string) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    try {
      setData(await fn());
      setError(null);
    } catch (err) {
      setError(apiErrorInfo(err, failMessage).message);
    } finally {
      setLoading(false);
    }
    // fn is a stable module-level API function at every call site
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    void (async () => {
      await reload();
    })();
  }, [reload]);

  return { data, error, loading, reload, setData };
}

/** Send the browser to Paystack's hosted page (the card never touches this app). */
export function goToCheckout(url: string): void {
  window.location.assign(url);
}
