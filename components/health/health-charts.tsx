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

/** Score-over-time area chart (health history + dimension trend share this). */
export function ScoreHistoryChart({ points, height = 260 }: { points: ScorePoint[]; height?: number }) {
  const data = points.map((p) => ({ label: fmtDate(p.computed_at), score: Math.round(p.score) }));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: -18 }}>
        <defs>
          <linearGradient id="scoreFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={GREEN} stopOpacity={0.22} />
            <stop offset="100%" stopColor={GREEN} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: AXIS }} tickLine={false} axisLine={{ stroke: GRID }} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: AXIS }} tickLine={false} axisLine={false} width={44} />
        <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#1E2923', fontWeight: 700 }} formatter={(v) => [v as number, 'Score']} />
        <Area type="monotone" dataKey="score" stroke={GREEN} strokeWidth={3} fill="url(#scoreFill)" dot={{ r: 3, fill: GREEN }} activeDot={{ r: 5 }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/** Compact line variant for a single dimension's trend on the drill-down page. */
export function DimensionTrendChart({ points, height = 180 }: { points: ScorePoint[]; height?: number }) {
  const data = points.map((p) => ({ label: fmtDate(p.computed_at), score: Math.round(p.score) }));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: -18 }}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: AXIS }} tickLine={false} axisLine={{ stroke: GRID }} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: AXIS }} tickLine={false} axisLine={false} width={44} />
        <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#1E2923', fontWeight: 700 }} formatter={(v) => [v as number, 'Score']} />
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
