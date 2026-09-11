"use client";

import React, { useState } from "react";
import { useSalesApi } from "@/hooks/useSalesApi";

export default function SequencesPage() {
  const { sequences } = useSalesApi();
  const [stopOnStageMove, setStopOnStageMove] = useState(false);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-display font-semibold text-sage-900">Email sequences</h1>
        <button className="bg-[#9C5B34] hover:bg-[#8A5330] text-white font-semibold px-4 py-2 rounded-card text-sm transition-colors shadow-sm">
          + New sequence
        </button>
      </div>

      {sequences.map((seq) => (
        <div key={seq.id} className="bg-white rounded-modal border border-sage-200/90 p-6 md:p-8 shadow-card space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-sage-100">
            <div>
              <h2 className="text-xl md:text-2xl font-display font-bold text-sage-900">
                {seq.name}
              </h2>
              <span className="text-sm text-sage-500 font-medium block mt-1">
                {seq.stats}
              </span>
            </div>
            
            <div className="flex items-center gap-6 bg-sage-50/50 border border-sage-200 rounded-card p-3">
              <div className="flex items-center gap-2">
                <input type="checkbox" checked disabled className="rounded border-sage-300 text-[#1e4836] focus:ring-[#1e4836]" />
                <span className="text-sm text-sage-600 font-medium cursor-not-allowed">Stop when they reply (locked)</span>
              </div>
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  checked={stopOnStageMove}
                  onChange={(e) => setStopOnStageMove(e.target.checked)}
                  className="rounded border-sage-300 text-[#1e4836] focus:ring-[#1e4836] cursor-pointer" 
                  id="stop-stage"
                />
                <label htmlFor="stop-stage" className="text-sm text-sage-700 font-medium cursor-pointer">Stop when deal moves stage</label>
              </div>
            </div>
          </div>

          <div className="space-y-6 pt-2">
            {seq.steps.map((step) => (
              <div 
                key={step.stepNumber} 
                className="bg-[#f7f9f8] rounded-card p-4 md:p-6 border border-sage-200/70 flex flex-col md:flex-row items-start gap-4 md:gap-6 relative"
              >
                <div className="w-8 h-8 rounded-input bg-[#e2ede6] text-[#1e4836] font-display font-bold text-sm flex items-center justify-center flex-shrink-0 border border-[#d2e2d8]">
                  {step.stepNumber}
                </div>
                
                <div className="space-y-3 flex-1 min-w-0 w-full">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-sage-500 font-bold uppercase tracking-wider">Delay</span>
                    <input type="text" defaultValue={step.waitText} className="text-sm font-medium bg-white border border-sage-200 rounded px-2 py-1 max-w-[200px]" />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-sage-500 uppercase tracking-wider block">Subject</label>
                    <input 
                      type="text" 
                      defaultValue={step.subject} 
                      className="w-full font-display font-bold text-sage-900 text-base border border-sage-300 rounded-input px-3 py-2 bg-white focus:outline-none focus:border-sage-500"
                    />
                  </div>
                  
                  <div className="space-y-2 relative">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-sage-500 uppercase tracking-wider block">Body</label>
                      <button className="text-xs font-bold text-[#9C5B34] flex items-center gap-1 hover:text-[#8A5330] transition-colors">
                        <span>✨</span> Write with AI
                      </button>
                    </div>
                    <textarea 
                      defaultValue={step.description}
                      rows={4}
                      className="w-full text-sm text-sage-700 font-medium leading-relaxed border border-sage-300 rounded-input px-3 py-2 bg-white focus:outline-none focus:border-sage-500"
                    />
                    <div className="flex gap-2 pt-1">
                      <span className="text-[10px] bg-sage-200 text-sage-700 px-2 py-0.5 rounded font-bold uppercase cursor-pointer hover:bg-sage-300 transition-colors">{"{{first_name}}"}</span>
                      <span className="text-[10px] bg-sage-200 text-sage-700 px-2 py-0.5 rounded font-bold uppercase cursor-pointer hover:bg-sage-300 transition-colors">{"{{company}}"}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-sage-100 flex items-start gap-3">
            <span className="text-lg">🔒</span>
            <div className="text-xs text-sage-500 font-medium leading-relaxed">
              <span className="text-sage-700 font-bold block mb-0.5">Compliance note</span>
              {seq.footerNote}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
