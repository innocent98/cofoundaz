'use client';

import React from 'react';
import { AlertTriangle, RotateCw } from 'lucide-react';

/** Honest load-failure card with a retry. Never a "pending assessment" prompt. */
export function HealthError({
  title = 'Could not load this',
  message,
  onRetry,
}: {
  title?: string;
  message?: string;
  onRetry: () => void;
}) {
  return (
    <div
      role="alert"
      className="bg-white rounded-modal border border-[#F0D5D5] shadow-card p-8 md:p-10 flex flex-col items-center text-center gap-3"
    >
      <div className="w-12 h-12 rounded-full bg-[#FBEBEB] text-[#B0483B] flex items-center justify-center">
        <AlertTriangle className="w-6 h-6" aria-hidden="true" />
      </div>
      <h2 className="text-base font-bold text-[#1E2923]">{title}</h2>
      {message && <p className="text-sm text-[#617065] max-w-md">{message}</p>}
      <button
        type="button"
        onClick={onRetry}
        className="mt-1 inline-flex items-center gap-1.5 bg-[#183B28] hover:bg-[#11291C] text-white text-xs font-bold px-4 py-2 rounded-card transition-colors cursor-pointer"
      >
        <RotateCw className="w-3.5 h-3.5" aria-hidden="true" /> Retry
      </button>
    </div>
  );
}
