'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { FileText } from 'lucide-react';
import { apiErrorInfo } from '@/lib/api/api-error';
import { listSharedWithMe, type SharedDoc } from '@/lib/api/documents';
import { formatDate, personName, titleCase } from '@/lib/documents-format';
import { btnSecondary } from '@/components/documents/ui';

export default function SharedWithMePage() {
  const [docs, setDocs] = useState<SharedDoc[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setDocs(await listSharedWithMe());
      setError(null);
    } catch (err) {
      setError(apiErrorInfo(err, 'Could not load the documents shared with you.').message);
    }
  }, []);

  useEffect(() => {
    void (async () => {
      await load();
    })();
  }, [load]);

  return (
    <main className="max-w-7xl mx-auto px-4 md:px-6 py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-display text-ink-strong tracking-tight mb-1">Shared with me</h1>
        <p className="text-xs text-neutral-x738279">Documents a founder has shared with you. You can read them, and comment where you were given that access.</p>
      </div>

      {error && (
        <div role="alert" className="bg-danger-tint border border-danger-xfad7d7 rounded-card p-4 text-sm text-danger-600 flex flex-wrap items-center justify-between gap-3">
          <span>{error}</span>
          <button type="button" className={btnSecondary} onClick={() => void load()}>
            Try again
          </button>
        </div>
      )}

      {!docs && !error && (
        <div className="space-y-2 animate-pulse" aria-label="Loading shared documents">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 bg-white border border-line rounded-card" />
          ))}
        </div>
      )}

      {docs && docs.length === 0 && (
        <div className="bg-white border border-line rounded-modal shadow-card p-12 text-center">
          <p className="text-sm font-semibold text-ink">Nothing has been shared with you yet</p>
          <p className="text-xs text-ink-subtle mt-1 max-w-md mx-auto">
            When a founder shares a document with your email address it appears here. You only see documents you were given access to, never a company’s whole library.
          </p>
        </div>
      )}

      {docs && docs.length > 0 && (
        <ul className="bg-white border border-line rounded-modal shadow-card divide-y divide-line">
          {docs.map((d) => (
            <li key={d.id}>
              <Link href={`/documents/shared-with-me/${d.id}`} className="flex flex-wrap items-center gap-3 px-4 min-h-11 py-3 hover:bg-neutral-xf9f9f6">
                <FileText className="w-4 h-4 text-ink-subtle shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink truncate">{d.title || 'Untitled document'}</p>
                  <p className="text-[11px] text-ink-subtle">
                    {d.workspace.name} · shared by {personName(d.shared_by)} · updated {formatDate(d.updated_at)}
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-surface-muted text-ink-muted">{titleCase(d.status)}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-brand-tint text-brand-strong">
                  {d.permission === 'comment' ? 'Can comment' : 'Can view'}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
