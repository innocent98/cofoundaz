'use client';

import React from 'react';
import { useRoadmapApi } from '@/hooks/useRoadmapApi';
import { MoreHorizontal, Sparkles, AlertCircle } from 'lucide-react';

export default function MilestonesPage() {
  const { phases } = useRoadmapApi();

  const allMilestones = phases.flatMap(p => 
    p.milestones.map(m => ({ ...m, phaseName: p.name }))
  );

  return (
    <div className="flex flex-col gap-6 h-full">
      <div>
        <h2 className="text-3xl font-display font-medium text-[#1E2923] tracking-tight">
          Milestones
        </h2>
        <p className="text-xs text-[#617065] mt-1.5">
          List view of all key deliverables across your roadmap.
        </p>
      </div>

      <div className="bg-white rounded-modal border border-[#EBEBE6] shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-[#F7F7F5] border-b border-[#EBEBE6] text-[11px] font-bold tracking-wider text-[#768478] uppercase">
                <th className="py-3.5 px-6 font-bold">Milestone Title</th>
                <th className="py-3.5 px-6 font-bold">Phase</th>
                <th className="py-3.5 px-6 font-bold">Due Date</th>
                <th className="py-3.5 px-6 font-bold">Progress</th>
                <th className="py-3.5 px-6 font-bold">Status</th>
                <th className="py-3.5 px-6 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F0EC] text-xs font-medium text-[#1E2923]">
              {allMilestones.map((ms) => (
                <tr key={ms.id} className="hover:bg-[#FAF9F6] transition-colors group">
                  <td className="py-4 px-6 font-bold text-[#1E2923]">
                    {ms.title}
                  </td>
                  <td className="py-4 px-6 text-[#556358]">{ms.phaseName}</td>
                  <td className="py-4 px-6 text-[#556358]">{ms.dueOn}</td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-24 h-1.5 bg-[#EBEBE6] rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all ${ms.status === 'overdue' ? 'bg-[#B0483B]' : 'bg-[#2D5A3F]'}`}
                          style={{ width: `${ms.progress}%` }} 
                        />
                      </div>
                      <span className="text-[11px] text-[#768478] font-bold w-8">{ms.progress}%</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    {ms.status === 'overdue' ? (
                      <span className="flex w-fit items-center gap-1 bg-[#FDF2F2] text-[#B0483B] px-2 py-0.5 rounded text-[10px] font-bold border border-[#FAD7D7]">
                        <AlertCircle className="w-3 h-3" />
                        Overdue
                      </span>
                    ) : ms.status === 'completed' ? (
                      <span className="flex w-fit items-center gap-1 bg-[#EAF2ED] text-[#2D5A3F] px-2 py-0.5 rounded text-[10px] font-bold border border-[#CDE1D3]">
                        Completed
                      </span>
                    ) : (
                      <span className="flex w-fit items-center gap-1 bg-[#F5F5F0] text-[#617065] px-2 py-0.5 rounded text-[10px] font-bold border border-[#EBEBE6]">
                        Pending
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-6 text-right relative">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        className="hidden group-hover:flex items-center gap-1.5 text-xs font-semibold text-[#8A5330] hover:text-[#967941] px-3 py-1.5 rounded-card hover:bg-[#FDFBF7] transition-colors border border-transparent hover:border-[#F2E8D5]"
                        title="Ask AI to break this down"
                      >
                        <Sparkles className="w-3 h-3" />
                        Break down
                      </button>
                      
                      <button className="p-1.5 text-[#768478] hover:bg-[#EBEBE6] rounded-md transition-colors">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
