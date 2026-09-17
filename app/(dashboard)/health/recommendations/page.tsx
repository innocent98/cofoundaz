'use client';

import React from 'react';
import Link from 'next/link';
import { useHealthScore } from '@/hooks/useHealthScore';

export default function RecommendationsPage() {
  const { data, dismissRecommendation } = useHealthScore();

  return (
    <div className="flex flex-col gap-6 pt-2 pb-12">
      <div>
        <h2 className="text-3xl font-display font-medium text-[#1E2923] tracking-tight">
          Recommendations
        </h2>
        <p className="text-xs text-[#617065] mt-1.5">
          Ranked by estimated lift. Every one traces to a real signal.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {data.topRecommendations.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-modal p-6 md:p-8 border border-[#EBEBE6] shadow-card flex flex-col md:flex-row md:items-center justify-between gap-6"
          >
            <div className="flex items-start gap-4 flex-1">
              <span className="bg-[#EAF2ED] text-[#2D5A3F] text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap shrink-0 mt-0.5">
                +{item.estimatedLift} pts
              </span>

              <div className="flex flex-col gap-1.5">
                <h3 className="text-base font-bold text-[#1E2923] leading-snug">
                  {item.title}
                </h3>
                <p className="text-xs text-[#617065] leading-relaxed">
                  {item.rationale}
                </p>
                <div className="text-[11px] text-[#768478] mt-1 font-medium">
                  Effort: {item.effort} · Dimension: {item.dimension}
                </div>
              </div>
            </div>

            <div className="flex items-center md:flex-col gap-2 shrink-0 justify-end md:justify-center">
              <Link
                href={item.actionUrl}
                className="w-24 text-center bg-[#9C5B34] hover:bg-[#8A5330] text-white text-xs font-bold py-2.5 rounded-card transition-colors shadow-card inline-block"
              >
                Start
              </Link>
              <button
                onClick={() => dismissRecommendation(item.id)}
                className="w-24 bg-white hover:bg-[#F5F5F0] text-[#1E2923] border border-[#EBEBE6] text-xs font-bold py-2.5 rounded-card transition-colors cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        ))}
        {data.topRecommendations.length === 0 && (
          <div className="text-center py-12 text-[#617065] text-sm">
            All caught up! No active recommendations right now.
          </div>
        )}
      </div>
    </div>
  );
}
