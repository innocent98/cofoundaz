import { useState, useEffect, useCallback } from 'react';
import { apiErrorInfo } from '@/lib/api/api-error';
import {
  cancelRequest as apiCancel,
  listRequests,
  remindRequest as apiRemind,
  sendForSignature,
  type SendBody,
  type SignatureRequest,
} from '@/lib/api/signatures';

export type { SignatureRequest } from '@/lib/api/signatures';

export function useSignatureRequests() {
  const [requests, setRequests] = useState<SignatureRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  /** `silent` refreshes in place (no skeleton, a failure keeps the list on screen). */
  const refetch = useCallback(async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
        setError(null);
      }
      setRequests(await listRequests());
    } catch (err) {
      if (silent) return;
      setError(err instanceof Error ? err : new Error(String(err)));
      setRequests([]);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void refetch();
    });
  }, [refetch]);

  // `signer_links` come back once, on create only (null = signer not released yet).
  const createRequest = useCallback(
    async (fileId: string, body: SendBody): Promise<{ ok: true; request: SignatureRequest } | { ok: false; error: string; code: string | null; fieldErrors: { field: string; message: string }[] }> => {
      try {
        const request = await sendForSignature(fileId, body);
        await refetch(true);
        return { ok: true, request };
      } catch (err) {
        const info = apiErrorInfo(err, 'Could not send for signature.');
        return { ok: false, error: info.message, code: info.code, fieldErrors: info.fieldErrors };
      }
    },
    [refetch],
  );

  const cancelRequest = useCallback(
    async (id: string): Promise<{ ok: boolean; error?: string }> => {
      try {
        await apiCancel(id);
        return { ok: true };
      } catch (err) {
        return { ok: false, error: apiErrorInfo(err, 'Could not cancel the request.').message };
      } finally {
        await refetch(true);
      }
    },
    [refetch],
  );

  const remindRequest = useCallback(async (id: string): Promise<{ ok: boolean; reminded?: number; error?: string }> => {
    try {
      return { ok: true, reminded: await apiRemind(id) };
    } catch (err) {
      return { ok: false, error: apiErrorInfo(err, 'Could not send the reminder.').message };
    }
  }, []);

  return { requests, loading, error, refetch, createRequest, cancelRequest, remindRequest };
}
