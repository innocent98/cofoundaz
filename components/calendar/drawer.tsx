'use client';

import React from 'react';
import { X } from 'lucide-react';
import { ModalDialog } from '@/components/modal-dialog';

/** Right-hand sheet on desktop, full screen on a phone. */
export function Drawer({
  label,
  title,
  onClose,
  children,
  footer,
}: {
  label: string;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <ModalDialog
      label={label}
      onClose={onClose}
      overlayClassName="fixed inset-0 z-50 flex justify-end bg-black/40"
      className="bg-white w-full max-w-[32rem] h-full flex flex-col shadow-accent outline-none"
    >
      <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-line">
        <h2 className="text-lg font-display text-ink min-w-0 break-words">{title}</h2>
        <button type="button" onClick={onClose} aria-label="Close" className="p-1.5 rounded-card text-ink-muted hover:bg-surface-muted shrink-0">
          <X size={16} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">{children}</div>
      {footer && <div className="border-t border-line pl-5 pr-20 py-4 flex flex-wrap items-center gap-3">{footer}</div>}
    </ModalDialog>
  );
}

export const inputClass =
  'w-full bg-white border border-line rounded-card px-3 py-2 text-xs text-ink placeholder-neutral-x9ca8a0 focus:outline-none focus:ring-1 focus:ring-accent-bronze';
export const labelClass = 'text-[10px] font-bold text-ink-subtle uppercase tracking-wider';
export const primaryBtn =
  'px-4 py-2 bg-accent-bronze hover:bg-accent-x906d3a text-white rounded-card text-xs font-semibold shadow-card transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
export const secondaryBtn =
  'px-4 py-2 bg-white border border-line rounded-card text-xs font-semibold text-ink hover:bg-surface-muted transition-colors disabled:opacity-50';
export const dangerBtn =
  'px-4 py-2 bg-white border border-danger-bold rounded-card text-xs font-semibold text-danger-bold hover:bg-danger-tint transition-colors disabled:opacity-50';

export function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label htmlFor={htmlFor} className={labelClass}>{label}</label>
      {children}
      {error && <p role="alert" className="text-[11px] text-danger-bold">{error}</p>}
    </div>
  );
}
