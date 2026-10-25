'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Loader2, AlertTriangle, Eye, Download, FileText } from 'lucide-react';
import { apiClient, ApiError } from '@/lib/api/client';
import BrandLogo from '@/components/brand/BrandLogo';
import { useBlobPreview } from '@/hooks/useBlobPreview';
import { DisclaimerBanner } from '@/components/documents/disclaimer-banner';

// Public shared-document view — GET /shared/{token} (no auth). See
// cofoundaz-api/docs/fe-integration-guide-documents-sharing.md §5. `document` is
// the same full shape as the authenticated GET /documents/{id}.
interface SharedFile {
  filename: string;
  content_type: string;
  size_bytes: number;
  viewer: string;
  download_url: string;
}
interface SharedDoc {
  /** BE-D tags the body; older bodies have no kind and are documents. */
  kind?: 'document' | 'file';
  file?: SharedFile;
  document: {
    id: string;
    title: string;
    kind: string;
    status: string;
    version: number;
    updated_at: string;
    /** Legal drafts only: the "not legal advice" notice (D-DOC-4). */
    disclaimer?: string | null;
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

  const fileUrl = data?.kind === 'file' && data.file ? `${data.file.download_url}?inline=true` : null;
  const previewSrc = useBlobPreview(fileUrl, data?.file?.content_type ?? '');
  const expires = fmtDate(data?.expires_at ?? null);

  return (
    <div className="min-h-screen bg-neutral-xf6f7f4 font-body text-ink">
      <header className="bg-white border-b border-line px-6 py-4 flex items-center justify-between">
        <BrandLogo height={26} eager />
        {data && (
          <span className="flex items-center gap-1.5 bg-surface-muted text-ink-muted text-xs font-semibold px-3 py-1.5 rounded-full border border-line capitalize">
            <Eye className="w-3.5 h-3.5" /> {data.access_level === 'comment' ? 'View & comment' : 'View only'}
          </span>
        )}
      </header>

      <main className="max-w-3xl mx-auto py-10 px-4">
        {loading && (
          <div className="flex items-center justify-center gap-2 text-ink-muted py-24">
            <Loader2 className="w-5 h-5 animate-spin" /> Loading document…
          </div>
        )}

        {!loading && invalid && (
          <div className="bg-white rounded-modal shadow-card border border-line p-10 text-center flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-danger-wash text-danger-600 flex items-center justify-center">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h1 className="text-xl font-display font-bold">This link is no longer valid</h1>
            <p className="text-sm text-ink-muted max-w-sm">
              It may have been revoked by the sender or expired. Ask them for a fresh link.
            </p>
          </div>
        )}

        {!loading && !invalid && data && data.kind === 'file' && data.file && (
          <div className="bg-white rounded-modal shadow-card border border-line overflow-hidden">
            <div className="border-b border-line px-8 py-6 bg-surface-faint">
              <h1 className="text-2xl font-display font-bold text-ink break-words">{data.file.filename}</h1>
              <p className="text-xs text-ink-subtle mt-1.5">
                {(data.file.size_bytes / 1024 < 1024 ? `${Math.max(1, Math.round(data.file.size_bytes / 1024))} KB` : `${(data.file.size_bytes / 1048576).toFixed(1)} MB`)}
                {expires ? ` · Link expires ${expires}` : ''}
              </p>
            </div>
            <div className="px-8 py-6 flex flex-col gap-5">
              {previewSrc && data.file.viewer === 'pdf' && (
                <iframe src={previewSrc} title={data.file.filename} className="w-full h-96 rounded-card border border-line bg-surface-subtle" />
              )}
              {previewSrc && data.file.viewer === 'image' && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previewSrc} alt={data.file.filename} className="w-full max-h-96 object-contain rounded-card border border-line bg-surface-subtle" />
              )}
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-ink-muted shrink-0" aria-hidden />
                <a
                  href={data.file.download_url}
                  className="inline-flex items-center gap-1.5 min-h-11 px-4 rounded-card bg-brand-strong hover:bg-brand-rail text-white text-sm font-bold shadow-card transition-colors"
                >
                  <Download className="w-4 h-4" /> Download
                </a>
              </div>
            </div>
          </div>
        )}

        {!loading && !invalid && data && data.kind !== 'file' && data.document && (
          <div className="bg-white rounded-modal shadow-card border border-line overflow-hidden">
            <div className="border-b border-line px-8 py-6 bg-surface-faint">
              <h1 className="text-2xl font-display font-bold text-ink">{data.document.title}</h1>
              <div className="flex items-center gap-2 text-xs text-ink-subtle mt-1.5">
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
              <DisclaimerBanner text={data.document.disclaimer} />
              {data.document.sections.length === 0 ? (
                <p className="text-sm text-ink-subtle italic">This document has no content yet.</p>
              ) : (
                data.document.sections.map((sec) => (
                  <section key={sec.id} className="flex flex-col gap-2">
                    <h2 className="text-sm font-bold text-ink uppercase tracking-wide">{sec.heading}</h2>
                    {sec.body?.trim() ? (
                      <p className="text-sm text-neutral-x2d3830 leading-relaxed whitespace-pre-wrap">{sec.body}</p>
                    ) : (
                      <p className="text-sm text-neutral-xa3b0a6 italic">Empty</p>
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
