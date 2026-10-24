import React from 'react';
import { AlertCircle, RotateCw } from 'lucide-react';
import type { RoadmapMilestone } from '@/hooks/useRoadmapApi';
import { formatDue } from '@/lib/roadmap-format';

export function OverdueChip() {
  return (
    <span className="flex w-fit items-center gap-1 whitespace-nowrap bg-danger-tint text-danger-600 px-2 py-0.5 rounded text-[10px] font-bold shrink-0 border border-danger-xfad7d7">
      <AlertCircle className="w-3 h-3" aria-hidden="true" />
      Overdue
    </span>
  );
}

/** "Re-planned" chip; the tooltip says when and why (PRD 05.1: "Adjusted on {date} because {reason}"). */
export function ReplannedChip({ replanned }: { replanned: NonNullable<RoadmapMilestone['replanned']> }) {
  const tip = `Adjusted on ${formatDue(replanned.at.slice(0, 10))} because ${replanned.reason}`;
  return (
    <span
      title={tip}
      aria-label={`Re-planned. ${tip}`}
      tabIndex={0}
      className="flex w-fit items-center gap-1 whitespace-nowrap bg-accent-100 text-accent-600 px-2 py-0.5 rounded text-[10px] font-bold shrink-0 border border-accent-200"
    >
      <RotateCw className="w-3 h-3" aria-hidden="true" />
      Re-planned
    </span>
  );
}
