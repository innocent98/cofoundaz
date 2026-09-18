'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiClient } from '@/lib/api/client';

// Guide §7: the opt-in template gallery (6 named packs), separate from the
// stage template auto-generated at onboarding. Applying one appends its phases
// to the existing roadmap — additive, non-destructive, idempotent.

export interface RoadmapTemplateSummary {
  id: string;
  title: string;
  stage: string | null; // nullable — some packs aren't tied to one stage
  category: string;
  milestone_count: number;
  task_count: number;
  applied: boolean; // per-roadmap: is this pack already applied to THIS workspace
}

export interface RoadmapTemplateTask {
  title: string;
  effort: string;
}
export interface RoadmapTemplatePhase {
  name: string;
  milestones: { title: string; tasks: RoadmapTemplateTask[] }[];
}
export interface RoadmapTemplateDetail extends RoadmapTemplateSummary {
  phases: RoadmapTemplatePhase[];
}

export interface ApplyTemplateResult {
  already_applied: boolean;
  added: { phases: number; milestones: number; tasks: number };
}

export function useRoadmapTemplates() {
  const [templates, setTemplates] = useState<RoadmapTemplateSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // GET /roadmap/templates returns `data` as a flat array (not {templates:[…]}).
      const res = await apiClient<{ data?: RoadmapTemplateSummary[] }>('/roadmap/templates');
      setTemplates(Array.isArray(res?.data) ? res.data : []);
    } catch (err) {
      setError((err as { message?: string })?.message || 'Failed to load templates');
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void (async () => {
      await load();
    })();
  }, [load]);

  // Read-only preview of a pack's phase/milestone/task breakdown (no ids/dates).
  const getTemplate = useCallback(async (id: string): Promise<RoadmapTemplateDetail | null> => {
    try {
      const res = await apiClient<{ data?: RoadmapTemplateDetail }>(`/roadmap/templates/${id}`);
      return res?.data ?? null;
    } catch {
      return null;
    }
  }, []);

  // Apply appends the pack to the roadmap. 201 fresh / 200 already-applied are
  // BOTH success — use `already_applied`, not the status, to choose the copy.
  // Re-list so the card's `applied` flag flips.
  const applyTemplate = useCallback(
    async (id: string): Promise<ApplyTemplateResult> => {
      const res = await apiClient<{ data?: ApplyTemplateResult } & ApplyTemplateResult>(
        `/roadmap/templates/${id}/apply`,
        { method: 'POST' }
      );
      const data = (res?.data ?? res) as ApplyTemplateResult;
      await load();
      return data;
    },
    [load]
  );

  return { templates, loading, error, refetch: load, getTemplate, applyTemplate };
}
