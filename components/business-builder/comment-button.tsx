'use client';

import React from 'react';
import { MessageSquare } from 'lucide-react';

/** A small speech-bubble button with the open-comment count. */
export function CommentButton({
  label,
  open,
  total,
  onClick,
}: {
  label: string;
  open: number;
  total: number;
  onClick: () => void;
}) {
  const text = total === 0 ? `Comment on ${label}` : `${total} comment${total === 1 ? '' : 's'} on ${label}`;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={text}
      title={text}
      className={`flex items-center gap-1 text-xs font-semibold transition-colors ${
        open > 0 ? 'text-[#9C5B34] hover:text-[#522F1A]' : 'text-[#8E9B90] hover:text-[#183B28]'
      }`}
    >
      <MessageSquare className="w-3 h-3" />
      {total > 0 && <span>{total}</span>}
    </button>
  );
}
