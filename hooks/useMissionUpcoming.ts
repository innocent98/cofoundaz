'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiClient } from '@/lib/api/client';
import { announceMissionChanged } from '@/hooks/useMissionOpenCount';
import { effortLabel, mapMilestone, type MissionMilestone, type RawMilestone } from '@/hooks/useMissionApi';

// GET /missions/upcoming (PRD 04.2): the next 7 days projected from the roadmap
// queue, never stored. PUT /missions/upcoming/order takes every visible
// roadmap_task_id in the new order and returns the recomputed projection.

export interface UpcomingTask {
  roadmapTaskId: string;
  title: string;
  effort: string;
  milestone: MissionMilestone | null;
  carriedOver: boolean;
}

export interface UpcomingDay {
  date: string; // YYYY-MM-DD
  restDay: boolean;
  tasks: UpcomingTask[];
}

export interface Upcoming {
  hasRoadmap: boolean;
  missionSize: number;
  days: UpcomingDay[];
}

interface RawUpcoming {
  has_roadmap: boolean;
  mission_size?: number;
  days?: Array<{
    date: string;
    rest_day: boolean;
    tasks: Array<{
      roadmap_task_id: string;
      title: string;
      effort: string;
      milestone?: RawMilestone | null;
      carried_over?: boolean;
    }>;
  }>;
}

export function mapUpcoming(d: RawUpcoming): Upcoming {
  return {
    hasRoadmap: d.has_roadmap,
    missionSize: d.mission_size ?? 0,
    days: (d.days ?? []).map((day) => ({
      date: day.date,
      restDay: day.rest_day,
      tasks: day.tasks.map((t) => ({
        roadmapTaskId: t.roadmap_task_id,
        title: t.title,
        effort: effortLabel(t.effort),
        milestone: mapMilestone(t.milestone),
        carriedOver: t.carried_over === true,
      })),
    })),
  };
}

/** Every task on screen, in display order (the body PUT /missions/upcoming/order wants). */
export function visibleOrder(days: UpcomingDay[]): string[] {
  return days.flatMap((d) => d.tasks.map((t) => t.roadmapTaskId));
}

/** Moves the item at `from` to `to` in a copy of `ids`. */
export function moveId(ids: string[], from: number, to: number): string[] {
  if (from === to || from < 0 || to < 0 || from >= ids.length || to >= ids.length) return ids;
  const next = [...ids];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

export function useMissionUpcoming() {
  const [data, setData] = useState<Upcoming | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      const res = await apiClient<{ data?: RawUpcoming }>('/missions/upcoming');
      setData(res?.data ? mapUpcoming(res.data) : null);
    } catch (err) {
      setError((err as { message?: string })?.message || "Couldn't load your upcoming missions.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void load();
    });
  }, [load]);

  /** Saves a new whole-list order. Resolves true when saved; on failure refetches and resolves false. */
  const reorder = useCallback(
    async (ids: string[]): Promise<boolean> => {
      setSaving(true);
      try {
        const res = await apiClient<{ data?: RawUpcoming }>('/missions/upcoming/order', {
          method: 'PUT',
          body: JSON.stringify({ roadmap_task_ids: ids }),
        });
        if (res?.data) setData(mapUpcoming(res.data));
        return true;
      } catch {
        await load(); // a stale list (422) or a lost role: show server truth
        return false;
      } finally {
        setSaving(false);
      }
    },
    [load]
  );

  /** Empty-state CTA: POST /roadmap/generate (synchronous), then reload the projection. */
  const generateRoadmap = useCallback(async (): Promise<boolean> => {
    setSaving(true);
    try {
      await apiClient('/roadmap/generate', { method: 'POST' });
      await load();
      announceMissionChanged();
      return true;
    } catch {
      return false;
    } finally {
      setSaving(false);
    }
  }, [load]);

  return { data, loading, error, saving, reorder, generateRoadmap, refetch: load };
}
