import { useCallback, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useRoadmapApi, type RoadmapMilestone } from '@/hooks/useRoadmapApi';
import { useTeamMembers } from '@/hooks/useTeamMembers';
import { useMilestoneBreakdown } from '@/hooks/useMilestoneBreakdown';
import { useWorkspace } from '@/components/workspace-context';

/**
 * Everything a Roadmap view needs to host the shared drawer: the tree, the
 * members for pickers, the AI breakdown job, and which milestone is open.
 *
 * Notifications deep-link with `?milestone=<id>` or `?task=<id>` (a task opens
 * its milestone with that task's thread expanded). Closing clears the query.
 */
export function useRoadmapBoard() {
  const api = useRoadmapApi();
  const members = useTeamMembers();
  const { role } = useWorkspace();
  const breakdown = useMilestoneBreakdown(api.refetch);
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const paramsKey = params.toString();
  const milestoneParam = params.get('milestone');
  const taskParam = params.get('task');

  const allMilestones = useMemo(() => api.phases.flatMap((p) => p.milestones), [api.phases]);

  // What the URL asks for, resolved against the loaded tree.
  const linked = useMemo(() => {
    if (milestoneParam) return { milestoneId: milestoneParam, taskId: null as string | null };
    if (taskParam) {
      const owner = allMilestones.find((m) => m.tasks.some((t) => t.id === taskParam));
      return owner ? { milestoneId: owner.id, taskId: taskParam } : null;
    }
    return null;
  }, [milestoneParam, taskParam, allMilestones]);

  // A click overrides the URL only for the URL it was made under.
  const [pick, setPick] = useState<{ key: string; id: string | null } | null>(null);
  const openId = pick && pick.key === paramsKey ? pick.id : (linked?.milestoneId ?? null);
  const focusTaskId = pick && pick.key === paramsKey ? null : (linked?.taskId ?? null);
  const selected: RoadmapMilestone | null = allMilestones.find((m) => m.id === openId) ?? null;

  const open = useCallback((m: RoadmapMilestone) => setPick({ key: paramsKey, id: m.id }), [paramsKey]);
  const close = useCallback(() => {
    breakdown.clearHighlight();
    setPick({ key: paramsKey, id: null });
    if (paramsKey) router.replace(pathname, { scroll: false });
  }, [breakdown, paramsKey, router, pathname]);

  const canEdit = role === 'founder' || role === 'team_member';

  return { ...api, members, breakdown, canEdit, selected, focusTaskId, open, close, allMilestones };
}
