'use client';

import React, { useState } from 'react';
import { useRoadmapApi } from '@/hooks/useRoadmapApi';
import { AlertTriangle, Sparkles, ArrowRight, Check } from 'lucide-react';

export default function ReplanPage() {
  const { getAllTasks } = useRoadmapApi();
  const tasks = getAllTasks();
  
  const slippedTasks = tasks.filter(t => t.status === 'overdue');
  
  // Mock Diff state
  const [diffs, setDiffs] = useState([
    { id: 'd1', milestone: 'Core App Engine', oldDate: 'Oct 20', newDate: 'Nov 02', reason: '+2 weeks (Auth complexity)', accepted: true },
    { id: 'd2', milestone: 'User Interface', oldDate: 'Nov 10', newDate: 'Nov 24', reason: '+2 weeks (Blocked by Engine)', accepted: true },
    { id: 'd3', milestone: 'Beta Launch', oldDate: 'Dec 01', newDate: 'Dec 15', reason: '+2 weeks (Downstream shift)', accepted: false },
  ]);

  const toggleAccept = (id: string) => {
    setDiffs(prev => prev.map(d => d.id === id ? { ...d, accepted: !d.accepted } : d));
  };

  const acceptedCount = diffs.filter(d => d.accepted).length;

  return (
    <div className="flex flex-col gap-8 h-full pb-12">
      <div>
        <h2 className="text-3xl font-display font-medium text-[#1E2923] tracking-tight">
          AI Re-Plan
        </h2>
        <p className="text-xs text-[#617065] mt-1.5">
          Review adjustments to your roadmap before applying them.
        </p>
      </div>

      {slippedTasks.length > 0 && (
        <div className="bg-[#FDF2F2] border border-[#FAD7D7] rounded-modal p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-white rounded-full shrink-0 shadow-sm border border-[#FAD7D7]">
              <AlertTriangle className="w-5 h-5 text-[#B0483B]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#993A2E]">
                {slippedTasks.length} tasks have slipped. Want me to re-plan?
              </h3>
              <p className="text-xs text-[#B0483B] mt-1 leading-relaxed">
                Your target launch dates are currently mathematically impossible based on current velocity. Let me propose a realistic shift.
              </p>
            </div>
          </div>
          <button className="bg-[#B0483B] hover:bg-[#993A2E] text-white text-xs font-bold py-2.5 px-5 rounded-card transition-colors shadow-sm shrink-0 whitespace-nowrap">
            Generate Re-plan
          </button>
        </div>
      )}

      <div className="bg-white rounded-modal border border-[#EBEBE6] shadow-card flex flex-col">
        <div className="p-6 border-b border-[#EBEBE6] flex items-center gap-3">
          <div className="p-1.5 bg-[#F7EEDC] rounded-[6px]">
            <Sparkles className="w-5 h-5 fill-[#8A5330] text-[#8A5330]" />
          </div>
          <div>
            <h3 className="font-bold text-[#1E2923]">Proposed Adjustments</h3>
            <p className="text-xs text-[#768478]">Review changes carefully. Unchecked items remain on their current dates.</p>
          </div>
        </div>

        <div className="flex flex-col divide-y divide-[#EBEBE6]">
          {diffs.map((diff) => (
            <div key={diff.id} className={`p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-colors ${diff.accepted ? 'bg-white' : 'bg-[#FAFAFA]'}`}>
              
              <div className="flex flex-col gap-1.5 flex-1">
                <span className="text-sm font-bold text-[#1E2923]">{diff.milestone}</span>
                <span className="text-xs text-[#9C5B34] font-semibold">{diff.reason}</span>
              </div>

              <div className="flex items-center gap-4 flex-1">
                <div className="bg-[#F5F5F0] border border-[#EBEBE6] px-3 py-1.5 rounded text-xs font-bold text-[#768478] line-through">
                  {diff.oldDate}
                </div>
                <ArrowRight className="w-4 h-4 text-[#C5CFC7]" />
                <div className="bg-[#EAF2ED] border border-[#CDE1D3] px-3 py-1.5 rounded text-xs font-bold text-[#2D5A3F]">
                  {diff.newDate}
                </div>
              </div>

              <div className="shrink-0 flex items-center justify-end">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <span className={`text-xs font-bold ${diff.accepted ? 'text-[#2D5A3F]' : 'text-[#768478]'}`}>
                    {diff.accepted ? 'Accepted' : 'Reject'}
                  </span>
                  <div className={`relative w-12 h-6 rounded-full transition-colors ${diff.accepted ? 'bg-[#183B28]' : 'bg-[#DCE6E1]'}`}>
                    <div className={`absolute top-1 bottom-1 w-4 bg-white rounded-full transition-all shadow-sm ${diff.accepted ? 'left-7' : 'left-1'}`} />
                  </div>
                  <input 
                    type="checkbox" 
                    className="hidden" 
                    checked={diff.accepted} 
                    onChange={() => toggleAccept(diff.id)} 
                  />
                </label>
              </div>

            </div>
          ))}
        </div>

        <div className="p-6 bg-[#F7F7F5] rounded-b-modal border-t border-[#EBEBE6] flex justify-end">
          <button 
            className={`py-2.5 px-6 rounded-card font-bold text-xs transition-all shadow-sm flex items-center gap-2 ${
              acceptedCount > 0 
                ? 'bg-[#183B28] hover:bg-[#11291C] text-white' 
                : 'bg-[#EBEBE6] text-[#A3B1A6] cursor-not-allowed'
            }`}
            disabled={acceptedCount === 0}
          >
            <Check className="w-4 h-4" />
            Apply {acceptedCount} changes
          </button>
        </div>
      </div>
      
      <div className="flex flex-col gap-4 mt-4">
        <h3 className="text-sm font-bold text-[#1E2923]">Re-plan History</h3>
        <div className="bg-white rounded-card border border-[#EBEBE6] p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold text-[#1E2923]">Applied on October 1st</span>
              <span className="text-[11px] text-[#768478]">Pushed MVP Build milestones back by 1 week due to prolonged Customer Discovery.</span>
            </div>
            <span className="bg-[#F5F5F0] px-2 py-1 rounded text-[10px] font-bold text-[#617065]">2 changes</span>
          </div>
        </div>
      </div>
    </div>
  );
}
