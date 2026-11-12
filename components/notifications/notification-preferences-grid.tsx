'use client';

import React from 'react';
import { Mail, Lock, Loader2, AlertCircle } from 'lucide-react';
import { useNotificationPreferences } from '@/hooks/useNotificationPreferences';

function ToggleSwitch({
  checked,
  disabled,
  onChange,
  label,
}: {
  checked: boolean;
  disabled?: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={onChange}
      className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors shrink-0 ${
        disabled
          ? 'bg-neutral-200 cursor-not-allowed opacity-50'
          : checked
          ? 'bg-brand-strong cursor-pointer'
          : 'bg-neutral-300 cursor-pointer'
      }`}
    >
      <div
        className={`bg-white w-4 h-4 rounded-full shadow-raised transform transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

export function NotificationPreferencesGrid({
  onErrorToast,
}: {
  onErrorToast?: (msg: string) => void;
}) {
  const { prefs, loading, error, saving, update, reload } = useNotificationPreferences();

  const handleToggleMaster = async () => {
    if (!prefs) return;
    const nextVal = !prefs.master_email;
    const ok = await update({ master_email: nextVal });
    if (!ok && onErrorToast) {
      onErrorToast('Could not save email preference. Please try again.');
    }
  };

  const handleToggleInApp = async (key: string) => {
    if (!prefs) return;
    const nextVal = !prefs.in_app[key];
    const ok = await update({ in_app: { [key]: nextVal } });
    if (!ok && onErrorToast) {
      onErrorToast('Could not save in-app notification preference.');
    }
  };

  const handleToggleEmail = async (key: string) => {
    if (!prefs) return;
    const nextVal = !prefs.categories[key];
    const ok = await update({ categories: { [key]: nextVal } });
    if (!ok && onErrorToast) {
      onErrorToast('Could not save category email preference.');
    }
  };

  if (loading) {
    return (
      <div className="bg-white border border-line rounded-[24px] shadow-card p-6 space-y-4">
        {[1, 2, 3, 4, 5].map((n) => (
          <div key={n} className="flex items-center justify-between py-3 border-b border-line animate-pulse">
            <div className="space-y-2 w-1/2">
              <div className="h-4 bg-neutral-200 rounded w-1/3" />
              <div className="h-3 bg-neutral-100 rounded w-2/3" />
            </div>
            <div className="flex items-center space-x-6">
              <div className="w-11 h-6 bg-neutral-200 rounded-full" />
              <div className="w-11 h-6 bg-neutral-200 rounded-full" />
            </div>
          </div>
        ))}
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

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display text-ink-strong tracking-tight">Notification preferences</h1>
          <p className="text-xs text-ink-subtle mt-0.5">
            Manage where and how each category reaches you.
          </p>
        </div>
        {saving && (
          <span className="flex items-center gap-1.5 text-xs text-ink-subtle shrink-0">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Saving...</span>
          </span>
        )}
      </div>

      <div className="bg-white border border-line rounded-[24px] shadow-card overflow-hidden">
        {/* Master Email Switch */}
        <div className="flex items-center justify-between gap-4 px-6 py-4 bg-surface-subtle border-b border-line">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-input bg-white border border-line flex items-center justify-center text-brand-strong">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-ink">Email notifications</h3>
              <p className="text-[11px] text-ink-subtle">Turn all notification emails off, or fine-tune by category below.</p>
            </div>
          </div>
          <ToggleSwitch
            checked={prefs.master_email}
            onChange={() => void handleToggleMaster()}
            label="Toggle all email notifications"
          />
        </div>

        {/* Table header (visible on desktop) */}
        <div className="hidden md:grid grid-cols-12 px-6 py-3 border-b border-line bg-surface-faint text-[10px] font-bold text-ink-subtle uppercase tracking-wider">
          <div className="col-span-8">Category</div>
          <div className="col-span-2 text-center">In app</div>
          <div className="col-span-2 text-center">Email</div>
        </div>

        {/* Categories Rows */}
        <div className="divide-y divide-neutral-xf2f2ec">
          {prefs.groups.map((group) => {
            const hasCritical = group.critical_types && group.critical_types.length > 0;
            const inAppChecked = prefs.in_app[group.key] ?? true;
            const emailChecked = prefs.categories[group.key] ?? false;
            const emailDisabled = !prefs.master_email;

            return (
              <div
                key={group.key}
                className="p-6 md:px-6 md:py-4 flex flex-col md:grid md:grid-cols-12 gap-3 md:gap-0 md:items-center hover:bg-neutral-50 transition-colors"
              >
                <div className="md:col-span-8 space-y-0.5 pr-4">
                  <div className="flex items-center space-x-2">
                    <h4 className="text-xs font-bold text-ink">{group.title}</h4>
                    {hasCritical && (
                      <span
                        title="Critical alerts can't be turned off. They protect your business."
                        className="text-accent-gold cursor-help"
                      >
                        <Lock size={12} />
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-ink-subtle">{group.description}</p>
                </div>

                <div className="flex items-center justify-between md:justify-center md:col-span-2 pt-2 md:pt-0 border-t md:border-t-0 border-line">
                  <span className="text-xs text-ink md:hidden font-medium">In app</span>
                  <ToggleSwitch
                    checked={inAppChecked}
                    onChange={() => void handleToggleInApp(group.key)}
                    label={`Toggle in-app notifications for ${group.title}`}
                  />
                </div>

                <div className="flex items-center justify-between md:justify-center md:col-span-2 pt-2 md:pt-0 border-t md:border-t-0 border-line">
                  <span className="text-xs text-ink md:hidden font-medium">
                    Email {!prefs.master_email && '(muted)'}
                  </span>
                  <ToggleSwitch
                    checked={emailChecked}
                    disabled={emailDisabled}
                    onChange={() => void handleToggleEmail(group.key)}
                    label={`Toggle email notifications for ${group.title}`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <p className="text-xs text-ink-subtle px-1 leading-relaxed">
        Turning In app off stops new notifications of that kind from appearing. Alerts that protect your business always arrive.
      </p>
    </div>
  );
}

