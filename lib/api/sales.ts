import { API_BASE, ApiError, apiClient } from './client';
import { fieldErrorsOf, formatCac, isForbiddenError, isUuid } from './marketing';

// Typed client for the Sales CRM backend (Module 11, slice A), /api/v1/sales/*.
// Shapes are copied from the live-captured guide
// cofoundaz-api/docs/fe-integration-guide-sales-crm.md. Every function unwraps the
// `{data, meta}` envelope. Access is founder / team_member only; every other role
// gets 403 FORBIDDEN (`isForbiddenError`). Money is integer kobo, currency NGN.

export { fieldErrorsOf, isForbiddenError, isUuid };

/**
 * Kobo as naira with two decimals ("₦250,000.50"), through Marketing's own two-decimal
 * formatter so both hubs agree. A deal value is a price, so "₦250,000.5" would read wrong.
 */
export const formatMoney: (minor: number | null | undefined) => string = formatCac;

// ---------------------------------------------------------------- enums

export type StageKind = 'open' | 'won' | 'lost';
export const LEAD_STATUSES = ['new', 'working', 'qualified', 'disqualified'] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number] | 'converted';
export type LeadSource = 'manual' | 'csv' | 'referral' | 'inbound' | 'event' | 'other';
export const LEAD_SOURCES: LeadSource[] = ['manual', 'referral', 'inbound', 'event', 'other'];
export type ActivityKind = 'call' | 'email' | 'meeting' | 'note';
export const ACTIVITY_KINDS: ActivityKind[] = ['note', 'call', 'email', 'meeting'];
export type ClosedReason = 'price' | 'timing' | 'competitor' | 'no_budget' | 'ghosted' | 'other';
export const CLOSED_REASONS: { value: ClosedReason; label: string }[] = [
  { value: 'price', label: 'Price' },
  { value: 'timing', label: 'Timing' },
  { value: 'competitor', label: 'Competitor' },
  { value: 'no_budget', label: 'No budget' },
  { value: 'ghosted', label: 'Ghosted' },
  { value: 'other', label: 'Other' },
];

export const MAX_STAGES = 10;

// ---------------------------------------------------------------- shapes

export interface Stage {
  id: string;
  name: string;
  position: number;
  kind: StageKind;
  win_probability: number;
}

/** A stage sent to PUT /sales/stages. A new stage has no `id`. */
export interface StageInput {
  id?: string;
  name: string;
  kind: StageKind;
  win_probability: number;
}

export interface OverviewStage {
  /** Note: `stage_id` here, `id` on the stage list. */
  stage_id: string;
  name: string;
  kind: StageKind;
  deal_count: number;
  value_minor: number;
}

export interface SalesOverview {
  total_pipeline_minor: number;
  weighted_forecast_minor: number;
  /** Percent, one decimal; null until at least one deal is closed. */
  win_rate: number | null;
  currency: string;
  stages: OverviewStage[];
}

export interface Deal {
  id: string;
  name: string;
  account_id: string | null;
  account_name: string | null;
  contact_id: string | null;
  contact_name: string | null;
  value_minor: number;
  currency: string;
  stage_id: string;
  next_step: string | null;
  /** Plain date, YYYY-MM-DD. */
  next_step_due: string | null;
  closed_reason: ClosedReason | null;
  closed_note: string | null;
  closed_at: string | null;
  owner_id: string | null;
  last_activity_at: string;
  is_stalled: boolean;
  days_inactive: number;
  created_at: string;
}

export interface StageChange {
  id: string;
  from_stage_id: string | null;
  from_stage_name: string | null;
  to_stage_id: string;
  to_stage_name: string;
  changed_by: string | null;
  changed_at: string;
}

/** Only the single-deal GET and the stage-move response carry `stage_history`. */
export interface DealDetail extends Deal {
  stage_history: StageChange[];
}

export interface DealInput {
  name: string;
  account_id?: string | null;
  contact_id?: string | null;
  value_minor?: number;
  stage_id?: string;
  next_step?: string | null;
  next_step_due?: string | null;
  owner_id?: string | null;
}
export type DealPatch = Partial<Omit<DealInput, 'stage_id'>>;

export interface Lead {
  id: string;
  name: string | null;
  company: string | null;
  email: string | null;
  source: LeadSource;
  status: LeadStatus;
  owner_id: string | null;
  converted_deal_id: string | null;
  converted_contact_id: string | null;
  converted_account_id: string | null;
  created_at: string;
}

export interface LeadInput {
  name?: string | null;
  company?: string | null;
  email?: string | null;
  source?: LeadSource;
  status?: Exclude<LeadStatus, 'converted'>;
  owner_id?: string | null;
}
export type LeadPatch = LeadInput;

