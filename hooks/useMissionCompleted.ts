'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiClient } from '@/lib/api/client';
import { mapMilestone, type MissionMilestone, type RawMilestone } from '@/hooks/useMissionApi';

// GET /missions/completed?cursor=&limit= (PRD 04.3): the reverse-chronological
// log of completed tasks, keyset-paginated. `next_cursor` is null on the last page.

export interface CompletedTask {
  id: string;
  title: string;
  completedAt: string;
  missionDate: string; // YYYY-MM-DD
  milestone: MissionMilestone | null;
}

interface RawCompleted {
  items: Array<{ id: string; title: string; completed_at: string; mission_date: string; milestone?: RawMilestone | null }>;
  next_cursor: string | null;
}

const PAGE = 20;

export function mapCompleted(items: RawCompleted['items']): CompletedTask[] {
  return items.map((i) => ({
    id: i.id,
    title: i.title,
    completedAt: i.completed_at,
    missionDate: i.mission_date,
    milestone: mapMilestone(i.milestone),
  }));
}

/** Groups an already newest-first list by mission day, keeping order. */
export function groupByDay(items: CompletedTask[]): Array<{ date: string; items: CompletedTask[] }> {
  const groups: Array<{ date: string; items: CompletedTask[] }> = [];
  for (const it of items) {
    const last = groups[groups.length - 1];
    if (last && last.date === it.missionDate) last.items.push(it);
    else groups.push({ date: it.missionDate, items: [it] });
  }
  return groups;
}

export function useMissionCompleted() {
  const [items, setItems] = useState<CompletedTask[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPage = useCallback(async (cursor: string | null) => {
    const qs = new URLSearchParams({ limit: String(PAGE) });
    if (cursor) qs.set('cursor', cursor);
    const res = await apiClient<{ data?: RawCompleted }>(`/missions/completed?${qs.toString()}`);
    return res?.data ?? { items: [], next_cursor: null };
  }, []);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const page = await fetchPage(null);
      setItems(mapCompleted(page.items));
      setNextCursor(page.next_cursor);
    } catch (err) {
      setError((err as { message?: string })?.message || "Couldn't load your completed tasks.");
    } finally {
      setLoading(false);
    }
  }, [fetchPage]);

  useEffect(() => {
    queueMicrotask(() => {
      void load();
    });
  }, [load]);

  const loadMore = useCallback(async () => {
    if (!nextCursor || loadingMore) return;
    try {
      setLoadingMore(true);
      const page = await fetchPage(nextCursor);
      setItems((prev) => [...prev, ...mapCompleted(page.items)]);
      setNextCursor(page.next_cursor);
    } catch (err) {
      setError((err as { message?: string })?.message || "Couldn't load more.");
    } finally {
      setLoadingMore(false);
    }
  }, [fetchPage, nextCursor, loadingMore]);

  return { items, hasMore: nextCursor !== null, loading, loadingMore, error, loadMore, refetch: load };
}
