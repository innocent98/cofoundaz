'use client';

import React, { useState } from 'react';
import { useAnalytics, useCampaigns } from '@/hooks/useMarketingApi';
import {
  CHANNEL_KEYS,
  CHANNEL_LABELS,
  fieldErrorsOf,
  formatMoney,
  gapFillWeeks,
  ingestMetrics,
  marketingErrorMessage,
  type AnalyticsRange,
  type ChannelKey,
  type MarketingAnalytics,
  type MetricName,
} from '@/lib/api/marketing';
import { BTN_ACCENT, BTN_PRIMARY, BTN_SECONDARY, CARD, DataGate, EmptyState, INPUT } from '@/components/marketing-hub/states';
import { Drawer, Field } from '@/components/marketing-hub/drawer';
import { useToast } from '../ToastContext';

const METRICS: { value: MetricName; label: string }[] = [
  { value: 'visits', label: 'Website visits' },
  { value: 'impressions', label: 'Impressions' },
  { value: 'clicks', label: 'Clicks' },
  { value: 'conversions', label: 'Conversions' },
  { value: 'spend', label: 'Spend (₦)' },
];

function isEmptyAnalytics(a: MarketingAnalytics): boolean {
  return (
    a.traffic_by_week.length === 0 &&
    a.cac_by_channel.length === 0 &&
    a.leaderboard.length === 0 &&
    a.funnel.impressions === 0 &&
    a.funnel.clicks === 0 &&
    a.funnel.conversions === 0
  );
}

const today = () => new Date().toISOString().slice(0, 10);

