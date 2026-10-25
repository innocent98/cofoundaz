'use client';

import React from 'react';

/** PRD 02.1: "Skeletons per card; each card errors independently". */

export const CARD_ERROR_COPY = 'Couldn’t load this.';

export function SkeletonBar({ className = '', dark = false }: { className?: string; dark?: boolean }) {
  return (
    <div
      aria-hidden="true"
      className={`h-3.5 rounded-pill animate-pulse ${dark ? 'bg-brand-700/60' : 'bg-neutral-100'} ${className}`}
    />
  );
}

export function CardSkeleton({
  label,
  dark = false,
  className = '',
  rows = 3,
}: {
  /** Accessible name, e.g. "Loading Startup Health". */
  label: string;
  dark?: boolean;
  className?: string;
  rows?: number;
}) {
  const widths = ['w-5/6', 'w-4/6', 'w-3/4', 'w-3/5'];
  return (
    <div
      role="status"
      aria-label={label}
      className={`rounded-card p-6 shadow-card flex flex-col gap-4 ${
        dark ? 'bg-brand-900' : 'bg-white border border-neutral-100'
      } ${className}`}
    >
      <SkeletonBar dark={dark} className="w-1/3 h-4" />
      <div className="space-y-3 pt-2">
        {Array.from({ length: rows }, (_, i) => (
          <SkeletonBar key={i} dark={dark} className={widths[i % widths.length]} />
        ))}
      </div>
    </div>
  );
}

export function CardError({
  onRetry,
  title,
  dark = false,
  className = '',
}: {
  onRetry: () => void;
  /** Card name for the retry button's accessible label. */
  title: string;
  dark?: boolean;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={`rounded-card p-6 shadow-card flex flex-col items-center justify-center text-center gap-3 min-h-[160px] ${
        dark ? 'bg-brand-900 text-white' : 'bg-white border border-danger-200/80'
      } ${className}`}
    >
      <p className={`text-sm font-medium ${dark ? 'text-neutral-200' : 'text-neutral-600'}`}>{CARD_ERROR_COPY}</p>
      <button
        type="button"
        onClick={onRetry}
        aria-label={`Retry loading ${title}`}
        className={`text-sm font-bold underline cursor-pointer ${dark ? 'text-accent-500 hover:text-white' : 'text-brand-x266b4e hover:text-brand-900'}`}
      >
        Retry
      </button>
    </div>
  );
}
