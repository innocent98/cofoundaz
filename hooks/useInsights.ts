import { useCallback, useState } from 'react';
import { apiErrorInfo } from '@/lib/api/api-error';
import { waitForJob } from '@/lib/api/bb-jobs';
import {
  applySuggestion,
  deleteInsight,
  getInsight,
  listInsights,
  requestSynthesis,
  type InsightJobResult,
  type InsightSource,
  type RawAssumption,
  type RawInsight,
} from '@/lib/api/validation';
import { STILL_WORKING_COPY } from '@/lib/validation-format';
import { OVER_BUDGET_COPY } from '@/hooks/useExperimentDraft';

export const NOTHING_TO_SYNTHESIZE_FALLBACK = 'Add an interview, collect an open survey answer or log some feedback first.';

export type SynthOutcome =
  | { ok: true; insightId: string }
  | { ok: false; kind: 'empty' | 'over_budget' | 'pending' | 'error'; message: string };

/** Maps a finished synthesis job's `result` (guide §2b). `empty` means the data vanished while queued. */
export function outcomeFromInsightResult(result: InsightJobResult | null | undefined): SynthOutcome {
  switch (result?.status) {
    case 'ready':
      return result.insight_id
        ? { ok: true, insightId: result.insight_id }
        : { ok: false, kind: 'error', message: 'The report came back empty. Try again.' };
    case 'over_budget':
      return { ok: false, kind: 'over_budget', message: OVER_BUDGET_COPY };
    case 'empty':
      return { ok: false, kind: 'empty', message: NOTHING_TO_SYNTHESIZE_FALLBACK };
    default:
      return { ok: false, kind: 'error', message: 'Could not synthesize insights. Try again.' };
  }
}

export type ApplyOutcome =
  | { ok: true; insight: RawInsight; assumption: RawAssumption }
  | { ok: false; kind: 'already' | 'gone' | 'error'; message: string };

/** Insight Synthesizer for one source tab: synthesize (job + poll), history, read, apply, delete. */
export function useInsights(source: InsightSource) {
  const [synthesizing, setSynthesizing] = useState(false);

  const synthesize = useCallback(async (): Promise<SynthOutcome> => {
    setSynthesizing(true);
    try {
      const jobId = await requestSynthesis(source);
      const out = await waitForJob<InsightJobResult>(jobId, { timeoutMs: 90000 });
      if (out.state === 'timeout') return { ok: false, kind: 'pending', message: STILL_WORKING_COPY };
      if (out.state === 'failed') return { ok: false, kind: 'error', message: 'Could not synthesize insights. Try again.' };
      return outcomeFromInsightResult(out.result);
    } catch (err) {
      const info = apiErrorInfo(err, 'Could not synthesize insights. Try again.');
      if (info.code === 'NOTHING_TO_SYNTHESIZE') return { ok: false, kind: 'empty', message: info.message };
      if (info.status === 429) return { ok: false, kind: 'over_budget', message: OVER_BUDGET_COPY };
      if (info.status === 403) return { ok: false, kind: 'error', message: 'Only a founder or team member can synthesize insights.' };
      return { ok: false, kind: 'error', message: info.message };
    } finally {
      setSynthesizing(false);
    }
  }, [source]);

  const history = useCallback(() => listInsights(), []);
  const read = useCallback((id: string) => getInsight(id), []);
  const remove = useCallback((id: string) => deleteInsight(id), []);

  /** 409 = already applied (caller refetches); 404 = the assumption (or suggestion) is gone. */
  const apply = useCallback(async (insightId: string, suggestionId: string): Promise<ApplyOutcome> => {
    try {
      const out = await applySuggestion(insightId, suggestionId);
      return { ok: true, insight: out.insight, assumption: out.assumption };
    } catch (err) {
      const info = apiErrorInfo(err, 'Could not apply that. Try again.');
      if (info.status === 409) return { ok: false, kind: 'already', message: 'This suggestion was already applied.' };
      if (info.status === 404) return { ok: false, kind: 'gone', message: 'That assumption no longer exists.' };
      return { ok: false, kind: 'error', message: info.message };
    }
  }, []);

  return { synthesizing, synthesize, history, read, remove, apply };
}
