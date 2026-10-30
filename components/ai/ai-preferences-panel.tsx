'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { apiErrorInfo } from '@/lib/api/api-error';
import { getAiSettings, updateAiSettings, type AiSettings, type AiTone } from '@/lib/api/settings';

const TONES: Array<{ value: AiTone; title: string; hint: string }> = [
  { value: 'straight_shooter', title: 'Straight shooter', hint: 'Direct, no hedging.' },
  { value: 'encouraging', title: 'Encouraging', hint: 'Warm, still honest.' },
];

function Switch({ checked, busy, label, onChange }: { checked: boolean; busy: boolean; label: string; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={busy}
      onClick={() => onChange(!checked)}
      className={`w-12 h-6 shrink-0 rounded-full transition-colors p-0.5 flex items-center cursor-pointer disabled:opacity-60 ${checked ? 'bg-brand-strong' : 'bg-neutral-xd0d0c8'}`}
    >
      <span className={`w-5 h-5 rounded-full bg-white shadow-card transform transition-transform ${checked ? 'translate-x-6' : 'translate-x-0'}`} />
    </button>
  );
}

/**
 * The three AI Co-Founder switches (PRD 03.5), saved per member on `PATCH /ai/settings`. One component for
 * both Settings → AI preferences and /ai/settings, so there is one source of truth. The memory list is not
 * shown: there is no memory store yet.
 */
export function AiPreferencesPanel(): React.JSX.Element {
  const [settings, setSettings] = useState<AiSettings | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setSettings(await getAiSettings());
      setError(null);
    } catch (e) {
      const info = apiErrorInfo(e, "We couldn't load your AI preferences.");
      setError(info.status === 403 ? 'AI preferences are for founders and team members.' : info.message);
    }
  }, []);
  useEffect(() => {
    void (async () => {
      await load();
    })();
  }, [load]);

  const save = async (patch: Partial<AiSettings>) => {
    if (!settings || busy) return;
    const before = settings;
    setSettings({ ...settings, ...patch });
    setBusy(true);
    try {
      setSettings(await updateAiSettings(patch));
      toast.success('AI preferences saved.');
    } catch (e) {
      setSettings(before);
      toast.error(apiErrorInfo(e, "We couldn't save that. Try again.").message);
    } finally {
      setBusy(false);
    }
  };

  if (error && !settings) {
    return (
      <div role="alert" className="bg-white rounded-modal border border-line-soft p-6 shadow-card text-xs text-danger-ink flex items-center justify-between gap-4">
        <span>{error}</span>
        <button type="button" onClick={load} className="font-semibold underline cursor-pointer">Retry</button>
      </div>
    );
  }
  if (!settings) return <p role="status" className="text-xs text-ink-subtle py-8 text-center">Loading preferences…</p>;

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-white rounded-modal border border-line-soft p-6 shadow-card flex flex-col divide-y divide-line-faint">
        <div className="flex items-center justify-between gap-4 pb-4">
          <div>
            <h3 className="font-bold text-sm text-ink">Proactive suggestions</h3>
            <p className="text-xs text-ink-muted">
              Let me surface moves before you ask. Off removes the suggested next steps and Opportunities from your dashboard briefing and stops the course recommendation emails.
            </p>
          </div>
          <Switch checked={settings.proactive_suggestions} busy={busy} label="Proactive suggestions" onChange={(v) => save({ proactive_suggestions: v })} />
        </div>
        <div className="flex items-center justify-between gap-4 pt-4">
          <div>
            <h3 className="font-bold text-sm text-ink">Daily briefing</h3>
            <p className="text-xs text-ink-muted">
              A morning digest of what needs you. Off hides today&rsquo;s briefing too, and stops generating a new one and the &ldquo;briefing is ready&rdquo; notification for you.
            </p>
          </div>
          <Switch checked={settings.daily_briefing} busy={busy} label="Daily briefing" onChange={(v) => save({ daily_briefing: v })} />
        </div>
      </div>

      <div className="bg-white rounded-modal border border-line-soft p-6 shadow-card">
        <h3 className="font-bold text-sm text-ink mb-1">Tone</h3>
        <p className="text-xs text-ink-muted mb-4">Applies to new replies and new briefings, not past ones.</p>
        <div role="radiogroup" aria-label="Tone" className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {TONES.map((t) => (
            <button
              key={t.value}
              type="button"
              role="radio"
              aria-checked={settings.tone === t.value}
              disabled={busy}
              onClick={() => settings.tone !== t.value && save({ tone: t.value })}
              className={`text-left p-4 rounded-card border transition-all cursor-pointer disabled:opacity-60 ${settings.tone === t.value ? 'bg-brand-tint border-brand-strong' : 'bg-white border-line-soft hover:border-neutral-xd0d0c8'}`}
            >
              <span className="block font-bold text-sm text-ink">{t.title}</span>
              <span className="block text-xs text-ink-muted mt-1">{t.hint}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
