'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  useContentGapHistory,
  useKeywords,
  usePositioning,
  useTrackedPages,
} from '@/hooks/useMarketingApi';
import { useMarketingGeneration } from '@/hooks/useMarketingGeneration';
import {
  CHECKLIST_KEYS,
  fieldErrorsOf,
  getContentGap,
  marketingErrorMessage,
  startContentGaps,
  type ChecklistKey,
  type Keyword,
  type PositioningInput,
} from '@/lib/api/marketing';
import {
  BTN_ACCENT,
  BTN_DANGER,
  BTN_PRIMARY,
  BTN_SECONDARY,
  CARD,
  DataGate,
  EmptyState,
  GenerationNote,
  INPUT,
  LABEL,
} from '@/components/marketing-hub/states';
import { Drawer, Field } from '@/components/marketing-hub/drawer';
import { useWorkspace } from '@/components/workspace-context';
import { useToast } from '../ToastContext';

const CHECKLIST_LABEL: Record<ChecklistKey, string> = {
  title_tag: 'Title tag',
  meta_description: 'Meta description',
  h1: 'One clear H1',
  keyword_in_intro: 'Keyword in the intro',
  image_alt: 'Image alt text',
  internal_links: 'Internal links',
  url_slug: 'Clean URL slug',
  mobile_friendly: 'Mobile friendly',
};

interface KwForm {
  id: string | null;
  keyword: string;
  volume: string;
  difficulty: string;
  rank: string;
  targetPage: string;
}

const blankKw = (): KwForm => ({ id: null, keyword: '', volume: '', difficulty: '', rank: '', targetPage: '' });
const kwFrom = (k: Keyword): KwForm => ({
  id: k.id,
  keyword: k.keyword,
  volume: k.volume ?? '',
  difficulty: k.difficulty === null ? '' : String(k.difficulty),
  rank: k.current_rank === null ? '' : String(k.current_rank),
  targetPage: k.target_page ?? '',
});

const intOrNull = (v: string): number | null => (v.trim() === '' ? null : Number(v));

// ------------------------------------------------------------------ keywords

