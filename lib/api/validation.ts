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
