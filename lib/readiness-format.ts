import type {
  Band,
  CheckError,
  DeckError,
  HistoryPoint,
  QaError,
  QaFocus,
  QaIntensity,
  Signal,
} from '@/lib/api/readiness';

export type Tone = 'success' | 'warning' | 'danger';

/** Same cut-offs as the verdict bands: under 40, 40 to 69, 70+. */
export function scoreTone(score: number): Tone {
  if (score >= 70) return 'success';
  if (score >= 40) return 'warning';
  return 'danger';
}

export const BAND_LABEL: Record<Band, string> = {
  not_yet: 'Not yet',
  getting_close: 'Getting close',
  ready: 'Ready',
};

export const FOCUS_OPTIONS: { value: QaFocus; label: string }[] = [
  { value: 'general', label: 'General' },
  { value: 'financials', label: 'Financials' },
  { value: 'market', label: 'Market' },
  { value: 'team', label: 'Team' },
];

export const INTENSITY_OPTIONS: { value: QaIntensity; label: string }[] = [
  { value: 'friendly_angel', label: 'Friendly angel' },
  { value: 'skeptical_vc', label: 'Skeptical VC' },
  { value: 'term_sheet_grilling', label: 'Term-sheet grilling' },
];

export const focusLabel = (f: QaFocus): string => FOCUS_OPTIONS.find((o) => o.value === f)?.label ?? f;
export const intensityLabel = (i: QaIntensity): string => INTENSITY_OPTIONS.find((o) => o.value === i)?.label ?? i;

// ---------------------------------------------------------------- signal values

const nf = new Intl.NumberFormat('en-NG', { maximumFractionDigits: 1 });

/** Whole naira (the score API reports NGN signals in whole naira, not kobo). */
export function formatNaira(n: number): string {
  return `₦${new Intl.NumberFormat('en-NG', { maximumFractionDigits: 0 }).format(n)}`;
}

/** Minor units (kobo / cents) as a short currency string: ₦1.6M, $2.5k, ₦900. */
export function formatMinor(minor: number, currency: string | null): string {
  const major = minor / 100;
  const sym = currency === 'USD' ? '$' : currency === 'NGN' || currency === null ? '₦' : `${currency} `;
  const abs = Math.abs(major);
  let body: string;
  if (abs >= 1e9) body = `${trim(major / 1e9)}B`;
  else if (abs >= 1e6) body = `${trim(major / 1e6)}M`;
  else if (abs >= 1e3) body = `${trim(major / 1e3)}k`;
  else body = trim(major);
  return `${sym}${body}`;
}

function trim(n: number): string {
  return String(Math.round(n * 10) / 10);
}

/** Display text for one side of a signal ("value" or "target"). `step` units are stages, never shown. */
export function formatSignalAmount(unit: string, n: number): string | null {
  switch (unit) {
    case 'step':
      return null;
    case 'NGN':
      return formatNaira(n);
    case '%':
      return `${nf.format(n)}%`;
    case 'months':
      return `${nf.format(n)} mo`;
    case '/5':
      return `${nf.format(n)}/5`;
    default:
      return nf.format(n);
  }
}

/** "₦300,000 of ₦1,000,000", or null for a step signal. */
export function signalProgress(s: Signal): string | null {
  const v = formatSignalAmount(s.unit, s.value);
  const t = formatSignalAmount(s.unit, s.target);
  return v === null || t === null ? null : `${v} of ${t}`;
}

/** `step` signals are stages of completion, so say where they are instead of a number. */
export function stepLabel(score: number): string {
  if (score >= 100) return 'Done';
  if (score <= 0) return 'Not started';
  return 'In progress';
}

// ---------------------------------------------------------------- history chart

export interface ChartPoint {
  x: number; // 0..100 across the range
  y: number; // 0..100, 0 at the bottom
  at: string;
  score: number;
}

