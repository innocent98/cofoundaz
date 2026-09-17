import { useState, useEffect, useCallback } from 'react';
import { apiClient, ApiError } from '@/lib/api/client';

export type SignatureStatus = 'Awaiting' | 'Complete' | 'Cancelled' | 'Expired';

export interface SignerRow {
  email: string;
  name: string;
  signed: boolean;
}

export interface SignatureRequestRow {
  id: string;
  title: string;
  fileName: string;
  status: SignatureStatus;
  signedCount: number;
  total: number;
  expiresAt: string;
  signers: SignerRow[];
}

interface RawSigner {
  email: string;
  name: string | null;
  position: number;
  status: string; // 'signed' | 'pending'
  signed_at: string | null;
  signed_name: string | null;
}
interface RawRequest {
  id: string;
  title: string;
  status: string; // awaiting | complete | cancelled | expired (derived)
  file_id: string;
  filename: string;
  signed_count: number;
  total: number;
  expires_at: string | null;
  completed_at: string | null;
  created_at: string;
  signers: RawSigner[];
  signer_links?: string[]; // only on create
}

function mapStatus(s: string): SignatureStatus {
  if (s === 'complete') return 'Complete';
  if (s === 'cancelled') return 'Cancelled';
  if (s === 'expired') return 'Expired';
  return 'Awaiting';
}

function mapRequest(r: RawRequest): SignatureRequestRow {
  return {
    id: r.id,
    title: r.title,
    fileName: r.filename,
    status: mapStatus(r.status),
    signedCount: r.signed_count,
    total: r.total,
    expiresAt: r.expires_at ?? '',
    signers: (r.signers ?? []).map((s) => ({
      email: s.email,
      name: s.name || s.email,
      signed: s.status === 'signed',
    })),
  };
}

export function useSignatureRequests() {
  const [requests, setRequests] = useState<SignatureRequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient<{ data?: { requests?: RawRequest[] } }>('/documents/signature-requests');
      setRequests((res?.data?.requests ?? []).map(mapRequest));
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        console.warn('Signature requests unauthorized:', err.message);
      }
      setError(err instanceof Error ? err : new Error(String(err)));
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      refetch();
    });
  }, [refetch]);

  // Send a file for signature (guide §1). `signer_links` are returned once, on
  // create only — surface them like the share link.
  const createRequest = useCallback(
    async (
      fileId: string,
      signers: { email: string; name?: string }[],
      title?: string,
      expiresInDays = 14
    ): Promise<{ ok: boolean; signerLinks?: string[]; error?: string }> => {
      try {
        const res = await apiClient<{ data?: { signer_links?: string[] } }>(
          `/documents/files/${fileId}/signature-requests`,
          { method: 'POST', body: JSON.stringify({ signers, title, expires_in_days: expiresInDays }) }
        );
        await refetch();
        return { ok: true, signerLinks: res?.data?.signer_links ?? [] };
      } catch (err) {
        const data = err instanceof ApiError ? (err.data as { error?: { message?: string } } | undefined) : undefined;
        return { ok: false, error: data?.error?.message || 'Could not send for signature.' };
      }
    },
    [refetch]
  );

  const cancelRequest = useCallback(
    async (id: string) => {
      try {
        await apiClient(`/documents/signature-requests/${id}/cancel`, { method: 'POST' });
      } finally {
        await refetch();
      }
    },
    [refetch]
  );

  const remindRequest = useCallback(async (id: string) => {
    try {
      await apiClient(`/documents/signature-requests/${id}/remind`, { method: 'POST' });
      return true;
    } catch {
      return false;
    }
  }, []);

  return { requests, loading, error, refetch, createRequest, cancelRequest, remindRequest };
}
