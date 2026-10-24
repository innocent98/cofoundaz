import React from 'react';
import type { CampaignReadout, ReadoutFigures, ReadoutMetric } from '@/lib/api/marketing';
import { CARD } from './states';

function weekOf(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
}

const METRICS: { key: ReadoutMetric; label: string }[] = [
  { key: 'spend', label: 'Spend' },
  { key: 'impressions', label: 'Impressions' },
  { key: 'clicks', label: 'Clicks' },
  { key: 'ctr', label: 'Click-through rate' },
  { key: 'conversions', label: 'Conversions' },
  { key: 'cac', label: 'Cost per customer' },
];

/** Every number comes from the API's pre-formatted `display` strings, never from the written summary. */
function FiguresTable({ figures }: { figures: ReadoutFigures }) {
  return (
    <div className="space-y-1.5">
      <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Readout figures, scrollable">
        <table className="w-full min-w-[28rem] border-collapse text-left text-sm" aria-label="Readout figures">
          <thead>
            <tr className="border-b border-neutral-200 text-[11px] font-bold uppercase tracking-wider text-neutral-600">
              <th scope="col" className="py-2 pr-3">Measure</th>
              <th scope="col" className="py-2 pr-3 text-right">This week</th>
              <th scope="col" className="py-2 pr-3 text-right">Last week</th>
              <th scope="col" className="py-2 pr-3 text-right">Change</th>
              <th scope="col" className="py-2 text-right">All time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 tabular-nums text-neutral-800">
            {METRICS.map((m) => (
              <tr key={m.key}>
                <th scope="row" className="py-2 pr-3 font-medium text-neutral-900">{m.label}</th>
                <td className="py-2 pr-3 text-right">{figures.this_week[m.key].display}</td>
                <td className="py-2 pr-3 text-right">{figures.last_week[m.key].display}</td>
                <td className="py-2 pr-3 text-right">{figures.change[m.key].display}</td>
                <td className="py-2 text-right">{figures.all_time[m.key].display}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-neutral-500">
        Live for {figures.days_live.display}. Counted by Cofoundaz from the numbers you recorded.
      </p>
    </div>
  );
}

function Bullets({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div className="space-y-1.5">
      <h4 className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">{title}</h4>
      <ul className="list-disc pl-5 space-y-1 text-sm text-neutral-800">
        {items.map((t, i) => (
          <li key={i}>{t}</li>
        ))}
      </ul>
    </div>
  );
}

/**
 * The AI weekly readout. It is written once a week for an active campaign that recorded numbers in the
 * last 14 days, from those numbers only. An empty list is a normal state (new campaign, no data yet), not an error.
 */
export function ReadoutCard({ readouts, loading }: { readouts: CampaignReadout[]; loading: boolean }) {
  const latest = readouts[0];
  const ready = readouts.find((r) => r.status === 'ready' && r.output);
  const earlier = readouts.filter((r) => r.status === 'ready' && r.output && r.id !== ready?.id);

  return (
    <section aria-label="AI weekly readout" className={`${CARD} p-6 space-y-4`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display font-semibold text-lg text-neutral-900">
          <span aria-hidden="true" className="text-accent-600 mr-2">✦</span>AI weekly readout
        </h2>
        {ready && <span className="text-xs text-neutral-500">Week of {weekOf(ready.week_start)}</span>}
      </div>

      {loading && !latest && <p className="text-sm text-neutral-500">Loading the latest readout...</p>}

      {!loading && !latest && (
        <p className="text-sm text-neutral-600">
          No readout yet. Every Monday morning, an active campaign that recorded numbers in the last 14 days gets a short
          written summary here. Record metrics for this campaign and launch it to start.
        </p>
      )}

      {latest && latest.status === 'generating' && !ready && (
        <p role="status" className="text-sm text-neutral-600">Writing this week&apos;s readout. Check back in a minute.</p>
      )}

      {latest && latest.status === 'failed' && !ready && (
        <p className="text-sm text-neutral-600">Readout unavailable this week.</p>
      )}

      {ready?.output && (
        <div className="space-y-4">
          {ready.output.headline && <p className="text-base font-semibold text-neutral-900">{ready.output.headline}</p>}
          {ready.output.summary && <p className="text-sm text-neutral-700 leading-relaxed">{ready.output.summary}</p>}
          {ready.figures && <FiguresTable figures={ready.figures} />}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Bullets title="Wins" items={ready.output.wins ?? []} />
            <Bullets title="Watch" items={ready.output.watch ?? []} />
          </div>
          {ready.output.next_step && (
            <div className="rounded-card bg-neutral-xe2ede6 border border-brand-xd2e2d8 p-3.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-brand-hover">Next step</p>
              <p className="text-sm text-brand-rail-deep mt-1">{ready.output.next_step}</p>
            </div>
          )}
          <p className="text-xs text-neutral-500">
            Written by AI from the numbers you recorded for this campaign. Check it against the charts above.
          </p>
        </div>
      )}

      {earlier.length > 0 && (
        <details className="text-sm">
          <summary className="cursor-pointer font-semibold text-brand-rail-deep">Earlier weeks ({earlier.length})</summary>
          <ul className="mt-3 space-y-3">
            {earlier.map((r) => (
              <li key={r.id} className="border-t border-neutral-100 pt-3">
                <p className="text-xs text-neutral-500">Week of {weekOf(r.week_start)}</p>
                <p className="font-medium text-neutral-900">{r.output?.headline}</p>
                <p className="text-neutral-700">{r.output?.summary}</p>
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}
