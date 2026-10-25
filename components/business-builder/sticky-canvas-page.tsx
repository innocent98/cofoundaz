'use client';

import { noteLabel } from '@/lib/note-label';
import React from 'react';
import { X, GripVertical } from 'lucide-react';
import { AiDraftButton } from '@/components/business-builder/ai-draft-button';
import { useCanvasEditor } from '@/hooks/useCanvasEditor';
import { InlineEditable } from '@/components/business-builder/inline-editable';
import { InlineAdd } from '@/components/business-builder/inline-add';
import { CanvasFrame } from '@/components/business-builder/canvas-frame';
import { MoveNote } from '@/components/business-builder/move-note';
import { useStickyDnd } from '@/components/business-builder/use-sticky-dnd';

/** A nine-block sticky-note canvas (Business Model, Lean): notes drag within AND between blocks. */
export function StickyCanvasPage({ type, title }: { type: 'business_model' | 'lean'; title: string }) {
  const editor = useCanvasEditor(type);
  const { blockDefs, loading, listOf, addItem, removeItem, editItem, moveAcross, highlighted } = editor;
  const { canWrite } = editor.access;
  const dnd = useStickyDnd(moveAcross, canWrite);

  return (
    <CanvasFrame
      type={type}
      title={title}
      editor={editor}
      actions={<AiDraftButton canvasType={type} label="Fill with AI" onFilled={editor.reload} />}
    >
      {(tools) =>
        loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="bg-white rounded-modal border border-line-soft shadow-card h-40 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
            {blockDefs.map((b) => {
              const items = listOf(b.key);
              return (
                <div
                  key={b.key}
                  {...(canWrite ? dnd.blockDropProps(b.key, items.length) : {})}
                  className={`bg-white rounded-modal p-5 border shadow-card flex flex-col gap-4 min-h-[160px] relative group transition-colors ${
                    dnd.isOverBlock(b.key) ? 'border-brand-mid ring-1 ring-brand-mid' : 'border-line-soft'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-[11px] font-bold tracking-wider text-ink-soft uppercase">{b.label}</h4>
                    <div className="flex items-center gap-3">
                      {tools(b.key, b.label, { ai: true })}
                      {canWrite && <InlineAdd onAdd={(t) => addItem(b.key, t)} />}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {items.length === 0 && <span className="text-[11px] text-neutral-xb7c0b8 italic">{canWrite ? 'Empty. Drag a note here.' : 'Empty'}</span>}
                    {items.map((item, idx) => (
                      <span
                        key={`${idx}:${item}`}
                        {...(canWrite ? dnd.noteDropProps(b.key, idx) : {})}
                        className={`group/item flex items-center gap-1 bg-neutral-xe6efea text-brand-strong text-xs font-medium pl-2 pr-1.5 py-1.5 rounded-input border transition-colors ${
                          dnd.isOverNote(b.key, idx)
                            ? 'border-brand-mid ring-1 ring-brand-mid'
                            : highlighted.includes(item)
                              ? 'border-accent-600 ring-2 ring-accent-200'
                              : 'border-neutral-xd5e3db'
                        }`}
                      >
                        {canWrite && (
                          <span {...dnd.handleProps(b.key, idx)} className="cursor-grab text-brand-x7da890 opacity-60 md:opacity-0 group-hover/item:opacity-100 transition-opacity shrink-0" aria-label="Drag to move">
                            <GripVertical className="w-3 h-3" />
                          </span>
                        )}
                        <InlineEditable value={item} readOnly={!canWrite} onSave={(t) => editItem(b.key, idx, t)} />
                        {canWrite && (
                          <MoveNote note={item} blocks={blockDefs} fromKey={b.key} onMove={(to) => moveAcross(b.key, idx, to, listOf(to).length)} className="text-brand-x7da890 hover:text-brand-strong opacity-60 md:opacity-0 group-hover/item:opacity-100 focus-within:opacity-100 transition-opacity" />
                        )}
                        {canWrite && (
                          <button onClick={() => removeItem(b.key, idx)} className="text-brand-x7da890 hover:text-danger-text opacity-60 md:opacity-0 group-hover/item:opacity-100 transition-opacity" aria-label={`Remove note: ${noteLabel(item)}`}>
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )
      }
    </CanvasFrame>
  );
}
