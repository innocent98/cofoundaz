'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, AlertTriangle, Plus, X, Copy, Check, Link2, Trash2 } from 'lucide-react';
import { useSurveys, Survey, SurveyQuestion, SurveyAnalytics } from '@/hooks/useSurveys';
import type { QuestionType } from '@/lib/api/validation';
import { useToast } from '../layout';
import { InsightSynthesizer } from '../components/InsightSynthesizer';
import { ConfirmDelete } from '@/components/validation/ConfirmDelete';
import { deleteWarning } from '@/lib/validation-format';

const STATUS_BADGE: Record<string, string> = {
  open: 'bg-green-100 text-green-800',
  draft: 'bg-sage-100 text-sage-700',
  closed: 'bg-copper-100 text-copper-800',
};

interface DraftQuestion {
  type: QuestionType;
  prompt: string;
  required: boolean;
  options: string[];
}

const blankQuestion = (): DraftQuestion => ({ type: 'choice', prompt: '', required: true, options: ['', ''] });

export default function SurveysPage() {
  const { surveys, loading, error, refetch, create, setStatus, remove, getAnalytics, errMsg } = useSurveys();
  const [toDelete, setToDelete] = useState<Survey | null>(null);
  const { triggerToast } = useToast();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<SurveyAnalytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  // One-time share link captured when a survey is first opened.
  const [linkFor, setLinkFor] = useState<{ id: string; url: string } | null>(null);
  const [copied, setCopied] = useState(false);

  // Builder state
  const [title, setTitle] = useState('');
  const [questions, setQuestions] = useState<DraftQuestion[]>([blankQuestion()]);
  const [creating, setCreating] = useState(false);
  const [builderError, setBuilderError] = useState<string | null>(null);

  const selected = surveys.find((s) => s.id === selectedId) ?? null;

  // Select the first survey once loaded.
  useEffect(() => {
    if (!selectedId && surveys.length > 0) {
      const first = surveys[0].id;
      queueMicrotask(() => setSelectedId(first));
    }
  }, [surveys, selectedId]);

  const loadAnalytics = useCallback(
    async (id: string) => {
      setAnalyticsLoading(true);
      try {
        setAnalytics(await getAnalytics(id));
      } catch {
        setAnalytics(null);
      } finally {
        setAnalyticsLoading(false);
      }
    },
    [getAnalytics]
  );

  useEffect(() => {
    queueMicrotask(() => {
      if (selectedId) void loadAnalytics(selectedId);
      else setAnalytics(null);
    });
  }, [selectedId, loadAnalytics]);

  const handleCreate = () => {
    setBuilderError(null);
    const t = title.trim();
    if (!t) return setBuilderError('Give the survey a title.');
    const cleaned: SurveyQuestion[] = [];
    for (const q of questions) {
      const prompt = q.prompt.trim();
      if (!prompt) return setBuilderError('Every question needs a prompt.');
      if (q.type === 'choice') {
        const opts = q.options.map((o) => o.trim()).filter(Boolean);
        if (opts.length < 2) return setBuilderError('Choice questions need at least two options.');
        cleaned.push({ type: 'choice', prompt, required: q.required, options: opts });
      } else {
        cleaned.push({ type: q.type, prompt, required: q.required });
      }
    }
    if (cleaned.length === 0) return setBuilderError('Add at least one question.');
    setCreating(true);
    create(t, cleaned)
      .then((s) => {
        setShowCreate(false);
        setTitle('');
        setQuestions([blankQuestion()]);
        setSelectedId(s.id);
        triggerToast('Survey created (draft). Open it to get a share link.');
      })
      .catch((e) => setBuilderError(errMsg(e)))
      .finally(() => setCreating(false));
  };

  const handleOpen = (s: Survey) => {
    setBusyId(s.id);
    setStatus(s.id, 'open')
      .then((token) => {
        if (token) {
          const url = `${window.location.origin}/s/${token}`;
          setLinkFor({ id: s.id, url });
          triggerToast('Survey opened. Share link is ready.');
        } else {
          triggerToast('Survey re-opened. (The share link is only shown once, at first open.)');
        }
      })
      .catch((e) => triggerToast(errMsg(e)))
      .finally(() => setBusyId(null));
  };

  const handleStop = (s: Survey) => {
    setBusyId(s.id);
    setStatus(s.id, 'closed')
      .then(() => triggerToast('Collection stopped.'))
      .catch((e) => triggerToast(errMsg(e)))
      .finally(() => setBusyId(null));
  };

  const copyLink = (url: string) => {
    navigator.clipboard?.writeText(url).then(
      () => {
        setCopied(true);
        triggerToast('Share link copied.');
        setTimeout(() => setCopied(false), 2500);
      },
      () => triggerToast('Could not copy. Select and copy it manually.')
    );
  };

  const addQuestion = () => setQuestions((q) => [...q, blankQuestion()]);
  const removeQuestion = (i: number) => setQuestions((q) => q.filter((_, idx) => idx !== i));
  const patchQuestion = (i: number, patch: Partial<DraftQuestion>) =>
    setQuestions((q) => q.map((item, idx) => (idx === i ? { ...item, ...patch } : item)));

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-display font-semibold text-sage-900 tracking-tight">Surveys</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 bg-[#183B28] hover:bg-[#11291C] text-white font-semibold px-4 py-2.5 rounded-card text-xs md:text-sm transition-all shadow-card cursor-pointer"
          >
            <Plus className="w-4 h-4" /> New survey
          </button>
          <InsightSynthesizer />
        </div>
      </div>

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

      {loading && surveys.length === 0 ? (
        <div className="flex items-center justify-center gap-2 text-sage-500 py-16">
          <Loader2 className="w-5 h-5 animate-spin" /> <span className="text-sm">Loading surveys…</span>
        </div>
      ) : surveys.length === 0 ? (
        <div className="bg-white rounded-modal p-10 border border-dashed border-sage-200 text-center">
          <p className="text-sm text-sage-500">No surveys yet. Create one, open it to get a shareable link, then watch the results here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* List */}
          <div className="lg:col-span-5 space-y-3">
            {surveys.map((s) => (
              <div
                key={s.id}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedId(s.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedId(s.id);
                  }
                }}
                className={`w-full text-left bg-white rounded-modal p-5 border shadow-card transition-all cursor-pointer ${
                  s.id === selectedId ? 'border-[#1e4836]' : 'border-sage-200/80 hover:border-sage-300'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-bold text-sage-900 text-base truncate">{s.title}</h3>
                  <span className={`shrink-0 text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${STATUS_BADGE[s.status] ?? STATUS_BADGE.draft}`}>
                    {s.status[0].toUpperCase() + s.status.slice(1)}
                  </span>
                </div>
                <p className="text-xs text-sage-500 mt-1">
                  {s.questions.length} question{s.questions.length === 1 ? '' : 's'} · {s.response_count} response
                  {s.response_count === 1 ? '' : 's'}
                </p>

                {/* Actions + one-time link */}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {s.status === 'draft' && (
                    <span
                      onClick={(e) => { e.stopPropagation(); if (busyId !== s.id) handleOpen(s); }}
                      className="inline-flex items-center gap-1.5 bg-[#9C5B34] hover:bg-[#8A5330] text-white font-semibold px-3 py-1.5 rounded-input text-xs cursor-pointer"
                    >
                      {busyId === s.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Link2 className="w-3 h-3" />} Open &amp; get link
                    </span>
                  )}
                  {s.status === 'open' && (
                    <span
                      onClick={(e) => { e.stopPropagation(); if (busyId !== s.id) handleStop(s); }}
                      className="inline-flex items-center gap-1.5 bg-white border border-sage-300 text-sage-700 font-semibold px-3 py-1.5 rounded-input text-xs hover:bg-sage-50 cursor-pointer"
                    >
                      {busyId === s.id ? <Loader2 className="w-3 h-3 animate-spin" /> : null} Stop collecting
                    </span>
                  )}
                  {s.status === 'closed' && (
                    <span
                      onClick={(e) => { e.stopPropagation(); if (busyId !== s.id) handleOpen(s); }}
                      className="inline-flex items-center gap-1.5 bg-white border border-sage-300 text-sage-700 font-semibold px-3 py-1.5 rounded-input text-xs hover:bg-sage-50 cursor-pointer"
                    >
                      Resume collecting
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setToDelete(s); }}
                    aria-label={`Delete survey ${s.title}`}
                    className="ml-auto p-1.5 rounded-input text-sage-400 hover:text-[#B0483B] hover:bg-sage-100 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {linkFor?.id === s.id && (
                  <div className="mt-3 bg-[#f5f7f5] rounded-card p-3 border border-sage-200/60" onClick={(e) => e.stopPropagation()}>
                    <span className="block text-[11px] font-semibold text-sage-400 uppercase tracking-wider mb-1">Share link (shown once)</span>
                    <div className="flex items-center gap-2">
                      <span className="block text-xs font-semibold text-[#1e4836] truncate flex-1">{linkFor.url}</span>
                      <button onClick={() => copyLink(linkFor.url)} className="flex items-center gap-1 bg-white border border-sage-200 text-sage-700 px-2.5 py-1.5 rounded-input text-xs shrink-0 cursor-pointer">
                        {copied ? <Check className="w-3 h-3 text-green-700" /> : <Copy className="w-3 h-3" />} {copied ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Analytics */}
          <div className="lg:col-span-7 bg-white rounded-modal p-6 md:p-8 border border-sage-200/80 shadow-card min-h-[200px]">
            {!selected ? (
              <p className="text-sm text-sage-500">Select a survey to see its results.</p>
            ) : analyticsLoading && !analytics ? (
              <div className="flex items-center justify-center gap-2 text-sage-500 py-10">
                <Loader2 className="w-5 h-5 animate-spin" /> <span className="text-sm">Loading results…</span>
              </div>
            ) : analytics ? (
              <div className="space-y-6">
                <div>
                  <h3 className="font-bold text-sage-900 text-base">{analytics.title}</h3>
                  <p className="text-xs text-sage-500 mt-0.5">
                    {analytics.responses} response{analytics.responses === 1 ? '' : 's'} · {analytics.completion_rate}% completion
                  </p>
                </div>
                {analytics.responses === 0 ? (
                  <p className="text-sm text-sage-500">No responses yet. Share the link to start collecting.</p>
                ) : (
                  analytics.questions.map((q) => <AnalyticsQuestion key={q.id} q={q} total={analytics.responses} />)
                )}
              </div>
            ) : (
              <p className="text-sm text-sage-500">Couldn’t load results.</p>
            )}
          </div>
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 backdrop-blur-xs p-4 md:p-8">
          <div className="bg-white rounded-modal w-full max-w-2xl shadow-raised my-4">
            <div className="flex items-center justify-between p-5 border-b border-sage-100">
              <h3 className="font-bold text-sage-900">New survey</h3>
              <button onClick={() => setShowCreate(false)} className="p-1.5 rounded-input text-sage-400 hover:bg-sage-100 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">
              <input
                type="text"
                placeholder="Survey title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-white border border-sage-200 rounded-card px-4 py-2.5 text-sm focus:outline-none focus:border-[#1e4836]"
              />
              {questions.map((q, i) => (
                <div key={i} className="border border-sage-200 rounded-card p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-sage-500">Question {i + 1}</span>
                    {questions.length > 1 && (
                      <button onClick={() => removeQuestion(i)} className="text-xs text-[#B0483B] hover:underline cursor-pointer">Remove</button>
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder="Question prompt"
                    value={q.prompt}
                    onChange={(e) => patchQuestion(i, { prompt: e.target.value })}
                    className="w-full bg-white border border-sage-200 rounded-card px-3 py-2 text-sm focus:outline-none focus:border-[#1e4836]"
                  />
                  <div className="flex flex-wrap items-center gap-3">
                    <select
                      value={q.type}
                      onChange={(e) => patchQuestion(i, { type: e.target.value as QuestionType })}
                      className="bg-white border border-sage-200 rounded-input px-3 py-1.5 text-xs cursor-pointer"
                    >
                      <option value="choice">Multiple choice</option>
                      <option value="scale">Scale (1 to 5)</option>
                      <option value="nps">NPS (0 to 10)</option>
                      <option value="open">Open text</option>
                    </select>
                    <label className="flex items-center gap-1.5 text-xs text-sage-700 cursor-pointer">
                      <input type="checkbox" checked={q.required} onChange={(e) => patchQuestion(i, { required: e.target.checked })} />
                      Required
                    </label>
                  </div>
                  {q.type === 'choice' && (
                    <div className="space-y-2">
                      {q.options.map((opt, oi) => (
                        <div key={oi} className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder={`Option ${oi + 1}`}
                            value={opt}
                            onChange={(e) => patchQuestion(i, { options: q.options.map((o, idx) => (idx === oi ? e.target.value : o)) })}
                            className="flex-1 bg-white border border-sage-200 rounded-input px-3 py-1.5 text-xs focus:outline-none focus:border-[#1e4836]"
                          />
                          {q.options.length > 2 && (
                            <button onClick={() => patchQuestion(i, { options: q.options.filter((_, idx) => idx !== oi) })} className="text-sage-400 hover:text-[#B0483B] cursor-pointer">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                      <button onClick={() => patchQuestion(i, { options: [...q.options, ''] })} className="text-xs font-semibold text-[#1e4836] hover:underline cursor-pointer">
                        + Add option
                      </button>
                    </div>
                  )}
                </div>
              ))}
              <button onClick={addQuestion} className="flex items-center gap-1.5 text-sm font-semibold text-[#1e4836] hover:underline cursor-pointer">
                <Plus className="w-4 h-4" /> Add question
              </button>
              {builderError && (
                <p className="flex items-center gap-1.5 text-xs font-semibold text-[#B0483B]">
                  <AlertTriangle className="w-3.5 h-3.5" /> {builderError}
                </p>
              )}
            </div>
            <div className="flex items-center justify-end gap-3 p-5 border-t border-sage-100">
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-card text-sm font-semibold text-sage-600 hover:bg-sage-50 cursor-pointer">Cancel</button>
              <button
                onClick={handleCreate}
                disabled={creating}
                className="flex items-center gap-2 bg-[#183B28] hover:bg-[#11291C] text-white font-semibold px-5 py-2 rounded-card text-sm shadow-card disabled:opacity-60 cursor-pointer"
              >
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Create survey
              </button>
            </div>
          </div>
        </div>
      )}
      {toDelete && (
        <ConfirmDelete
          title={`Delete "${toDelete.title}"?`}
          warning={deleteWarning('survey')}
          onConfirm={async () => {
            await remove(toDelete.id);
            if (selectedId === toDelete.id) setSelectedId(null);
            triggerToast('Survey deleted');
          }}
          onClose={() => setToDelete(null)}
        />
      )}
    </div>
  );
}

function AnalyticsQuestion({ q, total }: { q: SurveyAnalytics['questions'][number]; total: number }) {
  const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0);
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-sm font-bold text-sage-900">{q.prompt}</h4>
        <span className="text-[11px] text-sage-400 shrink-0">{q.answered} answered</span>
      </div>
      {q.type === 'choice' && q.counts ? (
        <div className="space-y-2">
          {Object.entries(q.counts).map(([opt, n]) => (
            <div key={opt} className="space-y-1">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-sage-800">{opt}</span>
                <span className="font-bold text-sage-900">{pct(n)}%</span>
              </div>
              <div className="w-full bg-sage-100 rounded-full h-3 overflow-hidden">
                <div className="bg-[#1e4836] h-full rounded-full" style={{ width: `${pct(n)}%` }} />
              </div>
            </div>
          ))}
        </div>
      ) : q.type === 'open' ? (
        <p className="text-xs text-sage-500 italic">Open-text answers aren’t shown here (not returned by the API in v1).</p>
      ) : (
        <div className="flex items-center gap-4">
          <div className="text-2xl font-bold text-[#1e4836]">{q.average?.toFixed(1) ?? '-'}</div>
          <span className="text-xs text-sage-500">average ({q.type === 'nps' ? '0 to 10' : '1 to 5'})</span>
        </div>
      )}
    </div>
  );
}
