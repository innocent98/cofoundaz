import React from 'react';

/** Tiny trend line for a KPI tile. Needs at least two points; draws nothing otherwise. */
export function Sparkline({ values, className = '' }: { values: number[]; className?: string }) {
  if (values.length < 2) return null;
  const w = 80;
  const h = 24;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const step = w / (values.length - 1);
  const points = values
    .map((v, i) => `${(i * step).toFixed(1)},${(h - 2 - ((v - min) / span) * (h - 4)).toFixed(1)}`)
    .join(' ');
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className={`h-6 w-full ${className}`}
      role="img"
      aria-label={`Trend over the last ${values.length} days`}
      preserveAspectRatio="none"
    >
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
