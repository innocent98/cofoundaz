import { accessTokenForRequest } from '@/lib/auth/session';
import { API_BASE, apiClient, ApiError } from './client';

// Analytics & Reports (BE module 22, wave 1 = slices A, B, C). Every shape below is copied from the
// live-captured guides in cofoundaz-api/docs/: fe-integration-guide-analytics.md (catalog, Overview,
// By hub, custom metrics), -analytics-reports.md (reports, frozen runs, shares) and
// -analytics-exports.md (exports, data tables, download). Money in JSON is integer minor units (kobo);
// money inside downloaded files is major units. Authorisation is per metric (D-ANA-4): a metric the
// viewer's role cannot open comes back as a bare lock with no number.

interface Envelope<T> {
  data: T;
  meta?: unknown;
}

const unwrap = <T>(res: Envelope<T>): T => res.data;
const json = (body: unknown): RequestInit['body'] => JSON.stringify(body);
const B = '/analytics';

// ---------------------------------------------------------------- errors

export interface AnalyticsError {
  status: number;
  code: string | null;
  /** The API's own message, or `fallback`. */
  message: string;
  fieldErrors: Record<string, string>;
  forbidden: boolean;
  notFound: boolean;
  conflict: boolean;
}

export function toAnalyticsError(err: unknown, fallback = 'Something went wrong. Try again.'): AnalyticsError {
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
    // "Please check the highlighted fields." is generic; the field's own message says what is wrong.
    if (err.status === 422 && (!apiErr?.message || apiErr.message.startsWith('Please check'))) {
      message = Object.values(fieldErrors)[0] ?? message;
    }
    return {
      status: err.status,
      code: apiErr?.code ?? null,
      message,
      fieldErrors,
      forbidden: err.status === 403,
      notFound: err.status === 404,
      conflict: err.status === 409,
    };
  }
  return { status: 0, code: null, message: fallback, fieldErrors: {}, forbidden: false, notFound: false, conflict: false };
}

// ---------------------------------------------------------------- periods

export type RangeKey = '7d' | '30d' | '90d' | '12m' | 'this_month' | 'last_month' | 'custom';
export type CompareKey = 'none' | 'previous' | 'year';

export interface RangeSpec {
  range: RangeKey;
  from: string | null;
  to: string | null;
  compare: CompareKey;
}

export interface Period {
  from: string;
  to: string;
}

function rangeQuery(r: RangeSpec): string {
  const p = new URLSearchParams({ range: r.range, compare: r.compare });
  if (r.range === 'custom') {
    if (r.from) p.set('from', r.from);
    if (r.to) p.set('to', r.to);
  }
  return p.toString();
}

// ---------------------------------------------------------------- metrics

export type MetricUnit = 'money' | 'count' | 'percent' | 'months' | 'days' | 'score';
export type MetricStatus = 'ok' | 'no_data' | 'not_burning' | 'out_of_cash' | 'locked' | 'unknown' | 'error';

export interface SeriesPoint {
  from: string;
  to: string;
  value: number | null;
}

export interface MetricCompare {
  period: Period;
  value: number | null;
  delta: number | null;
  delta_pct: number | null;
}

/** A resolved metric. `locked` and `unknown` objects carry only key/status (+ needs) and never a value. */
export interface MetricResult {
  key: string;
  status: MetricStatus;
  label?: string;
  unit?: MetricUnit;
  hub?: string;
  kind?: 'flow' | 'point';
  good?: 'up' | 'down';
  source_note?: string;
  definition?: string;
  currency?: string | null;
  value?: number | null;
  period?: Period;
  as_of?: string;
  hub_path?: string;
  compare?: MetricCompare | null;
  series?: SeriesPoint[];
  needs?: string;
  needs_label?: string;
  message?: string;
}

export interface Insight {
  kind: 'working' | 'watch';
  text: string;
  source: string;
  hub_path: string;
}

export interface HubRef {
  hub: string;
  label: string;
  path: string;
}

export interface Overview {
  period: Period;
  compare_period: Period | null;
  currency: string;
  cards: MetricResult[];
  chart: { series: MetricResult[] } | null;
  insights: Insight[];
  hubs: HubRef[];
}

export interface ByHub {
  period: Period;
  compare_period: Period | null;
  hubs: (HubRef & { tiles: MetricResult[] })[];
}

