'use client';

import React, { useState } from 'react';
import { Sparkles, Check, ArrowRight, BookOpen, Clock } from 'lucide-react';
import { useToast } from '../layout';

export default function BusinessPlanPage() {
  const { triggerToast } = useToast();
  const [genState, setGenState] = useState<'idle' | 'generating' | 'ready'>('idle');

  const readinessChecklist = [
    { id: '1', title: 'Lean Canvas', status: 'ready', link: 'View' },
    { id: '2', title: 'Personas', status: 'ready', link: 'View' },
    { id: '3', title: 'Value Prop', status: 'ready', link: 'View' },
    { id: '4', title: 'Pricing & Revenue', status: 'ready', link: 'View' },
    { id: '5', title: 'Competitive & SWOT', status: 'pending', link: 'Finish' },
  ];

  const handleGenerateBusinessPlan = () => {
    setGenState('generating');
    setTimeout(() => {
      setGenState('ready');
    }, 2000);
  };

  const handleOpenDocument = () => {
    triggerToast('✓ Opening in Documents.');
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <div>
        <h2 className="text-3xl font-display font-bold text-[#1E2923] tracking-tight">
          AI business plan generator
        </h2>
        <p className="text-xs text-[#768478] mt-1.5">
          I&apos;ll compile your canvases, personas, pricing, and financials into a plan. You edit, nothing is final until you say so.
        </p>
      </div>

      {genState === 'idle' && (
        <div className="flex flex-col gap-6">
          <div className="bg-white rounded-modal p-6 border border-[#EBEBE6] shadow-card flex flex-col gap-4">
            <h3 className="text-xs font-bold text-[#1E2923]">
              Readiness checklist
            </h3>

            <div className="flex flex-col divide-y divide-[#F5F5F0]">
              {readinessChecklist.map((item) => (
                <div
                  key={item.id}
                  className="py-3 flex items-center justify-between gap-4 first:pt-0 last:pb-0"
                >
                  <div className="flex items-center gap-3">
                    {item.status === 'ready' ? (
                      <div className="w-5 h-5 rounded-[6px] bg-[#183B28] text-white flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-[6px] bg-[#FDF4E3] text-[#8A5330] flex items-center justify-center font-bold text-xs shrink-0 border border-[#EAD5C6]">
                        !
                      </div>
                    )}
                    <span className="text-xs md:text-sm font-medium text-[#1E2923]">
                      {item.title}
                    </span>
                  </div>

                  <div>
                    {item.status === 'ready' ? (
                      <span className="text-xs font-medium text-[#2D5A3F]">
                        {item.link}
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-[#9C5B34] flex items-center gap-1 hover:text-[#8A5330] cursor-pointer">
                        {item.link} <ArrowRight className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-modal p-6 border border-[#EBEBE6] shadow-card flex flex-col gap-6">
            <h3 className="text-xs font-bold text-[#1E2923]">Options</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-3">
                <span className="text-[11px] font-bold tracking-wider text-[#768478] uppercase">
                  AUDIENCE
                </span>
                <div className="flex flex-wrap gap-2">
                  <button className="bg-[#EAD5C6] text-[#522F1A] border border-[#D89A6E] px-4 py-2 rounded-full text-xs font-bold shadow-sm">
                    Investors
                  </button>
                  <button className="bg-white text-[#617065] border border-[#EBEBE6] hover:border-[#C5CFC7] px-4 py-2 rounded-full text-xs font-medium">
                    Internal Team
                  </button>
                  <button className="bg-white text-[#617065] border border-[#EBEBE6] hover:border-[#C5CFC7] px-4 py-2 rounded-full text-xs font-medium">
                    Bank Loan
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <span className="text-[11px] font-bold tracking-wider text-[#768478] uppercase">
                  LENGTH
                </span>
                <div className="flex flex-wrap gap-2">
                  <button className="bg-[#EAD5C6] text-[#522F1A] border border-[#D89A6E] px-4 py-2 rounded-full text-xs font-bold shadow-sm">
                    1-Pager (Exec Summary)
                  </button>
                  <button className="bg-white text-[#617065] border border-[#EBEBE6] hover:border-[#C5CFC7] px-4 py-2 rounded-full text-xs font-medium">
                    Detailed (10-15 pages)
                  </button>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleGenerateBusinessPlan}
            className="w-full bg-[#183B28] hover:bg-[#11291C] text-white font-bold py-3.5 rounded-card flex items-center justify-center gap-2 transition-all shadow-card"
          >
            <Sparkles className="w-4 h-4 fill-white" />
            <span>Generate Business Plan</span>
          </button>
        </div>
      )}

      {genState === 'generating' && (
        <div className="bg-white rounded-modal p-12 border border-[#EBEBE6] shadow-card flex flex-col items-center justify-center gap-4 animate-in fade-in zoom-in-95 duration-300">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-[#E6EFEA] border-t-[#183B28] animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-[#8A5330] fill-[#8A5330] animate-pulse" />
            </div>
          </div>
          <div className="text-center">
            <h3 className="text-lg font-bold text-[#1E2923]">
              Synthesizing your business...
            </h3>
            <p className="text-sm text-[#617065] mt-1">
              Writing the executive summary and formatting financials.
            </p>
          </div>
        </div>
      )}

      {genState === 'ready' && (
        <div className="bg-white rounded-modal p-8 border border-[#EBEBE6] shadow-card flex flex-col items-center justify-center gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="w-20 h-20 bg-[#E6EFEA] rounded-full flex items-center justify-center shadow-inner relative">
            <BookOpen className="w-8 h-8 text-[#183B28]" />
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-[#D89A6E] rounded-full flex items-center justify-center border-2 border-white">
              <Check className="w-3 h-3 text-white stroke-[3]" />
            </div>
          </div>

          <div className="text-center max-w-sm">
            <h3 className="text-2xl font-display font-bold text-[#1E2923]">
              Your draft is ready!
            </h3>
            <p className="text-sm text-[#617065] mt-2 leading-relaxed">
              We&apos;ve compiled your inputs into a structured 1-pager tailored for investors.
            </p>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-3 w-full max-w-md mt-2">
            <button
              onClick={handleOpenDocument}
              className="w-full flex-1 bg-[#183B28] hover:bg-[#11291C] text-white font-bold py-3 rounded-card transition-all shadow-card flex items-center justify-center gap-2"
            >
              Open in Documents
            </button>
            <button
              onClick={() => setGenState('idle')}
              className="w-full flex-1 bg-white hover:bg-[#F5F5F0] text-[#1E2923] border border-[#EBEBE6] font-bold py-3 rounded-card transition-all flex items-center justify-center gap-2"
            >
              <Clock className="w-4 h-4 text-[#768478]" />
              Generate another
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
