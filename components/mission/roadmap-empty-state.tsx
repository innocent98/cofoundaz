import { ArrowRight, Flag, Loader2 } from 'lucide-react';
import { MISSION_COPY } from './mission-copy';

/** PRD 04.1 no-roadmap state: the mission needs a roadmap, and this builds one in place. */
export function RoadmapEmptyState({
  onGenerate,
  generating,
  failed,
}: {
  onGenerate: () => void;
  generating: boolean;
  failed?: boolean;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
      <div className="w-16 h-16 bg-[#EAF2ED] rounded-full flex items-center justify-center mb-2">
        <Flag className="w-7 h-7 text-[#2D5A3F]" aria-hidden="true" />
      </div>
      <h3 className="text-2xl md:text-3xl font-display font-bold text-[#1E2923]">{MISSION_COPY.noRoadmapTitle}</h3>
      <p className="text-base text-[#617065] max-w-md">{MISSION_COPY.noRoadmapBody}</p>
      {failed && (
        <p role="alert" className="text-sm text-[#B0483B]">
          We couldn&apos;t generate your roadmap. Try again.
        </p>
      )}
      <button
        type="button"
        onClick={onGenerate}
        disabled={generating}
        className="inline-flex items-center gap-1.5 bg-[#9C5B34] hover:bg-[#8A5330] disabled:opacity-60 text-white text-sm font-bold px-6 py-3 rounded-card transition-colors shadow-card cursor-pointer"
      >
        {generating ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : null}
        <span>{generating ? 'Generating…' : MISSION_COPY.noRoadmapCta}</span>
        {!generating && <ArrowRight className="w-4 h-4" aria-hidden="true" />}
      </button>
    </div>
  );
}
