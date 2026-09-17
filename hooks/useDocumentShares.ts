import { useState, useEffect, useCallback } from 'react';
import { apiClient, ApiError } from '@/lib/api/client';

export interface SharedRow {
  id: string; // share id
  documentId: string;
  document: string; // document title (joined) or a short id fallback
  sharedWith: string; // recipient email
  access: 'View' | 'Comment';
  lastViewed: string;
  status: string;
}

interface RawShare {
  id: string;
  email: string;
  access_level: string;
  expires_at: string | null;
  revoked_at: string | null;
  last_viewed_at: string | null;
  created_at: string;
  status: string;
  document_id?: string; // present on the workspace overview (§4b), absent per-document (§4a)
}
interface RawDoc {
  id: string;
  title: string;
}

function accessLabel(a: string): 'View' | 'Comment' {
  return a === 'comment' ? 'Comment' : 'View';
}
function relView(iso: string | null): string {
  if (!iso) return 'Never viewed';
  const d = new Date(iso);
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function useDocumentShares() {
  const [shares, setShares] = useState<SharedRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // The overview row carries only document_id (no title, guide §4b) — join
      // against the rich-documents list to show a title.
      const [sharesRes, docsRes] = await Promise.all([
        apiClient<{ data?: { shares?: RawShare[] } }>('/documents/shares'),
        apiClient<{ data?: { documents?: RawDoc[] } }>('/documents').catch(() => ({ data: { documents: [] } })),
      ]);
      const titleById = new Map<string, string>();
      for (const d of docsRes?.data?.documents ?? []) titleById.set(d.id, d.title);
      // The overview returns revoked shares too — "Shared with others" should
      // only list the ones still active.
      const rows = (sharesRes?.data?.shares ?? [])
        .filter((s) => s.status === 'active' && !s.revoked_at)
        .map<SharedRow>((s) => ({
        id: s.id,
        documentId: s.document_id ?? '',
        document: (s.document_id && titleById.get(s.document_id)) || (s.document_id ? 'Untitled document' : '—'),
        sharedWith: s.email,
        access: accessLabel(s.access_level),
        lastViewed: relView(s.last_viewed_at),
        status: s.status,
      }));
      setShares(rows);
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        console.warn('Document shares unauthorized:', err.message);
      }
      setError(err instanceof Error ? err : new Error(String(err)));
      setShares([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      refetch();
    });
  }, [refetch]);

  // Create a share for a document. access_level is view|comment (no Edit in v1,
  // guide §2). Returns the one-time `link` (never available again, guide §1).
  const createShare = useCallback(
    async (
      documentId: string,
      email: string,
      accessLevel: 'view' | 'comment',
      expiresInDays: number | null
    ): Promise<{ ok: boolean; link?: string; error?: string }> => {
      try {
        const res = await apiClient<{ data?: { link?: string } }>(`/documents/${documentId}/shares`, {
          method: 'POST',
          body: JSON.stringify({ email, access_level: accessLevel, expires_in_days: expiresInDays }),
        });
        await refetch();
        return { ok: true, link: res?.data?.link };
      } catch (err) {
        const data = err instanceof ApiError ? (err.data as { error?: { message?: string } } | undefined) : undefined;
        return { ok: false, error: data?.error?.message || 'Could not share the document.' };
      }
    },
    [refetch]
  );

  const revokeShare = useCallback(
    async (documentId: string, shareId: string) => {
      setShares((prev) => prev.filter((s) => s.id !== shareId)); // optimistic
      try {
        await apiClient(`/documents/${documentId}/shares/${shareId}`, { method: 'DELETE' });
      } catch (err) {
        if (!(err instanceof ApiError && err.status === 404)) void refetch();
      }
    },
    [refetch]
  );

  return { shares, loading, error, refetch, createShare, revokeShare };
}
