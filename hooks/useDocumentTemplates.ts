import { useState, useEffect, useCallback } from 'react';
import { listTemplates, type TemplateInfo } from '@/lib/api/documents';

export type { TemplateCategory, TemplateInfo as TemplateItem } from '@/lib/api/documents';

export function useDocumentTemplates() {
  const [templates, setTemplates] = useState<TemplateInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setTemplates(await listTemplates());
    } catch (err) {
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

  return { templates, loading, error, refetch };
}
