'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCampaigns, useCopyHistory, useCopyPlatforms, useSegments } from '@/hooks/useMarketingApi';
import { useBusinessRecords } from '@/hooks/useBusinessRecords';
import { useMarketingGeneration } from '@/hooks/useMarketingGeneration';
import {
  CHANNEL_KEYS,
  CHANNEL_LABELS,
  PLATFORM_CHANNEL,
  charCount,
  createCalendarEntry,
  getCopy,
  isUuid,
  isOverLimit,
  refineCopy,
  startCopy,
  type AssetType,
  type ChannelKey,
  type CopyGeneration,
  type CopyInput,
  type CopyTone,
  type PlatformKey,
  type RefineInput,
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
import { CharCounter } from '@/components/marketing-hub/char-counter';
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
const HISTORY_PAGE = 15;

type Tab = 'generate' | 'history';

function refineOf(g: CopyGeneration): { instruction: string; parent: string } | null {
  const r = g.inputs.refine as { instruction?: string; parent_generation_id?: string } | undefined;
  return r?.instruction && r.parent_generation_id ? { instruction: r.instruction, parent: r.parent_generation_id } : null;
}

function CopyWorkbench() {
  const params = useSearchParams();
  const router = useRouter();
  const { triggerToast, runAction } = useToast();
  const segs = useSegments();
  const { campaigns } = useCampaigns();
  const personas = useBusinessRecords('personas');
  const history = useCopyHistory();
  const { platforms } = useCopyPlatforms();
  const gen = useMarketingGeneration(startCopy, getCopy);
  const refine = useMarketingGeneration<RefineInput, CopyGeneration>(refineCopy, getCopy);

  const campaignId = params.get('campaign') ?? '';
  const generationParam = params.get('generation');

  const [tab, setTab] = useState<Tab>('generate');
  const [assetType, setAssetType] = useState<AssetType>('social_post');
  const [channel, setChannel] = useState<ChannelKey | ''>('');
  const [platform, setPlatform] = useState<PlatformKey | ''>('');
  const [tone, setTone] = useState<CopyTone>('friendly');
  const [keyMessage, setKeyMessage] = useState<string>(() => params.get('message') ?? '');
  const [cta, setCta] = useState('');
  const [segmentId, setSegmentId] = useState('');
  const [viewing, setViewing] = useState<CopyGeneration | null>(null);
  const [savingIdx, setSavingIdx] = useState<number | null>(null);
  const [refineIdx, setRefineIdx] = useState<number | null>(null);
  const [instruction, setInstruction] = useState('');
  const [saveTitle, setSaveTitle] = useState('');
  const [saveWhen, setSaveWhen] = useState('');
  const [saveChannel, setSaveChannel] = useState<ChannelKey>('organic_social');
  const [saveBusy, setSaveBusy] = useState(false);
  const [useBusy, setUseBusy] = useState<number | null>(null);
  const [historyShown, setHistoryShown] = useState(HISTORY_PAGE);

  // Opening a set from the campaign page (?generation=id).
  useEffect(() => {
    if (!isUuid(generationParam)) return;
    let cancelled = false;
    void (async () => {
      try {
        const g = await getCopy(generationParam);
        if (!cancelled && g.status === 'ready') setViewing(g);
      } catch {
        if (!cancelled) triggerToast('That copy set could not be opened.', 'error');
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only the link itself should re-run this
  }, [generationParam]);

  const forbidden = history.status === 'forbidden';
  const busy = gen.busy || refine.busy;
  const campaign = campaigns.find((c) => c.id === campaignId);
  const platformOf = (key: string | null | undefined) => platforms.find((p) => p.key === key);
  const chosenPlatform = platformOf(platform);

  const generate = async (input: CopyInput) => {
    setViewing(null);
    setSavingIdx(null);
    setRefineIdx(null);
    const g = await gen.run(input);
    if (g) {
      setViewing(g);
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
      platform: platform || null,
      campaign_id: campaignId || null,
      cta: cta.trim() || null,
      audience_segment_id: segmentId || null,
    });
  };

  const shown = viewing;
  const variants = shown?.output.variants ?? [];
  const shownPlatform = platformOf(shown?.output.platform ?? (shown?.inputs.platform as string | undefined));
  const refinement = shown ? refineOf(shown) : null;

  const onRefine = async (idx: number) => {
    if (!shown || !instruction.trim()) return;
    const g = await refine.run({ parentId: shown.id, variantIndex: idx, instruction: instruction.trim() });
    if (g) {
      setViewing(g);
      setRefineIdx(null);
      setInstruction('');
      history.reload();
      triggerToast('Refined. The original set is still in History.');
    }
  };

  const backToOriginal = async () => {
    if (!refinement) return;
    const res = await runAction(() => getCopy(refinement.parent));
    if (res.ok) setViewing(res.value);
  };

  const copyVariant = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      triggerToast('Copied to your clipboard.');
    } catch {
      triggerToast('Could not access the clipboard. Select the text and copy it manually.', 'error');
    }
  };

  const draftChannel = (): ChannelKey => {
    const fromInputs = shown?.inputs.channel as ChannelKey | null | undefined;
    if (fromInputs) return fromInputs;
    if (shownPlatform) return PLATFORM_CHANNEL[shownPlatform.key];
    return channel || 'organic_social';
  };

  // "Use" puts the variant into a new calendar draft and opens it there, ready to edit and schedule.
  const openAsDraft = async (idx: number, text: string) => {
    setUseBusy(idx);
    const res = await runAction(() =>
      createCalendarEntry({
        title: text.replace(/\s+/g, ' ').slice(0, 60),
        channel: draftChannel(),
        body: text,
        status: 'draft',
        scheduled_at: null,
        campaign_id: (shown?.campaign_id ?? shown?.inputs.campaign_id ?? null) as string | null,
      })
    );
    setUseBusy(null);
    if (res.ok) router.push(`/marketing/calendar?entry=${encodeURIComponent(res.value.id)}`);
  };

  const openSave = (idx: number, text: string) => {
    setSavingIdx(idx);
    setSaveTitle(text.replace(/\s+/g, ' ').slice(0, 60));
    setSaveWhen('');
    setSaveChannel(draftChannel());
  };

  const saveToCalendar = async (text: string) => {
    if (!saveTitle.trim()) {
      triggerToast('Give the calendar entry a title.', 'error');
      return;
    }
    if (saveWhen && new Date(saveWhen).getTime() <= Date.now()) {
      triggerToast('Pick a later time. A scheduled post in the past is marked published straight away.', 'error');
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
          campaign_id: (shown?.campaign_id ?? shown?.inputs.campaign_id ?? null) as string | null,
        }),
      saveWhen ? 'Scheduled on your calendar.' : 'Saved to your calendar as a draft.'
    );
    setSaveBusy(false);
    if (res.ok) setSavingIdx(null);
  };

  if (forbidden) return <ForbiddenState />;

  const needsBusinessBuilder = personas.records.length === 0 && !personas.loading && !personas.error;

  return (
    <div className="space-y-8 animate-fadeIn">
      <h1 className="text-3xl md:text-4xl font-display font-semibold text-neutral-900 tracking-tight">AI copy generator</h1>

      <div role="tablist" aria-label="AI copy" className="flex gap-2">
        {([['generate', 'Generate'], ['history', 'History']] as const).map(([key, label]) => (
          <button
            key={key}
            id={`copy-tab-${key}`}
            role="tab"
            type="button"
            aria-selected={tab === key}
            aria-controls={`copy-panel-${key}`}
            onClick={() => setTab(key)}
            className={`px-5 py-2 rounded-full text-sm font-semibold cursor-pointer ${
              tab === key ? 'bg-brand-rail-deep text-white shadow-card' : 'bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'generate' && (
        <div id="copy-panel-generate" role="tabpanel" aria-labelledby="copy-tab-generate" className="space-y-8">
          {campaign && (
            <p className="rounded-card border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-700">
              Writing for the campaign{' '}
              <Link href={`/marketing/campaigns/${campaign.id}`} className="font-semibold text-brand-rail-deep hover:underline">{campaign.name}</Link>.
              Copy you save goes to its content.
            </p>
          )}
          {needsBusinessBuilder && (
            <p className="rounded-card border border-neutral-200 bg-neutral-50/60 px-4 py-3 text-sm text-neutral-700">
              The AI writes better copy when it knows your customers. Add your personas in{' '}
              <Link href="/business-builder" className="font-semibold text-brand-rail-deep hover:underline">Business Builder</Link>.
            </p>
          )}

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

            {platforms.length > 0 && (
              <div className="space-y-2">
                <label htmlFor="copy-platform" className={LABEL}>Platform (sets the length limit)</label>
                <select id="copy-platform" className={INPUT} value={platform} onChange={(e) => setPlatform(e.target.value as PlatformKey | '')}>
                  <option value="">No platform, no limit</option>
                  {platforms.map((p) => <option key={p.key} value={p.key}>{p.label} ({p.limit} characters)</option>)}
                </select>
                {chosenPlatform && (
                  <p className="text-xs text-neutral-500">
                    {chosenPlatform.kind === 'hard'
                      ? `${chosenPlatform.label} rejects anything over ${chosenPlatform.limit} characters.`
                      : `Longer than ${chosenPlatform.limit} characters works on ${chosenPlatform.label}, but it can be cut off or perform worse.`}
                  </p>
                )}
              </div>
            )}

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
                      tone === t.value ? 'bg-brand-rail-deep text-white shadow-card' : 'bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-50'
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
              <button type="button" onClick={onGenerate} disabled={busy || !keyMessage.trim()} className={BTN_ACCENT}>
                {gen.busy ? 'Generating...' : 'Generate copy'}
              </button>
              <GenerationNote phase={gen.phase} error={gen.error} generatingLabel="The AI is writing your variants. This usually takes under a minute." />
            </div>
          </div>

          <GenerationNote phase={refine.phase} error={refine.error} generatingLabel="The AI is refining that variant. This usually takes under a minute." />

          {shown && (
            <div className="space-y-4 animate-fadeIn pt-2">
              {refinement && (
                <p className="text-sm text-neutral-700 flex flex-wrap items-center gap-3">
                  <span>Refined: &ldquo;{refinement.instruction}&rdquo;</span>
                  <button type="button" onClick={() => void backToOriginal()} className="text-xs font-semibold text-brand-rail-deep hover:underline cursor-pointer">
                    Back to the original set
                  </button>
                </p>
              )}
              <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                {variants.length === 0
                  ? 'The AI returned no variants. Try again.'
                  : `${variants.length} ${variants.length === 1 ? 'variant' : 'variants'}. Ship two and let your audience pick the winner.`}
              </p>

              {variants.map((text, idx) => (
                <div key={`${shown.id}-${idx}`} className={`${CARD} p-6 space-y-4`}>
                  <p className="text-neutral-900 text-sm md:text-base leading-relaxed whitespace-pre-wrap">{text}</p>
                  <CharCounter
                    count={shown.output.lengths?.[idx] ?? charCount(text)}
                    limit={shown.output.limit}
                    kind={shownPlatform?.kind}
                    platformLabel={shownPlatform?.label}
                  />
                  {isOverLimit(shown.output, idx) && (
                    <p className="text-xs text-danger-700">
                      This variant is over the limit. Refine it with &ldquo;Make it shorter&rdquo;, or edit it after you use it.
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <button type="button" disabled={useBusy !== null} onClick={() => void openAsDraft(idx, text)} className={BTN_PRIMARY}>
                      {useBusy === idx ? 'Opening...' : 'Use'}
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      aria-expanded={refineIdx === idx}
                      onClick={() => {
                        setRefineIdx(refineIdx === idx ? null : idx);
                        setInstruction('');
                      }}
                      className={BTN_SECONDARY}
                    >
                      Refine
                    </button>
                    <button type="button" onClick={() => void copyVariant(text)} className={BTN_SECONDARY}>Copy</button>
                    <button
                      type="button"
                      onClick={() => (savingIdx === idx ? setSavingIdx(null) : openSave(idx, text))}
                      className="text-brand-rail-deep hover:underline font-semibold text-xs cursor-pointer ml-auto"
                    >
                      Save to calendar
                    </button>
                  </div>

                  {refineIdx === idx && (
                    <form
                      className="rounded-card border border-neutral-200 bg-neutral-50/60 p-4 space-y-3"
                      onSubmit={(e) => {
                        e.preventDefault();
                        void onRefine(idx);
                      }}
                    >
                      <label htmlFor={`refine-${idx}`} className={LABEL}>How should it change?</label>
                      <input
                        id={`refine-${idx}`}
                        className={INPUT}
                        maxLength={500}
                        value={instruction}
                        placeholder="e.g. Make it shorter, or add a question"
                        onChange={(e) => setInstruction(e.target.value)}
                      />
                      <button type="submit" disabled={busy || !instruction.trim()} className={BTN_ACCENT}>
                        {refine.busy ? 'Refining...' : 'Refine this variant'}
                      </button>
                    </form>
                  )}

                  {savingIdx === idx && (
                    <div className="rounded-card border border-neutral-200 bg-neutral-50/60 p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
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
        </div>
      )}

      {tab === 'history' && (
        <section id="copy-panel-history" role="tabpanel" aria-labelledby="copy-tab-history" aria-label="History" className={`${CARD} p-6 space-y-3`}>
          <h2 className="font-display font-semibold text-lg text-neutral-900">Everything you have generated</h2>
          {history.status === 'loading' && <p className="text-sm text-neutral-500">Loading your history...</p>}
          {history.status === 'error' && <p role="alert" className="text-sm text-danger-700">{history.error}</p>}
          {history.status === 'ready' && history.history.length === 0 && (
            <p className="text-sm text-neutral-600">Nothing generated yet. Write your first variants on the Generate tab.</p>
          )}
          <ul className="divide-y divide-neutral-100">
            {history.history.slice(0, historyShown).map((h) => {
              const r = refineOf(h);
              const plat = platformOf(h.output.platform ?? (h.inputs.platform as string | undefined));
              const camp = campaigns.find((c) => c.id === (h.campaign_id ?? h.inputs.campaign_id));
              return (
                <li key={h.id} className="py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="min-w-0 space-y-0.5">
                    <p className="text-sm font-medium text-neutral-900 truncate">{String(h.inputs.key_message ?? '')}</p>
                    <p className="text-xs text-neutral-500">
                      {r ? `Refinement: ${r.instruction} · ` : ''}
                      {h.status === 'failed' ? 'Failed' : h.status === 'generating' ? 'Still generating' : `${h.output.variants?.length ?? 0} variants`}
                      {plat ? ` · ${plat.label}` : ''}
                      {camp ? ` · ${camp.name}` : ''}
                      {' · '}
                      {new Date(h.created_at).toLocaleString()}
                    </p>
                  </div>
                  {h.status === 'ready' && (
                    <button
                      type="button"
                      onClick={() => {
                        setViewing(h);
                        setSavingIdx(null);
                        setRefineIdx(null);
                        setTab('generate');
                      }}
                      className={BTN_SECONDARY}
                    >
                      View
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
          {history.history.length > historyShown && (
            <button type="button" onClick={() => setHistoryShown((n) => n + HISTORY_PAGE)} className={BTN_SECONDARY}>
              Show more
            </button>
          )}
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
