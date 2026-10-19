'use client';

import React from 'react';
import { ArrowUpRight, ArrowDownRight, Target, AlertTriangle, X, GripVertical } from 'lucide-react';
import { AiDraftButton } from '@/components/business-builder/ai-draft-button';
import { useCanvasEditor } from '@/hooks/useCanvasEditor';
import { InlineEditable } from '@/components/business-builder/inline-editable';
import { InlineAdd } from '@/components/business-builder/inline-add';
import { CanvasFrame } from '@/components/business-builder/canvas-frame';
import { MoveNote } from '@/components/business-builder/move-note';
import { useStickyDnd } from '@/components/business-builder/use-sticky-dnd';

const QUAD_STYLE: Record<string, { icon: React.ReactNode; bg: string; border: string; title: string; dot: string }> = {
  strengths: { icon: <ArrowUpRight className="w-4 h-4" />, bg: 'bg-[#F2F7F4]', border: 'border-[#D5E3DB]', title: 'text-[#183B28]', dot: 'bg-[#183B28]' },
  weaknesses: { icon: <ArrowDownRight className="w-4 h-4" />, bg: 'bg-[#FAF4F0]', border: 'border-[#EAD5C6]', title: 'text-[#8A5330]', dot: 'bg-[#8A5330]' },
  opportunities: { icon: <Target className="w-4 h-4" />, bg: 'bg-[#F4F6FB]', border: 'border-[#D5DBE8]', title: 'text-[#3D527D]', dot: 'bg-[#3D527D]' },
  threats: { icon: <AlertTriangle className="w-4 h-4" />, bg: 'bg-[#FDF2F2]', border: 'border-[#F4C7C7]', title: 'text-[#A34B4B]', dot: 'bg-[#A34B4B]' },
};
const DEFAULT_STYLE = { icon: <Target className="w-4 h-4" />, bg: 'bg-white', border: 'border-[#EBEBE6]', title: 'text-[#1E2923]', dot: 'bg-[#768478]' };

export default function SwotPage() {
  const editor = useCanvasEditor('swot');
  const { blockDefs, loading, listOf, addItem, removeItem, editItem, moveAcross, highlighted } = editor;
  const { canWrite } = editor.access;
  const dnd = useStickyDnd(moveAcross, canWrite);

  return (
    <CanvasFrame
      type="swot"
      title="SWOT"
      editor={editor}
      actions={<AiDraftButton canvasType="swot" label="Seed with AI" onFilled={editor.reload} />}
    >
      {(tools) =>
        loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-modal border border-[#EBEBE6] shadow-card h-48 animate-pulse bg-white" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {blockDefs.map((b) => {
              const s = QUAD_STYLE[b.key] ?? DEFAULT_STYLE;
              const items = listOf(b.key);
              return (
                <div
                  key={b.key}
                  {...(canWrite ? dnd.blockDropProps(b.key, items.length) : {})}
                  className={`${s.bg} ${dnd.isOverBlock(b.key) ? 'border-[#2D5A3F] ring-1 ring-[#2D5A3F]' : s.border} rounded-modal p-6 border shadow-card flex flex-col gap-4 min-h-[190px] group`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={s.title}>{s.icon}</span>
                      <h3 className={`text-base font-bold ${s.title}`}>{b.label}</h3>
                    </div>
                    <div className="flex items-center gap-3">
                      {tools(b.key, b.label, { ai: true })}
                      {canWrite && <InlineAdd onAdd={(t) => addItem(b.key, t)} />}
                    </div>
                  </div>
                  <ul className="flex flex-col gap-3 pt-1">
                    {items.length === 0 && <li className="text-xs text-[#6F7D72] italic">{canWrite ? 'Empty. Drag a note here.' : 'Empty'}</li>}
                    {items.map((item, idx) => (
                      <li
                        key={`${idx}:${item}`}
                        {...(canWrite ? dnd.noteDropProps(b.key, idx) : {})}
                        className={`group/item flex items-center gap-2 text-xs md:text-sm text-[#2D3830] font-medium rounded px-1 -mx-1 transition-colors ${
                          dnd.isOverNote(b.key, idx) ? 'bg-[#EAF2ED] ring-1 ring-[#2D5A3F]' : highlighted.includes(item) ? 'bg-[#F5ECDC] ring-1 ring-[#9C5B34]' : ''
                        }`}
                      >
                        {canWrite && (
                          <span {...dnd.handleProps(b.key, idx)} className="cursor-grab text-[#8E9B90] opacity-60 md:opacity-0 group-hover/item:opacity-100 transition-opacity shrink-0" aria-label="Drag to move">
                            <GripVertical className="w-3.5 h-3.5" />
                          </span>
                        )}
                        <span className={`w-1.5 h-1.5 rounded-full ${s.dot} shrink-0`} />
                        <InlineEditable value={item} readOnly={!canWrite} onSave={(t) => editItem(b.key, idx, t)} className="flex-1" />
                        {canWrite && (
                          <MoveNote blocks={blockDefs} fromKey={b.key} onMove={(to) => moveAcross(b.key, idx, to, listOf(to).length)} className="text-[#8E9B90] hover:text-[#183B28] opacity-60 md:opacity-0 group-hover/item:opacity-100 focus-within:opacity-100 transition-opacity" />
                        )}
                        {canWrite && (
                          <button onClick={() => removeItem(b.key, idx)} className="text-[#8E9B90] hover:text-[#A34B4B] opacity-60 md:opacity-0 group-hover/item:opacity-100 transition-opacity" aria-label="Remove">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )
      }
    </CanvasFrame>
  );
}
