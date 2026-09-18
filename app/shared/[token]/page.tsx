'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Loader2, AlertTriangle, Eye } from 'lucide-react';
import { apiClient, ApiError } from '@/lib/api/client';

// Public shared-document view — GET /shared/{token} (no auth). See
// cofoundaz-api/docs/fe-integration-guide-documents-sharing.md §5. `document` is
// the same full shape as the authenticated GET /documents/{id}.
interface SharedDoc {
  document: {
    id: string;
    title: string;
    kind: string;
    status: string;
    version: number;
    updated_at: string;
    sections: { id: string; heading: string; body: string }[];
  };
  access_level: string;
  expires_at: string | null;
}

function fmtDate(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

export default function PublicSharedPage() {
  const params = useParams<{ token: string }>();
  const token = params?.token as string;

  const [data, setData] = useState<SharedDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [invalid, setInvalid] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient<{ data?: SharedDoc }>(`/shared/${token}`);
      setData(res?.data ?? (res as unknown as SharedDoc));
    } catch (err) {
      // Uniform 404 = unknown / revoked / expired — one state, no distinction.
      if (err instanceof ApiError && err.status === 404) setInvalid(true);
      else setInvalid(true);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    void (async () => {
      await load();
    })();
  }, [token, load]);

  const expires = fmtDate(data?.expires_at ?? null);

  return (
    <div className="min-h-screen bg-[#F6F7F4] font-body text-[#1E2923]">
      <header className="bg-white border-b border-[#E8E8E2] px-6 py-4 flex items-center justify-between">
        <div className="font-display font-bold text-xl tracking-tight text-[#1E2923]">Cofoundaz</div>
        {data && (
          <span className="flex items-center gap-1.5 bg-[#F5F5F0] text-[#617065] text-xs font-semibold px-3 py-1.5 rounded-full border border-[#E8E8E2] capitalize">
            <Eye className="w-3.5 h-3.5" /> {data.access_level === 'comment' ? 'View & comment' : 'View only'}
          </span>
        )}
      </header>

      <main className="max-w-3xl mx-auto py-10 px-4">
        {loading && (
          <div className="flex items-center justify-center gap-2 text-[#617065] py-24">
            <Loader2 className="w-5 h-5 animate-spin" /> Loading document…
          </div>
        )}

        {!loading && invalid && (
          <div className="bg-white rounded-modal shadow-card border border-[#E8E8E2] p-10 text-center flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-[#FBEBEB] text-[#B0483B] flex items-center justify-center">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h1 className="text-xl font-display font-bold">This link is no longer valid</h1>
            <p className="text-sm text-[#617065] max-w-sm">
              It may have been revoked by the sender or expired. Ask them for a fresh link.
            </p>
          </div>
        )}

        {!loading && !invalid && data && (
          <div className="bg-white rounded-modal shadow-card border border-[#E8E8E2] overflow-hidden">
            <div className="border-b border-[#E8E8E2] px-8 py-6 bg-[#FBFBFA]">
              <h1 className="text-2xl font-display font-bold text-[#1E2923]">{data.document.title}</h1>
              <div className="flex items-center gap-2 text-xs text-[#8E9B90] mt-1.5">
                <span className="capitalize">{data.document.status}</span>
                <span>·</span>
                <span>v{data.document.version}</span>
                {expires && (
                  <>
                    <span>·</span>
                    <span>Link expires {expires}</span>
                  </>
                )}
              </div>
            </div>

            <div className="px-8 py-6 flex flex-col gap-6">
              {data.document.sections.length === 0 ? (
                <p className="text-sm text-[#8E9B90] italic">This document has no content yet.</p>
              ) : (
                data.document.sections.map((sec) => (
                  <section key={sec.id} className="flex flex-col gap-2">
                    <h2 className="text-sm font-bold text-[#1E2923] uppercase tracking-wide">{sec.heading}</h2>
                    {sec.body?.trim() ? (
                      <p className="text-sm text-[#2D3830] leading-relaxed whitespace-pre-wrap">{sec.body}</p>
                    ) : (
                      <p className="text-sm text-[#A3B0A6] italic">Empty</p>
                    )}
                  </section>
                ))
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
