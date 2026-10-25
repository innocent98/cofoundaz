'use client';

import React, { useState } from 'react';
import { Plus, Pencil, Trash2, Users } from 'lucide-react';
import { useToast } from '../layout';
import { useBusinessRecords, errMessage, writeMessage, recordFormFailure } from '@/hooks/useBusinessRecords';
import { RecordFormModal, FormField } from '@/components/business-builder/record-form-modal';
import { AiDraftButton } from '@/components/business-builder/ai-draft-button';
import { BusinessRecord } from '@/lib/api/business-builder';
import { ArtifactHeader } from '@/components/business-builder/artifact-header';
import { ExportButton } from '@/components/business-builder/export-button';
import { PersonasFromValidation } from '@/components/business-builder/personas-from-validation';
import { RecordEdited } from '@/components/business-builder/record-edited';
import { useRecordThreads } from '@/hooks/useRecordThreads';
import { latestEdit } from '@/lib/bb-records';

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
  const { records, loading, error, access, create, update, remove, refetch } = useBusinessRecords(KIND);
  const { canWrite, suggestMode } = access;
  const threads = useRecordThreads(records.map((r) => r.id));
  const edit = latestEdit(records);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<BusinessRecord | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const openCreate = () => {
    setEditing(null);
    setFormError(null); setFieldErrors({});
    setModalOpen(true);
  };
  const openEdit = (rec: BusinessRecord) => {
    setEditing(rec);
    setFormError(null); setFieldErrors({});
    setModalOpen(true);
  };

  const handleSubmit = async (data: Record<string, unknown>) => {
    setSubmitting(true);
    setFormError(null); setFieldErrors({});
    try {
      if (editing) {
        triggerToast(writeMessage(await update(editing.id, data), 'Persona updated'));
      } else {
        triggerToast(writeMessage(await create(data), 'Persona added'));
      }
      setModalOpen(false);
    } catch (err) {
      { const f = recordFormFailure(err, 'Could not save persona'); setFormError(f.message); setFieldErrors(f.fields); }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (rec: BusinessRecord) => {
    const name = (rec.data.name as string) || 'this persona';
    if (!window.confirm(suggestMode ? `Suggest deleting ${name}?` : `Delete ${name}? This cannot be undone.`)) return;
    try {
      triggerToast(writeMessage(await remove(rec.id), 'Persona deleted'));
    } catch (err) {
      triggerToast(errMessage(err) || 'Could not delete persona');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <ArtifactHeader
        title="Customer personas"
        updatedAt={edit.updatedAt}
        updatedBy={edit.updatedBy}
        actions={
          <>
            <AiDraftButton kind={KIND} label="Draft with AI" onFilled={refetch} />
            <PersonasFromValidation onDone={refetch} />
            <ExportButton target={{ kind: KIND }} />
            {canWrite && (
              <button
                onClick={openCreate}
                className="flex items-center gap-1.5 bg-brand-strong hover:bg-brand-rail-ink text-white font-bold px-4 py-2.5 rounded-card text-xs transition-colors shadow-card"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{suggestMode ? 'Suggest a persona' : 'Add persona'}</span>
              </button>
            )}
          </>
        }
      />

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="bg-white rounded-modal p-6 border border-line-soft shadow-card h-64 animate-pulse" />
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="bg-danger-wash border border-danger-xf0d5d5 rounded-modal p-4 text-sm text-danger-text">
          {error}
        </div>
      )}

      {!loading && !error && records.length === 0 && (
        <div className="bg-white rounded-modal border border-line-soft shadow-card p-12 text-center flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-neutral-xf0f4f1 text-brand-strong flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <p className="text-sm font-bold text-ink">No personas yet</p>
          <p className="text-xs text-ink-soft max-w-xs">
            Capture who you&apos;re building for, their goals, frustrations, and where to reach them.
          </p>
          {canWrite && (
            <button
              onClick={openCreate}
              className="mt-1 flex items-center gap-1.5 bg-brand-strong hover:bg-brand-rail-ink text-white font-bold px-4 py-2 rounded-card text-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{suggestMode ? 'Suggest the first persona' : 'Add your first persona'}</span>
            </button>
          )}
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
                className="bg-white rounded-modal p-6 border border-line-soft shadow-card flex flex-col justify-between gap-6 group"
              >
                <div className="flex flex-col gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-full bg-brand-strong text-accent-200 font-bold text-base flex items-center justify-center shrink-0">
                      {initials(name)}
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                      <h3 className="text-sm font-bold text-ink truncate">{name}</h3>
                      {typeof d.demographics === 'string' && d.demographics && (
                        <p className="text-[11px] text-ink-soft">{d.demographics}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {threads.button(rec.id, name)}
                      {canWrite && (<>
                      <button
                        onClick={() => openEdit(rec)}
                        className="p-1.5 rounded-input text-ink-soft hover:text-brand-strong hover:bg-neutral-xf0f4f1 transition-colors"
                        aria-label={`Edit persona: ${name}`}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(rec)}
                        className="p-1.5 rounded-input text-ink-soft hover:text-danger-text hover:bg-danger-wash transition-colors"
                        aria-label={`Delete persona: ${name}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      </>)}
                    </div>
                  </div>

                  {typeof d.quote === 'string' && d.quote && (
                    <p className="text-xs text-ink-body italic leading-relaxed">&ldquo;{d.quote}&rdquo;</p>
                  )}

                  {goals.length > 0 && (
                    <div className="flex flex-col gap-1 pt-1">
                      <span className="text-[10px] font-bold tracking-wider text-accent-700 uppercase">Goals</span>
                      <ul className="text-xs text-ink leading-normal list-disc list-inside space-y-0.5">
                        {goals.map((g, i) => <li key={i}>{g}</li>)}
                      </ul>
                    </div>
                  )}

                  {frustrations.length > 0 && (
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold tracking-wider text-danger-text uppercase">Frustrations</span>
                      <ul className="text-xs text-ink leading-normal list-disc list-inside space-y-0.5">
                        {frustrations.map((f, i) => <li key={i}>{f}</li>)}
                      </ul>
                    </div>
                  )}

                  {wateringHoles.length > 0 && (
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold tracking-wider text-ink-body uppercase">Where to reach them</span>
                      <p className="text-xs text-ink-body leading-normal">{wateringHoles.join(' · ')}</p>
                    </div>
                  )}
                </div>
                <RecordEdited record={rec} />
              </div>
            );
          })}
        </div>
      )}

      {threads.drawer}

      {modalOpen && (
        <RecordFormModal
          title={editing ? 'Edit persona' : suggestMode ? 'Suggest a persona' : 'Add persona'}
          suggestMode={suggestMode}
          fields={FIELDS}
          initial={editing?.data}
          submitting={submitting}
          error={formError}
          fieldErrors={fieldErrors}
          onSubmit={handleSubmit}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
}
