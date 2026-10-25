'use client';

import React from 'react';
import Link from 'next/link';

/** PRD 01.6 step 6: shown while the kickoff assessment is not done. */
export const CALIBRATION_COPY =
  'Your workspace is running on defaults. Complete your assessment to unlock an accurate Health Score and roadmap.';

export function CalibrationBanner({ assessmentComplete }: { assessmentComplete: boolean | undefined }) {
  // Only an explicit `false` shows the banner: unknown or errored must not nag.
  if (assessmentComplete !== false) return null;
  return (
    <div
      role="region"
      aria-label="Finish setting up your workspace"
      className="mb-6 flex flex-col gap-3 rounded-card border border-accent-xeadbca bg-neutral-xf9f7f2 px-5 py-4 md:flex-row md:items-center md:justify-between"
    >
      <p className="text-sm font-medium text-warning leading-relaxed">{CALIBRATION_COPY}</p>
      <Link
        href="/assessment"
        className="shrink-0 self-start rounded-input bg-accent-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-700 md:self-auto"
      >
        Complete assessment
      </Link>
    </div>
  );
}
