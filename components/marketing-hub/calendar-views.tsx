'use client';

import React, { useState } from 'react';
import { Check, GripVertical } from 'lucide-react';
import { CHANNEL_LABELS, type CalendarEntry } from '@/lib/api/marketing';
import { dayKey, monthName, timeLabel, weekDays } from '@/lib/marketing-calendar';
import { BTN_SECONDARY } from './states';
import { CHANNEL_COLOR, ChannelIcon } from './channel-icon';

const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

export interface MoveRequest {
  entryId: string;
  /** Local midnight of the day to move to. */
  target: Date;
}

interface ViewProps {
  byDay: Map<string, CalendarEntry[]>;
  onOpenPost: (e: CalendarEntry) => void;
  onAddOnDay: (day: Date) => void;
  onMove: (m: MoveRequest) => void;
}

const DRAG_MIME = 'application/x-cofoundaz-post';

/** A published post is history: it cannot be rescheduled by dragging. */
const canDrag = (e: CalendarEntry) => e.status !== 'published';

function statusWord(e: CalendarEntry): string {
  return e.status === 'published' ? 'Marked published' : e.status === 'scheduled' ? 'Scheduled' : 'Draft';
}

export function PostChip({
  entry,
  showTime,
  onOpen,
  onMove,
}: {
  entry: CalendarEntry;
  showTime?: boolean;
  onOpen: (e: CalendarEntry) => void;
  onMove?: (m: MoveRequest) => void;
}) {
  const draggable = canDrag(entry) && !!onMove;
  const published = entry.status === 'published';

  // Keyboard alternative to dragging: Alt + arrow keys move the post a day (left/right) or a week (up/down).
  const onKeyDown = (ev: React.KeyboardEvent<HTMLButtonElement>) => {
    if (!draggable || !ev.altKey || !entry.scheduled_at) return;
    const step = ev.key === 'ArrowLeft' ? -1 : ev.key === 'ArrowRight' ? 1 : ev.key === 'ArrowUp' ? -7 : ev.key === 'ArrowDown' ? 7 : 0;
    if (!step) return;
    ev.preventDefault();
    const d = new Date(entry.scheduled_at);
    onMove?.({ entryId: entry.id, target: new Date(d.getFullYear(), d.getMonth(), d.getDate() + step) });
  };

  return (
    <button
      type="button"
      draggable={draggable}
      onDragStart={(ev) => {
        ev.dataTransfer.setData(DRAG_MIME, entry.id);
        ev.dataTransfer.setData('text/plain', entry.id);
        ev.dataTransfer.effectAllowed = 'move';
      }}
      onKeyDown={onKeyDown}
      onClick={() => onOpen(entry)}
      title={`${entry.title}. ${CHANNEL_LABELS[entry.channel]}. ${statusWord(entry)}.${draggable && entry.scheduled_at ? ' Drag to another day, or hold Alt and use the arrow keys, to reschedule.' : ''}`}
      className={`flex w-full items-center gap-1.5 text-left text-[11px] font-medium px-2 py-1 rounded-[6px] shadow-card ${draggable ? 'cursor-grab' : 'cursor-pointer'} ${CHANNEL_COLOR[entry.channel]} ${published ? 'opacity-75' : ''} ${entry.status === 'draft' ? 'outline-dashed outline-1 outline-white/60 -outline-offset-2' : ''}`}
    >
      <ChannelIcon channel={entry.channel} className="h-3 w-3" />
      {showTime && entry.scheduled_at && <span className="tabular-nums opacity-90">{timeLabel(entry.scheduled_at)}</span>}
      <span className="truncate flex-1">{entry.title}</span>
      {published && <Check className="h-3 w-3 shrink-0" aria-hidden="true" />}
      <span className="sr-only">
        {CHANNEL_LABELS[entry.channel]}, {statusWord(entry)}
      </span>
    </button>
  );
}

