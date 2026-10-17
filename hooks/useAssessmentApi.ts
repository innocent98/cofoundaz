import { useState, useEffect, useCallback } from 'react';
import { ApiError } from '@/lib/api/client';
import {
  startAssessment,
  getNextQuestion,
  submitAnswer,
  completeAssessment,
  listAssessments,
  getAssessment,
  compareAssessments,
  isAssessmentId,
  type AnswerValue,
  type AssessmentDetail,
  type AssessmentListItem,
  type AssessmentQuestion,
  type CompleteAssessmentResult,
  type DimensionScores,
} from '@/lib/api/assessment';

export type {
  AssessmentQuestion,
  AssessmentListItem,
  AssessmentDetail,
  CompleteAssessmentResult,
} from '@/lib/api/assessment';

type FieldError = { field?: string; message?: string };

/** Founder-facing message for an assessment API failure (guide §4). */
export function assessmentErrMsg(err: unknown): string {
  if (err instanceof ApiError) {
    const d = err.data as
      | { error?: { code?: string; message?: string; field_errors?: FieldError[] | Record<string, string> } }
      | undefined;
    if (err.status === 403) return 'Only founders can take the assessment in this workspace.';
    if (err.status === 404) return 'We could not find that assessment.';
    return d?.error?.message || 'Something went wrong with the assessment.';
  }
  return 'Something went wrong with the assessment.';
}

/** Past + in-progress assessments, newest first (GET /assessments). */
export function useAssessmentHistory() {
  const [items, setItems] = useState<AssessmentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setItems(await listAssessments());
    } catch (err) {
      setError(assessmentErrMsg(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void load();
    });
  }, [load]);

  const completed = items.filter((i) => i.status === 'completed');
  const inProgress = items.find((i) => i.status === 'in_progress') ?? null;

  return { items, completed, inProgress, loading, error, refetch: load };
}

/** Lazy per-assessment detail cache (scores + narrative) for the results accordion. */
export function useAssessmentDetails() {
  const [details, setDetails] = useState<Record<string, AssessmentDetail>>({});
  const [failed, setFailed] = useState<Record<string, string>>({});

  const ensure = useCallback(
    async (id: string) => {
      if (details[id]) return;
      try {
        const detail = await getAssessment(id);
        setDetails((prev) => ({ ...prev, [id]: detail }));
        setFailed((prev) => {
          if (!(id in prev)) return prev;
          const { [id]: _drop, ...rest } = prev;
          void _drop;
          return rest;
        });
      } catch (err) {
        setFailed((prev) => ({ ...prev, [id]: assessmentErrMsg(err) }));
      }
    },
    [details]
  );

  return { details, failed, ensure };
}

/** Dimension scores for up to 3 selected completed assessments (GET /assessments/compare). */
export function useAssessmentComparison(ids: string[]) {
  const [scores, setScores] = useState<Record<string, DimensionScores>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const key = ids.join(',');

  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    queueMicrotask(async () => {
      if (cancelled) return;
      try {
        setLoading(true);
        setError(null);
        const rows = await compareAssessments(key.split(','));
        if (cancelled) return;
        setScores((prev) => ({ ...prev, ...Object.fromEntries(rows.map((r) => [r.id, r.dimension_scores])) }));
      } catch (err) {
        if (!cancelled) setError(assessmentErrMsg(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [key]);

  return { scores, loading, error };
}

/** POST /assessments from the start page: idempotent start-or-resume. */
export function useStartAssessment() {
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const start = useCallback(async (): Promise<string | null> => {
    try {
      setStarting(true);
      setError(null);
      const res = await startAssessment();
      return res.assessment_id;
    } catch (err) {
      setError(assessmentErrMsg(err));
      return null;
    } finally {
      setStarting(false);
    }
  }, []);

  return { start, starting, error };
}

/** The in-progress assessment, if any, and the question the founder is on. */
export function useInProgressAssessment() {
  const [assessment, setAssessment] = useState<AssessmentListItem | null>(null);
  const [question, setQuestion] = useState<AssessmentQuestion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const open = (await listAssessments()).find((a) => a.status === 'in_progress') ?? null;
      setAssessment(open);
      setQuestion(open ? await getNextQuestion(open.id) : null);
    } catch (err) {
      setError(assessmentErrMsg(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void load();
    });
  }, [load]);

  return { assessment, question, loading, error, refetch: load };
}

export type RunnerPhase = 'loading' | 'question' | 'completing' | 'done' | 'error';

/**
 * Server-driven adaptive runner. The server owns which question is next: the hook
 * holds the current question, `answer` advances to whatever the server returns, and
 * once there is no next question it completes and exposes the real result.
 * Loading an already-finished assessment lands on its result too (complete is idempotent).
 */
export function useAssessmentRunner(assessmentId: string) {
  const [phase, setPhase] = useState<RunnerPhase>('loading');
  const [question, setQuestion] = useState<AssessmentQuestion | null>(null);
  const [result, setResult] = useState<CompleteAssessmentResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [answerError, setAnswerError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [answeredCount, setAnsweredCount] = useState(0);

  const finish = useCallback(async () => {
    setPhase('completing');
    try {
      setResult(await completeAssessment(assessmentId));
      setPhase('done');
    } catch (err) {
      setLoadError(assessmentErrMsg(err));
      setPhase('error');
    }
  }, [assessmentId]);

  const load = useCallback(async () => {
    setPhase('loading');
    setLoadError(null);
    if (!isAssessmentId(assessmentId)) {
      setLoadError(assessmentErrMsg(new ApiError(404, 'Not Found', null)));
      setPhase('error');
      return;
    }
    try {
      const next = await getNextQuestion(assessmentId);
      setQuestion(next);
      if (next) setPhase('question');
      else await finish();
    } catch (err) {
      setLoadError(assessmentErrMsg(err));
      setPhase('error');
    }
  }, [assessmentId, finish]);

  useEffect(() => {
    queueMicrotask(() => {
      void load();
    });
  }, [load]);

  const answer = useCallback(
    async (value: AnswerValue) => {
      if (!question || submitting) return;
      try {
        setSubmitting(true);
        setAnswerError(null);
        const next = await submitAnswer(assessmentId, question.key, value);
        setAnsweredCount((n) => n + 1);
        setQuestion(next);
        if (!next) await finish();
      } catch (err) {
        setAnswerError(assessmentErrMsg(err));
      } finally {
        setSubmitting(false);
      }
    },
    [assessmentId, question, submitting, finish]
  );

  return { phase, question, result, submitting, answerError, loadError, answeredCount, answer, retry: load };
}
