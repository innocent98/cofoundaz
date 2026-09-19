'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Loader2, Check, AlertTriangle, Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
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

  const moveSection = (idx: number, dir: -1 | 1) => {
    setSections((prev) => {
      const target = idx + dir;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
    touch();
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
              {sections.length === 0 && (
                <p className="text-sm text-[#8E9B90] italic">No sections yet — add one below.</p>
              )}
              {sections.map((sec, idx) => (
                <section key={sec.id ?? `new-${idx}`} className="flex flex-col gap-2 group/sec">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={sec.heading}
                      onChange={(e) => setSectionHeading(idx, e.target.value)}
                      placeholder="Section heading"
                      className="flex-1 text-sm font-bold text-[#1E2923] uppercase tracking-wide bg-transparent focus:outline-none focus:bg-[#FAFAFA] rounded px-1 -mx-1 py-0.5 placeholder:text-[#C5CFC7] placeholder:normal-case"
                    />
                    {/* Reorder + remove — appear on row hover to keep the page calm. */}
                    <div className="flex items-center gap-0.5 opacity-0 group-hover/sec:opacity-100 focus-within:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => moveSection(idx, -1)}
                        disabled={idx === 0}
                        aria-label="Move section up"
                        className="p-1 rounded text-[#8E9B90] hover:text-[#1E2923] hover:bg-[#F0F0EC] disabled:opacity-30 disabled:hover:bg-transparent"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveSection(idx, 1)}
                        disabled={idx === sections.length - 1}
                        aria-label="Move section down"
                        className="p-1 rounded text-[#8E9B90] hover:text-[#1E2923] hover:bg-[#F0F0EC] disabled:opacity-30 disabled:hover:bg-transparent"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeSection(idx)}
                        aria-label="Remove section"
                        className="p-1 rounded text-[#8E9B90] hover:text-[#B0483B] hover:bg-[#FBEBEB]"
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
                    className="w-full bg-[#FAFAFA] border border-[#E0E0DB] rounded-card p-4 text-sm text-[#1E2923] focus:outline-none focus:border-[#183B28] focus:bg-white transition-all resize-y leading-relaxed"
                  />
                </section>
              ))}

              <button
                type="button"
                onClick={addSection}
                className="flex items-center justify-center gap-1.5 text-sm font-semibold text-[#617065] hover:text-[#183B28] border border-dashed border-[#D5DDD6] hover:border-[#4D6D58] rounded-card py-3 transition-colors"
              >
                <Plus className="w-4 h-4" /> Add section
              </button>
            </div>
          </div>
        </>
      )}
    </main>
  );
}
