'use client';

import React from 'react';
import { ArrowUpRight, ArrowDownRight, Target, AlertTriangle, Check, Loader2, Plus, X } from 'lucide-react';
import { AiDraftButton } from '@/components/business-builder/ai-draft-button';
import { useCanvasEditor } from '@/hooks/useCanvasEditor';

const QUAD_STYLE: Record<string, { icon: React.ReactNode; bg: string; border: string; title: string; dot: string }> = {
  strengths: { icon: <ArrowUpRight className="w-4 h-4" />, bg: 'bg-[#F2F7F4]', border: 'border-[#D5E3DB]', title: 'text-[#183B28]', dot: 'bg-[#183B28]' },
  weaknesses: { icon: <ArrowDownRight className="w-4 h-4" />, bg: 'bg-[#FAF4F0]', border: 'border-[#EAD5C6]', title: 'text-[#8A5330]', dot: 'bg-[#8A5330]' },
  opportunities: { icon: <Target className="w-4 h-4" />, bg: 'bg-[#F4F6FB]', border: 'border-[#D5DBE8]', title: 'text-[#3D527D]', dot: 'bg-[#3D527D]' },
  threats: { icon: <AlertTriangle className="w-4 h-4" />, bg: 'bg-[#FDF2F2]', border: 'border-[#F4C7C7]', title: 'text-[#A34B4B]', dot: 'bg-[#A34B4B]' },
};
const DEFAULT_STYLE = { icon: <Target className="w-4 h-4" />, bg: 'bg-white', border: 'border-[#EBEBE6]', title: 'text-[#1E2923]', dot: 'bg-[#768478]' };

export default function SwotPage() {
  const { blockDefs, loading, saveStatus, listOf, addItem, removeItem } = useCanvasEditor('swot');

  const onAdd = (key: string) => {
    const v = window.prompt('Enter a point:');
    if (v && v.trim()) addItem(key, v);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold text-[#1E2923] tracking-tight">SWOT</h2>
          <div className="flex items-center gap-1.5 text-xs text-[#556358] mt-1">
            {saveStatus === 'saving' && <span className="flex items-center gap-1 text-copper-700 font-medium"><Loader2 className="w-3 h-3 animate-spin" /> Saving…</span>}
            {saveStatus === 'saved' && <span className="flex items-center gap-1 text-[#183B28] font-medium"><Check className="w-3 h-3" /> Saved to cloud</span>}
            {saveStatus === 'error' && <span className="text-[#B0483B] font-medium">Sync error — retrying</span>}
          </div>
        </div>
        <AiDraftButton canvasType="swot" label="Seed with AI" />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-modal border border-[#EBEBE6] shadow-card h-48 animate-pulse bg-white" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {blockDefs.map((b) => {
            const s = QUAD_STYLE[b.key] ?? DEFAULT_STYLE;
            return (
              <div key={b.key} className={`${s.bg} ${s.border} rounded-modal p-6 border shadow-card flex flex-col gap-4 min-h-[190px] group`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={s.title}>{s.icon}</span>
                    <h3 className={`text-base font-bold ${s.title}`}>{b.label}</h3>
                  </div>
                  <button onClick={() => onAdd(b.key)} className="flex items-center gap-0.5 text-xs text-[#8E9B90] hover:text-[#183B28] opacity-0 group-hover:opacity-100 transition-opacity">
                    <Plus className="w-3 h-3" /> Add
                  </button>
                </div>
                <ul className="flex flex-col gap-3 pt-1">
                  {listOf(b.key).length === 0 && <li className="text-xs text-[#A3B0A6] italic">Empty</li>}
                  {listOf(b.key).map((item, idx) => (
                    <li key={idx} className="group/item flex items-center gap-2.5 text-xs md:text-sm text-[#2D3830] font-medium">
                      <span className={`w-1.5 h-1.5 rounded-full ${s.dot} shrink-0`} />
                      <span className="flex-1">{item}</span>
                      <button onClick={() => removeItem(b.key, idx)} className="text-[#A3B0A6] hover:text-[#A34B4B] opacity-0 group-hover/item:opacity-100 transition-opacity" aria-label="Remove">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
