'use client';

import React, { useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, Swords, SlidersHorizontal } from 'lucide-react';
import { useToast } from '../layout';
import { useBusinessRecords, errMessage, writeMessage } from '@/hooks/useBusinessRecords';
import { useBusinessPositioningMap, PositioningAxes } from '@/hooks/useBusinessPositioningMap';
import { RecordFormModal, FormField } from '@/components/business-builder/record-form-modal';
import { AxesEditModal } from '@/components/business-builder/axes-edit-modal';
import { AiDraftButton } from '@/components/business-builder/ai-draft-button';
import { BusinessRecord, RecordField } from '@/lib/api/business-builder';
import { ArtifactHeader } from '@/components/business-builder/artifact-header';
import { ExportButton } from '@/components/business-builder/export-button';
import { PositioningMap } from '@/components/business-builder/positioning-map';
import { RecordEdited } from '@/components/business-builder/record-edited';
import { useRecordThreads } from '@/hooks/useRecordThreads';
import { latestEdit } from '@/lib/bb-records';
import type { Point } from '@/lib/map-geometry';

const KIND = 'competitors';

// Enum options come from the server-served field descriptor so they can't drift
// from the backend's ThreatLevel; fall back to the known set if absent.
function threatOptions(fields: RecordField[]): string[] {
  return fields.find((f) => f.key === 'threat_level')?.choices ?? ['low', 'medium', 'high'];
}

// map_x/map_y labels track the real positioning-map axes, so the founder knows
// which corner each coordinate maps to.
function buildFields(fields: RecordField[], axes: PositioningAxes): FormField[] {
  return [
    { key: 'name', label: 'Competitor', type: 'text', required: true, half: true },
    { key: 'threat_level', label: 'Threat level', type: 'select', options: threatOptions(fields), half: true },
    { key: 'positioning', label: 'Positioning', type: 'text', placeholder: 'How they position themselves' },
    { key: 'price', label: 'Price', type: 'text', half: true, placeholder: 'e.g. Free / ₦1,000/mo' },
    { key: 'strengths', label: 'Strengths', type: 'list' },
    { key: 'weaknesses', label: 'Weaknesses', type: 'list' },
    { key: 'map_x', label: `Map X · ${axes.x.label} (${axes.x.low}→${axes.x.high}, 0-1)`, type: 'number', half: true, placeholder: '0.0 - 1.0' },
    { key: 'map_y', label: `Map Y · ${axes.y.label} (${axes.y.low}→${axes.y.high}, 0-1)`, type: 'number', half: true, placeholder: '0.0 - 1.0' },
  ];
}

function threatBadge(threat: unknown): string {
  switch (String(threat)) {
    case 'high': return 'bg-[#FBEBEB] text-[#B83E3E]';
    case 'medium': return 'bg-[#F7EFE0] text-[#9C5B34]';
    case 'low': return 'bg-[#EBF5F0] text-[#2E7A56]';
    default: return 'bg-[#F0F0EC] text-[#768478]';
  }
}

