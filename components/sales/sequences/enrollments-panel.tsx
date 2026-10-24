'use client';

import React, { useId, useState } from 'react';
import { useToast } from '@/app/(dashboard)/sales/ToastContext';
import { useEnrollments } from '@/hooks/useSalesSequences';
import {
  ENROLLMENT_STATUSES,
  ENROLLMENT_STATUS_LABELS,
  STOPPED_REASON_LABELS,
  markEnrollmentReplied,
  stopEnrollment,
  type Enrollment,
  type EnrollmentStatus,
} from '@/lib/api/sales';
import { BTN_SECONDARY, ConfirmDialog, EmptyState, ErrorState, INPUT, LoadingState } from '../shared';

const PAGE = 20;

const STATUS_STYLE: Record<EnrollmentStatus, string> = {
  active: 'bg-green-50 text-green-700',
  completed: 'bg-sage-100 text-sage-700',
  replied: 'bg-green-100/70 text-green-800',
  unsubscribed: 'bg-copper-100 text-copper-800',
  bounced: 'bg-red-50 text-red-700',
  stopped: 'bg-sage-100 text-sage-700',
};

function when(iso: string | null): string {
  return iso ? new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '';
}

function whoOf(e: Enrollment): string {
  return [e.first_name, e.last_name].filter(Boolean).join(' ') || e.email;
}

/** Who is in one sequence and where each person stands, with Mark replied / Stop on live rows. */
export function EnrollmentsPanel({ sequenceId, stepCount, onChanged }: { sequenceId: string; stepCount: number; onChanged: () => void }) {
  const { runAction } = useToast();
  const [status, setStatus] = useState<EnrollmentStatus | ''>('');
  const [offset, setOffset] = useState(0);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toStop, setToStop] = useState<Enrollment | null>(null);
  const filterId = useId();
  const list = useEnrollments(sequenceId, status, offset, PAGE);

  const act = async (e: Enrollment, kind: 'replied' | 'stop') => {
    setBusyId(e.id);
    const res = await runAction(
      () => (kind === 'replied' ? markEnrollmentReplied(e.id) : stopEnrollment(e.id)),
      kind === 'replied' ? `${whoOf(e)} marked as replied` : `${whoOf(e)} stopped`
    );
    setBusyId(null);
    setToStop(null);
    // A 409 means someone else already ended it: refresh either way so the row tells the truth.
    await list.reload();
    if (res.ok) onChanged();
  };

  const items = list.data?.items ?? [];
  const total = list.data?.total ?? 0;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-xs font-bold text-sage-500 uppercase tracking-wider">People in this sequence</h3>
        <div className="flex items-center gap-2">
          <label htmlFor={filterId} className="text-xs text-sage-600">
            Show
          </label>
          <select
            id={filterId}
            className={`${INPUT} !w-auto !py-1.5`}
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as EnrollmentStatus | '');
              setOffset(0);
            }}
          >
            <option value="">Everyone</option>
            {ENROLLMENT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {ENROLLMENT_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {list.status === 'loading' && <LoadingState label="Loading people" />}
      {(list.status === 'error' || list.status === 'forbidden') && (
        <ErrorState message={list.error ?? 'Could not load this list.'} onRetry={() => void list.reload()} />
      )}
      {list.status === 'ready' && items.length === 0 && (
        <EmptyState
          title={status ? 'Nobody with that status' : 'Nobody enrolled yet'}
          body={
            status
              ? 'Pick another status to see the rest.'
              : 'Enrol leads from the Leads page, or contacts from an account, and they show up here.'
          }
        />
      )}
      {list.status === 'ready' && items.length > 0 && (
        <>
          <ul className="divide-y divide-sage-100 border border-sage-200 rounded-card bg-white">
            {items.map((e) => (
              <li key={e.id} className="p-3 md:p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-sage-900 truncate">{whoOf(e)}</p>
                  <p className="text-xs text-sage-500 truncate">
                    {[e.email, e.company].filter(Boolean).join(' · ')}
                  </p>
                  <p className="text-xs text-sage-500">
                    Sender: {e.sender_name} · {e.current_step} of {stepCount} sent
                    {e.status === 'active' && e.next_send_at ? ` · next step ${when(e.next_send_at)}` : ''}
                    {e.stopped_reason ? ` · ${STOPPED_REASON_LABELS[e.stopped_reason] ?? e.stopped_reason}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${STATUS_STYLE[e.status]}`}>
                    {ENROLLMENT_STATUS_LABELS[e.status]}
                  </span>
                  {e.status === 'active' && (
                    <>
                      <button
                        type="button"
                        className="text-xs font-bold text-[#1e4836] hover:underline cursor-pointer disabled:opacity-50"
                        disabled={busyId === e.id}
                        aria-label={`Mark ${whoOf(e)} as replied`}
                        onClick={() => void act(e, 'replied')}
                      >
                        Mark replied
                      </button>
                      <button
                        type="button"
                        className="text-xs text-sage-500 hover:text-red-700 cursor-pointer disabled:opacity-50"
                        disabled={busyId === e.id}
                        aria-label={`Stop emailing ${whoOf(e)}`}
                        onClick={() => setToStop(e)}
                      >
                        Stop
                      </button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
          {total > PAGE && (
            <div className="flex items-center justify-between text-sm text-sage-600">
              <span>
                {offset + 1} to {Math.min(offset + items.length, total)} of {total}
              </span>
              <div className="flex gap-2">
                <button type="button" className={BTN_SECONDARY} disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - PAGE))}>
                  Previous
                </button>
                <button type="button" className={BTN_SECONDARY} disabled={offset + items.length >= total} onClick={() => setOffset(offset + PAGE)}>
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {toStop && (
        <ConfirmDialog
          title={`Stop emailing ${whoOf(toStop)}?`}
          body="No more steps of this sequence are sent to them. This cannot be undone."
          confirmLabel="Stop emails"
          cancelLabel="Keep going"
          danger
          busy={busyId === toStop.id}
          onConfirm={() => void act(toStop, 'stop')}
          onCancel={() => setToStop(null)}
        />
      )}
    </div>
  );
}
