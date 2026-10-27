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
    const onMove = () => setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', onMove);
    window.addEventListener('scroll', onMove, true);
    return () => {
      window.removeEventListener('resize', onMove);
      window.removeEventListener('scroll', onMove, true);
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
          // Fixed position so the menu can never be clipped: open on the side with more room, then clamp
          // inside the viewport (the fixed tab bar covers the bottom edge on phones) and scroll if still too tall.
          const r = ref.current?.getBoundingClientRect();
          if (r) {
            const margin = 8;
            const bottomReserve = 80;
            const want = actions.length * 44 + 8;
            const below = window.innerHeight - bottomReserve - r.bottom - margin;
            const above = r.top - margin * 2;
            const opensDown = below >= want || below >= above;
            const room = Math.max(opensDown ? below : above, 132);
            const height = Math.min(want, room);
            const top = opensDown ? r.bottom + 4 : Math.max(margin, r.top - 4 - height);
            setPos({ top, right: Math.max(margin, window.innerWidth - r.right), maxHeight: room });
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
