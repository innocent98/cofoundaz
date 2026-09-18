'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiClient } from '@/lib/api/client';

// Guide §9: per-workspace EMAIL preferences. `master_email` is a global email
// switch; `categories` is one bool per fixed catalog category. Both must be true
// for an event's email to send. In-app delivery ignores these entirely (always
// shown in the inbox). PUT is a PARTIAL merge — send only what changed.

export type NotifCategory =
  | 'documents'
  | 'business'
  | 'roadmap_missions'
  | 'health_assessment'
  | 'team';

export interface NotifPreferences {
  master_email: boolean;
  categories: Record<NotifCategory, boolean>;
}

const DEFAULT_PREFS: NotifPreferences = {
  master_email: true,
  categories: { documents: true, business: true, roadmap_missions: true, health_assessment: true, team: true },
};

export function useNotificationPreferences() {
  const [prefs, setPrefs] = useState<NotifPreferences>(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient<{ data?: NotifPreferences }>('/notifications/preferences');
      if (res?.data) setPrefs(res.data);
    } catch (err) {
      setError((err as { message?: string })?.message || 'Failed to load preferences');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void (async () => {
      await load();
    })();
  }, [load]);

  // Partial-merge PUT. Optimistically apply, then reconcile with the server's
  // full effective response (or roll back on failure).
  const update = useCallback(
    async (patch: { master_email?: boolean; categories?: Partial<Record<NotifCategory, boolean>> }) => {
      const previous = prefs;
      const optimistic: NotifPreferences = {
        master_email: patch.master_email ?? prefs.master_email,
        categories: { ...prefs.categories, ...(patch.categories ?? {}) },
      };
      setPrefs(optimistic);
      setSaving(true);
      try {
        const res = await apiClient<{ data?: NotifPreferences }>('/notifications/preferences', {
          method: 'PUT',
          body: JSON.stringify(patch),
        });
        if (res?.data) setPrefs(res.data);
        return true;
      } catch {
        setPrefs(previous); // roll back
        return false;
      } finally {
        setSaving(false);
      }
    },
    [prefs]
  );

  const setMasterEmail = useCallback((on: boolean) => update({ master_email: on }), [update]);
  const setCategory = useCallback((key: NotifCategory, on: boolean) => update({ categories: { [key]: on } }), [update]);

  return { prefs, loading, error, saving, refetch: load, setMasterEmail, setCategory };
}
