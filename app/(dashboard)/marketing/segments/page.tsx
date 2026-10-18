'use client';

import React, { useState } from 'react';
import { useSegments } from '@/hooks/useMarketingApi';
import { useBusinessRecords } from '@/hooks/useBusinessRecords';
import {
  fieldErrorsOf,
  listSegmentCampaigns,
  marketingErrorMessage,
  type Campaign,
  type Segment,
} from '@/lib/api/marketing';
import { BTN_ACCENT, BTN_DANGER, BTN_PRIMARY, BTN_SECONDARY, CARD, DataGate, EmptyState, INPUT } from '@/components/marketing-hub/states';
import { Drawer, Field } from '@/components/marketing-hub/drawer';
import { useToast } from '../ToastContext';

interface Form {
  id: string | null;
  name: string;
  estSize: string;
  personaId: string;
  description: string;
  definition: Record<string, unknown>;
}

const blank = (): Form => ({ id: null, name: '', estSize: '', personaId: '', description: '', definition: {} });

function fromSegment(s: Segment): Form {
  const desc = typeof s.definition?.description === 'string' ? (s.definition.description as string) : '';
  return {
    id: s.id,
    name: s.name,
    estSize: s.est_size === null ? '' : String(s.est_size),
    personaId: s.persona_id ?? '',
    description: desc,
    definition: s.definition ?? {},
  };
}

export default function MarketingSegmentsPage() {
  const { segments, status, error, reload, create, update, remove } = useSegments();
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
    const definition = { ...form.definition, description: form.description.trim() };
    const body = {
      name: form.name.trim(),
      est_size: est,
      persona_id: form.personaId || null,
      definition,
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
            body="Segments describe who a campaign is for. Create one and link it to a persona from your Business Builder."
            cta={<button type="button" onClick={() => open()} className={BTN_ACCENT}>+ Create your first segment</button>}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {segments.map((seg) => {
              const campaigns = usedBy[seg.id];
              const desc = typeof seg.definition?.description === 'string' ? (seg.definition.description as string) : '';
              return (
                <div key={seg.id} className={`${CARD} p-6 flex flex-col justify-between space-y-5 hover:border-sage-300 transition-all`}>
                  <div className="space-y-3">
                    <h3 className="font-display font-semibold text-lg text-sage-900">{seg.name}</h3>
                    {desc && <p className="text-sm text-sage-600">{desc}</p>}
                    <p className="text-xs text-sage-500 font-medium">
                      Est. size{' '}
                      <span className="text-sage-900 font-semibold">
                        {seg.est_size === null ? 'Not set' : `~${seg.est_size.toLocaleString()}`}
                      </span>{' '}
                      · Persona <span className="text-sage-900 font-semibold">{personaLabel(seg.persona_id)}</span>
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
          <Field label="Who are they?" htmlFor="seg-desc" error={errors.definition}>
            <textarea id="seg-desc" rows={3} className={INPUT} value={form.description}
              placeholder="A sentence on this audience, in your own words."
              onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Field>
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
          <p className="text-xs text-sage-500 rounded-card bg-sage-50 border border-sage-200 p-3">
            Rule-based segments that count real users are coming soon. Today a segment stores the audience description,
            your size estimate and its persona link.
          </p>
        </Drawer>
      )}
    </div>
  );
}
