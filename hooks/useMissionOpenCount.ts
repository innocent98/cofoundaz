import { useCallback, useEffect, useState } from 'react';
import { apiClient } from '@/lib/api/client';
import { useRealtimeEvent } from '@/components/realtime-context';

/** Fired by anything that changes today's mission (complete, Do it) so the sidebar badge follows. */
export const MISSION_CHANGED_EVENT = 'cf:mission-changed';

export function announceMissionChanged() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(MISSION_CHANGED_EVENT));
}

interface TodayResponse {
  data?: { status?: string; tasks?: Array<{ status?: string }> };
}

/** Open (not done, snoozed or rejected) tasks in today's mission, for the sidebar badge. */
export function countOpenTasks(res: TodayResponse | null | undefined): number {
  const tasks = res?.data?.tasks ?? [];
  return tasks.filter((t) => t.status === 'todo').length;
}

/**
 * The Today's Mission sidebar badge (PRD 2.1). Re-reads on route changes and
 * whenever the mission changes; a failure just hides the badge (never a made-up
 * number). Pass `enabled=false` for roles that have no mission.
 */
export function useMissionOpenCount(enabled: boolean, routeKey: string): number {
  const [count, setCount] = useState(0);

  const load = useCallback(async () => {
    try {
      const res = await apiClient<TodayResponse>('/missions/today');
      setCount(countOpenTasks(res));
    } catch {
      setCount(0);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    queueMicrotask(() => {
      void load();
    });
  }, [enabled, routeKey, load]);

  useEffect(() => {
    if (!enabled) return;
    const onChange = () => void load();
    window.addEventListener(MISSION_CHANGED_EVENT, onChange);
    return () => window.removeEventListener(MISSION_CHANGED_EVENT, onChange);
  }, [enabled, load]);

  // Mission tasks added, completed or moved anywhere (another tab, the API, a teammate) arrive as activity.
  useRealtimeEvent('activity.created', (data) => {
    if (enabled && (data as { entity_type?: string } | null)?.entity_type === 'mission_task') void load();
  });

  return enabled ? count : 0;
}
