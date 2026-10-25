import { useEffect, useState } from 'react';
import { resolveApiUrl } from '@/lib/api/client';

// Exact allowlist: a same-origin blob of a scriptable type (SVG, HTML) would run in this page's origin.
const SAFE_TYPES = new Set(['application/pdf', 'image/png', 'image/jpeg', 'image/gif', 'image/webp']);
const baseType = (t: string | null | undefined) => (t ?? '').split(';')[0].trim().toLowerCase();

/**
 * A blob URL for a PDF or image served by the API. The API serves files with a sandbox policy that blanks
 * the browser's PDF viewer inside a frame, so the page frames a blob copy instead. Null while loading, for
 * other types, or when the fetch fails (callers keep a plain download link).
 */
export function useBlobPreview(url: string | null, contentType: string): string | null {
  const [state, setState] = useState<{ url: string; src: string } | null>(null);
  const type = baseType(contentType);
  const previewable = !!url && SAFE_TYPES.has(type);

  useEffect(() => {
    if (!url || !previewable) return;
    let alive = true;
    let blobUrl: string | null = null;
    void (async () => {
      try {
        const res = await fetch(resolveApiUrl(url));
        if (!res.ok) throw new Error('fetch');
        // The server's own answer must agree with the type it announced, or nothing is framed.
        if (baseType(res.headers.get('content-type')) !== type) throw new Error('type');
        const blob = new Blob([await res.arrayBuffer()], { type });
        if (!alive) return;
        blobUrl = URL.createObjectURL(blob);
        setState({ url, src: blobUrl });
      } catch {
        if (alive) setState(null);
      }
    })();
    return () => {
      alive = false;
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [url, type, previewable]);

  return state && state.url === url ? state.src : null;
}
