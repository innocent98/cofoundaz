import { Loader2 } from 'lucide-react';
import { MISSION_COPY } from './mission-copy';

/** PRD 04.1 pending state, shown while the mission loads or is being generated. */
export function MissionLoading() {
  return (
    <div role="status" className="flex flex-col items-center justify-center gap-3 py-24 text-center">
      <Loader2 className="w-6 h-6 text-brand-mid animate-spin" aria-hidden="true" />
      <p className="text-sm font-medium text-ink-muted">{MISSION_COPY.building}</p>
    </div>
  );
}
