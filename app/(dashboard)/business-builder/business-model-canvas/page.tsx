'use client';

import React from 'react';
import { Download, Check, Loader2, Plus, X, GripVertical } from 'lucide-react';
import { useToast } from '../layout';
import { AiDraftButton } from '@/components/business-builder/ai-draft-button';
import { useCanvasEditor } from '@/hooks/useCanvasEditor';
import { InlineEditable } from '@/components/business-builder/inline-editable';
import { useChipReorder } from '@/components/business-builder/use-chip-reorder';

export default function BusinessModelCanvasPage() {
  const { triggerToast } = useToast();
  const { blockDefs, loading, saveStatus, listOf, addItem, removeItem, editItem, moveItem } = useCanvasEditor('business_model');
  const reorder = useChipReorder(moveItem);

  const handleExport = () => triggerToast('Exported to Documents.');
  const onAdd = (key: string) => {
    const v = window.prompt('Enter a point:');
    if (v && v.trim()) addItem(key, v);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold text-[#1E2923] tracking-tight">Business Model Canvas</h2>
          <div className="flex items-center gap-1.5 text-xs text-[#556358] mt-1">
            {saveStatus === 'saving' && <span className="flex items-center gap-1 text-copper-700 font-medium"><Loader2 className="w-3 h-3 animate-spin" /> Saving…</span>}
            {saveStatus === 'saved' && <span className="flex items-center gap-1 text-[#183B28] font-medium"><Check className="w-3 h-3" /> Saved to cloud</span>}
            {saveStatus === 'error' && <span className="text-[#B0483B] font-medium">Sync error — retrying</span>}
          </div>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          <AiDraftButton
            canvasType="business_model"
            label="Fill with AI"
            className="flex items-center gap-1.5 bg-[#F5ECDC] hover:bg-[#EAD5C6] text-[#522F1A] font-bold px-4 py-2 rounded-card text-xs transition-colors border border-[#EAD5C6] disabled:opacity-60"
          />
          <button onClick={handleExport} className="flex items-center gap-1.5 bg-white hover:bg-[#F5F5F0] text-[#1E2923] font-semibold px-4 py-2 rounded-card text-xs transition-colors border border-[#EBEBE6] shadow-card">
            <Download className="w-3.5 h-3.5 text-[#556358]" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="bg-white rounded-modal border border-[#EBEBE6] shadow-card h-40 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
          {blockDefs.map((b) => (
            <div key={b.key} className="bg-white rounded-modal p-5 border border-[#EBEBE6] shadow-card flex flex-col gap-4 min-h-[160px] relative group">
              <div className="flex items-center justify-between">
                <h4 className="text-[11px] font-bold tracking-wider text-[#768478] uppercase">{b.label}</h4>
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
                    className={`group/item flex items-center gap-1 bg-[#E6EFEA] text-[#183B28] text-xs font-medium pl-2 pr-1.5 py-1.5 rounded-input border transition-colors ${reorder.isOver(b.key, idx) ? 'border-[#2D5A3F] ring-1 ring-[#2D5A3F]' : 'border-[#D5E3DB]'}`}
                  >
                    <span {...reorder.handleProps(b.key, idx)} className="cursor-grab text-[#7DA890] opacity-0 group-hover/item:opacity-100 transition-opacity shrink-0" aria-label="Drag to reorder">
                      <GripVertical className="w-3 h-3" />
                    </span>
                    <InlineEditable value={item} onSave={(t) => editItem(b.key, idx, t)} />
                    <button onClick={() => removeItem(b.key, idx)} className="text-[#7DA890] hover:text-[#A34B4B] opacity-0 group-hover/item:opacity-100 transition-opacity" aria-label="Remove">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
