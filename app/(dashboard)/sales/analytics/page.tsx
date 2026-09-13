"use client";

import React from "react";

export default function AnalyticsPage() {
  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-3xl font-display font-semibold text-sage-900">Sales analytics</h1>
      </div>

      {/* TOP GRID: FUNNEL BY STAGE & WIN/LOSS REASONS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* FUNNEL BY STAGE CARD */}
        <div className="lg:col-span-7 bg-white rounded-modal border border-sage-200/90 p-6 md:p-8 shadow-card space-y-6">
          <h3 className="text-sm font-bold text-sage-900">Funnel by stage</h3>

          <div className="space-y-5">
            {/* New */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-medium text-sage-700">
                <span>New</span>
                <span className="font-bold text-sage-900">12</span>
              </div>
              <div className="w-full bg-green-900/10 rounded-full h-3 overflow-hidden">
                <div className="bg-[#1e4836] h-full rounded-full w-full"></div>
              </div>
            </div>

            {/* Qualified */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-medium text-sage-700">
                <span>Qualified</span>
                <span className="font-bold text-sage-900">7</span>
              </div>
              <div className="w-full bg-green-900/10 rounded-full h-3 overflow-hidden">
                <div className="bg-[#1e4836] h-full rounded-full w-[60%]"></div>
              </div>
            </div>

            {/* Proposal */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-medium text-sage-700">
                <span>Proposal</span>
                <span className="font-bold text-sage-900">4</span>
              </div>
              <div className="w-full bg-green-900/10 rounded-full h-3 overflow-hidden">
                <div className="bg-[#1e4836] h-full rounded-full w-[35%]"></div>
              </div>
            </div>

            {/* Negotiation */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-medium text-sage-700">
                <span>Negotiation</span>
                <span className="font-bold text-sage-900">2</span>
              </div>
              <div className="w-full bg-green-900/10 rounded-full h-3 overflow-hidden">
                <div className="bg-[#1e4836] h-full rounded-full w-[20%]"></div>
              </div>
            </div>

            {/* Won */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-medium text-sage-700">
                <span>Won</span>
                <span className="font-bold text-sage-900">1</span>
              </div>
              <div className="w-full bg-green-900/10 rounded-full h-3 overflow-hidden">
                <div className="bg-[#1e4836] h-full rounded-full w-[10%]"></div>
              </div>
            </div>
          </div>
        </div>

        {/* WIN / LOSS REASONS CARD */}
        <div className="lg:col-span-5 bg-white rounded-modal border border-sage-200/90 p-6 md:p-8 shadow-card space-y-6">
          <h3 className="text-sm font-bold text-sage-900">Win / loss reasons</h3>

          <div className="flex flex-col md:flex-row items-center justify-center gap-6 py-4">
            {/* Donut Chart Mockup */}
            <div className="relative w-36 h-36 rounded-full border-[14px] border-[#1e4836] flex items-center justify-center shadow-[inset_0_2px_4px_rgba(18,41,31,0.06)]">
              <div className="absolute inset-0 rounded-full border-[14px] border-transparent border-t-[#9C5B34] border-r-[#9C5B34] rotate-45"></div>
              <div className="absolute inset-0 rounded-full border-[14px] border-transparent border-b-[#a65243] border-l-transparent -rotate-12"></div>
            </div>

            {/* Legend */}
            <div className="space-y-2.5 text-xs font-medium text-sage-700">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#1e4836]"></span>
                <span>Won 31%</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#9C5B34]"></span>
                <span>Price 24%</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#a65243]"></span>
                <span>Timing 45%</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* BOTTOM STATS ROW CARD */}
      <div className="bg-white rounded-modal border border-sage-200/90 p-6 md:p-8 shadow-card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-sage-400 uppercase tracking-wider block">
              AVG CYCLE LENGTH
            </span>
            <span className="text-3xl font-display font-bold text-sage-900">
              34 days
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-bold text-sage-400 uppercase tracking-wider block">
              CLOSED THIS MONTH
            </span>
            <span className="text-3xl font-display font-bold text-[#1e4836]">
              ₦8.5M
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-bold text-sage-400 uppercase tracking-wider block">
              AVG DEAL SIZE
            </span>
            <span className="text-3xl font-display font-bold text-sage-900">
              ₦7.0M
            </span>
          </div>
        </div>
      </div>

    </div>
  );
}
