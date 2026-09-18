import { useState, useCallback, useEffect } from 'react';
import { apiClient, ApiError } from '@/lib/api/client';

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

  // Cycle pre-check for instant feedback. The edge being added is
  // "dependentId depends on prereqId" (the form: prereq "must finish before"
  // dependent). A cycle would form iff prereqId already depends — transitively —
  // on dependentId, so BFS from prereqId along `dependsOn` and see if it reaches
  // dependentId. The backend is the authority (409 DEPENDENCY_CYCLE, guide §6);
  // this just avoids a round-trip for obvious loops.
  const wouldCreateCycle = useCallback(
    (prereqId: string, dependentId: string) => {
      if (prereqId === dependentId) return true;

      const taskMap = new Map<string, RoadmapTask>();
      getAllTasks().forEach((t) => taskMap.set(t.id, t));

      const visited = new Set<string>();
      const queue = [prereqId];

      while (queue.length > 0) {
        const currentId = queue.shift()!;
        if (currentId === dependentId) return true; // path prereq → dependent exists

        if (!visited.has(currentId)) {
          visited.add(currentId);
          const currentTask = taskMap.get(currentId);
          if (currentTask?.dependsOn) queue.push(...currentTask.dependsOn);
        }
      }

      return false;
    },
    [getAllTasks]
  );

  // Persist a dependency: "prereqTask must finish before dependentTask" →
  // dependentTask depends on prereqTask → POST /roadmap/tasks/{dependentId}/
  // dependencies {depends_on_task_id: prereqId}. 201 new / 200 idempotent both
  // succeed; the tree carries `depends_on` since Slice 2, so refetch reflects it.
  // On a 409 (cycle) / 422 (self) / 404, surface the server's message directly —
  // its 409 names the two conflicting tasks by title (guide §6).
  const addDependency = useCallback(
    async (prereqId: string, dependentId: string): Promise<{ success: boolean; error?: string }> => {
      const tasks = getAllTasks();
      const prereq = tasks.find((t) => t.id === prereqId);
      const dependent = tasks.find((t) => t.id === dependentId);
      if (!prereq || !dependent) return { success: false, error: 'Task not found.' };
      if (prereqId === dependentId) return { success: false, error: "A task can't depend on itself." };
      if (wouldCreateCycle(prereqId, dependentId)) {
        return {
          success: false,
          error: `That would create a loop — ${prereq.title} already depends on ${dependent.title}.`,
        };
      }
      try {
        await apiClient(`/roadmap/tasks/${dependentId}/dependencies`, {
          method: 'POST',
          body: JSON.stringify({ depends_on_task_id: prereqId }),
        });
        await refetch();
        return { success: true };
      } catch (err) {
        if (err instanceof ApiError) {
          const d = err.data as { error?: { message?: string } } | undefined;
          return { success: false, error: d?.error?.message || 'Could not add that dependency.' };
        }
        return { success: false, error: 'Could not add that dependency.' };
      }
    },
    [getAllTasks, wouldCreateCycle, refetch]
  );

  // Remove one edge: dependentTask no longer depends on prereqTask →
  // DELETE /roadmap/tasks/{dependentId}/dependencies/{prereqId}.
  const removeDependency = useCallback(
    async (dependentId: string, prereqId: string): Promise<{ success: boolean; error?: string }> => {
      try {
        await apiClient(`/roadmap/tasks/${dependentId}/dependencies/${prereqId}`, { method: 'DELETE' });
        await refetch();
        return { success: true };
      } catch (err) {
        if (err instanceof ApiError) {
          const d = err.data as { error?: { message?: string } } | undefined;
          return { success: false, error: d?.error?.message || 'Could not remove that dependency.' };
        }
        return { success: false, error: 'Could not remove that dependency.' };
      }
    },
    [refetch]
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
    removeDependency,
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
