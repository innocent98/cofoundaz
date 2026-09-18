'use client';

import React, { useState } from 'react';
import { Plus, Pencil, Trash2, Users } from 'lucide-react';
import { useToast } from '../layout';
import { useBusinessRecords, errMessage } from '@/hooks/useBusinessRecords';
import { RecordFormModal, FormField } from '@/components/business-builder/record-form-modal';
import { BusinessRecord } from '@/lib/api/business-builder';

const KIND = 'personas';

const FIELDS: FormField[] = [
  { key: 'name', label: 'Name', type: 'text', required: true, half: true },
  { key: 'demographics', label: 'Demographics', type: 'text', half: true, placeholder: 'Age 28 · Lagos · daily cash income' },
  { key: 'quote', label: 'Quote', type: 'textarea', placeholder: 'In their own words…' },
  { key: 'goals', label: 'Goals', type: 'list' },
  { key: 'frustrations', label: 'Frustrations', type: 'list' },
  { key: 'watering_holes', label: 'Where to reach them', type: 'list' },
];

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function asList(v: unknown): string[] {
  return Array.isArray(v) ? (v as string[]) : [];
}

export default function PersonasPage() {
  const { triggerToast } = useToast();
  const { records, loading, error, create, update, remove } = useBusinessRecords(KIND);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<BusinessRecord | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const openCreate = () => {
    setEditing(null);
    setFormError(null);
    setModalOpen(true);
  };
  const openEdit = (rec: BusinessRecord) => {
    setEditing(rec);
    setFormError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (data: Record<string, unknown>) => {
    setSubmitting(true);
    setFormError(null);
    try {
      if (editing) {
        await update(editing.id, data);
        triggerToast('Persona updated');
      } else {
        await create(data);
        triggerToast('Persona added');
      }
      setModalOpen(false);
    } catch (err) {
      setFormError(errMessage(err) || 'Could not save persona');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (rec: BusinessRecord) => {
    const name = (rec.data.name as string) || 'this persona';
    if (!window.confirm(`Delete ${name}? This cannot be undone.`)) return;
    try {
      await remove(rec.id);
      triggerToast('Persona deleted');
    } catch (err) {
      triggerToast(errMessage(err) || 'Could not delete persona');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-3xl font-display font-bold text-[#1E2923] tracking-tight">
          Customer personas
        </h2>

        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 bg-[#183B28] hover:bg-[#12261C] text-white font-bold px-4 py-2.5 rounded-card text-xs transition-colors self-start md:self-auto shadow-card"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add persona</span>
        </button>
      </div>

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="bg-white rounded-modal p-6 border border-[#EBEBE6] shadow-card h-64 animate-pulse" />
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="bg-[#FBEBEB] border border-[#F0D5D5] rounded-modal p-4 text-sm text-[#A34B4B]">
          {error}
        </div>
      )}

      {!loading && !error && records.length === 0 && (
        <div className="bg-white rounded-modal border border-[#EBEBE6] shadow-card p-12 text-center flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-[#F0F4F1] text-[#183B28] flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <p className="text-sm font-bold text-[#1E2923]">No personas yet</p>
          <p className="text-xs text-[#768478] max-w-xs">
            Capture who you&apos;re building for — their goals, frustrations, and where to reach them.
          </p>
          <button
            onClick={openCreate}
            className="mt-1 flex items-center gap-1.5 bg-[#183B28] hover:bg-[#12261C] text-white font-bold px-4 py-2 rounded-card text-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add your first persona</span>
          </button>
        </div>
      )}

      {!loading && records.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          {records.map((rec) => {
            const d = rec.data;
            const name = (d.name as string) || 'Unnamed';
            const goals = asList(d.goals);
            const frustrations = asList(d.frustrations);
            const wateringHoles = asList(d.watering_holes);
            return (
              <div
                key={rec.id}
                className="bg-white rounded-modal p-6 border border-[#EBEBE6] shadow-card flex flex-col justify-between gap-6 group"
              >
                <div className="flex flex-col gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-full bg-[#183B28] text-[#EAD5C6] font-bold text-base flex items-center justify-center shrink-0">
                      {initials(name)}
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                      <h3 className="text-sm font-bold text-[#1E2923] truncate">{name}</h3>
                      {typeof d.demographics === 'string' && d.demographics && (
                        <p className="text-[11px] text-[#768478]">{d.demographics}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEdit(rec)}
                        className="p-1.5 rounded-input text-[#768478] hover:text-[#183B28] hover:bg-[#F0F4F1] transition-colors"
                        aria-label="Edit persona"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(rec)}
                        className="p-1.5 rounded-input text-[#768478] hover:text-[#A34B4B] hover:bg-[#FBEBEB] transition-colors"
                        aria-label="Delete persona"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {typeof d.quote === 'string' && d.quote && (
                    <p className="text-xs text-[#556358] italic leading-relaxed">&ldquo;{d.quote}&rdquo;</p>
                  )}

                  {goals.length > 0 && (
                    <div className="flex flex-col gap-1 pt-1">
                      <span className="text-[10px] font-bold tracking-wider text-[#8A5330] uppercase">Goals</span>
                      <ul className="text-xs text-[#1E2923] leading-normal list-disc list-inside space-y-0.5">
                        {goals.map((g, i) => <li key={i}>{g}</li>)}
                      </ul>
                    </div>
                  )}

                  {frustrations.length > 0 && (
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold tracking-wider text-[#A34B4B] uppercase">Frustrations</span>
                      <ul className="text-xs text-[#1E2923] leading-normal list-disc list-inside space-y-0.5">
                        {frustrations.map((f, i) => <li key={i}>{f}</li>)}
                      </ul>
                    </div>
                  )}

                  {wateringHoles.length > 0 && (
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold tracking-wider text-[#556358] uppercase">Where to reach them</span>
                      <p className="text-xs text-[#556358] leading-normal">{wateringHoles.join(' · ')}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modalOpen && (
        <RecordFormModal
          title={editing ? 'Edit persona' : 'Add persona'}
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
