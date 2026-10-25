import type { DraftResult } from '@/lib/api/documents';

/** "go_to_market" -> "Go to market" (the API names sections by key). */
export function sectionKeyLabel(key: string): string {
  const s = key.replace(/_/g, ' ').trim();
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : key;
}

/** Section headings use the same slug the API uses for form keys: "Market & Customer" -> "market_customer". */
export function headingKey(heading: string): string {
  return heading
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

const list = (keys: string[]) => keys.map(sectionKeyLabel).join(', ');

export type DraftTone = 'success' | 'warning' | 'danger' | 'info';
export interface DraftMessage {
  tone: DraftTone;
  title: string;
  detail?: string;
  retry: boolean;
}

/** Plain-language copy for each `result.status` (guide section 4). `gone` has no message. */
export function describeDraftResult(r: DraftResult): DraftMessage | null {
  const kept = r.skipped.length > 0 ? `Sections you wrote yourself were left alone: ${list(r.skipped)}.` : undefined;
  switch (r.status) {
    case 'ready':
      return {
        tone: 'success',
        title: r.drafted.length > 0 ? `AI drafted ${list(r.drafted)}.` : 'AI had nothing new to draft.',
        detail: kept,
        retry: false,
      };
    case 'partial':
      return {
        tone: 'warning',
        title: `AI drafted ${list(r.drafted)}, but ${r.failed.length === 1 ? '1 section' : `${r.failed.length} sections`} could not be drafted: ${list(r.failed)}.`,
        detail: kept,
        retry: true,
      };
    case 'failed':
      return {
        tone: 'danger',
        title: 'AI could not draft this document.',
        detail:
          r.reason === 'empty_draft'
            ? 'The AI returned no text. Try again in a moment.'
            : 'The AI service had a problem. Nothing was changed. Try again in a moment.',
        retry: true,
      };
    case 'over_budget':
      return {
        tone: 'warning',
        title: 'AI drafting is not available right now.',
        detail: 'Your workspace has used up today’s AI allowance. Try again tomorrow. Anything already drafted was kept.',
        retry: false,
      };
    default:
      return null;
  }
}

/** Poll cadence from the guide: every 2 s for the first 10 s, then every 5 s, give up after about 2 minutes. */
export function pollDelay(elapsedMs: number): number {
  return elapsedMs < 10_000 ? 2000 : 5000;
}
export const POLL_LIMIT_MS = 120_000;

/** Bracketed gaps like "[Receiving party]" mean a field was left empty in a legal clause. */
export function findBracketGaps(text: string): string[] {
  const out = new Set<string>();
  for (const m of text.matchAll(/\[([A-Za-z][^\]\n]{1,60})\]/g)) out.add(m[1]);
  return [...out];
}
