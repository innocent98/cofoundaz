import { useState, useEffect, useCallback } from 'react';
import { apiClient, ApiError } from '@/lib/api/client';

export interface DocumentItem {
  id: string;
  title: string;
  kind: string;
  status: string; // display-cased, e.g. "Draft"
  category: string; // folder
  owner: string;
  modified: string;
  aiGenerated: boolean;
}

interface RawDoc {
  id: string;
  kind: string;
  title: string;
  status: string;
  ai_generated: boolean;
  folder: string | null;
  template_key: string | null;
  version: number;
  updated_at: string;
}

function titleCase(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}
function formatDate(iso: string): string {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function mapDoc(d: RawDoc): DocumentItem {
  return {
    id: d.id,
    title: d.title || 'Untitled document',
    kind: d.kind,
    status: titleCase(d.status),
    category: d.folder || 'Uncategorized',
    owner: 'You',
    modified: formatDate(d.updated_at),
    aiGenerated: !!d.ai_generated,
  };
}

export function useDocuments() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient<{ data?: { documents?: RawDoc[] } }>('/documents');
      setDocuments((res?.data?.documents ?? []).map(mapDoc));
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        console.warn('Documents unauthorized:', err.message);
      }
      setError(err instanceof Error ? err : new Error(String(err)));
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      refetch();
    });
  }, [refetch]);

  return { documents, loading, error, refetch };
}
