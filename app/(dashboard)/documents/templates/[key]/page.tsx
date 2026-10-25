'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Sparkles } from 'lucide-react';
import { DisclaimerBanner } from '@/components/documents/disclaimer-banner';
import { btnPrimary, btnSecondary, inputCls, labelCls } from '@/components/documents/ui';
import { apiErrorInfo } from '@/lib/api/api-error';
import {
  SOURCE_LABEL,
  getFolders,
  getTemplate,
  instantiateTemplate,
  type FormSource,
  type TemplateDetail,
} from '@/lib/api/documents';
import { stashAiHandoff } from '@/lib/documents-ai-handoff';
import { useToast } from '../../ToastContext';

function SourceChip({ source }: { source: FormSource }) {
  const label = source ? SOURCE_LABEL[source] : undefined;
  if (!label) return null;
  return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-brand-tint text-brand-strong">{label}</span>;
}

/** Copy for a create failure (guide section 3); the API's own message is used when it sends one. */
function createError(err: unknown): { message: string; fields: Record<string, string> } {
  const info = apiErrorInfo(err, 'Could not create the document.');
  const fields: Record<string, string> = {};
  for (const f of info.fieldErrors) if (f.field.startsWith('values.')) fields[f.field.slice(7)] = f.message;
  if (info.status === 429) return { message: 'You have created a lot of documents in the last hour. Try again a little later.', fields };
  if (info.status === 403) return { message: 'Only a founder or team member can create documents.', fields };
  if (info.status === 404) return { message: 'That template no longer exists.', fields };
  return { message: info.message, fields };
}