function KeywordsSection() {
  const { keywords, status, error, reload, create, update, remove } = useKeywords();
  const { triggerToast, runAction } = useToast();
  const [search, setSearch] = useState('');
  const [form, setForm] = useState<KwForm | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const filtered = keywords.filter((k) => k.keyword.toLowerCase().includes(search.toLowerCase()));

  const save = async () => {
    if (!form) return;
    if (!form.keyword.trim()) {
      setErrors({ keyword: 'Enter a keyword.' });
      return;
    }
    const difficulty = intOrNull(form.difficulty);
    const rank = intOrNull(form.rank);
    if (difficulty !== null && (!Number.isInteger(difficulty) || difficulty < 0 || difficulty > 100)) {
      setErrors({ difficulty: 'Difficulty is a whole number from 0 to 100.' });
      return;
    }
    if (rank !== null && (!Number.isInteger(rank) || rank < 0)) {
      setErrors({ current_rank: 'Rank is a whole number, zero or more.' });
      return;
    }
    const body = {
      keyword: form.keyword.trim(),
      volume: form.volume.trim() || null,
      difficulty,
      current_rank: rank,
      target_page: form.targetPage.trim() || null,
    };
    setSaving(true);
    setErrors({});
    try {
      if (form.id) await update(form.id, body);
      else await create(body);
      triggerToast(form.id ? 'Keyword updated.' : 'Keyword added.');
      setForm(null);
    } catch (err) {
      setErrors(fieldErrorsOf(err));
      triggerToast(marketingErrorMessage(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section aria-label="Keyword tracker" className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display font-semibold text-xl text-neutral-900">Keywords</h2>
        <button type="button" onClick={() => { setErrors({}); setForm(blankKw()); }} className={BTN_ACCENT}>+ Add keyword</button>
      </div>
      <DataGate status={status} error={error} onRetry={reload} loadingLabel="Loading your keywords">
        {keywords.length === 0 ? (
          <EmptyState
            title="No keywords tracked yet"
            body="Add the search terms you want to rank for. Volume, difficulty and rank are entered by you, so they are only as fresh as your last update."
            cta={<button type="button" onClick={() => { setErrors({}); setForm(blankKw()); }} className={BTN_ACCENT}>+ Add your first keyword</button>}
          />
        ) : (
          <div className={`${CARD} overflow-hidden flex flex-col`}>
            <div className="p-4 border-b border-neutral-200 bg-neutral-50/50 flex justify-end">
              <input
                type="text"
                aria-label="Search keywords"
                placeholder="Search keywords..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="text-sm px-3 py-1.5 border border-neutral-300 rounded focus:outline-none focus:border-neutral-500 w-64"
              />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-neutral-200 bg-neutral-50/50 text-[11px] font-bold text-neutral-600 uppercase tracking-wider">
                    <th className="py-3.5 px-6">Keyword</th>
                    <th className="py-3.5 px-6">Volume (est.)</th>
                    <th className="py-3.5 px-6">Difficulty</th>
                    <th className="py-3.5 px-6">Rank</th>
                    <th className="py-3.5 px-6">Target page</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 text-sm">
                  {filtered.length === 0 && (
                    <tr><td colSpan={6} className="py-6 px-6 text-neutral-500">No keywords match your search.</td></tr>
                  )}
                  {filtered.map((item) => {
                    let diffColor = 'text-neutral-600';
                    if (item.difficulty !== null && item.difficulty < 30) diffColor = 'text-brand-600';
                    if (item.difficulty !== null && item.difficulty > 60) diffColor = 'text-danger-600';
                    return (
                      <tr key={item.id} className="hover:bg-neutral-50/50 transition-colors">
                        <td className="py-4 px-6 font-semibold text-neutral-900">
                          {item.keyword}
                          <p className="text-[11px] font-normal text-neutral-500">
                            {item.metrics_updated_at
                              ? `Estimated by you, updated ${new Date(item.metrics_updated_at).toLocaleDateString()}`
                              : 'No numbers entered yet'}
                          </p>
                        </td>
                        <td className="py-4 px-6 text-neutral-600">{item.volume ?? '-'}</td>
                        <td className={`py-4 px-6 font-medium ${diffColor}`}>{item.difficulty ?? '-'}</td>
                        <td className="py-4 px-6 font-bold text-brand-700">{item.current_rank ?? '-'}</td>
                        <td className="py-4 px-6 text-neutral-600">{item.target_page ?? '-'}</td>
                        <td className="py-4 px-6">
                          <div className="flex justify-end gap-2">
                            <button type="button" onClick={() => { setErrors({}); setForm(kwFrom(item)); }} className={BTN_SECONDARY}>Edit</button>
                            {confirmId === item.id ? (
                              <>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    const r = await runAction(() => remove(item.id), 'Keyword deleted.');
                                    if (r.ok) setConfirmId(null);
                                  }}
                                  className={BTN_DANGER}
                                >
                                  Confirm
                                </button>
                                <button type="button" onClick={() => setConfirmId(null)} className={BTN_SECONDARY}>Keep</button>
                              </>
                            ) : (
                              <button type="button" onClick={() => setConfirmId(item.id)} className={BTN_DANGER}>Delete</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </DataGate>

      {form && (
        <Drawer
          title={form.id ? 'Edit keyword' : 'Add keyword'}
          onClose={() => setForm(null)}
          footer={
            <>
              <button type="button" onClick={() => setForm(null)} className={`${BTN_SECONDARY} flex-1`}>Cancel</button>
              <button type="button" onClick={save} disabled={saving} className={`${BTN_PRIMARY} flex-1`}>{saving ? 'Saving...' : 'Save keyword'}</button>
            </>
          }
        >
          <Field label="Keyword" htmlFor="kw-keyword" error={errors.keyword}>
            <input id="kw-keyword" className={INPUT} maxLength={200} value={form.keyword} onChange={(e) => setForm({ ...form, keyword: e.target.value })} />
          </Field>
          <Field label="Monthly volume" htmlFor="kw-volume" error={errors.volume} hint='Free text, for example "2.4K".'>
            <input id="kw-volume" className={INPUT} maxLength={20} value={form.volume} onChange={(e) => setForm({ ...form, volume: e.target.value })} />
          </Field>
          <Field label="Difficulty (0 to 100)" htmlFor="kw-diff" error={errors.difficulty}>
            <input id="kw-diff" type="number" min={0} max={100} className={INPUT} value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })} />
          </Field>
          <Field label="Current rank" htmlFor="kw-rank" error={errors.current_rank}>
            <input id="kw-rank" type="number" min={0} className={INPUT} value={form.rank} onChange={(e) => setForm({ ...form, rank: e.target.value })} />
          </Field>
          <Field label="Target page" htmlFor="kw-page" error={errors.target_page}>
            <input id="kw-page" className={INPUT} maxLength={500} placeholder="/pricing" value={form.targetPage} onChange={(e) => setForm({ ...form, targetPage: e.target.value })} />
          </Field>
        </Drawer>
      )}
    </section>
  );
}

// ------------------------------------------------------------------ tracked pages

function PagesSection() {
  const { pages, status, error, reload, create, toggle, remove } = useTrackedPages();
  const { triggerToast, runAction } = useToast();
  const [url, setUrl] = useState('');
  const [urlError, setUrlError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      setUrlError('Enter a page URL or path.');
      return;
    }
    setAdding(true);
    setUrlError(null);
    try {
      await create(url.trim());
      triggerToast('Page added to your SEO checklist.');
      setUrl('');
    } catch (err) {
      const msg = fieldErrorsOf(err).url ?? marketingErrorMessage(err);
      setUrlError(msg);
      triggerToast(msg, 'error');
    } finally {
      setAdding(false);
    }
  };

  return (
    <section aria-label="On-page checklist" className="space-y-3">
      <h2 className="font-display font-semibold text-xl text-neutral-900">On-page checklist</h2>
      <form onSubmit={add} className={`${CARD} p-4 flex flex-wrap items-start gap-3`}>
        <div className="flex-1 min-w-[14rem] space-y-1">
          <label htmlFor="page-url" className="sr-only">Page URL</label>
          <input id="page-url" className={INPUT} maxLength={500} placeholder="/pricing" value={url} onChange={(e) => { setUrl(e.target.value); setUrlError(null); }} />
          {urlError && <p role="alert" className="text-xs text-danger-700">{urlError}</p>}
        </div>
        <button type="submit" disabled={adding} className={BTN_PRIMARY}>{adding ? 'Adding...' : 'Track page'}</button>
      </form>
      <DataGate status={status} error={error} onRetry={reload} loadingLabel="Loading your pages">
        {pages.length === 0 ? (
          <EmptyState title="No pages tracked yet" body="Add a page path above to audit it against eight on-page SEO checks." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pages.map((p) => (
              <div key={p.id} className={`${CARD} p-5 space-y-3`}>
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-semibold text-neutral-900 truncate">{p.url}</h3>
                  <span className="text-xs font-semibold text-neutral-600 tabular-nums">{p.completed}/{p.total}</span>
                </div>
                <div className="h-2 rounded-full bg-neutral-100 overflow-hidden" role="progressbar" aria-valuenow={p.completed} aria-valuemin={0} aria-valuemax={p.total} aria-label={`${p.url} checklist progress`}>
                  <div className="h-full bg-brand-hover" style={{ width: `${(p.completed / p.total) * 100}%` }} />
                </div>
                <ul className="grid grid-cols-1 gap-1.5">
                  {CHECKLIST_KEYS.map((k) => (
                    <li key={k}>
                      <label className="flex items-center gap-2 text-sm text-neutral-800 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={p.checklist[k]}
                          onChange={(e) => void runAction(() => toggle(p.id, k, e.target.checked))}
                        />
                        {CHECKLIST_LABEL[k]}
                      </label>
                    </li>
                  ))}
                </ul>
                <div className="flex justify-end gap-2">
                  {confirmId === p.id ? (
                    <>
                      <button
                        type="button"
                        onClick={async () => {
                          const r = await runAction(() => remove(p.id), 'Page removed.');
                          if (r.ok) setConfirmId(null);
                        }}
                        className={BTN_DANGER}
                      >
                        Confirm remove
                      </button>
                      <button type="button" onClick={() => setConfirmId(null)} className={BTN_SECONDARY}>Keep</button>
                    </>
                  ) : (
                    <button type="button" onClick={() => setConfirmId(p.id)} className={BTN_DANGER}>Remove</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </DataGate>
    </section>
  );
}

// ------------------------------------------------------------------ positioning

const POSITIONING_FIELDS: { key: keyof PositioningInput; label: string; placeholder: string }[] = [
  { key: 'audience', label: 'For (audience)', placeholder: 'freelancers in Lagos' },
  { key: 'need', label: 'Who (need)', placeholder: 'want to save without thinking about it' },
  { key: 'product', label: 'Product', placeholder: 'Your product name' },
  { key: 'category', label: 'Is the (category)', placeholder: 'savings app' },
  { key: 'differentiator', label: 'That (differentiator)', placeholder: 'rounds up every payment automatically' },
];

function PositioningSection() {
  const { positioning, status, error, reload, save } = usePositioning();
  const { workspaceName } = useWorkspace();
  const { triggerToast } = useToast();
  const [form, setForm] = useState<PositioningInput | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Seed the editable form once, from the server's saved values.
  useEffect(() => {
    if (positioning && form === null) {
      queueMicrotask(() =>
        setForm({
          audience: positioning.audience,
          need: positioning.need,
          // An empty Product starts as the workspace name; it is only saved when the founder saves.
          product: positioning.product ?? workspaceName,
          category: positioning.category,
          differentiator: positioning.differentiator,
        })
      );
    }
  }, [positioning, form, workspaceName]);

  const filled = form ? POSITIONING_FIELDS.filter((f) => (form[f.key] ?? '').trim() !== '').length : 0;

  const onSave = async () => {
    if (!form) return;
    setSaving(true);
    setErrors({});
    try {
      // PUT is full-replace: always send all five parts.
      await save({
        audience: form.audience?.trim() || null,
        need: form.need?.trim() || null,
        product: form.product?.trim() || null,
        category: form.category?.trim() || null,
        differentiator: form.differentiator?.trim() || null,
      });
      triggerToast('Positioning saved.');
    } catch (err) {
      setErrors(fieldErrorsOf(err));
      triggerToast(marketingErrorMessage(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section aria-label="Brand positioning" className="space-y-3">
      <h2 className="font-display font-semibold text-xl text-neutral-900">Brand positioning statement</h2>
      <DataGate status={status} error={error} onRetry={reload} loadingLabel="Loading your positioning">
        {form && (
          <div className={`${CARD} p-6 md:p-8 space-y-5`}>
            {positioning?.statement ? (
              <p className="text-sm md:text-base text-neutral-800 leading-relaxed" data-testid="positioning-statement">
                {positioning.statement}
              </p>
            ) : (
              <p className="text-sm text-neutral-500">Fill in the five parts below to build your statement.</p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {POSITIONING_FIELDS.map((f) => (
                <Field key={f.key} label={f.label} htmlFor={`pos-${f.key}`} error={errors[f.key]}>
                  <input
                    id={`pos-${f.key}`}
                    className={INPUT}
                    maxLength={300}
                    placeholder={f.placeholder}
                    value={form[f.key] ?? ''}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  />
                </Field>
              ))}
            </div>
            {filled > 0 && filled < 5 && (
              <p className="text-xs text-neutral-500">Fill in all five parts for a complete statement. {filled} of 5 done.</p>
            )}
            <button type="button" onClick={onSave} disabled={saving} className={BTN_PRIMARY}>
              {saving ? 'Saving...' : 'Save positioning'}
            </button>
          </div>
        )}
      </DataGate>
    </section>
  );
}

// ------------------------------------------------------------------ content gaps

function ContentGapsSection() {
  const history = useContentGapHistory();
  const gen = useMarketingGeneration(startContentGaps, getContentGap);
  const { triggerToast } = useToast();

  const latest = history.history.find((g) => g.status === 'ready' && (g.output.gaps?.length ?? 0) > 0) ?? null;
  const gaps = latest?.output.gaps ?? [];
  // Only the newest ready run says whether the brand details moved on; older runs and other kinds are ignored.
  const newestReady = history.history.find((g) => g.status === 'ready');
  const stale = newestReady?.stale === true;

  const find = async () => {
    const g = await gen.run();
    if (g) {
      history.reload();
      triggerToast((g.output.gaps?.length ?? 0) > 0 ? 'Content ideas ready.' : 'The AI found no new gaps this time.');
    }
  };

  return (
    <section aria-label="Content gaps" className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display font-semibold text-xl text-neutral-900">Content gaps</h2>
          <p className="text-xs text-neutral-500">Topics you have not covered yet, based on your tracked keywords.</p>
        </div>
        <button type="button" onClick={find} disabled={gen.busy} className={BTN_ACCENT}>
          {gen.busy ? 'Looking for gaps...' : '✦ Find content ideas'}
        </button>
      </div>
      <GenerationNote phase={gen.phase} error={gen.error} generatingLabel="The AI is looking for topics you have not covered. This usually takes under a minute." />
      {stale && gen.phase !== 'generating' && (
        <div role="status" className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-accent-xe6d3b3 bg-accent-xf6efe0 p-3.5 text-sm text-accent-x5b3b17">
          <p>Your brand details changed since these ideas were written.</p>
          <button type="button" onClick={find} disabled={gen.busy} className={BTN_SECONDARY}>Regenerate</button>
        </div>
      )}
      {history.status === 'ready' && gaps.length === 0 && gen.phase !== 'generating' && (
        <EmptyState title="No content ideas yet" body="Track a few keywords, then ask the AI which topics are missing from your content." />
      )}
      {gaps.length > 0 && (
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {gaps.map((g, i) => (
            <li key={`${g.title}-${i}`} className={`${CARD} p-5 space-y-2`}>
              <h3 className="font-semibold text-neutral-900">{g.title}</h3>
              <p className="text-xs"><span className={LABEL}>Target keyword </span><span className="text-neutral-800 font-medium">{g.target_keyword}</span></p>
              <p className="text-sm text-neutral-700">{g.angle}</p>
              <Link
                href={`/marketing/copy?message=${encodeURIComponent(`${g.title}. ${g.angle} (keyword: ${g.target_keyword})`)}`}
                className="inline-block text-sm font-semibold text-brand-rail-deep hover:underline"
              >
                Write it
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function MarketingSeoPage() {
  return (
    <div className="space-y-10 animate-fadeIn">
      <h1 className="text-3xl md:text-4xl font-display font-semibold text-neutral-900 tracking-tight">SEO tools</h1>
      <KeywordsSection />
      <ContentGapsSection />
      <PagesSection />
      <PositioningSection />
    </div>
  );
}
