'use client';

import React, { useState } from 'react';
import { useSegmentAttributes, useSegments } from '@/hooks/useMarketingApi';
import { useBusinessRecords } from '@/hooks/useBusinessRecords';
import {
  CHANNEL_KEYS,
  CHANNEL_LABELS,
  SEGMENT_TEXT_LABELS,
  definitionChips,
  fieldErrorsOf,
  legacyDefinitionKeys,
  listSegmentCampaigns,
  marketingErrorMessage,
  type Campaign,
  type ChannelKey,
  type Segment,
} from '@/lib/api/marketing';
import { BTN_ACCENT, BTN_DANGER, BTN_PRIMARY, BTN_SECONDARY, CARD, DataGate, EmptyState, INPUT } from '@/components/marketing-hub/states';
import { Drawer, Field } from '@/components/marketing-hub/drawer';
import { useToast } from '../ToastContext';

const TEXT_ATTRS = ['location', 'business_type', 'company_size', 'income_band'] as const;
type TextAttr = (typeof TEXT_ATTRS)[number];

const TEXT_PLACEHOLDER: Record<TextAttr, string> = {
  location: 'e.g. Lagos',
  business_type: 'e.g. Retail shop',
  company_size: 'e.g. 1 to 10 people',
  income_band: 'e.g. Middle income',
};

interface Form {
  id: string | null;
  name: string;
  estSize: string;
  personaId: string;
  text: Record<TextAttr, string>;
  channel: ChannelKey | '';
  tags: string[];
  /** Old definition keys the rule builder no longer stores; dropped on save. */
  legacy: string[];
}

const blank = (): Form => ({
  id: null,
  name: '',
  estSize: '',
  personaId: '',
  text: { location: '', business_type: '', company_size: '', income_band: '' },
  channel: '',
  tags: [],
  legacy: [],
});

function str(v: unknown): string {
  return typeof v === 'string' ? v : '';
}

function fromSegment(s: Segment): Form {
  const d = s.definition ?? {};
  return {
    id: s.id,
    name: s.name,
    estSize: s.est_size === null ? '' : String(s.est_size),
    personaId: s.persona_id ?? '',
    text: {
      location: str(d.location),
      business_type: str(d.business_type),
      company_size: str(d.company_size),
      income_band: str(d.income_band),
    },
    channel: (CHANNEL_KEYS as readonly string[]).includes(str(d.channel_acquired)) ? (d.channel_acquired as ChannelKey) : '',
    tags: Array.isArray(d.behaviour_tags) ? d.behaviour_tags.filter((t): t is string => typeof t === 'string') : [],
    legacy: legacyDefinitionKeys(d),
  };
}

/** Only the attributes the server accepts, and only the ones that have a value. */
function definitionFrom(f: Form): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const k of TEXT_ATTRS) if (f.text[k].trim()) out[k] = f.text[k].trim();
  if (f.channel) out.channel_acquired = f.channel;
  if (f.tags.length) out.behaviour_tags = f.tags;
  return out;
}

