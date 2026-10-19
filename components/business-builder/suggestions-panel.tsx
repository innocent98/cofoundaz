'use client';

import React, { useState } from 'react';
import { Check, X, Lightbulb, AlertTriangle } from 'lucide-react';
import { useBusinessSuggestions, Suggestion } from '@/hooks/useBusinessSuggestions';
import { useBuilderAccess } from '@/hooks/useBuilderAccess';
import { diffBlocks, diffRecord } from '@/lib/canvas-ops';
import type { CanvasBlocks } from '@/lib/api/business-builder';

function opLabel(s: Suggestion): string {
  const kind = (s.target.kind || '').replace(/_/g, ' ');
  const canvas = (s.target.canvas_type || '').replace(/_/g, ' ');
  switch (s.op) {
    case 'canvas_update': return `Update the ${canvas} canvas`;
    case 'record_create': return `Add a ${kind}`;
    case 'record_update': return `Edit a ${kind}`;
    case 'record_delete': return `Delete a ${kind}`;
    default: return 'Proposed change';
  }
}

// A short human summary of what the suggestion proposes (from its payload).
function proposalSummary(s: Suggestion): string | null {
  if (s.op === 'record_delete') return 'Remove this record.';
  const data = s.payload?.data;
  if (data && typeof data === 'object') {
    const name = (data as { name?: string; model_type?: string }).name || (data as { model_type?: string }).model_type;
    const keys = Object.keys(data);
    return name ? `${name}` : keys.length ? `Fields: ${keys.join(', ')}` : null;
  }
  const blocks = s.payload?.blocks;
  if (blocks && typeof blocks === 'object') {
    return `Blocks: ${Object.keys(blocks).join(', ')}`;
  }
  return null;
}

// What would change, so the founder reviews a diff and not just a block name.
function SuggestionDiff({ s }: { s: Suggestion }) {
  if (s.op === 'canvas_update') {
    const cur = (s.current as { blocks?: CanvasBlocks } | null | undefined)?.blocks;
    const diffs = diffBlocks(cur, s.payload?.blocks as CanvasBlocks | undefined);
    if (diffs.length === 0) return <p className="text-xs text-[#768478]">No change from the current canvas.</p>;
    return (
      <div className="flex flex-col gap-2">
        {diffs.map((d) => (
          <div key={d.key} className="text-xs">
            <p className="font-bold text-[#1E2923] capitalize">{d.key.replace(/_/g, ' ')}</p>
            {d.text ? (
              <>
                <p className="text-[#A34B4B] line-through">{d.text.before || 'empty'}</p>
                <p className="text-[#183B28]">{d.text.after || 'empty'}</p>
              </>
            ) : (
              <ul className="space-y-0.5">
                {d.removed.map((r) => <li key={`r:${r}`} className="text-[#A34B4B] line-through">Removed: {r}</li>)}
                {d.added.map((a) => <li key={`a:${a}`} className="text-[#183B28]">Added: {a}</li>)}
              </ul>
            )}
          </div>
        ))}
      </div>
    );
  }
  if (s.op === 'record_update' || s.op === 'record_create') {
    const diffs = diffRecord(s.op === 'record_update' ? (s.current as Record<string, unknown> | null) : null, s.payload?.data);
    if (diffs.length === 0) return null;
    return (
      <ul className="flex flex-col gap-1 text-xs">
        {diffs.map((d) => (
          <li key={d.field}>
            <span className="font-bold text-[#1E2923]">{d.field.replace(/_/g, ' ')}: </span>
            {s.op === 'record_update' && <span className="text-[#A34B4B] line-through">{d.before}</span>}
            {s.op === 'record_update' && <span className="text-[#8E9B90]"> to </span>}
            <span className="text-[#183B28]">{d.after}</span>
          </li>
        ))}
      </ul>
    );
  }
  return null;
}

function authorName(s: Suggestion): string {
  return s.author?.name || s.author?.email || 'A teammate';
}

export function SuggestionsPanel() {
  const { suggestions, loading, approve, reject } = useBusinessSuggestions('pending');
  const { canEdit } = useBuilderAccess();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rowError, setRowError] = useState<Record<string, string>>({});

  if (loading || suggestions.length === 0) return null; // quiet until there's something to review

  const run = async (id: string, fn: () => Promise<{ success: boolean; error?: string; conflict?: boolean }>) => {
    setBusyId(id);
    setRowError((prev) => ({ ...prev, [id]: '' }));
    const res = await fn();
    setBusyId(null);
    if (!res.success) {
      const msg = res.conflict
        ? 'The canvas changed since this was suggested, reject it and ask for a fresh one.'
        : res.error || 'Could not complete that.';
      setRowError((prev) => ({ ...prev, [id]: msg }));
    }
  };

  return (
    <div className="bg-white rounded-modal border border-[#EBEBE6] shadow-card overflow-hidden">
      <div className="px-6 py-4 border-b border-[#EBEBE6] bg-[#FBFBFA] flex items-center gap-2">
        <div className="p-1.5 bg-[#F7EEDC] rounded-[6px]">
          <Lightbulb className="w-4 h-4 fill-[#8A5330] text-[#8A5330]" />
        </div>
        <h3 className="font-bold text-[#1E2923] text-sm">{canEdit ? 'Suggestions to review' : 'Suggestions waiting for the founder'}</h3>
        <span className="ml-auto text-xs font-bold text-[#8E9B90] bg-[#F0F0EC] px-2 py-0.5 rounded-full">
          {suggestions.length}
        </span>
      </div>

      <div className="divide-y divide-[#F0F0EC]">
        {suggestions.map((s) => {
          const summary = proposalSummary(s);
          const busy = busyId === s.id;
          return (
            <div key={s.id} className="px-6 py-4 flex flex-col gap-2">
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-1 min-w-0">
                  <span className="text-sm font-bold text-[#1E2923]">{opLabel(s)}</span>
                  {summary && <span className="text-xs text-[#556358]">{summary}</span>}
                  {s.note && <span className="text-xs text-[#768478] italic">&ldquo;{s.note}&rdquo;</span>}
                  <span className="text-[11px] text-[#8E9B90]">Suggested by {authorName(s)}</span>
                </div>
                {canEdit && <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => run(s.id, () => approve(s.id))}
                    disabled={busy}
                    className="flex items-center gap-1 bg-[#183B28] hover:bg-[#11291C] disabled:opacity-50 text-white text-xs font-bold px-3 py-1.5 rounded-card transition-colors"
                  >
                    <Check className="w-3.5 h-3.5" /> Approve
                  </button>
                  <button
                    onClick={() => run(s.id, () => reject(s.id))}
                    disabled={busy}
                    className="flex items-center gap-1 bg-white hover:bg-[#FBEBEB] disabled:opacity-50 text-[#B0483B] border border-[#EBEBE6] hover:border-[#F0D5D5] text-xs font-bold px-3 py-1.5 rounded-card transition-colors"
                  >
                    <X className="w-3.5 h-3.5" /> Reject
                  </button>
                </div>}
              </div>
              <SuggestionDiff s={s} />
              {rowError[s.id] && (
                <div className="flex items-start gap-1.5 text-[11px] font-semibold text-[#B0483B] bg-[#FBEBEB] border border-[#F0D5D5] rounded-input px-2.5 py-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{rowError[s.id]}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
