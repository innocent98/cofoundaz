'use client';

import React, { useState } from 'react';
import { useCopyPlatforms } from '@/hooks/useMarketingApi';
import { useMarketingGeneration } from '@/hooks/useMarketingGeneration';
import {
  PLATFORM_CHANNEL,
  charCount,
  getCopy,
  isOverLimit,
  startCopy,
  type ChannelKey,
  type CopyGeneration,
  type CopyTone,
  type PlatformKey,
} from '@/lib/api/marketing';
import { BTN_ACCENT, BTN_PRIMARY, BTN_SECONDARY, GenerationNote, INPUT, LABEL } from './states';
import { CharCounter } from './char-counter';

const TONES: { value: CopyTone; label: string }[] = [
  { value: 'bold', label: 'Bold' },
  { value: 'friendly', label: 'Friendly' },
  { value: 'expert', label: 'Expert' },
  { value: 'playful', label: 'Playful' },
];

/**
 * "Write with AI" inside the post drawer. It is the same copy generation as the AI Copy page
 * (POST /copy/generate), started from the post's title and channel; the founder picks a variant
 * and it lands in the post body. Nothing is written to the post until they press "Use this".
 */
export function WriteWithAi({
  title,
  channel,
  campaignId,
  onUse,
}: {
  title: string;
  channel: ChannelKey;
  campaignId: string | null;
  onUse: (text: string) => void;
}) {
  const { platforms } = useCopyPlatforms();
  const gen = useMarketingGeneration(startCopy, getCopy);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [tone, setTone] = useState<CopyTone>('friendly');
  const [platform, setPlatform] = useState<PlatformKey | ''>('');

  const forChannel = platforms.filter((p) => PLATFORM_CHANNEL[p.key] === channel);
  const options = forChannel.length > 0 ? forChannel : platforms;
  const chosen = platforms.find((p) => p.key === platform);
  const shown = gen.phase === 'ready' ? (gen.generation as CopyGeneration) : null;
  const variants = shown?.output.variants ?? [];
  const brief = message.trim() || title.trim();

  const generate = () => {
    if (!brief) return;
    void gen.run({
      asset_type: 'social_post',
      tone,
      key_message: brief,
      channel,
      platform: platform || null,
      campaign_id: campaignId,
    });
  };

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={`${BTN_SECONDARY} self-start flex items-center gap-2`}>
        <span aria-hidden="true">✦</span>
        <span>Write with AI</span>
      </button>
    );
  }

  return (
    <div className="rounded-card border border-sage-200 bg-sage-50/60 p-4 space-y-3" role="group" aria-label="Write with AI">
      <div className="flex items-center justify-between">
        <p className={LABEL}>Write with AI</p>
        <button type="button" onClick={() => { gen.reset(); setOpen(false); }} className="text-xs font-semibold text-sage-600 hover:underline cursor-pointer">
          Close
        </button>
      </div>
      <div className="space-y-1.5">
        <label htmlFor="wai-message" className="text-xs font-semibold text-sage-700">What should it say?</label>
        <textarea
          id="wai-message"
          rows={2}
          maxLength={2000}
          className={INPUT}
          value={message}
          placeholder={title.trim() ? `Leave blank to write about "${title.trim()}"` : 'Describe the post in a sentence.'}
          onChange={(e) => setMessage(e.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label htmlFor="wai-tone" className="text-xs font-semibold text-sage-700">Tone</label>
          <select id="wai-tone" className={INPUT} value={tone} onChange={(e) => setTone(e.target.value as CopyTone)}>
            {TONES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="wai-platform" className="text-xs font-semibold text-sage-700">Length limit</label>
          <select id="wai-platform" className={INPUT} value={platform} onChange={(e) => setPlatform(e.target.value as PlatformKey | '')}>
            <option value="">No limit</option>
            {options.map((p) => <option key={p.key} value={p.key}>{p.label} ({p.limit})</option>)}
          </select>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={generate} disabled={gen.busy || !brief} className={BTN_ACCENT}>
          {gen.busy ? 'Writing...' : variants.length ? 'Write again' : 'Write options'}
        </button>
        <GenerationNote phase={gen.phase} error={gen.error} generatingLabel="The AI is writing your options. This usually takes under a minute." />
      </div>
      {shown && variants.length === 0 && <p className="text-xs text-sage-600">The AI returned no options. Try again.</p>}
      {variants.map((text, idx) => (
        <div key={`${shown?.id}-${idx}`} className="rounded-card border border-sage-200 bg-white p-3 space-y-2">
          <p className="text-sm text-sage-900 whitespace-pre-wrap leading-relaxed">{text}</p>
          <div className="flex items-center justify-between gap-3">
            <CharCounter
              count={shown?.output.lengths?.[idx] ?? charCount(text)}
              limit={shown?.output.limit}
              kind={chosen?.kind}
              platformLabel={chosen?.label}
            />
            <button type="button" onClick={() => { onUse(text); gen.reset(); setOpen(false); }} className={BTN_PRIMARY}>
              Use this
            </button>
          </div>
          {isOverLimit(shown?.output, idx) && (
            <p className="text-xs text-red-700">This option is over the limit. Edit it after you use it, or write again.</p>
          )}
        </div>
      ))}
    </div>
  );
}
