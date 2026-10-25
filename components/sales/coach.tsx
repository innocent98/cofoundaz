'use client';

import React, { useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import {
  useCallPrep,
  useDealOptions,
  useRecentSessions,
  type useRolePlay,
} from '@/hooks/useSalesCoach';
import {
  COACH_DIFFICULTIES,
  COACH_PERSONA_PRESETS,
  MAX_PERSONA,
  MAX_SCENARIO,
  MAX_TURN,
  aiFailureMessage,
  buyerTurnFailed,
  sellerHasSpoken,
  setupOf,
  type CoachDifficulty,
  type CoachMessage,
  type CallPrepOutput,
  type CoachSession,
  type Scorecard,
} from '@/lib/api/sales';
import { relativeTime } from '@/lib/relative-time';
import { BTN_ACCENT, BTN_PRIMARY, BTN_SECONDARY, CARD, EmptyState, ErrorState, INPUT, LoadingState } from '@/components/sales/shared';

// AI Coach panels. The page owns the role-play hook so a call survives a switch to the Call prep tab.

export interface AiLimit {
  overBudget: boolean;
  /** Reset time, already formatted for display. */
  resetsAt: string;
}

const LABEL = 'text-xs font-bold text-neutral-600 uppercase tracking-wider block';

function LimitNotice({ limit }: { limit: AiLimit }) {
  if (!limit.overBudget) return null;
  return (
    <div role="status" className="rounded-card border border-warning-500/40 bg-warning-50 px-4 py-3 text-sm text-warning-800">
      <strong className="font-semibold">Daily AI limit used up.</strong> Your workspace has no AI left for today, so the coach
      cannot reply or score a call until it resets at {limit.resetsAt}.
    </div>
  );
}

function Spinner({ label }: { label: string }) {
  return (
    <div role="status" aria-live="polite" className="flex items-center gap-3 text-sm text-neutral-600">
      <span className="inline-block h-4 w-4 rounded-full border-2 border-neutral-300 border-t-[var(--color-accent-600)] animate-spin" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

// ---------------------------------------------------------------- role-play

type RolePlay = ReturnType<typeof useRolePlay>;

export function RolePlayPanel({ rp, limit }: { rp: RolePlay; limit: AiLimit }) {
  const { session } = rp;
  if (!session) return <RolePlaySetup rp={rp} limit={limit} />;
  if (session.status === 'ended') return <RolePlayResult rp={rp} session={session} limit={limit} />;
  if (session.status === 'scoring') return <RolePlayScoring rp={rp} />;
  return <RolePlayChat rp={rp} session={session} limit={limit} />;
}

function RolePlaySetup({ rp, limit }: { rp: RolePlay; limit: AiLimit }) {
  const ids = useId();
  const deals = useDealOptions();
  const recent = useRecentSessions();
  const [dealId, setDealId] = useState('');
  const [scenario, setScenario] = useState('');
  const [persona, setPersona] = useState(COACH_PERSONA_PRESETS[0]);
  const [difficulty, setDifficulty] = useState<CoachDifficulty>('neutral');
  const [opening, setOpening] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const dealList = deals.data ?? [];
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!persona.trim()) next.persona = 'Describe who the buyer is.';
    if (!dealId && !scenario.trim()) next.scenario = 'Pick a deal or describe a scenario.';
    setErrors(next);
    if (Object.keys(next).length) return;
    await rp.start({
      ...(dealId ? { deal_id: dealId } : {}),
      ...(scenario.trim() ? { scenario: scenario.trim() } : {}),
      persona: persona.trim(),
      difficulty,
      ...(opening.trim() ? { message: opening.trim() } : {}),
    });
  };

  return (
    <div className="space-y-6">
      <form onSubmit={submit} noValidate className={`${CARD} p-6 md:p-8 space-y-6 animate-fadeIn`} aria-labelledby={`${ids}-h`}>
        <div className="space-y-1">
          <h2 id={`${ids}-h`} className="text-xl font-display font-bold text-neutral-900">Set up a role-play</h2>
          <p className="text-sm text-neutral-600">
            An AI plays your buyer and you practise the call. When you end it, the AI scores how you did. The buyer is a pretend
            person: their objections are practice, not customer feedback.
          </p>
        </div>

        <LimitNotice limit={limit} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label htmlFor={`${ids}-deal`} className={LABEL}>Practise on a deal</label>
            <select id={`${ids}-deal`} className={INPUT} value={dealId} onChange={(e) => setDealId(e.target.value)} disabled={deals.status === 'loading'}>
              <option value="">No deal, I will describe the call</option>
              {dealList.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                  {d.account_name ? ` (${d.account_name})` : ''}
                </option>
              ))}
            </select>
            {deals.status === 'error' && <p role="alert" className="text-xs text-danger-700">Could not load your deals. You can still describe a scenario.</p>}
            {deals.status === 'ready' && dealList.length === 0 && (
              <p className="text-xs text-neutral-600">You have no deals yet. Describe a scenario, or add a deal on the Pipeline.</p>
            )}
            {dealId && <p className="text-xs text-neutral-600">The buyer is built from this deal, its account, contact and recent activity as they are now.</p>}
          </div>

          <div className="space-y-1.5">
            <span className={LABEL} id={`${ids}-diff`}>Difficulty</span>
            <div role="radiogroup" aria-labelledby={`${ids}-diff`} className="flex gap-2">
              {COACH_DIFFICULTIES.map((d) => (
                <button
                  key={d.value}
                  type="button"
                  role="radio"
                  aria-checked={difficulty === d.value}
                  onClick={() => setDifficulty(d.value)}
                  className={`flex-1 px-3 py-2.5 rounded-card text-sm font-semibold border transition-colors cursor-pointer ${
                    difficulty === d.value ? 'bg-brand-hover text-white border-brand-hover' : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-50'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor={`${ids}-scn`} className={LABEL}>
            {dealId ? 'Anything else the buyer should know (optional)' : 'Describe the call'}
          </label>
          <textarea
            id={`${ids}-scn`}
            rows={3}
            maxLength={MAX_SCENARIO}
            value={scenario}
            onChange={(e) => setScenario(e.target.value)}
            aria-invalid={!!errors.scenario}
            aria-describedby={errors.scenario ? `${ids}-scn-err` : undefined}
            placeholder="Cold call to a bakery chain about card readers"
            className={INPUT}
          />
          {errors.scenario && <p id={`${ids}-scn-err`} role="alert" className="text-xs text-danger-700">{errors.scenario}</p>}
        </div>

        <div className="space-y-1.5">
          <label htmlFor={`${ids}-persona`} className={LABEL}>Buyer persona</label>
          <input
            id={`${ids}-persona`}
            type="text"
            maxLength={MAX_PERSONA}
            value={persona}
            onChange={(e) => setPersona(e.target.value)}
            aria-invalid={!!errors.persona}
            aria-describedby={errors.persona ? `${ids}-persona-err` : undefined}
            className={INPUT}
          />
          {errors.persona && <p id={`${ids}-persona-err`} role="alert" className="text-xs text-danger-700">{errors.persona}</p>}
          <div className="flex flex-wrap gap-2 pt-1" aria-label="Persona presets">
            {COACH_PERSONA_PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPersona(p)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border cursor-pointer transition-colors ${
                  persona === p ? 'bg-accent-200 border-accent-200 text-ink' : 'bg-white border-neutral-200 text-neutral-700 hover:border-neutral-400'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor={`${ids}-open`} className={LABEL}>Your opening line (optional)</label>
          <input
            id={`${ids}-open`}
            type="text"
            maxLength={MAX_TURN}
            value={opening}
            onChange={(e) => setOpening(e.target.value)}
            placeholder="Leave empty to speak first once the call starts"
            className={INPUT}
          />
        </div>

        {rp.error && <p role="alert" className="text-sm text-danger-700">{rp.error}</p>}

        <button type="submit" disabled={rp.busy === 'starting' || limit.overBudget} className={BTN_ACCENT}>
          {rp.busy === 'starting' ? 'Starting...' : 'Start role-play'}
        </button>
      </form>

      <RecentCalls
        status={recent.status}
        sessions={recent.data ?? []}
        onOpen={(id) => void rp.open(id)}
        opening={rp.busy === 'starting'}
        onRetry={() => void recent.reload()}
      />
    </div>
  );
}

function sessionTitle(s: CoachSession): string {
  return s.deal_name ?? s.scenario ?? 'Practice call';
}

function RecentCalls({
  status,
  sessions,
  onOpen,
  opening,
  onRetry,
}: {
  status: string;
  sessions: CoachSession[];
  onOpen: (id: string) => void;
  opening: boolean;
  onRetry: () => void;
}) {
  if (status === 'loading') return null;
  if (status === 'error') {
    return (
      <p role="alert" className="text-xs text-danger-700">
        Could not load your recent practice calls.{' '}
        <button type="button" onClick={onRetry} className="underline font-semibold cursor-pointer">Try again</button>
      </p>
    );
  }
  if (sessions.length === 0) return null;
  return (
    <section aria-label="Recent practice calls" className={`${CARD} overflow-hidden`}>
      <div className="px-6 py-4 border-b border-neutral-200 bg-neutral-50/50">
        <h3 className="text-sm font-semibold text-neutral-900">Your recent practice calls</h3>
        <p className="text-xs text-neutral-600">Private to you. Open one to see its scorecard or pick a call back up.</p>
      </div>
      <ul className="divide-y divide-neutral-100">
        {sessions.map((s) => (
          <li key={s.id}>
            <button
              type="button"
              disabled={opening}
              onClick={() => onOpen(s.id)}
              className="w-full text-left px-6 py-3 flex items-center justify-between gap-4 hover:bg-neutral-50 cursor-pointer disabled:opacity-60"
            >
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-neutral-900 truncate">{sessionTitle(s)}</span>
                <span className="block text-xs text-neutral-600 truncate">
                  {s.persona}, {s.difficulty} · {relativeTime(s.created_at)}
                </span>
              </span>
              <span className="text-xs font-semibold text-neutral-700 shrink-0">
                {s.status === 'ended' ? (s.scorecard ? `${s.scorecard.overall.toFixed(1)}/10` : 'Not scored') : s.status === 'scoring' ? 'Scoring' : 'In progress'}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Bubble({ m }: { m: CoachMessage }) {
  const mine = m.role === 'user';
  return (
    <div className={`flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
      <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-600 mb-1">{mine ? 'You' : 'AI buyer'}</span>
      <div
        className={`px-5 py-3.5 rounded-modal max-w-xl text-sm font-medium shadow-card whitespace-pre-wrap break-words ${
          mine ? 'bg-brand-hover text-white rounded-br-sm' : 'bg-neutral-xf0f4f1 text-neutral-800 border border-brand-900/10 rounded-bl-sm'
        }`}
      >
        {m.content}
      </div>
    </div>
  );
}

function RolePlayChat({ rp, session, limit }: { rp: RolePlay; session: CoachSession; limit: AiLimit }) {
  const [text, setText] = useState('');
  const logRef = useRef<HTMLDivElement>(null);
  const messages = session.messages ?? [];
  const shown = messages.filter((m) => m.status === 'ready' || (m.role === 'user'));
  const failed = buyerTurnFailed(messages);
  const locked = rp.replying || rp.busy !== null;
  const canEnd = !locked && sellerHasSpoken(messages) && !rp.slow;

  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length, rp.replying]);

  const send = async () => {
    const content = text.trim();
    if (!content || locked) return;
    if (await rp.send(content)) setText('');
  };

  return (
    <div className={`${CARD} p-6 md:p-8 space-y-5 animate-fadeIn`}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-neutral-100 pb-4">
        <div className="min-w-0">
          <h2 className="text-xl font-display font-bold text-neutral-900">Practice call</h2>
          <p className="text-xs text-neutral-600 mt-1 break-words">
            Talking to an AI buyer: {session.persona} ({session.difficulty}). {session.deal_name ? `Deal: ${session.deal_name}.` : ''}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void rp.end()}
          disabled={!canEnd}
          title={!sellerHasSpoken(messages) ? 'Say something to the buyer first' : rp.replying ? 'Wait for the buyer to finish replying' : undefined}
          className="bg-danger-50 hover:bg-danger-100 text-danger-700 font-semibold px-4 py-2 rounded-card text-sm border border-danger-200 transition-colors shadow-card cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {rp.busy === 'ending' ? 'Ending...' : 'End session'}
        </button>
      </div>

      <LimitNotice limit={limit} />

      <div
        ref={logRef}
        role="log"
        aria-label="Practice call transcript"
        aria-live="polite"
        tabIndex={0}
        className="space-y-4 h-[320px] overflow-y-auto pr-2 no-scrollbar"
      >
        {shown.length === 0 && !rp.replying && (
          <p className="text-sm text-neutral-600">The call is open. Say hello to the buyer to begin.</p>
        )}
        {shown.map((m) => <Bubble key={m.id} m={m} />)}
        {rp.replying && (
          <div className="flex flex-col items-start">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-600 mb-1">AI buyer</span>
            <div className="px-5 py-3.5 rounded-modal bg-neutral-xf0f4f1 border border-brand-900/10 rounded-bl-sm text-sm text-neutral-600">
              <Spinner label="The buyer is replying..." />
            </div>
          </div>
        )}
      </div>

      {rp.slow && (
        <div role="alert" className="rounded-card border border-warning-500/40 bg-warning-50 px-4 py-3 text-sm text-warning-800 flex flex-wrap items-center justify-between gap-3">
          <span>The buyer is taking longer than usual to reply.</span>
          <button type="button" onClick={() => void rp.checkAgain()} className={BTN_SECONDARY}>Check again</button>
        </div>
      )}
      {failed && !rp.replying && !rp.slow && (
        <p role="alert" className="text-sm text-danger-700">
          {limit.overBudget ? aiFailureMessage('over_budget', 'reply', limit.resetsAt) : 'The buyer couldn\'t reply. Try sending again.'}
        </p>
      )}
      {rp.error && <p role="alert" className="text-sm text-danger-700">{rp.error}</p>}

      <div className="flex items-center gap-3 pt-4 border-t border-neutral-100">
        <label htmlFor="coach-turn" className="sr-only">Your response to the buyer</label>
        <input
          id="coach-turn"
          type="text"
          value={text}
          maxLength={MAX_TURN}
          disabled={locked || rp.slow}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void send();
          }}
          placeholder={rp.replying ? 'Wait for the buyer...' : 'Your response to the buyer...'}
          className="flex-1 min-w-0 bg-neutral-50 border border-neutral-200 rounded-card px-4 py-3 text-sm focus:outline-none focus:border-neutral-400 shadow-card disabled:opacity-60"
        />
        <button type="button" onClick={() => void send()} disabled={locked || rp.slow || !text.trim()} className={BTN_PRIMARY}>
          {rp.busy === 'sending' ? 'Sending...' : 'Send'}
        </button>
      </div>
    </div>
  );
}

