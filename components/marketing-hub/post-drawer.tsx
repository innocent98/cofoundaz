'use client';

import React, { useState } from 'react';
import {
  CHANNEL_KEYS,
  CHANNEL_LABELS,
  type Campaign,
  type CalendarEntry,
  type ChannelKey,
  type ContentStatus,
  type MarketingMedia,
} from '@/lib/api/marketing';
import { toLocalInput } from '@/lib/marketing-calendar';
import { BTN_DANGER, BTN_PRIMARY, BTN_SECONDARY, INPUT } from './states';
import { Drawer, Field } from './drawer';
import { MediaSlot } from './media-slot';
import { WriteWithAi } from './write-with-ai';

export interface PostDraft {
  id: string | null;
  title: string;
  channel: ChannelKey;
  status: ContentStatus;
  body: string;
  scheduledLocal: string;
  campaignId: string;
  media: MarketingMedia | null;
  publishedAt: string | null;
}

export const blankPostDraft = (day?: Date): PostDraft => ({
  id: null,
  title: '',
  channel: 'organic_social',
  status: 'draft',
  body: '',
  scheduledLocal: day ? toLocalInput(new Date(day.getFullYear(), day.getMonth(), day.getDate(), 9, 0).toISOString()) : '',
  campaignId: '',
  media: null,
  publishedAt: null,
});

export const draftFromEntry = (e: CalendarEntry): PostDraft => ({
  id: e.id,
  title: e.title,
  channel: e.channel,
  status: e.status,
  body: e.body ?? '',
  scheduledLocal: toLocalInput(e.scheduled_at),
  campaignId: e.campaign_id ?? '',
  media: e.media ?? null,
  publishedAt: e.published_at,
});

export function PostDrawer({
  draft,
  onChange,
  campaigns,
  errors,
  saving,
  onSave,
  onPublish,
  onDelete,
  onClose,
}: {
  draft: PostDraft;
  onChange: (d: PostDraft) => void;
  campaigns: Campaign[];
  errors: Record<string, string>;
  saving: boolean;
  onSave: () => void;
  onPublish: () => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  return (
    <Drawer
      title={draft.id ? 'Edit post' : 'New post'}
      onClose={onClose}
      footer={
        <>
          {draft.id && draft.status !== 'published' && (
            <button type="button" onClick={onPublish} disabled={saving} className={BTN_SECONDARY}>
              Mark published
            </button>
          )}
          <button type="button" onClick={onSave} disabled={saving} className={`${BTN_PRIMARY} flex-1`}>
            {saving ? 'Saving...' : draft.id ? 'Save changes' : 'Add post'}
          </button>
        </>
      }
    >
      <p className="text-xs text-neutral-600 rounded-card bg-neutral-50 border border-neutral-200 p-3">
        Status only, not posted to a platform. Cofoundaz does not post to Instagram, X, LinkedIn or anywhere else.
        Published here means you marked it published, or its scheduled time passed and it was marked for you.
      </p>
      {draft.status === 'published' && draft.publishedAt && (
        <p className="text-sm font-medium text-neutral-800">
          Marked published at {new Date(draft.publishedAt).toLocaleString()}
        </p>
      )}
      <Field label="Title" htmlFor="cal-title" error={errors.title}>
        <input
          id="cal-title"
          className={INPUT}
          value={draft.title}
          maxLength={200}
          onChange={(e) => onChange({ ...draft, title: e.target.value })}
        />
      </Field>
      <Field label="Channel" htmlFor="cal-channel" error={errors.channel} hint="One channel per post. To post on two channels, duplicate the post.">
        <select
          id="cal-channel"
          className={INPUT}
          value={draft.channel}
          onChange={(e) => onChange({ ...draft, channel: e.target.value as ChannelKey })}
        >
          {CHANNEL_KEYS.map((k) => (
            <option key={k} value={k}>
              {CHANNEL_LABELS[k]}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Status" htmlFor="cal-status" error={errors.status}>
        <select
          id="cal-status"
          className={INPUT}
          value={draft.status}
          onChange={(e) => onChange({ ...draft, status: e.target.value as ContentStatus })}
        >
          <option value="draft">Draft</option>
          <option value="scheduled">Scheduled</option>
          <option value="published">Published</option>
        </select>
      </Field>
      <Field
        label="Date and time"
        htmlFor="cal-when"
        error={errors.scheduled_at}
        hint="Required when the post is scheduled. This is also how you move a post without dragging it."
      >
        <input
          id="cal-when"
          type="datetime-local"
          className={INPUT}
          value={draft.scheduledLocal}
          onChange={(e) => onChange({ ...draft, scheduledLocal: e.target.value })}
        />
      </Field>
      <Field label="Campaign" htmlFor="cal-campaign" error={errors.campaign_id}>
        <select
          id="cal-campaign"
          className={INPUT}
          value={draft.campaignId}
          onChange={(e) => onChange({ ...draft, campaignId: e.target.value })}
        >
          <option value="">No campaign</option>
          {campaigns.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Post copy" htmlFor="cal-body" error={errors.body}>
        <textarea
          id="cal-body"
          rows={6}
          className={INPUT}
          value={draft.body}
          onChange={(e) => onChange({ ...draft, body: e.target.value })}
        />
      </Field>
      <WriteWithAi
        title={draft.title}
        channel={draft.channel}
        campaignId={draft.campaignId || null}
        onUse={(text) => onChange({ ...draft, body: text })}
      />
      <MediaSlot media={draft.media} onChange={(media) => onChange({ ...draft, media })} />
      {errors.media_id && <p role="alert" className="text-xs text-danger-700">{errors.media_id}</p>}

      {draft.id && (
        <div className="pt-2 border-t border-neutral-200">
          {confirmDelete ? (
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm text-neutral-700">Delete this post permanently?</span>
              <button type="button" onClick={onDelete} disabled={saving} className={BTN_DANGER}>
                Yes, delete
              </button>
              <button type="button" onClick={() => setConfirmDelete(false)} className={BTN_SECONDARY}>
                Keep it
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => setConfirmDelete(true)} className={BTN_DANGER}>
              Delete post
            </button>
          )}
        </div>
      )}
    </Drawer>
  );
}