/**
 * Points land on a real time axis: x is the position between (now - range) and now.
 * The API only stores a point when something changed, so the line is a step line that holds
 * the last score flat up to "now".
 */
export function chartPoints(points: HistoryPoint[], rangeDays: number, now: number): ChartPoint[] {
  const span = rangeDays * 86_400_000;
  const start = now - span;
  return points
    .map((p) => {
      const t = new Date(p.at).getTime();
      return { x: clamp(((t - start) / span) * 100), y: clamp(p.score), at: p.at, score: p.score };
    })
    .sort((a, b) => a.x - b.x);
}

/** SVG polyline "x,y" pairs (y flipped for SVG), stepped, extended flat to the right edge. */
export function stepPath(pts: ChartPoint[]): string {
  if (pts.length === 0) return '';
  const out: string[] = [];
  pts.forEach((p, i) => {
    if (i > 0) out.push(`${p.x},${100 - pts[i - 1].y}`);
    out.push(`${p.x},${100 - p.y}`);
  });
  out.push(`100,${100 - pts[pts.length - 1].y}`);
  return out.join(' ');
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, n));
}

/** Axis labels at the start, middle and end of the window. */
export function axisLabels(rangeDays: number, now: number): string[] {
  const fmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' });
  return [0, 0.5, 1].map((f) => fmt.format(new Date(now - rangeDays * 86_400_000 * (1 - f))));
}

// ---------------------------------------------------------------- copy for failures

export function deckErrorCopy(code: DeckError | null): string {
  switch (code) {
    case 'no_text':
      return 'We could not find readable text in this deck. Export it as a text PDF, not a scan or screenshots, and upload it again.';
    case 'unreadable':
      return 'We could not open this PDF. It may be damaged or password-protected. Export a fresh copy and upload it again.';
    case 'file_missing':
      return 'The uploaded file is no longer available. Upload the deck again.';
    case 'over_budget':
      return 'Today’s AI allowance ran out before the review finished. Try again later.';
    case 'generation_failed':
      return 'The review could not be completed. Try again later.';
    case 'job_failed':
      return 'The review stopped before it finished. Try again.';
    default:
      return 'The review did not finish. Try again.';
  }
}

/** Failures where re-sending the same deck can help; the others need a different file. */
export function deckErrorRetryable(code: DeckError | null): boolean {
  return code === 'over_budget' || code === 'generation_failed' || code === 'job_failed';
}

export function qaErrorCopy(code: QaError | null): string {
  switch (code) {
    case 'over_budget':
      return 'Today’s AI allowance ran out before your answers could be scored.';
    case 'transcript_gone':
      return 'The transcript is no longer available, so this session cannot be scored.';
    case 'generation_failed':
    case 'job_failed':
    default:
      return 'Scoring did not finish.';
  }
}

export function checkErrorCopy(code: CheckError | null): string {
  switch (code) {
    case 'over_budget':
      return 'Today’s AI allowance ran out before the check ran. Try again tomorrow.';
    case 'generation_failed':
    case 'processing_failed':
      return 'The check could not run. Try again.';
    case 'nothing_to_check':
      return 'Your narrative was cleared before the check ran.';
    case 'job_failed':
      return 'The check stopped. Try again.';
    default:
      return 'The check did not finish. Try again.';
  }
}

/** Is a gap's "Fix this" the market-size form on the score page itself? */
export function isMarketSizeGap(signalKey: string): boolean {
  return signalKey === 'market.size';
}

/** Minor units to a whole-number string for the market-size form ("5000000000" kobo -> "50000000"). */
export function minorToMajorInput(minor: number | null): string {
  return minor === null ? '' : String(Math.round(minor / 100));
}

/** Form text to minor units; null when empty, NaN when not a positive number. */
export function majorInputToMinor(text: string): number | null {
  const t = text.replace(/[,\s]/g, '');
  if (t === '') return null;
  const n = Number(t);
  if (!Number.isFinite(n) || n <= 0) return Number.NaN;
  return Math.round(n * 100);
}