export interface Account {
  id: string;
  name: string;
  website: string | null;
  industry: string | null;
  description: string | null;
  owner_id: string | null;
  created_at: string;
}

export interface AccountInput {
  name: string;
  website?: string | null;
  industry?: string | null;
  description?: string | null;
  owner_id?: string | null;
}
export type AccountPatch = Partial<AccountInput>;

export interface Contact {
  id: string;
  account_id: string | null;
  first_name: string;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  title: string | null;
  created_at: string;
}

export interface ContactInput {
  first_name: string;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
  title?: string | null;
  account_id?: string | null;
}
export type ContactPatch = Partial<ContactInput>;

export interface AccountDetail {
  account: Account;
  contacts: Contact[];
  /** Deal fields without `stage_history`. */
  open_deals: Deal[];
  lifetime_won_minor: number;
}

export interface Activity {
  id: string;
  kind: ActivityKind;
  body: string;
  occurred_at: string;
  author_id: string | null;
  account_id: string | null;
  contact_id: string | null;
  deal_id: string | null;
  created_at: string;
}

export interface ActivityInput {
  kind: ActivityKind;
  body: string;
  occurred_at?: string;
  account_id?: string | null;
  contact_id?: string | null;
  deal_id?: string | null;
}

export interface Page<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

export interface ConvertResult {
  deal: Deal;
  /** Null when the lead had no company. */
  account: Account | null;
  contact: Contact;
}

export interface ImportPreview {
  upload_id: string;
  headers: string[];
  sample_rows: string[][];
  /** Lead field -> the file's own header text, or null when nothing matched. */
  suggested_mapping: Record<string, string | null>;
  row_count: number;
}

/** The lead fields a CSV column can be mapped to. `source` is not offered: every imported lead is `csv`. */
export const IMPORT_FIELDS = [
  { key: 'name', label: 'Name' },
  { key: 'company', label: 'Company' },
  { key: 'email', label: 'Email' },
] as const;
export type ImportField = (typeof IMPORT_FIELDS)[number]['key'];

export interface ImportResult {
  added: number;
  duplicates_skipped: number;
  invalid_rows: { row: number; error: string }[];
  invalid_total: number;
}

// ---------------------------------------------------------------- errors

interface ErrorBody {
  error?: { code?: string; message?: string; field_errors?: { field: string; message: string }[] };
}

function errorBody(err: unknown): ErrorBody['error'] | undefined {
  if (!(err instanceof ApiError)) return undefined;
  const data = err.data as ErrorBody | string | null;
  return data && typeof data === 'object' ? data.error : undefined;
}

/** 404 NOT_FOUND: unknown id, an id from another workspace, or an expired CSV upload. */
export function isNotFoundError(err: unknown): boolean {
  return err instanceof ApiError && err.status === 404;
}

/**
 * The API's own message. For 422s the specific field message wins (the generic
 * "Please check the highlighted fields." has the real text only in field_errors,
 * sometimes prefixed with "Value error, ").
 */
export function salesErrorMessage(err: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (err instanceof ApiError) {
    if (isForbiddenError(err)) return 'Sales is not available for your role.';
    const body = errorBody(err);
    const first = body?.field_errors?.[0]?.message;
    if (err.status === 422 && first) return first.replace(/^Value error,\s*/, '');
    if (body?.message) return body.message;
    if (first) return first.replace(/^Value error,\s*/, '');
    return fallback;
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

/** field -> message, with the pydantic "Value error, " prefix removed. */
export function salesFieldErrors(err: unknown): Record<string, string> {
  const raw = fieldErrorsOf(err);
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw)) out[k] = v.replace(/^Value error,\s*/, '');
  return out;
}

// ---------------------------------------------------------------- transport

interface Envelope<T> {
  data: T;
  meta?: unknown;
}

const BASE = '/sales';

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await apiClient<Envelope<T>>(`${BASE}${path}`, init);
  return res.data;
}

const json = (method: string, body?: unknown): RequestInit => ({
  method,
  ...(body === undefined ? {} : { body: JSON.stringify(body) }),
});

function qs(params: Record<string, string | number | boolean | null | undefined>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '') continue;
    sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : '';
}

const id = encodeURIComponent;

// ---------------------------------------------------------------- overview + stages

export const getOverview = () => call<SalesOverview>('');
export const getStages = () => call<Stage[]>('/stages');
export const saveStages = (stages: StageInput[]) => call<Stage[]>('/stages', json('PUT', { stages }));

// ---------------------------------------------------------------- deals

export interface DealQuery {
  stage_id?: string;
  account_id?: string;
  owner_id?: string;
  q?: string;
  open_only?: boolean;
  limit?: number;
  offset?: number;
}

