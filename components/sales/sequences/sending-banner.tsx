'use client';

import React, { useState } from 'react';
import { useToast } from '@/app/(dashboard)/sales/ToastContext';
import { useWorkspace } from '@/components/workspace-context';
import { resumeSending, type SendingStatus } from '@/lib/api/sales';
import { BTN_ACCENT, CARD } from '../shared';

/**
 * Where sending stands for the workspace: not set up (nothing is sent), paused after a bounce spike
 * (founders can resume), or live with today's usage against the daily cap.
 */
export function SendingBanner({ status, onChanged }: { status: SendingStatus; onChanged: () => void }) {
  const { role } = useWorkspace();
  const { runAction } = useToast();
  const [busy, setBusy] = useState(false);

  const resume = async () => {
    setBusy(true);
    const res = await runAction(resumeSending, 'Sending resumed');
    setBusy(false);
    if (res.ok) onChanged();
  };

  if (!status.configured) {
    return (
      <div role="status" className={`${CARD} p-4 border-copper-200 bg-copper-50/40`}>
        <p className="text-sm font-semibold text-sage-900">Sending isn&apos;t set up yet</p>
        <p className="text-sm text-sage-600">
          You can build sequences and enrol people now. Nothing is sent until outreach email is connected for this workspace.
        </p>
      </div>
    );
  }

  if (status.paused) {
    return (
      <div role="alert" className="rounded-modal border border-red-200 bg-red-50 p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-red-800">Sales emails are paused</p>
          <p className="text-sm text-red-700">
            {status.paused_reason === 'bounces'
              ? 'Too many emails bounced, so sending stopped for the whole workspace. Check your lists, then resume.'
              : 'Sending is paused for this workspace.'}
          </p>
          {role !== 'founder' && <p className="text-sm text-red-700">Ask a founder to resume sending.</p>}
        </div>
        {role === 'founder' && (
          <button type="button" className={BTN_ACCENT} disabled={busy} onClick={() => void resume()}>
            {busy ? 'Resuming...' : 'Resume sending'}
          </button>
        )}
      </div>
    );
  }

  const pct = Math.min(100, Math.round((status.sent_today / Math.max(1, status.daily_cap)) * 100));
  return (
    <div className={`${CARD} p-4 flex flex-wrap items-center gap-x-6 gap-y-2`}>
      <p className="text-sm font-semibold text-sage-900">
        Sending from {status.domain ?? 'your outreach mailbox'}
      </p>
      <div className="flex items-center gap-3 min-w-[200px]">
        <div
          role="progressbar"
          aria-label="Emails sent today"
          aria-valuemin={0}
          aria-valuemax={status.daily_cap}
          aria-valuenow={status.sent_today}
          className="h-2 w-40 rounded-full bg-sage-100 overflow-hidden"
        >
          <div className="h-full bg-[#1e4836]" style={{ width: `${pct}%` }} />
        </div>
        <span className="text-sm text-sage-700">
          {status.sent_today} of {status.daily_cap} sent today
        </span>
      </div>
      <p className="text-xs text-sage-500">If a day&apos;s limit is reached, the next step simply goes out the next day.</p>
    </div>
  );
}
