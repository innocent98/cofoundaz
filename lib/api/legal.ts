import { accessTokenForRequest } from '@/lib/auth/session';
import { API_BASE, apiClient, ApiError } from './client';

// Legal & Compliance (BE module 13, slice 1). Shapes are copied from the live-captured
// guide cofoundaz-api/docs/fe-integration-guide-legal.md. Reads are open to founder,
// team_member and legal_advisor; writes to founder and team_member only. Money is integer
// minor units plus a currency code. Dates are ISO strings.

interface Envelope<T> {
  data: T;
  meta?: unknown;
}

const unwrap = <T>(res: Envelope<T>): T => res.data;
const json = (body: unknown): RequestInit['body'] => JSON.stringify(body);

// ---------------------------------------------------------------- errors

export interface LegalError {
  status: number;
  code: string | null;
  /** Message to show the user: the API's own text, falling back to `fallback`. */
  message: string;
  fieldErrors: Record<string, string>;
  forbidden: boolean;
  notFound: boolean;
}

export function toLegalError(err: unknown, fallback = 'Something went wrong. Try again.'): LegalError {
  if (err instanceof ApiError) {
    const body = (err.data ?? null) as {
      error?: { code?: string; message?: string; field_errors?: { field?: string; message?: string }[] };
    } | null;
    const apiErr = body && typeof body === 'object' ? body.error : undefined;
    const fieldErrors: Record<string, string> = {};
    for (const fe of apiErr?.field_errors ?? []) {
      if (fe?.message) fieldErrors[fe.field ?? ''] = fe.message;
    }
    let message = apiErr?.message || fallback;
    const emailUnverified = apiErr?.code === 'EMAIL_NOT_VERIFIED';
    if (err.status === 403 && !emailUnverified) message = "Your role can't do that in Legal.";
    if (err.status === 422 && !apiErr?.message) message = Object.values(fieldErrors)[0] ?? fallback;
    return {
      status: err.status,
      code: apiErr?.code ?? null,
      message,
      fieldErrors,
      forbidden: err.status === 403 && !emailUnverified,
      notFound: err.status === 404,
    };
  }
  return { status: 0, code: null, message: fallback, fieldErrors: {}, forbidden: false, notFound: false };
}

// ---------------------------------------------------------------- formation

export interface Jurisdiction {
  code: string;
  name: string;
}

export interface FormationStep {
  key: string;
  title: string;
  authority: string | null;
  est_days: number | null;
  est_cost_minor: number | null;
  est_cost_currency: string | null;
  completed: boolean;
  completed_at: string | null;
}

export interface FormationChecklist {
  jurisdiction: Jurisdiction;
  estimates: boolean;
  disclaimer: string;
  steps: FormationStep[];
}

export async function listJurisdictions(): Promise<Jurisdiction[]> {
  return unwrap(await apiClient<Envelope<{ jurisdictions: Jurisdiction[] }>>('/legal/formation/jurisdictions')).jurisdictions;
}

export async function getFormationChecklist(jurisdiction: string): Promise<FormationChecklist> {
  return unwrap(
    await apiClient<Envelope<FormationChecklist>>(`/legal/formation/checklist?jurisdiction=${encodeURIComponent(jurisdiction)}`),
  );
}

/** Desired state, not a delta: repeating a call is a no-op. Returns the whole checklist. */
export async function setFormationStep(stepKey: string, jurisdiction: string, completed: boolean): Promise<FormationChecklist> {
  return unwrap(
    await apiClient<Envelope<FormationChecklist>>(`/legal/formation/steps/${encodeURIComponent(stepKey)}`, {
      method: 'PATCH',
      body: json({ jurisdiction, completed }),
    }),
  );
}

// ---------------------------------------------------------------- IP assets

export type IpType = 'trademark' | 'patent' | 'copyright' | 'domain';
export type IpStoredStatus = 'drafting' | 'filed' | 'registered';
export type IpDerivedStatus = IpStoredStatus | 'expired';