function RolePlayScoring({ rp }: { rp: RolePlay }) {
  return (
    <div className={`${CARD} p-8 space-y-4 animate-fadeIn`}>
      <h2 className="text-xl font-display font-bold text-neutral-900">Scoring your call</h2>
      {rp.slow ? (
        <div role="alert" className="space-y-3">
          <p className="text-sm text-warning-800">Scoring is taking longer than usual. Nothing is lost; your call is saved.</p>
          <button type="button" onClick={() => void rp.checkAgain()} className={BTN_SECONDARY}>Check again</button>
        </div>
      ) : (
        <Spinner label="The AI is reading the whole call. This can take a minute..." />
      )}
      {rp.error && <p role="alert" className="text-sm text-danger-700">{rp.error}</p>}
    </div>
  );
}

const CRITERIA: { key: keyof Scorecard['scores']; label: string }[] = [
  { key: 'discovery', label: 'Discovery' },
  { key: 'objection_handling', label: 'Objection handling' },
  { key: 'next_step_close', label: 'Next-step close' },
];

function RolePlayResult({ rp, session, limit }: { rp: RolePlay; session: CoachSession; limit: AiLimit }) {
  const card = session.scorecard;
  const practiceAgain = () => void rp.start(setupOf(session));
  const again = (
    <div className="flex flex-wrap justify-center gap-3 pt-2">
      <button type="button" onClick={practiceAgain} disabled={rp.busy === 'starting' || limit.overBudget} className={BTN_ACCENT}>
        {rp.busy === 'starting' ? 'Starting...' : 'Practice this again'}
      </button>
      <button type="button" onClick={rp.reset} className={BTN_SECONDARY}>Set up a different call</button>
    </div>
  );

  if (!card) {
    return (
      <div className={`${CARD} p-8 space-y-4 animate-fadeIn`}>
        <h2 className="text-xl font-display font-bold text-neutral-900">We couldn&apos;t score this call</h2>
        <p role="alert" className="text-sm text-neutral-700">{aiFailureMessage(session.scorecard_error, 'scorecard', limit.resetsAt)}</p>
        {rp.error && <p role="alert" className="text-sm text-danger-700">{rp.error}</p>}
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={() => void rp.end()} disabled={rp.busy === 'ending' || limit.overBudget} className={BTN_ACCENT}>
            {rp.busy === 'ending' ? 'Trying...' : 'Try again'}
          </button>
          <button type="button" onClick={rp.reset} className={BTN_SECONDARY}>Set up a different call</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`${CARD} p-6 md:p-8 space-y-6 animate-fadeIn`}>
      <div className="text-center space-y-1 pb-4 border-b border-neutral-100">
        <h2 className="text-2xl font-display font-bold text-neutral-900">Session scorecard</h2>
        <p className="text-sm text-neutral-600">
          How this one call went with the AI buyer ({session.persona}, {session.difficulty}). It is a read on one practice call, not a rating of you.
        </p>
        <p className="text-sm font-semibold text-neutral-900">Overall {card.overall.toFixed(1)}/10</p>
      </div>

      <ul className="grid grid-cols-1 md:grid-cols-3 gap-4" aria-label="Scores">
        {CRITERIA.map((c) => (
          <li key={c.key} className="bg-neutral-50 rounded-card p-4 border border-neutral-200 flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-600 uppercase tracking-wider">{c.label}</span>
            <span className="text-lg font-bold text-neutral-900">{card.scores[c.key]}/10</span>
          </li>
        ))}
      </ul>

      {card.feedback.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-brand-hover uppercase tracking-wider">Feedback</h3>
          <ul className="list-disc pl-5 space-y-1.5 text-sm text-neutral-700">
            {card.feedback.map((f, i) => <li key={i}>{f}</li>)}
          </ul>
        </div>
      )}

      <details className="text-sm">
        <summary className="cursor-pointer font-semibold text-neutral-700">Review the call</summary>
        <div className="space-y-3 pt-3">
          {(session.messages ?? []).filter((m) => m.content).map((m) => (
            <p key={m.id} className="text-neutral-700 whitespace-pre-wrap break-words">
              <strong className="text-neutral-900">{m.role === 'user' ? 'You' : 'AI buyer'}:</strong> {m.content}
            </p>
          ))}
        </div>
      </details>

      {rp.error && <p role="alert" className="text-sm text-danger-700 text-center">{rp.error}</p>}
      {again}
    </div>
  );
}

