import { useState, useCallback, useEffect } from 'react';
import { apiClient, ApiError } from '@/lib/api/client';
import { announceMissionChanged } from '@/hooks/useMissionOpenCount';

/** The roadmap milestone a task belongs to (null on custom tasks). */
export interface MissionMilestone {
  id: string;
  title: string;
  dueOn: string | null;
}

export interface MissionTask {
  id: string;
  missionId: string;
  roadmapTaskId?: string;
  title: string;
  reason: string;
  effort: string;
  tag: string;
  milestone: MissionMilestone | null;
  order: number;
  status: 'pending' | 'completed' | 'snoozed' | 'rejected';
  completedAt?: string;
}

/** An open roadmap task assigned to the viewer ("Assigned to you"). */
export interface AssignedTask {
  roadmapTaskId: string;
  title: string;
  effort: string;
  milestone: MissionMilestone | null;
}

export type EmptyReason = 'weekend_off' | 'all_caught_up';

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
export type MissionState = 'loading' | 'error' | 'no_roadmap' | 'empty' | 'pending' | 'complete';

// --- API ↔ FE mapping -------------------------------------------------------

// API task status → the vocabulary the pages already speak.
function mapStatus(s: string): MissionTask['status'] {
  if (s === 'done') return 'completed';
  if (s === 'todo') return 'pending';
  if (s === 'snoozed') return 'snoozed';
  if (s === 'rejected') return 'rejected';
  return 'pending';
}

