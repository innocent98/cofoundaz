'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Download, Loader2 } from 'lucide-react';
import { businessBuilderApi } from '@/lib/api/business-builder';
import { apiErrorInfo } from '@/lib/api/api-error';
import { useBuilderAccess } from '@/hooks/useBuilderAccess';

type Target = { canvas: string } | { kind: string };

/**
 * Export creates a new draft Document from the artifact (D-BB-2). Founders and
 * team members only; the 422 "nothing to export" message is shown inline as the
 * server words it. Each press makes a new Document, so it is disabled in flight.
 */
export function ExportButton({ target }: { target: Target }) {
  const router = useRouter();
  const { canEdit } = useBuilderAccess();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!canEdit) return null;

  const onClick = async () => {
    setBusy(true);
    setError(null);
    try {
      const doc = await businessBuilderApi.exportToDocument(target);
      toast.success('Exported to Documents', {
        description: doc.title,
        duration: 8000,
        action: { label: 'Open document', onClick: () => router.push(`/documents/${doc.document_id}`) },
      });
    } catch (err) {
      setError(apiErrorInfo(err, 'Could not export right now. Try again.').message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={onClick}
        disabled={busy}
        className="flex items-center gap-1.5 bg-white hover:bg-[#F5F5F0] disabled:opacity-60 text-[#1E2923] font-semibold px-4 py-2 rounded-card text-xs transition-colors border border-[#EBEBE6] shadow-card"
      >
        {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5 text-[#556358]" />}
        <span>Export</span>
      </button>
      {error && <span role="alert" className="text-[11px] font-semibold text-[#B0483B] max-w-[240px] text-right">{error}</span>}
    </div>
  );
}
