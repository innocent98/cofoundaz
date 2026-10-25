import type { DocSection, DocSummary, FileSummary } from '@/lib/api/documents';

const MIME_LABELS: Record<string, string> = {
  'application/pdf': 'PDF',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PPTX',
  'image/png': 'PNG',
  'image/jpeg': 'JPG',
  'text/plain': 'TXT',
  'text/csv': 'CSV',
  'text/markdown': 'MD',
};

export function mimeLabel(mime: string): string {
  return MIME_LABELS[mime] ?? 'FILE';
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function titleCase(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

export function personName(p: { name: string | null } | null | undefined): string {
  // The API has no email for a member without a profile name, so say who they are in general terms.
  return p?.name?.trim() || 'A member';
}

/** "Private" or "Shared · 2" (grants plus active token links). */
export function shareChip(count: number): string {
  return count > 0 ? `Shared · ${count}` : 'Private';
}

/** Whole days left before a trashed item is purged (never negative). */
export function daysLeft(purgesAt: string | null, now = Date.now()): number | null {
  if (!purgesAt) return null;
  const t = new Date(purgesAt).getTime();
  if (isNaN(t)) return null;
  return Math.max(0, Math.ceil((t - now) / 86_400_000));
}

/** A row in the single library list: a rich document or an uploaded file. */
export interface LibraryItem {
  key: string;
  id: string;
  source: 'document' | 'file';
  title: string;
  typeLabel: string;
  folder: string | null;
  tags: string[];
  ownerName: string;
  modified: string;
  shareCount: number;
  status: string; // Draft / Final for documents; scan state for files
  scanStatus?: string;
  sizeBytes?: number;
  version?: number;
  aiGenerated?: boolean;
  /** Files made by Export carry where they came from; null source once the document is purged. */
  origin?: 'upload' | 'export' | 'executed';
  sourceDocumentId?: string | null;
  sourceVersion?: number | null;
  trashedAt: string | null;
  purgesAt: string | null;
}

export function docToItem(d: DocSummary): LibraryItem {
  return {
    key: `doc-${d.id}`,
    id: d.id,
    source: 'document',
    title: d.title || 'Untitled document',
    typeLabel: 'DOC',
    folder: d.folder,
    tags: d.tags,
    ownerName: personName(d.owner),
    modified: d.updated_at,
    shareCount: d.share_count,
    status: titleCase(d.status),
    version: d.version,
    aiGenerated: d.ai_generated,
    trashedAt: d.trashed_at,
    purgesAt: d.purges_at,
  };
}

export function fileToItem(f: FileSummary): LibraryItem {
  return {
    key: `file-${f.id}`,
    id: f.id,
    source: 'file',
    title: f.filename,
    typeLabel: mimeLabel(f.mime || f.content_type),
    folder: f.folder,
    tags: f.tags,
    ownerName: personName(f.owner),
    modified: f.uploaded_at,
    shareCount: f.share_count,
    status: titleCase(f.scan_status),
    scanStatus: f.scan_status,
    sizeBytes: f.size_bytes,
    origin: f.origin,
    sourceDocumentId: f.source_document_id ?? null,
    sourceVersion: f.source_version ?? null,
    trashedAt: f.trashed_at,
    purgesAt: f.purges_at,
  };
}

/** Plain text of a document, for "Ask AI" (capped so the prompt stays small). */
export function sectionsToText(sections: DocSection[], max = 6000): string {
  const text = sections.map((s) => `${s.heading}\n${s.body}`.trim()).join('\n\n');
  return text.length > max ? `${text.slice(0, max)}\n[truncated]` : text;
}

export interface DiffLine {
  kind: 'same' | 'add' | 'remove';
  text: string;
}

/** Line diff (LCS) between two texts, for the version drawer. */
export function diffLines(oldText: string, newText: string): DiffLine[] {
  const a = oldText.split('\n');
  const b = newText.split('\n');
  const dp: number[][] = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const out: DiffLine[] = [];
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      out.push({ kind: 'same', text: a[i] });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      out.push({ kind: 'remove', text: a[i++] });
    } else {
      out.push({ kind: 'add', text: b[j++] });
    }
  }
  while (i < a.length) out.push({ kind: 'remove', text: a[i++] });
  while (j < b.length) out.push({ kind: 'add', text: b[j++] });
  return out;
}

/** Document sections as one string, headings included, for diffing. */
export function sectionsForDiff(sections: DocSection[]): string {
  return sections.map((s) => `## ${s.heading}\n${s.body}`).join('\n');
}
