'use client';

import React, { useState } from 'react';
import { Plus, Pencil, Trash2, Tag } from 'lucide-react';
import { useToast } from '../layout';
import { useBusinessRecords, errMessage } from '@/hooks/useBusinessRecords';
import { PricingFormModal } from '@/components/business-builder/pricing-form-modal';
import { BusinessRecord } from '@/lib/api/business-builder';

const KIND = 'pricing';
const FALLBACK_MODELS = ['subscription', 'one_time', 'usage', 'freemium', 'tiered'];

interface Tier {
  name?: string;
  price?: string;
  features?: string[];
}

function tiersOf(rec: BusinessRecord): Tier[] {
  return Array.isArray(rec.data.tiers) ? (rec.data.tiers as Tier[]) : [];
}

export default function PricingPage() {
  const { triggerToast } = useToast();
  const { records, fields, loading, error, create, update, remove } = useBusinessRecords(KIND);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<BusinessRecord | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const modelOptions =
    fields.find((f) => f.key === 'model_type')?.choices ?? FALLBACK_MODELS;

  const openCreate = () => { setEditing(null); setFormError(null); setModalOpen(true); };
  const openEdit = (rec: BusinessRecord) => { setEditing(rec); setFormError(null); setModalOpen(true); };

  const handleSubmit = async (data: Record<string, unknown>) => {
    setSubmitting(true); setFormError(null);
    try {
      if (editing) { await update(editing.id, data); triggerToast('Pricing updated'); }
      else { await create(data); triggerToast('Pricing added'); }
      setModalOpen(false);
    } catch (err) {
      setFormError(errMessage(err) || 'Could not save pricing');
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (rec: BusinessRecord) => {
    const label = (rec.data.model_type as string) || 'this pricing';
    if (!window.confirm(`Delete the ${String(label).replace(/_/g, ' ')} pricing model? This cannot be undone.`)) return;
    try { await remove(rec.id); triggerToast('Pricing deleted'); }
    catch (err) { triggerToast(errMessage(err) || 'Could not delete pricing'); }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-3xl font-display font-bold text-[#1E2923] tracking-tight">Pricing strategy</h2>
        <button
          onClick={openCreate}
          className="bg-[#183B28] hover:bg-[#12261C] text-white font-bold px-4 py-2.5 rounded-card text-xs transition-colors flex items-center gap-1.5 shadow-card"
        >
          <Plus className="w-3.5 h-3.5" /><span>Add pricing model</span>
        </button>
      </div>

      {loading && <div className="bg-white rounded-modal border border-[#EBEBE6] shadow-card h-56 animate-pulse" />}

      {!loading && error && (
        <div className="bg-[#FBEBEB] border border-[#F0D5D5] rounded-modal p-4 text-sm text-[#A34B4B]">{error}</div>
      )}

      {!loading && !error && records.length === 0 && (
        <div className="bg-white rounded-modal border border-[#EBEBE6] shadow-card p-12 text-center flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-[#F0F4F1] text-[#183B28] flex items-center justify-center">
            <Tag className="w-6 h-6" />
          </div>
          <p className="text-sm font-bold text-[#1E2923]">No pricing model yet</p>
          <p className="text-xs text-[#768478] max-w-xs">Choose a model and lay out your tiers — what each costs and what&apos;s included.</p>
          <button onClick={openCreate} className="mt-1 flex items-center gap-1.5 bg-[#183B28] hover:bg-[#12261C] text-white font-bold px-4 py-2 rounded-card text-xs transition-colors">
            <Plus className="w-3.5 h-3.5" /><span>Add your pricing model</span>
          </button>
        </div>
      )}

      {!loading && records.length > 0 && (
        <div className="flex flex-col gap-6">
          {records.map((rec) => {
            const tiers = tiersOf(rec);
            return (
              <div key={rec.id} className="bg-white rounded-modal border border-[#EBEBE6] shadow-card overflow-hidden group">
                <div className="px-6 py-4 border-b border-[#EBEBE6] bg-[#FAFAFA] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="bg-[#183B28] text-white px-3 py-1 rounded-full text-xs font-semibold capitalize">
                      {String(rec.data.model_type || '—').replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs text-[#768478]">{tiers.length} tier{tiers.length === 1 ? '' : 's'}</span>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(rec)} className="p-1.5 rounded-input text-[#768478] hover:text-[#183B28] hover:bg-[#F0F4F1] transition-colors" aria-label="Edit pricing">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(rec)} className="p-1.5 rounded-input text-[#768478] hover:text-[#A34B4B] hover:bg-[#FBEBEB] transition-colors" aria-label="Delete pricing">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {tiers.length === 0 ? (
                  <p className="px-6 py-6 text-xs text-[#768478]">No tiers yet — edit to add them.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[500px]">
                      <thead>
                        <tr className="border-b border-[#EBEBE6]">
                          <th className="py-3 px-6 text-[11px] font-bold tracking-wider text-[#768478] uppercase w-1/4">Tier</th>
                          <th className="py-3 px-6 text-[11px] font-bold tracking-wider text-[#768478] uppercase w-1/4">Price</th>
                          <th className="py-3 px-6 text-[11px] font-bold tracking-wider text-[#768478] uppercase w-2/4">What&apos;s included</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F0F0EC]">
                        {tiers.map((tier, i) => (
                          <tr key={i} className="hover:bg-[#FAF9F5] transition-colors">
                            <td className="py-4 px-6 text-xs md:text-sm font-bold text-[#1E2923]">{tier.name || '—'}</td>
                            <td className="py-4 px-6 text-xs md:text-sm font-bold text-[#183B28]">{tier.price || '—'}</td>
                            <td className="py-4 px-6 text-xs md:text-sm text-[#556358]">
                              {Array.isArray(tier.features) && tier.features.length > 0 ? tier.features.join(', ') : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {modalOpen && (
        <PricingFormModal
          title={editing ? 'Edit pricing model' : 'Add pricing model'}
          modelOptions={modelOptions}
          initial={editing?.data}
          submitting={submitting}
          error={formError}
          onSubmit={handleSubmit}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
}
