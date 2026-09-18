'use client';

import React, { useState } from 'react';
import { Plus, Pencil, Trash2, TrendingUp } from 'lucide-react';
import { useToast } from '../layout';
import { useBusinessRecords, errMessage } from '@/hooks/useBusinessRecords';
import { RecordFormModal, FormField } from '@/components/business-builder/record-form-modal';
import { BusinessRecord } from '@/lib/api/business-builder';

const KIND = 'revenue-streams';

const FIELDS: FormField[] = [
  { key: 'name', label: 'Stream', type: 'text', required: true, half: true },
  { key: 'est_monthly', label: 'Est. monthly (₦)', type: 'number', half: true, placeholder: '0' },
  { key: 'pricing_basis', label: 'Basis', type: 'text', placeholder: 'e.g. ₦500/mo flat fee' },
  { key: 'assumptions', label: 'Assumptions', type: 'textarea' },
];

function fmtMoney(n: unknown): string {
  const v = typeof n === 'number' ? n : Number(n);
  if (!Number.isFinite(v)) return '₦0';
  return `₦${v.toLocaleString('en-NG', { maximumFractionDigits: 0 })}`;
}

export default function RevenueModelPage() {
  const { triggerToast } = useToast();
  const { records, loading, error, create, update, remove } = useBusinessRecords(KIND);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<BusinessRecord | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const openCreate = () => { setEditing(null); setFormError(null); setModalOpen(true); };
  const openEdit = (rec: BusinessRecord) => { setEditing(rec); setFormError(null); setModalOpen(true); };

  const handleSubmit = async (data: Record<string, unknown>) => {
    setSubmitting(true); setFormError(null);
    try {
      if (editing) { await update(editing.id, data); triggerToast('Revenue stream updated'); }
      else { await create(data); triggerToast('Revenue stream added'); }
      setModalOpen(false);
    } catch (err) {
      setFormError(errMessage(err) || 'Could not save revenue stream');
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (rec: BusinessRecord) => {
    const name = (rec.data.name as string) || 'this stream';
    if (!window.confirm(`Delete ${name}? This cannot be undone.`)) return;
    try { await remove(rec.id); triggerToast('Revenue stream deleted'); }
    catch (err) { triggerToast(errMessage(err) || 'Could not delete revenue stream'); }
  };

  const totalMonthly = records.reduce((sum, r) => {
    const v = Number(r.data.est_monthly);
    return sum + (Number.isFinite(v) ? v : 0);
  }, 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-3xl font-display font-bold text-[#1E2923] tracking-tight">Revenue model</h2>
        <button
          onClick={openCreate}
          className="bg-[#183B28] hover:bg-[#12261C] text-white font-bold px-4 py-2.5 rounded-card text-xs transition-colors flex items-center gap-1.5 shadow-card"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add stream</span>
        </button>
      </div>

      {loading && (
        <div className="bg-white rounded-modal border border-[#EBEBE6] shadow-card h-56 animate-pulse" />
      )}

      {!loading && error && (
        <div className="bg-[#FBEBEB] border border-[#F0D5D5] rounded-modal p-4 text-sm text-[#A34B4B]">{error}</div>
      )}

      {!loading && !error && records.length === 0 && (
        <div className="bg-white rounded-modal border border-[#EBEBE6] shadow-card p-12 text-center flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-[#F0F4F1] text-[#183B28] flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
          <p className="text-sm font-bold text-[#1E2923]">No revenue streams yet</p>
          <p className="text-xs text-[#768478] max-w-xs">Map out how the business makes money — each stream, its basis, and an estimate.</p>
          <button onClick={openCreate} className="mt-1 flex items-center gap-1.5 bg-[#183B28] hover:bg-[#12261C] text-white font-bold px-4 py-2 rounded-card text-xs transition-colors">
            <Plus className="w-3.5 h-3.5" /><span>Add your first stream</span>
          </button>
        </div>
      )}

      {!loading && records.length > 0 && (
        <div className="bg-white rounded-modal border border-[#EBEBE6] shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[560px]">
              <thead>
                <tr className="bg-[#FAFAFA] border-b border-[#EBEBE6]">
                  <th className="py-3.5 px-6 text-[11px] font-bold tracking-wider text-[#768478] uppercase">Stream</th>
                  <th className="py-3.5 px-6 text-[11px] font-bold tracking-wider text-[#768478] uppercase">Basis</th>
                  <th className="py-3.5 px-6 text-[11px] font-bold tracking-wider text-[#768478] uppercase">Est. monthly</th>
                  <th className="py-3.5 px-6 text-[11px] font-bold tracking-wider text-[#768478] uppercase text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F0EC]">
                {records.map((rec) => (
                  <tr key={rec.id} className="hover:bg-[#FAF9F5] transition-colors group">
                    <td className="py-4 px-6 text-xs md:text-sm font-bold text-[#1E2923]">{(rec.data.name as string) || '—'}</td>
                    <td className="py-4 px-6 text-xs md:text-sm text-[#556358]">{(rec.data.pricing_basis as string) || '—'}</td>
                    <td className="py-4 px-6 text-xs md:text-sm font-bold text-[#183B28]">{fmtMoney(rec.data.est_monthly)}</td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEdit(rec)} className="p-1.5 rounded-input text-[#768478] hover:text-[#183B28] hover:bg-[#F0F4F1] transition-colors" aria-label="Edit stream">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(rec)} className="p-1.5 rounded-input text-[#768478] hover:text-[#A34B4B] hover:bg-[#FBEBEB] transition-colors" aria-label="Delete stream">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-[#EBEBE6] bg-[#FAFAFA]">
                  <td className="py-3 px-6 text-xs font-bold text-[#768478] uppercase tracking-wider" colSpan={2}>Total est. monthly</td>
                  <td className="py-3 px-6 text-sm font-bold text-[#183B28]">{fmtMoney(totalMonthly)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {modalOpen && (
        <RecordFormModal
          title={editing ? 'Edit revenue stream' : 'Add revenue stream'}
          fields={FIELDS}
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
