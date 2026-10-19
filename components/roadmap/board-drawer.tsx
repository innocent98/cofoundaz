'use client';

import React from 'react';
import { RoadmapDrawer } from '@/app/(dashboard)/roadmap/components/RoadmapDrawer';
import type { useRoadmapBoard } from '@/hooks/useRoadmapBoard';

/** The shared milestone drawer, wired to a `useRoadmapBoard()` result. */
export function BoardDrawer({ board }: { board: ReturnType<typeof useRoadmapBoard> }) {
  return (
    <RoadmapDrawer
      isOpen={board.selected !== null}
      onClose={board.close}
      milestone={board.selected}
      allTasks={board.getAllTasks()}
      members={board.members.members}
      canEdit={board.canEdit}
      breakdown={board.selected ? board.breakdown.states[board.selected.id] : undefined}
      onBreakdown={(id) => void board.breakdown.run(id)}
      highlightedTaskIds={board.breakdown.highlighted}
      focusTaskId={board.focusTaskId}
      onCreateTask={board.createTask}
      onUpdateTask={board.updateTask}
      onDeleteTask={board.deleteTask}
      onUpdateMilestone={board.updateMilestone}
      onDeleteMilestone={board.deleteMilestone}
    />
  );
}
