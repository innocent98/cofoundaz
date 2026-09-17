'use client';

import React from 'react';
import { useValidationApi } from '@/hooks/useValidationApi';
import { useToast } from './layout';

export default function ValidationOverview() {
  const { assumptions, smokeTests, interviews, feedbackThemes } = useValidationApi();
  const { triggerToast } = useToast();

  const stats = {
    validated: assumptions.filter(a => a.status === 'validated').length,
    invalidated: assumptions.filter(a => a.status === 'invalidated').length,
    untested: assumptions.filter(a => a.status === 'untested').length,
    liveExperiments: smokeTests.filter(st => st.status === 'Live').length,
    responsesCollected: interviews.length + feedbackThemes.reduce((sum, ft) => sum + ft.sourceCount, 0),
  };

  const triggerExperimentToast = () => {
    triggerToast("Drafting an experiment for that assumption.");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-4xl font-display font-semibold text-sage-900 tracking-tight">
          Validation Hub
        </h1>
        <p className="text-sage-500 mt-1 text-sm md:text-base">
          Prove it before you build it.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 md:grid-cols-5 gap-3 md:gap-4">
        <div className="bg-white rounded-modal p-4 md:p-5 border border-sage-100 flex flex-col justify-between shadow-card">
          <span className="text-3xl md:text-4xl font-display font-bold text-[#1e4836]">
            {stats.validated}
          </span>
          <span className="text-xs md:text-sm text-sage-500 mt-3 md:mt-4">Validated</span>
        </div>
        <div className="bg-white rounded-modal p-4 md:p-5 border border-sage-100 flex flex-col justify-between shadow-card">
          <span className="text-3xl md:text-4xl font-display font-bold text-[#9d362b]">
            {stats.invalidated}
          </span>
          <span className="text-xs md:text-sm text-sage-500 mt-3 md:mt-4">Invalidated</span>
        </div>
        <div className="bg-white rounded-modal p-4 md:p-5 border border-sage-100 flex flex-col justify-between shadow-card">
          <span className="text-3xl md:text-4xl font-display font-bold text-[#9C5B34]">
            {stats.untested}
          </span>
          <span className="text-xs md:text-sm text-sage-500 mt-3 md:mt-4">Untested</span>
        </div>
        <div className="bg-white rounded-modal p-4 md:p-5 border border-sage-100 flex flex-col justify-between shadow-card">
          <span className="text-3xl md:text-4xl font-display font-bold text-[#2d3732]">
            {stats.liveExperiments}
          </span>
          <span className="text-xs md:text-sm text-sage-500 mt-3 md:mt-4">
            Live experiments
          </span>
        </div>
        <div className="bg-white rounded-modal p-4 md:p-5 border border-sage-100 flex flex-col justify-between shadow-card col-span-2 md:col-span-1">
          <span className="text-3xl md:text-4xl font-display font-bold text-[#2d3732]">
            {stats.responsesCollected}
          </span>
          <span className="text-xs md:text-sm text-sage-500 mt-3 md:mt-4">
            Responses collected
          </span>
        </div>
      </div>

      <div className="bg-[#0e271f] text-white rounded-modal p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-card">
        <div className="flex items-start md:items-center gap-3 md:gap-4">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-card bg-[#9C5B34] text-white flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 md:w-6 md:h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-white text-sm md:text-base">
              Your riskiest untested assumption
            </h3>
            <p className="text-sage-300 text-xs md:text-sm mt-0.5 italic">
              “Gig workers will pay ₦500 per month for automated savings.”
            </p>
          </div>
        </div>

        <button
          onClick={triggerExperimentToast}
          className="bg-[#9C5B34] hover:bg-[#9C5B34] text-white font-semibold px-4 py-2 md:px-5 md:py-2.5 rounded-card text-xs md:text-sm transition-all shrink-0 self-start md:self-auto cursor-pointer"
        >
          Design experiment
        </button>
      </div>
    </div>
  );
}
