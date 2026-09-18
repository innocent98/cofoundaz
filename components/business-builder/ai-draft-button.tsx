'use client';

import React, { useState } from 'react';
import { Sparkles, Check, AlertTriangle } from 'lucide-react';
import { useBusinessAiFill } from '@/hooks/useBusinessAiFill';

interface AiDraftButtonProps {
  /** Canvas type (business_model/lean/mission_vision/value_prop/swot) … */
  canvasType?: string;
  /** … or a record kind (personas/competitors/pricing/revenue-streams). */
  kind?: string;
  label?: string;
  className?: string;
}

// Honest AI-fill affordance: enqueues the real deferred job (202, "queued") and
// says so — no fake spinner, no fabricated results. The job has no worker yet
// (guide §4/§10), so once requested we show "queued — coming soon" and stop.
export function AiDraftButton({ canvasType, kind, label = 'AI draft', className }: AiDraftButtonProps) {
  const { requesting, requestCanvasFill, requestRecordFill } = useBusinessAiFill();
  const [requested, setRequested] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const target = canvasType ?? kind ?? '';
  const busy = requesting === target;

  const onClick = async () => {
    setError(null);
    const res = canvasType ? await requestCanvasFill(canvasType) : await requestRecordFill(kind || '');
    if (res.ok) setRequested(true);
    else setError(res.error || 'Could not request an AI draft.');
  };

  if (requested) {
    return (
      <span
        className="flex items-center gap-1.5 bg-[#F5EFE6] text-[#8A5330] px-3 py-2 rounded-card text-xs font-semibold border border-[#EAD5C6]"
        title="AI drafting is queued. This feature isn't available yet — your request is recorded for when it ships."
      >
        <Check className="w-3.5 h-3.5" />
        AI draft queued — coming soon
      </span>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={onClick}
        disabled={busy}
        title="Ask the AI to draft this for you (coming soon)"
        className={
          className ??
          'flex items-center gap-1.5 bg-[#F5ECDC] hover:bg-[#EAD5C6] text-[#522F1A] font-bold px-4 py-2.5 rounded-card text-xs transition-colors border border-[#EAD5C6] disabled:opacity-60 shadow-card'
        }
      >
        <Sparkles className="w-3.5 h-3.5 fill-[#8A5330] text-[#8A5330]" />
        <span>{busy ? 'Requesting…' : label}</span>
      </button>
      {error && (
        <span className="flex items-center gap-1 text-[11px] font-semibold text-[#B0483B]">
          <AlertTriangle className="w-3 h-3" /> {error}
        </span>
      )}
    </div>
  );
}
