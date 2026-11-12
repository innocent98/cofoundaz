"use client";

import React, { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { MessageSquare, Send, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { useWorkspace } from "@/components/workspace-context";
import { useQaSession } from "@/hooks/useQaSession";
import type { QaFocus, QaIntensity, QaRating, QaScorecard, QaSession, QaSessionSummary } from "@/lib/api/readiness";
import { FOCUS_OPTIONS, INTENSITY_OPTIONS, focusLabel, intensityLabel, qaErrorCopy } from "@/lib/readiness-format";
import { formatDay, LoadFailed, LoadingBlock, ReadOnlyNote } from "../_components/states";

const RATING_STYLE: Record<QaRating, string> = {
  needs_work: "bg-danger-50 text-danger-700 border border-danger-200",
  good: "bg-neutral-xe2ede6 text-brand-hover border border-brand-xd2e2d8",
  strong: "bg-success-50 text-success border border-success-500/40",
};

export default function MockQAPage() {
  return (
    <Suspense fallback={<LoadingBlock label="Loading mock Q&A" />}>
      <MockQAContent />
    </Suspense>
  );
}

function RatingPill({ rating, label }: { rating: QaRating; label: string | null }) {
  return <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${RATING_STYLE[rating]}`}>{label ?? rating}</span>;
}

function MockQAContent() {
  const { role } = useWorkspace();
  const canPlay = role === "founder";
  const preferred = useSearchParams().get("session");
  const q = useQaSession(canPlay, preferred);

  if (q.loading && !q.sessions) return <LoadingBlock label="Loading mock Q&A" />;
  if (q.error && !q.sessions) return <LoadFailed error={q.error} onRetry={q.reload} what="your mock sessions" />;

  const sessions = q.sessions ?? [];

  if (!canPlay) return <SummaryList sessions={sessions} />;

  const s = q.session;
  if (!s) {
    return <Setup q={q} sessions={sessions} />;
  }
  if (s.status === "active") return <Chat q={q} session={s} />;
  if (s.status === "ending") return <Scoring q={q} />;
  if (s.status === "failed") return <ScoringFailed q={q} session={s} />;
  if (s.status === "scored") return <Scorecard q={q} session={s} />;
  // abandoned (ended with no answers): nothing to show, go back to setup
  return <Setup q={q} sessions={sessions} />;
}

type Q = ReturnType<typeof useQaSession>;

function PastSessions({ sessions, onOpen }: { sessions: QaSessionSummary[]; onOpen: (id: string) => void }) {
  const shown = sessions.filter((s) => s.status === "scored" || s.status === "failed");
  if (shown.length === 0) return null;
  return (
    <div className="bg-white rounded-modal border border-neutral-200 shadow-card overflow-hidden">
      <div className="px-6 py-4 border-b border-neutral-200">
        <h3 className="font-semibold text-sm text-neutral-900">Your past sessions</h3>
      </div>
      <ul className="divide-y divide-neutral-100">
        {shown.map((s) => (
          <li key={s.id}>
            <button
              onClick={() => onOpen(s.id)}
              className="flex w-full items-center justify-between gap-3 px-6 py-3 text-left hover:bg-neutral-50"
            >
              <span className="text-sm text-neutral-800">
                <span className="font-semibold">{formatDay(s.started_at)}</span> · {focusLabel(s.focus)} · {intensityLabel(s.intensity)}
              </span>
              {s.status === "scored" && s.rating ? <RatingPill rating={s.rating} label={s.rating_label} /> : <span className="text-xs text-danger-700">Not scored</span>}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Setup({ q, sessions }: { q: Q; sessions: QaSessionSummary[] }) {
  const [focus, setFocus] = useState<QaFocus>("general");
  const [intensity, setIntensity] = useState<QaIntensity>("friendly_angel");

  return (
    <div className="space-y-6 animate-fadeIn pb-12 max-w-2xl mx-auto pt-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-display font-semibold text-neutral-900">Mock Q&A</h1>
        <p className="text-sm text-neutral-500">Practice your pitch defense before you get in the room.</p>
      </div>

      <div className="bg-white rounded-modal border border-neutral-200 shadow-card p-6 md:p-8 space-y-8">
        <div className="space-y-3">
          <span className="block text-xs font-bold uppercase tracking-wider text-neutral-500">Topic focus</span>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3" role="radiogroup" aria-label="Topic focus">
            {FOCUS_OPTIONS.map((o) => (
              <button
                key={o.value}
                role="radio"
                aria-checked={focus === o.value}
                onClick={() => setFocus(o.value)}
                className={`py-3 px-4 rounded-card text-sm font-medium border transition-colors ${
                  focus === o.value ? "bg-neutral-xe2ede6 text-brand-hover border-brand-hover" : "bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50"
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <span className="block text-xs font-bold uppercase tracking-wider text-neutral-500">Investor persona</span>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3" role="radiogroup" aria-label="Investor persona">
            {INTENSITY_OPTIONS.map((o) => (
              <button
                key={o.value}
                role="radio"
                aria-checked={intensity === o.value}
                onClick={() => setIntensity(o.value)}
                className={`py-3 px-4 rounded-card text-sm font-medium border transition-colors ${
                  intensity === o.value ? "bg-neutral-xf5efe6 text-accent-700 border-accent-700" : "bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50"
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>

        <p className="text-xs text-neutral-500">
          You answer up to 10 questions. A full session uses a large part of today&apos;s AI allowance (about 35,000 of 100,000 tokens), so plan for two a day at most.
        </p>

        {q.actionError && (
          <p role="alert" className="text-sm text-danger-700">
            {q.actionError}
          </p>
        )}

        <button
          onClick={() => void q.start(focus, intensity)}
          disabled={q.busy === "start"}
          className="w-full bg-brand-hover hover:bg-brand-x153427 disabled:opacity-60 text-white font-semibold py-3.5 px-6 rounded-card transition-colors shadow-card flex items-center justify-center gap-2"
        >
          {q.busy === "start" ? <Loader2 className="w-5 h-5 animate-spin" /> : <MessageSquare className="w-5 h-5" />}
          <span>{q.busy === "start" ? "Starting…" : "Start mock session"}</span>
        </button>
      </div>

      <PastSessions sessions={sessions} onOpen={(id) => void q.open(id)} />
    </div>
  );
}

function Chat({ q, session }: { q: Q; session: QaSession }) {
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const transcript = session.transcript ?? [];
  const sending = q.busy === "answer";

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [transcript.length, sending]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    const ok = await q.send(text);
    if (!ok) setInput(text);
  };

  return (
    <div className="h-[calc(100vh-200px)] min-h-[420px] flex flex-col max-w-3xl mx-auto bg-white rounded-modal border border-neutral-200 shadow-card overflow-hidden animate-fadeIn">
      <div className="bg-neutral-50 border-b border-neutral-200 px-4 md:px-6 py-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold text-neutral-900">{intensityLabel(session.intensity)}</h2>
          <p className="text-xs text-neutral-500">
            Focusing on {focusLabel(session.focus)} · Answer {Math.min(session.turns + 1, session.max_answers)} of {session.max_answers}
          </p>
        </div>
        <button
          onClick={() => void q.end()}
          disabled={q.busy === "end" || sending}
          className="bg-white hover:bg-neutral-100 text-neutral-800 border border-neutral-300 font-semibold py-1.5 px-4 rounded-card text-xs transition-colors shadow-card disabled:opacity-60"
        >
          {q.busy === "end" ? "Ending…" : "End session"}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6" aria-live="polite">
        {transcript.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === "founder" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] md:max-w-[80%] rounded-[20px] px-5 py-3.5 ${
                msg.role === "founder" ? "bg-brand-hover text-white rounded-br-sm" : "bg-neutral-100 text-neutral-900 rounded-bl-sm"
              }`}
            >
              <p className="text-sm whitespace-pre-wrap break-words">{msg.text}</p>
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start" role="status" aria-label="The investor is typing">
            <div className="rounded-[20px] rounded-bl-sm bg-neutral-100 px-5 py-3.5 text-sm text-neutral-500 inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> The investor is thinking…
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="p-3 md:p-4 bg-white border-t border-neutral-200 space-y-2">
        {q.actionError && (
          <p role="alert" className="text-xs text-danger-700">
            {q.actionError}
          </p>
        )}
        {q.budgetLow && (
          <div className="flex flex-wrap items-center gap-3 rounded-card border border-warning-500/40 bg-warning-50 px-3 py-2 text-xs text-neutral-800">
            <span>Today&apos;s AI allowance can&apos;t pay for another turn.</span>
            <button onClick={() => void q.end()} className="font-semibold underline">
              End and score my answers
            </button>
          </div>
        )}
        <form onSubmit={submit} className="relative">
          <label htmlFor="qa-answer" className="sr-only">
            Your answer
          </label>
          <input
            id="qa-answer"
            type="text"
            value={input}
            maxLength={2000}
            onChange={(e) => setInput(e.target.value)}
            disabled={sending}
            placeholder="Type your answer..."
            className="w-full bg-neutral-50 border border-neutral-200 rounded-full pl-5 pr-12 py-3 text-sm text-neutral-900 focus:outline-none focus:border-brand-hover transition-colors disabled:opacity-60"
          />
          <button
            type="submit"
            aria-label="Send answer"
            disabled={sending || input.trim() === ""}
            className="absolute right-2 top-1.5 bottom-1.5 w-9 bg-brand-hover text-white rounded-full flex items-center justify-center hover:bg-brand-x153427 transition-colors disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}

function Scoring({ q }: { q: Q }) {
  return (
    <div role="status" className="max-w-md mx-auto py-24 text-center space-y-3 animate-fadeIn">
      <Loader2 className="mx-auto h-8 w-8 animate-spin text-brand-hover" />
      <h2 className="text-xl font-display font-semibold text-neutral-900">Generating scorecard…</h2>
      {q.slow ? (
        <>
          <p className="text-sm text-neutral-600">This is taking longer than usual. Your answers are saved and the scorecard will be ready soon.</p>
          <button onClick={q.resumePolling} className="text-xs font-semibold underline">
            Check again
          </button>
        </>
      ) : (
        <p className="text-sm text-neutral-500">Rating each answer. This takes a few seconds.</p>
      )}
    </div>
  );
}

function ScoringFailed({ q, session }: { q: Q; session: QaSession }) {
  const retryable = !session.transcript_purged && session.error !== "transcript_gone" && session.turns > 0;
  return (
    <div role="alert" className="max-w-md mx-auto py-20 text-center space-y-4 animate-fadeIn">
      <AlertCircle className="mx-auto h-8 w-8 text-danger-600" />
      <h2 className="text-xl font-display font-semibold text-neutral-900">We couldn&apos;t score this session</h2>
      <p className="text-sm text-neutral-600">{qaErrorCopy(session.error)}</p>
      {q.actionError && <p className="text-xs text-danger-700">{q.actionError}</p>}
      <div className="flex justify-center gap-3">
        {retryable && (
          <button
            onClick={() => void q.end()}
            disabled={q.busy === "end"}
            className="rounded-card bg-brand-hover px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {q.busy === "end" ? "Trying…" : "Try scoring again"}
          </button>
        )}
        <button onClick={q.backToSetup} className="rounded-card border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-800">
          Back
        </button>
      </div>
    </div>
  );
}

function Scorecard({ q, session }: { q: Q; session: QaSession }) {
  const card = session.scorecard;
  if (!card) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-3">
        <p className="text-sm text-neutral-600">This session has no scorecard.</p>
        <button onClick={q.backToSetup} className="text-sm font-semibold underline">
          Back
        </button>
      </div>
    );
  }
  const purged = card.text_purged === true;

  return (
    <div className="space-y-6 animate-fadeIn pb-12 max-w-4xl mx-auto pt-4">
      <div className="text-center space-y-3 pb-2">
        <h1 className="text-3xl font-display font-semibold text-neutral-900">Session scorecard</h1>
        <div className="flex items-center justify-center gap-3 text-sm text-neutral-600">
          <RatingPill rating={card.rating} label={card.rating_label ?? session.rating_label} />
          <span>
            {card.average}/5 average · {focusLabel(session.focus)} · {intensityLabel(session.intensity)}
          </span>
        </div>
        <Trend card={card} />
        <p className="text-sm text-accent-700 font-medium max-w-md mx-auto italic">
          &quot;Rough edges found here are cheap. Found in the room, they&apos;re expensive.&quot;
        </p>
      </div>

      {purged && <ReadOnlyNote>The words from this session were removed after 90 days. Only the ratings are kept.</ReadOnlyNote>}

      {!purged && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <div className="bg-white rounded-modal border border-neutral-200 shadow-card p-6 space-y-4">
            <h3 className="font-semibold text-sm text-neutral-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-success" />
              Strongest answer
            </h3>
            {card.strongest ? (
              <>
                <p className="text-xs text-neutral-500">{card.strongest.question}</p>
                <div className="bg-neutral-xf0f3f0 p-4 rounded-card text-sm text-neutral-800 italic">&quot;{card.strongest.answer}&quot;</div>
                <p className="text-xs text-neutral-600 font-medium">{card.strongest.feedback}</p>
              </>
            ) : (
              <p className="text-sm text-neutral-500">No answers were rated.</p>
            )}
          </div>

          <div className="bg-white rounded-modal border border-neutral-200 shadow-card p-6 space-y-4">
            <h3 className="font-semibold text-sm text-neutral-900 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-danger-600" />
              Weakest answer
            </h3>
            {card.weakest ? (
              <>
                <p className="text-xs text-neutral-500">{card.weakest.question}</p>
                <div className="bg-danger-50/50 p-4 rounded-card text-sm text-neutral-800 italic border border-danger-100">&quot;{card.weakest.answer}&quot;</div>
                <p className="text-xs text-neutral-600 font-medium">{card.weakest.feedback}</p>
                {card.weakest.model_answer && (
                  <div className="mt-4 border-t border-neutral-100 pt-4">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 block mb-2">Model answer</span>
                    <p className="text-sm text-neutral-700">{card.weakest.model_answer}</p>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-neutral-500">No answers were rated.</p>
            )}
          </div>
        </div>
      )}

      <div className="bg-white rounded-modal border border-neutral-200 shadow-card p-6 space-y-3">
        <h3 className="font-semibold text-sm text-neutral-900">Every answer</h3>
        <ol className="space-y-3">
          {card.answers.map((a) => (
            <li key={a.i} className="flex items-start gap-3 text-sm">
              <span className="mt-0.5 inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-neutral-100 px-2 text-xs font-bold text-neutral-800" aria-label={`Rated ${a.rating} out of 5`}>
                {a.rating}/5
              </span>
              <div className="min-w-0 space-y-0.5">
                <p className="font-medium text-neutral-900">Answer {a.i}</p>
                {!purged && a.feedback && <p className="text-neutral-600">{a.feedback}</p>}
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="flex justify-center pt-4">
        <button onClick={q.backToSetup} className="bg-accent-600 hover:bg-accent-700 text-white font-semibold py-3 px-8 rounded-card transition-colors shadow-card">
          Run another session
        </button>
      </div>
    </div>
  );
}

function Trend({ card }: { card: QaScorecard }) {
  const t = card.trend;
  if (!t) return <p className="text-xs text-neutral-500">This is your first scored session, so there is no trend yet.</p>;
  const dir = t.change > 0 ? "up" : t.change < 0 ? "down" : "level";
  const text =
    dir === "level"
      ? `Level with your last ${t.sessions_compared === 1 ? "session" : `${t.sessions_compared} sessions`} (${t.previous_average}/5).`
      : `${dir === "up" ? "Up" : "Down"} ${Math.abs(t.change)} from your last ${t.sessions_compared === 1 ? "session" : `${t.sessions_compared} sessions`} (${t.previous_average}/5).`;
  return <p className={`text-xs font-medium ${dir === "up" ? "text-success" : dir === "down" ? "text-danger-700" : "text-neutral-600"}`}>{text}</p>;
}

function SummaryList({ sessions }: { sessions: QaSessionSummary[] }) {
  const shown = sessions.filter((s) => s.status !== "abandoned");
  return (
    <div className="space-y-6 animate-fadeIn pb-12 max-w-3xl mx-auto pt-8">
      <div className="space-y-1">
        <h1 className="text-3xl font-display font-semibold text-neutral-900">Mock Q&A</h1>
        <p className="text-sm text-neutral-500">Practice sessions run by the founder.</p>
      </div>
      <ReadOnlyNote>You can see how often the founder has practised and how each session rated. Answers and scorecards stay with the founder.</ReadOnlyNote>
      {shown.length === 0 ? (
        <div className="bg-neutral-50 rounded-modal border border-neutral-200/50 p-6 text-center text-neutral-500 text-sm">No practice sessions yet.</div>
      ) : (
        <div className="bg-white rounded-modal border border-neutral-200 shadow-card overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-neutral-200/80 text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                <th className="py-4 px-6">Date</th>
                <th className="py-4 px-6">Focus</th>
                <th className="py-4 px-6">Persona</th>
                <th className="py-4 px-6">Answers</th>
                <th className="py-4 px-6 text-right">Rating</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {shown.map((s) => (
                <tr key={s.id}>
                  <td className="py-4 px-6 text-sm font-semibold text-neutral-900">{formatDay(s.started_at)}</td>
                  <td className="py-4 px-6 text-sm text-neutral-700">{focusLabel(s.focus)}</td>
                  <td className="py-4 px-6 text-sm text-neutral-700">{intensityLabel(s.intensity)}</td>
                  <td className="py-4 px-6 text-sm text-neutral-700">{s.turns}</td>
                  <td className="py-4 px-6 text-right">
                    {s.rating ? <RatingPill rating={s.rating} label={s.rating_label} /> : <span className="text-xs text-neutral-500">{s.status === "active" ? "In progress" : "Not scored"}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
