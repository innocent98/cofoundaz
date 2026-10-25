'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import type { DashboardHealthState } from '@/types/dashboard';
import { CardError, CardSkeleton } from './card-states';

export const HEALTH_PENDING_COPY = 'Complete your kickoff assessment to see what’s driving your score.';

function scoreColor(score: number): string {
  if (score < 40) return 'var(--color-danger-600)';
  if (score < 70) return 'var(--color-warning-500)';
  return 'var(--color-success-500)';
}

const R = 40;
const CIRC = 2 * Math.PI * R;

/** Animates 0 -> target (easeOutExpo); jumps straight there under reduced motion. */
function useCountUp(target: number): number {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (typeof window.matchMedia !== 'function' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      queueMicrotask(() => setValue(target));
      return;
    }
    let start: number | undefined;
    let raf = 0;
    const tick = (time: number) => {
      if (start === undefined) start = time;
      const progress = Math.min((time - start) / 600, 1);
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setValue(Math.round(ease * target));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return value;
}

export function HealthCard({
  health,
  loading,
  onRetry,
}: {
  health: DashboardHealthState | undefined;
  loading: boolean;
  onRetry: () => void;
}) {
  // Hooks must run unconditionally, before any early return.
  const scored = !!health && !health.error && (health.status === undefined || health.status === 'ok');
  const displayScore = useCountUp(scored ? health.score : 0);

  if (loading) return <CardSkeleton label="Loading Startup Health" className="min-h-[300px]" />;
  if (!health || health.error) return <CardError title="Startup Health" onRetry={onRetry} className="min-h-[300px]" />;

  const delta = health.deltaWeekly ?? 0;
  return (
    <div className="rounded-card border border-brand-100 bg-white p-6 shadow-card flex flex-col justify-between min-h-[300px]">
      <div>
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-base text-neutral-900">Startup Health</h3>
          {scored && (
            <span className="text-xs font-semibold bg-brand-100 text-brand-700 px-3 py-1 rounded-full">
              {delta > 0 ? '+' : ''}
              {delta} this week
            </span>
          )}
        </div>

        <div className="flex flex-col items-center justify-center my-4">
          <div className="relative w-40 h-40 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100" aria-hidden="true">
              <circle cx="50" cy="50" r={R} className="text-neutral-xe4efea" strokeWidth="9" stroke="currentColor" fill="none" />
              {scored && (
                <circle
                  cx="50"
                  cy="50"
                  r={R}
                  strokeWidth="9"
                  strokeDasharray={CIRC}
                  strokeDashoffset={CIRC * (1 - displayScore / 100)}
                  strokeLinecap="round"
                  stroke={scoreColor(health.score)}
                  fill="none"
                  style={{ transition: 'stroke 600ms ease-out, stroke-dashoffset 600ms ease-out' }}
                  className="motion-reduce:transition-none"
                />
              )}
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-5xl font-display font-extrabold text-ink-deep leading-none mb-1">
                {scored ? displayScore : 'N/A'}
              </span>
              <span className="text-xs text-neutral-500 font-medium">{scored ? 'of 100' : 'not scored yet'}</span>
            </div>
          </div>
        </div>

        <p className="text-sm text-center text-neutral-600 leading-relaxed px-2 mb-6">
          {scored ? health.summary || '' : HEALTH_PENDING_COPY}
        </p>
      </div>

      <Link
        href={scored ? '/health' : '/assessment'}
        className="text-sm font-bold text-brand-x266b4e flex items-center justify-center gap-1 hover:underline pt-2 cursor-pointer"
      >
        {scored ? <>See what&apos;s driving it &rarr;</> : <>Start the assessment &rarr;</>}
      </Link>
    </div>
  );
}
