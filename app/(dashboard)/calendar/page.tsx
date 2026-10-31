'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { replaceUrl } from '@/lib/replace-url';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useCalendarFeed, useEvent, useToday } from '@/hooks/useCalendarApi';
import type { FeedItem, FeedLayer } from '@/lib/api/calendar';
import {
  DEFAULT_LAYERS,
  LAYER_LABEL,
  LAYER_ORDER,
  LAYER_STORAGE_KEY,
  LAYER_STYLE,
  parseDay,
  parseSavedLayers,
  shiftView,
  viewLabel,
  type CalendarView,
} from '@/lib/calendar-format';
import { dayKey } from '@/lib/marketing-calendar';
import { LAYER_ICON } from '@/components/calendar/layer-meta';
import { AgendaView, MonthView, WeekView } from '@/components/calendar/views';
import { ItemDrawer } from '@/components/calendar/item-drawer';
import { EventForm } from '@/components/calendar/event-form';
import { primaryBtn, secondaryBtn } from '@/components/calendar/drawer';

const VIEWS: Array<{ id: CalendarView; label: string }> = [
  { id: 'month', label: 'Month' },
  { id: 'week', label: 'Week' },
  { id: 'agenda', label: 'Agenda' },
];

function isView(v: string | null): v is CalendarView {
  return v === 'month' || v === 'week' || v === 'agenda';
}

/** `?event=<id>` (the link in a reminder notification) opens that event or meeting. */
function DeepLinkDrawer({ id, canManage, onClose, onChanged }: { id: string; canManage: boolean; onClose: () => void; onChanged: () => void }) {
  const { data } = useEvent(id);
  if (!data) return null;
  const item: FeedItem = {
    id: data.id,
    layer: data.type === 'meeting' ? 'meeting' : 'team',
    kind: data.type,
    title: data.title,
    date: data.event_date,
    end_date: data.end_date,
    start_time: data.start_time,
    end_time: data.end_time,
    all_day: data.all_day,
    timezone: data.timezone,
    status: null,
    ref: { type: 'event', id: data.id },
    private: data.visibility === 'private',
  };
  return <ItemDrawer item={item} canManage={canManage} onClose={onClose} onChanged={onChanged} />;
}

