// components/CofaundazLogo.tsx
import React from 'react';

export default function CofaundazLogo() {
  // Rendered on the dark sidebar rail (#061A12): the wordmark must be light,
  // not the near-black (#12291F) it used to be — that was invisible on dark.
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="bg-[#9C5B34] text-white font-bold h-9 w-9 shrink-0 flex items-center justify-center rounded-card text-lg">
        C
      </div>
      <span className="truncate text-xl font-bold text-white tracking-tight">Cofoundaz</span>
    </div>
  );
}