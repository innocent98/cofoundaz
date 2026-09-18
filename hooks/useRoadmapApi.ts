import { useState, useCallback, useEffect } from 'react';
import { apiClient } from '@/lib/api/client';

export type Stage = 'Idea' | 'Validation' | 'Launch' | 'Traction' | 'Scale';
export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'overdue';

export interface RoadmapTask {
  id: string;
  milestoneId: string;
  title: string;
  description?: string;
  effort: string;
  status: TaskStatus;
  assigneeId?: string;
  dueOn: string;
  dependsOn?: string[]; // task IDs
}

export interface RoadmapMilestone {
  id: string;
  phaseId: string;
  title: string;
  dueOn: string;
  ownerId: string;
  status: 'pending' | 'completed' | 'overdue';
  progress: number;
  isReplanned?: boolean;
  replannedReason?: string;
  tasks: RoadmapTask[];
}

export interface RoadmapPhase {
  id: string;
  name: string;
  order: number;
  startsOn: string;
  endsOn: string;
  milestones: RoadmapMilestone[];
}

// --- API → FE mapping -------------------------------------------------------
// GET /roadmap returns a phase → milestone → task tree (lazy-generated if none
// exists). See cofoundaz-api/docs/fe-integration-guide-roadmap.md §1.

const STAGE_LABEL: Record<string, Stage> = {
  idea: 'Idea',
  validation: 'Validation',
  launch: 'Launch',
  traction: 'Traction',
  scale: 'Scale',
};

interface OwnerRef {
  id: string;
  name: string | null;
}
interface RawTask {
  id: string;
  title: string;
  description: string | null;
  effort: string;
  status: string;
  assignee: OwnerRef | null;
  due_on: string | null;
  overdue: boolean;
  order: number;
  depends_on: string[];
}
interface RawMilestone {
  id: string;
  title: string;
  description: string | null;
  due_on: string | null;
  owner: OwnerRef | null;
  status: string;
  progress: number;
  overdue: boolean;
  order: number;
  dependency_count: number;
  replanned: { at: string; reason: string } | null;
  tasks: RawTask[];
}
interface RawPhase {
  id: string;
  name: string;
  order: number;
  starts_on: string | null;
  ends_on: string | null;
  milestones: RawMilestone[];
}
interface RawTree {
  roadmap: { id: string; stage: string; template_key?: string; generated_at?: string; drift?: { slipped_count: number } };
  current_stage: string | null;
  phases: RawPhase[];
}

function effortLabel(e: string): string {
  if (e === 'small') return 'Small';
  if (e === 'large') return 'Large';
  return 'Medium';
}

function mapTaskStatus(t: RawTask): TaskStatus {
  if (t.overdue) return 'overdue';
  if (t.status === 'done' || t.status === 'in_progress' || t.status === 'todo') return t.status;
  return 'todo';
}

function mapMilestoneStatus(m: RawMilestone): RoadmapMilestone['status'] {
  if (m.overdue) return 'overdue';
  if (m.status === 'done') return 'completed';
  return 'pending';
}

function mapTask(t: RawTask, milestoneId: string): RoadmapTask {
  return {
    id: t.id,
    milestoneId,
    title: t.title,
    description: t.description ?? undefined,
    effort: effortLabel(t.effort),
    status: mapTaskStatus(t),
    assigneeId: t.assignee?.name ?? (t.assignee ? 'Member' : undefined),
    dueOn: t.due_on ?? '',
    dependsOn: t.depends_on ?? [],
  };
}

function mapMilestone(m: RawMilestone, phaseId: string): RoadmapMilestone {
  return {
    id: m.id,
    phaseId,
    title: m.title,
    dueOn: m.due_on ?? '',
    // The FE displays this as the "Owner" label — show the name, not a raw UUID.
    ownerId: m.owner?.name ?? (m.owner ? 'Member' : 'Unassigned'),
    status: mapMilestoneStatus(m),
    progress: m.progress ?? 0,
    isReplanned: !!m.replanned,
    replannedReason: m.replanned?.reason,
    tasks: (m.tasks ?? []).map((t) => mapTask(t, m.id)).sort((a, b) => (a.dueOn > b.dueOn ? 1 : -1)),
  };
}

function mapPhase(p: RawPhase): RoadmapPhase {
  return {
    id: p.id,
    name: p.name,
    order: p.order,
    startsOn: p.starts_on ?? '',
    endsOn: p.ends_on ?? '',
    milestones: (p.milestones ?? []).map((m) => mapMilestone(m, p.id)).sort((a, b) => a.progress - b.progress),
  };
}

