import { apiClient, apiClientWithStatus, ApiError } from './client';
import { uploadFile } from './documents';

// Investor Readiness (BE module 15, slices A to D). Shapes are copied from the live-captured guide
// cofoundaz-api/docs/fe-integration-guide-investor-readiness.md. Two shapes are from the BE source,
// not a capture, and are labelled where they appear (QaTrend, Dimension.score null).
// Founder: everything. Team member: reads score, history, deck, narrative and Q&A summaries (no
// transcripts), never writes. Every other role gets 403.

interface Envelope<T> {
  data: T;
  meta?: unknown;
}

const json = (body: unknown): RequestInit['body'] => JSON.stringify(body);

// ---------------------------------------------------------------- errors

export interface ReadinessError {
  status: number;
  code: string | null;
  message: string;
  fieldErrors: Record<string, string>;
  forbidden: boolean;
}

export function readinessError(err: unknown, fallback: string): ReadinessError {
  if (err instanceof ApiError) {
    const body = (err.data as { error?: { code?: string; message?: string; field_errors?: { field: string; message: string }[] } } | null)?.error;
    const fieldErrors: Record<string, string> = {};
    for (const f of body?.field_errors ?? []) fieldErrors[f.field] = f.message;
    return {
      status: err.status,
      code: body?.code ?? null,
      message: body?.message || fallback,
      fieldErrors,
      forbidden: err.status === 403,
    };
  }
  return { status: 0, code: null, message: fallback, fieldErrors: {}, forbidden: false };
}

// ---------------------------------------------------------------- score

export type Band = 'not_yet' | 'getting_close' | 'ready';
export type DimensionKey = 'team' | 'traction' | 'market' | 'product' | 'financials' | 'story';

export interface Signal {
  key: string;
  href: string;
  /** null once the signal reaches its target. */
  note: string | null;
  /** count | % | months | NGN | events | step | /5 ... Never show `step` values. */
  unit: string;
  label: string;
  score: number;
  value: number;
  target: number;
}

export interface Dimension {
  key: DimensionKey;
  label: string;
  /** null = nothing can be judged yet ("Not enough data yet"). From the serializer, not a live capture. */
  score: number | null;
  weight: number;
  signals: Signal[];
}

export interface MustHave {
  key: string;
  met: boolean;
  href: string;
  label: string;
  reason: string | null;
}

export interface Gap {
  href: string;
  lift: number;
  note: string;
  dimension: DimensionKey;
  signal_key: string;
}

export interface ReadinessScore {
  score: number;
  band: Band;
  verdict: string;
  ready: boolean;
  capped: boolean;
  raw_score: number;
  dimensions: Dimension[];
  must_haves: MustHave[];
  gaps: Gap[];
  computed_at: string;
  config_version: number;
}

export async function getScore(): Promise<ReadinessScore> {
  return (await apiClient<Envelope<ReadinessScore>>('/readiness/score')).data;
}

export async function recomputeScore(): Promise<ReadinessScore> {
  return (await apiClient<Envelope<ReadinessScore>>('/readiness/score/recompute', { method: 'POST' })).data;
}

// ---------------------------------------------------------------- history

export type HistoryRange = 30 | 90 | 365;

export interface HistoryPoint {
  at: string;
  score: number;
  band: Band;
  capped: boolean;
  dimensions: Record<DimensionKey, number>;
}

export interface HistoryMarker {
  at: string;
  label: string;
}

export type LogEntry =
  | { type: 'deck_review'; at: string; id: string; version: number; overall: number | null }
  | {
      type: 'qa_session';
      at: string;
      id: string;
      focus: QaFocus;
      intensity: QaIntensity;
      duration_minutes: number | null;
      rating: QaRating;
      rating_label: string;
      average: number;
    }
  | { type: 'narrative_check'; at: string; id: string; counts: FindingCounts };

export interface ReadinessHistory {
  range: number;
  points: HistoryPoint[];
  markers: HistoryMarker[];
  log: LogEntry[];
}

export async function getHistory(range: HistoryRange): Promise<ReadinessHistory> {
  return (await apiClient<Envelope<ReadinessHistory>>(`/readiness/history?range=${range}`)).data;
}

// ---------------------------------------------------------------- market size inputs

export interface MarketInputs {
  tam_minor: number | null;
  sam_minor: number | null;
  som_minor: number | null;
  currency: 'NGN' | 'USD';
  source_url: string | null;
}

export async function getInputs(): Promise<MarketInputs> {
  return (await apiClient<Envelope<MarketInputs>>('/readiness/inputs')).data;
}

/** Partial update: send only what changed. */
export async function putInputs(patch: Partial<MarketInputs>): Promise<MarketInputs> {
  return (await apiClient<Envelope<MarketInputs>>('/readiness/inputs', { method: 'PUT', body: json(patch) })).data;
}

