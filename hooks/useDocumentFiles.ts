import { useState, useEffect, useCallback } from 'react';
import { apiClient, ApiError } from '@/lib/api/client';

export interface DocFileItem {
  id: string;
  title: string;
  type: string; // PDF / DOCX / XLSX / PPTX / PNG / JPG / TXT / CSV — badge label
  category: string; // the file's folder
  owner: string;
  modified: string;
  status: string;
  aiGenerated?: boolean;
  url: string;
  sizeBytes: number;
}

interface RawFile {
  id: string;
  filename: string;
  content_type: string;
  size_bytes: number;
  folder: string;
  url: string;
  uploaded_at: string;
}

// Upload allowlist (guide §5) — validate client-side so a bad pick fails fast
// without a round trip. Keyed by content_type → short badge label.
export const ALLOWED_TYPES: Record<string, string> = {
  'application/pdf': 'PDF',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PPTX',
  'image/png': 'PNG',
  'image/jpeg': 'JPG',
  'text/plain': 'TXT',
  'text/csv': 'CSV',
};
export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024; // 15 MB (guide §5)

function typeLabel(contentType: string): string {
  return ALLOWED_TYPES[contentType] ?? 'FILE';
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function mapFile(f: RawFile): DocFileItem {
  return {
    id: f.id,
    title: f.filename,
    type: typeLabel(f.content_type),
    category: f.folder || 'Uncategorized',
    owner: 'You',
    modified: formatDate(f.uploaded_at),
    status: 'Ready',
    aiGenerated: false,
    url: f.url,
    sizeBytes: f.size_bytes,
  };
}

export type UploadResult = { ok: boolean; error?: string };

export function useDocumentFiles() {
  const [files, setFiles] = useState<DocFileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient<{ data?: { files?: RawFile[] } }>('/documents/files');
      setFiles((res?.data?.files ?? []).map(mapFile));
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        console.warn('Documents unauthorized:', err.message);
      }
      setError(err instanceof Error ? err : new Error(String(err)));
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      refetch();
    });
  }, [refetch]);

  // POST /documents/files is multipart/form-data (guide §1) — the one non-JSON
  // endpoint. apiClient leaves the Content-Type unset for a FormData body so the
  // browser sets the multipart boundary.
  const uploadFile = useCallback(
    async (file: File, folder?: string): Promise<UploadResult> => {
      // Client-side gates (guide §5) — instant feedback, no round trip.
      if (!ALLOWED_TYPES[file.type]) {
        return { ok: false, error: "That file type isn't allowed. Upload a PDF, Office doc, image, text, or CSV." };
      }
      if (file.size > MAX_UPLOAD_BYTES) {
        return { ok: false, error: 'File must be 15 MB or smaller.' };
      }
      const form = new FormData();
      form.append('file', file);
      if (folder) form.append('folder', folder);
      setUploading(true);
      try {
        await apiClient('/documents/files', { method: 'POST', body: form });
        await refetch();
        return { ok: true };
      } catch (err) {
        const data = err instanceof ApiError ? (err.data as { error?: { message?: string } } | undefined) : undefined;
        setError(err instanceof Error ? err : new Error(String(err)));
        return { ok: false, error: data?.error?.message || 'Upload failed. Please try again.' };
      } finally {
        setUploading(false);
      }
    },
    [refetch]
  );

  const deleteFile = useCallback(
    async (id: string) => {
      // optimistic
      setFiles((prev) => prev.filter((f) => f.id !== id));
      try {
        await apiClient(`/documents/files/${id}`, { method: 'DELETE' });
      } catch (err) {
        if (!(err instanceof ApiError && err.status === 404)) {
          void refetch(); // reconcile if it wasn't already gone
        }
      }
    },
    [refetch]
  );

  return { files, loading, uploading, error, refetch, uploadFile, deleteFile };
}
