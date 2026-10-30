'use client';

import React from 'react';
import { AiUsageDisplay } from '@/components/ai/ai-usage-display';
import { AiPreferencesPanel } from '@/components/ai/ai-preferences-panel';

export default function SettingsPage() {
  return (
    <div className="max-w-3xl w-full mx-auto flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold text-ink tracking-tight mb-1">AI settings</h2>
        <p className="text-xs text-ink-muted">Tune how your Co-Founder works.</p>
      </div>

      {/* AI Usage, Quota, and Over-Budget Banner */}
      <AiUsageDisplay />

      <AiPreferencesPanel />
    </div>
  );
}
