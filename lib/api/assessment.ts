import { apiClient } from './client';

// Startup Assessment (Module 07). apiClient auto-injects Bearer + X-Workspace-Id.
// Contract: cofoundaz-api/docs/fe-integration-guide-assessment.md and
// fe-integration-guide-assessment-prd.md. Writes (start / answer / complete) are
// founder-only; reads are founder + team member (everyone else gets 403).

export type AssessmentDimension = 'product' | 'market' | 'money' | 'legal' | 'team';
export type AssessmentType = 'initial' | 'quarterly';
export type AssessmentStatus = 'in_progress' | 'completed';
export type QuestionKind =
  | 'single_choice'
  | 'multi_choice'
  | 'scale_1_5'
  | 'numeric_currency'
  | 'short_text';

export interface QuestionOption {
  value: string;
  label: string;
}

/** A question as served by start / next-question / answers (guide §1). */
export interface AssessmentQuestion {
  key: string;
  dimension: AssessmentDimension;
  section: string;
  qtype: QuestionKind;
  prompt: string;
  options: QuestionOption[] | null;
  helper: string | null;
}

/** Value to submit per qtype (guide §1): string | number | string[]. */
export type AnswerValue = string | number | string[];

export type DimensionScores = Record<AssessmentDimension, number>;

/** Order the server walks the bank in (guide §2c); also the radar axis order. */
export const DIMENSION_ORDER: AssessmentDimension[] = ['product', 'market', 'money', 'legal', 'team'];

export const DIMENSION_LABEL: Record<AssessmentDimension, string> = {
  product: 'Product',
  market: 'Market',
  money: 'Money',
  legal: 'Legal',
  team: 'Team',
};

/**
 * The bank is adaptive (show_if), so there is no fixed question count. Progress is
 * therefore reported per section: which of the 5 dimensions the founder is in.
 */
export function sectionProgress(dimension: AssessmentDimension): {
  sectionNumber: number;
  totalSections: number;
  pct: number;
} {
  const idx = Math.max(0, DIMENSION_ORDER.indexOf(dimension));
  return {
    sectionNumber: idx + 1,
    totalSections: DIMENSION_ORDER.length,
    pct: Math.round((idx / DIMENSION_ORDER.length) * 100),
  };
}

/**
 * answered / (answered + remaining applicable). The path is adaptive, so `pct` can
 * move sideways or drop when an answer opens a follow-up: never animate it as monotonic.
 */
export interface AssessmentProgress {
  answered: number;
  remaining: number;
  pct: number;
}

export interface StartAssessmentResult {
  assessment_id: string;
  type: AssessmentType;
  status: AssessmentStatus;
  next_question: AssessmentQuestion | null;
  progress?: AssessmentProgress;
}

/** One dimension's Health Score movement across a completion. `previous`/`delta` are null the first time. */
export interface HealthDimensionChange {
  key: AssessmentDimension;
  score: number;
  previous: number | null;
  delta: number | null;
}

/** Health Score before/after a completion. `null` on a replayed /complete: keep the first response. */
export interface CompletionHealth {
  score: number;
  previous_score: number | null;
  delta: number | null;
  dimensions: HealthDimensionChange[];
}

export interface CompleteAssessmentResult {
  assessment_id: string;
  status: AssessmentStatus;
  dimension_scores: DimensionScores;
  overall_provisional: number;
  narrative: string;
  health?: CompletionHealth | null;
}

export type StartupStageKey = 'idea' | 'validation' | 'build' | 'launch' | 'growth' | 'scale';

export interface AssessmentListItem {
  id: string;
  type: AssessmentType;
  status: AssessmentStatus;
  started_at: string;
  completed_at: string | null;
  overall_provisional: number | null;
  /** Startup stage snapshotted at completion; null for in-progress and older rows (never back-filled). */
  stage_at_time?: string | null;
  /** Object on in-progress rows, null on completed ones. */
  progress?: AssessmentProgress | null;
}

export interface AssessmentList {
  items: AssessmentListItem[];
  /** meta.quarterly_due: latest completed check-in is 90+ days old and none is in progress. */
  quarterlyDue: boolean;
}

const STAGE_LABEL: Record<string, string> = {
  idea: 'Idea',
  validation: 'Validation',
  build: 'Build',
  launch: 'Launch',
  growth: 'Growth',
  scale: 'Scale',
};

/** "Build" for a stage key; "not recorded" when the row predates the snapshot (D-ASM-3). */
export function stageAtTimeLabel(stage: string | null | undefined): string {
  if (!stage) return 'not recorded';
  return STAGE_LABEL[stage] ?? stage.charAt(0).toUpperCase() + stage.slice(1);
}

/** One answered question in the structured detail (guide §5). `changed` is true exactly when `changed_from` is set. */
export interface AssessmentAnswer {
  question_key: string;
  prompt: string | null;
  qtype: QuestionKind | null;
  value: unknown;
  answer_label: string;
  changed: boolean;
  changed_from: string | null;
}

