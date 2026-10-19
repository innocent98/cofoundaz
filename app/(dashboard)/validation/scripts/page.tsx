'use client';

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, Loader2, Sparkles, Trash2 } from 'lucide-react';
import { useAssumptions } from '@/hooks/useAssumptions';
import { useScripts } from '@/hooks/useScripts';
import { ConfirmDelete } from '@/components/validation/ConfirmDelete';
import { ScriptEditor } from '@/components/validation/ScriptEditor';
import { MAX_SCRIPT_ASSUMPTIONS, SCRIPT_HINT } from '@/lib/validation-format';
import { useToast } from '../layout';

export default function ScriptsPage() {
  const { assumptions, loading: assumptionsLoading, error: assumptionsError, refetch: refetchAssumptions } = useAssumptions();
  const { scripts, loading, error, generating, generate, save, remove, refetch } = useScripts();
  const { triggerToast } = useToast();

  const [picked, setPicked] = useState<string[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<{ id: string; title: string } | null>(null);

  const editorRef = useRef<HTMLDivElement>(null);

  /** Opens a script and brings its editor into view (on a phone it sits above the fold). */
  const openScript = (id: string) => {
    setOpenId(id);
    requestAnimationFrame(() => editorRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' }));
  };

  const toggle = (id: string) =>
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.length >= MAX_SCRIPT_ASSUMPTIONS ? p : [...p, id]));

  const onGenerate = async () => {
    setNotice(null);
    const out = await generate(picked);
    if (out.ok) {
      openScript(out.scriptId);
      triggerToast('Script saved. Edit it below.');
    } else {
      setNotice(out.message);
    }
  };

  const opened = scripts.find((s) => s.id === openId) ?? null;
  const atLimit = picked.length >= MAX_SCRIPT_ASSUMPTIONS;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl md:text-3xl font-display font-semibold text-sage-900 tracking-tight">Interview scripts</h1>

      <section aria-label="Generate a script" className="bg-white rounded-modal p-6 md:p-8 border border-sage-200/80 space-y-5 shadow-card max-w-4xl">
        <div>
          <h2 className="block text-xs font-semibold uppercase tracking-wider text-sage-500 mb-2">
            Generate a script for (pick up to {MAX_SCRIPT_ASSUMPTIONS})
          </h2>
          <p className="text-xs text-[#9C5B34] font-medium">Tip: {SCRIPT_HINT}</p>
        </div>

        {assumptionsError ? (
          <div className="flex items-center justify-between gap-3 bg-[#FBEAE7] border border-[#F0C9C2] rounded-card px-4 py-3">
            <span className="flex items-center gap-2 text-sm text-[#8A2E22]">
              <AlertTriangle className="w-4 h-4 shrink-0" /> {assumptionsError}
            </span>
            <button onClick={() => refetchAssumptions()} className="text-xs font-semibold text-[#8A2E22] underline cursor-pointer">
              Retry
            </button>
          </div>
        ) : assumptionsLoading && assumptions.length === 0 ? (
          <div className="flex items-center gap-2 text-sage-500 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading assumptions…
          </div>
        ) : assumptions.length === 0 ? (
          <p className="text-sm text-sage-500">
            You have no assumptions yet.{' '}
            <Link href="/validation/assumptions" className="font-semibold text-[#183B28] underline">
              Add one on the Assumptions tab
            </Link>{' '}
            to write a script for it.
          </p>
        ) : (
          <ul className="space-y-2 max-h-[320px] overflow-y-auto">
            {assumptions.map((a) => {
              const checked = picked.includes(a.id);
              return (
                <li key={a.id}>
                  <label
                    className={`flex items-start gap-3 border rounded-card px-4 py-3 text-sm cursor-pointer ${
                      checked ? 'border-[#9C5B34] bg-[#FDF4E3]' : 'border-sage-200 hover:bg-sage-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={!checked && atLimit}
                      onChange={() => toggle(a.id)}
                      className="mt-0.5"
                    />
                    <span className="text-sage-900 break-words min-w-0">{a.statement}</span>
                  </label>
                </li>
              );
            })}
          </ul>
        )}

        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <button
            type="button"
            onClick={onGenerate}
            disabled={generating || picked.length === 0}
            className="bg-[#9C5B34] hover:bg-[#8A5330] disabled:opacity-50 text-white font-semibold px-5 py-3 rounded-card text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-card whitespace-nowrap"
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Sparkles className="w-4 h-4" />}
            <span>{generating ? 'Writing your script…' : 'Generate script'}</span>
          </button>
          {atLimit && <span className="text-xs text-sage-500">That is the most a script can cover.</span>}
        </div>
        {notice && (
          <p role="alert" className="text-sm font-semibold text-[#8A2E22]">
            {notice}
          </p>
        )}
      </section>

      {opened && (
        <div ref={editorRef} className="max-w-4xl scroll-mt-40">
          <ScriptEditor key={opened.id} script={opened} onSave={(body) => save(opened.id, body)} onClose={() => setOpenId(null)} />
        </div>
      )}

      <section aria-label="Saved scripts" className="max-w-4xl space-y-3">
        <h2 className="text-sm font-bold text-sage-900">Your scripts</h2>
        {error && (
          <div className="flex items-center justify-between gap-3 bg-[#FBEAE7] border border-[#F0C9C2] rounded-card px-4 py-3">
            <span className="flex items-center gap-2 text-sm text-[#8A2E22]">
              <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
            </span>
            <button onClick={() => refetch()} className="text-xs font-semibold text-[#8A2E22] underline cursor-pointer">
              Retry
            </button>
          </div>
        )}
        {loading && scripts.length === 0 ? (
          <div className="flex items-center gap-2 text-sage-500 text-sm py-6">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading scripts…
          </div>
        ) : scripts.length === 0 ? (
          <div className="bg-white rounded-modal p-8 border border-dashed border-sage-200 text-center">
            <p className="text-sm text-sage-500">No scripts yet. Pick an assumption above and generate one.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {scripts.map((s) => (
              <li
                key={s.id}
                className={`bg-white rounded-modal p-4 border shadow-card flex items-center justify-between gap-3 ${
                  s.id === openId ? 'border-[#9C5B34]' : 'border-sage-200/80'
                }`}
              >
                <button type="button" onClick={() => openScript(s.id)} className="text-left min-w-0 flex-1 cursor-pointer">
                  <span className="block font-bold text-sm text-sage-900 truncate">{s.title}</span>
                  <span className="block text-xs text-sage-500">
                    {s.questions.length} {s.questions.length === 1 ? 'question' : 'questions'}
                    {s.created_at ? ` · ${new Date(s.created_at).toLocaleDateString()}` : ''}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setToDelete({ id: s.id, title: s.title })}
                  aria-label={`Delete script ${s.title}`}
                  className="p-1.5 rounded-input text-sage-400 hover:text-[#B0483B] hover:bg-sage-100 cursor-pointer shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {toDelete && (
        <ConfirmDelete
          title={`Delete the script "${toDelete.title}"?`}
          warning="This removes the script and its questions. It cannot be undone."
          onConfirm={async () => {
            await remove(toDelete.id);
            if (openId === toDelete.id) setOpenId(null);
            triggerToast('Script deleted');
          }}
          onClose={() => setToDelete(null)}
        />
      )}
    </div>
  );
}
