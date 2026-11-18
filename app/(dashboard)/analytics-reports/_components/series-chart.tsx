"use client";

import React from "react";
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { MetricResult } from "@/lib/api/analytics";
import { formatValue, periodLabel } from "@/lib/analytics-format";

const COLOURS = ["var(--color-brand-mid)", "var(--color-accent-600)"];
const GRID = "var(--color-line-soft)";
const AXIS = "var(--color-ink-soft)";
const tooltipStyle = {
  background: "var(--color-white)",
  border: `1px solid ${GRID}`,
  borderRadius: 10,
  fontSize: 12,
  boxShadow: "0 4px 16px var(--color-shadow-soft)",
} as const;

function bucketLabel(from: string, to: string): string {
  const f = new Date(`${from}T00:00:00Z`);
  const t = new Date(`${to}T00:00:00Z`);
  const o: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", timeZone: "UTC" };
  return from === to ? f.toLocaleDateString("en-GB", o) : `${f.toLocaleDateString("en-GB", o)}–${t.toLocaleDateString("en-GB", o)}`;
}

/** Short axis ticks: ₦1.5M / 12k. */
function compact(v: number, m: MetricResult): string {
  if (m.unit === "money") {
    const major = v / 100;
    const a = Math.abs(major);
    if (a >= 1e9) return `₦${(major / 1e9).toFixed(1)}B`;
    if (a >= 1e6) return `₦${(major / 1e6).toFixed(1)}M`;
    if (a >= 1e3) return `₦${Math.round(major / 1e3)}k`;
    return `₦${Math.round(major)}`;
  }
  if (Math.abs(v) >= 1000) return `${Math.round(v / 1000)}k`;
  return formatValue(v, m.unit === "months" || m.unit === "days" ? "score" : m.unit, m.currency);
}

/**
 * One or two metrics over time, from their `series` buckets. Two metrics get two axes (their units can
 * differ). Always paired with a real table below for keyboard and screen-reader users.
 */
export function SeriesChart({ metrics, kind = "line", height = 256 }: { metrics: MetricResult[]; kind?: "line" | "bar"; height?: number }) {
  const drawable = metrics.filter((m) => m.status === "ok" && (m.series?.length ?? 0) > 0);
  if (drawable.length === 0) {
    return <p className="text-sm text-neutral-500 py-8 text-center">No history to draw yet for this period.</p>;
  }
  const base = drawable[0].series!;
  const rows = base.map((b, i) => {
    const row: Record<string, string | number | null> = { label: bucketLabel(b.from, b.to) };
    drawable.forEach((m, k) => {
      row[`m${k}`] = m.series?.[i]?.value ?? null;
    });
    return row;
  });
  const Chart = kind === "bar" ? BarChart : LineChart;

  return (
    <div className="space-y-3">
      <div className="w-full" style={{ height }} aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%">
          <Chart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid stroke={GRID} vertical={false} />
            <XAxis dataKey="label" tick={{ fill: AXIS, fontSize: 11 }} axisLine={false} tickLine={false} minTickGap={12} />
            {drawable.map((m, k) => (
              <YAxis
                key={m.key}
                yAxisId={k}
                orientation={k === 0 ? "left" : "right"}
                tick={{ fill: AXIS, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={56}
                tickFormatter={(v) => compact(Number(v), m)}
              />
            ))}
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v, name) => {
                const m = drawable[Number(String(name).replace("m", ""))] ?? drawable[0];
                return [v === null || v === undefined ? "No data" : formatValue(Number(v), m.unit, m.currency), m.label ?? ""];
              }}
            />
            {drawable.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} formatter={(v) => drawable[Number(String(v).replace("m", ""))]?.label ?? v} />}
            {drawable.map((m, k) =>
              kind === "bar" ? (
                <Bar key={m.key} yAxisId={k} dataKey={`m${k}`} name={`m${k}`} fill={COLOURS[k]} radius={[3, 3, 0, 0]} isAnimationActive={false} />
              ) : (
                <Line key={m.key} yAxisId={k} dataKey={`m${k}`} name={`m${k}`} stroke={COLOURS[k]} strokeWidth={2} dot={{ r: 3 }} connectNulls isAnimationActive={false} />
              ),
            )}
          </Chart>
        </ResponsiveContainer>
      </div>
      <details className="text-sm">
        <summary className="cursor-pointer max-md:min-h-11 inline-flex items-center text-xs font-bold text-brand-800">Show as a table</summary>
        <div className="overflow-x-auto mt-2">
          <table className="w-full text-xs">
            <caption className="sr-only">
              {drawable.map((m) => m.label).join(" and ")}, {periodLabel(drawable[0].period)}
            </caption>
            <thead>
              <tr className="text-left text-neutral-500">
                <th scope="col" className="py-1.5 pr-3 font-semibold">Period</th>
                {drawable.map((m) => (
                  <th key={m.key} scope="col" className="py-1.5 pr-3 font-semibold text-right">
                    {m.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {base.map((b, i) => (
                <tr key={`${b.from}-${b.to}`}>
                  <th scope="row" className="py-1.5 pr-3 font-medium text-neutral-700 text-left">
                    {bucketLabel(b.from, b.to)}
                  </th>
                  {drawable.map((m) => {
                    const v = m.series?.[i]?.value ?? null;
                    return (
                      <td key={m.key} className="py-1.5 pr-3 text-right tabular-nums">
                        {v === null ? "No data" : formatValue(v, m.unit, m.currency)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
