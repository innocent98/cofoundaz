"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAssessmentHistory, useAssessmentComparison } from "@/hooks/useAssessmentApi";
import { changeInsight, scoreInsight, type ChangeInsight, type ScoreInsight } from "@/lib/assessment-insights";
import {
  DIMENSION_ORDER,
  formatAssessmentDate,
  type DimensionScores,
} from "@/lib/api/assessment";

const MAX_COMPARE = 3;

const POINTS = [
  { dx: 0, dy: -80 }, // Product (Top)
  { dx: 80, dy: -25 }, // Market (Top-Right)
  { dx: 50, dy: 65 }, // Money (Bottom-Right)
  { dx: -50, dy: 65 }, // Legal (Bottom-Left)
  { dx: -80, dy: -25 }, // Team (Top-Left)
];

const getPolygonString = (scores: DimensionScores) =>
  DIMENSION_ORDER.map((dim, i) => {
    const ratio = Math.max(0, Math.min(100, scores[dim])) / 100;
    return `${100 + POINTS[i].dx * ratio},${100 + POINTS[i].dy * ratio}`;
  }).join(" ");

const COLORS = [
  { fill: "var(--color-brand-x84a98c)", stroke: "var(--color-brand-x84a98c)" }, // Oldest
  { fill: "var(--color-info-x354f52)", stroke: "var(--color-info-x354f52)" }, // Middle
  { fill: "var(--color-accent-600)", stroke: "var(--color-accent-600)" }, // Newest
];

