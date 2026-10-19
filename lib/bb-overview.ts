import type { OverviewRow } from '@/lib/api/business-builder';

export interface TileCta {
  label: string;
  /** Where the tile links to; null keeps the tile's own page path. */
  href: string | null;
}

/**
 * The tile's call to action comes from the API `status`, never from the
 * completion percentage: an untouched artifact is "Start", a part-filled one
 * "Continue", a finished one "Review". Read-only roles see "View" instead of "Start".
 */
export function ctaFor(row: OverviewRow | undefined, canWrite: boolean): TileCta {
  const status = row?.status ?? 'start';
  switch (status) {
    case 'complete':
      return { label: 'Review', href: null };
    case 'continue':
      return { label: 'Continue', href: null };
    default:
      return { label: canWrite ? 'Start' : 'View', href: null };
  }
}

/** The Business Plan tile (`type: "plan"`): none / generating / complete / failed. */
export function planCta(row: OverviewRow | undefined, canWrite: boolean): TileCta {
  switch (row?.status) {
    case 'generating':
      return { label: 'Generating', href: null };
    case 'complete':
      return row.document_id
        ? { label: 'Open document', href: `/documents/${row.document_id}` }
        : { label: 'Review', href: null };
    case 'failed':
      return { label: canWrite ? 'Try again' : 'View', href: null };
    default:
      return { label: canWrite ? 'Start' : 'View', href: null };
  }
}

export function planProgress(row: OverviewRow | undefined): number {
  return row?.status === 'complete' ? 100 : 0;
}

/** Rows keyed by `type`: the overview is a bare array and its order is not a contract. */
export function indexByType(rows: OverviewRow[]): Record<string, OverviewRow> {
  const out: Record<string, OverviewRow> = {};
  for (const r of rows) out[r.type] = r;
  return out;
}
