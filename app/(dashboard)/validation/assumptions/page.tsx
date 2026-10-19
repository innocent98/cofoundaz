'use client';

import React, { useState } from 'react';
import { Loader2, AlertTriangle, Trash2 } from 'lucide-react';
import { useAssumptions, Assumption, AssumptionStatus } from '@/hooks/useAssumptions';
import { useToast } from '../layout';
import { useValidationOverview } from '@/hooks/useValidationOverview';
import { RiskiestNudge } from '@/components/validation/RiskiestNudge';
import { ConfirmDelete } from '@/components/validation/ConfirmDelete';
import { deleteWarning } from '@/lib/validation-format';

const STATUS_LABEL: Record<AssumptionStatus, string> = {
  untested: 'Untested',
  testing: 'Testing',
  validated: 'Validated',
  invalidated: 'Invalidated',
};

export default function AssumptionsPage() {
  const { assumptions, loading, error, addAssumption, updateStatus, remove, refetch } = useAssumptions();
  const { overview, refetch: refetchOverview } = useValidationOverview();
  const [toDelete, setToDelete] = useState<Assumption | null>(null);
  const { triggerToast } = useToast();
  const [newAssumptionTitle, setNewAssumptionTitle] = useState('');
  const [adding, setAdding] = useState(false);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
  };
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  const handleDrop = (e: React.DragEvent, newStatus: AssumptionStatus) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    if (!id) return;
    const card = assumptions.find((a) => a.id === id);
    if (!card || card.status === newStatus) return;
    updateStatus(id, newStatus)
      .then(() => {
        triggerToast(`Moved to ${STATUS_LABEL[newStatus]}`);
        void refetchOverview();
      })
      .catch(() => triggerToast('Could not move that card. Try again.'));
  };

  const handleQuickAdd = () => {
    const s = newAssumptionTitle.trim();
    if (!s || adding) return;
    setAdding(true);
    setNewAssumptionTitle('');
    addAssumption(s)
      .then(() => {
        triggerToast('Assumption added');
        void refetchOverview();
      })
      .catch(() => {
        triggerToast('Could not add that assumption. Try again.');
        setNewAssumptionTitle(s);
      })
      .finally(() => setAdding(false));
  };

  const untested = assumptions.filter((a) => a.status === 'untested');
  const testing = assumptions.filter((a) => a.status === 'testing');
  const validated = assumptions.filter((a) => a.status === 'validated');
  const invalidated = assumptions.filter((a) => a.status === 'invalidated');

  const getRiskBadge = (risk: string) => {
    if (risk === 'high')
      return <span className="bg-red-100 text-red-800 text-[10px] font-semibold px-2 py-0.5 rounded-full">High risk</span>;
    if (risk === 'medium')
      return <span className="bg-copper-100 text-copper-800 text-[10px] font-semibold px-2 py-0.5 rounded-full">Med risk</span>;
    return <span className="bg-green-100 text-green-800 text-[10px] font-semibold px-2 py-0.5 rounded-full">Low risk</span>;
  };

  const renderCard = (a: Assumption) => (
    <div
      key={a.id}
      draggable
      onDragStart={(e) => handleDragStart(e, a.id)}
      className="bg-[#f9faf8] rounded-card p-3.5 border border-sage-100 space-y-3 shadow-card cursor-grab active:cursor-grabbing"
    >
      <p className="text-xs md:text-sm font-medium text-sage-800">{a.statement}</p>
      <div className="flex items-center justify-between pt-1">
        {getRiskBadge(a.risk)}
        <span className="flex items-center gap-2">
          <span className="text-[11px] text-sage-400">{a.evidenceCount} evidence</span>
          <button
            type="button"
            onClick={() => setToDelete(a)}
            aria-label={`Delete assumption: ${a.statement}`}
            className="p-1 rounded-input text-sage-400 hover:text-[#B0483B] hover:bg-sage-100 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </span>
      </div>
    </div>
  );

  const columns: Array<{ status: AssumptionStatus; items: Assumption[]; titleClass: string; quickAdd?: boolean }> = [
    { status: 'untested', items: untested, titleClass: 'text-sage-900', quickAdd: true },
    { status: 'testing', items: testing, titleClass: 'text-sage-900' },
    { status: 'validated', items: validated, titleClass: 'text-green-800' },
    { status: 'invalidated', items: invalidated, titleClass: 'text-red-800' },
  ];

  return (
    <div className="space-y-6">
      <RiskiestNudge riskiest={overview?.riskiest_untested ?? null} />

      {error && (
        <div className="flex items-center justify-between gap-3 bg-[#FBEAE7] border border-[#F0C9C2] rounded-card px-4 py-3">
          <span className="flex items-center gap-2 text-sm text-[#8A2E22]">
            <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
          </span>
          <button onClick={() => refetch()} className="text-xs font-semibold text-[#8A2E22] underline cursor-pointer">
            Retry
          </button>
        </div>
      )}

      {loading && assumptions.length === 0 ? (
        <div className="flex items-center justify-center gap-2 text-sage-500 py-16">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Loading your assumptions…</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
          {columns.map((col) => (
            <div
              key={col.status}
              className="bg-white rounded-modal p-4 md:p-5 border border-sage-200/80 space-y-4 shadow-card"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.status)}
            >
              <div className="flex items-center justify-between border-b border-sage-100 pb-3">
                <h3 className={`font-bold text-xs md:text-sm tracking-wide ${col.titleClass}`}>
                  {STATUS_LABEL[col.status]}
                </h3>
                <span className="w-6 h-6 rounded-full bg-sage-100 text-sage-600 text-xs font-semibold flex items-center justify-center">
                  {col.items.length}
                </span>
              </div>
              <div className="space-y-3 min-h-[50px]">
                {col.items.map(renderCard)}
                {col.items.length === 0 && !col.quickAdd && (
                  <p className="text-[11px] text-sage-400 py-2">Nothing here yet.</p>
                )}
              </div>
              {col.quickAdd && (
                <div className="pt-2 border-t border-sage-100">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Quick add…"
                      value={newAssumptionTitle}
                      onChange={(e) => setNewAssumptionTitle(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleQuickAdd()}
                      className="flex-1 bg-[#F7F7F5] border border-sage-200 rounded-input px-3 py-2 text-xs outline-none focus:border-[#183B28]"
                    />
                    <button
                      onClick={handleQuickAdd}
                      disabled={adding || !newAssumptionTitle.trim()}
                      className="bg-[#183B28] text-white p-2 rounded-card shadow-card hover:bg-[#11291C] disabled:opacity-50 cursor-pointer"
                      aria-label="Add assumption"
                    >
                      {adding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : '+'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {toDelete && (
        <ConfirmDelete
          title={`Delete this assumption?`}
          warning={`"${toDelete.statement}". ${deleteWarning('assumption')}`}
          onConfirm={async () => {
            await remove(toDelete.id);
            triggerToast('Assumption deleted');
            void refetchOverview();
          }}
          onClose={() => setToDelete(null)}
        />
      )}
    </div>
  );
}
