'use client';

import React, { useEffect } from 'react';

/** Right-hand slide-over used for create/edit forms. Escape or the backdrop closes it. */
export function Drawer({
  title,
  onClose,
  children,
  footer,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-50 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="fixed inset-y-0 right-0 w-full max-w-lg bg-white z-50 shadow-accent border-l border-sage-200 flex flex-col"
      >
        <div className="flex items-center justify-between p-6 border-b border-sage-200">
          <h2 className="text-xl font-display font-semibold text-sage-900">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="text-sage-500 hover:text-sage-900 text-lg">
            ×
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">{children}</div>
        {footer && <div className="p-6 border-t border-sage-200 flex gap-3">{footer}</div>}
      </div>
    </>
  );
}

export function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-xs font-semibold text-sage-700 uppercase tracking-wider">
        {label}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-sage-500">{hint}</p>}
      {error && (
        <p role="alert" className="text-xs text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
