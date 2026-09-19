'use client';

import React from 'react';
import { Check, Loader2, Plus, X, GripVertical } from 'lucide-react';
import { AiDraftButton } from '@/components/business-builder/ai-draft-button';
import { useCanvasEditor, BlockDef } from '@/hooks/useCanvasEditor';
import { InlineEditable } from '@/components/business-builder/inline-editable';
import { useChipReorder } from '@/components/business-builder/use-chip-reorder';

export default function ValuePropositionPage() {
  const { blockDefs, loading, saveStatus, listOf, addItem, removeItem, editItem, moveItem } = useCanvasEditor('value_prop');
  const reorder = useChipReorder(moveItem);

  const onAdd = (key: string) => {
    const v = window.prompt('Enter a point:');
    if (v && v.trim()) addItem(key, v);
  };

  // block_defs order: jobs, pains, gains | products_services, pain_relievers, gain_creators
  const profile = blockDefs.slice(0, 3);
  const valueMap = blockDefs.slice(3);

  const column = (title: string, defs: BlockDef[], tone: 'sand' | 'sage') => (
    <div className="bg-white rounded-modal p-6 border border-[#EBEBE6] shadow-card flex flex-col gap-6">
      <h3 className="text-sm font-bold text-[#1E2923]">{title}</h3>
      <div className="flex flex-col gap-5">
        {defs.map((b) => (
          <div key={b.key} className="flex flex-col gap-2 relative group">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold tracking-wider text-[#768478] uppercase">{b.label}</span>
              <button onClick={() => onAdd(b.key)} className="flex items-center gap-0.5 text-xs text-[#8E9B90] hover:text-[#183B28] opacity-0 group-hover:opacity-100 transition-opacity">
                <Plus className="w-3 h-3" /> Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {listOf(b.key).length === 0 && <span className="text-[11px] text-[#B7C0B8] italic">Empty</span>}
              {listOf(b.key).map((item, idx) => (
                <span
                  key={idx}
                  {...reorder.dropProps(b.key, idx)}
                  className={`group/item flex items-center gap-1 text-xs font-medium pl-2 pr-2 py-2 rounded-card border transition-colors ${
                    reorder.isOver(b.key, idx)
                      ? 'ring-1 ring-[#2D5A3F] border-[#2D5A3F]'
                      : tone === 'sand' ? 'bg-[#F5F2E9] text-[#522F1A] border-[#EAE3D2]' : 'bg-[#E6EFEA] text-[#183B28] border-[#D5E3DB]'
                  }`}
                >
                  <span {...reorder.handleProps(b.key, idx)} className="cursor-grab opacity-0 group-hover/item:opacity-100 transition-opacity shrink-0" aria-label="Drag to reorder">
                    <GripVertical className="w-3 h-3" />
                  </span>
                  <InlineEditable value={item} onSave={(t) => editItem(b.key, idx, t)} />
                  <button onClick={() => removeItem(b.key, idx)} className="opacity-0 group-hover/item:opacity-100 transition-opacity hover:text-[#A34B4B]" aria-label="Remove">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold text-[#1E2923] tracking-tight">Value Proposition</h2>
          <div className="flex items-center gap-1.5 text-xs text-[#556358] mt-1">
            {saveStatus === 'saving' && <span className="flex items-center gap-1 text-copper-700 font-medium"><Loader2 className="w-3 h-3 animate-spin" /> Saving…</span>}
            {saveStatus === 'saved' && <span className="flex items-center gap-1 text-[#183B28] font-medium"><Check className="w-3 h-3" /> Saved to cloud</span>}
            {saveStatus === 'error' && <span className="text-[#B0483B] font-medium">Sync error — retrying</span>}
          </div>
        </div>
        <AiDraftButton canvasType="value_prop" label="Fill with AI" />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-modal h-80 border border-[#EBEBE6] shadow-card animate-pulse" />
          <div className="bg-white rounded-modal h-80 border border-[#EBEBE6] shadow-card animate-pulse" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {column('Customer profile', profile, 'sand')}
          {column('Value map', valueMap, 'sage')}
        </div>
      )}
    </div>
  );
}