export interface CatalogMetric {
  key: string;
  label: string;
  unit: MetricUnit;
  hub: string;
  kind: 'flow' | 'point';
  definition: string;
  source_note: string;
  good: 'up' | 'down';
  group_by: string[];
  entered_by_you: boolean;
}

export interface CatalogHub {
  hub: string;
  label: string;
  locked: boolean;
  metrics: CatalogMetric[];
}

export interface Catalog {
  currency: string;
  hubs: CatalogHub[];
}

export async function getCatalog(): Promise<Catalog> {
  return unwrap(await apiClient<Envelope<Catalog>>(`${B}/metrics-catalog`));
}

export async function getOverview(r: RangeSpec): Promise<Overview> {
  return unwrap(await apiClient<Envelope<Overview>>(`${B}/overview?${rangeQuery(r)}`));
}

export async function getByHub(r: RangeSpec, hub?: string): Promise<ByHub> {
  const q = rangeQuery(r) + (hub ? `&hub=${encodeURIComponent(hub)}` : '');
  return unwrap(await apiClient<Envelope<ByHub>>(`${B}/by-hub?${q}`));
}

// ---------------------------------------------------------------- custom metrics

export interface CustomMetric {
  id: string;
  key: string;
  label: string;
  unit: 'count' | 'money' | 'percent';
  currency: string | null;
  points: { period: string; value: number }[];
}

export async function listCustomMetrics(): Promise<CustomMetric[]> {
  return unwrap(await apiClient<Envelope<{ metrics: CustomMetric[] }>>(`${B}/custom-metrics`)).metrics;
}

export async function createCustomMetric(label: string, unit: CustomMetric['unit']): Promise<CustomMetric> {
  return unwrap(await apiClient<Envelope<CustomMetric>>(`${B}/custom-metrics`, { method: 'POST', body: json({ label, unit }) }));
}

/** Upsert monthly points (`period` = "YYYY-MM"); returns the metric with all its points. */
export async function putCustomMetricPoints(id: string, points: { period: string; value: number }[]): Promise<CustomMetric> {
  return unwrap(
    await apiClient<Envelope<CustomMetric>>(`${B}/custom-metrics/${id}/points`, { method: 'PUT', body: json({ points }) }),
  );
}

export async function deleteCustomMetric(id: string): Promise<void> {
  await apiClient(`${B}/custom-metrics/${id}`, { method: 'DELETE' });
}

// ---------------------------------------------------------------- reports

export type Viz = 'number' | 'line' | 'bar';

export interface MetricBlock {
  id: string;
  type: 'metric';
  metric: string;
  hub?: string;
  viz: Viz;
  title: string | null;
  range: { range: RangeKey; from: string | null; to: string | null } | null;
  compare: CompareKey | null;
  locked?: undefined;
}

export interface TextBlock {
  id: string;
  type: 'text';
  title: string | null;
  text: string;
  locked?: undefined;
}

/** What a viewer gets for a block over a hub their role cannot open: no metric, title or numbers. */
export interface LockedBlock {
  id: string;
  type: 'metric';
  locked: true;
  needs: string;
  needs_label: string;
}

export type Block = MetricBlock | TextBlock | LockedBlock;

export interface RunSummary {
  id: string;
  status: 'pending' | 'ready' | 'failed';
  as_of: string | null;
  error: string | null;
  created_at: string;
}

export interface ReportSummary {
  id: string;
  name: string;
  description: string | null;
  owner: { id: string; name: string | null };
  template_key: string | null;
  default_range: RangeSpec;
  block_count: number;
  version: number;
  can_edit: boolean;
  can_share: boolean;
  is_owner: boolean;
  shared_with_me: boolean;
  last_run: RunSummary | null;
  created_at: string;
  updated_at: string;
  share_count?: number;
}

export interface Report extends ReportSummary {
  blocks: Block[];
  dropped_blocks?: number;
}

export interface Template {
  key: string;
  name: string;
  description: string;
  default_range: RangeSpec;
  blocks: { type: 'metric'; metric: string; viz: Viz }[];
  omitted_hubs: string[];
}

export type ReportSort = 'updated' | 'name' | 'created';

export async function listReports(q = '', sort: ReportSort = 'updated'): Promise<{ reports: ReportSummary[]; total: number }> {
  const p = new URLSearchParams({ sort, limit: '100' });
  if (q.trim()) p.set('q', q.trim());
  return unwrap(await apiClient<Envelope<{ reports: ReportSummary[]; total: number }>>(`${B}/reports?${p}`));
}

