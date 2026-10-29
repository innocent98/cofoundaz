'use client';

import React from 'react';
import Link from 'next/link';
import { Bell, Sparkles } from 'lucide-react';
import { Banner, Card } from './ui';

/** The notification preferences, digest and quiet hours live on the Notifications page. */
export function NotificationsTab(): React.JSX.Element {
  return (
    <Card title="Notifications" description="Choose which emails you get, set a daily or weekly digest, and pick quiet hours.">
      <Link
        href="/notifications?tab=preferences"
        className="inline-flex items-center gap-2 bg-accent-gold hover:bg-accent-xa38346 text-white font-semibold px-4 py-2.5 rounded-modal text-xs shadow-card"
      >
        <Bell className="w-3.5 h-3.5" aria-hidden />
        Open notification settings
      </Link>
    </Card>
  );
}

/** AI preferences have no API yet (gap S8), so the existing page is linked as it is. */
export function AiPreferencesTab(): React.JSX.Element {
  return (
    <div className="space-y-6">
      <Banner tone="info" title="AI preferences are not saved yet">
        The AI Co-Founder settings page is a preview. Changes there are not stored until the AI memory service ships.
      </Banner>
      <Card title="AI preferences" description="Tone, daily briefing, and what the AI Co-Founder remembers.">
        <Link
          href="/ai/settings"
          className="inline-flex items-center gap-2 bg-white hover:bg-neutral-50 text-ink border border-line-stone font-semibold px-4 py-2.5 rounded-modal text-xs"
        >
          <Sparkles className="w-3.5 h-3.5" aria-hidden />
          Open AI preferences
        </Link>
      </Card>
    </div>
  );
}
