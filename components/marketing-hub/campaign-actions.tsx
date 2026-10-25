'use client';

import React, { useState } from 'react';
import {
  channelsStartedByLaunch,
  deleteCampaign,
  listChannels,
  updateCampaign,
  type Campaign,
  type CampaignStatus,
} from '@/lib/api/marketing';
import { useToast } from '@/app/(dashboard)/marketing/ToastContext';
import { BTN_DANGER, BTN_PRIMARY, BTN_SECONDARY } from './states';
import { ConfirmDialog } from './confirm-dialog';

/**
 * Launch / Pause / Resume / Complete / Delete for one campaign. Completing is one-way and notifies the
 * team, and deleting cannot be undone, so both ask first. Launching a draft can move channels from
 * Not started to Testing (D-MKT-4); the toast says which, so the change is never silent.
 */
export function CampaignActions({
  campaign,
  onChanged,
  onDeleted,
  onEdit,
}: {
  campaign: Campaign;
  onChanged: () => void;
  onDeleted?: () => void;
  onEdit?: () => void;
}) {
  const { triggerToast, runAction } = useToast();
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState<'complete' | 'delete' | null>(null);

  const transition = async (next: CampaignStatus, message: string) => {
    setBusy(true);
    const launching = campaign.status === 'draft' && next === 'active';
    const res = await runAction(async () => {
      const before = launching ? await listChannels().catch(() => null) : null;
      const updated = await updateCampaign(campaign.id, { status: next });
      let notes: string[] = [];
      if (before) {
        const after = await listChannels().catch(() => null);
        if (after) notes = channelsStartedByLaunch(before, after);
      }
      return { updated, notes };
    });
    setBusy(false);
    if (res.ok) {
      triggerToast(res.value.notes.length ? `${message} ${res.value.notes.join(' ')}` : message);
      onChanged();
    }
  };

  const doDelete = async () => {
    setBusy(true);
    const res = await runAction(() => deleteCampaign(campaign.id), `Deleted "${campaign.name}".`);
    setBusy(false);
    setConfirm(null);
    if (res.ok) (onDeleted ?? onChanged)();
  };

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {campaign.status === 'draft' && (
          <button type="button" disabled={busy} onClick={() => void transition('active', `Launched "${campaign.name}".`)} className={BTN_PRIMARY}>
            Launch
          </button>
        )}
        {campaign.status === 'active' && (
          <>
            <button type="button" disabled={busy} onClick={() => void transition('paused', `Paused "${campaign.name}".`)} className={BTN_SECONDARY}>
              Pause
            </button>
            <button type="button" disabled={busy} onClick={() => setConfirm('complete')} className={BTN_SECONDARY}>
              Complete
            </button>
          </>
        )}
        {campaign.status === 'paused' && (
          <button type="button" disabled={busy} onClick={() => void transition('active', `Resumed "${campaign.name}".`)} className={BTN_PRIMARY}>
            Resume
          </button>
        )}
        {onEdit && campaign.status !== 'completed' && (
          <button type="button" disabled={busy} onClick={onEdit} className={BTN_SECONDARY}>
            Edit
          </button>
        )}
        <button type="button" disabled={busy} onClick={() => setConfirm('delete')} className={BTN_DANGER}>
          Delete
        </button>
      </div>

      {confirm === 'complete' && (
        <ConfirmDialog
          title={`Complete "${campaign.name}"?`}
          body="Completing a campaign is final. It cannot be reopened, and your team is notified that it ended."
          confirmLabel="Complete campaign"
          cancelLabel="Keep it running"
          busy={busy}
          onCancel={() => setConfirm(null)}
          onConfirm={async () => {
            setConfirm(null);
            await transition('completed', `Completed "${campaign.name}".`);
          }}
        />
      )}
      {confirm === 'delete' && (
        <ConfirmDialog
          title={`Delete "${campaign.name}"?`}
          body="This permanently deletes the campaign and cannot be undone."
          confirmLabel="Delete campaign"
          danger
          busy={busy}
          onCancel={() => setConfirm(null)}
          onConfirm={() => void doDelete()}
        />
      )}
    </>
  );
}
