import { apiClient } from './client';

// Startup Assessment (Module 07). apiClient auto-injects Bearer + X-Workspace-Id.
// Contract: cofoundaz-api/docs/fe-integration-guide-assessment.md. Writes
// (start / answer / complete) are founder-only; reads are open to any member.

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

export interface StartAssessmentResult {
  assessment_id: string;
  type: AssessmentType;
  status: AssessmentStatus;
  next_question: AssessmentQuestion | null;
}

export interface CompleteAssessmentResult {
  assessment_id: string;
  status: AssessmentStatus;
  dimension_scores: DimensionScores;
  overall_provisional: number;
  narrative: string;
}

export interface AssessmentListItem {
  id: string;
  type: AssessmentType;
  status: AssessmentStatus;
  started_at: string;
  completed_at: string | null;
  overall_provisional: number | null;
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
  answers_by_dimension: Record<string, unknown>;
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

/** GET /assessments/{id}/next-question: where the founder left off (null = ready to complete). */
export async function getNextQuestion(id: string): Promise<AssessmentQuestion | null> {
  const res = await apiClient<Envelope<{ next_question: AssessmentQuestion | null }>>(
    `/assessments/${id}/next-question`
  );
  return unwrap(res)?.next_question ?? null;
}

/** POST /assessments/{id}/answers: answer the current question, returns the next (or null). */
export async function submitAnswer(
  id: string,
  questionKey: string,
  value: AnswerValue
): Promise<AssessmentQuestion | null> {
  const res = await apiClient<Envelope<{ next_question: AssessmentQuestion | null }>>(
    `/assessments/${id}/answers`,
    { method: 'POST', body: JSON.stringify({ question_key: questionKey, value }) }
  );
  return unwrap(res)?.next_question ?? null;
}

/** POST /assessments/{id}/complete: only valid once next_question is null. Idempotent. */
export async function completeAssessment(id: string): Promise<CompleteAssessmentResult> {
  const res = await apiClient<Envelope<CompleteAssessmentResult>>(`/assessments/${id}/complete`, {
    method: 'POST',
  });
  return unwrap(res);
}

/** GET /assessments: newest first. */
export async function listAssessments(): Promise<AssessmentListItem[]> {
  const res = await apiClient<Envelope<AssessmentListItem[]> | AssessmentListItem[]>('/assessments');
  const data = unwrap(res);
  return Array.isArray(data) ? data : [];
}

/** GET /assessments/{id}: `result` is null until completed. */
export async function getAssessment(id: string): Promise<AssessmentDetail> {
  const res = await apiClient<Envelope<AssessmentDetail>>(`/assessments/${id}`);
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
