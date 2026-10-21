'use client';

import React, { useCallback, useState } from 'react';
import Link from 'next/link';
import { useCampaigns, useResource, useSegments } from '@/hooks/useMarketingApi';
import { useMarketingGeneration } from '@/hooks/useMarketingGeneration';
import {
  CHANNEL_KEYS,
  CHANNEL_LABELS,
  OBJECTIVE_LABELS,
  channelsStartedByLaunch,
  formatMoney,
  listChannels,
  formatPeriod,
  getChannelPlan,
  listCalendarEntries,
  marketingErrorMessage,
  fieldErrorsOf,
  startChannelPlan,
  summariseMix,
  updateCalendarEntry,
  type Campaign,
  type CampaignObjective,
  type CampaignStatus,
  type ChannelKey,
  type ChannelMix,
  type ChannelPlanInput,
} from '@/lib/api/marketing';
import {
  BTN_ACCENT,
  BTN_PRIMARY,
  BTN_SECONDARY,
  CARD,
  DataGate,
  EmptyState,
  GenerationNote,
  INPUT,
  LABEL,
} from '@/components/marketing-hub/states';
import { Drawer } from '@/components/marketing-hub/drawer';
import { CampaignActions } from '@/components/marketing-hub/campaign-actions';
import { ChannelLabel } from '@/components/marketing-hub/channel-icon';
import { useToast } from '../ToastContext';

const OBJECTIVES: { value: CampaignObjective; label: string }[] = [
  { value: 'awareness', label: 'Awareness' },
  { value: 'leads', label: 'Leads' },
  { value: 'sales', label: 'Sales' },
  { value: 'launch', label: 'Launch' },
];

const STATUS_STYLE: Record<CampaignStatus, string> = {
  draft: 'bg-sage-100 text-sage-700',
  active: 'bg-green-100 text-green-800',
  paused: 'bg-copper-100 text-copper-800',
  completed: 'bg-sage-200 text-sage-700',
};

interface Form {
  name: string;
  objective: CampaignObjective;
  budgetMajor: string;
  mix: Record<ChannelKey, number>;
  segmentIds: string[];
  /** Existing posts to link once the campaign is created (wizard only). */
  postIds: string[];
  start: string;
  end: string;
}

const EMPTY_MIX = Object.fromEntries(CHANNEL_KEYS.map((k) => [k, 0])) as Record<ChannelKey, number>;

const blankForm = (): Form => ({
  name: '',
  objective: 'awareness',
  budgetMajor: '',
  mix: { ...EMPTY_MIX },
  segmentIds: [],
  postIds: [],
  start: '',
  end: '',
});

/** "CTR 5.0% / Conv 10.0%", or a plain "No data yet" when nothing was recorded for the campaign. */
function rates(c: Campaign): string {
  const m = c.metrics;
  if (!m || (!m.impressions && !m.clicks && !m.conversions)) return 'No data yet';
  return `${(m.click_through_rate ?? 0).toFixed(1)}% / ${(m.conversion_rate ?? 0).toFixed(1)}%`;
}

function formFromCampaign(c: Campaign): Form {
  return {
    name: c.name,
    objective: c.objective,
    budgetMajor: c.budget ? String(c.budget / 100) : '',
    mix: { ...EMPTY_MIX, ...(c.channel_mix as Record<ChannelKey, number>) },
    segmentIds: c.segment_ids,
    postIds: [],
    start: c.period_start ?? '',
    end: c.period_end ?? '',
  };
}

const toCents = (major: string): number => Math.max(0, Math.round((parseFloat(major) || 0) * 100));

function mixPayload(mix: Record<ChannelKey, number>): ChannelMix {
  const out: ChannelMix = {};
  for (const k of CHANNEL_KEYS) if (mix[k] > 0) out[k] = mix[k];
  return out;
}

function bodyFromForm(f: Form) {
  return {
    name: f.name.trim(),
    objective: f.objective,
    budget: toCents(f.budgetMajor),
    channel_mix: mixPayload(f.mix),
    segment_ids: f.segmentIds,
    period_start: f.start || null,
    period_end: f.end || null,
  };
}