export const listDeals = (query: DealQuery = {}) => call<Page<Deal>>(`/deals${qs({ ...query })}`);
export const getDeal = (dealId: string) => call<DealDetail>(`/deals/${id(dealId)}`);
export const createDeal = (input: DealInput) => call<Deal>('/deals', json('POST', input));
export const updateDeal = (dealId: string, patch: DealPatch) => call<Deal>(`/deals/${id(dealId)}`, json('PATCH', patch));
export const deleteDeal = (dealId: string) => call<{ deleted: boolean }>(`/deals/${id(dealId)}`, json('DELETE'));
export const moveDeal = (dealId: string, stageId: string, lost?: { closed_reason: ClosedReason; closed_note?: string | null }) =>
  call<DealDetail>(`/deals/${id(dealId)}/stage`, json('POST', { stage_id: stageId, ...lost }));

/** Every deal for the board. The API caps a page at 200, so follow `total` (bounded). */
export async function listAllDeals(): Promise<Deal[]> {
  const out: Deal[] = [];
  for (let page = 0; page < 10; page++) {
    const res = await listDeals({ limit: 200, offset: out.length });
    out.push(...res.items);
    if (out.length >= res.total || res.items.length === 0) break;
  }
  return out;
}

// ---------------------------------------------------------------- leads

export interface LeadQuery {
  status?: LeadStatus;
  source?: LeadSource;
  owner_id?: string;
  q?: string;
  limit?: number;
  offset?: number;
}

export const listLeads = (query: LeadQuery = {}) => call<Page<Lead>>(`/leads${qs({ ...query })}`);
export const getLead = (leadId: string) => call<Lead>(`/leads/${id(leadId)}`);
export const createLead = (input: LeadInput) => call<Lead>('/leads', json('POST', input));
export const updateLead = (leadId: string, patch: LeadPatch) => call<Lead>(`/leads/${id(leadId)}`, json('PATCH', patch));
export const deleteLead = (leadId: string) => call<{ deleted: boolean }>(`/leads/${id(leadId)}`, json('DELETE'));
export const convertLead = (leadId: string) => call<ConvertResult>(`/leads/${id(leadId)}/convert`, json('POST'));

export function previewLeadImport(file: File): Promise<ImportPreview> {
  const body = new FormData();
  body.append('file', file);
  return call<ImportPreview>('/leads/import/preview', { method: 'POST', body });
}

export const commitLeadImport = (uploadId: string, mapping: Partial<Record<ImportField, string>>) =>
  call<ImportResult>('/leads/import', json('POST', { upload_id: uploadId, mapping }));

// ---------------------------------------------------------------- accounts + contacts

export interface AccountQuery {
  q?: string;
  owner_id?: string;
  limit?: number;
  offset?: number;
}

export const listAccounts = (query: AccountQuery = {}) => call<Page<Account>>(`/accounts${qs({ ...query })}`);
export const getAccount = (accountId: string) => call<AccountDetail>(`/accounts/${id(accountId)}`);
export const createAccount = (input: AccountInput) => call<Account>('/accounts', json('POST', input));
export const updateAccount = (accountId: string, patch: AccountPatch) =>
  call<Account>(`/accounts/${id(accountId)}`, json('PATCH', patch));
export const deleteAccount = (accountId: string) =>
  call<{ deleted: boolean }>(`/accounts/${id(accountId)}`, json('DELETE'));

export interface ContactQuery {
  account_id?: string;
  q?: string;
  limit?: number;
  offset?: number;
}

export const listContacts = (query: ContactQuery = {}) => call<Page<Contact>>(`/contacts${qs({ ...query })}`);
export const getContact = (contactId: string) => call<Contact>(`/contacts/${id(contactId)}`);
export const createContact = (input: ContactInput) => call<Contact>('/contacts', json('POST', input));
export const updateContact = (contactId: string, patch: ContactPatch) =>
  call<Contact>(`/contacts/${id(contactId)}`, json('PATCH', patch));
export const deleteContact = (contactId: string) =>
  call<{ deleted: boolean }>(`/contacts/${id(contactId)}`, json('DELETE'));

// ---------------------------------------------------------------- activities

/** At least one of the three ids is required: the API answers 422 without one. */
export interface ActivityQuery {
  account_id?: string;
  contact_id?: string;
  deal_id?: string;
  limit?: number;
  offset?: number;
}

export const listActivities = (query: ActivityQuery) => call<Page<Activity>>(`/activities${qs({ ...query })}`);
export const createActivity = (input: ActivityInput) => call<Activity>('/activities', json('POST', input));
export const deleteActivity = (activityId: string) =>
  call<{ deleted: boolean }>(`/activities/${id(activityId)}`, json('DELETE'));

