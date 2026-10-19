'use client';

import React, { useEffect, useRef } from 'react';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * A modal dialog with the standard keyboard behaviour: focus moves in on open,
 * Escape closes, Tab stays inside, and focus returns to what opened it. Mount it
 * only while open. `returnFocusRef` names the element to refocus when the opener
 * itself is gone (e.g. a dialog opened from another dialog).
 */
export function ModalDialog({
  label,
  onClose,
  returnFocusRef,
  overlayClassName,
  className,
  children,
}: {
  label: string;
  onClose: () => void;
  returnFocusRef?: React.RefObject<HTMLElement | null>;
  overlayClassName?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    const opener = document.activeElement;
    const panel = panelRef.current;
    const first = panel?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? panel)?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab' || !panel) return;
      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null);
      if (items.length === 0) {
        e.preventDefault();
        return;
      }
      const firstItem = items[0];
      const lastItem = items[items.length - 1];
      const active = document.activeElement;
      if (!panel.contains(active)) {
        e.preventDefault();
        firstItem.focus();
      } else if (e.shiftKey && active === firstItem) {
        e.preventDefault();
        lastItem.focus();
      } else if (!e.shiftKey && active === lastItem) {
        e.preventDefault();
        firstItem.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      // The ref points at the opener's button, read at close time on purpose.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      const target = opener instanceof HTMLElement && document.contains(opener) ? opener : returnFocusRef?.current;
      if (target && document.contains(target)) target.focus();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once on open
  }, []);

  return (
    <div className={overlayClassName} onClick={() => onCloseRef.current()}>
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        className={className}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
