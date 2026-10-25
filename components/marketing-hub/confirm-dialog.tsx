'use client';

import React, { useEffect, useId, useRef } from 'react';
import { BTN_DANGER, BTN_PRIMARY, BTN_SECONDARY } from './states';

/**
 * A small modal for actions that cannot be undone or that notify the team (complete a campaign,
 * delete a record). Focus starts on the safe button, Escape cancels, and focus returns on close.
 */
export function ConfirmDialog({
  title,
  body,
  confirmLabel,
  cancelLabel = 'Keep it',
  danger = false,
  busy = false,
  onConfirm,
  onCancel,
}: {
  title: string;
  body: React.ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  danger?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const bodyId = useId();
  const cancelHandler = useRef(onCancel);
  useEffect(() => {
    cancelHandler.current = onCancel;
  }, [onCancel]);

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') cancelHandler.current();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      if (opener && document.contains(opener)) opener.focus();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} aria-hidden="true" />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={bodyId}
        className="relative w-full max-w-md bg-white rounded-modal shadow-raised border border-neutral-200 p-6 space-y-4"
      >
        <h2 id={titleId} className="font-display font-semibold text-lg text-neutral-900">{title}</h2>
        <div id={bodyId} className="text-sm text-neutral-700 leading-relaxed">{body}</div>
        <div className="flex flex-wrap justify-end gap-3 pt-1">
          <button ref={cancelRef} type="button" onClick={onCancel} className={BTN_SECONDARY}>{cancelLabel}</button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={danger ? `${BTN_DANGER} !text-sm !px-4 !py-2` : BTN_PRIMARY}
          >
            {busy ? 'Working...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
