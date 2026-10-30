'use client';

import React, { useState } from 'react';
import {
  calendarApi,
  calendarErrorMessage,
  calendarFieldErrors,
  type CalendarEvent,
  type EventType,
  type Meeting,
  type Visibility,
} from '@/lib/api/calendar';
import { Drawer, Field, inputClass, labelClass, primaryBtn, secondaryBtn } from './drawer';
import { useCalendarToast } from './toast';

export const TIMEZONES = [
  'Africa/Lagos', 'Africa/Accra', 'Africa/Nairobi', 'Africa/Johannesburg', 'Africa/Cairo',
  'Europe/London', 'America/New_York', 'UTC',
];

type Mode = 'event' | 'meeting';

interface Props {
  /** Edit an existing event or meeting; omit to create. */
  event?: CalendarEvent | null;
  meeting?: Meeting | null;
  /** Day (YYYY-MM-DD) the new item starts on. */
  defaultDate: string;
  /** Which form a new item opens on. */
  defaultMode?: Mode;
  onClose: () => void;
  /** Called after a successful save. */
  onSaved: () => void;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Parse "a@x.com, b@y.com" or one per line into trimmed, lower-cased, de-duplicated emails. */
export function parseEmails(raw: string): { emails: string[]; invalid: string[] } {
  const parts = raw.split(/[\s,;]+/).map((p) => p.trim().toLowerCase()).filter(Boolean);
  const seen = new Set<string>();
  const emails: string[] = [];
  const invalid: string[] = [];
  for (const p of parts) {
    if (!EMAIL_RE.test(p)) invalid.push(p);
    else if (!seen.has(p)) {
      seen.add(p);
      emails.push(p);
    }
  }
  return { emails, invalid };
}

export function EventForm({ event, meeting, defaultDate, defaultMode = 'event', onClose, onSaved }: Props) {
  const editing = event ?? meeting ?? null;
  const [mode, setMode] = useState<Mode>(meeting ? 'meeting' : event ? (event.type === 'meeting' ? 'meeting' : 'event') : defaultMode);
  const src = meeting ?? event;
  const [title, setTitle] = useState(src?.title ?? '');
  const [type, setType] = useState<EventType>(event && event.type !== 'meeting' ? event.type : 'task');
  const [date, setDate] = useState(src?.event_date ?? defaultDate);
  const [endDate, setEndDate] = useState(src?.end_date ?? '');
  const [allDay, setAllDay] = useState(event?.all_day ?? false);
  const [start, setStart] = useState(src?.start_time ?? (mode === 'meeting' ? '10:00' : ''));
  const [end, setEnd] = useState(src?.end_time ?? '');
  const [tz, setTz] = useState(src?.timezone ?? 'Africa/Lagos');
  const [location, setLocation] = useState(src?.location ?? '');
  const [videoUrl, setVideoUrl] = useState(src?.video_url ?? '');
  const [description, setDescription] = useState(src?.description ?? '');
  const [visibility, setVisibility] = useState<Visibility>(src?.visibility ?? 'team');
  const [agenda, setAgenda] = useState(meeting?.agenda ?? '');
  const [attendees, setAttendees] = useState((meeting?.attendees ?? []).map((a) => a.email).join(', '));
  const [assistant, setAssistant] = useState(meeting?.assistant_enabled ?? true);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const { toast } = useCalendarToast();

  const isMeeting = mode === 'meeting';
  const zones = TIMEZONES.includes(tz) ? TIMEZONES : [tz, ...TIMEZONES];
  const parsed = parseEmails(attendees);
  const externalCount = (meeting?.attendees ?? []).filter((a) => !a.internal).length;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = 'Add a title.';
    if (isMeeting && !start) errs.start_time = 'Pick a start time.';
    if (parsed.invalid.length) errs.attendees = `Not an email address: ${parsed.invalid.join(', ')}`;
    if (Object.keys(errs).length) {
      setFields(errs);
      return;
    }
    setFields({});
    setSaving(true);
    try {
      const common = {
        title: title.trim(),
        event_date: date,
        end_date: endDate || null,
        timezone: tz,
        location: location.trim() || null,
        video_url: videoUrl.trim() || null,
        description: description.trim() || null,
        visibility,
      };
      if (isMeeting) {
        const body = {
          ...common,
          start_time: start,
          end_time: end || null,
          agenda: agenda.trim() || null,
          attendees: parsed.emails.map((email) => ({ email })),
          assistant_enabled: assistant,
        };
        if (editing) {
          await calendarApi.updateMeeting(editing.id, body);
          toast(externalCount > 0 ? 'Meeting saved. Attendees will be sent an update.' : 'Meeting saved.');
        } else {
          await calendarApi.createMeeting(body);
          toast(parsed.emails.length ? 'Meeting created. Invites are on their way.' : 'Meeting created.');
        }
      } else {
        const body = {
          ...common,
          type,
          all_day: allDay,
          start_time: allDay ? null : start || null,
          end_time: allDay ? null : end || null,
        };
        if (editing) {
          await calendarApi.updateEvent(editing.id, body);
          toast('Event saved.');
        } else {
          await calendarApi.createEvent(body);
          toast('Event created.');
        }
      }
      onSaved();
    } catch (err) {
      const fe = calendarFieldErrors(err);
      const { '': general, ...named } = fe;
      setFields(named);
      setFormError(general ?? (Object.keys(named).length ? null : calendarErrorMessage(err)));
      setSaving(false);
    }
  }

