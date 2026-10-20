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
  /** Experiments linked to this assumption; `[]` when none (slice c, guide §6). */
  linked_experiments?: LinkedExperiment[];
  created_at?: string;
  updated_at?: string;
}

export interface LinkedExperiment {
  id: string;
  name: string;
  type: string;
  status: string;
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

// --- Interview scripts (slice b, guide §1) -----------------------------------

export interface ScriptQuestion {
  /** 12-char hex, server-assigned. Absent on a question that was just added. */
  id?: string;
  question: string;
  tip: string;
}

export interface RawScript {
  id: string;
  title: string;
  assumption_ids: string[];
  questions: Array<ScriptQuestion & { id: string }>;
  created_at?: string;
  updated_at?: string;
}

export interface ScriptJobResult {
  status?: 'ready' | 'over_budget' | 'gone' | 'empty' | string;
  script_id?: string;
}

export async function listScripts(): Promise<RawScript[]> {
  const res = await apiClient<{ data?: { scripts?: RawScript[] } }>('/validation/scripts');
  return res?.data?.scripts ?? [];
}

export async function getScript(id: string): Promise<RawScript> {
  const res = await apiClient<{ data?: RawScript }>(`/validation/scripts/${id}`);
  return res?.data as RawScript;
}

export async function requestScriptGeneration(assumptionIds: string[]): Promise<string> {
  const res = await apiClient<{ data?: { job_id?: string } }>('/validation/scripts/generate', {
    method: 'POST',
    body: JSON.stringify({ assumption_ids: assumptionIds }),
  });
  const id = res?.data?.job_id;
  if (!id) throw new Error('No job id returned.');
  return id;
}

/** PATCH sends the whole question list in order; existing ids are kept so the server can match them. */
export async function updateScript(
  id: string,
  body: { title?: string; questions?: ScriptQuestion[]; assumption_ids?: string[] }
): Promise<RawScript> {
  const res = await apiClient<{ data?: RawScript }>(`/validation/scripts/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
  return res?.data as RawScript;
}

export async function deleteScript(id: string): Promise<void> {
  await apiClient(`/validation/scripts/${id}`, { method: 'DELETE' });
}

// --- Insight Synthesizer (slice b, guide §2) ---------------------------------

export type InsightSource = 'interviews' | 'surveys' | 'feedback' | 'all';

export interface InsightPattern {
  id: string;
  theme: string;
  summary: string;
  /** Can be `[]`: quotes the model paraphrased are dropped server-side. */
  quotes: string[];
}

export interface InsightContradiction {
  id: string;
  summary: string;
}

export interface InsightSuggestion {
  id: string;
  assumption_id: string;
  /** Snapshot from report time, not a lookup. */
  assumption_statement: string;
  from_status: AssumptionStatus;
  to_status: AssumptionStatus;
  reason: string;
  applied_at: string | null;
}

export interface RawInsight {
  id: string;
  source: InsightSource;
  inputs: { interviews?: number; open_answers?: number; feedback?: number };
  patterns: InsightPattern[];
  contradictions: InsightContradiction[];
  suggestions: InsightSuggestion[];
  created_at: string;
}

export interface InsightJobResult {
  status?: 'ready' | 'over_budget' | 'empty' | string;
  insight_id?: string;
}

export async function requestSynthesis(source: InsightSource): Promise<string> {
  const res = await apiClient<{ data?: { job_id?: string } }>('/validation/synthesize', {
    method: 'POST',
    body: JSON.stringify({ source }),
  });
  const id = res?.data?.job_id;
  if (!id) throw new Error('No job id returned.');
  return id;
}

export async function listInsights(): Promise<RawInsight[]> {
  const res = await apiClient<{ data?: { insights?: RawInsight[] } }>('/validation/insights');
  return res?.data?.insights ?? [];
}

export async function getInsight(id: string): Promise<RawInsight> {
  const res = await apiClient<{ data?: RawInsight }>(`/validation/insights/${id}`);
  return res?.data as RawInsight;
}

/** Apply returns two objects: the refreshed report and the moved assumption. */
export async function applySuggestion(
  insightId: string,
  suggestionId: string
): Promise<{ insight: RawInsight; assumption: RawAssumption }> {
  const res = await apiClient<{ data?: { insight: RawInsight; assumption: RawAssumption } }>(
    `/validation/insights/${insightId}/suggestions/${suggestionId}/apply`,
    { method: 'POST' }
  );
  return res?.data as { insight: RawInsight; assumption: RawAssumption };
}

export async function deleteInsight(id: string): Promise<void> {
  await apiClient(`/validation/insights/${id}`, { method: 'DELETE' });
}

// --- MVP feedback inbox (slice c, guide §1 to §3) -----------------------------

export type FeedbackSource = 'interview' | 'survey' | 'in_app' | 'email';
/** Sources a founder may type in by hand; `survey` is import-only. */
export type ManualFeedbackSource = Exclude<FeedbackSource, 'survey'>;

export interface FeedbackItem {
  id: string;
  source: FeedbackSource;
  text: string;
  origin: { type: 'interview' | 'survey' | 'manual'; id: string | null; label: string };
  imported: boolean;
  dismissed: boolean;
  received_on: string;
  created_at: string;
}

export type FeedbackCounts = Record<FeedbackSource, number>;

export async function listFeedback(params?: {
  source?: FeedbackSource;
  includeDismissed?: boolean;
}): Promise<{ items: FeedbackItem[]; counts: FeedbackCounts }> {
  const qs = new URLSearchParams();
  if (params?.source) qs.set('source', params.source);
  if (params?.includeDismissed) qs.set('include_dismissed', 'true');
  const q = qs.toString();
  const res = await apiClient<{ data?: { items?: FeedbackItem[]; counts?: Partial<FeedbackCounts> } }>(
    `/validation/feedback${q ? `?${q}` : ''}`
  );
  const c = res?.data?.counts ?? {};
  return {
    items: res?.data?.items ?? [],
    counts: { interview: c.interview ?? 0, survey: c.survey ?? 0, in_app: c.in_app ?? 0, email: c.email ?? 0 },
  };
}

export async function createFeedback(body: {
  text: string;
  source: ManualFeedbackSource;
  received_on?: string;
}): Promise<FeedbackItem> {
  const res = await apiClient<{ data?: FeedbackItem }>('/validation/feedback', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return res?.data as FeedbackItem;
}

export async function updateFeedback(
  id: string,
  body: { text?: string; source?: ManualFeedbackSource; received_on?: string }
): Promise<FeedbackItem> {
  const res = await apiClient<{ data?: FeedbackItem }>(`/validation/feedback/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
  return res?.data as FeedbackItem;
}

/** Manual items are deleted for good; imported ones are only dismissed. Branch on the key (guide §7). */
export async function deleteFeedback(id: string): Promise<'deleted' | 'dismissed'> {
  const res = await apiClient<{ data?: { deleted?: boolean; dismissed?: boolean } }>(`/validation/feedback/${id}`, {
    method: 'DELETE',
  });
  return res?.data?.dismissed ? 'dismissed' : 'deleted';
}

export async function restoreFeedback(id: string): Promise<FeedbackItem> {
  const res = await apiClient<{ data?: FeedbackItem }>(`/validation/feedback/${id}/restore`, { method: 'POST' });
  return res?.data as FeedbackItem;
}

export interface FeedbackTheme {
  id: string;
  theme: string;
  /** PRD copy, counts included: "{theme} mentioned {n}× across {m} sources". */
  label: string;
  summary: string;
  mention_count: number;
  source_count: number;
  sources: FeedbackSource[];
  items: FeedbackItem[];
  roadmap_task_id: string | null;
  sent_at: string | null;
}

export interface FeedbackThemes {
  run: { id: string; item_count: number; created_at: string } | null;
  themes: FeedbackTheme[];
}

export interface ClusterJobResult {
  status?: 'ready' | 'over_budget' | 'empty' | string;
  run_id?: string;
}

export async function requestFeedbackClustering(): Promise<string> {
  const res = await apiClient<{ data?: { job_id?: string } }>('/validation/feedback/cluster', { method: 'POST' });
  const id = res?.data?.job_id;
  if (!id) throw new Error('No job id returned.');
  return id;
}

export async function getFeedbackThemes(): Promise<FeedbackThemes> {
  const res = await apiClient<{ data?: Partial<FeedbackThemes> }>('/validation/feedback/themes');
  return { run: res?.data?.run ?? null, themes: res?.data?.themes ?? [] };
}

export interface SentTask {
  id: string;
  milestone_id: string;
  milestone_title: string;
  title: string;
  description: string;
  status: string;
}

export async function sendThemeToRoadmap(
  themeId: string,
  milestoneId?: string
): Promise<{ theme: FeedbackTheme; task: SentTask }> {
  const res = await apiClient<{ data?: { theme: FeedbackTheme; task: SentTask } }>(
    `/validation/feedback/themes/${themeId}/send-to-roadmap`,
    { method: 'POST', body: JSON.stringify(milestoneId ? { milestone_id: milestoneId } : {}) }
  );
  return res?.data as { theme: FeedbackTheme; task: SentTask };
}

export interface RoadmapMilestoneOption {
  id: string;
  title: string;
  done: boolean;
  /** Ids of the tasks already inside it, to name the milestone a sent theme landed in. */
  taskIds: string[];
}

/** Milestones in roadmap order (phase order, then milestone order), for the Send-to-roadmap picker. */
export async function listRoadmapMilestones(): Promise<RoadmapMilestoneOption[]> {
  type Tree = {
    phases?: Array<{
      order?: number;
      milestones?: Array<{ id: string; title: string; status: string; order?: number; tasks?: Array<{ id: string }> }>;
    }>;
  };
  const res = await apiClient<{ data?: Tree }>('/roadmap');
  const phases = [...(res?.data?.phases ?? [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  return phases.flatMap((p) =>
    [...(p.milestones ?? [])]
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map((m) => ({ id: m.id, title: m.title, done: m.status === 'done', taskIds: (m.tasks ?? []).map((t) => t.id) }))
  );
}

// --- Survey open answers + share-link rotation (slice c, guide §5) --------------

export interface SurveyAnswersQuestion {
  id: string;
  prompt: string;
  answer_count: number;
  answers: Array<{ text: string; submitted_at: string }>;
}

export interface SurveyAnswers {
  survey_id: string;
  title: string;
  questions: SurveyAnswersQuestion[];
}

export async function getSurveyAnswers(id: string): Promise<SurveyAnswers> {
  const res = await apiClient<{ data?: SurveyAnswers }>(`/validation/surveys/${id}/answers`);
  return res?.data as SurveyAnswers;
}

/** Issues a new token and kills the old link. The token is shown once. */
export async function rotateSurveyShareLink(id: string): Promise<string> {
  const res = await apiClient<{ data?: { public_token?: string } }>(`/validation/surveys/${id}/share-link`, {
    method: 'POST',
  });
  const t = res?.data?.public_token;
  if (!t) throw new Error('No share link returned.');
  return t;
}
