'use client';

import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, Info, Loader2, Sparkles } from 'lucide-react';
import { getJob, type DraftResult } from '@/lib/api/documents';
import { describeDraftResult, POLL_LIMIT_MS, pollDelay, sectionKeyLabel, type DraftTone } from '@/lib/documents-ai';
import { btnSecondary } from './ui';

type Phase = 'working' | 'result' | 'timeout' | 'stopped';
interface State {
  jobId: string;
  phase: Phase;
  result: DraftResult | null;
}

const TONE: Record<DraftTone, string> = {
  success: 'bg-success-50 border-success-100 text-success-800',
  warning: 'bg-warning-50 border-warning-100 text-warning-800',
  danger: 'bg-danger-tint border-danger-xfad7d7 text-danger-bold',
  info: 'bg-info-50 border-info-xd5dbe8 text-info-700',
};

/**
 * Follows one AI draft job (guide section 4): polls GET /jobs/{id}, then shows the outcome from
 * `result.status` (the job's own status is "succeeded" even when the draft failed).
 */
export function AiDraftStatus({
  jobId,
  sections,
  onFinished,
  onRetry,
  retrying,
}: {
  jobId: string;
  sections: string[];
  /** Called once with the result, so the page can reload the document when a new version was written. */
  onFinished: (result: DraftResult | null) => void;
  onRetry: () => void;
  retrying?: boolean;
}) {
  const [state, setState] = useState<State>({ jobId, phase: 'working', result: null });
  const [attempt, setAttempt] = useState(0);
  const finished = useRef(onFinished);
  useEffect(() => {
    finished.current = onFinished;
  });

  useEffect(() => {
    let cancelled = false;
    const started = Date.now();
    const tick = async () => {
      while (!cancelled) {
        const elapsed = Date.now() - started;
        if (elapsed > POLL_LIMIT_MS) {
          setState({ jobId, phase: 'timeout', result: null });
          return;
        }
        await new Promise((r) => setTimeout(r, pollDelay(elapsed)));
        if (cancelled) return;
        try {
          const job = await getJob(jobId);
          if (job.status === 'succeeded') {
            setState({ jobId, phase: 'result', result: job.result });
            finished.current(job.result);
            return;
          }
          if (job.status === 'failed' || job.status === 'cancelled') {
            setState({ jobId, phase: 'stopped', result: null });
            finished.current(null);
            return;
          }
        } catch {
          // a dropped request is not a failed draft: keep polling until the deadline
        }
      }
    };
    void tick();
    return () => {
      cancelled = true;
    };
  }, [jobId, attempt]);

  // A new job id restarts at "working" without a state reset inside an effect.
  const current: State = state.jobId === jobId ? state : { jobId, phase: 'working', result: null };

  if (current.phase === 'working') {
    return (
      <div role="status" className={`${TONE.info} border rounded-card p-4 flex items-start gap-3`}>
        <Loader2 className="w-5 h-5 shrink-0 mt-0.5 animate-spin" aria-hidden />
        <div className="text-xs leading-relaxed">
          <p className="font-bold">AI is drafting {sections.length > 0 ? sections.map(sectionKeyLabel).join(', ') : 'your document'}.</p>
          <p>This usually takes under a minute. You can keep reading, and the page updates when it is done.</p>
        </div>
      </div>
    );
  }

  let tone: DraftTone;
  let title: string;
  let detail: string | undefined;
  let retry = false;
  let check = false;
  if (current.phase === 'timeout') {
    tone = 'info';
    title = 'AI is still working on this draft.';
    detail = 'It is taking longer than usual. Check again in a few minutes.';
    check = true;
  } else if (current.phase === 'stopped') {
    tone = 'danger';
    title = 'The AI draft stopped before it finished.';
    detail = 'Nothing was changed. Try again in a moment.';
    retry = true;
  } else {
    const msg = current.result ? describeDraftResult(current.result) : null;
    if (!msg) return null; // "gone": the document was trashed while the job waited
    ({ tone, title, detail, retry } = msg);
  }
  const Icon = tone === 'success' ? CheckCircle2 : tone === 'info' ? Info : tone === 'warning' ? Sparkles : AlertTriangle;
  return (
    <div role={tone === 'danger' ? 'alert' : 'status'} className={`${TONE[tone]} border rounded-card p-4 flex items-start gap-3`}>
      <Icon className="w-5 h-5 shrink-0 mt-0.5" aria-hidden />
      <div className="text-xs leading-relaxed flex flex-col gap-2">
        <p className="font-bold">{title}</p>
        {detail && <p>{detail}</p>}
        {retry && (
          <button type="button" onClick={onRetry} disabled={retrying} className={`${btnSecondary} w-fit`}>
            {retrying ? 'Starting…' : 'Try again'}
          </button>
        )}
        {check && (
          <button
            type="button"
            className={`${btnSecondary} w-fit`}
            onClick={() => {
              setState({ jobId, phase: 'working', result: null });
              setAttempt((n) => n + 1);
            }}
          >
            Check again
          </button>
        )}
      </div>
    </div>
  );
}
