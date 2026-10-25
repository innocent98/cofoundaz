'use client';

import React, { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { apiErrorInfo } from '@/lib/api/api-error';
import { API_BASE } from '@/lib/api/client';
import { fileContentLink, fileDownloadLink, type ContentLink } from '@/lib/api/documents';
import { useToast } from '@/app/(dashboard)/documents/ToastContext';
import { Dialog, btnSecondary } from './ui';

const MAX_TEXT_CHARS = 200_000;

/** With a relative API base (the dev proxy) a signed link is read same-origin, which sidesteps CORS. */
function resolveUrl(url: string): string {
  if (!API_BASE.startsWith('/')) return url;
  try {
    const u = new URL(url);
    return u.pathname.startsWith('/api/v1') ? `${u.pathname}${u.search}` : url;
  } catch {
    return url;
  }
}

function parseCsv(text: string): string[][] {
  return text
    .split(/\r?\n/)
    .filter((l) => l.length > 0)
    .slice(0, 200)
    .map((l) => l.split(','));
}

/** Opens an uploaded file inline through the 5-minute signed content link. */
export function FileViewer({ file, onClose }: { file: { id: string; title: string }; onClose: () => void }) {
  const { triggerToast } = useToast();
  const [link, setLink] = useState<ContentLink | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [text, setText] = useState<string | null>(null);
  const [textFailed, setTextFailed] = useState(false);
  const [pdfSrc, setPdfSrc] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    let blobUrl: string | null = null;
    void (async () => {
      try {
        const l = await fileContentLink(file.id);
        if (!alive) return;
        setLink(l);
        const src = resolveUrl(l.url);
        if (l.viewer === 'pdf') {
          // The file is served with a sandbox policy, which stops the browser's PDF viewer in a
          // frame. A blob copy is not under that policy; fall back to the link if the fetch fails.
          try {
            const res = await fetch(src);
            if (!res.ok) throw new Error('fetch');
            const blob = new Blob([await res.arrayBuffer()], { type: 'application/pdf' });
            if (alive) {
              blobUrl = URL.createObjectURL(blob);
              setPdfSrc(blobUrl);
            }
          } catch {
            if (alive) setPdfSrc(src);
          }
        }
        if (l.viewer === 'text' || l.viewer === 'markdown' || l.viewer === 'csv') {
          try {
            const res = await fetch(src);
            if (!res.ok) throw new Error('fetch');
            const t = await res.text();
            if (alive) setText(t.slice(0, MAX_TEXT_CHARS));
          } catch {
            if (alive) setTextFailed(true);
          }
        }
      } catch (err) {
        if (alive) setError(apiErrorInfo(err, 'Could not open this file.').message);
      }
    })();
    return () => {
      alive = false;
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [file.id]);

  const download = async () => {
    try {
      const { url } = await fileDownloadLink(file.id);
      window.open(url, '_blank', 'noopener');
    } catch (err) {
      triggerToast(apiErrorInfo(err, 'Could not download this file.').message, 'error');
    }
  };

  const viewer = link?.viewer;
  let body: React.ReactNode;
  if (error) {
    body = (
      <p role="alert" className="text-sm text-danger-600 font-semibold">
        {error}
      </p>
    );
  } else if (!link) {
    body = <div className="h-64 bg-surface-muted rounded-card animate-pulse" />;
  } else if (viewer === 'pdf') {
    body = pdfSrc ? (
      <iframe title={file.title} src={pdfSrc} className="w-full h-[60vh] border border-line rounded-card bg-surface-faint" />
    ) : (
      <div className="h-64 bg-surface-muted rounded-card animate-pulse" />
    );
  } else if (viewer === 'image') {
    // eslint-disable-next-line @next/next/no-img-element -- signed, short-lived URL
    body = <img src={resolveUrl(link.url)} alt={file.title} className="max-w-full max-h-[60vh] mx-auto rounded-card" />;
  } else if ((viewer === 'text' || viewer === 'markdown' || viewer === 'csv') && text !== null) {
    body =
      viewer === 'csv' ? (
        <div className="overflow-auto max-h-[60vh] border border-line rounded-card">
          <table className="text-xs w-full">
            <tbody>
              {parseCsv(text).map((row, i) => (
                <tr key={i} className={i === 0 ? 'font-bold bg-surface-muted' : 'border-t border-line'}>
                  {row.map((c, j) => (
                    <td key={j} className="px-3 py-1.5 whitespace-nowrap">
                      {c}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <pre className="whitespace-pre-wrap text-xs text-ink bg-surface-faint border border-line rounded-card p-4 max-h-[60vh] overflow-auto">
          {text}
        </pre>
      );
  } else if ((viewer === 'text' || viewer === 'markdown' || viewer === 'csv') && !textFailed) {
    body = <div className="h-64 bg-surface-muted rounded-card animate-pulse" />;
  } else {
    body = (
      <p className="text-sm text-ink-muted py-10 text-center">
        A preview isn’t available for this kind of file yet. Download it to open it on your device.
      </p>
    );
  }

  return (
    <Dialog label={file.title} onClose={onClose} wide>
      <div className="p-6 space-y-4">
        {body}
        <div className="flex justify-end gap-3">
          <button type="button" className={btnSecondary} onClick={() => void download()}>
            <Download size={14} /> Download
          </button>
          <button type="button" className={btnSecondary} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </Dialog>
  );
}
