'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Check, Sparkles } from 'lucide-react';
import type { AIBriefing, BriefingAction } from '@/types/dashboard';
import type { BriefingAcceptResult } from '@/lib/api/dashboard';
import { briefingActionErrorMessage } from '@/hooks/useDashboardApi';
import { ApiError } from '@/lib/api/client';
import { safeInternalHref } from '@/lib/safe-href';
import { CardError, CardSkeleton } from './card-states';

export const BRIEFING_EMPTY_COPY =
  'I’ll have your first briefing ready tomorrow morning once I’ve seen a full day of your workspace.';

export const BRIEFING_OFF_COPY = 'Daily briefing is off. Turn it on in Settings → AI preferences.';

/** "Tell me more" opens the drawer with a fresh conversation about today's briefing. */
export function briefingSeed(briefing: Pick<AIBriefing, 'content'>): string {
  return `Tell me more about today's briefing.\n\nHere is the briefing:\n${briefing.content}`;
}

export function BriefingCard({
  briefing,
  loading,
  onRetry,
  onChanged,
  onTellMeMore,
  accept,
  navigate,
}: {
  briefing: AIBriefing | undefined;
  loading: boolean;
  onRetry: () => void;
  /** Called after a successful Do it so the summary (mission, accepted flags) is refetched. */
  onChanged: () => void;
  onTellMeMore: (briefing: AIBriefing) => void;
  accept: (briefingId: string, index: number) => Promise<BriefingAcceptResult>;
  navigate: (href: string) => void;
}) {
  const [busy, setBusy] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (loading) return <CardSkeleton label="Loading your AI Briefing" dark className="min-h-[300px]" />;
  if (!briefing || briefing.error) return <CardError dark title="your AI Briefing" onRetry={onRetry} className="min-h-[300px]" />;
  // The briefing is built from finance figures: roles that cannot open Finance never see the card.
  if (briefing.status === 'restricted') return null;

  // The member switched the daily briefing off (Settings → AI preferences): a quiet state, not an error.
  if (briefing.status === 'off') {
    return (
      <div className="bg-brand-x0f291e text-white rounded-card p-6 shadow-card flex flex-col justify-between min-h-[300px]">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-accent-500 rounded-modal text-brand-x0f291e flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-brand-x0f291e" />
          </div>
          <div>
            <h3 className="font-bold text-base text-white leading-snug">Your AI Briefing</h3>
            <p className="text-xs font-semibold text-brand-x8fb5a0">Co-Founder</p>
          </div>
        </div>
        <p className="text-sm text-neutral-200 leading-relaxed mb-6">{BRIEFING_OFF_COPY}</p>
        <Link
          href="/settings?tab=ai"
          className="bg-accent-500 hover:bg-accent-xe4ae87 text-brand-x0f291e text-sm font-bold py-3 rounded-card transition-colors text-center"
        >
          Open AI preferences
        </Link>
      </div>
    );
  }

  const doIt = async (action: BriefingAction) => {
    if (!briefing.id || busy !== null) return;
    setBusy(action.index);
    setError(null);
    try {
      const result = await accept(briefing.id, action.index);
      onChanged();
      const target = safeInternalHref(result.href);
      if (result.kind === 'navigate' && target) navigate(target);
    } catch (err) {
      setError(briefingActionErrorMessage(err));
      // A stale briefing (tab left open overnight) is replaced by today's; do not retry.
      if (err instanceof ApiError && err.status === 409) onChanged();
    } finally {
      setBusy(null);
    }
  };

  if (briefing.status === 'generating') {
    return (
      <div className="bg-brand-900 text-white rounded-card p-6 shadow-card flex flex-col justify-between min-h-[300px] border border-brand-700/40">
        <div>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-full bg-brand-700 flex items-center justify-center shadow-card animate-pulse">
              <Sparkles className="w-5 h-5 text-accent-500 animate-spin" style={{ animationDuration: '3s' }} />
            </div>
            <div>
              <h3 className="font-bold text-base text-white leading-snug">Your AI Briefing</h3>
              <p className="text-xs font-semibold text-brand-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-600 animate-ping inline-block" />
                Co-Founder · Crafting update
              </p>
            </div>
          </div>
          <div className="space-y-2.5 py-2">
            <div className="h-3.5 bg-brand-700/70 rounded-pill w-5/6 animate-pulse" />
            <div className="h-3.5 bg-brand-700/50 rounded-pill w-4/6 animate-pulse" />
            <div className="h-3.5 bg-brand-700/30 rounded-pill w-3/4 animate-pulse" />
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-neutral-300 pt-4">
          <Sparkles className="w-3.5 h-3.5 text-accent-500 shrink-0" />
          <span>Putting together your briefing…</span>
        </div>
      </div>
    );
  }

  const ready = briefing.status === 'ready';
  return (
    <div className="bg-brand-x0f291e text-white rounded-card p-6 shadow-card flex flex-col justify-between min-h-[300px]">
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-accent-500 rounded-modal text-brand-x0f291e flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-brand-x0f291e" />
          </div>
          <div>
            <h3 className="font-bold text-base text-white leading-snug">Your AI Briefing</h3>
            <p className="text-xs font-semibold text-brand-x8fb5a0">Co-Founder</p>
          </div>
        </div>

        <p className="text-sm text-neutral-200 leading-relaxed font-normal mb-6">
          {ready ? briefing.content : BRIEFING_EMPTY_COPY}
        </p>

        {ready && briefing.actions.length > 0 && (
          <ul className="space-y-2.5 mb-6">
            {briefing.actions.map((action) => {
              const added = action.kind === 'task' && action.accepted;
              return (
                <li key={action.index} className="flex items-center justify-between gap-3 rounded-card bg-brand-900 px-3.5 py-2.5">
                  <span className="text-sm text-neutral-200 leading-snug min-w-0">{action.label}</span>
                  {added ? (
                    <Link href="/mission" className="shrink-0 text-xs font-bold text-accent-500 hover:underline inline-flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      Added to today&apos;s mission
                    </Link>
                  ) : (
                    <button
                      type="button"
                      disabled={busy !== null}
                      onClick={() => void doIt(action)}
                      aria-label={`Do it: ${action.label}`}
                      className="shrink-0 rounded-input bg-accent-500 px-3.5 py-1.5 text-xs font-bold text-brand-x0f291e transition-colors hover:bg-accent-500 disabled:opacity-60 cursor-pointer"
                    >
                      {busy === action.index ? 'Adding…' : 'Do it'}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {error && (
          <p role="alert" className="text-xs font-medium text-danger-xf2b8ae mb-3">
            {error}
          </p>
        )}
      </div>

      {ready && (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onTellMeMore(briefing)}
            className="flex-1 bg-accent-500 hover:bg-accent-xe4ae87 text-brand-x0f291e text-sm font-bold py-3 rounded-card transition-colors text-center cursor-pointer"
          >
            Tell me more
          </button>
        </div>
      )}
    </div>
  );
}
