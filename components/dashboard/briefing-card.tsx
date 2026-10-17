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
      <div className="bg-[#12291F] text-white rounded-card p-6 shadow-card flex flex-col justify-between min-h-[300px] border border-[#1E4D3B]/40">
        <div>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-full bg-[#1E4D3B] flex items-center justify-center shadow-card animate-pulse">
              <Sparkles className="w-5 h-5 text-copper-500 animate-spin" style={{ animationDuration: '3s' }} />
            </div>
            <div>
              <h3 className="font-bold text-base text-white leading-snug">Your AI Briefing</h3>
              <p className="text-xs font-semibold text-[#4E8F73] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-600 animate-ping inline-block" />
                Co-Founder · Crafting update
              </p>
            </div>
          </div>
          <div className="space-y-2.5 py-2">
            <div className="h-3.5 bg-[#1E4D3B]/70 rounded-pill w-5/6 animate-pulse" />
            <div className="h-3.5 bg-[#1E4D3B]/50 rounded-pill w-4/6 animate-pulse" />
            <div className="h-3.5 bg-[#1E4D3B]/30 rounded-pill w-3/4 animate-pulse" />
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-sage-300 pt-4">
          <Sparkles className="w-3.5 h-3.5 text-copper-500 shrink-0" />
          <span>Putting together your briefing…</span>
        </div>
      </div>
    );
  }

  const ready = briefing.status === 'ready';
  return (
    <div className="bg-[#0F291E] text-white rounded-card p-6 shadow-card flex flex-col justify-between min-h-[300px]">
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-[#D89A6E] rounded-modal text-[#0F291E] flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-[#0F291E]" />
          </div>
          <div>
            <h3 className="font-bold text-base text-white leading-snug">Your AI Briefing</h3>
            <p className="text-xs font-semibold text-[#8FB5A0]">Co-Founder</p>
          </div>
        </div>

        <p className="text-sm text-sage-200 leading-relaxed font-normal mb-6">
          {ready ? briefing.content : BRIEFING_EMPTY_COPY}
        </p>

        {ready && briefing.actions.length > 0 && (
          <ul className="space-y-2.5 mb-6">
            {briefing.actions.map((action) => {
              const added = action.kind === 'task' && action.accepted;
              return (
                <li key={action.index} className="flex items-center justify-between gap-3 rounded-card bg-[#12291F] px-3.5 py-2.5">
                  <span className="text-sm text-sage-200 leading-snug min-w-0">{action.label}</span>
                  {added ? (
                    <Link href="/mission" className="shrink-0 text-xs font-bold text-copper-500 hover:underline inline-flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      Added to today&apos;s mission
                    </Link>
                  ) : (
                    <button
                      type="button"
                      disabled={busy !== null}
                      onClick={() => void doIt(action)}
                      aria-label={`Do it: ${action.label}`}
                      className="shrink-0 rounded-input bg-[#D89A6E] px-3.5 py-1.5 text-xs font-bold text-[#0F291E] transition-colors hover:bg-copper-500 disabled:opacity-60 cursor-pointer"
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
          <p role="alert" className="text-xs font-medium text-[#F2B8AE] mb-3">
            {error}
          </p>
        )}
      </div>

      {ready && (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onTellMeMore(briefing)}
            className="flex-1 bg-[#D89A6E] hover:bg-[#E4AE87] text-[#0F291E] text-sm font-bold py-3 rounded-card transition-colors text-center cursor-pointer"
          >
            Tell me more
          </button>
        </div>
      )}
    </div>
  );
}
