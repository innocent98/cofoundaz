import { useState, useCallback, useEffect } from 'react';
import { apiClient, ApiError } from '@/lib/api/client';

export interface MissionTask {
  id: string;
  missionId: string;
  roadmapTaskId?: string;
  title: string;
  reason: string;
  effort: string;
  tag: string;
  order: number;
  status: 'pending' | 'completed' | 'snoozed' | 'rejected';
  completedAt?: string;
}

export interface MissionDay {
  id: string;
  date: string;
  streakCount: number;
  status: 'pending' | 'completed';
  tasks: MissionTask[];
}

export interface MissionSettings {
  missionSize: number;
  deliveryTime: string; // 12h select form, e.g. "06:00 AM"
  weekendsOff: boolean;
}

// GET /missions/today discriminates on data.status: "no_roadmap" (no tasks at
// all), or a real mission ("pending" / "complete") whose tasks[] may be empty
// on a weekend-off day. We collapse those into one FE state enum.
export type MissionState = 'loading' | 'no_roadmap' | 'empty' | 'pending' | 'complete';

// --- API ↔ FE mapping -------------------------------------------------------

// API task status → the vocabulary the pages already speak.
function mapStatus(s: string): MissionTask['status'] {
  if (s === 'done') return 'completed';
  if (s === 'todo') return 'pending';
  if (s === 'snoozed') return 'snoozed';
  if (s === 'rejected') return 'rejected';
  return 'pending';
}

function effortLabel(e: string): string {
  if (e === 'small') return 'Small';
  if (e === 'large') return 'Large';
  return 'Medium';
}

// reason is "From your 'Validate demand' milestone." on roadmap-drawn tasks and
// null on custom ones — use it as the milestone chip, and as the custom/roadmap
// discriminator (guide §1 traps).
function tagFromTask(roadmapTaskId: string | null, reason: string | null): string {
  if (!roadmapTaskId) return 'Custom';
  const m = reason?.match(/'([^']+)'/);
  return m ? m[1] : 'Roadmap';
}

interface RawTask {
  id: string;
  roadmap_task_id: string | null;
  title: string;
  reason: string | null;
  effort: string;
  status: string;
  order: number;
  completed_at: string | null;
  reject_reason: string | null;
}

function mapTask(t: RawTask): MissionTask {
  return {
    id: t.id,
    missionId: '',
    roadmapTaskId: t.roadmap_task_id ?? undefined,
    title: t.title,
    reason: t.reason ?? '',
    effort: effortLabel(t.effort),
    tag: tagFromTask(t.roadmap_task_id, t.reason),
    order: t.order,
    status: mapStatus(t.status),
    completedAt: t.completed_at ?? undefined,
  };
}

// delivery_time is a bare "HH:MM:SS" 24h string on the API; the settings <select>
// speaks "HH:MM AM/PM". Convert both ways.
function apiTimeToSelect(hms: string): string {
  const [h, m] = (hms || '06:00:00').split(':');
  let hh = parseInt(h, 10);
  const ampm = hh < 12 ? 'AM' : 'PM';
  hh = hh % 12;
  if (hh === 0) hh = 12;
  return `${String(hh).padStart(2, '0')}:${m ?? '00'} ${ampm}`;
}
function selectTimeToApi(sel: string): string {
  const m = sel.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!m) return '06:00:00';
  let hh = parseInt(m[1], 10);
  const mm = m[2];
  const ap = m[3].toUpperCase();
  if (ap === 'PM' && hh !== 12) hh += 12;
  if (ap === 'AM' && hh === 12) hh = 0;
  return `${String(hh).padStart(2, '0')}:${mm}:00`;
}

interface RawSettings {
  mission_size: number;
  delivery_time: string;
  weekend_missions: boolean;
}
function mapSettings(s: RawSettings): MissionSettings {
  return {
    missionSize: s.mission_size,
    deliveryTime: apiTimeToSelect(s.delivery_time),
    // weekend_missions (API) is the inverse of weekendsOff (FE copy).
    weekendsOff: !s.weekend_missions,
  };
}

const DEFAULT_SETTINGS: MissionSettings = {
  missionSize: 3,
  deliveryTime: '06:00 AM',
  weekendsOff: true,
};

