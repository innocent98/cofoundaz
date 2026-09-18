'use client';

import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '@/lib/api/client';
import {
  businessBuilderApi,
  BusinessRecord,
  RecordField,
} from '@/lib/api/business-builder';

/**
 * CRUD for one Business Builder record kind (personas / competitors / pricing /
 * revenue-streams). `kind` is the PLURAL, hyphenated URL segment the API routes
 * on. Returns the live records + their served field schema, and create/update/
 * delete helpers that re-list on success so the UI stays in sync with the server
 * (which assigns id/position and validates the payload).
 */
export function useBusinessRecords(kind: string) {
  const [records, setRecords] = useState<BusinessRecord[]>([]);
  const [fields, setFields] = useState<RecordField[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await businessBuilderApi.listRecords(kind);
      setRecords(res.records);
      setFields(res.fields);
    } catch (err: unknown) {
      setError(errMessage(err) || `Failed to load ${kind}`);
    } finally {
      setLoading(false);
    }
  }, [kind]);

  useEffect(() => {
    void (async () => {
      await load();
    })();
  }, [load]);

  const create = useCallback(
    async (data: Record<string, unknown>) => {
      const rec = await businessBuilderApi.createRecord(kind, data);
      await load();
      return rec;
    },
    [kind, load]
  );

  const update = useCallback(
    async (id: string, data: Record<string, unknown>) => {
      const rec = await businessBuilderApi.updateRecord(kind, id, data);
      await load();
      return rec;
    },
    [kind, load]
  );

  const remove = useCallback(
    async (id: string) => {
      await businessBuilderApi.deleteRecord(kind, id);
      await load();
    },
    [kind, load]
  );

  return { records, fields, loading, error, refetch: load, create, update, remove };
}

// Surface the API's field-level validation message when present (the record
// schemas `extra="forbid"` and require some fields), else a generic message.
export function errMessage(err: unknown): string | null {
  if (err instanceof ApiError) {
    const d = err.data as
      | { error?: { message?: string; field_errors?: Record<string, string> }; detail?: unknown }
      | undefined;
    const fieldErrors = d?.error?.field_errors;
    if (fieldErrors && Object.keys(fieldErrors).length > 0) {
      const [k, v] = Object.entries(fieldErrors)[0];
      return `${k}: ${v}`;
    }
    if (d?.error?.message) return d.error.message;
    if (typeof d?.detail === 'string') return d.detail;
    if (Array.isArray(d?.detail) && (d.detail[0] as { msg?: string })?.msg) {
      return String((d.detail[0] as { msg?: string }).msg);
    }
  }
  return (err as { message?: string })?.message ?? null;
}
