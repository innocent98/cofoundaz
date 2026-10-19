import { useState, useEffect, useCallback } from 'react';
import { ApiError } from '@/lib/api/client';
import {
  listInterviews,
  createInterview,
  deleteValidationItem,
  type InterviewVerdict,
  type RawInterview,
  type CreateInterviewBody,
} from '@/lib/api/validation';

export type { InterviewVerdict } from '@/lib/api/validation';

/** FE-friendly interview shape for the notes list. */
export interface Interview {
  id: string;
  interviewee: string;
  segment: string;
  verdict: InterviewVerdict;
  quote: string; // first key quote (what the card shows)
  heldOn: string | null;
}

function toInterview(r: RawInterview): Interview {
  return {
    id: r.id,
    interviewee: r.interviewee,
    segment: r.segment ?? '',
    verdict: r.verdict,
    quote: Array.isArray(r.key_quotes) && r.key_quotes.length > 0 ? r.key_quotes[0] : '',
    heldOn: r.held_on ?? null,
  };
}

function errMsg(err: unknown): string {
  if (err instanceof ApiError) {
    const d = err.data as { error?: { message?: string } } | undefined;
    if (err.status === 403) return "You don't have access to validation in this workspace.";
    return d?.error?.message || 'Could not load interviews.';
  }
  return 'Could not load interviews.';
}

/** Real Validation Hub interviews (guide §3): list + create. */
export function useInterviews() {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const rows = await listInterviews();
      setInterviews(rows.map(toInterview));
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

  const addInterview = useCallback(async (body: CreateInterviewBody) => {
    const created = await createInterview(body);
    setInterviews((prev) => [toInterview(created), ...prev]);
  }, []);

  const remove = useCallback(async (id: string) => {
    await deleteValidationItem('interviews', id);
    setInterviews((prev) => prev.filter((i) => i.id !== id));
  }, []);

  return { interviews, loading, error, addInterview, remove, refetch: load };
}