export async function getReport(id: string): Promise<Report> {
  return unwrap(await apiClient<Envelope<Report>>(`${B}/reports/${id}`));
}

export async function listTemplates(): Promise<Template[]> {
  return unwrap(await apiClient<Envelope<{ templates: Template[] }>>(`${B}/reports/templates`)).templates;
}

/** Blocks as the API takes them: flat `range`/`from`/`to`, no server-added `hub`. */
export function blocksForApi(blocks: Block[]): Record<string, unknown>[] {
  return blocks
    .filter((b): b is MetricBlock | TextBlock => !b.locked)
    .map((b) =>
      b.type === 'text'
        ? { id: b.id, type: 'text', title: b.title || null, text: b.text }
        : {
            id: b.id,
            type: 'metric',
            metric: b.metric,
            viz: b.viz,
            title: b.title || null,
            compare: b.compare,
            ...(b.range ? { range: b.range.range, from: b.range.from, to: b.range.to } : {}),
          },
    );
}

export interface ReportDraft {
  name: string;
  description: string | null;
  blocks: Block[];
  default_range: RangeSpec;
}

export async function createReport(draft: ReportDraft): Promise<Report> {
  return unwrap(
    await apiClient<Envelope<Report>>(`${B}/reports`, {
      method: 'POST',
      body: json({
        name: draft.name,
        description: draft.description,
        blocks: blocksForApi(draft.blocks),
        default_range: draft.default_range,
      }),
    }),
  );
}

/** Optimistic lock: a stale `version` is a 409 VERSION_CONFLICT, never retried silently. */
export async function patchReport(id: string, version: number, draft: ReportDraft): Promise<Report> {
  return unwrap(
    await apiClient<Envelope<Report>>(`${B}/reports/${id}`, {
      method: 'PATCH',
      body: json({
        version,
        name: draft.name,
        description: draft.description,
        blocks: blocksForApi(draft.blocks),
        default_range: draft.default_range,
      }),
    }),
  );
}

export async function deleteReport(id: string): Promise<void> {
  await apiClient(`${B}/reports/${id}`, { method: 'DELETE' });
}

export async function duplicateReport(id: string): Promise<Report> {
  return unwrap(await apiClient<Envelope<Report>>(`${B}/reports/${id}/duplicate`, { method: 'POST' }));
}

export interface PreviewResultMetric {
  block_id: string;
  type: 'metric';
  hub: string;
  viz: Viz;
  title: string | null;
  result: MetricResult;
}
export interface PreviewResultText {
  block_id: string;
  type: 'text';
  title: string | null;
  text: string;
}
/** A locked block inside a run carries `id`, not `block_id`. */
export type RunResult = PreviewResultMetric | PreviewResultText | LockedBlock;

export interface Preview {
  period: Period;
  as_of: string;
  results: RunResult[];
}

export async function previewReport(blocks: Block[], default_range: RangeSpec): Promise<Preview> {
  return unwrap(
    await apiClient<Envelope<Preview>>(`${B}/reports/preview`, {
      method: 'POST',
      body: json({ blocks: blocksForApi(blocks), default_range }),
    }),
  );
}

// ---------------------------------------------------------------- runs

export interface Run {
  id: string;
  report_id: string;
  status: 'pending' | 'ready' | 'failed';
  triggered_by: string;
  period: Period;
  tz: string;
  run_by: { id: string; name: string | null } | null;
  as_of: string | null;
  error: string | null;
  created_at: string;
  snapshot?: {
    report: { name: string; description: string | null; range: RangeSpec; blocks: Block[] };
    results: RunResult[];
  };
}

export async function startRun(reportId: string): Promise<{ run_id: string; job_id: string; status: string }> {
  return unwrap(await apiClient<Envelope<{ run_id: string; job_id: string; status: string }>>(`${B}/reports/${reportId}/run`, { method: 'POST' }));
}

export async function listRuns(reportId: string): Promise<Run[]> {
  return unwrap(await apiClient<Envelope<{ runs: Run[] }>>(`${B}/reports/${reportId}/runs`)).runs;
}

export async function getRun(reportId: string, runId: string): Promise<Run> {
  return unwrap(await apiClient<Envelope<Run>>(`${B}/reports/${reportId}/runs/${runId}`));
}

