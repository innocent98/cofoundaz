'use client';

import React, { useMemo } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { useNotificationPreferences } from '@/hooks/useNotificationPreferences';

const DELIVERY_HOURS = [
  { val: '05:00', label: '5:00 AM' },
  { val: '06:00', label: '6:00 AM' },
  { val: '07:00', label: '7:00 AM' },
  { val: '08:00', label: '8:00 AM' },
  { val: '09:00', label: '9:00 AM' },
  { val: '10:00', label: '10:00 AM' },
];

const WEEK_DAYS = [
  { val: 0, label: 'Monday' },
  { val: 1, label: 'Tuesday' },
  { val: 2, label: 'Wednesday' },
  { val: 3, label: 'Thursday' },
  { val: 4, label: 'Friday' },
  { val: 5, label: 'Saturday' },
  { val: 6, label: 'Sunday' },
];

const QUIET_FROM_HOURS = [
  { val: '18:00', label: '6:00 PM' },
  { val: '19:00', label: '7:00 PM' },
  { val: '20:00', label: '8:00 PM' },
  { val: '21:00', label: '9:00 PM' },
  { val: '22:00', label: '10:00 PM' },
  { val: '23:00', label: '11:00 PM' },
];

const QUIET_UNTIL_HOURS = [
  { val: '04:00', label: '4:00 AM' },
  { val: '05:00', label: '5:00 AM' },
  { val: '06:00', label: '6:00 AM' },
  { val: '07:00', label: '7:00 AM' },
  { val: '08:00', label: '8:00 AM' },
  { val: '09:00', label: '9:00 AM' },
];