export default function AssessmentComparePage() {
  const router = useRouter();
  const { completed, loading, error, refetch } = useAssessmentHistory();

  // Chronological (oldest first); the colours run oldest -> newest.
  const chronological = [...completed].reverse();
  // Default selection is the latest three; `picked` overrides it once the founder toggles.
  const [picked, setPicked] = useState<string[] | null>(null);
  const selectedIds =
    picked ?? chronological.slice(-MAX_COMPARE).map((c) => c.id);
  const selected = chronological.filter((c) => selectedIds.includes(c.id));

  const { scores, loading: scoresLoading, error: scoresError } = useAssessmentComparison(
    selected.map((s) => s.id)
  );

  const toggle = (id: string) => {
    const current = selectedIds;
    if (current.includes(id)) setPicked(current.filter((i) => i !== id));
    else if (current.length < MAX_COMPARE) setPicked([...current, id]);
  };

  // Insight cards derived only from the real selected scores.
  const withScores = selected.filter((s) => scores[s.id]);
  const newest = withScores[withScores.length - 1];
  const oldest = withScores[0];
  let strength: ScoreInsight | null = null;
  let focus: ScoreInsight | null = null;
  let change: ChangeInsight | null = null;
  if (newest) {
    const ns = scores[newest.id];
    strength = scoreInsight(ns, "max");
    focus = scoreInsight(ns, "min");
    if (oldest && oldest.id !== newest.id) change = changeInsight(ns, scores[oldest.id]);
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="space-y-1">
        <h1 className="text-3xl md:text-4xl font-display font-semibold text-neutral-900 tracking-tight">
          How your fundamentals have matured
        </h1>
        <p className="text-neutral-500 text-sm md:text-base">Your latest assessments across every dimension.</p>
      </div>

      {loading && (
        <div className="bg-white p-8 rounded-modal border border-neutral-200/80 shadow-card text-center text-neutral-500" role="status">
          Loading your assessments...
        </div>
      )}

      {!loading && error && (
        <div className="bg-white p-8 rounded-modal border border-neutral-200/80 shadow-card text-center space-y-4" role="alert">
          <p className="text-neutral-500">{error}</p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="bg-brand-hover hover:bg-brand-x153427 text-white font-bold text-sm px-5 py-2.5 rounded-[8px] transition-colors"
          >
            Try again
          </button>
        </div>
      )}

      {!loading && !error && chronological.length === 0 && (
        <div className="bg-white p-8 rounded-modal border border-neutral-200/80 shadow-card text-center space-y-4">
          <p className="text-neutral-500">Nothing to compare yet. Complete your first assessment.</p>
          <button
            type="button"
            onClick={() => router.push("/assessment")}
            className="bg-brand-hover hover:bg-brand-x153427 text-white font-bold text-sm px-5 py-2.5 rounded-[8px] transition-colors"
          >
            Start the assessment
          </button>
        </div>
      )}

      {!loading && !error && chronological.length > 0 && (
        <>
          {chronological.length < 2 && (
            <div className="bg-neutral-50 p-4 rounded-card border border-neutral-200 text-sm text-neutral-600 mb-4">
              Complete at least two assessments to see a comparative growth chart.
            </div>
          )}

          {scoresError && (
            <p role="alert" className="text-sm text-danger-600">
              {scoresError}
            </p>
          )}

          {/* RADAR CHART DISPLAY CARD */}
          <div className="bg-white rounded-modal p-8 md:p-12 border border-neutral-200/80 shadow-card flex flex-col md:flex-row items-center justify-center gap-12">
            <div className="relative w-64 h-64 md:w-80 md:h-80 flex items-center justify-center shrink-0">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 200 200" role="img" aria-label="Radar chart of dimension scores">
                <polygon points="100,20 180,75 150,165 50,165 20,75" fill="none" stroke="var(--color-neutral-xe5e7eb)" strokeWidth="1" />
                <polygon points="100,40 160,85 135,145 65,145 40,85" fill="none" stroke="var(--color-neutral-xe5e7eb)" strokeWidth="1" />
                <polygon points="100,60 140,95 120,125 80,125 60,95" fill="none" stroke="var(--color-neutral-xe5e7eb)" strokeWidth="1" />

                <line x1="100" y1="100" x2="100" y2="20" stroke="var(--color-neutral-xe5e7eb)" strokeWidth="1" />
                <line x1="100" y1="100" x2="180" y2="75" stroke="var(--color-neutral-xe5e7eb)" strokeWidth="1" />
                <line x1="100" y1="100" x2="150" y2="165" stroke="var(--color-neutral-xe5e7eb)" strokeWidth="1" />
                <line x1="100" y1="100" x2="50" y2="165" stroke="var(--color-neutral-xe5e7eb)" strokeWidth="1" />
                <line x1="100" y1="100" x2="20" y2="75" stroke="var(--color-neutral-xe5e7eb)" strokeWidth="1" />

                <text x="100" y="10" fontSize="8" fill="var(--color-neutral-x6b7280)" textAnchor="middle">Product</text>
                <text x="190" y="75" fontSize="8" fill="var(--color-neutral-x6b7280)" textAnchor="start">Market</text>
                <text x="155" y="175" fontSize="8" fill="var(--color-neutral-x6b7280)" textAnchor="start">Money</text>
                <text x="45" y="175" fontSize="8" fill="var(--color-neutral-x6b7280)" textAnchor="end">Legal</text>
                <text x="10" y="75" fontSize="8" fill="var(--color-neutral-x6b7280)" textAnchor="end">Team</text>

                {chronological.map((h, i) => {
                  const s = scores[h.id];
                  if (!selectedIds.includes(h.id) || !s) return null;
                  const color = COLORS[i % COLORS.length];
                  return (
                    <polygon
                      key={h.id}
                      points={getPolygonString(s)}
                      fill={color.fill}
                      fillOpacity="0.2"
                      stroke={color.stroke}
                      strokeWidth="2"
                      className="transition-all duration-500 ease-in-out"
                    />
                  );
                })}
              </svg>
            </div>

            {/* LEGEND & CONTROLS */}
            <div className="space-y-4 min-w-[200px] w-full md:w-auto">
              <h3 className="text-sm font-semibold text-neutral-900 mb-2">Compare versions</h3>
              <p className="text-xs text-neutral-500">Pick up to {MAX_COMPARE}.</p>

              <div className="flex flex-col gap-3">
                {chronological.map((h, i) => {
                  const isSelected = selectedIds.includes(h.id);
                  const color = COLORS[i % COLORS.length];
                  const atCap = !isSelected && selectedIds.length >= MAX_COMPARE;
                  return (
                    <button
                      key={h.id}
                      type="button"
                      onClick={() => toggle(h.id)}
                      disabled={atCap}
                      aria-pressed={isSelected}
                      className={`flex items-center gap-3 text-sm font-medium p-3 rounded-card border transition-all text-left disabled:cursor-not-allowed ${
                        isSelected ? "border-neutral-300 bg-neutral-50/50" : "border-transparent hover:bg-neutral-50/30 opacity-60"
                      }`}
                    >
                      <span
                        className="w-4 h-4 rounded-[3px] shrink-0 border"
                        style={{ backgroundColor: isSelected ? color.fill : "transparent", borderColor: color.stroke }}
                      />
                      <div className="flex flex-col">
                        <span className="text-neutral-900">{formatAssessmentDate(h.completed_at)}</span>
                        <span className="text-xs text-neutral-500">
                          {h.type === "initial" ? "Kickoff" : "Quarterly"} · Score: {h.overall_provisional ?? "-"}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
              {scoresLoading && <p className="text-xs text-neutral-500">Loading scores...</p>}
            </div>
          </div>

          {/* METRIC CARDS (derived from the selected assessments' real scores) */}
          {strength && focus && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {change && (
                <div className="bg-white p-6 rounded-modal border border-neutral-200/80 shadow-card space-y-2" data-testid="change-card">
                  <h4 className="text-sm font-semibold text-neutral-600">
                    {change.kind === "improvement" ? "Biggest improvement" : change.kind === "drop" ? "Biggest drop" : "No dimension improved"}
                  </h4>
                  <p className={`text-2xl font-bold ${change.kind === "drop" ? "text-danger-600" : "text-brand-hover"}`}>
                    {change.kind === "none"
                      ? "No change"
                      : `${change.delta > 0 ? "+" : ""}${change.delta} ${change.label}${change.tied ? " (tied)" : ""}`}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {change.kind === "drop" ? "Nothing improved. " : ""}Since {formatAssessmentDate(oldest.completed_at)}.
                  </p>
                </div>
              )}
              <div className="bg-white p-6 rounded-modal border border-neutral-200/80 shadow-card space-y-2">
                <h4 className="text-sm font-semibold text-neutral-600">Core strength</h4>
                <p className="text-2xl font-bold text-neutral-900">{strength.label}{strength.tied ? " (tied)" : ""}</p>
                <p className="text-xs text-neutral-500">Highest in your latest result at {strength.score}/100.</p>
              </div>
              <div className="bg-white p-6 rounded-modal border border-neutral-200/80 shadow-card space-y-2">
                <h4 className="text-sm font-semibold text-accent-600">Focus area</h4>
                <p className="text-2xl font-bold text-neutral-900">{focus.label}{focus.tied ? " (tied)" : ""}</p>
                <p className="text-xs text-neutral-500">Lowest in your latest result at {focus.score}/100.</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
