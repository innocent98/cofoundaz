'use client';

import React, { use, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  useCampaign,
  useCampaignPerformance,
  useCampaignReadouts,
  useSegments,
} from '@/hooks/useMarketingApi';
import {
  CHANNEL_LABELS,
  OBJECTIVE_LABELS,
  fillSeriesDays,
  isUuid,
  formatMoney,
  formatPeriod,
  summariseMix,
  type CampaignStatus,
  type PerformanceRange,
} from '@/lib/api/marketing';
import { BTN_ACCENT, BTN_SECONDARY, CARD, DataGate } from '@/components/marketing-hub/states';
import { CampaignActions } from '@/components/marketing-hub/campaign-actions';
import { ChannelChart, SERIES_METRICS, SeriesChart, type SeriesMetric } from '@/components/marketing-hub/charts';
import { ChannelLabel } from '@/components/marketing-hub/channel-icon';
import { ReadoutCard } from '@/components/marketing-hub/readout-card';

const STATUS_STYLE: Record<CampaignStatus, string> = {
  draft: 'bg-neutral-100 text-neutral-700',
  active: 'bg-success-100 text-success-800',
  paused: 'bg-warning-100 text-warning-800',
  completed: 'bg-neutral-200 text-neutral-700',
};

const RANGES: { value: PerformanceRange; label: string }[] = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: 'all', label: 'All time' },
];

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className={`${CARD} p-4 space-y-1`}>
      <span className="text-[11px] font-bold text-neutral-600 tracking-wider uppercase">{label}</span>
      <div className="text-xl md:text-2xl font-display font-bold text-neutral-900 tabular-nums">{value}</div>
    </div>
  );
}

