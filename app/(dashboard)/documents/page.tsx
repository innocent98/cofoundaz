'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronDown, FolderPlus, Search, Sparkles, UploadCloud } from 'lucide-react';
import { useAiDrawer } from '@/components/ai-drawer-context';
import { ConfirmDialog, PromptDialog, btnPrimary, btnSecondary, inputCls } from '@/components/documents/ui';
import { FileViewer } from '@/components/documents/file-viewer';
import { RowMenu, type MenuAction } from '@/components/documents/row-menu';
import { ExportDialog } from '@/components/documents/export-dialog';
import { ShareDialog } from '@/components/documents/share-dialog';
import { apiErrorInfo } from '@/lib/api/api-error';
import {
  MAX_UPLOAD_LABEL,
  UPLOAD_ACCEPT,
  createDocument,
  createFolder,
  createStandardFolders,
  deleteDocumentPermanently,
  deleteFilePermanently,
  deleteFolder,
  fileDownloadLink,
  getDocument,
  patchDocument,
  patchFile,
  renameFolder,
  restoreDocument,
  restoreFile,
  trashDocument,
  trashFile,
  uploadFile,
  uploadProblem,
} from '@/lib/api/documents';
import { daysLeft, formatDate, formatSize, sectionsToText, shareChip, type LibraryItem } from '@/lib/documents-format';
import { useDocumentsLibrary, viewKey, type LibraryView } from '@/hooks/useDocumentsLibrary';
import { useToast } from './ToastContext';

type UploadJob = { id: number; name: string; state: 'queued' | 'uploading' | 'done' | 'failed'; error?: string };

const TYPE_STYLE: Record<string, string> = {
  PDF: 'bg-danger-tint text-danger-bold',
  DOC: 'bg-info-xeff6ff text-info-x1d4ed8',
  DOCX: 'bg-info-xeff6ff text-info-x1d4ed8',
  XLSX: 'bg-brand-xecfdf5 text-brand-x047857',
};

function TypeBadge({ label }: { label: string }) {
  return (
    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider shrink-0 ${TYPE_STYLE[label] ?? 'bg-accent-xfff7ed text-accent-xc2410c'}`}>
      {label}
    </span>
  );
}

function StatusChip({ item }: { item: LibraryItem }) {
  if (item.source === 'file') {
    if (item.scanStatus === 'pending') return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-warning-100 text-warning-800">Scanning</span>;
    if (item.scanStatus === 'blocked') return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-danger-tint text-danger-bold">Blocked</span>;
    return <span className="text-[11px] text-ink-subtle">{formatSize(item.sizeBytes ?? 0)}</span>;
  }
  const cls = item.status === 'Final' ? 'bg-success-100 text-success-800' : 'bg-neutral-xeceeef text-neutral-x55625a';
  return <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${cls}`}>{item.status}</span>;
}

