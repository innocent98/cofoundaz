"use client";

import React, { useId } from "react";
import { AlertTriangle, Info, Minus, TrendingDown, TrendingUp } from "lucide-react";
import type { MetricResult, RangeSpec, SeriesPoint } from "@/lib/api/analytics";
import {
  COMPARE_OPTIONS,
  RANGE_OPTIONS,
  asOfLabel,
  deltaView,
  formatValue,
  hubLabel,
  metricState,
  periodLabel,
} from "@/lib/analytics-format";
import { HubLink, LockedTile, cardCls, inputCls } from "./ui";

const toneCls = {
  good: "text-success-700 bg-success-50 border-success-500/30",
  bad: "text-danger-700 bg-danger-50 border-danger-200",
  neutral: "text-neutral-600 bg-neutral-50 border-neutral-200",
} as const;

/** Tiny trend line of a metric's series (no axes); hidden from screen readers, the card reads the value. */
export function Sparkline({ series }: { series: SeriesPoint[] }) {
  const pts = series.map((p) => p.value).filter((v): v is number => v !== null && v !== undefined);
  if (pts.length < 2) return null;
  const min = Math.min(...pts);
  const max = Math.max(...pts);
  const span = max - min || 1;
  const w = 100;
  const h = 28;
  const step = w / (pts.length - 1);
  const d = pts.map((v, i) => `${i === 0 ? "M" : "L"}${(i * step).toFixed(1)},${(h - ((v - min) / span) * (h - 4) - 2).toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="w-full h-7" aria-hidden="true">
      <path d={d} fill="none" stroke="var(--color-brand-mid)" strokeWidth={1.75} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export function DeltaChip({ metric }: { metric: MetricResult }) {
  const d = deltaView(metric);
  if (!d) return null;
  const Icon = d.tone === "neutral" && d.text === "No change" ? Minus : d.text.startsWith("−") ? TrendingDown : TrendingUp;
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${toneCls[d.tone]}`}>
      <Icon className="w-3 h-3" aria-hidden="true" />
      <span aria-hidden="true">{d.text}</span>
      <span className="sr-only">{d.spoken}</span>
    </span>
  );
}

/**
 * One metric as a card: value, delta, sparkline, "as of", source link and definition. Each status
 * renders differently (guide §3.2): no data links to the hub, not burning is good news, a lock never
 * shows a number, an unknown key says it is gone.
 */
export function MetricCard({ metric, title, showSpark = true }: { metric: MetricResult; title?: string | null; showSpark?: boolean }) {
  const tipId = useId();
  const state = metricState(metric);
  if (state.kind === "locked") return <LockedTile needsLabel={state.needsLabel} />;
  const label = title || metric.label || "Metric";
  const entered = metric.source_note === "Entered by you";

  return (
    <article className={`${cardCls} p-5 flex flex-col gap-3 min-w-0`} aria-label={label}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider truncate">{label}</h3>
          {entered && <p className="text-[11px] font-semibold text-accent-700 mt-0.5">Entered by you</p>}
        </div>
        {metric.definition && (
          <span className="relative group shrink-0">
            <button
              type="button"
              aria-describedby={tipId}
              className="p-1 max-md:min-h-11 max-md:min-w-11 inline-flex items-center justify-center rounded-full text-neutral-400 hover:text-neutral-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-rail-deep/30"
              aria-label={`What ${label} means`}
            >
              <Info className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
            <span
              role="tooltip"
              id={tipId}
              className="invisible opacity-0 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100 absolute right-0 top-7 z-20 w-60 rounded-card bg-brand-950 text-white text-xs p-3 shadow-raised transition-opacity"
            >
              {metric.definition}
            </span>
          </span>
        )}
      </div>

      {state.kind === "value" && (
        <div className="flex items-end justify-between gap-2 flex-wrap">
          <p className="text-2xl font-display font-semibold text-neutral-900 tabular-nums">{state.text}</p>
          <DeltaChip metric={metric} />
        </div>
      )}
      {state.kind === "no_data" && (
        <div>
          <p className="text-lg font-display font-semibold text-neutral-400">No data yet</p>
          <p className="text-xs text-neutral-500">Nothing recorded for this period.</p>
        </div>
      )}
      {state.kind === "not_burning" && (
        <div>
          <p className="text-lg font-display font-semibold text-success-700">Not burning cash</p>
          <p className="text-xs text-neutral-500">Profitable or flat, so there is nothing to count down.</p>
        </div>
      )}
      {state.kind === "out_of_cash" && (
        <div className="flex items-center gap-2 text-danger-700">
          <AlertTriangle className="w-4 h-4" aria-hidden="true" />
          <p className="text-lg font-display font-semibold">Out of cash</p>
        </div>
      )}
      {state.kind === "unknown" && <p className="text-sm font-semibold text-neutral-500">{state.message}</p>}
      {state.kind === "error" && <p className="text-sm font-semibold text-danger-700">This number could not be read. Try again later.</p>}

      {showSpark && state.kind === "value" && metric.series && <Sparkline series={metric.series} />}

      <div className="flex items-center justify-between gap-2 flex-wrap text-[11px] text-neutral-500 mt-auto">
        <span>
          {metric.source_note && !entered ? `${metric.source_note} · ` : ""}
          {asOfLabel(metric.as_of)}
        </span>
        {metric.hub === "custom" ? (
          <a href="#custom-metrics" className="inline-flex items-center max-md:min-h-11 text-xs font-bold text-brand-800 hover:underline">
            Edit values
          </a>
        ) : (
          <HubLink path={metric.hub_path} label={state.kind === "no_data" ? `Add in ${hubLabel(metric.hub ?? "")}` : `Open ${hubLabel(metric.hub ?? "")}`} />
        )}
      </div>
    </article>
  );
}

