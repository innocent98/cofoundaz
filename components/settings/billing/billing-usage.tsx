'use client';

import React from 'react';
import { creditsPercentTone, formatCount, formatDate, formatStorage } from '@/lib/billing-format';
import { getUsage } from '@/lib/api/billing';
import { Banner, Button, Card, LoadError, ProgressBar, Spinner } from '../ui';
import { useAsync } from './use-async';

export function UsageView({ onNavigate }: { onNavigate: (view: 'plans' | 'addons') => void }): React.JSX.Element {
  const { data: u, error, loading, reload } = useAsync(getUsage, "We couldn't load your usage.");
  if (error && !u) return <LoadError message={error} onRetry={reload} />;
  if (loading || !u) return <Spinner label="Loading usage" />;

  const c = u.ai_credits;
  const tone = creditsPercentTone(c.percent);
  const seatPct = u.seats.limit ? (u.seats.used / u.seats.limit) * 100 : 0;
  const storagePct = u.storage.limit_mb ? (u.storage.used_mb / u.storage.limit_mb) * 100 : 0;
  const maxDaily = Math.max(1, ...u.daily.map((d) => d.credits));

  return (
    <div className="space-y-6">
      {tone !== 'ok' && (
        <Banner
          tone={tone === 'full' ? 'error' : 'warn'}
          title={tone === 'full' ? "You've used all your AI credits" : "You've used 90% of your AI credits"}
          action={
            <div className="flex gap-2 shrink-0">
              <Button variant="secondary" onClick={() => onNavigate('addons')}>Buy credits</Button>
              <Button onClick={() => onNavigate('plans')}>See plans</Button>
            </div>
          }
        >
          Credits reset on {formatDate(u.cycle.resets_on)}.
        </Banner>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-ink-subtle mb-3">
            <span>AI credits</span><span>{c.percent}%</span>
          </div>
          <p className="text-2xl font-display font-medium text-ink mb-3">
            {formatCount(c.used)} of {formatCount(c.limit)}
          </p>
          <ProgressBar percent={c.percent} tone={tone} label="AI credits used" />
          <p className="text-[11px] text-ink-subtle mt-3">
            Resets {formatDate(u.cycle.resets_on)}.
            {c.from_packs > 0 && ` Includes ${formatCount(c.from_packs)} from credit packs.`} 1 credit is {c.tokens_per_credit} AI tokens.
          </p>
        </Card>
        <Card>
          <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-ink-subtle mb-3">
            <span>Seats</span>
            <span>{u.seats.limit ? `${Math.round(seatPct)}%` : 'Unlimited'}</span>
          </div>
          <p className="text-2xl font-display font-medium text-ink mb-3">
            {u.seats.limit ? `${u.seats.used} of ${u.seats.limit} used` : `${u.seats.used} in use`}
          </p>
          {u.seats.limit && <ProgressBar percent={seatPct} tone={seatPct >= 100 ? 'full' : 'ok'} label="Seats used" />}
          <p className="text-[11px] text-ink-subtle mt-3">Mentors, investors, lawyers and accountants are free.</p>
        </Card>
        <Card>
          <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-ink-subtle mb-3">
            <span>Storage</span><span>{Math.round(storagePct)}%</span>
          </div>
          <p className="text-2xl font-display font-medium text-ink mb-3">
            {formatStorage(u.storage.used_mb)} of {formatStorage(u.storage.limit_mb)}
          </p>
          <ProgressBar percent={storagePct} tone={storagePct >= 100 ? 'full' : storagePct >= 90 ? 'warn' : 'ok'} label="Storage used" />
        </Card>
      </div>

      <Card title="Daily AI credit use" description={`${formatDate(u.cycle.starts_on)} to ${formatDate(u.cycle.resets_on)}`}>
        {u.daily.length === 0 ? (
          <p className="text-xs text-ink-subtle">No AI use yet this cycle.</p>
        ) : (
          <div className="flex items-end gap-1 h-32" role="img" aria-label="Bar chart of AI credits used per day">
            {u.daily.map((d) => (
              <div key={d.date} title={`${formatDate(d.date)}: ${formatCount(d.credits)} credits`} className="flex-1 max-w-10 bg-accent-gold rounded-t" style={{ height: `${Math.max(4, (d.credits / maxDaily) * 100)}%` }} />
            ))}
          </div>
        )}
      </Card>

      {u.breakdown.length > 0 && (
        <Card title="What used credits">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-ink-subtle">
                  <th className="py-2 pr-4 font-semibold">Feature</th><th className="py-2 pr-4 font-semibold">Runs</th>
                  <th className="py-2 pr-4 font-semibold">Credits</th><th className="py-2 font-semibold">Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {u.breakdown.map((b) => (
                  <tr key={b.feature}><td className="py-2 pr-4">{b.feature}</td><td className="py-2 pr-4">{b.runs}</td><td className="py-2 pr-4">{formatCount(b.credits)}</td><td className="py-2">{b.share}%</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
