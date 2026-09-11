'use client';

import React, { useState } from 'react';
import { Sparkles, ArrowRight, Check } from 'lucide-react';
import { useToast } from '../layout';

export function InsightSynthesizer() {
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<'idle' | 'analyzing' | 'ready'>('idle');
  const { triggerToast } = useToast();

  const handleSynthesize = () => {
    setIsOpen(true);
    setStatus('analyzing');
    setTimeout(() => {
      setStatus('ready');
    }, 2500);
  };

  const handleApply = () => {
    triggerToast('✓ Status transitions applied to Kanban board.');
    setIsOpen(false);
    setStatus('idle');
  };

  return (
    <>
      <button 
        onClick={handleSynthesize}
        className="bg-[#FDF4E3] hover:bg-[#F5ECDC] text-[#8A5330] border border-[#EAD5C6] px-4 py-2.5 rounded-card font-bold text-sm transition-colors flex items-center gap-2 shadow-sm"
      >
        <Sparkles className="w-4 h-4 fill-[#8A5330]" />
        <span>Synthesize insights</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-[#1E2923]/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#EBEBE6] bg-[#F7F7F5]">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#8A5330] fill-[#8A5330]" />
                <h2 className="text-lg font-display font-bold text-[#1E2923]">AI Insights</h2>
              </div>
              <button 
                onClick={() => { setIsOpen(false); setStatus('idle'); }}
                className="text-sm font-bold text-[#617065] hover:text-[#1E2923]"
              >
                Close
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
              {status === 'analyzing' && (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                  <div className="w-12 h-12 rounded-full border-4 border-[#FDF4E3] border-t-[#D89A6E] animate-spin" />
                  <div>
                    <h3 className="font-bold text-[#1E2923]">Synthesizing qualitative data...</h3>
                    <p className="text-sm text-[#617065] mt-1">Cross-referencing interviews, surveys, and MVP feedback.</p>
                  </div>
                </div>
              )}

              {status === 'ready' && (
                <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  
                  <div className="flex flex-col gap-4">
                    <h3 className="text-sm font-bold text-[#1E2923] uppercase tracking-wider">Detected Patterns</h3>
                    
                    <div className="bg-[#E6EFEA] border border-[#D5E3DB] p-4 rounded-card flex flex-col gap-2">
                      <h4 className="font-bold text-[#183B28]">Strong signal on "Trust"</h4>
                      <p className="text-sm text-[#2D5A3F]">Mentioned positively in 8/10 recent interactions. Your fake-door MVP tests correlate with high CTR.</p>
                    </div>

                    <div className="bg-[#FDF2F2] border border-[#F4C7C7] p-4 rounded-card flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <span className="bg-[#A34B4B] text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Contradiction</span>
                        <h4 className="font-bold text-[#A34B4B]">Pricing Friction</h4>
                      </div>
                      <p className="text-sm text-[#8A3A30]">You assume ₦500 flat fee works, but 5 sources explicitly demanded a percentage-based model.</p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-4">
                    <h3 className="text-sm font-bold text-[#1E2923] uppercase tracking-wider">Recommended Actions</h3>
                    
                    <div className="bg-white border border-[#EBEBE6] rounded-card p-4 flex flex-col gap-4 shadow-sm">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-[#617065] font-medium">Assumption Tracker</span>
                        <p className="text-sm font-bold text-[#1E2923]">"Users will trust a non-bank app with their daily income"</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#FDF4E3] text-[#8A5330]">Testing</span>
                        <ArrowRight className="w-4 h-4 text-[#A0AABA]" />
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#E6EFEA] text-[#183B28]">Validated</span>
                      </div>
                    </div>

                  </div>
                </div>
              )}
            </div>

            {status === 'ready' && (
              <div className="p-6 border-t border-[#EBEBE6] bg-white">
                <button 
                  onClick={handleApply}
                  className="w-full bg-[#183B28] hover:bg-[#11291C] text-white px-6 py-3 rounded-card font-bold text-sm transition-colors flex items-center justify-center gap-2 shadow-card"
                >
                  <Check className="w-4 h-4" />
                  Apply recommendations
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
