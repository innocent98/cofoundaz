'use client';

import React, { useEffect, useId, useRef } from 'react';

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Right-hand slide-over used for create/edit forms. Escape or the backdrop closes it.
 * It is a modal dialog: focus moves in on open, Tab stays inside, and focus returns to
 * whatever opened it. It sits above the floating AI button (z-50) so that button never
 * covers the footer actions.
 */
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
  const panel = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const node = panel.current;
    const first = node?.querySelector<HTMLElement>('input, textarea, select');
    (first ?? node?.querySelector<HTMLElement>(FOCUSABLE))?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab' || !node) return;
      const items = Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (items.length === 0) return;
      const firstItem = items[0];
      const lastItem = items[items.length - 1];
      if (e.shiftKey && document.activeElement === firstItem) {
        e.preventDefault();
        lastItem.focus();
      } else if (!e.shiftKey && document.activeElement === lastItem) {
        e.preventDefault();
        firstItem.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      if (opener && document.contains(opener)) opener.focus();
    };
  }, []);

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-[55] backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="fixed inset-y-0 right-0 w-full max-w-lg bg-white z-[56] shadow-accent border-l border-neutral-200 flex flex-col"
      >
        <div className="flex items-center justify-between p-6 border-b border-neutral-200">
          <h2 id={titleId} className="text-xl font-display font-semibold text-neutral-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="h-10 w-10 flex items-center justify-center text-neutral-500 hover:text-neutral-900 text-lg cursor-pointer"
          >
            ×
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">{children}</div>
        {footer && <div className="p-6 border-t border-neutral-200 flex gap-3">{footer}</div>}
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
      <label htmlFor={htmlFor} className="text-xs font-semibold text-neutral-700 uppercase tracking-wider">
        {label}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-neutral-500">{hint}</p>}
      {error && (
        <p role="alert" className="text-xs text-danger-700">
          {error}
        </p>
      )}
    </div>
  );
}