// ------------------------------------------------------------------ form sections

function ObjectiveSection({ form, setForm, errors }: { form: Form; setForm: (f: Form) => void; errors: Record<string, string> }) {
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="camp-name" className={LABEL}>Campaign name</label>
        <input
          id="camp-name"
          type="text"
          value={form.name}
          maxLength={200}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className={INPUT}
          placeholder="e.g. Q4 launch push"
        />
        {errors.name && <p role="alert" className="text-xs text-red-700">{errors.name}</p>}
      </div>
      <div className="space-y-1.5">
        <label htmlFor="camp-objective" className={LABEL}>Objective</label>
        <select
          id="camp-objective"
          value={form.objective}
          onChange={(e) => setForm({ ...form, objective: e.target.value as CampaignObjective })}
          className={INPUT}
        >
          {OBJECTIVES.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label htmlFor="camp-start" className={LABEL}>Starts</label>
          <input id="camp-start" type="date" value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} className={INPUT} />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="camp-end" className={LABEL}>Ends</label>
          <input id="camp-end" type="date" value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} className={INPUT} />
        </div>
      </div>
    </div>
  );
}

function AudienceSection({
  form,
  setForm,
  segments,
  loading,
}: {
  form: Form;
  setForm: (f: Form) => void;
  segments: { id: string; name: string; est_size: number | null }[];
  loading: boolean;
}) {
  if (loading) return <p className="text-sm text-sage-500">Loading your segments...</p>;
  if (segments.length === 0) {
    return (
      <div className="rounded-card border border-sage-200 bg-sage-50/60 p-4 space-y-2">
        <p className="text-sm text-sage-700">You have no audience segments yet. You can still create the campaign without one.</p>
        <Link href="/marketing/segments" className="text-sm font-semibold text-[#0e271f] hover:underline">
          Create a segment
        </Link>
      </div>
    );
  }
  return (
    <fieldset className="space-y-2">
      <legend className={LABEL}>Target segments</legend>
      {segments.map((s) => {
        const checked = form.segmentIds.includes(s.id);
        return (
          <label key={s.id} className="flex items-center gap-3 text-sm text-sage-800 cursor-pointer">
            <input
              type="checkbox"
              checked={checked}
              onChange={() =>
                setForm({
                  ...form,
                  segmentIds: checked ? form.segmentIds.filter((x) => x !== s.id) : [...form.segmentIds, s.id],
                })
              }
            />
            <span className="font-medium">{s.name}</span>
            {s.est_size !== null && <span className="text-xs text-sage-500">~{s.est_size.toLocaleString()}</span>}
          </label>
        );
      })}
    </fieldset>
  );
}

