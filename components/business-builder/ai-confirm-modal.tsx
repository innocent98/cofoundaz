'use client';

import React, { useEffect, useRef } from 'react';
import { Sparkles } from 'lucide-react';

/** The PRD confirmation copy shown before ANY Business Builder AI draft runs. */
export const AI_CONFIRM_COPY =
  "I'll draft this from your profile, assessment, and market data. You edit, nothing is final until you say so.";

interface AiConfirmModalProps {
  open: boolean;
  title?: string;
  confirmLabel?: string;
  /** Extra line under the PRD copy (e.g. which section is being drafted). */
  detail?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function AiConfirmModal({
  open,
  title = 'Draft with AI',
  confirmLabel = 'Draft it',
  detail,
  onConfirm,
  onCancel,
}: AiConfirmModalProps) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    confirmRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-[#061A12]/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="ai-confirm-title"
        className="bg-white rounded-modal w-full max-w-sm shadow-raised overflow-hidden"
      >
        <div className="p-6 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-[#F5ECDC] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-[#8A5330]" />
            </span>
            <h3 id="ai-confirm-title" className="font-bold text-[#1E2923]">{title}</h3>
          </div>
          <p className="text-sm text-[#556358] leading-relaxed">{AI_CONFIRM_COPY}</p>
          {detail && <p className="text-xs text-[#768478]">{detail}</p>}
        </div>
        <div className="px-6 pb-6 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2 bg-white border border-[#DCDCD6] hover:bg-[#F5F5F0] text-[#1E2923] rounded-card text-sm font-bold transition-colors"
          >
            Cancel
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            className="flex-1 px-4 py-2 bg-[#183B28] hover:bg-[#12261C] text-white rounded-card text-sm font-bold transition-colors"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
