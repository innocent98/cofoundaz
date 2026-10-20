'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';
import type { SurveyAnswers } from '@/lib/api/validation';

/** Open-text answers per question. Respondents are anonymous: nothing here identifies anyone. Plain text only. */
export function SurveyAnswersPanel({
  answers,
  loading,
  error,
}: {
  answers: SurveyAnswers | null;
  loading: boolean;
  error: string | null;
}) {
  if (loading && !answers) {
    return (
      <div role="status" className="flex items-center justify-center gap-2 text-sage-500 py-10">
        <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" /> <span className="text-sm">Loading answers…</span>
      </div>
    );
  }
  if (error) {
    return (
      <p role="alert" className="text-sm font-semibold text-[#8A2E22]">
        {error}
      </p>
    );
  }
  if (!answers || answers.questions.length === 0) {
    return <p className="text-sm text-sage-500">This survey has no open-text questions.</p>;
  }
  return (
    <div className="space-y-6" data-testid="survey-answers">
      {answers.questions.map((q) => (
        <section key={q.id} className="space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-sm font-bold text-sage-900 break-words">{q.prompt}</h4>
            <span className="text-[11px] text-sage-400 shrink-0">
              {q.answer_count} {q.answer_count === 1 ? 'answer' : 'answers'}
            </span>
          </div>
          {q.answers.length === 0 ? (
            <p className="text-xs text-sage-500">No answers yet.</p>
          ) : (
            <ul className="space-y-2">
              {q.answers.map((a, i) => (
                <li key={i} className="border-l-2 border-[#9FBBAA] pl-3 space-y-0.5">
                  <p className="text-sm text-sage-800 break-words whitespace-pre-wrap">{a.text}</p>
                  <p className="text-xs text-sage-400">{new Date(a.submitted_at).toLocaleString()}</p>
                </li>
              ))}
            </ul>
          )}
          {q.answer_count > q.answers.length && (
            <p className="text-xs text-sage-500">
              Showing the newest {q.answers.length} of {q.answer_count}.
            </p>
          )}
        </section>
      ))}
    </div>
  );
}
