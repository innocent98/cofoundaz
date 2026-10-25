'use client';

import React from 'react';
import { Mail, Loader2 } from 'lucide-react';
import { useNotificationPreferences, NotifCategory } from '@/hooks/useNotificationPreferences';

const CATEGORIES: { key: NotifCategory; title: string; description: string }[] = [
  { key: 'documents', title: 'Documents', description: 'Shares and e-signature updates.' },
  { key: 'business', title: 'Business Builder', description: 'Suggestions and completed artifacts.' },
  { key: 'roadmap_missions', title: 'Roadmap & missions', description: 'Re-plans, milestones, and streaks.' },
  { key: 'health_assessment', title: 'Health & assessment', description: 'Score changes and completed assessments.' },
  { key: 'team', title: 'Team', description: 'New members joining your workspace.' },
];

function Toggle({ on, disabled, onClick, label }: { on: boolean; disabled?: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors shrink-0 ${
        disabled ? 'bg-neutral-xe5e5df cursor-not-allowed' : on ? 'bg-brand-strong cursor-pointer' : 'bg-neutral-xc5cfc7 cursor-pointer'
      }`}
    >
      <div className={`bg-white w-4 h-4 rounded-full shadow-raised transform transition-transform ${on ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  );
}

export function NotificationPreferences() {
  const { prefs, loading, error, saving, setMasterEmail, setCategory } = useNotificationPreferences();

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display text-ink-strong tracking-tight">Notification preferences</h1>
          <p className="text-xs text-ink-subtle mt-0.5">
            These control <span className="font-semibold">email</span> only, every notification still shows in your inbox.
          </p>
        </div>
        {saving && <span className="flex items-center gap-1 text-[11px] text-ink-subtle"><Loader2 className="w-3 h-3 animate-spin" /> Saving</span>}
      </div>

      {error && (
        <div className="bg-danger-tint border border-danger-xfad7d7 rounded-card p-3 text-xs font-semibold text-danger-600">{error}</div>
      )}

      {loading ? (
        <div className="bg-white border border-line rounded-[24px] shadow-card h-64 animate-pulse" />
      ) : (
        <div className="bg-white border border-line rounded-[24px] shadow-card overflow-hidden">
          {/* Master email switch */}
          <div className="flex items-center justify-between gap-4 px-6 py-4 bg-neutral-xfaf8f5 border-b border-line">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-input bg-white border border-line flex items-center justify-center">
                <Mail className="w-4 h-4 text-brand-strong" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-ink">Email notifications</h3>
                <p className="text-[11px] text-ink-subtle">Turn all emails off, or fine-tune by category below.</p>
              </div>
            </div>
            <Toggle on={prefs.master_email} onClick={() => setMasterEmail(!prefs.master_email)} label="Toggle all email notifications" />
          </div>

          {/* Per-category email toggles */}
          <div className="divide-y divide-neutral-xf2f2ec">
            {CATEGORIES.map((cat) => {
              const on = prefs.categories[cat.key];
              const effectiveOff = !prefs.master_email;
              return (
                <div key={cat.key} className="flex items-center justify-between gap-4 px-6 py-4 hover:bg-neutral-xfafaf7 transition-colors">
                  <div className="space-y-0.5 pr-4">
                    <h3 className="text-xs font-bold text-ink">{cat.title}</h3>
                    <p className="text-[11px] text-ink-subtle">
                      {cat.description}
                      {effectiveOff && on && <span className="text-danger-600"> · muted while email is off</span>}
                    </p>
                  </div>
                  <Toggle
                    on={on && prefs.master_email}
                    disabled={effectiveOff}
                    onClick={() => setCategory(cat.key, !on)}
                    label={`Toggle ${cat.title} email`}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
