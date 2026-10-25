import Link from 'next/link';
import { Flag } from 'lucide-react';
import type { MissionMilestone } from '@/hooks/useMissionApi';

/** The PRD milestone link chip: a roadmap task's milestone, linking to the roadmap's milestones view. */
export function MilestoneChip({ milestone }: { milestone: MissionMilestone }) {
  return (
    <Link
      href="/roadmap/milestones"
      className="inline-flex items-center gap-1.5 bg-brand-tint text-brand-mid text-xs font-medium px-3 py-1 rounded-full hover:bg-neutral-xdcebe2 transition-colors max-w-full"
    >
      <Flag className="w-3 h-3 fill-brand-mid shrink-0" aria-hidden="true" />
      <span className="truncate">{milestone.title}</span>
    </Link>
  );
}
