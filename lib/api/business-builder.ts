type ApiResponse<T = unknown> = { data?: T } & Record<string, unknown>;
import { apiClient, ApiError } from './client';

/** A business-plan generation run (`GET /business-builder/plan`). */
export interface BusinessPlanRun {
  id: string;
  status: 'generating' | 'complete' | 'failed';
  document_id: string | null;
  created_at?: string;
}

export interface PlanSection {
  id: string;
  heading: string;
  body: string;
}

/** The generated plan Document (`GET /documents/{id}`), kind `business_plan`. */
export interface PlanDocument {
  id: string;
  kind: string;
  title: string;
  status?: string;
  ai_generated?: boolean;
  version?: number;
  sections: PlanSection[];
}

export type CanvasType = 'business_model' | 'lean' | 'value_prop' | 'mission_vision' | 'swot';

/** `{id, name}` for who last edited something. `name` already falls back to the email server-side. */
export interface EditorRef {
  id: string;
  name: string | null;
}

export interface BlockDef {
  key: string;
  label: string;
  kind: 'list' | 'text';
}

export type CanvasBlocks = Record<string, string[] | string>;

export interface CanvasCompletion {
  filled_blocks: number;
  total_blocks: number;
  completion_pct: number;
  status: 'start' | 'continue' | 'complete';
}

/** `GET/PUT /canvases/{type}`. `updated_by` is null for a fresh canvas and after an AI fill. */
export interface Canvas {
  id?: string;
  type: string;
  version: number;
  blocks: CanvasBlocks;
  block_defs: BlockDef[];
  completion?: CanvasCompletion;
  updated_at: string | null;
  updated_by: EditorRef | null;
}

export type VersionSource = 'manual' | 'ai' | 'suggestion' | 'restore';

export interface CanvasVersionRow {
  version: number;
  source: VersionSource;
  edited_by: EditorRef | null;
  created_at: string;
}

export interface CanvasVersionDetail extends CanvasVersionRow {
  blocks: CanvasBlocks;
}

/** One row of `GET /overview` (a BARE array in `data`). Join by `type`, never by index. */
export interface OverviewRow {
  type: string;
  label: string;
  status: 'start' | 'continue' | 'complete' | 'none' | 'generating' | 'failed';
  completion_pct?: number;
  filled_blocks?: number;
  total_blocks?: number;
  count?: number;
  document_id?: string | null;
  updated_at: string | null;
}

// A stored Business Builder record (persona / competitor / pricing / revenue
// stream). `data` is the kind-specific validated payload; `kind` is the API's
// snake_case value (e.g. `revenue_stream`), NOT the plural URL segment.
export interface BusinessRecord {
  id: string;
  kind: string;
  data: Record<string, unknown>;
  position: number;
  updated_at?: string | null;
  updated_by?: EditorRef | null;
}

// FE field descriptor served alongside the list. `choices` is non-null only for
// enum fields (its members' values).
export interface RecordField {
  key: string;
  required: boolean;
  type: string;
  choices: string[] | null;
}

export interface RecordListResponse {
  records: BusinessRecord[];
  fields: RecordField[];
}

export interface ExportedDocument {
  document_id: string;
  title: string;
}

export type SuggestOp = 'canvas_update' | 'record_create' | 'record_update' | 'record_delete';

export interface SuggestionInput {
  op: SuggestOp;
  target: { canvas_type?: string; kind?: string; record_id?: string };
  payload?: { blocks?: CanvasBlocks; data?: Record<string, unknown> } | null;
  note?: string;
}

export interface AdvisorInput {
  competitor_prices: Array<{ name: string; price: string }>;
  willingness_to_pay: string;
}

export interface PricingTier {
  name: string;
  price: string;
  features: string[];
}

export interface PricingAdvice {
  tiers: PricingTier[];
  rationale: string;
  wtp_questions: string[];
  recommended_model: string;
}

export interface EnqueuedJob {
  job_id: string;
  status: string;
}

function getWorkspaceHeaders(workspaceId?: string): HeadersInit {
  const wsId =
    workspaceId ||
    (typeof window !== 'undefined' ? localStorage.getItem('cf_workspace_id') : null) ||
    '';

  return wsId ? { 'X-Workspace-Id': wsId } : {};
}

