'use client';

import React, { useState } from 'react';
import { useValidationApi } from '@/hooks/useValidationApi';
import { Sparkles, ChevronDown } from 'lucide-react';
import { useToast } from '../layout';

export default function ScriptsPage() {
  const { assumptions } = useValidationApi();
  const { triggerToast } = useToast();

  const scriptOptions = assumptions.map(a => a.statement);
  
  const [selectedScriptOption, setSelectedScriptOption] = useState(scriptOptions[0] || "Select an assumption");
  const [isScriptDropdownOpen, setIsScriptDropdownOpen] = useState(false);
  const [isScriptGenerated, setIsScriptGenerated] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-display font-semibold text-sage-900 tracking-tight">
          Interview scripts
        </h1>
      </div>

      <div className="bg-white rounded-modal p-6 md:p-8 border border-sage-200/80 space-y-6 shadow-card max-w-4xl relative">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-sage-500 mb-2">
            Generate a script for
          </label>

          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
            <div className="relative flex-1">
              <div
                onClick={() => setIsScriptDropdownOpen(!isScriptDropdownOpen)}
                className="w-full bg-white border border-[#9C5B34] rounded-card px-4 py-3 text-sm text-sage-900 flex items-center justify-between cursor-pointer shadow-card"
              >
                <span className="font-medium truncate">{selectedScriptOption}</span>
                <ChevronDown
                  className={`w-4 h-4 text-sage-600 shrink-0 transition-transform ${
                    isScriptDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </div>

              {isScriptDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-sage-200 rounded-card shadow-raised z-30 max-h-[300px] overflow-y-auto divide-y divide-sage-100">
                  {scriptOptions.map((option) => (
                    <div
                      key={option}
                      onClick={() => {
                        setSelectedScriptOption(option);
                        setIsScriptDropdownOpen(false);
                        setIsScriptGenerated(false);
                      }}
                      className={`px-4 py-3 text-sm cursor-pointer transition-colors ${
                        selectedScriptOption === option
                          ? "bg-sage-600 text-white font-medium"
                          : "text-sage-800 hover:bg-sage-50"
                      }`}
                    >
                      {option}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => setIsScriptGenerated(true)}
              className="bg-[#9C5B34] hover:bg-[#8A5330] text-white font-semibold px-5 py-3 rounded-card text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-card whitespace-nowrap"
            >
              <Sparkles className="w-4 h-4" />
              <span>Generate script</span>
            </button>
          </div>
        </div>
      </div>

      {isScriptGenerated && (
        <div className="bg-white rounded-modal p-6 md:p-8 border border-sage-200/80 space-y-6 shadow-card max-w-4xl animate-in fade-in duration-300">
          <div>
            <h3 className="text-lg font-display font-bold text-sage-900">Draft script</h3>
          </div>

          <div className="space-y-5 text-sm">
            <div className="space-y-1">
              <p className="font-semibold text-sage-900">
                Tell me about the last time you tried to solve this problem.
              </p>
              <p className="text-xs text-[#9C5B34] font-medium">
                Tip: Ask about the last time it happened, not hypotheticals.
              </p>
            </div>

            <div className="space-y-1">
              <p className="font-semibold text-sage-900">
                What did you do, step by step?
              </p>
              <p className="text-xs text-[#9C5B34] font-medium">
                Tip: Follow the actual behavior, not intentions.
              </p>
            </div>

            <div className="space-y-1">
              <p className="font-semibold text-sage-900">
                What was frustrating about it?
              </p>
              <p className="text-xs text-[#9C5B34] font-medium">
                Tip: Let them talk; do not lead them.
              </p>
            </div>

            <div className="space-y-1">
              <p className="font-semibold text-sage-900">
                If a tool did that for you automatically, what would it be worth?
              </p>
              <p className="text-xs text-[#9C5B34] font-medium">
                Tip: Anchor on their words, not your price.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