// ---------------------------------------------------------------- pure helpers

/** Naira the user typed ("2,500.50") to integer kobo; null when it is not a non-negative amount. */
export function nairaToKobo(input: string): number | null {
  const cleaned = input.replace(/[₦,\s]/g, '');
  if (cleaned === '') return 0;
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  const [whole, frac = ''] = cleaned.split('.');
  return Number(whole) * 100 + Number(frac.padEnd(2, '0'));
}

/** Kobo to the plain number shown in an amount input ("2500.5" for 250050). */
export function koboToNairaInput(minor: number): string {
  if (!minor) return '';
  const whole = Math.floor(minor / 100);
  const frac = minor % 100;
  return frac === 0 ? String(whole) : `${whole}.${String(frac).padStart(2, '0')}`;
}

/** "Ada Obi" from a contact; first name alone when there is no last name. */
export function contactName(c: Pick<Contact, 'first_name' | 'last_name'>): string {
  return [c.first_name, c.last_name].filter(Boolean).join(' ');
}

/** Lead display: the person, else the company. */
export function leadTitle(l: Pick<Lead, 'name' | 'company'>): string {
  return l.name?.trim() || l.company?.trim() || 'Unnamed lead';
}

export const LEAD_SOURCE_LABELS: Record<LeadSource, string> = {
  manual: 'Manual',
  csv: 'CSV import',
  referral: 'Referral',
  inbound: 'Inbound',
  event: 'Event',
  other: 'Other',
};

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: 'New',
  working: 'Working',
  qualified: 'Qualified',
  disqualified: 'Disqualified',
  converted: 'Converted',
};

export const ACTIVITY_KIND_LABELS: Record<ActivityKind, string> = {
  note: 'Note',
  call: 'Call',
  email: 'Email',
  meeting: 'Meeting',
};

/** The toast after a CSV commit: "{added} added, {n} duplicates skipped" (+ invalid count when any). */
export function importSummary(r: ImportResult): string {
  const dup = r.duplicates_skipped;
  const base = `${r.added} added, ${dup} duplicate${dup === 1 ? '' : 's'} skipped`;
  return r.invalid_total > 0 ? `${base}, ${r.invalid_total} invalid` : base;
}

/** Whole days from today (local) until a YYYY-MM-DD date; negative when past. */
export function daysUntil(date: string, now: Date = new Date()): number {
  const [y, m, d] = date.split('-').map(Number);
  const target = Date.UTC(y, m - 1, d);
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((target - today) / 86_400_000);
}

/** "Today", "Tomorrow", "Yesterday", "in 3 days", "5 days ago" for a next-step date. */
export function dueLabel(date: string, now: Date = new Date()): string {
  const n = daysUntil(date, now);
  if (n === 0) return 'Today';
  if (n === 1) return 'Tomorrow';
  if (n === -1) return 'Yesterday';
  return n > 0 ? `in ${n} days` : `${-n} days ago`;
}

/** A next step is overdue once its date is before today and the deal is still open. */
export function isOverdue(date: string | null, now: Date = new Date()): boolean {
  return date !== null && daysUntil(date, now) < 0;
}

/** Stages the editor submits, from the stage list. */
export function toStageInputs(stages: Stage[]): StageInput[] {
  return stages.map((s) => ({ id: s.id, name: s.name, kind: s.kind, win_probability: s.win_probability }));
}

/** A website is only made a link when it parses as http or https; anything else is shown as plain text. */
export function safeWebsiteHref(website: string | null | undefined): string | null {
  if (!website) return null;
  try {
    const u = new URL(website);
    return u.protocol === 'http:' || u.protocol === 'https:' ? u.href : null;
  } catch {
    return null;
  }
}

// ================================================================ Coach, call prep, analytics (slice C)
// Shapes copied from cofoundaz-api/docs/fe-integration-guide-sales-coach-analytics.md (live captures).
// Everything the AI writes is asynchronous: the POST answers at once with a `generating` / `scoring`
// row and the page polls the GET. Over the daily AI budget is not an HTTP error: the row ends `failed`.

export type CoachDifficulty = 'friendly' | 'neutral' | 'tough';
export const COACH_DIFFICULTIES: { value: CoachDifficulty; label: string }[] = [
  { value: 'friendly', label: 'Friendly' },
  { value: 'neutral', label: 'Neutral' },
  { value: 'tough', label: 'Tough' },
];
export const COACH_PERSONA_PRESETS = [
  'Skeptical CFO',
  'Busy owner',
  'Budget-conscious buyer',
  'Enthusiastic early adopter',
  'Procurement lead',
];
export const MAX_PERSONA = 200;
export const MAX_SCENARIO = 2000;
export const MAX_TURN = 4000;

