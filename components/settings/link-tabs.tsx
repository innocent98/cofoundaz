'use client';

import React from 'react';
import Link from 'next/link';
import { Bell, Sparkles } from 'lucide-react';
import { AiPreferencesPanel } from '@/components/ai/ai-preferences-panel';
import { Card } from './ui';

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

/** The same panel as /ai/settings (one source of truth). Founder and team member only. */
export function AiPreferencesTab(): React.JSX.Element {
  return (
    <div className="space-y-6 max-w-3xl">
      <Card title="AI preferences" description="How your AI Co-Founder works with you. Saved for you only, in this workspace.">
        <Link href="/ai/settings" className="inline-flex items-center gap-2 text-xs font-semibold text-brand-strong hover:underline">
          <Sparkles className="w-3.5 h-3.5" aria-hidden />
          Usage and limits
        </Link>
      </Card>
      <AiPreferencesPanel />
    </div>
  );
}
