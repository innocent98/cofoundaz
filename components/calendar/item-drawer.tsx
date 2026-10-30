'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Calendar, Clock, Lock, MapPin, Video } from 'lucide-react';
import { calendarApi, type FeedItem } from '@/lib/api/calendar';
import { useEvent } from '@/hooks/useCalendarApi';
import { externalHref, httpUrl, itemTimeLabel, longDate } from '@/lib/calendar-format';
import { Drawer, dangerBtn, primaryBtn, secondaryBtn } from './drawer';
import { EventForm } from './event-form';
import { MeetingDrawer } from './meeting-drawer';
import { useCalendarToast } from './toast';

const STATUS_LABEL: Record<string, string> = {
  on_track: 'On track',
  at_risk: 'At risk',
  complete: 'Complete',
  not_started: 'Not started',
  scheduled: 'Scheduled',
  published: 'Published',
};

function EventDrawer({ id, canManage, onClose, onChanged }: { id: string; canManage: boolean; onClose: () => void; onChanged: () => void }) {
  const { data: ev, loading, error, reload } = useEvent(id);
  const { run } = useCalendarToast();
  const [editing, setEditing] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!ev) {
    return (
      <Drawer label="Event" title="Event" onClose={onClose}>
        <p role={loading ? 'status' : 'alert'} className={`text-xs ${loading ? 'text-ink-muted' : 'text-danger-bold'}`}>{loading ? 'Loading…' : error ?? 'Could not load the event.'}</p>
      </Drawer>
    );
  }
  if (editing) {
    return (
      <EventForm
        event={ev}
        defaultDate={ev.event_date}
        onClose={() => setEditing(false)}
        onSaved={() => {
          setEditing(false);
          reload();
          onChanged();
        }}
      />
    );
  }
  const video = httpUrl(ev.video_url);

  async function remove() {
    setBusy(true);
    const r = await run(() => calendarApi.deleteEvent(ev!.id), 'Event deleted.');
    setBusy(false);
    if (r.ok) {
      onChanged();
      onClose();
    }
  }

  return (
    <Drawer
      label={`Event: ${ev.title}`}
      title={ev.title}
      onClose={onClose}
      footer={
        canManage ? (
          confirm ? (
            <>
              <p className="text-xs text-ink basis-full">Delete this event? This cannot be undone.</p>
              <button type="button" onClick={() => setConfirm(false)} className={secondaryBtn}>Keep event</button>
              <button type="button" onClick={remove} disabled={busy} className={`${dangerBtn} ml-auto`}>Delete event</button>
            </>
          ) : (
            <>
              <button type="button" onClick={() => setConfirm(true)} className={dangerBtn}>Delete</button>
              <button type="button" onClick={() => setEditing(true)} className={`${primaryBtn} ml-auto`}>Edit</button>
            </>
          )
        ) : undefined
      }
    >
      <p className="text-[11px] font-bold uppercase tracking-wider text-ink-subtle">{ev.type}</p>
      <div className="space-y-2 text-xs text-ink">
        <p className="flex items-center gap-2"><Calendar size={14} className="text-ink-muted" aria-hidden />{longDate(ev.event_date)}{ev.end_date ? ` to ${longDate(ev.end_date)}` : ''}</p>
        <p className="flex items-center gap-2"><Clock size={14} className="text-ink-muted" aria-hidden />{itemTimeLabel(ev)} ({ev.timezone})</p>
        {ev.location && <p className="flex items-center gap-2"><MapPin size={14} className="text-ink-muted" aria-hidden />{ev.location}</p>}
        {video && <p className="flex items-center gap-2"><Video size={14} className="text-ink-muted" aria-hidden /><a href={video} target="_blank" rel="noopener noreferrer" className="text-brand-strong underline">Open the link</a></p>}
        {ev.visibility === 'private' && <p className="flex items-center gap-2 text-ink-muted"><Lock size={14} aria-hidden />Private: only you and the people invited can see this.</p>}
      </div>
      {ev.description && <p className="text-xs text-ink whitespace-pre-wrap">{ev.description}</p>}
    </Drawer>
  );
}

function InfoDrawer({ item, onClose }: { item: FeedItem; onClose: () => void }) {
  const href = externalHref(item);
  const isExternal = item.layer === 'external';
  return (
    <Drawer label={item.title} title={item.title} onClose={onClose}>
      <div className="space-y-2 text-xs text-ink">
        <p className="flex items-center gap-2"><Calendar size={14} className="text-ink-muted" aria-hidden />{longDate(item.date)}{item.end_date ? ` to ${longDate(item.end_date)}` : ''}</p>
        <p className="flex items-center gap-2"><Clock size={14} className="text-ink-muted" aria-hidden />{itemTimeLabel(item)}</p>
        {item.status && <p>Status: <span className="font-semibold">{STATUS_LABEL[item.status] ?? item.status}</span></p>}
      </div>
      {isExternal && (
        <p className="text-xs text-ink-muted flex items-center gap-2"><Lock size={14} aria-hidden />From your Google Calendar. Only you can see the details; teammates see a busy block.</p>
      )}
      {href && (
        <Link href={href} className={`${primaryBtn} inline-block`}>
          {item.ref?.type === 'milestone' ? 'Open in Roadmap' : 'Open in Marketing'}
        </Link>
      )}
    </Drawer>
  );
}

/** The right drawer for whatever was clicked, by layer. Busy blocks never reach here (they are not clickable). */
export function ItemDrawer({ item, canManage, onClose, onChanged }: { item: FeedItem; canManage: boolean; onClose: () => void; onChanged: () => void }) {
  if (item.ref?.type === 'event' && item.kind === 'meeting') {
    return <MeetingDrawer id={item.ref.id} onClose={onClose} onChanged={onChanged} />;
  }
  if (item.ref?.type === 'event') {
    return <EventDrawer id={item.ref.id} canManage={canManage} onClose={onClose} onChanged={onChanged} />;
  }
  return <InfoDrawer item={item} onClose={onClose} />;
}