export type CoachSessionStatus = 'active' | 'scoring' | 'ended';
export type CoachMessageStatus = 'ready' | 'generating' | 'failed';

export interface CoachMessage {
  id: string;
  role: 'user' | 'assistant';
  status: CoachMessageStatus;
  /** Empty while `generating` and on a `failed` buyer turn. */
  content: string;
  created_at: string;
}

export interface Scorecard {
  /** Whole numbers 0 to 10. */
  scores: { discovery: number; objection_handling: number; next_step_close: number };
  /** Mean of the three, one decimal. */
  overall: number;
  feedback: string[];
}

export interface CoachSession {
  id: string;
  mode: 'roleplay';
  deal_id: string | null;
  /** The deal's name when the session started; null for a scenario session. */
  deal_name: string | null;
  scenario: string | null;
  persona: string;
  difficulty: CoachDifficulty;
  status: CoachSessionStatus;
  scorecard: Scorecard | null;
  /** `over_budget` | `generation_failed` | `bad_output` when scoring failed, else null. */
  scorecard_error: string | null;
  created_at: string;
  ended_at: string | null;
  /** Present on create / get / end; absent on the list endpoint. */
  messages?: CoachMessage[];
}

export interface CoachSetup {
  deal_id?: string | null;
  scenario?: string | null;
  persona: string;
  difficulty: CoachDifficulty;
  /** Optional opening line from the seller; queues the buyer's reply at once. */
  message?: string;
}

export const createCoachSession = (setup: CoachSetup) =>
  call<CoachSession>('/coach/sessions', json('POST', setup));
export const getCoachSession = (sessionId: string) => call<CoachSession>(`/coach/sessions/${id(sessionId)}`);
export const listCoachSessions = (query: { limit?: number; offset?: number } = {}) =>
  call<CoachSession[]>(`/coach/sessions${qs({ ...query })}`);
/** 202: returns the buyer's pending (`generating`) turn, not the seller's. */
export const postCoachMessage = (sessionId: string, content: string) =>
  call<CoachMessage>(`/coach/sessions/${id(sessionId)}/messages`, json('POST', { content }));
/** 202: the session goes to `scoring`. Calling it again after a failed scorecard retries. */
export const endCoachSession = (sessionId: string) => call<CoachSession>(`/coach/sessions/${id(sessionId)}/end`, json('POST'));

/** "Practice this again" is a new session with the same setup (no endpoint of its own). */
export function setupOf(s: Pick<CoachSession, 'deal_id' | 'scenario' | 'persona' | 'difficulty'>): CoachSetup {
  return {
    ...(s.deal_id ? { deal_id: s.deal_id } : {}),
    ...(s.scenario ? { scenario: s.scenario } : {}),
    persona: s.persona,
    difficulty: s.difficulty,
  };
}

/** The machine code of an error body (`REPLY_IN_PROGRESS`, `SCORING_IN_PROGRESS`, `SESSION_ENDED`, ...). */
export function errorCodeOf(err: unknown): string | undefined {
  return errorBody(err)?.code;
}

/** 409 while the buyer is still replying (sending or ending would both be refused). */
export const isReplyInProgress = (err: unknown) => err instanceof ApiError && err.status === 409 && errorCodeOf(err) === 'REPLY_IN_PROGRESS';

/** The buyer turn the seller is waiting on, if any. */
export function pendingBuyerTurn(messages: CoachMessage[] | undefined): CoachMessage | null {
  const last = messages?.[messages.length - 1];
  return last && last.role === 'assistant' && last.status === 'generating' ? last : null;
}

/** True once the seller has said something (End session needs at least one seller turn). */
export const sellerHasSpoken = (messages: CoachMessage[] | undefined) => (messages ?? []).some((m) => m.role === 'user');

/** The last buyer turn failed (budget or provider): the seller can simply send again. */
export function buyerTurnFailed(messages: CoachMessage[] | undefined): boolean {
  const last = messages?.[messages.length - 1];
  return !!last && last.role === 'assistant' && last.status === 'failed';
}

/**
 * Honest copy for a failed AI row. `error` is the row's `error` / `scorecard_error`. The reset time is passed
 * in (from GET /ai/status) so the limit message can say when it comes back.
 */
export function aiFailureMessage(error: string | null | undefined, what: 'reply' | 'scorecard' | 'call prep', resetsAt?: string): string {
  if (error === 'over_budget') {
    return `Your workspace has used its daily AI limit, so the ${what} could not be written. It resets at ${resetsAt ?? 'midnight UTC'}.`;
  }
  if (error === 'deal_missing') return 'This deal no longer exists, so a call prep could not be written.';
  if (error === 'bad_output') return `The AI returned a ${what} we could not read. Nothing was lost; try again.`;
  return `The AI could not write the ${what} just now. Nothing was lost; try again.`;
}

