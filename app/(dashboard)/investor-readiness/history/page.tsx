"use client";

import React from "react";
import { useReadinessApi } from "@/hooks/useReadinessApi";

export default function ReadinessHistoryPage() {
  const { history } = useReadinessApi();

  return (
    <div className="space-y-6 animate-fadeIn pb-12 max-w-5xl mx-auto pt-4">
      <div className="space-y-1">
        <h1 className="text-3xl font-display font-semibold text-sage-900">Score history & logs</h1>
        <p className="text-sm text-sage-500">Track your progress over time.</p>
      </div>

      <div className="space-y-6">
        {/* Mock Trend Chart */}
        <div className="bg-white rounded-modal border border-sage-200 shadow-card p-6 h-64 flex flex-col">
          <h3 className="font-semibold text-sm text-sage-900 mb-4">Readiness trend</h3>
          <div className="flex-1 border-b border-l border-sage-200 relative">
            <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
              <polyline
                fill="none"
                stroke="#1e4836"
                strokeWidth="2"
                points="0,80 20,70 40,65 60,40 80,45 100,36"
              />
            </svg>
            <div className="absolute bottom-[-20px] left-0 text-[10px] text-sage-400">May</div>
            <div className="absolute bottom-[-20px] left-1/4 text-[10px] text-sage-400">Jun</div>
            <div className="absolute bottom-[-20px] left-2/4 text-[10px] text-sage-400">Jul</div>
            <div className="absolute bottom-[-20px] left-3/4 text-[10px] text-sage-400">Aug</div>
            <div className="absolute bottom-[-20px] right-0 text-[10px] text-sage-400">Sep</div>
          </div>
        </div>

        {/* Session Log Table */}
        <div className="bg-white rounded-modal border border-sage-200 shadow-card overflow-hidden">
          <div className="px-6 py-4 border-b border-sage-200">
            <h3 className="font-semibold text-sm text-sage-900">Mock Q&A session logs</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-sage-200/80 text-[11px] font-bold text-sage-400 uppercase tracking-wider">
                  <th className="py-4 px-6">Date</th>
                  <th className="py-4 px-6">Focus</th>
                  <th className="py-4 px-6">Intensity</th>
                  <th className="py-4 px-6">Duration</th>
                  <th className="py-4 px-6 text-right">Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sage-100">
                {history.map((log) => (
                  <tr key={log.id} className="hover:bg-sage-50/50 transition-colors">
                    <td className="py-4 px-6 font-semibold text-sm text-sage-900">{log.date}</td>
                    <td className="py-4 px-6 text-sm text-sage-700">{log.focus}</td>
                    <td className="py-4 px-6 text-sm text-sage-700">{log.intensity}</td>
                    <td className="py-4 px-6 text-sm text-sage-700">{log.durationMinutes} min</td>
                    <td className="py-4 px-6 text-sm font-semibold text-right">
                      <span className={`px-2.5 py-1 rounded-full text-xs ${
                        log.rating === "Needs Work" 
                          ? "bg-red-50 text-red-700 border border-red-200"
                          : "bg-[#e2ede6] text-[#1e4836] border border-[#d2e2d8]"
                      }`}>
                        {log.rating}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
