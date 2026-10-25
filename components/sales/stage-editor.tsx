'use client';

import React, { useState } from 'react';
import { useToast } from '@/app/(dashboard)/sales/ToastContext';
import {
  MAX_STAGES,
  saveStages,
  salesErrorMessage,
  type OverviewStage,
  type Stage,
  type StageInput,
  type StageKind,
} from '@/lib/api/sales';
import { ModalDialog } from '@/components/modal-dialog';
import { BTN_ACCENT, BTN_SECONDARY, INPUT } from './shared';

interface Row {
  key: string;
  id?: string;
  name: string;
  kind: StageKind;
  win_probability: string;
}

const KIND_NOTE: Record<StageKind, string> = {
  open: '',
  won: 'Won stage',
  lost: 'Lost stage',
};

let rowSeq = 0;
const newKey = () => `new-${++rowSeq}`;

/**
 * The stage editor (D-SAL-4): rename, reorder, add, delete (only an open stage with no
 * deals), set the win probability behind the weighted forecast. One Save sends the whole
 * ordered list; the API's own message is shown if it refuses (it saves nothing then).
 */
export function StageEditor({
  stages,
  counts,
  onClose,
  onSaved,
}: {
  stages: Stage[];
  /** Deals per stage id (from the overview), to disable delete on a stage that still has deals. */
  counts: OverviewStage[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const { triggerToast } = useToast();
  const [rows, setRows] = useState<Row[]>(() =>
    stages.map((s) => ({ key: s.id, id: s.id, name: s.name, kind: s.kind, win_probability: String(s.win_probability) }))
  );
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const dealCount = (id?: string) => (id ? counts.find((c) => c.stage_id === id)?.deal_count ?? 0 : 0);

  const patchRow = (key: string, patch: Partial<Row>) =>
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  const move = (index: number, delta: -1 | 1) =>
    setRows((rs) => {
      const to = index + delta;
      if (to < 0 || to >= rs.length) return rs;
      const next = [...rs];
      [next[index], next[to]] = [next[to], next[index]];
      return next;
    });

  const add = () =>
    setRows((rs) => {
      // New open stages go before the first closed stage, where deals are still in progress.
      const firstClosed = rs.findIndex((r) => r.kind !== 'open');
      const at = firstClosed === -1 ? rs.length : firstClosed;
      const row: Row = { key: newKey(), name: '', kind: 'open', win_probability: '50' };
      return [...rs.slice(0, at), row, ...rs.slice(at)];
    });

  const remove = (key: string) => setRows((rs) => rs.filter((r) => r.key !== key));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const inputs: StageInput[] = [];
    for (const r of rows) {
      const name = r.name.trim();
      const pct = Number(r.win_probability);
      if (!name) {
        setError('Every stage needs a name.');
        return;
      }
      if (r.win_probability.trim() === '' || !Number.isInteger(pct) || pct < 0 || pct > 100) {
        setError(`Win chance for ${name} must be a whole number from 0 to 100.`);
        return;
      }
      inputs.push({ ...(r.id ? { id: r.id } : {}), name, kind: r.kind, win_probability: pct });
    }
    setBusy(true);
    setError(null);
    try {
      await saveStages(inputs);
      triggerToast('Stages saved');
      onSaved();
      onClose();
    } catch (err) {
      setError(salesErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ModalDialog
      label="Edit stages"
      onClose={onClose}
      overlayClassName="fixed inset-0 z-[60] flex items-end md:items-center justify-center bg-black/40 backdrop-blur-[2px] p-0 md:p-4"
      className="bg-white rounded-t-modal md:rounded-modal w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-accent outline-none"
    >
      <form onSubmit={save} noValidate className="p-6 md:p-8 space-y-5">
        <div>
          <h2 className="text-xl font-display font-bold text-neutral-900">Edit stages</h2>
          <p className="text-sm text-neutral-500 mt-1">
            Rename, reorder or add stages (up to {MAX_STAGES}). A stage can only be deleted when it has no deals. Win chance
            drives the weighted forecast.
          </p>
        </div>

        <ol className="space-y-3">
          {rows.map((r, i) => {
            const count = dealCount(r.id);
            const closed = r.kind !== 'open';
            const deleteBlocked = closed || count > 0;
            return (
              <li key={r.key} className="border border-neutral-200 rounded-card p-3 space-y-2">
                <div className="flex flex-col md:flex-row md:items-center gap-2">
                  <input
                    aria-label={`Stage ${i + 1} name`}
                    className={`${INPUT} md:flex-1`}
                    value={r.name}
                    maxLength={60}
                    onChange={(e) => patchRow(r.key, { name: e.target.value })}
                  />
                  <label className="flex items-center gap-2 text-xs font-semibold text-neutral-600 shrink-0">
                    Win chance
                    <input
                      aria-label={`${r.name || `Stage ${i + 1}`} win chance percent`}
                      className={`${INPUT} !w-20`}
                      inputMode="numeric"
                      value={r.win_probability}
                      disabled={closed}
                      onChange={(e) => patchRow(r.key, { win_probability: e.target.value })}
                    />
                    %
                  </label>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-neutral-500">
                    {KIND_NOTE[r.kind] || 'Open stage'}
                    {r.id ? ` · ${count} deal${count === 1 ? '' : 's'}` : ' · new'}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => move(i, -1)}
                      disabled={i === 0}
                      aria-label={`Move ${r.name || `stage ${i + 1}`} up`}
                      className="h-9 w-9 rounded-card border border-neutral-200 text-neutral-700 hover:bg-neutral-50 disabled:opacity-40 cursor-pointer"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => move(i, 1)}
                      disabled={i === rows.length - 1}
                      aria-label={`Move ${r.name || `stage ${i + 1}`} down`}
                      className="h-9 w-9 rounded-card border border-neutral-200 text-neutral-700 hover:bg-neutral-50 disabled:opacity-40 cursor-pointer"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(r.key)}
                      disabled={deleteBlocked}
                      title={
                        closed
                          ? 'Won and Lost stages cannot be deleted'
                          : count > 0
                            ? 'Move the deals out of this stage first'
                            : undefined
                      }
                      aria-label={`Delete ${r.name || `stage ${i + 1}`}`}
                      className="h-9 px-3 rounded-card border border-danger-200 text-xs font-semibold text-danger-700 hover:bg-danger-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>

        <button type="button" onClick={add} disabled={rows.length >= MAX_STAGES} className={BTN_SECONDARY}>
          + Add stage
        </button>

        {error && (
          <p role="alert" className="text-sm text-danger-700 bg-danger-50 border border-danger-200 rounded-card px-4 py-3">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className={BTN_SECONDARY}>
            Cancel
          </button>
          <button type="submit" className={BTN_ACCENT} disabled={busy}>
            {busy ? 'Saving...' : 'Save stages'}
          </button>
        </div>
      </form>
    </ModalDialog>
  );
}
