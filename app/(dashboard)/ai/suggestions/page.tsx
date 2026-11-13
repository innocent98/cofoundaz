'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAISuggestions } from '@/hooks/useAIBench';

// Where a card's content came from (the `source` key on /ai/suggestions).
const SOURCE_LABEL: Record<string, string> = {
  health: 'Health Score',
  briefing: 'Daily briefing',
  opportunity: 'Opportunity',
  learning: 'Academy',
};
const sourceLabel = (s: string) => SOURCE_LABEL[s] ?? 'Co-Founder';

export default function SuggestedActionsPage() {
  const router = useRouter();
  const { items, enabled, loading, error, actionError, refresh, act } = useAISuggestions();
  const [busy, setBusy] = useState<string | null>(null);

  const run = async (id: string, verb: 'accept' | 'dismiss' | 'snooze', href?: string) => {
    setBusy(id);
    const result = await act(id, verb, verb === 'snooze' ? 7 : undefined);
    setBusy(null);
    // "Do it" = accept, then open the thing to do.
    if (result && verb === 'accept' && href) router.push(href);
  };

  return (
    <div className="max-w-4xl w-full mx-auto flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold text-ink tracking-tight mb-1">Suggested actions</h2>
        <p className="text-xs text-ink-muted">Proactive ideas based on your recent activity and metrics.</p>
      </div>

      {actionError && <p role="alert" className="text-xs font-medium text-danger-700">{actionError}</p>}

      {loading ? (
        <p className="text-sm text-neutral-500" role="status">Loading suggestions...</p>
      ) : error ? (
        <p className="text-sm text-neutral-500">
          {error}{' '}
          <button type="button" onClick={() => { void refresh(); }} className="font-semibold text-brand-700 hover:underline cursor-pointer">
            Try again
          </button>
        </p>
      ) : !enabled ? (
        <p className="text-sm text-neutral-500">
          Proactive suggestions are off.{' '}
          <Link href="/ai/settings" className="font-semibold text-brand-700 hover:underline">Turn them on in AI settings</Link>.
        </p>
      ) : items.length === 0 ? (
        <p className="text-sm text-neutral-500">Nothing right now. When I spot something worth your time, it&apos;ll be here.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-modal p-5 border border-line-soft shadow-card flex flex-col justify-between hover:border-brand-700 transition-colors"
            >
              <div>
                <span className="text-[11px] font-semibold text-accent-600">{sourceLabel(item.source)}</span>
                <h3 className="font-bold text-sm text-ink leading-tight mt-1 mb-2">{item.title}</h3>
                <p className="text-xs text-ink-body leading-relaxed mb-6">{item.body}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={busy === item.id}
                  onClick={() => { void run(item.id, 'accept', item.href); }}
                  className="flex-1 bg-white hover:bg-surface-muted text-brand-strong font-semibold text-[11px] py-1.5 px-3 rounded-card border border-line-strong transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Do it
                </button>
                <button
                  type="button"
                  disabled={busy === item.id}
                  onClick={() => { void run(item.id, 'snooze'); }}
                  className="flex-1 bg-white hover:bg-surface-muted text-ink-muted font-medium text-[11px] py-1.5 px-3 rounded-card border border-line-soft transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Snooze 1 week
                </button>
                <button
                  type="button"
                  disabled={busy === item.id}
                  onClick={() => { void run(item.id, 'dismiss'); }}
                  className="flex-1 bg-white hover:bg-neutral-xfff5f5 text-danger-xb84233 font-medium text-[11px] py-1.5 px-3 rounded-card border border-line-soft hover:border-danger-xf6d0d0 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