export default function DocumentsLibraryPage() {
  const router = useRouter();
  const { triggerToast } = useToast();
  const { openAiDrawer } = useAiDrawer();

  const [view, setView] = useState<LibraryView>({ kind: 'all' });
  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');
  const [mode, setMode] = useState<'Grid' | 'List'>('List');
  const { items, tree, loading, error, reload } = useDocumentsLibrary(view, q);

  useEffect(() => {
    const t = setTimeout(() => setQ(search.trim()), 250);
    return () => clearTimeout(t);
  }, [search]);

  // Dialog state
  const [shareDoc, setShareDoc] = useState<LibraryItem | null>(null);
  const [exportDoc, setExportDoc] = useState<LibraryItem | null>(null);
  const [shareFile, setShareFile] = useState<LibraryItem | null>(null);
  const [viewFile, setViewFile] = useState<LibraryItem | null>(null);
  const [rename, setRename] = useState<LibraryItem | null>(null);
  const [move, setMove] = useState<LibraryItem | null>(null);
  const [tagsFor, setTagsFor] = useState<LibraryItem | null>(null);
  const [toTrash, setToTrash] = useState<LibraryItem | null>(null);
  const [forever, setForever] = useState<LibraryItem | null>(null);
  const [newFolder, setNewFolder] = useState(false);
  const [renameFolderOpen, setRenameFolderOpen] = useState(false);
  const [deleteFolderOpen, setDeleteFolderOpen] = useState(false);

  // Uploads: a queue, one file at a time, with a per-file state.
  const fileInput = useRef<HTMLInputElement>(null);
  const [jobs, setJobs] = useState<UploadJob[]>([]);
  const [dragging, setDragging] = useState(false);
  const dragDepth = useRef(0);
  const nextJob = useRef(1);
  const [newMenu, setNewMenu] = useState(false);

  const folderPaths = useMemo(() => tree.folders.map((f) => f.path), [tree.folders]);
  const selectedFolder = view.kind === 'folder' ? tree.folders.find((f) => f.path === view.path) ?? null : null;
  const uploadFolder = view.kind === 'folder' ? view.path : undefined;

  const fail = (err: unknown, fallback: string) => triggerToast(apiErrorInfo(err, fallback).message, 'error');

  const runUploads = useCallback(
    async (files: File[]) => {
      const queued: { job: UploadJob; file: File }[] = [];
      const rejected: UploadJob[] = [];
      for (const file of files) {
        const problem = uploadProblem(file);
        const job: UploadJob = { id: nextJob.current++, name: file.name, state: problem ? 'failed' : 'queued', error: problem ?? undefined };
        if (problem) rejected.push(job);
        else queued.push({ job, file });
      }
      setJobs((j) => [...j, ...rejected, ...queued.map((x) => x.job)]);
      for (const { job, file } of queued) {
        setJobs((j) => j.map((x) => (x.id === job.id ? { ...x, state: 'uploading' } : x)));
        try {
          await uploadFile(file, uploadFolder);
          setJobs((j) => j.map((x) => (x.id === job.id ? { ...x, state: 'done' } : x)));
        } catch (err) {
          const msg = apiErrorInfo(err, 'Upload failed. Please try again.').message;
          setJobs((j) => j.map((x) => (x.id === job.id ? { ...x, state: 'failed', error: msg } : x)));
        }
      }
      if (queued.length) await reload();
    },
    [uploadFolder, reload],
  );

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (files.length) void runUploads(files);
  };

  // Drop anywhere on the page.
  useEffect(() => {
    const hasFiles = (e: DragEvent) => Array.from(e.dataTransfer?.types ?? []).includes('Files');
    const enter = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      dragDepth.current += 1;
      setDragging(true);
    };
    const leave = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      dragDepth.current = Math.max(0, dragDepth.current - 1);
      if (dragDepth.current === 0) setDragging(false);
    };
    const over = (e: DragEvent) => {
      if (hasFiles(e)) e.preventDefault();
    };
    const drop = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      dragDepth.current = 0;
      setDragging(false);
      const files = Array.from(e.dataTransfer?.files ?? []);
      if (files.length) void runUploads(files);
    };
    window.addEventListener('dragenter', enter);
    window.addEventListener('dragleave', leave);
    window.addEventListener('dragover', over);
    window.addEventListener('drop', drop);
    return () => {
      window.removeEventListener('dragenter', enter);
      window.removeEventListener('dragleave', leave);
      window.removeEventListener('dragover', over);
      window.removeEventListener('drop', drop);
    };
  }, [runUploads]);

  const newBlank = async () => {
    setNewMenu(false);
    try {
      const d = await createDocument({ kind: 'custom', title: 'Untitled document', folder: uploadFolder ?? null });
      router.push(`/documents/${d.id}`);
    } catch (err) {
      fail(err, 'Could not create the document.');
    }
  };

  const open = (item: LibraryItem) => {
    if (item.trashedAt) return;
    if (item.source === 'document') {
      router.push(`/documents/${item.id}`);
    } else if (item.scanStatus === 'pending') {
      triggerToast('This file is still being scanned. Try again in a moment.', 'error');
    } else if (item.scanStatus === 'blocked') {
      triggerToast('This file was blocked by the scan and can’t be opened.', 'error');
    } else {
      setViewFile(item);
    }
  };

  const download = async (item: LibraryItem) => {
    try {
      const { url } = await fileDownloadLink(item.id);
      window.open(url, '_blank', 'noopener');
    } catch (err) {
      fail(err, 'Could not download this file.');
    }
  };

  const askAi = async (item: LibraryItem) => {
    try {
      if (item.source === 'document') {
        const d = await getDocument(item.id);
        openAiDrawer({ seed: `I want to talk about my document “${d.title}”. Here is its content:\n\n${sectionsToText(d.sections)}` });
      } else {
        openAiDrawer({ seed: `I want to talk about my uploaded file “${item.title}” (${item.typeLabel}). What should I check in a file like this?` });
      }
    } catch (err) {
      fail(err, 'Could not open this document for the assistant.');
    }
  };

  const restore = async (item: LibraryItem) => {
    try {
      await (item.source === 'document' ? restoreDocument(item.id) : restoreFile(item.id));
      triggerToast(`Restored ${item.title}.`);
      await reload();
    } catch (err) {
      fail(err, 'Could not restore this item.');
    }
  };

  const actionsFor = (item: LibraryItem): MenuAction[] => {
    if (item.trashedAt) {
      return [
        { label: 'Restore', onSelect: () => void restore(item) },
        { label: 'Delete forever', danger: true, onSelect: () => setForever(item) },
      ];
    }
    const a: MenuAction[] = [{ label: 'Open', onSelect: () => open(item) }, { label: 'Rename', onSelect: () => setRename(item) }];
    a.push({ label: 'Move to folder', onSelect: () => setMove(item) }, { label: 'Edit tags', onSelect: () => setTagsFor(item) });
    if (item.source === 'document') {
      a.push({ label: 'Share', onSelect: () => setShareDoc(item) }, { label: 'Export as PDF or Word', onSelect: () => setExportDoc(item) });
    } else {
      a.push({ label: 'Download', onSelect: () => void download(item) });
      if (item.scanStatus === 'clean') a.push({ label: 'Share by link', onSelect: () => setShareFile(item) });
      if (item.scanStatus === 'clean' && item.typeLabel === 'PDF') {
        a.push({ label: 'Send for signature', onSelect: () => router.push(`/documents/signatures?file=${encodeURIComponent(item.id)}`) });
      }
      if (item.origin === 'export' && item.sourceDocumentId) {
        const src = item.sourceDocumentId;
        a.push({ label: 'Open source document', onSelect: () => router.push(`/documents/${src}`) });
      }
    }
    a.push({ label: 'Ask AI', onSelect: () => void askAi(item) }, { label: 'Move to Trash', danger: true, onSelect: () => setToTrash(item) });
    return a;
  };

  const isTrash = view.kind === 'trash';
  const filtering = q.length > 0;
  const heading =
    view.kind === 'all' ? 'All documents' : view.kind === 'uncategorized' ? 'Uncategorised' : view.kind === 'trash' ? 'Trash' : view.path;

  const sidebarRows: { key: string; label: string; count: number; depth: number; view: LibraryView }[] = [
    { key: 'all', label: 'All documents', count: tree.total, depth: 0, view: { kind: 'all' } },
    ...tree.folders.map((f) => ({
      key: `f:${f.path}`,
      label: f.name,
      count: f.total_count,
      depth: f.path.split('/').length - 1,
      view: { kind: 'folder', path: f.path } as LibraryView,
    })),
    { key: 'uncategorized', label: 'Uncategorised', count: tree.uncategorized, depth: 0, view: { kind: 'uncategorized' } },
    { key: 'trash', label: 'Trash', count: tree.trash, depth: 0, view: { kind: 'trash' } },
  ];

  const titleCell = (item: LibraryItem) => {
    const cls = 'font-medium text-ink text-left hover:underline min-h-11 inline-flex items-center gap-2 min-w-0';
    const inner = (
      <>
        <TypeBadge label={item.typeLabel} />
        <span className="truncate">{item.title}</span>
      </>
    );
    if (item.trashedAt) return <span className={cls.replace('hover:underline', '')}>{inner}</span>;
    return item.source === 'document' ? (
      <Link href={`/documents/${item.id}`} className={cls}>
        {inner}
      </Link>
    ) : (
      <button type="button" onClick={() => open(item)} className={cls}>
        {inner}
      </button>
    );
  };

  const metaLine = (item: LibraryItem) =>
    isTrash
      ? `Deleted · ${daysLeft(item.purgesAt) ?? 0} days left before it is removed for good`
      : `${item.ownerName} · ${formatDate(item.modified)} · ${item.origin === 'executed' ? 'Signed copy' : item.origin === 'export' ? `Exported${item.sourceVersion ? ` from version ${item.sourceVersion}` : ''}` : shareChip(item.shareCount)}`;

  return (
    <main className="max-w-7xl mx-auto px-4 md:px-6 py-8 space-y-6">
      {dragging && (
        <div className="fixed inset-0 z-40 bg-brand-x061a12/50 flex items-center justify-center pointer-events-none" aria-hidden="true">
          <div className="bg-white rounded-modal shadow-raised px-10 py-8 text-center">
            <UploadCloud className="mx-auto mb-2 text-brand-strong" />
            <p className="font-bold text-ink">Drop files to upload</p>
            <p className="text-xs text-ink-subtle">Up to {MAX_UPLOAD_LABEL} each</p>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display text-ink-strong tracking-tight mb-1">Documents</h1>
          <p className="text-xs text-neutral-x738279">Every file your company has produced, versioned and searchable.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <input ref={fileInput} type="file" multiple accept={UPLOAD_ACCEPT} onChange={onPick} className="hidden" aria-label="Choose files to upload" />
          <button type="button" onClick={() => fileInput.current?.click()} className={btnSecondary}>
            Upload
          </button>
          <div className="relative">
            <button type="button" aria-haspopup="menu" aria-expanded={newMenu} onClick={() => setNewMenu((o) => !o)} className={btnPrimary}>
              New document <ChevronDown size={14} />
            </button>
            {newMenu && (
              <div role="menu" className="absolute right-0 z-30 mt-1 w-56 bg-white border border-line rounded-card shadow-raised py-1">
                <button role="menuitem" type="button" onClick={() => void newBlank()} className="w-full text-left min-h-11 px-4 text-xs font-semibold text-ink hover:bg-surface-muted">
                  Blank document
                </button>
                <Link role="menuitem" href="/documents/templates" className="flex items-center min-h-11 px-4 text-xs font-semibold text-ink hover:bg-surface-muted">
                  From a template
                </Link>
                <button
                  role="menuitem"
                  type="button"
                  onClick={() => {
                    setNewMenu(false);
                    fileInput.current?.click();
                  }}
                  className="w-full text-left min-h-11 px-4 text-xs font-semibold text-ink hover:bg-surface-muted"
                >
                  Upload a file
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <p className="text-[11px] text-ink-subtle -mt-3">
        Drop files anywhere on this page or use Upload. PDF, Word, Excel, PowerPoint, images, text, CSV and Markdown, up to {MAX_UPLOAD_LABEL} each.
        Every file is scanned before it can be opened.
      </p>

      {jobs.length > 0 && (
        <section aria-label="Uploads" className="bg-white border border-line rounded-card p-4 space-y-1.5">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-ink">Uploads</h2>
            <button type="button" className="min-h-11 px-2 text-xs font-semibold text-ink-muted hover:text-ink" onClick={() => setJobs((j) => j.filter((x) => x.state === 'uploading' || x.state === 'queued'))}>
              Clear finished
            </button>
          </div>
          <ul>
            {jobs.map((j) => (
              <li key={j.id} className="flex flex-wrap items-center justify-between gap-2 text-xs py-0.5">
                <span className="truncate text-ink">{j.name}</span>
                <span
                  className={
                    j.state === 'failed' ? 'text-danger-bold font-semibold' : j.state === 'done' ? 'text-success font-semibold' : 'text-ink-subtle'
                  }
                  role={j.state === 'failed' ? 'alert' : undefined}
                >
                  {j.state === 'queued' ? 'Waiting' : j.state === 'uploading' ? 'Uploading…' : j.state === 'done' ? 'Uploaded' : j.error}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Folder navigation: a select on small screens, the tree from lg up. */}
        <div className="lg:hidden flex items-center gap-2">
          <label htmlFor="folder-select" className="sr-only">
            Folder
          </label>
          <select
            id="folder-select"
            className={`${inputCls} flex-1 min-w-0`}
            value={viewKey(view)}
            onChange={(e) => {
              const r = sidebarRows.find((s) => viewKey(s.view) === e.target.value);
              if (r) setView(r.view);
            }}
          >
            {sidebarRows.map((r) => (
              <option key={r.key} value={viewKey(r.view)}>
                {'  '.repeat(r.depth)}
                {r.label} ({r.count})
              </option>
            ))}
          </select>
          <button type="button" onClick={() => setNewFolder(true)} className={`${btnSecondary} shrink-0 gap-1.5`}>
            <FolderPlus size={14} /> New folder
          </button>
        </div>
        <nav aria-label="Folders" className="hidden lg:block lg:col-span-1 bg-white border border-line rounded-modal p-2 shadow-card space-y-0.5">
          {sidebarRows.map((r) => {
            const selected = viewKey(view) === viewKey(r.view);
            return (
              <button
                key={r.key}
                type="button"
                aria-current={selected ? 'page' : undefined}
                onClick={() => setView(r.view)}
                style={{ paddingLeft: `${0.75 + r.depth * 0.9}rem` }}
                className={`w-full flex items-center justify-between min-h-11 pr-3 rounded-card text-xs transition-colors ${
                  selected ? 'bg-neutral-xf2f4f2 text-ink font-semibold' : 'text-ink-muted hover:bg-neutral-xf9f9f6 hover:text-ink font-medium'
                }`}
              >
                <span className="truncate">{r.label}</span>
                <span className="text-[11px] text-ink-subtle ml-2">{r.count}</span>
              </button>
            );
          })}
          <div className="pt-1 border-t border-line mt-1 space-y-0.5">
            <button type="button" onClick={() => setNewFolder(true)} className="w-full flex items-center gap-2 min-h-11 px-3 rounded-card text-xs font-semibold text-brand-strong hover:bg-surface-muted">
              <FolderPlus size={14} /> New folder
            </button>
            {tree.folders.length === 0 && (
              <button
                type="button"
                onClick={async () => {
                  try {
                    await createStandardFolders();
                    triggerToast('Standard folders created.');
                    await reload();
                  } catch (err) {
                    fail(err, 'Could not create the folders.');
                  }
                }}
                className="w-full text-left min-h-11 px-3 rounded-card text-xs font-semibold text-ink-muted hover:bg-surface-muted"
              >
                Set up standard folders
              </button>
            )}
          </div>
        </nav>

        <div className="lg:col-span-3 space-y-4 min-w-0">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="relative w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-x9ca8a0" size={15} />
              <label htmlFor="doc-search" className="sr-only">
                Search documents
              </label>
              <input
                id="doc-search"
                type="search"
                placeholder="Search names, tags and document text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`${inputCls} pl-10`}
              />
            </div>
            <div className="flex items-center gap-0.5 bg-white border border-line p-0.5 rounded-card shadow-card shrink-0 self-end md:self-auto" role="group" aria-label="Layout">
              {(['Grid', 'List'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  aria-pressed={mode === m}
                  onClick={() => setMode(m)}
                  className={`min-h-11 px-4 rounded-input text-xs font-medium transition-colors ${
                    mode === m ? 'bg-brand-strong text-white font-semibold' : 'text-ink-muted hover:bg-surface-muted'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-ink">{heading}</h2>
            {selectedFolder && (
              <div className="flex gap-2">
                <button type="button" className="min-h-11 px-3 text-xs font-semibold text-ink-muted hover:text-ink" onClick={() => setRenameFolderOpen(true)}>
                  Rename folder
                </button>
                <button type="button" className="min-h-11 px-3 text-xs font-semibold text-danger-bold" onClick={() => setDeleteFolderOpen(true)}>
                  Delete folder
                </button>
              </div>
            )}
          </div>
          {isTrash && (
            <p className="text-xs text-ink-subtle">Items stay here for 30 days, then they are removed for good. Anything shared stays hidden from other people until you restore it.</p>
          )}

          {error && (
            <div role="alert" className="bg-danger-tint border border-danger-xfad7d7 rounded-card p-4 text-sm text-danger-600 flex flex-wrap items-center justify-between gap-3">
              <span>{error}</span>
              <button type="button" className={btnSecondary} onClick={() => void reload()}>
                Try again
              </button>
            </div>
          )}

          {loading && items.length === 0 && !error && (
            <div className="space-y-2 animate-pulse" aria-label="Loading documents">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-14 bg-white border border-line rounded-card" />
              ))}
            </div>
          )}

          {!loading && !error && items.length === 0 && (
            <div className="bg-white border border-line rounded-modal shadow-card p-12 text-center">
              {filtering ? (
                <>
                  <p className="text-sm font-semibold text-ink">No matches</p>
                  <p className="text-xs text-ink-subtle mt-1">Nothing here matches “{q}”. Try a different word.</p>
                </>
              ) : isTrash ? (
                <>
                  <p className="text-sm font-semibold text-ink">Trash is empty</p>
                  <p className="text-xs text-ink-subtle mt-1">Deleted documents and files wait here for 30 days.</p>
                </>
              ) : (
                <>
                  <p className="text-sm font-semibold text-ink">{view.kind === 'all' ? 'No documents yet' : 'Nothing in this folder'}</p>
                  <p className="text-xs text-ink-subtle mt-1">Create a document, or upload a PDF, Office file, image, text or CSV.</p>
                  <button type="button" onClick={() => fileInput.current?.click()} className={`${btnPrimary} mt-4`}>
                    Upload a file
                  </button>
                </>
              )}
            </div>
          )}

          {items.length > 0 && mode === 'Grid' && (
            <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map((item) => (
                <li key={item.key} className="bg-white border border-line rounded-modal p-4 shadow-card flex flex-col gap-2 hover:border-line-strong transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    {titleCell(item)}
                    <RowMenu title={item.title} actions={actionsFor(item)} />
                  </div>
                  <p className="text-[11px] text-ink-subtle">{metaLine(item)}</p>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <StatusChip item={item} />
                    {item.folder && <span className="text-[11px] text-ink-subtle">{item.folder}</span>}
                    {item.tags.map((t) => (
                      <span key={t} className="px-2 py-0.5 rounded-full text-[10px] bg-surface-muted text-ink-muted">
                        {t}
                      </span>
                    ))}
                    {item.aiGenerated && (
                      <span className="flex items-center gap-1 text-[11px] text-accent-600 font-medium">
                        <Sparkles size={12} /> AI generated
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}

          {items.length > 0 && mode === 'List' && (
            <ul className="bg-white border border-line rounded-modal shadow-card divide-y divide-line">
              {items.map((item) => (
                <li key={item.key} className="flex items-center gap-2 px-4 py-1 hover:bg-neutral-xf9f9f6">
                  <div className="min-w-0 flex-1 py-1">
                    {titleCell(item)}
                    <p className="text-[11px] text-ink-subtle">{metaLine(item)}</p>
                    {(item.tags.length > 0 || item.folder) && (
                      <div className="flex flex-wrap gap-1.5 pb-1">
                        {item.folder && <span className="text-[11px] text-ink-subtle">{item.folder}</span>}
                        {item.tags.map((t) => (
                          <span key={t} className="px-2 py-0.5 rounded-full text-[10px] bg-surface-muted text-ink-muted">
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <StatusChip item={item} />
                  <RowMenu title={item.title} actions={actionsFor(item)} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {shareDoc && <ShareDialog doc={{ id: shareDoc.id, title: shareDoc.title }} onClose={() => setShareDoc(null)} onChanged={() => void reload()} />}
      {shareFile && <ShareDialog kind="file" doc={{ id: shareFile.id, title: shareFile.title }} onClose={() => setShareFile(null)} onChanged={() => void reload()} />}
      {exportDoc && <ExportDialog documentId={exportDoc.id} onClose={() => setExportDoc(null)} onExported={() => void reload()} />}
      {viewFile && <FileViewer file={{ id: viewFile.id, title: viewFile.title }} onClose={() => setViewFile(null)} />}

      {rename && (
        <PromptDialog
          title={`Rename “${rename.title}”`}
          submitLabel="Rename"
          fields={[{ name: 'name', label: 'Name', value: rename.title, required: true }]}
          onClose={() => setRename(null)}
          onSubmit={async (v) => {
            try {
              await (rename.source === 'document' ? patchDocument(rename.id, { title: v.name }) : patchFile(rename.id, { filename: v.name }));
              triggerToast('Renamed.');
              setRename(null);
              await reload();
            } catch (err) {
              return apiErrorInfo(err, 'Could not rename.').message;
            }
          }}
        />
      )}
      {move && (
        <PromptDialog
          title={`Move “${move.title}”`}
          submitLabel="Move"
          fields={[
            {
              name: 'folder',
              label: 'Folder',
              value: move.folder ?? '',
              placeholder: 'Leave empty for Uncategorised',
              hint: 'Use a path like Legal/NDAs. A new path creates the folders.',
              list: folderPaths,
            },
          ]}
          onClose={() => setMove(null)}
          onSubmit={async (v) => {
            const folder = v.folder.trim() || null;
            try {
              await (move.source === 'document' ? patchDocument(move.id, { folder }) : patchFile(move.id, { folder }));
              triggerToast(folder ? `Moved to ${folder}.` : 'Moved to Uncategorised.');
              setMove(null);
              await reload();
            } catch (err) {
              return apiErrorInfo(err, 'Could not move.').message;
            }
          }}
        />
      )}
      {tagsFor && (
        <PromptDialog
          title={`Tags for “${tagsFor.title}”`}
          submitLabel="Save tags"
          fields={[{ name: 'tags', label: 'Tags', value: tagsFor.tags.join(', '), placeholder: 'seed, pitch', hint: 'Separate tags with commas. Up to 10 tags.' }]}
          onClose={() => setTagsFor(null)}
          onSubmit={async (v) => {
            const tags = v.tags.split(',').map((t) => t.trim()).filter(Boolean);
            try {
              await (tagsFor.source === 'document' ? patchDocument(tagsFor.id, { tags }) : patchFile(tagsFor.id, { tags }));
              triggerToast('Tags saved.');
              setTagsFor(null);
              await reload();
            } catch (err) {
              return apiErrorInfo(err, 'Could not save tags.').message;
            }
          }}
        />
      )}
      {toTrash && (
        <ConfirmDialog
          title="Move to Trash?"
          body={
            <>
              “{toTrash.title}” moves to the Trash for 30 days. {toTrash.shareCount > 0 && 'People it is shared with lose access until you restore it. '}
              You can restore it any time before then.
            </>
          }
          confirmLabel="Move to Trash"
          danger
          onClose={() => setToTrash(null)}
          onConfirm={async () => {
            try {
              await (toTrash.source === 'document' ? trashDocument(toTrash.id) : trashFile(toTrash.id));
              triggerToast(`Moved ${toTrash.title} to the Trash.`);
              setToTrash(null);
              await reload();
            } catch (err) {
              setToTrash(null);
              if (apiErrorInfo(err, '').code === 'FILE_HAS_SIGNATURE_REQUESTS') {
                triggerToast('This file is part of a signature record, so it can’t be moved to the Trash or deleted.', 'error');
              } else fail(err, 'Could not move to the Trash.');
            }
          }}
        />
      )}
      {forever && (
        <ConfirmDialog
          title="Delete forever?"
          body={`“${forever.title}” will be removed for good. This can’t be undone.`}
          confirmLabel="Delete forever"
          danger
          onClose={() => setForever(null)}
          onConfirm={async () => {
            try {
              await (forever.source === 'document' ? deleteDocumentPermanently(forever.id) : deleteFilePermanently(forever.id));
              triggerToast(`Deleted ${forever.title}.`);
              setForever(null);
              await reload();
            } catch (err) {
              setForever(null);
              fail(err, 'Could not delete this item.');
            }
          }}
        />
      )}
      {newFolder && (
        <PromptDialog
          title={selectedFolder ? `New folder in ${selectedFolder.path}` : 'New folder'}
          submitLabel="Create folder"
          fields={[{ name: 'name', label: 'Folder name', value: '', required: true }]}
          onClose={() => setNewFolder(false)}
          onSubmit={async (v) => {
            try {
              await createFolder(v.name.trim(), selectedFolder?.id);
              triggerToast('Folder created.');
              setNewFolder(false);
              await reload();
            } catch (err) {
              return apiErrorInfo(err, 'Could not create the folder.').message;
            }
          }}
        />
      )}
      {renameFolderOpen && selectedFolder && (
        <PromptDialog
          title={`Rename folder “${selectedFolder.name}”`}
          submitLabel="Rename"
          fields={[{ name: 'name', label: 'Folder name', value: selectedFolder.name, required: true }]}
          onClose={() => setRenameFolderOpen(false)}
          onSubmit={async (v) => {
            try {
              await renameFolder(selectedFolder.id, v.name.trim());
              const parent = selectedFolder.path.split('/').slice(0, -1);
              setView({ kind: 'folder', path: [...parent, v.name.trim()].join('/') });
              triggerToast('Folder renamed.');
              setRenameFolderOpen(false);
              await reload();
            } catch (err) {
              return apiErrorInfo(err, 'Could not rename the folder.').message;
            }
          }}
        />
      )}
      {deleteFolderOpen && selectedFolder && (
        <ConfirmDialog
          title="Delete this folder?"
          body={`“${selectedFolder.path}” will be deleted. Only empty folders can be deleted.`}
          confirmLabel="Delete folder"
          danger
          onClose={() => setDeleteFolderOpen(false)}
          onConfirm={async () => {
            try {
              await deleteFolder(selectedFolder.id);
              triggerToast('Folder deleted.');
              setDeleteFolderOpen(false);
              setView({ kind: 'all' });
              await reload();
            } catch (err) {
              setDeleteFolderOpen(false);
              fail(err, 'Could not delete the folder.');
            }
          }}
        />
      )}
    </main>
  );
}
