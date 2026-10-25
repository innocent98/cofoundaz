import { useState, useEffect, useCallback } from 'react';
import { ApiError } from '@/lib/api/client';
import {
  listSurveys,
  createSurvey,
  updateSurvey,
  deleteValidationItem,
  getSurveyAnalytics,
  type RawSurvey,
  type SurveyQuestion,
  type SurveyStatus,
  type RawSurveyAnalytics,
} from '@/lib/api/validation';

export type { RawSurvey as Survey, SurveyQuestion, SurveyStatus, RawSurveyAnalytics } from '@/lib/api/validation';

function errMsg(err: unknown): string {
  if (err instanceof ApiError) {
    const d = err.data as { error?: { message?: string; field_errors?: Record<string, string> } } | undefined;
    const fe = d?.error?.field_errors;
    if (fe && Object.keys(fe).length) {
      const [k, v] = Object.entries(fe)[0];
      return `${k}: ${v}`;
    }
    if (err.status === 403) return "You don't have access to validation in this workspace.";
    return d?.error?.message || 'Something went wrong with surveys.';
  }
  return 'Something went wrong with surveys.';
}

/** Real Validation Hub surveys (guide §4): list / create / open+token / status / analytics. */
export function useSurveys() {
  const [surveys, setSurveys] = useState<RawSurvey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setSurveys(await listSurveys());
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void load();
    });
  }, [load]);

  const create = useCallback(async (title: string, questions: SurveyQuestion[]): Promise<RawSurvey> => {
    const s = await createSurvey({ title, questions });
    setSurveys((prev) => [s, ...prev]);
    return s;
  }, []);

  // Returns the one-time public_token when opening for the first time (else null).
  const setStatus = useCallback(async (id: string, status: SurveyStatus): Promise<string | null> => {
    const { survey, public_token } = await updateSurvey(id, { status });
    setSurveys((prev) => prev.map((s) => (s.id === id ? survey : s)));
    return public_token;
  }, []);

  const remove = useCallback(async (id: string) => {
    await deleteValidationItem('surveys', id);
    setSurveys((prev) => prev.filter((s) => s.id !== id));
  }, []);

  return { surveys, loading, error, refetch: load, create, setStatus, remove, getAnalytics: getSurveyAnalytics, errMsg };
}

export type { RawSurveyAnalytics as SurveyAnalytics };
