import { useState, useCallback } from 'react';

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

const initialPhases: RoadmapPhase[] = [
  {
    id: 'ph-1',
    name: 'Customer Discovery',
    order: 1,
    startsOn: '2023-09-01',
    endsOn: '2023-09-30',
    milestones: [
      {
        id: 'ms-1',
        phaseId: 'ph-1',
        title: 'Conduct 20 user interviews',
        dueOn: '2023-09-15',
        ownerId: 'usr-1',
        status: 'completed',
        progress: 100,
        tasks: [
          { id: 't-1', milestoneId: 'ms-1', title: 'Write interview script', effort: 'Low', status: 'done', dueOn: '2023-09-02' },
          { id: 't-2', milestoneId: 'ms-1', title: 'Recruit participants', effort: 'Medium', status: 'done', dueOn: '2023-09-05', dependsOn: ['t-1'] },
          { id: 't-3', milestoneId: 'ms-1', title: 'Synthesize findings', effort: 'Medium', status: 'done', dueOn: '2023-09-15', dependsOn: ['t-2'] },
        ]
      }
    ]
  },
  {
    id: 'ph-2',
    name: 'MVP Build',
    order: 2,
    startsOn: '2023-10-01',
    endsOn: '2023-11-15',
    milestones: [
      {
        id: 'ms-2',
        phaseId: 'ph-2',
        title: 'Core App Engine',
        dueOn: '2023-10-20',
        ownerId: 'usr-1',
        status: 'overdue',
        progress: 60,
        tasks: [
          { id: 't-4', milestoneId: 'ms-2', title: 'Database schema design', effort: 'High', status: 'done', dueOn: '2023-10-05' },
          { id: 't-5', milestoneId: 'ms-2', title: 'API scaffolding', effort: 'Medium', status: 'in_progress', dueOn: '2023-10-10', dependsOn: ['t-4'] },
          { id: 't-6', milestoneId: 'ms-2', title: 'Auth implementation', effort: 'High', status: 'overdue', dueOn: '2023-10-15', dependsOn: ['t-5'] },
        ]
      },
      {
        id: 'ms-3',
        phaseId: 'ph-2',
        title: 'User Interface',
        dueOn: '2023-11-10',
        ownerId: 'usr-2',
        status: 'pending',
        progress: 10,
        isReplanned: true,
        replannedReason: 'Adjusted on Oct 1 because Core App Engine took longer than expected.',
        tasks: [
          { id: 't-7', milestoneId: 'ms-3', title: 'Design system setup', effort: 'Medium', status: 'in_progress', dueOn: '2023-10-25' },
          { id: 't-8', milestoneId: 'ms-3', title: 'Implement Dashboard', effort: 'High', status: 'todo', dueOn: '2023-11-05', dependsOn: ['t-7', 't-6'] },
        ]
      }
    ]
  }
];

export function useRoadmapApi() {
  const [currentStage] = useState<Stage>('Validation');
  const [phases, setPhases] = useState<RoadmapPhase[]>(initialPhases);

  // Helper to get all tasks in a flat list
  const getAllTasks = useCallback(() => {
    return phases.flatMap(p => p.milestones.flatMap(m => m.tasks));
  }, [phases]);

  // Cycle Detection: returns true if adding an edge from "fromTaskId" to "toTaskId" creates a cycle
  // (Meaning toTaskId already depends on fromTaskId, directly or transitively)
  const wouldCreateCycle = useCallback((fromTaskId: string, toTaskId: string) => {
    if (fromTaskId === toTaskId) return true;
    
    const tasks = getAllTasks();
    const taskMap = new Map<string, RoadmapTask>();
    tasks.forEach(t => taskMap.set(t.id, t));

    // We want to check if toTaskId can reach fromTaskId through its dependencies.
    // Because if we add (fromTaskId -> toTaskId), fromTaskId must happen before toTaskId.
    // If toTaskId -> ... -> fromTaskId already exists, then we have a cycle.
    
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
  }, [getAllTasks]);

  const addDependency = useCallback((fromTaskId: string, toTaskId: string): { success: boolean, error?: string } => {
    const tasks = getAllTasks();
    const fromTask = tasks.find(t => t.id === fromTaskId);
    const toTask = tasks.find(t => t.id === toTaskId);

    if (!fromTask || !toTask) return { success: false, error: 'Task not found' };

    if (wouldCreateCycle(fromTaskId, toTaskId)) {
      return { 
        success: false, 
        error: `That would create a loop — ${fromTask.title} already depends on ${toTask.title}.` 
      };
    }

    // In a real app, send API request here.
    // Optimistic update:
    setPhases(prev => {
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
  }, [getAllTasks, wouldCreateCycle]);

  return {
    currentStage,
    phases,
    wouldCreateCycle,
    addDependency,
    getAllTasks
  };
}
