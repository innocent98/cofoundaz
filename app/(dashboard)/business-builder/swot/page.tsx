'use client';

import { noteLabel } from '@/lib/note-label';
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
  strengths: { icon: <ArrowUpRight className="w-4 h-4" />, bg: 'bg-brand-50', border: 'border-neutral-xd5e3db', title: 'text-brand-strong', dot: 'bg-brand-strong' },
  weaknesses: { icon: <ArrowDownRight className="w-4 h-4" />, bg: 'bg-neutral-xfaf4f0', border: 'border-accent-200', title: 'text-accent-700', dot: 'bg-accent-700' },
  opportunities: { icon: <Target className="w-4 h-4" />, bg: 'bg-neutral-xf4f6fb', border: 'border-info-xd5dbe8', title: 'text-info-x3d527d', dot: 'bg-info-x3d527d' },
  threats: { icon: <AlertTriangle className="w-4 h-4" />, bg: 'bg-danger-tint', border: 'border-danger-xf4c7c7', title: 'text-danger-text', dot: 'bg-danger-text' },
};
const DEFAULT_STYLE = { icon: <Target className="w-4 h-4" />, bg: 'bg-white', border: 'border-line-soft', title: 'text-ink', dot: 'bg-ink-soft' };

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
              <div key={i} className="rounded-modal border border-line-soft shadow-card h-48 animate-pulse bg-white" />
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
                  className={`${s.bg} ${dnd.isOverBlock(b.key) ? 'border-brand-mid ring-1 ring-brand-mid' : s.border} rounded-modal p-6 border shadow-card flex flex-col gap-4 min-h-[190px] group`}
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
                    {items.length === 0 && <li className="text-xs text-neutral-x6f7d72 italic">{canWrite ? 'Empty. Drag a note here.' : 'Empty'}</li>}
                    {items.map((item, idx) => (
                      <li
                        key={`${idx}:${item}`}
                        {...(canWrite ? dnd.noteDropProps(b.key, idx) : {})}
                        className={`group/item flex items-center gap-2 text-xs md:text-sm text-neutral-x2d3830 font-medium rounded px-1 -mx-1 transition-colors ${
                          dnd.isOverNote(b.key, idx) ? 'bg-brand-tint ring-1 ring-brand-mid' : highlighted.includes(item) ? 'bg-accent-xf5ecdc ring-1 ring-accent-600' : ''
                        }`}
                      >
                        {canWrite && (
                          <span {...dnd.handleProps(b.key, idx)} className="cursor-grab text-ink-subtle opacity-60 md:opacity-0 group-hover/item:opacity-100 transition-opacity shrink-0" aria-label="Drag to move">
                            <GripVertical className="w-3.5 h-3.5" />
                          </span>
                        )}
                        <span className={`w-1.5 h-1.5 rounded-full ${s.dot} shrink-0`} />
                        <InlineEditable value={item} readOnly={!canWrite} onSave={(t) => editItem(b.key, idx, t)} className="flex-1" />
                        {canWrite && (
                          <MoveNote note={item} blocks={blockDefs} fromKey={b.key} onMove={(to) => moveAcross(b.key, idx, to, listOf(to).length)} className="text-ink-subtle hover:text-brand-strong opacity-60 md:opacity-0 group-hover/item:opacity-100 focus-within:opacity-100 transition-opacity" />
                        )}
                        {canWrite && (
                          <button onClick={() => removeItem(b.key, idx)} className="text-ink-subtle hover:text-danger-text opacity-60 md:opacity-0 group-hover/item:opacity-100 transition-opacity" aria-label={`Remove note: ${noteLabel(item)}`}>
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