function CalendarContent() {
  const pathname = usePathname();
  const params = useSearchParams();
  const today = useToday();

  const viewParam = params.get('view');
  const view: CalendarView = isView(viewParam) ? viewParam : 'month';
  const dateParam = params.get('date');
  const anchor = useMemo(() => {
    const d = dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? parseDay(dateParam) : today;
    return Number.isNaN(d.getTime()) ? today : d;
  }, [dateParam, today]);
  const eventParam = params.get('event');

  const [layers, setLayers] = useState<FeedLayer[]>(DEFAULT_LAYERS);
  useEffect(() => {
    try {
      const saved = parseSavedLayers(localStorage.getItem(LAYER_STORAGE_KEY));
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reading browser storage after mount
      if (saved) setLayers(saved);
    } catch {
      /* storage blocked: keep the defaults */
    }
  }, []);

  const [selected, setSelected] = useState<FeedItem | null>(null);
  const [creating, setCreating] = useState<{ day: string } | null>(null);
  const feed = useCalendarFeed(view, anchor);

  function go(next: { view?: CalendarView; date?: Date }) {
    const q = new URLSearchParams(params.toString());
    q.set('view', next.view ?? view);
    q.set('date', dayKey(next.date ?? anchor));
    q.delete('event');
    replaceUrl(`${pathname}?${q.toString()}`);
  }

  function toggleLayer(l: FeedLayer) {
    const next = layers.includes(l) ? layers.filter((x) => x !== l) : [...layers, l];
    setLayers(next);
    try {
      localStorage.setItem(LAYER_STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* storage blocked: the choice lasts for this visit */
    }
  }

  const items = useMemo(() => (feed.data?.items ?? []).filter((i) => layers.includes(i.layer)), [feed.data, layers]);
  const counts = feed.data?.counts;
  const viewProps = { anchor, today, items, onOpen: setSelected, onAdd: (day: string) => setCreating({ day }) };

  return (
    <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl md:text-3xl font-display text-ink-strong tracking-tight">{viewLabel(view, anchor)}</h1>
          <div className="flex items-center gap-1 border border-line rounded-card bg-white p-0.5 shadow-card">
            <button type="button" aria-label="Previous" onClick={() => go({ date: shiftView(view, anchor, -1) })} className="p-1.5 hover:bg-surface-muted rounded text-ink-muted"><ChevronLeft size={16} /></button>
            <button type="button" aria-label="Next" onClick={() => go({ date: shiftView(view, anchor, 1) })} className="p-1.5 hover:bg-surface-muted rounded text-ink-muted"><ChevronRight size={16} /></button>
          </div>
          <button type="button" onClick={() => go({ date: today })} className={secondaryBtn}>Today</button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div role="tablist" aria-label="View" className="flex items-center gap-1 bg-white border border-line p-1 rounded-modal shadow-card">
            {VIEWS.map((v) => (
              <button
                key={v.id}
                role="tab"
                aria-selected={view === v.id}
                onClick={() => go({ view: v.id })}
                className={`px-3 py-1 rounded-card text-xs font-semibold transition-colors ${view === v.id ? 'bg-brand-strong text-white' : 'text-ink-muted hover:bg-surface-muted'}`}
              >
                {v.label}
              </button>
            ))}
          </div>
          <button type="button" onClick={() => setCreating({ day: dayKey(today) })} className={`${primaryBtn} flex items-center gap-1.5 h-[36px]`}>
            <Plus size={15} aria-hidden /> New
          </button>
        </div>
      </div>

      <div role="group" aria-label="Layers" className="flex flex-wrap gap-2">
        {LAYER_ORDER.map((l) => {
          const on = layers.includes(l);
          const Icon = LAYER_ICON[l];
          return (
            <button
              key={l}
              type="button"
              aria-pressed={on}
              onClick={() => toggleLayer(l)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${on ? 'bg-white border-line-strong text-ink' : 'bg-surface-muted border-line text-ink-muted line-through decoration-1'}`}
            >
              <span className={`w-2 h-2 rounded-full ${LAYER_STYLE[l].dot}`} aria-hidden />
              <Icon size={12} aria-hidden />
              {LAYER_LABEL[l]}
              {counts && <span className="text-[10px] text-ink-subtle">{counts[l]}</span>}
            </button>
          );
        })}
      </div>

      {feed.error && !feed.data && (
        <div role="alert" className="bg-danger-tint border border-danger-bold rounded-modal p-4 text-xs text-danger-bold flex items-center justify-between gap-3">
          <span>{feed.error}</span>
          <button type="button" onClick={feed.reload} className="font-semibold underline">Try again</button>
        </div>
      )}
      {feed.loading && !feed.data && <p role="status" className="text-xs text-ink-muted">Loading your calendar…</p>}

      {(feed.data || (!feed.loading && !feed.error)) && (
        <div className={feed.loading ? 'opacity-60 transition-opacity' : ''} aria-busy={feed.loading}>
          {view === 'month' && <MonthView {...viewProps} />}
          {view === 'week' && <WeekView {...viewProps} />}
          {view === 'agenda' && <div className="max-w-5xl mx-auto"><AgendaView {...viewProps} /></div>}
        </div>
      )}

      {selected && <ItemDrawer item={selected} canManage onClose={() => setSelected(null)} onChanged={feed.reload} />}
      {!selected && eventParam && (
        <DeepLinkDrawer
          id={eventParam}
          canManage
          onClose={() => {
            const q = new URLSearchParams(params.toString());
            q.delete('event');
            replaceUrl(q.toString() ? `${pathname}?${q.toString()}` : pathname);
          }}
          onChanged={feed.reload}
        />
      )}
      {creating && (
        <EventForm
          defaultDate={creating.day}
          onClose={() => setCreating(null)}
          onSaved={() => {
            setCreating(null);
            feed.reload();
          }}
        />
      )}
    </main>
  );
}

export default function CalendarPage() {
  return (
    <Suspense fallback={<div role="status" aria-label="Loading" className="min-h-[50vh]" />}>
      <CalendarContent />
    </Suspense>
  );
}