function RecordMetricDrawer({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const { triggerToast } = useToast();
  const { campaigns } = useCampaigns();
  const [ts, setTs] = useState(today());
  const [metric, setMetric] = useState<MetricName>('visits');
  const [value, setValue] = useState('');
  const [scope, setScope] = useState<'none' | 'channel' | 'campaign'>('none');
  const [channel, setChannel] = useState<ChannelKey>('email');
  const [campaignId, setCampaignId] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const num = Number(value);
    if (value.trim() === '' || !Number.isFinite(num) || num < 0) {
      setErrors({ value: 'Enter a number, zero or more.' });
      return;
    }
    if (scope === 'campaign' && !campaignId) {
      setErrors({ campaign_id: 'Choose a campaign.' });
      return;
    }
    // Spend is stored in minor units (kobo); everything else is a whole count.
    const stored = metric === 'spend' ? Math.round(num * 100) : Math.round(num);
    setSaving(true);
    setErrors({});
    try {
      await ingestMetrics([
        {
          ts,
          metric,
          value: stored,
          channel: scope === 'channel' ? channel : null,
          campaign_id: scope === 'campaign' ? campaignId : null,
        },
      ]);
      triggerToast('Metric recorded.');
      onSaved();
      onClose();
    } catch (err) {
      setErrors(fieldErrorsOf(err));
      triggerToast(marketingErrorMessage(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer
      title="Record a metric"
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} className={`${BTN_SECONDARY} flex-1`}>Cancel</button>
          <button type="button" onClick={save} disabled={saving} className={`${BTN_PRIMARY} flex-1`}>{saving ? 'Saving...' : 'Record metric'}</button>
        </>
      }
    >
      <p className="text-xs text-sage-600 rounded-card bg-sage-50 border border-sage-200 p-3">
        Metrics add up. Record each real-world event once, at one scope (a channel or a campaign, not both), or the totals will double count.
        Entries cannot be edited or removed later.
      </p>
      <Field label="Date" htmlFor="m-ts" error={errors.ts}>
        <input id="m-ts" type="date" className={INPUT} value={ts} max={today()} onChange={(e) => setTs(e.target.value)} />
      </Field>
      <Field label="Metric" htmlFor="m-metric">
        <select id="m-metric" className={INPUT} value={metric} onChange={(e) => setMetric(e.target.value as MetricName)}>
          {METRICS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
      </Field>
      <Field label="Value" htmlFor="m-value" error={errors.value}>
        <input id="m-value" type="number" min={0} step="any" className={INPUT} value={value} onChange={(e) => setValue(e.target.value)} />
      </Field>
      <Field label="Belongs to" htmlFor="m-scope">
        <select id="m-scope" className={INPUT} value={scope} onChange={(e) => setScope(e.target.value as 'none' | 'channel' | 'campaign')}>
          <option value="none">The whole business</option>
          <option value="channel">A channel</option>
          <option value="campaign">A campaign</option>
        </select>
      </Field>
      {scope === 'channel' && (
        <Field label="Channel" htmlFor="m-channel" error={errors.channel}>
          <select id="m-channel" className={INPUT} value={channel} onChange={(e) => setChannel(e.target.value as ChannelKey)}>
            {CHANNEL_KEYS.map((k) => <option key={k} value={k}>{CHANNEL_LABELS[k]}</option>)}
          </select>
        </Field>
      )}
      {scope === 'campaign' && (
        <Field label="Campaign" htmlFor="m-campaign" error={errors.campaign_id}>
          <select id="m-campaign" className={INPUT} value={campaignId} onChange={(e) => setCampaignId(e.target.value)}>
            <option value="">Choose a campaign</option>
            {campaigns.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {campaigns.length === 0 && <p className="text-xs text-sage-500">You have no campaigns yet.</p>}
        </Field>
      )}
    </Drawer>
  );
}

function pct(n: number): string {
  return `${n.toFixed(1)}%`;
}

export default function MarketingAnalyticsPage() {
  const [range, setRange] = useState<AnalyticsRange>('30d');
  const { analytics, status, error, reload } = useAnalytics(range);
  const [recording, setRecording] = useState(false);

  const weeks = analytics ? gapFillWeeks(analytics.traffic_by_week) : [];
  const maxVisits = Math.max(1, ...weeks.map((w) => w.visits));
  const cacRows = [...(analytics?.cac_by_channel ?? [])].sort((a, b) => (a.cac ?? Infinity) - (b.cac ?? Infinity));
  const maxCac = Math.max(1, ...cacRows.map((r) => r.cac ?? 0));

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-3xl md:text-4xl font-display font-semibold text-sage-900 tracking-tight">Performance analytics</h1>
        <div className="flex flex-wrap items-center gap-3">
          <label htmlFor="range" className="sr-only">Date range</label>
          <select
            id="range"
            value={range}
            onChange={(e) => setRange(e.target.value as AnalyticsRange)}
            className="bg-white border border-sage-300 rounded-card px-4 py-2.5 text-sm font-semibold text-sage-900 outline-none focus:border-sage-400 shadow-card"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <button type="button" onClick={() => setRecording(true)} className={BTN_ACCENT}>+ Record metric</button>
        </div>
      </div>

      <DataGate status={status} error={error} onRetry={reload} loadingLabel="Loading your analytics">
        {analytics && isEmptyAnalytics(analytics) ? (
          <EmptyState
            title="No performance data yet"
            body="Numbers appear here once you record visits, clicks, conversions or spend. Record your first metric to start."
            cta={<button type="button" onClick={() => setRecording(true)} className={BTN_ACCENT}>+ Record your first metric</button>}
          />
        ) : (
          analytics && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                {[
                  ['Impressions', analytics.funnel.impressions.toLocaleString()],
                  ['Clicks', analytics.funnel.clicks.toLocaleString()],
                  ['Conversions', analytics.funnel.conversions.toLocaleString()],
                  ['Click-through rate', pct(analytics.funnel.click_through_rate)],
                  ['Conversion rate', pct(analytics.funnel.conversion_rate)],
                ].map(([label, val]) => (
                  <div key={label} className={`${CARD} p-5 space-y-1`}>
                    <span className="text-[11px] font-bold text-sage-400 tracking-wider uppercase">{label}</span>
                    <div className="text-2xl font-display font-bold text-sage-900">{val}</div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-sage-500">
                The funnel adds up every recorded row. If the same event was recorded at two scopes, rates can read high.
                Ranges cover the last {range === '7d' ? 7 : range === '30d' ? 30 : 90} days plus today, in UTC.
              </p>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className={`${CARD} p-6 space-y-5`}>
                  <h3 className="text-sm font-semibold text-sage-900">Traffic by week</h3>
                  {weeks.length === 0 ? (
                    <p className="text-sm text-sage-500">No visits recorded in this range.</p>
                  ) : (
                    <div className="flex items-end gap-2 h-44" role="img" aria-label={`Weekly visits: ${weeks.map((w) => `${w.week_start} ${w.visits}`).join(', ')}`}>
                      {weeks.map((w) => (
                        <div key={w.week_start} className="flex-1 flex flex-col items-center justify-end gap-1 h-full min-w-0">
                          <span className="text-[10px] text-sage-600 tabular-nums">{w.visits}</span>
                          <div className="w-full rounded-t bg-[#1e4836]" style={{ height: `${Math.max(2, (w.visits / maxVisits) * 100)}%` }} />
                          <span className="text-[10px] text-sage-400 truncate w-full text-center">{w.week_start.slice(5)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className={`${CARD} p-6 space-y-5`}>
                  <h3 className="text-sm font-semibold text-sage-900">CAC by channel</h3>
                  {cacRows.length === 0 ? (
                    <p className="text-sm text-sage-500">No channel spend or conversions recorded in this range.</p>
                  ) : (
                    <div className="space-y-4 pt-1">
                      {cacRows.map((r) => (
                        <div key={r.channel} className="space-y-1.5">
                          <div className="flex items-center justify-between text-sm font-medium">
                            <span className="text-sage-700">{CHANNEL_LABELS[r.channel]}</span>
                            <span className="text-sage-900 font-semibold">
                              {r.cac === null ? 'No conversions yet' : formatMoney(r.cac)}
                            </span>
                          </div>
                          <div className="w-full bg-sage-100 h-3 rounded-full overflow-hidden p-0.5 border border-sage-200/50">
                            <div className="h-full rounded-full bg-[#1e4836]" style={{ width: `${r.cac === null ? 0 : (r.cac / maxCac) * 100}%` }} />
                          </div>
                          <p className="text-xs text-sage-500">{formatMoney(r.spend)} spent, {r.conversions} conversions</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className={`${CARD} overflow-hidden`}>
                <div className="px-6 py-4 border-b border-sage-200 bg-sage-50/50">
                  <h3 className="text-sm font-semibold text-sage-900">Campaign leaderboard</h3>
                </div>
                {analytics.leaderboard.length === 0 ? (
                  <p className="px-6 py-5 text-sm text-sage-500">No campaign-level metrics recorded in this range.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-sage-200 text-[11px] font-bold text-sage-400 uppercase tracking-wider">
                          <th className="py-3 px-6">Campaign</th>
                          <th className="py-3 px-6">Clicks</th>
                          <th className="py-3 px-6">Conversions</th>
                          <th className="py-3 px-6">Spend</th>
                          <th className="py-3 px-6 text-right">CAC</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-sage-100 text-sm">
                        {analytics.leaderboard.map((item) => (
                          <tr key={item.campaign_id} className="hover:bg-sage-50/50 transition-colors">
                            <td className="py-4 px-6 font-semibold text-sage-900">{item.name}</td>
                            <td className="py-4 px-6 text-sage-500 font-medium">{item.clicks.toLocaleString()}</td>
                            <td className="py-4 px-6 text-sage-500 font-medium">{item.conversions.toLocaleString()}</td>
                            <td className="py-4 px-6 text-sage-500 font-medium">{formatMoney(item.spend)}</td>
                            <td className="py-4 px-6 font-bold text-green-800 text-right">{item.cac === null ? 'No conversions' : formatMoney(item.cac)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )
        )}
      </DataGate>

      {recording && <RecordMetricDrawer onClose={() => setRecording(false)} onSaved={reload} />}
    </div>
  );
}
