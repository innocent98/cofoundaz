'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronUp, Loader2, Sparkles } from 'lucide-react';
import { defaultMilestoneId, type SendOutcome } from '@/hooks/useFeedback';
import type { FeedbackTheme, FeedbackThemes as ThemeSet, RoadmapMilestoneOption } from '@/lib/api/validation';
import { AI_LABEL, SOURCE_LABEL, formatReceivedOn, plainProse } from '@/lib/validation-format';

/**
 * AI theme cards over the feedback inbox. Theme text is model output built from customer input,
 * so it is rendered as plain text (never HTML or markdown) and labelled AI-generated.
 */
export function FeedbackThemes({
  set,
  clustering,
  message,
  loadMilestones,
  onSend,
}: {
  set: ThemeSet;
  clustering: boolean;
  /** Result of the last "Find themes" run when it did not produce themes. */
  message: string | null;
  loadMilestones: () => Promise<RoadmapMilestoneOption[]>;
  onSend: (themeId: string, milestoneId?: string) => Promise<SendOutcome>;
}) {
  // null = not loaded (or failed to load); the picker then falls back to the server's default.
  const [milestones, setMilestones] = useState<RoadmapMilestoneOption[] | null>(null);
  useEffect(() => {
    let live = true;
    loadMilestones().then(
      (m) => {
        if (live) setMilestones(m);
      },
      () => {}
    );
    return () => {
      live = false;
    };
  }, [loadMilestones, set.themes.length]);

  return (
    <section aria-label="Themes" className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-lg font-display font-semibold text-neutral-900">Themes</h2>
        {set.run && (
          <p className="text-xs text-neutral-500">
            {AI_LABEL} Last grouped {new Date(set.run.created_at).toLocaleString()} from {set.run.item_count}{' '}
            {set.run.item_count === 1 ? 'item' : 'items'}.
          </p>
        )}
      </div>

      {clustering && (
        <div role="status" className="bg-white rounded-modal p-8 border border-neutral-200/80 flex flex-col items-center text-center gap-3 shadow-card">
          <div className="w-10 h-10 rounded-full border-4 border-neutral-200 border-t-[var(--color-accent-600)] animate-spin" />
          <p className="text-neutral-700 font-display italic">Reading every note for patterns… This can take up to a minute.</p>
        </div>
      )}

      {message && !clustering && (
        <p role="status" data-testid="themes-message" className="text-sm text-neutral-700 bg-accent-xfdf4e3 border border-accent-200 rounded-card px-4 py-3">
          {message}
        </p>
      )}

      {!clustering && set.themes.length === 0 && !message && (
        <div className="bg-white rounded-modal p-6 border border-dashed border-neutral-200 text-center">
          <p className="text-sm text-neutral-500">No themes yet. Choose Find themes to group your feedback into patterns.</p>
        </div>
      )}

      {set.themes.length > 0 && (
        <ul className="space-y-3">
          {set.themes.map((t) => (
            <ThemeCard key={t.id} theme={t} milestones={milestones} onSend={onSend} />
          ))}
        </ul>
      )}
    </section>
  );
}

