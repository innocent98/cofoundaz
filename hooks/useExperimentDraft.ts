import { useCallback, useState } from 'react';
import { apiErrorInfo } from '@/lib/api/api-error';
import { waitForJob } from '@/lib/api/bb-jobs';
import { requestExperimentDraft, type ExperimentDraft, type ExperimentDraftResult } from '@/lib/api/validation';

export const OVER_BUDGET_COPY = 'AI is at its daily limit, try again tomorrow.';

export type DraftOutcome =
  | { ok: true; draft: ExperimentDraft }
  | { ok: false; message: string };

/** Maps a finished job's `result` to a draft or an honest message. */
export function outcomeFromDraftResult(result: ExperimentDraftResult | null | undefined): DraftOutcome {
  switch (result?.status) {
    case 'ready':
      return result.draft ? { ok: true, draft: result.draft } : { ok: false, message: 'The draft came back empty. Try again.' };
    case 'gone':
      return { ok: false, message: 'That assumption was deleted, so there is nothing to design an experiment for.' };
    case 'over_budget':
      return { ok: false, message: OVER_BUDGET_COPY };
    default:
      return { ok: false, message: 'Could not draft an experiment. Try again.' };
  }
}

/** "Design experiment": enqueue the draft job, poll `/jobs/{id}`, return the draft. Nothing is saved. */
export function useExperimentDraft() {
  const [drafting, setDrafting] = useState(false);

  const design = useCallback(async (assumptionId: string): Promise<DraftOutcome> => {
    setDrafting(true);
    try {
      const jobId = await requestExperimentDraft(assumptionId);
      const out = await waitForJob<ExperimentDraftResult>(jobId, { timeoutMs: 60000 });
      if (out.state === 'timeout') return { ok: false, message: 'Drafting is taking longer than usual. Try again in a moment.' };
      if (out.state === 'failed') return { ok: false, message: 'Could not draft an experiment. Try again.' };
      return outcomeFromDraftResult(out.result);
    } catch (err) {
      const info = apiErrorInfo(err, 'Could not draft an experiment. Try again.');
      if (info.status === 429) return { ok: false, message: OVER_BUDGET_COPY };
      if (info.status === 404) return outcomeFromDraftResult({ status: 'gone' });
      if (info.status === 403) return { ok: false, message: 'Only a founder or team member can design experiments.' };
      return { ok: false, message: info.message };
    } finally {
      setDrafting(false);
    }
  }, []);

  return { drafting, design };
}