  const heading = editing ? (isMeeting ? 'Edit meeting' : 'Edit event') : isMeeting ? 'New meeting' : 'New event';

  return (
    <Drawer
      label={heading}
      title={heading}
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} className={secondaryBtn}>Cancel</button>
          <button type="submit" form="calendar-event-form" disabled={saving} className={`${primaryBtn} ml-auto`}>
            {saving ? 'Saving…' : editing ? 'Save changes' : isMeeting ? 'Create meeting' : 'Create event'}
          </button>
        </>
      }
    >
      <form id="calendar-event-form" onSubmit={submit} className="space-y-4" noValidate>
        {!editing && (
          <div role="group" aria-label="What are you adding" className="grid grid-cols-2 gap-2">
            {(['event', 'meeting'] as const).map((m) => (
              <button
                type="button"
                key={m}
                aria-pressed={mode === m}
                onClick={() => {
                  setMode(m);
                  if (m === 'meeting' && !start) setStart('10:00');
                }}
                className={`py-1.5 rounded-card text-xs font-semibold capitalize border transition-all ${mode === m ? 'bg-brand-x1c3b2b text-white border-brand-x1c3b2b' : 'bg-white text-ink-muted border-line hover:bg-surface-muted'}`}
              >
                {m}
              </button>
            ))}
          </div>
        )}

        <Field label="Title" htmlFor="ev-title" error={fields.title}>
          <input id="ev-title" className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} placeholder={isMeeting ? 'e.g. Investor intro call' : 'e.g. VAT filing'} />
        </Field>

        {!isMeeting && (
          <div className="space-y-1">
            <span className={labelClass}>Type</span>
            <div role="group" aria-label="Event type" className="grid grid-cols-3 gap-2">
              {(['task', 'deadline', 'milestone'] as const).map((t) => (
                <button
                  type="button"
                  key={t}
                  aria-pressed={type === t}
                  onClick={() => setType(t)}
                  className={`py-1.5 rounded-card text-xs font-semibold capitalize border transition-all ${type === t ? 'bg-brand-x1c3b2b text-white border-brand-x1c3b2b' : 'bg-white text-ink-muted border-line hover:bg-surface-muted'}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Field label="Date" htmlFor="ev-date" error={fields.event_date}>
            <input id="ev-date" type="date" className={inputClass} value={date} onChange={(e) => setDate(e.target.value)} required />
          </Field>
          <Field label="Ends on (optional)" htmlFor="ev-end-date" error={fields.end_date}>
            <input id="ev-end-date" type="date" className={inputClass} value={endDate} min={date} onChange={(e) => setEndDate(e.target.value)} />
          </Field>
        </div>

        {!isMeeting && (
          <label className="flex items-center gap-2 text-xs text-ink">
            <input type="checkbox" checked={allDay} onChange={(e) => setAllDay(e.target.checked)} />
            All day
          </label>
        )}

        {!allDay && (
          <div className="grid grid-cols-2 gap-3">
            <Field label={isMeeting ? 'Starts' : 'Starts (optional)'} htmlFor="ev-start" error={fields.start_time}>
              <input id="ev-start" type="time" className={inputClass} value={start} onChange={(e) => setStart(e.target.value)} />
            </Field>
            <Field label="Ends (optional)" htmlFor="ev-end" error={fields.end_time}>
              <input id="ev-end" type="time" className={inputClass} value={end} onChange={(e) => setEnd(e.target.value)} />
            </Field>
          </div>
        )}

        <Field label="Time zone" htmlFor="ev-tz" error={fields.timezone}>
          <select id="ev-tz" className={inputClass} value={tz} onChange={(e) => setTz(e.target.value)}>
            {zones.map((z) => <option key={z} value={z}>{z}</option>)}
          </select>
        </Field>

        <Field label="Location (optional)" htmlFor="ev-loc" error={fields.location}>
          <input id="ev-loc" className={inputClass} value={location} onChange={(e) => setLocation(e.target.value)} maxLength={300} />
        </Field>
        <Field label="Video link (optional)" htmlFor="ev-video" error={fields.video_url}>
          <input id="ev-video" type="url" className={inputClass} value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://meet.google.com/…" />
        </Field>
        <Field label="Description (optional)" htmlFor="ev-desc" error={fields.description}>
          <textarea id="ev-desc" rows={3} className={inputClass} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={2000} />
        </Field>

        {isMeeting && (
          <>
            <Field label="Attendees (emails, separated by commas)" htmlFor="ev-att" error={fields.attendees}>
              <textarea id="ev-att" rows={2} className={inputClass} value={attendees} onChange={(e) => setAttendees(e.target.value)} placeholder="ada@startup.com, investor@fund.com" />
              <p className="text-[11px] text-ink-muted">Teammates are notified in the app. People outside your workspace get an email invite with a calendar file.</p>
            </Field>
            <Field label="Agenda (optional)" htmlFor="ev-agenda" error={fields.agenda}>
              <textarea id="ev-agenda" rows={3} className={inputClass} value={agenda} onChange={(e) => setAgenda(e.target.value)} />
            </Field>
            <label className="flex items-start gap-2 text-xs text-ink">
              <input type="checkbox" className="mt-0.5" checked={assistant} onChange={(e) => setAssistant(e.target.checked)} />
              <span>
                Summarise this meeting afterwards
                <span className="block text-[11px] text-ink-muted">After the call, paste your notes and the AI writes the summary, decisions and action items. It does not join the call.</span>
              </span>
            </label>
          </>
        )}

        <div className="space-y-1">
          <span className={labelClass}>Who can see this</span>
          <div role="group" aria-label="Visibility" className="grid grid-cols-2 gap-2">
            {(['team', 'private'] as const).map((v) => (
              <button
                type="button"
                key={v}
                aria-pressed={visibility === v}
                onClick={() => setVisibility(v)}
                className={`py-1.5 rounded-card text-xs font-semibold border transition-all ${visibility === v ? 'bg-brand-x1c3b2b text-white border-brand-x1c3b2b' : 'bg-white text-ink-muted border-line hover:bg-surface-muted'}`}
              >
                {v === 'team' ? 'Whole team' : 'Only me and invitees'}
              </button>
            ))}
          </div>
        </div>

        {editing && isMeeting && externalCount > 0 && (
          <p className="text-[11px] text-ink-muted">Changing the title, time, place or video link emails the outside attendees an update.</p>
        )}
        {formError && <p role="alert" className="text-xs text-danger-bold">{formError}</p>}
      </form>
    </Drawer>
  );
}
