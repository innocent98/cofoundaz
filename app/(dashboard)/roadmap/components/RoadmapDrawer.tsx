import React from 'react';
import { X, Calendar, User, CheckCircle2, Circle } from 'lucide-react';
import { RoadmapMilestone, RoadmapTask } from '@/hooks/useRoadmapApi';

interface RoadmapDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  milestone?: RoadmapMilestone | null;
}

export function RoadmapDrawer({ isOpen, onClose, milestone }: RoadmapDrawerProps) {
  if (!isOpen || !milestone) return null;

  const completedTasks = milestone.tasks.filter(t => t.status === 'done').length;
  const totalTasks = milestone.tasks.length;
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/20 z-50 transition-opacity backdrop-blur-[1px]"
        onClick={onClose}
      />
      
      {/* Slide-over */}
      <div className="fixed inset-y-0 right-0 w-full md:w-[400px] bg-white shadow-2xl z-50 transform transition-transform duration-300 flex flex-col border-l border-[#EBEBE6]">
        <div className="flex items-center justify-between p-6 border-b border-[#EBEBE6]">
          <h2 className="text-lg font-bold text-[#1E2923] tracking-tight truncate pr-4">
            {milestone.title}
          </h2>
          <button 
            onClick={onClose}
            className="p-2 -mr-2 text-[#768478] hover:bg-[#F5F5F0] rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-8">
          
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-[#617065]">
                <Calendar className="w-4 h-4" />
                <span>Due Date</span>
              </div>
              <span className="font-semibold text-[#1E2923]">{milestone.dueOn}</span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-[#617065]">
                <User className="w-4 h-4" />
                <span>Owner</span>
              </div>
              <span className="font-semibold text-[#1E2923]">{milestone.ownerId}</span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-[#617065]">
                <CheckCircle2 className="w-4 h-4" />
                <span>Status</span>
              </div>
              <select 
                className="bg-[#F7F7F5] border border-[#EBEBE6] rounded-md px-2 py-1 text-sm font-semibold outline-none"
                defaultValue={milestone.status}
              >
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
          </div>

          <div className="h-px bg-[#EBEBE6] w-full" />

          {/* Sub-tasks */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-[#1E2923] text-sm">Tasks</h3>
              <span className="text-xs font-semibold text-[#617065]">
                {progressPercent}%
              </span>
            </div>
            
            <div className="w-full h-1.5 bg-[#EBEBE6] rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#2D5A3F] transition-all duration-500" 
                style={{ width: `${progressPercent}%` }} 
              />
            </div>

            <div className="flex flex-col gap-3 mt-2">
              {milestone.tasks.map((task) => (
                <div key={task.id} className="flex items-start gap-3 p-3 rounded-card border border-[#EBEBE6] bg-[#FAFAFA]">
                  <button className="mt-0.5 text-[#A8894B]">
                    {task.status === 'done' ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                  </button>
                  <div className="flex flex-col gap-1 flex-1">
                    <span className={`text-sm font-semibold ${task.status === 'done' ? 'text-[#8E9B90] line-through' : 'text-[#1E2923]'}`}>
                      {task.title}
                    </span>
                    <div className="flex items-center gap-3 text-[11px] font-medium text-[#768478] mt-1">
                      <span>Effort: {task.effort}</span>
                      {task.dependsOn && task.dependsOn.length > 0 && (
                        <span className="text-[#9C5B34]">Blocks: {task.dependsOn.length}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        <div className="p-6 border-t border-[#EBEBE6] bg-[#FAFAFA]">
          <button className="w-full bg-[#183B28] hover:bg-[#11291C] text-white font-bold py-3 rounded-card transition-colors shadow-sm">
            Mark Milestone Complete
          </button>
        </div>
      </div>
    </>
  );
}
