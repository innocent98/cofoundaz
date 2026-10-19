'use client';

import React, { useState } from 'react';
import { Plus } from 'lucide-react';

/** "+ Add" that turns into a one-line input (Enter adds, Escape cancels) instead of a browser prompt. */
export function InlineAdd({
  onAdd,
  placeholder = 'Add a point',
  className = '',
}: {
  onAdd: (text: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');

  const finish = (commit: boolean) => {
    const t = value.trim();
    if (commit && t) onAdd(t);
    setValue('');
    setOpen(false);
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`flex items-center gap-0.5 text-xs text-[#8E9B90] hover:text-[#183B28] transition-colors ${className}`}
      >
        <Plus className="w-3 h-3" /> Add
      </button>
    );
  }

  return (
    <input
      autoFocus
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => finish(true)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          finish(true);
        } else if (e.key === 'Escape') {
          e.preventDefault();
          finish(false);
        }
      }}
      placeholder={placeholder}
      aria-label={placeholder}
      maxLength={300}
      className="w-40 border-b border-[#183B28] bg-transparent text-xs text-[#1E2923] outline-none py-0.5"
    />
  );
}
