'use client';

import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ApiError } from '@/lib/api/client';
import { useCalendar, useCampaigns } from '@/hooks/useMarketingApi';
import { useMarketingGeneration } from '@/hooks/useMarketingGeneration';
import {
  CHANNEL_KEYS,
  getCalendarEntry,
  isUuid,
  getPlanWeek,
  planDayToIso,
  startPlanWeek,
  fieldErrorsOf,
  marketingErrorMessage,
  type CalendarEntry,
  type PlanWeekEntry,
} from '@/lib/api/marketing';
import {
  groupByDay,
  moveToDay,
  rangeLabel,
  shiftAnchor,
  type CalendarView,
  weekAnchorForMonth,
} from '@/lib/marketing-calendar';
import {
  BTN_ACCENT,
  BTN_PRIMARY,
  BTN_SECONDARY,
  CARD,
  DataGate,
  EmptyState,
  GenerationNote,
} from '@/components/marketing-hub/states';
import { ChannelLabel } from '@/components/marketing-hub/channel-icon';
import { Agenda, DraftRow, Legend, MonthGrid, WeekGrid, type MoveRequest } from '@/components/marketing-hub/calendar-views';
import { PostDrawer, blankPostDraft, draftFromEntry, type PostDraft } from '@/components/marketing-hub/post-drawer';
import { useToast } from '../ToastContext';

/** A post still marked "scheduled" once its time passes is flipped to published by the server within a minute or two. */
const REFRESH_MS = 60_000;