function DayCell({
  day,
  muted,
  entries,
  onOpenPost,
  onAddOnDay,
  onMove,
  tall,
  showTime,
}: {
  day: Date;
  muted?: boolean;
  entries: CalendarEntry[];
  tall?: boolean;
  showTime?: boolean;
} & Omit<ViewProps, 'byDay'>) {
  const [over, setOver] = useState(false);
  const label = `${monthName(day.getMonth())} ${day.getDate()}`;
  return (
    <div
      onDragOver={(ev) => {
        if (ev.dataTransfer.types.includes(DRAG_MIME)) {
          ev.preventDefault();
          ev.dataTransfer.dropEffect = 'move';
          setOver(true);
        }
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(ev) => {
        setOver(false);
        const id = ev.dataTransfer.getData(DRAG_MIME);
        if (!id) return;
        ev.preventDefault();
        onMove({ entryId: id, target: day });
      }}
      className={`${tall ? 'min-h-[260px]' : 'min-h-[115px]'} p-2 flex flex-col gap-1 transition-colors ${over ? 'bg-copper-100/60 ring-2 ring-inset ring-[#9C5B34]' : muted ? 'bg-sage-50/30' : 'bg-white hover:bg-sage-50/50'}`}
    >
      <button
        type="button"
        onClick={() => onAddOnDay(day)}
        aria-label={`Add a post on ${label}`}
        className="self-start text-xs font-semibold text-sage-700 hover:text-[#9C5B34] cursor-pointer min-h-6 min-w-6"
      >
        {day.getDate()}
      </button>
      <div className="space-y-1 flex-1">
        {entries.map((evt) => (
          <PostChip key={evt.id} entry={evt} showTime={showTime} onOpen={onOpenPost} onMove={onMove} />
        ))}
      </div>
    </div>
  );
}

export function MonthGrid({ anchor, ...rest }: ViewProps & { anchor: Date }) {
  const year = anchor.getFullYear();
  const month = anchor.getMonth();
  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();
  return (
    <div className="bg-white rounded-modal border border-sage-200/80 shadow-card overflow-hidden" role="group" aria-label={`${monthName(month)} ${year}, month view`}>
      <div className="grid grid-cols-7 bg-sage-50/80 border-b border-sage-200 text-center text-xs font-bold text-sage-500 uppercase tracking-wider py-3">
        {WEEKDAYS.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-sage-100">
        {Array.from({ length: firstDayIndex }).map((_, i) => (
          <div key={`empty-${i}`} className="min-h-[110px] bg-sage-50/30 opacity-40" />
        ))}
        {Array.from({ length: totalDays }).map((_, i) => {
          const day = new Date(year, month, i + 1);
          return <DayCell key={i} day={day} entries={rest.byDay.get(dayKey(day)) ?? []} {...rest} />;
        })}
      </div>
    </div>
  );
}

export function WeekGrid({ anchor, ...rest }: ViewProps & { anchor: Date }) {
  const days = weekDays(anchor);
  return (
    <div className="bg-white rounded-modal border border-sage-200/80 shadow-card overflow-hidden" role="group" aria-label="Week view">
      <div className="grid grid-cols-7 bg-sage-50/80 border-b border-sage-200 text-center text-xs font-bold text-sage-500 uppercase tracking-wider py-3">
        {days.map((d) => (
          <span key={d.toISOString()}>{WEEKDAYS[d.getDay()]}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 divide-x divide-sage-100">
        {days.map((d) => (
          <DayCell key={d.toISOString()} day={d} tall showTime entries={rest.byDay.get(dayKey(d)) ?? []} {...rest} />
        ))}
      </div>
    </div>
  );
}

/** The phone layout: a plain dated list, readable at 375 where grid chips truncate to a letter. */
export function Agenda({
  byDay,
  onOpenPost,
  emptyLabel,
}: {
  byDay: Map<string, CalendarEntry[]>;
  onOpenPost: (e: CalendarEntry) => void;
  emptyLabel: string;
}) {
  const days = [...byDay.keys()].sort();
  if (days.length === 0) {
    return <p className="rounded-modal border border-sage-200/80 bg-white p-5 text-sm text-sage-600 shadow-card">{emptyLabel}</p>;
  }
  return (
    <ol aria-label="Agenda" className="space-y-4">
      {days.map((key) => {
        const [y, m, d] = key.split('-').map(Number);
        const date = new Date(y, m - 1, d);
        return (
          <li key={key} className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-sage-500">
              {date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
            </h3>
            <ul className="space-y-2">
              {(byDay.get(key) ?? []).map((e) => (
                <li key={e.id}>
                  <button
                    type="button"
                    onClick={() => onOpenPost(e)}
                    className="flex w-full items-center gap-3 rounded-card border border-sage-200/80 bg-white p-3 text-left shadow-card cursor-pointer"
                  >
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-card ${CHANNEL_COLOR[e.channel]}`}>
                      <ChannelIcon channel={e.channel} className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-sage-900">{e.title}</span>
                      <span className="block text-xs text-sage-500">
                        {CHANNEL_LABELS[e.channel]} · {e.scheduled_at ? timeLabel(e.scheduled_at) : 'No time'} · {statusWord(e)}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </li>
        );
      })}
    </ol>
  );
}

export function Legend({ channels }: { channels: CalendarEntry['channel'][] }) {
  if (channels.length === 0) return null;
  return (
    <ul aria-label="Channels in this view" className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-sage-600 pt-1">
      {channels.map((k) => (
        <li key={k} className="flex items-center gap-2">
          <span className={`flex h-5 w-5 items-center justify-center rounded-[6px] ${CHANNEL_COLOR[k]}`}>
            <ChannelIcon channel={k} className="h-3 w-3" />
          </span>
          <span className="font-medium">{CHANNEL_LABELS[k]}</span>
        </li>
      ))}
    </ul>
  );
}

/** Drag handle hint for the unscheduled drafts list. */
export function DraftRow({
  entry,
  onOpen,
}: {
  entry: CalendarEntry;
  onOpen: (e: CalendarEntry) => void;
}) {
  return (
    <li
      draggable
      onDragStart={(ev) => {
        ev.dataTransfer.setData(DRAG_MIME, entry.id);
        ev.dataTransfer.setData('text/plain', entry.id);
        ev.dataTransfer.effectAllowed = 'move';
      }}
      className="py-2.5 flex items-center justify-between gap-3"
    >
      <div className="min-w-0 flex items-center gap-2">
        <GripVertical className="hidden md:block h-4 w-4 shrink-0 text-sage-600" aria-hidden="true" />
        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-[6px] ${CHANNEL_COLOR[entry.channel]}`}>
          <ChannelIcon channel={entry.channel} className="h-3.5 w-3.5" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-sage-900 truncate">{entry.title}</p>
          <p className="text-xs text-sage-500">{CHANNEL_LABELS[entry.channel]}</p>
        </div>
      </div>
      <button type="button" onClick={() => onOpen(entry)} className={BTN_SECONDARY}>
        Edit
      </button>
    </li>
  );
}
