'use client';

import React, { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useCopyHistory, useSegments } from '@/hooks/useMarketingApi';
import { useMarketingGeneration } from '@/hooks/useMarketingGeneration';
import {
  CHANNEL_KEYS,
  CHANNEL_LABELS,
  createCalendarEntry,
  getCopy,
  startCopy,
  type AssetType,
  type ChannelKey,
  type CopyGeneration,
  type CopyInput,
  type CopyTone,
} from '@/lib/api/marketing';
import {
  BTN_ACCENT,
  BTN_PRIMARY,
  BTN_SECONDARY,
  CARD,
  ForbiddenState,
  GenerationNote,
  INPUT,
  LABEL,
} from '@/components/marketing-hub/states';
import { useToast } from '../ToastContext';

const ASSET_TYPES: { value: AssetType; label: string }[] = [
  { value: 'social_post', label: 'Social post' },
  { value: 'ad', label: 'Ad' },
  { value: 'email', label: 'Email' },
  { value: 'landing_headline', label: 'Landing headline' },
  { value: 'product_description', label: 'Product description' },
];

const TONES: { value: CopyTone; label: string }[] = [
  { value: 'bold', label: 'Bold' },
  { value: 'friendly', label: 'Friendly' },
  { value: 'expert', label: 'Expert' },
  { value: 'playful', label: 'Playful' },
];

const KEY_MESSAGE_MAX = 2000;

