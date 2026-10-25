'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Copy, FileText, Trash2 } from 'lucide-react';
import { apiErrorInfo } from '@/lib/api/api-error';
import {
  listAllGrants,
  listAllShareLinks,
  listDocuments,
  listFiles,
  revokeGrant,
  revokeLinkShare,
  type GrantPermission,
} from '@/lib/api/documents';
import { formatDate } from '@/lib/documents-format';
import { btnIcon, btnSecondary } from '@/components/documents/ui';
import { useToast } from '../ToastContext';

interface Row {
  key: string;
  kind: 'person' | 'link';
  id: string;
  /** Document or file id, with which of the two it is (links on files have no grants). */
  documentId: string;
  target: 'document' | 'file';
  link?: string | null;
  document: string;
  who: string;
  access: GrantPermission;
  detail: string;
}

export default function SharedWithOthersPage() {
  const { triggerToast } = useToast();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [grants, links, docs, files] = await Promise.all([listAllGrants(), listAllShareLinks(), listDocuments(), listFiles().catch(() => [])]);
      const title = new Map<string, string>([...docs.map((d) => [d.id, d.title || 'Untitled document'] as [string, string]), ...files.map((f) => [f.id, f.filename] as [string, string])]);
      const list: Row[] = [
        ...grants
          .filter((g) => g.status !== 'revoked' && !g.revoked_at)
          .map<Row>((g) => ({
            key: `g-${g.id}`,
            kind: 'person',
            id: g.id,
            documentId: g.document_id,
            target: 'document',
            document: title.get(g.document_id) ?? 'Untitled document',
            who: g.grantee.name || g.grantee.email,
            access: g.permission,
            detail: g.status === 'pending' ? 'Invited, not opened yet' : `Shared ${formatDate(g.created_at)}`,
          })),
        ...links
          .filter((l) => l.status === 'active' && !l.revoked_at)
          .map<Row>((l) => ({
            key: `l-${l.id}`,
            kind: 'link',
            id: l.id,
            documentId: l.file_id ?? l.document_id ?? '',
            target: l.file_id || l.kind === 'file' ? 'file' : 'document',
            link: l.link,
            document: title.get(l.file_id ?? l.document_id ?? '') || 'Untitled document',
            who: l.anyone_with_link || !l.email ? 'Anyone with the link' : l.email,
            access: l.access_level,
            detail: `${l.expires_at ? `Expires ${formatDate(l.expires_at)}` : 'No expiry'}, ${l.last_viewed_at ? `last viewed ${formatDate(l.last_viewed_at)}` : 'never viewed'}`,
          })),
      ];
      setRows(list);
      setError(null);
    } catch (err) {
      setError(apiErrorInfo(err, 'Could not load what you have shared.').message);
    }
  }, []);

  useEffect(() => {
    void (async () => {
      await load();
    })();
  }, [load]);

  const revoke = async (r: Row) => {
    try {
      await (r.kind === 'person' ? revokeGrant(r.documentId, r.id) : revokeLinkShare({ kind: r.target, id: r.documentId }, r.id));
      triggerToast(`Access removed for ${r.who}.`);
    } catch (err) {
      triggerToast(apiErrorInfo(err, 'Could not remove access.').message, 'error');
    }
    await load();
  };

  return (
    <main className="max-w-7xl mx-auto px-4 md:px-6 py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-display text-ink-strong tracking-tight mb-1">Shared with others</h1>
        <p className="text-xs text-neutral-x738279">Documents you have shared with people or by link. Remove access here at any time.</p>
      </div>

      {error && (
        <div role="alert" className="bg-danger-tint border border-danger-xfad7d7 rounded-card p-4 text-sm text-danger-600 flex flex-wrap items-center justify-between gap-3">
          <span>{error}</span>
          <button type="button" className={btnSecondary} onClick={() => void load()}>
            Try again
          </button>
        </div>
      )}
      {!rows && !error && <div className="h-40 bg-white border border-line rounded-modal animate-pulse" aria-label="Loading shared documents" />}

      {rows && rows.length === 0 && (
        <div className="bg-white border border-line rounded-modal shadow-card p-12 text-center">
          <p className="text-sm font-semibold text-ink">Nothing shared yet</p>
          <p className="text-xs text-ink-subtle mt-1">Open a document in the Library and choose Share to give someone access.</p>
        </div>
      )}

      {rows && rows.length > 0 && (
        <ul className="bg-white border border-line rounded-modal shadow-card divide-y divide-line">
          {rows.map((r) => (
            <li key={r.key} className="flex items-center gap-3 px-4 py-1.5">
              <FileText className="w-4 h-4 text-ink-subtle shrink-0" />
              <div className="min-w-0 flex-1">
                <Link href={r.target === 'file' ? '/documents' : `/documents/${r.documentId}`} className="text-sm font-semibold text-ink hover:underline truncate flex items-center min-h-11">
                  {r.document}
                </Link>
                <p className="text-[11px] text-ink-subtle truncate">
                  {r.who} · {r.kind === 'link' ? 'Link' : 'Person'} · {r.detail}
                </p>
              </div>
              <span className="px-2 py-0.5 rounded font-medium text-[10px] bg-neutral-xe5efea text-brand-x1e3e2b shrink-0">
                {r.access === 'comment' ? 'Can comment' : 'Can view'}
              </span>
              {r.link && (
                <button type="button" aria-label={`Copy link for ${r.document}`} onClick={() => { void navigator.clipboard?.writeText(r.link ?? ''); triggerToast('Link copied.'); }} className={btnIcon}>
                  <Copy size={14} />
                </button>
              )}
              <button type="button" aria-label={`Revoke access for ${r.who}`} onClick={() => void revoke(r)} className={btnIcon}>
                <Trash2 size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
