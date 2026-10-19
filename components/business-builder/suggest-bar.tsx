'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { Send } from 'lucide-react';

interface Props {
  /** Unsent local edits exist. */
  dirty: boolean;
  onSend: (note?: string) => Promise<{ ok: boolean; error?: string }>;
  onDiscard: () => void;
}

/** Consultant suggest mode: edits stay local until sent to the founder as one suggestion. */
export function SuggestBar({ dirty, onSend, onDiscard }: Props) {
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!dirty) return null;

  const send = async () => {
    setBusy(true);
    setError(null);
    const res = await onSend(note);
    setBusy(false);
    if (res.ok) {
      setNote('');
      toast.success('Suggestion sent', { description: 'The founder will review it.' });
    } else {
      setError(res.error ?? 'Could not send your suggestion.');
    }
  };

  return (
    <div className="sticky bottom-20 md:bottom-4 z-30 bg-white border border-[#EAD5C6] shadow-raised rounded-modal p-4 flex flex-col md:flex-row md:items-center gap-3">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-[#1E2923]">You have changes to suggest</p>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Add a note for the founder (optional)"
          maxLength={500}
          aria-label="Note for the founder"
          className="mt-2 w-full border border-[#D5DDD6] rounded-input px-3 py-2 text-xs focus:outline-none focus:border-[#4D6D58]"
        />
        {error && <p role="alert" className="mt-1 text-[11px] font-semibold text-[#B0483B]">{error}</p>}
      </div>
      <div className="flex gap-2 shrink-0">
        <button type="button" onClick={onDiscard} disabled={busy} className="px-4 py-2 bg-white border border-[#DCDCD6] hover:bg-[#F5F5F0] rounded-card text-xs font-bold">
          Discard
        </button>
        <button type="button" onClick={send} disabled={busy} className="flex items-center gap-1.5 px-4 py-2 bg-[#9C5B34] hover:bg-[#8A5330] disabled:opacity-60 text-white rounded-card text-xs font-bold">
          <Send className="w-3.5 h-3.5" /> {busy ? 'Sending' : 'Send suggestion'}
        </button>
      </div>
    </div>
  );
}