export interface IpAsset {
  id: string;
  type: IpType;
  name: string;
  jurisdiction: string;
  status: IpStoredStatus;
  derived_status: IpDerivedStatus;
  renewal_on: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface IpAssetInput {
  type: IpType;
  name: string;
  jurisdiction: string;
  status: IpStoredStatus;
  renewal_on: string | null;
}

export async function listIpAssets(filters: { type?: IpType | ''; status?: IpStoredStatus | '' } = {}): Promise<IpAsset[]> {
  const q = new URLSearchParams();
  if (filters.type) q.set('type', filters.type);
  if (filters.status) q.set('status', filters.status);
  const qs = q.toString();
  return unwrap(await apiClient<Envelope<{ ip_assets: IpAsset[] }>>(`/legal/ip-assets${qs ? `?${qs}` : ''}`)).ip_assets;
}

export async function createIpAsset(input: IpAssetInput): Promise<IpAsset> {
  return unwrap(await apiClient<Envelope<IpAsset>>('/legal/ip-assets', { method: 'POST', body: json(input) }));
}

export async function updateIpAsset(id: string, patch: Partial<IpAssetInput>): Promise<IpAsset> {
  return unwrap(await apiClient<Envelope<IpAsset>>(`/legal/ip-assets/${id}`, { method: 'PATCH', body: json(patch) }));
}

export async function deleteIpAsset(id: string): Promise<void> {
  await apiClient<Envelope<{ deleted: boolean }>>(`/legal/ip-assets/${id}`, { method: 'DELETE' });
}

// ---------------------------------------------------------------- compliance

export type Recurrence = 'none' | 'monthly' | 'quarterly' | 'annually';
export type ComplianceStoredStatus = 'open' | 'done';
export type ComplianceDerivedStatus = 'upcoming' | 'due_soon' | 'overdue' | 'done';

export interface ComplianceItem {
  id: string;
  title: string;
  authority: string | null;
  due_on: string;
  status: ComplianceStoredStatus;
  derived_status: ComplianceDerivedStatus;
  done_at: string | null;
  proof_url: string | null;
  recurrence: Recurrence;
  previous_item_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ComplianceInput {
  title: string;
  authority: string | null;
  due_on: string;
  recurrence: Recurrence;
}

export interface ComplianceFilters {
  status?: ComplianceStoredStatus | '';
  date_from?: string;
  date_to?: string;
}

export async function listComplianceItems(filters: ComplianceFilters = {}): Promise<ComplianceItem[]> {
  const q = new URLSearchParams();
  if (filters.status) q.set('status', filters.status);
  if (filters.date_from) q.set('date_from', filters.date_from);
  if (filters.date_to) q.set('date_to', filters.date_to);
  const qs = q.toString();
  return unwrap(await apiClient<Envelope<{ compliance_items: ComplianceItem[] }>>(`/legal/compliance-items${qs ? `?${qs}` : ''}`))
    .compliance_items;
}

export async function createComplianceItem(input: ComplianceInput): Promise<ComplianceItem> {
  return unwrap(await apiClient<Envelope<ComplianceItem>>('/legal/compliance-items', { method: 'POST', body: json(input) }));
}

export async function updateComplianceItem(
  id: string,
  patch: Partial<ComplianceInput> & { status?: ComplianceStoredStatus },
): Promise<ComplianceItem> {
  return unwrap(await apiClient<Envelope<ComplianceItem>>(`/legal/compliance-items/${id}`, { method: 'PATCH', body: json(patch) }));
}

export async function deleteComplianceItem(id: string): Promise<void> {
  await apiClient<Envelope<{ deleted: boolean }>>(`/legal/compliance-items/${id}`, { method: 'DELETE' });
}

export const PROOF_MAX_BYTES = 10 * 1024 * 1024;
export const PROOF_TYPES = ['image/png', 'image/jpeg', 'application/pdf'];

/** PNG, JPEG or PDF up to 10 MB. The server decides by the file's own bytes; this only saves a round trip. */
export function proofFileProblem(file: File): string | null {
  if (file.size > PROOF_MAX_BYTES) return 'Proof exceeds the 10 MB limit.';
  if (file.type && !PROOF_TYPES.includes(file.type)) return 'Proof must be a PNG, JPEG, or PDF.';
  return null;
}

export async function uploadComplianceProof(id: string, file: File): Promise<ComplianceItem> {
  const form = new FormData();
  form.append('file', file);
  return unwrap(await apiClient<Envelope<ComplianceItem>>(`/legal/compliance-items/${id}/proof`, { method: 'POST', body: form }));
}

/**
 * Downloads the proof with the bearer token (a plain link cannot send it) and hands the
 * browser a blob download named by Content-Disposition. Throws ApiError on a non-2xx
 * answer: 404 when there is no proof (or the file is gone). Returns the file name used.
 */
export async function downloadComplianceProof(id: string): Promise<string> {
  const token = await accessTokenForRequest();
  const workspaceId = typeof window !== 'undefined' ? localStorage.getItem('cf_workspace_id') : null;
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (workspaceId) headers['X-Workspace-Id'] = workspaceId;
  const res = await fetch(`${API_BASE}/legal/compliance-items/${id}/proof`, { headers });
  if (!res.ok) {
    let data: unknown = null;
    try {
      data = await res.json();
    } catch {
      /* not JSON */
    }
    throw new ApiError(res.status, res.statusText, data);
  }
  const cd = res.headers.get('Content-Disposition') ?? '';
  const name = /filename="?([^";]+)"?/i.exec(cd)?.[1] ?? 'proof-of-filing';
  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = objectUrl;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 10_000);
  return name;
}