function ThemeCard({
  theme,
  milestones,
  onSend,
}: {
  theme: FeedbackTheme;
  milestones: RoadmapMilestoneOption[] | null;
  onSend: (themeId: string, milestoneId?: string) => Promise<SendOutcome>;
}) {
  const [open, setOpen] = useState(false);
  const [picking, setPicking] = useState(false);
  const [choice, setChoice] = useState<string>('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [landedIn, setLandedIn] = useState<string | null>(null);

  const openMilestones = (milestones ?? []).filter((m) => !m.done);
  const noOpen = milestones !== null && openMilestones.length === 0;
  const sent = theme.roadmap_task_id !== null || landedIn !== null;
  const milestoneTitle =
    landedIn ?? milestones?.find((m) => theme.roadmap_task_id && m.taskIds.includes(theme.roadmap_task_id))?.title ?? null;

  const startPicking = () => {
    setChoice(milestones ? (defaultMilestoneId(milestones) ?? '') : '');
    setError(null);
    setPicking(true);
  };

  const send = async () => {
    setBusy(true);
    setError(null);
    const out = await onSend(theme.id, choice || undefined);
    setBusy(false);
    if (out.ok) {
      setLandedIn(out.milestoneTitle);
      setPicking(false);
    } else if (out.kind === 'already') {
      setPicking(false);
    } else {
      setError(out.message);
    }
  };

  return (
    <li className="bg-white rounded-modal p-5 md:p-6 border border-neutral-200/80 shadow-card space-y-3">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="flex items-start gap-4 min-w-0">
          <div className="w-10 h-10 rounded-card bg-brand-100 text-brand-hover flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4" aria-hidden="true" />
          </div>
          <div className="space-y-1 min-w-0">
            <h3 className="font-bold text-neutral-900 text-sm md:text-base break-words">{plainProse(theme.label)}</h3>
            <p className="text-sm text-neutral-700 break-words">{plainProse(theme.summary)}</p>
            <p className="text-xs text-neutral-400 font-medium">
              {theme.sources.map((s) => SOURCE_LABEL[s]).join(', ')}
            </p>
          </div>
        </div>

        <div className="shrink-0 self-start md:text-right space-y-1">
          {sent ? (
            <div className="text-xs font-semibold text-brand-strong" data-testid="on-roadmap">
              On your roadmap{milestoneTitle ? `: ${milestoneTitle}` : ''}{' '}
              <Link href="/roadmap" className="underline">
                View
              </Link>
            </div>
          ) : (
            <button
              type="button"
              onClick={startPicking}
              disabled={picking || noOpen}
              className="bg-white hover:bg-neutral-50 border border-neutral-200 text-neutral-700 font-semibold px-4 py-2 rounded-card text-xs transition-all cursor-pointer shadow-card disabled:opacity-60"
            >
              Send to roadmap
            </button>
          )}
          {!sent && noOpen && (
            <p className="text-xs text-neutral-500 max-w-[16rem]">
              Your roadmap has no open milestone. Add one on the{' '}
              <Link href="/roadmap" className="underline font-semibold">
                Roadmap
              </Link>{' '}
              first.
            </p>
          )}
        </div>
      </div>

      {picking && !sent && (
        <div className="bg-surface-subtle border border-neutral-200 rounded-card p-3 flex flex-col md:flex-row md:items-end gap-3">
          <label className="flex-1 space-y-1 min-w-0">
            <span className="text-xs font-semibold text-neutral-600">Add it to which milestone?</span>
            <select
              value={choice}
              onChange={(e) => setChoice(e.target.value)}
              disabled={milestones === null}
              className="w-full bg-white border border-neutral-200 rounded-input px-3 py-2 text-sm cursor-pointer"
            >
              {milestones === null && <option value="">First open milestone</option>}
              {openMilestones.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title}
                </option>
              ))}
            </select>
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPicking(false)}
              disabled={busy}
              className="px-3 py-2 rounded-card text-xs font-semibold text-neutral-600 hover:bg-neutral-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={send}
              disabled={busy}
              className="px-4 py-2 rounded-card text-xs font-bold bg-brand-strong hover:bg-brand-rail text-white inline-flex items-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />} Add to roadmap
            </button>
          </div>
        </div>
      )}
      {error && (
        <p role="alert" className="text-sm font-semibold text-danger-600">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex items-center gap-1 text-xs font-semibold text-brand-strong hover:underline cursor-pointer"
      >
        {open ? <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" /> : <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />}
        {open ? 'Hide quotes' : `Show ${theme.items.length} ${theme.items.length === 1 ? 'quote' : 'quotes'}`}
      </button>
      {open && (
        <ul className="space-y-2">
          {theme.items.map((i) => (
            <li key={i.id} className="border-l-2 border-brand-x9fbbaa pl-3 space-y-0.5">
              <p className="text-sm italic text-neutral-800 break-words">“{i.text}”</p>
              <p className="text-xs text-neutral-400">
                {SOURCE_LABEL[i.source]} · {formatReceivedOn(i.received_on)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}
