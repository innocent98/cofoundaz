'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { getAiStatus, type AiStatusData, type AiStatusResponse } from '@/lib/api/ai';

export function formatResetTime(resetsAt?: string | null): string {
  if (!resetsAt) return 'the next reset';
  try {
    const d = new Date(resetsAt);
    if (isNaN(d.getTime())) return resetsAt;
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  } catch {
    return resetsAt;
  }
}

// Module-level deduplication to prevent thundering herd when multiple
// components (layout, banner, drawer, settings) mount concurrently.
let inFlightRequest: Promise<AiStatusResponse | null> | null = null;
let cachedData: { response: AiStatusResponse; timestamp: number } | null = null;
const CACHE_TTL_MS = 2000;

export function clearAiStatusCache() {
  cachedData = null;
  inFlightRequest = null;
}

export function useAiStatus() {
  const pathname = usePathname();
  const [data, setData] = useState<AiStatusData | null>(() => cachedData?.response.data ?? null);
  const [meta, setMeta] = useState<Record<string, unknown> | undefined>(() => cachedData?.response.meta);
  const [loading, setLoading] = useState<boolean>(() => !cachedData);
  const [error, setError] = useState<Error | null>(null);

  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchStatus = useCallback(async (force = false): Promise<AiStatusData | null> => {
    const now = Date.now();
    if (!force && cachedData && now - cachedData.timestamp < CACHE_TTL_MS) {
      if (isMountedRef.current) {
        setData(cachedData.response.data);
        setMeta(cachedData.response.meta);
        setLoading(false);
      }
      return cachedData.response.data;
    }

    if (isMountedRef.current) {
      setLoading(true);
      setError(null);
    }

    try {
      if (!inFlightRequest) {
        inFlightRequest = getAiStatus()
          .then((res) => {
            cachedData = { response: res, timestamp: Date.now() };
            return res;
          })
          .catch((err) => {
            cachedData = null;
            throw err;
          })
          .finally(() => {
            inFlightRequest = null;
          });
      }

      const res = await inFlightRequest;
      if (!res) return null;

      const payload: AiStatusData = (res && 'data' in res && res.data)
        ? res.data
        : (res as unknown as AiStatusData);

      if (isMountedRef.current) {
        setData(payload);
        setMeta(res.meta);
        setLoading(false);
      }
      return payload;
    } catch (err) {
      const errObj = err instanceof Error ? err : new Error(String(err));
      if (isMountedRef.current) {
        setError(errObj);
        setLoading(false);
      }
      return null;
    }
  }, []);

  // Fetch on initial mount and whenever navigation (pathname change) occurs.
  // NO tight-loop polling.
  useEffect(() => {
    let active = true;
    const run = async () => {
      await Promise.resolve();
      if (active) {
        await fetchStatus();
      }
    };
    void run();
    return () => {
      active = false;
    };
  }, [fetchStatus, pathname]);

  const isOverBudget = Boolean(data?.over_budget);
  const isUnlimited = data ? data.daily_budget === null : false;
  const formattedResetsAt = formatResetTime(data?.resets_at);

  return {
    data,
    status: data,
    meta,
    loading,
    error,
    refetch: () => fetchStatus(true),
    isOverBudget,
    isUnlimited,
    formattedResetsAt,
  };
}