// ---------------------------------------------------------------- shares

export interface ShareMember {
  user_id: string;
  name: string | null;
  role: string;
  locked_hubs: string[];
}

export interface Shares {
  shares: ShareMember[];
  candidates: ShareMember[];
}

export async function getShares(reportId: string): Promise<Shares> {
  return unwrap(await apiClient<Envelope<Shares>>(`${B}/reports/${reportId}/shares`));
}

export async function putShares(reportId: string, userIds: string[]): Promise<Shares> {
  return unwrap(
    await apiClient<Envelope<Shares>>(`${B}/reports/${reportId}/shares`, { method: 'PUT', body: json({ user_ids: userIds }) }),
  );
}

// ---------------------------------------------------------------- exports

export type ExportStatus = 'pending' | 'ready' | 'failed' | 'expired';
export type ExportFormat = 'pdf' | 'xlsx' | 'csv';

export interface ExportRow {
  id: string;
  name: string;
  artifact_type: 'report' | 'data_tables';
  format: ExportFormat;
  status: ExportStatus;
  report_id: string | null;
  run_id: string | null;
  period: Period | null;
  metrics: string[] | null;
  filename: string | null;
  size_bytes: number | null;
  download_count: number;
  download_path: string | null;
  error: string | null;
  created_by: { id: string; name: string | null } | null;
  created_at: string;
  ready_at: string | null;
  expires_at: string;
}

export interface ExportList {
  exports: ExportRow[];
  total: number;
  limit: number;
  offset: number;
  retention_days: number;
}

export async function listExports(artifactType?: 'report' | 'data_tables'): Promise<ExportList> {
  const p = new URLSearchParams({ limit: '100' });
  if (artifactType) p.set('artifact_type', artifactType);
  return unwrap(await apiClient<Envelope<ExportList>>(`${B}/exports?${p}`));
}

export async function getExport(id: string): Promise<ExportRow> {
  return unwrap(await apiClient<Envelope<ExportRow>>(`${B}/exports/${id}`));
}

/** Without `runId` a new frozen run is made (founder, team member). With it, that finished run is rendered. */
export async function exportReport(reportId: string, format: 'pdf' | 'xlsx', runId?: string): Promise<ExportRow> {
  return unwrap(
    await apiClient<Envelope<ExportRow>>(`${B}/reports/${reportId}/export`, {
      method: 'POST',
      body: json(runId ? { format, run_id: runId } : { format }),
    }),
  );
}

export async function exportDataTables(input: {
  metrics: string[];
  range: RangeSpec;
  format: 'xlsx' | 'csv';
  include_metadata: boolean;
}): Promise<ExportRow> {
  return unwrap(await apiClient<Envelope<ExportRow>>(`${B}/exports/data-tables`, { method: 'POST', body: json(input) }));
}

/** Decode the filename from Content-Disposition, preferring the RFC 5987 `filename*` form. */
export function filenameFrom(contentDisposition: string, fallback: string): string {
  const star = /filename\*=UTF-8''([^;]+)/i.exec(contentDisposition)?.[1];
  if (star) {
    try {
      return decodeURIComponent(star);
    } catch {
      /* fall through */
    }
  }
  return /filename="?([^";]+)"?/i.exec(contentDisposition)?.[1] ?? fallback;
}

/**
 * The download route needs the bearer token, so a plain link cannot work: fetch with auth,
 * save the Blob under the server's filename. Errors (409 not ready, 410 expired, 403 role
 * changed) are thrown as ApiError with the JSON body, like every other call.
 */
export async function downloadExport(row: Pick<ExportRow, 'id' | 'filename'>): Promise<string> {
  const token = await accessTokenForRequest();
  const workspaceId = typeof window !== 'undefined' ? localStorage.getItem('cf_workspace_id') : null;
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (workspaceId) headers['X-Workspace-Id'] = workspaceId;
  const res = await fetch(`${API_BASE}${B}/exports/${row.id}/download`, { headers });
  if (!res.ok) {
    let data: unknown = null;
    try {
      data = await res.json();
    } catch {
      /* not JSON */
    }
    throw new ApiError(res.status, res.statusText, data);
  }
  const name = filenameFrom(res.headers.get('Content-Disposition') ?? '', row.filename ?? 'export');
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
