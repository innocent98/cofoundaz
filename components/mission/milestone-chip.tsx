import Link from 'next/link';
import { Flag } from 'lucide-react';
import type { MissionMilestone } from '@/hooks/useMissionApi';

/** The PRD milestone link chip: a roadmap task's milestone, linking to the roadmap's milestones view. */
export function MilestoneChip({ milestone }: { milestone: MissionMilestone }) {
  return (
    <Link
      href="/roadmap/milestones"
      className="inline-flex items-center gap-1.5 bg-[#EAF2ED] text-[#2D5A3F] text-xs font-medium px-3 py-1 rounded-full hover:bg-[#DCEBE2] transition-colors max-w-full"
    >
      <Flag className="w-3 h-3 fill-[#2D5A3F] shrink-0" aria-hidden="true" />
      <span className="truncate">{milestone.title}</span>
    </Link>
  );
}