// ---- call prep

export interface CallPrepOutput {
  context: string;
  call_goal: string;
  objections: { objection: string; response: string }[];
  discovery_questions: string[];
}

export interface CallPrep {
  id: string;
  deal_id: string;
  status: 'generating' | 'ready' | 'failed';
  output: CallPrepOutput | null;
  /** `over_budget` | `generation_failed` | `deal_missing` when failed. */
  error: string | null;
  created_at: string;
}

/** The latest prep for a deal, or null when it never had one (a normal empty state, not a 404). */
export const getCallPrep = (dealId: string) => call<CallPrep | null>(`/deals/${id(dealId)}/call-prep`);
/** 202. A second request while one is generating is a 409 CALL_PREP_IN_PROGRESS. */
export const requestCallPrep = (dealId: string) => call<CallPrep>(`/deals/${id(dealId)}/call-prep`, json('POST'));
export const isCallPrepInProgress = (err: unknown) => err instanceof ApiError && err.status === 409 && errorCodeOf(err) === 'CALL_PREP_IN_PROGRESS';

// ---- analytics

export interface FunnelStage {
  stage_id: string;
  name: string;
  kind: StageKind;
  /** Cohort deals that reached this stage or any later one. */
  reached: number;
  /** Null for the first row and whenever the previous row is 0. */
  conversion_from_previous_pct: number | null;
}

export interface LossReason {
  reason: ClosedReason;
  count: number;
  value_minor: number;
}

export interface LeaderboardRow {
  user_id: string;
  /** Falls back to the member's email when they have no profile name. */
  name: string;
  total: number;
  calls: number;
  emails: number;
  meetings: number;
  notes: number;
}

export interface MonthlyRevenue {
  /** YYYY-MM (UTC). */
  month: string;
  value_minor: number;
  deal_count: number;
}

export interface SalesAnalytics {
  from: string;
  to: string;
  currency: string;
  funnel: { deals_created: number; stages: FunnelStage[] };
  /** Null when nothing was won in range. */
  avg_cycle_days: number | null;
  won: { count: number; value_minor: number };
  win_loss: { won: number; lost: number; win_rate_pct: number | null; loss_reasons: LossReason[] };
  leaderboard: LeaderboardRow[];
  /** Exactly 12 rows, oldest first. Ignores from / to. */
  monthly_revenue: MonthlyRevenue[];
}

export const MAX_RANGE_DAYS = 366;

export const getAnalytics = (range: { from?: string; to?: string } = {}) =>
  call<SalesAnalytics>(`/analytics${qs({ ...range })}`);

/** Inclusive UTC calendar-day range ending today, `days` long (7 means today and the 6 days before). */
export function presetRange(days: number, now: Date = new Date()): { from: string; to: string } {
  const to = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const from = new Date(to.getTime() - (days - 1) * 86_400_000);
  return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) };
}

/** Client-side guard that mirrors the API's two range rules; null when the range is fine. */
export function rangeError(from: string, to: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) return 'Pick a start and an end date.';
  if (from > to) return 'The start date must be on or before the end date.';
  const days = (Date.parse(to) - Date.parse(from)) / 86_400_000 + 1;
  if (days > MAX_RANGE_DAYS) return `Pick a range of at most ${MAX_RANGE_DAYS} days.`;
  return null;
}

export const CLOSED_REASON_LABELS: Record<ClosedReason, string> = Object.fromEntries(
  CLOSED_REASONS.map((r) => [r.value, r.label])
) as Record<ClosedReason, string>;

/** "12 days", "1 day", "18.5 days"; "No won deals yet" when nothing closed in range. */
export function formatCycle(days: number | null): string {
  if (days === null) return 'No won deals yet';
  const n = Number.isInteger(days) ? String(days) : days.toFixed(1);
  return `${n} ${days === 1 ? 'day' : 'days'}`;
}

/** "Oct 2026" from a YYYY-MM month (UTC-safe). */
export function monthLabel(month: string, long = false): string {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1, 1));
  return d.toLocaleDateString('en-GB', { month: 'short', ...(long ? { year: 'numeric' as const } : {}), timeZone: 'UTC' });
}

// ---- sequences + outreach (slice B)
// Shapes copied from cofoundaz-api/docs/fe-integration-guide-sales-sequences.md (live captures).
// Trap: enrollment timestamps end in "Z", sequence and draft timestamps in "+00:00"; both parse with Date.

export const MAX_STEPS = 10;
export const MAX_WAIT_DAYS = 60;
export const MERGE_TAGS = ['first_name', 'last_name', 'company', 'sender_name'] as const;
export type MergeTag = (typeof MERGE_TAGS)[number];

