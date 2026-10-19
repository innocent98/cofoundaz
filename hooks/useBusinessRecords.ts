'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiErrorInfo } from '@/lib/api/api-error';
import { SUGGEST_KIND } from '@/lib/bb-access';
import { useBuilderAccess } from '@/hooks/useBuilderAccess';
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
 *
 * A business consultant never writes directly (D-BB-3): create / update / remove
 * become pending suggestions for the founder and resolve to `'suggested'`
 * without touching the list.
 */
export type WriteOutcome = 'saved' | 'suggested';

export function useBusinessRecords(kind: string) {
  const access = useBuilderAccess();
  const [records, setRecords] = useState<BusinessRecord[]>([]);
  const [fields, setFields] = useState<RecordField[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // `silent` refreshes in place (after a write) without flashing the skeleton.
  const load = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
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

  const suggestKind = SUGGEST_KIND[kind] ?? kind;

  const create = useCallback(
    async (data: Record<string, unknown>): Promise<WriteOutcome> => {
      if (access.suggestMode) {
        await businessBuilderApi.createSuggestion({ op: 'record_create', target: { kind: suggestKind }, payload: { data } });
        return 'suggested';
      }
      await businessBuilderApi.createRecord(kind, data);
      await load(true);
      return 'saved';
    },
    [kind, suggestKind, access.suggestMode, load]
  );

  const update = useCallback(
    async (id: string, data: Record<string, unknown>): Promise<WriteOutcome> => {
      if (access.suggestMode) {
        await businessBuilderApi.createSuggestion({
          op: 'record_update',
          target: { kind: suggestKind, record_id: id },
          payload: { data },
        });
        return 'suggested';
      }
      await businessBuilderApi.updateRecord(kind, id, data);
      await load(true);
      return 'saved';
    },
    [kind, suggestKind, access.suggestMode, load]
  );

  const remove = useCallback(
    async (id: string): Promise<WriteOutcome> => {
      if (access.suggestMode) {
        await businessBuilderApi.createSuggestion({ op: 'record_delete', target: { kind: suggestKind, record_id: id } });
        return 'suggested';
      }
      await businessBuilderApi.deleteRecord(kind, id);
      await load(true);
      return 'saved';
    },
    [kind, suggestKind, access.suggestMode, load]
  );

  return { records, fields, loading, error, access, refetch: () => load(true), create, update, remove };
}

// Surface the API's field-level validation message when present (the record
// schemas `extra="forbid"` and require some fields), else a generic message.
export function errMessage(err: unknown): string | null {
  const info = apiErrorInfo(err, '');
  if (info.fieldErrors.length > 0) {
    const f = info.fieldErrors[0];
    return f.field ? `${f.field}: ${f.message}` : f.message;
  }
  return info.message || null;
}

/** "Persona added" for a direct write, or the suggest-mode wording for a consultant. */
export function writeMessage(outcome: WriteOutcome, saved: string): string {
  return outcome === 'suggested' ? 'Suggestion sent. The founder will review it.' : saved;
}
