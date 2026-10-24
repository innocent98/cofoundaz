'use client';

import React from 'react';

export function greetingFor(hour: number): string {
  return hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
}

/** "Good evening, Victor." or, when the member has no profile name yet, "Good evening." (never "Good evening, ."). */
export function greetingLine(salutation: string, firstName?: string | null): string {
  const name = firstName?.trim();
  return name ? `${salutation}, ${name}.` : `${salutation}.`;
}

export function GreetingHeader({
  firstName,
  startupName,
  now = new Date(),
}: {
  firstName?: string | null;
  startupName?: string | null;
  now?: Date;
}) {
  const formattedDate = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'short', day: 'numeric' }).format(now);
  const startup = startupName?.trim();
  return (
    <section className="mb-6 w-full">
      <h1 className="text-3xl font-display font-bold text-neutral-900 mb-1">
        {greetingLine(greetingFor(now.getHours()), firstName)}
      </h1>
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-neutral-500">
        <p>Here&apos;s where {startup || 'your startup'} stands today.</p>
        <span className="text-neutral-500">{formattedDate}</span>
      </div>
    </section>
  );
}

export function GreetingSkeleton() {
  return (
    <section className="mb-6 w-full" role="status" aria-label="Loading your dashboard">
      <div className="h-9 w-72 max-w-full rounded-pill bg-neutral-100 animate-pulse mb-3" />
      <div className="h-4 w-56 max-w-full rounded-pill bg-neutral-100 animate-pulse" />
    </section>
  );
}
