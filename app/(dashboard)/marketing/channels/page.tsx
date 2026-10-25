'use client';

import React, { useState } from 'react';
import { useChannels } from '@/hooks/useMarketingApi';
import { useMarketingGeneration } from '@/hooks/useMarketingGeneration';
import {
  CHANNEL_LABELS,
  CHANNEL_STATUS_LABELS,
  FIT_LABELS,
  formatMoney,
  getFitNotes,
  startFitNotes,
  type ChannelStatus,
  type FitLevel,
  type MarketingChannel,
} from '@/lib/api/marketing';
import { BTN_ACCENT, BTN_PRIMARY, BTN_SECONDARY, CARD, DataGate, GenerationNote, INPUT } from '@/components/marketing-hub/states';
import { ChannelIcon } from '@/components/marketing-hub/channel-icon';
import { useToast } from '../ToastContext';

const STATUS_LABEL = CHANNEL_STATUS_LABELS;

const FIT_BADGE: Record<FitLevel, string> = {
  high: 'bg-success-100 text-success-800',
  medium: 'bg-warning-100 text-warning-800',
  low: 'bg-neutral-200 text-neutral-700',
};
const FIT_MARK: Record<FitLevel, string> = { high: '▲', medium: '●', low: '▼' };

const STATUS_BADGE: Record<ChannelStatus, string> = {
  active: 'bg-success-100 text-success-800',
  testing: 'bg-warning-100 text-warning-800',
  paused: 'bg-neutral-200 text-neutral-700',
  not_started: 'bg-neutral-100 text-neutral-700',
};

export default function MarketingChannelsPage() {
  const { channels, status, error, reload, setStatus, setNotes } = useChannels();
  const fit = useMarketingGeneration(startFitNotes, getFitNotes);
  const { triggerToast, runAction } = useToast();

  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState('');
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const generate = async () => {
    const g = await fit.run();
    if (g) {
      // The worker has already written each note onto its channel row; re-read to show them.
      reload();
      triggerToast('AI fit notes updated for your channels.');
    }
  };

  const changeStatus = async (ch: MarketingChannel, next: ChannelStatus) => {
    setBusyKey(ch.key);
    await runAction(() => setStatus(ch.key, next), `${CHANNEL_LABELS[ch.key]} is now ${STATUS_LABEL[next].toLowerCase()}.`);
    setBusyKey(null);
  };

  const saveNotes = async (ch: MarketingChannel) => {
    setBusyKey(ch.key);
    const res = await runAction(() => setNotes(ch.key, noteDraft.trim() || null), 'Notes saved.');
    setBusyKey(null);
    if (res.ok) setEditingKey(null);
  };

  const generatedAt = channels.find((c) => c.fit_note_generated_at)?.fit_note_generated_at;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl md:text-4xl font-display font-semibold text-neutral-900 tracking-tight">Channels</h1>
          {generatedAt && (
            <p className="text-xs text-neutral-500">AI fit notes as of {new Date(generatedAt).toLocaleString()}. The AI&apos;s judgement, not data.</p>
          )}
        </div>
        <button type="button" onClick={generate} disabled={fit.busy} className={`${BTN_ACCENT} self-start md:self-auto`}>
          {fit.busy ? 'Writing fit notes...' : '✦ Generate AI fit notes'}
        </button>
      </div>

      <GenerationNote
        phase={fit.phase}
        error={fit.error}
        generatingLabel="The AI is judging how well each channel fits your startup. This usually takes under a minute."
      />

      <DataGate status={status} error={error} onRetry={reload} loadingLabel="Loading your channels">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {channels.map((ch) => {
            const st = ch.stats_30d?.has_data ? ch.stats_30d : null;
            const working = busyKey === ch.key;
            return (
              <div key={ch.key} className={`${CARD} p-6 flex flex-col justify-between space-y-4`}>
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-display font-semibold text-lg text-neutral-900 flex items-center gap-2">
                      <ChannelIcon channel={ch.key} className="h-4 w-4 text-accent-600" />
                      {CHANNEL_LABELS[ch.key]}
                    </h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_BADGE[ch.status]}`}>
                      {STATUS_LABEL[ch.status]}
                    </span>
                  </div>
                  <p className="text-xs md:text-sm font-medium text-neutral-500">
                    {st
                      ? `Last 30 days: ${st.visits.toLocaleString()} visits, ${st.clicks.toLocaleString()} clicks, ${st.conversions.toLocaleString()} conversions, ${formatMoney(st.spend)} spent`
                      : 'No tracked results yet'}
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <label htmlFor={`status-${ch.key}`} className="text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                      Status
                    </label>
                    <select
                      id={`status-${ch.key}`}
                      value={ch.status}
                      aria-label={`${CHANNEL_LABELS[ch.key]} status`}
                      disabled={working}
                      onChange={(e) => void changeStatus(ch, e.target.value as ChannelStatus)}
                      className={`${INPUT} !w-auto !py-1.5`}
                    >
                      {(Object.keys(STATUS_LABEL) as ChannelStatus[]).map((s) => (
                        <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="bg-neutral-xf2f6f4 rounded-card p-3.5 flex items-start gap-3 border border-neutral-xe4ece7">
                  <div className="w-5 h-5 rounded-[6px] bg-accent-600 text-white flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                    ✦
                  </div>
                  <div className="space-y-1.5">
                    {ch.fit_level && (
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${FIT_BADGE[ch.fit_level]}`}>
                        <span aria-hidden="true">{FIT_MARK[ch.fit_level]}</span>
                        {FIT_LABELS[ch.fit_level]}
                      </span>
                    )}
                    <p className="text-xs md:text-sm text-brand-x1e382c font-medium leading-relaxed">
                      {ch.ai_fit_note ?? 'No AI fit note yet. Use "Generate AI fit notes" above.'}
                    </p>
                  </div>
                </div>

                {editingKey === ch.key ? (
                  <div className="space-y-2">
                    <label htmlFor={`notes-${ch.key}`} className="text-xs font-semibold text-neutral-700 uppercase tracking-wider">Your notes</label>
                    <textarea id={`notes-${ch.key}`} rows={3} className={INPUT} value={noteDraft} onChange={(e) => setNoteDraft(e.target.value)} />
                    <div className="flex gap-2">
                      <button type="button" disabled={working} onClick={() => void saveNotes(ch)} className={BTN_PRIMARY}>Save notes</button>
                      <button type="button" onClick={() => setEditingKey(null)} className={BTN_SECONDARY}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm text-neutral-700">
                      <span className="font-semibold text-neutral-900">Your notes: </span>
                      {ch.notes || 'None yet.'}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setNoteDraft(ch.notes ?? '');
                        setEditingKey(ch.key);
                      }}
                      className="text-xs font-semibold text-brand-rail-deep hover:underline cursor-pointer shrink-0"
                    >
                      Edit notes
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </DataGate>
    </div>
  );
}
