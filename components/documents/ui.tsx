'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { ModalDialog } from '@/components/modal-dialog';

// Shared building blocks for the Documents pages. Every control is at least
// 44px high (min-h-11) so it is reachable by touch at 375px.

export const btnPrimary =
  'inline-flex items-center justify-center gap-1.5 min-h-11 px-4 rounded-card bg-brand-strong hover:bg-brand-rail text-white text-xs font-bold shadow-card transition-colors disabled:opacity-60';
export const btnSecondary =
  'inline-flex items-center justify-center gap-1.5 min-h-11 px-4 rounded-card bg-white border border-line-strong hover:bg-surface-muted text-ink text-xs font-bold transition-colors disabled:opacity-60';
export const btnDanger =
  'inline-flex items-center justify-center gap-1.5 min-h-11 px-4 rounded-card bg-danger-bold hover:bg-danger-deep text-white text-xs font-bold shadow-card transition-colors disabled:opacity-60';
export const btnIcon =
  'inline-flex items-center justify-center min-h-11 min-w-11 rounded-input text-ink-muted hover:text-ink hover:bg-surface-muted transition-colors disabled:opacity-40';
export const inputCls =
  'w-full min-h-11 border border-line-strong rounded-input px-3 py-2 text-sm text-ink bg-white focus:outline-none focus:border-line-focus focus:ring-1 focus:ring-line-focus';
export const labelCls = 'text-xs font-bold text-neutral-600 uppercase tracking-wider';

export function Dialog({
  label,
  onClose,
  children,
  wide,
}: {
  label: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <ModalDialog
      label={label}
      onClose={onClose}
      overlayClassName="fixed inset-0 bg-brand-x061a12/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      className={`bg-white rounded-modal w-full ${wide ? 'max-w-xl' : 'max-w-md'} max-h-[90vh] overflow-y-auto shadow-raised focus:outline-none`}
    >
      <div className="pl-6 pr-2 py-2 border-b border-line flex items-center justify-between bg-surface-faint">
        <h3 className="font-bold text-ink truncate pr-4">{label}</h3>
        <button type="button" onClick={onClose} aria-label="Close" className={btnIcon}>
          <X size={16} />
        </button>
      </div>
      {children}
    </ModalDialog>
  );
}

export function ConfirmDialog({
  title,
  body,
  confirmLabel,
  danger,
  onConfirm,
  onClose,
}: {
  title: string;
  body: React.ReactNode;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => Promise<void> | void;
  onClose: () => void;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <Dialog label={title} onClose={onClose}>
      <div className="p-6 space-y-5">
        <div className="text-sm text-ink-muted leading-relaxed">{body}</div>
        <div className="flex gap-3">
          <button type="button" className={`${btnSecondary} flex-1`} onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            disabled={busy}
            className={`${danger ? btnDanger : btnPrimary} flex-1`}
            onClick={async () => {
              setBusy(true);
              try {
                await onConfirm();
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </Dialog>
  );
}

export interface PromptField {
  name: string;
  label: string;
  value: string;
  placeholder?: string;
  hint?: string;
  required?: boolean;
  list?: string[]; // suggestions (datalist)
}

/** A small form dialog: rename, move, tags, new folder. */
export function PromptDialog({
  title,
  fields,
  submitLabel,
  onSubmit,
  onClose,
}: {
  title: string;
  fields: PromptField[];
  submitLabel: string;
  onSubmit: (values: Record<string, string>) => Promise<string | null | void>;
  onClose: () => void;
}) {
  const [values, setValues] = useState<Record<string, string>>(() => Object.fromEntries(fields.map((f) => [f.name, f.value])));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <Dialog label={title} onClose={onClose}>
      <form
        className="p-6 space-y-5"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError(null);
          try {
            const err = await onSubmit(values);
            if (err) setError(err);
          } finally {
            setBusy(false);
          }
        }}
      >
        {fields.map((f) => (
          <div key={f.name} className="space-y-1.5">
            <label htmlFor={`pf-${f.name}`} className={labelCls}>
              {f.label}
            </label>
            <input
              id={`pf-${f.name}`}
              className={inputCls}
              value={values[f.name]}
              required={f.required}
              placeholder={f.placeholder}
              list={f.list ? `pf-${f.name}-list` : undefined}
              onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
            />
            {f.list && (
              <datalist id={`pf-${f.name}-list`}>
                {f.list.map((o) => (
                  <option key={o} value={o} />
                ))}
              </datalist>
            )}
            {f.hint && <p className="text-[11px] text-ink-subtle">{f.hint}</p>}
          </div>
        ))}
        {error && (
          <p role="alert" className="text-xs font-semibold text-danger-600">
            {error}
          </p>
        )}
        <div className="flex gap-3">
          <button type="button" className={`${btnSecondary} flex-1`} onClick={onClose}>
            Cancel
          </button>
          <button type="submit" disabled={busy} className={`${btnPrimary} flex-1`}>
            {busy ? 'Saving…' : submitLabel}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