function CalendarWorkbench() {
  const params = useSearchParams();
  const entryParam = params.get('entry');
  const { triggerToast, runAction } = useToast();
  const [anchor, setAnchor] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [view, setView] = useState<CalendarView>('month');
  const cal = useCalendar(anchor, view);
  const { campaigns } = useCampaigns();
  const plan = useMarketingGeneration(startPlanWeek, getPlanWeek);

  const [draft, setDraft] = useState<PostDraft | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [proposals, setProposals] = useState<PlanWeekEntry[]>([]);
  const [planBase, setPlanBase] = useState<Date>(() => new Date());
  const [adding, setAdding] = useState(false);

  const byDay = useMemo(() => groupByDay(cal.entries), [cal.entries]);
  const channelsInView = useMemo(
    () => CHANNEL_KEYS.filter((k) => cal.entries.some((e) => e.channel === k)),
    [cal.entries]
  );

  // ---- keep "scheduled" chips honest: refetch on focus and every minute while one is due
  const reloadRef = useRef(cal.reload);
  const entriesRef = useRef(cal.entries);
  useEffect(() => {
    reloadRef.current = cal.reload;
    entriesRef.current = cal.entries;
  }, [cal.reload, cal.entries]);
  useEffect(() => {
    const due = () =>
      entriesRef.current.some((e) => e.status === 'scheduled' && e.scheduled_at && new Date(e.scheduled_at).getTime() <= Date.now() + 5_000);
    const tick = () => {
      if (due()) reloadRef.current();
    };
    const timer = setInterval(tick, REFRESH_MS);
    const onFocus = () => reloadRef.current();
    window.addEventListener('focus', onFocus);
    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  // ---- notification deep link: /marketing/calendar?entry={id} opens that post's drawer
  useEffect(() => {
    if (!entryParam) return;
    if (!isUuid(entryParam)) {
      window.history.replaceState(null, '', '/marketing/calendar');
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const e = await getCalendarEntry(entryParam);
        if (cancelled) return;
        if (e.scheduled_at) {
          const d = new Date(e.scheduled_at);
          setAnchor(view === 'week' ? d : new Date(d.getFullYear(), d.getMonth(), 1));
        }
        setFieldErrors({});
        setDraft(draftFromEntry(e));
      } catch (err) {
        if (!cancelled) {
          const gone = err instanceof ApiError && err.status === 404;
          triggerToast(gone ? 'That post no longer exists. It may have been deleted.' : marketingErrorMessage(err, 'That post could not be opened.'), 'error');
        }
      } finally {
        // Drop ?entry= so closing the drawer (or a refresh) does not reopen it. Next syncs replaceState with its router.
        if (!cancelled) window.history.replaceState(null, '', '/marketing/calendar');
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only the link itself should re-run this
  }, [entryParam]);

  const openNew = (day?: Date) => {
    setFieldErrors({});
    setDraft(blankPostDraft(day));
  };
  const openEdit = (e: CalendarEntry) => {
    setFieldErrors({});
    setDraft(draftFromEntry(e));
  };
  const closeDrawer = useCallback(() => setDraft(null), []);

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
    if (draft.status === 'scheduled' && scheduled_at && new Date(scheduled_at).getTime() <= Date.now()) {
      setFieldErrors({
        scheduled_at: 'That time has passed, and a scheduled post in the past is marked published straight away. Pick a later time, or set the status to Published.',
      });
      return;
    }
    const payload = {
      title: draft.title.trim(),
      channel: draft.channel,
      status: draft.status,
      body: draft.body || null,
      scheduled_at,
      campaign_id: draft.campaignId || null,
      media_id: draft.media?.id ?? null,
    };
    setSaving(true);
    setFieldErrors({});
    try {
      if (draft.id) {
        await cal.update(draft.id, payload);
        triggerToast('Post updated.');
      } else {
        await cal.create(payload);
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

  // ---- drag to reschedule (and Alt + arrows, the keyboard alternative)
  const move = async ({ entryId, target }: MoveRequest) => {
    const entry = [...cal.entries, ...cal.backlog].find((e) => e.id === entryId);
    if (!entry || entry.status === 'published') return;
    const scheduled_at = moveToDay(entry.scheduled_at, target);
    if (entry.status === 'scheduled' && new Date(scheduled_at).getTime() <= Date.now()) {
      triggerToast('Pick a later time. A scheduled post in the past is marked published straight away.', 'error');
      return;
    }
    const when = new Date(scheduled_at).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
    await runAction(() => cal.update(entry.id, { scheduled_at }), `Moved "${entry.title}" to ${when}.`);
  };

  // ---- Plan my first week
  const startPlan = async () => {
    setProposals([]);
    setPlanBase(new Date());
    const g = await plan.run();
    if (g) {
      const entries = g.output.entries ?? [];
      setProposals(entries);
      if (entries.length === 0) triggerToast('The AI did not propose any posts this time. Try again.', 'error');
    }
  };

  /** A proposal whose 9:00 has already passed today is added as a draft, not scheduled into the past. */
  const proposalWhen = (p: PlanWeekEntry) => {
    const iso = planDayToIso(planBase, p.day_offset);
    return { iso, late: new Date(iso).getTime() <= Date.now() };
  };

  const addProposal = async (p: PlanWeekEntry): Promise<boolean> => {
    const { iso, late } = proposalWhen(p);
    const res = await runAction(() =>
      cal.create({
        title: p.title,
        channel: p.channel,
        body: p.body,
        status: late ? 'draft' : 'scheduled',
        scheduled_at: iso,
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
  const label = rangeLabel(view, anchor);
  const planLabel = isEmpty ? 'Plan my first week' : 'Plan another week';

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl md:text-4xl font-display font-semibold text-sage-900 tracking-tight">Content calendar</h1>
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="button"
              onClick={() => setAnchor(shiftAnchor(view, anchor, -1))}
              aria-label={view === 'week' ? 'Previous week' : 'Previous month'}
              className="text-xs font-semibold text-sage-700 hover:text-sage-900 px-3 py-2 rounded bg-sage-200/60 cursor-pointer"
            >
              ← Prev
            </button>
            <span className="text-sage-600 font-medium text-sm min-w-32 text-center" aria-live="polite">
              {label}
            </span>
            <button
              type="button"
              onClick={() => setAnchor(shiftAnchor(view, anchor, 1))}
              aria-label={view === 'week' ? 'Next week' : 'Next month'}
              className="text-xs font-semibold text-sage-700 hover:text-sage-900 px-3 py-2 rounded bg-sage-200/60 cursor-pointer"
            >
              Next →
            </button>
            <button
              type="button"
              onClick={() => {
                const now = new Date();
                setAnchor(view === 'week' ? now : new Date(now.getFullYear(), now.getMonth(), 1));
              }}
              className="text-xs font-semibold text-sage-600 hover:text-sage-900 px-3 py-2 cursor-pointer"
            >
              Today
            </button>
            <div role="group" aria-label="Calendar view" className="hidden md:flex rounded-full border border-sage-200 bg-white p-0.5 text-xs font-semibold">
              {(['month', 'week'] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  aria-pressed={view === v}
                  onClick={() => {
                    setView(v);
                    setAnchor(v === 'month' ? new Date(anchor.getFullYear(), anchor.getMonth(), 1) : weekAnchorForMonth(anchor, new Date()));
                  }}
                  className={`rounded-full px-3 py-1.5 capitalize cursor-pointer ${view === v ? 'bg-[#0e271f] text-white' : 'text-sage-600 hover:text-sage-900'}`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 self-start md:self-auto">
          <button type="button" onClick={() => openNew()} className={BTN_SECONDARY}>
            + New post
          </button>
          <button type="button" onClick={startPlan} disabled={planning} className={`${BTN_ACCENT} flex items-center gap-2`}>
            <span aria-hidden="true">✦</span>
            <span>{planning ? 'Planning...' : planLabel}</span>
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
            {proposals.map((p, i) => {
              const { iso, late } = proposalWhen(p);
              return (
                <li key={`${p.title}-${i}`} className="py-3 flex flex-col md:flex-row md:items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <p className="text-sm font-semibold text-sage-900">{p.title}</p>
                    <p className="text-xs text-sage-500 flex flex-wrap items-center gap-x-2">
                      <ChannelLabel channel={p.channel} />
                      <span>{new Date(iso).toLocaleDateString()}</span>
                      {late && <span>Added as a draft, 9:00 has passed today</span>}
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
              );
            })}
          </ul>
        </section>
      )}

      <DataGate status={cal.status} error={cal.error} onRetry={cal.reload} loadingLabel="Loading your calendar">
        {isEmpty && (
          <EmptyState
            title="An empty calendar is a silent brand."
            body="Let the AI draft a week of posts for you to review, or add your own."
            cta={
              <div className="flex flex-wrap justify-center gap-3">
                <button type="button" onClick={startPlan} disabled={planning} className={BTN_ACCENT}>
                  ✦ Plan my first week
                </button>
                <button type="button" onClick={() => openNew()} className={BTN_SECONDARY}>
                  + Add a post
                </button>
              </div>
            }
          />
        )}

        <Legend channels={channelsInView} />

        <div className="hidden md:block">
          {view === 'month' ? (
            <MonthGrid anchor={anchor} byDay={byDay} onOpenPost={openEdit} onAddOnDay={openNew} onMove={move} />
          ) : (
            <WeekGrid anchor={anchor} byDay={byDay} onOpenPost={openEdit} onAddOnDay={openNew} onMove={move} />
          )}
        </div>
        <div className="md:hidden">
          <Agenda byDay={byDay} onOpenPost={openEdit} emptyLabel={`Nothing planned for ${label}.`} />
        </div>

        <p className="text-xs text-sage-500">
          Status only, not posted to a platform. Cofoundaz marks a scheduled post published when its time passes; it never
          sends anything to Instagram, X, LinkedIn or any other service.
          <span className="hidden md:inline"> Drag a post to another day to reschedule it, or hold Alt and use the arrow keys.</span>
        </p>

        {cal.backlog.length > 0 && (
          <section aria-label="Unscheduled drafts" className={`${CARD} p-6 space-y-3`}>
            <h2 className="font-display font-semibold text-lg text-sage-900">Unscheduled drafts</h2>
            <p className="hidden md:block text-xs text-sage-500">Drag a draft onto a day to give it a date.</p>
            <ul className="divide-y divide-sage-100">
              {cal.backlog.map((e) => (
                <DraftRow key={e.id} entry={e} onOpen={openEdit} />
              ))}
            </ul>
          </section>
        )}
      </DataGate>

      {draft && (
        <PostDrawer
          draft={draft}
          onChange={setDraft}
          campaigns={campaigns}
          errors={fieldErrors}
          saving={saving}
          onSave={save}
          onPublish={publish}
          onDelete={remove}
          onClose={closeDrawer}
        />
      )}
    </div>
  );
}

export default function MarketingCalendarPage() {
  return (
    <Suspense fallback={null}>
      <CalendarWorkbench />
    </Suspense>
  );
}
