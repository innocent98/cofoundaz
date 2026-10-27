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
  const [pos, setPos] = useState<{ top: number; right: number; maxHeight: number } | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const onResize = () => setOpen(false);
    // The menu can scroll itself when the viewport is short; only a scroll elsewhere detaches it from its row.
    const onScroll = (e: Event) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onScroll, true);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onScroll, true);
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
          // Fixed position so the menu can never be clipped: start on the side with more room, then slide it
          // inside the usable viewport (the fixed tab bar covers the bottom edge on phones). It only scrolls
          // when the whole viewport is shorter than the menu.
          const r = ref.current?.getBoundingClientRect();
          if (r) {
            const margin = 8;
            const bottomReserve = 80;
            const usable = Math.max(window.innerHeight - bottomReserve - margin * 2, 132);
            const want = actions.length * 44 + 8;
            const height = Math.min(want, usable);
            const below = window.innerHeight - bottomReserve - r.bottom - margin;
            const opensDown = below >= height || below >= r.top - margin;
            const wanted = opensDown ? r.bottom + 4 : r.top - 4 - height;
            const top = Math.min(Math.max(wanted, margin), margin + usable - height);
            setPos({ top, right: Math.max(margin, window.innerWidth - r.right), maxHeight: usable });
          }
          setOpen((o) => !o);
        }}
        className={btnIcon}
      >
        <MoreHorizontal size={16} />
      </button>
      {open && (
        <div role="menu" style={pos ? { top: pos.top, right: pos.right, maxHeight: pos.maxHeight } : undefined} className="fixed z-30 w-52 overflow-y-auto bg-white border border-line rounded-card shadow-raised py-1">
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
