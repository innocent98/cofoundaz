import type { DimensionSignal, SignalUnit } from '@/hooks/useHealthDetails';

// Display helpers for the dimension drill-down. `unit` comes from the API
// (score | % | count | months | days | events); a runway row with status
// "not_burning" carries value 999 and must never be shown as a number.

function num(n: number): string {
  return Number.isInteger(n) ? String(n) : String(Math.round(n * 10) / 10);
}

function withUnit(n: number, unit: SignalUnit): string {
  const v = num(n);
  switch (unit) {
    case '%':
      return `${v}%`;
    case 'months':
      return `${v} ${n === 1 ? 'month' : 'months'}`;
    case 'days':
      return `${v} ${n === 1 ? 'day' : 'days'}`;
    case 'events':
      return `${v} ${n === 1 ? 'event' : 'events'}`;
    default:
      return v; // score and count read fine bare
  }
}

export function formatSignalValue(s: Pick<DimensionSignal, 'value' | 'unit' | 'status'>): string {
  if (s.status === 'not_burning') return 'Profitable';
  return withUnit(s.value, s.unit);
}

export function formatSignalTarget(s: Pick<DimensionSignal, 'target' | 'unit'>): string {
  return withUnit(s.target, s.unit);
}

function pts(n: number): string {
  return `${num(n)} ${Math.abs(n) === 1 ? 'pt' : 'pts'}`;
}

export function formatContribution(points: number): string {
  return points > 0 ? `+${pts(points)}` : pts(points);
}

/** "est. +1 pt" / "est. +3 pts": the recommendation lift estimate, singular at 1. */
export function formatLift(lift: number): string {
  return `est. +${pts(lift)}`;
}

/** The API calls the Financial dimension `money`; every screen says Financial. */
export function dimensionLabel(key: string): string {
  return key === 'money' ? 'Financial' : key;
}

const SOURCE_LABELS: Record<string, string> = {
  '/assessment': 'Assessment',
  '/roadmap': 'Roadmap',
  '/mission': 'Missions',
  '/mission/streaks': 'Mission streaks',
  '/validation/assumptions': 'Assumptions',
  '/validation/interviews': 'Interviews',
  '/finance': 'Finance',
  '/finance/runway': 'Runway',
  '/documents/signatures': 'E-signatures',
  '/team': 'Team',
  '/dashboard': 'Dashboard',
};

export function sourceLabel(href: string): string {
  if (SOURCE_LABELS[href]) return SOURCE_LABELS[href];
  const tail = href.split('/').filter(Boolean).pop() ?? 'Open';
  return tail.replace(/[-_]/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
}
