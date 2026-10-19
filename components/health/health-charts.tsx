'use client';

import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ReferenceDot,
} from 'recharts';

// Real health charts (recharts), themed to the design tokens. Every series here
// is real API data — the score history, the five dimension scores, and a single
// dimension's trend — never synthesised.

const GREEN = '#2D5A3F';
const GRID = '#EBEBE6';
const AXIS = '#768478';

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const tooltipStyle = {
  background: '#FFFFFF',
  border: `1px solid ${GRID}`,
  borderRadius: 10,
  fontSize: 12,
  boxShadow: '0 4px 16px rgba(20,41,31,0.08)',
} as const;

export interface ScorePoint {
  computed_at: string;
  score: number;
}

export interface ChartMarker {
  at: string;
  label: string;
}

function fmtDateTime(ms: number): string {
  return new Date(ms).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Score-over-time area chart on a real time axis (several recomputes can land on
 * one day, so a category axis would collide). Event markers sit on the line at
 * the nearest reading; the list under the chart carries the same labels as text.
 */
export function ScoreHistoryChart({
  points,
  markers = [],
  height = 260,
}: {
  points: ScorePoint[];
  markers?: ChartMarker[];
  height?: number;
}) {
  const data = points.map((p) => ({ t: new Date(p.computed_at).getTime(), score: Math.round(p.score) }));
  const dots = markers.flatMap((m) => {
    const t = new Date(m.at).getTime();
    if (Number.isNaN(t) || data.length === 0) return [];
    const nearest = data.reduce((best, d) => (Math.abs(d.t - t) < Math.abs(best.t - t) ? d : best), data[0]);
    return [{ t: nearest.t, score: nearest.score, label: m.label }];
  });
  // One point is a dot, not a line: give the axis room either side.
  const domain: [number | string, number | string] =
    data.length === 1 ? [data[0].t - 86_400_000, data[0].t + 86_400_000] : ['dataMin', 'dataMax'];
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 16, bottom: 4, left: -18 }}>
        <defs>
          <linearGradient id="scoreFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={GREEN} stopOpacity={0.22} />
            <stop offset="100%" stopColor={GREEN} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis
          dataKey="t"
          type="number"
          scale="time"
          domain={domain}
          tickFormatter={(v) => fmtDate(new Date(v as number).toISOString())}
          tick={{ fontSize: 11, fill: AXIS }}
          tickLine={false}
          axisLine={{ stroke: GRID }}
        />
        <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: AXIS }} tickLine={false} axisLine={false} width={44} />
        <Tooltip
          contentStyle={tooltipStyle}
          labelStyle={{ color: '#1E2923', fontWeight: 700 }}
          labelFormatter={(v) => fmtDateTime(v as number)}
          formatter={(v) => [v as number, 'Score']}
        />
        <Area type="monotone" dataKey="score" stroke={GREEN} strokeWidth={3} fill="url(#scoreFill)" dot={{ r: 3, fill: GREEN }} activeDot={{ r: 5 }} />
        {dots.map((d, i) => (
          <ReferenceDot
            key={`${d.t}-${i}`}
            x={d.t}
            y={d.score}
            ifOverflow="visible"
            shape={(props: { cx?: number; cy?: number }) => (
              <g>
                <title>{`${d.label}, ${fmtDateTime(d.t)}`}</title>
                <circle cx={props.cx} cy={props.cy} r={7} fill="#9C5B34" stroke="#FFFFFF" strokeWidth={2} />
              </g>
            )}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}

/** Tiny per-dimension trend from real recompute scores (one point renders as a dot). */
export function Sparkline({ values, color }: { values: number[]; color: string }) {
  if (values.length === 0) return <div className="w-full h-5" aria-hidden="true" />;
  const W = 150;
  const H = 30;
  const PAD = 3;
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const span = hi - lo || 1;
  const x = (i: number) => (values.length === 1 ? W / 2 : (i / (values.length - 1)) * W);
  const y = (v: number) => (hi === lo ? H / 2 : H - PAD - ((v - lo) / span) * (H - PAD * 2));
  const path = values.map((v, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');
  return (
    <svg className="w-full h-5" viewBox={`0 0 ${W} ${H}`} fill="none" aria-hidden="true">
      {values.length > 1 && <path d={path} stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}
      <circle cx={x(values.length - 1)} cy={y(values[values.length - 1])} r="3" fill={color} />
    </svg>
  );
}

/** Compact line variant for a single dimension's trend on the drill-down page. */
export function DimensionTrendChart({ points, height = 180 }: { points: ScorePoint[]; height?: number }) {
  const data = points.map((p) => ({ t: new Date(p.computed_at).getTime(), score: Math.round(p.score) }));
  const domain: [number | string, number | string] =
    data.length === 1 ? [data[0].t - 86_400_000, data[0].t + 86_400_000] : ['dataMin', 'dataMax'];
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 16, bottom: 4, left: -18 }}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis
          dataKey="t"
          type="number"
          scale="time"
          domain={domain}
          tickFormatter={(v) => fmtDate(new Date(v as number).toISOString())}
          tick={{ fontSize: 11, fill: AXIS }}
          tickLine={false}
          axisLine={{ stroke: GRID }}
        />
        <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: AXIS }} tickLine={false} axisLine={false} width={44} />
        <Tooltip
          contentStyle={tooltipStyle}
          labelStyle={{ color: '#1E2923', fontWeight: 700 }}
          labelFormatter={(v) => fmtDateTime(v as number)}
          formatter={(v) => [v as number, 'Score']}
        />
        <Line type="monotone" dataKey="score" stroke={GREEN} strokeWidth={3} dot={{ r: 3, fill: GREEN }} activeDot={{ r: 5 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export interface RadarDatum {
  dimension: string;
  score: number;
}

/** Five-dimension radar of the current scores. */
export function DimensionsRadar({ data, height = 280 }: { data: RadarDatum[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RadarChart data={data} outerRadius="72%">
        <PolarGrid stroke={GRID} />
        <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 12, fill: '#55625A', fontWeight: 600 }} />
        <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10, fill: AXIS }} axisLine={false} />
        <Radar dataKey="score" stroke={GREEN} strokeWidth={2} fill={GREEN} fillOpacity={0.18} />
        <Tooltip contentStyle={tooltipStyle} formatter={(v) => [v as number, 'Score']} />
      </RadarChart>
    </ResponsiveContainer>
  );
}
