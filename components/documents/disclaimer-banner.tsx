import React from 'react';
import { Scale } from 'lucide-react';

/** The legal "not legal advice" notice (D-DOC-4). The text always comes from the API, never a local copy. */
export function DisclaimerBanner({ text }: { text: string | null | undefined }) {
  if (!text) return null;
  return (
    <div role="note" aria-label="Not legal advice" className="bg-warning-50 border border-warning-100 rounded-card p-4 flex items-start gap-3">
      <Scale className="w-5 h-5 text-warning-800 shrink-0 mt-0.5" aria-hidden />
      <p className="text-xs text-warning-800 leading-relaxed">{text}</p>
    </div>
  );
}
