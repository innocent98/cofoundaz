'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Check, AlertTriangle, Plus, Trash2, ChevronUp, ChevronDown, GripVertical, History, Share2, Sparkles } from 'lucide-react';
import { useAiDrawer } from '@/components/ai-drawer-context';
import { ConfirmDialog, btnIcon, btnPrimary, btnSecondary } from '@/components/documents/ui';
import { ShareDialog } from '@/components/documents/share-dialog';
import { VersionDrawer } from '@/components/documents/version-drawer';
import { apiErrorInfo } from '@/lib/api/api-error';
import { getFolders, trashDocument } from '@/lib/api/documents';
import { sectionsToText } from '@/lib/documents-format';
import { useDocumentEditor, DocSection } from '@/hooks/useDocumentEditor';
import { useToast } from '../ToastContext';
import { useChipReorder } from '@/components/business-builder/use-chip-reorder';

export default function DocumentEditorPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id as string;
  const { doc, loading, notFound, refetch, save } = useDocumentEditor(id);
  const router = useRouter();
  const { triggerToast } = useToast();
  const { openAiDrawer } = useAiDrawer();
  const [status, setStatus] = useState('draft');
  const [folder, setFolder] = useState('');
  const [folderOptions, setFolderOptions] = useState<string[]>([]);
  const [shareOpen, setShareOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [trashOpen, setTrashOpen] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        setFolderOptions((await getFolders()).folders.map((f) => f.path));
      } catch {
        setFolderOptions([]);
      }
    })();
  }, []);

  const [title, setTitle] = useState('');
  const [sections, setSections] = useState<DocSection[]>([]);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conflict, setConflict] = useState(false);

  // Sync local editable state from the loaded document (and after each save).
  useEffect(() => {
    if (!doc) return;
    queueMicrotask(() => {
      setTitle(doc.title);
      setStatus(doc.status);
      setFolder(doc.folder ?? '');
      setSections(doc.sections.map((s) => ({ ...s })));
      setDirty(false);
    });
  }, [doc]);

  const touch = () => {
    setDirty(true);
    setSavedAt(false);
  };

  const setSectionBody = (idx: number, body: string) => {
    setSections((prev) => prev.map((s, i) => (i === idx ? { ...s, body } : s)));
    touch();
  };

  const setSectionHeading = (idx: number, heading: string) => {
    setSections((prev) => prev.map((s, i) => (i === idx ? { ...s, heading } : s)));
    touch();
  };

  const addSection = () => {
    // New sections carry no id; the server assigns one on save.
    setSections((prev) => [...prev, { heading: 'New section', body: '' }]);
    touch();
  };

  const removeSection = (idx: number) => {
    setSections((prev) => prev.filter((_, i) => i !== idx));
    touch();
  };

  const moveSection = (idx: number, dir: -1 | 1) => moveSectionTo(idx, idx + dir);

  // Move a section from one index to another (drag-reorder + the up/down buttons).
  const moveSectionTo = (from: number, to: number) => {
    setSections((prev) => {
      if (from === to || to < 0 || to >= prev.length) return prev;
      const next = [...prev];
      const [m] = next.splice(from, 1);
      next.splice(to, 0, m);
      return next;
    });
    touch();
  };

  // Drag-reorder via a grip handle (a single list, so the reorder hook's block key
  // is a constant). The up/down buttons remain as the keyboard-accessible path.
  const reorder = useChipReorder((_key, from, to) => moveSectionTo(from, to));

  const onSave = async () => {
    setSaving(true);
    setError(null);
    setConflict(false);
    const res = await save(title, sections, { status, folder: folder.trim() || null });
    setSaving(false);
    if (res.ok) {
      setDirty(false);
      setSavedAt(true);
    } else if (res.conflict) {
      setConflict(true);
    } else {
      setError(res.error || 'Could not save.');
    }
  };

  const reloadLatest = async () => {
    setConflict(false);
    await refetch();
  };

  return (
    <main className="p-4 md:p-8 max-w-3xl w-full mx-auto flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link href="/documents" className="inline-flex items-center gap-1.5 min-h-11 text-sm font-semibold text-ink-muted hover:text-ink">
          <ArrowLeft className="w-4 h-4" /> Documents
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-ink-subtle" aria-live="polite">
            {saving ? (
              <span className="flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Saving…</span>
            ) : savedAt ? (
              <span className="flex items-center gap-1 text-brand-mid"><Check className="w-3 h-3" /> Saved</span>
            ) : dirty ? (
              'Unsaved changes'
            ) : null}
          </span>
          {doc && (
            <>
              <button type="button" onClick={() => setShareOpen(true)} className={btnSecondary}>
                <Share2 className="w-3.5 h-3.5" /> Share
              </button>
              <button type="button" onClick={() => setHistoryOpen(true)} className={btnSecondary}>
                <History className="w-3.5 h-3.5" /> Version history
              </button>
              <button
                type="button"
                onClick={() => openAiDrawer({ seed: `I want to talk about my document “${title || doc.title}”. Here is its content:\n\n${sectionsToText(sections)}` })}
                className={btnSecondary}
              >
                <Sparkles className="w-3.5 h-3.5" /> Ask AI
              </button>
              <button type="button" aria-label="Move to Trash" onClick={() => setTrashOpen(true)} className={btnIcon}>
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
          <button onClick={onSave} disabled={saving || !dirty} className={btnPrimary}>
            Save
          </button>
        </div>
      </div>

      {loading && <div className="bg-white rounded-modal border border-line-soft shadow-card h-96 animate-pulse" />}

      {!loading && notFound && (
        <div className="bg-white rounded-modal border border-line-soft shadow-card p-10 text-center text-sm text-ink-muted">
          This document doesn&apos;t exist or you don&apos;t have access to it.
        </div>
      )}

      {!loading && doc && (
        <>
          {conflict && (
            <div className="bg-danger-tint border border-danger-xfad7d7 rounded-card p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-danger-600 shrink-0 mt-0.5" />
              <div className="flex flex-col gap-2">
                <p className="text-sm font-semibold text-danger-600">This document was changed somewhere else since you opened it.</p>
                <p className="text-xs text-accent-700">Reload to get the latest version. Your unsaved edits here will be lost.</p>
                <button onClick={reloadLatest} className="w-fit min-h-11 bg-white border border-danger-xf0d5d5 text-danger-600 text-xs font-bold px-3 rounded-card hover:bg-danger-wash transition-colors">
                  Reload latest
                </button>
              </div>
            </div>
          )}
          {error && <div className="bg-danger-tint border border-danger-xfad7d7 rounded-card p-3 text-xs font-semibold text-danger-600">{error}</div>}

          <div className="bg-white rounded-modal border border-line-soft shadow-card p-6 md:p-10 flex flex-col gap-6">
            <input
              type="text"
              value={title}
              onChange={(e) => { setTitle(e.target.value); setDirty(true); setSavedAt(false); }}
              placeholder="Untitled document"
              aria-label="Document title"
              className="text-2xl md:text-3xl font-display font-bold text-ink tracking-tight w-full min-h-11 focus:outline-none placeholder:text-neutral-xc5cfc7"
            />
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-ink-subtle -mt-3">
              <label className="flex items-center gap-2">
                Status
                <select
                  value={status}
                  onChange={(e) => { setStatus(e.target.value); touch(); }}
                  className="min-h-11 border border-line-strong rounded-input px-2 text-xs font-semibold text-ink bg-white"
                >
                  <option value="draft">Draft</option>
                  <option value="final">Final</option>
                </select>
              </label>
              <label className="flex items-center gap-2">
                Folder
                <input
                  list="editor-folders"
                  value={folder}
                  placeholder="Uncategorised"
                  onChange={(e) => { setFolder(e.target.value); touch(); }}
                  className="min-h-11 w-44 border border-line-strong rounded-input px-2 text-xs text-ink bg-white"
                />
                <datalist id="editor-folders">
                  {folderOptions.map((f) => <option key={f} value={f} />)}
                </datalist>
              </label>
              <span>v{doc.version}</span>
            </div>

            <div className="flex flex-col gap-7">
              {sections.length === 0 && (
                <p className="text-sm text-ink-subtle italic">No sections yet, add one below.</p>
              )}
              {sections.map((sec, idx) => (
                <section
                  key={sec.id ?? `new-${idx}`}
                  {...reorder.dropProps('sec', idx)}
                  className={`flex flex-col gap-2 group/sec rounded-card p-2 -m-2 transition-colors ${reorder.isOver('sec', idx) ? 'ring-1 ring-brand-strong bg-surface-ghost' : ''}`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      {...reorder.handleProps('sec', idx)}
                      className="hidden md:inline cursor-grab text-neutral-xc5cfc7 hover:text-ink-subtle md:opacity-0 md:group-hover/sec:opacity-100 transition-opacity shrink-0"
                      aria-label="Drag to reorder section"
                    >
                      <GripVertical className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      value={sec.heading}
                      onChange={(e) => setSectionHeading(idx, e.target.value)}
                      placeholder="Section heading"
                      aria-label="Section heading"
                      className="flex-1 min-h-11 text-sm font-bold text-ink uppercase tracking-wide bg-transparent focus:outline-none focus:bg-surface-ghost rounded px-1 -mx-1 py-0.5 placeholder:text-neutral-xc5cfc7 placeholder:normal-case"
                    />
                    {/* Reorder + remove — appear on row hover to keep the page calm. */}
                    <div className="flex items-center gap-0.5 md:opacity-0 md:group-hover/sec:opacity-100 md:focus-within:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => moveSection(idx, -1)}
                        disabled={idx === 0}
                        aria-label="Move section up"
                        className="inline-flex items-center justify-center min-h-11 min-w-11 rounded text-ink-subtle hover:text-ink hover:bg-line-faint disabled:opacity-30 disabled:hover:bg-transparent"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveSection(idx, 1)}
                        disabled={idx === sections.length - 1}
                        aria-label="Move section down"
                        className="inline-flex items-center justify-center min-h-11 min-w-11 rounded text-ink-subtle hover:text-ink hover:bg-line-faint disabled:opacity-30 disabled:hover:bg-transparent"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeSection(idx)}
                        aria-label="Remove section"
                        className="inline-flex items-center justify-center min-h-11 min-w-11 rounded text-ink-subtle hover:text-danger-600 hover:bg-danger-wash"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <textarea
                    value={sec.body}
                    onChange={(e) => setSectionBody(idx, e.target.value)}
                    placeholder={`Write the ${(sec.heading || 'section').toLowerCase()}…`}
                    rows={5}
                    className="w-full bg-surface-ghost border border-neutral-xe0e0db rounded-card p-4 text-sm text-ink focus:outline-none focus:border-brand-strong focus:bg-white transition-all resize-y leading-relaxed"
                  />
                </section>
              ))}

              <button
                type="button"
                onClick={addSection}
                className="flex items-center justify-center gap-1.5 min-h-11 text-sm font-semibold text-ink-muted hover:text-brand-strong border border-dashed border-line-strong hover:border-line-focus rounded-card py-3 transition-colors"
              >
                <Plus className="w-4 h-4" /> Add section
              </button>
            </div>
          </div>
        </>
      )}

      {doc && shareOpen && <ShareDialog doc={{ id: doc.id, title: title || doc.title }} onClose={() => setShareOpen(false)} />}
      {doc && historyOpen && (
        <VersionDrawer
          documentId={doc.id}
          currentSections={doc.sections}
          canRestore
          onClose={() => setHistoryOpen(false)}
          onRestored={() => void refetch()}
        />
      )}
      {doc && trashOpen && (
        <ConfirmDialog
          title="Move to Trash?"
          body="This document moves to the Trash for 30 days. People it is shared with lose access until you restore it."
          confirmLabel="Move to Trash"
          danger
          onClose={() => setTrashOpen(false)}
          onConfirm={async () => {
            try {
              await trashDocument(doc.id);
              triggerToast('Moved to the Trash.');
              router.push('/documents');
            } catch (err) {
              setTrashOpen(false);
              triggerToast(apiErrorInfo(err, 'Could not move to the Trash.').message, 'error');
            }
          }}
        />
      )}
    </main>
  );
}