export interface SequenceStep {
  wait_days: number;
  subject: string;
  body: string;
}

export type SequenceStatus = 'active' | 'paused' | 'archived';

export interface Sequence {
  id: string;
  name: string;
  steps: SequenceStep[];
  step_count: number;
  stop_on_stage_change: boolean;
  status: SequenceStatus;
  active_enrollments: number;
  total_enrollments: number;
  /** Replied / total enrollments, 0..1. */
  reply_rate: number;
  created_at: string;
  updated_at: string;
}

export interface SequenceInput {
  name: string;
  steps: SequenceStep[];
  stop_on_stage_change: boolean;
}

export type SequencePatch = Partial<SequenceInput & { status: 'active' | 'paused' }>;

export type EnrollmentStatus = 'active' | 'completed' | 'replied' | 'unsubscribed' | 'bounced' | 'stopped';
export const ENROLLMENT_STATUSES: EnrollmentStatus[] = ['active', 'completed', 'replied', 'unsubscribed', 'bounced', 'stopped'];

export interface Enrollment {
  id: string;
  sequence_id: string;
  lead_id: string | null;
  contact_id: string | null;
  email: string;
  first_name: string;
  last_name: string;
  company: string;
  sender_name: string;
  sender_email: string;
  status: EnrollmentStatus;
  stopped_reason: string | null;
  /** Steps already sent. */
  current_step: number;
  next_send_at: string | null;
  created_at: string;
}

export type EnrollSkipReason = 'no_email' | 'suppressed' | 'already_active' | 'converted' | 'not_found';

export interface EnrollResult {
  enrolled: number;
  enrollments: Enrollment[];
  skipped: { id: string; reason: EnrollSkipReason }[];
}

export interface SendingStatus {
  configured: boolean;
  reason: string | null;
  domain: string | null;
  sent_today: number;
  daily_cap: number;
  hourly_cap: number | null;
  paused: boolean;
  paused_reason: string | null;
  paused_at: string | null;
}

export interface Draft {
  id: string;
  kind: 'sequence_step' | 'follow_up';
  status: 'generating' | 'ready' | 'failed';
  sequence_id: string | null;
  step_index: number | null;
  deal_id: string | null;
  subject: string | null;
  body: string | null;
  error: 'over_budget' | 'generation_failed' | 'bad_output' | 'target_missing' | null;
  sent_at: string | null;
  created_at: string;
}

export interface UnsubscribeStatus {
  email: string;
  sender: string;
  unsubscribed: boolean;
}

export const listSequences = (query: { include_archived?: boolean; limit?: number; offset?: number } = {}) =>
  call<Page<Sequence>>(`/sequences${qs({ ...query })}`);
export const getSequence = (sequenceId: string) => call<Sequence>(`/sequences/${id(sequenceId)}`);
export const createSequence = (input: SequenceInput) => call<Sequence>('/sequences', json('POST', input));
export const updateSequence = (sequenceId: string, patch: SequencePatch) =>
  call<Sequence>(`/sequences/${id(sequenceId)}`, json('PATCH', patch));
/** Archives it and stops its live enrollments. */
export const archiveSequence = (sequenceId: string) => call<Sequence>(`/sequences/${id(sequenceId)}`, json('DELETE'));

export const listEnrollments = (sequenceId: string, query: { status?: EnrollmentStatus; limit?: number; offset?: number } = {}) =>
  call<Page<Enrollment>>(`/sequences/${id(sequenceId)}/enrollments${qs({ ...query })}`);
export const enrollInSequence = (sequenceId: string, who: { lead_ids?: string[]; contact_ids?: string[] }) =>
  call<EnrollResult>(`/sequences/${id(sequenceId)}/enroll`, json('POST', who));
export const markEnrollmentReplied = (enrollmentId: string) => call<Enrollment>(`/enrollments/${id(enrollmentId)}/replied`, json('POST'));
export const stopEnrollment = (enrollmentId: string) => call<Enrollment>(`/enrollments/${id(enrollmentId)}/stop`, json('POST'));

export const getSendingStatus = () => call<SendingStatus>('/sending');
/** Founder only; a team member gets 403. */
export const resumeSending = () => call<SendingStatus>('/sending/resume', json('POST'));

/** 202; poll getDraft until status is ready or failed. Nothing is appended to the step. */
export const requestStepDraft = (sequenceId: string, stepIndex: number, instructions?: string) =>
  call<Draft>(`/sequences/${id(sequenceId)}/steps/${stepIndex}/write`, json('POST', instructions ? { instructions } : {}));
export const getDraft = (draftId: string) => call<Draft>(`/drafts/${id(draftId)}`);

