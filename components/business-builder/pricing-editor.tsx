'use client';

import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { BusinessRecord } from '@/lib/api/business-builder';
import { PRICING_MODELS, cleanTiers, modelLabel, tiersOf } from '@/lib/bb-records';
import { RecordEdited } from '@/components/business-builder/record-edited';

interface Row {
  name: string;
  price: string;
  features: string; // one feature per line
}

const inputClass =
  'w-full border border-[#D5DDD6] rounded-input px-3 py-2 text-xs focus:outline-none focus:border-[#4D6D58] focus:ring-1 focus:ring-[#4D6D58] placeholder:text-[#6F7D72] disabled:bg-transparent disabled:border-transparent disabled:px-0';

function seed(record: BusinessRecord | null): { model: string; rows: Row[] } {
  const model = typeof record?.data.model_type === 'string' ? (record.data.model_type as string) : 'subscription';
  const rows = record ? tiersOf(record.data).map((t) => ({ name: t.name, price: t.price, features: t.features.join('\n') })) : [];
  return { model, rows: rows.length ? rows : [{ name: '', price: '', features: '' }] };
}

interface Props {
  /** null = a new, unsaved pricing model. */
  record: BusinessRecord | null;
  modelOptions: string[];
  canWrite: boolean;
  suggestMode: boolean;
  /** Extra controls in the card header (comments, delete). */
  headerExtras?: React.ReactNode;
  onSave: (data: { model_type: string; tiers: Array<{ name: string; price: string; features: string[] }> }) => Promise<void>;
  onCancel?: () => void;
}

/**
 * The pricing model selector (subscription / one-time / usage / freemium /
 * tiered) and the tier builder table. Edits are held as a draft and saved with
 * one button, which keeps tier rows from saving half-typed.
 */
export function PricingEditor({ record, modelOptions, canWrite, suggestMode, headerExtras, onSave, onCancel }: Props) {
  const initial = seed(record);
  const [model, setModel] = useState(initial.model);
  const [rows, setRows] = useState<Row[]>(initial.rows);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const options = modelOptions.length ? modelOptions : [...PRICING_MODELS];
  const dirty = !record || model !== initial.model || JSON.stringify(rows) !== JSON.stringify(initial.rows);
  const setRow = (i: number, patch: Partial<Row>) => setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      await onSave({ model_type: model, tiers: cleanTiers(rows) });
    } catch (err) {
      setError((err as { message?: string })?.message || 'Could not save pricing.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-modal border border-[#EBEBE6] shadow-card overflow-hidden">
      <div className="px-6 py-4 border-b border-[#EBEBE6] bg-[#FAFAFA] flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] font-bold tracking-wider text-[#768478] uppercase">Pricing model</p>
          <div className="flex items-center gap-1">{headerExtras}</div>
        </div>
        <div role="radiogroup" aria-label="Pricing model" className="flex flex-wrap gap-2">
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              role="radio"
              aria-checked={model === opt}
              disabled={!canWrite}
              onClick={() => setModel(opt)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors border ${
                model === opt ? 'bg-[#183B28] text-white border-[#183B28]' : 'bg-white text-[#556358] border-[#EBEBE6] hover:border-[#C5CFC7]'
              } disabled:cursor-default`}
            >
              {modelLabel(opt)}
            </button>
          ))}
        </div>
      </div>

      <div className="relative overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[560px]">
          <thead>
            <tr className="border-b border-[#EBEBE6]">
              <th className="py-3 px-6 text-[11px] font-bold tracking-wider text-[#768478] uppercase w-1/5">Tier</th>
              <th className="py-3 px-6 text-[11px] font-bold tracking-wider text-[#768478] uppercase w-[30%]">Price</th>
              <th className="py-3 px-6 text-[11px] font-bold tracking-wider text-[#768478] uppercase w-1/2">What&apos;s included</th>
              {canWrite && <th className="w-10"><span className="sr-only">Remove</span></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F0F0EC]">
            {rows.map((row, i) => (
              <tr key={i} className="align-top">
                <td className="py-3 px-6">
                  <input aria-label={`Tier ${i + 1} name`} disabled={!canWrite} value={row.name} onChange={(e) => setRow(i, { name: e.target.value })} placeholder="Pro" className={`${inputClass} font-bold`} />
                </td>
                <td className="py-3 px-6">
                  <input aria-label={`Tier ${i + 1} price`} disabled={!canWrite} value={row.price} onChange={(e) => setRow(i, { price: e.target.value })} placeholder="₦2,000/month" className={`${inputClass} font-bold`} />
                </td>
                <td className="py-3 px-6">
                  <textarea aria-label={`Tier ${i + 1} features, one per line`} disabled={!canWrite} value={row.features} onChange={(e) => setRow(i, { features: e.target.value })} rows={Math.max(2, row.features.split('\n').length)} placeholder="One feature per line" className={`${inputClass} resize-y`} />
                </td>
                {canWrite && (
                  <td className="py-3 pr-4">
                    <button type="button" onClick={() => setRows((prev) => (prev.length === 1 ? [{ name: '', price: '', features: '' }] : prev.filter((_, idx) => idx !== i)))} className="p-2 rounded-input text-[#768478] hover:text-[#A34B4B] hover:bg-[#FBEBEB] transition-colors" aria-label={`Remove tier ${i + 1}`}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-6 py-4 border-t border-[#EBEBE6] flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          {canWrite && (
            <button type="button" onClick={() => setRows((prev) => [...prev, { name: '', price: '', features: '' }])} className="flex items-center gap-1 text-xs font-semibold text-[#183B28] hover:text-[#12261C] self-start">
              <Plus className="w-3.5 h-3.5" /> Add tier
            </button>
          )}
          {record && <RecordEdited record={record} />}
        </div>
        {canWrite && (
          <div className="flex items-center gap-2">
            {error && <span role="alert" className="text-[11px] font-semibold text-[#B0483B]">{error}</span>}
            {(onCancel || (record && dirty)) && (
              <button type="button" onClick={() => { if (record) { setModel(initial.model); setRows(initial.rows); } onCancel?.(); }} className="px-4 py-2 bg-white border border-[#DCDCD6] hover:bg-[#F5F5F0] rounded-card text-xs font-bold">
                {record ? 'Discard' : 'Cancel'}
              </button>
            )}
            <button type="button" onClick={save} disabled={saving || !dirty} className="px-4 py-2 bg-[#183B28] hover:bg-[#12261C] disabled:opacity-50 text-white rounded-card text-xs font-bold">
              {saving ? 'Saving' : suggestMode ? 'Suggest this' : 'Save pricing'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
