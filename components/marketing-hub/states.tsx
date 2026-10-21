'use client';

import React from 'react';
import type { LoadStatus } from '@/hooks/useMarketingApi';

export const BTN_ACCENT =
  'bg-[#9C5B34] hover:bg-[#8A5330] text-white font-semibold px-5 py-2.5 rounded-card text-sm transition-all cursor-pointer shadow-card disabled:opacity-60 disabled:cursor-not-allowed';
export const BTN_PRIMARY =
  'bg-[#0e271f] hover:bg-[#1e4836] text-white font-semibold px-4 py-2 rounded-card text-sm transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed';
export const BTN_SECONDARY =
  'bg-white border border-sage-300 text-sage-700 hover:bg-sage-50 font-semibold px-4 py-2 rounded-card text-sm transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed';
export const BTN_DANGER =
  'bg-white border border-red-200 text-red-700 hover:bg-red-50 font-semibold px-3 py-1.5 rounded-card text-xs transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed';
export const BTN_DISABLED =
  'bg-sage-100 text-sage-600 font-semibold px-4 py-2 rounded-card text-sm cursor-not-allowed';
export const INPUT =
  'w-full bg-white border border-sage-300 rounded-card px-4 py-2.5 text-sm text-sage-900 outline-none focus:border-sage-400 focus:ring-1 focus:ring-sage-400';
export const LABEL = 'text-xs font-semibold text-sage-700 uppercase tracking-wider';
export const CARD = 'bg-white rounded-modal border border-sage-200/80 shadow-card';

export function LoadingState({ label = 'Loading' }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className={`${CARD} p-8 flex items-center gap-3 text-sm text-sage-500`}>
      <span className="inline-block h-4 w-4 rounded-full border-2 border-sage-300 border-t-[#9C5B34] animate-spin" />
      <span>{label}...</span>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="rounded-modal border border-red-200 bg-red-50 p-6 space-y-3">
      <p className="text-sm font-semibold text-red-800">Could not load this page</p>
      <p className="text-sm text-red-700">{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className={BTN_SECONDARY}>
          Try again
        </button>
      )}
    </div>
  );
}

export function ForbiddenState() {
  return (
    <div role="status" className={`${CARD} p-8 space-y-2`}>
      <h2 className="font-display font-semibold text-lg text-sage-900">Not available for your role</h2>
      <p className="text-sm text-sage-600">
        The Marketing Hub is open to founders and team members of this workspace. Ask a founder if you need access.
      </p>
    </div>
  );
}

export function EmptyState({
  title,
  body,
  cta,
}: {
  title: string;
  body: string;
  cta?: React.ReactNode;
}) {
  return (
    <div className={`${CARD} p-8 md:p-10 text-center space-y-3`}>
      <h2 className="font-display font-semibold text-lg text-sage-900">{title}</h2>
      <p className="text-sm text-sage-600 max-w-md mx-auto">{body}</p>
      {cta && <div className="pt-2 flex justify-center">{cta}</div>}
    </div>
  );
}

/**
 * Standard gate for a page's data: renders loading / forbidden / error, and
 * otherwise the children. Pages still own their empty states.
 */
export function DataGate({
  status,
  error,
  onRetry,
  loadingLabel,
  children,
}: {
  status: LoadStatus;
  error: string | null;
  onRetry?: () => void;
  loadingLabel?: string;
  children: React.ReactNode;
}) {
  if (status === 'loading') return <LoadingState label={loadingLabel} />;
  if (status === 'forbidden') return <ForbiddenState />;
  if (status === 'error') return <ErrorState message={error ?? 'Something went wrong.'} onRetry={onRetry} />;
  return <>{children}</>;
}

export function GenerationNote({
  phase,
  error,
  generatingLabel,
}: {
  phase: 'idle' | 'generating' | 'ready' | 'failed' | 'timeout';
  error: string | null;
  generatingLabel: string;
}) {
  if (phase === 'generating') {
    return (
      <div role="status" aria-live="polite" className="flex items-center gap-3 text-sm text-sage-600">
        <span className="inline-block h-4 w-4 rounded-full border-2 border-sage-300 border-t-[#9C5B34] animate-spin" />
        <span>{generatingLabel}</span>
      </div>
    );
  }
  if ((phase === 'failed' || phase === 'timeout') && error) {
    return (
      <p role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-card px-4 py-3">
        {error}
      </p>
    );
  }
  return null;
}
