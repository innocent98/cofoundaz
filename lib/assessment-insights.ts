import { DIMENSION_LABEL, DIMENSION_ORDER, type AssessmentDimension, type DimensionScores } from '@/lib/api/assessment';

/** "Product", "Product and Team", "Product, Team and Money". */
export function joinLabels(dims: AssessmentDimension[]): string {
  const names = dims.map((d) => DIMENSION_LABEL[d]);
  if (names.length <= 1) return names[0] ?? '';
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

export interface ScoreInsight {
  /** Dimension label(s); several when tied. */
  label: string;
  tied: boolean;
  score: number;
}

export interface ChangeInsight {
  kind: 'improvement' | 'drop' | 'none';
  label: string;
  tied: boolean;
  delta: number;
}

function extremes(values: Record<AssessmentDimension, number>, pick: 'max' | 'min') {
  const target = Math[pick](...DIMENSION_ORDER.map((d) => values[d]));
  return { target, dims: DIMENSION_ORDER.filter((d) => values[d] === target) };
}

/** Highest or lowest dimension of one result. Every tied dimension is named, never just the first. */
export function scoreInsight(scores: DimensionScores, pick: 'max' | 'min'): ScoreInsight {
  const { target, dims } = extremes(scores, pick);
  return { label: joinLabels(dims), tied: dims.length > 1, score: target };
}

/**
 * Change between the oldest and newest selected result. "Improvement" only when something actually rose;
 * otherwise the honest biggest drop, or "none" when nothing moved.
 */
export function changeInsight(newest: DimensionScores, oldest: DimensionScores): ChangeInsight {
  const delta = Object.fromEntries(DIMENSION_ORDER.map((d) => [d, newest[d] - oldest[d]])) as Record<AssessmentDimension, number>;
  const best = extremes(delta, 'max');
  if (best.target > 0) return { kind: 'improvement', label: joinLabels(best.dims), tied: best.dims.length > 1, delta: best.target };
  const worst = extremes(delta, 'min');
  if (worst.target < 0) return { kind: 'drop', label: joinLabels(worst.dims), tied: worst.dims.length > 1, delta: worst.target };
  return { kind: 'none', label: '', tied: false, delta: 0 };
}

/** Whole days since the latest completion; null when unknown or under the 90-day threshold (then say "over 90"). */
export function daysSinceCompletion(iso: string | null, now: number = Date.now()): number | null {
  if (!iso) return null;
  const days = Math.floor((now - new Date(iso).getTime()) / 86_400_000);
  return Number.isFinite(days) && days >= 90 ? days : null;
}
