'use client';

import React, { useState } from 'react';
import type { FeedItem } from '@/lib/api/calendar';
import {
  WEEKDAY_SHORT,
  addDays,
  dayHeading,
  itemsByDay,
  monthGridDays,
  AGENDA_DAYS,
  feedRange,
  itemTimeLabel,
} from '@/lib/calendar-format';
import { dayKey } from '@/lib/marketing-calendar';
import { ModalDialog } from '@/components/modal-dialog';
import { ItemChip, LAYER_ICON } from './layer-meta';
import { LAYER_STYLE } from '@/lib/calendar-format';
import { primaryBtn } from './drawer';

interface ViewProps {
  anchor: Date;
  today: Date;
  items: FeedItem[];
  onOpen: (item: FeedItem) => void;
  /** Start a new item on this day. */
  onAdd?: (day: string) => void;
}

const MAX_CHIPS = 3;

function DayDialog({ day, today, items, onOpen, onAdd, onClose }: { day: string; today: Date; items: FeedItem[]; onOpen: (i: FeedItem) => void; onAdd?: (d: string) => void; onClose: () => void }) {
  return (
    <ModalDialog
      label={dayHeading(day, today)}
      onClose={onClose}
      overlayClassName="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      className="bg-white border border-line rounded-[24px] p-5 shadow-accent w-full max-w-sm space-y-3 outline-none"
    >
      <h2 className="text-sm font-display text-ink">{dayHeading(day, today)}</h2>
      {items.length === 0 ? (
        <p className="text-xs text-ink-muted">Nothing scheduled.</p>
      ) : (
        <ul className="space-y-1.5">
          {items.map((i) => (
            <li key={i.id}>
              <ItemChip item={i} dayKey={day} showTime block onOpen={(it) => { onClose(); onOpen(it); }} />
            </li>
          ))}
        </ul>
      )}
      <div className="flex items-center justify-between pt-1">
        {onAdd ? <button type="button" className={primaryBtn} onClick={() => { onClose(); onAdd(day); }}>+ New on this day</button> : <span />}
        <button type="button" onClick={onClose} className="text-xs font-semibold text-ink-muted">Close</button>
      </div>
    </ModalDialog>
  );
}

