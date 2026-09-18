'use client';

import React, { useState } from 'react';
import { useRoadmapApi, RoadmapMilestone, Stage } from '@/hooks/useRoadmapApi';
import { RoadmapDrawer } from './components/RoadmapDrawer';
import { AlertCircle, RotateCw, Plus, Trash2 } from 'lucide-react';

export default function TimelinePage() {
  const {
    currentStage,
    phases,
    loading,
    createPhase,
    deletePhase,
    createMilestone,
    createTask,
    updateTask,
    deleteTask,
    updateMilestone,
    deleteMilestone,
  } = useRoadmapApi();
  const [zoom, setZoom] = useState<'Week' | 'Month' | 'Quarter'>('Month');

  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const stages: Stage[] = ['Idea', 'Validation', 'Launch', 'Traction', 'Scale'];

  // Derive the open milestone from live state so it reflects edits after refetch.
  const selectedMilestone =
    phases.flatMap((p) => p.milestones).find((m) => m.id === selectedMilestoneId) ?? null;

  const openDrawer = (milestone: RoadmapMilestone) => {
    setSelectedMilestoneId(milestone.id);
    setIsDrawerOpen(true);
  };

  const handleAddPhase = async () => {
    const name = window.prompt('New phase name');
    if (name && name.trim()) await createPhase(name.trim());
  };

  const handleAddMilestone = async (phaseId: string) => {
    const title = window.prompt('New milestone title');
    if (title && title.trim()) await createMilestone(phaseId, title.trim());
  };

  const handleDeletePhase = async (phaseId: string, name: string) => {
    if (!window.confirm(`Delete phase "${name}" and everything under it? This cannot be undone.`)) return;
    await deletePhase(phaseId);
  };

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-display font-medium text-[#1E2923] tracking-tight">
            Roadmap
          </h2>
          <p className="text-xs text-[#617065]">
            Your path from <span className="font-bold text-[#2D5A3F]">{currentStage}</span> to profitability — I re-plan it when reality changes.
          </p>
        </div>

        {/* Stage Rails */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
          {stages.map((s, idx) => (
            <div key={s} className="flex items-center gap-2">
              <div 
                className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap border transition-colors ${
                  s === currentStage 
                    ? 'bg-[#183B28] text-white border-[#183B28]' 
                    : 'bg-white text-[#768478] border-[#EBEBE6]'
                }`}
              >
                {idx + 1}. {s}
              </div>
              {idx < stages.length - 1 && (
                <div className="w-4 h-px bg-[#DCE6E1]" />
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between mt-2">
          <h3 className="font-bold text-[#1E2923] text-sm">Timeline Canvas</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={handleAddPhase}
              className="flex items-center gap-1.5 bg-[#183B28] hover:bg-[#11291C] text-white font-bold px-3 py-1.5 rounded-card text-xs transition-colors shadow-card"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add phase</span>
            </button>
          <div className="flex items-center gap-1 bg-[#F5F5F0] p-1 rounded-card border border-[#EBEBE6]">
            {(['Week', 'Month', 'Quarter'] as const).map((z) => (
              <button
                key={z}
                onClick={() => setZoom(z)}
                className={`px-3 py-1.5 rounded-[6px] text-xs font-medium transition-all ${
                  zoom === z
                    ? 'bg-white text-[#1E2923] font-bold shadow-card'
                    : 'bg-transparent text-[#768478] hover:text-[#1E2923]'
                }`}
              >
                {z}
              </button>
            ))}
          </div>
          </div>
        </div>

        {/* Gantt Canvas Mockup */}
        <div className="bg-white rounded-modal border border-[#EBEBE6] shadow-card overflow-x-auto min-h-[500px] relative">
          
          {/* Vertical Today Line */}
          <div className="absolute top-0 bottom-0 left-[40%] w-[2px] bg-[#B0483B] z-10 pointer-events-none">
            <div className="absolute top-0 -left-6 bg-[#B0483B] text-white text-[10px] font-bold px-2 py-0.5 rounded-b-md">
              TODAY
            </div>
          </div>

          <div className="min-w-[800px] p-6 flex flex-col gap-8 pt-12">
            {loading && (
              <div className="flex flex-col gap-4 animate-pulse pt-8">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-[72px] w-[300px] bg-[#F0F0EC] rounded-card" style={{ marginLeft: `${i * 20 + 10}%` }} />
                ))}
              </div>
            )}
            {!loading && phases.length === 0 && (
              <div className="flex flex-col items-center justify-center py-24 text-center gap-2">
                <p className="text-base font-semibold text-[#1E2923]">No roadmap yet</p>
                <p className="text-sm text-[#768478] max-w-sm">
                  Your roadmap will appear here once it&apos;s generated from your startup stage.
                </p>
              </div>
            )}
            {!loading && phases.map((phase) => (
              <div key={phase.id} className="flex flex-col gap-4">
                <div className="flex items-center gap-3 group/phase">
                  <h4 className="text-xs font-bold text-[#617065] uppercase tracking-wider">
                    Phase {phase.order}: {phase.name}
                  </h4>
                  <div className="flex items-center gap-1 opacity-0 group-hover/phase:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleAddMilestone(phase.id)}
                      className="flex items-center gap-1 text-[11px] font-semibold text-[#183B28] hover:text-[#11291C]"
                    >
                      <Plus className="w-3 h-3" /> Milestone
                    </button>
                    <button
                      onClick={() => handleDeletePhase(phase.id, phase.name)}
                      className="p-1 rounded-input text-[#768478] hover:text-[#A34B4B] hover:bg-[#FBEBEB] transition-colors"
                      aria-label="Delete phase"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-3 relative">
                  {/* Timeline track background lines */}
                  <div className="absolute top-0 bottom-0 left-0 right-0 border-l border-[#F0F0EC] ml-[15%]" />
                  <div className="absolute top-0 bottom-0 left-0 right-0 border-l border-[#F0F0EC] ml-[50%]" />
                  <div className="absolute top-0 bottom-0 left-0 right-0 border-l border-[#F0F0EC] ml-[85%]" />

                  {phase.milestones.map((ms, msIdx) => (
                    <div 
                      key={ms.id} 
                      onClick={() => openDrawer(ms)}
                      className="relative z-20 bg-white border border-[#EBEBE6] rounded-card p-3 shadow-card hover:shadow-raised hover:border-[#C5CFC7] transition-all cursor-pointer flex flex-col gap-2 w-[300px]"
                      style={{ marginLeft: `${(msIdx * 20) + 10}%` }} // Mock positioning
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-sm font-bold text-[#1E2923] leading-snug">
                          {ms.title}
                        </span>
                        
                        {ms.status === 'overdue' && (
                          <div className="flex items-center gap-1 bg-[#FDF2F2] text-[#B0483B] px-2 py-0.5 rounded text-[10px] font-bold shrink-0 border border-[#FAD7D7]">
                            <AlertCircle className="w-3 h-3" />
                            Overdue
                          </div>
                        )}
                        {ms.isReplanned && (
                          <div 
                            className="flex items-center gap-1 bg-copper-100 text-copper-600 px-2 py-0.5 rounded text-[10px] font-bold shrink-0 border border-copper-200"
                            title={ms.replannedReason}
                          >
                            <RotateCw className="w-3 h-3" />
                            ↻ Re-planned
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-xs text-[#768478] font-medium">
                        <span>{ms.dueOn}</span>
                        <span>{ms.progress}%</span>
                      </div>
                      
                      <div className="w-full h-1.5 bg-[#EBEBE6] rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all ${ms.status === 'overdue' ? 'bg-[#B0483B]' : 'bg-[#2D5A3F]'}`}
                          style={{ width: `${ms.progress}%` }} 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>

      <RoadmapDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        milestone={selectedMilestone}
        onCreateTask={createTask}
        onUpdateTask={updateTask}
        onDeleteTask={deleteTask}
        onUpdateMilestone={updateMilestone}
        onDeleteMilestone={deleteMilestone}
      />
    </>
  );
}
