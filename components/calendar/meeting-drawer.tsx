'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Calendar, Clock, ExternalLink, Lock, MapPin, Video } from 'lucide-react';
import { calendarApi, calendarErrorCode, calendarErrorMessage, type Attendee } from '@/lib/api/calendar';
import { useMeeting } from '@/hooks/useCalendarApi';
import { httpUrl, itemTimeLabel, longDate } from '@/lib/calendar-format';
import { Drawer, dangerBtn, inputClass, labelClass, primaryBtn, secondaryBtn } from './drawer';
import { EventForm } from './event-form';
import { useCalendarToast } from './toast';

const INVITE_LABEL: Record<string, string> = {
  pending: 'Invite queued',
  sent: 'Invite sent',
  failed: 'Invite failed',
};

function attendeeNote(a: Attendee): string {
  return a.internal ? 'Teammate' : INVITE_LABEL[a.invite_state] ?? a.invite_state;
}

export function MeetingDrawer({
  id,
  onClose,
  onChanged,
}: {
  id: string;
  onClose: () => void;
  /** A change was saved: the page should refresh its list or feed. */
  onChanged: () => void;
}) {
  const { data: m, loading, error, status, reload, timedOut } = useMeeting(id);
  const { toast, run } = useCalendarToast();
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);

  if (loading && !m) {
    return <Drawer label="Meeting" title="Meeting" onClose={onClose}><p role="status" className="text-xs text-ink-muted">Loading…</p></Drawer>;
  }
  if (!m) {
    return (
      <Drawer label="Meeting" title="Meeting" onClose={onClose}>
        <p role="alert" className="text-xs text-danger-bold">{status === 404 ? 'This meeting is not available. It may have been cancelled.' : error ?? 'Could not load the meeting.'}</p>
      </Drawer>
    );
  }

  if (editing) {
    return (
      <EventForm
        meeting={m}
        defaultDate={m.event_date}
        onClose={() => setEditing(false)}
        onSaved={() => {
          setEditing(false);
          reload();
          onChanged();
        }}
      />
    );
  }

  const video = httpUrl(m.video_url);
  const queued = m.assistant_state === 'queued';
  const unaddedCount = m.action_items.filter((a) => !a.task_id).length;
  const externalCount = m.attendees.filter((a) => !a.internal).length;

  async function startSummary() {
    setBusy(true);
    try {
      await calendarApi.runAssistant(m!.id, notes.trim());
      setNotes('');
      reload();
    } catch (e) {
      if (calendarErrorCode(e) === 'SUMMARY_IN_PROGRESS') reload();
      else toast(calendarErrorMessage(e), 'error');
    }
    setBusy(false);
  }

  async function addTasks(itemIds?: string[]) {
    setBusy(true);
    try {
      const res = await calendarApi.addToTasks(m!.id, itemIds);
      toast(res.created.length ? `${res.created.length} added to your roadmap tasks.` : 'Nothing new to add.');
      reload();
    } catch (e) {
      toast(calendarErrorCode(e) === 'NO_ROADMAP_MILESTONE' ? 'Create a roadmap milestone first.' : calendarErrorMessage(e), 'error');
    }
    setBusy(false);
  }

  async function remove() {
    setBusy(true);
    const r = await run(() => calendarApi.deleteMeeting(m!.id), 'Meeting cancelled.');
    setBusy(false);
    if (r.ok) {
      onChanged();
      onClose();
    }
  }

  return (
    <Drawer
      label={`Meeting: ${m.title}`}
      title={m.title}
      onClose={onClose}
      footer={
        m.can_manage ? (
          confirmDelete ? (
            <>
              <p className="text-xs text-ink basis-full">
                Cancel this meeting?{externalCount > 0 ? ' Outside attendees will be sent a cancellation.' : ''}
              </p>
              <button type="button" onClick={() => setConfirmDelete(false)} className={secondaryBtn}>Keep meeting</button>
              <button type="button" onClick={remove} disabled={busy} className={`${dangerBtn} ml-auto`}>Cancel meeting</button>
            </>
          ) : (
            <>
              <button type="button" onClick={() => setConfirmDelete(true)} className={dangerBtn}>Cancel meeting</button>
              <button type="button" onClick={() => setEditing(true)} className={`${primaryBtn} ml-auto`}>Edit</button>
            </>
          )
        ) : undefined
      }
    >
      <div className="space-y-2 text-xs text-ink">
        <p className="flex items-center gap-2"><Calendar size={14} className="text-ink-muted" aria-hidden />{longDate(m.event_date)}{m.end_date ? ` to ${longDate(m.end_date)}` : ''}</p>
        <p className="flex items-center gap-2"><Clock size={14} className="text-ink-muted" aria-hidden />{itemTimeLabel({ all_day: false, start_time: m.start_time, end_time: m.end_time })} ({m.timezone})</p>
        {m.location && <p className="flex items-center gap-2"><MapPin size={14} className="text-ink-muted" aria-hidden />{m.location}</p>}
        {video && (
          <p className="flex items-center gap-2"><Video size={14} className="text-ink-muted" aria-hidden />
            <a href={video} target="_blank" rel="noopener noreferrer" className="text-brand-strong underline">Join the call</a>
          </p>
        )}
        {m.visibility === 'private' && <p className="flex items-center gap-2 text-ink-muted"><Lock size={14} aria-hidden />Private: only you and the people invited can see this.</p>}
      </div>

      {m.description && <p className="text-xs text-ink whitespace-pre-wrap">{m.description}</p>}

      {m.agenda && (
        <section aria-label="Agenda" className="space-y-1">
          <h3 className={labelClass}>Agenda</h3>
          <p className="text-xs text-ink whitespace-pre-wrap">{m.agenda}</p>
        </section>
      )}

      <section aria-label="Attendees" className="space-y-2">
        <h3 className={labelClass}>Attendees</h3>
        {m.attendees.length === 0 ? (
          <p className="text-xs text-ink-muted">No one else is invited.</p>
        ) : (
          <ul className="divide-y divide-line border border-line rounded-card">
            {m.attendees.map((a) => (
              <li key={a.email} className="flex items-center justify-between gap-3 px-3 py-2 text-xs">
                <span className="min-w-0 truncate">{a.name ? `${a.name} · ` : ''}{a.email}</span>
                <span className={`shrink-0 text-[11px] ${a.invite_state === 'failed' && !a.internal ? 'text-danger-bold font-semibold' : 'text-ink-muted'}`}>{attendeeNote(a)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-label="Summary" className="space-y-3 border-t border-line pt-5">
        <h3 className={labelClass}>After the meeting</h3>

        {queued && !timedOut && <p role="status" className="text-xs text-ink-muted">Writing the summary… this takes a few seconds.</p>}
        {queued && timedOut && (
          <p role="alert" className="text-xs text-danger-bold">
            This is taking longer than expected. Check back in a minute.{' '}
            <button type="button" onClick={reload} className="underline font-semibold">Check now</button>
          </p>
        )}
        {m.assistant_state === 'failed' && <p role="alert" className="text-xs text-danger-bold">{m.assistant_error ?? 'The summary failed. Try again.'}</p>}

        {m.assistant_state === 'ready' && (
          <div className="space-y-4">
            <p className="text-[11px] text-ink-muted">AI-generated, check before sharing.</p>
            <p className="text-xs text-ink whitespace-pre-wrap">{m.summary}</p>
            {m.decisions.length > 0 && (
              <div className="space-y-1">
                <h4 className={labelClass}>Decisions</h4>
                <ul className="list-disc pl-4 text-xs text-ink space-y-0.5">{m.decisions.map((d, i) => <li key={i}>{d}</li>)}</ul>
              </div>
            )}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <h4 className={labelClass}>Action items</h4>
                {m.can_manage && unaddedCount > 0 && (
                  <button type="button" onClick={() => addTasks()} disabled={busy} className={secondaryBtn}>Add all to tasks</button>
                )}
              </div>
              {m.action_items.length === 0 ? (
                <p className="text-xs text-ink-muted">No action items were found.</p>
              ) : (
                <ul className="space-y-2">
                  {m.action_items.map((a) => (
                    <li key={a.id} className="flex items-center justify-between gap-3 border border-line rounded-card px-3 py-2 text-xs">
                      <span className="min-w-0">{a.title}</span>
                      {a.task_id ? (
                        <Link href="/roadmap" className="shrink-0 inline-flex items-center gap-1 text-brand-strong text-[11px] font-semibold">
                          Added <ExternalLink size={11} aria-hidden />
                        </Link>
                      ) : (
                        m.can_manage && (
                          <button type="button" onClick={() => addTasks([a.id])} disabled={busy} className="shrink-0 text-brand-strong text-[11px] font-semibold underline">
                            Add to tasks
                          </button>
                        )
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {m.transcript && (
              <details className="border border-line rounded-card px-3 py-2">
                <summary className="text-xs font-semibold cursor-pointer">Notes you pasted</summary>
                <p className="mt-2 text-xs text-ink-muted whitespace-pre-wrap">{m.transcript}</p>
              </details>
            )}
          </div>
        )}

        {m.assistant_state === 'idle' && !m.can_manage && <p className="text-xs text-ink-muted">No summary has been written yet.</p>}

        {m.can_manage && !queued && (
          <div className="space-y-2">
            <label htmlFor="mtg-notes" className="text-xs font-semibold text-ink">
              {m.assistant_state === 'ready' ? 'Summarise again from new notes' : 'Paste your notes or a transcript'}
            </label>
            <textarea id="mtg-notes" rows={5} className={inputClass} value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={60000} placeholder="At least 20 characters. The AI writes a summary, decisions and action items." />
            <button type="button" onClick={startSummary} disabled={busy || notes.trim().length < 20} className={primaryBtn}>
              {busy ? 'Starting…' : 'Summarise meeting'}
            </button>
          </div>
        )}
      </section>

      {!m.can_manage && <p className="text-[11px] text-ink-muted">You can read this meeting because you are invited. Only the team can change it.</p>}
    </Drawer>
  );
}
