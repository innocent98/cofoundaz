'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Check, Loader2, AlertTriangle } from 'lucide-react';
import { ApiError } from '@/lib/api/client';
import BrandLogo from '@/components/brand/BrandLogo';
import {
  getPublicSurvey,
  submitSurveyResponse,
  type PublicSurvey,
  type SurveyQuestion,
} from '@/lib/api/validation';

type AnswerValue = string | number;

export default function PublicSurveyPage() {
  const params = useParams<{ token: string }>();
  const token = params?.token as string;

  const [survey, setSurvey] = useState<PublicSurvey | null>(null);
  const [loading, setLoading] = useState(true);
  const [notAvailable, setNotAvailable] = useState(false);
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const s = await getPublicSurvey(token);
        if (active) setSurvey(s);
      } catch (err) {
        // Unknown token / draft / closed all return the same 404 — don't distinguish.
        if (active) setNotAvailable(true);
        if (!(err instanceof ApiError && err.status === 404)) {
          console.warn('Survey load error:', err);
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [token]);

  const setAnswer = useCallback((qid: string, value: AnswerValue) => {
    setAnswers((prev) => ({ ...prev, [qid]: value }));
  }, []);

  const handleSubmit = () => {
    if (!survey || submitting) return;
    setError(null);
    // Required-question check (client side; the server re-checks).
    const missing = survey.questions.find(
      (q) => q.required && (answers[q.id!] === undefined || answers[q.id!] === '')
    );
    if (missing) {
      setError('Please answer all required questions.');
      return;
    }
    setSubmitting(true);
    submitSurveyResponse(token, answers)
      .then(() => setDone(true))
      .catch((err) => {
        if (err instanceof ApiError && err.status === 429) {
          setError('Too many submissions right now. Please wait a moment and try again.');
        } else if (err instanceof ApiError && err.status === 404) {
          setNotAvailable(true);
        } else if (err instanceof ApiError) {
          const d = err.data as { error?: { message?: string; field_errors?: Record<string, string> } } | undefined;
          const fe = d?.error?.field_errors;
          setError(fe && Object.keys(fe).length ? Object.values(fe)[0] : d?.error?.message || 'Could not submit your answers.');
        } else {
          setError('Could not submit your answers. Please try again.');
        }
      })
      .finally(() => setSubmitting(false));
  };

  return (
    <div className="min-h-[100dvh] bg-neutral-100 flex flex-col items-center px-4 py-10 md:py-16">
      {/* Brand */}
      <div className="flex items-center gap-2.5 mb-8">
        <BrandLogo height={28} eager />
      </div>

      <div className="w-full max-w-xl">
        {loading ? (
          <div className="flex items-center justify-center gap-2 text-neutral-500 py-20">
            <Loader2 className="w-5 h-5 animate-spin" /> <span className="text-sm">Loading…</span>
          </div>
        ) : notAvailable ? (
          <div className="bg-white rounded-modal p-8 border border-neutral-200/70 shadow-card text-center">
            <div className="w-14 h-14 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6 text-accent-700" />
            </div>
            <h1 className="text-lg font-bold text-ink-deep">This survey isn’t available</h1>
            <p className="text-sm text-neutral-500 mt-1.5">The link may be wrong, or the survey isn’t open for responses right now.</p>
          </div>
        ) : done ? (
          <div className="bg-white rounded-modal p-8 border border-neutral-200/70 shadow-card text-center">
            <div className="w-14 h-14 bg-neutral-xe6efea rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-7 h-7 text-brand-700" />
            </div>
            <h1 className="text-xl font-display font-bold text-ink-deep">Thank you</h1>
            <p className="text-sm text-neutral-500 mt-1.5">Your answers have been recorded.</p>
          </div>
        ) : survey ? (
          <div className="space-y-5">
            <div className="bg-white rounded-modal p-6 border border-neutral-200/70 shadow-card">
              <h1 className="text-xl md:text-2xl font-display font-bold text-ink-deep">{survey.title}</h1>
              <p className="text-xs text-neutral-500 mt-1">Your answers are anonymous.</p>
            </div>

            {survey.questions.map((q, i) => (
              <QuestionField key={q.id ?? i} q={q} index={i} value={answers[q.id!]} onChange={(v) => setAnswer(q.id!, v)} />
            ))}

            {error && (
              <p className="flex items-center gap-1.5 text-sm font-semibold text-danger-600">
                <AlertTriangle className="w-4 h-4" /> {error}
              </p>
            )}

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full bg-accent-600 hover:bg-accent-700 text-white font-semibold py-3.5 rounded-card text-sm transition-all shadow-card disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {submitting ? 'Submitting…' : 'Submit'}
            </button>
            <p className="text-center text-[11px] text-neutral-400 pb-6">Powered by Cofoundaz</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function QuestionField({
  q,
  index,
  value,
  onChange,
}: {
  q: SurveyQuestion;
  index: number;
  value: string | number | undefined;
  onChange: (v: string | number) => void;
}) {
  return (
    <div className="bg-white rounded-modal p-6 border border-neutral-200/70 shadow-card space-y-3">
      <h2 className="text-sm md:text-base font-semibold text-ink-deep">
        {index + 1}. {q.prompt}
        {q.required && <span className="text-danger-600 ml-1">*</span>}
      </h2>

      {q.type === 'choice' && (
        <div className="space-y-2">
          {(q.options ?? []).map((opt) => (
            <label
              key={opt}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-card border cursor-pointer transition-colors ${
                value === opt ? 'border-brand-hover bg-neutral-xf3f7f4' : 'border-neutral-200 hover:bg-neutral-50'
              }`}
            >
              <input type="radio" name={q.id} checked={value === opt} onChange={() => onChange(opt)} className="accent-brand-hover" />
              <span className="text-sm text-neutral-800">{opt}</span>
            </label>
          ))}
        </div>
      )}

      {(q.type === 'scale' || q.type === 'nps') && (
        <div className="flex flex-wrap gap-2">
          {Array.from(
            { length: q.type === 'scale' ? 5 : 11 },
            (_, i) => (q.type === 'scale' ? i + 1 : i)
          ).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              className={`w-10 h-10 rounded-card border text-sm font-semibold transition-colors cursor-pointer ${
                value === n ? 'bg-brand-hover text-white border-brand-hover' : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      )}

      {q.type === 'open' && (
        <textarea
          rows={3}
          maxLength={4000}
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Your answer…"
          className="w-full bg-white border border-neutral-200 rounded-card px-4 py-2.5 text-sm text-neutral-900 focus:outline-none focus:border-brand-hover resize-none"
        />
      )}
    </div>
  );
}
