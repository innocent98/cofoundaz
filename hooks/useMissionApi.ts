import { useState, useCallback, useEffect } from 'react';

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
  deliveryTime: string;
  weekendsOff: boolean;
}

export function useMissionApi() {
  const [tasks, setTasks] = useState<MissionTask[]>([]);
  const [missionDay, setMissionDay] = useState<MissionDay | null>(null);
  const [settings, setSettings] = useState<MissionSettings>({
    missionSize: 3,
    deliveryTime: '06:00 AM',
    weekendsOff: true,
  });
  
  // Wait to hydrate
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Seed with mock data
    const mockTasks: MissionTask[] = [
      {
        id: '1',
        missionId: 'm-1',
        title: 'Interview 3 gig workers about how they save today',
        reason: 'Why: this unblocks your Validation milestone due Friday.',
        tag: 'Validate demand',
        effort: '45 min',
        order: 1,
        status: 'pending',
      },
      {
        id: '2',
        missionId: 'm-1',
        title: 'Draft your pricing experiment',
        reason: 'Why: pricing is your riskiest untested assumption and moves both revenue and runway.',
        tag: 'Pricing test',
        effort: '30 min',
        order: 2,
        status: 'pending',
      },
      {
        id: '3',
        missionId: 'm-1',
        title: "Review Tayo's comments on the contractor NDA",
        reason: 'Why: it unblocks onboarding your first contractor next week.',
        tag: 'Legal setup',
        effort: '15 min',
        order: 3,
        status: 'pending',
      }
    ];

    setTasks(mockTasks);
    setMissionDay({
      id: 'm-1',
      date: new Date().toISOString(),
      streakCount: 6,
      status: 'pending',
      tasks: mockTasks,
    });
    setIsReady(true);
  }, []);

  const toggleTask = useCallback((id: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        return {
          ...t,
          status: t.status === 'completed' ? 'pending' : 'completed',
          completedAt: t.status === 'completed' ? undefined : new Date().toISOString()
        };
      }
      return t;
    }));
  }, []);

  const addTask = useCallback((title: string) => {
    const newTask: MissionTask = {
      id: Math.random().toString(36).substr(2, 9),
      missionId: 'm-1',
      title,
      reason: 'Why: you added this yourself.',
      tag: 'Your task',
      effort: '10 min',
      order: tasks.length + 1,
      status: 'pending'
    };
    setTasks(prev => [...prev, newTask]);
  }, [tasks.length]);

  const snoozeTask = useCallback((id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: 'snoozed' } : t));
  }, []);

  const rejectTask = useCallback((id: string, reason?: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: 'rejected' } : t));
  }, []);
  
  const reorderTasks = useCallback((dragIndex: number, hoverIndex: number) => {
      // Simplistic array swap
      setTasks(prev => {
          const updated = [...prev];
          const [moved] = updated.splice(dragIndex, 1);
          updated.splice(hoverIndex, 0, moved);
          return updated.map((t, idx) => ({ ...t, order: idx + 1 }));
      });
  }, []);
  
  const reprioritizeUp = useCallback((id: string) => {
      setTasks(prev => {
          const index = prev.findIndex(t => t.id === id);
          if (index > 0) {
              const updated = [...prev];
              const temp = updated[index];
              updated[index] = updated[index - 1];
              updated[index - 1] = temp;
              return updated.map((t, idx) => ({ ...t, order: idx + 1 }));
          }
          return prev;
      });
  }, []);
  
  const reprioritizeDown = useCallback((id: string) => {
      setTasks(prev => {
          const index = prev.findIndex(t => t.id === id);
          if (index < prev.length - 1) {
              const updated = [...prev];
              const temp = updated[index];
              updated[index] = updated[index + 1];
              updated[index + 1] = temp;
              return updated.map((t, idx) => ({ ...t, order: idx + 1 }));
          }
          return prev;
      });
  }, []);

  const updateSettings = useCallback((payload: Partial<MissionSettings>) => {
    setSettings(prev => ({ ...prev, ...payload }));
  }, []);

  const todayTasks = tasks.filter(t => t.status === 'pending' || t.status === 'completed');
  const allCompleted = todayTasks.length > 0 && todayTasks.every(t => t.status === 'completed');

  return {
    isReady,
    missionDay,
    tasks,
    todayTasks,
    allCompleted,
    settings,
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
