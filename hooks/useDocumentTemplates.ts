import { useState, useEffect, useCallback } from 'react';
import { apiClient, ApiError } from '@/lib/api/client';

export type TemplateCategory = 'BUSINESS' | 'FUNDRAISING' | 'FINANCE' | 'OPERATIONS';

export interface TemplateItem {
  key: string;
  name: string;
  description: string;
  kind: string;
  sections: string[];
  category: TemplateCategory;
}

interface RawTemplate {
  key: string;
  name: string;
  description: string;
  kind: string;
  sections: string[];
}

// The catalog has no category field — derive one from the kind/key for grouping.
function categoryFor(kind: string): TemplateCategory {
  const k = (kind || '').toLowerCase();
  if (k.includes('pitch') || k.includes('investor') || k.includes('data_room') || k.includes('fundrais')) return 'FUNDRAISING';
  if (k.includes('financial') || k.includes('finance') || k.includes('invoice') || k.includes('budget') || k.includes('model')) return 'FINANCE';
  if (k.includes('meeting') || k.includes('sop') || k.includes('procedure') || k.includes('job') || k.includes('note')) return 'OPERATIONS';
  return 'BUSINESS';
}

function mapTemplate(t: RawTemplate): TemplateItem {
  return { ...t, category: categoryFor(t.kind || t.key) };
}

export function useDocumentTemplates() {
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingKey, setCreatingKey] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient<{ data?: { templates?: RawTemplate[] } }>('/document-templates');
      setTemplates((res?.data?.templates ?? []).map(mapTemplate));
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        console.warn('Templates unauthorized:', err.message);
      }
      setError(err instanceof Error ? err : new Error(String(err)));
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      refetch();
    });
  }, [refetch]);

  // Create a document from a template (POST /documents { template_key }).
  const createFromTemplate = useCallback(
    async (key: string): Promise<{ ok: boolean; id?: string; title?: string; error?: string }> => {
      setCreatingKey(key);
      try {
        const res = await apiClient<{ data?: { id?: string; title?: string } }>('/documents', {
          method: 'POST',
          body: JSON.stringify({ template_key: key }),
        });
        return { ok: true, id: res?.data?.id, title: res?.data?.title };
      } catch (err) {
        const data = err instanceof ApiError ? (err.data as { error?: { message?: string } } | undefined) : undefined;
        return { ok: false, error: data?.error?.message || 'Could not create the document.' };
      } finally {
        setCreatingKey(null);
      }
    },
    []
  );

  return { templates, loading, creatingKey, error, refetch, createFromTemplate };
}
