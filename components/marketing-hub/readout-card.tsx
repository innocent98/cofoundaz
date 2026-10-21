import React from 'react';
import type { CampaignReadout } from '@/lib/api/marketing';
import { CARD } from './states';

function weekOf(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
}

function Bullets({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div className="space-y-1.5">
      <h4 className="text-[11px] font-bold uppercase tracking-wider text-sage-500">{title}</h4>
      <ul className="list-disc pl-5 space-y-1 text-sm text-sage-800">
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
        <h2 className="font-display font-semibold text-lg text-sage-900">
          <span aria-hidden="true" className="text-[#9C5B34] mr-2">✦</span>AI weekly readout
        </h2>
        {ready && <span className="text-xs text-sage-500">Week of {weekOf(ready.week_start)}</span>}
      </div>

      {loading && !latest && <p className="text-sm text-sage-500">Loading the latest readout...</p>}

      {!loading && !latest && (
        <p className="text-sm text-sage-600">
          No readout yet. Every Monday morning, an active campaign that recorded numbers in the last 14 days gets a short
          written summary here. Record metrics for this campaign and launch it to start.
        </p>
      )}

      {latest && latest.status === 'generating' && !ready && (
        <p role="status" className="text-sm text-sage-600">Writing this week&apos;s readout. Check back in a minute.</p>
      )}

      {latest && latest.status === 'failed' && !ready && (
        <p className="text-sm text-sage-600">Readout unavailable this week.</p>
      )}

      {ready?.output && (
        <div className="space-y-4">
          {ready.output.headline && <p className="text-base font-semibold text-sage-900">{ready.output.headline}</p>}
          {ready.output.summary && <p className="text-sm text-sage-700 leading-relaxed">{ready.output.summary}</p>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Bullets title="Wins" items={ready.output.wins ?? []} />
            <Bullets title="Watch" items={ready.output.watch ?? []} />
          </div>
          {ready.output.next_step && (
            <div className="rounded-card bg-[#e2ede6] border border-[#d2e2d8] p-3.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#1e4836]">Next step</p>
              <p className="text-sm text-[#0e271f] mt-1">{ready.output.next_step}</p>
            </div>
          )}
          <p className="text-xs text-sage-500">
            Written by AI from the numbers you recorded for this campaign. Check it against the charts above.
          </p>
        </div>
      )}

      {earlier.length > 0 && (
        <details className="text-sm">
          <summary className="cursor-pointer font-semibold text-[#0e271f]">Earlier weeks ({earlier.length})</summary>
          <ul className="mt-3 space-y-3">
            {earlier.map((r) => (
              <li key={r.id} className="border-t border-sage-100 pt-3">
                <p className="text-xs text-sage-500">Week of {weekOf(r.week_start)}</p>
                <p className="font-medium text-sage-900">{r.output?.headline}</p>
                <p className="text-sage-700">{r.output?.summary}</p>
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}