// ---------------------------------------------------------------- call prep

export function CallPrepPanel({
  dealId,
  onDealChange,
  limit,
}: {
  dealId: string;
  onDealChange: (id: string) => void;
  limit: AiLimit;
}) {
  const ids = useId();
  const deals = useDealOptions();
  const cp = useCallPrep(dealId || null);
  const list = deals.data ?? [];
  const deal = list.find((d) => d.id === dealId) ?? null;
  const prep = cp.prep && cp.prep.deal_id === dealId ? cp.prep : null;

  return (
    <div className={`${CARD} p-6 md:p-8 space-y-6 animate-fadeIn`}>
      <div className="space-y-1">
        <h2 className="text-xl md:text-2xl font-display font-bold text-neutral-900">
          {deal ? `Call prep: ${deal.name}` : 'Call prep'}
        </h2>
        <p className="text-sm text-neutral-600">
          Pick a deal and get a one-page brief: where it stands, the objections to expect, your goal, and three questions to ask.
          It is written by AI from your deal record, so check it before you rely on it.
        </p>
      </div>

      {deals.status === 'loading' && <LoadingState label="Loading your deals" />}
      {deals.status === 'error' && <ErrorState message={deals.error ?? 'Could not load your deals.'} onRetry={() => void deals.reload()} />}
      {deals.status === 'ready' && list.length === 0 && (
        <EmptyState
          title="No deals to prep for yet"
          body="Call prep is written for one of your deals. Add a deal on the Pipeline, then come back."
          cta={<Link href="/sales" className={BTN_ACCENT}>Go to the Pipeline</Link>}
        />
      )}

      {deals.status === 'ready' && list.length > 0 && (
        <div className="space-y-1.5 max-w-md">
          <label htmlFor={`${ids}-deal`} className={LABEL}>Deal</label>
          <select id={`${ids}-deal`} className={INPUT} value={dealId} onChange={(e) => onDealChange(e.target.value)}>
            <option value="">Choose a deal</option>
            {list.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
                {d.account_name ? ` (${d.account_name})` : ''}
              </option>
            ))}
          </select>
        </div>
      )}

      <LimitNotice limit={limit} />

      {dealId && cp.loadStatus === 'loading' && !prep && <LoadingState label="Loading call prep" />}
      {dealId && cp.loadStatus === 'error' && !prep && <ErrorState message={cp.loadError ?? 'Could not load call prep.'} onRetry={() => void cp.reload()} />}
      {dealId && cp.loadStatus === 'forbidden' && <p role="alert" className="text-sm text-danger-700">Call prep is not available for your role.</p>}

      {dealId && cp.loadStatus === 'ready' && (
        <>
          {cp.error && <p role="alert" className="text-sm text-danger-700">{cp.error}</p>}

          {cp.generating && <Spinner label="Writing your call prep..." />}
          {cp.slow && (
            <div role="alert" className="rounded-card border border-warning-500/40 bg-warning-50 px-4 py-3 text-sm text-warning-800 flex flex-wrap items-center justify-between gap-3">
              <span>The call prep is taking longer than usual.</span>
              <button type="button" onClick={cp.checkAgain} className={BTN_SECONDARY}>Check again</button>
            </div>
          )}

          {!cp.generating && !cp.slow && !prep && (
            <button type="button" onClick={() => void cp.generate()} disabled={limit.overBudget} className={BTN_ACCENT}>
              Generate call prep
            </button>
          )}

          {!cp.generating && prep?.status === 'failed' && (
            <div className="space-y-3">
              <p role="alert" className="text-sm text-neutral-700">{aiFailureMessage(prep.error, 'call prep', limit.resetsAt)}</p>
              <button type="button" onClick={() => void cp.generate()} disabled={limit.overBudget || prep.error === 'deal_missing'} className={BTN_ACCENT}>
                Try again
              </button>
            </div>
          )}

          {!cp.generating && prep?.status === 'ready' && prep.output && (
            <PrepBrief prep={prep.output} createdAt={prep.created_at} onRegenerate={() => void cp.generate()} regenDisabled={limit.overBudget} />
          )}
        </>
      )}
    </div>
  );
}

