'use client';

import React, { Suspense, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Lock, Plus, Users } from 'lucide-react';
import { useMeetings } from '@/hooks/useCalendarApi';
import { useWorkspace } from '@/components/workspace-context';
import { canManageCalendar, itemTimeLabel, longDate } from '@/lib/calendar-format';
import { dayKey } from '@/lib/marketing-calendar';
import { MeetingDrawer } from '@/components/calendar/meeting-drawer';
import { EventForm } from '@/components/calendar/event-form';
import { primaryBtn } from '@/components/calendar/drawer';

type When = 'upcoming' | 'past';

function MeetingsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const { role } = useWorkspace();
  const canManage = canManageCalendar(role);
  const [when, setWhen] = useState<When>('upcoming');
  const [creating, setCreating] = useState(false);
  const { data, loading, error, reload } = useMeetings(when);
  const openId = params.get('meeting');
  const list = data?.meetings ?? [];

  function open(id: string | null) {
    const q = new URLSearchParams(params.toString());
    if (id) q.set('meeting', id);
    else q.delete('meeting');
    router.replace(q.toString() ? `${pathname}?${q.toString()}` : pathname);
  }

  return (
    <main className="max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl md:text-3xl font-display text-ink-strong tracking-tight">Meetings</h1>
        <div className="flex items-center gap-2">
          <div role="tablist" aria-label="When" className="flex items-center gap-1 bg-white border border-line p-1 rounded-modal shadow-card">
            {(['upcoming', 'past'] as const).map((w) => (
              <button key={w} role="tab" aria-selected={when === w} onClick={() => setWhen(w)} className={`px-3 py-1 rounded-card text-xs font-semibold capitalize ${when === w ? 'bg-brand-strong text-white' : 'text-ink-muted hover:bg-surface-muted'}`}>{w}</button>
            ))}
          </div>
          {canManage && (
            <button type="button" onClick={() => setCreating(true)} className={`${primaryBtn} flex items-center gap-1.5 h-[36px]`}><Plus size={15} aria-hidden /> New meeting</button>
          )}
        </div>
      </div>

      {!canManage && <p className="text-xs text-ink-muted">You see the meetings you have been invited to. They are read-only.</p>}

      {loading && !data && <p role="status" className="text-xs text-ink-muted">Loading meetings…</p>}
      {error && !data && (
        <div role="alert" className="bg-danger-tint border border-danger-bold rounded-modal p-4 text-xs text-danger-bold flex items-center justify-between gap-3">
          <span>{error}</span>
          <button type="button" onClick={reload} className="font-semibold underline">Try again</button>
        </div>
      )}
      {data && list.length === 0 && (
        <div className="bg-white border border-line rounded-[24px] shadow-card p-10 text-center space-y-1">
          <p className="text-sm font-semibold text-ink">{when === 'upcoming' ? 'No upcoming meetings' : 'No past meetings'}</p>
          <p className="text-xs text-ink-muted">{canManage ? 'Create a meeting to invite people and get a summary afterwards.' : 'Meetings you are invited to will show up here.'}</p>
        </div>
      )}

      <ul className="space-y-3">
        {list.map((m) => (
          <li key={m.id}>
            <button type="button" onClick={() => open(m.id)} className="w-full text-left bg-white border border-line rounded-modal p-4 md:p-5 shadow-card flex flex-wrap items-center gap-x-6 gap-y-2 hover:border-line-strong transition-colors">
              <span className="text-xs font-semibold text-ink-subtle w-44 shrink-0">
                {longDate(m.event_date).replace(/ \d{4}$/, '')}
                <span className="block font-normal text-ink-muted">{itemTimeLabel({ all_day: false, start_time: m.start_time, end_time: m.end_time })}</span>
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold text-sm text-ink truncate">{m.title}</span>
                <span className="flex items-center gap-3 text-xs text-ink-muted mt-0.5">
                  <span className="inline-flex items-center gap-1"><Users size={12} aria-hidden />{m.attendees.length} {m.attendees.length === 1 ? 'attendee' : 'attendees'}</span>
                  {m.visibility === 'private' && <span className="inline-flex items-center gap-1"><Lock size={12} aria-hidden />Private</span>}
                </span>
              </span>
              {m.assistant_state === 'ready' && <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-brand-tint text-brand-strong">Summary ready</span>}
              {m.assistant_state === 'queued' && <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-surface-muted text-ink-muted">Writing summary…</span>}
            </button>
          </li>
        ))}
      </ul>

      {openId && <MeetingDrawer id={openId} onClose={() => open(null)} onChanged={reload} />}
      {creating && (
        <EventForm
          defaultMode="meeting"
          defaultDate={dayKey(new Date())}
          onClose={() => setCreating(false)}
          onSaved={() => {
            setCreating(false);
            reload();
          }}
        />
      )}
    </main>
  );
}

export default function MeetingsPage() {
  return (
    <Suspense fallback={<div role="status" aria-label="Loading" className="min-h-[50vh]" />}>
      <MeetingsContent />
    </Suspense>
  );
}
