import { apiClient } from './client';

// Validation Hub (Module 09). apiClient auto-injects Bearer + X-Workspace-Id, so
// these member routes need no extra headers. Grows slice by slice.

export type AssumptionStatus = 'untested' | 'testing' | 'validated' | 'invalidated';
export type AssumptionRisk = 'low' | 'medium' | 'high';

/** Raw assumption as returned by the API (guide §1). */
export interface RawAssumption {
  id: string;
  statement: string;
  risk: AssumptionRisk;
  status: AssumptionStatus;
  evidence_count: number;
  created_at?: string;
  updated_at?: string;
}

export async function listAssumptions(params?: {
  status?: AssumptionStatus;
  risk?: AssumptionRisk;
}): Promise<RawAssumption[]> {
  const qs = new URLSearchParams();
  if (params?.status) qs.set('status', params.status);
  if (params?.risk) qs.set('risk', params.risk);
  const q = qs.toString();
  const res = await apiClient<{ data?: { assumptions?: RawAssumption[] } }>(
    `/validation/assumptions${q ? `?${q}` : ''}`
  );
  return res?.data?.assumptions ?? [];
}

export async function createAssumption(body: {
  statement: string;
  risk?: AssumptionRisk;
  status?: AssumptionStatus;
}): Promise<RawAssumption> {
  const res = await apiClient<{ data?: RawAssumption } | RawAssumption>('/validation/assumptions', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return ((res as { data?: RawAssumption })?.data ?? res) as RawAssumption;
}

export async function updateAssumption(
  id: string,
  body: { statement?: string; risk?: AssumptionRisk; status?: AssumptionStatus }
): Promise<RawAssumption> {
  const res = await apiClient<{ data?: RawAssumption } | RawAssumption>(
    `/validation/assumptions/${id}`,
    { method: 'PATCH', body: JSON.stringify(body) }
  );
  return ((res as { data?: RawAssumption })?.data ?? res) as RawAssumption;
}

// --- Interviews (guide §3) ---------------------------------------------------

export type InterviewVerdict = 'supports' | 'contradicts' | 'neutral';

export interface RawInterview {
  id: string;
  interviewee: string;
  segment: string | null;
  held_on: string | null;
  notes: string | null;
  key_quotes: string[];
  verdict: InterviewVerdict;
  assumption_ids: string[];
  created_at?: string;
  updated_at?: string;
}

export interface CreateInterviewBody {
  interviewee: string;
  held_on?: string;
  verdict: InterviewVerdict;
  segment?: string;
  notes?: string;
  key_quotes: string[]; // must be non-empty strings or the API 422s
  assumption_ids?: string[];
}

export async function listInterviews(params?: {
  segment?: string;
  verdict?: InterviewVerdict;
  assumption_id?: string;
}): Promise<RawInterview[]> {
  const qs = new URLSearchParams();
  if (params?.segment) qs.set('segment', params.segment);
  if (params?.verdict) qs.set('verdict', params.verdict);
  if (params?.assumption_id) qs.set('assumption_id', params.assumption_id);
  const q = qs.toString();
  const res = await apiClient<{ data?: { interviews?: RawInterview[] } }>(
    `/validation/interviews${q ? `?${q}` : ''}`
  );
  return res?.data?.interviews ?? [];
}

export async function createInterview(body: CreateInterviewBody): Promise<RawInterview> {
  const res = await apiClient<{ data?: RawInterview } | RawInterview>('/validation/interviews', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return ((res as { data?: RawInterview })?.data ?? res) as RawInterview;
}

export async function updateInterview(
  id: string,
  body: Partial<CreateInterviewBody>
): Promise<RawInterview> {
  const res = await apiClient<{ data?: RawInterview } | RawInterview>(
    `/validation/interviews/${id}`,
    { method: 'PATCH', body: JSON.stringify(body) }
  );
  return ((res as { data?: RawInterview })?.data ?? res) as RawInterview;
}

// --- Experiments & smoke tests (guide §2) -----------------------------------

export type ExperimentType = 'smoke_test' | 'landing_page' | 'ad_test' | 'other';
export type ExperimentStatus = 'draft' | 'live' | 'ended';

export interface RawExperiment {
  id: string;
  name: string;
  type: ExperimentType;
  status: ExperimentStatus;
  config: Record<string, unknown>;
  metrics: Record<string, unknown>;
  assumption_ids: string[];
  /** Top-level: the live address. `config.slug` is only what we send. */
  slug?: string | null;
  published_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export type SmokeVerdict = 'validated' | 'weak';

/** `GET /validation/smoke-tests/{id}/stats`. The verdict is the server's. */
export interface SmokeTestStats {
  experiment_id: string;
  name: string;
  status: string;
  slug: string | null;
  visits: number;
  signups: number;
  cta_clicks: number;
  preorder_clicks: number;
  metric_type: string;
  conversion: number;
  target_conversion: number;
  sample_needed: number;
  /** null until `visits >= sample_needed`. */
  verdict: SmokeVerdict | null;
}

export interface WaitlistSignup {
  email: string;
  signed_up_at: string;
}

export async function listSmokeSignups(id: string): Promise<WaitlistSignup[]> {
  const res = await apiClient<{ data?: { signups?: WaitlistSignup[] } }>(
    `/validation/smoke-tests/${id}/signups`
  );
  return res?.data?.signups ?? [];
}

// --- Overview + "Design experiment" (PRD 09.1 / 09.6) -------------------------

export interface RiskiestAssumption {
  id: string;
  statement: string;
  risk: AssumptionRisk;
}

export interface ValidationOverview {
  assumptions: Record<AssumptionStatus, number>;
  live_experiments: number;
  responses_collected: number;
  /** null when nothing is untested: hide the nudge. */
  riskiest_untested: RiskiestAssumption | null;
}

export async function getValidationOverview(): Promise<ValidationOverview> {
  const res = await apiClient<{ data?: ValidationOverview }>('/validation/overview');
  const d = res?.data;
  return {
    assumptions: {
      untested: d?.assumptions?.untested ?? 0,
      testing: d?.assumptions?.testing ?? 0,
      validated: d?.assumptions?.validated ?? 0,
      invalidated: d?.assumptions?.invalidated ?? 0,
    },
    live_experiments: d?.live_experiments ?? 0,
    responses_collected: d?.responses_collected ?? 0,
    riskiest_untested: d?.riskiest_untested ?? null,
  };
}

/** What the experiment-draft job returns in `result.draft`. */
export interface ExperimentDraft {
  name: string;
  headline: string;
  subheadline: string;
  cta_text: string;
  metric_type: string;
  target_conversion: number;
  slug_suggestion: string;
  rationale: string;
  assumption_ids: string[];
}

export interface ExperimentDraftResult {
  status?: 'ready' | 'gone' | 'over_budget' | string;
  draft?: ExperimentDraft;
  assumption_id?: string;
}

export async function requestExperimentDraft(assumptionId: string): Promise<string> {
  const res = await apiClient<{ data?: { job_id?: string } }>(
    `/validation/assumptions/${assumptionId}/experiment-draft`,
    { method: 'POST' }
  );
  const id = res?.data?.job_id;
  if (!id) throw new Error('No job id returned.');
  return id;
}

// --- Deletes (200 {deleted: true}; 404 for unknown / other workspace) --------

export type DeletableKind = 'assumptions' | 'experiments' | 'interviews' | 'surveys';

export async function deleteValidationItem(kind: DeletableKind, id: string): Promise<void> {
  await apiClient(`/validation/${kind}/${id}`, { method: 'DELETE' });
}

export interface CreateExperimentBody {
  name: string;
  type: ExperimentType;
  config?: Record<string, unknown>;
  metrics?: Record<string, unknown>;
  assumption_ids?: string[];
}

export async function listExperiments(params?: {
  type?: ExperimentType;
  status?: ExperimentStatus;
}): Promise<RawExperiment[]> {
  const qs = new URLSearchParams();
  if (params?.type) qs.set('type', params.type);
  if (params?.status) qs.set('status', params.status);
  const q = qs.toString();
  const res = await apiClient<{ data?: { experiments?: RawExperiment[] } }>(
    `/validation/experiments${q ? `?${q}` : ''}`
  );
  return res?.data?.experiments ?? [];
}

export async function createExperiment(body: CreateExperimentBody): Promise<RawExperiment> {
  const res = await apiClient<{ data?: RawExperiment } | RawExperiment>('/validation/experiments', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return ((res as { data?: RawExperiment })?.data ?? res) as RawExperiment;
}

// Note: fields REPLACE (metrics are not merged) — send the full metrics object.
export async function updateExperiment(
  id: string,
  body: Partial<CreateExperimentBody> & { status?: ExperimentStatus }
): Promise<RawExperiment> {
  const res = await apiClient<{ data?: RawExperiment } | RawExperiment>(
    `/validation/experiments/${id}`,
    { method: 'PATCH', body: JSON.stringify(body) }
  );
  return ((res as { data?: RawExperiment })?.data ?? res) as RawExperiment;
}

export async function getSmokeTestStats(id: string): Promise<SmokeTestStats> {
  const res = await apiClient<{ data?: SmokeTestStats } | SmokeTestStats>(
    `/validation/smoke-tests/${id}/stats`
  );
  return ((res as { data?: SmokeTestStats })?.data ?? res) as SmokeTestStats;
}

// --- Surveys (guide §4 owner + §5 public) -----------------------------------

export type SurveyStatus = 'draft' | 'open' | 'closed';
export type QuestionType = 'choice' | 'scale' | 'nps' | 'open';

export interface SurveyQuestion {
  id?: string; // server-assigned; send back on edit so collected answers still match
  type: QuestionType;
  prompt: string;
  required?: boolean;
  options?: string[]; // `choice` only
}

export interface RawSurvey {
  id: string;
  title: string;
  status: SurveyStatus;
  questions: SurveyQuestion[];
  response_count: number;
  has_link: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface SurveyAnalyticsQuestion {
  id: string;
  type: QuestionType;
  prompt: string;
  answered: number;
  counts?: Record<string, number>;
  average?: number;
}

export interface RawSurveyAnalytics {
  survey_id: string;
  title: string;
  status: SurveyStatus;
  responses: number;
  completion_rate: number;
  questions: SurveyAnalyticsQuestion[];
}

export async function listSurveys(): Promise<RawSurvey[]> {
  const res = await apiClient<{ data?: { surveys?: RawSurvey[] } }>('/validation/surveys');
  return res?.data?.surveys ?? [];
}

export async function createSurvey(body: {
  title: string;
  questions: SurveyQuestion[];
}): Promise<RawSurvey> {
  const res = await apiClient<{ data?: RawSurvey } | RawSurvey>('/validation/surveys', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return ((res as { data?: RawSurvey })?.data ?? res) as RawSurvey;
}

/**
 * PATCH a survey. The response envelope carries `public_token` — returned
 * **exactly once**, the first time the survey is opened (null on every later
 * call; the raw value can't be recovered). Surface it immediately.
 */
export async function updateSurvey(
  id: string,
  body: { title?: string; questions?: SurveyQuestion[]; status?: SurveyStatus }
): Promise<{ survey: RawSurvey; public_token: string | null }> {
  const res = await apiClient<{ data?: { survey?: RawSurvey; public_token?: string | null } }>(
    `/validation/surveys/${id}`,
    { method: 'PATCH', body: JSON.stringify(body) }
  );
  const data = res?.data ?? {};
  return { survey: (data.survey ?? (res as unknown as RawSurvey)) as RawSurvey, public_token: data.public_token ?? null };
}

export async function getSurveyAnalytics(id: string): Promise<RawSurveyAnalytics> {
  const res = await apiClient<{ data?: RawSurveyAnalytics } | RawSurveyAnalytics>(
    `/validation/surveys/${id}/analytics`
  );
  return ((res as { data?: RawSurveyAnalytics })?.data ?? res) as RawSurveyAnalytics;
}

// --- Public survey routes (no auth; addressed by token) ---------------------

export interface PublicSurvey {
  title: string;
  questions: SurveyQuestion[];
}

export async function getPublicSurvey(token: string): Promise<PublicSurvey> {
  const res = await apiClient<{ data?: PublicSurvey } | PublicSurvey>(
    `/validation/surveys/${token}`
  );
  return ((res as { data?: PublicSurvey })?.data ?? res) as PublicSurvey;
}

export async function submitSurveyResponse(
  token: string,
  answers: Record<string, string | number>
): Promise<{ received: boolean }> {
  const res = await apiClient<{ data?: { received?: boolean } }>(
    `/validation/surveys/${token}/responses`,
    { method: 'POST', body: JSON.stringify({ answers }) }
  );
  return { received: Boolean(res?.data?.received) };
}
