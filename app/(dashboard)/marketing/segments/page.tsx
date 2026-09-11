'use client';

import React, { useState } from "react";
import { useMarketingApi } from "@/hooks/useMarketingApi";

export default function MarketingSegmentsPage() {
  const { segments } = useMarketingApi();
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);

  return (
    <div className="space-y-6 animate-fadeIn relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl md:text-4xl font-display font-semibold text-sage-900 tracking-tight">
            Audience segments
          </h1>
        </div>

        <button
          onClick={() => setIsBuilderOpen(true)}
          className="bg-[#9C5B34] hover:bg-[#8A5330] text-white font-semibold px-5 py-2.5 rounded-card text-sm transition-all cursor-pointer shadow-card flex items-center gap-2 self-start md:self-auto"
        >
          <span>+ New segment</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {segments.map((seg, idx) => (
          <div
            key={idx}
            className="bg-white rounded-modal p-6 border border-sage-200/80 shadow-card flex flex-col justify-between space-y-6 hover:border-sage-300 transition-all"
          >
            <div className="space-y-3">
              <h3 className="font-display font-semibold text-lg text-sage-900">{seg.name}</h3>
              <div className="flex flex-wrap gap-2">
                {seg.tags.map((tag, tIdx) => (
                  <span
                    key={tIdx}
                    className="bg-[#e2ede6] text-[#1e4836] px-3 py-1 rounded-full text-xs font-medium border border-[#d2e2d8]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="text-xs text-sage-500 font-medium">
              Est. size <span className="text-sage-900 font-semibold">~{seg.sizeEstimate.toLocaleString()}</span> · Persona <span className="text-sage-900 font-semibold">Multiple</span>
            </div>
          </div>
        ))}
      </div>

      {isBuilderOpen && (
        <>
          <div className="fixed inset-0 bg-black/30 z-50 backdrop-blur-sm" onClick={() => setIsBuilderOpen(false)} />
          <div className="fixed inset-y-0 right-0 w-full max-w-lg bg-white z-50 shadow-2xl border-l border-sage-200 flex flex-col animate-fadeIn duration-300">
            <div className="flex items-center justify-between p-6 border-b border-sage-200">
              <h3 className="text-xl font-display font-semibold text-sage-900">Rule Builder</h3>
              <button onClick={() => setIsBuilderOpen(false)} className="text-sage-500 hover:text-sage-900 text-lg">
                ×
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-sage-700 uppercase tracking-wider">Segment Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Inactive Power Users"
                  className="w-full bg-white border border-sage-300 rounded-card px-4 py-2.5 text-sm outline-none focus:border-sage-400 focus:ring-1 focus:ring-sage-400" 
                />
              </div>

              <div className="flex flex-col gap-4">
                <label className="text-xs font-semibold text-sage-700 uppercase tracking-wider">Inclusion Rules (AND)</label>
                
                <div className="bg-sage-50/50 border border-sage-200 rounded-card p-4 flex flex-col gap-3">
                  <div className="flex gap-2">
                    <select className="flex-1 bg-white border border-sage-300 rounded-card px-3 py-2 text-sm outline-none focus:border-sage-400">
                      <option>Last active</option>
                      <option>Signup date</option>
                      <option>Total spend</option>
                      <option>Email opens</option>
                    </select>
                    <select className="w-32 bg-white border border-sage-300 rounded-card px-3 py-2 text-sm outline-none focus:border-sage-400">
                      <option>is less than</option>
                      <option>is greater than</option>
                      <option>equals</option>
                    </select>
                    <input type="text" placeholder="30 days" className="w-32 bg-white border border-sage-300 rounded-card px-3 py-2 text-sm outline-none focus:border-sage-400" />
                  </div>
                  
                  <div className="flex items-center justify-center relative py-2">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-sage-200" /></div>
                    <div className="relative bg-sage-50/50 px-2 text-xs font-bold text-sage-500 uppercase tracking-wider">AND</div>
                  </div>

                  <div className="flex gap-2">
                    <select className="flex-1 bg-white border border-sage-300 rounded-card px-3 py-2 text-sm outline-none focus:border-sage-400">
                      <option>User type</option>
                      <option>Platform</option>
                    </select>
                    <select className="w-32 bg-white border border-sage-300 rounded-card px-3 py-2 text-sm outline-none focus:border-sage-400">
                      <option>equals</option>
                      <option>does not equal</option>
                    </select>
                    <input type="text" placeholder="Freelancer" className="w-32 bg-white border border-sage-300 rounded-card px-3 py-2 text-sm outline-none focus:border-sage-400" />
                  </div>
                </div>

                <button className="self-start flex items-center gap-1.5 text-xs font-bold text-[#0e271f] hover:text-[#1e4836] transition-colors">
                  + Add Rule
                </button>
              </div>

              <div className="bg-[#e2ede6] border border-[#d2e2d8] p-4 rounded-card">
                <p className="text-sm font-semibold text-[#0e271f]">Estimated Audience Size</p>
                <div className="text-3xl font-display font-bold text-[#0e271f] mt-1">4,250</div>
                <p className="text-xs text-[#1e4836] mt-1 font-medium">Dynamically calculating based on current user base...</p>
              </div>
            </div>

            <div className="p-6 border-t border-sage-200 flex gap-3">
              <button onClick={() => setIsBuilderOpen(false)} className="flex-1 bg-white border border-sage-300 hover:bg-sage-50 text-sage-900 font-semibold py-2.5 rounded-card transition-colors">
                Cancel
              </button>
              <button onClick={() => setIsBuilderOpen(false)} className="flex-1 bg-[#0e271f] hover:bg-[#1e4836] text-white font-semibold py-2.5 rounded-card transition-colors">
                Save Segment
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
