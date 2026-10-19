'use client';

import { noteLabel } from '@/lib/note-label';
import React, { useRef, useState } from 'react';
import { X, GripVertical, Link2 } from 'lucide-react';
import { AiDraftButton } from '@/components/business-builder/ai-draft-button';
import { useCanvasEditor, BlockDef } from '@/hooks/useCanvasEditor';
import { InlineEditable } from '@/components/business-builder/inline-editable';
import { InlineAdd } from '@/components/business-builder/inline-add';
import { CanvasFrame } from '@/components/business-builder/canvas-frame';
import { FitOverlay } from '@/components/business-builder/fit-overlay';
import { FitList } from '@/components/business-builder/fit-list';
import { chipId, isFromBlock, makeLink, targetBlockFor, toggleLink, sameLink } from '@/lib/fit-links';
import { useChipReorder } from '@/components/business-builder/use-chip-reorder';

export default function ValuePropositionPage() {
  const editor = useCanvasEditor('value_prop');
  const { blockDefs, loading, listOf, addItem, removeItem, editItem, moveItem, highlighted } = editor;
  const { canWrite } = editor.access;
  const reorder = useChipReorder(moveItem);
  const { canEdit } = editor.access;
  const { fitLinks, saveFit } = editor;
  const gridRef = useRef<HTMLDivElement>(null);
  const [source, setSource] = useState<{ block: string; item: string } | null>(null);
  const [fitError, setFitError] = useState<string | null>(null);

  const changeLinks = async (next: typeof fitLinks) => {
    setFitError(null);
    const res = await saveFit(next);
    if (!res.ok) setFitError(res.error ?? 'Could not save that fit-line.');
  };
  // Click a reliever or creator, then the pain or gain it answers; click a connected pair again to undo it.
  const connect = (to: { block: string; item: string }) => {
    if (!source) return;
    const link = makeLink(source, to);
    setSource(null);
    if (link) void changeLinks(toggleLink(fitLinks, link));
  };
  const isConnected = (from: { block: string; item: string }, to: { block: string; item: string }) => {
    const l = makeLink(from, to);
    return !!l && fitLinks.some((x) => sameLink(x, l));
  };
  const measureKey = blockDefs.map((b) => listOf(b.key).join('|')).join('||');

  // block_defs order: jobs, pains, gains | products_services, pain_relievers, gain_creators
  const profile = blockDefs.slice(0, 3);
  const valueMap = blockDefs.slice(3);

  const column = (
    title: string,
    defs: BlockDef[],
    tone: 'sand' | 'sage',
    tools: (key: string, label: string, opts?: { ai?: boolean }) => React.ReactNode
  ) => (
    <div className="bg-white rounded-modal p-6 border border-[#EBEBE6] shadow-card flex flex-col gap-6">
      <h3 className="text-sm font-bold text-[#1E2923]">{title}</h3>
      <div className="flex flex-col gap-5">
        {defs.map((b) => (
          <div key={b.key} className="flex flex-col gap-2 relative group">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold tracking-wider text-[#768478] uppercase">{b.label}</span>
              <div className="flex items-center gap-3">
                {tools(b.key, b.label, { ai: true })}
                {canWrite && <InlineAdd onAdd={(t) => addItem(b.key, t)} />}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {listOf(b.key).length === 0 && <span className="text-[11px] text-[#B7C0B8] italic">Empty</span>}
              {listOf(b.key).map((item, idx) => (
                <span
                  key={`${idx}:${item}`}
                  data-chip={chipId(b.key, item)}
                  {...(canWrite ? reorder.dropProps(b.key, idx) : {})}
                  className={`group/item flex items-center gap-1 text-xs font-medium pl-2 pr-2 py-2 rounded-card border transition-colors ${
                    reorder.isOver(b.key, idx)
                      ? 'ring-1 ring-[#2D5A3F] border-[#2D5A3F]'
                      : highlighted.includes(item)
                        ? 'ring-2 ring-[#EAD5C6] border-[#9C5B34]'
                        : tone === 'sand' ? 'bg-[#F5F2E9] text-[#522F1A] border-[#EAE3D2]' : 'bg-[#E6EFEA] text-[#183B28] border-[#D5E3DB]'
                  }`}
                >
                  {canWrite && (
                    <span {...reorder.handleProps(b.key, idx)} className="cursor-grab opacity-60 md:opacity-0 group-hover/item:opacity-100 transition-opacity shrink-0" aria-label="Drag to reorder">
                      <GripVertical className="w-3 h-3" />
                    </span>
                  )}
                  <InlineEditable value={item} readOnly={!canWrite} onSave={(t) => editItem(b.key, idx, t)} />
                  {canEdit && isFromBlock(b.key) && (
                    <button
                      type="button"
                      onClick={() => setSource((cur) => (cur && cur.block === b.key && cur.item === item ? null : { block: b.key, item }))}
                      aria-pressed={source?.block === b.key && source.item === item}
                      aria-label={`Connect ${item} to a ${targetBlockFor(b.key) === 'gains' ? 'gain' : 'pain'}`}
                      className={`hidden lg:inline-flex ${source?.block === b.key && source.item === item ? 'text-[#9C5B34]' : 'opacity-60 hover:opacity-100'}`}
                    >
                      <Link2 className="w-3 h-3" />
                    </button>
                  )}
                  {canEdit && source && targetBlockFor(source.block) === b.key && (
                    <button
                      type="button"
                      onClick={() => connect({ block: b.key, item })}
                      className="hidden lg:inline text-[10px] font-bold text-[#9C5B34] underline"
                    >
                      {isConnected(source, { block: b.key, item }) ? 'Disconnect' : 'Connect here'}
                    </button>
                  )}
                  {canWrite && (
                    <button onClick={() => removeItem(b.key, idx)} className="opacity-60 md:opacity-0 group-hover/item:opacity-100 transition-opacity hover:text-[#A34B4B]" aria-label={`Remove note: ${noteLabel(item)}`}>
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <CanvasFrame
      type="value_prop"
      title="Value Proposition"
      editor={editor}
      actions={<AiDraftButton canvasType="value_prop" label="Fill with AI" onFilled={editor.reload} />}
    >
      {(tools) =>
        loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-modal h-80 border border-[#EBEBE6] shadow-card animate-pulse" />
            <div className="bg-white rounded-modal h-80 border border-[#EBEBE6] shadow-card animate-pulse" />
          </div>
        ) : (
          <>
            <div ref={gridRef} className="relative grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-24">
              {column('Customer profile', profile, 'sand', tools)}
              {column('Value map', valueMap, 'sage', tools)}
              <FitOverlay containerRef={gridRef} links={fitLinks} measureKey={measureKey} canRemove={canEdit} onRemove={(l) => void changeLinks(fitLinks.filter((x) => !sameLink(x, l)))} />
            </div>
            <FitList links={fitLinks} listOf={listOf} canEdit={canEdit} onChange={(next) => void changeLinks(next)} error={fitError} />
          </>
        )
      }
    </CanvasFrame>
  );
}
