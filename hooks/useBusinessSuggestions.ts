'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiClient, ApiError } from '@/lib/api/client';

// Guide (BB Suggestions): a teammate proposes an edit to a canvas or record; a
// founder/team_member approves (applies it) or rejects (just flips status).
// Approve can 409 on CANVAS_VERSION_CONFLICT (canvas moved) or SUGGESTION_NOT_PENDING.

export type SuggestionOp = 'canvas_update' | 'record_create' | 'record_update' | 'record_delete';

export interface Suggestion {
  id: string;
  op: SuggestionOp;
  target: { canvas_type?: string; kind?: string; record_id?: string };
  payload: { blocks?: Record<string, unknown>; data?: Record<string, unknown> } | null;
  base_version: number | null;
  note: string | null;
  status: 'pending' | 'approved' | 'rejected';
  author: { id: string; name: string | null; email: string } | null;
  created_at: string;
}

export interface ResolveResult {
  success: boolean;
  error?: string;
  conflict?: boolean; // CANVAS_VERSION_CONFLICT — offer re-read/reject, never blind retry
}

function apiErrMessage(err: unknown): { message: string; code?: string } {
  if (err instanceof ApiError) {
    const d = err.data as { error?: { code?: string; message?: string } } | undefined;
    return { message: d?.error?.message || 'Something went wrong.', code: d?.error?.code };
  }
  return { message: (err as { message?: string })?.message || 'Something went wrong.' };
}

export function useBusinessSuggestions(statusFilter: 'pending' | 'approved' | 'rejected' = 'pending') {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient<{ data?: { suggestions?: Suggestion[] } }>(
        `/business-builder/suggestions?status=${statusFilter}`
      );
      const list = res?.data?.suggestions;
      setSuggestions(Array.isArray(list) ? list : []);
    } catch (err) {
      setError(apiErrMessage(err).message || 'Failed to load suggestions');
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    void (async () => {
      await load();
    })();
  }, [load]);

  const approve = useCallback(
    async (id: string): Promise<ResolveResult> => {
      try {
        await apiClient(`/business-builder/suggestions/${id}/approve`, { method: 'POST' });
        await load();
        return { success: true };
      } catch (err) {
        const { message, code } = apiErrMessage(err);
        // A version conflict leaves the suggestion pending — don't blind-retry.
        return { success: false, error: message, conflict: code === 'CANVAS_VERSION_CONFLICT' };
      }
    },
    [load]
  );

  const reject = useCallback(
    async (id: string): Promise<ResolveResult> => {
      try {
        await apiClient(`/business-builder/suggestions/${id}/reject`, { method: 'POST' });
        await load();
        return { success: true };
      } catch (err) {
        return { success: false, error: apiErrMessage(err).message };
      }
    },
    [load]
  );

  return { suggestions, loading, error, refetch: load, approve, reject };
}
