import { useCallback, useEffect, useState, useRef } from 'react';
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

export function useNotificationPreferences() {
  const [prefs, setPrefs] = useState<NotificationPreferencesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Latest preferences ref to prevent mutation races
  const prefsRef = useRef<NotificationPreferencesData | null>(null);
  useEffect(() => {
    prefsRef.current = prefs;
  }, [prefs]);

  // Track pending mutations & sequencing to prevent stale rollbacks
  const pendingMutationsRef = useRef(0);
  const mutationSeqRef = useRef(0);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getNotificationPreferences();
      // Only set if no mutations are in flight
      if (pendingMutationsRef.current === 0) {
        setPrefs(data);
        prefsRef.current = data;
      }
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
      const previous = prefsRef.current;
      if (!previous) return false;

      // Normalize any legacy 'ai' key to 'ai_insights'
      const cleanPatch = { ...patch };
      if (cleanPatch.categories) {
        cleanPatch.categories = { ...cleanPatch.categories };
        if ('ai' in cleanPatch.categories) {
          cleanPatch.categories.ai_insights = cleanPatch.categories.ai;
          delete cleanPatch.categories.ai;
        }
      }
      if (cleanPatch.in_app) {
        cleanPatch.in_app = { ...cleanPatch.in_app };
        if ('ai' in cleanPatch.in_app) {
          cleanPatch.in_app.ai_insights = cleanPatch.in_app.ai;
          delete cleanPatch.in_app.ai;
        }
      }

      const seq = ++mutationSeqRef.current;
      pendingMutationsRef.current += 1;
      const optimistic: NotificationPreferencesData = {
        ...previous,
        ...cleanPatch,
        categories: { ...previous.categories, ...(cleanPatch.categories || {}) },
        in_app: { ...previous.in_app, ...(cleanPatch.in_app || {}) },
      };
      setPrefs(optimistic);
      prefsRef.current = optimistic;
      setSaving(true);

      try {
        const updated = await updateNotificationPreferences(cleanPatch);
        pendingMutationsRef.current = Math.max(0, pendingMutationsRef.current - 1);
        if (seq === mutationSeqRef.current) {
          setPrefs(updated);
          prefsRef.current = updated;
        } else {
          // If other mutations are in-flight or applied, preserve latest in-flight changes
          setPrefs((curr) =>
            curr
              ? {
                  ...updated,
                  ...curr,
                  categories: { ...updated.categories, ...curr.categories },
                  in_app: { ...updated.in_app, ...curr.in_app },
                }
              : updated
          );
        }
        return true;
      } catch {
        pendingMutationsRef.current = Math.max(0, pendingMutationsRef.current - 1);
        // Roll back if error and this is the latest mutation
        if (seq === mutationSeqRef.current) {
          setPrefs(previous);
          prefsRef.current = previous;
        }
        return false;
      } finally {
        if (pendingMutationsRef.current === 0) {
          setSaving(false);
        }
      }
    },
    []
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