function ChannelsSection({
  form,
  setForm,
  errors,
}: {
  form: Form;
  setForm: (f: Form) => void;
  errors: Record<string, string>;
}) {
  const { triggerToast } = useToast();
  const plan = useMarketingGeneration<ChannelPlanInput, Awaited<ReturnType<typeof getChannelPlan>>>(
    startChannelPlan,
    getChannelPlan
  );
  const budgetCents = toCents(form.budgetMajor);
  const total = CHANNEL_KEYS.reduce((n, k) => n + form.mix[k], 0);
  const proposal = plan.phase === 'ready' ? plan.generation : null;

  const recommend = () => plan.run({ objective: form.objective, budget: budgetCents > 0 ? budgetCents : null });

  const apply = () => {
    const proposed = proposal?.output.channel_mix ?? {};
    setForm({ ...form, mix: { ...EMPTY_MIX, ...(proposed as Record<ChannelKey, number>) } });
    plan.reset();
    triggerToast('Applied the AI channel split. You can still adjust it.');
  };

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <label htmlFor="camp-budget" className={LABEL}>Budget (₦)</label>
        <input
          id="camp-budget"
          type="number"
          min={0}
          step="any"
          value={form.budgetMajor}
          onChange={(e) => setForm({ ...form, budgetMajor: e.target.value })}
          className={INPUT}
          placeholder="0"
        />
        {errors.budget && <p role="alert" className="text-xs text-red-700">{errors.budget}</p>}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className={LABEL}>Channel split</p>
        <button type="button" onClick={recommend} disabled={plan.busy} className={BTN_SECONDARY}>
          {plan.busy ? 'Thinking...' : '✦ Recommend a split'}
        </button>
      </div>

      <GenerationNote phase={plan.phase} error={plan.error} generatingLabel="The AI is weighing channels for this objective..." />

      {proposal && (
        <div className="rounded-card border border-[#d2e2d8] bg-[#e2ede6] p-4 space-y-3">
          <p className="text-sm font-semibold text-[#0e271f]">
            For {OBJECTIVE_LABELS[form.objective].toLowerCase()} at your stage, I&apos;d put{' '}
            {summariseMix(proposal.output.channel_mix ?? {}).replace('No channel split set', 'no split yet')}. Here&apos;s why.
          </p>
          {proposal.output.rationale && <p className="text-sm text-[#0e271f]">{proposal.output.rationale}</p>}
          <div className="flex gap-2">
            <button type="button" onClick={apply} className={BTN_PRIMARY}>Apply this split</button>
            <button type="button" onClick={plan.reset} className={BTN_SECONDARY}>Dismiss</button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {CHANNEL_KEYS.map((k) => (
          <div key={k} className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1">
            <label htmlFor={`mix-${k}`} className="text-sm font-medium text-sage-800">{CHANNEL_LABELS[k]}</label>
            <span className="text-xs text-sage-600 tabular-nums">
              {form.mix[k]}%{budgetCents > 0 && form.mix[k] > 0 ? ` · ${formatMoney(Math.round((budgetCents * form.mix[k]) / 100))}` : ''}
            </span>
            <input
              id={`mix-${k}`}
              type="range"
              min={0}
              max={100}
              value={form.mix[k]}
              onChange={(e) => setForm({ ...form, mix: { ...form.mix, [k]: Number(e.target.value) } })}
              className="col-span-2 w-full accent-[#9C5B34]"
            />
          </div>
        ))}
        {errors.channel_mix && <p role="alert" className="text-xs text-red-700">{errors.channel_mix}</p>}
        <p className="text-xs text-sage-500">
          Split totals {total}%. It does not have to add up to 100; spend per channel is budget times its percentage.
        </p>
      </div>
    </div>
  );
}

function ContentSection({ form, setForm }: { form: Form; setForm: (f: Form) => void }) {
  // Posts not yet in a campaign and not yet published. Loaded only when this step is open.
  const posts = useResource(useCallback(() => listCalendarEntries(), []));
  const free = (posts.data ?? []).filter((e) => !e.campaign_id && e.status !== 'published');
  return (
    <div className="space-y-4">
      <p className="text-sm text-sage-600">
        Attach posts you already planned. After you save, the campaign page has a button that writes new copy for it with the AI.
      </p>
      {posts.status === 'loading' && <p className="text-sm text-sage-500">Loading your posts...</p>}
      {posts.status === 'error' && <p role="alert" className="text-sm text-red-700">{posts.error}</p>}
      {posts.status === 'ready' && free.length === 0 && (
        <div className="rounded-card border border-sage-200 bg-sage-50/60 p-4 space-y-2">
          <p className="text-sm text-sage-700">No unlinked posts to attach. You can still create the campaign and add content later.</p>
          <Link href="/marketing/calendar" className="text-sm font-semibold text-[#0e271f] hover:underline">Open the calendar</Link>
        </div>
      )}
      {free.length > 0 && (
        <fieldset className="space-y-2">
          <legend className={LABEL}>Posts to attach</legend>
          {free.map((e) => {
            const checked = form.postIds.includes(e.id);
            return (
              <label key={e.id} className="flex items-center gap-3 text-sm text-sage-800 cursor-pointer min-h-8">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() =>
                    setForm({ ...form, postIds: checked ? form.postIds.filter((x) => x !== e.id) : [...form.postIds, e.id] })
                  }
                />
                <span className="font-medium truncate">{e.title}</span>
                <span className="text-xs text-sage-500 shrink-0"><ChannelLabel channel={e.channel} /></span>
              </label>
            );
          })}
        </fieldset>
      )}
    </div>
  );
}

