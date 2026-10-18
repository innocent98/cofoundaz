'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiClient } from '@/lib/api/client';

// Guide §6: GET /missions/history — read-only, newest-first past missions with
// per-mission completed/total counts + status, plus a rolling 7-day completion %.
// TRAP: a mission can be status:"complete" while completed < total (a custom task
// was added after the day was already cleared). Treat `status` as the completion
// source of truth; render completed/total as informational progress only.

export interface MissionHistoryEntry {
  mission_date: string;
  completed: number;
  total: number;
  status: string; // "complete" | "pending" | …
}

export function useMissionHistory() {
  const [missions, setMissions] = useState<MissionHistoryEntry[]>([]);
  const [weeklyCompletionPct, setWeeklyCompletionPct] = useState<number>(0);
  const [currentStreak, setCurrentStreak] = useState<number>(0);
  const [bestStreak, setBestStreak] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient<{ data?: { missions?: MissionHistoryEntry[]; weekly_completion_pct?: number; current_streak?: number; best_streak?: number } }>(
        '/missions/history'
      );
      const d = res?.data;
      setMissions(Array.isArray(d?.missions) ? d.missions : []);
      setWeeklyCompletionPct(typeof d?.weekly_completion_pct === 'number' ? d.weekly_completion_pct : 0);
      setCurrentStreak(typeof d?.current_streak === 'number' ? d.current_streak : 0);
      setBestStreak(typeof d?.best_streak === 'number' ? d.best_streak : 0);
    } catch (err) {
      setError((err as { message?: string })?.message || 'Failed to load mission history');
      setMissions([]);
      setWeeklyCompletionPct(0);
      setCurrentStreak(0);
      setBestStreak(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void (async () => {
      await load();
    })();
  }, [load]);

  return { missions, weeklyCompletionPct, currentStreak, bestStreak, loading, error, refetch: load };
}
