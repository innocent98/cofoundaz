"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useReadinessApi } from "@/hooks/useReadinessApi";
import { ArrowRight, AlertCircle } from "lucide-react";

export default function ReadinessScorePage() {
  const router = useRouter();
  const { score } = useReadinessApi();

  let verdictCopy = "";
  if (score.overall < 40) {
    verdictCopy = "Not yet — and that&apos;s fine. Here&apos;s the shortest path.";
  } else if (score.overall < 70) {
    verdictCopy = "Getting close. Close these gaps before outreach.";
  } else {
    verdictCopy = "You&apos;re ready to run a process.";
  }

  const dimensionsList = [
    { name: "Team", value: score.dimensions.team },
    { name: "Traction", value: score.dimensions.traction },
    { name: "Market", value: score.dimensions.market },
    { name: "Product", value: score.dimensions.product },
    { name: "Financials", value: score.dimensions.financials },
    { name: "Story", value: score.dimensions.story },
  ];

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      <div className="text-center space-y-4">
        <div className="inline-flex flex-col items-center justify-center space-y-2 py-4">
          <span className="text-sm font-bold uppercase tracking-widest text-sage-500">Readiness Score</span>
          <div className="relative w-40 h-40 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-sage-200"
                strokeWidth="3"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className={`${score.overall >= 70 ? 'text-[#1e4836]' : score.overall >= 40 ? 'text-[#8A5330]' : 'text-red-600'}`}
                strokeWidth="3"
                strokeDasharray={`${score.overall}, 100`}
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center flex-col">
              <span className="font-display font-bold text-5xl text-sage-900 tracking-tight">{score.overall}</span>
            </div>
          </div>
        </div>

        <h2 className="text-2xl font-display font-semibold text-sage-900">{verdictCopy}</h2>
        
        {score.overall >= 70 && (
          <button
            onClick={() => router.push("/funding")}
            className="mt-4 bg-[#9C5B34] hover:bg-[#8A5330] text-white font-semibold py-3 px-6 rounded-card transition-colors shadow-card inline-flex items-center gap-2"
          >
            <span>Open Funding Hub</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Dimensions */}
        <div className="bg-white rounded-modal border border-sage-200/95 shadow-card p-6 space-y-6">
          <h3 className="font-semibold text-sm text-sage-900">Dimensions</h3>
          <div className="space-y-5">
            {dimensionsList.map(dim => (
              <div key={dim.name} className="space-y-2">
                <div className="flex justify-between items-center text-xs font-medium text-sage-700">
                  <span>{dim.name}</span>
                  <span className="font-bold text-sage-900">{dim.value}/100</span>
                </div>
                <div className="w-full bg-sage-100 h-2.5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${dim.value >= 70 ? 'bg-[#1e4836]' : dim.value >= 40 ? 'bg-[#8A5330]' : 'bg-red-600'}`}
                    style={{ width: `${dim.value}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Priority Gaps */}
        <div className="space-y-4">
          <h3 className="font-semibold text-sm text-sage-900 px-1">Priority gaps to close</h3>
          {score.gaps.map((gap, idx) => (
            <div key={idx} className="bg-white rounded-modal border border-sage-200/95 shadow-card p-5 space-y-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 text-[#8A5330]">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-sage-900">{gap.dimension}</h4>
                  <p className="text-sm text-sage-600 mt-1">{gap.note}</p>
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() => router.push(gap.actionRoute)}
                  className="bg-sage-100 hover:bg-sage-200 text-sage-800 font-semibold py-2 px-4 text-xs rounded-card transition-colors inline-flex items-center gap-1.5"
                >
                  <span>Fix this</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
          {score.gaps.length === 0 && (
            <div className="bg-sage-50 rounded-modal border border-sage-200/50 p-6 text-center text-sage-500 text-sm">
              No critical gaps detected.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
