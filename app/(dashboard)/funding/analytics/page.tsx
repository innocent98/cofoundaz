"use client";

import React from "react";

export default function AnalyticsPage() {
  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      <h1 className="text-3xl font-display font-semibold text-sage-900">Fundraise analytics</h1>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Investor Funnel Card */}
        <div className="lg:col-span-6 bg-white rounded-modal border border-sage-200/95 shadow-card p-6 space-y-6">
          <h3 className="font-semibold text-sm text-sage-900">Investor funnel</h3>

          <div className="space-y-5">
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-medium text-sage-700">
                <span>Contacted</span>
                <span className="font-bold text-sage-900">24</span>
              </div>
              <div className="w-full bg-sage-100 h-3.5 rounded-full overflow-hidden">
                <div className="bg-[#1e4836] h-full rounded-full w-full"></div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-medium text-sage-700">
                <span>Meetings</span>
                <span className="font-bold text-sage-900">11</span>
              </div>
              <div className="w-full bg-sage-100 h-3.5 rounded-full overflow-hidden">
                <div className="bg-[#1e4836] h-full rounded-full w-[46%]"></div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-medium text-sage-700">
                <span>Diligence</span>
                <span className="font-bold text-sage-900">5</span>
              </div>
              <div className="w-full bg-sage-100 h-3.5 rounded-full overflow-hidden">
                <div className="bg-[#1e4836] h-full rounded-full w-[21%]"></div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-medium text-sage-700">
                <span>Committed</span>
                <span className="font-bold text-sage-900">2</span>
              </div>
              <div className="w-full bg-sage-100 h-3.5 rounded-full overflow-hidden">
                <div className="bg-[#1e4836] h-full rounded-full w-[8%]"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Committed vs Target Card */}
        <div className="lg:col-span-6 bg-white rounded-modal border border-sage-200/95 shadow-card p-6 space-y-8 flex flex-col justify-between min-h-[300px]">
          <h3 className="font-semibold text-sm text-sage-900">Committed vs target</h3>

          <div className="flex flex-col items-center justify-center space-y-2 py-4">
            <span className="font-display font-bold text-5xl text-[#1e4836] tracking-tight">64%</span>
            <span className="text-xs text-sage-500 font-medium">₦58M soft-committed of ₦90M</span>
          </div>

          <div className="w-full bg-sage-100 h-3.5 rounded-full overflow-hidden">
            <div className="bg-[#1e4836] h-full rounded-full w-[64%]"></div>
          </div>
        </div>

        {/* Time in Stage Mock */}
        <div className="lg:col-span-6 bg-white rounded-modal border border-sage-200/95 shadow-card p-6 space-y-4">
          <h3 className="font-semibold text-sm text-sage-900">Average time in stage</h3>
          <div className="h-40 flex items-end gap-2 text-[10px] text-sage-400 font-medium text-center pb-2">
            <div className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full bg-[#e2ede6] rounded-t min-h-[40%]" />
              <span>Outreach</span>
            </div>
            <div className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full bg-[#c2d7cb] rounded-t min-h-[20%]" />
              <span>Meeting</span>
            </div>
            <div className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full bg-[#1e4836] rounded-t min-h-[80%]" />
              <span>Diligence</span>
            </div>
            <div className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full bg-[#9C5B34] rounded-t min-h-[60%]" />
              <span>Term Sheet</span>
            </div>
          </div>
        </div>

        {/* Data Room Engagement */}
        <div className="lg:col-span-6 bg-white rounded-modal border border-sage-200/95 shadow-card p-6 space-y-4">
          <h3 className="font-semibold text-sm text-sage-900">Data room engagement</h3>
          <div className="h-40 flex flex-col justify-center gap-4 text-sm text-sage-600">
            <div className="flex items-center justify-between">
              <span>Avg. session duration</span>
              <span className="font-bold text-sage-900">4m 12s</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Total views</span>
              <span className="font-bold text-sage-900">128</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Most viewed document</span>
              <span className="font-bold text-sage-900">Financial Model</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