export function effortLabel(e: string): string {
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

export interface RawMilestone {
  id: string;
  title: string;
  due_on: string | null;
}

export function mapMilestone(m: RawMilestone | null | undefined): MissionMilestone | null {
  return m ? { id: m.id, title: m.title, dueOn: m.due_on ?? null } : null;
}

interface RawAssigned {
  roadmap_task_id: string;
  title: string;
  effort: string;
  milestone?: RawMilestone | null;
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
  milestone?: RawMilestone | null;
}

function mapTask(t: RawTask): MissionTask {
  return {
    id: t.id,
    missionId: '',
    roadmapTaskId: t.roadmap_task_id ?? undefined,
    title: t.title,
    reason: t.reason ?? '',
    effort: effortLabel(t.effort),
    tag: t.milestone?.title ?? tagFromTask(t.roadmap_task_id, t.reason),
    milestone: mapMilestone(t.milestone),
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

interface RawToday {
  status: string;
  streak?: number;
  mission_date?: string;
  tasks?: RawTask[];
  empty_reason?: EmptyReason | null;
  assigned_to_me?: RawAssigned[];
}

export function mapAssigned(a: RawAssigned): AssignedTask {
  return {
    roadmapTaskId: a.roadmap_task_id,
    title: a.title,
    effort: effortLabel(a.effort),
    milestone: mapMilestone(a.milestone),
  };
}

const errorOf = (err: unknown) => (err instanceof Error ? err : new Error(String(err)));

export function useMissionApi() {
  const [tasks, setTasks] = useState<MissionTask[]>([]);
  // null until the server answers: the settings page never shows invented defaults.
  const [settings, setSettings] = useState<MissionSettings | null>(null);
  const [settingsError, setSettingsError] = useState(false);
  const [state, setState] = useState<MissionState>('loading');
  const [streak, setStreak] = useState(0);
  const [missionDate, setMissionDate] = useState<string | null>(null);
  const [emptyReason, setEmptyReason] = useState<EmptyReason | null>(null);
  const [assigned, setAssigned] = useState<AssignedTask[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [generating, setGenerating] = useState(false);

  const fetchToday = useCallback(async () => {
    try {
      const res = await apiClient<{ data?: RawToday }>('/missions/today');
      const d = res?.data;
      if (!d) {
        setState('empty');
        setTasks([]);
        return;
      }
      setAssigned((d.assigned_to_me ?? []).map(mapAssigned));
      if (d.status === 'no_roadmap') {
        setState('no_roadmap');
        setTasks([]);
        setStreak(0);
        setMissionDate(null);
        setEmptyReason(null);
        return;
      }
      const mapped = (d.tasks ?? []).map(mapTask).sort((a, b) => a.order - b.order);
      setTasks(mapped);
      setStreak(d.streak ?? 0);
      setMissionDate(d.mission_date ?? null);
      setEmptyReason(d.empty_reason ?? null);
      setError(null);
      // status is the source of truth for completion (guide §6): a complete
      // mission can still have completed < total when a custom task was added
      // after the day was cleared.
      if (d.status === 'complete') setState('complete');
      else if (mapped.length === 0) setState('empty'); // weekend-off or all caught up
      else setState('pending');
    } catch (err) {
      setError(errorOf(err));
      setState('error');
      setTasks([]);
    }
  }, []);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await apiClient<{ data?: RawSettings }>('/missions/settings');
      if (res?.data) setSettings(mapSettings(res.data));
      setSettingsError(false);
    } catch (err) {
      // settings are lazily created and never 404; a failure here is auth/network
      console.warn('Mission settings load failed:', err);
      setSettingsError(true);
    }
  }, []);

  const reload = useCallback(async () => {
    await Promise.all([fetchToday(), fetchSettings()]);
  }, [fetchToday, fetchSettings]);

  useEffect(() => {
    let active = true;
    void (async () => {
      await reload();
      if (active) setIsReady(true);
    })();
    return () => {
      active = false;
    };
  }, [reload]);

  /** Build the roadmap from the empty state's CTA (POST /roadmap/generate is synchronous), then refetch. */
  const generateRoadmap = useCallback(async (): Promise<boolean> => {
    setGenerating(true);
    try {
      await apiClient('/roadmap/generate', { method: 'POST' });
      await fetchToday();
      announceMissionChanged();
      return true;
    } catch (err) {
      setError(errorOf(err));
      return false;
    } finally {
      setGenerating(false);
    }
  }, [fetchToday]);

  // --- task actions (editor-only; a mentor gets 403) ------------------------
  // Each hits PATCH/POST /missions/tasks and then re-fetches /today so the
  // mission-level status (which the single-task response does not carry) stays
  // correct. Optimistic where it reads cleanly; refetch is the source of truth.

  const patchTask = useCallback(
    async (id: string, body: Record<string, unknown>) => {
      try {
        await apiClient(`/missions/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
        await fetchToday();
        announceMissionChanged();
      } catch (err) {
        // 404 → the task is gone/cross-workspace: drop it locally (guide §7).
        if (err instanceof ApiError && err.status === 404) {
          setTasks((prev) => prev.filter((t) => t.id !== id));
          return;
        }
        setError(errorOf(err));
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
    async (title: string): Promise<boolean> => {
      try {
        await apiClient('/missions/tasks', { method: 'POST', body: JSON.stringify({ title, effort: 'medium' }) });
        await fetchToday();
        announceMissionChanged();
        return true;
      } catch (err) {
        setError(errorOf(err));
        return false;
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
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status: 'rejected' } : t)));
      // reject_reason must EXACTLY match a server VALID_REJECT_REASONS string —
      // note the straight apostrophe in "Doesn't apply" (a curly one 422s).
      void patchTask(id, { action: 'reject', reject_reason: reason ?? "Doesn't apply" });
    },
    [patchTask]
  );

  // Reorder swaps this task's `order` with its neighbour among the tasks still
  // on today's list. The API sets one task's order per call, so we PATCH both
  // sides then refetch.
  const swapOrder = useCallback(
    async (id: string, dir: -1 | 1) => {
      const sorted = tasks.filter((t) => t.status === 'pending' || t.status === 'completed').sort((a, b) => a.order - b.order);
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
        setError(errorOf(err));
        await fetchToday();
      }
    },
    [tasks, fetchToday]
  );

  const reprioritizeUp = useCallback((id: string) => swapOrder(id, -1), [swapOrder]);
  const reprioritizeDown = useCallback((id: string) => swapOrder(id, 1), [swapOrder]);

  /** Saves a settings change; resolves true on success, false after reverting to the server's values. */
  const updateSettings = useCallback(
    async (payload: Partial<MissionSettings>): Promise<boolean> => {
      setSettings((cur) => (cur ? { ...cur, ...payload } : cur)); // optimistic
      const body: Record<string, unknown> = {};
      if (payload.missionSize !== undefined) body.mission_size = payload.missionSize;
      if (payload.deliveryTime !== undefined) body.delivery_time = selectTimeToApi(payload.deliveryTime);
      if (payload.weekendsOff !== undefined) body.weekend_missions = !payload.weekendsOff;
      try {
        const res = await apiClient<{ data?: RawSettings }>('/missions/settings', { method: 'PATCH', body: JSON.stringify(body) });
        if (res?.data) setSettings(mapSettings(res.data));
        return true;
      } catch (err) {
        setError(errorOf(err));
        await fetchSettings(); // revert to server truth
        return false;
      }
    },
    [fetchSettings]
  );

  const todayTasks = tasks.filter((t) => t.status === 'pending' || t.status === 'completed');
  // The server keeps status "complete" when a custom task is added after the day was cleared (guide §6),
  // but an open task must never hide behind the celebration: finished means complete AND nothing left open.
  const allCompleted = state === 'complete' && !tasks.some((t) => t.status === 'pending');

  return {
    isReady,
    state,
    streak,
    missionDate,
    emptyReason,
    assigned,
    generating,
    error,
    tasks,
    todayTasks,
    allCompleted,
    settings,
    settingsError,
    refetch: reload,
    generateRoadmap,
    toggleTask,
    addTask,
    snoozeTask,
    rejectTask,
    reprioritizeUp,
    reprioritizeDown,
    updateSettings,
  };
}
