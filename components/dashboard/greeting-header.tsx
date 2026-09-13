'use client';

import React, { useState } from 'react';

function getGreeting(): string {
  if (typeof window === 'undefined') return 'Good day';
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export function GreetingHeader({ firstName, startupName }: { firstName: string; startupName: string }) {
  const [greeting] = useState<string>(getGreeting);

  return (
    <section className="mb-6 w-full col-span-1 md:col-span-12">
      <h1 className="text-[28px] md:text-[32px] font-bold text-[#1C201D] font-display tracking-tight leading-tight mb-1.5 flex items-center gap-3">
        {greeting}, {firstName}.
      </h1>
      <p className="text-base text-sage-500 font-medium tracking-wide">
        Here&apos;s where {startupName} stands today.
      </p>
    </section>
  );
}