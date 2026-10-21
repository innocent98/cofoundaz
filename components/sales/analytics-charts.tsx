'use client';

import React from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import {
  CLOSED_REASON_LABELS,
  formatMoney,
  monthLabel,
  type MonthlyRevenue,
  type SalesAnalytics,
} from '@/lib/api/sales';

// Sales analytics charts (recharts), themed like the Marketing hub charts. Every series is the API's data.

const GREEN = '#2D5A3F';
const GRID = '#EBEBE6';
const AXIS = '#768478';
/** Won first, then the loss reasons. Six reasons plus Won are all told apart by the legend text too. */
const SLICE_COLORS = ['#2D5A3F', '#9C5B34', '#A65243', '#768478', '#D4A27F', '#4A7A60', '#7A5C4F'];

const tooltipStyle = {
  background: '#FFFFFF',
  border: `1px solid ${GRID}`,
  borderRadius: 10,
  fontSize: 12,
  boxShadow: '0 4px 16px rgba(20,41,31,0.08)',
} as const;

export interface Slice {
  key: string;
  label: string;
  count: number;
  /** Kobo, for loss reasons; null for the Won slice. */
  value_minor: number | null;
  color: string;
}

/** Won plus each loss reason, as slices of every deal that closed in the period. */
export function winLossSlices(wl: SalesAnalytics['win_loss']): Slice[] {
  const slices: Slice[] = [];
  if (wl.won > 0) slices.push({ key: 'won', label: 'Won', count: wl.won, value_minor: null, color: SLICE_COLORS[0] });
  wl.loss_reasons.forEach((r, i) =>
    slices.push({
      key: r.reason,
      label: `Lost: ${CLOSED_REASON_LABELS[r.reason] ?? r.reason}`,
      count: r.count,
      value_minor: r.value_minor,
      color: SLICE_COLORS[(i + 1) % SLICE_COLORS.length],
    })
  );
  return slices;
}

export function pctOf(part: number, total: number): string {
  return total > 0 ? `${Math.round((part / total) * 100)}%` : '0%';
}

export function WinLossDonut({ winLoss }: { winLoss: SalesAnalytics['win_loss'] }) {
  const slices = winLossSlices(winLoss);
  const total = winLoss.won + winLoss.lost;
  if (total === 0) {
    return <p className="text-sm text-sage-600">No deals were closed in this period.</p>;
  }
  const summary = slices.map((s) => `${s.label} ${s.count} (${pctOf(s.count, total)})`).join(', ');
  return (
    <div className="flex flex-col md:flex-row items-center gap-6">
      <div className="relative h-44 w-44 shrink-0" role="img" aria-label={`Closed deals: ${summary}`}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={slices} dataKey="count" nameKey="label" innerRadius="62%" outerRadius="100%" paddingAngle={slices.length > 1 ? 2 : 0} stroke="none" isAnimationActive={false}>
              {slices.map((s) => <Cell key={s.key} fill={s.color} />)}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} formatter={(v, name) => [`${v} (${pctOf(Number(v), total)})`, String(name)]} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-display font-bold text-sage-900">{winLoss.win_rate_pct === null ? 'None' : `${winLoss.win_rate_pct}%`}</span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-sage-600">Win rate</span>
        </div>
      </div>
      <ul className="space-y-2.5 text-xs font-medium text-sage-700 min-w-0 w-full">
        {slices.map((s) => (
          <li key={s.key}>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: s.color }} aria-hidden="true" />
              <span className="truncate">{s.label}</span>
              <span className="ml-auto shrink-0 tabular-nums text-sage-900 font-semibold">
                {s.count} · {pctOf(s.count, total)}
              </span>
            </div>
            {s.value_minor !== null && <p className="pl-[18px] tabular-nums text-sage-600">{formatMoney(s.value_minor)} lost</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}

const compact = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 });

export function RevenueChart({ months }: { months: MonthlyRevenue[] }) {
  const data = months.map((m) => ({ month: m.month, value: m.value_minor, deals: m.deal_count }));
  const summary = months.map((m) => `${monthLabel(m.month, true)} ${formatMoney(m.value_minor)}`).join(', ');
  return (
    <div className="h-64 w-full" role="img" aria-label={`Closed-won revenue by month: ${summary}`}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis dataKey="month" tickFormatter={(m) => monthLabel(String(m))} tick={{ fill: AXIS, fontSize: 11 }} tickLine={false} axisLine={{ stroke: GRID }} interval="preserveStartEnd" minTickGap={12} />
          <YAxis tickFormatter={(v) => `₦${compact.format(Number(v) / 100)}`} tick={{ fill: AXIS, fontSize: 11 }} tickLine={false} axisLine={false} width={52} />
          <Tooltip
            contentStyle={tooltipStyle}
            labelFormatter={(m) => monthLabel(String(m), true)}
            formatter={(v, _n, item) => [`${formatMoney(Number(v))} from ${item.payload.deals} ${item.payload.deals === 1 ? 'deal' : 'deals'}`, 'Closed won']}
            cursor={{ fill: 'rgba(45,90,63,0.06)' }}
          />
          <Bar dataKey="value" fill={GREEN} radius={[4, 4, 0, 0]} maxBarSize={36} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
