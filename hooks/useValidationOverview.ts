import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '@/lib/api/client';
import { getValidationOverview, type ValidationOverview } from '@/lib/api/validation';

/** Real overview counts + riskiest untested assumption (PRD 09.1 / 09.6). */
export function useValidationOverview() {
  const [overview, setOverview] = useState<ValidationOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setOverview(await getValidationOverview());
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 403
          ? "You don't have access to validation in this workspace."
          : 'Could not load the overview.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void load();
    });
  }, [load]);

  return { overview, loading, error, refetch: load };
}