export default function CompetitiveAnalysisPage() {
  const { triggerToast } = useToast();
  const { records, fields, loading, error, access, create, update, remove, refetch } = useBusinessRecords(KIND);
  const { canWrite, suggestMode } = access;
  const threads = useRecordThreads(records.map((r) => r.id));
  const edit = latestEdit(records);
  const { axes, saveAxes } = useBusinessPositioningMap();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<BusinessRecord | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [axesOpen, setAxesOpen] = useState(false);
  const [axesSaving, setAxesSaving] = useState(false);

  const formFields = useMemo(() => buildFields(fields, axes), [fields, axes]);

  const handleSaveAxes = async (next: PositioningAxes) => {
    setAxesSaving(true);
    try {
      await saveAxes(next);
      triggerToast('Axes updated');
      setAxesOpen(false);
    } catch (err) {
      triggerToast(errMessage(err) || 'Could not update axes');
    } finally {
      setAxesSaving(false);
    }
  };

  const openCreate = () => { setEditing(null); setFormError(null); setModalOpen(true); };
  const openEdit = (rec: BusinessRecord) => { setEditing(rec); setFormError(null); setModalOpen(true); };

  const handleSubmit = async (data: Record<string, unknown>) => {
    setSubmitting(true); setFormError(null);
    // Empty map fields → omit so the API keeps them null rather than 0.
    if (data.map_x === 0 || data.map_x === '') delete data.map_x;
    if (data.map_y === 0 || data.map_y === '') delete data.map_y;
    try {
      if (editing) triggerToast(writeMessage(await update(editing.id, data), 'Competitor updated'));
      else triggerToast(writeMessage(await create(data), 'Competitor added'));
      setModalOpen(false);
    } catch (err) {
      setFormError(errMessage(err) || 'Could not save competitor');
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (rec: BusinessRecord) => {
    const name = (rec.data.name as string) || 'this competitor';
    if (!window.confirm(suggestMode ? `Suggest deleting ${name}?` : `Delete ${name}? This cannot be undone.`)) return;
    try { triggerToast(writeMessage(await remove(rec.id), 'Competitor deleted')); }
    catch (err) { triggerToast(errMessage(err) || 'Could not delete competitor'); }
  };

  // PUT is a full replace, so a move sends the whole record with the new coordinates.
  const moveDot = async (rec: BusinessRecord, point: Point) => {
    const outcome = await update(rec.id, { ...rec.data, map_x: point.x, map_y: point.y });
    if (outcome === 'suggested') triggerToast(writeMessage(outcome, ''));
  };

  return (
    <div className="flex flex-col gap-6">
      <ArtifactHeader
        title="Competitive analysis"
        updatedAt={edit.updatedAt}
        updatedBy={edit.updatedBy}
        actions={
          <>
            <AiDraftButton kind={KIND} label="Draft with AI" onFilled={refetch} />
            <ExportButton target={{ kind: KIND }} />
            {canWrite && (
              <button
                onClick={openCreate}
                className="bg-[#183B28] hover:bg-[#12261C] text-white font-bold px-4 py-2.5 rounded-card text-xs transition-colors flex items-center gap-1.5 shadow-card"
              >
                <Plus className="w-3.5 h-3.5" /><span>{suggestMode ? 'Suggest a competitor' : 'Add competitor'}</span>
              </button>
            )}
          </>
        }
      />

      {loading && <div className="bg-white rounded-modal border border-[#EBEBE6] shadow-card h-64 animate-pulse" />}

      {!loading && error && (
        <div className="bg-[#FBEBEB] border border-[#F0D5D5] rounded-modal p-4 text-sm text-[#A34B4B]">{error}</div>
      )}

      {!loading && !error && records.length === 0 && (
        <div className="bg-white rounded-modal border border-[#EBEBE6] shadow-card p-12 text-center flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-[#F0F4F1] text-[#183B28] flex items-center justify-center">
            <Swords className="w-6 h-6" />
          </div>
          <p className="text-sm font-bold text-[#1E2923]">No competitors yet</p>
          <p className="text-xs text-[#768478] max-w-xs">Track who else solves this problem, how they position, and where they sit on cost vs trust.</p>
          {canWrite && (
            <button onClick={openCreate} className="mt-1 flex items-center gap-1.5 bg-[#183B28] hover:bg-[#12261C] text-white font-bold px-4 py-2 rounded-card text-xs transition-colors">
              <Plus className="w-3.5 h-3.5" /><span>{suggestMode ? 'Suggest the first competitor' : 'Add your first competitor'}</span>
            </button>
          )}
        </div>
      )}

      {!loading && records.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 bg-white rounded-modal border border-[#EBEBE6] shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[460px]">
                <thead>
                  <tr className="bg-[#FAFAFA] border-b border-[#EBEBE6]">
                    <th className="py-3.5 px-6 text-[11px] font-bold tracking-wider text-[#768478] uppercase">Competitor</th>
                    <th className="py-3.5 px-6 text-[11px] font-bold tracking-wider text-[#768478] uppercase">Positioning</th>
                    <th className="py-3.5 px-6 text-[11px] font-bold tracking-wider text-[#768478] uppercase">Threat</th>
                    <th className="py-3.5 px-6 text-[11px] font-bold tracking-wider text-[#768478] uppercase text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0F0EC]">
                  {records.map((rec) => (
                    <tr key={rec.id} className="hover:bg-[#FAF9F5] transition-colors group">
                      <td className="py-4 px-6 text-xs md:text-sm font-bold text-[#1E2923]">
                        {(rec.data.name as string) || '-'}
                        <RecordEdited record={rec} className="font-normal" />
                      </td>
                      <td className="py-4 px-6 text-xs md:text-sm text-[#556358]">{(rec.data.positioning as string) || '-'}</td>
                      <td className="py-4 px-6">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold capitalize ${threatBadge(rec.data.threat_level)}`}>
                          {String(rec.data.threat_level || '-')}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {threads.button(rec.id, (rec.data.name as string) || 'this competitor')}
                          {canWrite && (<>
                          <button onClick={() => openEdit(rec)} className="p-1.5 rounded-input text-[#768478] hover:text-[#183B28] hover:bg-[#F0F4F1] transition-colors" aria-label="Edit competitor">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDelete(rec)} className="p-1.5 rounded-input text-[#768478] hover:text-[#A34B4B] hover:bg-[#FBEBEB] transition-colors" aria-label="Delete competitor">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          </>)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="lg:col-span-5 bg-white rounded-modal p-6 border border-[#EBEBE6] shadow-card flex flex-col gap-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-xs font-bold text-[#1E2923]">Positioning map</h3>
              {access.canEdit && (
                <button
                  onClick={() => setAxesOpen(true)}
                  className="flex items-center gap-1 text-[11px] font-semibold text-[#183B28] hover:text-[#11291C]"
                >
                  <SlidersHorizontal className="w-3 h-3" /> Edit axes
                </button>
              )}
            </div>
            <PositioningMap records={records} axes={axes} canMove={canWrite} onMove={moveDot} />
          </div>
        </div>
      )}

      {threads.drawer}

      {modalOpen && (
        <RecordFormModal
          title={editing ? 'Edit competitor' : suggestMode ? 'Suggest a competitor' : 'Add competitor'}
          suggestMode={suggestMode}
          fields={formFields}
          initial={editing?.data}
          submitting={submitting}
          error={formError}
          onSubmit={handleSubmit}
          onClose={() => setModalOpen(false)}
        />
      )}

      {axesOpen && (
        <AxesEditModal
          axes={axes}
          saving={axesSaving}
          onSave={handleSaveAxes}
          onClose={() => setAxesOpen(false)}
        />
      )}
    </div>
  );
}