function CopyWorkbench() {
  const params = useSearchParams();
  const { triggerToast, runAction } = useToast();
  const segs = useSegments();
  const history = useCopyHistory();
  const gen = useMarketingGeneration(startCopy, getCopy);

  const [assetType, setAssetType] = useState<AssetType>('social_post');
  const [channel, setChannel] = useState<ChannelKey | ''>('');
  const [tone, setTone] = useState<CopyTone>('friendly');
  const [keyMessage, setKeyMessage] = useState<string>(() => params.get('message') ?? '');
  const [cta, setCta] = useState('');
  const [segmentId, setSegmentId] = useState('');
  const [viewing, setViewing] = useState<CopyGeneration | null>(null);
  const [savingIdx, setSavingIdx] = useState<number | null>(null);
  const [saveTitle, setSaveTitle] = useState('');
  const [saveWhen, setSaveWhen] = useState('');
  const [saveChannel, setSaveChannel] = useState<ChannelKey>('organic_social');
  const [saveBusy, setSaveBusy] = useState(false);

  const forbidden = history.status === 'forbidden';

  const generate = async (input: CopyInput) => {
    setViewing(null);
    setSavingIdx(null);
    const g = await gen.run(input);
    if (g) {
      history.reload();
      triggerToast('Copy ready. Pick a variant.');
    }
  };

  const onGenerate = () => {
    if (!keyMessage.trim()) return;
    void generate({
      asset_type: assetType,
      tone,
      key_message: keyMessage.trim(),
      channel: channel || null,
      cta: cta.trim() || null,
      audience_segment_id: segmentId || null,
    });
  };

  const shown: CopyGeneration | null = viewing ?? (gen.phase === 'ready' ? (gen.generation as CopyGeneration) : null);
  const variants = shown?.output.variants ?? [];

  const copyVariant = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      triggerToast('Copied to your clipboard.');
    } catch {
      triggerToast('Could not access the clipboard. Select the text and copy it manually.', 'error');
    }
  };

  const openSave = (idx: number, text: string) => {
    setSavingIdx(idx);
    setSaveTitle(text.replace(/\s+/g, ' ').slice(0, 60));
    setSaveWhen('');
    setSaveChannel(((shown?.inputs.channel as ChannelKey | null) ?? (channel || 'organic_social')) as ChannelKey);
  };

  const saveToCalendar = async (text: string) => {
    if (!saveTitle.trim()) {
      triggerToast('Give the calendar entry a title.', 'error');
      return;
    }
    setSaveBusy(true);
    const res = await runAction(
      () =>
        createCalendarEntry({
          title: saveTitle.trim(),
          channel: saveChannel,
          body: text,
          status: saveWhen ? 'scheduled' : 'draft',
          scheduled_at: saveWhen ? new Date(saveWhen).toISOString() : null,
        }),
      saveWhen ? 'Scheduled on your calendar.' : 'Saved to your calendar as a draft.'
    );
    setSaveBusy(false);
    if (res.ok) setSavingIdx(null);
  };

  if (forbidden) return <ForbiddenState />;

  return (
    <div className="space-y-8 animate-fadeIn">
      <h1 className="text-3xl md:text-4xl font-display font-semibold text-sage-900 tracking-tight">AI copy generator</h1>

      <div className={`${CARD} p-6 md:p-8 space-y-6`}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label htmlFor="copy-asset" className={LABEL}>Asset type</label>
            <select id="copy-asset" className={INPUT} value={assetType} onChange={(e) => setAssetType(e.target.value as AssetType)}>
              {ASSET_TYPES.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label htmlFor="copy-channel" className={LABEL}>Channel</label>
            <select id="copy-channel" className={INPUT} value={channel} onChange={(e) => setChannel(e.target.value as ChannelKey | '')}>
              <option value="">Any channel</option>
              {CHANNEL_KEYS.map((k) => <option key={k} value={k}>{CHANNEL_LABELS[k]}</option>)}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <p className={LABEL} id="copy-tone-label">Tone</p>
          <div className="flex flex-wrap gap-2.5" role="group" aria-labelledby="copy-tone-label">
            {TONES.map((t) => (
              <button
                key={t.value}
                type="button"
                aria-pressed={tone === t.value}
                onClick={() => setTone(t.value)}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all cursor-pointer ${
                  tone === t.value ? 'bg-[#0e271f] text-white shadow-card' : 'bg-white border border-sage-200 text-sage-700 hover:bg-sage-50'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="copy-message" className={LABEL}>Key message</label>
          <textarea
            id="copy-message"
            rows={3}
            maxLength={KEY_MESSAGE_MAX}
            className={INPUT}
            value={keyMessage}
            placeholder="What should this copy say? e.g. Saving should be effortless, even on irregular income."
            onChange={(e) => setKeyMessage(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label htmlFor="copy-cta" className={LABEL}>Call to action (optional)</label>
            <input id="copy-cta" className={INPUT} maxLength={200} value={cta} onChange={(e) => setCta(e.target.value)} placeholder="e.g. Join the waitlist" />
          </div>
          <div className="space-y-2">
            <label htmlFor="copy-segment" className={LABEL}>Audience segment (optional)</label>
            <select id="copy-segment" className={INPUT} value={segmentId} onChange={(e) => setSegmentId(e.target.value)}>
              <option value="">No specific segment</option>
              {segs.segments.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <button type="button" onClick={onGenerate} disabled={gen.busy || !keyMessage.trim()} className={BTN_ACCENT}>
            {gen.busy ? 'Generating...' : 'Generate copy'}
          </button>
          <GenerationNote phase={gen.phase} error={gen.error} generatingLabel="The AI is writing your variants. This usually takes under a minute." />
        </div>
      </div>

      {shown && (
        <div className="space-y-4 animate-fadeIn pt-2">
          <p className="text-xs font-semibold text-sage-500 uppercase tracking-wider">
            {variants.length === 0
              ? 'The AI returned no variants. Try again.'
              : `${variants.length} ${variants.length === 1 ? 'variant' : 'variants'}. Ship two and let your audience pick the winner.`}
          </p>

          {variants.map((text, idx) => (
            <div key={`${shown.id}-${idx}`} className={`${CARD} p-6 space-y-4`}>
              <p className="text-sage-900 text-sm md:text-base leading-relaxed whitespace-pre-wrap">{text}</p>
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button type="button" onClick={() => void copyVariant(text)} className={BTN_PRIMARY}>Copy</button>
                <button
                  type="button"
                  disabled={gen.busy}
                  onClick={() =>
                    void generate({
                      asset_type: (shown.inputs.asset_type as AssetType) ?? assetType,
                      tone: (shown.inputs.tone as CopyTone) ?? tone,
                      key_message: text.slice(0, KEY_MESSAGE_MAX),
                      channel: (shown.inputs.channel as ChannelKey | null) ?? null,
                      cta: (shown.inputs.cta as string | null) ?? null,
                      audience_segment_id: (shown.inputs.audience_segment_id as string | null) ?? null,
                    })
                  }
                  className={BTN_SECONDARY}
                >
                  More like this
                </button>
                <button
                  type="button"
                  onClick={() => (savingIdx === idx ? setSavingIdx(null) : openSave(idx, text))}
                  className="text-[#0e271f] hover:underline font-semibold text-xs cursor-pointer ml-auto"
                >
                  Save to calendar
                </button>
              </div>

              {savingIdx === idx && (
                <div className="rounded-card border border-sage-200 bg-sage-50/60 p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1.5 md:col-span-3">
                    <label htmlFor={`save-title-${idx}`} className={LABEL}>Calendar title</label>
                    <input id={`save-title-${idx}`} className={INPUT} maxLength={200} value={saveTitle} onChange={(e) => setSaveTitle(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor={`save-channel-${idx}`} className={LABEL}>Channel</label>
                    <select id={`save-channel-${idx}`} className={INPUT} value={saveChannel} onChange={(e) => setSaveChannel(e.target.value as ChannelKey)}>
                      {CHANNEL_KEYS.map((k) => <option key={k} value={k}>{CHANNEL_LABELS[k]}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor={`save-when-${idx}`} className={LABEL}>When (optional)</label>
                    <input id={`save-when-${idx}`} type="datetime-local" className={INPUT} value={saveWhen} onChange={(e) => setSaveWhen(e.target.value)} />
                  </div>
                  <div className="flex items-end">
                    <button type="button" disabled={saveBusy} onClick={() => void saveToCalendar(text)} className={`${BTN_PRIMARY} w-full`}>
                      {saveBusy ? 'Saving...' : saveWhen ? 'Schedule it' : 'Save as draft'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {history.history.length > 0 && (
        <section aria-label="Recent generations" className={`${CARD} p-6 space-y-3`}>
          <h2 className="font-display font-semibold text-lg text-sage-900">Recent generations</h2>
          <ul className="divide-y divide-sage-100">
            {history.history.slice(0, 8).map((h) => (
              <li key={h.id} className="py-2.5 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-sage-900 truncate">{String(h.inputs.key_message ?? '')}</p>
                  <p className="text-xs text-sage-500 capitalize">
                    {h.status === 'failed' ? 'Failed' : h.status === 'generating' ? 'Still generating' : `${h.output.variants?.length ?? 0} variants`}
                    {' · '}
                    {new Date(h.created_at).toLocaleString()}
                  </p>
                </div>
                {h.status === 'ready' && (
                  <button type="button" onClick={() => { setViewing(h); setSavingIdx(null); }} className={BTN_SECONDARY}>
                    View
                  </button>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

export default function MarketingCopyPage() {
  return (
    <Suspense fallback={null}>
      <CopyWorkbench />
    </Suspense>
  );
}
