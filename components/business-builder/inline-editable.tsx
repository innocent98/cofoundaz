'use client';

import React, { useLayoutEffect, useRef, useState } from 'react';

/**
 * Click-to-edit text. Renders `value` as plain text (inheriting the parent chip's
 * font/colour); clicking swaps it for an inline input. Enter or blur commits via
 * `onSave`, Escape cancels. Headless of chrome so each canvas keeps its own chip
 * wrapper + remove button — this only owns the text ↔ input swap.
 */
export function InlineEditable({
  value,
  onSave,
  className = '',
}: {
  value: string;
  onSave: (next: string) => void;
  className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus + select once the input is mounted. Draft is seeded in startEditing
  // (not here) so the effect never calls setState.
  useLayoutEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const startEditing = () => {
    setDraft(value);
    setEditing(true);
  };

  const commit = () => {
    setEditing(false);
    if (draft.trim() !== value) onSave(draft);
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            commit();
          } else if (e.key === 'Escape') {
            e.preventDefault();
            setDraft(value);
            setEditing(false);
          }
        }}
        // Grow with content; inherit the chip's colour/size, subtle underline.
        size={Math.max(draft.length, 4)}
        className={`bg-transparent text-inherit outline-none border-b border-current/40 min-w-[3ch] max-w-[220px] ${className}`}
        aria-label="Edit item"
      />
    );
  }

  return (
    <span
      role="button"
      tabIndex={0}
      onClick={startEditing}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          startEditing();
        }
      }}
      title="Click to edit"
      className={`cursor-text whitespace-pre-wrap ${className}`}
    >
      {value}
    </span>
  );
}
