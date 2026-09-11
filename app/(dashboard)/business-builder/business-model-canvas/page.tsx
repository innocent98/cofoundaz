'use client';

import React, { useState } from 'react';
import { Sparkles, Download } from 'lucide-react';
import { useToast } from '../layout';

export default function BusinessModelCanvasPage() {
  const { triggerToast } = useToast();
  const [showAiModal, setShowAiModal] = useState(false);
  const [sections, setSections] = useState([
    { id: 'partners', title: 'KEY PARTNERS', items: ['Mobile money agents', 'Microfinance banks'] },
    { id: 'activities', title: 'KEY ACTIVITIES', items: ['Automated savings', 'Payouts'] },
    { id: 'value', title: 'VALUE PROPOSITION', items: ['Save without thinking', 'No bank needed'] },
    { id: 'relationships', title: 'CUSTOMER RELATIONSHIPS', items: ['In-app coach'] },
    { id: 'segments', title: 'CUSTOMER SEGMENTS', items: ['Gig workers', 'Traders'] },
    { id: 'resources', title: 'KEY RESOURCES', items: ['Payments API', 'Trust'] },
    { id: 'channels', title: 'CHANNELS', items: ['WhatsApp', 'Referral'] },
    { id: 'costs', title: 'COST STRUCTURE', items: ['Payment fees', 'Support'] },
    { id: 'revenue', title: 'REVENUE STREAMS', items: ['₦500 / mo', 'Interest spread'] },
  ]);

  const handleExport = () => {
    triggerToast('Exported to Documents.');
  };

  const handleDraftAI = () => {
    setShowAiModal(false);
    triggerToast('✦ AI draft added. Review before using.');
  };

  const addItem = (sectionId: string) => {
    const newItem = prompt('Enter new item:');
    if (!newItem) return;
    setSections(prev => prev.map(sec => 
      sec.id === sectionId ? { ...sec, items: [...sec.items, newItem] } : sec
    ));
    triggerToast('Saved');
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold text-[#1E2923] tracking-tight">
            Business Model Canvas
          </h2>
          <div className="flex items-center gap-2 text-xs text-[#556358] mt-1">
            <span className="text-[#183B28] font-medium">✓ Saved</span>
            <span>·</span>
            <span>edited just now</span>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          <button
            onClick={() => setShowAiModal(true)}
            className="flex items-center gap-1.5 bg-[#F5ECDC] hover:bg-[#EAD5C6] text-[#522F1A] font-bold px-4 py-2 rounded-card text-xs transition-colors border border-[#EAD5C6]"
          >
            <Sparkles className="w-3.5 h-3.5 fill-[#8A5330] text-[#8A5330]" />
            <span>Fill with AI</span>
          </button>

          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 bg-white hover:bg-[#F5F5F0] text-[#1E2923] font-semibold px-4 py-2 rounded-card text-xs transition-colors border border-[#EBEBE6] shadow-card"
          >
            <Download className="w-3.5 h-3.5 text-[#556358]" />
            <span>Export</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
        {sections.map((sec) => (
          <div
            key={sec.id}
            className="bg-white rounded-modal p-5 border border-[#EBEBE6] shadow-card flex flex-col gap-4 min-h-[160px] relative group"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-[11px] font-bold tracking-wider text-[#768478] uppercase">
                {sec.title}
              </h4>
              <button 
                onClick={() => addItem(sec.id)}
                className="text-xs text-[#8E9B90] hover:text-[#183B28] opacity-0 group-hover:opacity-100 transition-opacity"
              >
                + Add
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {sec.items.map((item, idx) => (
                <span
                  key={idx}
                  className="bg-[#E6EFEA] text-[#183B28] text-xs font-medium px-3 py-1.5 rounded-input border border-[#D5E3DB] cursor-pointer"
                  onClick={() => {
                    const updated = prompt('Edit item:', item);
                    if (updated) {
                      setSections(prev => prev.map(s => s.id === sec.id ? { ...s, items: s.items.map((i, ix) => ix === idx ? updated : i) } : s));
                      triggerToast('Saved');
                    }
                  }}
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1E2923]/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-modal shadow-raised w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 flex flex-col gap-4">
              <div className="w-12 h-12 bg-[#F5ECDC] rounded-full flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-[#8A5330] fill-[#8A5330]" />
              </div>
              <div>
                <h3 className="text-xl font-display font-bold text-[#1E2923]">
                  Fill with AI
                </h3>
                <p className="text-sm text-[#617065] mt-2 leading-relaxed">
                  I&apos;ll draft this from your profile, assessment, and market data. You can always edit it later.
                </p>
              </div>
            </div>
            <div className="bg-[#FAFAFA] p-4 flex justify-end gap-3 border-t border-[#EBEBE6]">
              <button
                onClick={() => setShowAiModal(false)}
                className="px-4 py-2 text-sm font-bold text-[#617065] hover:text-[#1E2923] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDraftAI}
                className="px-4 py-2 text-sm font-bold text-white bg-[#183B28] hover:bg-[#11291C] rounded-card shadow-sm transition-colors"
              >
                Draft it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