function PrepBrief({
  prep,
  createdAt,
  onRegenerate,
  regenDisabled,
}: {
  prep: CallPrepOutput;
  createdAt: string;
  onRegenerate: () => void;
  regenDisabled: boolean;
}) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-brand-hover uppercase tracking-wider">Where the deal stands</h3>
        <p className="text-sm text-neutral-700 whitespace-pre-wrap">{prep.context}</p>
      </div>

      <div className="space-y-4 pt-2 border-t border-neutral-100">
        <h3 className="text-xs font-bold text-accent-600 uppercase tracking-wider">Likely objections</h3>
        <ul className="space-y-3 text-sm text-neutral-700">
          {prep.objections.map((o, i) => (
            <li key={i}>
              <strong className="text-neutral-900">{o.objection}</strong> {o.response}
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-2 pt-2 border-t border-neutral-100">
        <h3 className="text-xs font-bold text-brand-hover uppercase tracking-wider">Your goal for the call</h3>
        <p className="text-sm text-neutral-700 font-medium">{prep.call_goal}</p>
      </div>

      <div className="space-y-2 pt-2 border-t border-neutral-100">
        <h3 className="text-xs font-bold text-brand-hover uppercase tracking-wider">3 discovery questions</h3>
        <ul className="text-sm text-neutral-700 font-medium list-disc pl-4 space-y-1">
          {prep.discovery_questions.map((q, i) => <li key={i}>{q}</li>)}
        </ul>
      </div>

      <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-neutral-100">
        <button type="button" onClick={onRegenerate} disabled={regenDisabled} className={BTN_SECONDARY}>Regenerate</button>
        <p className="text-xs text-neutral-600">
          Written {relativeTime(createdAt)} from the deal as it was then. Edited the deal since? Regenerate. This replaces the brief above.
        </p>
      </div>
    </div>
  );
}
