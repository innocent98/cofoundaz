'use client';

import React, { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';

// A pricing record is one strategy: a model_type plus a list of tiers, each with
// its own name / price / feature list. That nesting is why pricing gets its own
// form instead of the generic descriptor-driven RecordFormModal.
export interface PricingTierForm {
  name: string;
  price: string;
  features: string; // one feature per line
}

interface PricingFormModalProps {
  title: string;
  modelOptions: string[];
  initial?: Record<string, unknown>;
  submitting?: boolean;
  error?: string | null;
  onSubmit: (data: Record<string, unknown>) => void;
  onClose: () => void;
}

interface RawTier {
  name?: unknown;
  price?: unknown;
  features?: unknown;
}

function seedTiers(initial?: Record<string, unknown>): PricingTierForm[] {
  const raw = Array.isArray(initial?.tiers) ? (initial!.tiers as RawTier[]) : [];
  if (raw.length === 0) return [{ name: '', price: '', features: '' }];
  return raw.map((t) => ({
    name: typeof t.name === 'string' ? t.name : '',
    price: typeof t.price === 'string' ? t.price : '',
    features: Array.isArray(t.features) ? (t.features as string[]).join('\n') : '',
  }));
}

const inputClass =
  'w-full border border-[#D5DDD6] rounded-input px-3 py-2 text-sm focus:outline-none focus:border-[#4D6D58] focus:ring-1 focus:ring-[#4D6D58] placeholder:text-[#A3B899]';

export function PricingFormModal({
  title,
  modelOptions,
  initial,
  submitting,
  error,
  onSubmit,
  onClose,
}: PricingFormModalProps) {
  const [modelType, setModelType] = useState<string>(
    typeof initial?.model_type === 'string' ? (initial.model_type as string) : ''
  );
  const [tiers, setTiers] = useState<PricingTierForm[]>(() => seedTiers(initial));

  const setTier = (i: number, patch: Partial<PricingTierForm>) =>
    setTiers((prev) => prev.map((t, idx) => (idx === i ? { ...t, ...patch } : t)));
  const addTier = () => setTiers((prev) => [...prev, { name: '', price: '', features: '' }]);
  const removeTier = (i: number) => setTiers((prev) => prev.filter((_, idx) => idx !== i));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTiers = tiers
      .filter((t) => t.name.trim() !== '')
      .map((t) => ({
        name: t.name.trim(),
        price: t.price.trim(),
        features: t.features.split('\n').map((s) => s.trim()).filter(Boolean),
      }));
    onSubmit({ model_type: modelType, tiers: cleanTiers });
  };

  return (
    <div className="fixed inset-0 bg-[#061A12]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-modal w-full max-w-lg shadow-raised overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-[#E8E8E2] flex items-center justify-between bg-[#FBFBFA] shrink-0">
          <h3 className="font-bold text-[#1E2923]">{title}</h3>
          <button type="button" onClick={onClose} className="text-[#8E9B90] hover:text-[#1E2923] transition-colors p-1 rounded-input hover:bg-[#E8E8E2]" aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#55625A] uppercase tracking-wider">
              Pricing model<span className="text-[#A34B4B]"> *</span>
            </label>
            <select required value={modelType} onChange={(e) => setModelType(e.target.value)} className={inputClass}>
              <option value="" disabled>Select…</option>
              {modelOptions.map((opt) => (
                <option key={opt} value={opt}>{opt.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#55625A] uppercase tracking-wider">Tiers</span>
              <button type="button" onClick={addTier} className="flex items-center gap-1 text-xs font-semibold text-[#183B28] hover:text-[#12261C]">
                <Plus className="w-3.5 h-3.5" /> Add tier
              </button>
            </div>

            {tiers.map((tier, i) => (
              <div key={i} className="rounded-card border border-[#E8E8E2] p-3 space-y-2 bg-[#FBFBFA]">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={tier.name}
                    onChange={(e) => setTier(i, { name: e.target.value })}
                    placeholder="Tier name (e.g. Pro)"
                    className={inputClass}
                  />
                  <input
                    type="text"
                    value={tier.price}
                    onChange={(e) => setTier(i, { price: e.target.value })}
                    placeholder="Price (e.g. ₦500/mo)"
                    className={inputClass}
                  />
                  <button
                    type="button"
                    onClick={() => removeTier(i)}
                    disabled={tiers.length === 1}
                    className="p-2 rounded-input text-[#768478] hover:text-[#A34B4B] hover:bg-[#FBEBEB] disabled:opacity-40 transition-colors shrink-0"
                    aria-label="Remove tier"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <textarea
                  value={tier.features}
                  onChange={(e) => setTier(i, { features: e.target.value })}
                  placeholder="What's included — one per line"
                  rows={2}
                  className={`${inputClass} resize-y`}
                />
              </div>
            ))}
            <p className="text-[10px] text-[#8E9B90]">Tiers without a name are dropped. Features: one per line.</p>
          </div>

          {error && (
            <p className="text-xs text-[#A34B4B] bg-[#FBEBEB] border border-[#F0D5D5] rounded-input px-3 py-2">{error}</p>
          )}

          <div className="pt-1 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 bg-white border border-[#DCDCD6] hover:bg-[#F5F5F0] text-[#1E2923] rounded-card text-sm font-bold transition-colors">Cancel</button>
            <button type="submit" disabled={submitting} className="flex-1 px-4 py-2 bg-[#183B28] hover:bg-[#12261C] disabled:opacity-60 text-white rounded-card text-sm font-bold transition-colors">{submitting ? 'Saving…' : 'Save'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
