"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useWorkspace } from "@/components/workspace-context";
import { useReadinessHistory } from "@/hooks/useReadinessScore";
import type { HistoryRange, LogEntry, QaRating } from "@/lib/api/readiness";
import { axisLabels, chartPoints, focusLabel, intensityLabel, stepPath } from "@/lib/readiness-format";
import { formatDay, formatWhen, LoadFailed, LoadingBlock } from "../_components/states";

const RANGES: { value: HistoryRange; label: string }[] = [
  { value: 30, label: "30 days" },
  { value: 90, label: "90 days" },
  { value: 365, label: "1 year" },
];

const RATING_STYLE: Record<QaRating, string> = {
  needs_work: "bg-danger-50 text-danger-700 border border-danger-200",
  good: "bg-neutral-xe2ede6 text-brand-hover border border-brand-xd2e2d8",
  strong: "bg-success-50 text-success border border-success-500/40",
};

export default function ReadinessHistoryPage() {
  const { role } = useWorkspace();
  const canOpenQa = role === "founder";
  const [range, setRange] = useState<HistoryRange>(90);
  const { history, loading, error, reload } = useReadinessHistory(range);
  if (loading && !history) return <LoadingBlock label="Loading your score history" />;
  if (error && !history) return <LoadFailed error={error} onRetry={reload} what="your score history" />;
  if (!history) return null;

  // The window is anchored to when the data was fetched, so a re-render never moves the axis.
  const now = history.fetchedAt;
  const pts = chartPoints(history.points, history.range, now);
  const labels = axisLabels(history.range, now);
  const markers = history.markers
    .map((m) => ({ ...m, x: ((new Date(m.at).getTime() - (now - history.range * 86_400_000)) / (history.range * 86_400_000)) * 100 }))
    .filter((m) => m.x >= 0 && m.x <= 100);

  return (
    <div className="space-y-6 animate-fadeIn pb-12 max-w-5xl mx-auto pt-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-3xl font-display font-semibold text-neutral-900">Score history & logs</h1>
          <p className="text-sm text-neutral-500">Track your progress over time.</p>
        </div>
        <div role="radiogroup" aria-label="Time range" className="inline-flex rounded-card border border-neutral-200 bg-white p-0.5">
          {RANGES.map((r) => (
            <button
              key={r.value}
              role="radio"
              aria-checked={range === r.value}
              onClick={() => setRange(r.value)}
              className={`rounded-[10px] px-3 py-1.5 text-xs font-semibold transition-colors ${
                range === r.value ? "bg-neutral-900 text-white" : "text-neutral-600 hover:bg-neutral-100"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p role="alert" className="text-xs text-danger-700">
          {error.message}{" "}
          <button onClick={reload} className="underline">
            Try again
          </button>
        </p>
      )}

      <div className={`bg-white rounded-modal border border-neutral-200 shadow-card p-6 flex flex-col ${loading ? "opacity-60" : ""}`} aria-busy={loading}>
        <h3 className="font-semibold text-sm text-neutral-900 mb-4">Readiness trend</h3>
        {pts.length === 0 ? (
          <div className="rounded-card bg-neutral-50 p-8 text-center text-sm text-neutral-500">
            No score history in this period yet. Points appear when your score changes.
          </div>
        ) : (
          <>
            <div className="relative h-56 border-b border-l border-neutral-200 ml-8">
              <span className="absolute -left-8 top-0 text-[10px] text-neutral-400">100</span>
              <span className="absolute -left-6 top-1/2 -translate-y-1/2 text-[10px] text-neutral-400">50</span>
              <span className="absolute -left-4 bottom-0 text-[10px] text-neutral-400">0</span>
              {/* the 70 line: the "ready" bar */}
              <div className="absolute inset-x-0 border-t border-dashed border-success-500/50" style={{ top: "30%" }}>
                <span className="absolute right-0 -top-4 text-[10px] text-success">70 ready</span>
              </div>
              <svg
                className="absolute inset-0 h-full w-full overflow-visible"
                preserveAspectRatio="none"
                viewBox="0 0 100 100"
                role="img"
                aria-label={`Readiness score over the last ${history.range} days: ${pts.map((p) => p.score).join(", ")}`}
              >
                <polyline fill="none" stroke="var(--color-brand-hover)" strokeWidth="2" vectorEffect="non-scaling-stroke" points={stepPath(pts)} />
                {markers.map((m) => (
                  <line key={`${m.at}-${m.label}`} x1={m.x} x2={m.x} y1="0" y2="100" stroke="currentColor" strokeWidth="1" strokeDasharray="2 3" vectorEffect="non-scaling-stroke" className="text-neutral-300">
                    <title>{m.label}</title>
                  </line>
                ))}
              </svg>
              {pts.map((p) => (
                <span
                  key={p.at}
                  title={`${p.score} on ${formatDay(p.at)}`}
                  className="absolute h-2.5 w-2.5 -translate-x-1/2 translate-y-1/2 rounded-full bg-brand-hover ring-2 ring-white"
                  style={{ left: `${p.x}%`, bottom: `${p.y}%` }}
                />
              ))}
            </div>
            <div className="relative ml-8 mt-2 flex justify-between text-[10px] text-neutral-400">
              {labels.map((l, i) => (
                <span key={i}>{l}</span>
              ))}
            </div>
            {history.markers.length > 0 && (
              <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-600">
                {history.markers.map((m) => (
                  <li key={`${m.at}-${m.label}`}>
                    <span className="font-semibold">{formatDay(m.at)}</span> · {m.label}
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>

      <div className="bg-white rounded-modal border border-neutral-200 shadow-card overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-200">
          <h3 className="font-semibold text-sm text-neutral-900">Sessions and reviews</h3>
        </div>
        {history.log.length === 0 ? (
          <div className="p-8 text-center text-sm text-neutral-500">
            Nothing here yet. Deck reviews, mock Q&A sessions and narrative checks show up here.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-neutral-200/80 text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                  <th className="py-4 px-6">Date</th>
                  <th className="py-4 px-6">Type</th>
                  <th className="py-4 px-6">Details</th>
                  <th className="py-4 px-6 text-right">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {history.log.map((entry) => (
                  <LogRow key={`${entry.type}-${entry.id}`} entry={entry} canOpenQa={canOpenQa} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function LogRow({ entry, canOpenQa }: { entry: LogEntry; canOpenQa: boolean }) {
  const link = "text-brand-hover font-semibold hover:underline";
  let type = "";
  let details: React.ReactNode = null;
  let result: React.ReactNode = null;

  if (entry.type === "deck_review") {
    type = "Deck review";
    details = (
      <Link href={`/investor-readiness/deck?review=${entry.id}`} className={link}>
        Version {entry.version}
      </Link>
    );
    result = entry.overall !== null ? <span className="font-semibold text-neutral-900">{entry.overall}/10</span> : <span className="text-neutral-400">-</span>;
  } else if (entry.type === "qa_session") {
    type = "Mock Q&A";
    const text = `${focusLabel(entry.focus)} · ${intensityLabel(entry.intensity)}${entry.duration_minutes !== null ? ` · ${entry.duration_minutes} min` : ""}`;
    details = canOpenQa ? (
      <Link href={`/investor-readiness/qa?session=${entry.id}`} className={link}>
        {text}
      </Link>
    ) : (
      <span>{text}</span>
    );
    result = <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${RATING_STYLE[entry.rating]}`}>{entry.rating_label}</span>;
  } else {
    type = "Narrative check";
    const c = entry.counts;
    details = (
      <Link href="/investor-readiness/narrative" className={link}>
        {c.high + c.medium} to fix · {c.info} unverified · {c.ok} consistent
      </Link>
    );
    result = c.high > 0 ? <span className="text-xs font-semibold text-danger-700">Needs fixing</span> : c.medium > 0 ? <span className="text-xs font-semibold text-warning">Check</span> : <span className="text-xs font-semibold text-success">Consistent</span>;
  }

  return (
    <tr className="hover:bg-neutral-50/50 transition-colors">
      <td className="py-4 px-6 font-semibold text-sm text-neutral-900 whitespace-nowrap">{formatWhen(entry.at)}</td>
      <td className="py-4 px-6 text-sm text-neutral-700 whitespace-nowrap">{type}</td>
      <td className="py-4 px-6 text-sm text-neutral-700">{details}</td>
      <td className="py-4 px-6 text-right">{result}</td>
    </tr>
  );
}
