import { useCallback, useEffect, useState } from 'react';
import { apiErrorInfo } from '@/lib/api/api-error';
import { waitForJob } from '@/lib/api/bb-jobs';
import {
  deleteScript,
  listScripts,
  requestScriptGeneration,
  updateScript,
  type RawScript,
  type ScriptJobResult,
  type ScriptQuestion,
} from '@/lib/api/validation';
import { STILL_WORKING_COPY } from '@/lib/validation-format';
import { OVER_BUDGET_COPY } from '@/hooks/useExperimentDraft';

export type ScriptOutcome =
  | { ok: true; scriptId: string }
  | { ok: false; message: string; pending?: boolean };

/** Maps a finished job's `result` to the saved script id or an honest message (guide §1b). */
export function outcomeFromScriptResult(result: ScriptJobResult | null | undefined): ScriptOutcome {
  switch (result?.status) {
    case 'ready':
      return result.script_id
        ? { ok: true, scriptId: result.script_id }
        : { ok: false, message: "The AI couldn't write questions this time. Try again." };
    case 'over_budget':
      return { ok: false, message: OVER_BUDGET_COPY };
    case 'gone':
      return { ok: false, message: 'Those assumptions were deleted.' };
    default:
      return { ok: false, message: "The AI couldn't write questions this time. Try again." };
  }
}

/** Interview scripts: list, generate (job + poll), save, delete. Real API only, no seed data. */
export function useScripts() {
  const [scripts, setScripts] = useState<RawScript[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setScripts(await listScripts());
    } catch (err) {
      setError(apiErrorInfo(err, 'Could not load your scripts.').message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void load();
    });
  }, [load]);

  const generate = useCallback(
    async (assumptionIds: string[]): Promise<ScriptOutcome> => {
      setGenerating(true);
      try {
        const jobId = await requestScriptGeneration(assumptionIds);
        // The worker retries a failed model call after 30 s, so the job reads `queued` meanwhile: cap at ~90 s.
        const out = await waitForJob<ScriptJobResult>(jobId, { timeoutMs: 90000 });
        if (out.state === 'timeout') return { ok: false, message: STILL_WORKING_COPY, pending: true };
        if (out.state === 'failed') return { ok: false, message: "The AI couldn't write questions this time. Try again." };
        const outcome = outcomeFromScriptResult(out.result);
        if (outcome.ok) await load();
        return outcome;
      } catch (err) {
        const info = apiErrorInfo(err, 'Could not generate a script. Try again.');
        if (info.status === 429) return { ok: false, message: OVER_BUDGET_COPY };
        if (info.status === 403) return { ok: false, message: 'Only a founder or team member can write scripts.' };
        return { ok: false, message: info.message };
      } finally {
        setGenerating(false);
      }
    },
    [load]
  );

  /** Sends the whole ordered question list; ids of existing questions are kept. */
  const save = useCallback(async (id: string, body: { title: string; questions: ScriptQuestion[] }): Promise<RawScript> => {
    const saved = await updateScript(id, {
      title: body.title.trim(),
      questions: body.questions.map((q) => ({ ...(q.id ? { id: q.id } : {}), question: q.question.trim(), tip: q.tip.trim() })),
    });
    setScripts((prev) => prev.map((s) => (s.id === id ? saved : s)));
    return saved;
  }, []);

  const remove = useCallback(async (id: string) => {
    await deleteScript(id);
    setScripts((prev) => prev.filter((s) => s.id !== id));
  }, []);

  return { scripts, loading, error, generating, generate, save, remove, refetch: load };
}
