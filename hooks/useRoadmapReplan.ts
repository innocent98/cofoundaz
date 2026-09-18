'use client';

import { useCallback, useState } from 'react';
import { apiClient } from '@/lib/api/client';

// Guide §9: AI Re-plan is a two-step, human-gated flow. `preview` is a read-only
// POST that proposes date shifts for slipped milestones; `apply` commits the
// specific change_ids the founder accepted (recomputed server-side, so stale
// ones come back `skipped`); `history` is the audit trail of past applies.

export interface ReplanChange {
  change_id: string; // == milestone_id
  milestone_id: string;
  title: string;
  old_due: string;
  new_due: string;
  reason: string; // opaque templated prose — never parse it
}

export interface ReplanPreview {
  drift_count: number;
  changes: ReplanChange[];
}

export interface ReplanApplyResult {
  applied: string[];
  skipped: string[];
  replan_id: string | null;
  summary: string | null;
}

export interface ReplanHistoryEntry {
  id: string;
  change_count: number;
  summary: string;
  applied_by: { id: string; name: string | null } | null;
  created_at: string;
  changes: { title: string; reason: string; new_due: string; old_due: string; milestone_id: string }[];
}

export function useRoadmapReplan() {
  const [history, setHistory] = useState<ReplanHistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const previewReplan = useCallback(async (): Promise<ReplanPreview> => {
    const res = await apiClient<{ data?: ReplanPreview }>('/roadmap/replan/preview', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const d = res?.data;
    return { drift_count: d?.drift_count ?? 0, changes: Array.isArray(d?.changes) ? d.changes : [] };
  }, []);

  const applyReplan = useCallback(async (changeIds: string[]): Promise<ReplanApplyResult> => {
    const res = await apiClient<{ data?: ReplanApplyResult }>('/roadmap/replan/apply', {
      method: 'POST',
      body: JSON.stringify({ change_ids: changeIds }),
    });
    const d = res?.data;
    return {
      applied: Array.isArray(d?.applied) ? d.applied : [],
      skipped: Array.isArray(d?.skipped) ? d.skipped : [],
      replan_id: d?.replan_id ?? null,
      summary: d?.summary ?? null,
    };
  }, []);

  const loadHistory = useCallback(async () => {
    try {
      setHistoryLoading(true);
      const res = await apiClient<{ data?: ReplanHistoryEntry[] }>('/roadmap/replan/history');
      setHistory(Array.isArray(res?.data) ? res.data : []);
    } catch {
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  return { history, historyLoading, previewReplan, applyReplan, loadHistory };
}
