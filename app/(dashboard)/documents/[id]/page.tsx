'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Loader2, Check, AlertTriangle } from 'lucide-react';
import { useDocumentEditor, DocSection } from '@/hooks/useDocumentEditor';

export default function DocumentEditorPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id as string;
  const { doc, loading, notFound, refetch, save } = useDocumentEditor(id);

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
      setSections(doc.sections.map((s) => ({ ...s })));
      setDirty(false);
    });
  }, [doc]);

  const setSectionBody = (idx: number, body: string) => {
    setSections((prev) => prev.map((s, i) => (i === idx ? { ...s, body } : s)));
    setDirty(true);
    setSavedAt(false);
  };

  const onSave = async () => {
    setSaving(true);
    setError(null);
    setConflict(false);
    const res = await save(title, sections);
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
      <div className="flex items-center justify-between gap-4">
        <Link href="/documents" className="flex items-center gap-1.5 text-sm font-semibold text-[#617065] hover:text-[#1E2923]">
          <ArrowLeft className="w-4 h-4" /> Documents
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-xs text-[#8E9B90]">
            {saving ? (
              <span className="flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Saving…</span>
            ) : savedAt ? (
              <span className="flex items-center gap-1 text-[#2D5A3F]"><Check className="w-3 h-3" /> Saved</span>
            ) : dirty ? (
              'Unsaved changes'
            ) : null}
          </span>
          <button
            onClick={onSave}
            disabled={saving || !dirty}
            className="bg-[#183B28] hover:bg-[#11291C] disabled:opacity-50 text-white text-sm font-bold px-5 py-2 rounded-card transition-colors shadow-card"
          >
            Save
          </button>
        </div>
      </div>

      {loading && <div className="bg-white rounded-modal border border-[#EBEBE6] shadow-card h-96 animate-pulse" />}

      {!loading && notFound && (
        <div className="bg-white rounded-modal border border-[#EBEBE6] shadow-card p-10 text-center text-sm text-[#617065]">
          This document doesn&apos;t exist or you don&apos;t have access to it.
        </div>
      )}

      {!loading && doc && (
        <>
          {conflict && (
            <div className="bg-[#FDF2F2] border border-[#FAD7D7] rounded-card p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-[#B0483B] shrink-0 mt-0.5" />
              <div className="flex flex-col gap-2">
                <p className="text-sm font-semibold text-[#B0483B]">This document was changed somewhere else since you opened it.</p>
                <p className="text-xs text-[#8A5330]">Reload to get the latest version. Your unsaved edits here will be lost.</p>
                <button onClick={reloadLatest} className="w-fit bg-white border border-[#F0D5D5] text-[#B0483B] text-xs font-bold px-3 py-1.5 rounded-card hover:bg-[#FBEBEB] transition-colors">
                  Reload latest
                </button>
              </div>
            </div>
          )}
          {error && <div className="bg-[#FDF2F2] border border-[#FAD7D7] rounded-card p-3 text-xs font-semibold text-[#B0483B]">{error}</div>}

          <div className="bg-white rounded-modal border border-[#EBEBE6] shadow-card p-6 md:p-10 flex flex-col gap-6">
            <input
              type="text"
              value={title}
              onChange={(e) => { setTitle(e.target.value); setDirty(true); setSavedAt(false); }}
              placeholder="Untitled document"
              className="text-2xl md:text-3xl font-display font-bold text-[#1E2923] tracking-tight w-full focus:outline-none placeholder:text-[#C5CFC7]"
            />
            <div className="flex items-center gap-2 text-[11px] text-[#8E9B90] -mt-3">
              <span className="capitalize">{doc.status}</span>
              <span>·</span>
              <span>v{doc.version}</span>
            </div>

            <div className="flex flex-col gap-7">
              {sections.length === 0 && <p className="text-sm text-[#8E9B90] italic">This document has no sections.</p>}
              {sections.map((sec, idx) => (
                <section key={sec.id ?? idx} className="flex flex-col gap-2">
                  <h2 className="text-sm font-bold text-[#1E2923] uppercase tracking-wide">{sec.heading}</h2>
                  <textarea
                    value={sec.body}
                    onChange={(e) => setSectionBody(idx, e.target.value)}
                    placeholder={`Write the ${sec.heading.toLowerCase()}…`}
                    rows={5}
                    className="w-full bg-[#FAFAFA] border border-[#E0E0DB] rounded-card p-4 text-sm text-[#1E2923] focus:outline-none focus:border-[#183B28] focus:bg-white transition-all resize-y leading-relaxed"
                  />
                </section>
              ))}
            </div>
          </div>
        </>
      )}
    </main>
  );
}