// ------------------------------------------------------------------ page

export default function MarketingCampaignsPage() {
  const { campaigns, status, error, reload, create, update } = useCampaigns();
  const segs = useSegments();
  const { triggerToast } = useToast();

  const [wizardOpen, setWizardOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<Form>(blankForm);
  const [editing, setEditing] = useState<Campaign | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const segmentName = (id: string) => segs.segments.find((s) => s.id === id)?.name ?? 'Unknown segment';

  const openWizard = () => {
    setForm(blankForm());
    setStep(1);
    setErrors({});
    setWizardOpen(true);
  };
  const closeWizard = () => setWizardOpen(false);

  const submit = async (launch: boolean) => {
    if (!form.name.trim()) {
      setErrors({ name: 'Give the campaign a name.' });
      setStep(1);
      return;
    }
    setBusy(true);
    setErrors({});
    try {
      const created = await create(bodyFromForm(form));
      let unlinked = 0;
      for (const postId of form.postIds) {
        try {
          await updateCalendarEntry(postId, { campaign_id: created.id });
        } catch {
          unlinked += 1;
        }
      }
      if (launch) {
        const before = await listChannels().catch(() => null);
        await update(created.id, { status: 'active' });
        const after = before ? await listChannels().catch(() => null) : null;
        const notes = before && after ? channelsStartedByLaunch(before, after) : [];
        triggerToast([`Campaign "${created.name}" launched.`, ...notes].join(' '));
      } else {
        triggerToast(`Campaign "${created.name}" saved as a draft.`);
      }
      if (unlinked > 0) triggerToast(`Saved, but ${unlinked} ${unlinked === 1 ? 'post' : 'posts'} could not be linked. Link them from the post.`, 'error');
      closeWizard();
    } catch (err) {
      const fe = fieldErrorsOf(err);
      setErrors(fe);
      if (fe.name) setStep(1);
      else if (fe.segment_ids) setStep(2);
      else if (fe.channel_mix || fe.budget) setStep(3);
      triggerToast(marketingErrorMessage(err), 'error');
      reload(); // a created-but-not-launched campaign must still show up
    } finally {
      setBusy(false);
    }
  };

  const saveEdit = async () => {
    if (!editing) return;
    if (!form.name.trim()) {
      setErrors({ name: 'Give the campaign a name.' });
      return;
    }
    setBusy(true);
    setErrors({});
    try {
      await update(editing.id, bodyFromForm(form));
      triggerToast('Campaign updated.');
      setEditing(null);
    } catch (err) {
      setErrors(fieldErrorsOf(err));
      triggerToast(marketingErrorMessage(err), 'error');
    } finally {
      setBusy(false);
    }
  };

  const startEdit = (c: Campaign) => {
    setForm(formFromCampaign(c));
    setErrors({});
    setEditing(c);
  };

  const stepTitles = ['Objective', 'Audience', 'Channels and budget', 'Content', 'Review'];

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-3xl md:text-4xl font-display font-semibold text-sage-900 tracking-tight">Campaigns</h1>
        {!wizardOpen && (
          <button type="button" onClick={openWizard} className={`${BTN_ACCENT} self-start md:self-auto`}>
            + New campaign
          </button>
        )}
      </div>

      {wizardOpen ? (
        <div className={`${CARD} p-6 md:p-8 space-y-6`}>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-display font-semibold text-sage-900">Campaign wizard</h2>
            <button type="button" onClick={closeWizard} className="text-sage-500 hover:text-sage-900 text-sm font-semibold">Cancel</button>
          </div>
          <div className="flex gap-2" aria-hidden="true">
            {stepTitles.map((_, i) => (
              <div key={i} className={`h-1.5 flex-1 rounded-full ${i + 1 <= step ? 'bg-[#9C5B34]' : 'bg-sage-200'}`} />
            ))}
          </div>
          <h3 className="font-semibold text-sage-900">Step {step} of {stepTitles.length}: {stepTitles[step - 1]}</h3>

          {step === 1 && <ObjectiveSection form={form} setForm={setForm} errors={errors} />}
          {step === 2 && (
            <AudienceSection form={form} setForm={setForm} segments={segs.segments} loading={segs.status === 'loading'} />
          )}
          {step === 3 && <ChannelsSection form={form} setForm={setForm} errors={errors} />}
          {step === 4 && <ContentSection form={form} setForm={setForm} />}
          {step === 5 && (
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div><dt className={LABEL}>Name</dt><dd className="text-sage-900 font-medium">{form.name || 'Not set'}</dd></div>
              <div><dt className={LABEL}>Objective</dt><dd className="text-sage-900 font-medium capitalize">{form.objective}</dd></div>
              <div><dt className={LABEL}>Budget</dt><dd className="text-sage-900 font-medium">{formatMoney(toCents(form.budgetMajor))}</dd></div>
              <div><dt className={LABEL}>Period</dt><dd className="text-sage-900 font-medium">{form.start || form.end ? `${form.start || '?'} to ${form.end || '?'}` : 'Not set'}</dd></div>
              <div className="md:col-span-2"><dt className={LABEL}>Channel split</dt><dd className="text-sage-900 font-medium">{summariseMix(mixPayload(form.mix))}</dd></div>
              <div className="md:col-span-2">
                <dt className={LABEL}>Segments</dt>
                <dd className="text-sage-900 font-medium">{form.segmentIds.length ? form.segmentIds.map(segmentName).join(', ') : 'None'}</dd>
              </div>
              <div className="md:col-span-2">
                <dt className={LABEL}>Posts to attach</dt>
                <dd className="text-sage-900 font-medium">{form.postIds.length ? `${form.postIds.length} selected` : 'None'}</dd>
              </div>
            </dl>
          )}

          <div className="flex flex-wrap gap-3">
            {step > 1 && <button type="button" onClick={() => setStep(step - 1)} className={BTN_SECONDARY}>Back</button>}
            {step < 5 && (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                disabled={step === 1 && !form.name.trim()}
                className={BTN_PRIMARY}
              >
                Next step
              </button>
            )}
            {step === 5 && (
              <>
                <button type="button" onClick={() => void submit(false)} disabled={busy} className={BTN_SECONDARY}>
                  {busy ? 'Saving...' : 'Save as draft'}
                </button>
                <button type="button" onClick={() => void submit(true)} disabled={busy} className={BTN_ACCENT}>
                  {busy ? 'Launching...' : '✦ Create and launch'}
                </button>
              </>
            )}
          </div>
        </div>
      ) : (
        <DataGate status={status} error={error} onRetry={reload} loadingLabel="Loading your campaigns">
          {campaigns.length === 0 ? (
            <EmptyState
              title="No campaigns yet"
              body="A campaign ties an objective, a budget and a channel split together. Create your first one and launch it when you are ready."
              cta={<button type="button" onClick={openWizard} className={BTN_ACCENT}>+ Create your first campaign</button>}
            />
          ) : (
            <>
              <div className={`${CARD} overflow-hidden hidden md:block`}>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-sage-200 bg-sage-50/50 text-[11px] font-bold text-sage-600 uppercase tracking-wider">
                        <th scope="col" className="py-3.5 px-4">Campaign</th>
                        <th scope="col" className="py-3.5 px-4">Objective</th>
                        <th scope="col" className="py-3.5 px-4">Budget</th>
                        <th scope="col" className="py-3.5 px-4">Period</th>
                        <th scope="col" className="py-3.5 px-4">CTR / Conv</th>
                        <th scope="col" className="py-3.5 px-4">Channels</th>
                        <th scope="col" className="py-3.5 px-4">Status</th>
                        <th scope="col" className="py-3.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-sage-100 text-sm">
                      {campaigns.map((c) => (
                        <tr key={c.id} className="hover:bg-sage-50/50 transition-colors align-top">
                          <td className="py-4 px-4">
                            <Link href={`/marketing/campaigns/${c.id}`} className="font-semibold text-sage-900 hover:underline">
                              {c.name}
                            </Link>
                            {c.segment_ids.length > 0 && (
                              <p className="text-xs text-sage-500">{c.segment_ids.map(segmentName).join(', ')}</p>
                            )}
                          </td>
                          <td className="py-4 px-4 text-sage-600">{OBJECTIVE_LABELS[c.objective]}</td>
                          <td className="py-4 px-4 text-sage-900 font-medium">{formatMoney(c.budget)}</td>
                          <td className="py-4 px-4 text-xs text-sage-600">{formatPeriod(c.period_start, c.period_end)}</td>
                          <td className="py-4 px-4 text-sage-900 font-medium tabular-nums">{rates(c)}</td>
                          <td className="py-4 px-4 text-xs text-sage-600 max-w-[14rem]">{summariseMix(c.channel_mix)}</td>
                          <td className="py-4 px-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${STATUS_STYLE[c.status]}`}>
                              {c.status}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex justify-end">
                              <CampaignActions campaign={c} onChanged={reload} onEdit={() => startEdit(c)} />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <ul aria-label="Campaigns" className="space-y-3 md:hidden">
                {campaigns.map((c) => (
                  <li key={c.id} className={`${CARD} p-4 space-y-3`}>
                    <div className="flex items-start justify-between gap-3">
                      <Link href={`/marketing/campaigns/${c.id}`} className="font-semibold text-sage-900 hover:underline break-words min-w-0">
                        {c.name}
                      </Link>
                      <span className={`shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${STATUS_STYLE[c.status]}`}>
                        {c.status}
                      </span>
                    </div>
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                      <div><dt className="text-sage-600 font-bold uppercase tracking-wider">Objective</dt><dd className="text-sage-800 font-medium">{OBJECTIVE_LABELS[c.objective]}</dd></div>
                      <div><dt className="text-sage-600 font-bold uppercase tracking-wider">Budget</dt><dd className="text-sage-800 font-medium">{formatMoney(c.budget)}</dd></div>
                      <div><dt className="text-sage-600 font-bold uppercase tracking-wider">CTR / Conv</dt><dd className="text-sage-800 font-medium tabular-nums">{rates(c)}</dd></div>
                      <div><dt className="text-sage-600 font-bold uppercase tracking-wider">Period</dt><dd className="text-sage-800 font-medium">{formatPeriod(c.period_start, c.period_end)}</dd></div>
                      <div className="col-span-2"><dt className="text-sage-600 font-bold uppercase tracking-wider">Channels</dt><dd className="text-sage-800 font-medium">{summariseMix(c.channel_mix)}</dd></div>
                    </dl>
                    <CampaignActions campaign={c} onChanged={reload} onEdit={() => startEdit(c)} />
                  </li>
                ))}
              </ul>
            </>
          )}
        </DataGate>
      )}

      {editing && (
        <Drawer
          title={`Edit ${editing.name}`}
          onClose={() => setEditing(null)}
          footer={
            <button type="button" onClick={saveEdit} disabled={busy} className={`${BTN_PRIMARY} flex-1`}>
              {busy ? 'Saving...' : 'Save changes'}
            </button>
          }
        >
          <ObjectiveSection form={form} setForm={setForm} errors={errors} />
          <AudienceSection form={form} setForm={setForm} segments={segs.segments} loading={segs.status === 'loading'} />
          <ChannelsSection form={form} setForm={setForm} errors={errors} />
        </Drawer>
      )}
    </div>
  );
}