export function MonthView({ anchor, today, items, onOpen, onAdd }: ViewProps) {
  const days = monthGridDays(anchor);
  const { from, to } = feedRange('month', anchor);
  const byDay = itemsByDay(items, from, to);
  const [openDay, setOpenDay] = useState<string | null>(null);
  const todayKey = dayKey(today);

  return (
    <>
      <div className="bg-white border border-line rounded-[24px] shadow-card overflow-hidden">
        <div className="grid grid-cols-7 border-b border-line bg-neutral-xf9f9f6 text-center">
          {WEEKDAY_SHORT.map((d) => <div key={d} className="py-3 text-[10px] font-bold text-ink-subtle tracking-wider">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 divide-x divide-y divide-line">
          {days.map((d) => {
            const key = dayKey(d);
            const inMonth = d.getMonth() === anchor.getMonth();
            const list = byDay.get(key) ?? [];
            const extra = list.length - MAX_CHIPS;
            return (
              <div key={key} className={`min-h-[64px] md:min-h-[110px] p-1 md:p-2 flex flex-col ${inMonth ? 'bg-white' : 'bg-neutral-xfcfcfb opacity-50'}`}>
                <button
                  type="button"
                  onClick={() => setOpenDay(key)}
                  aria-label={`${dayHeading(key, today)}, ${list.length} ${list.length === 1 ? 'item' : 'items'}`}
                  className="flex-1 flex flex-col items-stretch text-left"
                >
                  <span className={`text-xs font-medium self-start ${key === todayKey ? 'bg-brand-strong text-white w-5 h-5 rounded-full flex items-center justify-center font-bold' : 'text-ink-muted'}`}>{d.getDate()}</span>
                  {/* Phones: dots only, tap the day for the list. */}
                  <span className="md:hidden flex flex-wrap gap-0.5 mt-1" aria-hidden>
                    {list.slice(0, 4).map((i) => <span key={i.id} className={`w-1.5 h-1.5 rounded-full ${LAYER_STYLE[i.layer].dot}`} />)}
                  </span>
                </button>
                <div className="hidden md:block space-y-1 mt-1">
                  {list.slice(0, MAX_CHIPS).map((i) => <ItemChip key={i.id} item={i} dayKey={key} onOpen={onOpen} />)}
                  {extra > 0 && (
                    <button type="button" onClick={() => setOpenDay(key)} className="text-[10px] font-semibold text-brand-strong px-1">+{extra} more</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {openDay && <DayDialog day={openDay} today={today} items={byDay.get(openDay) ?? []} onOpen={onOpen} onAdd={onAdd} onClose={() => setOpenDay(null)} />}
    </>
  );
}

const FIRST_HOUR = 6;
const LAST_HOUR = 21;
const HOURS = Array.from({ length: LAST_HOUR - FIRST_HOUR + 1 }, (_, i) => FIRST_HOUR + i);

function hourOf(i: FeedItem): number | null {
  if (i.all_day || !i.start_time) return null;
  const h = Number(i.start_time.split(':')[0]);
  return Math.min(LAST_HOUR, Math.max(FIRST_HOUR, h));
}
const hourLabel = (h: number) => `${h % 12 === 0 ? 12 : h % 12} ${h >= 12 ? 'PM' : 'AM'}`;

export function WeekView({ anchor, today, items, onOpen }: ViewProps) {
  const start = addDays(anchor, -anchor.getDay());
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  const { from, to } = feedRange('week', anchor);
  const byDay = itemsByDay(items, from, to);
  const todayKey = dayKey(today);

  return (
    <>
      {/* Desktop: hour grid. */}
      <div className="hidden md:block bg-white border border-line rounded-[24px] shadow-card overflow-hidden">
        <div className="grid grid-cols-[64px_repeat(7,minmax(0,1fr))] border-b border-line bg-neutral-xf9f9f6 text-center">
          <div className="py-3 text-[10px] font-bold text-ink-subtle tracking-wider border-r border-line">TIME</div>
          {days.map((d) => (
            <div key={dayKey(d)} className="py-3 border-r border-line last:border-r-0">
              <span className="text-[10px] font-bold text-ink-subtle tracking-wider block">{WEEKDAY_SHORT[d.getDay()]}</span>
              <span className={`text-xs font-semibold mt-0.5 inline-flex items-center justify-center ${dayKey(d) === todayKey ? 'bg-brand-strong text-white w-5 h-5 rounded-full' : 'text-ink'}`}>{d.getDate()}</span>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-[64px_repeat(7,minmax(0,1fr))] border-b border-line">
          <div className="p-2 text-[10px] font-medium text-ink-subtle text-right bg-neutral-xfcfcfb border-r border-line">All day</div>
          {days.map((d) => {
            const key = dayKey(d);
            const list = (byDay.get(key) ?? []).filter((i) => hourOf(i) === null);
            return (
              <div key={key} className="p-1.5 space-y-1 border-r border-line last:border-r-0 min-h-[40px]">
                {list.map((i) => <ItemChip key={i.id} item={i} dayKey={key} onOpen={onOpen} />)}
              </div>
            );
          })}
        </div>
        <div className="divide-y divide-line">
          {HOURS.map((h) => (
            <div key={h} className="grid grid-cols-[64px_repeat(7,minmax(0,1fr))] min-h-[56px]">
              <div className="p-2 text-[10px] font-medium text-ink-subtle text-right pr-3 bg-neutral-xfcfcfb border-r border-line">{hourLabel(h)}</div>
              {days.map((d) => {
                const key = dayKey(d);
                const list = (byDay.get(key) ?? []).filter((i) => hourOf(i) === h);
                return (
                  <div key={key} className="p-1 space-y-1 border-r border-line last:border-r-0">
                    {list.map((i) => <ItemChip key={i.id} item={i} dayKey={key} onOpen={onOpen} block showTime={false} />)}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Phones: one day at a time, stacked. */}
      <div className="md:hidden space-y-4">
        {days.map((d) => {
          const key = dayKey(d);
          const list = byDay.get(key) ?? [];
          return (
            <section key={key} aria-label={dayHeading(key, today)} className="bg-white border border-line rounded-modal shadow-card p-4 space-y-2">
              <h2 className={`text-[11px] font-bold uppercase tracking-wider ${key === todayKey ? 'text-brand-strong' : 'text-ink-subtle'}`}>{dayHeading(key, today)}</h2>
              {list.length === 0 ? <p className="text-xs text-ink-muted">Nothing scheduled.</p> : list.map((i) => <ItemChip key={i.id} item={i} dayKey={key} onOpen={onOpen} block showTime />)}
            </section>
          );
        })}
      </div>
    </>
  );
}

export function AgendaView({ anchor, today, items, onOpen }: ViewProps) {
  const { from, to } = feedRange('agenda', anchor);
  const byDay = itemsByDay(items, from, to);
  const keys = [...byDay.keys()].sort();

  if (keys.length === 0) {
    return (
      <div className="bg-white border border-line rounded-[24px] shadow-card p-10 text-center space-y-1">
        <p className="text-sm font-semibold text-ink">Nothing scheduled</p>
        <p className="text-xs text-ink-muted">Nothing in the next {AGENDA_DAYS} days with these layers on.</p>
      </div>
    );
  }
  return (
    <div className="space-y-8">
      {keys.map((key) => (
        <section key={key} aria-label={dayHeading(key, today)} className="space-y-3">
          <h2 className="text-[10px] font-bold text-ink-subtle uppercase tracking-wider">{dayHeading(key, today)}</h2>
          <ul className="space-y-3">
            {(byDay.get(key) ?? []).map((i) => {
              const Icon = LAYER_ICON[i.layer];
              const content = (
                <>
                  <span className="text-xs font-semibold text-ink-subtle w-24 shrink-0">{itemTimeLabel(i)}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-xs text-ink truncate">{i.title}</span>
                    {i.status && <span className="block text-xs text-ink-muted mt-0.5 capitalize">{i.status.replace('_', ' ')}</span>}
                  </span>
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-semibold shrink-0 ${LAYER_STYLE[i.layer].chip.replace(/border-l-2|border-[a-z-]+/g, '')}`}>
                    <Icon size={11} aria-hidden />{i.layer === 'busy' ? 'Busy' : i.kind}
                  </span>
                </>
              );
              const cls = 'w-full bg-white border border-line rounded-modal p-4 shadow-card flex items-center gap-4 text-left';
              return (
                <li key={`${i.id}-${key}`}>
                  {i.layer === 'busy' ? <div className={cls}>{content}</div> : <button type="button" onClick={() => onOpen(i)} className={`${cls} hover:border-line-strong transition-colors`}>{content}</button>}
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
