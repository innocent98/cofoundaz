import type { PlanOptions, PlanProgress, ReadinessItem } from '@/lib/api/business-builder';

export const AUDIENCES: Array<{ value: PlanOptions['audience']; label: string }> = [
  { value: 'bank', label: 'Bank' },
  { value: 'investors', label: 'Investors' },
  { value: 'internal', label: 'Internal' },
];

// A plain hyphen in the page ranges: no en or em dashes in rendered copy.
export const LENGTHS: Array<{ value: PlanOptions['length']; label: string }> = [
  { value: 'concise', label: 'Concise (10-15 pp)' },
  { value: 'full', label: 'Full (25-40 pp)' },
];

export const DEFAULT_PLAN_OPTIONS: PlanOptions = { audience: 'investors', length: 'concise' };

/** Section keys the API regenerates, with the heading each carries in the plan Document. */
export const PLAN_SECTIONS: Array<{ key: string; heading: string }> = [
  { key: 'executive_summary', heading: 'Executive Summary' },
  { key: 'problem', heading: 'Problem & Opportunity' },
  { key: 'solution', heading: 'Solution & Product' },
  { key: 'market', heading: 'Market & Customers' },
  { key: 'business_model', heading: 'Business Model' },
  { key: 'gtm', heading: 'Go-to-Market' },
  { key: 'competition', heading: 'Competition' },
  { key: 'team', heading: 'Team' },
  { key: 'financials', heading: 'Financials & Projections' },
  { key: 'milestones', heading: 'Roadmap & Milestones' },
];

/** A progress caption for the job screen: "Sizing your market…", never a doubled ellipsis. */
export function stageCaption(progress: PlanProgress | null | undefined): string {
  const stage = progress?.stage?.trim();
  if (!stage) return 'Starting';
  if (stage === 'Done') return stage;
  return stage.endsWith('…') || stage.endsWith('...') ? stage : `${stage}…`;
}

export function progressPercent(progress: PlanProgress | null | undefined): number {
  if (!progress || !progress.total) return 0;
  return Math.max(0, Math.min(100, Math.round((progress.done / progress.total) * 100)));
}

/** The copy for a failed run: over budget vs. the model kept failing. */
export function failureMessage(error: string | null | undefined): string {
  if (error === 'over_budget') return 'AI is at its daily limit, try again tomorrow.';
  return "I couldn't write your plan this time. Try again.";
}

export function isReady(item: ReadinessItem): boolean {
  return item.status === 'ready';
}

/** Readiness copy per row; partial and missing both show the warning. */
export function readinessNote(item: ReadinessItem): string {
  if (item.status === 'ready') return 'Ready';
  if (item.status === 'partial') return `Started, ${item.completion_pct}% filled`;
  return 'Not started';
}

/** Where to fix a readiness row by hand. */
export const READINESS_PATH: Record<string, string> = {
  business_model: '/business-builder/business-model-canvas',
  lean: '/business-builder/lean-canvas',
  value_prop: '/business-builder/value-proposition',
  mission_vision: '/business-builder/mission-vision',
  swot: '/business-builder/swot',
  persona: '/business-builder/personas',
  revenue_stream: '/business-builder/revenue-model',
  competitor: '/business-builder/competitive-analysis',
  pricing: '/business-builder/pricing',
};

/** What a finished regenerate-section job tells the founder. */
export function regenerateMessage(status: string | undefined, heading: string): { ok: boolean; text: string } {
  switch (status) {
    case 'ready':
      return { ok: true, text: `Rewrote ${heading}` };
    case 'section_missing':
      return {
        ok: false,
        text: `The ${heading} heading was renamed or removed in the document, so it can't be rewritten. Put the heading back and try again.`,
      };
    case 'over_budget':
      return { ok: false, text: 'AI is at its daily limit, try again tomorrow.' };
    case 'gone':
      return { ok: false, text: 'This plan is no longer available.' };
    default:
      return { ok: false, text: "I couldn't rewrite that section. Try again." };
  }
}
