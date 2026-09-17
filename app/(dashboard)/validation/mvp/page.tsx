'use client';

import React, { useState } from 'react';
import { useValidationApi } from '@/hooks/useValidationApi';
import { useToast } from '../layout';

export default function MvpFeedbackPage() {
  const { feedbackThemes } = useValidationApi();
  const { triggerToast } = useToast();

  const [mvpViewState, setMvpViewState] = useState<"initial" | "loading" | "synthesized">("initial");

  const rawFeedbackList = [
    {
      id: "1",
      type: "Interview",
      source: "Chidi",
      text: "I would need to be sure my money is safe before I put it in.",
    },
    {
      id: "2",
      type: "In-app",
      source: "Beta user",
      text: "Love the round-ups. Can it round up every ride automatically?",
    },
    {
      id: "3",
      type: "Email",
      source: "Waitlist",
      text: "Do you also let me invest what I save?",
    },
    {
      id: "4",
      type: "Interview",
      source: "Funke",
      text: "Who is behind this app? I need to trust the people.",
    },
  ];

  const handleSynthesizeInsights = () => {
    setMvpViewState("loading");
    setTimeout(() => {
      setMvpViewState("synthesized");
    }, 1800);
  };

  const handleSendToRoadmap = (insightTitle: string) => {
    triggerToast(`Sent “${insightTitle}” to your roadmap.`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-display font-semibold text-sage-900 tracking-tight">
          MVP feedback
        </h1>

        <button
          onClick={handleSynthesizeInsights}
          disabled={mvpViewState === "loading"}
          className="bg-[#9C5B34] hover:bg-[#8A5330] text-white font-semibold px-4 py-2.5 rounded-card text-xs md:text-sm transition-all flex items-center gap-2 cursor-pointer shadow-card disabled:opacity-75"
        >
          <span>✦ Synthesize insights</span>
        </button>
      </div>

      {/* INITIAL STATE */}
      {mvpViewState === "initial" && (
        <div className="space-y-4">
          {rawFeedbackList.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-modal p-5 md:p-6 border border-sage-200/80 space-y-3 shadow-card"
            >
              <div className="flex items-center gap-2">
                <span className="bg-sage-100 text-sage-700 text-xs font-medium px-2.5 py-0.5 rounded-full">
                  {item.type}
                </span>
                <span className="text-xs text-sage-400 font-medium">{item.source}</span>
              </div>
              <p className="text-sage-800 text-sm md:text-base">{item.text}</p>
            </div>
          ))}
        </div>
      )}

      {/* LOADING STATE */}
      {mvpViewState === "loading" && (
        <div className="bg-white rounded-modal p-16 border border-sage-200/80 flex flex-col items-center justify-center text-center space-y-6 shadow-card my-8 animate-in fade-in duration-300">
          <div className="w-12 h-12 rounded-full border-4 border-sage-200 border-t-[#9C5B34] animate-spin"></div>
          <p className="text-sage-700 font-display text-lg italic">
            Reading every note for patterns...
          </p>
        </div>
      )}

      {/* SYNTHESIZED STATE */}
      {mvpViewState === "synthesized" && (
        <div className="space-y-4 animate-in fade-in duration-500">
          {feedbackThemes.map((theme) => {
            // Pick a color based on category or id
            let iconBg = "bg-green-100";
            let iconText = "◆";
            if (theme.theme.toLowerCase().includes('request')) {
              iconBg = "bg-green-50";
              iconText = "↗";
            } else if (theme.theme.toLowerCase().includes('friction')) {
              iconBg = "bg-green-50/60";
              iconText = "☺";
            }
            
            return (
              <div
                key={theme.id}
                className="bg-white rounded-modal p-5 md:p-6 border border-sage-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-card"
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-10 h-10 rounded-card ${iconBg} text-[#1e4836] font-bold flex items-center justify-center shrink-0 mt-0.5 md:mt-0`}
                  >
                    {iconText}
                  </div>
                  <div className="space-y-0.5">
                    <h3 className="font-bold text-sage-900 text-sm md:text-base">
                      {theme.theme}
                    </h3>
                    <p className="text-xs text-sage-400 font-medium">
                      Mentioned {theme.sourceCount}x across {theme.sourceCount} sources
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleSendToRoadmap(theme.theme)}
                  className="bg-white hover:bg-sage-50 border border-sage-200 text-sage-700 font-semibold px-4 py-2 rounded-card text-xs transition-all cursor-pointer shadow-card shrink-0 self-start md:self-auto"
                >
                  Send to roadmap
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