/** Range pills plus a comparison select; `custom` reveals two dates. Drives every number on the page. */
export function RangePicker({
  value,
  onChange,
  idPrefix,
  allowCompare = true,
  label = "Period",
}: {
  value: RangeSpec;
  onChange: (next: RangeSpec) => void;
  idPrefix: string;
  allowCompare?: boolean;
  label?: string;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div role="group" aria-label={label} className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-0.5">
        {RANGE_OPTIONS.map((o) => {
          const active = value.range === o.key;
          return (
            <button
              key={o.key}
              type="button"
              aria-pressed={active}
              onClick={() => onChange({ ...value, range: o.key, from: o.key === "custom" ? value.from : null, to: o.key === "custom" ? value.to : null })}
              className={`px-3.5 py-1.5 max-md:min-h-11 rounded-full text-xs font-semibold whitespace-nowrap border transition-colors ${
                active ? "bg-brand-900 text-white border-brand-900" : "bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300"
              }`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
      <div className="flex flex-wrap items-end gap-3">
        {value.range === "custom" && (
          <>
            <label className="flex flex-col gap-1 text-xs font-semibold text-neutral-500" htmlFor={`${idPrefix}-from`}>
              From
              <input
                id={`${idPrefix}-from`}
                type="date"
                value={value.from ?? ""}
                onChange={(e) => onChange({ ...value, from: e.target.value || null })}
                className={`${inputCls} w-40`}
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-semibold text-neutral-500" htmlFor={`${idPrefix}-to`}>
              To
              <input
                id={`${idPrefix}-to`}
                type="date"
                value={value.to ?? ""}
                onChange={(e) => onChange({ ...value, to: e.target.value || null })}
                className={`${inputCls} w-40`}
              />
            </label>
          </>
        )}
        {allowCompare && (
          <label className="flex flex-col gap-1 text-xs font-semibold text-neutral-500" htmlFor={`${idPrefix}-compare`}>
            Compare with
            <select
              id={`${idPrefix}-compare`}
              value={value.compare}
              onChange={(e) => onChange({ ...value, compare: e.target.value as RangeSpec["compare"] })}
              className={`${inputCls} w-52`}
            >
              {COMPARE_OPTIONS.map((o) => (
                <option key={o.key} value={o.key}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
    </div>
  );
}

/** "15 Oct – 13 Nov 2026 vs 15 Sep – 14 Oct 2026" */
export function PeriodLine({ period, compare }: { period: { from: string; to: string }; compare?: { from: string; to: string } | null }) {
  return (
    <p className="text-xs text-neutral-500">
      {periodLabel(period)}
      {compare ? ` · compared with ${periodLabel(compare)}` : ""} · days in UTC
    </p>
  );
}

/** Format for a series axis tick or table cell. */
export function seriesValue(v: number | null, metric: MetricResult): string {
  return v === null ? "No data" : formatValue(v, metric.unit, metric.currency);
}