// ---------------------------------------------------------------- deck review

export type ReviewStatus = 'queued' | 'running' | 'ready' | 'failed';
export type DeckError =
  | 'no_text'
  | 'unreadable'
  | 'file_missing'
  | 'over_budget'
  | 'generation_failed'
  | 'job_failed';

export interface DeckScores {
  design: number;
  layout: {
    slides: number;
    dense_slides: number;
    near_empty_slides: number;
    slides_with_images: number;
    avg_words_per_slide: number;
  };
  overall: number;
  narrative: number;
  data_clarity: number;
}

export interface DeckReviewSummary {
  id: string;
  version: number;
  status: ReviewStatus;
  error: DeckError | null;
  filename: string;
  slide_count: number | null;
  scores: DeckScores | null;
  job_id: string | null;
  created_at: string;
  reviewed_at: string | null;
}

export interface DeckSlide {
  n: number;
  title: string;
  notes: string;
  words: number;
  images: number;
  /** Signed, short-lived link (no auth header); null for a slide that could not be rendered. */
  thumbnail_url: string | null;
}

export interface DeckReview extends DeckReviewSummary {
  top_fixes: string[];
  slides: DeckSlide[];
  thumbnail_ttl_seconds: number;
}

export async function listDeckReviews(): Promise<DeckReviewSummary[]> {
  return (await apiClient<Envelope<{ reviews: DeckReviewSummary[] }>>('/readiness/deck-reviews')).data.reviews;
}

export async function getDeckReview(id: string): Promise<DeckReview> {
  return (await apiClient<Envelope<DeckReview>>(`/readiness/deck-reviews/${encodeURIComponent(id)}`)).data;
}

export interface StartedDeckReview {
  review: DeckReviewSummary;
  /** true (HTTP 200): the same bytes were already reviewed; nothing was queued or spent. */
  deduplicated: boolean;
}

export async function startDeckReview(fileId: string): Promise<StartedDeckReview> {
  const res = await apiClientWithStatus<Envelope<StartedDeckReview>>('/readiness/deck-reviews', {
    method: 'POST',
    body: json({ file_id: fileId }),
  });
  return res.data.data;
}

/** Upload the PDF through Documents, then start the review. */
export async function uploadAndReviewDeck(file: File): Promise<StartedDeckReview> {
  const uploaded = await uploadFile(file);
  return startDeckReview(uploaded.id);
}

// ---------------------------------------------------------------- mock Q&A

export type QaFocus = 'general' | 'financials' | 'market' | 'team';
export type QaIntensity = 'friendly_angel' | 'skeptical_vc' | 'term_sheet_grilling';
export type QaRating = 'needs_work' | 'good' | 'strong';
export type QaStatus = 'active' | 'ending' | 'scored' | 'failed' | 'abandoned';
export type QaError = 'over_budget' | 'generation_failed' | 'transcript_gone' | 'job_failed';

export interface QaSessionSummary {
  id: string;
  focus: QaFocus;
  intensity: QaIntensity;
  status: QaStatus;
  error: QaError | null;
  turns: number;
  max_answers: number;
  rating: QaRating | null;
  rating_label: string | null;
  average: number | null;
  job_id: string | null;
  started_at: string;
  ended_at: string | null;
  duration_minutes: number | null;
}

export interface TranscriptEntry {
  at: string;
  role: 'investor' | 'founder';
  text: string;
}

export interface QaAnswer {
  i: number;
  /** The text fields are absent once the scorecard is purged (text_purged). */
  answer?: string;
  rating: number;
  feedback?: string;
  question?: string;
}

/** Shape from BE source (services/readiness/qa.py), not a live capture. null for the first scored session. */
export interface QaTrend {
  previous_average: number;
  change: number;
  sessions_compared: number;
}

export interface QaScorecard {
  trend: QaTrend | null;
  rating: QaRating;
  rating_label?: string;
  average: number;
  answers: QaAnswer[];
  strongest: QaAnswer | null;
  /** model_answer is null whenever the suggestion was written for a different answer: hide the block. */
  weakest: (QaAnswer & { model_answer?: string | null }) | null;
  text_purged?: boolean;
}

/** Founder's full view. A team member's response has none of transcript / scorecard. */
export interface QaSession extends QaSessionSummary {
  transcript?: TranscriptEntry[];
  transcript_purged?: boolean;
  scorecard?: QaScorecard | null;
}

export async function listQaSessions(): Promise<QaSessionSummary[]> {
  return (await apiClient<Envelope<{ sessions: QaSessionSummary[] }>>('/readiness/qa-sessions')).data.sessions;
}

