'use client';

import React from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CHANNEL_LABELS, formatMoney, type CampaignPerformance } from '@/lib/api/marketing';

// Campaign detail charts (recharts), themed to the design tokens. Every series is the API's
// data for this campaign. The channel chart is the campaign's totals split by its planned
// channel mix, so it is labelled as an estimate wherever it appears.

export type SeriesMetric = 'impressions' | 'clicks' | 'conversions' | 'spend';

export const SERIES_METRICS: { value: SeriesMetric; label: string }[] = [
  { value: 'impressions', label: 'Impressions' },
  { value: 'clicks', label: 'Clicks' },
  { value: 'conversions', label: 'Conversions' },
  { value: 'spend', label: 'Spend' },
];

const GREEN = 'var(--color-brand-mid)';
const COPPER = 'var(--color-accent-600)';
const GRID = 'var(--color-line-soft)';
const AXIS = 'var(--color-ink-soft)';

const tooltipStyle = {
  background: 'var(--color-white)',
  border: `1px solid ${GRID}`,
  borderRadius: 10,
  fontSize: 12,
  boxShadow: '0 4px 16px var(--color-shadow-soft)',
} as const;

/** Spend is stored in minor units; everything else is a plain count. */
export function metricValue(metric: SeriesMetric, v: number): number {
  return metric === 'spend' ? v / 100 : v;
}

function formatValue(metric: SeriesMetric, v: number): string {
  return metric === 'spend' ? formatMoney(v) : v.toLocaleString();
}

function shortDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function SeriesChart({ series, metric }: { series: CampaignPerformance['series']; metric: SeriesMetric }) {
  const data = series.map((p) => ({ date: p.date, value: metricValue(metric, p[metric]) }));
  const label = SERIES_METRICS.find((m) => m.value === metric)?.label ?? metric;
  return (
    <div
      className="h-64 w-full"
      role="img"
      aria-label={`${label} per day: ${series.map((p) => `${p.date} ${formatValue(metric, p[metric])}`).join(', ')}`}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis dataKey="date" tickFormatter={shortDate} tick={{ fill: AXIS, fontSize: 11 }} tickLine={false} axisLine={{ stroke: GRID }} minTickGap={24} />
          <YAxis tick={{ fill: AXIS, fontSize: 11 }} tickLine={false} axisLine={false} width={44} allowDecimals={metric === 'spend'} />
          <Tooltip
            contentStyle={tooltipStyle}
            labelFormatter={(l) => shortDate(String(l))}
            formatter={(v) => [metric === 'spend' ? `₦${Number(v).toLocaleString()}` : Number(v).toLocaleString(), label]}
            cursor={{ fill: 'var(--color-tint-brand-06)' }}
          />
          <Bar dataKey="value" fill={GREEN} radius={[4, 4, 0, 0]} maxBarSize={36} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ChannelChart({ rows, metric }: { rows: CampaignPerformance['by_channel']; metric: SeriesMetric }) {
  const data = rows.map((r) => ({ name: CHANNEL_LABELS[r.channel], value: metricValue(metric, r[metric]) }));
  const label = SERIES_METRICS.find((m) => m.value === metric)?.label ?? metric;
  return (
    <div
      className="w-full"
      style={{ height: Math.max(160, rows.length * 44 + 32) }}
      role="img"
      aria-label={`Estimated ${label.toLowerCase()} by channel: ${rows.map((r) => `${CHANNEL_LABELS[r.channel]} ${formatValue(metric, r[metric])}`).join(', ')}`}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid stroke={GRID} horizontal={false} />
          <XAxis type="number" tick={{ fill: AXIS, fontSize: 11 }} tickLine={false} axisLine={{ stroke: GRID }} allowDecimals={metric === 'spend'} />
          <YAxis type="category" dataKey="name" tick={{ fill: AXIS, fontSize: 11 }} tickLine={false} axisLine={false} width={96} />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(v) => [metric === 'spend' ? `₦${Number(v).toLocaleString()}` : Number(v).toLocaleString(), `${label} (estimated)`]}
            cursor={{ fill: 'var(--color-tint-accent-06)' }}
          />
          <Bar dataKey="value" fill={COPPER} radius={[0, 4, 4, 0]} maxBarSize={24} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
