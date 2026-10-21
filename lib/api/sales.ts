import { ApiError, apiClient } from './client';
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