/** 202; a second call while one is generating is a 409 DRAFT_IN_PROGRESS. */
export const requestFollowUp = (dealId: string) => call<Draft>(`/deals/${id(dealId)}/follow-up`, json('POST'));
/** The latest follow-up draft, or null when none was ever written. */
export const getFollowUp = (dealId: string) => call<Draft | null>(`/deals/${id(dealId)}/follow-up`);
export const sendFollowUp = (dealId: string, input: { draft_id: string; subject: string; body: string }) =>
  call<{ sent: boolean; send_id: string; to: string; draft_id: string }>(`/deals/${id(dealId)}/follow-up/send`, json('POST', input));

export const isDraftInProgress = (err: unknown) => err instanceof ApiError && err.status === 409 && errorCodeOf(err) === 'DRAFT_IN_PROGRESS';

// ---- public unsubscribe (no auth; deliberately not apiClient, which would attach a token and bounce on 401)

async function publicUnsubscribe(token: string, method: 'GET' | 'POST'): Promise<UnsubscribeStatus> {
  const res = await fetch(`${API_BASE}/public/sales/unsubscribe/${encodeURIComponent(token)}`, {
    method,
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) throw new PublicUnsubscribeError(res.status);
  return ((await res.json()) as Envelope<UnsubscribeStatus>).data;
}
export class PublicUnsubscribeError extends Error {
  constructor(public status: number) {
    super(`Unsubscribe request failed (${status})`);
  }
}
export const getUnsubscribeStatus = (token: string) => publicUnsubscribe(token, 'GET');
export const confirmUnsubscribe = (token: string) => publicUnsubscribe(token, 'POST');

// ---- sequence helpers

export const STEP_LIMIT_MESSAGE = `A sequence has 1 to ${MAX_STEPS} steps.`;

/** Wait before a step: 0 reads "Send straight away" on step 1 and "Same day" later. */
export function waitLabel(days: number, first: boolean): string {
  if (days === 0) return first ? 'Sends as soon as they are enrolled' : 'Sends the same day as the step before';
  return `Sends ${days} ${days === 1 ? 'day' : 'days'} after the step before`;
}

export function replyRateLabel(rate: number): string {
  return `${Math.round(rate * 1000) / 10}% reply rate`;
}

/** Merge tags a template uses that have no value for this contact are sent as empty text. */
export function previewTemplate(text: string, sample: Record<MergeTag, string>): string {
  return text.replace(/\{\{\s*(\w+)\s*\}\}/g, (m, tag: string) => (tag in sample ? sample[tag as MergeTag] : m));
}

/** Tags in `text` that are not one of the four supported ones. */
export function unknownTags(text: string): string[] {
  const out: string[] = [];
  for (const m of text.matchAll(/\{\{\s*(\w+)\s*\}\}/g)) if (!(MERGE_TAGS as readonly string[]).includes(m[1])) out.push(m[1]);
  return out;
}

export const SKIP_REASON_LABELS: Record<EnrollSkipReason, string> = {
  no_email: 'has no email address',
  suppressed: 'unsubscribed or bounced earlier',
  already_active: 'is already in this sequence',
  converted: 'became a contact, enrol the contact instead',
  not_found: 'could not be found',
};

export const ENROLLMENT_STATUS_LABELS: Record<EnrollmentStatus, string> = {
  active: 'Active',
  completed: 'Finished',
  replied: 'Replied',
  unsubscribed: 'Unsubscribed',
  bounced: 'Bounced',
  stopped: 'Stopped',
};

export const STOPPED_REASON_LABELS: Record<string, string> = {
  marked_replied: 'Marked as replied',
  stopped_by_member: 'Stopped by a member',
  sequence_archived: 'Sequence archived',
  deal_stage_changed: 'Deal changed stage',
  send_failed: 'Send failed',
  no_sender: 'The sender is no longer in the workspace',
  finished: 'All steps sent',
  unsubscribed: 'Unsubscribed',
  bounced: 'Address bounced',
};

export function enrollSummary(r: EnrollResult): string {
  const parts = [r.enrolled === 1 ? '1 person enrolled' : `${r.enrolled} people enrolled`];
  if (r.skipped.length) parts.push(`${r.skipped.length} skipped`);
  return parts.join(', ');
}

/** Map a follow-up send failure code to what the member should do next. */
export function followUpSendMessage(err: unknown): string {
  const code = errorCodeOf(err);
  switch (code) {
    case 'SEND_UNCERTAIN':
      return 'This email may have been delivered. Check your mailbox or ask the contact before trying again.';
    case 'SEND_LIMIT_REACHED':
      return salesErrorMessage(err, 'The sending limit is reached. Try again later.');
    default:
      return salesErrorMessage(err, 'Could not send this email.');
  }
}
