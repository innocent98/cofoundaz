// components/CofaundazLogo.tsx
import React from 'react';
import BrandLogo from '@/components/brand/BrandLogo';

export default function CofaundazLogo() {
  // Rendered on the dark sidebar rail, so it uses the light (white) wordmark.
  return (
    <div className="flex min-w-0 items-center">
      <BrandLogo tone="light" height={26} eager />
    </div>
  );
}
