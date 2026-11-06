import { useCallback, useEffect, useState } from 'react';
import {
  getNotificationPreferences,
  updateNotificationPreferences,
  type NotificationPreferencesData,
} from '@/lib/api/notifications';

export type NotifCategory =
  | 'documents'
  | 'business'
  | 'roadmap_missions'
  | 'health_assessment'
  | 'team'
  | string;

export interface NotifPreferences {
  master_email: boolean;
  categories: Record<string, boolean>;
  in_app: Record<string, boolean>;
}

const DEFAULT_PREFS: NotificationPreferencesData = {
  master_email: true,
  categories: {
    documents: true,
    business: true,
    roadmap_missions: true,
    health_assessment: true,
    team: true,
    finance: false,
    marketing: false,
    sales: false,
    validation: false,
    academy: false,
    ai: false,
    billing: true,
  },
  in_app: {
    documents: true,
    business: true,
    roadmap_missions: true,
    health_assessment: true,
    team: true,
    finance: true,
    marketing: true,
    sales: true,
    validation: true,
    academy: true,
    ai: true,
    billing: true,
  },
  groups: [],
  digest_mode: 'realtime',
  digest_time: '08:00',
  digest_day: 0,
  timezone: 'Africa/Lagos',
  quiet_enabled: false,
  quiet_from: '21:00',
  quiet_until: '06:00',
};

export function useNotificationPreferences() {
  const [prefs, setPrefs] = useState<NotificationPreferencesData>(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getNotificationPreferences();
      setPrefs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load preferences');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void load();
    });
  }, [load]);

  const update = useCallback(
    async (patch: Partial<NotificationPreferencesData>): Promise<boolean> => {
      const previous = prefs;
      const optimistic: NotificationPreferencesData = {
        ...prefs,
        ...patch,
        categories: { ...prefs.categories, ...(patch.categories || {}) },
        in_app: { ...prefs.in_app, ...(patch.in_app || {}) },
      };
      setPrefs(optimistic);
      setSaving(true);
      try {
        const updated = await updateNotificationPreferences(patch);
        setPrefs(updated);
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

  const setMasterEmail = useCallback(
    async (master_email: boolean) => {
      return await update({ master_email });
    },
    [update]
  );

  const setCategory = useCallback(
    async (category: string, value: boolean) => {
      return await update({ categories: { [category]: value } });
    },
    [update]
  );

  return {
    prefs,
    loading,
    error,
    saving,
    update,
    setMasterEmail,
    setCategory,
    reload: load,
  };
}
