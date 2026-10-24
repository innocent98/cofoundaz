'use client';

import React, { useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { useToast } from '@/app/(dashboard)/sales/ToastContext';
import { useSequences } from '@/hooks/useSalesSequences';
import {
  SKIP_REASON_LABELS,
  enrollInSequence,
  enrollSummary,
  type EnrollResult,
} from '@/lib/api/sales';
import { BTN_ACCENT, BTN_SECONDARY, ErrorState, INPUT, LABEL, LoadingState } from './shared';

export interface EnrollTarget {
  /** Shown in the dialog, e.g. "Ada Test". */
  label: string;
  lead_ids?: string[];
  contact_ids?: string[];
}

/**
 * Pick a sequence and enrol one or more leads / contacts in it. The result lists who was skipped and why
 * (no email, unsubscribed, already in it), so nobody is silently left out.
 */
export function EnrollDialog({
  targets,
  onClose,
  onEnrolled,
}: {
  targets: EnrollTarget;
  onClose: () => void;
  onEnrolled?: () => void;
}) {
  const { runAction } = useToast();
  const sequences = useSequences();
  const [choice, setChoice] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<EnrollResult | null>(null);
  const titleId = useId();
  const selectId = useId();
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeRef.current();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      if (opener && document.contains(opener)) opener.focus();
    };
  }, []);

  const single = (targets.lead_ids?.length ?? 0) + (targets.contact_ids?.length ?? 0) === 1;
  const options = sequences.data ?? [];
  const selected = choice || options[0]?.id || '';

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    setBusy(true);
    const res = await runAction(() =>
      enrollInSequence(selected, { lead_ids: targets.lead_ids, contact_ids: targets.contact_ids })
    );
    setBusy(false);
    if (!res.ok) return;
    setResult(res.value);
    if (res.value.enrolled > 0) onEnrolled?.();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative w-full max-w-md bg-white rounded-modal shadow-raised border border-sage-200 p-6 space-y-4"
      >
        <h2 id={titleId} className="font-display font-semibold text-lg text-sage-900">
          Enrol {targets.label} in a sequence
        </h2>

        {result ? (
          <div className="space-y-3" role="status">
            <p className="text-sm text-sage-800 font-semibold">{enrollSummary(result)}.</p>
            {result.skipped.length > 0 && (
              <ul className="text-sm text-sage-700 list-disc pl-5 space-y-1">
                {result.skipped.map((s) => (
                  <li key={s.id}>
                    {single ? targets.label : 'One person'}{' '}
                    {SKIP_REASON_LABELS[s.reason]}.
                  </li>
                ))}
              </ul>
            )}
            <div className="flex justify-end gap-3 pt-1">
              {result.enrolled > 0 && (
                <Link href="/sales/sequences" className={BTN_SECONDARY}>
                  Open sequences
                </Link>
              )}
              <button type="button" onClick={onClose} className={BTN_ACCENT}>
                Done
              </button>
            </div>
          </div>
        ) : sequences.status === 'loading' ? (
          <LoadingState label="Loading sequences" />
        ) : sequences.status === 'error' || sequences.status === 'forbidden' ? (
          <ErrorState message={sequences.error ?? 'Could not load sequences.'} onRetry={() => void sequences.reload()} />
        ) : options.length === 0 ? (
          <div className="space-y-3">
            <p className="text-sm text-sage-700">You have no sequences yet. Create one first, then come back.</p>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={onClose} className={BTN_SECONDARY}>
                Cancel
              </button>
              <Link href="/sales/sequences" className={BTN_ACCENT}>
                Go to sequences
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor={selectId} className={LABEL}>
                Sequence
              </label>
              <select id={selectId} className={INPUT} value={selected} onChange={(e) => setChoice(e.target.value)}>
                {options.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.step_count} {s.step_count === 1 ? 'step' : 'steps'}
                    {s.status === 'paused' ? ', paused' : ''})
                  </option>
                ))}
              </select>
              {options.find((s) => s.id === selected)?.status === 'paused' && (
                <p className="text-xs text-sage-600">This sequence is paused. They are enrolled but nothing is sent until you resume it.</p>
              )}
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={onClose} className={BTN_SECONDARY}>
                Cancel
              </button>
              <button type="submit" disabled={busy} className={BTN_ACCENT}>
                {busy ? 'Enrolling...' : 'Enrol'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