export const businessBuilderApi = {
  // 1. Overview: a bare array in `data` (one row per canvas, record kind, then the plan).
  async getOverview(workspaceId?: string): Promise<OverviewRow[]> {
    const res = await apiClient<ApiResponse<OverviewRow[]>>('/business-builder/overview', {
      headers: getWorkspaceHeaders(workspaceId),
    });
    const data = (res as ApiResponse)?.data ?? res;
    return Array.isArray(data) ? (data as OverviewRow[]) : [];
  },

  // 2. Canvases
  async getCanvas(type: CanvasType | string, workspaceId?: string): Promise<Canvas> {
    const res = await apiClient<ApiResponse>(`/business-builder/canvases/${type}`, {
      headers: getWorkspaceHeaders(workspaceId),
    });
    return ((res as ApiResponse)?.data ?? res) as Canvas;
  },

  async saveCanvas(
    type: CanvasType | string,
    payload: { version: number; blocks: CanvasBlocks },
    workspaceId?: string
  ): Promise<Canvas> {
    const res = await apiClient<ApiResponse>(`/business-builder/canvases/${type}`, {
      method: 'PUT',
      headers: getWorkspaceHeaders(workspaceId),
      body: JSON.stringify(payload),
    });
    return ((res as ApiResponse)?.data ?? res) as Canvas;
  },

  /** Whole-canvas AI fill (empty blocks only), or a single `block` (append-only). */
  async aiFillCanvas(
    type: CanvasType | string,
    body?: { block?: string },
    workspaceId?: string
  ): Promise<EnqueuedJob> {
    const res = await apiClient<ApiResponse>(`/business-builder/canvases/${type}/ai-fill`, {
      method: 'POST',
      headers: getWorkspaceHeaders(workspaceId),
      body: JSON.stringify(body ?? {}),
    });
    return ((res as ApiResponse)?.data ?? res) as EnqueuedJob;
  },

  /** Mission & Vision "Give me 3 options". Nothing is written; the job result carries the options. */
  async missionVisionOptions(field: 'mission' | 'vision'): Promise<EnqueuedJob> {
    const res = await apiClient<ApiResponse>('/business-builder/canvases/mission_vision/options', {
      method: 'POST',
      body: JSON.stringify({ field }),
    });
    return ((res as ApiResponse)?.data ?? res) as EnqueuedJob;
  },

  async listVersions(type: string): Promise<CanvasVersionRow[]> {
    const res = await apiClient<ApiResponse<{ versions?: CanvasVersionRow[] }>>(
      `/business-builder/canvases/${type}/versions`
    );
    const data = ((res as ApiResponse)?.data ?? res) as { versions?: CanvasVersionRow[] };
    return Array.isArray(data?.versions) ? data.versions : [];
  },

  async getVersion(type: string, version: number): Promise<CanvasVersionDetail> {
    const res = await apiClient<ApiResponse>(`/business-builder/canvases/${type}/versions/${version}`);
    return ((res as ApiResponse)?.data ?? res) as CanvasVersionDetail;
  },

  /** `currentVersion` is the canvas's CURRENT version (not the one being restored). */
  async restoreVersion(type: string, version: number, currentVersion: number): Promise<Canvas> {
    const res = await apiClient<ApiResponse>(
      `/business-builder/canvases/${type}/versions/${version}/restore`,
      { method: 'POST', body: JSON.stringify({ version: currentVersion }) }
    );
    return ((res as ApiResponse)?.data ?? res) as Canvas;
  },

  /** Export a canvas (`business_model | lean | ...`) or a record list (`personas | pricing | ...`) to a new Document. */
  async exportToDocument(target: { canvas: string } | { kind: string }): Promise<ExportedDocument> {
    const path = 'canvas' in target ? `canvases/${target.canvas}` : target.kind;
    const res = await apiClient<ApiResponse>(`/business-builder/${path}/export`, { method: 'POST' });
    return ((res as ApiResponse)?.data ?? res) as ExportedDocument;
  },

  // Consultant suggest mode: every edit becomes a pending suggestion for the founder.
  async createSuggestion(input: SuggestionInput): Promise<unknown> {
    const res = await apiClient<ApiResponse>('/business-builder/suggestions', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    return (res as ApiResponse)?.data ?? res;
  },

  async personasFromValidation(): Promise<EnqueuedJob> {
    const res = await apiClient<ApiResponse>('/business-builder/personas/from-validation', { method: 'POST' });
    return ((res as ApiResponse)?.data ?? res) as EnqueuedJob;
  },

  async pricingAdvisor(input: AdvisorInput): Promise<EnqueuedJob> {
    const res = await apiClient<ApiResponse>('/business-builder/pricing/advisor', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    return ((res as ApiResponse)?.data ?? res) as EnqueuedJob;
  },

  // 3. Records (personas / competitors / pricing / revenue-streams).
  // NOTE: `kind` here is the PLURAL, hyphenated URL segment the API routes on
  // (`personas`, `competitors`, `pricing`, `revenue-streams`) — not the enum
  // value. The list endpoint returns both the records and their field schema;
  // create/update wrap the payload in `{ data }`.
  async listRecords(kind: string, workspaceId?: string): Promise<RecordListResponse> {
    const res = await apiClient<ApiResponse>(`/business-builder/${kind}`, {
      headers: getWorkspaceHeaders(workspaceId),
    });
    const data = ((res as ApiResponse)?.data ?? res) as Partial<RecordListResponse>;
    return {
      records: Array.isArray(data?.records) ? data.records : [],
      fields: Array.isArray(data?.fields) ? data.fields : [],
    };
  },

  async createRecord(
    kind: string,
    data: Record<string, unknown>,
    workspaceId?: string
  ): Promise<BusinessRecord> {
    const res = await apiClient<ApiResponse>(`/business-builder/${kind}`, {
      method: 'POST',
      headers: getWorkspaceHeaders(workspaceId),
      body: JSON.stringify({ data }),
    });
    return ((res as ApiResponse)?.data ?? res) as BusinessRecord;
  },

  async updateRecord(
    kind: string,
    recordId: string,
    data: Record<string, unknown>,
    workspaceId?: string
  ): Promise<BusinessRecord> {
    const res = await apiClient<ApiResponse>(`/business-builder/${kind}/${recordId}`, {
      method: 'PUT',
      headers: getWorkspaceHeaders(workspaceId),
      body: JSON.stringify({ data }),
    });
    return ((res as ApiResponse)?.data ?? res) as BusinessRecord;
  },

  async deleteRecord(kind: string, recordId: string, workspaceId?: string): Promise<void> {
    await apiClient<ApiResponse>(`/business-builder/${kind}/${recordId}`, {
      method: 'DELETE',
      headers: getWorkspaceHeaders(workspaceId),
    });
  },

  // 5. Positioning Map
  async getPositioningMap(workspaceId?: string): Promise<unknown> {
    const res = await apiClient<ApiResponse>('/business-builder/positioning-map', {
      headers: getWorkspaceHeaders(workspaceId),
    });
    return (res as ApiResponse)?.data ?? res;
  },

  async savePositioningMap(payload: unknown, workspaceId?: string): Promise<unknown> {
    const res = await apiClient<ApiResponse>('/business-builder/positioning-map', {
      method: 'PUT',
      headers: getWorkspaceHeaders(workspaceId),
      body: JSON.stringify(payload),
    });
    return (res as ApiResponse)?.data ?? res;
  },

  // 4. AI business-plan generator (async: POST starts, GET polls, document holds content).
  // `POST /plan/generate` → 202 { plan_id, status }. Founder/editor only (403 otherwise).
  async generatePlan(workspaceId?: string): Promise<{ plan_id: string; status: string }> {
    const res = await apiClient<ApiResponse>('/business-builder/plan/generate', {
      method: 'POST',
      headers: getWorkspaceHeaders(workspaceId),
    });
    return ((res as ApiResponse)?.data ?? res) as { plan_id: string; status: string };
  },

  // `GET /plan` → the LATEST run (not a list). 404 when none has ever been generated → null.
  async getPlan(workspaceId?: string): Promise<BusinessPlanRun | null> {
    try {
      const res = await apiClient<ApiResponse>('/business-builder/plan', {
        headers: getWorkspaceHeaders(workspaceId),
      });
      return ((res as ApiResponse)?.data ?? res) as BusinessPlanRun;
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) return null;
      throw err;
    }
  },

  // The plan's content lives in a normal Document (`GET /documents/{id}`); only fetch
  // once `GET /plan` reports `complete` and `document_id` is set.
  async getPlanDocument(documentId: string, workspaceId?: string): Promise<PlanDocument> {
    const res = await apiClient<ApiResponse>(`/documents/${documentId}`, {
      headers: getWorkspaceHeaders(workspaceId),
    });
    return ((res as ApiResponse)?.data ?? res) as PlanDocument;
  },
};