export function useRoadmapApi() {
  const [currentStage, setCurrentStage] = useState<Stage>('Idea');
  const [phases, setPhases] = useState<RoadmapPhase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient<{ data?: RawTree }>('/roadmap');
      const d = res?.data;
      if (d) {
        const stageKey = (d.current_stage || d.roadmap?.stage || 'idea').toLowerCase();
        setCurrentStage(STAGE_LABEL[stageKey] ?? 'Idea');
        setPhases((d.phases ?? []).map(mapPhase).sort((a, b) => a.order - b.order));
      } else {
        setPhases([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      setPhases([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      refetch();
    });
  }, [refetch]);

  // Helper to get all tasks in a flat list
  const getAllTasks = useCallback(() => {
    return phases.flatMap((p) => p.milestones.flatMap((m) => m.tasks));
  }, [phases]);

  // Cycle detection: returns true if adding an edge from "fromTaskId" to
  // "toTaskId" creates a cycle (toTaskId already depends on fromTaskId,
  // directly or transitively). Runs against the real fetched tree. The backend
  // also rejects cycles with a 409 DEPENDENCY_CYCLE (guide §6); this is a
  // client pre-check for instant feedback.
  const wouldCreateCycle = useCallback(
    (fromTaskId: string, toTaskId: string) => {
      if (fromTaskId === toTaskId) return true;

      const tasks = getAllTasks();
      const taskMap = new Map<string, RoadmapTask>();
      tasks.forEach((t) => taskMap.set(t.id, t));

      const visited = new Set<string>();
      const queue = [toTaskId];

      while (queue.length > 0) {
        const currentId = queue.shift()!;
        if (currentId === fromTaskId) return true; // Cycle detected

        if (!visited.has(currentId)) {
          visited.add(currentId);
          const currentTask = taskMap.get(currentId);
          if (currentTask && currentTask.dependsOn) {
            queue.push(...currentTask.dependsOn);
          }
        }
      }

      return false;
    },
    [getAllTasks]
  );

  // NOTE: dependency persistence (POST /roadmap/tasks/{id}/dependencies) is a
  // Roadmap follow-up — this applies the edge optimistically to the fetched
  // tree so the dependencies UI is responsive, but does not yet write it back.
  const addDependency = useCallback(
    (fromTaskId: string, toTaskId: string): { success: boolean; error?: string } => {
      const tasks = getAllTasks();
      const fromTask = tasks.find((t) => t.id === fromTaskId);
      const toTask = tasks.find((t) => t.id === toTaskId);

      if (!fromTask || !toTask) return { success: false, error: 'Task not found' };

      if (wouldCreateCycle(fromTaskId, toTaskId)) {
        return {
          success: false,
          error: `That would create a loop — ${fromTask.title} already depends on ${toTask.title}.`,
        };
      }

      setPhases((prev) => {
        const newPhases = JSON.parse(JSON.stringify(prev)) as RoadmapPhase[];
        for (const phase of newPhases) {
          for (const ms of phase.milestones) {
            for (const t of ms.tasks) {
              if (t.id === toTaskId) {
                if (!t.dependsOn) t.dependsOn = [];
                if (!t.dependsOn.includes(fromTaskId)) {
                  t.dependsOn.push(fromTaskId);
                }
              }
            }
          }
        }
        return newPhases;
      });

      return { success: true };
    },
    [getAllTasks, wouldCreateCycle]
  );

  // --- Writes (guide §3–§5) -------------------------------------------------
  // Every mutation re-fetches the tree afterwards: single create/patch responses
  // are flat (no server-derived `progress`/`overdue`, no nested tasks), so only a
  // re-read gives the UI the correct derived state. `progress` and `overdue` are
  // backend-owned and never sent. Never send an explicit `null` for a required
  // field (phase name/order; milestone title/status/order; task title/effort/
  // status/order) — that 422s; omit the field to leave it unchanged.

  const createPhase = useCallback(
    async (name: string) => {
      const res = await apiClient<{ data?: RawPhase }>('/roadmap/phases', {
        method: 'POST',
        body: JSON.stringify({ name }),
      });
      await refetch();
      return res?.data;
    },
    [refetch]
  );

  const updatePhase = useCallback(
    async (id: string, patch: { name?: string; order?: number; starts_on?: string | null; ends_on?: string | null }) => {
      const res = await apiClient<{ data?: RawPhase }>(`/roadmap/phases/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(patch),
      });
      await refetch();
      return res?.data;
    },
    [refetch]
  );

  const deletePhase = useCallback(
    async (id: string) => {
      await apiClient(`/roadmap/phases/${id}`, { method: 'DELETE' });
      await refetch();
    },
    [refetch]
  );

  const createMilestone = useCallback(
    async (phaseId: string, title: string) => {
      const res = await apiClient<{ data?: RawMilestone }>('/roadmap/milestones', {
        method: 'POST',
        body: JSON.stringify({ phase_id: phaseId, title }),
      });
      await refetch();
      return res?.data;
    },
    [refetch]
  );

  const updateMilestone = useCallback(
    async (
      id: string,
      patch: { title?: string; description?: string | null; due_on?: string | null; owner_id?: string | null; status?: string; order?: number }
    ) => {
      const res = await apiClient<{ data?: RawMilestone }>(`/roadmap/milestones/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(patch),
      });
      await refetch();
      return res?.data;
    },
    [refetch]
  );

  const deleteMilestone = useCallback(
    async (id: string) => {
      await apiClient(`/roadmap/milestones/${id}`, { method: 'DELETE' });
      await refetch();
    },
    [refetch]
  );

  const createTask = useCallback(
    async (milestoneId: string, title: string) => {
      const res = await apiClient<{ data?: RawTask }>('/roadmap/tasks', {
        method: 'POST',
        body: JSON.stringify({ milestone_id: milestoneId, title }),
      });
      await refetch();
      return res?.data;
    },
    [refetch]
  );

  const updateTask = useCallback(
    async (
      id: string,
      patch: { title?: string; description?: string | null; effort?: string; status?: string; assignee_id?: string | null; due_on?: string | null; order?: number }
    ) => {
      const res = await apiClient<{ data?: RawTask }>(`/roadmap/tasks/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(patch),
      });
      await refetch();
      return res?.data;
    },
    [refetch]
  );

  const deleteTask = useCallback(
    async (id: string) => {
      await apiClient(`/roadmap/tasks/${id}`, { method: 'DELETE' });
      await refetch();
    },
    [refetch]
  );

  return {
    currentStage,
    phases,
    loading,
    error,
    refetch,
    wouldCreateCycle,
    addDependency,
    getAllTasks,
    createPhase,
    updatePhase,
    deletePhase,
    createMilestone,
    updateMilestone,
    deleteMilestone,
    createTask,
    updateTask,
    deleteTask,
  };
}
