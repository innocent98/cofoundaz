"use client";

import React from "react";
import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { CashFlow, Runway, RunwayScenarioKey } from "@/lib/api/finance";
import { formatMoney, shortMonth } from "@/lib/finance/format";
import { cashSeries } from "@/lib/finance/cashSeries";

// Finance charts (recharts), themed like the other hubs. Every number is the API's;
// each chart is also announced as text and has a visually hidden table.

const GREEN = "#2D5A3F";
const RED = "#A65243";
const COPPER = "#9C5B34";
const GRID = "#EBEBE6";
const AXIS = "#768478";

const tooltipStyle = {
  background: "#FFFFFF",
  border: `1px solid ${GRID}`,
  borderRadius: 10,
  fontSize: 12,
  boxShadow: "0 4px 16px rgba(20,41,31,0.08)",
} as const;

/** "₦1.5M" style axis ticks from kobo. */
export function compactMoney(minor: number): string {
  const major = minor / 100;
  const abs = Math.abs(major);
  const sign = major < 0 ? "-" : "";
  if (abs >= 1_000_000_000) return `${sign}₦${(abs / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000) return `${sign}₦${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}₦${(abs / 1_000).toFixed(0)}k`;
  return `${sign}₦${Math.round(abs)}`;
}

/** Money in, money out and net per month as bars, with the month-end cash balance as a line. */
export function CashFlowChart({ cashFlow }: { cashFlow: CashFlow }) {
  const rows = cashSeries(cashFlow).map((p) => ({ ...p, label: shortMonth(p.month) }));
  const summary = rows
    .map(
      (r) =>
        `${r.label}: in ${formatMoney(r.inflow, cashFlow.currency)}, out ${formatMoney(r.outflow, cashFlow.currency)}, net ${formatMoney(r.net, cashFlow.currency)}, cash ${formatMoney(r.cash, cashFlow.currency)}`,
    )
    .join(". ");
  return (
    <div>
      <div className="h-64 w-full" role="img" aria-label={`Cash flow, last 6 months. ${summary}`}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid stroke={GRID} vertical={false} />
            <XAxis dataKey="label" tick={{ fill: AXIS, fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: AXIS, fontSize: 11 }} axisLine={false} tickLine={false} width={56} tickFormatter={compactMoney} />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v, name) => [formatMoney(Number(v), cashFlow.currency), String(name)]}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="inflow" name="Money in" fill={GREEN} radius={[3, 3, 0, 0]} isAnimationActive={false} />
            <Bar dataKey="outflow" name="Money out" fill={RED} radius={[3, 3, 0, 0]} isAnimationActive={false} />
            <Bar dataKey="net" name="Net" fill={COPPER} radius={[3, 3, 0, 0]} isAnimationActive={false} />
            <Line dataKey="cash" name="Cash at month end" stroke="#173B28" strokeWidth={2} strokeDasharray="5 3" dot={{ r: 3 }} isAnimationActive={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="sr-only">
      <table>
        <caption>Cash flow by month</caption>
        <thead>
          <tr>
            <th scope="col">Month</th>
            <th scope="col">Money in</th>
            <th scope="col">Money out</th>
            <th scope="col">Net</th>
            <th scope="col">Cash at month end</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.month}>
              <th scope="row">{r.month}</th>
              <td>{formatMoney(r.inflow, cashFlow.currency)}</td>
              <td>{formatMoney(r.outflow, cashFlow.currency)}</td>
              <td>{formatMoney(r.net, cashFlow.currency)}</td>
              <td>{formatMoney(r.cash, cashFlow.currency)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}

const SLICES = ["#2D5A3F", "#9C5B34", "#A65243", "#768478", "#D4A27F", "#4A7A60", "#7A5C4F"];

/** Spend by category as a donut with a text legend (readable without colour). */
export function ExpenseDonut({
  rows,
  total,
  currency,
}: {
  rows: { category: string; total_minor: number; percent: number }[];
  total: number;
  currency: string;
}) {
  const data = rows.map((r, i) => ({ ...r, color: SLICES[i % SLICES.length] }));
  const summary = data.map((r) => `${r.category} ${r.percent}%`).join(", ");
  return (
    <div className="flex flex-col md:flex-row items-center gap-6">
      <div className="relative h-44 w-44 shrink-0" role="img" aria-label={`Spend by category: ${summary}`}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="total_minor" nameKey="category" innerRadius="62%" outerRadius="100%" paddingAngle={data.length > 1 ? 2 : 0} stroke="none" isAnimationActive={false}>
              {data.map((r) => (
                <Cell key={r.category} fill={r.color} />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} formatter={(v, name) => [formatMoney(Number(v), currency), String(name)]} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-display font-bold text-sage-900">{formatMoney(total, currency)}</span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-sage-600">Total</span>
        </div>
      </div>
      <ul className="w-full space-y-2 text-sm">
        {data.map((r) => (
          <li key={r.category} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 min-w-0">
              <span className="h-2.5 w-2.5 rounded-input shrink-0" style={{ background: r.color }} aria-hidden="true" />
              <span className="truncate text-sage-700 font-medium">{r.category}</span>
            </span>
            <span className="whitespace-nowrap text-sage-900">
              <span className="font-bold">{formatMoney(r.total_minor, currency)}</span>
              <span className="text-sage-500 ml-2">{r.percent}%</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export interface ModelChartPoint {
  label: string;
  revenue: number;
  netIncome: number;
  cash: number;
}

/** Revenue bars with net income and closing cash lines, monthly or yearly. */
export function ModelChart({ points, currency }: { points: ModelChartPoint[]; currency: string }) {
  const summary = points.map((p) => `${p.label}: revenue ${formatMoney(p.revenue, currency)}, net income ${formatMoney(p.netIncome, currency)}, closing cash ${formatMoney(p.cash, currency)}`).join(". ");
  return (
    <div>
      <div className="h-60 w-full" role="img" aria-label={`Projection chart. ${summary}`}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid stroke={GRID} vertical={false} />
            <XAxis dataKey="label" tick={{ fill: AXIS, fontSize: 11 }} axisLine={false} tickLine={false} interval="preserveStartEnd" minTickGap={24} />
            <YAxis tick={{ fill: AXIS, fontSize: 11 }} axisLine={false} tickLine={false} width={60} tickFormatter={compactMoney} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v, name) => [formatMoney(Number(v), currency), String(name)]} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="revenue" name="Revenue" fill={GREEN} radius={[3, 3, 0, 0]} isAnimationActive={false} />
            <Line dataKey="netIncome" name="Net income" stroke={RED} strokeWidth={2} dot={false} isAnimationActive={false} />
            <Line dataKey="cash" name="Closing cash" stroke="#173B28" strokeWidth={2} strokeDasharray="5 3" dot={false} isAnimationActive={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <p className="sr-only">The same figures are in the tables below.</p>
    </div>
  );
}

const SCENARIO_META: { key: RunwayScenarioKey; label: string; color: string }[] = [
  { key: "base", label: "Base", color: GREEN },
  { key: "best", label: "Best", color: COPPER },
  { key: "worst", label: "Worst", color: RED },
];

/** Projected cash balance for the three scenarios, with the zero line and each cash-out month marked. */
export function RunwayChart({ runway, selected }: { runway: Runway; selected: RunwayScenarioKey }) {
  const months = runway.scenarios.base.by_month.map((p) => p.month);
  const rows = months.map((month, i) => ({
    month,
    label: shortMonth(month),
    base: runway.scenarios.base.by_month[i]?.cash_balance ?? null,
    best: runway.scenarios.best.by_month[i]?.cash_balance ?? null,
    worst: runway.scenarios.worst.by_month[i]?.cash_balance ?? null,
  }));
  const currency = runway.baseline.currency;
  const summary = SCENARIO_META.map((m) => {
    const out = runway.scenarios[m.key].cash_out_date;
    return `${m.label} case ${out ? `runs out in ${out}` : "does not run out"}`;
  }).join(". ");
  return (
    <div className="h-64 w-full" role="img" aria-label={`Projected cash balance by scenario. ${summary}.`}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={rows} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis dataKey="label" tick={{ fill: AXIS, fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: AXIS, fontSize: 11 }} axisLine={false} tickLine={false} width={60} tickFormatter={compactMoney} />
          <Tooltip contentStyle={tooltipStyle} formatter={(v, name) => [formatMoney(Number(v), currency), String(name)]} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <ReferenceLine y={0} stroke={RED} strokeDasharray="4 3" label={{ value: "Zero cash", position: "insideTopRight", fill: RED, fontSize: 10 }} />
          {SCENARIO_META.map((m) => (
            <Line
              key={m.key}
              dataKey={m.key}
              name={`${m.label} case`}
              stroke={m.color}
              strokeWidth={m.key === selected ? 3 : 1.5}
              strokeOpacity={m.key === selected ? 1 : 0.4}
              dot={false}
              isAnimationActive={false}
            />
          ))}
          {SCENARIO_META.map((m) => {
            const out = runway.scenarios[m.key].cash_out_date;
            const point = out ? runway.scenarios[m.key].by_month.find((p) => p.month === out) : undefined;
            return point ? <ReferenceDot key={m.key} x={shortMonth(point.month)} y={point.cash_balance} r={5} fill={m.color} stroke="#FFFFFF" /> : null;
          })}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
