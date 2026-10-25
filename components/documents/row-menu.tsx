'use client';

import React, { useEffect, useRef, useState } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { btnIcon } from './ui';

export interface MenuAction {
  label: string;
  onSelect: () => void;
  danger?: boolean;
}

/** A per-row actions menu (real buttons, closes on Escape or outside click). */
export function RowMenu({ title, actions }: { title: string; actions: MenuAction[] }) {
  const [open, setOpen] = useState(false);
  const [up, setUp] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        aria-label={`Actions for ${title}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => {
          // Open upward when there is no room below (the fixed tab bar covers the bottom edge on phones).
          const r = ref.current?.getBoundingClientRect();
          if (r) setUp(window.innerHeight - r.bottom < actions.length * 44 + 96);
          setOpen((o) => !o);
        }}
        className={btnIcon}
      >
        <MoreHorizontal size={16} />
      </button>
      {open && (
        <div role="menu" className={`absolute right-0 z-30 w-52 bg-white border border-line rounded-card shadow-raised py-1 ${up ? 'bottom-full mb-1' : 'top-full mt-1'}`}>
          {actions.map((a) => (
            <button
              key={a.label}
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                a.onSelect();
              }}
              className={`w-full text-left min-h-11 px-4 text-xs font-semibold hover:bg-surface-muted ${a.danger ? 'text-danger-bold' : 'text-ink'}`}
            >
              {a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