export interface AssessmentAnswerGroup {
  /** A dimension, or 'unknown' for a retired question key. */
  dimension: string;
  questions: AssessmentAnswer[];
}

export interface AssessmentResult {
  dimension_scores: DimensionScores;
  overall_provisional: number;
  narrative: string;
}

export interface AssessmentDetail {
  id: string;
  type: AssessmentType;
  status: AssessmentStatus;
  stage_at_time?: string | null;
  answers_by_dimension: Record<string, unknown>;
  answers?: AssessmentAnswerGroup[];
  result: AssessmentResult | null;
}

export interface AssessmentComparison {
  id: string;
  dimension_scores: DimensionScores;
}

export function formatAssessmentDate(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Route params reach API paths, so reject anything that is not a UUID before using it. */
export function isAssessmentId(value: string): boolean {
  return UUID_RE.test(value);
}

interface Envelope<T> {
  data?: T;
}

function unwrap<T>(res: Envelope<T> | T): T {
  return ((res as Envelope<T>)?.data ?? res) as T;
}

/** POST /assessments: start a new assessment or resume the in-progress one (idempotent). */
export async function startAssessment(): Promise<StartAssessmentResult> {
  const res = await apiClient<Envelope<StartAssessmentResult>>('/assessments', { method: 'POST' });
  return unwrap(res);
}

/** The question the founder is on plus how far through they are. */
export interface QuestionStep {
  question: AssessmentQuestion | null;
  progress: AssessmentProgress | null;
}

interface StepBody {
  next_question: AssessmentQuestion | null;
  progress?: AssessmentProgress | null;
}

function toStep(body: StepBody | undefined): QuestionStep {
  return { question: body?.next_question ?? null, progress: body?.progress ?? null };
}

/** GET /assessments/{id}/next-question: where the founder left off (question null = ready to complete). */
export async function getNextStep(id: string): Promise<QuestionStep> {
  const res = await apiClient<Envelope<StepBody>>(`/assessments/${encodeURIComponent(id)}/next-question`);
  return toStep(unwrap(res));
}

/** POST /assessments/{id}/answers: answer the current question, returns the next step. */
export async function submitAnswerStep(id: string, questionKey: string, value: AnswerValue): Promise<QuestionStep> {
  const res = await apiClient<Envelope<StepBody>>(`/assessments/${encodeURIComponent(id)}/answers`, {
    method: 'POST',
    body: JSON.stringify({ question_key: questionKey, value }),
  });
  return toStep(unwrap(res));
}

/** GET /assessments/{id}/next-question, question only (null = ready to complete). */
export async function getNextQuestion(id: string): Promise<AssessmentQuestion | null> {
  return (await getNextStep(id)).question;
}

/** POST /assessments/{id}/answers, returning only the next question (or null). */
export async function submitAnswer(
  id: string,
  questionKey: string,
  value: AnswerValue
): Promise<AssessmentQuestion | null> {
  return (await submitAnswerStep(id, questionKey, value)).question;
}

/** POST /assessments/{id}/complete: only valid once next_question is null. Idempotent. */
export async function completeAssessment(id: string): Promise<CompleteAssessmentResult> {
  const res = await apiClient<Envelope<CompleteAssessmentResult>>(`/assessments/${encodeURIComponent(id)}/complete`, {
    method: 'POST',
  });
  return unwrap(res);
}

/** GET /assessments?status: newest first, plus the `meta.quarterly_due` flag. */
export async function fetchAssessmentList(status?: AssessmentStatus): Promise<AssessmentList> {
  const res = await apiClient<
    { data?: AssessmentListItem[]; meta?: { quarterly_due?: boolean } | null } | AssessmentListItem[]
  >(status ? `/assessments?status=${status}` : '/assessments');
  const data = unwrap(res as Envelope<AssessmentListItem[]> | AssessmentListItem[]);
  const meta = Array.isArray(res) ? null : (res as { meta?: { quarterly_due?: boolean } | null })?.meta;
  return { items: Array.isArray(data) ? data : [], quarterlyDue: meta?.quarterly_due === true };
}

/** GET /assessments: newest first. */
export async function listAssessments(): Promise<AssessmentListItem[]> {
  return (await fetchAssessmentList()).items;
}

/** GET /assessments/{id}: `result` is null until completed. */
export async function getAssessment(id: string): Promise<AssessmentDetail> {
  const res = await apiClient<Envelope<AssessmentDetail>>(`/assessments/${encodeURIComponent(id)}`);
  return unwrap(res);
}

/** GET /assessments/compare?ids=a,b,c: up to 3 completed assessments. */
export async function compareAssessments(ids: string[]): Promise<AssessmentComparison[]> {
  const res = await apiClient<Envelope<AssessmentComparison[]> | AssessmentComparison[]>(
    `/assessments/compare?ids=${ids.map(encodeURIComponent).join(',')}`
  );
  const data = unwrap(res);
  return Array.isArray(data) ? data : [];
}
