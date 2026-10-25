'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, Eye, EyeOff, Loader2, Pencil, Plus, RotateCcw, Trash2, X } from 'lucide-react';
import { ModalDialog } from '@/components/modal-dialog';
import { ConfirmDelete } from '@/components/validation/ConfirmDelete';
import { apiErrorInfo } from '@/lib/api/api-error';
import type { FeedbackCounts, FeedbackItem, FeedbackSource, ManualFeedbackSource } from '@/lib/api/validation';
import { SOURCE_LABEL, formatReceivedOn, todayIso, validateFeedbackDraft } from '@/lib/validation-format';

const MANUAL_SOURCES: ManualFeedbackSource[] = ['interview', 'in_app', 'email'];
const SOURCES: FeedbackSource[] = ['interview', 'survey', 'in_app', 'email'];

type Filter = 'all' | FeedbackSource;
type FormState = { mode: 'add' } | { mode: 'edit'; item: FeedbackItem } | null;

/** The MVP feedback inbox: source tabs with counts, imported (read-only) and manual items. */
export function FeedbackInbox({
  items,
  counts,
  loading,
  error,
  showDismissed,
  onShowDismissed,
  onRetry,
  onAdd,
  onEdit,
  onRemove,
  onRestore,
  notify,
}: {
  items: FeedbackItem[];
  counts: FeedbackCounts;
  loading: boolean;
  error: string | null;
  showDismissed: boolean;
  onShowDismissed: (v: boolean) => void;
  onRetry: () => void;
  onAdd: (body: { text: string; source: ManualFeedbackSource; received_on: string }) => Promise<void>;
  onEdit: (id: string, body: { text: string; source: ManualFeedbackSource; received_on: string }) => Promise<void>;
  onRemove: (id: string) => Promise<'deleted' | 'dismissed'>;
  onRestore: (id: string) => Promise<void>;
  notify: (msg: string) => void;
}) {
  const [filter, setFilter] = useState<Filter>('all');
  const [form, setForm] = useState<FormState>(null);
  const [toDelete, setToDelete] = useState<FeedbackItem | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const total = SOURCES.reduce((n, s) => n + counts[s], 0);
  const visible = filter === 'all' ? items : items.filter((i) => i.source === filter);

  const dismiss = async (item: FeedbackItem) => {
    setBusyId(item.id);
    try {
      await onRemove(item.id);
      notify('Dismissed. Turn on "Show dismissed" to restore it.');
    } catch (err) {
      notify(apiErrorInfo(err, 'Could not dismiss that. Try again.').message);
    } finally {
      setBusyId(null);
    }
  };

  const restore = async (item: FeedbackItem) => {
    setBusyId(item.id);
    try {
      await onRestore(item.id);
      notify('Restored.');
    } catch (err) {
      notify(apiErrorInfo(err, 'Could not restore that. Try again.').message);
    } finally {
      setBusyId(null);
    }
  };

  const tab = (value: Filter, label: string, count: number) => (
    <button
      key={value}
      type="button"
      role="tab"
      aria-selected={filter === value}
      onClick={() => setFilter(value)}
      className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap cursor-pointer border transition-colors ${
        filter === value
          ? 'bg-brand-strong border-brand-strong text-white'
          : 'bg-white border-line-soft text-ink-muted hover:border-neutral-xc5cfc7'
      }`}
    >
      {label} <span>{count}</span>
    </button>
  );

  return (
    <section aria-label="Feedback inbox" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-display font-semibold text-neutral-900">Feedback inbox</h2>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onShowDismissed(!showDismissed)}
            aria-pressed={showDismissed}
            className="flex items-center gap-1.5 bg-white hover:bg-neutral-50 border border-neutral-200 text-neutral-700 font-semibold px-3 py-2 rounded-card text-xs cursor-pointer"
          >
            {showDismissed ? <EyeOff className="w-3.5 h-3.5" aria-hidden="true" /> : <Eye className="w-3.5 h-3.5" aria-hidden="true" />}
            {showDismissed ? 'Hide dismissed' : 'Show dismissed'}
          </button>
          <button
            type="button"
            onClick={() => setForm({ mode: 'add' })}
            className="flex items-center gap-1.5 bg-brand-strong hover:bg-brand-rail text-white font-semibold px-4 py-2 rounded-card text-xs shadow-card cursor-pointer"
          >
            <Plus className="w-4 h-4" aria-hidden="true" /> Add feedback
          </button>
        </div>
      </div>

      <div role="tablist" aria-label="Filter by source" className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {tab('all', 'All', total)}
        {SOURCES.map((s) => tab(s, SOURCE_LABEL[s], counts[s]))}
      </div>

      {error && (
        <div className="flex items-center justify-between gap-3 bg-danger-xfbeae7 border border-danger-xf0c9c2 rounded-card px-4 py-3">
          <span className="flex items-center gap-2 text-sm text-danger-deep">
            <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" /> {error}
          </span>
          <button type="button" onClick={onRetry} className="text-xs font-semibold text-danger-deep underline cursor-pointer">
            Retry
          </button>
        </div>
      )}

      {loading && items.length === 0 ? (
        <div role="status" className="flex items-center justify-center gap-2 text-neutral-500 py-12">
          <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" /> <span className="text-sm">Loading feedback…</span>
        </div>
      ) : visible.length === 0 ? (
        <div data-testid="feedback-empty" className="bg-white rounded-modal p-8 border border-dashed border-neutral-200 text-center">
          <p className="text-sm text-neutral-500">
            {total === 0 && filter === 'all'
              ? 'No feedback yet. Interview quotes and open survey answers show up here on their own. Add emails and in-app messages by hand.'
              : `Nothing from ${filter === 'all' ? 'any source' : SOURCE_LABEL[filter]} yet.`}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {visible.map((item) => (
            <li
              key={item.id}
              className={`bg-white rounded-modal p-4 md:p-5 border border-neutral-200/80 shadow-card space-y-2.5 ${item.dismissed ? 'opacity-70' : ''}`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="bg-neutral-100 text-neutral-700 text-xs font-medium px-2.5 py-0.5 rounded-full">{SOURCE_LABEL[item.source]}</span>
                <span className="text-xs text-neutral-500 font-medium">{item.origin.label}</span>
                <span className="text-xs text-neutral-400">{formatReceivedOn(item.received_on)}</span>
                {item.dismissed && <span className="bg-accent-100 text-accent-800 text-[10px] font-semibold px-2 py-0.5 rounded-full">Dismissed</span>}
              </div>
              <p className="text-neutral-800 text-sm md:text-base break-words">{item.text}</p>
              <div className="flex flex-wrap items-center gap-2">
                {item.imported ? (
                  <>
                    <span className="text-xs text-neutral-500">
                      Edit it in the{' '}
                      <Link
                        href={item.origin.type === 'survey' ? '/validation/surveys' : '/validation/interviews'}
                        className="font-semibold text-brand-strong underline"
                      >
                        {item.origin.type === 'survey' ? 'survey' : 'interview'}
                      </Link>
                      .
                    </span>
                    {item.dismissed ? (
                      <button
                        type="button"
                        onClick={() => restore(item)}
                        disabled={busyId === item.id}
                        className="ml-auto flex items-center gap-1.5 bg-white border border-neutral-200 text-neutral-700 font-semibold px-3 py-1.5 rounded-input text-xs hover:bg-neutral-50 cursor-pointer disabled:opacity-60"
                      >
                        <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" /> Restore
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => dismiss(item)}
                        disabled={busyId === item.id}
                        aria-label={`Dismiss: ${item.text}`}
                        className="ml-auto flex items-center gap-1.5 bg-white border border-neutral-200 text-neutral-700 font-semibold px-3 py-1.5 rounded-input text-xs hover:bg-neutral-50 cursor-pointer disabled:opacity-60"
                      >
                        <X className="w-3.5 h-3.5" aria-hidden="true" /> Dismiss
                      </button>
                    )}
                  </>
                ) : (
                  <span className="ml-auto flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setForm({ mode: 'edit', item })}
                      aria-label={`Edit: ${item.text}`}
                      className="p-1.5 rounded-input text-neutral-400 hover:text-neutral-800 hover:bg-neutral-100 cursor-pointer"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setToDelete(item)}
                      aria-label={`Delete: ${item.text}`}
                      className="p-1.5 rounded-input text-neutral-400 hover:text-danger-600 hover:bg-neutral-100 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {form && (
        <FeedbackForm
          key={form.mode === 'edit' ? form.item.id : 'add'}
          initial={form.mode === 'edit' ? form.item : null}
          onClose={() => setForm(null)}
          onSubmit={async (body) => {
            if (form.mode === 'edit') await onEdit(form.item.id, body);
            else await onAdd(body);
            notify(form.mode === 'edit' ? 'Feedback updated' : 'Feedback added');
          }}
        />
      )}

      {toDelete && (
        <ConfirmDelete
          title="Delete this feedback?"
          warning="It is deleted for good and removed from any theme it is in."
          onConfirm={async () => {
            await onRemove(toDelete.id);
            notify('Feedback deleted');
          }}
          onClose={() => setToDelete(null)}
        />
      )}
    </section>
  );
}

function FeedbackForm({
  initial,
  onClose,
  onSubmit,
}: {
  initial: FeedbackItem | null;
  onClose: () => void;
  onSubmit: (body: { text: string; source: ManualFeedbackSource; received_on: string }) => Promise<void>;
}) {
  const [text, setText] = useState(initial?.text ?? '');
  const [source, setSource] = useState<ManualFeedbackSource>(
    initial && initial.source !== 'survey' ? initial.source : 'in_app'
  );
  const [receivedOn, setReceivedOn] = useState(initial?.received_on ?? todayIso());
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const invalid = validateFeedbackDraft(text, receivedOn);
    if (invalid) return setError(invalid);
    setBusy(true);
    setError(null);
    try {
      await onSubmit({ text: text.trim(), source, received_on: receivedOn });
      onClose();
    } catch (err) {
      setError(apiErrorInfo(err, 'Could not save that. Try again.').message);
      setBusy(false);
    }
  };

  const field = 'w-full bg-white border border-neutral-200 rounded-card px-3 py-2 text-sm focus:outline-none focus:border-brand-strong';
  return (
    <ModalDialog
      label={initial ? 'Edit feedback' : 'Add feedback'}
      onClose={() => {
        if (!busy) onClose();
      }}
      overlayClassName="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
      className="bg-white rounded-modal shadow-raised w-full max-w-lg p-6 outline-none"
    >
      <form onSubmit={submit} className="space-y-4">
        <h2 className="text-lg font-display font-bold text-ink">{initial ? 'Edit feedback' : 'Add feedback'}</h2>
        <label className="block space-y-1">
          <span className="text-xs font-semibold text-neutral-600">What did they say?</span>
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} className={field} />
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="block space-y-1">
            <span className="text-xs font-semibold text-neutral-600">Where from</span>
            <select value={source} onChange={(e) => setSource(e.target.value as ManualFeedbackSource)} className={`${field} cursor-pointer`}>
              {MANUAL_SOURCES.map((s) => (
                <option key={s} value={s}>
                  {SOURCE_LABEL[s]}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-semibold text-neutral-600">Date</span>
            <input type="date" value={receivedOn} onChange={(e) => setReceivedOn(e.target.value)} className={field} />
          </label>
        </div>
        {error && (
          <p role="alert" className="text-sm font-semibold text-danger-600">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} disabled={busy} className="px-4 py-2 rounded-card text-sm font-semibold text-ink-muted hover:bg-line-faint cursor-pointer disabled:opacity-60">
            Cancel
          </button>
          <button type="submit" disabled={busy} className="px-4 py-2 rounded-card text-sm font-bold bg-brand-strong hover:bg-brand-rail text-white inline-flex items-center gap-2 cursor-pointer disabled:opacity-60">
            {busy && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
            {initial ? 'Save changes' : 'Add feedback'}
          </button>
        </div>
      </form>
    </ModalDialog>
  );
}
