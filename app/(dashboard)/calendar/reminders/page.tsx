'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useReminderRules } from '@/hooks/useCalendarApi';
import { calendarApi, type ReminderKind, type ReminderRule } from '@/lib/api/calendar';
import {
  REMINDER_KIND_HINT,
  REMINDER_KIND_LABEL,
  offsetLabel,
  toOffsetMinutes,
  type OffsetUnit,
} from '@/lib/calendar-format';
import { inputClass, primaryBtn, secondaryBtn } from '@/components/calendar/drawer';
import { useCalendarToast } from '@/components/calendar/toast';

const sameOffsets = (a: number[], b: number[]) => a.length === b.length && a.every((v, i) => v === b[i]);
const desc = (xs: number[]) => [...xs].sort((a, b) => b - a);

function RuleCard({ rule, canEdit, onSaved }: { rule: ReminderRule; canEdit: boolean; onSaved: () => void }) {
  const { run } = useCalendarToast();
  const [offsets, setOffsets] = useState<number[]>(desc(rule.offsets_minutes));
  const [value, setValue] = useState('1');
  const [unit, setUnit] = useState<OffsetUnit>('days');
  const [problem, setProblem] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const dirty = !sameOffsets(offsets, desc(rule.offsets_minutes));
  const idBase = `rem-${rule.kind}`;

  function add() {
    const minutes = toOffsetMinutes(Number(value), unit);
    if (minutes === null) {
      setProblem('Use a whole number between 1 minute and 14 days.');
      return;
    }
    if (offsets.includes(minutes)) {
      setProblem('That reminder is already in the list.');
      return;
    }
    if (offsets.length >= 6) {
      setProblem('You can have at most 6 reminders per kind.');
      return;
    }
    setProblem(null);
    setOffsets(desc([...offsets, minutes]));
  }

  async function save() {
    setBusy(true);
    const r = await run(() => calendarApi.saveReminderRule(rule.kind, offsets), `${REMINDER_KIND_LABEL[rule.kind]} reminders saved.`);
    setBusy(false);
    if (r.ok) onSaved();
  }

  async function reset() {
    setBusy(true);
    const r = await run(() => calendarApi.resetReminderRule(rule.kind), `${REMINDER_KIND_LABEL[rule.kind]} reminders set back to the default.`);
    setBusy(false);
    if (r.ok) {
      setOffsets(desc(rule.default_offsets_minutes));
      onSaved();
    }
  }

  return (
    <section aria-label={`${REMINDER_KIND_LABEL[rule.kind]} reminders`} className="bg-white border border-line rounded-[24px] shadow-card p-5 md:p-6 space-y-4">
      <div>
        <h2 className="font-semibold text-sm text-ink">{REMINDER_KIND_LABEL[rule.kind]}</h2>
        <p className="text-xs text-ink-muted mt-0.5">{REMINDER_KIND_HINT[rule.kind]}</p>
      </div>

      <ul className="flex flex-wrap gap-2">
        {offsets.length === 0 && <li className="text-xs text-ink-muted">No reminders. Add at least one to save.</li>}
        {offsets.map((o) => (
          <li key={o} className="inline-flex items-center gap-1.5 bg-surface-muted border border-line rounded-full pl-3 pr-2 py-1 text-xs text-ink">
            {offsetLabel(o)}
            {canEdit && (
              <button type="button" aria-label={`Remove ${offsetLabel(o)}`} onClick={() => setOffsets(offsets.filter((x) => x !== o))} className="p-0.5 rounded-full hover:bg-white text-ink-muted"><X size={12} /></button>
            )}
          </li>
        ))}
      </ul>

      {canEdit && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-end gap-2">
            <div className="space-y-1">
              <label htmlFor={`${idBase}-v`} className="text-[10px] font-bold text-ink-subtle uppercase tracking-wider">Remind me</label>
              <input id={`${idBase}-v`} type="number" min={1} inputMode="numeric" className={`${inputClass} w-24`} value={value} onChange={(e) => setValue(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label htmlFor={`${idBase}-u`} className="sr-only">Unit</label>
              <select id={`${idBase}-u`} className={`${inputClass} w-28`} value={unit} onChange={(e) => setUnit(e.target.value as OffsetUnit)}>
                <option value="minutes">minutes</option>
                <option value="hours">hours</option>
                <option value="days">days</option>
              </select>
            </div>
            <span className="text-xs text-ink-muted pb-2">before</span>
            <button type="button" onClick={add} className={secondaryBtn}>Add</button>
          </div>
          {problem && <p role="alert" className="text-[11px] text-danger-bold">{problem}</p>}
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" onClick={save} disabled={busy || !dirty || offsets.length === 0} className={primaryBtn}>Save</button>
            {!rule.is_default || dirty ? (
              <button type="button" onClick={reset} disabled={busy} className={secondaryBtn}>Reset to default</button>
            ) : null}
            {rule.is_default && !dirty && <span className="text-[11px] text-ink-muted">Using the default.</span>}
          </div>
        </div>
      )}
    </section>
  );
}

export default function RemindersPage() {
  const { data, loading, error, reload } = useReminderRules();
  const order: ReminderKind[] = ['milestone', 'compliance', 'meeting'];
  const rules = data ? order.map((k) => data.rules.find((r) => r.kind === k)).filter((r): r is ReminderRule => !!r) : [];

  return (
    <main className="max-w-3xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-display text-ink-strong tracking-tight">Reminders</h1>
        <p className="text-xs text-ink-muted">Choose how long before an item you get a notification. All-day items count from 09:00 in their time zone.</p>
      </div>
      {data && !data.can_edit && <p role="note" className="text-xs text-ink-muted bg-surface-muted border border-line rounded-card px-3 py-2">Only founders can change reminders. You get the notifications below.</p>}

      {loading && !data && <p role="status" className="text-xs text-ink-muted">Loading reminders…</p>}
      {error && !data && (
        <div role="alert" className="bg-danger-tint border border-danger-bold rounded-modal p-4 text-xs text-danger-bold flex items-center justify-between gap-3">
          <span>{error}</span>
          <button type="button" onClick={reload} className="font-semibold underline">Try again</button>
        </div>
      )}
      {data && rules.map((r) => <RuleCard key={`${r.kind}-${r.offsets_minutes.join(',')}`} rule={r} canEdit={data.can_edit} onSaved={reload} />)}
    </main>
  );
}
