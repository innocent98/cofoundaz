'use client';

import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { ModalDialog } from '@/components/modal-dialog';

/**
 * Confirm-before-delete dialog. `onConfirm` resolves when the delete finished
 * (the dialog then closes) and rejects to keep it open with `errorMessage`.
 */
export function ConfirmDelete({
  title,
  warning,
  confirmLabel = 'Delete',
  failureMessage,
  onConfirm,
  onClose,
}: {
  title: string;
  warning: string;
  confirmLabel?: string;
  /** Error copy when `onConfirm` rejects; defaults to the delete wording. */
  failureMessage?: (err: unknown) => string;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setBusy(true);
    setError(null);
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      setError(failureMessage ? failureMessage(err) : 'Could not delete that. Try again.');
      setBusy(false);
    }
  };

  return (
    <ModalDialog
      label={title}
      onClose={() => { if (!busy) onClose(); }}
      overlayClassName="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
      className="bg-white rounded-modal shadow-raised w-full max-w-md p-6 space-y-4 outline-none"
    >
      <h2 className="text-lg font-display font-bold text-ink break-words">{title}</h2>
      <p className="text-sm text-ink-muted">{warning}</p>
      {error && <p role="alert" className="text-sm font-semibold text-danger-600">{error}</p>}
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onClose} disabled={busy} className="px-4 py-2 rounded-card text-sm font-semibold text-ink-muted hover:bg-line-faint cursor-pointer disabled:opacity-60">
          Cancel
        </button>
        <button type="button" onClick={run} disabled={busy} className="px-4 py-2 rounded-card text-sm font-bold bg-danger-600 hover:bg-danger-deep text-white inline-flex items-center gap-2 cursor-pointer disabled:opacity-60">
          {busy && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
          {confirmLabel}
        </button>
      </div>
    </ModalDialog>
  );
}
