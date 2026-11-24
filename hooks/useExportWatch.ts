import { useCallback, useEffect, useRef, useState } from 'react';
import { getExport, type ExportRow } from '@/lib/api/analytics';

/** Guide §6: poll every 2 s, back off to 5 s, stop after 2 minutes and say "Still working". */
export function pollDelay(elapsedMs: number): number | null {
  if (elapsedMs >= 120_000) return null;
  return elapsedMs < 20_000 ? 2_000 : 5_000;
}

export interface ExportWatch {
  /** Latest known row per export id. */
  rows: Record<string, ExportRow>;
  /** Ids we stopped polling after 2 minutes while still pending. */
  stale: Set<string>;
  watch: (row: ExportRow) => void;
  /** Re-read one row (e.g. after a 410 on download) so it shows its real state. */
  refresh: (id: string) => Promise<ExportRow | null>;
}

/**
 * Follows pending exports until they are ready, failed or expired. `onSettled` fires once per id
 * when it leaves `pending`, so a page can toast or refresh its list.
 */
export function useExportWatch(onSettled?: (row: ExportRow) => void): ExportWatch {
  const [rows, setRows] = useState<Record<string, ExportRow>>({});
  const [stale, setStale] = useState<Set<string>>(new Set());
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  // A request still in flight at unmount must not reschedule, set state or toast on another page.
  const mounted = useRef(true);
  // Ids that already hit the 2-minute cap: a list reload must not start polling them again.
  const staleIds = useRef<Set<string>>(new Set());
  const settledRef = useRef(onSettled);
  useEffect(() => {
    settledRef.current = onSettled;
  });

  useEffect(() => {
    mounted.current = true;
    const live = timers.current;
    return () => {
      mounted.current = false;
      for (const t of live.values()) clearTimeout(t);
      live.clear();
    };
  }, []);

  const watch = useCallback((row: ExportRow) => {
    setRows((r) => ({ ...r, [row.id]: row }));
    if (row.status !== 'pending' || timers.current.has(row.id) || staleIds.current.has(row.id)) return;
    const started = Date.now();
    const tick = async () => {
      if (!mounted.current) return;
      const delay = pollDelay(Date.now() - started);
      if (delay === null) {
        timers.current.delete(row.id);
        staleIds.current.add(row.id);
        setStale((s) => new Set(s).add(row.id));
        return;
      }
      timers.current.set(
        row.id,
        setTimeout(async () => {
          try {
            const next = await getExport(row.id);
            if (!mounted.current) return;
            setRows((r) => ({ ...r, [row.id]: next }));
            if (next.status !== 'pending') {
              timers.current.delete(row.id);
              settledRef.current?.(next);
              return;
            }
          } catch {
            /* transient: keep polling until the 2-minute cap */
          }
          if (!mounted.current) return;
          void tick();
        }, delay),
      );
    };
    void tick();
  }, []);

  const refresh = useCallback(async (id: string) => {
    try {
      const next = await getExport(id);
      if (mounted.current) setRows((r) => ({ ...r, [id]: next }));
      return next;
    } catch {
      return null;
    }
  }, []);

  return { rows, stale, watch, refresh };
}
