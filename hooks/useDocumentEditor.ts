'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiClient, ApiError } from '@/lib/api/client';

// GET/PUT /documents/{id}. PUT uses optimistic concurrency: send the version you
// loaded; a stale one → 409 DOCUMENT_VERSION_CONFLICT. We DON'T auto-retry a
// document save (that would clobber whoever else edited it) — the UI surfaces the
// conflict and offers a reload.

export interface DocSection {
  id?: string;
  heading: string;
  body: string;
}
export interface EditableDoc {
  id: string;
  title: string;
  kind: string;
  status: string;
  version: number;
  updated_at: string;
  sections: DocSection[];
}

export interface SaveResult {
  ok: boolean;
  conflict?: boolean;
  error?: string;
}

export function useDocumentEditor(id: string) {
  const [doc, setDoc] = useState<EditableDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setNotFound(false);
      const res = await apiClient<{ data?: EditableDoc }>(`/documents/${id}`);
      setDoc(res?.data ?? null);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) setNotFound(true);
      setDoc(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!id) return;
    void (async () => {
      await load();
    })();
  }, [id, load]);

  const save = useCallback(
    async (title: string, sections: DocSection[]): Promise<SaveResult> => {
      if (!doc) return { ok: false, error: 'Not loaded.' };
      try {
        const res = await apiClient<{ data?: EditableDoc }>(`/documents/${id}`, {
          method: 'PUT',
          body: JSON.stringify({ title, sections, version: doc.version }),
        });
        if (res?.data) setDoc(res.data); // new version + normalized sections
        return { ok: true };
      } catch (err) {
        if (err instanceof ApiError) {
          const d = err.data as { error?: { code?: string; message?: string } } | undefined;
          if (d?.error?.code === 'DOCUMENT_VERSION_CONFLICT' || err.status === 409) {
            return { ok: false, conflict: true };
          }
          if (err.status === 403) return { ok: false, error: 'Only a founder or team member can edit documents.' };
          return { ok: false, error: d?.error?.message || 'Could not save. Please try again.' };
        }
        return { ok: false, error: 'Could not save. Please try again.' };
      }
    },
    [id, doc]
  );

  return { doc, loading, notFound, refetch: load, save };
}