export async function getQaSession(id: string): Promise<QaSession> {
  return (await apiClient<Envelope<QaSession>>(`/readiness/qa-sessions/${encodeURIComponent(id)}`)).data;
}

export async function startQaSession(focus: QaFocus, intensity: QaIntensity): Promise<{ session: QaSession; reply: string }> {
  return (
    await apiClient<Envelope<{ session: QaSession; reply: string }>>('/readiness/qa-sessions', {
      method: 'POST',
      body: json({ focus, intensity }),
    })
  ).data;
}

export interface AnswerResult {
  session: QaSessionSummary;
  /** null on the 10th answer (the session ends and starts scoring by itself). */
  reply: string | null;
  ended: boolean;
}

export async function answerQaSession(id: string, content: string, expectedTurn: number): Promise<AnswerResult> {
  return (
    await apiClient<Envelope<AnswerResult>>(`/readiness/qa-sessions/${encodeURIComponent(id)}/messages`, {
      method: 'POST',
      body: json({ content, expected_turn: expectedTurn }),
    })
  ).data;
}

/** Ends early and starts scoring. On a failed session with a kept transcript it re-queues scoring. */
export async function endQaSession(id: string): Promise<QaSessionSummary> {
  return (
    await apiClient<Envelope<{ session: QaSessionSummary }>>(`/readiness/qa-sessions/${encodeURIComponent(id)}/end`, {
      method: 'POST',
    })
  ).data.session;
}

// ---------------------------------------------------------------- narrative

export interface NarrativeDraft {
  body: string;
  chars: number;
  max_chars: number;
  draft_sha256: string | null;
  updated_at: string | null;
  updated_by_id: string | null;
  has_reviewed_deck: boolean;
  can_check: boolean;
}

export type CheckStatus = 'queued' | 'running' | 'ready' | 'failed';
export type CheckError =
  | 'over_budget'
  | 'generation_failed'
  | 'processing_failed'
  | 'nothing_to_check'
  | 'job_failed'
  | 'deck_unavailable';
export type Severity = 'high' | 'medium' | 'info' | 'ok';
export type FindingKind = 'inconsistent' | 'mismatch' | 'match' | 'unverified';

export interface FindingCounts {
  high: number;
  medium: number;
  info: number;
  ok: number;
}

export interface NarrativeClaim {
  unit: string;
  quote: string;
  slide: number | null;
  value: number;
  metric: string;
  source: 'deck' | 'draft';
  currency: string | null;
}

export interface NarrativeFact {
  says: string;
  unit: string;
  value: number;
  source: 'books' | 'model' | 'team' | 'funding';
  currency: string | null;
}

export interface Finding {
  kind: FindingKind;
  metric: string;
  severity: Severity;
  /** Final copy: render verbatim. */
  message: string;
  claim: NarrativeClaim;
  /** null on `inconsistent`, and on `unverified` with no figure. */
  fact: NarrativeFact | null;
  /** Only on `inconsistent`: the deck's claim (claim is the narrative's). */
  other_claim?: NarrativeClaim;
}

export interface UseOfFunds {
  label: string;
  quote: string;
  source: 'deck' | 'draft';
  percent: number | null;
  amount_minor: number | null;
}

export interface NarrativeCheck {
  id: string;
  status: CheckStatus;
  error: CheckError | null;
  job_id: string | null;
  deck_review_id: string | null;
  draft_sha256: string | null;
  tokens_used: number;
  counts: FindingCounts;
  findings: Finding[];
  claims: NarrativeClaim[];
  use_of_funds: UseOfFunds[];
  facts: Record<string, NarrativeFact>;
  stale: boolean;
  created_at: string;
  checked_at: string | null;
}

export type CheckOutcome = 'queued' | 'in_progress' | 'reused';

export async function getNarrative(): Promise<NarrativeDraft> {
  return (await apiClient<Envelope<NarrativeDraft>>('/readiness/narrative')).data;
}

/** Whole text every time; last write wins. */
export async function putNarrative(body: string): Promise<NarrativeDraft> {
  return (await apiClient<Envelope<NarrativeDraft>>('/readiness/narrative', { method: 'PUT', body: json({ body }) })).data;
}

export async function runNarrativeCheck(): Promise<{ check: NarrativeCheck; outcome: CheckOutcome }> {
  return (await apiClient<Envelope<{ check: NarrativeCheck; outcome: CheckOutcome }>>('/readiness/narrative/check', { method: 'POST' })).data;
}

export async function getLatestCheck(): Promise<NarrativeCheck | null> {
  return (await apiClient<Envelope<{ check: NarrativeCheck | null }>>('/readiness/narrative/checks/latest')).data.check;
}
