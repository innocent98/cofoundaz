'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Check, FileText, Loader2, AlertTriangle, ExternalLink } from 'lucide-react';
import { apiClient, ApiError } from '@/lib/api/client';

// Public signing view — GET /sign/{token} (no auth). See
// cofoundaz-api/docs/fe-integration-guide-documents-esignature.md §3–§4.
interface SignView {
  request: { title: string; status: string };
  file: { id: string; filename: string; content_type: string; size_bytes: number; url: string };
  signer: { email: string; name: string };
}
// POST /sign/{token} response (no signers[] — privacy-scoped, §4).
interface SignResult {
  title: string;
  status: string;
  signed_count: number;
  total: number;
  completed_at: string | null;
}

function fmtSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function PublicSignerPage() {
  const params = useParams<{ token: string }>();
  const token = params?.token as string;

  const [view, setView] = useState<SignView | null>(null);
  const [loading, setLoading] = useState(true);
  const [invalid, setInvalid] = useState(false);
  const [typedName, setTypedName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SignResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient<{ data?: SignView }>(`/sign/${token}`);
      const d = res?.data ?? (res as unknown as SignView);
      setView(d);
      if (d?.signer?.name) setTypedName(d.signer.name);
    } catch (err) {
      // Uniform 404 = unknown / already-signed / expired link.
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

  const sign = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = typedName.trim();
    if (!name) {
      setError('Please type your full name to sign.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await apiClient<{ data?: SignResult }>(`/sign/${token}`, {
        method: 'POST',
        body: JSON.stringify({ typed_name: name }),
      });
      setResult(res?.data ?? (res as unknown as SignResult));
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setError('This link has already been used or is no longer valid.');
      } else {
        const d = (err as ApiError)?.data as { error?: { message?: string } } | undefined;
        setError(d?.error?.message || 'Could not record your signature. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F7F4] font-body text-[#1E2923]">
      <header className="bg-white border-b border-[#E8E8E2] px-6 py-4 flex items-center justify-between">
        <div className="font-display font-bold text-xl tracking-tight text-[#1E2923]">Cofoundaz</div>
        <div className="text-sm font-medium text-[#617065]">Review &amp; Sign</div>
      </header>

      <main className="max-w-2xl mx-auto py-10 px-4">
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
              It may have already been signed, been cancelled, or expired. Ask the sender for a fresh link.
            </p>
          </div>
        )}

        {!loading && !invalid && result && (
          <div className="bg-white rounded-modal shadow-card border border-[#E8E8E2] p-10 text-center flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-[#EAF2ED] text-[#2D5A3F] flex items-center justify-center">
              <Check className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-display font-bold">Signed — thank you</h1>
            <p className="text-sm text-[#617065]">
              {result.status === 'complete'
                ? `All ${result.total} signature${result.total === 1 ? '' : 's'} are in — this document is complete.`
                : `${result.signed_count} of ${result.total} signed — we’ll let the others know it’s their turn.`}
            </p>
            <p className="text-xs text-[#8E9B90]">You can safely close this tab.</p>
          </div>
        )}

        {!loading && !invalid && !result && view && (
          <div className="bg-white rounded-modal shadow-card border border-[#E8E8E2] overflow-hidden">
            <div className="border-b border-[#E8E8E2] px-6 py-4 bg-[#FBFBFA]">
              <h2 className="text-lg font-semibold">{view.request.title}</h2>
              <p className="text-sm text-[#617065]">Hi {view.signer.name || view.signer.email} — please review and sign below.</p>
            </div>

            <div className="p-6 flex flex-col gap-6">
              <div className="flex items-center gap-3 bg-[#F7F7F5] border border-[#E8E8E2] rounded-card p-4">
                <div className="w-10 h-10 rounded-input bg-white border border-[#E8E8E2] flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-[#617065]" />
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-sm font-bold truncate">{view.file.filename}</span>
                  <span className="text-xs text-[#8E9B90]">{fmtSize(view.file.size_bytes)}</span>
                </div>
                {/^https?:\/\//.test(view.file.url) && (
                  <a
                    href={view.file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs font-semibold text-[#183B28] hover:text-[#11291C]"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Open
                  </a>
                )}
              </div>

              <form onSubmit={sign} className="flex flex-col gap-3">
                <label className="text-xs font-bold text-[#55625A] uppercase tracking-wider">Type your full name to sign</label>
                <input
                  type="text"
                  value={typedName}
                  onChange={(e) => setTypedName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full border border-[#D5DDD6] rounded-input px-3 py-2.5 text-sm focus:outline-none focus:border-[#4D6D58] focus:ring-1 focus:ring-[#4D6D58]"
                />
                <p className="text-[11px] text-[#8E9B90]">
                  By typing your name and clicking Sign, you agree this is your electronic signature.
                </p>
                {error && <p className="text-xs font-semibold text-[#B0483B]">{error}</p>}
                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-1 bg-[#183B28] hover:bg-[#11291C] disabled:opacity-60 text-white font-bold py-2.5 rounded-card text-sm transition-colors shadow-card"
                >
                  {submitting ? 'Signing…' : 'Sign document'}
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
