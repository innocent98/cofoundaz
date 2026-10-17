'use client';

import React, { useMemo, useState } from 'react';
import { useCalendar } from '@/hooks/useMarketingApi';
import { useMarketingGeneration } from '@/hooks/useMarketingGeneration';
import {
  CHANNEL_KEYS,
  CHANNEL_LABELS,
  getPlanWeek,
  planDayToIso,
  startPlanWeek,
  fieldErrorsOf,
  marketingErrorMessage,
  type CalendarEntry,
  type ChannelKey,
  type ContentStatus,
  type PlanWeekEntry,
} from '@/lib/api/marketing';
import {
  BTN_ACCENT,
  BTN_DANGER,
  BTN_PRIMARY,
  BTN_SECONDARY,
  CARD,
  DataGate,
  EmptyState,
  GenerationNote,
  INPUT,
} from '@/components/marketing-hub/states';
import { Drawer, Field } from '@/components/marketing-hub/drawer';
import { useToast } from '../ToastContext';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const CHANNEL_COLOR: Record<ChannelKey, string> = {
  organic_social: 'bg-[#0e271f] text-white',
  paid_social: 'bg-[#9C5B34] text-white',
  search: 'bg-[#6E4326] text-white',
  email: 'bg-[#1e4836] text-white',
  content_seo: 'bg-[#46735e] text-white',
  partnerships: 'bg-[#266049] text-white',
  events: 'bg-[#522F1A] text-white',
  referral: 'bg-[#2E7256] text-white',
};

interface Draft {
  id: string | null;
  title: string;
  channel: ChannelKey;
  status: ContentStatus;
  body: string;
  scheduledLocal: string;
}

const pad = (n: number) => String(n).padStart(2, '0');