function formatTime12(hhmm: string): string {
  const [hStr, mStr] = hhmm.split(':');
  const h = Number(hStr);
  if (isNaN(h)) return hhmm;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${hour12}:${mStr || '00'} ${ampm}`;
}

export function NotificationDigestTab({
  onErrorToast,
}: {
  onErrorToast?: (msg: string) => void;
}) {
  const { prefs, loading, error, saving, update, reload } = useNotificationPreferences();

  // Browser timezone fallback
  const browserTz = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Africa/Lagos';
    } catch {
      return 'Africa/Lagos';
    }
  }, []);

  const timezones = useMemo(() => {
    const base = ['Africa/Lagos', browserTz, 'UTC', 'Europe/London', 'America/New_York', 'Asia/Dubai'];
    const saved = prefs?.timezone ? prefs.timezone.trim() : '';
    const combined = saved ? [...base, saved] : base;
    return Array.from(new Set(combined.filter(Boolean)));
  }, [browserTz, prefs]);

  const handleModeChange = async (mode: 'realtime' | 'daily' | 'weekly') => {
    const ok = await update({ digest_mode: mode });
    if (!ok && onErrorToast) {
      onErrorToast('Could not save digest mode.');
    }
  };

  const handleTimeChange = async (time: string) => {
    const ok = await update({ digest_time: time });
    if (!ok && onErrorToast) {
      onErrorToast('Could not save delivery time.');
    }
  };

  const handleDayChange = async (day: number) => {
    const ok = await update({ digest_day: day });
    if (!ok && onErrorToast) {
      onErrorToast('Could not save digest day.');
    }
  };

  const handleTimezoneChange = async (tz: string) => {
    const ok = await update({ timezone: tz });
    if (!ok && onErrorToast) {
      onErrorToast('Could not save timezone.');
    }
  };

  const handleQuietToggle = async () => {
    if (!prefs) return;
    const nextVal = !prefs.quiet_enabled;
    const ok = await update({ quiet_enabled: nextVal });
    if (!ok && onErrorToast) {
      onErrorToast('Could not save quiet hours setting.');
    }
  };

  const handleQuietFromChange = async (from: string) => {
    const ok = await update({ quiet_from: from });
    if (!ok && onErrorToast) {
      onErrorToast('Could not save quiet hours start time.');
    }
  };

  const handleQuietUntilChange = async (until: string) => {
    const ok = await update({ quiet_until: until });
    if (!ok && onErrorToast) {
      onErrorToast('Could not save quiet hours end time.');
    }
  };

  if (loading) {
    return (
      <div className="bg-white border border-line rounded-[24px] shadow-card p-6 space-y-4 animate-pulse">
        <div className="h-4 bg-neutral-200 rounded w-1/4" />
        <div className="h-24 bg-neutral-100 rounded" />
      </div>
    );
  }

  if (error || !prefs) {
    return (
      <div className="p-4 bg-danger-50 border border-danger-200 rounded-card flex items-center justify-between text-xs text-danger-800">
        <div className="flex items-center space-x-2">
          <AlertCircle size={16} />
          <span>{error || 'Failed to load preferences.'}</span>
        </div>
        <button
          type="button"
          onClick={() => void reload()}
          className="font-semibold underline cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }

  const selectedDayObj = WEEK_DAYS.find((d) => d.val === prefs.digest_day);
  const selectedDayLabel = selectedDayObj ? selectedDayObj.label : 'Monday';

  const quietFromLabel = formatTime12(prefs.quiet_from);
  const quietUntilLabel = formatTime12(prefs.quiet_until);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display text-ink-strong tracking-tight">Digest & quiet hours</h1>
          <p className="text-xs text-ink-subtle mt-0.5">
            Bundle non-critical notifications or pause email while you rest.
          </p>
        </div>
        {saving && (
          <span className="flex items-center gap-1.5 text-xs text-ink-subtle shrink-0">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Saving...</span>
          </span>
        )}
      </div>

      {/* DIGEST FREQUENCY CARDS */}
      <div className="bg-white border border-line rounded-[24px] p-6 shadow-card space-y-5">
        <div>
          <h3 className="text-xs font-bold text-ink uppercase tracking-wider">Email digest</h3>
          <p className="text-xs text-ink-muted mt-1">
            Choose how often you receive updates via email.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Off / Realtime */}
          <button
            type="button"
            onClick={() => void handleModeChange('realtime')}
            className={`p-4 rounded-modal border text-left transition-all cursor-pointer ${
              prefs.digest_mode === 'realtime'
                ? 'border-brand-strong bg-brand-tint shadow-card'
                : 'border-line hover:bg-neutral-50 bg-white'
            }`}
          >
            <div className="text-xs font-bold text-ink">Off</div>
            <p className="text-[11px] text-ink-subtle mt-1 leading-relaxed">
              Send notifications as they happen.
            </p>
          </button>

          {/* Daily (title fixed from 'Daily digest' to 'Daily' per review) */}
          <button
            type="button"
            onClick={() => void handleModeChange('daily')}
            className={`p-4 rounded-modal border text-left transition-all cursor-pointer ${
              prefs.digest_mode === 'daily'
                ? 'border-brand-strong bg-brand-tint shadow-card'
                : 'border-line hover:bg-neutral-50 bg-white'
            }`}
          >
            <div className="text-xs font-bold text-ink">Daily</div>
            <p className="text-[11px] text-ink-subtle mt-1 leading-relaxed">
              One summary email every morning.
            </p>
          </button>

          {/* Weekly (title fixed from 'Weekly digest' to 'Weekly' per review) */}
          <button
            type="button"
            onClick={() => void handleModeChange('weekly')}
            className={`p-4 rounded-modal border text-left transition-all cursor-pointer ${
              prefs.digest_mode === 'weekly'
                ? 'border-brand-strong bg-brand-tint shadow-card'
                : 'border-line hover:bg-neutral-50 bg-white'
            }`}
          >
            <div className="text-xs font-bold text-ink">Weekly</div>
            <p className="text-[11px] text-ink-subtle mt-1 leading-relaxed">
              A comprehensive weekly recap on {selectedDayLabel}.
            </p>
          </button>
        </div>

        {/* TIME & TIMEZONE CONTROLS (shown when not Off) */}
        {prefs.digest_mode !== 'realtime' && (
          <div className="pt-4 border-t border-line grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="delivery-time-select" className="block text-xs font-bold text-ink mb-1">Delivery time</label>
              <select
                id="delivery-time-select"
                value={prefs.digest_time}
                onChange={(e) => void handleTimeChange(e.target.value)}
                className="w-full bg-white border border-line rounded-modal px-3 py-2 text-xs text-ink focus:outline-none focus:border-accent-gold cursor-pointer"
              >
                {DELIVERY_HOURS.map((h) => (
                  <option key={h.val} value={h.val}>
                    {h.label}
                  </option>
                ))}
              </select>
            </div>

            {prefs.digest_mode === 'weekly' && (
              <div>
                <label htmlFor="digest-day-select" className="block text-xs font-bold text-ink mb-1">Day of week</label>
                <select
                  id="digest-day-select"
                  value={prefs.digest_day}
                  onChange={(e) => void handleDayChange(Number(e.target.value))}
                  className="w-full bg-white border border-line rounded-modal px-3 py-2 text-xs text-ink focus:outline-none focus:border-accent-gold cursor-pointer"
                >
                  {WEEK_DAYS.map((d) => (
                    <option key={d.val} value={d.val}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label htmlFor="timezone-select" className="block text-xs font-bold text-ink mb-1">Timezone</label>
              <select
                id="timezone-select"
                value={prefs.timezone || 'Africa/Lagos'}
                onChange={(e) => void handleTimezoneChange(e.target.value)}
                className="w-full bg-white border border-line rounded-modal px-3 py-2 text-xs text-ink focus:outline-none focus:border-accent-gold cursor-pointer"
              >
                {timezones.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        <div className="bg-surface-faint p-3 rounded-card text-xs text-ink-subtle leading-relaxed">
          Urgent alerts always arrive straight away, so they are not repeated in your digest.
        </div>
      </div>

      {/* QUIET HOURS BOX */}
      <div className="bg-white border border-line rounded-[24px] p-6 shadow-card space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-ink uppercase tracking-wider">Quiet hours</h3>
            <p className="text-xs text-ink-muted mt-0.5">
              Pause email notifications during your scheduled rest window.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={prefs.quiet_enabled}
            aria-label="Toggle quiet hours"
            onClick={() => void handleQuietToggle()}
            className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer shrink-0 ${
              prefs.quiet_enabled ? 'bg-brand-strong' : 'bg-neutral-300'
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-raised transform transition-transform ${
                prefs.quiet_enabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {prefs.quiet_enabled && (
          <div className="pt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="quiet-from-select" className="block text-xs font-bold text-ink mb-1">Pause from</label>
              <select
                id="quiet-from-select"
                value={prefs.quiet_from}
                onChange={(e) => void handleQuietFromChange(e.target.value)}
                className="w-full bg-white border border-line rounded-modal px-3 py-2 text-xs text-ink focus:outline-none focus:border-accent-gold cursor-pointer"
              >
                {QUIET_FROM_HOURS.map((h) => (
                  <option key={h.val} value={h.val}>
                    {h.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="quiet-until-select" className="block text-xs font-bold text-ink mb-1">Resume at</label>
              <select
                id="quiet-until-select"
                value={prefs.quiet_until}
                onChange={(e) => void handleQuietUntilChange(e.target.value)}
                className="w-full bg-white border border-line rounded-modal px-3 py-2 text-xs text-ink focus:outline-none focus:border-accent-gold cursor-pointer"
              >
                {QUIET_UNTIL_HOURS.map((h) => (
                  <option key={h.val} value={h.val}>
                    {h.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        <div className="bg-surface-faint p-3 rounded-card text-xs text-ink-subtle leading-relaxed">
          Email pauses from {quietFromLabel} to {quietUntilLabel}. Notifications still appear in your inbox. Critical alerts (runway, overdue invoices, signature requests, payment failures) always reach you.
        </div>
      </div>
    </div>
  );
}
