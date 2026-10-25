import { useEffect, useState } from 'react';
import { resolveApiUrl } from '@/lib/api/client';

/**
 * A blob URL for a PDF or image served by the API. The API serves files with a sandbox policy that blanks
 * the browser's PDF viewer inside a frame, so the page frames a blob copy instead. Null while loading, for
 * other types, or when the fetch fails (callers keep a plain download link).
 */
export function useBlobPreview(url: string | null, contentType: string): string | null {
  const [state, setState] = useState<{ url: string; src: string } | null>(null);
  const previewable = !!url && (contentType.includes('pdf') || contentType.startsWith('image/'));

  useEffect(() => {
    if (!url || !previewable) return;
    let alive = true;
    let blobUrl: string | null = null;
    void (async () => {
      try {
        const res = await fetch(resolveApiUrl(url));
        if (!res.ok) throw new Error('fetch');
        const blob = new Blob([await res.arrayBuffer()], { type: contentType });
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
  }, [url, contentType, previewable]);

  return state && state.url === url ? state.src : null;
}
