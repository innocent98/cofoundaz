'use client';

import React, { useState } from 'react';
import { useRoadmapApi, RoadmapMilestone, RoadmapTask } from '@/hooks/useRoadmapApi';
import { RoadmapDrawer } from '../components/RoadmapDrawer';
import { MoreHorizontal, GripVertical } from 'lucide-react';

export default function KanbanPage() {
  const { phases } = useRoadmapApi();
  const [groupBy, setGroupBy] = useState<'Phase' | 'Status'>('Status');
  
  const [selectedMilestone, setSelectedMilestone] = useState<RoadmapMilestone | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Grouping logic for Status
  const statusColumns = [
    { id: 'todo', label: 'To Do' },
    { id: 'in_progress', label: 'In Progress' },
    { id: 'done', label: 'Done' }
  ];

  const allMilestones = phases.flatMap(p => p.milestones);

  const openDrawer = (milestone: RoadmapMilestone) => {
    setSelectedMilestone(milestone);
    setIsDrawerOpen(true);
  };

  return (
    <>
      <div className="flex flex-col gap-6 h-full min-h-[calc(100vh-160px)]">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-display font-medium text-[#1E2923] tracking-tight">
            Kanban Board
          </h2>
          
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#768478]">Group by:</span>
            <div className="flex items-center gap-1 bg-[#F5F5F0] p-1 rounded-card border border-[#EBEBE6]">
              {(['Status', 'Phase'] as const).map((g) => (
                <button
                  key={g}
                  onClick={() => setGroupBy(g)}
                  className={`px-3 py-1.5 rounded-[6px] text-xs font-medium transition-all ${
                    groupBy === g
                      ? 'bg-white text-[#1E2923] font-bold shadow-sm'
                      : 'bg-transparent text-[#768478] hover:text-[#1E2923]'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 flex gap-6 overflow-x-auto no-scrollbar pb-4">
          
          {groupBy === 'Status' ? (
            statusColumns.map(col => {
              // Group tasks by status for mockup
              const colTasks = phases.flatMap(p => 
                p.milestones.flatMap(m => 
                  m.tasks.filter(t => t.status === col.id || (col.id === 'todo' && t.status === 'overdue'))
                    .map(t => ({ task: t, parentMilestone: m }))
                )
              );

              return (
                <div key={col.id} className="flex-shrink-0 w-[320px] flex flex-col gap-3">
                  <div className="flex items-center justify-between px-1">
                    <h3 className="font-bold text-sm text-[#1E2923]">{col.label}</h3>
                    <span className="text-xs font-bold text-[#8E9B90] bg-[#EBEBE6] px-2 py-0.5 rounded-full">
                      {colTasks.length}
                    </span>
                  </div>
                  
                  <div className="flex-1 bg-[#F0F0EC] rounded-modal p-3 flex flex-col gap-3 min-h-[200px]">
                    {colTasks.map(({ task, parentMilestone }) => (
                      <div 
                        key={task.id}
                        onClick={() => openDrawer(parentMilestone)}
                        className="bg-white border border-[#EBEBE6] rounded-card p-4 shadow-sm hover:shadow-md hover:border-[#C5CFC7] transition-all cursor-pointer flex flex-col gap-3 group"
                      >
                        <div className="flex items-start gap-2">
                          <GripVertical className="w-4 h-4 text-[#C5CFC7] mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab shrink-0" />
                          <span className="text-sm font-bold text-[#1E2923] leading-snug flex-1">
                            {task.title}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] font-medium text-[#768478] pl-6">
                          <span className="truncate max-w-[150px]">MS: {parentMilestone.title}</span>
                          <span className="bg-[#F7F7F5] px-2 py-1 rounded border border-[#EBEBE6]">
                            {task.effort}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          ) : (
            phases.map(phase => (
              <div key={phase.id} className="flex-shrink-0 w-[320px] flex flex-col gap-3">
                <div className="flex items-center justify-between px-1">
                  <h3 className="font-bold text-sm text-[#1E2923]">{phase.name}</h3>
                  <span className="text-xs font-bold text-[#8E9B90] bg-[#EBEBE6] px-2 py-0.5 rounded-full">
                    {phase.milestones.length}
                  </span>
                </div>
                
                <div className="flex-1 bg-[#F0F0EC] rounded-modal p-3 flex flex-col gap-3 min-h-[200px]">
                  {phase.milestones.map(ms => (
                    <div 
                      key={ms.id}
                      onClick={() => openDrawer(ms)}
                      className="bg-white border border-[#EBEBE6] rounded-card p-4 shadow-sm hover:shadow-md hover:border-[#C5CFC7] transition-all cursor-pointer flex flex-col gap-3 group"
                    >
                      <div className="flex items-start gap-2">
                        <GripVertical className="w-4 h-4 text-[#C5CFC7] mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab shrink-0" />
                        <span className="text-sm font-bold text-[#1E2923] leading-snug flex-1">
                          {ms.title}
                        </span>
                      </div>
                      
                      <div className="w-full h-1.5 bg-[#EBEBE6] rounded-full overflow-hidden pl-6 ml-6 w-[calc(100%-24px)]">
                        <div 
                          className={`h-full transition-all ${ms.status === 'overdue' ? 'bg-[#B0483B]' : 'bg-[#2D5A3F]'}`}
                          style={{ width: `${ms.progress}%` }} 
                        />
                      </div>

                      <div className="flex items-center justify-between text-[11px] font-medium text-[#768478] pl-6">
                        <span>{ms.dueOn}</span>
                        <span>{ms.tasks.length} tasks</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}

        </div>
      </div>

      <RoadmapDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        milestone={selectedMilestone} 
      />
    </>
  );
}
