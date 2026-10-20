import { useCallback, useEffect, useState } from 'react';
import { apiErrorInfo } from '@/lib/api/api-error';
import { waitForJob } from '@/lib/api/bb-jobs';
import {
  createFeedback,
  deleteFeedback,
  getFeedbackThemes,
  listFeedback,
  listRoadmapMilestones,
  requestFeedbackClustering,
  restoreFeedback,
  sendThemeToRoadmap,
  updateFeedback,
  type ClusterJobResult,
  type FeedbackCounts,
  type FeedbackItem,
  type FeedbackThemes,
  type ManualFeedbackSource,
  type RoadmapMilestoneOption,
} from '@/lib/api/validation';
import { STILL_WORKING_COPY } from '@/lib/validation-format';
import { OVER_BUDGET_COPY } from '@/hooks/useExperimentDraft';

export const NOTHING_TO_CLUSTER_FALLBACK = 'Add some feedback first, or record an interview quote.';

export type ClusterOutcome =
  | { ok: true }
  | { ok: false; kind: 'empty' | 'over_budget' | 'pending' | 'error'; message: string };

/** Maps a finished clustering job's `result` (guide §2b). `ready` means refetch the themes. */
export function outcomeFromClusterResult(result: ClusterJobResult | null | undefined): ClusterOutcome {
  switch (result?.status) {
    case 'ready':
      return { ok: true };
    case 'over_budget':
      return { ok: false, kind: 'over_budget', message: OVER_BUDGET_COPY };
    case 'empty':
      return { ok: false, kind: 'empty', message: NOTHING_TO_CLUSTER_FALLBACK };
    default:
      return { ok: false, kind: 'error', message: 'Could not find themes. Try again.' };
  }
}

/** The milestone a theme goes to when the founder does not pick one: the first that is not done. */
export function defaultMilestoneId(options: RoadmapMilestoneOption[]): string | null {
  return options.find((m) => !m.done)?.id ?? null;
}

export type SendOutcome =
  | { ok: true; milestoneTitle: string }
  | { ok: false; kind: 'already' | 'no_milestone' | 'error'; message: string };

const errText = (err: unknown, fallback: string) => apiErrorInfo(err, fallback);

/**
 * MVP feedback tab: the inbox (list, filter, add / edit / delete / dismiss / restore) plus the
 * AI theme set (cluster job + poll, send to roadmap). Imported items are read-only.
 */
export function useFeedback() {
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [counts, setCounts] = useState<FeedbackCounts>({ interview: 0, survey: 0, in_app: 0, email: 0 });
  const [showDismissed, setShowDismissed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [themes, setThemes] = useState<FeedbackThemes>({ run: null, themes: [] });
  const [clustering, setClustering] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      const out = await listFeedback({ includeDismissed: showDismissed });
      setItems(out.items);
      setCounts(out.counts);
    } catch (err) {
      const info = errText(err, 'Could not load feedback.');
      setError(info.status === 403 ? "You don't have access to validation in this workspace." : info.message);
    } finally {
      setLoading(false);
    }
  }, [showDismissed]);

  const loadThemes = useCallback(async () => {
    try {
      setThemes(await getFeedbackThemes());
    } catch {
      // The inbox still works without themes; the section shows its empty state.
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void load();
    });
  }, [load]);

  useEffect(() => {
    queueMicrotask(() => {
      void loadThemes();
    });
  }, [loadThemes]);

  const add = useCallback(
    async (body: { text: string; source: ManualFeedbackSource; received_on?: string }) => {
      await createFeedback(body);
      await load();
    },
    [load]
  );

  const edit = useCallback(
    async (id: string, body: { text?: string; source?: ManualFeedbackSource; received_on?: string }) => {
      await updateFeedback(id, body);
      await load();
    },
    [load]
  );

  /** `deleted` for a manual item, `dismissed` for an imported one. Themes follow either way. */
  const remove = useCallback(
    async (id: string) => {
      const kind = await deleteFeedback(id);
      await Promise.all([load(), loadThemes()]);
      return kind;
    },
    [load, loadThemes]
  );

  const restore = useCallback(
    async (id: string) => {
      await restoreFeedback(id);
      await load();
    },
    [load]
  );

  const findThemes = useCallback(async (): Promise<ClusterOutcome> => {
    setClustering(true);
    try {
      const jobId = await requestFeedbackClustering();
      const out = await waitForJob<ClusterJobResult>(jobId, { timeoutMs: 90000 });
      if (out.state === 'timeout') return { ok: false, kind: 'pending', message: STILL_WORKING_COPY };
      if (out.state === 'failed') return { ok: false, kind: 'error', message: 'Could not find themes. Try again.' };
      const mapped = outcomeFromClusterResult(out.result);
      if (mapped.ok) await loadThemes();
      return mapped;
    } catch (err) {
      const info = errText(err, 'Could not find themes. Try again.');
      if (info.code === 'NOTHING_TO_CLUSTER') return { ok: false, kind: 'empty', message: info.message };
      if (info.status === 429) return { ok: false, kind: 'over_budget', message: OVER_BUDGET_COPY };
      if (info.status === 403) return { ok: false, kind: 'error', message: 'Only a founder or team member can find themes.' };
      return { ok: false, kind: 'error', message: info.message };
    } finally {
      setClustering(false);
    }
  }, [loadThemes]);

  /** 409 ALREADY_SENT and 422 NO_OPEN_MILESTONE get their own kinds (guide §3). */
  const sendToRoadmap = useCallback(
    async (themeId: string, milestoneId?: string): Promise<SendOutcome> => {
      try {
        const out = await sendThemeToRoadmap(themeId, milestoneId);
        await loadThemes();
        return { ok: true, milestoneTitle: out.task.milestone_title };
      } catch (err) {
        const info = errText(err, 'Could not send that to your roadmap. Try again.');
        if (info.code === 'ALREADY_SENT' || info.status === 409) {
          await loadThemes();
          return { ok: false, kind: 'already', message: 'This theme is already on your roadmap.' };
        }
        if (info.code === 'NO_OPEN_MILESTONE') return { ok: false, kind: 'no_milestone', message: info.message };
        return { ok: false, kind: 'error', message: info.message };
      }
    },
    [loadThemes]
  );

  const milestones = useCallback(() => listRoadmapMilestones(), []);

  return {
    items,
    counts,
    loading,
    error,
    showDismissed,
    setShowDismissed,
    refetch: load,
    add,
    edit,
    remove,
    restore,
    themes,
    clustering,
    refreshThemes: loadThemes,
    findThemes,
    sendToRoadmap,
    milestones,
  };
}