export default function TemplateGeneratorPage() {
  const params = useParams<{ key: string }>();
  const key = params?.key as string;
  const router = useRouter();
  const { triggerToast } = useToast();

  const [tmpl, setTmpl] = useState<TemplateDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<{ notFound: boolean; message: string } | null>(null);
  const [folders, setFolders] = useState<string[]>([]);

  const [title, setTitle] = useState('');
  const [folder, setFolder] = useState('');
  const [values, setValues] = useState<Record<string, string>>({});
  const [aiOn, setAiOn] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const t = await getTemplate(key);
        if (cancelled) return;
        setTmpl(t);
        setLoadError(null);
        setValues(Object.fromEntries(t.form.fields.map((f) => [f.key, f.value])));
        // Every empty section AI can draft starts switched on; the user can turn any off.
        setAiOn(Object.fromEntries(t.form.sections.filter((s) => s.state === 'empty' && s.ai_draftable).map((s) => [s.key, true])));
      } catch (err) {
        if (cancelled) return;
        const info = apiErrorInfo(err, 'Could not load this template.');
        setLoadError({ notFound: info.status === 404, message: info.message });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [key, attempt]);

  useEffect(() => {
    void (async () => {
      try {
        setFolders((await getFolders()).folders.map((f) => f.path));
      } catch {
        setFolders([]);
      }
    })();
  }, []);

  const missing = useMemo(
    () => (tmpl ? tmpl.form.fields.filter((f) => f.required && !(values[f.key] ?? '').trim()) : []),
    [tmpl, values],
  );
  const draftable = tmpl ? tmpl.form.sections.filter((s) => s.state === 'empty' && s.ai_draftable) : [];
  const chosen = draftable.filter((s) => aiOn[s.key]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tmpl || missing.length > 0) return;
    setBusy(true);
    setError(null);
    setFieldErrors({});
    try {
      const body: Parameters<typeof instantiateTemplate>[1] = {};
      if (title.trim()) body.title = title.trim();
      if (folder.trim()) body.folder = folder.trim();
      // Send only what the person typed or edited; untouched defaults come from the server anyway.
      const sent: Record<string, string> = {};
      for (const f of tmpl.form.fields) if ((values[f.key] ?? '') !== f.value) sent[f.key] = values[f.key];
      if (Object.keys(sent).length > 0) body.values = sent;
      if (chosen.length > 0) {
        body.ai_draft = true;
        if (chosen.length < draftable.length) body.ai_sections = chosen.map((s) => s.key);
      }
      const res = await instantiateTemplate(key, body);
      stashAiHandoff(res.document.id, res.ai);
      triggerToast(`Created “${res.document.title}”. It is in your library${res.document.folder ? ` under ${res.document.folder}` : ''}.`);
      router.push(`/documents/${res.document.id}`);
    } catch (err) {
      const c = createError(err);
      setError(c.message);
      setFieldErrors(c.fields);
      setBusy(false);
    }
  };

  return (
    <main className="max-w-3xl w-full mx-auto px-4 md:px-6 py-8 pb-28 md:pb-8 flex flex-col gap-6">
      <Link href="/documents/templates" className="inline-flex items-center gap-1.5 min-h-11 w-fit text-sm font-semibold text-ink-muted hover:text-ink">
        <ArrowLeft className="w-4 h-4" /> Templates
      </Link>

      {loading && <div className="bg-white rounded-modal border border-line-soft shadow-card h-96 animate-pulse" aria-label="Loading template" />}

      {!loading && loadError && (
        <div role="alert" className="bg-white rounded-modal border border-line-soft shadow-card p-10 text-center text-sm text-ink-muted space-y-3">
          <p>{loadError.notFound ? 'This template doesn’t exist.' : loadError.message}</p>
          {!loadError.notFound && (
            <button type="button" className={btnSecondary} onClick={() => { setLoading(true); setAttempt((n) => n + 1); }}>
              Try again
            </button>
          )}
        </div>
      )}

      {!loading && tmpl && (
        <form onSubmit={submit} className="flex flex-col gap-6" aria-label={`Create from ${tmpl.name}`}>
          <div>
            <p className="text-[10px] font-bold text-ink-subtle uppercase tracking-wider">{tmpl.category}</p>
            <h1 className="text-3xl font-display text-ink-strong tracking-tight mb-1">{tmpl.name}</h1>
            <p className="text-xs text-neutral-x738279">{tmpl.description}</p>
          </div>

          <DisclaimerBanner text={tmpl.form.disclaimer ?? tmpl.disclaimer} />

          <div className="bg-white rounded-modal border border-line-soft shadow-card p-6 flex flex-col gap-5">
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="tg-title" className={labelCls}>Title</label>
                <input id="tg-title" className={inputCls} value={title} maxLength={200} placeholder={tmpl.name} onChange={(e) => setTitle(e.target.value)} />
                <p className="text-[11px] text-ink-subtle">Leave empty to use the template name.</p>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="tg-folder" className={labelCls}>Folder</label>
                <input id="tg-folder" className={inputCls} list="tg-folders" value={folder} placeholder="Uncategorised" onChange={(e) => setFolder(e.target.value)} />
                <datalist id="tg-folders">
                  {folders.map((f) => <option key={f} value={f} />)}
                </datalist>
              </div>
            </div>

            {tmpl.form.fields.length > 0 && (
              <div className="flex flex-col gap-5 border-t border-line pt-5">
                <h2 className="text-sm font-bold text-ink">Details for the draft</h2>
                {tmpl.form.fields.map((f) => {
                  const id = `tg-f-${f.key}`;
                  const err = fieldErrors[f.key];
                  return (
                    <div key={f.key} className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <label htmlFor={id} className={labelCls}>
                          {f.label}{f.required ? <span aria-hidden> *</span> : null}
                        </label>
                        {(values[f.key] ?? '') === f.value && <SourceChip source={f.source} />}
                      </div>
                      {f.type === 'longtext' ? (
                        <textarea id={id} rows={3} maxLength={5000} required={f.required} aria-invalid={!!err} className={`${inputCls} resize-y`} value={values[f.key] ?? ''} onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))} />
                      ) : (
                        <input id={id} type={f.type === 'date' ? 'date' : 'text'} maxLength={500} required={f.required} aria-invalid={!!err} className={inputCls} value={values[f.key] ?? ''} onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))} />
                      )}
                      {err && <p role="alert" className="text-xs font-semibold text-danger-600">{err}</p>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-white rounded-modal border border-line-soft shadow-card p-6 flex flex-col gap-4">
            <div>
              <h2 className="text-sm font-bold text-ink">What the document will contain</h2>
              <p className="text-[11px] text-ink-subtle">
                {tmpl.form.fields.length > 0
                  ? 'The clauses reuse the details above. You can edit every word after it is created.'
                  : 'We fill what we already know from your profile and Business Builder. You can edit every section after it is created.'}
              </p>
            </div>
            <ul className="flex flex-col divide-y divide-line">
              {tmpl.form.sections.map((s) => {
                const draftOn = !!aiOn[s.key];
                const canDraft = s.state === 'empty' && s.ai_draftable;
                return (
                  <li key={s.key} className="py-3 flex flex-col gap-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-xs font-bold text-ink uppercase tracking-wide">{s.heading}</p>
                      {s.state === 'filled' ? <SourceChip source={s.source} /> : <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-surface-muted text-ink-muted">Empty</span>}
                    </div>
                    {s.state === 'filled' ? (
                      tmpl.form.fields.length > 0 ? (
                        <p className="text-xs text-ink-subtle">Clause text, completed from the details above.</p>
                      ) : (
                        <p className="text-xs text-ink-muted whitespace-pre-wrap line-clamp-4">{s.value}</p>
                      )
                    ) : canDraft ? (
                      <label className="flex items-center gap-2 min-h-11 text-xs font-semibold text-accent-600 cursor-pointer w-fit">
                        <input type="checkbox" checked={draftOn} onChange={(e) => setAiOn((o) => ({ ...o, [s.key]: e.target.checked }))} />
                        <Sparkles className="w-3.5 h-3.5" aria-hidden /> Let AI draft this section
                      </label>
                    ) : (
                      <p className="text-xs text-ink-subtle">Only you know this one. Write it after the document is created.</p>
                    )}
                  </li>
                );
              })}
            </ul>
            {!tmpl.form.ai_available && <p className="text-[11px] text-ink-subtle">AI drafting is not offered for this template.</p>}
            {tmpl.form.ai_available && draftable.length === 0 && <p className="text-[11px] text-ink-subtle">Every section AI could draft is already filled.</p>}
          </div>

          {missing.length > 0 && (
            <p role="status" className="text-xs text-warning-800">
              Fill in {missing.map((f) => f.label.toLowerCase()).join(', ')} to create the document.
            </p>
          )}
          {error && <p role="alert" className="bg-danger-tint border border-danger-xfad7d7 rounded-card p-3 text-xs font-semibold text-danger-600">{error}</p>}

          <div className="flex flex-col-reverse md:flex-row gap-3 md:justify-end">
            <Link href="/documents/templates" className={btnSecondary}>Cancel</Link>
            <button type="submit" disabled={busy || missing.length > 0} className={btnPrimary}>
              {busy ? (<><Loader2 className="w-3.5 h-3.5 animate-spin" /> Creating…</>) : chosen.length > 0 ? 'Create and draft with AI' : 'Create document'}
            </button>
          </div>
        </form>
      )}
    </main>
  );
}