function toLocalInput(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function blankDraft(day?: Date): Draft {
  const base = day ?? new Date();
  return {
    id: null,
    title: '',
    channel: 'organic_social',
    status: 'draft',
    body: '',
    scheduledLocal: day ? `${base.getFullYear()}-${pad(base.getMonth() + 1)}-${pad(base.getDate())}T09:00` : '',
  };
}

function draftFromEntry(e: CalendarEntry): Draft {
  return {
    id: e.id,
    title: e.title,
    channel: e.channel,
    status: e.status,
    body: e.body ?? '',
    scheduledLocal: toLocalInput(e.scheduled_at),
  };
}

function localDayKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function MarketingCalendarPage() {
  const { triggerToast, runAction } = useToast();
  const [currentDate, setCurrentDate] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const cal = useCalendar(currentDate);
  const plan = useMarketingGeneration(startPlanWeek, getPlanWeek);

  const [draft, setDraft] = useState<Draft | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [proposals, setProposals] = useState<PlanWeekEntry[]>([]);
  const [planBase, setPlanBase] = useState<Date>(() => new Date());
  const [adding, setAdding] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();

  const byDay = useMemo(() => {
    const map = new Map<string, CalendarEntry[]>();
    for (const e of cal.entries) {
      if (!e.scheduled_at) continue;
      const key = localDayKey(e.scheduled_at);
      map.set(key, [...(map.get(key) ?? []), e]);
    }
    return map;
  }, [cal.entries]);

  const channelsInView = useMemo(
    () => CHANNEL_KEYS.filter((k) => cal.entries.some((e) => e.channel === k)),
    [cal.entries]
  );

  const openNew = (day?: Date) => {
    setFieldErrors({});
    setConfirmDelete(false);
    setDraft(blankDraft(day));
  };
  const openEdit = (e: CalendarEntry) => {
    setFieldErrors({});
    setConfirmDelete(false);
    setDraft(draftFromEntry(e));
  };
  const closeDrawer = () => setDraft(null);

  const save = async () => {
    if (!draft) return;
    if (!draft.title.trim()) {
      setFieldErrors({ title: 'Give the post a title.' });
      return;
    }
    if (draft.status === 'scheduled' && !draft.scheduledLocal) {
      setFieldErrors({ scheduled_at: 'A scheduled post needs a date and time.' });
      return;
    }
    const scheduled_at = draft.scheduledLocal ? new Date(draft.scheduledLocal).toISOString() : null;
    setSaving(true);
    setFieldErrors({});
    try {
      if (draft.id) {
        await cal.update(draft.id, {
          title: draft.title.trim(),
          channel: draft.channel,
          status: draft.status,
          body: draft.body || null,
          scheduled_at,
        });
        triggerToast('Post updated.');
      } else {
        await cal.create({
          title: draft.title.trim(),
          channel: draft.channel,
          status: draft.status,
          body: draft.body || null,
          scheduled_at,
        });
        triggerToast('Post added to your calendar.');
      }
      closeDrawer();
    } catch (err) {
      const fe = fieldErrorsOf(err);
      if (Object.keys(fe).length > 0) setFieldErrors(fe);
      triggerToast(marketingErrorMessage(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  const publish = async () => {
    if (!draft?.id) return;
    setSaving(true);
    const res = await runAction(() => cal.update(draft.id as string, { status: 'published' }), 'Post marked as published.');
    setSaving(false);
    if (res.ok) closeDrawer();
  };

  const remove = async () => {
    if (!draft?.id) return;
    setSaving(true);
    const res = await runAction(() => cal.remove(draft.id as string), 'Post deleted.');
    setSaving(false);
    if (res.ok) closeDrawer();
  };

  const startPlan = async () => {
    setProposals([]);
    const base = new Date();
    setPlanBase(base);
    const g = await plan.run();
    if (g) {
      const entries = g.output.entries ?? [];
      setProposals(entries);
      if (entries.length === 0) triggerToast('The AI did not propose any posts this time. Try again.', 'error');
    }
  };

  const addProposal = async (p: PlanWeekEntry): Promise<boolean> => {
    const res = await runAction(() =>
      cal.create({
        title: p.title,
        channel: p.channel,
        body: p.body,
        status: 'scheduled',
        scheduled_at: planDayToIso(planBase, p.day_offset),
      })
    );
    if (res.ok) setProposals((cur) => cur.filter((x) => x !== p));
    return res.ok;
  };

  const addAll = async () => {
    setAdding(true);
    let added = 0;
    for (const p of [...proposals]) {
      if (await addProposal(p)) added += 1;
      else break; // the failure toast already explained why; keep the rest for retry
    }
    setAdding(false);
    if (added > 0) triggerToast(`Added ${added} ${added === 1 ? 'post' : 'posts'} to your calendar.`);
  };

  const planning = plan.busy;
  const isEmpty = cal.entries.length === 0 && cal.backlog.length === 0;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl md:text-4xl font-display font-semibold text-sage-900 tracking-tight">
            Content calendar
          </h1>
          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
              className="text-xs font-semibold text-sage-500 hover:text-sage-900 px-2 py-1 rounded bg-sage-200/60 cursor-pointer"
            >
              ← Prev
            </button>
            <span className="text-sage-600 font-medium text-sm" aria-live="polite">
              {MONTH_NAMES[month]} {year}
            </span>
            <button
              type="button"
              onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
              className="text-xs font-semibold text-sage-500 hover:text-sage-900 px-2 py-1 rounded bg-sage-200/60 cursor-pointer"
            >
              Next →
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 self-start md:self-auto">
          <button type="button" onClick={() => openNew()} className={BTN_SECONDARY}>
            + New post
          </button>
          <button type="button" onClick={startPlan} disabled={planning} className={`${BTN_ACCENT} flex items-center gap-2`}>
            <span>✦</span>
            <span>{planning ? 'Planning...' : 'Plan my first week'}</span>
          </button>
        </div>
      </div>

      <GenerationNote
        phase={plan.phase}
        error={plan.error}
        generatingLabel="The AI is drafting a 7-day plan from your startup profile. This usually takes under a minute."
      />

      {proposals.length > 0 && (
        <section aria-label="AI proposed posts" className={`${CARD} p-6 space-y-4`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display font-semibold text-lg text-sage-900">AI proposed {proposals.length} {proposals.length === 1 ? 'post' : 'posts'}</h2>
              <p className="text-xs text-sage-500">Nothing is on your calendar until you add it.</p>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={addAll} disabled={adding} className={BTN_PRIMARY}>
                {adding ? 'Adding...' : 'Add all to calendar'}
              </button>
              <button type="button" onClick={() => setProposals([])} disabled={adding} className={BTN_SECONDARY}>
                Discard all
              </button>
            </div>
          </div>
          <ul className="divide-y divide-sage-100">
            {proposals.map((p, i) => (
              <li key={`${p.title}-${i}`} className="py-3 flex flex-col md:flex-row md:items-start justify-between gap-3">
                <div className="space-y-1 min-w-0">
                  <p className="text-sm font-semibold text-sage-900">{p.title}</p>
                  <p className="text-xs text-sage-500">
                    {CHANNEL_LABELS[p.channel]} · {new Date(planDayToIso(planBase, p.day_offset)).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-sage-700">{p.body}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button type="button" disabled={adding} onClick={() => void addProposal(p)} className={BTN_PRIMARY}>
                    Add
                  </button>
                  <button
                    type="button"
                    disabled={adding}
                    onClick={() => setProposals((cur) => cur.filter((x) => x !== p))}
                    className={BTN_SECONDARY}
                  >
                    Discard
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <DataGate status={cal.status} error={cal.error} onRetry={cal.reload} loadingLabel="Loading your calendar">
        {isEmpty && (
          <EmptyState
            title="Your calendar is empty"
            body="Add your first post, or let the AI draft a week of posts for you to review."
            cta={
              <button type="button" onClick={() => openNew()} className={BTN_ACCENT}>
                + Add your first post
              </button>
            }
          />
        )}

        {channelsInView.length > 0 && (
          <div className="flex flex-wrap items-center gap-6 text-xs text-sage-600 pt-1">
            {channelsInView.map((k) => (
              <div key={k} className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${CHANNEL_COLOR[k].split(' ')[0]}`}></span>
                <span className="font-medium">{CHANNEL_LABELS[k]}</span>
              </div>
            ))}
          </div>
        )}

        <div className="bg-white rounded-modal border border-sage-200/80 shadow-card overflow-hidden">
          <div className="grid grid-cols-7 bg-sage-50/80 border-b border-sage-200 text-center text-xs font-bold text-sage-500 uppercase tracking-wider py-3">
            {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>

          <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-sage-100">
            {Array.from({ length: firstDayIndex }).map((_, index) => (
              <div key={`empty-${index}`} className="min-h-[110px] bg-sage-50/30 p-2 opacity-40"></div>
            ))}

            {Array.from({ length: totalDays }).map((_, index) => {
              const dayNum = index + 1;
              const dayStr = `${year}-${pad(month + 1)}-${pad(dayNum)}`;
              const dayEvents = byDay.get(dayStr) ?? [];

              return (
                <div
                  key={dayNum}
                  className="min-h-[115px] p-2 bg-white flex flex-col justify-between hover:bg-sage-50/50 transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => openNew(new Date(year, month, dayNum))}
                    aria-label={`Add a post on ${MONTH_NAMES[month]} ${dayNum}`}
                    className="self-start text-xs font-semibold text-sage-700 hover:text-[#9C5B34] cursor-pointer"
                  >
                    {dayNum}
                  </button>

                  <div className="space-y-1 mt-1 flex-1">
                    {dayEvents.map((evt) => (
                      <button
                        type="button"
                        key={evt.id}
                        onClick={() => openEdit(evt)}
                        className={`block w-full text-left text-[11px] font-medium px-2 py-1 rounded-[6px] truncate shadow-card cursor-pointer ${CHANNEL_COLOR[evt.channel]} ${evt.status === 'published' ? 'opacity-70' : ''}`}
                        title={`${evt.title} (${evt.status})`}
                      >
                        {evt.title}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {cal.backlog.length > 0 && (
          <section aria-label="Unscheduled drafts" className={`${CARD} p-6 space-y-3`}>
            <h2 className="font-display font-semibold text-lg text-sage-900">Unscheduled drafts</h2>
            <ul className="divide-y divide-sage-100">
              {cal.backlog.map((e) => (
                <li key={e.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-sage-900 truncate">{e.title}</p>
                    <p className="text-xs text-sage-500">{CHANNEL_LABELS[e.channel]}</p>
                  </div>
                  <button type="button" onClick={() => openEdit(e)} className={BTN_SECONDARY}>
                    Edit
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
      </DataGate>

      {draft && (
        <Drawer
          title={draft.id ? 'Edit post' : 'New post'}
          onClose={closeDrawer}
          footer={
            <>
              {draft.id && draft.status !== 'published' && (
                <button type="button" onClick={publish} disabled={saving} className={BTN_SECONDARY}>
                  Mark published
                </button>
              )}
              <button type="button" onClick={save} disabled={saving} className={`${BTN_PRIMARY} flex-1`}>
                {saving ? 'Saving...' : draft.id ? 'Save changes' : 'Add post'}
              </button>
            </>
          }
        >
          <Field label="Title" htmlFor="cal-title" error={fieldErrors.title}>
            <input
              id="cal-title"
              className={INPUT}
              value={draft.title}
              maxLength={200}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            />
          </Field>
          <Field label="Channel" htmlFor="cal-channel" error={fieldErrors.channel}>
            <select
              id="cal-channel"
              className={INPUT}
              value={draft.channel}
              onChange={(e) => setDraft({ ...draft, channel: e.target.value as ChannelKey })}
            >
              {CHANNEL_KEYS.map((k) => (
                <option key={k} value={k}>
                  {CHANNEL_LABELS[k]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Status" htmlFor="cal-status" error={fieldErrors.status}>
            <select
              id="cal-status"
              className={INPUT}
              value={draft.status}
              onChange={(e) => setDraft({ ...draft, status: e.target.value as ContentStatus })}
            >
              <option value="draft">Draft</option>
              <option value="scheduled">Scheduled</option>
              <option value="published">Published</option>
            </select>
          </Field>
          <Field
            label="Date and time"
            htmlFor="cal-when"
            error={fieldErrors.scheduled_at}
            hint="Required when the post is scheduled."
          >
            <input
              id="cal-when"
              type="datetime-local"
              className={INPUT}
              value={draft.scheduledLocal}
              onChange={(e) => setDraft({ ...draft, scheduledLocal: e.target.value })}
            />
          </Field>
          <Field label="Post copy" htmlFor="cal-body" error={fieldErrors.body}>
            <textarea
              id="cal-body"
              rows={6}
              className={INPUT}
              value={draft.body}
              onChange={(e) => setDraft({ ...draft, body: e.target.value })}
            />
          </Field>

          {draft.id && (
            <div className="pt-2 border-t border-sage-200">
              {confirmDelete ? (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-sage-700">Delete this post permanently?</span>
                  <button type="button" onClick={remove} disabled={saving} className={BTN_DANGER}>
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
      )}
    </div>
  );
}