export function useMissionApi() {
  const [tasks, setTasks] = useState<MissionTask[]>([]);
  const [settings, setSettings] = useState<MissionSettings>(DEFAULT_SETTINGS);
  const [state, setState] = useState<MissionState>('loading');
  const [streak, setStreak] = useState(0);
  const [missionDate, setMissionDate] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isReady, setIsReady] = useState(false);

  const fetchToday = useCallback(async () => {
    try {
      const res = await apiClient<{ data?: { status: string; streak?: number; mission_date?: string; tasks?: RawTask[] } }>('/missions/today');
      const d = res?.data;
      if (!d) {
        setState('empty');
        setTasks([]);
        return;
      }
      if (d.status === 'no_roadmap') {
        setState('no_roadmap');
        setTasks([]);
        setStreak(0);
        setMissionDate(null);
        return;
      }
      const mapped = (d.tasks ?? []).map(mapTask).sort((a, b) => a.order - b.order);
      setTasks(mapped);
      setStreak(d.streak ?? 0);
      setMissionDate(d.mission_date ?? null);
      // status is the source of truth for completion (guide §6): a complete
      // mission can still have completed < total when a custom task was added
      // after the day was cleared.
      if (d.status === 'complete') setState('complete');
      else if (mapped.length === 0) setState('empty'); // weekend-off, real but task-less
      else setState('pending');
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      setState('empty');
      setTasks([]);
    }
  }, []);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await apiClient<{ data?: RawSettings }>('/missions/settings');
      if (res?.data) setSettings(mapSettings(res.data));
    } catch (err) {
      // settings are lazily created and never 404; a failure here is auth/network
      console.warn('Mission settings load failed:', err);
    }
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      await Promise.all([fetchToday(), fetchSettings()]);
      if (active) setIsReady(true);
    })();
    return () => {
      active = false;
    };
  }, [fetchToday, fetchSettings]);

  // --- task actions (editor-only; a mentor gets 403) ------------------------
  // Each hits PATCH/POST /missions/tasks and then re-fetches /today so the
  // mission-level status (which the single-task response does not carry) stays
  // correct. Optimistic where it reads cleanly; refetch is the source of truth.

  const patchTask = useCallback(
    async (id: string, body: Record<string, unknown>) => {
      try {
        await apiClient(`/missions/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
        await fetchToday();
      } catch (err) {
        // 404 → the task is gone/cross-workspace: drop it locally (guide §7).
        if (err instanceof ApiError && err.status === 404) {
          setTasks((prev) => prev.filter((t) => t.id !== id));
          return;
        }
        setError(err instanceof Error ? err : new Error(String(err)));
        await fetchToday(); // reconcile optimistic state with the server
      }
    },
    [fetchToday]
  );

  const toggleTask = useCallback(
    (id: string) => {
      const task = tasks.find((t) => t.id === id);
      if (!task || task.status === 'completed') return; // completion is one-way
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status: 'completed', completedAt: new Date().toISOString() } : t)));
      void patchTask(id, { action: 'complete' });
    },
    [tasks, patchTask]
  );

  const addTask = useCallback(
    async (title: string) => {
      try {
        await apiClient('/missions/tasks', { method: 'POST', body: JSON.stringify({ title, effort: 'medium' }) });
        await fetchToday();
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    },
    [fetchToday]
  );

  const snoozeTask = useCallback(
    (id: string) => {
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status: 'snoozed' } : t)));
      void patchTask(id, { action: 'snooze' });
    },
    [patchTask]
  );

  const rejectTask = useCallback(
    (id: string, reason?: string) => {
      // reject_reason must be one of the three allowed strings (guide §5); the UI
      // only ever passes those chips.
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status: 'rejected' } : t)));
      void patchTask(id, { action: 'reject', reject_reason: reason ?? 'Doesn’t apply' });
    },
    [patchTask]
  );

  // Reorder swaps this task's `order` with its neighbour. The API sets one
  // task's order per call, so we PATCH both sides then refetch.
  const swapOrder = useCallback(
    async (id: string, dir: -1 | 1) => {
      const sorted = [...tasks].sort((a, b) => a.order - b.order);
      const idx = sorted.findIndex((t) => t.id === id);
      const neighbourIdx = idx + dir;
      if (idx < 0 || neighbourIdx < 0 || neighbourIdx >= sorted.length) return;
      const a = sorted[idx];
      const b = sorted[neighbourIdx];
      // optimistic swap
      setTasks((prev) => prev.map((t) => (t.id === a.id ? { ...t, order: b.order } : t.id === b.id ? { ...t, order: a.order } : t)));
      try {
        await apiClient(`/missions/tasks/${a.id}`, { method: 'PATCH', body: JSON.stringify({ action: 'reorder', order: b.order }) });
        await apiClient(`/missions/tasks/${b.id}`, { method: 'PATCH', body: JSON.stringify({ action: 'reorder', order: a.order }) });
        await fetchToday();
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        await fetchToday();
      }
    },
    [tasks, fetchToday]
  );

  const reprioritizeUp = useCallback((id: string) => swapOrder(id, -1), [swapOrder]);
  const reprioritizeDown = useCallback((id: string) => swapOrder(id, 1), [swapOrder]);

  const reorderTasks = useCallback(
    (dragIndex: number, hoverIndex: number) => {
      const sorted = [...tasks].sort((a, b) => a.order - b.order);
      const moved = sorted[dragIndex];
      const target = sorted[hoverIndex];
      if (moved && target) void swapOrder(moved.id, dragIndex < hoverIndex ? 1 : -1);
    },
    [tasks, swapOrder]
  );

  const updateSettings = useCallback(async (payload: Partial<MissionSettings>) => {
    const next = { ...settings, ...payload };
    setSettings(next); // optimistic
    const body: Record<string, unknown> = {};
    if (payload.missionSize !== undefined) body.mission_size = payload.missionSize;
    if (payload.deliveryTime !== undefined) body.delivery_time = selectTimeToApi(payload.deliveryTime);
    if (payload.weekendsOff !== undefined) body.weekend_missions = !payload.weekendsOff;
    try {
      const res = await apiClient<{ data?: RawSettings }>('/missions/settings', { method: 'PATCH', body: JSON.stringify(body) });
      if (res?.data) setSettings(mapSettings(res.data));
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      await fetchSettings(); // revert to server truth
    }
  }, [settings, fetchSettings]);

  const todayTasks = tasks.filter((t) => t.status === 'pending' || t.status === 'completed');
  const allCompleted = state === 'complete';

  return {
    isReady,
    state,
    streak,
    missionDate,
    error,
    tasks,
    todayTasks,
    allCompleted,
    settings,
    refetch: fetchToday,
    toggleTask,
    addTask,
    snoozeTask,
    rejectTask,
    reorderTasks,
    reprioritizeUp,
    reprioritizeDown,
    updateSettings,
  };
}
