'use client';

import React, { useState } from 'react';
import { useValidationApi } from '@/hooks/useValidationApi';
import { useToast } from '../layout';
import { InsightSynthesizer } from '../components/InsightSynthesizer';

export default function SurveysPage() {
  const { triggerToast } = useToast();
  
  const [isCollectingSurveys, setIsCollectingSurveys] = useState(true);
  const [surveyLinkCopied, setSurveyLinkCopied] = useState(false);

  const handleCopySurveyLink = () => {
    setSurveyLinkCopied(true);
    triggerToast("Survey link copied to clipboard.");
    setTimeout(() => {
      setSurveyLinkCopied(false);
    }, 3000);
  };

  const handleToggleSurveyCollection = () => {
    const nextState = !isCollectingSurveys;
    setIsCollectingSurveys(nextState);
    triggerToast(nextState ? "Survey collection resumed." : "Survey collection stopped.");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-display font-semibold text-sage-900 tracking-tight">
          Surveys
        </h1>
        <div className="flex items-center gap-3">
          <button
            onClick={handleToggleSurveyCollection}
            className={`px-4 py-2.5 rounded-card text-xs md:text-sm font-semibold border transition-all cursor-pointer ${
              isCollectingSurveys
                ? "bg-white border-sage-300 text-sage-700 hover:bg-sage-50 shadow-card"
                : "bg-[#1e4836] border-[#1e4836] text-white shadow-card"
            }`}
          >
            {isCollectingSurveys ? "Stop collecting" : "Resume collecting"}
          </button>
          <InsightSynthesizer />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-5 bg-white rounded-modal p-6 border border-sage-200/80 space-y-6 shadow-card">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sage-900 text-base">Pricing survey</h3>
              <span
                className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${
                  isCollectingSurveys
                    ? "bg-green-100 text-green-800"
                    : "bg-copper-100 text-copper-800"
                }`}
              >
                {isCollectingSurveys ? "Active" : "Paused"}
              </span>
            </div>
            <p className="text-xs text-sage-500">
              3 questions · 142 responses · 71% completion
            </p>
          </div>

          <div className="bg-[#f5f7f5] rounded-card p-4 border border-sage-200/60 flex items-center justify-between gap-3">
            <div className="space-y-0.5 min-w-0">
              <span className="block text-[11px] font-semibold text-sage-400 uppercase tracking-wider">
                Share link
              </span>
              <span className="block text-sm font-semibold text-[#1e4836] truncate">
                kolo.link/s/pr
              </span>
            </div>

            <button
              onClick={handleCopySurveyLink}
              className="bg-white hover:bg-sage-50 border border-sage-200 text-sage-700 font-medium px-3 py-2 rounded-input text-xs transition-all shrink-0 cursor-pointer shadow-card"
            >
              {surveyLinkCopied ? "Copied!" : "Copy link"}
            </button>
          </div>

          <div className="bg-[#0e271f] rounded-card p-5 flex items-center justify-between text-white">
            <div className="space-y-1">
              <span className="text-xs text-sage-300">Target Segment</span>
              <p className="text-sm font-semibold">Active Gig Workers</p>
            </div>
            <div className="w-12 h-12 bg-[#1b3a30] rounded-input p-2 grid grid-cols-2 gap-1.5 border border-[#2b5446]">
              <div className="bg-white/90 rounded-xs"></div>
              <div className="bg-white/90 rounded-xs"></div>
              <div className="bg-white/90 rounded-xs"></div>
              <div className="bg-[#9C5B34] rounded-xs"></div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 bg-white rounded-modal p-6 md:p-8 border border-sage-200/80 space-y-6 shadow-card">
          <div>
            <h3 className="font-bold text-sage-900 text-base">Would you pay ₦500/mo?</h3>
          </div>

          <div className="space-y-5 text-sm">
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs md:text-sm font-medium">
                <span className="text-sage-800">Definitely</span>
                <span className="font-bold text-sage-900">41%</span>
              </div>
              <div className="w-full bg-sage-100 rounded-full h-3.5 overflow-hidden p-0.5 border border-sage-200/50">
                <div
                  className="bg-[#1e4836] h-full rounded-full transition-all duration-1000"
                  style={{ width: "41%" }}
                ></div>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs md:text-sm font-medium">
                <span className="text-sage-800">Maybe</span>
                <span className="font-bold text-sage-900">38%</span>
              </div>
              <div className="w-full bg-sage-100 rounded-full h-3.5 overflow-hidden p-0.5 border border-sage-200/50">
                <div
                  className="bg-[#9C5B34] h-full rounded-full transition-all duration-1000"
                  style={{ width: "38%" }}
                ></div>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs md:text-sm font-medium">
                <span className="text-sage-800">No</span>
                <span className="font-bold text-sage-900">21%</span>
              </div>
              <div className="w-full bg-sage-100 rounded-full h-3.5 overflow-hidden p-0.5 border border-sage-200/50">
                <div
                  className="bg-[#9d362b] h-full rounded-full transition-all duration-1000"
                  style={{ width: "21%" }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