function Chips({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return (
    <ul aria-label="Segment definition" className="flex flex-wrap gap-1.5">
      {items.map((c, i) => (
        <li key={`${c}-${i}`} className="rounded-full bg-sage-100 px-2.5 py-1 text-xs font-medium text-sage-800">
          {c}
        </li>
      ))}
    </ul>
  );
}

function RuleBuilder({
  form,
  setForm,
  maxTags,
  maxTagLength,
  errors,
}: {
  form: Form;
  setForm: (f: Form) => void;
  maxTags: number;
  maxTagLength: number;
  errors: Record<string, string>;
}) {
  const [tagDraft, setTagDraft] = useState('');
  const addTag = () => {
    const t = tagDraft.trim().slice(0, maxTagLength);
    if (!t || form.tags.some((x) => x.toLowerCase() === t.toLowerCase()) || form.tags.length >= maxTags) {
      setTagDraft('');
      return;
    }
    setForm({ ...form, tags: [...form.tags, t] });
    setTagDraft('');
  };
  const atLimit = form.tags.length >= maxTags;
  return (
    <fieldset className="space-y-4 rounded-card border border-sage-200 p-4">
      <legend className="px-1 text-xs font-semibold text-sage-700 uppercase tracking-wider">Who is in this segment</legend>
      <p className="text-xs text-sage-500">
        Describe the audience with any of these. They show as tags on the segment and give the AI context. They do not count users.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {TEXT_ATTRS.map((k) => (
          <Field key={k} label={SEGMENT_TEXT_LABELS[k]} htmlFor={`seg-${k}`}>
            <input
              id={`seg-${k}`}
              className={INPUT}
              maxLength={100}
              value={form.text[k]}
              placeholder={TEXT_PLACEHOLDER[k]}
              onChange={(e) => setForm({ ...form, text: { ...form.text, [k]: e.target.value } })}
            />
          </Field>
        ))}
      </div>
      <Field label="Found us through" htmlFor="seg-channel">
        <select id="seg-channel" className={INPUT} value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value as ChannelKey | '' })}>
          <option value="">Any channel</option>
          {CHANNEL_KEYS.map((k) => <option key={k} value={k}>{CHANNEL_LABELS[k]}</option>)}
        </select>
      </Field>
      <Field
        label="Behaviour tags"
        htmlFor="seg-tag"
        error={errors.definition}
        hint={`Up to ${maxTags} tags, ${maxTagLength} characters each. Press Enter to add one.`}
      >
        <div className="flex gap-2">
          <input
            id="seg-tag"
            className={INPUT}
            maxLength={maxTagLength}
            value={tagDraft}
            disabled={atLimit}
            placeholder={atLimit ? 'Tag limit reached' : 'e.g. mobile first'}
            onChange={(e) => setTagDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addTag();
              }
            }}
          />
          <button type="button" onClick={addTag} disabled={atLimit || !tagDraft.trim()} className={BTN_SECONDARY}>Add</button>
        </div>
      </Field>
      {form.tags.length > 0 && (
        <ul aria-label="Behaviour tags" className="flex flex-wrap gap-1.5">
          {form.tags.map((t) => (
            <li key={t} className="inline-flex items-center gap-1 rounded-full bg-sage-100 pl-2.5 pr-1 py-1 text-xs font-medium text-sage-800">
              {t}
              <button
                type="button"
                aria-label={`Remove tag ${t}`}
                onClick={() => setForm({ ...form, tags: form.tags.filter((x) => x !== t) })}
                className="flex h-5 w-5 items-center justify-center rounded-full hover:bg-sage-200 cursor-pointer"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
      {form.legacy.length > 0 && (
        <p className="text-xs text-sage-600 rounded-card bg-sage-50 border border-sage-200 p-3">
          This segment has older fields ({form.legacy.join(', ')}) that the rule builder no longer keeps. They are removed when you save.
        </p>
      )}
    </fieldset>
  );
}

export default function MarketingSegmentsPage() {
  const { segments, status, error, reload, create, update, remove } = useSegments();
  const { attributes } = useSegmentAttributes();
  const personas = useBusinessRecords('personas');
  const { triggerToast, runAction } = useToast();

  const [form, setForm] = useState<Form | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [usedBy, setUsedBy] = useState<Record<string, Campaign[]>>({});
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const personaLabel = (id: string | null): string => {
    if (!id) return 'None linked';
    const rec = personas.records.find((r) => r.id === id);
    return rec ? String(rec.data.name ?? rec.data.title ?? 'Persona') : 'Linked persona';
  };

  const open = (s?: Segment) => {
    setErrors({});
    setForm(s ? fromSegment(s) : blank());
  };

  const save = async () => {
    if (!form) return;
    if (!form.name.trim()) {
      setErrors({ name: 'Give the segment a name.' });
      return;
    }
    const est = form.estSize.trim() === '' ? null : Number(form.estSize);
    if (est !== null && (!Number.isInteger(est) || est < 0)) {
      setErrors({ est_size: 'Enter a whole number, zero or more.' });
      return;
    }
    const body = {
      name: form.name.trim(),
      est_size: est,
      persona_id: form.personaId || null,
      definition: definitionFrom(form),
    };
    setSaving(true);
    setErrors({});
    try {
      if (form.id) await update(form.id, body);
      else await create(body);
      triggerToast(form.id ? 'Segment updated.' : 'Segment created.');
      setForm(null);
    } catch (err) {
      setErrors(fieldErrorsOf(err));
      triggerToast(marketingErrorMessage(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  const showUsage = async (s: Segment) => {
    const res = await runAction(() => listSegmentCampaigns(s.id));
    if (res.ok) setUsedBy((cur) => ({ ...cur, [s.id]: res.value }));
  };

  const askDelete = async (s: Segment) => {
    // The API happily deletes a segment still used by campaigns (the link is dropped),
    // so surface that before the founder confirms.
    const res = await runAction(() => listSegmentCampaigns(s.id));
    if (res.ok) setUsedBy((cur) => ({ ...cur, [s.id]: res.value }));
    setConfirmId(s.id);
  };

  const doDelete = async (s: Segment) => {
    const res = await runAction(() => remove(s.id), `Deleted "${s.name}".`);
    if (res.ok) setConfirmId(null);
  };

  return (
    <div className="space-y-6 animate-fadeIn relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-3xl md:text-4xl font-display font-semibold text-sage-900 tracking-tight">Audience segments</h1>
        <button type="button" onClick={() => open()} className={`${BTN_ACCENT} self-start md:self-auto`}>
          + New segment
        </button>
      </div>

      <DataGate status={status} error={error} onRetry={reload} loadingLabel="Loading your segments">
        {segments.length === 0 ? (
          <EmptyState
            title="No audience segments yet"
            body="Segments describe who a campaign is for. Describe the audience with a few tags and link it to a persona from your Business Builder."
            cta={<button type="button" onClick={() => open()} className={BTN_ACCENT}>+ Create your first segment</button>}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {segments.map((seg) => {
              const campaigns = usedBy[seg.id];
              return (
                <div key={seg.id} className={`${CARD} p-6 flex flex-col justify-between space-y-5 hover:border-sage-300 transition-all`}>
                  <div className="space-y-3">
                    <h3 className="font-display font-semibold text-lg text-sage-900">{seg.name}</h3>
                    <Chips items={definitionChips(seg.definition)} />
                    <p className="text-xs text-sage-500 font-medium">
                      Estimated size{' '}
                      <span className="text-sage-900 font-semibold">
                        {seg.est_size === null ? 'not set' : `~${seg.est_size.toLocaleString()}`}
                      </span>{' '}
                      (your estimate) · Persona <span className="text-sage-900 font-semibold">{personaLabel(seg.persona_id)}</span>
                    </p>
                    {campaigns && (
                      <p className="text-xs text-sage-600">
                        {campaigns.length === 0
                          ? 'Not used in any campaign.'
                          : `Used in ${campaigns.length} ${campaigns.length === 1 ? 'campaign' : 'campaigns'}: ${campaigns.map((c) => c.name).join(', ')}`}
                      </p>
                    )}
                  </div>

                  {confirmId === seg.id ? (
                    <div className="space-y-2">
                      <p className="text-xs text-sage-700">
                        {(usedBy[seg.id]?.length ?? 0) > 0
                          ? `This segment is used by ${usedBy[seg.id].length} campaign(s). Deleting it removes it from them.`
                          : 'Delete this segment permanently?'}
                      </p>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => void doDelete(seg)} className={BTN_DANGER}>Confirm delete</button>
                        <button type="button" onClick={() => setConfirmId(null)} className={BTN_SECONDARY}>Keep</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => open(seg)} className={BTN_SECONDARY}>Edit</button>
                      <button type="button" onClick={() => void showUsage(seg)} className={BTN_SECONDARY}>Used in</button>
                      <button type="button" onClick={() => void askDelete(seg)} className={BTN_DANGER}>Delete</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </DataGate>

      {form && (
        <Drawer
          title={form.id ? 'Edit segment' : 'New segment'}
          onClose={() => setForm(null)}
          footer={
            <>
              <button type="button" onClick={() => setForm(null)} className={`${BTN_SECONDARY} flex-1`}>Cancel</button>
              <button type="button" onClick={save} disabled={saving} className={`${BTN_PRIMARY} flex-1`}>
                {saving ? 'Saving...' : 'Save segment'}
              </button>
            </>
          }
        >
          <Field label="Segment name" htmlFor="seg-name" error={errors.name}>
            <input id="seg-name" className={INPUT} maxLength={200} value={form.name} placeholder="e.g. Small business founders"
              onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <RuleBuilder
            form={form}
            setForm={setForm}
            maxTags={attributes?.behaviour_tags.max_tags ?? 10}
            maxTagLength={attributes?.behaviour_tags.max_length ?? 40}
            errors={errors}
          />
          <Field label="Estimated size" htmlFor="seg-size" error={errors.est_size} hint="Your own estimate. It is not calculated from user data.">
            <input id="seg-size" type="number" min={0} className={INPUT} value={form.estSize}
              onChange={(e) => setForm({ ...form, estSize: e.target.value })} />
          </Field>
          <Field label="Linked persona" htmlFor="seg-persona" error={errors.persona_id}>
            <select id="seg-persona" className={INPUT} value={form.personaId}
              onChange={(e) => setForm({ ...form, personaId: e.target.value })}>
              <option value="">None</option>
              {personas.records.map((r) => (
                <option key={r.id} value={r.id}>{String(r.data.name ?? r.data.title ?? 'Persona')}</option>
              ))}
            </select>
          </Field>
        </Drawer>
      )}
    </div>
  );
}
