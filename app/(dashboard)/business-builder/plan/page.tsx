'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, Check, BookOpen, Clock, AlertTriangle, Loader2, ArrowRight } from 'lucide-react';
import { useBusinessPlan } from '@/hooks/useBusinessPlan';

export default function BusinessPlanPage() {
  const { status, doc, error, generate, reset } = useBusinessPlan();

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <div>
        <h2 className="text-3xl font-display font-bold text-[#1E2923] tracking-tight">
          AI business plan generator
        </h2>
        <p className="text-xs text-[#768478] mt-1.5">
          I&apos;ll compile your canvases, personas, pricing, and financials into a 10-section plan. You edit it in Documents, nothing is final until you say so.
        </p>
      </div>

      {status === 'checking' && (
        <div className="bg-white rounded-modal p-12 border border-[#EBEBE6] shadow-card flex items-center justify-center gap-3 text-[#617065]">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Checking for an existing plan…</span>
        </div>
      )}

      {status === 'idle' && (
        <div className="flex flex-col gap-6">
          <div className="bg-white rounded-modal p-6 border border-[#EBEBE6] shadow-card flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-[#8A5330] shrink-0 mt-0.5" />
            <p className="text-sm text-[#52685D] leading-relaxed">
              This writes a full plan from everything in your Business Builder: executive summary, problem &amp; opportunity, solution, market, business model, go-to-market, competition, team, financials, and roadmap. It usually takes under two minutes.
            </p>
          </div>

          <button
            onClick={generate}
            className="w-full bg-[#183B28] hover:bg-[#11291C] text-white font-bold py-3.5 rounded-card flex items-center justify-center gap-2 transition-all shadow-card cursor-pointer"
          >
            <Sparkles className="w-4 h-4 fill-white" />
            <span>Generate business plan</span>
          </button>
        </div>
      )}

      {status === 'generating' && (
        <div className="bg-white rounded-modal p-12 border border-[#EBEBE6] shadow-card flex flex-col items-center justify-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-[#E6EFEA] border-t-[#183B28] animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-[#8A5330] fill-[#8A5330] animate-pulse" />
            </div>
          </div>
          <div className="text-center">
            <h3 className="text-lg font-bold text-[#1E2923]">Writing your business plan…</h3>
            <p className="text-sm text-[#617065] mt-1 max-w-sm">
              This can take up to a couple of minutes. You can leave this page, it keeps working, and the plan will be here when it&apos;s done.
            </p>
          </div>
        </div>
      )}

      {status === 'ready' && doc && (
        <div className="bg-white rounded-modal p-8 border border-[#EBEBE6] shadow-card flex flex-col gap-6">
          <div className="flex flex-col items-center text-center gap-3">
            <div className="w-16 h-16 bg-[#E6EFEA] rounded-full flex items-center justify-center shadow-card relative">
              <BookOpen className="w-7 h-7 text-[#183B28]" />
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-[#D89A6E] rounded-full flex items-center justify-center border-2 border-white">
                <Check className="w-3 h-3 text-white stroke-[3]" />
              </div>
            </div>
            <h3 className="text-2xl font-display font-bold text-[#1E2923]">Your draft is ready</h3>
            <p className="text-sm text-[#617065] max-w-md leading-relaxed">
              {doc.title} — {doc.sections.length} section{doc.sections.length === 1 ? '' : 's'}, saved to Documents as an editable draft.
            </p>
          </div>

          {/* Section preview */}
          <div className="border border-[#EBEBE6] rounded-card divide-y divide-[#F5F5F0] max-h-80 overflow-y-auto">
            {doc.sections.map((sec) => (
              <div key={sec.id} className="p-4">
                <h4 className="text-sm font-bold text-[#1E2923] mb-1">{sec.heading}</h4>
                <p className="text-xs text-[#617065] leading-relaxed whitespace-pre-wrap line-clamp-3">{sec.body}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-col md:flex-row items-center gap-3 w-full">
            <Link
              href={`/documents/${doc.id}`}
              className="w-full flex-1 bg-[#183B28] hover:bg-[#11291C] text-white font-bold py-3 rounded-card transition-all shadow-card flex items-center justify-center gap-2"
            >
              Open in Documents <ArrowRight className="w-4 h-4" />
            </Link>
            <button
              onClick={generate}
              className="w-full flex-1 bg-white hover:bg-[#F5F5F0] text-[#1E2923] border border-[#EBEBE6] font-bold py-3 rounded-card transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Clock className="w-4 h-4 text-[#768478]" />
              Generate another
            </button>
          </div>
        </div>
      )}

      {status === 'timeout' && (
        <div className="bg-white rounded-modal p-8 border border-[#EBEBE6] shadow-card flex flex-col items-center text-center gap-4">
          <div className="w-14 h-14 bg-[#FDF4E3] rounded-full flex items-center justify-center border border-[#EAD5C6]">
            <Clock className="w-6 h-6 text-[#8A5330]" />
          </div>
          <div className="max-w-md">
            <h3 className="text-lg font-bold text-[#1E2923]">This is taking longer than expected</h3>
            <p className="text-sm text-[#617065] mt-1 leading-relaxed">
              The AI may be catching up. You can try again, or come back in a bit, if a plan finishes it&apos;ll be waiting here.
            </p>
          </div>
          <button
            onClick={generate}
            className="bg-[#183B28] hover:bg-[#11291C] text-white font-bold px-6 py-3 rounded-card transition-all shadow-card flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 fill-white" /> Try again
          </button>
        </div>
      )}

      {status === 'forbidden' && (
        <div className="bg-white rounded-modal p-8 border border-[#EBEBE6] shadow-card flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-[#B0483B] shrink-0 mt-0.5" />
          <p className="text-sm text-[#52685D] leading-relaxed">
            Only a founder or an editor can generate the business plan. Ask a workspace owner if you need access.
          </p>
        </div>
      )}

      {status === 'error' && (
        <div className="bg-white rounded-modal p-8 border border-[#EBEBE6] shadow-card flex flex-col items-center text-center gap-4">
          <div className="w-14 h-14 bg-[#FBEAE7] rounded-full flex items-center justify-center border border-[#F0C9C2]">
            <AlertTriangle className="w-6 h-6 text-[#B0483B]" />
          </div>
          <p className="text-sm text-[#617065] max-w-md">{error || 'Something went wrong.'}</p>
          <button
            onClick={reset}
            className="bg-[#183B28] hover:bg-[#11291C] text-white font-bold px-6 py-3 rounded-card transition-all shadow-card cursor-pointer"
          >
            Back
          </button>
        </div>
      )}
    </div>
  );
}