function MetricPicker({ value, onChange, label }: { value: SeriesMetric; onChange: (m: SeriesMetric) => void; label: string }) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {SERIES_METRICS.map((m) => (
        <button
          key={m.value}
          type="button"
          aria-pressed={value === m.value}
          onClick={() => onChange(m.value)}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold cursor-pointer ${
            value === m.value ? 'bg-brand-rail-deep text-white' : 'bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-50'
          }`}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}

export default function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  if (!isUuid(id)) {
    return (
      <div className="space-y-4">
        <Link href="/marketing/campaigns" className="inline-block text-sm font-semibold text-brand-rail-deep hover:underline">
          ← All campaigns
        </Link>
        <p role="alert" className="rounded-modal border border-neutral-200 bg-white p-6 text-sm text-neutral-700">Campaign not found.</p>
      </div>
    );
  }
  return <CampaignDetail id={id} />;
}

function CampaignDetail({ id }: { id: string }) {
  const router = useRouter();
  const { campaign, posts, copy } = useCampaign(id);
  const segs = useSegments();
  const [range, setRange] = useState<PerformanceRange>('all');
  const [seriesMetric, setSeriesMetric] = useState<SeriesMetric>('clicks');
  const [channelMetric, setChannelMetric] = useState<SeriesMetric>('spend');
  const perf = useCampaignPerformance(id, range);
  const readouts = useCampaignReadouts(id);

  const c = campaign.data;
  const series = useMemo(() => {
    if (!perf.performance) return [];
    const today = new Date().toISOString().slice(0, 10);
    return fillSeriesDays(perf.performance.series, { until: range === 'all' ? undefined : today });
  }, [perf.performance, range]);

  const segmentNames = (c?.segment_ids ?? []).map((sid) => segs.segments.find((s) => s.id === sid)?.name ?? 'Unknown segment');
  const copyMessage = c
    ? `${OBJECTIVE_LABELS[c.objective]} campaign "${c.name}"${segmentNames.length ? ` for ${segmentNames.join(', ')}` : ''}`
    : '';

  return (
    <div className="space-y-6 animate-fadeIn">
      <Link href="/marketing/campaigns" className="inline-block text-sm font-semibold text-brand-rail-deep hover:underline">
        ← All campaigns
      </Link>

      <DataGate status={campaign.status} error={campaign.error} onRetry={campaign.reload} loadingLabel="Loading this campaign">
        {c && (
          <>
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="space-y-2 min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-3xl md:text-4xl font-display font-semibold text-neutral-900 tracking-tight break-words">{c.name}</h1>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${STATUS_STYLE[c.status]}`}>
                    {c.status}
                  </span>
                </div>
                <p className="text-sm text-neutral-600">
                  {OBJECTIVE_LABELS[c.objective]} · {formatMoney(c.budget)} budget · {formatPeriod(c.period_start, c.period_end)}
                </p>
                <p className="text-xs text-neutral-500">{summariseMix(c.channel_mix)}</p>
              </div>
              <CampaignActions
                campaign={c}
                onChanged={campaign.reload}
                onDeleted={() => router.push('/marketing/campaigns')}
              />
            </div>

            <p className="text-xs text-neutral-500">
              These numbers are the ones recorded under{' '}
              <Link href="/marketing/analytics" className="font-semibold text-brand-rail-deep hover:underline">Analytics</Link>
              . Nothing syncs from an ad platform.
            </p>

            <ReadoutCard readouts={readouts.readouts} loading={readouts.status === 'loading'} />

            <section aria-label="Performance" className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-display font-semibold text-xl text-neutral-900">Performance</h2>
                <div>
                  <label htmlFor="perf-range" className="sr-only">Date range</label>
                  <select
                    id="perf-range"
                    value={range}
                    onChange={(e) => setRange(e.target.value as PerformanceRange)}
                    className="bg-white border border-neutral-300 rounded-card px-4 py-2.5 text-sm font-semibold text-neutral-900 outline-none focus:border-neutral-400 shadow-card"
                  >
                    {RANGES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </div>
              </div>

              <DataGate status={perf.status} error={perf.error} onRetry={perf.reload} loadingLabel="Loading performance">
                {perf.performance && (
                  <>
                    <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
                      <Tile label="Impressions" value={perf.performance.totals.impressions.toLocaleString()} />
                      <Tile label="Clicks" value={perf.performance.totals.clicks.toLocaleString()} />
                      <Tile label="Conversions" value={perf.performance.totals.conversions.toLocaleString()} />
                      <Tile label="Spend" value={formatMoney(perf.performance.totals.spend)} />
                      <Tile label="CTR" value={`${perf.performance.totals.click_through_rate.toFixed(1)}%`} />
                      <Tile label="Conversion rate" value={`${perf.performance.totals.conversion_rate.toFixed(1)}%`} />
                    </div>

                    {perf.performance.series.length === 0 ? (
                      <div className={`${CARD} p-6 space-y-3`}>
                        <p className="text-sm text-neutral-700">No numbers recorded for this campaign in this range yet.</p>
                        <Link href="/marketing/analytics" className={`${BTN_ACCENT} inline-block`}>Record a metric</Link>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className={`${CARD} p-6 space-y-4`}>
                          <h3 className="text-sm font-semibold text-neutral-900">Per day</h3>
                          <MetricPicker value={seriesMetric} onChange={setSeriesMetric} label="Metric shown per day" />
                          <SeriesChart series={series} metric={seriesMetric} />
                        </div>
                        <div className={`${CARD} p-6 space-y-4`}>
                          <h3 className="text-sm font-semibold text-neutral-900">Estimated split by channel</h3>
                          {perf.performance.by_channel.length === 0 ? (
                            <p className="text-sm text-neutral-600">
                              This campaign has no channel split, so there is nothing to divide. Edit the campaign to set one.
                            </p>
                          ) : (
                            <>
                              <MetricPicker value={channelMetric} onChange={setChannelMetric} label="Metric shown by channel" />
                              <ChannelChart rows={perf.performance.by_channel} metric={channelMetric} />
                              <p className="text-xs text-neutral-500">
                                Estimated. Numbers recorded for a campaign carry no channel, so this applies the campaign&apos;s planned
                                split ({summariseMix(c.channel_mix)}) to its totals.
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </DataGate>
            </section>

            <section aria-label="Campaign content" className={`${CARD} p-6 space-y-4`}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-display font-semibold text-lg text-neutral-900">Content</h2>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/marketing/copy?campaign=${encodeURIComponent(c.id)}&message=${encodeURIComponent(copyMessage)}`}
                    className={BTN_ACCENT}
                  >
                    ✦ Write copy for this campaign
                  </Link>
                  <Link href="/marketing/calendar" className={BTN_SECONDARY}>Open calendar</Link>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">Posts on the calendar</h3>
                  {posts.status === 'loading' ? (
                    <p className="text-sm text-neutral-500">Loading posts...</p>
                  ) : (posts.data ?? []).length === 0 ? (
                    <p className="text-sm text-neutral-600">No posts are linked to this campaign. Link one from a post&apos;s Campaign field.</p>
                  ) : (
                    <ul className="divide-y divide-neutral-100">
                      {(posts.data ?? []).map((p) => (
                        <li key={p.id} className="py-2.5">
                          <Link href={`/marketing/calendar?entry=${encodeURIComponent(p.id)}`} className="block hover:underline">
                            <span className="block text-sm font-semibold text-neutral-900 truncate">{p.title}</span>
                            <span className="block text-xs text-neutral-500">
                              {CHANNEL_LABELS[p.channel]} · <span className="capitalize">{p.status}</span>
                              {p.scheduled_at ? ` · ${new Date(p.scheduled_at).toLocaleDateString()}` : ''}
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="space-y-2">
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">AI copy written for it</h3>
                  {copy.status === 'loading' ? (
                    <p className="text-sm text-neutral-500">Loading copy...</p>
                  ) : (copy.data ?? []).filter((g) => g.status === 'ready').length === 0 ? (
                    <p className="text-sm text-neutral-600">No copy has been written for this campaign yet.</p>
                  ) : (
                    <ul className="divide-y divide-neutral-100">
                      {(copy.data ?? []).filter((g) => g.status === 'ready').map((g) => (
                        <li key={g.id} className="py-2.5">
                          <Link href={`/marketing/copy?generation=${encodeURIComponent(g.id)}`} className="block hover:underline">
                            <span className="block text-sm font-semibold text-neutral-900 truncate">{String(g.inputs.key_message ?? 'Copy')}</span>
                            <span className="block text-xs text-neutral-500">
                              {g.output.variants?.length ?? 0} variants · {new Date(g.created_at).toLocaleDateString()}
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {(c.segment_ids.length > 0 || Object.keys(c.channel_mix).length > 0) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-neutral-100">
                  <div className="space-y-2">
                    <h3 className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">Audience</h3>
                    {segmentNames.length === 0 ? (
                      <p className="text-sm text-neutral-600">No segments chosen.</p>
                    ) : (
                      <p className="text-sm text-neutral-800">
                        {segmentNames.join(', ')}{' '}
                        <Link href="/marketing/segments" className="font-semibold text-brand-rail-deep hover:underline">View segments</Link>
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">Channels</h3>
                    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-neutral-800">
                      {Object.entries(c.channel_mix).filter(([, v]) => (v ?? 0) > 0).map(([k, v]) => (
                        <li key={k}>
                          <ChannelLabel channel={k as keyof typeof CHANNEL_LABELS} /> <span className="text-neutral-500">{Math.round(v ?? 0)}%</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </section>
          </>
        )}
      </DataGate>
    </div>
  );
}
