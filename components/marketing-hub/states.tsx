'use client';

import React from 'react';
import type { LoadStatus } from '@/hooks/useMarketingApi';

export const BTN_ACCENT =
  'bg-accent-600 hover:bg-accent-700 text-white font-semibold px-5 py-2.5 rounded-card text-sm transition-all cursor-pointer shadow-card disabled:opacity-60 disabled:cursor-not-allowed';
export const BTN_PRIMARY =
  'bg-brand-rail-deep hover:bg-brand-hover text-white font-semibold px-4 py-2 rounded-card text-sm transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed';
export const BTN_SECONDARY =
  'bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-50 font-semibold px-4 py-2 rounded-card text-sm transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed';
export const BTN_DANGER =
  'bg-white border border-danger-200 text-danger-700 hover:bg-danger-50 font-semibold px-3 py-1.5 rounded-card text-xs transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed';
export const BTN_DISABLED =
  'bg-neutral-100 text-neutral-600 font-semibold px-4 py-2 rounded-card text-sm cursor-not-allowed';
export const INPUT =
  'w-full bg-white border border-neutral-300 rounded-card px-4 py-2.5 text-sm text-neutral-900 outline-none focus:border-neutral-400 focus:ring-1 focus:ring-neutral-400';
export const LABEL = 'text-xs font-semibold text-neutral-700 uppercase tracking-wider';
export const CARD = 'bg-white rounded-modal border border-neutral-200/80 shadow-card';

export function LoadingState({ label = 'Loading' }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className={`${CARD} p-8 flex items-center gap-3 text-sm text-neutral-500`}>
      <span className="inline-block h-4 w-4 rounded-full border-2 border-neutral-300 border-t-[var(--color-accent-600)] animate-spin" />
      <span>{label}...</span>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="rounded-modal border border-danger-200 bg-danger-50 p-6 space-y-3">
      <p className="text-sm font-semibold text-danger-800">Could not load this page</p>
      <p className="text-sm text-danger-700">{message}</p>
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
      <h2 className="font-display font-semibold text-lg text-neutral-900">Not available for your role</h2>
      <p className="text-sm text-neutral-600">
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
      <h2 className="font-display font-semibold text-lg text-neutral-900">{title}</h2>
      <p className="text-sm text-neutral-600 max-w-md mx-auto">{body}</p>
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
      <div role="status" aria-live="polite" className="flex items-center gap-3 text-sm text-neutral-600">
        <span className="inline-block h-4 w-4 rounded-full border-2 border-neutral-300 border-t-[var(--color-accent-600)] animate-spin" />
        <span>{generatingLabel}</span>
      </div>
    );
  }
  if ((phase === 'failed' || phase === 'timeout') && error) {
    return (
      <p role="alert" className="text-sm text-danger-700 bg-danger-50 border border-danger-200 rounded-card px-4 py-3">
        {error}
      </p>
    );
  }
  return null;
}
